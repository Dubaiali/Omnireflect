# Omnireflect v5.1.0

Eine moderne Next.js-Anwendung für KI-gestützte Mitarbeiterjahresgespräche mit personalisierten Reflexionsfragen.

## 🌟 Features

- **KI-gestützte Fragen**: Personalisierte Reflexionsfragen basierend auf Rollenkontext
- **Ausklapp-Funktionalität**: Erweiterte Admin-Zusammenfassungen mit Ausklapp-Optionen
- **Admin-Dashboard**: Vollständige Verwaltung von Hash-IDs und Zusammenfassungen
- **Rollenkontext-Management**: Erfassung und Speicherung von Arbeitskontexten
- **Sichere Authentifizierung**: Admin-Login mit Hash-basierter Validierung
- **PDF-Export**: Download von Zusammenfassungen als PDF
- **DSGVO-konform**: Anonymisierte Datenspeicherung
- **Responsive Design**: Optimiert für alle Geräte

## 🚀 Deployment

### Produktionsumgebung
- **Domain:** https://reflect.omni-scient.com
- **Server:** 188.68.48.168
- **Technologie:** Next.js 15.3.5, Nginx, Let's Encrypt SSL, PM2

### Automatisches Deployment
```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

Das Deployment-Skript führt automatisch alle notwendigen Schritte durch:
1. ✅ Voraussetzungen prüfen
2. ✅ Anwendung stoppen
3. ✅ Code deployen
4. ✅ Umgebungsvariablen konfigurieren
5. ✅ Production Build erstellen
6. ✅ PM2 konfigurieren und starten
7. ✅ Nginx konfigurieren
8. ✅ SSL-Zertifikat erstellen
9. ✅ Tests durchführen

### Manuelles Deployment
Siehe [DEPLOYMENT.md](DEPLOYMENT.md) für detaillierte Anweisungen.

## 🛠️ Lokale Entwicklung

### Voraussetzungen
- Node.js 18+
- npm oder yarn
- OpenAI API-Key

### Setup
```bash
# Repository klonen
git clone https://github.com/Dubaiali/Omnireflect.git
cd Omnireflect

# Dependencies installieren
npm install

# Umgebungsvariablen konfigurieren
cp env.example .env.local
# .env.local bearbeiten und OpenAI API-Key eintragen

# Entwicklungsserver starten
npm run dev
```

Die Anwendung ist dann unter http://localhost:3000 verfügbar.

## 📊 Zugangsdaten

### Admin-Zugang
- **Benutzername:** `admin`
- **Passwort:** `OmniAdmin2024!`

### Test-Mitarbeiter
- **Hash-ID:** `emp_md87yj1f_904c447c80694dc5`
- **Passwort:** `Tvr39RN%Jg$7`

## 🔧 Technische Details

### Technologie-Stack
- **Frontend:** Next.js 15.3.5, React, TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Next.js API Routes
- **KI:** OpenAI GPT-4
- **Deployment:** PM2, Nginx, Let's Encrypt

### Projektstruktur
```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin-Dashboard
│   ├── api/               # API-Routes
│   ├── questions/         # Fragen-Seite
│   ├── summary/           # Zusammenfassung
│   └── welcome/           # Willkommensseite
├── components/            # React-Komponenten
├── lib/                   # Utility-Funktionen
└── state/                 # Zustandsmanagement
```

## 📋 Monitoring & Logs

### Produktions-Logs
```bash
# PM2-Logs
ssh root@188.68.48.168 "pm2 logs reflect-app"

# App-Logs
ssh root@188.68.48.168 "tail -f /var/www/omnireflect/logs/combined.log"
```

### Status prüfen
```bash
# PM2-Status
ssh root@188.68.48.168 "pm2 status"

# HTTP-Status
curl -I https://reflect.omni-scient.com/
```

## 🔒 Sicherheit

- ✅ HTTPS mit Let's Encrypt SSL
- ✅ Sichere Passwort-Hashing
- ✅ JWT-basierte Authentifizierung
- ✅ Input-Validierung
- ✅ CSRF-Schutz
- ✅ XSS-Schutz

## 📞 Support

Bei Problemen:
1. Logs prüfen: `ssh root@188.68.48.168 "pm2 logs reflect-app"`
2. Status prüfen: `ssh root@188.68.48.168 "pm2 status"`
3. GitHub Issues erstellen: https://github.com/Dubaiali/Omnireflect/issues

## 📄 Dokumentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Detaillierte Deployment-Anleitung
- [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) - Technische Dokumentation
- [SECURITY_AUDIT.md](SECURITY_AUDIT.md) - Sicherheitsaudit
- [CHANGELOG.md](CHANGELOG.md) - Änderungsprotokoll

---

**Version:** 5.1.0  
**Letzte Aktualisierung:** 26. Juli 2025  
**Status:** ✅ Produktiv auf https://reflect.omni-scient.com
