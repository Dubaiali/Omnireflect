#!/bin/bash

# Automatisches Herunterfahren bei kritischen Security-Bedrohungen
# Wird nur bei extremen Bedrohungen ausgelöst

set -e

LOG_FILE="/var/log/omnireflect-security.log"
SHUTDOWN_THRESHOLD=10  # Anzahl kritischer Alerts vor Shutdown
SHUTDOWN_DELAY=300    # 5 Minuten Verzögerung (kann abgebrochen werden)
ALERT_EMAIL="ali.arseven@fielmann.com"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

alert() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ALERT: $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ALERT: $1" >> "$LOG_FILE"
}

# Prüfe auf kritische Alerts in den letzten 10 Minuten
RECENT_CRITICAL_ALERTS=$(grep "ALERT:" "$LOG_FILE" 2>/dev/null | tail -20 | grep -c "ALERT:" || echo "0")

# Prüfe auf aktive Miner/Backdoors
ACTIVE_THREATS=0
if ps aux | grep -E 'xmrig|miner|c3pool' | grep -v grep > /dev/null; then
    ACTIVE_THREATS=$((ACTIVE_THREATS + 1))
fi
if ps aux | grep -E '/root/.systemd-utils/ntpclient' | grep -v grep > /dev/null; then
    ACTIVE_THREATS=$((ACTIVE_THREATS + 1))
fi

TOTAL_THREATS=$((RECENT_CRITICAL_ALERTS + ACTIVE_THREATS))

if [ "$TOTAL_THREATS" -ge "$SHUTDOWN_THRESHOLD" ]; then
    alert "KRITISCH: $TOTAL_THREATS Bedrohungen erkannt - Shutdown in $SHUTDOWN_DELAY Sekunden!"
    
    # Alert senden
    if [ -f "/usr/local/bin/send-security-alert.sh" ]; then
        /usr/local/bin/send-security-alert.sh "KRITISCH: Server-Shutdown" "Der Server wird in $SHUTDOWN_DELAY Sekunden heruntergefahren aufgrund von $TOTAL_THREATS kritischen Bedrohungen. Bitte sofort prüfen!" &
    fi
    
    if [ -f "/usr/local/bin/send-webhook-alert.sh" ]; then
        /usr/local/bin/send-webhook-alert.sh "KRITISCH: Server-Shutdown" "Der Server wird in $SHUTDOWN_DELAY Sekunden heruntergefahren!" &
    fi
    
    # Shutdown mit Verzögerung (kann abgebrochen werden)
    log "Shutdown geplant in $SHUTDOWN_DELAY Sekunden. Zum Abbrechen: touch /tmp/cancel-shutdown"
    
    # Warte und prüfe ob Shutdown abgebrochen wurde
    for i in $(seq 1 $SHUTDOWN_DELAY); do
        sleep 1
        if [ -f "/tmp/cancel-shutdown" ]; then
            alert "Shutdown ABGEBROCHEN durch /tmp/cancel-shutdown"
            rm -f /tmp/cancel-shutdown
            exit 0
        fi
    done
    
    # Finale Maßnahmen vor Shutdown
    alert "Führe finale Sicherheitsmaßnahmen durch..."
    
    # Alle verdächtigen Prozesse stoppen
    pkill -9 xmrig 2>/dev/null || true
    pkill -9 -f "/root/.systemd-utils/ntpclient" 2>/dev/null || true
    pkill -9 -f "c3pool" 2>/dev/null || true
    
    # Firewall verschärfen (nur lokaler Zugriff)
    ufw deny 22/tcp 2>/dev/null || true
    
    # Backup erstellen
    /var/www/omnireflect/backup-automated.sh 2>/dev/null || true
    
    alert "Shutdown wird jetzt durchgeführt..."
    
    # Shutdown
    shutdown -h +1 "Security-Shutdown: Kritische Bedrohung erkannt"
    
    exit 0
fi

# Normale Reaktionen (aus auto-security-response.sh)
if [ "$RECENT_CRITICAL_ALERTS" -ge 2 ]; then
    # Automatische Maßnahmen ohne Shutdown
    pkill -9 xmrig 2>/dev/null || true
    pkill -9 -f "/root/.systemd-utils/ntpclient" 2>/dev/null || true
    pkill -9 -f "c3pool" 2>/dev/null || true
    
    find /var/www/omnireflect -name 'xmrig*' -o -name 'miner*' 2>/dev/null | while read file; do
        [ -f "$file" ] && mv "$file" "$file.quarantine.$(date +%s)" 2>/dev/null || true
    done
    
    if [ -f "/usr/local/bin/send-security-alert.sh" ]; then
        /usr/local/bin/send-security-alert.sh "Security Alert" "Automatische Maßnahmen wurden ergriffen. $RECENT_CRITICAL_ALERTS kritische Alerts erkannt." &
    fi
fi

