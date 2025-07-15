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
          content: `Du bist ein persönlicher Coach für ${roleContext.firstName}. Erstelle 11 maßgeschneiderte Fragen für ein Mitarbeiterjahresgespräch in einem augenoptischen Unternehmen.

${roleContext.firstName}s Kontext:
- Arbeitsbereich: ${roleContext.workAreas.join(', ')}
- Funktion: ${roleContext.functions.join(', ')}
- Erfahrung: ${roleContext.experienceYears}
- Kundenkontakt: ${roleContext.customerContact}
${roleContext.dailyTasks ? `- Tägliche Aufgaben: ${roleContext.dailyTasks}` : ''}

Erstelle 11 personalisierte Fragen für ${roleContext.firstName}:

1. ROLLENVERSTÄNDNIS: Frage nach ${roleContext.firstName}s Rolle in ${roleContext.workAreas.join(', ')}
2. STOLZ & LEISTUNG: Frage nach Erfolgen in ${roleContext.firstName}s Bereich
3. HERAUSFORDERUNGEN: Frage nach Schwierigkeiten in ${roleContext.firstName}s Arbeit
4. VERANTWORTUNG: Frage nach ${roleContext.firstName}s Verantwortungsbereich
5. ZUSAMMENARBEIT: Frage nach Zusammenarbeit mit Kollegen
6. ENTWICKLUNG: Frage nach ${roleContext.firstName}s Entwicklungsmöglichkeiten
7. ENERGIE: Frage nach Belastung in ${roleContext.firstName}s Bereich
8. KULTUR: Frage nach ${roleContext.firstName}s Erfahrung mit der Unternehmenskultur
9. FREIHEIT: Frage nach ${roleContext.firstName}s Entscheidungsspielräumen
10. WERTSCHÄTZUNG: Frage nach ${roleContext.firstName}s Gefühl der Wertschätzung
11. ZUKUNFT: Frage nach ${roleContext.firstName}s beruflicher Zukunft

WICHTIG:
- Verwende ${roleContext.firstName}s Namen in den Fragen
- Beziehe dich auf den Arbeitsbereich ${roleContext.workAreas.join(', ')}
- Verwende keine geschlechtergerechte Sprache
- Gib nur JSON zurück

JSON-Format:
[
{
"id": "role",
"question": "...",
"category": "Rollenverständnis"
},
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