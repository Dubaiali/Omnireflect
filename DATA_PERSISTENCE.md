# Datenpersistenz bei Deployments

## 🔒 **Sicherstellung der Datenpersistenz**

### **Übersicht**
Das Omnireflect-System ist so konfiguriert, dass **alle wichtigen Daten bei Deployments automatisch gesichert und wiederhergestellt** werden.

### **Gesicherte Daten**

#### 📁 **Datenverzeichnis (`/var/www/omnireflect/data/`)**
- `hash-list.json` - Alle Mitarbeiter-Zugänge
- `summaries.json` - Alle generierten Zusammenfassungen
- `admin-credentials.json` - Admin-Zugangsdaten
- `deleted-hash-ids.json` - Blacklist gelöschter Mitarbeiter

#### ⚙️ **Konfigurationsdateien**
- `.env.production` - Produktionsumgebungsvariablen
- `.env.local` - Lokale Umgebungsvariablen

### **Automatische Sicherung**

#### 🚀 **Bei jedem Deployment:**
1. **Vor dem Deployment**: Alle Daten werden in `/tmp/omnireflect-backup/` gesichert
2. **Code-Update**: Neuer Code wird deployed
3. **Nach dem Deployment**: Alle gesicherten Daten werden wiederhergestellt

#### 📋 **Deployment-Skript (`deploy-production.sh`)**
```bash
# Zeile 95-99: Sicherung vor Deployment
ssh $SERVER "mkdir -p /tmp/omnireflect-backup"
ssh $SERVER "cp -r $APP_DIR/data /tmp/omnireflect-backup/"
ssh $SERVER "cp $APP_DIR/.env.local /tmp/omnireflect-backup/"
ssh $SERVER "cp $APP_DIR/.env.production /tmp/omnireflect-backup/"

# Zeile 115-119: Wiederherstellung nach Deployment
ssh $SERVER "mkdir -p $APP_DIR/data"
ssh $SERVER "cp -r /tmp/omnireflect-backup/data/* $APP_DIR/data/"
ssh $SERVER "cp /tmp/omnireflect-backup/.env.local $APP_DIR/"
ssh $SERVER "cp /tmp/omnireflect-backup/.env.production $APP_DIR/"
```

### **Blacklist-System**

#### 🛡️ **Gelöschte Mitarbeiter bleiben gelöscht**
- **Problem**: Mitarbeiter aus Umgebungsvariablen tauchten nach Neustart wieder auf
- **Lösung**: Blacklist-System in `deleted-hash-ids.json`
- **Funktion**: Gelöschte Hash-IDs werden permanent gespeichert und gefiltert

#### 🔧 **Technische Implementierung**
```typescript
// In getStaticHashList()
const deletedHashIds = JSON.parse(fs.readFileSync(BLACKLIST_FILE, 'utf8'))
const filteredEmployees = envEmployees.filter(employee => 
  !deletedHashIds.includes(employee.hashId)
)
```

### **Git-Sicherheit**

#### 🚫 **Daten sind NICHT in Git**
- `.gitignore` ignoriert das gesamte `data/` Verzeichnis
- Sensible Daten werden nie in das Repository hochgeladen
- Nur Code und Konfiguration sind in Git

#### 📋 **Gitignore-Konfiguration**
```gitignore
# data files
data/
*.json
!package.json
!package-lock.json
!tsconfig.json
!next.config.ts
!eslint.config.mjs
!postcss.config.mjs
```

### **Manuelle Sicherung**

#### 💾 **Backup erstellen**
```bash
# Nur Backup erstellen (kein Deployment)
./deploy-production.sh --backup

# Backup wird erstellt in: /var/backups/omnireflect/YYYYMMDD_HHMMSS/
```

#### 📊 **Backup-Inhalt**
- Alle Daten-Dateien (`data/`)
- Umgebungsvariablen (`.env.*`)
- Backup-Info mit Zeitstempel

### **Wiederherstellung**

#### 🔄 **Bei Problemen**
```bash
# 1. Backup-Verzeichnis finden
ssh root@188.68.48.168 "ls -la /var/backups/omnireflect/"

# 2. Daten wiederherstellen
ssh root@188.68.48.168 "cp -r /var/backups/omnireflect/YYYYMMDD_HHMMSS/data/* /var/www/omnireflect/data/"

# 3. Anwendung neu starten
ssh root@188.68.48.168 "pm2 restart reflect-app"
```

### **Überprüfung**

#### ✅ **Nach jedem Deployment prüfen**
```bash
# Anzahl Mitarbeiter prüfen
curl -s https://reflect.omni-scient.com/api/hash-list | jq '.hashList | length'

# Spezifischen Mitarbeiter prüfen
curl -s https://reflect.omni-scient.com/api/hash-list | jq '.hashList[] | select(.name == "Max Mustermann")'

# Admin-Login testen
curl -s -X POST https://reflect.omni-scient.com/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"username":"neueradmin","password":"NeuesPasswort2024"}' | jq .
```

### **Monitoring**

#### 📈 **Logs überwachen**
```bash
# PM2-Logs
ssh root@188.68.48.168 "pm2 logs reflect-app"

# Anwendungs-Logs
ssh root@188.68.48.168 "tail -f /var/www/omnireflect/logs/combined.log"

# Nginx-Logs
ssh root@188.68.48.168 "tail -f /var/log/nginx/access.log"
```

### **Sicherheitshinweise**

#### 🔐 **Wichtige Punkte**
1. **Daten sind lokal gespeichert** - Keine Cloud-Synchronisation
2. **Backups sind automatisch** - Bei jedem Deployment
3. **Gelöschte Mitarbeiter bleiben gelöscht** - Blacklist-System
4. **Keine Daten in Git** - Sensible Daten sind geschützt
5. **Umgebungsvariablen werden gesichert** - Konfiguration bleibt erhalten

### **Troubleshooting**

#### ❌ **Häufige Probleme**

**Problem**: Mitarbeiter verschwinden nach Deployment
- **Lösung**: Prüfe ob Backup erfolgreich war
- **Befehl**: `ssh root@188.68.48.168 "ls -la /tmp/omnireflect-backup/"`

**Problem**: Gelöschte Mitarbeiter tauchen wieder auf
- **Lösung**: Prüfe Blacklist-Datei
- **Befehl**: `ssh root@188.68.48.168 "cat /var/www/omnireflect/data/deleted-hash-ids.json"`

**Problem**: Admin-Login funktioniert nicht
- **Lösung**: Prüfe Admin-Credentials
- **Befehl**: `ssh root@188.68.48.168 "cat /var/www/omnireflect/data/admin-credentials.json"`

---

**Stand**: 28. Juli 2025  
**Version**: 5.1.0  
**Status**: ✅ Vollständig implementiert und getestet 