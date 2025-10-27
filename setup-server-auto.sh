#!/bin/bash

# Automatisches Server-Setup für 194.55.13.15
# WICHTIG: Du musst das Passwort eingeben wenn gefragt

set -e

SERVER="root@194.55.13.15"

echo "🚀 Setup für Server: 194.55.13.15"
echo "Du wirst nach dem Passwort gefragt!"
echo ""

ssh -o StrictHostKeyChecking=accept-new $SERVER << 'ENDSSH'
    set -e
    
    # Farben
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    NC='\033[0m'
    
    log() {
        echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
    }
    
    warn() {
        echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
    }
    
    error() {
        echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    }
    
    log "🗑️ Aktualisiere Paketliste..."
    apt-get update -qq
    
    log "📦 Installiere grundlegende Tools..."
    DEBIAN_FRONTEND=noninteractive apt-get install -y curl git build-essential
    
    log "📦 Installiere Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    log "✅ Node.js $(node -v) installiert"
    
    log "📦 Installiere PM2..."
    npm install -g pm2
    
    log "📦 Installiere Nginx..."
    apt-get install -y nginx
    
    log "📦 Installiere Certbot..."
    apt-get install -y certbot python3-certbot-nginx
    
    log "🔧 Aktiviere Nginx..."
    systemctl enable nginx
    systemctl start nginx
    
    log "🔧 Konfiguriere Swap-Space (4GB)..."
    if [ ! -f /swapfile ]; then
        fallocate -l 4G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
        log "✅ Swap-Space erstellt (4GB)"
    else
        log "Swap-Space existiert bereits"
    fi
    
    log "🔧 Konfiguriere Firewall..."
    ufw --force enable || true
    ufw allow 22/tcp || true
    ufw allow 80/tcp || true
    ufw allow 443/tcp || true
    
    log "✅ Server-Setup abgeschlossen!"
    log ""
    log "Installiert:"
    log "- Node.js $(node -v)"
    log "- PM2 $(pm2 -v)"
    log "- Nginx $(nginx -v 2>&1 | head -1)"
    log "- Certbot $(certbot --version 2>&1 | head -1)"
    log "- Swap-Space: $(free -h | grep Swap | awk '{print $2}')"
    log ""
    log "🚀 Server ist bereit für Deployment!"
ENDSSH

echo ""
echo "✅ Setup abgeschlossen!"
echo ""
echo "Nächste Schritte:"
echo "1. ./create-env-production.sh  # Erstelle .env.production"
echo "2. ./deploy-production.sh      # Deploy die App"

