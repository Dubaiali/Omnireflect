#!/bin/bash

# Einfaches Skript zur E-Mail-Konfiguration für Alerts

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "📧 E-Mail-Alerts konfigurieren"
echo "=============================="
echo -e "${NC}"

# Frage nach E-Mail-Adresse
read -p "E-Mail-Adresse für Security-Alerts eingeben: " ALERT_EMAIL

if [ -z "$ALERT_EMAIL" ]; then
    echo -e "${YELLOW}Keine E-Mail-Adresse angegeben. Alerts werden nur in Logs geschrieben.${NC}"
    exit 0
fi

echo -e "${GREEN}Konfiguriere E-Mail-Alerts für: $ALERT_EMAIL${NC}"

# Erstelle Alert-Skript
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
echo -e "${GREEN}✓ Alert-Skript erstellt${NC}"

# Update Fail2ban-Konfiguration
if [ -f "/etc/fail2ban/jail.local" ]; then
    sed -i "s|destemail = .*|destemail = $ALERT_EMAIL|" /etc/fail2ban/jail.local
    systemctl restart fail2ban 2>/dev/null || true
    echo -e "${GREEN}✓ Fail2ban konfiguriert${NC}"
fi

# Test-E-Mail senden
echo -e "${BLUE}Sende Test-E-Mail...${NC}"
echo "Dies ist eine Test-E-Mail vom Omnireflect Security System." | mail -s "Omnireflect Test Alert" "$ALERT_EMAIL" 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Test-E-Mail gesendet. Prüfe dein Postfach!${NC}"
else
    echo -e "${YELLOW}⚠ E-Mail konnte nicht gesendet werden. Prüfe Postfix-Konfiguration.${NC}"
    echo -e "${YELLOW}Installiere Postfix mit: apt-get install -y postfix${NC}"
fi

echo ""
echo -e "${GREEN}✅ E-Mail-Alerts konfiguriert!${NC}"
echo -e "${BLUE}E-Mail-Adresse: $ALERT_EMAIL${NC}"
echo ""
echo "Test-Alert senden mit:"
echo "  /usr/local/bin/send-security-alert.sh 'Test' 'Dies ist ein Test'"

