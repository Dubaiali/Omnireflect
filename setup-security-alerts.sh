#!/bin/bash

# Security Alerting Setup für Omnireflect
# Richtet E-Mail-Benachrichtigungen und erweiterte Sicherheit ein

set -e

# Farben
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
echo "🔔 Security Alerting Setup für Omnireflect"
echo "=========================================="
echo -e "${NC}"

# Prüfe ob als root ausgeführt
if [ "$EUID" -ne 0 ]; then
    error "Dieses Skript muss als root ausgeführt werden!"
fi

# 1. Fail2ban installieren und konfigurieren
info "Installiere Fail2ban für SSH-Brute-Force-Schutz..."
if ! command -v fail2ban-server &> /dev/null; then
    apt-get update -qq
    apt-get install -y fail2ban mailutils 2>&1 | tail -5
    log "Fail2ban installiert"
else
    log "Fail2ban bereits installiert"
fi

# Fail2ban-Konfiguration für SSH
info "Konfiguriere Fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
# Ban-Host für 1 Stunde
bantime = 3600
# Zeitfenster für Fehlversuche
findtime = 600
# Anzahl Fehlversuche vor Ban
maxretry = 5
# E-Mail für Alerts (wird später konfiguriert)
destemail = root@localhost
sendername = Fail2Ban-Omnireflect
action = %(action_)s

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s
maxretry = 3
bantime = 7200

[sshd-ddos]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s
maxretry = 10
findtime = 60
bantime = 3600

EOF

log "Fail2ban konfiguriert"

# Fail2ban starten
systemctl enable fail2ban
systemctl restart fail2ban
log "Fail2ban gestartet"

# 2. E-Mail-Konfiguration für Alerts
info "Konfiguriere E-Mail-Alerts..."

# Frage nach E-Mail-Adresse
read -p "E-Mail-Adresse für Security-Alerts eingeben: " ALERT_EMAIL

if [ -z "$ALERT_EMAIL" ]; then
    warn "Keine E-Mail-Adresse angegeben. Verwende root@localhost"
    ALERT_EMAIL="root@localhost"
fi

# Postfix-Konfiguration (falls nicht vorhanden)
if ! command -v postfix &> /dev/null; then
    info "Installiere Postfix für E-Mail-Versand..."
    debconf-set-selections <<< "postfix postfix/mailname string $(hostname)"
    debconf-set-selections <<< "postfix postfix/main_mailer_type string 'Internet Site'"
    DEBIAN_FRONTEND=noninteractive apt-get install -y postfix 2>&1 | tail -5
    log "Postfix installiert"
fi

# Alert-Skript erstellen
cat > /usr/local/bin/send-security-alert.sh << EOF
#!/bin/bash
# Security Alert E-Mail-Versand

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

echo "\$BODY" | mail -s "\$SUBJECT" "$ALERT_EMAIL" 2>/dev/null || {
    # Fallback: Log schreiben
    echo "[$(date)] ALERT: \$1 - \$2" >> /var/log/omnireflect-security-alerts.log
}

EOF

chmod +x /usr/local/bin/send-security-alert.sh
log "Alert-Skript erstellt"

# 3. Erweitertes Monitoring-Skript mit E-Mail-Alerts
info "Erweitere Monitoring-Skript mit E-Mail-Alerts..."
cat >> /var/www/omnireflect/monitor-security.sh << 'EOFALERT'

# E-Mail-Alert-Funktion
send_alert() {
    if [ -f "/usr/local/bin/send-security-alert.sh" ]; then
        /usr/local/bin/send-security-alert.sh "$1" "$2" &
    fi
}

# Bei kritischen Alerts E-Mail senden
if [ "$ALERTS" -gt 0 ]; then
    ALERT_SUMMARY="Es wurden $ALERTS Sicherheitsprobleme gefunden:\n"
    ALERT_SUMMARY+="$(tail -20 $LOG_FILE)"
    send_alert "Security Issues Detected" "$ALERT_SUMMARY"
fi

EOFALERT

log "Monitoring-Skript erweitert"

# 4. Automatische Reaktionen auf kritische Alerts
info "Richte automatische Reaktionen ein..."
cat > /usr/local/bin/auto-security-response.sh << 'EOF'
#!/bin/bash
# Automatische Reaktionen auf kritische Security-Alerts

LOG_FILE="/var/log/omnireflect-security.log"
ALERT_THRESHOLD=3

# Prüfe auf kritische Alerts
CRITICAL_ALERTS=$(grep -c "ALERT:" "$LOG_FILE" 2>/dev/null | tail -1 || echo "0")

