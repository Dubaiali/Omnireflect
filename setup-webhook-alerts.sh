#!/bin/bash

# Webhook-Alerting Setup für Omnireflect
# Alternative zu E-Mail: Slack, Discord, Telegram, etc.

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
echo "🔔 Webhook-Alerting Setup für Omnireflect"
echo "========================================="
echo -e "${NC}"

# Prüfe ob als root ausgeführt
if [ "$EUID" -ne 0 ]; then
    error "Dieses Skript muss als root ausgeführt werden!"
fi

# Frage nach Webhook-URL
read -p "Webhook-URL eingeben (Slack/Discord/Telegram/etc.) oder Enter für Skip: " WEBHOOK_URL

if [ -z "$WEBHOOK_URL" ]; then
    warn "Keine Webhook-URL angegeben. Überspringe Webhook-Setup."
    exit 0
fi

# Webhook-Alert-Skript erstellen
cat > /usr/local/bin/send-webhook-alert.sh << 'EOFSCRIPT'
#!/bin/bash
# Webhook-Alert-Versand

WEBHOOK_URL="WEBHOOK_URL_PLACEHOLDER"

TITLE="$1"
MESSAGE="$2"
COLOR="danger"  # red für kritische Alerts

# JSON-Payload für Slack/Discord
JSON_PAYLOAD=$(cat <<EOF
{
  "embeds": [{
    "title": "🔒 Omnireflect Security Alert",
    "description": "$TITLE\n\n$MESSAGE",
    "color": 15158332,
    "fields": [
      {
        "name": "Server",
        "value": "$(hostname)",
        "inline": true
      },
      {
        "name": "IP",
        "value": "$(hostname -I | awk '{print $1}')",
        "inline": true
      },
      {
        "name": "Zeit",
        "value": "$(date)",
        "inline": false
      }
    ]
  }]
}
EOF
)

# Versuche Webhook
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD" \
  --max-time 10 \
  --silent \
  --show-error > /dev/null 2>&1 || {
    # Fallback: Log schreiben
    echo "[$(date)] WEBHOOK ALERT: $TITLE - $MESSAGE" >> /var/log/omnireflect-webhook-alerts.log
}

EOFSCRIPT

# Ersetze Platzhalter
sed -i "s|WEBHOOK_URL_PLACEHOLDER|$WEBHOOK_URL|g" /usr/local/bin/send-webhook-alert.sh
chmod +x /usr/local/bin/send-webhook-alert.sh
log "Webhook-Alert-Skript erstellt"

# Integriere in Monitoring-Skript
info "Integriere Webhook in Monitoring-Skript..."
if ! grep -q "send-webhook-alert" /var/www/omnireflect/monitor-security.sh; then
    cat >> /var/www/omnireflect/monitor-security.sh << 'EOFWEBHOOK'

# Webhook-Alert-Funktion
send_webhook_alert() {
    if [ -f "/usr/local/bin/send-webhook-alert.sh" ]; then
        /usr/local/bin/send-webhook-alert.sh "$1" "$2" &
    fi
}

# Bei kritischen Alerts Webhook senden
if [ "$ALERTS" -gt 0 ]; then
    ALERT_SUMMARY="Es wurden $ALERTS Sicherheitsprobleme gefunden"
    send_webhook_alert "Security Issues Detected" "$ALERT_SUMMARY"
fi

EOFWEBHOOK
    log "Webhook in Monitoring integriert"
fi

# Test-Webhook senden
info "Sende Test-Webhook..."
/usr/local/bin/send-webhook-alert.sh "Test Alert" "Dies ist ein Test-Alert vom Omnireflect Security System"

log "✅ Webhook-Alerting Setup abgeschlossen!"
warn "Prüfe deinen Webhook-Kanal auf die Test-Nachricht!"

