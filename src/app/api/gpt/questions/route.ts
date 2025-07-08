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

    const prompt = `
    Du bist ein erfahrener Coach für Mitarbeiterjahresgespräche. Personalisiere die folgenden Reflexionsfragen basierend auf dem beruflichen Kontext der Person.

    ${roleContextInfo}

    Personalisiere jede Frage, indem du:
    1. Den spezifischen Arbeitsbereich einbeziehst
    2. Die Erfahrung und Funktion berücksichtigst
    3. Den Kundenkontakt-Level einbeziehst
    4. Relevante Aspekte der täglichen Aufgaben aufgreifst
    5. Die Frage empathisch und unterstützend formulierst

    Antworte NUR mit den personalisierten Fragen in diesem exakten JSON-Format:
    [
      {
        "id": "role",
        "question": "Deine personalisierte Frage hier",
        "category": "Rollenverständnis"
      },
      {
        "id": "achievements", 
        "question": "Deine personalisierte Frage hier",
        "category": "Leistungen"
      }
    ]

    Basis-Fragen zur Personalisierung:
    - role: ${baseQuestions[0].baseQuestion}
    - achievements: ${baseQuestions[1].baseQuestion}
    - challenges: ${baseQuestions[2].baseQuestion}
    - development: ${baseQuestions[3].baseQuestion}
    - feedback: ${baseQuestions[4].baseQuestion}
    - collaboration: ${baseQuestions[5].baseQuestion}
    - goals: ${baseQuestions[6].baseQuestion}
    - support: ${baseQuestions[7].baseQuestion}
    - work_life: ${baseQuestions[8].baseQuestion}
    - future: ${baseQuestions[9].baseQuestion}
    `

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Du bist ein erfahrener Reflexionscoach mit Feingefühl für Sprache, Berufsrollen und persönliche Entwicklung. Deine Aufgabe ist es, für ein Mitarbeiterentwicklungsgespräch in einem augenoptischen Unternehmen einen personalisierten Fragenkatalog zu erstellen.\n\nBerücksichtige bitte folgende Kontextdaten:\n\nArbeitsbereich (z. B. Verkauf, Werkstatt, Büro, Refraktion, Hörakustik)\n\nFunktion/Rolle (z. B. Mitarbeiter:in, Azubi, Abteilungsleitung)\n\nErfahrung (z. B. 6 Monate, 3 Jahre, 10+ Jahre)\n\nKundenkontakt (z. B. täglich, situativ, kaum)\n\nTätigkeitsbeschreibung (optional)\n\nFormuliere 15 offene, menschlich formulierte Reflexionsfragen, die:\n\nemotional zugänglich und reflektiv sind\n\nzu Selbstbeobachtung und persönlicher Entwicklung einladen\n\nkulturelle Themen wie „Freiheit & Verantwortung" sowie „Wertschätzung" einbeziehen\n\nsich an der Tiefe und Rolle der Person orientieren\n\nmaximal 1 Satz lang sind\n\nin Du-Form verfasst sind (respektvoll, klar, ohne Fachfloskeln oder Suggestion)\n\nDie Fragen sollen gleichmäßig verteilt sein auf folgende Kategorien:\n\nRollenverständnis\n\nStolz & Leistung\n\nHerausforderungen & Selbstbild\n\nVerantwortung & Selbstorganisation\n\nZusammenarbeit & Feedback\n\nEntwicklung & Lernen\n\nEnergie & Belastung\n\nKultur & Werte\n\nFreiheit & Entscheidungsspielräume\n\nWertschätzung & Menschlichkeit\n\nPerspektive & Zukunft\n\nGib die Ausgabe als JSON zurück im Format:\n\n[\n{\n"id": "role",\n"question": "...",\n"category": "Rollenverständnis"\n},\n...\n]\n\nNutze die Kontextdaten intelligent – Azubis sollen andere Fragen bekommen als Teamleitungen. Die Sprache soll klar, würdevoll und bewusst sein.'
        },
        {
          role: 'user',
          content: prompt
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