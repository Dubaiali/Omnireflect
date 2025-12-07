#!/bin/bash

# OWASP Top 10 Security Check für Omnireflect
# Prüft die häufigsten Sicherheitslücken

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REPORT_FILE="/var/log/omnireflect-owasp-check.log"
APP_DIR="/var/www/omnireflect"
ISSUES=0
WARNINGS=0

log() {
    echo -e "${GREEN}[✓] $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [OK] $1" >> "$REPORT_FILE"
}

warn() {
    echo -e "${YELLOW}[!] $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [WARN] $1" >> "$REPORT_FILE"
    WARNINGS=$((WARNINGS + 1))
}

error() {
    echo -e "${RED}[✗] $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [ERROR] $1" >> "$REPORT_FILE"
    ISSUES=$((ISSUES + 1))
}

info() {
    echo -e "${BLUE}[i] $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [INFO] $1" >> "$REPORT_FILE"
}

echo -e "${BLUE}"
echo "🔒 OWASP Top 10 Security Check für Omnireflect"
echo "=============================================="
echo -e "${NC}"

touch "$REPORT_FILE"
echo "OWASP Security Check gestartet: $(date)" > "$REPORT_FILE"

# A01:2021 – Broken Access Control
info "A01: Broken Access Control prüfen..."
if [ -f "$APP_DIR/src/middleware.ts" ]; then
    if grep -q "auth\|session\|role" "$APP_DIR/src/middleware.ts"; then
        log "Middleware implementiert"
    else
        warn "Keine Access-Control-Logik in Middleware gefunden"
    fi
else
    warn "Middleware-Datei nicht gefunden"
fi

# Prüfe API-Routen auf Authentifizierung
API_ROUTES=$(find "$APP_DIR/src/app/api" -name "route.ts" 2>/dev/null | wc -l)
PROTECTED_ROUTES=0
for route in $(find "$APP_DIR/src/app/api" -name "route.ts" 2>/dev/null); do
    if grep -qE "session|auth|jwt|token" "$route" 2>/dev/null; then
        PROTECTED_ROUTES=$((PROTECTED_ROUTES + 1))
    fi
done

if [ "$PROTECTED_ROUTES" -gt 0 ]; then
    log "API-Routen haben Authentifizierung: $PROTECTED_ROUTES/$API_ROUTES"
else
    error "Keine Authentifizierung in API-Routen gefunden!"
fi

# A02:2021 – Cryptographic Failures
info "A02: Cryptographic Failures prüfen..."
if grep -r "password\|secret\|key" "$APP_DIR/src" 2>/dev/null | grep -v "\.env\|node_modules" | grep -qE "console\.log|process\.env\.NODE_ENV.*development"; then
    error "Sensible Daten könnten in Logs ausgegeben werden"
else
    log "Keine sensiblen Daten in Logs gefunden"
fi

# Prüfe auf verschlüsselte Passwörter
if grep -r "bcrypt\|argon2\|scrypt" "$APP_DIR/src" 2>/dev/null | grep -v node_modules > /dev/null; then
    log "Passwort-Hashing implementiert"
else
    warn "Keine Passwort-Hashing-Bibliothek gefunden (bcrypt, argon2, etc.)"
fi

# Prüfe auf HTTPS
if grep -q "https\|SSL\|TLS" "$APP_DIR/nginx-reflect.conf" 2>/dev/null; then
    log "HTTPS konfiguriert"
else
    error "HTTPS nicht konfiguriert!"
fi

# A03:2021 – Injection
info "A03: Injection prüfen..."
# SQL Injection (falls SQL verwendet wird)
if grep -r "query\|execute\|sql" "$APP_DIR/src" 2>/dev/null | grep -v node_modules | grep -qE "\$\{|'\+|`"; then
    warn "Mögliche SQL-Injection-Gefahr - prüfe Query-Parameterisierung"
else
    log "Keine direkten SQL-Queries gefunden"
fi

# Command Injection
if grep -r "exec\|spawn\|system" "$APP_DIR/src" 2>/dev/null | grep -v node_modules > /dev/null; then
    warn "System-Befehle werden ausgeführt - prüfe auf Command Injection"
