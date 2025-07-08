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
      
      Rollenkontext der Person:
      - Arbeitsbereich: ${roleContext.workAreas.join(', ')}
      - Funktion: ${roleContext.functions.join(', ')}
      - Erfahrung: ${roleContext.experienceYears}
      - Kundenkontakt: ${roleContext.customerContact}
      ${roleContext.dailyTasks ? `- Tägliche Aufgaben: ${roleContext.dailyTasks}` : ''}
      `
    }

    const prompt = `
      Als reflektierter Coach mit Feingefühl für Sprache, berücksichtige den beruflichen Kontext der Person und analysiere die gegebene Antwort.

      Ursprungsfrage: ${question}
      Antwort: ${answer}${roleContextInfo}

      WICHTIG: Generiere nur dann 1-2 vertiefende Nachfragen, wenn die Antwort Spielraum für weitere Reflexion offen lässt. Das ist der Fall, wenn:
      - Die Antwort oberflächlich oder kurz ist
      - Emotionale oder persönliche Aspekte angesprochen werden, die vertieft werden könnten
      - Konkrete Beispiele oder Situationen erwähnt werden, die ausführlicher besprochen werden könnten
      - Entwicklungsmöglichkeiten oder Herausforderungen angedeutet werden
      - Die Antwort Fragen aufwirft oder unvollständig erscheint

      Generiere KEINE Nachfragen, wenn:
      - Die Antwort bereits sehr detailliert und vollständig ist
      - Die Antwort eine klare, abschließende Position vertritt
      - Keine weiteren Reflexionsmöglichkeiten erkennbar sind

      Falls Nachfragen angebracht sind, sollten sie:
      - in Du-Form verfasst sein (klar, menschlich, ohne Floskeln)
      - sprachlich dem Erfahrungs- und Alterskontext angepasst sein
      - kulturelle Werte wie Freiheit, Vertrauen, Verantwortung und Wertschätzung berücksichtigen
      - maximal 1-2 Sätze lang sein
      - offen und neugierig wirken
      - zur Selbstreflexion anregen
      - konkret und relevant sein
      - empathisch und unterstützend wirken

      Passe deine Sprache so an, dass sie für die jeweilige Zielgruppe leicht verständlich ist:
      - Für junge oder neue Mitarbeitende: eher klar, freundlich, einladend
      - Für erfahrene oder langjährige Mitarbeitende: eher würdevoll, respektvoll, anerkennend

      Antworte mit:
      - "KEINE_NACHFRAGEN" wenn keine Nachfragen angebracht sind
      - Oder gib 1-2 Nachfragen zurück, eine pro Zeile, ohne Nummerierung
    `

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Du bist ein reflektierter Coach mit Feingefühl für Sprache, berufliche Rollen und persönliche Entwicklung. Deine Aufgabe ist es, bei Mitarbeiterentwicklungsgesprächen in einem augenoptischen Unternehmen vertiefende Nachfragen zu generieren, aber nur wenn diese sinnvoll und hilfreich sind.

Berücksichtige dabei:
- Arbeitsbereich, Rolle/Funktion, Erfahrung und Kundenkontakt der Person
- Sprachliche Anpassung an den Erfahrungs- und Alterskontext
- Kulturelle Werte wie Freiheit, Vertrauen, Verantwortung und Wertschätzung
- Empathie und Unterstützung ohne Suggestion oder Floskeln`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
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
      { 
        questions: [
          'Können Sie das noch etwas genauer erklären?',
          'Was bedeutet das für Ihre zukünftige Entwicklung?'
        ]
      },
      { status: 200 }
    )
  }
} 