#!/bin/bash

# Fix: Entferne alte E-Mail-Logik aus monitor-security.sh
# Die alte Logik sendet E-Mails ohne Deduplizierung

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔧 Prüfe monitor-security.sh auf alte E-Mail-Logik...${NC}"

# Prüfe ob alte send_alert Funktion vorhanden ist
if grep -q "send_alert()" monitor-security.sh; then
    echo -e "${YELLOW}⚠️  Alte E-Mail-Logik gefunden!${NC}"
    echo -e "${YELLOW}   Diese wird entfernt - Deduplizierung in alert() Funktion ist ausreichend.${NC}"
    
    # Zeige was entfernt wird
    echo ""
    echo "Zu entfernende Zeilen:"
    grep -n "send_alert\|ALERT_SUMMARY\|Security Issues Detected" monitor-security.sh || true
    echo ""
    
    # Backup erstellen
    cp monitor-security.sh monitor-security.sh.backup
    echo -e "${GREEN}✓ Backup erstellt: monitor-security.sh.backup${NC}"
    
    # Entferne alte send_alert Funktion und ALERT_SUMMARY Logik
    # Diese Zeilen sollten am Ende der Datei sein (von setup-security-alerts.sh hinzugefügt)
    sed -i '/^# E-Mail-Alert-Funktion$/,/^EOFALERT$/d' monitor-security.sh
    sed -i '/^send_alert()/,/^}$/d' monitor-security.sh
    sed -i '/ALERT_SUMMARY=/d' monitor-security.sh
    sed -i '/send_alert.*Security Issues Detected/d' monitor-security.sh
    
    echo -e "${GREEN}✅ Alte E-Mail-Logik entfernt${NC}"
    echo ""
    echo -e "${GREEN}📋 Die Deduplizierung in der alert() Funktion (Zeilen 23-72) bleibt aktiv.${NC}"
    echo -e "${GREEN}   Diese verhindert E-Mail-Flut korrekt.${NC}"
else
    echo -e "${GREEN}✅ Keine alte E-Mail-Logik gefunden${NC}"
fi

echo ""
echo -e "${GREEN}✅ Fix abgeschlossen!${NC}"

