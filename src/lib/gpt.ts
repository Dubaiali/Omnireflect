export interface FollowUpRequest {
  question: string
  answer: string
}

export interface SummaryRequest {
  answers: Record<string, string>
  followUpQuestions: Record<string, string[]>
}

export async function generateFollowUpQuestions(
  question: string,
  answer: string
): Promise<string[]> {
  try {
    const response = await fetch('/api/gpt/followup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, answer }),
    })

    if (!response.ok) {
      throw new Error('API-Anfrage fehlgeschlagen')
    }

    const data = await response.json()
    return data.questions || []
  } catch (error) {
    console.error('Fehler bei der GPT-Anfrage:', error)
    return [
      'Können Sie das noch etwas genauer erklären?',
      'Was bedeutet das für Ihre zukünftige Entwicklung?'
    ]
  }
}

export async function generateSummary(
  answers: Record<string, string>,
  followUpQuestions: Record<string, string[]>
): Promise<string> {
  try {
    const response = await fetch('/api/gpt/summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answers, followUpQuestions }),
    })

    if (!response.ok) {
      throw new Error('API-Anfrage fehlgeschlagen')
    }

    const data = await response.json()
    return data.summary || 'Zusammenfassung konnte nicht generiert werden.'
  } catch (error) {
    console.error('Fehler bei der Zusammenfassungsgenerierung:', error)
    return 'Es gab einen Fehler bei der Generierung der Zusammenfassung. Bitte versuche es später erneut.'
  }
} 