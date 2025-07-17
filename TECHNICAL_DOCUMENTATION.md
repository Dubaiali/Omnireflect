# Technische Dokumentation: Omnireflect

## 📋 Übersicht

Omnireflect ist eine Next.js-Anwendung für personalisierte Mitarbeiterentwicklungsgespräche mit HashID-basiertem Login-System. Die Anwendung generiert maßgeschneiderte Reflexionsfragen basierend auf dem Rollenkontext des Benutzers und bietet strukturierte Zusammenfassungen.

## 🏗️ Architektur

### Frontend
- **Framework:** Next.js 15.3.5 mit App Router
- **Styling:** Tailwind CSS
- **State Management:** Zustand mit Persistierung
- **Build Tool:** Turbopack

### Backend
- **API Routes:** Next.js API Routes
- **AI Integration:** OpenAI GPT-3.5-turbo
- **Authentication:** HashID-basiert mit JWT
- **Admin System:** HashID-Verwaltung über Admin-Dashboard

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
ADMIN_PASSWORD=OmniAdmin2024!

# Hash List (JSON string)
HASH_LIST=[{"hashId":"abc123","password":"test123","name":"Max Mustermann","department":"IT","status":"pending"},{"hashId":"def456","password":"test456","name":"Anna Schmidt","department":"Marketing","status":"in_progress"}]

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
│   │   ├── admin/             # Admin-Dashboard mit HashID-Manager
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # HashID-Login & Admin-Login
│   │   │   ├── gpt/           # OpenAI Integration
│   │   │   └── hash-list/     # HashID-Verwaltung
│   │   ├── login/             # HashID-Login-Seite
│   │   ├── welcome/           # Willkommensseite
│   │   ├── role-context/      # Rollenkontext-Formular
│   │   ├── questions/         # Fragen-Seite
│   │   └── summary/           # Zusammenfassung mit PDF-Export
│   ├── components/            # React-Komponenten
│   │   ├── HashIDManager.tsx  # HashID-Verwaltung
│   │   ├── LoginForm.tsx      # HashID-Login
│   │   ├── PDFDownload.tsx    # PDF-Export
│   │   └── AdminTable.tsx     # Admin-Dashboard
│   ├── lib/                   # Utility-Funktionen
│   │   ├── hashList.ts        # HashID-Verwaltung
│   │   ├── session.ts         # Session-Management
│   │   └── gpt.ts             # OpenAI Integration
│   └── state/                 # State Management
├── public/                    # Statische Dateien
├── .env.local                 # Umgebungsvariablen
└── users.json                 # Benutzer-Daten (Legacy)
```

## 🔐 Authentifizierung

### HashID-Login-System
- **HashID-basiert:** Jeder Mitarbeiter erhält eine eindeutige HashID
- **Admin-Verwaltung:** HashIDs werden über Admin-Dashboard verwaltet
- **Sicherheit:** SHA-256 Hashing mit Salt
- **Session-Management:** JWT-basiert mit sicheren Cookies

### Admin-System
- **Zugang:** `/admin` mit separaten Admin-Credentials
- **HashID-Manager:** Erstellung und Verwaltung von HashIDs
- **CSV-Export:** Export von Mitarbeiter-Zugangsdaten
- **Bulk-Generierung:** Automatische Erstellung mehrerer HashIDs

### Session-Management
- **JWT-basiert** mit sicheren Cookies
- **Automatische Abmeldung** nach 24 Stunden
- **Persistierung** im Browser-LocalStorage
- **Rollen-basiert:** User vs. Admin Sessions

## 🤖 AI-Integration

### OpenAI API
- **Model:** gpt-3.5-turbo (Fragen, Summary), gpt-4 (Follow-ups)
- **Endpoints:**
  - `/api/gpt/questions` - Fragengenerierung
  - `/api/gpt/followup` - Nachfragen
  - `/api/gpt/summary` - Zusammenfassung

### Prompt-Engineering (Optimiert v2.2)
- **Fokus:** Persönliche Entwicklung und berufliche Reflexion
- **Kontext:** Rollenkontext des Benutzers als Hintergrund
- **Kategorien:** 12 spezifische Reflexionskategorien
- **Personalisierung:** Name und Arbeitsbereich strategisch integriert
- **Strukturierung:** Einleitung, Systematische Analyse, Empfehlungen

#### Optimierte Prompt-Strategien
- **Weniger spezifische Branchenbezüge**: Fokus auf allgemeine Entwicklung statt spezifische Arbeitsbereiche
- **Inspirierendere Fragen**: "Was hat dich am meisten überrascht?", "Was würdest du deinem jüngeren Ich raten?"
- **Persönliche Wachstumserfahrungen**: Betonung von Lernen und Entwicklung
- **Werte und Überzeugungen**: Tiefgründigere Reflexion über persönliche Werte
- **Zukunftsvisionen**: Fokus auf Entwicklungsziele und Perspektiven

### Reflexionskategorien (Optimiert)
1. **Führungsperspektive & Verbesserungsvorschläge** - Was würdest du als Chef anders machen?
2. **Stolz & persönliche Leistung** - Worauf bist du stolz, was macht dich zufrieden?
3. **Herausforderungen & Umgang mit Druck** - Welche Schwierigkeiten erlebst du und wie gehst du damit um?
4. **Verantwortung & Selbstorganisation** - Wie organisierst du dich und übernimmst Verantwortung?
5. **Zusammenarbeit & Feedback** - Wie arbeitest du mit anderen zusammen?
6. **Entwicklung & Lernen** - Wo siehst du Entwicklungsmöglichkeiten?
7. **Energie & Belastung** - Wie erlebst du deine Energie und Belastung?
8. **Kultur & Werte** - Wie erlebst du die Unternehmenskultur?
9. **Entscheidungsspielräume & Freiheit** - Welche Freiheiten und Entscheidungsmöglichkeiten hast du?
10. **Wertschätzung & Gesehenwerden** - Fühlst du dich wertgeschätzt und gesehen?
11. **Perspektive & Zukunft** - Wie siehst du deine berufliche Zukunft?
12. **Rollentausch & Führungsperspektive** - Was würdest du als Vorgesetzter anders machen?

### Design-System (Optimiert v2.2)
- **Farbkodierung:** 11 verschiedene Farben für verschiedene Kategorien
- **Gradient-Designs:** Moderne visuelle Hierarchie
- **Konsistente Darstellung:** Web und PDF verwenden das gleiche Design-System
- **Verbesserte Lesbarkeit:** Klare visuelle Trennung der Kategorien

#### Farbpalette
- 🟦 **Indigo**: Führungsperspektive, Entscheidungsspielräume
- 🟢 **Grün**: Stolz, Entwicklung, Wertschätzung  
- 🟠 **Orange**: Herausforderungen, Energie
- 🟣 **Lila**: Verantwortung, Kultur, Rollentausch
- 🔵 **Blau**: Zusammenarbeit, Perspektive
- 🟢 **Smaragd**: Entwicklung
- 🟡 **Bernstein**: Energie
- 🟣 **Violett**: Kultur
- 🔵 **Türkis**: Wertschätzung
- 🔵 **Himmel**: Perspektive

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

### 1. HashID-Authentifizierung
```
HashID-Login → Session-Token → Welcome-Seite
```

### 2. Rollenkontext
```
Willkommensseite → Rollenkontext-Formular → Speicherung
```

### 3. Fragengenerierung
```
Rollenkontext → OpenAI API → 12 personalisierte Fragen (optimiert für persönliche Entwicklung)
```

### 4. Reflexion
```
Fragen beantworten → Follow-up-Fragen (eine einzige vertiefende Frage) → Strukturierte Zusammenfassung (mit Fokus-Bereichen)
```

### 5. PDF-Export
```
Zusammenfassung → PDF-Generierung (mit Farbkodierung) → Download
```

## 🛡️ Sicherheit

### Datenschutz
- **Lokale Speicherung:** Alle Daten bleiben im Browser
- **Keine Server-Speicherung:** Antworten werden nicht dauerhaft gespeichert
- **Anonymisierung:** Keine personenbezogenen Daten in Logs
- **HashID-System:** Sichere Authentifizierung ohne personenbezogene Daten

### API-Sicherheit
- **Rate Limiting:** 50 Requests pro 15 Minuten
- **Input Validation:** Sanitization aller Eingaben
- **Session-Validierung:** JWT-basierte Authentifizierung
- **Admin-Access:** Separate Admin-Sessions

## 🧪 Testing

### API-Tests
```bash
# HashID-Login testen
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"hashId":"abc123","password":"test123"}'

