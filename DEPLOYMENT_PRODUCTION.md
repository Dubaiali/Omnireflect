# OmniReflect - Produktions-Deployment

Diese Dokumentation beschreibt das Deployment von OmniReflect in einer Produktionsumgebung.

## 🚀 Schnellstart

### 1. Server-Vorbereitung
```bash
# Node.js 18+ installieren
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 installieren (Process Manager)
sudo npm install -g pm2

# Nginx installieren
sudo apt-get install nginx
```

### 2. Anwendung deployen
```bash
# Repository klonen
git clone <repository-url> /var/www/omnireflect
cd /var/www/omnireflect

# Abhängigkeiten installieren
npm ci --only=production

# Umgebungsvariablen konfigurieren
cp env.example .env.production
nano .env.production

# Build erstellen
npm run build

# PM2 starten
pm2 start npm --name "omnireflect" -- start
pm2 save
pm2 startup
```

### 3. Nginx konfigurieren
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 Umgebungsvariablen

### Produktions-Umgebung (.env.production)
```env
# OpenAI API
OPENAI_API_KEY=sk-proj-your-production-key

# Admin-Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=SecureProductionPassword2024!

# Sicherheit
NODE_ENV=production
PASSWORD_SALT=your-secure-salt-here

# Optional: Datenbank (falls verwendet)
DATABASE_URL=your-database-url
```

### Wichtige Sicherheitshinweise
- **Starke Passwörter verwenden**: Mindestens 16 Zeichen, Sonderzeichen
- **API-Keys schützen**: Niemals in Git committen
- **HTTPS erzwingen**: SSL/TLS-Zertifikate konfigurieren
- **Firewall konfigurieren**: Nur notwendige Ports öffnen

## 🛡️ Sicherheitskonfiguration

### SSL/TLS mit Let's Encrypt
```bash
# Certbot installieren
sudo apt-get install certbot python3-certbot-nginx

# SSL-Zertifikat erstellen
sudo certbot --nginx -d your-domain.com

# Auto-Renewal konfigurieren
sudo crontab -e
# Fügen Sie hinzu: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Firewall (UFW)
```bash
# UFW aktivieren
sudo ufw enable

# Standard-Ports öffnen
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 3000

# Status prüfen
sudo ufw status
```

### Nginx Security Headers
```nginx
# In nginx.conf oder server block
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

## 📊 Monitoring & Logging

### PM2 Monitoring
```bash
# Status prüfen
pm2 status

# Logs anzeigen
pm2 logs omnireflect

# Monitoring Dashboard
pm2 monit

# Metriken exportieren
pm2 install pm2-server-monit
```

### Nginx Logs
```bash
# Access Logs
sudo tail -f /var/log/nginx/access.log

# Error Logs
sudo tail -f /var/log/nginx/error.log
```

### Application Logs
```bash
# PM2 Logs
pm2 logs omnireflect --lines 100

# System Logs
sudo journalctl -u nginx -f
```

## 🔄 Backup & Recovery

### Automatische Backups
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/omnireflect"

# Datenverzeichnis sichern
tar -czf "$BACKUP_DIR/data_$DATE.tar.gz" /var/www/omnireflect/data/

# Umgebungsvariablen sichern
cp /var/www/omnireflect/.env.production "$BACKUP_DIR/env_$DATE"

# Alte Backups löschen (älter als 30 Tage)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "env_*" -mtime +30 -delete
```

### Cron-Job für Backups
```bash
# Crontab bearbeiten
crontab -e

# Tägliches Backup um 2:00 Uhr
0 2 * * * /path/to/backup.sh
```

### Recovery-Prozedur
```bash
# Anwendung stoppen
pm2 stop omnireflect

# Backup wiederherstellen
tar -xzf backup/data_20240725_020000.tar.gz -C /var/www/omnireflect/

# Umgebungsvariablen wiederherstellen
cp backup/env_20240725_020000 /var/www/omnireflect/.env.production

# Anwendung neu starten
pm2 start omnireflect
```

## 🔧 Wartung & Updates

### Update-Prozedur
```bash
# Backup erstellen
./backup.sh

# Code aktualisieren
cd /var/www/omnireflect
git pull origin main

# Abhängigkeiten aktualisieren
npm ci --only=production

# Build erstellen
npm run build

# Anwendung neu starten
pm2 restart omnireflect

# Status prüfen
pm2 status
curl -I http://localhost:3000
```

### Rollback-Prozedur
```bash
# Anwendung stoppen
pm2 stop omnireflect

# Vorherige Version wiederherstellen
git reset --hard HEAD~1

# Backup wiederherstellen
tar -xzf backup/data_$(date +%Y%m%d_%H%M%S).tar.gz -C /var/www/omnireflect/

# Anwendung neu starten
pm2 start omnireflect
```

## 📈 Performance-Optimierung

### Nginx Caching
```nginx
# Statische Assets cachen
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# API-Caching (vorsichtig)
location /api/ {
    proxy_cache_valid 200 5m;
    proxy_cache_valid 404 1m;
}
```

### PM2 Cluster-Modus
```bash
# Mehrere Instanzen starten
pm2 start npm --name "omnireflect" -i max -- start

# Load Balancer konfigurieren
pm2 install pm2-server-monit
```

### Memory-Optimierung
```bash
# Node.js Memory-Limits
export NODE_OPTIONS="--max-old-space-size=2048"

# PM2 Memory-Monitoring
pm2 install pm2-server-monit
```

## 🚨 Troubleshooting

### Häufige Probleme

#### 1. Anwendung startet nicht
```bash
# Logs prüfen
pm2 logs omnireflect

# Port-Konflikte prüfen
sudo netstat -tulpn | grep :3000

# Umgebungsvariablen prüfen
pm2 env omnireflect
```

#### 2. Nginx-Fehler
```bash
# Konfiguration testen
sudo nginx -t

# Nginx neu laden
sudo systemctl reload nginx

# Logs prüfen
sudo tail -f /var/log/nginx/error.log
```

#### 3. SSL-Probleme
```bash
# Zertifikat-Status prüfen
sudo certbot certificates

# Zertifikat erneuern
sudo certbot renew --dry-run
```

### Debug-Modus aktivieren
```bash
# Debug-Logs aktivieren
pm2 restart omnireflect -- --debug

# Umgebungsvariable setzen
export DEBUG=*
pm2 restart omnireflect
```

## 📞 Support & Monitoring

### Health Check
```bash
# Automatischer Health Check
curl -f http://localhost:3000/api/debug || exit 1
```

### Monitoring-Tools
- **PM2**: Process Management
- **Nginx**: Web Server & Load Balancer
- **Certbot**: SSL-Zertifikate
- **UFW**: Firewall
- **Cron**: Automatisierung

### Support-Kontakte
- **Entwicklungsteam**: [Email]
- **Server-Admin**: [Email]
- **Emergency**: [Phone]

---

**Wichtig**: Regelmäßige Backups und Updates sind essentiell für die Produktionsumgebung! 