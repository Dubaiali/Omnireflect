# Omnireflect Production Deployment Guide

## 🚀 **Produktionsumgebung - Version 2.2.2**

**Domain:** https://reflect.omni-scient.com  
**Server:** 188.68.48.168  
**Port:** 3002  
**Technologie:** Next.js 15.3.5, PM2, Nginx, Let's Encrypt SSL  
**Branch:** Omni3  
**Commit:** 2785865 (Version 2.2.2)

## 📋 **Systemanforderungen**

- **Node.js:** 20.19.4
- **npm:** 10.8.2
- **PM2:** Für Prozessmanagement
- **Nginx:** Als Reverse Proxy
- **Let's Encrypt:** Für SSL-Zertifikate

## 🔧 **Server-Setup**

### 1. Node.js 20.x installieren
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs build-essential python3
```

### 2. PM2 installieren
```bash
npm install -g pm2
```

### 3. Verzeichnisstruktur erstellen
```bash
mkdir -p /var/www/omnireflect
mkdir -p /backup/omnireflect
```

## 🚀 **Deployment-Prozess**

### **Option 1: Automatisches Deployment (Empfohlen)**
```bash
# Auf dem Server ausführen
cd /var/www/omnireflect
./deploy-pm2-server.sh
```

### **Option 2: Manuelles Deployment**
```bash
# 1. Branch wechseln
cd /var/www/omnireflect
git fetch
git checkout Omni3
git pull origin Omni3

# 2. Dependencies installieren
npm ci

# 3. Build erstellen
npm run build -- --no-lint

# 4. PM2 starten
pm2 delete reflect-app || true
pm2 start npm --name 'reflect-app' -- start -- -p 3002
pm2 save
```

## 🔐 **Umgebungsvariablen**

### .env.local konfigurieren
```bash
# OpenAI API Key setzen
echo 'OPENAI_API_KEY=sk-proj-dein-echter-key-hier' > .env.local

# Oder von lokaler Entwicklungsumgebung kopieren
scp .env.local root@188.68.48.168:/var/www/omnireflect/
```

### Erforderliche Umgebungsvariablen
```bash
OPENAI_API_KEY=sk-proj-your-openai-key-here
NODE_ENV=production
```

## 🌐 **Nginx-Konfiguration**

### 1. Nginx-Konfiguration erstellen
```bash
# Konfiguration kopieren
cp nginx-reflect.conf /etc/nginx/sites-available/reflect.omni-scient.com.conf

# Aktivieren
ln -sf /etc/nginx/sites-available/reflect.omni-scient.com.conf /etc/nginx/sites-enabled/

# Testen und neu laden
nginx -t && systemctl reload nginx
```

### 2. SSL-Zertifikat erstellen
```bash
certbot --nginx -d reflect.omni-scient.com --non-interactive --agree-tos --email admin@omni-scient.com
```

## 📊 **PM2-Konfiguration**

### PM2 Ecosystem File (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'reflect-app',
    script: 'npm',
    args: 'start -- -p 3002',
    cwd: '/var/www/omnireflect',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    error_file: '/var/www/omnireflect/logs/err.log',
    out_file: '/var/www/omnireflect/logs/out.log',
    log_file: '/var/www/omnireflect/logs/combined.log',
    time: true
  }]
}
```

### PM2-Befehle
```bash
# Status prüfen
pm2 status

# Logs anzeigen
pm2 logs reflect-app

# Anwendung neu starten
pm2 restart reflect-app

# Anwendung stoppen
pm2 stop reflect-app

# Anwendung löschen
pm2 delete reflect-app
```

## 🔍 **Monitoring & Wartung**

### 1. Logs überwachen
```bash
# PM2-Logs
pm2 logs reflect-app --lines 50

# Anwendungslogs
tail -f /var/www/omnireflect/logs/combined.log

# Nginx-Logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 2. System-Status prüfen
```bash
# Anwendungsstatus
curl -I https://reflect.omni-scient.com

# Port-Status
netstat -tlnp | grep 3002

# SSL-Zertifikat
certbot certificates
```

### 3. Backup erstellen
```bash
tar -czf /backup/omnireflect-$(date +%Y%m%d-%H%M%S).tar.gz /var/www/omnireflect
```

## 🔒 **Sicherheitskonfiguration**

### 1. Firewall (UFW)
```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

### 2. SSL-Zertifikat erneuern
```bash
certbot renew --nginx
```

### 3. System-Updates
```bash
apt update && apt upgrade -y
```

## 🚨 **Troubleshooting**

### Anwendung startet nicht
```bash
# PM2-Logs prüfen
pm2 logs reflect-app

# Port-Konflikte prüfen
netstat -tlnp | grep 3002

# Prozesse beenden
pkill -f 'npm start'
pkill -f 'next start'
```

### SSL-Probleme
```bash
# Zertifikat-Status prüfen
certbot certificates

# Nginx-Konfiguration testen
nginx -t

# Nginx neu laden
systemctl reload nginx
```

### Build-Fehler
```bash
# Node-Module löschen und neu installieren
rm -rf node_modules package-lock.json
npm ci

# Build ohne Linting
npm run build -- --no-lint
```

## 📋 **Zugangsdaten**

### Test-Benutzer
- **Hash-ID:** `mitarbeiter1`
- **Passwort:** `OmniReflect2024!`

### Admin-Zugang
- **Hash-ID:** `admin`
- **Passwort:** `admin123`

## 🔄 **Update-Prozess**

### 1. Code aktualisieren
```bash
cd /var/www/omnireflect
git pull origin Omni3
```

### 2. Dependencies aktualisieren
```bash
npm ci
```

### 3. Build erstellen
```bash
npm run build -- --no-lint
```

### 4. Anwendung neu starten
```bash
pm2 restart reflect-app
```

## 📞 **Support & Kontakt**

Bei Problemen:
1. PM2-Logs prüfen: `pm2 logs reflect-app`
2. Nginx-Status: `systemctl status nginx`
3. SSL-Zertifikat: `certbot certificates`
4. GitHub Issues: https://github.com/Dubaiali/Omnireflect/issues

## 📊 **Performance-Monitoring**

### PM2-Monitoring aktivieren
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### System-Ressourcen überwachen
```bash
# CPU und Memory
htop

# Disk-Usage
df -h

# PM2-Status
pm2 monit
```

---

**Letzte Aktualisierung:** 17. Juli 2025  
**Version:** 2.2.2  
**Deployment-Status:** ✅ Produktiv 