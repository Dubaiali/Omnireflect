#!/bin/bash

# Omnireflect - Neuen Server Setup
# Dieses Skript konfiguriert einen frischen VPS (Hetzner/Netcup/etc.) für Omnireflect

set -e

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Hauptfunktion
main() {
    echo -e "${BLUE}"
    echo "🚀 Omnireflect - Neuer Server Setup"
    echo "===================================="
    echo -e "${NC}"
    
    read -p "IP-Adresse des neuen Servers eingeben: " SERVER_IP
    read -p "SSH-User (meist 'root'): " SSH_USER
    
    SERVER="$SSH_USER@$SERVER_IP"
    
    log "🔍 Prüfe SSH-Verbindung..."
    if ! ssh -o ConnectTimeout=10 $SERVER "echo 'OK'" > /dev/null 2>&1; then
        error "SSH-Verbindung fehlgeschlagen. Prüfe IP und SSH-Zugang."
    fi
    
    log "📦 Installiere Node.js..."
    ssh $SERVER "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
    
    log "🔧 Konfiguriere Swap-Space (für Build auf kleinen Servern)..."
    ssh $SERVER "sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile"
    ssh $SERVER "echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab"
    
    log "📦 Installiere PM2..."
    ssh $SERVER "sudo npm install -g pm2"
    
    log "📦 Installiere Nginx..."
    ssh $SERVER "sudo apt-get update && sudo apt-get install -y nginx"
    
    log "📦 Installiere Certbot..."
    ssh $SERVER "sudo apt-get install -y certbot python3-certbot-nginx"
    
    log "✅ Server-Software installiert"
    
    log "🔧 Konfiguriere Firewall..."
    ssh $SERVER "sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw --force enable"
    
    log "✅ Firewall konfiguriert"
    
    # Erstelle Verzeichnis
    ssh $SERVER "mkdir -p /var/www/omnireflect/data"
    
    log "✅ Server-Initialisierung abgeschlossen"
    log ""
    log "NÄCHSTE SCHRITTE:"
    log "1. Aktualisiere deploy-production.sh mit neuer IP: $SERVER_IP"
    log "2. Erstelle .env.production mit deinen API-Keys"
    log "3. Führe ./deploy-production.sh aus"
    log ""
    log "Server ist bereit für Deployment!"
}

main

