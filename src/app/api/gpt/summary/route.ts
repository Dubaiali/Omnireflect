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

    // Erstelle strukturierte Antworten mit Follow-ups
    let structuredAnswers = ''
    let followUpAnswers = ''
    
    if (questions && Array.isArray(questions)) {
      questions.forEach((question, index) => {
        const answer = answers[question.id]
        const followUps = followUpQuestions[question.id] || []
        
        if (answer) {
          structuredAnswers += `Frage ${index + 1} (${question.category}): ${question.question}\nAntwort: ${answer}\n\n`
          
          // Sammle Follow-up-Antworten
          followUps.forEach((followUpQuestion: string, followUpIndex: number) => {
            const followUpAnswer = answers[`${question.id}_followup_${followUpIndex}`]
            if (followUpAnswer) {
              followUpAnswers += `Vertiefung zu Frage ${index + 1}: ${followUpQuestion}\nAntwort: ${followUpAnswer}\n\n`
            }
          })
        }
      })
    } else {
      // Fallback für alte Struktur
      structuredAnswers = Object.entries(answers)
        .filter(([key]) => !key.includes('_followup_'))
        .map(([question, answer]) => `Frage: ${question}\nAntwort: ${answer}`)
        .join('\n\n')
    }

    let roleContextInfo = ''
    if (roleContext) {
      roleContextInfo = `
      
      Rollenkontext:
      - Arbeitsbereich: ${roleContext.workAreas.join(', ')}
      - Funktion: ${roleContext.functions.join(', ')}
      - Erfahrung: ${roleContext.experienceYears}
      - Kundenkontakt: ${roleContext.customerContact}
      ${roleContext.dailyTasks ? `- Tägliche Aufgaben: ${roleContext.dailyTasks}` : ''}
      `
    }

    const prompt = `
      Als reflektierter Coach erstelle eine empathische und handlungsorientierte Zusammenfassung der Mitarbeiterreflexion.
      
      HAUPTANTWORTEN:
      ${structuredAnswers}
      
      ${followUpAnswers ? `VERTIEFENDE NACHFRAGEN:\n${followUpAnswers}` : ''}${roleContextInfo}
      
      ANALYSEAUFGABE:
      
      1. **Kernaussagen identifizieren** (2-3 wichtigste Erkenntnisse)
      2. **Prioritätsbereiche analysieren** (6-8 wichtigste Themen basierend auf Antworttiefe)
      3. **Entwicklungsbereiche erkennen** (2-3 "Blinde Flecken" oder wenig reflektierte Bereiche)
      4. **Konkrete Handlungsempfehlungen** (3-5 spezifische, umsetzbare Schritte)
      
      ANFORDERUNGEN:
      - Du-Form, klar und menschlich, ohne Floskeln
      - ABSOLUT NICHT gendern (keine "Mitarbeiter:innen", "Kolleg:innen" etc.)
      - Sprachlich an Erfahrungslevel angepasst
      - Follow-up-Antworten für tiefere Einblicke nutzen
      - Konkrete, umsetzbare Empfehlungen mit Zeitrahmen
      - Fokus auf Qualität statt Quantität
      
      STRUKTUR:
      
      KERNAUSSAGEN:
      [2-3 wichtigste Erkenntnisse aus der Reflexion]
      
      PRIORITÄTSANALYSE:
      [6-8 wichtigste Bereiche, priorisiert nach Antworttiefe und Relevanz]
      
      ENTWICKLUNGSBEREICHE:
      [2-3 Bereiche mit Potenzial für weitere Reflexion oder Entwicklung]
      
      HANDLUNGSEMPFEHLUNGEN:
      [3-5 konkrete, umsetzbare Schritte mit Zeitrahmen (1-3 Monate)]
    `

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Du bist ein reflektierter Coach mit Feingefühl für Sprache und persönliche Entwicklung. Deine Aufgabe ist es, bei Mitarbeiterentwicklungsgesprächen empathische und handlungsorientierte Zusammenfassungen zu erstellen.

Berücksichtige dabei:
- Arbeitsbereich, Rolle/Funktion, Erfahrung und Kundenkontakt
- Follow-up-Antworten für tiefere Einblicke
- Sprachliche Anpassung an den Erfahrungskontext
- Konkrete, umsetzbare Handlungsempfehlungen
- Fokus auf Qualität und Relevanz statt Vollständigkeit`
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