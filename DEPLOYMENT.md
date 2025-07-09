# Omnireflect Deployment Guide

## 🌐 Produktionsumgebung

**Domain:** https://reflect.omni-scient.com  
**Server:** 188.68.48.168  
**Port:** 3002  
**Technologie:** Next.js 15.3.5, Nginx, Let's Encrypt SSL

## 📋 Voraussetzungen

- SSH-Zugang zum Server (root@188.68.48.168)
- Git-Repository mit Omni3-Branch
- OpenAI API-Key
- Domain reflect.omni-scient.com (DNS A-Record auf 188.68.48.168)

## 🚀 Schnellstart

### 1. Repository klonen und Branch wechseln
```bash
git clone https://github.com/Dubaiali/Omnireflect.git
cd Omnireflect
git checkout Omni3
```

### 2. Deployment ausführen
```bash
chmod +x deploy-clean.sh
./deploy-clean.sh
```

### 3. OpenAI-Key konfigurieren
```bash
ssh root@188.68.48.168 "cd /var/www/omnireflect && echo 'OPENAI_API_KEY=your-key-here' > .env.local"
```

### 4. Anwendung neu starten
```bash
ssh root@188.68.48.168 "pkill -f 'npm start' && cd /var/www/omnireflect && nohup npm start -- -p 3002 > logs/omnireflect.log 2>&1 &"
```

## 🔧 Manuelles Deployment

### Schritt 1: Server vorbereiten
```bash
# Anwendung stoppen
ssh root@188.68.48.168 "pkill -f 'npm start'"

# Verzeichnis erstellen
ssh root@188.68.48.168 "mkdir -p /var/www/omnireflect"
```

### Schritt 2: Code deployen
```bash
# Dateien kopieren
scp -r src package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs root@188.68.48.168:/var/www/omnireflect/

# Dependencies installieren
ssh root@188.68.48.168 "cd /var/www/omnireflect && npm install"

# Build erstellen
ssh root@188.68.48.168 "cd /var/www/omnireflect && npm run build -- --no-lint"
```

### Schritt 3: Nginx konfigurieren
```bash
# Konfiguration kopieren
scp nginx-reflect.conf root@188.68.48.168:/etc/nginx/sites-available/reflect.omni-scient.com.conf

# Aktivieren
ssh root@188.68.48.168 "ln -sf /etc/nginx/sites-available/reflect.omni-scient.com.conf /etc/nginx/sites-enabled/"

# Testen und neu laden
ssh root@188.68.48.168 "nginx -t && systemctl reload nginx"
```

### Schritt 4: SSL-Zertifikat erstellen
```bash
ssh root@188.68.48.168 "certbot --nginx -d reflect.omni-scient.com --non-interactive --agree-tos --email admin@omni-scient.com"
```

### Schritt 5: Anwendung starten
```bash
ssh root@188.68.48.168 "cd /var/www/omnireflect && mkdir -p logs && nohup npm start -- -p 3002 > logs/omnireflect.log 2>&1 &"
```

## 🔐 Umgebungsvariablen

### .env.local
```bash
OPENAI_API_KEY=sk-proj-your-openai-key-here
```

### Nächste Schritte für Produktion
- `NODE_ENV=production`
- `CUSTOM_KEY=your-custom-key`
- Datenbank-Integration (Firebase/Supabase)

## 📁 Server-Struktur

```
/var/www/omnireflect/
├── src/                    # Next.js Source Code
├── .next/                  # Build Output
├── node_modules/           # Dependencies
├── logs/                   # Application Logs
├── .env.local             # Environment Variables
├── package.json           # Package Configuration
└── next.config.ts         # Next.js Configuration
```

## 🔍 Monitoring & Logs

### Logs anzeigen
```bash
# Live-Logs
ssh root@188.68.48.168 "tail -f /var/www/omnireflect/logs/omnireflect.log"

# Letzte 100 Zeilen
ssh root@188.68.48.168 "tail -100 /var/www/omnireflect/logs/omnireflect.log"
```

