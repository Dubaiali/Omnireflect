#!/bin/bash

# Omnireflect Monitoring Script
# Überwacht Anwendungsstatus, Logs und Performance

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Konfiguration
SERVER="root@188.68.48.168"
APP_DIR="/var/www/omnireflect"
PORT="3002"
DOMAIN="reflect.omni-scient.com"

# Logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Anwendungsstatus prüfen
check_app_status() {
    echo -e "${BLUE}🔍 Anwendungsstatus${NC}"
    echo "=================="
    
    # Prozess-Status
    if ssh $SERVER "ps aux | grep -q 'npm start'"; then
        echo -e "${GREEN}✅ Anwendungsprozess läuft${NC}"
    else
        echo -e "${RED}❌ Anwendungsprozess läuft nicht${NC}"
    fi
    
    # Port-Status
    if ssh $SERVER "netstat -tlnp | grep -q :$PORT"; then
        echo -e "${GREEN}✅ Port $PORT ist aktiv${NC}"
    else
        echo -e "${RED}❌ Port $PORT ist nicht aktiv${NC}"
    fi
    
    # HTTP-Status
    HTTP_STATUS=$(ssh $SERVER "curl -s -o /dev/null -w '%{http_code}' http://localhost:$PORT/")
    if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "404" ]; then
        echo -e "${GREEN}✅ HTTP-Status: $HTTP_STATUS${NC}"
    else
        echo -e "${RED}❌ HTTP-Status: $HTTP_STATUS${NC}"
    fi
    
    echo ""
}

# System-Ressourcen prüfen
check_system_resources() {
    echo -e "${BLUE}💻 System-Ressourcen${NC}"
    echo "====================="
    
    # CPU-Auslastung
    CPU_USAGE=$(ssh $SERVER "top -bn1 | grep 'Cpu(s)' | awk '{print \$2}' | cut -d'%' -f1")
    echo "CPU-Auslastung: ${CPU_USAGE}%"
    
    # Speicherauslastung
    MEMORY_INFO=$(ssh $SERVER "free -h | grep Mem")
    echo "Speicher: $MEMORY_INFO"
    
    # Disk-Auslastung
    DISK_USAGE=$(ssh $SERVER "df -h /var/www | tail -1 | awk '{print \$5}'")
    echo "Disk-Auslastung: $DISK_USAGE"
    
    # Node.js-Prozess-Details
    NODE_PROCESS=$(ssh $SERVER "ps aux | grep 'npm start' | grep -v grep")
    if [ -n "$NODE_PROCESS" ]; then
        echo "Node.js-Prozess: $(echo $NODE_PROCESS | awk '{print $2, $3, $4}')"
    fi
    
    echo ""
}

# Nginx-Status prüfen
check_nginx_status() {
    echo -e "${BLUE}🌐 Nginx-Status${NC}"
    echo "=============="
    
    # Nginx-Service-Status
    if ssh $SERVER "systemctl is-active nginx" | grep -q "active"; then
        echo -e "${GREEN}✅ Nginx läuft${NC}"
    else
        echo -e "${RED}❌ Nginx läuft nicht${NC}"
    fi
    
    # Nginx-Konfiguration
    if ssh $SERVER "nginx -t" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Nginx-Konfiguration ist gültig${NC}"
    else
        echo -e "${RED}❌ Nginx-Konfiguration hat Fehler${NC}"
    fi
    
    # SSL-Zertifikat
    if ssh $SERVER "certbot certificates | grep -q '$DOMAIN'"; then
        echo -e "${GREEN}✅ SSL-Zertifikat existiert${NC}"
        
        # Zertifikat-Ablaufdatum
        EXPIRY=$(ssh $SERVER "certbot certificates | grep -A 2 '$DOMAIN' | grep 'VALID' | awk '{print \$2}'")
        echo "Zertifikat gültig bis: $EXPIRY"
    else
        echo -e "${RED}❌ SSL-Zertifikat fehlt${NC}"
    fi
    
    echo ""
}

