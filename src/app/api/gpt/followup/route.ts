import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { question, answer } = await request.json()

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Frage und Antwort sind erforderlich' },
        { status: 400 }
      )
    }

    const prompt = `
      Als empathischer Coach, generiere 1-2 einfache Nachfragen zu folgender Antwort:
      
      Frage: ${question}
      Antwort: ${answer}
      
      Die Nachfragen sollten:
      - Einfach und verständlich sein
      - Natürlich und freundlich klingen
      - Mehr Details erfragen
      - Nicht zu kompliziert sein
      
      Gib nur die Fragen zurück, eine pro Zeile, ohne Nummerierung.
    `

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Du bist ein empathischer Coach, der Mitarbeiter:innen bei ihrer Selbstreflexion unterstützt.'
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