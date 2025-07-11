#!/bin/bash

# Omnireflect Rollback Script
# Für Notfälle - stellt vorheriges Backup wieder her

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Konfiguration
SERVER="root@188.68.48.168"
APP_DIR="/var/www/omnireflect"
BACKUP_DIR="/backup/omnireflect"
PORT="3002"

# Logging
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

# Verfügbare Backups anzeigen
list_backups() {
    log "📋 Verfügbare Backups:"
    ssh $SERVER "ls -la $BACKUP_DIR/omnireflect-*.tar.gz 2>/dev/null | head -10" || {
        error "Keine Backups gefunden"
    }
}

# Rollback durchführen
rollback() {
    local BACKUP_FILE=$1
    
    if [ -z "$BACKUP_FILE" ]; then
        # Neuestes Backup verwenden
        BACKUP_FILE=$(ssh $SERVER "ls -t $BACKUP_DIR/omnireflect-*.tar.gz 2>/dev/null | head -1")
        if [ -z "$BACKUP_FILE" ]; then
            error "Kein Backup gefunden"
        fi
    fi
    
    log "🔄 Führe Rollback durch mit: $BACKUP_FILE"
    
    # Anwendung stoppen
    log "🛑 Stoppe Anwendung..."
    ssh $SERVER "pkill -f 'npm start' || true"
    sleep 3
    
    # Aktuelles Verzeichnis sichern
    log "💾 Sichere aktuelles Verzeichnis..."
    ssh $SERVER "mv $APP_DIR ${APP_DIR}_failed_$(date +%Y%m%d_%H%M%S) 2>/dev/null || true"
    
    # Backup wiederherstellen
    log "📦 Stelle Backup wieder her..."
    ssh $SERVER "mkdir -p $APP_DIR && tar -xzf $BACKUP_FILE -C /var/www/ --strip-components=2"
    
    # Anwendung starten
    log "🚀 Starte Anwendung..."
    ssh $SERVER "cd $APP_DIR && mkdir -p logs && nohup npm start -- -p $PORT > logs/omnireflect.log 2>&1 &"
    
    # Warten und testen
    sleep 10
    if ssh $SERVER "curl -s -o /dev/null -w '%{http_code}' http://localhost:$PORT/" | grep -q "200\|404"; then
        log "✅ Rollback erfolgreich"
    else
        error "Rollback fehlgeschlagen"
    fi
}

# Hauptfunktion
main() {
    echo -e "${BLUE}"
    echo "🔄 Omnireflect Rollback Script"
    echo "============================="
    echo -e "${NC}"
    
    if [ "$1" = "--list" ]; then
        list_backups
        exit 0
    fi
    
    if [ "$1" = "--help" ]; then
        echo "Verwendung: $0 [BACKUP_FILE]"
        echo "  --list    Zeige verfügbare Backups"
        echo "  --help    Zeige diese Hilfe"
        echo ""
        echo "Beispiele:"
        echo "  $0                                    # Neuestes Backup verwenden"
        echo "  $0 omnireflect-20250109-143022.tar.gz # Spezifisches Backup"
        echo "  $0 --list                            # Backups auflisten"
        exit 0
    fi
    
    rollback "$1"
    
    echo -e "${GREEN}"
    echo "🎉 Rollback erfolgreich abgeschlossen!"
    echo "=================================="
    echo "🌐 Anwendung: https://reflect.omni-scient.com"
    echo "📋 Logs: ssh $SERVER 'tail -f $APP_DIR/logs/omnireflect.log'"
    echo "=================================="
    echo -e "${NC}"
}

main "$@" 