# Logs anzeigen
show_logs() {
    echo -e "${BLUE}📋 Letzte Logs${NC}"
    echo "============="
    
    # Anwendungslogs
    echo -e "${CYAN}Anwendungslogs (letzte 10 Zeilen):${NC}"
    ssh $SERVER "tail -10 $APP_DIR/logs/omnireflect.log 2>/dev/null || echo 'Keine Logs gefunden'"
    
    echo ""
    
    # Nginx-Logs
    echo -e "${CYAN}Nginx Error Logs (letzte 5 Zeilen):${NC}"
    ssh $SERVER "tail -5 /var/log/nginx/error.log 2>/dev/null || echo 'Keine Error-Logs gefunden'"
    
    echo ""
}

# Externe Tests
run_external_tests() {
    echo -e "${BLUE}🌍 Externe Tests${NC}"
    echo "=============="
    
    # HTTPS-Status
    HTTP_STATUS=$(curl -s -o /dev/null -w '%{http_code}' https://$DOMAIN/)
    if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "404" ]; then
        echo -e "${GREEN}✅ HTTPS-Status: $HTTP_STATUS${NC}"
    else
        echo -e "${RED}❌ HTTPS-Status: $HTTP_STATUS${NC}"
    fi
    
    # SSL-Zertifikat-Test
    if curl -s -I https://$DOMAIN/ | grep -q "HTTP/2"; then
        echo -e "${GREEN}✅ HTTPS/2 funktioniert${NC}"
    else
        echo -e "${YELLOW}⚠️  HTTPS/2 nicht verfügbar${NC}"
    fi
    
    # Response-Zeit
    RESPONSE_TIME=$(curl -s -w '%{time_total}' -o /dev/null https://$DOMAIN/)
    echo "Response-Zeit: ${RESPONSE_TIME}s"
    
    echo ""
}

# Backup-Status
check_backup_status() {
    echo -e "${BLUE}💾 Backup-Status${NC}"
    echo "=============="
    
    BACKUP_COUNT=$(ssh $SERVER "ls $BACKUP_DIR/omnireflect-*.tar.gz 2>/dev/null | wc -l")
    echo "Anzahl Backups: $BACKUP_COUNT"
    
    if [ "$BACKUP_COUNT" -gt 0 ]; then
        LATEST_BACKUP=$(ssh $SERVER "ls -t $BACKUP_DIR/omnireflect-*.tar.gz | head -1")
        BACKUP_DATE=$(ssh $SERVER "stat -c %y $LATEST_BACKUP | cut -d' ' -f1")
        echo "Neuestes Backup: $BACKUP_DATE"
        
        BACKUP_SIZE=$(ssh $SERVER "du -h $LATEST_BACKUP | cut -f1")
        echo "Backup-Größe: $BACKUP_SIZE"
    else
        echo -e "${YELLOW}⚠️  Keine Backups gefunden${NC}"
    fi
    
    echo ""
}

# Hauptfunktion
main() {
    echo -e "${BLUE}"
    echo "📊 Omnireflect Monitoring"
    echo "========================"
    echo "Domain: $DOMAIN"
    echo "Server: $SERVER"
    echo "Zeit: $(date)"
    echo "========================"
    echo -e "${NC}"
    
    check_app_status
    check_system_resources
    check_nginx_status
    run_external_tests
    check_backup_status
    
    if [ "$1" = "--logs" ]; then
        show_logs
    fi
    
    echo -e "${GREEN}✅ Monitoring abgeschlossen${NC}"
}

# Kontinuierliches Monitoring
continuous_monitoring() {
    echo -e "${BLUE}🔄 Kontinuierliches Monitoring (alle 30 Sekunden)${NC}"
    echo "Drücke Ctrl+C zum Beenden"
    echo ""
    
    while true; do
        clear
        main
        sleep 30
    done
}

# Hilfe anzeigen
show_help() {
    echo "Verwendung: $0 [OPTION]"
    echo ""
    echo "Optionen:"
    echo "  --logs       Zeige detaillierte Logs"
    echo "  --watch      Kontinuierliches Monitoring"
    echo "  --help       Zeige diese Hilfe"
    echo ""
    echo "Beispiele:"
    echo "  $0           # Einmaliges Monitoring"
    echo "  $0 --logs    # Mit Logs"
    echo "  $0 --watch   # Kontinuierlich"
}

# Argumente verarbeiten
case "$1" in
    --logs)
        main --logs
        ;;
    --watch)
        continuous_monitoring
        ;;
    --help)
        show_help
        ;;
    "")
        main
        ;;
    *)
        echo "Unbekannte Option: $1"
        show_help
        exit 1
        ;;
esac 