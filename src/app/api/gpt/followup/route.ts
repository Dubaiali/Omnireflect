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
      Als empathischer Coach, generiere 2-3 vertiefende Nachfragen zu folgender Antwort:
      
      Frage: ${question}
      Antwort: ${answer}${roleContextInfo}
      
      Die Nachfragen sollten:
      - Offen und neugierig sein
      - Zur Selbstreflexion anregen
      - Konkret und relevant sein
      - Empathisch und unterstützend wirken
      - Den beruflichen Kontext der Person berücksichtigen
      
      Gib nur die Fragen zurück, eine pro Zeile, ohne Nummerierung.
    `

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Du bist ein empathischer Coach, der Mitarbeiter:innen bei ihrer Selbstreflexion unterstützt. Berücksichtige dabei immer den beruflichen Kontext der Person.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content || ''
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