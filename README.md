# OmniReflect v4.0.0

**KI-gestützte Selbstreflexion für Mitarbeiterjahresgespräche**

OmniReflect ist eine moderne Webanwendung, die Mitarbeitern hilft, sich strukturiert auf ihr Mitarbeiterjahresgespräch vorzubereiten. Durch personalisierte Fragen und KI-gestützte Zusammenfassungen entstehen wertvolle Reflexionsgrundlagen.

## 🚀 Features

### **Kernfunktionen**
- **Personalisiertes Fragen-System**: 12 Kategorien mit KI-generierten, kontextuellen Fragen
- **Intelligente Nachfragen**: Dynamische Follow-up-Fragen basierend auf Antworten
- **KI-Zusammenfassung**: Strukturierte Zusammenfassung für das Mitarbeiterjahresgespräch
- **PDF-Export**: Professioneller Export der Zusammenfassung
- **Authentische Wiedergabe**: Kritische Äußerungen werden nicht gemildert oder "schön geredet"

### **Sicherheit & Datenschutz**
- **HashID-basierte Authentifizierung**: Sichere, anonyme Benutzeridentifikation
- **Automatische Datenlöschung**: Alle Daten werden nach 30 Tagen automatisch gelöscht
- **Keine Registrierung**: Einfacher Start ohne persönliche Daten
- **Verschlüsselte Kommunikation**: HTTPS/TLS 1.3
- **Rate Limiting**: Schutz vor Missbrauch

### **Benutzerfreundlichkeit**
- **Responsive Design**: Optimiert für Desktop und Mobile
- **Fortschrittsanzeige**: Visueller Überblick über beantwortete Fragen
- **Du-Form**: Persönliche, empathische Ansprache
- **Moderne UI**: Clean, professionelles Design

## 🛠️ Technologie-Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **PDF-Generierung**: @react-pdf/renderer
- **AI-Integration**: OpenAI GPT-3.5 Turbo
- **Validierung**: Zod
- **Deployment**: PM2, Nginx

## 📋 Voraussetzungen

- Node.js 18+ 
- npm oder yarn
- OpenAI API-Schlüssel

## 🚀 Installation

1. **Repository klonen**
   ```bash
   git clone https://github.com/Dubaiali/Omnireflect.git
   cd Omnireflect
   ```

2. **Dependencies installieren**
   ```bash
   npm install
   ```

3. **Umgebungsvariablen konfigurieren**
   ```bash
   cp env.example .env.local
   ```
   
   Bearbeiten Sie `.env.local` und fügen Sie Ihren OpenAI API-Schlüssel hinzu:
   ```env
   OPENAI_API_KEY=sk-proj-your-key-here
   ```

4. **Entwicklungsserver starten**
   ```bash
   npm run dev
   ```

5. **Anwendung öffnen**
   ```
   http://localhost:3000
   ```

## 🏗️ Produktions-Deployment

### **Automatisches Deployment**
```bash
# Deployment-Skript ausführen
./deploy-production.sh
```

### **Manuelles Deployment**
```bash
# Build erstellen
npm run build

# Produktionsserver starten
npm start
```

## 📁 Projektstruktur

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/          # Authentifizierung
│   │   └── gpt/           # AI-Integration
│   ├── questions/         # Fragen-Seite
│   ├── summary/           # Zusammenfassung
│   └── role-context/      # Rollenkontext
├── components/            # React-Komponenten
├── lib/                   # Utilities
├── state/                 # Zustand Stores
└── middleware.ts          # Next.js Middleware
```

## 🔧 Konfiguration

### **Umgebungsvariablen**

| Variable | Beschreibung | Beispiel |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API-Schlüssel | `sk-proj-...` |
| `PASSWORD_SALT` | Salt für Hash-Generierung | Automatisch generiert |
| `JWT_SECRET` | JWT Secret | Automatisch generiert |
| `SESSION_SECRET` | Session Secret | Automatisch generiert |

### **Sicherheitskonfiguration**

- **Rate Limiting**: 100 Requests/15min (Standard), 10/15min (Auth)
- **Session Timeout**: 30 Tage
- **HTTPS**: Erzwungen in Produktion
- **Security Headers**: CSP, XSS-Protection, Frame-Options

## 📊 API-Endpoints

### **Authentifizierung**
- `POST /api/auth/login` - HashID-basierte Anmeldung
- `POST /api/auth/logout` - Abmeldung

### **AI-Integration**
- `POST /api/gpt/questions` - Personalisierte Fragen generieren
- `POST /api/gpt/followup` - Nachfragen generieren
- `POST /api/gpt/summary` - Zusammenfassung erstellen

### **Administration**
- `GET /api/hash-list` - HashID-Liste (Admin)
- `GET /api/debug` - Debug-Informationen (Entwicklung)

## 🔒 Sicherheit

### **Implementierte Maßnahmen**
- ✅ HashID-basierte Authentifizierung
- ✅ Rate Limiting für alle Endpoints
- ✅ Input-Validierung mit Zod
- ✅ XSS- und SQL-Injection-Schutz
- ✅ Security Headers (CSP, XSS-Protection)
- ✅ HTTPS/TLS 1.3
- ✅ Automatische Datenlöschung

### **Sicherheits-Score: 9.5/10**

## 📈 Versionierung

### **Aktuelle Version: v4.0.0**
- **Hauptverbesserung**: Authentische Wiedergabe kritischer Äußerungen
- **Sicherheit**: Alle Vulnerabilities behoben
- **Performance**: Optimierte Dependencies

### **Changelog**
Siehe [CHANGELOG.md](./CHANGELOG.md) für detaillierte Änderungen.

## 🤝 Beitragen

1. Fork des Repositories
2. Feature-Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request erstellen

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert. Siehe [LICENSE](LICENSE) für Details.

## 🆘 Support

Bei Fragen oder Problemen:
- **Issues**: [GitHub Issues](https://github.com/Dubaiali/Omnireflect/issues)
- **Dokumentation**: Siehe [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)
- **Sicherheit**: Siehe [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)

---

**Entwickelt mit ❤️ für bessere Mitarbeiterjahresgespräche**
