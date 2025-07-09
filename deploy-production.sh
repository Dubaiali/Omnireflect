#!/bin/bash

# Omnireflect Production Deployment Script
# reflect.omni-scient.com

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Konfiguration
SERVER="root@188.68.48.168"
APP_DIR="/var/www/omnireflect"
PORT="3002"
DOMAIN="reflect.omni-scient.com"
BACKUP_DIR="/backup/omnireflect"

# Logging-Funktion
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Prüfung der Voraussetzungen
check_prerequisites() {
    log "🔍 Prüfe Voraussetzungen..."
    
    # Git-Status prüfen
    if [ -n "$(git status --porcelain)" ]; then
        warn "Uncommitted changes detected. Consider committing before deployment."
    fi
    
    # SSH-Verbindung testen
    if ! ssh -o ConnectTimeout=10 $SERVER "echo 'SSH connection successful'" > /dev/null 2>&1; then
        error "SSH connection to server failed"
    fi
    
    # Node.js-Version prüfen
    NODE_VERSION=$(node --version)
    log "Node.js Version: $NODE_VERSION"
    
    log "✅ Voraussetzungen erfüllt"
}

# Backup erstellen
create_backup() {
    log "💾 Erstelle Backup..."
    
    ssh $SERVER "mkdir -p $BACKUP_DIR"
    
    if ssh $SERVER "[ -d $APP_DIR ]"; then
        BACKUP_FILE="$BACKUP_DIR/omnireflect-$(date +%Y%m%d-%H%M%S).tar.gz"
        ssh $SERVER "tar -czf $BACKUP_FILE $APP_DIR 2>/dev/null || true"
        log "✅ Backup erstellt: $BACKUP_FILE"
    else
        log "ℹ️  Kein bestehendes Verzeichnis für Backup gefunden"
    fi
}

# Anwendung stoppen
stop_application() {
    log "🛑 Stoppe Anwendung..."
    
    ssh $SERVER "pkill -f 'npm start' || true"
    ssh $SERVER "pkill -f 'next start' || true"
    
    # Warten bis Prozesse gestoppt sind
    sleep 3
    
    log "✅ Anwendung gestoppt"
}

# Code deployen
deploy_code() {
    log "📦 Erstelle lokalen Build..."
    npm run build -- --no-lint
    
    log "📤 Erstelle Anwendungsverzeichnis..."
    ssh $SERVER "mkdir -p $APP_DIR"
    
    log "📤 Lade Dateien hoch..."
    scp -r src package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs $SERVER:$APP_DIR/
    
    log "🔧 Installiere Dependencies..."
    ssh $SERVER "cd $APP_DIR && npm ci --only=production"
    
    log "🏗️ Erstelle Server-Build..."
    ssh $SERVER "cd $APP_DIR && npm run build -- --no-lint"
    
    log "✅ Code erfolgreich deployed"
}

# Nginx konfigurieren
setup_nginx() {
    log "🌐 Konfiguriere Nginx..."
    
    # Nginx-Konfiguration kopieren
    scp nginx-reflect.conf $SERVER:/etc/nginx/sites-available/$DOMAIN.conf
    
    # Konfiguration aktivieren
    ssh $SERVER "ln -sf /etc/nginx/sites-available/$DOMAIN.conf /etc/nginx/sites-enabled/"
    
    # Nginx-Konfiguration testen
    if ! ssh $SERVER "nginx -t"; then
        error "Nginx configuration test failed"
    fi
    
    # Nginx neu laden
    ssh $SERVER "systemctl reload nginx"
    
    log "✅ Nginx konfiguriert"
}

# SSL-Zertifikat erstellen
setup_ssl() {
    log "🔒 Erstelle SSL-Zertifikat..."
    
    # Prüfen ob Zertifikat bereits existiert
    if ssh $SERVER "certbot certificates | grep -q '$DOMAIN'"; then
        log "ℹ️  SSL-Zertifikat existiert bereits"
    else
        ssh $SERVER "certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@omni-scient.com"
        log "✅ SSL-Zertifikat erstellt"
    fi
}

# Anwendung starten
start_application() {
    log "🚀 Starte Anwendung..."
    
    ssh $SERVER "cd $APP_DIR && mkdir -p logs && nohup npm start -- -p $PORT > logs/omnireflect.log 2>&1 &"
    
    # Warten bis Anwendung startet
    log "⏳ Warte auf Anwendungsstart..."
    sleep 10
    
    # Anwendung testen
    if ssh $SERVER "curl -s -o /dev/null -w '%{http_code}' http://localhost:$PORT/" | grep -q "200\|404"; then
        log "✅ Anwendung gestartet"
    else
        error "Anwendung konnte nicht gestartet werden"
    fi
}

# Tests durchführen
run_tests() {
    log "🧪 Führe Tests durch..."
    
    # HTTP-Status testen
    HTTP_STATUS=$(curl -s -o /dev/null -w '%{http_code}' https://$DOMAIN/)
    if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "404" ]; then
        log "✅ HTTP-Status: $HTTP_STATUS"
    else
        warn "HTTP-Status: $HTTP_STATUS (erwartet: 200 oder 404)"
    fi
    
    # SSL-Zertifikat testen
    if curl -s -I https://$DOMAIN/ | grep -q "HTTP/2"; then
        log "✅ HTTPS funktioniert"
    else
        warn "HTTPS-Test fehlgeschlagen"
    fi
    
    # Prozess-Status prüfen
    if ssh $SERVER "ps aux | grep -q 'npm start'"; then
        log "✅ Anwendungsprozess läuft"
    else
        error "Anwendungsprozess läuft nicht"
    fi
}

# Cleanup
cleanup() {
    log "🧹 Führe Cleanup durch..."
    
    # Alte Backups löschen (älter als 7 Tage)
    ssh $SERVER "find $BACKUP_DIR -name 'omnireflect-*.tar.gz' -mtime +7 -delete 2>/dev/null || true"
    
    # Node.js Cache leeren
    ssh $SERVER "cd $APP_DIR && npm cache clean --force 2>/dev/null || true"
    
    log "✅ Cleanup abgeschlossen"
}

# Hauptfunktion
main() {
    echo -e "${BLUE}"
    echo "🚀 Omnireflect Production Deployment"
    echo "=================================="
    echo "Domain: $DOMAIN"
    echo "Server: $SERVER"
    echo "Port: $PORT"
    echo "=================================="
    echo -e "${NC}"
    
    check_prerequisites
    create_backup
    stop_application
    deploy_code
    setup_nginx
    setup_ssl
    start_application
    run_tests
    cleanup
    
    echo -e "${GREEN}"
    echo "🎉 Deployment erfolgreich abgeschlossen!"
    echo "=================================="
    echo "🌐 Anwendung: https://$DOMAIN"
    echo "📋 Logs: ssh $SERVER 'tail -f $APP_DIR/logs/omnireflect.log'"
    echo "🔍 Status: ssh $SERVER 'ps aux | grep npm'"
    echo "=================================="
    echo -e "${NC}"
}

# Skript ausführen
main "$@" 