if [ "$CRITICAL_ALERTS" -ge "$ALERT_THRESHOLD" ]; then
    # Automatische Maßnahmen:
    # 1. Alle verdächtigen Prozesse stoppen
    pkill -9 xmrig 2>/dev/null || true
    pkill -9 -f "/root/.systemd-utils/ntpclient" 2>/dev/null || true
    
    # 2. Verdächtige Dateien isolieren
    find /var/www/omnireflect -name 'xmrig*' -o -name 'miner*' 2>/dev/null | while read file; do
        mv "$file" "$file.quarantine.$(date +%s)" 2>/dev/null || true
    done
    
    # 3. Alert senden
    /usr/local/bin/send-security-alert.sh "Critical Security Threat" "Automatische Maßnahmen wurden ergriffen. Bitte Server sofort prüfen!"
    
    # 4. Log erstellen
    echo "[$(date)] AUTOMATIC RESPONSE: Critical alerts detected, actions taken" >> "$LOG_FILE"
fi

EOF

chmod +x /usr/local/bin/auto-security-response.sh

# In Cron einbinden (alle 15 Minuten)
(crontab -l 2>/dev/null | grep -v "auto-security-response"; echo "*/15 * * * * /usr/local/bin/auto-security-response.sh >> /var/log/omnireflect-auto-response.log 2>&1") | crontab -
log "Automatische Reaktionen eingerichtet"

# 5. Log-Rotation für Security-Logs
info "Richte Log-Rotation ein..."
cat > /etc/logrotate.d/omnireflect-security << 'EOF'
/var/log/omnireflect-security.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
}

/var/log/omnireflect-security-alerts.log {
    daily
    rotate 90
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
}

/var/log/omnireflect-backup.log {
    weekly
    rotate 12
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
}

EOF

log "Log-Rotation konfiguriert"

# 6. File Integrity Monitoring (einfache Version)
info "Richte File Integrity Monitoring ein..."
cat > /usr/local/bin/check-file-integrity.sh << 'EOF'
#!/bin/bash
# Prüft kritische Dateien auf Änderungen

CRITICAL_FILES=(
    "/etc/ssh/sshd_config"
    "/etc/passwd"
    "/etc/shadow"
    "/var/www/omnireflect/.env.production"
    "/etc/nginx/sites-available/reflect.omni-scient.com.conf"
)

INTEGRITY_FILE="/var/lib/omnireflect/file-integrity.db"

mkdir -p /var/lib/omnireflect

# Erstelle Hash-Datenbank falls nicht vorhanden
if [ ! -f "$INTEGRITY_FILE" ]; then
    for file in "${CRITICAL_FILES[@]}"; do
        if [ -f "$file" ]; then
            echo "$(md5sum "$file" | cut -d' ' -f1) $file" >> "$INTEGRITY_FILE"
        fi
    done
    echo "Initial integrity database created"
    exit 0
fi

# Prüfe Dateien
CHANGED=0
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        CURRENT_HASH=$(md5sum "$file" | cut -d' ' -f1)
        STORED_HASH=$(grep " $file$" "$INTEGRITY_FILE" | cut -d' ' -f1)
        
        if [ -n "$STORED_HASH" ] && [ "$CURRENT_HASH" != "$STORED_HASH" ]; then
            echo "ALERT: File changed: $file"
            /usr/local/bin/send-security-alert.sh "File Integrity Alert" "File $file has been modified!"
            CHANGED=1
        fi
        
        # Update Hash
        sed -i "s|.* $file$|$CURRENT_HASH $file|" "$INTEGRITY_FILE" 2>/dev/null || \
            echo "$CURRENT_HASH $file" >> "$INTEGRITY_FILE"
    fi
done

if [ "$CHANGED" -eq 0 ]; then
    echo "File integrity check: OK"
fi

EOF

chmod +x /usr/local/bin/check-file-integrity.sh

# Initiale Hash-Datenbank erstellen
/usr/local/bin/check-file-integrity.sh

# In Cron einbinden (täglich)
(crontab -l 2>/dev/null | grep -v "check-file-integrity"; echo "0 3 * * * /usr/local/bin/check-file-integrity.sh >> /var/log/omnireflect-integrity.log 2>&1") | crontab -
log "File Integrity Monitoring eingerichtet"

# 7. Automatische Security-Updates
info "Richte automatische Security-Updates ein..."
cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Mail "root@localhost";
EOF

apt-get install -y unattended-upgrades 2>&1 | tail -3
log "Automatische Security-Updates eingerichtet"

# 8. Zusammenfassung
echo ""
log "✅ Security Alerting Setup abgeschlossen!"
echo ""
info "Konfigurierte Komponenten:"
echo "  - Fail2ban für SSH-Schutz"
echo "  - E-Mail-Alerts an: $ALERT_EMAIL"
echo "  - Automatische Reaktionen auf Alerts"
echo "  - File Integrity Monitoring"
echo "  - Automatische Security-Updates"
echo ""
warn "WICHTIG: Teste die E-Mail-Funktion mit:"
warn "  echo 'Test' | mail -s 'Test' $ALERT_EMAIL"
warn ""
warn "Falls E-Mails nicht ankommen, prüfe Postfix-Konfiguration!"

