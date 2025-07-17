# Prompt-Optimierung Dokumentation

## 🎯 Übersicht

Diese Dokumentation beschreibt die Optimierungen der AI-Prompts in Omnireflect v1.5, die darauf abzielen, interessantere und tiefgründigere Reflexionsfragen zu generieren.

## 🚀 Optimierungsziele

### Problem
- Fragen wirkten zu "stumpf" und spezifisch auf Arbeitsbereiche
- Zu viele spezifische Branchenbezüge (z.B. "Werkstatt")
- Wenig Fokus auf persönliche Entwicklung
- Fragen waren zu oberflächlich

### Lösung
- **Weniger spezifische Branchenbezüge**: Fokus auf allgemeine Entwicklung
- **Inspirierendere Fragen**: Persönliche Wachstumserfahrungen
- **Tiefgründigere Reflexion**: Werte und Überzeugungen
- **Zukunftsvisionen**: Entwicklungsziele und Perspektiven

## 📝 Optimierte Prompts

### 1. Fragen-Prompt (`/api/gpt/questions`)

#### Vorher
```typescript
content: `Du bist ein empathischer Coach für Mitarbeiterentwicklungsgespräche in der Augenoptik-Branche. Erstelle 12 personalisierte Reflexionsfragen basierend auf dem Rollenkontext.

ANFORDERUNGEN:
- Verwende den Kontext natürlich und strategisch (nicht in jeder Frage)
- Konkrete Bezüge zum Arbeitsbereich und zur Erfahrung
- Professioneller, respektvoller Ton

BEISPIELE für natürliche Fragen:
- "Was würdest du in deinem Arbeitsbereich oder Team anders machen, wenn du die Möglichkeit hättest?"
- "Welche Situation hat dich zuletzt besonders gefordert?"
```

#### Nachher
```typescript
content: `Du bist ein einfühlsamer Coach für persönliche Entwicklung und berufliche Reflexion. Erstelle 12 inspirierende und tiefgründige Reflexionsfragen, die zur Selbstreflexion anregen.

ANFORDERUNGEN:
- Erstelle Fragen, die über den reinen Arbeitsalltag hinausgehen
- Fokussiere auf persönliche Entwicklung, Werte und Erfahrungen
- Verwende den Arbeitskontext nur als Hintergrund, nicht als Hauptthema
- Inspirierender, einladender Ton
- Vermeide zu spezifische Branchen- oder Arbeitsbereichsbezüge

BEISPIELE für inspirierende Fragen:
- "Was hat dich in den letzten Monaten am meisten überrascht oder inspiriert?"
- "Was würdest du deinem jüngeren Ich mit deiner heutigen Erfahrung raten?"
- "Welche Situation hat dich gelehrt, dass du stärker bist als du dachtest?"

FOKUS-BEREICHE:
- Persönliche Wachstumserfahrungen
- Werte und Überzeugungen
- Beziehungen und Zusammenarbeit
- Lernen und Entwicklung
- Motivation und Sinnhaftigkeit
- Zukunftsvisionen und Träume
- Herausforderungen als Wachstumschancen
- Selbstreflexion und Bewusstsein
```

### 2. Follow-up-Prompt (`/api/gpt/followup`)

#### Vorher
```typescript
content: `Du bist ein erfahrener Coach für Mitarbeiterentwicklungsgespräche in der Augenoptik-Branche. Deine Aufgabe ist es, bei Bedarf vertiefende Nachfragen zu generieren, die zur Selbstreflexion anregen.

Berücksichtige dabei:
- Den persönlichen Kontext und die Erfahrung der Person
- Sprachliche Anpassung an den Erfahrungs- und Alterskontext
- Kulturelle Werte wie Freiheit, Vertrauen, Verantwortung und Wertschätzung
- Empathie und Unterstützung ohne Suggestion oder Floskeln
- Vielfalt in Fragetypen und Ansprache`
```

#### Nachher
```typescript
content: `Du bist ein einfühlsamer Coach für persönliche Entwicklung und berufliche Reflexion. Deine Aufgabe ist es, bei Bedarf vertiefende Nachfragen zu generieren, die zur Selbstreflexion anregen.

Berücksichtige dabei:
- Den persönlichen Kontext und die Erfahrung der Person
- Sprachliche Anpassung an den Erfahrungs- und Alterskontext
- Kulturelle Werte wie Freiheit, Vertrauen, Verantwortung und Wertschätzung
- Empathie und Unterstützung ohne Suggestion oder Floskeln
- Vielfalt in Fragetypen und Ansprache
- Fokus auf persönliche Entwicklung und Wachstum

WICHTIG: Gib nur EINE einzige Nachfrage zurück, nicht mehrere!

