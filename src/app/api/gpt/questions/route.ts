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
  let roleContext: RoleContext | undefined
  
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
    console.log('DEBUG: API /questions - Empfangene Daten:', {
      hasRoleContext: !!body.roleContext,
      roleContextType: typeof body.roleContext,
      roleContextKeys: body.roleContext ? Object.keys(body.roleContext) : null
    })
    
    // Input validieren
    if (body.roleContext) {
      let rc = body.roleContext
      if (typeof rc === 'string') {
        try {
          rc = JSON.parse(rc)
        } catch (e) {
          console.error('DEBUG: Fehler beim Parsen des Rollenkontexts:', e)
          return NextResponse.json({ error: 'Rollenkontext konnte nicht geparst werden.' }, { status: 400 })
        }
      }
      try {
        roleContext = validateAndSanitize(roleContextSchema, rc) as RoleContext
        console.log('DEBUG: Rollenkontext validiert:', {
          firstName: roleContext.firstName,
          lastName: roleContext.lastName,
          workAreas: roleContext.workAreas,
          functions: roleContext.functions,
          experienceYears: roleContext.experienceYears,
          customerContact: roleContext.customerContact,
          hasDailyTasks: !!roleContext.dailyTasks
        })
      } catch (error) {
        console.error('DEBUG: Validierungsfehler:', error)
        return NextResponse.json(
          { error: 'Ungültige Rollenkontext-Daten. Bitte fülle alle Pflichtfelder aus.' },
          { status: 400 }
        )
      }
    }

    if (!roleContext) {
      console.error('DEBUG: Kein Rollenkontext vorhanden')
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

    console.log('DEBUG: Sende Rollenkontext an GPT:', roleContextInfo)

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Du bist ein einfühlsamer Coach für persönliche Entwicklung und berufliche Reflexion. Erstelle 12 inspirierende und tiefgründige Reflexionsfragen, die zur Selbstreflexion anregen.

KONTEXT:
- Name: ${roleContext.firstName} ${roleContext.lastName}
- Arbeitsbereiche: ${roleContext.workAreas.join(', ')}
- Funktion: ${roleContext.functions.join(', ')}
- Erfahrung: ${roleContext.experienceYears}
- Kundenkontakt: ${roleContext.customerContact}
${roleContext.dailyTasks ? `- Tägliche Aufgaben: ${roleContext.dailyTasks}` : ''}

ANFORDERUNGEN:
- Erstelle Fragen, die über den reinen Arbeitsalltag hinausgehen
- Fokussiere auf persönliche Entwicklung, Werte und Erfahrungen
- Verwende den Arbeitskontext nur als Hintergrund, nicht als Hauptthema
- Verschiedene Fragetypen: "Was", "Wie", "Wann", "Welche", "Inwiefern", "Was wäre wenn"
- Maximal 2 Sätze pro Frage
- Inspirierender, einladender Ton
- Natürliche, flüssige Sprache
- Vermeide zu spezifische Branchen- oder Arbeitsbereichsbezüge

KATEGORIEN (je eine Frage):
1. Stolz & persönliche Leistung  
2. Herausforderungen & Umgang mit Druck
3. Verantwortung & Selbstorganisation
4. Zusammenarbeit & Feedback
5. Entwicklung & Lernen
6. Energie & Belastung
7. Kultur & Werte
8. Entscheidungsspielräume & Freiheit
9. Wertschätzung & Gesehenwerden
10. Perspektive & Zukunft
11. Verbesserungsvorschläge & Ideen
12. Rollentausch & Führungsperspektive

BEISPIELE für inspirierende Fragen:
- "Was hat dich in den letzten Monaten am meisten überrascht oder inspiriert?"
- "Welche Erfahrung hat dein Verständnis von Zusammenarbeit am stärksten geprägt?"
- "Was würdest du deinem jüngeren Ich mit deiner heutigen Erfahrung raten?"
- "Wie hat sich deine Definition von Erfolg in den ${roleContext.experienceYears} verändert?"
- "Was wäre, wenn du eine Sache in deinem Arbeitsumfeld sofort verändern könntest?"
- "Welche Situation hat dich gelehrt, dass du stärker bist als du dachtest?"

FOKUS-BEREICHE:
- Persönliche Wachstumserfahrungen
- Werte und Überzeugungen
- Beziehungen und Zusammenarbeit
- Lernen und Entwicklung
- Motivation und Sinnhaftigkeit
- Zukunftsvisionen und Träume
- Herausforderungen als Wachstumschancen
- Selbstreflexion und Bewusstsein

Antworte nur mit JSON im Format:
[
{"id": "stolz", "question": "...", "category": "Stolz & persönliche Leistung"},
{"id": "challenges", "question": "...", "category": "Herausforderungen & Umgang mit Druck"},
{"id": "responsibility", "question": "...", "category": "Verantwortung & Selbstorganisation"},
{"id": "collaboration", "question": "...", "category": "Zusammenarbeit & Feedback"},
{"id": "development", "question": "...", "category": "Entwicklung & Lernen"},
{"id": "energy", "question": "...", "category": "Energie & Belastung"},
{"id": "values", "question": "...", "category": "Kultur & Werte"},
{"id": "decisions", "question": "...", "category": "Entscheidungsspielräume & Freiheit"},
{"id": "appreciation", "question": "...", "category": "Wertschätzung & Gesehenwerden"},
{"id": "future", "question": "...", "category": "Perspektive & Zukunft"},
{"id": "improvements_ideas", "question": "...", "category": "Verbesserungsvorschläge & Ideen"},
{"id": "leadership", "question": "...", "category": "Rollentausch & Führungsperspektive"}
]`
        }
      ],
      max_tokens: 2000,
      temperature: 0.8,
    })

    const response = completion.choices[0]?.message?.content || ''
    console.log('DEBUG: GPT-Antwort erhalten, Länge:', response.length)
    
    try {
      // Versuche JSON zu parsen
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsedQuestions = JSON.parse(jsonMatch[0])
        console.log('DEBUG: JSON erfolgreich geparst, Fragen:', parsedQuestions.length)
        
        // Prüfe ob wir gültige personalisierte Fragen haben
        if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
          const validQuestions = parsedQuestions.filter((q: any) => 
            q && q.id && q.question && q.category
          )
          
          console.log('DEBUG: Gültige Fragen gefunden:', validQuestions.length)
          
          if (validQuestions.length >= 11) { // Mindestens 11 von 12 Fragen sollten vorhanden sein
            return NextResponse.json({ questions: validQuestions })
          }
        }
      }
      
      // Wenn keine gültigen Fragen generiert wurden, Fehler zurückgeben
      console.error('DEBUG: Keine gültigen Fragen von GPT erhalten, Antwort:', response.substring(0, 200))
      throw new Error('Keine gültigen Fragen von GPT erhalten')
      
    } catch (parseError) {
      console.error('DEBUG: Fehler beim Parsen der GPT-Antwort:', parseError)
      console.error('DEBUG: GPT-Antwort war:', response)
      throw new Error('Fehler bei der Fragen-Generierung')
    }
  } catch (error) {
    console.error('DEBUG: Fehler bei der Fragen-Generierung:', error)
    
    // Keine Fallbacks mehr - nur echte KI-Antworten
    return NextResponse.json(
      { error: 'Fehler bei der Generierung der Fragen. Bitte versuche es später erneut.' },
      { status: 500 }
    )
  }
}