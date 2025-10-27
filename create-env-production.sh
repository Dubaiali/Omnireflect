#!/bin/bash

# Erstellt .env.production aus env.example
# Fordert den User zur Eingabe sensibler Daten auf

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

info() {
    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Funktion zum Generieren sicherer Zufallsstrings
generate_random_string() {
    local length=$1
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

main() {
    echo -e "${BLUE}"
    echo "🔐 Omnireflect .env.production Generator"
    echo "======================================="
    echo -e "${NC}"
    
    # Kopiere env.example
    cp env.example .env.production
    
    log "WICHTIG: Du musst folgende Werte eingeben"
    echo ""
    
    # OpenAI API Key
    read -p "OpenAI API Key: " OPENAI_KEY
    sed -i.bak "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=$OPENAI_KEY|" .env.production
    
    # Sichere Keys generieren
    log "Generiere sichere Zufallsschlüssel..."
    
    PASSWORD_SALT=$(generate_random_string 32)
    JWT_SECRET=$(generate_random_string 32)
    ENCRYPTION_KEY=$(generate_random_string 32)
    SESSION_SECRET=$(generate_random_string 32)
    
    sed -i.bak "s|PASSWORD_SALT=.*|PASSWORD_SALT=$PASSWORD_SALT|" .env.production
    sed -i.bak "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env.production
    sed -i.bak "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|" .env.production
    sed -i.bak "s|SESSION_SECRET=.*|SESSION_SECRET=$SESSION_SECRET|" .env.production
    
    # Admin Password
    read -sp "Admin-Passwort (wird nicht angezeigt): " ADMIN_PW
    echo ""
    
    sed -i.bak "s|ADMIN_PASSWORD=.*|ADMIN_PASSWORD=$ADMIN_PW|" .env.production
    
    # Entferne Backup
    rm -f .env.production.bak
    
    log "✅ .env.production erstellt"
    log ""
    info "Datei: .env.production"
    info "ACHTUNG: Diese Datei enthält sensible Daten!"
    info "NIEMALS in Git committen!"
}

main

