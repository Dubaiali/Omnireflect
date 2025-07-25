# Omnireflect

Eine moderne Next.js-Anwendung für Reflexionsfragen und Rollenkontext-Management.

## Features

- **Reflexionsfragen**: Generierung personalisierter Fragen basierend auf Rollenkontext
- **Admin-Panel**: Verwaltung von Hash-IDs und Admin-Credentials
- **Rollenkontext**: Erfassung und Speicherung von Arbeitskontexten
- **Sichere Authentifizierung**: Admin-Login mit Hash-basierter Validierung

## Deployment

Das Projekt verwendet GitHub Actions für automatisches Deployment auf den Produktionsserver.

### Lokale Entwicklung

```bash
npm install
npm run dev
```

### Produktions-Deployment

Das Deployment erfolgt automatisch über GitHub Actions bei jedem Push auf den `main` Branch.

**Status**: ✅ GitHub Actions Deployment eingerichtet und bereit
