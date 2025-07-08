# OmniReflect - Mitarbeiter:innen-Reflexion & Mitarbeiterjahresgespräch

Eine datenschutzkonforme, KI-gestützte Plattform für Mitarbeiter:innen zur Vorbereitung auf Mitarbeiterjahresgespräche.

## 🎯 Ziel

Die Plattform ermöglicht es Mitarbeiter:innen, sich gezielt auf ihr Mitarbeiterjahresgespräch vorzubereiten durch:

- **Anonymisierten Zugang** via Hash-ID + Passwort
- **Persönliche Reflexionsfragen** zu Rollenverständnis, Selbstwahrnehmung und Entwicklungswünschen
- **KI-gestützte Nachfragen** für mehr Tiefenschärfe (GPT-4)
- **Empathische Zusammenfassung** aus Antworten und GPT-Rückfragen
- **PDF-Export** für die Mitarbeiter:in
- **Admin-Dashboard** für Führungskräfte mit vollständigem Datenschutz

## 🚀 Features

### Für Mitarbeiter:innen
- ✅ Sichere Anmeldung mit Hash-ID und Passwort
- ✅ 10 strukturierte Reflexionsfragen in verschiedenen Kategorien
- ✅ KI-generierte Follow-up-Fragen für vertiefende Selbstreflexion
- ✅ Automatische Speicherung des Fortschritts
- ✅ KI-gestützte Zusammenfassung der Reflexion
- ✅ PDF-Export für Gesprächsvorbereitung

### Für Führungskräfte (Admin)
- ✅ Übersicht aller Mitarbeiter:innen-Reflexionen
- ✅ Status-Tracking (Ausstehend, In Bearbeitung, Abgeschlossen)
- ✅ PDF-Download für alle abgeschlossenen Reflexionen
- ✅ Detailansicht mit Antworten und Zusammenfassungen
- ✅ Vollständige Anonymisierung (keine Klarnamen im System)

## 🛠️ Technologie-Stack

- **Frontend**: Next.js 14 mit App Router
- **Styling**: Tailwind CSS
- **State Management**: Zustand mit Persistierung
- **KI-Integration**: OpenAI GPT-4
- **PDF-Generierung**: Browser-native Print-API
- **Authentifizierung**: Hash-ID + Passwort System
- **Datenspeicherung**: Lokale Speicherung (MVP)

## 📦 Installation

1. **Repository klonen**
   ```bash
       git clone <repository-url>
    cd omnireflect
   ```

2. **Dependencies installieren**
   ```bash
   npm install
   ```

3. **Umgebungsvariablen konfigurieren**
   ```bash
   # .env.local erstellen
   OPENAI_API_KEY=your-openai-api-key-here
   ```

4. **Entwicklungsserver starten**
   ```bash
   npm run dev
   ```

5. **Browser öffnen**
   ```
   http://localhost:3000
   ```

## 🔐 Zugangsdaten

### Test-Mitarbeiter:innen
- **Hash-ID**: `abc123` | **Passwort**: `test123`
- **Hash-ID**: `def456` | **Passwort**: `test456`
- **Hash-ID**: `ghi789` | **Passwort**: `test789`

### Admin-Zugang
- **Benutzername**: `admin`
- **Passwort**: `admin123`

## 📁 Projektstruktur

```
src/
├── app/                    # Next.js App Router
│   ├── login/             # Login-Seite
│   ├── questions/         # Fragebogen-Seite
│   ├── summary/           # Zusammenfassung-Seite
│   ├── admin/             # Admin-Dashboard
│   └── page.tsx           # Startseite
├── components/            # React-Komponenten
│   ├── LoginForm.tsx      # Login-Formular
│   ├── QuestionForm.tsx   # Fragebogen-Komponente
│   ├── PDFDownload.tsx    # PDF-Export-Komponente
│   └── AdminTable.tsx     # Admin-Tabelle
├── lib/                   # Utility-Funktionen
│   ├── hashList.ts        # Hash-IDs und Passwörter
│   ├── gpt.ts            # OpenAI GPT-Integration
│   └── storage.ts        # Datenspeicherung
└── state/                # Zustand-Management
    └── sessionStore.ts   # Zustand-Store
```

## 🔄 Workflow

1. **Mitarbeiter:in meldet sich an** mit Hash-ID und Passwort
2. **Beantwortung der Reflexionsfragen** mit KI-Follow-ups
3. **Automatische Speicherung** des Fortschritts
4. **Generierung der Zusammenfassung** mit GPT-4
5. **PDF-Export** für Gesprächsvorbereitung
6. **Admin-Übersicht** für Führungskräfte

## 🛡️ Datenschutz & Sicherheit

- **Anonymisierung**: Keine Klarnamen im System
- **Hash-basierte Identifikation**: Sichere Identifikation ohne personenbezogene Daten
- **Lokale Speicherung**: Daten bleiben im Browser (MVP)
- **Automatische Löschung**: Daten werden nach 30 Tagen gelöscht
- **DSGVO-konform**: Minimale Datenerhebung, Zweckbindung

## 🚀 Deployment

### Lokale Entwicklung
```bash
npm run dev
```

### Produktion
```bash
npm run build
npm start
```

### Umgebungsvariablen für Produktion
```bash
OPENAI_API_KEY=your-production-api-key
NODE_ENV=production
```

## 🔧 Konfiguration

### Hash-IDs hinzufügen
Bearbeiten Sie `src/lib/hashList.ts`:
```typescript
export const hashList: HashEntry[] = [
  {
    hashId: 'neue-hash-id',
    password: 'sicheres-passwort',
    name: 'Max Mustermann',
    department: 'IT',
    status: 'pending',
  },
  // ...
]
```

### Fragen anpassen
Bearbeiten Sie `src/components/QuestionForm.tsx`:
```typescript
const questions = [
  {
    id: 'neue-frage',
    question: 'Ihre neue Frage hier?',
    category: 'Neue Kategorie'
  },
  // ...
]
```

## 🤝 Beitragen

1. Fork des Repositories
2. Feature-Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add some AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request erstellen

## 📝 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

## 🆘 Support

Bei Fragen oder Problemen:
1. Issues im Repository erstellen
2. Dokumentation durchsuchen
3. Admin-Kontakt für technische Unterstützung

## 🔮 Roadmap

- [ ] Firebase/Supabase Integration für persistente Datenspeicherung
- [ ] Erweiterte PDF-Templates
- [ ] Mehrsprachigkeit (EN/DE)
- [ ] Mobile App
- [ ] Integration mit HR-Systemen
- [ ] Erweiterte Analytics für Führungskräfte
- [ ] Automatische Erinnerungen
- [ ] Team-basierte Reflexionen
