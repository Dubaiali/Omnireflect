#!/bin/bash

# Automatisches Backup-Skript für Omnireflect
# Wird täglich per Cron ausgeführt

set -e

APP_DIR="/var/www/omnireflect"
BACKUP_BASE="/var/backups/omnireflect"
BACKUP_DIR="$BACKUP_BASE/$(date +%Y%m%d_%H%M%S)"
RETENTION_DAYS=30

# Farben
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Backup-Verzeichnis erstellen
mkdir -p "$BACKUP_DIR"

log "Erstelle Backup: $BACKUP_DIR"

# Backup der Daten-Dateien
if [ -d "$APP_DIR/data" ]; then
    cp -r "$APP_DIR/data" "$BACKUP_DIR/" 2>/dev/null || {
        error "Fehler beim Backup von data/"
        exit 1
    }
    log "✓ Daten-Dateien gesichert"
else
    warn "Daten-Verzeichnis nicht gefunden: $APP_DIR/data"
fi

# Backup der Umgebungsvariablen
if [ -f "$APP_DIR/.env.production" ]; then
    cp "$APP_DIR/.env.production" "$BACKUP_DIR/" 2>/dev/null || {
        error "Fehler beim Backup von .env.production"
        exit 1
    }
    log "✓ .env.production gesichert"
fi

if [ -f "$APP_DIR/.env.local" ]; then
    cp "$APP_DIR/.env.local" "$BACKUP_DIR/" 2>/dev/null || {
        warn "Fehler beim Backup von .env.local (optional)"
    }
    log "✓ .env.local gesichert"
fi

# Backup-Info erstellen
cat > "$BACKUP_DIR/backup-info.txt" << EOF
Backup erstellt: $(date)
Server: $(hostname)
App-Verzeichnis: $APP_DIR
Backup-Verzeichnis: $BACKUP_DIR

Daten-Dateien:
$(find "$APP_DIR/data" -name '*.json' 2>/dev/null | wc -l) JSON-Dateien gefunden

Dateigrößen:
$(du -sh "$BACKUP_DIR"/* 2>/dev/null | head -10)
EOF

log "✓ Backup-Info erstellt"

# Alte Backups löschen (älter als RETENTION_DAYS Tage)
log "Lösche Backups älter als $RETENTION_DAYS Tage..."
find "$BACKUP_BASE" -type d -name "20*" -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null || true

# Backup-Größe prüfen
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "✓ Backup abgeschlossen - Größe: $BACKUP_SIZE"

# Prüfe ob Backup-Verzeichnis existiert und nicht leer ist
if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
    error "Backup-Verzeichnis ist leer oder existiert nicht!"
    exit 1
fi

log "✅ Backup erfolgreich erstellt: $BACKUP_DIR"

