# Omnireflect Production Deployment - reflect.omni-scient.com

## 🚀 Übersicht

Dieses Dokument beschreibt das verbesserte Deployment-Skript für die Omnireflect-Anwendung auf `reflect.omni-scient.com`. Das Skript wurde basierend auf den Erfahrungen des erfolgreichen Deployments optimiert.

## 📋 Voraussetzungen

### Server-Konfiguration
- **Server:** 188.68.48.168
- **Domain:** reflect.omni-scient.com
- **Port:** 3002 (separat von omni-scient.com)
- **Verzeichnis:** /var/www/omnireflect

### Lokale Voraussetzungen
- SSH-Zugang zum Server
- Git-Repository-Zugang
- Bash-Shell

## 🔧 Deployment-Skript

### Datei: `deploy-reflect-production.sh`

Das verbesserte Deployment-Skript enthält folgende Verbesserungen:

#### 1. **Port-Konflikt-Behandlung**
```bash
# Fallback: alle Prozesse auf Port 3002 beenden
ssh $SERVER "pkill -f 'next-server' || true"
ssh $SERVER "pkill -f 'next start' || true"
ssh $SERVER "pkill -f 'npm start' || true"

# Prüfen ob Port frei ist
if ssh $SERVER "netstat -tlnp | grep -q :$PORT"; then
    warn "Port $PORT ist noch belegt, versuche zu beenden..."
    ssh $SERVER "netstat -tlnp | grep :$PORT | awk '{print \$7}' | cut -d'/' -f1 | xargs kill -9 2>/dev/null || true"
    sleep 2
fi
```

#### 2. **Verbesserte PM2-Konfiguration**
```bash
# Direkte Next.js-Ausführung statt npm start
script: 'node_modules/.bin/next',
args: 'start -p $PORT',
```

#### 3. **Umfassende Tests**
- PM2-Status-Prüfung
- Port-Status-Prüfung
- Lokaler HTTP-Test
- Externer HTTP-Test
- SSL-Zertifikat-Test

#### 4. **Automatisches Backup**
- Backup vor jedem Deployment
- Automatische Bereinigung alter Backups (7 Tage)

#### 5. **Automatische Konfiguration**
- Admin-Credentials werden automatisch konfiguriert (`admin` / `OmniAdmin2024!`)
- OpenAI API-Key wird automatisch aus lokaler `.env.local` übertragen
- Admin-Credentials-Datei wird automatisch neu erstellt

## 🚀 Verwendung

### Deployment ausführen
```bash
./deploy-reflect-production.sh
```

**Hinweis:** Das Skript konfiguriert automatisch:
- Admin-Credentials: `admin` / `OmniAdmin2024!`
- OpenAI API-Key (aus lokaler `.env.local`)
- Port 3002
- Alle notwendigen Umgebungsvariablen

### Manueller Neustart
```bash
ssh root@188.68.48.168 "pm2 restart reflect-app"
```

### Status prüfen
```bash
ssh root@188.68.48.168 "pm2 status"
```

### Logs anzeigen
```bash
ssh root@188.68.48.168 "pm2 logs reflect-app"
```

## 📊 Monitoring

### PM2-Monitoring
```bash
# Status prüfen
ssh root@188.68.48.168 "pm2 status"

# Logs anzeigen
ssh root@188.68.48.168 "pm2 logs reflect-app --lines 50"

# Monitoring Dashboard
ssh root@188.68.48.168 "pm2 monit"
```

### Anwendungs-Logs
```bash
# Kombinierte Logs
ssh root@188.68.48.168 "tail -f /var/www/omnireflect/logs/combined.log"

# Error-Logs
ssh root@188.68.48.168 "tail -f /var/www/omnireflect/logs/err-0.log"

# Output-Logs
ssh root@188.68.48.168 "tail -f /var/www/omnireflect/logs/out-0.log"
```

### Nginx-Logs
```bash
# Access-Logs
ssh root@188.68.48.168 "tail -f /var/log/nginx/access.log"

# Error-Logs
ssh root@188.68.48.168 "tail -f /var/log/nginx/error.log"
```

## 🔧 Troubleshooting

### Häufige Probleme

#### 1. Port 3002 ist belegt
```bash
# Prozesse auf Port 3002 finden
ssh root@188.68.48.168 "netstat -tlnp | grep :3002"

# Prozess beenden
ssh root@188.68.48.168 "kill -9 [PID]"
```

#### 2. PM2-Neustart-Schleife
```bash
# PM2-Prozess stoppen
ssh root@188.68.48.168 "pm2 stop reflect-app"
ssh root@188.68.48.168 "pm2 delete reflect-app"

# Logs prüfen
ssh root@188.68.48.168 "tail -20 /var/www/omnireflect/logs/err-0.log"
```

