#!/bin/bash

# Omnireflect Development Stop Script
# Version: 1.0.0

echo "🛑 Omnireflect Development Server wird gestoppt..."
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

# Stoppe laufende Next.js Prozesse
print_status "Suche laufende Next.js Prozesse..."

# Finde alle laufenden Next.js Prozesse
PIDS=$(pgrep -f "next dev" 2>/dev/null)

if [ -n "$PIDS" ]; then
    print_status "Stoppe Prozesse: $PIDS"
    pkill -f "next dev"
    
    # Warte kurz und prüfe ob Prozesse noch laufen
    sleep 2
    REMAINING_PIDS=$(pgrep -f "next dev" 2>/dev/null)
    
    if [ -n "$REMAINING_PIDS" ]; then
        print_warning "Einige Prozesse laufen noch. Erzwinge Beendigung..."
        pkill -9 -f "next dev"
        sleep 1
    fi
    
    # Finale Prüfung
    FINAL_PIDS=$(pgrep -f "next dev" 2>/dev/null)
    if [ -z "$FINAL_PIDS" ]; then
        print_success "Alle Next.js Prozesse erfolgreich gestoppt"
    else
        print_error "Konnte nicht alle Prozesse stoppen: $FINAL_PIDS"
        exit 1
    fi
else
    print_warning "Keine laufenden Next.js Prozesse gefunden"
fi

# Prüfe ob Port 3000 noch belegt ist
if lsof -i :3000 >/dev/null 2>&1; then
    print_warning "Port 3000 ist noch belegt. Prüfe auf andere Prozesse..."
    lsof -i :3000
else
    print_success "Port 3000 ist frei"
fi

echo ""
echo "=================================================="
echo "✅ Omnireflect Development Server gestoppt"
echo "=================================================="
echo ""
echo "💡 Tipp: Verwenden Sie './start-dev.sh' zum Neustarten"
echo "" 