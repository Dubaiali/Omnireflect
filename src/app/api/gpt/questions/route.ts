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
          content: `Du bist ein empathischer Coach mit tiefem Verständnis für die Augenoptik-Branche und persönliche Entwicklung. Deine Aufgabe ist es, für ${roleContext.firstName} einen individuellen Fragenkatalog zu erstellen, der spezifisch auf ${roleContext.firstName}s Situation zugeschnitten ist.

WICHTIG: Nutze ${roleContext.firstName}s spezifische Kontextdaten, um Fragen zu stellen, die nur für ${roleContext.firstName} relevant sind. Vermeide generische Fragen - jede Frage sollte sich direkt auf ${roleContext.firstName}s Rolle, Erfahrung und Arbeitsbereich beziehen.

KONTEXT-ANALYSE für ${roleContext.firstName}:
- Arbeitsbereiche: ${roleContext.workAreas.join(', ')} - Nutze diese spezifisch in den Fragen
- Funktion: ${roleContext.functions.join(', ')} - Berücksichtige die Hierarchie und Verantwortung
- Erfahrung: ${roleContext.experienceYears} - Passe die Tiefe und Komplexität entsprechend an
- Kundenkontakt: ${roleContext.customerContact} - Integriere dies in relevante Fragen
${roleContext.dailyTasks ? `- Tägliche Aufgaben: ${roleContext.dailyTasks} - Nutze diese für konkrete Beispiele` : ''}

SPRACHLICHE ANPASSUNG:
- Für ${roleContext.experienceYears.includes('Monate') || roleContext.experienceYears.includes('< 6') ? 'neue' : 'erfahrene'} Mitarbeiter: ${roleContext.experienceYears.includes('Monate') || roleContext.experienceYears.includes('< 6') ? 'klar, freundlich, einladend' : 'würdevoll, respektvoll, anerkennend'}
- Verwende ${roleContext.firstName}s Namen gelegentlich für persönlichere Ansprache
- ABSOLUT NICHT gendern (keine "Mitarbeiter:in", "Kolleg:innen" etc.)

FRAGEN-CHARAKTERISTIKA:
- Konkret und spezifisch für ${roleContext.firstName}s Situation
- Verschiedene Fragetypen: "Was", "Wie", "Wann", "Welche", "Inwiefern"
- Einige Fragen sollten konkrete Situationen oder Szenarien erwähnen
- Abwechselnd zwischen persönlich-reflektiv und beruflich-konkret
- Maximal 2 Sätze, aber variabel in Länge und Stil
- Keine Wiederholungen oder ähnliche Formulierungen

KATEGORIEN mit spezifischen Fokusbereichen:
1. Rollenverständnis - Wie siehst du deine spezifische Rolle in ${roleContext.workAreas.join(' und ')}?
2. Stolz & persönliche Leistung - Was macht dich besonders stolz in deiner Arbeit?
3. Herausforderungen & Umgang mit Druck - Welche spezifischen Herausforderungen erlebst du?
4. Verantwortung & Selbstorganisation - Wie organisierst du deine Verantwortlichkeiten?
5. Zusammenarbeit & Feedback - Wie arbeitest du mit anderen zusammen?
6. Entwicklung & Lernen - Wo siehst du Entwicklungsmöglichkeiten für dich?
7. Energie & Belastung - Wie erlebst du deine Energie und Belastung?
8. Kultur & Werte - Wie erlebst du die Unternehmenskultur?
9. Entscheidungsspielräume & Freiheit - Welche Freiheiten hast du in deiner Rolle?
10. Wertschätzung & Gesehenwerden - Fühlst du dich wertgeschätzt und gesehen?
11. Perspektive & Zukunft - Wie siehst du deine berufliche Zukunft?

BEISPIELE für konkrete, spezifische Fragen:
- "Was macht für dich einen guten ${roleContext.functions[0]} in der ${roleContext.workAreas[0]} aus?"
- "Welche Situation in deiner Arbeit mit ${roleContext.customerContact.includes('täglich') ? 'Kunden' : 'Kollegen'} hat dich zuletzt besonders gefordert?"
- "Wie hat sich dein Verständnis deiner Rolle in den ${roleContext.experienceYears} entwickelt?"

Gib die Fragen ausschließlich im folgenden JSON-Format zurück:
[
{
"id": "role",
"question": "...",
"category": "Rollenverständnis"
},
...
]

Keine Kommentare. Keine Erklärungen. Nur JSON.`
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