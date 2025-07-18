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

export async function POST(request: NextRequest) {
  let answers: Record<string, string> = {}
  let roleContext: any = undefined
  
  try {
    const { answers: answersData, followUpQuestions, roleContext: roleContextData, questions } = await request.json()
    answers = answersData
    roleContext = roleContextData

    console.log('DEBUG: API /summary - Empfangene Daten:', {
      hasAnswers: !!answers && Object.keys(answers).length > 0,
      answersCount: answers ? Object.keys(answers).length : 0,
      hasFollowUpQuestions: !!followUpQuestions,
      hasRoleContext: !!roleContext,
      roleContextType: typeof roleContext,
      roleContextKeys: roleContext ? Object.keys(roleContext) : null,
      hasQuestions: !!questions,
      questionsCount: questions ? questions.length : 0
    })

    if (!answers || Object.keys(answers).length === 0) {
      return NextResponse.json(
        { error: 'Antworten sind erforderlich' },
        { status: 400 }
      )
    }

    // Erstelle strukturierte Antworten mit Follow-ups
    let answersText = ''
    let followUpText = ''
    
    if (questions && Array.isArray(questions)) {
      questions.forEach((question, index) => {
        const answer = answers[question.id]
        const followUps = followUpQuestions[question.id] || []
        
        if (answer) {
          answersText += `Frage ${index + 1} (${question.category}): ${question.question}\nAntwort: ${answer}\n\n`
          
          // Sammle Follow-up-Antworten
          followUps.forEach((followUpQuestion: string, followUpIndex: number) => {
            const followUpAnswer = answers[`${question.id}_followup_${followUpIndex}`]
            if (followUpAnswer) {
              followUpText += `Vertiefung zu Frage ${index + 1}: ${followUpQuestion}\nAntwort: ${followUpAnswer}\n\n`
            }
          })
        }
      })
    } else {
      // Fallback für alte Struktur
      answersText = Object.entries(answers)
        .filter(([key]) => !key.includes('_followup_'))
        .map(([question, answer]) => `Frage: ${question}\nAntwort: ${answer}`)
        .join('\n\n')
    }

    let roleContextInfo = ''
    if (roleContext) {
      roleContextInfo = `
      
      Rollenkontext der Person:
      - Arbeitsbereich: ${roleContext.workAreas.join(', ')}
      - Funktion: ${roleContext.functions.join(', ')}
      - Erfahrung: ${roleContext.experienceYears}
      - Kundenkontakt: ${roleContext.customerContact}
      ${roleContext.dailyTasks ? `- Tägliche Aufgaben: ${roleContext.dailyTasks}` : ''}
      `
      
      console.log('DEBUG: Rollenkontext für Summary:', roleContextInfo)
    } else {
      console.log('DEBUG: Kein Rollenkontext für Summary verfügbar')
    }

    console.log('DEBUG: Sende Summary-Prompt an GPT')

    const prompt = `
      Als einfühlsamer Coach für persönliche Entwicklung und berufliche Reflexion, erstelle eine empathische und strukturierte Zusammenfassung der Selbstreflexion basierend auf den gegebenen Antworten.
      
      HAUPTANTWORTEN:
      ${answersText}
      
      ${followUpText ? `VERTIEFENDE NACHFRAGEN:\n${followUpText}` : ''}${roleContextInfo}
      
      Analysiere die Antworten systematisch nach den 12 Reflexionskategorien und erstelle eine umfassende Zusammenfassung:
      
      1. **Stolz & persönliche Leistung**: Worauf bist du stolz, was macht dich zufrieden?
      2. **Herausforderungen & Umgang mit Druck**: Welche Schwierigkeiten erlebst du und wie gehst du damit um?
      3. **Verantwortung & Selbstorganisation**: Wie organisierst du dich und übernimmst Verantwortung?
      4. **Zusammenarbeit & Feedback**: Wie arbeitest du mit anderen zusammen?
      5. **Entwicklung & Lernen**: Wo siehst du Entwicklungsmöglichkeiten?
      6. **Energie & Belastung**: Wie erlebst du deine Energie und Belastung?
      7. **Kultur & Werte**: Wie erlebst du die Unternehmenskultur?
      8. **Entscheidungsspielräume & Freiheit**: Welche Freiheiten und Entscheidungsmöglichkeiten hast du?
      9. **Wertschätzung & Gesehenwerden**: Fühlst du dich wertgeschätzt und gesehen?
      10. **Perspektive & Zukunft**: Wie siehst du deine berufliche Zukunft?
      11. **Verbesserungsvorschläge & Ideen**: Was würdest du verbessern oder anders machen?
      12. **Rollentausch & Führungsperspektive**: Was würdest du als Vorgesetzter anders machen?
      
      Die Zusammenfassung sollte:
      - in Du-Form verfasst sein (klar, menschlich, ohne Floskeln)
      - ABSOLUT NICHT gendern (keine geschlechtsspezifischen Formulierungen wie "Mitarbeiter:in", "Kolleg:innen", "Mitarbeitende" etc. - verwende stattdessen "Mitarbeiter", "Kollegen", "Kunden")
      - sprachlich dem Erfahrungs- und Alterskontext angepasst sein
      - kulturelle Werte wie Freiheit, Vertrauen, Verantwortung und Wertschätzung berücksichtigen
      - empathisch und unterstützend wirken
      - den beruflichen Kontext der Person berücksichtigen
      - Follow-up-Antworten für tiefere Einblicke nutzen
      - konkrete Handlungsimpulse und Entwicklungsmöglichkeiten identifizieren
      - Fokus auf persönliche Entwicklung und Wachstum legen
      
      FOKUS-BEREICHE für die Analyse:
      - Persönliche Wachstumserfahrungen und Lernerkenntnisse
      - Werte und Überzeugungen der Person
      - Beziehungen und Zusammenarbeit
      - Motivation und Sinnhaftigkeit
      - Zukunftsvisionen und Entwicklungsziele
      - Herausforderungen als Wachstumschancen
      - Selbstreflexion und Bewusstsein
      
      EINLEITUNG:
      - Die Einleitung sollte umfassend und detailliert sein (5-7 Sätze)
      - Fasse die wichtigsten Erkenntnisse aus allen Antworten zusammen
      - Erwähne Stärken, Herausforderungen und Entwicklungsbereiche
      - Zeige die Verbindung zwischen verschiedenen Aspekten der Reflexion
      - Mache die Kernaussagen für das Mitarbeiterjahresgespräch deutlich
      - Gehe auf die persönliche Situation und den beruflichen Kontext ein
      - Betone persönliche Entwicklung und Wachstum
      
      Passe deine Sprache so an, dass sie für die jeweilige Zielgruppe leicht verständlich ist:
      - Für junge oder neue Mitarbeiter: eher klar, freundlich, einladend
      - Für erfahrene oder langjährige Mitarbeiter: eher würdevoll, respektvoll, anerkennend
      
      Strukturiere die Zusammenfassung in folgendem Format:
      
      Einleitung:
      [Umfassender Überblick über die Reflexion mit den wichtigsten Erkenntnissen, Kernaussagen und zentralen Themen. Diese Sektion sollte 3-4 Sätze enthalten und die wesentlichen Aspekte der Selbstreflexion zusammenfassen, einschließlich Stärken, Herausforderungen und Entwicklungsbereiche.]
      
      Systematische Analyse:
      
      Stolz & persönliche Leistung:
      [Analyse ohne Aufzählungszeichen, nur normaler Text]
      
      Herausforderungen & Umgang mit Druck:
      [Analyse ohne Aufzählungszeichen, nur normaler Text]
      
      Verantwortung & Selbstorganisation:
      [Analyse ohne Aufzählungszeichen, nur normaler Text]
      
      Zusammenarbeit & Feedback:
      [Analyse ohne Aufzählungszeichen, nur normaler Text]
      
      Entwicklung & Lernen:
      [Analyse ohne Aufzählungszeichen, nur normaler Text]
      
      Energie & Belastung:
      [Analyse ohne Aufzählungszeichen, nur normaler Text]
      
      Kultur & Werte:
      [Analyse ohne Aufzählungszeichen, nur normaler Text]
      
      Entscheidungsspielräume & Freiheit:
      [Analyse ohne Aufzählungszeichen, nur normaler Text]
      
      Wertschätzung & Gesehenwerden:
      [Analyse ohne Aufzählungszeichen, nur normaler Text]
      
      Perspektive & Zukunft:
      [Analyse ohne Aufzählungszeichen, nur normaler Text]
      
      Verbesserungsvorschläge & Ideen:
      [Analyse ohne Aufzählungszeichen, nur normaler Text]
      
      Rollentausch & Führungsperspektive:
      [Analyse ohne Aufzählungszeichen, nur normaler Text]
      
      Empfehlungen für dein Mitarbeiterjahresgespräch:
      [3-5 konkrete, umsetzbare Handlungsimpulse mit Zeitrahmen (6 Monate)]
    `

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Du bist ein einfühlsamer Coach für persönliche Entwicklung und berufliche Reflexion. Deine Aufgabe ist es, empathische und hilfreiche Zusammenfassungen zu erstellen.

Berücksichtige dabei:
- Arbeitsbereich, Rolle/Funktion, Erfahrung und Kundenkontakt der Person
- Follow-up-Antworten für tiefere Einblicke und Perspektivenentwicklung
- Sprachliche Anpassung an den Erfahrungs- und Alterskontext
- Kulturelle Werte wie Freiheit, Vertrauen, Verantwortung und Wertschätzung
- Empathie und Unterstützung ohne Suggestion oder Floskeln
- Konkrete, umsetzbare Handlungsempfehlungen
- Fokus auf persönliche Entwicklung und Wachstum`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1200,
      temperature: 0.7,
    })

    const summary = completion.choices[0]?.message?.content || 'Zusammenfassung konnte nicht generiert werden.'
    console.log('DEBUG: Summary generiert, Länge:', summary.length)

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('DEBUG: Fehler bei der Zusammenfassungsgenerierung:', error)
    
    // Keine Fallbacks mehr - nur echte KI-Antworten
    return NextResponse.json(
      { 
        summary: 'Es gab einen Fehler bei der Generierung der Zusammenfassung. Bitte versuche es später erneut.'
      },
      { status: 200 }
    )
  }
} 