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
          content: `Du bist ein reflektierter Coach mit Feingefühl für Sprache, berufliche Rollen und persönliche Entwicklung. Deine Aufgabe ist es, für ein Mitarbeiterentwicklungsgespräch in einem augenoptischen Unternehmen einen individuellen Fragenkatalog zu erstellen.

Berücksichtige folgende Kontextdaten:

Arbeitsbereich (z. B. Verkauf, Werkstatt, Büro, Refraktion, Hörakustik)
Rolle/Funktion (z. B. Mitarbeiter, Azubi, Führungskraft)
Erfahrung / Unternehmenszugehörigkeit (z. B. 6 Monate, 3 Jahre, über 10 Jahre)
Kundenkontakt (z. B. täglich, situativ, kaum)
Aufgabenbeschreibung (optional)
implizites Alter (z. B. 1. Lehrjahr ≈ jung; 20+ Jahre im Betrieb = erfahren, eher älter)

Bitte formuliere 11 offene, individuell abgestimmte Reflexionsfragen, die:
- in Du-Form verfasst sind (klar, menschlich, ohne Floskeln oder Suggestion)
- ABSOLUT NICHT gendern (keine geschlechtsspezifischen Formulierungen wie "Mitarbeiter:in", "Kolleg:innen", "Mitarbeitende" etc. - verwende stattdessen "Mitarbeiter", "Kollegen", "Kunden")
- sprachlich dem Erfahrungs- und Alterskontext angepasst sind
- sich an der Tiefe und der Rolle der Person orientieren
- kulturelle Werte wie Freiheit, Vertrauen, Verantwortung und Wertschätzung berücksichtigen
- maximal 1–2 Sätze lang sind
- keine Wiederholungen enthalten

gleichmäßig auf diese Kategorien verteilt sind:
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

Passe deine Sprache so an, dass sie für die jeweilige Zielgruppe leicht verständlich ist:
- Für junge oder neue Mitarbeiter: eher klar, freundlich, einladend
- Für erfahrene oder langjährige Mitarbeiter: eher würdevoll, respektvoll, anerkennend

Gib die Fragen ausschließlich im folgenden JSON-Format zurück:
[
{
"id": "role",
"question": "...",
"category": "Rollenverständnis"
},
...
]

Keine Kommentare. Keine Erklärungen. Keine Anrede vorab. Nur JSON.

Kontextdaten für diese Person:
${roleContextInfo}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.7,
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