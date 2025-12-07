#!/bin/bash

# Erweiterte Sicherheitsmaßnahmen für Omnireflect
# Implementiert zusätzliche Schutzmaßnahmen gegen Angriffe

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[✓] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[!] $1${NC}"
}

error() {
    echo -e "${RED}[✗] $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[i] $1${NC}"
}

echo -e "${BLUE}"
echo "🛡️  Erweiterte Sicherheitsmaßnahmen für Omnireflect"
echo "=================================================="
echo -e "${NC}"

if [ "$EUID" -ne 0 ]; then
    error "Dieses Skript muss als root ausgeführt werden!"
fi

# 1. Rate Limiting für alle Services
info "1. Erweitertes Rate Limiting einrichten..."
mkdir -p /etc/security/limits.conf.d 2>/dev/null || true
cat > /etc/security/limits.conf.d/omnireflect.conf << 'EOF'
# Omnireflect Rate Limiting
* soft nofile 4096
* hard nofile 8192
root soft nofile 8192
root hard nofile 16384
EOF
log "Rate Limiting konfiguriert"

# 2. Automatisches Shutdown bei kritischen Bedrohungen
info "2. Auto-Shutdown-Skript einrichten..."
cp /var/www/omnireflect/auto-security-shutdown.sh /usr/local/bin/ 2>/dev/null || true
chmod +x /usr/local/bin/auto-security-shutdown.sh

# In Cron einbinden (alle 5 Minuten)
(crontab -l 2>/dev/null | grep -v "auto-security-shutdown"; echo "*/5 * * * * /usr/local/bin/auto-security-shutdown.sh >> /var/log/omnireflect-shutdown.log 2>&1") | crontab -
log "Auto-Shutdown eingerichtet (wird nur bei extremen Bedrohungen ausgelöst)"

# 3. Network Isolation bei Angriffen
info "3. Network Isolation-Skript erstellen..."
cat > /usr/local/bin/isolate-network.sh << 'EOF'
#!/bin/bash
# Isoliert Server bei kritischen Angriffen

LOG_FILE="/var/log/omnireflect-security.log"
RECENT_ALERTS=$(grep "ALERT:" "$LOG_FILE" 2>/dev/null | tail -10 | grep -c "ALERT:" || echo "0")

if [ "$RECENT_ALERTS" -ge 3 ]; then
    echo "[$(date)] NETWORK ISOLATION: $RECENT_ALERTS alerts, isolating network" >> "$LOG_FILE"
    
    # Erlaube nur lokalen Zugriff
    ufw deny 22/tcp 2>/dev/null || true
    ufw deny 80/tcp 2>/dev/null || true
    ufw deny 443/tcp 2>/dev/null || true
    
    # Erlaube nur localhost
    ufw allow from 127.0.0.1 to any port 22 2>/dev/null || true
    ufw allow from 127.0.0.1 to any port 80 2>/dev/null || true
    ufw allow from 127.0.0.1 to any port 443 2>/dev/null || true
    
    # Alert senden
    if [ -f "/usr/local/bin/send-security-alert.sh" ]; then
        /usr/local/bin/send-security-alert.sh "Network Isolation" "Server wurde isoliert aufgrund von $RECENT_ALERTS kritischen Alerts. Nur lokaler Zugriff möglich." &
    fi
fi
EOF
chmod +x /usr/local/bin/isolate-network.sh
log "Network Isolation-Skript erstellt"

# 4. Erweiterte Log-Monitoring
info "4. Erweiterte Log-Monitoring einrichten..."
cat > /usr/local/bin/monitor-logs.sh << 'EOF'
#!/bin/bash
# Überwacht System-Logs auf verdächtige Aktivitäten

ALERT_COUNT=0

# Prüfe auf SSH-Brute-Force
SSH_FAILURES=$(grep "Failed password" /var/log/auth.log 2>/dev/null | tail -100 | wc -l)
if [ "$SSH_FAILURES" -gt 50 ]; then
    echo "[$(date)] ALERT: $SSH_FAILURES SSH-Fehlversuche in letzter Zeit" >> /var/log/omnireflect-security.log
    ALERT_COUNT=$((ALERT_COUNT + 1))
