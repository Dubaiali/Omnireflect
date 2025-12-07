#!/bin/bash
# Prüft den Status aller Sicherheitsmaßnahmen

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🛡️  Sicherheits-Status Prüfung${NC}"
echo "================================"
echo ""

# 1. Fail2ban
echo -n "Fail2ban: "
if systemctl is-active --quiet fail2ban; then
    echo -e "${GREEN}✅ Aktiv${NC}"
else
    echo -e "${RED}❌ Nicht aktiv${NC}"
fi

# 2. Security-Monitoring
echo -n "Security-Monitoring: "
if [ -f "/var/www/omnireflect/monitor-security.sh" ]; then
    if crontab -l 2>/dev/null | grep -q "monitor-security"; then
        echo -e "${GREEN}✅ Aktiv (Cron)${NC}"
    else
        echo -e "${YELLOW}⚠️  Skript vorhanden, aber nicht in Cron${NC}"
    fi
else
    echo -e "${RED}❌ Nicht gefunden${NC}"
fi

# 3. File Integrity
echo -n "File Integrity Monitoring: "
if [ -f "/usr/local/bin/check-file-integrity.sh" ]; then
    if crontab -l 2>/dev/null | grep -q "check-file-integrity"; then
        echo -e "${GREEN}✅ Aktiv${NC}"
    else
        echo -e "${YELLOW}⚠️  Skript vorhanden, aber nicht in Cron${NC}"
    fi
else
    echo -e "${RED}❌ Nicht gefunden${NC}"
fi

# 4. E-Mail-Alerts
echo -n "E-Mail-Alerts: "
if [ -f "/usr/local/bin/send-security-alert.sh" ]; then
    if grep -q "ali.arseven@fielmann.com" /usr/local/bin/send-security-alert.sh 2>/dev/null; then
        echo -e "${GREEN}✅ Konfiguriert (ali.arseven@fielmann.com)${NC}"
    else
        echo -e "${YELLOW}⚠️  Skript vorhanden, aber E-Mail nicht konfiguriert${NC}"
    fi
else
    echo -e "${RED}❌ Nicht konfiguriert${NC}"
fi

# 5. Automatische Reaktionen
echo -n "Automatische Reaktionen: "
if [ -f "/usr/local/bin/auto-security-response.sh" ]; then
    if crontab -l 2>/dev/null | grep -q "auto-security-response"; then
        echo -e "${GREEN}✅ Aktiv${NC}"
    else
        echo -e "${YELLOW}⚠️  Skript vorhanden, aber nicht in Cron${NC}"
    fi
else
    echo -e "${RED}❌ Nicht gefunden${NC}"
fi

# 6. Firewall
echo -n "Firewall (UFW): "
if ufw status | grep -q "Status: active"; then
    echo -e "${GREEN}✅ Aktiv${NC}"
else
    echo -e "${RED}❌ Nicht aktiv${NC}"
fi

# 7. SSH-Härtung
echo -n "SSH-Härtung: "
if grep -q "PasswordAuthentication no" /etc/ssh/sshd_config 2>/dev/null; then
    echo -e "${GREEN}✅ Aktiv${NC}"
else
    echo -e "${YELLOW}⚠️  Teilweise aktiv${NC}"
fi

# 8. Backups
echo -n "Automatische Backups: "
if crontab -l 2>/dev/null | grep -q "backup-automated"; then
    echo -e "${GREEN}✅ Aktiv${NC}"
else
    echo -e "${RED}❌ Nicht aktiv${NC}"
fi

echo ""
echo -e "${BLUE}================================"
echo "Prüfung abgeschlossen"
echo -e "${NC}"
