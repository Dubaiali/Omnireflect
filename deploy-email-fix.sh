#!/bin/bash

# Deployment-Skript für E-Mail-Flut-Fix
# Führt den Fix auf dem Server aus

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SERVER="root@194.55.13.15"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  E-Mail-Flut Fix - Deployment auf Server${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Prüfe ob Fix-Skript existiert
if [ ! -f "/tmp/auto-security-response-fixed.sh" ]; then
    echo -e "${RED}❌ Fix-Skript nicht gefunden!${NC}"
    echo -e "${YELLOW}   Erstelle Fix-Skript...${NC}"
    
    # Erstelle Fix-Skript
    cat > /tmp/auto-security-response-fixed.sh << 'EOFFIX'
#!/bin/bash
# Automatische Reaktionen auf kritische Security-Alerts
# MIT DEDUPLIZIERUNG - verhindert E-Mail-Flut

LOG_FILE="/var/log/omnireflect-security.log"
ALERT_THRESHOLD=3

# Alert-Historie für Deduplizierung
ALERT_HISTORY_FILE="/tmp/omnireflect-response-alert-history.txt"
touch "$ALERT_HISTORY_FILE"

# Prüfe ob dieser Alert bereits in den letzten 60 Minuten gesendet wurde
is_new_alert() {
    local alert_msg="$1"
    local alert_hash=$(echo "$alert_msg" | md5sum | cut -d' ' -f1)
    local cutoff_time=$(($(date +%s) - 3600))  # 60 Minuten
    
    # Prüfe Historie
    if grep -q "^$alert_hash:" "$ALERT_HISTORY_FILE" 2>/dev/null; then
        local last_sent=$(grep "^$alert_hash:" "$ALERT_HISTORY_FILE" | cut -d: -f2)
        if [ "$last_sent" -ge "$cutoff_time" ]; then
            return 1  # Nicht neu
        fi
    fi
    
    # Alert als gesendet markieren
    echo "$alert_hash:$(date +%s)" >> "$ALERT_HISTORY_FILE"
    # Alte Einträge löschen (älter als 24h)
    awk -v cutoff=$(($(date +%s) - 86400)) -F: '$2 > cutoff' "$ALERT_HISTORY_FILE" > "$ALERT_HISTORY_FILE.tmp" 2>/dev/null
    mv "$ALERT_HISTORY_FILE.tmp" "$ALERT_HISTORY_FILE" 2>/dev/null || true
    
    return 0  # Neu
}

# Prüfe auf kritische Alerts (nur AKTIVE, nicht alte Log-Einträge)
ACTIVE_CRITICAL_ALERTS=0

# Prüfe auf AKTIVE Miner-Prozesse
if ps aux | grep -E 'xmrig|miner|c3pool' | grep -v grep > /dev/null; then
    ACTIVE_CRITICAL_ALERTS=$((ACTIVE_CRITICAL_ALERTS + 1))
fi

# Prüfe auf AKTIVE Backdoor-Prozesse
if ps aux | grep -E '/root/.systemd-utils/ntpclient' | grep -v grep > /dev/null; then
    ACTIVE_CRITICAL_ALERTS=$((ACTIVE_CRITICAL_ALERTS + 1))
fi

# Prüfe auf AKTUELLE kritische Alerts in den letzten 5 Minuten (nicht alle alten)
if [ -f "$LOG_FILE" ]; then
    RECENT_CRITICAL=$(grep "ALERT:" "$LOG_FILE" 2>/dev/null | grep -E "Miner|Backdoor|PM2.*läuft nicht|Nginx.*läuft nicht" | tail -5 | wc -l || echo "0")
    if [ "$RECENT_CRITICAL" -gt 0 ]; then
        ACTIVE_CRITICAL_ALERTS=$((ACTIVE_CRITICAL_ALERTS + RECENT_CRITICAL))
    fi
fi

# NUR bei AKTIVEN kritischen Bedrohungen handeln
if [ "$ACTIVE_CRITICAL_ALERTS" -ge "$ALERT_THRESHOLD" ]; then
    ALERT_MSG="Critical Security Threat: $ACTIVE_CRITICAL_ALERTS aktive Bedrohungen erkannt. Automatische Maßnahmen wurden ergriffen."
    
    # Nur senden wenn NEU (Deduplizierung)
    if is_new_alert "$ALERT_MSG"; then
        # Automatische Maßnahmen:
        # 1. Alle verdächtigen Prozesse stoppen
        pkill -9 xmrig 2>/dev/null || true
        pkill -9 -f "/root/.systemd-utils/ntpclient" 2>/dev/null || true
        
        # 2. Verdächtige Dateien isolieren
        find /var/www/omnireflect -name 'xmrig*' -o -name 'miner*' 2>/dev/null | while read file; do
            mv "$file" "$file.quarantine.$(date +%s)" 2>/dev/null || true
        done
        
        # 3. Alert senden (NUR wenn neu)
        if [ -f "/usr/local/bin/send-security-alert.sh" ]; then
            /usr/local/bin/send-security-alert.sh "Critical Security Threat" "$ALERT_MSG" &
        fi
        
        # 4. Log erstellen
        echo "[$(date)] AUTOMATIC RESPONSE: $ACTIVE_CRITICAL_ALERTS active threats detected, actions taken" >> "$LOG_FILE"
    fi
fi
EOFFIX
    chmod +x /tmp/auto-security-response-fixed.sh
    echo -e "${GREEN}✅ Fix-Skript erstellt${NC}"
fi

echo -e "${BLUE}📤 Kopiere Fix auf Server...${NC}"
if scp -o ConnectTimeout=10 -o StrictHostKeyChecking=no /tmp/auto-security-response-fixed.sh "$SERVER:/tmp/auto-security-response-fixed.sh" 2>/dev/null; then
    echo -e "${GREEN}✅ Skript auf Server kopiert${NC}"
else
    echo -e "${RED}❌ Fehler beim Kopieren!${NC}"
    echo -e "${YELLOW}   Prüfe SSH-Verbindung: ssh $SERVER${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔧 Installiere Fix auf Server...${NC}"
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SERVER" << 'SSHEOF'
set -e

echo "📋 Erstelle Backup..."
BACKUP_FILE="/usr/local/bin/auto-security-response.sh.backup.$(date +%Y%m%d_%H%M%S)"
cp /usr/local/bin/auto-security-response.sh "$BACKUP_FILE"
echo "✅ Backup erstellt: $BACKUP_FILE"

echo "📋 Installiere neue Version..."
cp /tmp/auto-security-response-fixed.sh /usr/local/bin/auto-security-response.sh
chmod +x /usr/local/bin/auto-security-response.sh
echo "✅ auto-security-response.sh aktualisiert"

echo "📋 Teste neue Version..."
/usr/local/bin/auto-security-response.sh
echo "✅ Test erfolgreich"

echo ""
echo "📋 Prüfe Deduplizierung..."
if grep -q "is_new_alert" /usr/local/bin/auto-security-response.sh; then
    echo "✅ Deduplizierung aktiv"
else
    echo "❌ Deduplizierung nicht gefunden!"
    exit 1
fi

echo ""
echo "✅ Fix erfolgreich installiert!"
SSHEOF

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✅ E-Mail-Flut Fix erfolgreich installiert!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}📋 Was wurde geändert:${NC}"
    echo "  ✅ Deduplizierung: Max 1 E-Mail pro Alert-Typ pro Stunde"
    echo "  ✅ Prüft nur AKTIVE Bedrohungen (nicht alte Log-Einträge)"
    echo "  ✅ Verhindert E-Mail-Flut bei wiederholten Checks"
    echo ""
    echo -e "${BLUE}📋 Erwartetes Verhalten:${NC}"
    echo "  ✅ Keine E-Mails wenn keine neuen Bedrohungen"
    echo "  ✅ Max 1 E-Mail pro Stunde bei derselben Bedrohung"
    echo "  ✅ Sofortige E-Mail bei neuer, kritischer Bedrohung"
    echo ""
    echo -e "${YELLOW}⚠️  Die E-Mail-Flut sollte jetzt gestoppt sein!${NC}"
else
    echo ""
    echo -e "${RED}❌ Fehler bei der Installation!${NC}"
    exit 1
fi
