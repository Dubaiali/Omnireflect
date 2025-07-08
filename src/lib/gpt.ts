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
      throw new Error('API-Anfrage fehlgeschlagen')
    }

    const data = await response.json()
    return data.questions || []
  } catch (error) {
    console.error('Fehler bei der Fragen-Generierung:', error)
    // Fallback zu Standard-Fragen
    return [
      {
        id: 'role',
        question: 'Wie verstehst du deine aktuelle Rolle im Unternehmen und welche Verantwortlichkeiten sind dir besonders wichtig?',
        category: 'Rollenverständnis'
      },
      {
        id: 'achievements',
        question: 'Welche Erfolge und Leistungen machst du im vergangenen Jahr besonders stolz?',
        category: 'Leistungen'
      },
      {
        id: 'challenges',
        question: 'Mit welchen Herausforderungen hast du dich konfrontiert gesehen und wie hast du diese bewältigt?',
        category: 'Herausforderungen'
      },
      {
        id: 'development',
        question: 'In welchen Bereichen würdest du gerne wachsen und dich weiterentwickeln?',
        category: 'Entwicklung'
      },
      {
        id: 'feedback',
        question: 'Wie bewertest du die Qualität des Feedbacks, das du von Kolleg:innen und Vorgesetzten erhältst?',
        category: 'Feedback'
      },
      {
        id: 'collaboration',
        question: 'Wie erlebst du die Zusammenarbeit im Team und welche Verbesserungen würdest du dir wünschen?',
        category: 'Zusammenarbeit'
      },
      {
        id: 'goals',
        question: 'Welche konkreten Ziele hast du dir für das kommende Jahr gesetzt?',
        category: 'Ziele'
      },
      {
        id: 'support',
        question: 'Welche Art von Unterstützung oder Ressourcen würden dir helfen, deine Ziele zu erreichen?',
        category: 'Unterstützung'
      },
      {
        id: 'work_life',
        question: 'Wie zufrieden bist du mit deiner Work-Life-Balance und was könnte verbessert werden?',
        category: 'Work-Life-Balance'
      },
      {
        id: 'future',
        question: 'Wo siehst du dich in 3-5 Jahren und welche Schritte sind dafür notwendig?',
        category: 'Zukunftsperspektive'
      }
    ]
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
    return [
      'Können Sie das noch etwas genauer erklären?',
      'Was bedeutet das für Ihre zukünftige Entwicklung?'
    ]
  }
}

export async function generateSummary(
  answers: Record<string, string>,
  followUpQuestions: Record<string, string[]>,
  roleContext?: RoleContext
): Promise<string> {
  try {
    const response = await fetch('/api/gpt/summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answers, followUpQuestions, roleContext }),
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