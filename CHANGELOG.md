# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.0] - 2024-07-25

### Hinzugefügt
- **Komplette Zugangsverwaltung**: Zentrale Verwaltung aller Mitarbeiter-Zugänge
- **Admin-Dashboard**: Übersicht aller Reflexionen mit Statistik-Karten
- **Bulk-Generierung**: Massenerstellung von Mitarbeiter-Zugängen (bis zu 100 auf einmal)
- **Export-Funktionen**: CSV und JSON-Export für externe Verarbeitung
- **Passwort-Management**: Sichere Passwort-Zurücksetzung mit Auto-Generierung
- **Admin-Verwaltung**: Mehrere Administrator-Accounts mit verschiedenen Berechtigungen
- **Passwort-Sichtbarkeit**: Toggle-Funktion für Passwort-Anzeige im Admin-Bereich
- **Statistik-Dashboard**: Übersicht mit Gesamt-, Abgeschlossen-, In Bearbeitung- und Ausstehend-Zahlen
- **Verbesserte UI/UX**: Modernes Design mit Tailwind CSS
- **Auto-Generierung**: Automatische Generierung von Hash-IDs und Passwörtern
- **Test-Funktionen**: Login-Test für erstellte Zugänge

### Geändert
- **Admin-Login**: Erweiterte Authentifizierung für mehrere Admin-Accounts
- **Hash-ID-System**: Verbesserte Generierung mit Präfixen (emp_ für Mitarbeiter, admin_ für Admins)
- **Datenpersistierung**: Verbesserte Speicherung in JSON-Dateien
- **API-Struktur**: Erweiterte API-Endpunkte für Admin-Funktionen
- **Sicherheit**: Verbesserte Passwort-Hashing mit Salt

### Behoben
- **Session-Management**: Korrekte Session-Behandlung für Admin-Login
- **Datenvalidierung**: Umfassende Validierung aller Eingaben
- **Fehlerbehandlung**: Verbesserte Fehlerbehandlung und Benutzer-Feedback
- **Responsive Design**: Optimierung für verschiedene Bildschirmgrößen

### Sicherheit
- **Admin-Credentials**: Sichere Speicherung von Admin-Zugangsdaten
- **Passwort-Hashing**: SHA-256 mit Salt für alle Passwörter
- **Input-Validierung**: Umfassende Validierung und Sanitization
- **CSRF-Schutz**: Session-basierte Authentifizierung

## [3.0.0] - 2024-07-20

### Hinzugefügt
- **KI-gestützte Fragengenerierung**: Dynamische Fragen basierend auf Rollenkontext
- **Rollenkontext-Integration**: Erfassung von Arbeitsbereich, Funktion und Erfahrung
- **Nachfragen-System**: Intelligente Follow-up-Fragen für vertiefende Reflexion
- **Automatische Zusammenfassung**: KI-generierte Zusammenfassungen der Reflexionen
- **Erweiterte Fragen-Kategorien**: 12 verschiedene Kategorien für umfassende Reflexion

### Geändert
- **Fragen-System**: Von statischen zu dynamischen, kontextuellen Fragen
- **UI/UX**: Verbesserte Benutzeroberfläche für bessere Benutzererfahrung
- **Datenstruktur**: Erweiterte Datenmodelle für Rollenkontext und Nachfragen

## [2.0.0] - 2024-07-15

### Hinzugefügt
- **Session-basierte Authentifizierung**: Sichere Benutzer-Sessions
- **Hash-ID-System**: Anonyme Benutzeridentifikation
- **Grundlegende Admin-Funktionen**: Einfache Verwaltung von Zugängen
- **PDF-Export**: Professioneller Export der Reflexionen

### Geändert
- **Authentifizierung**: Von einfacher zu session-basierter Authentifizierung
- **Datenpersistierung**: Verbesserte Datenspeicherung

## [1.0.0] - 2024-07-10

### Hinzugefügt
- **Basis-Reflexionssystem**: Grundlegende Funktionalität für Mitarbeiterreflexionen
- **Einfache Fragebögen**: Statische Fragen für Selbstreflexion
- **PDF-Export**: Grundlegende PDF-Generierung
- **Responsive Design**: Mobile-freundliche Benutzeroberfläche

---

## Versionsrichtlinien

- **MAJOR**: Inkompatible API-Änderungen
- **MINOR**: Neue Funktionalität in rückwärtskompatibler Weise
- **PATCH**: Rückwärtskompatible Bugfixes

## Bekannte Probleme

### Version 4.0.0
- Keine bekannten kritischen Probleme
- Empfehlung: Regelmäßige Backups der `data/` Verzeichnisse

### Version 3.0.0
- ~~KI-Fragen manchmal zu langsam~~ (Behoben in 4.0.0)
- ~~Rollenkontext nicht immer korrekt gespeichert~~ (Behoben in 4.0.0)

### Version 2.0.0
- ~~Session-Timeout zu kurz~~ (Behoben in 3.0.0)
- ~~Hash-ID-Konflikte möglich~~ (Behoben in 4.0.0)

## Upgrade-Guide

### Von 3.0.0 zu 4.0.0
1. Backup der bestehenden Daten erstellen
2. Neue Umgebungsvariablen hinzufügen:
   ```env
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=OmniAdmin2024!
   ```
3. Datenbank-Migration durchführen (automatisch)
4. Admin-Credentials erstellen

### Von 2.0.0 zu 3.0.0
1. OpenAI API-Key konfigurieren
2. Rollenkontext-Daten migrieren
3. Neue Fragen-Kategorien aktivieren

### Von 1.0.0 zu 2.0.0
1. Session-Management aktivieren
2. Hash-ID-System implementieren
3. Admin-Funktionen einrichten

---

**Hinweis**: Alle Versionen sind vollständig rückwärtskompatibel innerhalb der gleichen Major-Version. 