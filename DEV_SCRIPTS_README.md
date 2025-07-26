# Omnireflect Development Scripts

Diese Skripte ermöglichen eine einfache und zuverlässige Entwicklungsumgebung für Omnireflect.

## 📁 Verfügbare Skripte

### 🚀 `start-dev.sh` - Development Server starten

**Verwendung:**
```bash
./start-dev.sh
```

**Was das Skript macht:**
- ✅ Stoppt laufende Next.js Prozesse
- 🗑️ Löscht alte persistente Daten (Hash-Liste, Admin-Credentials)
- 🔧 Erstellt `.env.local` falls nicht vorhanden
- 📦 Installiert Dependencies falls nötig
- 🌐 Startet den Development Server
- 📋 Zeigt alle wichtigen URLs und Anmeldedaten

### 🛑 `stop-dev.sh` - Development Server stoppen

**Verwendung:**
```bash
./stop-dev.sh
```

**Was das Skript macht:**
- 🔍 Findet alle laufenden Next.js Prozesse
- ⏹️ Stoppt sie sauber
- 🔄 Erzwingt Beendigung falls nötig
- 🔍 Prüft ob Port 3000 frei ist

## 🔑 Standard-Anmeldedaten

Nach dem Start mit `start-dev.sh` stehen folgende Anmeldedaten zur Verfügung:

### 👤 Admin-Zugang
- **URL**: http://localhost:3000/admin
- **Benutzername**: `admin`
- **Passwort**: `OmniAdmin2024!`

### 👥 Mitarbeiter-Zugang
- **URL**: http://localhost:3000/login
- **HashID**: `emp_md87yj1f_904c447c80694dc5`
- **Passwort**: `gzrLG&bjRdTY`
- **Name**: Anna Schmidt
- **Abteilung**: IT

## 🌐 Verfügbare URLs

- **🏠 Hauptseite**: http://localhost:3000
- **🔐 Admin-Bereich**: http://localhost:3000/admin
- **👤 Mitarbeiter-Login**: http://localhost:3000/login
- **📊 Debug-API**: http://localhost:3000/api/debug

## ⚙️ Konfiguration

Das Skript erstellt automatisch eine `.env.local` Datei mit:
- ✅ OpenAI API Key (bereits konfiguriert)
- 🔐 Sichere Passwort-Salts und JWT-Secrets
- 👤 Admin- und Mitarbeiter-Credentials
- ⚡ Optimierte Development-Einstellungen

## 🛠️ Troubleshooting

### Problem: Port 3000 ist belegt
```bash
./stop-dev.sh
./start-dev.sh
```

### Problem: Anmeldung funktioniert nicht
```bash
./stop-dev.sh
rm -f data/hash-list.json data/admin-credentials.json
./start-dev.sh
```

### Problem: Dependencies fehlen
```bash
npm install
./start-dev.sh
```

## 📝 Logs

Die Anwendung zeigt detaillierte Logs im Terminal:
- 🔍 Validierungsprozesse
- 🔐 Authentifizierungsversuche
- 🤖 GPT-API Aufrufe
- 📊 Debug-Informationen

## 🎯 Empfohlener Workflow

1. **Erste Installation:**
   ```bash
   git clone <repository>
   cd Omnireflect
   ./start-dev.sh
   ```

2. **Tägliche Entwicklung:**
   ```bash
   ./start-dev.sh    # Morgens starten
   # ... Entwicklung ...
   ./stop-dev.sh     # Abends stoppen
   ```

3. **Bei Problemen:**
   ```bash
   ./stop-dev.sh
   ./start-dev.sh    # Automatische Bereinigung
   ```

## 🔒 Sicherheit

- 🔐 Alle Passwörter werden sicher gehashed
- 🛡️ JWT-Tokens für Session-Management
- 🔒 Rate-Limiting aktiviert
- 🧹 Automatische Bereinigung alter Daten

---

**💡 Tipp**: Die Skripte sind so konzipiert, dass sie immer eine saubere Entwicklungsumgebung bereitstellen, auch nach Problemen oder Konfigurationsänderungen. 