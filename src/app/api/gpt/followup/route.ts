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
  let answer: string = ''
  
  try {
    const { question, answer: answerData, roleContext } = await request.json()
    answer = answerData

    console.log('DEBUG: API /followup - Empfangene Daten:', {
      hasQuestion: !!question,
      hasAnswer: !!answer,
      hasRoleContext: !!roleContext,
      roleContextType: typeof roleContext,
      roleContextKeys: roleContext ? Object.keys(roleContext) : null
    })

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
      
      console.log('DEBUG: Rollenkontext für Follow-up:', roleContextInfo)
    } else {
      console.log('DEBUG: Kein Rollenkontext für Follow-up verfügbar')
    }

    const questionTypes = getFollowUpQuestionTypes()

    const prompt = `
      Als einfühlsamer Coach für persönliche Entwicklung und berufliche Reflexion, analysiere die gegebene Antwort und entscheide, ob vertiefende Nachfragen hilfreich wären.

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
      - Persönliche Wachstumserfahrungen angesprochen werden

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
      - "Was hat dich dabei am meisten überrascht..." (Überraschung)
      - "Wie hat sich deine Sicht darauf verändert..." (Entwicklung)

      FOKUS-BEREICHE für Follow-ups:
      - Persönliche Wachstumserfahrungen vertiefen
      - Emotionale Aspekte und Werte erkunden
      - Konkrete Beispiele und Situationen ausarbeiten
      - Zukünftige Entwicklungsmöglichkeiten erkunden
      - Selbstreflexion und Bewusstsein fördern

      QUALITÄTSKRITERIEN:
      - Genau 1 Nachfrage (nicht mehr, nicht weniger)
      - Jede Frage maximal 2 Sätze
      - Persönlich und einladend
      - Konkret und relevant
      - Empathisch und unterstützend
      - Keine Gendersprache (keine "Mitarbeiter:in", "Kolleg:innen")
      - Sprachlich dem Erfahrungskontext angepasst
      - Fokussiere auf persönliche Entwicklung, nicht nur Arbeitsbereich

      WICHTIG: Gib nur EINE einzige Nachfrage zurück, nicht mehrere!

      Antworte mit:
      - "KEINE_NACHFRAGEN" wenn keine Nachfragen angebracht sind
      - Oder gib genau 1 Nachfrage zurück, ohne Nummerierung oder Aufzählungszeichen
    `

    console.log('DEBUG: Sende Follow-up-Prompt an GPT')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Du bist ein einfühlsamer Coach für persönliche Entwicklung und berufliche Reflexion. Deine Aufgabe ist es, bei Bedarf vertiefende Nachfragen zu generieren, die zur Selbstreflexion anregen.

Berücksichtige dabei:
- Den persönlichen Kontext und die Erfahrung der Person
- Sprachliche Anpassung an den Erfahrungs- und Alterskontext
- Kulturelle Werte wie Freiheit, Vertrauen, Verantwortung und Wertschätzung
- Empathie und Unterstützung ohne Suggestion oder Floskeln
- Vielfalt in Fragetypen und Ansprache
- Fokus auf persönliche Entwicklung und Wachstum`
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
    console.log('DEBUG: GPT Follow-up-Antwort erhalten:', response.trim())
    
    // Prüfe, ob keine Nachfragen gewünscht sind
    if (response.trim().toUpperCase() === 'KEINE_NACHFRAGEN') {
      console.log('DEBUG: Keine Nachfragen gewünscht')
      return NextResponse.json({ questions: [] })
    }
    
    // Nimm nur die erste Zeile als einzige Nachfrage
    const singleQuestion = response.split('\n')[0].trim()
    
    // Prüfe, ob die Frage gültig ist
    if (singleQuestion && singleQuestion.length > 0) {
      console.log('DEBUG: Nachfrage generiert:', singleQuestion)
      return NextResponse.json({ questions: [singleQuestion] })
    } else {
      console.log('DEBUG: Keine gültige Nachfrage generiert')
      return NextResponse.json({ questions: [] })
    }
  } catch (error) {
    console.error('DEBUG: Fehler bei der GPT-Anfrage:', error)
    
    // Keine Fallbacks mehr - nur echte KI-Antworten
    return NextResponse.json(
      { error: 'Fehler bei der Generierung der Nachfragen. Bitte versuche es später erneut.' },
      { status: 500 }
    )
  }
} 