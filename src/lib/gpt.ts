export interface FollowUpRequest {
  question: string
  answer: string
  roleContext?: RoleContext
}

export interface SummaryRequest {
  answers: Record<string, string>
  followUpQuestions: Record<string, string[]>
  roleContext?: RoleContext
}

export interface RoleContext {
  workAreas: string[]
  functions: string[]
  experienceYears: string
  customerContact: string
  dailyTasks: string
}

export interface Question {
  id: string
  question: string
  category: string
}

export async function generatePersonalizedQuestions(
  roleContext?: RoleContext
): Promise<Question[]> {
  try {
    const response = await fetch('/api/gpt/questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roleContext }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      
      // Spezifische Behandlung von Rate Limit Fehlern
      if (errorData.error && errorData.error.includes('Rate limit')) {
        throw new Error('Rate limit überschritten. Bitte warte einen Moment und versuche es erneut.')
      }
      
      throw new Error(errorData.error || 'API-Anfrage fehlgeschlagen')
    }

    const data = await response.json()
    return data.questions || []
  } catch (error) {
    console.error('Fehler bei der Fragen-Generierung:', error)
    throw error // Fehler weiterwerfen, damit das Frontend ihn behandeln kann
  }
}

export async function generateFollowUpQuestions(
  question: string,
  answer: string,
  roleContext?: RoleContext
): Promise<string[]> {
  try {
    const response = await fetch('/api/gpt/followup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, answer, roleContext }),
    })

    if (!response.ok) {
      throw new Error('API-Anfrage fehlgeschlagen')
    }

    const data = await response.json()
    return data.questions || []
  } catch (error) {
    console.error('Fehler bei der GPT-Anfrage:', error)
    throw error // Fehler weiterwerfen, damit das Frontend ihn behandeln kann
  }
}

export async function generateSummary(
  answers: Record<string, string>,
  followUpQuestions: Record<string, string[]>,
  roleContext?: RoleContext,
  questions?: Question[]
): Promise<string> {
  try {
    const response = await fetch('/api/gpt/summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answers, followUpQuestions, roleContext, questions }),
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