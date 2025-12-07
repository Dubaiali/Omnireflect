#!/bin/bash

# SSH-Härtungsskript für Omnireflect Server
# Verbessert die SSH-Sicherheit

set -e

SSH_CONFIG="/etc/ssh/sshd_config"
SSH_CONFIG_BACKUP="/etc/ssh/sshd_config.backup.$(date +%Y%m%d_%H%M%S)"

# Farben
GREEN='\033[0;32m'
RED='\033[0;31m'
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
    exit 1
}

info() {
    echo -e "${BLUE}[i] $1${NC}"
}

echo -e "${BLUE}"
echo "🔒 SSH-Härtung für Omnireflect Server"
echo "====================================="
echo -e "${NC}"

# Prüfe ob als root ausgeführt
if [ "$EUID" -ne 0 ]; then
    error "Dieses Skript muss als root ausgeführt werden!"
fi

# Backup der aktuellen Konfiguration
log "Erstelle Backup der SSH-Konfiguration..."
cp "$SSH_CONFIG" "$SSH_CONFIG_BACKUP"
log "Backup erstellt: $SSH_CONFIG_BACKUP"

# SSH-Konfiguration härten
info "Härte SSH-Konfiguration..."

# Entferne doppelte Einträge und Kommentare
sed -i '/^#/d; /^$/d' "$SSH_CONFIG" 2>/dev/null || true

# Setze sichere Standardwerte
cat >> "$SSH_CONFIG" << 'EOF'

# === Omnireflect Security Hardening ===
# Automatisch hinzugefügt am $(date)

# Deaktiviere Passwort-Authentifizierung (nur SSH-Keys)
PasswordAuthentication no
PermitEmptyPasswords no

# Root-Login nur mit SSH-Key (nicht mit Passwort)
PermitRootLogin prohibit-password

# Deaktiviere unsichere Authentifizierungsmethoden
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no

# Verbinde nur mit SSH-Protokoll 2
Protocol 2

# Timeouts für bessere Sicherheit
ClientAliveInterval 300
ClientAliveCountMax 2
LoginGraceTime 60

# Deaktiviere X11-Forwarding (nicht benötigt)
X11Forwarding no

# Deaktiviere Port-Forwarding (optional, kann bei Bedarf aktiviert werden)
# AllowTcpForwarding no

# Maximal 3 Login-Versuche
MaxAuthTries 3
MaxStartups 3

# Deaktiviere DNS-Lookup (schneller)
UseDNS no

# Komprimierung deaktivieren (schneller, weniger CPU)
Compression no

# Sichere Cipher-Suites
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com,hmac-sha2-512,hmac-sha2-256
KexAlgorithms curve25519-sha256@libssh.org,diffie-hellman-group-exchange-sha256

# Logging
LogLevel VERBOSE
SyslogFacility AUTH

EOF

log "SSH-Konfiguration aktualisiert"

# Teste SSH-Konfiguration
info "Teste SSH-Konfiguration..."
if sshd -t; then
    log "SSH-Konfiguration ist gültig"
else
    error "SSH-Konfiguration ist ungültig! Stelle Backup wieder her..."
    cp "$SSH_CONFIG_BACKUP" "$SSH_CONFIG"
    exit 1
fi

# SSH-Service neu laden
info "Lade SSH-Service neu..."
if systemctl reload sshd || systemctl reload ssh; then
    log "SSH-Service erfolgreich neu geladen"
else
    warn "SSH-Service konnte nicht neu geladen werden. Bitte manuell prüfen."
fi

# Zeige aktuelle SSH-Konfiguration
info "Aktuelle SSH-Einstellungen:"
echo ""
grep -E "^PasswordAuthentication|^PermitRootLogin|^Protocol|^MaxAuthTries" "$SSH_CONFIG" | head -10

echo ""
log "✅ SSH-Härtung abgeschlossen!"
warn "WICHTIG: Stelle sicher, dass dein SSH-Key funktioniert, bevor du die Verbindung trennst!"
warn "Teste die Verbindung in einem neuen Terminal-Fenster!"