#### 3. Build-Fehler
```bash
# Dependencies neu installieren
ssh root@188.68.48.168 "cd /var/www/omnireflect && npm install"

# Build erneut ausführen
ssh root@188.68.48.168 "cd /var/www/omnireflect && npm run build"
```

#### 4. Admin-Login funktioniert nicht
```bash
# Admin-Credentials prüfen
ssh root@188.68.48.168 "cd /var/www/omnireflect && cat .env.production | grep ADMIN_PASSWORD"

# Admin-Credentials-Datei löschen und neu erstellen
ssh root@188.68.48.168 "cd /var/www/omnireflect && rm -f data/admin-credentials.json && pm2 restart reflect-app"
```

#### 5. GPT-Funktionen funktionieren nicht
```bash
# OpenAI API-Key prüfen
ssh root@188.68.48.168 "cd /var/www/omnireflect && cat .env.production | grep OPENAI_API_KEY"

# API-Key manuell setzen (falls nötig)
ssh root@188.68.48.168 "cd /var/www/omnireflect && sed -i 's|OPENAI_API_KEY=.*|OPENAI_API_KEY=YOUR_API_KEY_HERE|' .env.production && pm2 restart reflect-app"
```

#### 4. SSL-Probleme
```bash
# SSL-Zertifikat erneuern
ssh root@188.68.48.168 "certbot renew --dry-run"

# Nginx neu laden
ssh root@188.68.48.168 "systemctl reload nginx"
```

## 🔄 Rollback-Prozedur

### Automatisches Rollback
```bash
# Backup wiederherstellen
ssh root@188.68.48.168 "cd /var/www/omnireflect && tar -xzf /backup/omnireflect/omnireflect-[DATE].tar.gz"

# Anwendung neu starten
ssh root@188.68.48.168 "pm2 restart reflect-app"
```

### Manuelles Rollback
```bash
# Anwendung stoppen
ssh root@188.68.48.168 "pm2 stop reflect-app"

# Code zurücksetzen
ssh root@188.68.48.168 "cd /var/www/omnireflect && git reset --hard HEAD~1"

# Anwendung neu starten
ssh root@188.68.48.168 "pm2 start reflect-app"
```

## 📈 Performance-Optimierung

### PM2-Cluster-Modus
```bash
# Mehrere Instanzen starten
ssh root@188.68.48.168 "pm2 start ecosystem.config.js -i max"
```

### Memory-Optimierung
```bash
# Node.js Memory-Limits setzen
export NODE_OPTIONS="--max-old-space-size=2048"
```

### Nginx-Caching
```nginx
# Statische Assets cachen
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🔒 Sicherheit

### Firewall-Konfiguration
```bash
# UFW aktivieren
ssh root@188.68.48.168 "ufw enable"

# Ports öffnen
ssh root@188.68.48.168 "ufw allow ssh"
ssh root@188.68.48.168 "ufw allow 'Nginx Full'"
```

### SSL-Zertifikat-Auto-Renewal
```bash
# Cron-Job für Auto-Renewal
ssh root@188.68.48.168 "crontab -e"
# Fügen Sie hinzu: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📞 Support

### Nützliche Befehle
```bash
# Anwendungsstatus
ssh root@188.68.48.168 "pm2 status"

# Admin-Credentials prüfen
ssh root@188.68.48.168 "cd /var/www/omnireflect && cat .env.production | grep -E 'ADMIN_USERNAME|ADMIN_PASSWORD'"

# OpenAI API-Key prüfen
ssh root@188.68.48.168 "cd /var/www/omnireflect && cat .env.production | grep OPENAI_API_KEY"

# System-Ressourcen
ssh root@188.68.48.168 "htop"

# Disk-Usage
ssh root@188.68.48.168 "df -h"

# Memory-Usage
ssh root@188.68.48.168 "free -h"
```

### Emergency-Kontakte
- **Server-Admin:** [Email]
- **Entwicklungsteam:** [Email]
- **Emergency:** [Phone]

---

## 🔑 Standard-Zugangsdaten

Nach dem Deployment sind folgende Zugangsdaten verfügbar:

### Admin-Panel
- **URL:** https://reflect.omni-scient.com/admin
- **Username:** `admin`
- **Password:** `OmniAdmin2024!`

### API-Endpoints
- **Admin-Login:** `POST /api/auth/admin-login`
- **HashID-Management:** `GET /api/hash-list` (nur für Admins)
- **GPT-Fragen:** `POST /api/gpt/questions`
- **GPT-Zusammenfassung:** `POST /api/gpt/summary`

---

**Wichtig:** Das Deployment-Skript ist speziell für `reflect.omni-scient.com` konfiguriert und beeinträchtigt nicht die Hauptanwendung auf `omni-scient.com`. 