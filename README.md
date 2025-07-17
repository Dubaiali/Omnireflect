# Omnireflect

Eine KI-gestützte Plattform zur Vorbereitung auf Mitarbeiterjahresgespräche mit HashID-basiertem Login-System.

## 📚 Dokumentation

- **[Technische Dokumentation](TECHNICAL_DOCUMENTATION.md)** - Vollständige technische Details
- **[Debugging-Dokumentation](DEBUGGING.md)** - Bekannte Probleme und Lösungen
- **[Deployment-Anleitung](DEPLOYMENT.md)** - Produktions-Deployment

## 🔧 Wichtige Hinweise

### Bekannte Probleme & Lösungen
- **Fragengenerierung funktioniert nicht:** Siehe [DEBUGGING.md](DEBUGGING.md) für die Lösung
- **Rollenkontext wird übersprungen:** Bereits behoben in Version 2.1.0

### Sicherheit
- HashID-basiertes Login-System für sichere Authentifizierung
- Alle Benutzerdaten werden lokal im Browser gespeichert
- Keine dauerhafte Server-Speicherung von Antworten
- OpenAI API-Schlüssel muss in `.env.local` konfiguriert werden

## 🌐 Live-Anwendung

**Produktionsumgebung:** https://reflect.omni-scient.com

## 🚀 Features

- ✅ HashID-basiertes Login-System
- ✅ Admin-Dashboard für HashID-Verwaltung
- ✅ KI-gestützte Mitarbeiterjahresgespräche
- ✅ Personalisierte Zusammenfassungen mit strukturierter Darstellung
- ✅ Anonymisierte Datenspeicherung
- ✅ PDF-Export-Funktionalität
- ✅ Responsive Design
- ✅ DSGVO-konform
- ✅ Sichere HTTPS-Verbindung

## 🛠️ Technologie-Stack

- **Frontend:** Next.js 15.3.5, React, TypeScript
- **Styling:** Tailwind CSS
- **AI:** OpenAI GPT-3.5-turbo API
- **Authentication:** HashID-basiert mit JWT
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

### HashID-Login-System

Das System verwendet ein HashID-basiertes Login-System für maximale Sicherheit:

#### Test-Mitarbeiter (HashIDs)
- **Hash-ID:** `abc123` | **Passwort:** `test123` | **Name:** Max Mustermann (IT)
- **Hash-ID:** `def456` | **Passwort:** `test456` | **Name:** Anna Schmidt (Marketing)

#### Admin-Zugang
- **URL:** `http://localhost:3000/admin`
- **Benutzername:** `admin`
- **Passwort:** `OmniAdmin2024!`

### HashID-Verwaltung

Über den Admin-Bereich können neue HashIDs für echte Mitarbeiter erstellt werden:
1. Admin-Login unter `/admin`
2. HashID-Manager öffnen
3. Neue HashIDs erstellen oder importieren
4. CSV-Export für Mitarbeiter-Zugangsdaten

## 📁 Projektstruktur

```
Omnireflect/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── admin/          # Admin-Dashboard mit HashID-Manager
│   │   ├── api/            # API-Routes
│   │   │   ├── auth/       # HashID-Login & Admin-Login
│   │   │   ├── gpt/        # OpenAI Integration
│   │   │   └── hash-list/  # HashID-Verwaltung
│   │   ├── login/          # HashID-Login-Seite
│   │   ├── questions/      # Fragen-Seite
│   │   ├── role-context/   # Rollenkontext-Formular
│   │   ├── summary/        # Zusammenfassung mit PDF-Export
│   │   └── welcome/        # Willkommensseite
│   ├── components/         # React-Komponenten
│   │   ├── HashIDManager.tsx  # HashID-Verwaltung
│   │   ├── LoginForm.tsx      # HashID-Login
│   │   └── PDFDownload.tsx    # PDF-Export
│   ├── lib/               # Utilities und Services
│   │   ├── hashList.ts    # HashID-Verwaltung
│   │   └── session.ts     # Session-Management
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

### HashID-Login-System
- Sichere HashID-basierte Authentifizierung
- Admin-Dashboard für HashID-Verwaltung
- CSV-Export für Mitarbeiter-Zugangsdaten
- Automatische HashID-Generierung

### KI-gestützte Gesprächsvorbereitung
- Automatische Generierung von Fragen basierend auf Rolle und Kontext
- Personalisierte Zusammenfassungen mit strukturierter Darstellung
- Intelligente Nachfragen für tiefere Einblicke
- 12 spezifische Reflexionskategorien

### Datenschutz
- Anonymisierte Datenspeicherung
- DSGVO-konforme Verarbeitung
- Sichere HTTPS-Verbindung
- Keine dauerhafte Server-Speicherung

### Benutzerfreundlichkeit
- Responsive Design für alle Geräte
- Intuitive Benutzeroberfläche
- PDF-Export-Funktionalität
- Strukturierte Zusammenfassungsdarstellung

## 🚨 Troubleshooting

### Häufige Probleme

1. **Admin-Login funktioniert nicht**
   ```bash
   # Prüfe .env.local Konfiguration
   cat .env.local | grep ADMIN
   # Sollte enthalten: ADMIN_PASSWORD=OmniAdmin2024!
   ```

2. **HashID-Login funktioniert nicht**
   ```bash
   # Prüfe Hash-Liste
   curl http://localhost:3000/api/hash-list
   ```

3. **Anwendung startet nicht**
   ```bash
   ./monitor.sh --logs
   ssh root@188.68.48.168 "tail -f /var/www/omnireflect/logs/omnireflect.log"
   ```

4. **SSL-Probleme**
   ```bash
   ssh root@188.68.48.168 "certbot certificates"
   ssh root@188.68.48.168 "certbot --nginx -d reflect.omni-scient.com"
   ```

5. **Nginx-Fehler**
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

- [x] HashID-Login-System ✅
- [x] Admin-Dashboard ✅
- [x] Strukturierte Zusammenfassungen ✅
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

---

**Letzte Aktualisierung:** 9. Juli 2025  
**Version:** Omni3-Branch  
**Status:** ✅ Produktiv
