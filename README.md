# Omnireflect

Eine KI-gestützte Plattform zur Vorbereitung auf Mitarbeiterjahresgespräche.

## 📚 Dokumentation

- **[Technische Dokumentation](TECHNICAL_DOCUMENTATION.md)** - Vollständige technische Details
- **[Debugging-Dokumentation](DEBUGGING.md)** - Bekannte Probleme und Lösungen
- **[Deployment-Anleitung](DEPLOYMENT.md)** - Produktions-Deployment

## 🔧 Wichtige Hinweise

### Bekannte Probleme & Lösungen
- **Fragengenerierung funktioniert nicht:** Siehe [DEBUGGING.md](DEBUGGING.md) für die Lösung
- **Rollenkontext wird übersprungen:** Bereits behoben in Version 1.4.1

### Sicherheit
- Alle Benutzerdaten werden lokal im Browser gespeichert
- Keine dauerhafte Server-Speicherung von Antworten
- OpenAI API-Schlüssel muss in `.env.local` konfiguriert werden

## 🌐 Live-Anwendung

**Produktionsumgebung:** https://reflect.omni-scient.com

## 🚀 Features

- ✅ KI-gestützte Mitarbeiterjahresgespräche
- ✅ Anonymisierte Datenspeicherung
- ✅ PDF-Export-Funktionalität
- ✅ Admin-Dashboard
- ✅ Responsive Design
- ✅ DSGVO-konform
- ✅ Sichere HTTPS-Verbindung

## 🛠️ Technologie-Stack

- **Frontend:** Next.js 15.3.5, React, TypeScript
- **Styling:** Tailwind CSS
- **AI:** OpenAI GPT-4 API
- **Server:** Nginx, Let's Encrypt SSL
- **Deployment:** SSH, PM2 (optional)

## 📋 Voraussetzungen

- Node.js 18+
- npm oder yarn
- SSH-Zugang zum Server
- OpenAI API-Key

## 🔧 Lokale Entwicklung

### Installation

```bash
# Repository klonen
git clone https://github.com/Dubaiali/Omnireflect.git
cd Omnireflect

# Branch wechseln
git checkout Omni3

# Dependencies installieren
npm install

# Umgebungsvariablen konfigurieren
cp env.example .env.local
# OPENAI_API_KEY in .env.local eintragen
```

### Entwicklungsserver starten

```bash
npm run dev
```

Die Anwendung ist dann unter http://localhost:3000 erreichbar.

### Build erstellen

```bash
npm run build
npm start
```

## 🚀 Deployment

### Schnellstart

```bash
# Deployment-Skript ausführen
./deploy-production.sh
```

### Manuelles Deployment

Siehe [DEPLOYMENT.md](./DEPLOYMENT.md) für detaillierte Anweisungen.

## 📊 Monitoring & Wartung

### Status prüfen

```bash
# Einmaliges Monitoring
./monitor.sh

# Mit Logs
./monitor.sh --logs

# Kontinuierliches Monitoring
./monitor.sh --watch
```

### Rollback (bei Problemen)

```bash
# Neuestes Backup wiederherstellen
./rollback.sh

# Spezifisches Backup wiederherstellen
./rollback.sh omnireflect-20250109-143022.tar.gz

# Verfügbare Backups anzeigen
./rollback.sh --list
```

## 🔐 Zugangsdaten

### Test-Mitarbeiter
- **Hash-ID:** `abc123` | **Passwort:** `test123`
- **Hash-ID:** `def456` | **Passwort:** `test456`
- **Hash-ID:** `ghi789` | **Passwort:** `test789`

### Admin-Zugang
- **Benutzername:** `admin`
- **Passwort:** `admin123`

## 📁 Projektstruktur

```
Omnireflect/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── admin/          # Admin-Dashboard
│   │   ├── api/            # API-Routes
│   │   ├── login/          # Login-Seite
│   │   ├── questions/      # Fragen-Seite
│   │   ├── summary/        # Zusammenfassung
│   │   └── welcome/        # Willkommensseite
│   ├── components/         # React-Komponenten
│   ├── lib/               # Utilities und Services
│   └── state/             # Zustandsverwaltung
├── public/                # Statische Dateien
├── deploy-production.sh   # Produktions-Deployment
├── rollback.sh           # Rollback-Skript
├── monitor.sh            # Monitoring-Skript
└── DEPLOYMENT.md         # Deployment-Dokumentation
```

## 🔧 Skripte

### Deployment-Skripte

- `deploy-production.sh` - Vollständiges Produktions-Deployment
- `rollback.sh` - Rollback bei Problemen
- `monitor.sh` - Anwendungs-Monitoring

### Verwendung

```bash
# Deployment
./deploy-production.sh

# Monitoring
./monitor.sh --watch

# Rollback
./rollback.sh --list
./rollback.sh
```

## 🌟 Features im Detail

### KI-gestützte Gesprächsvorbereitung
- Automatische Generierung von Fragen basierend auf Rolle und Kontext
- Personalisierte Zusammenfassungen
- Intelligente Nachfragen

### Datenschutz
- Anonymisierte Datenspeicherung
- DSGVO-konforme Verarbeitung
- Sichere HTTPS-Verbindung

### Benutzerfreundlichkeit
- Responsive Design für alle Geräte
- Intuitive Benutzeroberfläche
- PDF-Export-Funktionalität

## 🚨 Troubleshooting

### Häufige Probleme

1. **Anwendung startet nicht**
   ```bash
   ./monitor.sh --logs
   ssh root@188.68.48.168 "tail -f /var/www/omnireflect/logs/omnireflect.log"
   ```

2. **SSL-Probleme**
   ```bash
   ssh root@188.68.48.168 "certbot certificates"
   ssh root@188.68.48.168 "certbot --nginx -d reflect.omni-scient.com"
   ```

3. **Nginx-Fehler**
   ```bash
   ssh root@188.68.48.168 "nginx -t"
   ssh root@188.68.48.168 "systemctl status nginx"
   ```

### Support

Bei Problemen:
1. Logs prüfen: `./monitor.sh --logs`
2. Status prüfen: `./monitor.sh`
3. GitHub Issues erstellen: https://github.com/Dubaiali/Omnireflect/issues

## 📈 Roadmap

- [ ] Datenbank-Integration (Firebase/Supabase)
- [ ] Erweiterte Analytics
- [ ] Multi-Sprach-Support
- [ ] Mobile App
- [ ] API-Dokumentation

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

## 📞 Kontakt

- **GitHub:** https://github.com/Dubaiali/Omnireflect
- **Live-Anwendung:** https://reflect.omni-scient.com

---

**Letzte Aktualisierung:** 9. Juli 2025  
**Version:** Omni3-Branch  
**Status:** ✅ Produktiv
