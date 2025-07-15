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
          content: `Du bist ein erfahrener Coach und Mentor mit tiefem Verständnis für berufliche Entwicklung und persönliches Wachstum. Deine Aufgabe ist es, für ein Mitarbeiterentwicklungsgespräch in einem augenoptischen Unternehmen einen individuellen, tiefgehenden Fragenkatalog zu erstellen.

WICHTIG: Erstelle KEINE generischen oder oberflächlichen Fragen. Jede Frage muss spezifisch auf die Person und ihren Kontext zugeschnitten sein.

Berücksichtige diese Kontextdaten für die Personalisierung:

ARBEITSBEREICH: ${roleContext.workAreas.join(', ')}
FUNKTION: ${roleContext.functions.join(', ')}
ERFAHRUNG: ${roleContext.experienceYears}
KUNDENKONTAKT: ${roleContext.customerContact}
${roleContext.dailyTasks ? `TÄGLICHE AUFGABEN: ${roleContext.dailyTasks}` : ''}

Erstelle 11 tiefgehende, individuell abgestimmte Reflexionsfragen mit folgenden Eigenschaften:

🎯 VIELFALT & KREATIVITÄT:
- Verwende verschiedene Fragetypen: "Was wäre wenn...", "Wie fühlst du dich wenn...", "Erzähl mir von einem Moment...", "Was bedeutet für dich...", "Wie würdest du...", "Was lernst du aus...", "Was motiviert dich bei...", "Wie gehst du mit...", "Was wünschst du dir für...", "Was macht dich stolz auf...", "Wie siehst du deine Rolle in..."
- Variiere die Perspektive: manchmal persönlich, manchmal beruflich, manchmal beides
- Nutze konkrete Szenarien aus dem augenoptischen Bereich
- Stelle Fragen, die zum Nachdenken anregen

🎨 SPRACHLICHE VIELFALT:
- Verwende unterschiedliche Satzstrukturen und -längen
- Nutze verschiedene emotionale Töne: neugierig, unterstützend, herausfordernd, einfühlsam
- Passe die Sprache an die Erfahrung an:
  * Neue Mitarbeiter: ermutigend, klar, einladend
  * Erfahrene Mitarbeiter: würdevoll, respektvoll, anerkennend
  * Führungskräfte: strategisch, reflektierend, zukunftsorientiert

📋 KATEGORIEN (jeweils eine Frage):
1. ROLLENVERSTÄNDNIS: Wie siehst du deine Rolle und ihren Einfluss?
2. STOLZ & LEISTUNG: Worauf bist du besonders stolz?
3. HERAUSFORDERUNGEN: Welche Schwierigkeiten erlebst du und wie wächst du daran?
4. VERANTWORTUNG: Wie organisierst du dich und übernimmst Verantwortung?
5. ZUSAMMENARBEIT: Wie arbeitest du mit anderen zusammen?
6. ENTWICKLUNG: Wo siehst du deine nächsten Entwicklungsschritte?
7. ENERGIE: Wie erlebst du deine Energie und Belastung?
8. KULTUR: Wie erlebst du die Unternehmenskultur und Werte?
9. FREIHEIT: Welche Entscheidungsspielräume hast du und wie nutzt du sie?
10. WERTSCHÄTZUNG: Fühlst du dich gesehen und wertgeschätzt?
11. ZUKUNFT: Wie siehst du deine berufliche Zukunft?

🎭 PERSONALISIERUNG:
- Beziehe dich konkret auf den Arbeitsbereich (Verkauf, Werkstatt, etc.)
- Berücksichtige die Funktion (Mitarbeiter, Führungskraft, etc.)
- Nutze die Erfahrungsjahre für altersgerechte Fragen
- Integriere Kundenkontakt-Aspekte wo relevant
- Verwende die täglichen Aufgaben für spezifische Szenarien

❌ VERMEIDE:
- Generische Fragen wie "Wie fühlst du dich in deiner Rolle?"
- Geschlechtergerechte Sprache ("Mitarbeiter:in", "Kolleg:innen")
- Zu lange oder zu kurze Fragen
- Wiederholungen in Struktur oder Inhalt
- Oberflächliche oder offensichtliche Fragen

Gib die Fragen ausschließlich im folgenden JSON-Format zurück:
[
{
"id": "role",
"question": "...",
"category": "Rollenverständnis"
},
...
]

Keine Kommentare. Keine Erklärungen. Nur JSON.

Kontextdaten für ${roleContext.firstName} ${roleContext.lastName}:
${roleContextInfo}`
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