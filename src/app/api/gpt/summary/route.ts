import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface RoleContext {
  workAreas: string[]
  functions: string[]
  experienceYears: string
  customerContact: string
  dailyTasks: string
}

export async function POST(request: NextRequest) {
  try {
    const { answers, followUpQuestions, roleContext } = await request.json()

    if (!answers || Object.keys(answers).length === 0) {
      return NextResponse.json(
        { error: 'Antworten sind erforderlich' },
        { status: 400 }
      )
    }

    const answersText = Object.entries(answers)
      .map(([question, answer]) => `Frage: ${question}\nAntwort: ${answer}`)
      .join('\n\n')

    let roleContextInfo = ''
    if (roleContext) {
      roleContextInfo = `
      
      Rollenkontext der Person:
      - Arbeitsbereich: ${roleContext.workAreas.join(', ')}
      - Funktion: ${roleContext.functions.join(', ')}
      - Erfahrung: ${roleContext.experienceYears}
      - Kundenkontakt: ${roleContext.customerContact}
      ${roleContext.dailyTasks ? `- Tägliche Aufgaben: ${roleContext.dailyTasks}` : ''}
      `
    }

    const prompt = `
      Als reflektierter Coach mit Feingefühl für Sprache, erstelle eine empathische und strukturierte Zusammenfassung der Mitarbeiter:innen-Reflexion basierend auf den gegebenen Antworten.
      
      ${answersText}${roleContextInfo}
      
      Analysiere die Antworten systematisch nach ALLEN 11 Reflexionskategorien und erstelle eine umfassende Zusammenfassung:
      
      1. **Rollenverständnis**: Wie siehst du deine Rolle und Verantwortlichkeiten?
      2. **Stolz & persönliche Leistung**: Worauf bist du stolz, was macht dich zufrieden?
      3. **Herausforderungen & Umgang mit Druck**: Welche Schwierigkeiten erlebst du und wie gehst du damit um?
      4. **Verantwortung & Selbstorganisation**: Wie organisierst du dich und übernimmst Verantwortung?
      5. **Zusammenarbeit & Feedback**: Wie arbeitest du mit anderen zusammen?
      6. **Entwicklung & Lernen**: Wo siehst du Entwicklungsmöglichkeiten?
      7. **Energie & Belastung**: Wie erlebst du deine Energie und Belastung?
      8. **Kultur & Werte**: Wie erlebst du die Unternehmenskultur?
      9. **Entscheidungsspielräume & Freiheit**: Welche Freiheiten und Entscheidungsmöglichkeiten hast du?
      10. **Wertschätzung & Gesehenwerden**: Fühlst du dich wertgeschätzt und gesehen?
      11. **Perspektive & Zukunft**: Wie siehst du deine berufliche Zukunft?
      
      Die Zusammenfassung sollte:
- in Du-Form verfasst sein (klar, menschlich, ohne Floskeln)
- ABSOLUT NICHT gendern (keine geschlechtsspezifischen Formulierungen wie "Mitarbeiter:in", "Kolleg:innen", "Mitarbeitende" etc. - verwende stattdessen "Mitarbeiter", "Kollegen", "Kunden")
- sprachlich dem Erfahrungs- und Alterskontext angepasst sein
- kulturelle Werte wie Freiheit, Vertrauen, Verantwortung und Wertschätzung berücksichtigen
- empathisch und unterstützend wirken
- den beruflichen Kontext der Person berücksichtigen
- ALLE 11 Kategorien systematisch durchgehen, auch wenn zu manchen keine direkten Antworten vorliegen
- für jede Kategorie die wichtigsten Erkenntnisse hervorheben oder feststellen, dass hier noch Potenzial für Reflexion besteht
- konkrete Handlungsimpulse und Entwicklungsmöglichkeiten identifizieren
      
      Passe deine Sprache so an, dass sie für die jeweilige Zielgruppe leicht verständlich ist:
      - Für junge oder neue Mitarbeiter: eher klar, freundlich, einladend
      - Für erfahrene oder langjährige Mitarbeiter: eher würdevoll, respektvoll, anerkennend
      
      Strukturiere die Zusammenfassung in folgendem Format:
      
      Einleitung:
      [Überblick über die Reflexion mit den wichtigsten Erkenntnissen und Kernaussagen]
      
      Systematische Analyse:
      
      1. Rollenverständnis:
      [Analyse ohne Aufzählungszeichen, nur normaler Text]
      
      2. Stolz & persönliche Leistung:
      [Analyse ohne Aufzählungszeichen, nur normaler Text]
      
      3. Herausforderungen & Umgang mit Druck:
      [Analyse ohne Aufzählungszeichen, nur normaler Text]
      
      4. Verantwortung & Selbstorganisation:
      [Analyse ohne Aufzählungszeichen, nur normaler Text]
      
      5. Zusammenarbeit & Feedback:
      [Analyse ohne Aufzählungszeichen, nur normaler Text]
      
      6. Entwicklung & Lernen:
      [Analyse ohne Aufzählungszeichen, nur normaler Text]
      
      7. Energie & Belastung:
      [Analyse ohne Aufzählungszeichen, nur normaler Text]
      
      8. Kultur & Werte:
      [Analyse ohne Aufzählungszeichen, nur normaler Text]
      
      9. Entscheidungsspielräume & Freiheit:
      [Analyse ohne Aufzählungszeichen, nur normaler Text]
      
      10. Wertschätzung & Gesehenwerden:
      [Analyse ohne Aufzählungszeichen, nur normaler Text]
      
      11. Perspektive & Zukunft:
      [Analyse ohne Aufzählungszeichen, nur normaler Text]
      
      Empfehlungen für dein Mitarbeiterjahresgespräch:
      [Handlungsimpulse ohne Aufzählungszeichen, nur normaler Text]
    `

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Du bist ein reflektierter Coach mit Feingefühl für Sprache, berufliche Rollen und persönliche Entwicklung. Deine Aufgabe ist es, bei Mitarbeiterentwicklungsgesprächen in einem augenoptischen Unternehmen empathische und hilfreiche Zusammenfassungen zu erstellen.

Berücksichtige dabei:
- Arbeitsbereich, Rolle/Funktion, Erfahrung und Kundenkontakt der Person
- Sprachliche Anpassung an den Erfahrungs- und Alterskontext
- Kulturelle Werte wie Freiheit, Vertrauen, Verantwortung und Wertschätzung
- Empathie und Unterstützung ohne Suggestion oder Floskeln
- Strukturierung nach den 11 definierten Reflexionskategorien`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1200,
      temperature: 0.7,
    })

    const summary = completion.choices[0]?.message?.content || 'Zusammenfassung konnte nicht generiert werden.'

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Fehler bei der Zusammenfassungsgenerierung:', error)
    return NextResponse.json(
              { 
          summary: 'Es gab einen Fehler bei der Generierung der Zusammenfassung. Bitte versuche es später erneut.'
        },
      { status: 200 }
    )
  }
} 