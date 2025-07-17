#!/bin/bash

# Omnireflect PM2 Monitoring Script
# Überwacht PM2-Anwendungsstatus, Logs und Performance

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
APP_NAME="reflect-app"
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

# PM2-Status prüfen
check_pm2_status() {
    echo -e "${BLUE}🚀 PM2-Status${NC}"
    echo "==========="
    
    # PM2-Liste anzeigen
    PM2_STATUS=$(ssh $SERVER "pm2 list")
    echo "$PM2_STATUS"
    
    # Spezifischen App-Status prüfen
    if ssh $SERVER "pm2 list | grep -q '$APP_NAME.*online'"; then
        echo -e "${GREEN}✅ $APP_NAME läuft${NC}"
    else
        echo -e "${RED}❌ $APP_NAME läuft nicht${NC}"
    fi
    
    echo ""
}

# PM2-Details anzeigen
show_pm2_details() {
    echo -e "${BLUE}📊 PM2-Details${NC}"
    echo "============="
    
    # PM2-Info für spezifische App
    if ssh $SERVER "pm2 list | grep -q '$APP_NAME'"; then
        PM2_INFO=$(ssh $SERVER "pm2 show $APP_NAME")
        echo "$PM2_INFO"
    else
        echo -e "${YELLOW}⚠️  $APP_NAME nicht in PM2 gefunden${NC}"
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
    
    # PM2-Prozess-Details
    PM2_PROCESS=$(ssh $SERVER "pm2 list | grep '$APP_NAME'")
    if [ -n "$PM2_PROCESS" ]; then
        echo "PM2-Prozess: $PM2_PROCESS"
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

# PM2-Logs anzeigen
show_pm2_logs() {
    echo -e "${BLUE}📋 PM2-Logs${NC}"
    echo "=========="
    
    # PM2-Logs für spezifische App
    if ssh $SERVER "pm2 list | grep -q '$APP_NAME'"; then
        echo -e "${CYAN}Letzte 20 Zeilen von $APP_NAME:${NC}"
        ssh $SERVER "pm2 logs $APP_NAME --lines 20 --nostream"
    else
        echo -e "${YELLOW}⚠️  Keine PM2-Logs verfügbar${NC}"
    fi
    
    echo ""
}

# Anwendungslogs anzeigen
show_app_logs() {
    echo -e "${BLUE}📋 Anwendungslogs${NC}"
    echo "================"
    
    # Kombinierte Logs
    if ssh $SERVER "[ -f $APP_DIR/logs/combined.log ]"; then
        echo -e "${CYAN}Kombinierte Logs (letzte 10 Zeilen):${NC}"
        ssh $SERVER "tail -10 $APP_DIR/logs/combined.log"
    fi
    
    # Error-Logs
    if ssh $SERVER "[ -f $APP_DIR/logs/err.log ]"; then
        echo -e "${CYAN}Error-Logs (letzte 5 Zeilen):${NC}"
        ssh $SERVER "tail -5 $APP_DIR/logs/err.log"
    fi
    
    # Output-Logs
    if ssh $SERVER "[ -f $APP_DIR/logs/out.log ]"; then
        echo -e "${CYAN}Output-Logs (letzte 5 Zeilen):${NC}"
        ssh $SERVER "tail -5 $APP_DIR/logs/out.log"
    fi
    
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
    
    # Port-Test
    if ssh $SERVER "netstat -tlnp | grep -q :$PORT"; then
        echo -e "${GREEN}✅ Port $PORT ist aktiv${NC}"
    else
        echo -e "${RED}❌ Port $PORT ist nicht aktiv${NC}"
    fi
    
    echo ""
}

# Backup-Status
check_backup_status() {
    echo -e "${BLUE}💾 Backup-Status${NC}"
    echo "=============="
    
    BACKUP_DIR="/backup/omnireflect"
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

# PM2-Monitoring
show_pm2_monitoring() {
    echo -e "${BLUE}📈 PM2-Monitoring${NC}"
    echo "==============="
    
    # PM2-Monit (falls verfügbar)
    if ssh $SERVER "command -v pm2-monit >/dev/null 2>&1"; then
        echo -e "${CYAN}PM2-Monitoring verfügbar${NC}"
    else
        echo -e "${YELLOW}PM2-Monitoring nicht installiert${NC}"
    fi
    
    # PM2-Metrik
    if ssh $SERVER "pm2 list | grep -q '$APP_NAME'"; then
        PM2_METRICS=$(ssh $SERVER "pm2 show $APP_NAME | grep -E '(memory|cpu|uptime)'")
        echo "PM2-Metriken:"
        echo "$PM2_METRICS"
    fi
    
    echo ""
}

# Hauptfunktion
main() {
    echo -e "${BLUE}"
    echo "📊 Omnireflect PM2 Monitoring"
    echo "============================"
    echo "Domain: $DOMAIN"
    echo "Server: $SERVER"
    echo "PM2 App: $APP_NAME"
    echo "Zeit: $(date)"
    echo "============================"
    echo -e "${NC}"
    
    check_pm2_status
    check_system_resources
    check_nginx_status
    run_external_tests
    check_backup_status
    
    if [ "$1" = "--logs" ]; then
        show_pm2_logs
        show_app_logs
    fi
    
    if [ "$1" = "--details" ]; then
        show_pm2_details
        show_pm2_monitoring
    fi
    
    echo -e "${GREEN}✅ PM2 Monitoring abgeschlossen${NC}"
}

# Kontinuierliches Monitoring
continuous_monitoring() {
    echo -e "${BLUE}🔄 Kontinuierliches PM2 Monitoring (alle 30 Sekunden)${NC}"
    echo "Drücke Ctrl+C zum Beenden"
    echo ""
    
    while true; do
        clear
        main
        sleep 30
    done
}

# PM2-Aktionen
pm2_actions() {
    case "$1" in
        restart)
            log "🔄 Starte $APP_NAME neu..."
            ssh $SERVER "pm2 restart $APP_NAME"
            ;;
        stop)
            log "🛑 Stoppe $APP_NAME..."
            ssh $SERVER "pm2 stop $APP_NAME"
            ;;
        start)
            log "🚀 Starte $APP_NAME..."
            ssh $SERVER "pm2 start $APP_NAME"
            ;;
        reload)
            log "🔄 Reloade $APP_NAME..."
            ssh $SERVER "pm2 reload $APP_NAME"
            ;;
        delete)
            log "🗑️ Lösche $APP_NAME..."
            ssh $SERVER "pm2 delete $APP_NAME"
            ;;
        *)
            error "Unbekannte Aktion: $1"
            ;;
    esac
}

# Hilfe anzeigen
show_help() {
    echo "Verwendung: $0 [OPTION]"
    echo ""
    echo "Optionen:"
    echo "  --logs       Zeige detaillierte Logs"
    echo "  --details    Zeige PM2-Details und Monitoring"
    echo "  --watch      Kontinuierliches Monitoring"
    echo "  restart      Starte App neu"
    echo "  stop         Stoppe App"
    echo "  start        Starte App"
    echo "  reload       Reloade App"
    echo "  delete       Lösche App aus PM2"
    echo "  --help       Zeige diese Hilfe"
    echo ""
    echo "Beispiele:"
    echo "  $0           # Einmaliges Monitoring"
    echo "  $0 --logs    # Mit Logs"
    echo "  $0 --watch   # Kontinuierlich"
    echo "  $0 restart   # App neu starten"
}

# Argumente verarbeiten
case "$1" in
    --logs)
        main --logs
        ;;
    --details)
        main --details
        ;;
    --watch)
        continuous_monitoring
        ;;
    restart|stop|start|reload|delete)
        pm2_actions "$1"
        ;;
    --help|-h)
        show_help
        ;;
    "")
        main
        ;;
    *)
        error "Unbekannte Option: $1"
        show_help
        exit 1
        ;;
esac 