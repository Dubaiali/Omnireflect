#!/bin/bash

# Omnireflect PM2 Deployment Script
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
APP_NAME="reflect-app"
NODE_ENV="production"
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
    
    # Prüfe ob wir auf dem Server sind oder lokal
    if [ "$(hostname)" = "188.68.48.168" ] || [ "$(hostname)" = "localhost" ]; then
        log "ℹ️  Lauf auf Server - überspringe SSH-Test"
        
        # PM2 installieren falls nicht vorhanden
        if ! command -v pm2 >/dev/null 2>&1; then
            log "📦 Installiere PM2..."
            npm install -g pm2
        fi
    else
        # SSH-Verbindung testen (nur wenn lokal)
        if ! ssh -o ConnectTimeout=10 $SERVER "echo 'SSH connection successful'" > /dev/null 2>&1; then
            error "SSH connection to server failed"
        fi
        
        # PM2 installieren falls nicht vorhanden
        if ! ssh $SERVER "command -v pm2 >/dev/null 2>&1"; then
            log "📦 Installiere PM2..."
            ssh $SERVER "npm install -g pm2"
        fi
    fi
    
    log "✅ Voraussetzungen erfüllt"
}

# Backup erstellen
create_backup() {
    log "💾 Erstelle Backup..."
    
    # Prüfe ob wir auf dem Server sind oder lokal
    if [ "$(hostname)" = "188.68.48.168" ] || [ "$(hostname)" = "localhost" ]; then
        mkdir -p $BACKUP_DIR
        
        if [ -d $APP_DIR ]; then
            BACKUP_FILE="$BACKUP_DIR/omnireflect-$(date +%Y%m%d-%H%M%S).tar.gz"
            tar -czf $BACKUP_FILE $APP_DIR 2>/dev/null || true
            log "✅ Backup erstellt: $BACKUP_FILE"
        else
            log "ℹ️  Kein bestehendes Verzeichnis für Backup gefunden"
        fi
    else
        ssh $SERVER "mkdir -p $BACKUP_DIR"
        
        if ssh $SERVER "[ -d $APP_DIR ]"; then
            BACKUP_FILE="$BACKUP_DIR/omnireflect-omnireflect-$(date +%Y%m%d-%H%M%S).tar.gz"
            ssh $SERVER "tar -czf $BACKUP_FILE $APP_DIR 2>/dev/null || true"
            log "✅ Backup erstellt: $BACKUP_FILE"
        else
            log "ℹ️  Kein bestehendes Verzeichnis für Backup gefunden"
        fi
    fi
}

# Anwendung stoppen
stop_application() {
    log "🛑 Stoppe Anwendung..."
    
    # PM2-Prozess stoppen falls vorhanden
    if ssh $SERVER "pm2 list | grep -q '$APP_NAME'"; then
        ssh $SERVER "pm2 stop $APP_NAME"
        ssh $SERVER "pm2 delete $APP_NAME"
        log "✅ PM2-Prozess gestoppt"
    fi
    
    # Fallback: alte nohup-Prozesse stoppen
    ssh $SERVER "pkill -f 'npm start' || true"
    ssh $SERVER "pkill -f 'next start' || true"
    
    # Warten bis Prozesse gestoppt sind
    sleep 3
    
    log "✅ Anwendung gestoppt"
}

# Code deployen
deploy_code() {
    log "🗑️ Lösche alte Version..."
    ssh $SERVER "rm -rf $APP_DIR/* $APP_DIR/.[^.]* 2>/dev/null || true"
    
    log "📤 Erstelle Anwendungsverzeichnis..."
    ssh $SERVER "mkdir -p $APP_DIR"
    
    log "📥 Clone Repository..."
    ssh $SERVER "cd $APP_DIR && git clone https://github.com/Dubaiali/Omnireflect.git ."
    
    log "🔧 Installiere Dependencies..."
    ssh $SERVER "cd $APP_DIR && npm ci --only=production"
    
    log "🏗️ Erstelle Server-Build..."
    ssh $SERVER "cd $APP_DIR && npm run build -- --no-lint"
    
    log "✅ Code erfolgreich deployed"
}

# PM2 konfigurieren und starten
setup_pm2() {
    log "🚀 Konfiguriere PM2..."
    
    # PM2 ecosystem file erstellen
    ssh $SERVER "cat > $APP_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'npm',
    args: 'start -- -p $PORT',
    cwd: '$APP_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: '$NODE_ENV',
      PORT: $PORT
    },
    error_file: '$APP_DIR/logs/err.log',
    out_file: '$APP_DIR/logs/out.log',
    log_file: '$APP_DIR/logs/combined.log',
    time: true
  }]
}
EOF"
    
    # Logs-Verzeichnis erstellen
    ssh $SERVER "mkdir -p $APP_DIR/logs"
    
    # Anwendung mit PM2 starten
    ssh $SERVER "cd $APP_DIR && pm2 start ecosystem.config.js"
    
    # PM2-Konfiguration speichern
    ssh $SERVER "pm2 save"
    
    # PM2 startup script erstellen
    ssh $SERVER "pm2 startup"
    
    log "✅ PM2 konfiguriert und gestartet"
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

# Tests durchführen
run_tests() {
    log "🧪 Führe Tests durch..."
    
    # PM2-Status prüfen
    if ssh $SERVER "pm2 list | grep -q '$APP_NAME.*online'"; then
        log "✅ PM2-Prozess läuft"
    else
        error "PM2-Prozess läuft nicht"
    fi
    
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
}

# Monitoring einrichten
setup_monitoring() {
    log "📊 Richte Monitoring ein..."
    
    # PM2-Monitoring aktivieren
    ssh $SERVER "pm2 install pm2-logrotate"
    ssh $SERVER "pm2 set pm2-logrotate:max_size 10M"
    ssh $SERVER "pm2 set pm2-logrotate:retain 7"
    
    log "✅ Monitoring eingerichtet"
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
    echo "🚀 Omnireflect PM2 Deployment"
    echo "============================="
    echo "Domain: $DOMAIN"
    echo "Server: $SERVER"
    echo "Port: $PORT"
    echo "PM2 App: $APP_NAME"
    echo "============================="
    echo -e "${NC}"
    
    check_prerequisites
    create_backup
    stop_application
    deploy_code
    setup_pm2
    setup_nginx
    setup_ssl
    setup_monitoring
    run_tests
    cleanup
    
    echo -e "${GREEN}"
    echo "🎉 PM2 Deployment erfolgreich abgeschlossen!"
    echo "=========================================="
    echo "🌐 Anwendung: https://$DOMAIN"
    echo "📋 PM2 Status: ssh $SERVER 'pm2 status'"
    echo "📋 PM2 Logs: ssh $SERVER 'pm2 logs $APP_NAME'"
    echo "📋 App Logs: ssh $SERVER 'tail -f $APP_DIR/logs/combined.log'"
    echo "🔄 Neustart: ssh $SERVER 'pm2 restart $APP_NAME'"
    echo "=========================================="
    echo -e "${NC}"
}

# Skript ausführen
main "$@" 