else
    log "Keine System-Befehle gefunden"
fi

# A04:2021 – Insecure Design
info "A04: Insecure Design prüfen..."
# Prüfe auf Input-Validierung
VALIDATION_FILES=$(find "$APP_DIR/src" -name "*validation*" -o -name "*schema*" 2>/dev/null | wc -l)
if [ "$VALIDATION_FILES" -gt 0 ]; then
    log "Input-Validierung implementiert: $VALIDATION_FILES Dateien"
else
    warn "Keine explizite Input-Validierung gefunden"
fi

# Prüfe auf Zod (Validierungsbibliothek)
if grep -q "zod" "$APP_DIR/package.json" 2>/dev/null; then
    log "Zod (Validierungsbibliothek) verwendet"
else
    warn "Keine Validierungsbibliothek (z.B. Zod) gefunden"
fi

# A05:2021 – Security Misconfiguration
info "A05: Security Misconfiguration prüfen..."
# Prüfe .env-Dateien
if [ -f "$APP_DIR/.env.production" ]; then
    if grep -q "NODE_ENV=production" "$APP_DIR/.env.production"; then
        log "Production-Umgebung konfiguriert"
    else
        warn "NODE_ENV nicht auf 'production' gesetzt"
    fi
    
    # Prüfe auf sensible Daten in .env
    if grep -E "password|secret|key" "$APP_DIR/.env.production" 2>/dev/null | grep -q "test\|demo\|123"; then
        error "Schwache Passwörter/Secrets in .env.production gefunden!"
    else
        log ".env.production scheint sicher konfiguriert"
    fi
else
    warn ".env.production nicht gefunden"
fi

# Prüfe Debug-Modus
if grep -r "debug\|DEBUG\|console\.log" "$APP_DIR/src" 2>/dev/null | grep -v node_modules | grep -v "//.*debug" | wc -l | grep -q "^0$"; then
    log "Keine Debug-Ausgaben in Production-Code"
else
    warn "Debug-Ausgaben im Code gefunden"
fi

# A06:2021 – Vulnerable and Outdated Components
info "A06: Vulnerable Components prüfen..."
if [ -f "$APP_DIR/package.json" ]; then
    cd "$APP_DIR"
    if command -v npm &> /dev/null; then
        npm audit --audit-level=high 2>&1 | tee -a "$REPORT_FILE" | tail -20
        AUDIT_EXIT=$?
        if [ $AUDIT_EXIT -eq 0 ]; then
            log "npm audit: Keine kritischen Vulnerabilities"
        else
            error "npm audit: Vulnerabilities gefunden!"
        fi
    else
        warn "npm nicht verfügbar - kann nicht prüfen"
    fi
fi

# A07:2021 – Identification and Authentication Failures
info "A07: Authentication Failures prüfen..."
# Prüfe auf Session-Management
if find "$APP_DIR/src" -name "*session*" -o -name "*auth*" 2>/dev/null | grep -v node_modules | wc -l | grep -q "[1-9]"; then
    log "Session/Auth-Management implementiert"
else
    warn "Kein Session-Management gefunden"
fi

# Prüfe auf JWT
if grep -r "jwt\|jsonwebtoken" "$APP_DIR/src" 2>/dev/null | grep -v node_modules > /dev/null; then
    log "JWT verwendet"
    # Prüfe auf JWT-Secret
    if grep -q "JWT_SECRET" "$APP_DIR/.env.production" 2>/dev/null; then
        log "JWT_SECRET konfiguriert"
    else
        error "JWT_SECRET nicht in .env.production gefunden!"
    fi
else
    warn "Keine JWT-Implementierung gefunden"
fi

# Prüfe auf Rate Limiting
if grep -r "rate.*limit\|ratelimit\|throttle" "$APP_DIR/src" 2>/dev/null | grep -v node_modules > /dev/null; then
    log "Rate Limiting implementiert"
