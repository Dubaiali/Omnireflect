# OmniReflect - Mitarbeiter:innen-Reflexion & Entwicklungsgespräch

Ein modernes Web-basiertes System zur Durchführung von Mitarbeiter:innen-Reflexionen und Entwicklungsgesprächen mit KI-gestützter Fragengenerierung.

## 🚀 Features

### Für Mitarbeiter:innen
- **Persönliche Reflexion**: Individuelle Selbstreflexion mit maßgeschneiderten Fragen
- **Rollenkontext**: Erfassung von Arbeitsbereich, Funktion und Erfahrung
- **KI-gestützte Fragen**: Dynamische Fragengenerierung basierend auf dem Rollenkontext
- **Nachfragen**: Intelligente Follow-up-Fragen für vertiefende Reflexion
- **Zusammenfassung**: Automatische Generierung einer strukturierten Zusammenfassung
- **PDF-Export**: Professionelle Dokumentation als PDF

### Für Administratoren
- **Zugangsverwaltung**: Zentrale Verwaltung aller Mitarbeiter-Zugänge
- **Admin-Dashboard**: Übersicht aller Reflexionen mit Statistiken
- **Bulk-Generierung**: Massenerstellung von Mitarbeiter-Zugängen
- **Export-Funktionen**: CSV/JSON-Export für externe Verarbeitung
- **Passwort-Management**: Sichere Passwort-Zurücksetzung
- **Admin-Verwaltung**: Mehrere Administrator-Accounts möglich

## 🛠️ Technologie-Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **KI-Integration**: OpenAI GPT-4 API
- **Authentifizierung**: Session-basierte Authentifizierung
- **Datenpersistierung**: Lokale JSON-Dateien + localStorage
- **PDF-Generierung**: Browser-basierte PDF-Erstellung

## 📋 Voraussetzungen

- Node.js 18+ 
- npm oder yarn
- OpenAI API-Key

## 🔧 Installation

1. **Repository klonen**
   ```bash
   git clone <repository-url>
   cd Omnireflect
   ```

2. **Abhängigkeiten installieren**
   ```bash
   npm install
   ```

