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
      Erstelle eine persönliche und einfache Zusammenfassung für den Mitarbeiter:
      
      ${answersText}
      
      Die Zusammenfassung sollte:
      - In Du-Form geschrieben sein
      - Persönlich und direkt ansprechen
      - Einfache, verständliche Sprache verwenden
      - Die wichtigsten Punkte zusammenfassen
      - Positiv und unterstützend sein
      
      Strukturiere die Zusammenfassung in:
      1. Deine Reflexion (was du gesagt hast)
      2. Deine Stärken (was du gut kannst)
      3. Deine Wünsche (was du möchtest)
      4. Nächste Schritte (was du tun kannst)
      
      Schreibe wie ein freundlicher Coach, der direkt mit dir spricht.
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