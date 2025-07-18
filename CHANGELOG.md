# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

## [4.0.0] - 2025-01-18

### 🎯 **Hauptverbesserung: Authentische Wiedergabe kritischer Äußerungen**
- **Kritische Äußerungen werden nicht mehr gemildert oder "schön geredet"**
- **Echte Gefühle und Meinungen werden respektiert und authentisch wiedergegeben**
- **Beispiel**: "Ich hasse Kunden" bleibt "Ich hasse Kunden" in der Zusammenfassung

### 🔒 **Sicherheitsverbesserungen**
- **PDF.js Vulnerabilität behoben**: `@types/react-pdf` Dependency entfernt
- **NPM Audit**: 0 Vulnerabilities (vorher 2 High-Severity)
- **Sicherheits-Score**: 9.5/10 (vorher 9.2/10)

### 🧹 **Code-Bereinigung**
- **Nicht benötigte Dateien entfernt**: Test-Dateien, Debug-Dateien, ZIP-Archiv
- **Gitignore erweitert**: Bessere Abdeckung von temporären und sensiblen Dateien
- **Dokumentation aktualisiert**: README.md komplett überarbeitet

### 📚 **Dokumentation**
- **README.md**: Vollständig überarbeitet mit aktueller Version 4.0.0
- **Struktur bereinigt**: Entfernung veralteter Informationen
- **Installation vereinfacht**: Klarere Anweisungen für neue Benutzer

---

## [3.0.0] - 2025-01-17

### 🎯 **Hauptverbesserung: Du-Form in allen Zusammenfassungen**
- **Konsistente Du-Form**: Alle Teile der Zusammenfassung verwenden die Du-Form
- **Persönlichere Ansprache**: Empathischere und direktere Kommunikation
- **Struktur beibehalten**: PDF-Design und Formatierung bleiben unverändert

### 🔍 **Intelligente Antwortfilterung**
- **Nur beantwortete Fragen**: Zusammenfassung basiert nur auf tatsächlich beantworteten Fragen
- **Warnung bei wenigen Antworten**: Benutzer wird informiert, wenn nur wenige Fragen beantwortet wurden
- **Dynamische Kategorien**: Prompt passt sich an die beantworteten Fragen an

### 🛠️ **Technische Verbesserungen**
- **Prompt-Optimierung**: Klarere Anweisungen für separate Sektionen
- **Parsing-Verbesserung**: Robustere Erkennung verschiedener Schreibweisen
- **Fehlerbehandlung**: Bessere Behandlung von Edge Cases

---

## [2.2.3] - 2025-01-16

### 🎯 **Hauptverbesserung: Separate Empfehlungen-Sektion**
- **Empfehlungen als eigene Sektion**: Nicht mehr Teil von "Rollentausch & Führungsperspektive"
- **Klare Struktur**: Deutliche Trennung zwischen Analyse und Handlungsimpulsen
- **Verbesserte Parsing-Logik**: Robuste Erkennung verschiedener Schreibweisen

### 🔧 **Prompt-Optimierung**
- **Strukturregeln**: Explizite Anweisungen für separate Sektionen
- **Qualitätskriterien**: Erweiterte Richtlinien für bessere Zusammenfassungen
- **Kategorien-Mapping**: Dynamische Anpassung basierend auf beantworteten Fragen

---

## [2.2.2] - 2025-01-15

### 🐛 **Bugfixes**
- **Zusammenfassungsgenerierung**: Behebung von Race Conditions
- **Session-Management**: Verbesserte Synchronisation zwischen Komponenten
- **Error Handling**: Robustere Fehlerbehandlung bei API-Aufrufen

### 🔧 **Technische Verbesserungen**
- **State Management**: Optimierte Zustandsverwaltung mit Zustand
- **API-Responses**: Konsistentere Fehlerbehandlung
- **Performance**: Reduzierte API-Aufrufe durch besseres Caching

---

## [2.2.1] - 2025-01-14

### 🎨 **UI/UX-Verbesserungen**
- **Farbkodierte Kategorien**: Visuelle Unterscheidung der 12 Reflexionskategorien
- **Gradient-Designs**: Moderne, ansprechende Benutzeroberfläche
- **Responsive Design**: Optimierung für verschiedene Bildschirmgrößen

### 🔧 **Technische Verbesserungen**
- **Komponenten-Struktur**: Bessere Modularisierung
- **Styling-System**: Konsistente Design-Sprache
- **Accessibility**: Verbesserte Barrierefreiheit

---

## [2.2.0] - 2025-01-13

### 🧠 **AI-Prompt-Optimierung v2.2**
- **Interessantere Fragen**: Tiefgründigere Reflexionsfragen
- **Kontextuelle Anpassung**: Bessere Personalisierung basierend auf Rolle
- **Verbesserte Nachfragen**: Intelligente Follow-up-Fragen

### 🎯 **Neue Features**
- **12 Reflexionskategorien**: Strukturierte Abdeckung aller wichtigen Bereiche
- **Dynamische Fragen**: KI-generierte, kontextuelle Fragen
- **Intelligente Nachfragen**: Basierend auf vorherigen Antworten

---

## [2.1.0] - 2025-01-12

### 🔧 **Bugfixes**
- **Rollenkontext-Überspringung**: Behebung des Problems beim ersten Laden
- **Session-Persistierung**: Verbesserte Datenspeicherung
- **Navigation**: Stabilere Seitenübergänge

### 🛠️ **Technische Verbesserungen**
- **State Management**: Optimierte Zustandsverwaltung
- **Error Handling**: Bessere Fehlerbehandlung
- **Performance**: Reduzierte Ladezeiten

---

## [2.0.0] - 2025-01-11

### 🎯 **Hauptverbesserung: HashID-basiertes Login-System**
- **Sichere Authentifizierung**: HashID-basiertes Login ohne persönliche Daten
- **Admin-Dashboard**: HashID-Verwaltung für Administratoren
- **Anonyme Nutzung**: Maximale Privatsphäre für Benutzer

### 🔒 **Sicherheit**
- **HashID-System**: Sichere, anonyme Benutzeridentifikation
- **Admin-Bereich**: Geschützte Verwaltungsoberfläche
- **Session-Management**: Sichere Session-Verwaltung

### 📊 **Neue Features**
- **HashID-Manager**: Verwaltung von Benutzer-HashIDs
- **Admin-Login**: Geschützter Administrationsbereich
- **CSV-Export**: Export von HashID-Daten

---

## [1.0.0] - 2025-01-10

### 🎉 **Erstveröffentlichung**
- **KI-gestützte Mitarbeiterjahresgespräche**: Grundfunktionalität
- **Personalisiertes Fragen-System**: Basierend auf Rolle und Kontext
- **PDF-Export**: Zusammenfassung als PDF
- **Responsive Design**: Optimiert für alle Geräte

### 🔧 **Grundfunktionen**
- **Fragengenerierung**: KI-basierte, personalisierte Fragen
- **Zusammenfassung**: Strukturierte Zusammenfassung der Antworten
- **PDF-Export**: Professioneller Export der Ergebnisse
- **Session-Management**: Lokale Datenspeicherung

---

## Versionierung

- **Major** (X.0.0): Breaking Changes, neue Hauptfeatures
- **Minor** (0.X.0): Neue Features, rückwärtskompatibel
- **Patch** (0.0.X): Bugfixes, kleine Verbesserungen

## Support

Bei Fragen oder Problemen:
- **GitHub Issues**: https://github.com/Dubaiali/Omnireflect/issues
- **Dokumentation**: Siehe README.md und TECHNICAL_DOCUMENTATION.md 