3. **Umgebungsvariablen konfigurieren**
   ```bash
   cp env.example .env.local
   ```
   
   Bearbeiten Sie `.env.local`:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=OmniAdmin2024!
   ```

4. **Entwicklungsserver starten**
   ```bash
   npm run dev
   ```

5. **Anwendung öffnen**
   ```
   http://localhost:3000
   ```

## 🔐 Zugangsdaten

### Standard-Admin
- **URL**: http://localhost:3000/admin
- **Benutzername**: `admin`
- **Passwort**: `OmniAdmin2024!`

### Mitarbeiter-Zugänge
- **URL**: http://localhost:3000/login
- **Hash-ID**: Wird vom Administrator erstellt
- **Passwort**: Wird vom Administrator vergeben

## 📁 Projektstruktur

```
Omnireflect/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Admin-Bereich
│   │   ├── api/               # API-Routen
│   │   ├── login/             # Mitarbeiter-Login
│   │   ├── questions/         # Reflexionsfragen
│   │   ├── role-context/      # Rollenkontext-Erfassung
│   │   ├── summary/           # Zusammenfassung
│   │   └── welcome/           # Willkommensseite
│   ├── components/            # React-Komponenten
│   ├── lib/                   # Utility-Funktionen
│   └── state/                 # Zustandsverwaltung
├── data/                      # Persistente Daten
├── public/                    # Statische Assets
└── docs/                      # Dokumentation
```

## 🔄 Workflow

### 1. Administrator-Setup
1. Admin-Login unter `/admin`
2. Mitarbeiter-Zugänge erstellen (einzeln oder Bulk)
3. Zugangsdaten an Mitarbeiter weitergeben

### 2. Mitarbeiter-Reflexion
1. Login mit Hash-ID und Passwort
2. Rollenkontext erfassen
3. KI-generierte Fragen beantworten
4. Nachfragen beantworten (optional)
5. Zusammenfassung generieren
6. PDF exportieren (optional)

### 3. Admin-Überwachung
1. Dashboard mit Übersicht aller Reflexionen
2. Status-Tracking (Ausstehend/In Bearbeitung/Abgeschlossen)
3. Export-Funktionen für externe Verarbeitung

## 🎯 API-Endpunkte

### Authentifizierung
- `POST /api/auth/login` - Mitarbeiter-Login
- `POST /api/auth/admin-login` - Admin-Login
- `POST /api/auth/logout` - Logout

### Hash-ID-Management
- `GET /api/hash-list` - Hash-Liste abrufen
- `POST /api/hash-list` - Hash-ID erstellen/aktualisieren

### Admin-Credentials
- `GET /api/admin-credentials` - Admin-Liste abrufen
- `POST /api/admin-credentials` - Admin erstellen
- `DELETE /api/admin-credentials` - Admin löschen

### KI-Integration
- `POST /api/gpt/questions` - Fragen generieren
- `POST /api/gpt/followup` - Nachfragen generieren
- `POST /api/gpt/summary` - Zusammenfassung generieren

## 🔒 Sicherheit

- **Passwort-Hashing**: SHA-256 mit Salt
- **Session-Management**: Sichere Session-Tokens
- **Input-Validierung**: Umfassende Validierung aller Eingaben
- **CSRF-Schutz**: Session-basierte Authentifizierung
- **XSS-Schutz**: Input-Sanitization

## 📊 Datenstruktur

### HashEntry
```typescript
interface HashEntry {
  hashId: string
  password: string
  name?: string
  department?: string
  status: 'pending' | 'in_progress' | 'completed'
  lastAccess?: string
}
```

### StoredData
```typescript
interface StoredData {
  hashId: string
  answers: Record<string, string>
  followUpQuestions: Record<string, string[]>
  summary: string | null
  completedAt: string | null
  lastUpdated: string
  roleContext?: RoleContext
}
```

## 🚀 Deployment

### Produktionsumgebung
1. Umgebungsvariablen für Produktion konfigurieren
2. Build erstellen: `npm run build`
3. Server starten: `npm start`

### Docker (optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🐛 Troubleshooting

### Häufige Probleme

1. **Admin-Login funktioniert nicht**
   - Überprüfen Sie die Umgebungsvariablen in `.env.local`
   - Stellen Sie sicher, dass Admin-Credentials existieren

2. **KI-Fragen werden nicht generiert**
   - Überprüfen Sie den OpenAI API-Key
   - Prüfen Sie die API-Limits

3. **Daten werden nicht gespeichert**
   - Überprüfen Sie die Schreibrechte im `data/` Verzeichnis
   - Prüfen Sie die Browser-Konsole auf Fehler

### Debug-Modus
- Debug-API: `GET /api/debug`
- Zeigt Systemstatus und Test-Ergebnisse

## 📝 Changelog

### Version 4.0.0
- ✅ Komplette Zugangsverwaltung implementiert
- ✅ Admin-Dashboard mit Statistiken
- ✅ Bulk-Generierung von Zugängen
- ✅ Passwort-Sichtbarkeit für Admin-Bereich
- ✅ Export-Funktionen (CSV/JSON)
- ✅ Mehrere Administrator-Accounts
- ✅ Verbesserte UI/UX

### Version 3.0.0
- ✅ KI-gestützte Fragengenerierung
- ✅ Rollenkontext-Integration
- ✅ Nachfragen-System
- ✅ Automatische Zusammenfassung

### Version 2.0.0
- ✅ Session-basierte Authentifizierung
- ✅ Hash-ID-System
- ✅ Grundlegende Admin-Funktionen

### Version 1.0.0
- ✅ Basis-Reflexionssystem
- ✅ Einfache Fragebögen
- ✅ PDF-Export

## 🤝 Beitragen

1. Fork des Repositories
2. Feature-Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add some AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request erstellen

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe [LICENSE](LICENSE) Datei für Details.

## 📞 Support

Bei Fragen oder Problemen:
- Erstellen Sie ein Issue im GitHub Repository
- Kontaktieren Sie das Entwicklungsteam

---

**OmniReflect** - Moderne Mitarbeiter:innen-Reflexion mit KI-Unterstützung 🚀