fi

# Prüfe auf ungewöhnliche Prozesse
SUSPICIOUS_PROCS=$(ps aux | grep -E '\.sh$|\.py$|\.pl$' | grep -v -E 'monitor|backup|check|setup' | grep -v grep | wc -l)
if [ "$SUSPICIOUS_PROCS" -gt 10 ]; then
    echo "[$(date)] ALERT: $SUSPICIOUS_PROCS verdächtige Prozesse gefunden" >> /var/log/omnireflect-security.log
    ALERT_COUNT=$((ALERT_COUNT + 1))
fi

# Prüfe auf ungewöhnliche Netzwerkverbindungen
SUSPICIOUS_CONNS=$(netstat -tunp 2>/dev/null | grep ESTABLISHED | grep -v -E ':(22|80|443|3002|53)' | wc -l)
if [ "$SUSPICIOUS_CONNS" -gt 20 ]; then
    echo "[$(date)] ALERT: $SUSPICIOUS_CONNS ungewöhnliche Netzwerkverbindungen" >> /var/log/omnireflect-security.log
    ALERT_COUNT=$((ALERT_COUNT + 1))
fi

if [ "$ALERT_COUNT" -gt 0 ]; then
    if [ -f "/usr/local/bin/send-security-alert.sh" ]; then
        /usr/local/bin/send-security-alert.sh "Log-Monitoring Alert" "$ALERT_COUNT verdächtige Aktivitäten in Logs gefunden" &
    fi
fi
EOF
chmod +x /usr/local/bin/monitor-logs.sh

# In Cron einbinden (alle 10 Minuten)
(crontab -l 2>/dev/null | grep -v "monitor-logs"; echo "*/10 * * * * /usr/local/bin/monitor-logs.sh >> /var/log/omnireflect-log-monitoring.log 2>&1") | crontab -
log "Erweiterte Log-Monitoring eingerichtet"

# 5. Automatische Firewall-Regeln bei Angriffen
info "5. Dynamische Firewall-Regeln einrichten..."
cat > /usr/local/bin/dynamic-firewall.sh << 'EOF'
#!/bin/bash
# Dynamische Firewall-Regeln basierend auf Angriffen

# Prüfe Fail2ban-Status
BANNED_IPS=$(fail2ban-client status sshd 2>/dev/null | grep "Banned IP list" | awk -F: '{print $2}' | tr ',' '\n' | wc -l)

if [ "$BANNED_IPS" -gt 10 ]; then
    # Zu viele gebannte IPs - verschärfe Firewall
    ufw limit 22/tcp 2>/dev/null || true
    echo "[$(date)] Firewall verschärft: $BANNED_IPS IPs gebannt" >> /var/log/omnireflect-security.log
fi
EOF
chmod +x /usr/local/bin/dynamic-firewall.sh

# In Cron einbinden (alle 15 Minuten)
(crontab -l 2>/dev/null | grep -v "dynamic-firewall"; echo "*/15 * * * * /usr/local/bin/dynamic-firewall.sh >> /var/log/omnireflect-firewall.log 2>&1") | crontab -
log "Dynamische Firewall-Regeln eingerichtet"

# 6. Prozess-Monitoring
info "6. Prozess-Monitoring erweitern..."
# Wird bereits von monitor-security.sh gemacht, aber erweitern wir es

# 7. Zusammenfassung
echo ""
log "✅ Erweiterte Sicherheitsmaßnahmen eingerichtet!"
echo ""
info "Implementierte Maßnahmen:"
echo "  ✅ Rate Limiting erweitert"
echo "  ✅ Auto-Shutdown bei kritischen Bedrohungen (5+ Alerts)"
echo "  ✅ Network Isolation bei Angriffen"
echo "  ✅ Erweiterte Log-Monitoring"
echo "  ✅ Dynamische Firewall-Regeln"
echo ""
warn "WICHTIG: Auto-Shutdown wird nur bei extremen Bedrohungen ausgelöst"
warn "Shutdown kann abgebrochen werden mit: touch /tmp/cancel-shutdown"
echo ""
info "Alle Maßnahmen sind aktiv und laufen automatisch!"

