# Omnireflect Deployment Guide v5.1.0

## 🌐 Produktionsumgebung

**Domain:** https://reflect.omni-scient.com  
**Server:** 194.55.13.15  
**Port:** 3002  
**Technologie:** Next.js 15.3.5, Nginx, Let's Encrypt SSL, PM2

## 📋 Voraussetzungen

- SSH-Zugang zum Server (root@194.55.13.15)
- Git-Repository mit aktueller Version
- OpenAI API-Key in .env.production
- Domain reflect.omni-scient.com (DNS A-Record auf 194.55.13.15)

## 🚀 Automatisches Deployment

### Schnellstart
```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

Das Skript führt automatisch alle notwendigen Schritte durch:
1. ✅ Voraussetzungen prüfen
2. ✅ Anwendung stoppen
3. ✅ Code deployen
4. ✅ Umgebungsvariablen konfigurieren
5. ✅ Production Build erstellen
6. ✅ PM2 konfigurieren und starten
7. ✅ Nginx konfigurieren
8. ✅ SSL-Zertifikat erstellen
9. ✅ Tests durchführen

## 🔧 Manuelles Deployment

### Schritt 1: Server vorbereiten
```bash
# Anwendung stoppen
ssh root@194.55.13.15 "pm2 stop reflect-app && pm2 delete reflect-app"

# Verzeichnis erstellen
ssh root@194.55.13.15 "mkdir -p /var/www/omnireflect"
```

### Schritt 2: Code deployen
```bash
# Repository klonen
ssh root@194.55.13.15 "cd /var/www/omnireflect && git clone https://github.com/Dubaiali/Omnireflect.git ."

# Dependencies installieren
ssh root@194.55.13.15 "cd /var/www/omnireflect && npm install"
```

### Schritt 3: Umgebungsvariablen konfigurieren
```bash
# .env.production kopieren
scp .env.production root@188.68.48.168:/var/www/omnireflect/.env.production

# .env.local erstellen
ssh root@188.68.48.168 "cd /var/www/omnireflect && cp .env.production .env.local"
```

### Schritt 4: Build erstellen
```bash
ssh root@188.68.48.168 "cd /var/www/omnireflect && npm run build -- --no-lint"
```

### Schritt 5: PM2 konfigurieren
```bash
# Logs-Verzeichnis erstellen
ssh root@188.68.48.168 "cd /var/www/omnireflect && mkdir -p logs"

# PM2 ecosystem file erstellen (siehe deploy-production.sh)

# Anwendung starten
ssh root@188.68.48.168 "cd /var/www/omnireflect && pm2 start ecosystem.config.js"

# PM2 konfigurieren
ssh root@188.68.48.168 "pm2 save && pm2 startup"
```

### Schritt 6: Nginx konfigurieren
```bash
# Konfiguration kopieren
scp nginx-reflect.conf root@188.68.48.168:/etc/nginx/sites-available/reflect.omni-scient.com.conf

# Aktivieren
ssh root@188.68.48.168 "ln -sf /etc/nginx/sites-available/reflect.omni-scient.com.conf /etc/nginx/sites-enabled/"

# Testen und neu laden
ssh root@188.68.48.168 "nginx -t && systemctl reload nginx"
```

### Schritt 7: SSL-Zertifikat erstellen
```bash
ssh root@188.68.48.168 "certbot --nginx -d reflect.omni-scient.com --non-interactive --agree-tos --email admin@omni-scient.com"
```

## 🔐 Umgebungsvariablen

### .env.production
```bash
OPENAI_API_KEY=sk-proj-your-openai-key-here
PASSWORD_SALT=your-super-secure-random-salt-here
JWT_SECRET=your-super-secure-jwt-secret-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=OmniAdmin2024!
NODE_ENV=production
```

## 📁 Server-Struktur

```
/var/www/omnireflect/
├── src/                    # Next.js Source Code
├── .next/                  # Build Output
├── node_modules/           # Dependencies
├── logs/                   # Application Logs
├── .env.local             # Environment Variables
├── .env.production        # Production Environment
├── ecosystem.config.js    # PM2 Configuration
├── package.json           # Package Configuration
└── nginx-reflect.conf     # Nginx Configuration
```

## 🔍 Monitoring & Logs

### Logs anzeigen
```bash
# PM2-Logs
ssh root@188.68.48.168 "pm2 logs reflect-app"

# App-Logs
ssh root@188.68.48.168 "tail -f /var/www/omnireflect/logs/combined.log"
```

### Status prüfen
```bash
# PM2-Status
ssh root@188.68.48.168 "pm2 status"

# Port-Status
ssh root@188.68.48.168 "netstat -tlnp | grep 3002"

# Nginx-Status
ssh root@188.68.48.168 "systemctl status nginx"
```

### Anwendung testen
```bash
# HTTP-Status
curl -I https://reflect.omni-scient.com/

# Admin-Login testen
curl -X POST https://reflect.omni-scient.com/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"OmniAdmin2024!"}'
```

## 🛠️ Wartung & Updates

### Code-Update
```bash
# Automatisch mit deploy-production.sh
./deploy-production.sh

# Oder manuell:
ssh root@188.68.48.168 "cd /var/www/omnireflect && git pull origin main"
ssh root@188.68.48.168 "cd /var/www/omnireflect && npm install && npm run build -- --no-lint"
ssh root@188.68.48.168 "pm2 restart reflect-app"
```

### SSL-Zertifikat erneuern
```bash
ssh root@188.68.48.168 "certbot renew --nginx"
```

## 🚨 Troubleshooting

### Anwendung startet nicht
```bash
# Logs prüfen
ssh root@188.68.48.168 "tail -50 /var/www/omnireflect/logs/combined.log"

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
```

## 📊 Zugangsdaten

### Admin-Zugang
- **Benutzername:** `admin`
- **Passwort:** `OmniAdmin2024!`

### Test-Mitarbeiter
- **Hash-ID:** `emp_md87yj1f_904c447c80694dc5`
- **Passwort:** `Tvr39RN%Jg$7`

## 🌟 Features v5.1.0

- ✅ KI-gestützte Mitarbeiterjahresgespräche
- ✅ Ausklapp-Funktionalität für Admin-Zusammenfassungen
- ✅ Anonymisierte Datenspeicherung
- ✅ PDF-Export-Funktionalität
- ✅ Admin-Dashboard
- ✅ Responsive Design
- ✅ DSGVO-konform
- ✅ Sichere HTTPS-Verbindung

## 📞 Support

Bei Problemen:
1. Logs prüfen: `ssh root@188.68.48.168 "pm2 logs reflect-app"`
2. Status prüfen: `ssh root@188.68.48.168 "pm2 status"`
3. GitHub Issues erstellen: https://github.com/Dubaiali/Omnireflect/issues

---

**Letzte Aktualisierung:** 26. Juli 2025  
**Version:** 5.1.0  
**Deployment-Status:** ✅ Produktiv 