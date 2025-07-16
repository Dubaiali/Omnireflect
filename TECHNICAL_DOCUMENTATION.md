# Technische Dokumentation: Omnireflect

## 📋 Übersicht

Omnireflect ist eine Next.js-Anwendung für personalisierte Mitarbeiterentwicklungsgespräche in der Augenoptik-Branche. Die Anwendung generiert maßgeschneiderte Reflexionsfragen basierend auf dem Rollenkontext des Benutzers.

## 🏗️ Architektur

### Frontend
- **Framework:** Next.js 15.3.5 mit App Router
- **Styling:** Tailwind CSS
- **State Management:** Zustand mit Persistierung
- **Build Tool:** Turbopack

### Backend
- **API Routes:** Next.js API Routes
- **AI Integration:** OpenAI GPT-3.5-turbo
- **Authentication:** Session-basiert mit JWT
- **Database:** Lokale JSON-Datei (users.json)

## 🔧 Installation & Setup

### Voraussetzungen
- Node.js 18+
- npm oder yarn
- OpenAI API-Schlüssel

### Installation
```bash
# Repository klonen
git clone <repository-url>
cd Omnireflect

# Dependencies installieren
npm install

# Umgebungsvariablen konfigurieren
cp env.example .env.local
# OPENAI_API_KEY in .env.local eintragen

# Entwicklungsserver starten
npm run dev
```

### Umgebungsvariablen (.env.local)
```env
# OpenAI API Configuration
OPENAI_API_KEY=sk-proj-your-openai-api-key

# Security Configuration
PASSWORD_SALT=your-super-secure-random-salt
JWT_SECRET=your-super-secure-jwt-secret

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-super-secure-admin-password

# Hash List (JSON string)
HASH_LIST=[{"hashId":"abc123","password":"test123","name":"Max Mustermann","department":"IT","status":"pending"}]

# Environment
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=50
RATE_LIMIT_WINDOW_MS=900000

# Session Configuration
SESSION_SECRET=your-super-secure-session-secret
SESSION_MAX_AGE=86400
```

## 🚀 Deployment

### Produktions-Deployment
```bash
# Build erstellen
npm run build

# Produktionsserver starten
npm start
```

### Docker Deployment
```bash
# Docker Image bauen
docker build -t omnireflect .

# Container starten
docker run -p 3000:3000 omnireflect
```

## 📁 Projektstruktur

```
Omnireflect/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Authentifizierung
│   │   │   └── gpt/           # OpenAI Integration
│   │   ├── login/             # Login-Seite
│   │   ├── welcome/           # Willkommensseite
│   │   ├── role-context/      # Rollenkontext-Formular
│   │   ├── questions/         # Fragen-Seite
│   │   └── summary/           # Zusammenfassung
│   ├── components/            # React-Komponenten
│   ├── lib/                   # Utility-Funktionen
│   └── state/                 # State Management
├── public/                    # Statische Dateien
├── .env.local                 # Umgebungsvariablen
└── users.json                 # Benutzer-Daten
```

## 🔐 Authentifizierung

### Benutzer-Management
- **Datei:** `users.json`
- **Format:** JSON-Array mit Benutzer-Objekten
- **Hash-Verfahren:** SHA-256 mit Salt

### Session-Management
- **JWT-basiert** mit sicheren Cookies
- **Automatische Abmeldung** nach 24 Stunden
- **Persistierung** im Browser-LocalStorage

## 🤖 AI-Integration

### OpenAI API
- **Model:** gpt-3.5-turbo
- **Endpoints:**
  - `/api/gpt/questions` - Fragengenerierung
  - `/api/gpt/followup` - Nachfragen
  - `/api/gpt/summary` - Zusammenfassung

### Prompt-Engineering
- **Kontext:** Rollenkontext des Benutzers
- **Kategorien:** 12 spezifische Reflexionskategorien
- **Personalisierung:** Name und Arbeitsbereich integriert

## 📊 State Management

### Zustand Store (sessionStore.ts)
```typescript
interface SessionState {
  hashId: string | null
  isAuthenticated: boolean
  progress: {
    currentStep: number
    answers: Record<string, string>
    followUpQuestions: Record<string, string[]>
    summary: string | null
  }
  roleContext: RoleContext | null
  questions: any[] | null
  roleContextHash: string | null
}
```

### Persistierung
- **Lokale Speicherung:** Browser LocalStorage
- **Sicherheit:** Keine sensiblen Daten im Storage
- **Reset:** Bei jedem Login werden Antworten zurückgesetzt

## 🔄 Workflow

### 1. Authentifizierung
```
Login → Session-Token → Welcome-Seite
```

### 2. Rollenkontext
```
Willkommensseite → Rollenkontext-Formular → Speicherung
```

### 3. Fragengenerierung
```
Rollenkontext → OpenAI API → 12 personalisierte Fragen
```

### 4. Reflexion
```
Fragen beantworten → Follow-up-Fragen → Zusammenfassung
```

## 🛡️ Sicherheit

### Datenschutz
- **Lokale Speicherung:** Alle Daten bleiben im Browser
- **Keine Server-Speicherung:** Antworten werden nicht dauerhaft gespeichert
- **Anonymisierung:** Keine personenbezogenen Daten in Logs

### API-Sicherheit
- **Rate Limiting:** 50 Requests pro 15 Minuten
- **Input Validation:** Sanitization aller Eingaben
- **Session-Validierung:** JWT-basierte Authentifizierung

## 🧪 Testing

### API-Tests
```bash
# Login testen
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"hashId": "mitarbeiter1", "password": "OmniReflect2024!"}'

# Fragengenerierung testen
curl -X POST http://localhost:3000/api/gpt/questions \
  -H "Content-Type: application/json" \
  -d '{"roleContext": {...}}'
```

### Frontend-Tests
```bash
# Entwicklungsserver starten
npm run dev

# Browser öffnen
open http://localhost:3000
```

## 📈 Performance

### Optimierungen
- **Turbopack:** Schnelle Entwicklung
- **Code Splitting:** Automatisch durch Next.js
- **Image Optimization:** Next.js Image Component
- **Caching:** Browser-Caching für statische Assets

### Monitoring
- **Server-Logs:** Next.js Development Server
- **API-Response-Times:** OpenAI API Monitoring
- **Error Tracking:** Browser Console

## 🐛 Bekannte Probleme & Lösungen

### Problem: Fragengenerierung funktioniert nicht
**Symptom:** API funktioniert, aber Frontend reagiert nicht
**Lösung:** State-Initialisierung korrigieren (siehe DEBUGGING.md)

### Problem: Rollenkontext wird übersprungen
**Symptom:** Direkte Weiterleitung zu Fragen
**Lösung:** useEffect-Logik in role-context/page.tsx anpassen

## 🔄 Updates & Wartung

### Regelmäßige Updates
- **Dependencies:** `npm update`
- **OpenAI API:** Neue Modelle evaluieren
- **Security:** Regelmäßige Sicherheitsupdates

### Backup-Strategie
- **Code:** Git Repository
- **Konfiguration:** .env.local (nicht im Git)
- **Benutzer-Daten:** users.json

## 📞 Support

### Logs sammeln
```bash
# Server-Logs
npm run dev 2>&1 | tee server.log

# Browser-Logs
# F12 → Console → Export
```

### Debugging-Tools
- **React DevTools:** Browser Extension
- **Network Tab:** API-Aufrufe überwachen
- **Console:** JavaScript-Fehler

---

**Version:** 1.4.1  
**Letzte Aktualisierung:** $(date)  
**Entwickler:** Omnireflect Team  
**Lizenz:** Proprietär 