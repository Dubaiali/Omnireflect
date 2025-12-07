#!/bin/bash

# E-Mail-Relay Setup für Omnireflect
# Konfiguriert Postfix für externen E-Mail-Versand

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "📧 E-Mail-Relay Setup für Omnireflect"
echo "===================================="
echo -e "${NC}"

# Prüfe ob als root ausgeführt
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Dieses Skript muss als root ausgeführt werden!${NC}"
    exit 1
fi

echo ""
echo "Optionen für E-Mail-Versand:"
echo "1. SMTP-Relay (SendGrid, Mailgun, etc.) - Empfohlen"
echo "2. Direkter SMTP-Versand (benötigt DNS/MX-Records)"
echo "3. Webhook-Alerts (Slack/Discord) - Alternative"
echo ""

read -p "Welche Option? (1/2/3): " OPTION

case $OPTION in
    1)
        echo -e "${BLUE}SMTP-Relay konfigurieren...${NC}"
        read -p "SMTP-Server (z.B. smtp.sendgrid.net): " SMTP_SERVER
        read -p "SMTP-Port (z.B. 587): " SMTP_PORT
        read -p "SMTP-Benutzername: " SMTP_USER
        read -sp "SMTP-Passwort: " SMTP_PASS
        echo ""
        
        # Postfix-Konfiguration
        postconf -e "relayhost = [$SMTP_SERVER]:$SMTP_PORT"
        postconf -e "smtp_sasl_auth_enable = yes"
        postconf -e "smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd"
        postconf -e "smtp_sasl_security_options = noanonymous"
        postconf -e "smtp_tls_security_level = encrypt"
        postconf -e "header_size_limit = 4096000"
        
        # SASL-Passwort-Datei
        echo "[$SMTP_SERVER]:$SMTP_PORT $SMTP_USER:$SMTP_PASS" > /etc/postfix/sasl_passwd
        chmod 600 /etc/postfix/sasl_passwd
        postmap /etc/postfix/sasl_passwd
        
        systemctl restart postfix
        echo -e "${GREEN}✅ SMTP-Relay konfiguriert${NC}"
        ;;
    2)
        echo -e "${BLUE}Direkten SMTP-Versand konfigurieren...${NC}"
        postconf -e "myhostname = reflect.omni-scient.com"
        postconf -e "mydomain = omni-scient.com"
        postconf -e "myorigin = \$mydomain"
        postconf -e "inet_interfaces = loopback-only"
        postconf -e "inet_protocols = ipv4"
        postconf -e "relayhost = "
        
        systemctl restart postfix
        echo -e "${GREEN}✅ Direkter SMTP-Versand konfiguriert${NC}"
        echo -e "${YELLOW}⚠️  Stelle sicher, dass DNS/MX-Records korrekt sind!${NC}"
        ;;
    3)
        echo -e "${BLUE}Webhook-Alerts sind bereits verfügbar${NC}"
        echo "Führe aus: ./setup-webhook-alerts.sh"
        exit 0
        ;;
    *)
        echo -e "${RED}Ungültige Option${NC}"
        exit 1
        ;;
esac

# Test-E-Mail senden
echo ""
echo -e "${BLUE}Test-E-Mail senden...${NC}"
echo "Test-E-Mail vom Omnireflect Server" | mail -s "Omnireflect Test" ali.arseven@fielmann.com 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Test-E-Mail gesendet${NC}"
    echo -e "${YELLOW}Prüfe dein Postfach (auch Spam-Ordner)!${NC}"
else
    echo -e "${RED}❌ Fehler beim Senden${NC}"
    echo "Prüfe Logs: tail -f /var/log/mail.log"
fi

echo ""
echo -e "${GREEN}✅ E-Mail-Konfiguration abgeschlossen!${NC}"

