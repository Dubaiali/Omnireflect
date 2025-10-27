#!/bin/bash

# Server-Sicherheits-Check
# Führe DIESES Skript AUS, NACHDEM du auf dem Server bist!

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[✓] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[!] $1${NC}"
}

error() {
    echo -e "${RED}[✗] $1${NC}"
}

info() {
    echo -e "${BLUE}[i] $1${NC}"
}

echo -e "${BLUE}"
echo "🔒 Server-Sicherheits-Check"
echo "=========================="
echo -e "${NC}"

# 1. Firewall prüfen
info "Prüfe Firewall..."
if systemctl is-active --quiet ufw; then
    log "UFW ist aktiv"
    UFW_STATUS=$(ufw status | grep -c "Status: active" || echo "0")
    if [ "$UFW_STATUS" -gt 0 ]; then
        log "UFW ist konfiguriert"
        ufw status numbered
    else
        warn "UFW läuft, aber nicht aktiv konfiguriert"
    fi
else
    error "UFW ist NICHT aktiv!"
    info "Aktiviere mit: sudo ufw enable"
fi

# 2. Offene Ports prüfen
info "Prüfe offene Ports..."
OPEN_PORTS=$(ss -tuln | grep -E ':(22|80|443|3002)' | wc -l)
if [ "$OPEN_PORTS" -gt 0 ]; then
    log "Ports gefunden:"
    ss -tuln | grep -E ':(22|80|443|3002)'
else
    warn "Keine wichtigen Ports offen gefunden"
fi

# 3. Node.js & PM2 prüfen
info "Prüfe Node.js Installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    log "Node.js installiert: $NODE_VERSION"
else
    error "Node.js NICHT installiert!"
fi

if command -v pm2 &> /dev/null; then
    log "PM2 installiert"
    if pm2 list | grep -q "reflect-app"; then
        log "Application läuft:"
        pm2 list
    else
        warn "Application läuft NICHT"
    fi
else
    error "PM2 NICHT installiert!"
fi

# 4. Nginx prüfen
info "Prüfe Nginx..."
if systemctl is-active --quiet nginx; then
    log "Nginx läuft"
    if [ -f "/etc/nginx/sites-enabled/reflect.omni-scient.com.conf" ]; then
        log "Nginx-Konfiguration vorhanden"
    else
        warn "Nginx-Konfiguration fehlt"
    fi
else
    warn "Nginx läuft NICHT"
fi

# 5. SSL-Zertifikat prüfen
info "Prüfe SSL-Zertifikat..."
if [ -f "/etc/letsencrypt/live/reflect.omni-scient.com/fullchain.pem" ]; then
    log "SSL-Zertifikat vorhanden"
    EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/reflect.omni-scient.com/fullchain.pem 2>/dev/null | cut -d= -f2)
    if [ -n "$EXPIRY" ]; then
        info "Zertifikat läuft ab: $EXPIRY"
    fi
else
    warn "SSL-Zertifikat fehlt"
fi

# 6. Umgebungsvariablen prüfen
info "Prüfe Umgebungsvariablen..."
if [ -f "/var/www/omnireflect/.env.production" ]; then
    log ".env.production vorhanden"
    
    # Prüfe kritische Variablen
    MISSING_VARS=0
    if ! grep -q "OPENAI_API_KEY=" /var/www/omnireflect/.env.production; then
        error "OPENAI_API_KEY fehlt!"
        MISSING_VARS=$((MISSING_VARS + 1))
    fi
    
    if ! grep -q "PASSWORD_SALT=" /var/www/omnireflect/.env.production; then
        error "PASSWORD_SALT fehlt!"
        MISSING_VARS=$((MISSING_VARS + 1))
    fi
    
    if ! grep -q "JWT_SECRET=" /var/www/omnireflect/.env.production; then
        error "JWT_SECRET fehlt!"
        MISSING_VARS=$((MISSING_VARS + 1))
    fi
    
    if [ "$MISSING_VARS" -eq 0 ]; then
        log "Alle kritischen Umgebungsvariablen vorhanden"
    else
        error "$MISSING_VARS kritische Umgebungsvariablen fehlen!"
    fi
else
    warn ".env.production fehlt"
fi

# 7. Dateiberechtigungen prüfen
info "Prüfe Dateiberechtigungen..."
if [ -d "/var/www/omnireflect" ]; then
    PERMS=$(stat -c "%a" /var/www/omnireflect 2>/dev/null || stat -f "%OLp" /var/www/omnireflect)
    log "Directory-Berechtigungen: $PERMS"
    
    if [ -f "/var/www/omnireflect/.env.production" ]; then
        FILE_PERMS=$(stat -c "%a" /var/www/omnireflect/.env.production 2>/dev/null || stat -f "%OLp" /var/www/omnireflect/.env.production)
        log "Datei-Berechtigungen: $FILE_PERMS"
        
        if [ "$FILE_PERMS" != "600" ]; then
            warn "Datei-Berechtigungen sollten 600 sein (aktuell: $FILE_PERMS)"
            info "Fix mit: chmod 600 /var/www/omnireflect/.env.production"
        fi
    fi
else
    warn "/var/www/omnireflect existiert nicht"
fi

# 8. Swap-Space prüfen
info "Prüfe Swap-Space..."
SWAP_SIZE=$(free -h | grep Swap | awk '{print $2}')
log "Swap: $SWAP_SIZE"
if [ "$SWAP_SIZE" = "0B" ] || [ "$SWAP_SIZE" = "0Mi" ]; then
    warn "Kein Swap-Space vorhanden"
    info "Swap hilft bei RAM-Problemen während des Builds"
fi

# 9. SSH-Sicherheit prüfen
info "Prüfe SSH-Konfiguration..."
if [ -f "/etc/ssh/sshd_config" ]; then
    if grep -q "^PasswordAuthentication" /etc/ssh/sshd_config; then
        PASSWORD_AUTH=$(grep "^PasswordAuthentication" /etc/ssh/sshd_config | awk '{print $2}')
        if [ "$PASSWORD_AUTH" = "yes" ]; then
            warn "Passwort-Authentifizierung ist aktiviert (unsicher)"
            info "Deaktiviere mit: sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config"
        else
            log "Passwort-Authentifizierung ist deaktiviert"
        fi
    fi
fi

# 10. Root-Login prüfen
if grep -q "^PermitRootLogin" /etc/ssh/sshd_config; then
    ROOT_LOGIN=$(grep "^PermitRootLogin" /etc/ssh/sshd_config | awk '{print $2}')
    if [ "$ROOT_LOGIN" = "yes" ]; then
        warn "Root-Login über SSH ist erlaubt"
    else
        log "Root-Login über SSH ist eingeschränkt"
    fi
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Check abgeschlossen!${NC}"
echo -e "${BLUE}========================================${NC}"