### Status prüfen
```bash
# Prozess-Status
ssh root@188.68.48.168 "ps aux | grep 'npm start'"

# Port-Status
ssh root@188.68.48.168 "netstat -tlnp | grep 3002"

# Nginx-Status
ssh root@188.68.48.168 "systemctl status nginx"
```

### Anwendung testen
```bash
# HTTP-Status
curl -I https://reflect.omni-scient.com/

# Lokaler Test
ssh root@188.68.48.168 "curl -I http://localhost:3002/"
```

## 🛠️ Wartung & Updates

### Code-Update
```bash
# Lokaler Build
npm run build -- --no-lint

# Dateien aktualisieren
scp -r src root@188.68.48.168:/var/www/omnireflect/

# Server-Build
ssh root@188.68.48.168 "cd /var/www/omnireflect && npm run build -- --no-lint"

# Anwendung neu starten
ssh root@188.68.48.168 "pkill -f 'npm start' && cd /var/www/omnireflect && nohup npm start -- -p 3002 > logs/omnireflect.log 2>&1 &"
```

### SSL-Zertifikat erneuern
```bash
ssh root@188.68.48.168 "certbot renew --nginx"
```

### Backup erstellen
```bash
ssh root@188.68.48.168 "tar -czf /backup/omnireflect-$(date +%Y%m%d).tar.gz /var/www/omnireflect"
```

## 🚨 Troubleshooting

### Anwendung startet nicht
```bash
# Logs prüfen
ssh root@188.68.48.168 "tail -50 /var/www/omnireflect/logs/omnireflect.log"

# Port-Konflikte prüfen
ssh root@188.68.48.168 "netstat -tlnp | grep 3002"

# Dependencies neu installieren
ssh root@188.68.48.168 "cd /var/www/omnireflect && rm -rf node_modules package-lock.json && npm install"
```

### Nginx-Fehler
```bash
# Konfiguration testen
ssh root@188.68.48.168 "nginx -t"

# Nginx-Logs prüfen
ssh root@188.68.48.168 "tail -50 /var/log/nginx/error.log"
```

### SSL-Probleme
```bash
# Zertifikat-Status prüfen
ssh root@188.68.48.168 "certbot certificates"

# Zertifikat erneuern
ssh root@188.68.48.168 "certbot --nginx -d reflect.omni-scient.com"
```

## 🔒 Sicherheit

### Firewall
```bash
# UFW-Status prüfen
ssh root@188.68.48.168 "ufw status"

# Ports öffnen (falls nötig)
ssh root@188.68.48.168 "ufw allow 80 && ufw allow 443"
```

### Updates
```bash
# System-Updates
ssh root@188.68.48.168 "apt update && apt upgrade -y"

# Node.js-Updates (falls nötig)
ssh root@188.68.48.168 "npm update -g npm"
```

## 📊 Zugangsdaten

### Test-Mitarbeiter
- **Hash-ID:** `abc123` | **Passwort:** `test123`
- **Hash-ID:** `def456` | **Passwort:** `test456`
- **Hash-ID:** `ghi789` | **Passwort:** `test789`

### Admin-Zugang
- **Benutzername:** `admin`
- **Passwort:** `admin123`

## 🌟 Features

- ✅ KI-gestützte Mitarbeiterjahresgespräche
- ✅ Anonymisierte Datenspeicherung
- ✅ PDF-Export-Funktionalität
- ✅ Admin-Dashboard
- ✅ Responsive Design
- ✅ DSGVO-konform
- ✅ Sichere HTTPS-Verbindung

## 📞 Support

Bei Problemen:
1. Logs prüfen: `ssh root@188.68.48.168 "tail -f /var/www/omnireflect/logs/omnireflect.log"`
2. Status prüfen: `ssh root@188.68.48.168 "systemctl status nginx"`
3. GitHub Issues erstellen: https://github.com/Dubaiali/Omnireflect/issues

---

**Letzte Aktualisierung:** 9. Juli 2025  
**Version:** Omni3-Branch  
**Deployment-Status:** ✅ Produktiv 