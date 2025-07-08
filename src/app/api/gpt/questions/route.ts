import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface RoleContext {
  workAreas: string[]
  functions: string[]
  experienceYears: string
  customerContact: string
  dailyTasks: string
}

const baseQuestions = [
  {
    id: 'role',
    category: 'Rollenverständnis',
    baseQuestion: 'Wie verstehst du deine aktuelle Rolle im Unternehmen und welche Verantwortlichkeiten sind dir besonders wichtig?'
  },
  {
    id: 'achievements',
    category: 'Leistungen',
    baseQuestion: 'Welche Erfolge und Leistungen machst du im vergangenen Jahr besonders stolz?'
  },
  {
    id: 'challenges',
    category: 'Herausforderungen',
    baseQuestion: 'Mit welchen Herausforderungen hast du dich konfrontiert gesehen und wie hast du diese bewältigt?'
  },
  {
    id: 'development',
    category: 'Entwicklung',
    baseQuestion: 'In welchen Bereichen würdest du gerne wachsen und dich weiterentwickeln?'
  },
  {
    id: 'feedback',
    category: 'Feedback',
    baseQuestion: 'Wie bewertest du die Qualität des Feedbacks, das du von Kolleg:innen und Vorgesetzten erhältst?'
  },
  {
    id: 'collaboration',
    category: 'Zusammenarbeit',
    baseQuestion: 'Wie erlebst du die Zusammenarbeit im Team und welche Verbesserungen würdest du dir wünschen?'
  },
  {
    id: 'goals',
    category: 'Ziele',
    baseQuestion: 'Welche konkreten Ziele hast du dir für das kommende Jahr gesetzt?'
  },
  {
    id: 'support',
    category: 'Unterstützung',
    baseQuestion: 'Welche Art von Unterstützung oder Ressourcen würden dir helfen, deine Ziele zu erreichen?'
  },
  {
    id: 'work_life',
    category: 'Work-Life-Balance',
    baseQuestion: 'Wie zufrieden bist du mit deiner Work-Life-Balance und was könnte verbessert werden?'
  },
  {
    id: 'future',
    category: 'Zukunftsperspektive',
    baseQuestion: 'Wo siehst du dich in 3-5 Jahren und welche Schritte sind dafür notwendig?'
  }
]

export async function POST(request: NextRequest) {
  try {
    const { roleContext } = await request.json()

    if (!roleContext) {
      // Fallback zu Standard-Fragen wenn kein Rollenkontext vorhanden
      return NextResponse.json({ 
        questions: baseQuestions.map(q => ({
          id: q.id,
          question: q.baseQuestion,
          category: q.category
        }))
      })
    }

    const roleContextInfo = `
    Rollenkontext der Person:
    - Arbeitsbereich: ${roleContext.workAreas.join(', ')}
    - Funktion: ${roleContext.functions.join(', ')}
    - Erfahrung: ${roleContext.experienceYears}
    - Kundenkontakt: ${roleContext.customerContact}
    ${roleContext.dailyTasks ? `- Tägliche Aufgaben: ${roleContext.dailyTasks}` : ''}
    `

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Du bist ein reflektierter Coach mit Feingefühl für Sprache, berufliche Rollen und persönliche Entwicklung. Deine Aufgabe ist es, für ein Mitarbeiterentwicklungsgespräch in einem augenoptischen Unternehmen einen individuellen Fragenkatalog zu erstellen.

Berücksichtige folgende Kontextdaten:

Arbeitsbereich (z. B. Verkauf, Werkstatt, Büro, Refraktion, Hörakustik)
Rolle/Funktion (z. B. Mitarbeiter:in, Azubi, Führungskraft)
Erfahrung / Unternehmenszugehörigkeit (z. B. 6 Monate, 3 Jahre, über 10 Jahre)
Kundenkontakt (z. B. täglich, situativ, kaum)
Aufgabenbeschreibung (optional)
implizites Alter (z. B. 1. Lehrjahr ≈ jung; 20+ Jahre im Betrieb = erfahren, eher älter)

Bitte formuliere 15 offene, individuell abgestimmte Reflexionsfragen, die:
- in Du-Form verfasst sind (klar, menschlich, ohne Floskeln oder Suggestion)
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
- Für junge oder neue Mitarbeitende: eher klar, freundlich, einladend
- Für erfahrene oder langjährige Mitarbeitende: eher würdevoll, respektvoll, anerkennend

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
      max_tokens: 2000,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content || ''
    
    try {
      // Versuche JSON zu parsen
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsedQuestions = JSON.parse(jsonMatch[0])
        
        // Validiere und mappe die Antworten
        const personalizedQuestions = baseQuestions.map(baseQ => {
          const personalized = parsedQuestions.find((q: any) => q.id === baseQ.id)
          if (personalized && personalized.question) {
            return {
              id: baseQ.id,
              question: personalized.question,
              category: baseQ.category
            }
          }
          return {
            id: baseQ.id,
            question: baseQ.baseQuestion,
            category: baseQ.category
          }
        })
        
        return NextResponse.json({ questions: personalizedQuestions })
      }
    } catch (parseError) {
      console.error('JSON Parsing Fehler:', parseError)
    }

    // Fallback zu Standard-Fragen
    return NextResponse.json({ 
      questions: baseQuestions.map(q => ({
        id: q.id,
        question: q.baseQuestion,
        category: q.category
      }))
    })
  } catch (error) {
    console.error('Fehler bei der Fragen-Generierung:', error)
    // Fallback zu Standard-Fragen
    return NextResponse.json({ 
      questions: baseQuestions.map(q => ({
        id: q.id,
        question: q.baseQuestion,
        category: q.category
      }))
    })
  }
} 