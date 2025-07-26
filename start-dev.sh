#!/bin/bash

# Omnireflect Development Start Script
# Version: 1.0.0

echo "🚀 Omnireflect Development Server wird gestartet..."
echo "=================================================="

# Farben für bessere Lesbarkeit
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funktion zum Anzeigen von Status-Nachrichten
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Prüfe ob wir im richtigen Verzeichnis sind
if [ ! -f "package.json" ]; then
    print_error "package.json nicht gefunden. Bitte führen Sie dieses Skript im Omnireflect-Projektverzeichnis aus."
    exit 1
fi

# Stoppe laufende Next.js Prozesse
print_status "Stoppe laufende Next.js Prozesse..."
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Lösche alte persistente Daten
print_status "Lösche alte persistente Daten..."
rm -f data/hash-list.json
rm -f data/admin-credentials.json

# Prüfe ob .env.local existiert
if [ ! -f ".env.local" ]; then
    print_warning ".env.local nicht gefunden. Erstelle Standard-Konfiguration..."
    
    cat > .env.local << 'EOF'
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Security Configuration
PASSWORD_SALT=OmniReflect2024_LocalDev_Salt
JWT_SECRET=OmniReflect2024_LocalDev_JWT_Secret
ENCRYPTION_KEY=OmniReflect2024_LocalDev_Encryption_Key

# Admin Credentials (bereinigt)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=OmniAdmin2024!
ADMIN_NAME=Lokaler Administrator

# Employee Credentials
EMPLOYEE1_HASHID=emp_md87yj1f_904c447c80694dc5
EMPLOYEE1_PASSWORD=gzrLG&bjRdTY
EMPLOYEE1_NAME=Anna Schmidt
EMPLOYEE1_DEPARTMENT=IT

# Environment
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=50
RATE_LIMIT_WINDOW_MS=900000

# Session Configuration
SESSION_SECRET=OmniReflect2024_LocalDev_Session_Secret
SESSION_MAX_AGE=86400

# HashID Configuration
HASHID_PREFIX=emp
HASHID_MIN_LENGTH=8
PASSWORD_MIN_LENGTH=12
PASSWORD_REQUIRE_SPECIAL_CHARS=true

# Audit Logging
AUDIT_LOG_ENABLED=true
AUDIT_LOG_RETENTION_DAYS=90

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_INTERVAL_HOURS=24
BACKUP_RETENTION_DAYS=30
EOF
    
    print_success ".env.local erstellt"
else
    print_success ".env.local gefunden"
fi

# Prüfe ob node_modules existiert
if [ ! -d "node_modules" ]; then
    print_status "Installiere Dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "Dependencies installiert"
    else
        print_error "Fehler beim Installieren der Dependencies"
        exit 1
    fi
else
    print_success "Dependencies bereits installiert"
fi

# Starte den Development Server
print_status "Starte Development Server..."
echo ""
echo "=================================================="
echo "🌐 Omnireflect wird gestartet..."
echo "=================================================="
echo ""
echo "📋 Anmeldedaten:"
echo "   👤 Admin:     admin / OmniAdmin2024!"
echo "   👥 Mitarbeiter: emp_md87yj1f_904c447c80694dc5 / gzrLG&bjRdTY"
echo ""
echo "🔗 URLs:"
echo "   🏠 Hauptseite:  http://localhost:3000"
echo "   🔐 Admin:       http://localhost:3000/admin"
echo "   👤 Login:       http://localhost:3000/login"
echo ""
echo "⏹️  Zum Stoppen: Ctrl+C"
echo "=================================================="
echo ""

# Starte den Server
npm run dev 