else
    warn "Kein Rate Limiting in Anwendung gefunden (Server-seitig: Fail2ban aktiv)"
fi

# A08:2021 – Software and Data Integrity Failures
info "A08: Data Integrity Failures prüfen..."
# Prüfe auf File Integrity Monitoring
if [ -f "/usr/local/bin/check-file-integrity.sh" ]; then
    log "File Integrity Monitoring aktiv"
else
    warn "File Integrity Monitoring nicht aktiv"
fi

# Prüfe auf Dependency-Verifizierung
if [ -f "$APP_DIR/package-lock.json" ]; then
    log "package-lock.json vorhanden (Dependency-Verifizierung)"
else
    warn "package-lock.json nicht gefunden"
fi

# A09:2021 – Security Logging and Monitoring Failures
info "A09: Logging Failures prüfen..."
# Prüfe auf Security-Logging
if [ -f "/var/log/omnireflect-security.log" ]; then
    log "Security-Logging aktiv"
    LOG_SIZE=$(stat -f%z /var/log/omnireflect-security.log 2>/dev/null || stat -c%s /var/log/omnireflect-security.log 2>/dev/null || echo "0")
    if [ "$LOG_SIZE" -gt 0 ]; then
        log "Security-Logs vorhanden: ${LOG_SIZE} bytes"
    fi
else
    warn "Security-Logging nicht aktiv"
fi

# Prüfe auf Monitoring
if crontab -l 2>/dev/null | grep -q "monitor-security"; then
    log "Security-Monitoring aktiv (Cron)"
else
    warn "Security-Monitoring nicht in Cron"
fi

# Prüfe auf Alerts
if [ -f "/usr/local/bin/send-security-alert.sh" ] || [ -f "/usr/local/bin/send-webhook-alert.sh" ]; then
    log "Alert-System konfiguriert"
else
    warn "Kein Alert-System konfiguriert"
fi

# A10:2021 – Server-Side Request Forgery (SSRF)
info "A10: SSRF prüfen..."
# Prüfe auf fetch/request mit User-Input
if grep -r "fetch\|request\|http\|https" "$APP_DIR/src" 2>/dev/null | grep -v node_modules | grep -qE "\$\{|req\.|query\.|body\."; then
    warn "Mögliche SSRF-Gefahr - prüfe URL-Validierung bei fetch/request"
else
    log "Keine offensichtliche SSRF-Gefahr gefunden"
fi

# Zusätzliche Checks
info "Zusätzliche Security-Checks..."

# CORS-Konfiguration
if grep -r "cors\|CORS\|Access-Control" "$APP_DIR/src" 2>/dev/null | grep -v node_modules > /dev/null; then
    log "CORS konfiguriert"
else
    warn "Keine CORS-Konfiguration gefunden"
fi

# Content Security Policy
if grep -q "Content-Security-Policy" "$APP_DIR/nginx-reflect.conf" 2>/dev/null; then
    log "Content Security Policy in Nginx konfiguriert"
else
    warn "Content Security Policy nicht in Nginx konfiguriert"
fi

# XSS-Schutz
if grep -r "sanitize\|escape\|xss" "$APP_DIR/src" 2>/dev/null | grep -v node_modules > /dev/null; then
    log "XSS-Schutz implementiert"
else
    warn "Kein expliziter XSS-Schutz gefunden (React sollte XSS verhindern)"
fi

# Zusammenfassung
echo ""
echo -e "${BLUE}=============================================="
echo "OWASP Security Check abgeschlossen"
echo "=============================================="
echo -e "${NC}"
echo "Gefundene Probleme: $ISSUES"
echo "Warnungen: $WARNINGS"
echo ""
echo "Detaillierter Report: $REPORT_FILE"
echo ""

if [ "$ISSUES" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
    log "✅ Keine Sicherheitsprobleme gefunden!"
    exit 0
elif [ "$ISSUES" -eq 0 ]; then
    warn "⚠️  $WARNINGS Warnungen gefunden - prüfe Report"
    exit 0
else
    error "❌ $ISSUES kritische Probleme gefunden!"
    exit 1
fi

