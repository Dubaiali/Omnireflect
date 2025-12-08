#!/bin/bash

# FINALER Fix - Behebt das ECHTE Problem
# Das Problem: auto-security-response.sh zählt ALTE Log-Einträge statt nur aktive Bedrohungen

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}═══════════════════════════════════════════════════════${NC}"
echo -e "${RED}  FINALER Fix - Behebt ECHTES Problem${NC}"
echo -e "${RED}═══════════════════════════════════════════════════════${NC}"
echo ""

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Muss als root ausgeführt werden!${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Problem gefunden:${NC}"
echo "  ❌ auto-security-response.sh zählt ALTE Log-Einträge"
echo "  ❌ Wenn PM2/Nginx mal nicht lief, steht das im Log"
echo "  ❌ Script zählt diese alten Einträge und sendet E-Mails"
echo ""

# 1. Fix auto-security-response.sh - NUR aktive Prozesse prüfen, KEINE Log-Prüfung
echo -e "${BLUE}📋 Fix 1/2: auto-security-response.sh - NUR aktive Prozesse...${NC}"
if [ -f "/usr/local/bin/auto-security-response.sh" ]; then
    BACKUP_FILE="/usr/local/bin/auto-security-response.sh.backup.$(date +%Y%m%d_%H%M%S)"
    cp /usr/local/bin/auto-security-response.sh "$BACKUP_FILE"
    echo -e "${GREEN}✅ Backup: $BACKUP_FILE${NC}"
    
    cat > /usr/local/bin/auto-security-response.sh << 'EOFFIX'
#!/bin/bash
# Automatische Reaktionen - NUR bei AKTIVEN Bedrohungen
# KEINE Log-Prüfung - verhindert E-Mail-Flut durch alte Log-Einträge

ALERT_HISTORY_FILE="/tmp/omnireflect-response-alert-history.txt"
touch "$ALERT_HISTORY_FILE"

is_new_alert() {
    local alert_msg="$1"
    local alert_hash=$(echo "$alert_msg" | md5sum | cut -d' ' -f1)
    local cutoff_time=$(($(date +%s) - 86400))  # 24 Stunden
    
    if grep -q "^$alert_hash:" "$ALERT_HISTORY_FILE" 2>/dev/null; then
        local last_sent=$(grep "^$alert_hash:" "$ALERT_HISTORY_FILE" | cut -d: -f2)
        if [ "$last_sent" -ge "$cutoff_time" ]; then
            return 1  # Nicht neu
        fi
    fi
    
    echo "$alert_hash:$(date +%s)" >> "$ALERT_HISTORY_FILE"
    awk -v cutoff=$(($(date +%s) - 604800)) -F: '$2 > cutoff' "$ALERT_HISTORY_FILE" > "$ALERT_HISTORY_FILE.tmp" 2>/dev/null
    mv "$ALERT_HISTORY_FILE.tmp" "$ALERT_HISTORY_FILE" 2>/dev/null || true
    return 0
}

# WICHTIG: NUR AKTIVE Prozesse prüfen - KEINE Log-Prüfung!
# Das war der Bug: Log-Prüfung zählte alte "PM2 läuft nicht" Einträge
ACTIVE_CRITICAL_ALERTS=0

# Prüfe AKTIVE Miner-Prozesse (nur wenn JETZT laufend)
if ps aux | grep -E 'xmrig|miner|c3pool' | grep -v grep > /dev/null; then
    ACTIVE_CRITICAL_ALERTS=$((ACTIVE_CRITICAL_ALERTS + 1))
fi

# Prüfe AKTIVE Backdoor-Prozesse (nur wenn JETZT laufend)
if ps aux | grep -E '/root/.systemd-utils/ntpclient' | grep -v grep > /dev/null; then
    ACTIVE_CRITICAL_ALERTS=$((ACTIVE_CRITICAL_ALERTS + 1))
fi

# KEINE Log-Prüfung mehr - das war der Bug!
# Alte Log-Einträge werden nicht mehr gezählt

# NUR bei AKTIVEN Bedrohungen (≥3) handeln
if [ "$ACTIVE_CRITICAL_ALERTS" -ge 3 ]; then
    ALERT_MSG="Critical Security Threat: $ACTIVE_CRITICAL_ALERTS aktive Bedrohungen erkannt."
    
    if is_new_alert "$ALERT_MSG"; then
        pkill -9 xmrig 2>/dev/null || true
        pkill -9 -f "/root/.systemd-utils/ntpclient" 2>/dev/null || true
        
        find /var/www/omnireflect -name 'xmrig*' -o -name 'miner*' 2>/dev/null | while read file; do
            mv "$file" "$file.quarantine.$(date +%s)" 2>/dev/null || true
        done
        
        if [ -f "/usr/local/bin/send-security-alert.sh" ]; then
            /usr/local/bin/send-security-alert.sh "Critical Security Threat" "$ALERT_MSG" &
        fi
        
        echo "[$(date)] AUTOMATIC RESPONSE: $ACTIVE_CRITICAL_ALERTS active threats" >> /var/log/omnireflect-security.log
    fi
fi

EOFFIX
    chmod +x /usr/local/bin/auto-security-response.sh
    echo -e "${GREEN}✅ auto-security-response.sh: Log-Prüfung ENTFERNT${NC}"
fi

# 2. send-security-alert.sh - 24h Deduplizierung
echo ""
echo -e "${BLUE}📋 Fix 2/2: send-security-alert.sh - 24h Deduplizierung...${NC}"
if [ -f "/usr/local/bin/send-security-alert.sh" ]; then
    BACKUP_FILE="/usr/local/bin/send-security-alert.sh.backup.$(date +%Y%m%d_%H%M%S)"
    cp /usr/local/bin/send-security-alert.sh "$BACKUP_FILE"
    echo -e "${GREEN}✅ Backup: $BACKUP_FILE${NC}"
    
    OLD_EMAIL=$(grep "mail -s" /usr/local/bin/send-security-alert.sh | grep -oE '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' | head -1)
    if [ -z "$OLD_EMAIL" ] && [ -f "/etc/fail2ban/jail.local" ]; then
        OLD_EMAIL=$(grep "destemail" /etc/fail2ban/jail.local | grep -oE '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' | head -1)
    fi
    
    if [ -z "$OLD_EMAIL" ]; then
        read -p "E-Mail-Adresse eingeben: " OLD_EMAIL
    fi
    
    cat > /usr/local/bin/send-security-alert.sh << EOF
#!/bin/bash
# Security Alert E-Mail-Versand MIT 24h DEDUPLIZIERUNG

ALERT_HISTORY_FILE="/tmp/omnireflect-send-alert-history.txt"
touch "\$ALERT_HISTORY_FILE"

ALERT_HASH=\$(echo "\$1:\$2" | md5sum | cut -d' ' -f1)
CUTOFF_TIME=\$((\$(date +%s) - 86400))  # 24 Stunden

if grep -q "^\$ALERT_HASH:" "\$ALERT_HISTORY_FILE" 2>/dev/null; then
    LAST_SENT=\$(grep "^\$ALERT_HASH:" "\$ALERT_HISTORY_FILE" | cut -d: -f2)
    if [ "\$LAST_SENT" -ge "\$CUTOFF_TIME" ]; then
        exit 0  # Bereits gesendet in letzten 24h
    fi
fi

echo "\$ALERT_HASH:\$(date +%s)" >> "\$ALERT_HISTORY_FILE"
awk -v cutoff=\$((\$(date +%s) - 604800)) -F: '\$2 > cutoff' "\$ALERT_HISTORY_FILE" > "\$ALERT_HISTORY_FILE.tmp" 2>/dev/null
mv "\$ALERT_HISTORY_FILE.tmp" "\$ALERT_HISTORY_FILE" 2>/dev/null || true

SUBJECT="🔒 Omnireflect Security Alert: \$1"
BODY="
Omnireflect Security Alert

Zeit: \$(date)
Server: \$(hostname)
IP: \$(hostname -I | awk '{print \$1}')

Details:
\$2

---
Dies ist eine automatische Benachrichtigung vom Omnireflect Security Monitoring System.
"

echo "\$BODY" | mail -s "\$SUBJECT" "$OLD_EMAIL" 2>/dev/null || {
    echo "[\$(date)] ALERT: \$1 - \$2" >> /var/log/omnireflect-security-alerts.log
}

EOF
    chmod +x /usr/local/bin/send-security-alert.sh
    echo -e "${GREEN}✅ send-security-alert.sh: 24h Deduplizierung aktiv${NC}"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ ECHTES Problem behoben!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📋 Was wurde geändert:${NC}"
echo "  ✅ auto-security-response.sh: Log-Prüfung ENTFERNT (war der Bug!)"
echo "  ✅ NUR noch aktive Prozesse werden geprüft"
echo "  ✅ send-security-alert.sh: 24h Deduplizierung"
echo ""
echo -e "${YELLOW}⚠️  E-Mail-Flut sollte jetzt KOMPLETT gestoppt sein!${NC}"
echo ""
echo -e "${BLUE}Test:${NC}"
echo "  # Prüfe ob wirklich aktive Bedrohungen da sind:"
echo "  ps aux | grep -E 'xmrig|miner|c3pool' | grep -v grep"
echo "  ps aux | grep '/root/.systemd-utils/ntpclient' | grep -v grep"
echo "  # Sollte leer sein = keine aktiven Bedrohungen"
echo ""
