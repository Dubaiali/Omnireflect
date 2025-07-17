# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2025-01-17

### ✅ Hinzugefügt
- **HashID-Login-System**: Sichere HashID-basierte Authentifizierung für Mitarbeiter
- **Admin-Dashboard**: Vollständige HashID-Verwaltung über Admin-Bereich
- **HashID-Manager**: Erstellung, Bearbeitung und Löschung von HashIDs
- **CSV-Export**: Export von Mitarbeiter-Zugangsdaten
- **Bulk-Generierung**: Automatische Erstellung mehrerer HashIDs
- **Strukturierte Zusammenfassungen**: Verbesserte Darstellung der KI-Zusammenfassungen
- **PDF-Export-Optimierung**: Überarbeitete PDFDownload-Komponente
- **Fallback-Darstellung**: Alternative Darstellung bei Parsing-Fehlern

### 🔧 Geändert
- **Login-System**: Von festen Credentials zu HashID-basiertem System
- **Zusammenfassungsdarstellung**: Strukturierte Anzeige mit Einleitung, Kategorien und Empfehlungen
- **UI-Layout**: Action-Buttons und "Nächste Schritte" über Header verschoben
- **Prompt-Optimierung**: Entfernung nummerierter Überschriften, erweiterte Einleitung
- **Parsing-Logik**: Verbesserte Zerlegung der Zusammenfassung in Komponenten

### 🐛 Behoben
- **Admin-Login**: Admin-Credentials korrekt konfiguriert
- **Doppelte Aufzählungszeichen**: Entfernung nummerierter Überschriften im Prompt
- **Kurze Einleitungen**: Erweiterung von 3-4 auf 5-7 Sätze
- **Parsing-Fehler**: Zuverlässigere Erkennung von Kategorien
- **UI-Übersichtlichkeit**: Bessere Strukturierung der Zusammenfassungsseite

### 🔐 Sicherheit
- **HashID-System**: Sichere Authentifizierung ohne personenbezogene Daten
- **Admin-Access**: Separate Admin-Sessions mit eigenen Credentials
- **Session-Management**: JWT-basierte Authentifizierung mit sicheren Cookies

### 📚 Dokumentation
- **README.md**: Vollständige Aktualisierung mit HashID-System
- **TECHNICAL_DOCUMENTATION.md**: Erweiterte technische Dokumentation
- **CHANGELOG.md**: Neue Changelog-Datei für Versionsverfolgung

## [1.4.1] - 2025-01-16

### 🔧 Geändert
- **Rollenkontext-Logik**: Behoben, dass Rollenkontext übersprungen wird
- **State-Management**: Verbesserte Persistierung und Initialisierung

### 🐛 Behoben
- **Fragengenerierung**: State-Initialisierung korrigiert
- **Navigation**: Korrekte Weiterleitung nach Rollenkontext

## [1.4.0] - 2025-01-15

### ✅ Hinzugefügt
- **PDF-Export**: Grundlegende PDF-Export-Funktionalität
- **Zusammenfassungsseite**: Neue Seite für KI-generierte Zusammenfassungen
- **Follow-up-Fragen**: Intelligente Nachfragen basierend auf Antworten

### 🔧 Geändert
- **UI/UX**: Verbesserte Benutzeroberfläche
- **API-Integration**: Erweiterte OpenAI API-Integration

## [1.3.0] - 2025-01-14

### ✅ Hinzugefügt
- **KI-gestützte Fragengenerierung**: OpenAI GPT-Integration
- **Rollenkontext-Formular**: Personalisierte Fragen basierend auf Rolle
- **12 Reflexionskategorien**: Umfassende Reflexionsfragen

### 🔧 Geändert
- **Architektur**: Next.js App Router Implementation
- **State-Management**: Zustand mit Persistierung

## [1.2.0] - 2025-01-13

### ✅ Hinzugefügt
- **Grundlegende Authentifizierung**: Session-basiertes Login
- **Willkommensseite**: Einführung in die Anwendung
- **Responsive Design**: Mobile-optimierte Benutzeroberfläche

## [1.1.0] - 2025-01-12

### ✅ Hinzugefügt
- **Next.js Setup**: Grundlegende Projektstruktur
- **Tailwind CSS**: Styling-Framework
- **TypeScript**: Type-Safety

## [1.0.0] - 2025-01-11

### ✅ Hinzugefügt
- **Initiale Version**: Grundlegende Projektstruktur
- **README.md**: Erste Dokumentation
- **Deployment-Skripte**: Grundlegende Deployment-Funktionalität

---

## Versionsrichtlinien

- **MAJOR**: Inkompatible API-Änderungen
- **MINOR**: Neue Features (rückwärtskompatibel)
- **PATCH**: Bugfixes (rückwärtskompatibel)

## Links

- [GitHub Repository](https://github.com/Dubaiali/Omnireflect)
- [Live-Anwendung](https://reflect.omni-scient.com)
- [Technische Dokumentation](TECHNICAL_DOCUMENTATION.md) 