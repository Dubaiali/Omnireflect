#!/bin/bash

# Automatisches Herunterfahren bei kritischen Security-Bedrohungen
# Wird nur bei extremen Bedrohungen ausgelöst

set -e

LOG_FILE="/var/log/omnireflect-security.log"
SHUTDOWN_THRESHOLD=50  # NUR bei extremen Notfällen (z.B. aktiver Miner + Backdoor + viele Attacken)
SHUTDOWN_DELAY=600     # 10 Minuten Verzögerung (kann abgebrochen werden)
ALERT_EMAIL="ali.arseven@fielmann.com"
ENABLE_AUTO_SHUTDOWN="${AUTO_SHUTDOWN_ENABLED:-0}"  # Standard: DEAKTIVIERT (nur manuell aktivierbar)

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

# WICHTIG: Auto-Shutdown ist standardmäßig DEAKTIVIERT
# Nur aktivieren wenn wirklich nötig: export AUTO_SHUTDOWN_ENABLED=1
if [ "$ENABLE_AUTO_SHUTDOWN" != "1" ]; then
    log "Auto-Shutdown ist deaktiviert (nur manuell aktivierbar). Für Aktivierung: export AUTO_SHUTDOWN_ENABLED=1"
    exit 0
fi

# Prüfe auf KRITISCHE Bedrohungen - NUR bei AKTIVEN, ECHTEN Bedrohungen
# Shutdown NUR wenn:
# 1. Aktiver Miner-Prozess LÄUFT
# 2. UND Backdoor-Prozess LÄUFT
# 3. UND Server unter massivem Angriff steht
# Sonst: KEIN Shutdown (Seite muss erreichbar bleiben)

ACTIVE_MINER=0
ACTIVE_BACKDOOR=0
MASSIVE_ATTACK=0

# Prüfe auf AKTIVEN Miner (nicht nur Log-Einträge!)
if ps aux | grep -E 'xmrig|miner|c3pool' | grep -v grep > /dev/null; then
    ACTIVE_MINER=1
    alert "KRITISCH: Aktiver Miner-Prozess läuft!"
fi

# Prüfe auf AKTIVE Backdoor (nicht nur Log-Einträge!)
if ps aux | grep -E '/root/.systemd-utils/ntpclient' | grep -v grep > /dev/null; then
    ACTIVE_BACKDOOR=1
    alert "KRITISCH: Backdoor-Prozess läuft!"
fi

# Prüfe auf massiven Angriff (z.B. >100 SSH-Versuche in kurzer Zeit)
if [ -f "/var/log/auth.log" ]; then
    RECENT_FAILED_SSH=$(grep "Failed password" /var/log/auth.log 2>/dev/null | tail -100 | wc -l || echo "0")
    if [ "$RECENT_FAILED_SSH" -gt 100 ]; then
        MASSIVE_ATTACK=1
        alert "KRITISCH: Massiver SSH-Angriff erkannt ($RECENT_FAILED_SSH Fehlversuche)!"
    fi
fi

# Shutdown NUR wenn ALLE drei Bedingungen erfüllt sind (extrem selten)
TOTAL_THREATS=$((ACTIVE_MINER * 20 + ACTIVE_BACKDOOR * 20 + MASSIVE_ATTACK * 10))

# Bereits oben berechnet

# Shutdown NUR bei extremen Notfällen (Miner + Backdoor + massiver Angriff)
if [ "$TOTAL_THREATS" -ge "$SHUTDOWN_THRESHOLD" ]; then
    alert "EXTREMER NOTFALL: $TOTAL_THREATS Bedrohungen erkannt (Miner: $ACTIVE_MINER, Backdoor: $ACTIVE_BACKDOOR, Angriff: $MASSIVE_ATTACK) - Shutdown in $SHUTDOWN_DELAY Sekunden!"
    
    # Prüfe ob Shutdown bereits läuft (verhindere mehrfache Shutdowns)
    if [ -f "/tmp/shutdown-in-progress" ]; then
        log "Shutdown bereits in Progress - überspringe"
        exit 0
    fi
    touch /tmp/shutdown-in-progress
    
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
            rm -f /tmp/cancel-shutdown /tmp/shutdown-in-progress
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
    
    # Shutdown (mit /sbin/shutdown falls verfügbar)
    if command -v shutdown >/dev/null 2>&1; then
        shutdown -h +1 "Security-Shutdown: Kritische Bedrohung erkannt"
    elif command -v /sbin/shutdown >/dev/null 2>&1; then
        /sbin/shutdown -h +1 "Security-Shutdown: Kritische Bedrohung erkannt"
    else
        alert "Shutdown-Befehl nicht gefunden - verwende init 0"
        init 0
    fi
    
    rm -f /tmp/shutdown-in-progress
    exit 0
fi

# Cleanup: Entferne shutdown-in-progress wenn keine Bedrohung mehr
rm -f /tmp/shutdown-in-progress

# Normale Reaktionen (aus auto-security-response.sh) - OHNE Shutdown
# Stoppe verdächtige Prozesse, aber Server bleibt online
if [ "$ACTIVE_MINER" = "1" ] || [ "$ACTIVE_BACKDOOR" = "1" ]; then
    log "Stoppe verdächtige Prozesse (Server bleibt online)..."
    pkill -9 xmrig 2>/dev/null || true
    pkill -9 -f "/root/.systemd-utils/ntpclient" 2>/dev/null || true
    pkill -9 -f "c3pool" 2>/dev/null || true
    
    find /var/www/omnireflect -name 'xmrig*' -o -name 'miner*' 2>/dev/null | while read file; do
        [ -f "$file" ] && mv "$file" "$file.quarantine.$(date +%s)" 2>/dev/null || true
    done
    
    if [ -f "/usr/local/bin/send-security-alert.sh" ]; then
        /usr/local/bin/send-security-alert.sh "Security Alert" "Verdächtige Prozesse gestoppt. Server bleibt online. Bitte manuell prüfen!" &
    fi
fi

log "Monitoring abgeschlossen. Server bleibt online (Auto-Shutdown nur bei extremen Notfällen)."

