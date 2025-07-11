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
    const { answers, followUpQuestions, roleContext, questions } = await request.json()

    if (!answers || Object.keys(answers).length === 0) {
      return NextResponse.json(
        { error: 'Antworten sind erforderlich' },
        { status: 400 }
      )
    }

    // Erstelle eine strukturierte Darstellung der Antworten mit Kategorien
    const answersText = Object.entries(answers)
      .filter(([questionId, answer]) => !questionId.includes('_followup_')) // Nur Hauptantworten
      .map(([questionId, answer]) => {
        // Finde die entsprechende Frage basierend auf der ID
        const question = questions?.find((q: any) => q.id === questionId)
        return `Kategorie: ${question?.category || 'Unbekannt'}\nFrage: ${question?.question || questionId}\nAntwort: ${answer}`
      })
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
      
      Erstelle eine Zusammenfassung, die die Antworten nach diesen 11 Kategorien analysiert und strukturiert:
      1. Rollenverständnis
      2. Stolz & persönliche Leistung
      3. Herausforderungen & Umgang mit Druck
      4. Verantwortung & Selbstorganisation
      5. Zusammenarbeit & Feedback
      6. Entwicklung & Lernen
      7. Energie & Belastung
      8. Kultur & Werte
      9. Entscheidungsspielräume & Freiheit
      10. Wertschätzung & Gesehenwerden
      11. Perspektive & Zukunft
      
      Die Zusammenfassung sollte:
- in Du-Form verfasst sein (klar, menschlich, ohne Floskeln)
- ABSOLUT NICHT gendern (keine geschlechtsspezifischen Formulierungen wie "Mitarbeiter:in", "Kolleg:innen", "Mitarbeitende" etc. - verwende stattdessen "Mitarbeiter", "Kollegen", "Kunden")
- sprachlich dem Erfahrungs- und Alterskontext angepasst sein
- kulturelle Werte wie Freiheit, Vertrauen, Verantwortung und Wertschätzung berücksichtigen
- empathisch und unterstützend wirken
- den beruflichen Kontext der Person berücksichtigen
- WICHTIG: Verwende IMMER die konkreten Antworten der Person - keine generischen Aussagen
- Beziehe dich direkt auf die gegebenen Antworten und zitiere sie sinngemäß
- Erstelle eine personalisierte Analyse basierend auf den tatsächlichen Antworten
- Nur Kategorien behandeln, zu denen es Antworten gibt
- für jede beantwortete Kategorie die wichtigsten Erkenntnisse aus den Antworten hervorheben
- konkrete Handlungsimpulse und Entwicklungsmöglichkeiten identifizieren
      
      Passe deine Sprache so an, dass sie für die jeweilige Zielgruppe leicht verständlich ist:
      - Für junge oder neue Mitarbeiter: eher klar, freundlich, einladend
      - Für erfahrene oder langjährige Mitarbeiter: eher würdevoll, respektvoll, anerkennend
      
      Strukturiere die Zusammenfassung in:
      1. Einleitung: Überblick über die Reflexion
      2. Kategorienbasierte Analyse (nur beantwortete Kategorien)
      3. Zusammenfassung der wichtigsten Erkenntnisse
      4. Konkrete Handlungsimpulse und nächste Schritte
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
- WICHTIG: Verwende IMMER die konkreten Antworten der Person - keine generischen Aussagen
- Erstelle eine personalisierte Analyse basierend auf den tatsächlichen Antworten`
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