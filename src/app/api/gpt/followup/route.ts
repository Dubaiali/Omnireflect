import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface RoleContext {
  firstName?: string
  workAreas: string[]
  functions: string[]
  experienceYears: string
  customerContact: string
  dailyTasks?: string
}

// Verschiedene Follow-up-Fragetypen für mehr Variation
const getFollowUpQuestionTypes = () => {
  return [
    'Vertiefungsfrage',
    'Beispielsfrage',
    'Emotionsfrage',
    'Perspektivenfrage',
    'Lernfrage',
    'Zukunftsorientierte Frage',
    'Vergleichsfrage',
    'Hypothetische Frage',
    'Wertefrage',
    'Erfahrungsfrage'
  ]
}

export async function POST(request: NextRequest) {
  try {
    const { question, answer, roleContext } = await request.json()

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Frage und Antwort sind erforderlich' },
        { status: 400 }
      )
    }

    let roleContextInfo = ''
    if (roleContext) {
      roleContextInfo = `
      
      PERSÖNLICHER KONTEXT:
      - Name: ${roleContext.firstName || 'der Mitarbeiter'}
      - Arbeitsbereich: ${roleContext.workAreas.join(', ')}
      - Funktion: ${roleContext.functions.join(', ')}
      - Erfahrung: ${roleContext.experienceYears}
      - Kundenkontakt: ${roleContext.customerContact}
      ${roleContext.dailyTasks ? `- Tägliche Aufgaben: ${roleContext.dailyTasks}` : ''}
      `
    }

    const questionTypes = getFollowUpQuestionTypes()

    const prompt = `
      Als erfahrener Coach für Mitarbeiterentwicklungsgespräche in der Augenoptik-Branche, analysiere die gegebene Antwort und entscheide, ob vertiefende Nachfragen hilfreich wären.

      URSPRUNGSFRAGE: ${question}
      ANTWORT: ${answer}${roleContextInfo}

      ANALYSE-KRITERIEN für Nachfragen:
      ✅ GENERIERE Nachfragen, wenn:
      - Die Antwort oberflächlich oder kurz ist (< 50 Wörter)
      - Emotionale Aspekte angesprochen werden, die vertieft werden könnten
      - Konkrete Beispiele erwähnt werden, die ausführlicher besprochen werden könnten
      - Entwicklungsmöglichkeiten oder Herausforderungen angedeutet werden
      - Die Antwort Fragen aufwirft oder unvollständig erscheint
      - Potenzial für Selbstreflexion erkennbar ist

      ❌ KEINE Nachfragen, wenn:
      - Die Antwort bereits sehr detailliert und vollständig ist (> 100 Wörter)
      - Die Antwort eine klare, abschließende Position vertritt
      - Keine weiteren Reflexionsmöglichkeiten erkennbar sind
      - Die Person bereits sehr offen und reflektiert geantwortet hat

      VIELFALT & VARIATION:
      - Verwende verschiedene Fragetypen: ${questionTypes.join(', ')}
      - Variiere die Ansprache: Direkt, empathisch, neugierig, respektvoll
      - Nutze verschiedene Perspektiven: Vergangenheit, Gegenwart, Zukunft
      - Verwende unterschiedliche Techniken: Beispiele, Hypothesen, Vergleiche

      FRAGETECHNIKEN für Follow-ups:
      - "Kannst du mir ein konkretes Beispiel geben..." (Beispiele)
      - "Wie hat sich das auf dich ausgewirkt..." (Emotionen)
      - "Was würdest du anders machen..." (Lernen)
      - "Stell dir vor..." (Hypothesen)
      - "Vergleiche das mit..." (Vergleiche)
      - "Was bedeutet das für dich..." (Werte)
      - "Wie siehst du das in Zukunft..." (Zukunft)

      QUALITÄTSKRITERIEN:
      - Genau 1 Nachfrage (nicht mehr, nicht weniger)
      - Jede Frage maximal 2 Sätze
      - Persönlich und einladend
      - Konkret und relevant
      - Empathisch und unterstützend
      - Keine Gendersprache (keine "Mitarbeiter:in", "Kolleg:innen")
      - Sprachlich dem Erfahrungskontext angepasst

      Antworte mit:
      - "KEINE_NACHFRAGEN" wenn keine Nachfragen angebracht sind
      - Oder gib genau 1 Nachfrage zurück, ohne Nummerierung
    `

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Du bist ein erfahrener Coach für Mitarbeiterentwicklungsgespräche in der Augenoptik-Branche. Deine Aufgabe ist es, bei Bedarf vertiefende Nachfragen zu generieren, die zur Selbstreflexion anregen.

Berücksichtige dabei:
- Den persönlichen Kontext und die Erfahrung der Person
- Sprachliche Anpassung an den Erfahrungs- und Alterskontext
- Kulturelle Werte wie Freiheit, Vertrauen, Verantwortung und Wertschätzung
- Empathie und Unterstützung ohne Suggestion oder Floskeln
- Vielfalt in Fragetypen und Ansprache`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.8,
    })

    const response = completion.choices[0]?.message?.content || ''
    
    // Prüfe, ob keine Nachfragen gewünscht sind
    if (response.trim().toUpperCase() === 'KEINE_NACHFRAGEN') {
      return NextResponse.json({ questions: [] })
    }
    
    const questions = response.split('\n').filter(q => q.trim().length > 0)

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Fehler bei der GPT-Anfrage:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Generierung der Nachfragen. Bitte versuche es später erneut.' },
      { status: 500 }
    )
  }
} 