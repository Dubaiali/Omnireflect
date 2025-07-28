#!/bin/bash

# Omnireflect Production Deployment Script v5.1.2
# reflect.omni-scient.com
# SICHERES Deployment mit automatischer Daten-Sicherung
# 
# WICHTIG: Dieses Skript sichert automatisch alle wichtigen Daten:
# - Mitarbeiterzugänge (data/hash-list.json)
# - Zusammenfassungen (data/summaries.json) 
# - Adminzugänge (data/admin-credentials.json)
# - Umgebungsvariablen (.env.local, .env.production)
#
# Verwendung:
# ./deploy-production.sh          # Normales Deployment mit Daten-Sicherung
# ./deploy-production.sh --backup # Nur Backup erstellen, kein Deployment

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Konfiguration
SERVER="root@188.68.48.168"
APP_DIR="/var/www/omnireflect"
APP_NAME="reflect-app"
NODE_ENV="production"
PORT="3002"
DOMAIN="reflect.omni-scient.com"
REPO_URL="https://github.com/Dubaiali/Omnireflect.git"

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

info() {
    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Prüfung der Voraussetzungen
check_prerequisites() {
    log "🔍 Prüfe Voraussetzungen..."
    
    # SSH-Verbindung testen
    if ! ssh -o ConnectTimeout=10 $SERVER "echo 'SSH connection successful'" > /dev/null 2>&1; then
        error "SSH connection to server failed"
    fi
    
    # Prüfe ob wichtige Daten vorhanden sind
    log "📊 Prüfe vorhandene Daten..."
    DATA_COUNT=$(ssh $SERVER "find $APP_DIR/data -name '*.json' 2>/dev/null | wc -l" 2>/dev/null || echo "0")
    if [ "$DATA_COUNT" -gt 0 ]; then
        log "✅ Gefunden: $DATA_COUNT Daten-Dateien werden gesichert"
    else
        warn "Keine vorhandenen Daten-Dateien gefunden"
    fi
    
    # PM2 installieren falls nicht vorhanden
    if ! ssh $SERVER "command -v pm2 >/dev/null 2>&1"; then
        log "📦 Installiere PM2..."
        ssh $SERVER "npm install -g pm2"
    fi
    
    log "✅ Voraussetzungen erfüllt"
}

# Prüfe ob Neustart notwendig ist
check_restart_needed() {
    log "🔍 Prüfe ob Neustart notwendig ist..."
    
    # Prüfe ob Anwendung läuft
    if ! ssh $SERVER "pm2 list | grep -q '$APP_NAME'"; then
        log "⚠️  Anwendung läuft nicht - Neustart erforderlich"
        return 0
    fi
    
    # Prüfe ob Umgebungsvariablen geändert wurden
    if [ -f ".env.production" ]; then
        LOCAL_ENV_HASH=$(md5sum .env.production | cut -d' ' -f1)
        REMOTE_ENV_HASH=$(ssh $SERVER "md5sum $APP_DIR/.env.production 2>/dev/null | cut -d' ' -f1" 2>/dev/null || echo "")
        
        if [ "$LOCAL_ENV_HASH" != "$REMOTE_ENV_HASH" ]; then
            log "⚠️  Umgebungsvariablen geändert - Neustart erforderlich"
            return 0
        fi
    fi
    
    # Prüfe ob kritische Dateien geändert wurden
    CRITICAL_FILES=("src/lib/hashList.ts" "src/app/api/hash-list/route.ts" "src/components/HashIDManager.tsx")
    for file in "${CRITICAL_FILES[@]}"; do
        if [ -f "$file" ]; then
            LOCAL_HASH=$(md5sum "$file" | cut -d' ' -f1)
            REMOTE_HASH=$(ssh $SERVER "md5sum $APP_DIR/$file 2>/dev/null | cut -d' ' -f1" 2>/dev/null || echo "")
            
            if [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
                log "⚠️  Kritische Datei geändert ($file) - Neustart erforderlich"
                return 0
            fi
        fi
    done
    
    log "✅ Kein Neustart erforderlich - nur Code-Update"
    return 1
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
    
    # Fallback: alle Prozesse auf Port 3002 beenden
    ssh $SERVER "pkill -f 'next-server' || true"
    ssh $SERVER "pkill -f 'next start' || true"
    ssh $SERVER "pkill -f 'npm start' || true"
    
    log "✅ Anwendung gestoppt"
}

# Code deployen
deploy_code() {
    log "🗑️ Lösche alte Version..."
    
    # WICHTIG: Sichere Daten-Dateien vor dem Löschen
    log "💾 Sichere wichtige Daten..."
    ssh $SERVER "mkdir -p /tmp/omnireflect-backup"
    ssh $SERVER "cp -r $APP_DIR/data /tmp/omnireflect-backup/ 2>/dev/null || true"
    ssh $SERVER "cp $APP_DIR/.env.local /tmp/omnireflect-backup/ 2>/dev/null || true"
    ssh $SERVER "cp $APP_DIR/.env.production /tmp/omnireflect-backup/ 2>/dev/null || true"
    
    # Lösche alte Version (aber NICHT die gesicherten Daten)
    ssh $SERVER "rm -rf $APP_DIR/* $APP_DIR/.[^.]* 2>/dev/null || true"
    
    log "📤 Erstelle Anwendungsverzeichnis..."
    ssh $SERVER "mkdir -p $APP_DIR"
    
    log "📥 Clone Repository..."
    ssh $SERVER "cd $APP_DIR && git clone $REPO_URL ."
    
    log "🔧 Installiere Dependencies..."
    ssh $SERVER "cd $APP_DIR && npm install"
    
    # WICHTIG: Stelle gesicherte Daten wieder her
    log "🔄 Stelle gesicherte Daten wieder her..."
    ssh $SERVER "mkdir -p $APP_DIR/data"
    ssh $SERVER "cp -r /tmp/omnireflect-backup/data/* $APP_DIR/data/ 2>/dev/null || true"
    ssh $SERVER "cp /tmp/omnireflect-backup/.env.local $APP_DIR/ 2>/dev/null || true"
    ssh $SERVER "cp /tmp/omnireflect-backup/.env.production $APP_DIR/ 2>/dev/null || true"
    
    # Bereinige Backup-Verzeichnis
    ssh $SERVER "rm -rf /tmp/omnireflect-backup"
    
    log "✅ Code erfolgreich deployed mit Daten-Sicherung"
}

# Umgebungsvariablen konfigurieren
setup_environment() {
    log "⚙️ Konfiguriere Umgebungsvariablen..."
    
    # .env.production kopieren
    scp .env.production $SERVER:$APP_DIR/.env.production
    
    # .env.local erstellen
    ssh $SERVER "cd $APP_DIR && cp .env.production .env.local"
    
    log "✅ Umgebungsvariablen konfiguriert"
}

# Admin-Credentials und Passwortlogiken handhaben
setup_admin_credentials() {
    log "🔐 Konfiguriere Admin-Credentials..."
    
    # Prüfe ob Admin-Credentials in .env.production vorhanden sind
    if grep -q "ADMIN_USERNAME\|ADMIN_PASSWORD" .env.production; then
        log "✅ Admin-Credentials in .env.production gefunden"
        
        # Lösche alte admin-credentials.json um Umgebungsvariablen zu erzwingen
        ssh $SERVER "rm -f $APP_DIR/data/admin-credentials.json"
        log "🗑️ Alte admin-credentials.json gelöscht - Umgebungsvariablen werden verwendet"
    else
        warn "⚠️ Keine Admin-Credentials in .env.production gefunden"
    fi
    
    # Prüfe ob PASSWORD_SALT gesetzt ist
    if grep -q "PASSWORD_SALT" .env.production; then
        log "✅ PASSWORD_SALT in .env.production gefunden"
    else
        warn "⚠️ PASSWORD_SALT nicht in .env.production gefunden"
    fi
    
    # Prüfe ob JWT_SECRET gesetzt ist
    if grep -q "JWT_SECRET" .env.production; then
        log "✅ JWT_SECRET in .env.production gefunden"
    else
        warn "⚠️ JWT_SECRET nicht in .env.production gefunden"
    fi
    
    log "✅ Admin-Credentials konfiguriert"
}

# Build erstellen
create_build() {
    log "🏗️ Erstelle Production Build..."
    
    ssh $SERVER "cd $APP_DIR && npm run build -- --no-lint"
    
    log "✅ Production Build erstellt"
}

# PM2 konfigurieren und starten
setup_pm2() {
    log "🚀 Konfiguriere PM2..."
    
    # PM2 ecosystem file erstellen
    ssh $SERVER "cat > $APP_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'node_modules/.bin/next',
    args: 'start -p $PORT',
    cwd: '$APP_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: '$NODE_ENV',
      PORT: '$PORT'
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
    
    # Prüfe ob Anwendung bereits läuft
    if ssh $SERVER "pm2 list | grep -q '$APP_NAME'"; then
        log "🔄 Anwendung läuft bereits - Update mit --update-env..."
        ssh $SERVER "cd $APP_DIR && pm2 restart $APP_NAME --update-env"
    else
        log "🚀 Starte neue Anwendung..."
        ssh $SERVER "cd $APP_DIR && pm2 start ecosystem.config.js"
    fi
    
    # Warten bis Anwendung gestartet ist
    log "⏳ Warte auf Anwendungsstart..."
    sleep 5
    
    # PM2-Konfiguration speichern
    ssh $SERVER "pm2 save"
    
    # PM2 startup script erstellen (nur wenn nicht vorhanden)
    if ! ssh $SERVER "pm2 startup | grep -q 'already inited'"; then
        ssh $SERVER "pm2 startup"
    fi
    
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
    
    # Nginx neu laden
    ssh $SERVER "systemctl reload nginx"
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
    
    # Port-Status prüfen
    if ssh $SERVER "netstat -tlnp | grep -q :$PORT"; then
        log "✅ Port $PORT ist aktiv"
    else
        error "Port $PORT ist nicht aktiv"
    fi
    
    # HTTP-Status testen (extern)
    HTTP_STATUS=$(curl -s -o /dev/null -w '%{http_code}' https://$DOMAIN/)
    if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "404" ]; then
        log "✅ Externer HTTP-Status: $HTTP_STATUS"
    else
        warn "Externer HTTP-Status: $HTTP_STATUS (erwartet: 200 oder 404)"
    fi
    
    # Admin-Login testen
    ADMIN_RESPONSE=$(curl -s -X POST https://$DOMAIN/api/auth/admin-login -H "Content-Type: application/json" -d '{"username":"admin","password":"OmniAdmin2024!"}')
    if echo "$ADMIN_RESPONSE" | grep -q '"success":true'; then
        log "✅ Admin-Login funktioniert"
    else
        warn "Admin-Login funktioniert nicht: $ADMIN_RESPONSE"
    fi
    
    # SSL-Zertifikat testen
    if curl -s -I https://$DOMAIN/ | grep -q "HTTP/2"; then
        log "✅ HTTPS funktioniert"
    else
        warn "HTTPS-Test fehlgeschlagen"
    fi
}

# Backup erstellen
create_backup() {
    log "💾 Erstelle Backup der wichtigen Daten..."
    
    BACKUP_DIR="/var/backups/omnireflect/$(date +%Y%m%d_%H%M%S)"
    ssh $SERVER "mkdir -p $BACKUP_DIR"
    
    # Backup der Daten-Dateien
    ssh $SERVER "cp -r $APP_DIR/data $BACKUP_DIR/ 2>/dev/null || true"
    ssh $SERVER "cp $APP_DIR/.env.local $BACKUP_DIR/ 2>/dev/null || true"
    ssh $SERVER "cp $APP_DIR/.env.production $BACKUP_DIR/ 2>/dev/null || true"
    
    # Backup-Info erstellen
    ssh $SERVER "echo 'Backup erstellt: $(date)' > $BACKUP_DIR/backup-info.txt"
    ssh $SERVER "echo 'Daten-Dateien:' >> $BACKUP_DIR/backup-info.txt"
    ssh $SERVER "find $APP_DIR/data -name '*.json' 2>/dev/null >> $BACKUP_DIR/backup-info.txt || true"
    
    log "✅ Backup erstellt: $BACKUP_DIR"
}

# Hauptfunktion
main() {
    echo -e "${BLUE}"
    echo "🚀 Omnireflect Production Deployment v5.1.0"
    echo "=========================================="
    echo "Domain: $DOMAIN"
    echo "Server: $SERVER"
    echo "Port: $PORT"
    echo "PM2 App: $APP_NAME"
    echo "Repository: $REPO_URL"
    echo "=========================================="
    echo -e "${NC}"
    
    check_prerequisites
    
    # Prüfe ob Backup erstellt werden soll
    if [ "$1" = "--backup" ]; then
        create_backup
        return
    fi
    
    # Prüfe ob Neustart notwendig ist
    RESTART_NEEDED=false
    if check_restart_needed; then
        RESTART_NEEDED=true
        log "🔄 Neustart wird durchgeführt..."
        stop_application
    else
        log "⚡ Nur Code-Update - kein Neustart erforderlich"
    fi
    
    deploy_code
    setup_environment
    setup_admin_credentials
    create_build
    
    # Nur PM2-Setup wenn Neustart erforderlich oder Anwendung nicht läuft
    if [ "$RESTART_NEEDED" = true ] || ! ssh $SERVER "pm2 list | grep -q '$APP_NAME'"; then
        setup_pm2
    else
        log "🔄 Update PM2 mit neuen Umgebungsvariablen..."
        ssh $SERVER "cd $APP_DIR && pm2 reload $APP_NAME --update-env"
    fi
    
    setup_nginx
    setup_ssl
    run_tests
    
    echo -e "${GREEN}"
    echo "🎉 Production Deployment erfolgreich abgeschlossen!"
    echo "=================================================="
    echo "🌐 Anwendung: https://$DOMAIN"
    echo "📋 PM2 Status: ssh $SERVER 'pm2 status'"
    echo "📋 PM2 Logs: ssh $SERVER 'pm2 logs $APP_NAME'"
    echo "📋 App Logs: ssh $SERVER 'tail -f $APP_DIR/logs/combined.log'"
    echo "🔄 Neustart: ssh $SERVER 'pm2 restart $APP_NAME'"
    echo "🛑 Stoppen: ssh $SERVER 'pm2 stop $APP_NAME'"
    echo "=================================================="
    echo -e "${NC}"
}

# Skript ausführen
main "$@" 