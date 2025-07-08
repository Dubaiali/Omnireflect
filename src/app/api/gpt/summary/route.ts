import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { answers, followUpQuestions } = await request.json()

    if (!answers || Object.keys(answers).length === 0) {
      return NextResponse.json(
        { error: 'Antworten sind erforderlich' },
        { status: 400 }
      )
    }

    const answersText = Object.entries(answers)
      .map(([question, answer]) => `Frage: ${question}\nAntwort: ${answer}`)
      .join('\n\n')

    const prompt = `
      Erstelle eine empathische und strukturierte Zusammenfassung der Mitarbeiter:innen-Reflexion:
      
      ${answersText}
      
      Die Zusammenfassung sollte:
      - Die wichtigsten Erkenntnisse hervorheben
      - Entwicklungsbereiche identifizieren
      - Stärken würdigen
      - Konkrete Handlungsimpulse geben
      - Empathisch und unterstützend geschrieben sein
      
      Strukturiere die Zusammenfassung in:
      1. Zusammenfassung der Selbstreflexion
      2. Identifizierte Stärken
      3. Entwicklungsbereiche
      4. Empfohlene nächste Schritte
      
      Verwende eine warme, unterstützende Sprache.
    `

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Du bist ein erfahrener Coach, der empathische und hilfreiche Zusammenfassungen erstellt.'
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