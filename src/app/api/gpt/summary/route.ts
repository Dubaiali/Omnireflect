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
    
    let answeredQuestions: any[] = []
    
    if (questions && Array.isArray(questions)) {
      // Filtere nur Fragen, die tatsächlich beantwortet wurden
      answeredQuestions = questions.filter(question => answers[question.id])
      
      console.log('DEBUG: Fragen für Zusammenfassung:', {
        totalQuestions: questions.length,
        answeredQuestions: answeredQuestions.length,
        answeredQuestionIds: answeredQuestions.map(q => q.id)
      })
      
      answeredQuestions.forEach((question, index) => {
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

    // Dynamische Anpassungen basierend auf Erfahrungslevel
    const getExperienceLevel = (experienceYears: string) => {
      if (experienceYears.includes('Monate') || experienceYears.includes('1 Jahr')) {
        return 'EINLADEND, LERNORIENTIERT, UNTERSTÜTZEND'
      } else if (experienceYears.includes('15 Jahre')) {
        return 'WÜRDEVOLL, ERFAHRUNGSBASIERT, REFLEKTIEREND'
      }
      return 'AUSGEWOGEN, ENTWICKLUNGSORIENTIERT'
    }

    const getIndustryContext = (workAreas: string[]) => {
      const contexts = {
        'Brillenberatung': 'Kundenorientierung, Beratungskompetenz, Produktwissen',
        'Softwareentwicklung': 'Technische Expertise, Teamarbeit, Innovation',
        'Büro': 'Organisation, Kommunikation, Prozessoptimierung',
        'Werkstatt': 'Handwerk, Präzision, Qualitätsbewusstsein',
        'Kontaktlinse': 'Spezialisierung, Beratung, Kundenbetreuung'
      }
      return workAreas.map(area => contexts[area] || area).join(', ')
    }

    const experienceLevel = roleContext ? getExperienceLevel(roleContext.experienceYears) : 'AUSGEWOGEN'
    const industryContext = roleContext ? getIndustryContext(roleContext.workAreas) : ''
    const answeredQuestionsCount = questions ? questions.filter(q => answers[q.id]).length : 0

    const prompt = `
      ${answeredQuestionsCount < 3 ? 'WICHTIG: Nur wenige Fragen wurden beantwortet. Erstelle eine kürzere, fokussierte Zusammenfassung basierend auf den verfügbaren Antworten.' : ''}
      
      WICHTIG: Die "Empfehlungen für das Mitarbeiterjahresgespräch" müssen als SEPARATE SEKTION erscheinen, NICHT als Teil von "Rollentausch & Führungsperspektive".
      
      STRUKTUR-REGLEN:
      - "Rollentausch & Führungsperspektive" = Was würdest du als Vorgesetzter anders machen?
      - "Empfehlungen für das Mitarbeiterjahresgespräch" = SEPARATE SEKTION mit konkreten Handlungsimpulsen
      - Diese beiden Sektionen müssen getrennt sein!
      
      Als einfühlsamer Coach für persönliche Entwicklung und berufliche Reflexion, erstelle eine empathische und strukturierte Zusammenfassung der Selbstreflexion basierend auf den gegebenen Antworten.
      
      HAUPTANTWORTEN:
      ${answersText}
      
      ${followUpText ? `VERTIEFENDE NACHFRAGEN:\n${followUpText}` : ''}${roleContextInfo}
      
      PERSONALISIERTER KONTEXT:
      - Erfahrungslevel: ${experienceLevel}
      - Arbeitsbereich: ${industryContext}
      
      STRUKTURIERTE ANALYSE mit Priorisierung:
      Analysiere die Antworten nach Priorität:
      1. KRITISCHE THEMEN: Herausforderungen, Entwicklungsbedarf
      2. STÄRKEN: Stolz, Erfolge, positive Erfahrungen
      3. ZUKUNFT: Perspektiven, Ziele, Wünsche
      4. KONTEXT: Arbeitsumfeld, Kultur, Zusammenarbeit
      
      Systematische Analyse basierend auf den beantworteten Fragen:
      
      ${(() => {
        const categoryMap = {
          'pride': 'Stolz & persönliche Leistung',
          'challenges': 'Herausforderungen & Umgang mit Druck',
          'responsibility': 'Verantwortung & Selbstorganisation',
          'collaboration': 'Zusammenarbeit & Feedback',
          'development': 'Entwicklung & Lernen',
          'energy': 'Energie & Belastung',
          'culture': 'Kultur & Werte',
          'freedom': 'Entscheidungsspielräume & Freiheit',
          'appreciation': 'Wertschätzung & Gesehenwerden',
          'perspective': 'Perspektive & Zukunft',
          'improvements': 'Verbesserungsvorschläge & Ideen',
          'leadership': 'Rollentausch & Führungsperspektive'
        }
        
        const answeredCategories = answeredQuestions.map(q => {
          const category = categoryMap[q.category] || q.category
          return `**${category}**: ${q.question}`
        }).join('\n\n')
        
        return answeredCategories || 'Keine Fragen beantwortet'
      })()}
      
      EMPFEHLUNGEN FÜR DAS MITARBEITERJAHRESGESPRÄCH (SEPARATE SEKTION):
      **Empfehlungen für das Mitarbeiterjahresgespräch**: Konkrete Handlungsimpulse für das Gespräch (SEPARATE SEKTION)
      
      QUALITÄTSKRITERIEN:
      - ABSOLUT in Du-Form verfasst (klar, menschlich, ohne Floskeln) - ALLE Teile der Zusammenfassung
      - ABSOLUT NICHT gendern (keine "Mitarbeiter:in", "Kolleg:innen", "Mitarbeitende" - verwende "Mitarbeiter", "Kollegen", "Kunden")
      - sprachlich dem Erfahrungs- und Alterskontext angepasst
      - kulturelle Werte berücksichtigen (Freiheit, Vertrauen, Verantwortung, Wertschätzung)
      - empathisch und unterstützend wirken
      - Follow-up-Antworten für tiefere Einblicke nutzen
      - konkrete Handlungsimpulse identifizieren
      - Fokus auf persönliche Entwicklung und Wachstum
      - KRITISCHE ÄUSSERUNGEN AUTHENTISCH WIEDERGEBEN: Wenn der Mitarbeiter negative oder kritische Aussagen macht, diese nicht "schönreden" oder mildern
      - ECHTE REFLEXION: Die tatsächlichen Gefühle und Meinungen des Mitarbeiters respektieren und wiedergeben
      
      FOKUS-BEREICHE für die Analyse:
      - Persönliche Wachstumserfahrungen und Lernerkenntnisse
      - Werte und Überzeugungen der Person
      - Beziehungen und Zusammenarbeit
      - Motivation und Sinnhaftigkeit
      - Zukunftsvisionen und Entwicklungsziele
      - Herausforderungen und deren Ursachen
      - Selbstreflexion und Bewusstsein
      - ECHTE GEFÜHLE UND MEINUNGEN: Auch negative oder kritische Äußerungen authentisch wiedergeben
      
      EINLEITUNG:
      - Umfassend und detailliert (5-7 Sätze)
      - Wichtigste Erkenntnisse aus allen Antworten zusammenfassen
      - Stärken, Herausforderungen und Entwicklungsbereiche erwähnen
      - Verbindung zwischen verschiedenen Aspekten der Reflexion zeigen
      - Kernaussagen für das Mitarbeiterjahresgespräch deutlich machen
      - Persönliche Situation und beruflichen Kontext berücksichtigen
      - Persönliche Entwicklung und Wachstum betonen
      
      SPRACHLICHE ANPASSUNG:
      - Für junge/neue Mitarbeiter: klar, freundlich, einladend
      - Für erfahrene/langjährige Mitarbeiter: würdevoll, respektvoll, anerkennend
      
      Strukturiere die Zusammenfassung in folgendem Format:
      
      Einleitung:
      [Umfassender Überblick über die Reflexion mit den wichtigsten Erkenntnissen, Kernaussagen und zentralen Themen. Diese Sektion sollte 3-4 Sätze enthalten und die wesentlichen Aspekte der Selbstreflexion zusammenfassen, einschließlich Stärken, Herausforderungen und Entwicklungsbereiche.]
      
      Systematische Analyse (nur beantwortete Kategorien):
      
      ${(() => {
        const categoryMap = {
          'pride': 'Stolz & persönliche Leistung',
          'challenges': 'Herausforderungen & Umgang mit Druck',
          'responsibility': 'Verantwortung & Selbstorganisation',
          'collaboration': 'Zusammenarbeit & Feedback',
          'development': 'Entwicklung & Lernen',
          'energy': 'Energie & Belastung',
          'culture': 'Kultur & Werte',
          'freedom': 'Entscheidungsspielräume & Freiheit',
          'appreciation': 'Wertschätzung & Gesehenwerden',
          'perspective': 'Perspektive & Zukunft',
          'improvements': 'Verbesserungsvorschläge & Ideen',
          'leadership': 'Rollentausch & Führungsperspektive'
        }
        
        return answeredQuestions.map(q => {
          const category = categoryMap[q.category] || q.category
          const isLeadership = q.category === 'leadership'
          return `${category}:\n[Analyse ohne Aufzählungszeichen, nur normaler Text${isLeadership ? ' - FOKUS: Was würdest du als Vorgesetzter anders machen? NICHT die Empfehlungen für das Gespräch' : ''}]`
        }).join('\n\n')
      })()}
      
      EMPFEHLUNGEN FÜR DEIN MITARBEITERJAHRESGESPRÄCH:
      [3-5 konkrete, umsetzbare Handlungsimpulse mit Zeitrahmen (6 Monate) - SEPARATE SEKTION - NICHT Teil von Rollentausch & Führungsperspektive]
    `

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Du bist ein einfühlsamer Coach für persönliche Entwicklung und berufliche Reflexion.

DEINE KERNKOMPETENZEN:
- Empathische Gesprächsführung ohne Suggestion
- Kontextuelle Anpassung an Erfahrungslevel und Arbeitsbereich
- Fokus auf persönliche Entwicklung über Arbeitsalltag hinaus
- Kulturelle Sensibilität (Freiheit, Vertrauen, Verantwortung, Wertschätzung)
- AUTHENTISCHE WIEDERGABE: Kritische oder negative Äußerungen des Mitarbeiters nicht mildern oder "schönreden"

DEINE AUFGABE: Empathische und hilfreiche Zusammenfassungen erstellen.

WICHTIGE STRUKTUR-REGLEN:
- "Rollentausch & Führungsperspektive" und "Empfehlungen für das Mitarbeiterjahresgespräch" sind SEPARATE SEKTIONEN
- "Rollentausch & Führungsperspektive" = Was würdest du als Vorgesetzter anders machen?
- "Empfehlungen für das Mitarbeiterjahresgespräch" = Konkrete Handlungsimpulse für das Gespräch
- Diese beiden Sektionen müssen getrennt sein!

SPRACHLICHE REGELN:
- ABSOLUT ALLE Teile der Zusammenfassung in Du-Form verfassen
- Einleitung, systematische Analyse und Empfehlungen - alles in Du-Form

Berücksichtige dabei:
- Arbeitsbereich, Rolle/Funktion, Erfahrung und Kundenkontakt der Person
- Follow-up-Antworten für tiefere Einblicke und Perspektivenentwicklung
- Sprachliche Anpassung an den Erfahrungs- und Alterskontext
- Kulturelle Werte wie Freiheit, Vertrauen, Verantwortung und Wertschätzung
- Empathie und Unterstützung ohne Suggestion oder Floskeln
- Konkrete, umsetzbare Handlungsempfehlungen
- Fokus auf persönliche Entwicklung und Wachstum
- Strukturierte Analyse mit Priorisierung (kritisch → positiv → zukunftsorientiert)
- AUTHENTISCHE WIEDERGABE: Wenn der Mitarbeiter kritische oder negative Aussagen macht, diese nicht mildern oder umdeuten`
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