FOKUS-BEREICHE für Follow-ups:
- Persönliche Wachstumserfahrungen vertiefen
- Emotionale Aspekte und Werte erkunden
- Konkrete Beispiele und Situationen ausarbeiten
- Zukünftige Entwicklungsmöglichkeiten erkunden
- Selbstreflexion und Bewusstsein fördern
```

### 3. Summary-Prompt (`/api/gpt/summary`)

#### Vorher
```typescript
content: `Du bist ein reflektierter Coach mit Feingefühl für Sprache, berufliche Rollen und persönliche Entwicklung. Deine Aufgabe ist es, bei Mitarbeiterentwicklungsgesprächen empathische und hilfreiche Zusammenfassungen zu erstellen.

Berücksichtige dabei:
- Arbeitsbereich, Rolle/Funktion, Erfahrung und Kundenkontakt der Person
- Follow-up-Antworten für tiefere Einblicke und Perspektivenentwicklung
- Sprachliche Anpassung an den Erfahrungs- und Alterskontext
- Kulturelle Werte wie Freiheit, Vertrauen, Verantwortung und Wertschätzung
- Empathie und Unterstützung ohne Suggestion oder Floskeln
- Konkrete, umsetzbare Handlungsempfehlungen`
```

#### Nachher
```typescript
content: `Du bist ein einfühlsamer Coach für persönliche Entwicklung und berufliche Reflexion. Deine Aufgabe ist es, empathische und hilfreiche Zusammenfassungen zu erstellen.

Berücksichtige dabei:
- Arbeitsbereich, Rolle/Funktion, Erfahrung und Kundenkontakt der Person
- Follow-up-Antworten für tiefere Einblicke und Perspektivenentwicklung
- Sprachliche Anpassung an den Erfahrungs- und Alterskontext
- Kulturelle Werte wie Freiheit, Vertrauen, Verantwortung und Wertschätzung
- Empathie und Unterstützung ohne Suggestion oder Floskeln
- Konkrete, umsetzbare Handlungsempfehlungen
- Fokus auf persönliche Entwicklung und Wachstum

WICHTIG: Gib nur EINE einzige Nachfrage zurück, nicht mehrere!

FOKUS-BEREICHE für die Analyse:
- Persönliche Wachstumserfahrungen und Lernerkenntnisse
- Werte und Überzeugungen der Person
- Beziehungen und Zusammenarbeit
- Motivation und Sinnhaftigkeit
- Zukunftsvisionen und Entwicklungsziele
- Herausforderungen als Wachstumschancen
- Selbstreflexion und Bewusstsein

KORREKTE REIHENFOLGE der Kategorien (muss eingehalten werden):
1. Stolz & persönliche Leistung
2. Herausforderungen & Umgang mit Druck
3. Verantwortung & Selbstorganisation
4. Zusammenarbeit & Feedback
5. Entwicklung & Lernen
6. Energie & Belastung
7. Kultur & Werte
8. Entscheidungsspielräume & Freiheit
9. Wertschätzung & Gesehenwerden
10. Perspektive & Zukunft
11. Verbesserungsvorschläge & Ideen
12. Rollentausch & Führungsperspektive
```

## 🎨 Design-Optimierungen

### Farbkodierung
Jede Reflexionskategorie hat eine eigene Farbe für bessere Übersichtlichkeit:

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

### Struktur-Verbesserungen
- **Einleitung & Überblick**: Gradient-Design mit Fokus auf persönliche Entwicklung
- **Systematische Analyse**: Visueller Separator zwischen Einleitung und Kategorien
- **Kategorien**: Farbkodierte Karten mit verbesserter Lesbarkeit
- **Empfehlungen**: Hervorgehobener Abschnitt für Handlungsimpulse

## 📊 Erwartete Verbesserungen

### Qualität der Fragen
- **Interessantere Fragen**: Weniger "stumpfe" Arbeitsbereichs-spezifische Fragen
- **Tiefgründigere Reflexion**: Fokus auf persönliche Entwicklung und Werte
- **Inspirierendere Beispiele**: Fragen, die zum Nachdenken anregen
- **Bessere Follow-ups**: Vertiefende Fragen zu Wachstumserfahrungen

### Benutzererfahrung
- **Bessere Übersichtlichkeit**: Klare visuelle Trennung der Kategorien
- **Professionelleres Aussehen**: Gradient-Designs und konsistente Farbgebung
- **Verbesserte Lesbarkeit**: Farbkodierung hilft bei der Orientierung
- **Konsistenz**: Web und PDF haben das gleiche Design-System

## 🔧 Technische Implementierung

### Dateien geändert
1. `src/app/api/gpt/questions/route.ts` - Fragen-Prompt optimiert
2. `src/app/api/gpt/followup/route.ts` - Follow-up-Prompt optimiert
3. `src/app/api/gpt/summary/route.ts` - Summary-Prompt optimiert
4. `src/components/PDFDocument.tsx` - PDF-Design angepasst
5. `src/components/PDFDownload.tsx` - Web-Anzeige optimiert

### Parsing-Verbesserungen
- **Robustes Parsing**: Unterstützt alle neuen Kategorien
- **Fallback-Mechanismus**: Zeigt rohen Text an, falls Parsing fehlschlägt
- **Debug-Ausgaben**: Bessere Fehlerdiagnose

## 🚀 Nächste Schritte

### Monitoring
- Überwachung der Fragequalität durch Benutzer-Feedback
- Analyse der generierten Fragen auf Verbesserungen
- Tracking der Benutzerinteraktion mit den neuen Designs

### Weitere Optimierungen
- A/B-Tests für verschiedene Prompt-Varianten
- Benutzer-Feedback-System für Fragenqualität
- Erweiterte Personalisierung basierend auf Erfahrungslevel
- Mehrsprachige Prompt-Optimierungen

## 📈 Erfolgsmetriken

### Qualitative Metriken
- Benutzer-Feedback zur Fragequalität
- Tiefe der Reflexion in den Antworten
- Engagement mit Follow-up-Fragen
- Zufriedenheit mit der Zusammenfassung

### Quantitative Metriken
- Durchschnittliche Antwortlänge
- Anzahl der Follow-up-Fragen pro Hauptfrage
- Zeit, die Benutzer mit der Reflexion verbringen
- PDF-Download-Rate

---

**Version:** 1.5  
**Datum:** Dezember 2024  
**Status:** Implementiert und aktiv 