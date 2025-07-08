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
      Erstelle eine empathische und strukturierte Zusammenfassung der Mitarbeiter:innen-Reflexion:
      
      ${answersText}${roleContextInfo}
      
      Die Zusammenfassung sollte:
      - Die wichtigsten Erkenntnisse hervorheben
      - Entwicklungsbereiche identifizieren
      - Stärken würdigen
      - Konkrete Handlungsimpulse geben
      - Empathisch und unterstützend geschrieben sein
      - Den beruflichen Kontext der Person berücksichtigen
      
      Strukturiere die Zusammenfassung in:
      1. Zusammenfassung der Selbstreflexion
      2. Identifizierte Stärken
      3. Entwicklungsbereiche
      4. Empfohlene nächste Schritte
      
      Verwende eine warme, unterstützende Sprache und berücksichtige dabei die spezifische Rolle und Erfahrung der Person.
    `

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Du bist ein erfahrener Coach, der empathische und hilfreiche Zusammenfassungen erstellt. Berücksichtige dabei immer den beruflichen Kontext und die Erfahrung der Person.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
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