# Admin-Login testen
curl -X POST http://localhost:3000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"OmniAdmin2024!"}'

# Hash-Liste abrufen
curl http://localhost:3000/api/hash-list
```

### Browser-Tests
- HashID-Login mit verschiedenen HashIDs
- Admin-Dashboard Funktionalität
- PDF-Export Funktionalität
- Responsive Design auf verschiedenen Geräten

## 🔧 Konfiguration

### HashID-Verwaltung
```typescript
// Neue HashID erstellen
const newHashId = {
  hashId: "mitarbeiter_123",
  password: "sicheres_passwort",
  name: "Max Mustermann",
  department: "IT",
  status: "pending"
}
```

### Admin-Konfiguration
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=OmniAdmin2024!
```

## 🚨 Troubleshooting

### Häufige Probleme

1. **Admin-Login funktioniert nicht**
   - Prüfe `.env.local` Konfiguration
   - Stelle sicher, dass `ADMIN_PASSWORD=OmniAdmin2024!` gesetzt ist
   - Starte den Server neu nach Änderungen

2. **HashID-Login funktioniert nicht**
   - Prüfe Hash-Liste: `curl http://localhost:3000/api/hash-list`
   - Stelle sicher, dass HashID und Passwort korrekt sind
   - Prüfe PASSWORD_SALT in `.env.local`

3. **Zusammenfassung wird nicht generiert**
   - Prüfe OpenAI API-Key
   - Prüfe API-Logs: `./monitor.sh --logs`
   - Stelle sicher, dass alle Fragen beantwortet wurden

## 📈 Performance

### Optimierungen
- **Turbopack:** Schnellere Build-Zeiten
- **Lazy Loading:** Komponenten werden bei Bedarf geladen
- **Caching:** API-Responses werden gecacht
- **Compression:** Gzip-Kompression für statische Assets

### Monitoring
```bash
# Performance-Monitoring
./monitor.sh --performance

# API-Response-Zeiten
./monitor.sh --api-stats
```

## 🔮 Zukunft

### Geplante Features
- [ ] Datenbank-Integration (Firebase/Supabase)
- [ ] Erweiterte Analytics
- [ ] Multi-Sprach-Support
- [ ] Mobile App
- [ ] API-Dokumentation
- [ ] Erweiterte HashID-Features

### Technische Verbesserungen
- [ ] Redis-Caching
- [ ] Microservices-Architektur
- [ ] Kubernetes-Deployment
- [ ] CI/CD-Pipeline 