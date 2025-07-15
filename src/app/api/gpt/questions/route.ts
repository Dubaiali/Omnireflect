import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getSessionFromRequest } from '@/lib/session'
import { validateAndSanitize, roleContextSchema } from '@/lib/validation'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface RoleContext {
  firstName: string
  lastName: string
  workAreas: string[]
  functions: string[]
  experienceYears: string
  customerContact: string
  dailyTasks?: string
}

export async function POST(request: NextRequest) {
  try {
    // Session-Validierung entfernt - Frontend ist bereits über Zustand-Store authentifiziert
    // const session = getSessionFromRequest(request)
    // if (!session || !session.hashId) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized. Please log in.' },
    //     { status: 401 }
    //   )
    // }

    const body = await request.json()
    
    // Input validieren
    let roleContext: RoleContext | undefined
    if (body.roleContext) {
      try {
        roleContext = validateAndSanitize(roleContextSchema, body.roleContext)
      } catch (error) {
        console.error('Validierungsfehler:', error)
        return NextResponse.json(
          { error: 'Ungültige Rollenkontext-Daten. Bitte fülle alle Pflichtfelder aus.' },
          { status: 400 }
        )
      }
    }

    if (!roleContext) {
      return NextResponse.json(
        { error: 'Rollenkontext ist erforderlich für die Generierung personalisierter Fragen. Bitte fülle zuerst dein Profil aus.' },
        { status: 400 }
      )
    }

    const roleContextInfo = `
    Rollenkontext der Person:
    - Name: ${roleContext.firstName} ${roleContext.lastName}
    - Arbeitsbereich: ${roleContext.workAreas.join(', ')}
    - Funktion: ${roleContext.functions.join(', ')}
    - Erfahrung: ${roleContext.experienceYears}
    - Kundenkontakt: ${roleContext.customerContact}
    ${roleContext.dailyTasks ? `- Tägliche Aufgaben: ${roleContext.dailyTasks}` : ''}
    `

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Du bist ein empathischer Coach für Mitarbeiterentwicklungsgespräche in der Augenoptik-Branche. Erstelle 11 personalisierte Reflexionsfragen für ${roleContext.firstName}.

KONTEXT:
- Name: ${roleContext.firstName} ${roleContext.lastName}
- Arbeitsbereiche: ${roleContext.workAreas.join(', ')}
- Funktion: ${roleContext.functions.join(', ')}
- Erfahrung: ${roleContext.experienceYears}
- Kundenkontakt: ${roleContext.customerContact}
${roleContext.dailyTasks ? `- Tägliche Aufgaben: ${roleContext.dailyTasks}` : ''}

ANFORDERUNGEN:
- Verwende ${roleContext.firstName}s spezifische Daten in den Fragen
- Verschiedene Fragetypen: "Was", "Wie", "Wann", "Welche", "Inwiefern"
- Konkrete Beispiele aus ${roleContext.firstName}s Arbeitsbereich
- Maximal 2 Sätze pro Frage
- Keine Gendersprache (keine "Mitarbeiter:in", "Kolleg:innen")
- Persönliche Ansprache mit ${roleContext.firstName}s Namen

KATEGORIEN (je eine Frage):
1. Rollenverständnis
2. Stolz & persönliche Leistung  
3. Herausforderungen & Umgang mit Druck
4. Verantwortung & Selbstorganisation
5. Zusammenarbeit & Feedback
6. Entwicklung & Lernen
7. Energie & Belastung
8. Kultur & Werte
9. Entscheidungsspielräume & Freiheit
10. Wertschätzung & Gesehenwerden
11. Perspektive & Zukunft

BEISPIELE für spezifische Fragen:
- "Was macht für dich einen guten ${roleContext.functions[0]} in der ${roleContext.workAreas[0]} aus?"
- "Welche Situation mit ${roleContext.customerContact.includes('täglich') ? 'Kunden' : 'Kollegen'} hat dich zuletzt besonders gefordert?"
- "Wie hat sich dein Verständnis deiner Rolle in den ${roleContext.experienceYears} entwickelt?"

Antworte nur mit JSON im Format:
[
{"id": "role", "question": "...", "category": "Rollenverständnis"},
{"id": "stolz", "question": "...", "category": "Stolz & persönliche Leistung"},
...
]`
        }
      ],
      max_tokens: 2000,
      temperature: 0.8,
    })

    const response = completion.choices[0]?.message?.content || ''
    
    try {
      // Versuche JSON zu parsen
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsedQuestions = JSON.parse(jsonMatch[0])
        
        // Prüfe ob wir gültige personalisierte Fragen haben
        if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
          const validQuestions = parsedQuestions.filter((q: any) => 
            q && q.id && q.question && q.category
          )
          
          if (validQuestions.length >= 10) { // Mindestens 10 von 11 Fragen sollten vorhanden sein
            return NextResponse.json({ questions: validQuestions })
          }
        }
      }
      
      // Wenn keine gültigen Fragen generiert wurden, Fehler zurückgeben
      throw new Error('Keine gültigen Fragen von GPT erhalten')
      
    } catch (parseError) {
      console.error('Fehler beim Parsen der GPT-Antwort:', parseError)
      throw new Error('Fehler bei der Fragen-Generierung')
    }
  } catch (error) {
    console.error('Fehler bei der Fragen-Generierung:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Generierung der Fragen. Bitte versuche es später erneut.' },
      { status: 500 }
    )
  }
} 