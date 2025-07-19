'use client'

import { useState } from 'react'
import PDFDownload from '@/components/PDFDownload'

export default function TestPDFPage() {
  const [testSummary] = useState(`Einleitung:
Dies ist eine Test-Zusammenfassung für die PDF-Generierung.

Systematische Analyse:

Stolz & persönliche Leistung:
Ich bin stolz auf meine Arbeit und die Ergebnisse, die ich erzielt habe.

Herausforderungen & Umgang mit Druck:
Ich bewältige Herausforderungen gut und bleibe auch unter Druck ruhig.

Verantwortung & Selbstorganisation:
Ich übernehme gerne Verantwortung und organisiere meine Arbeit effizient.

Zusammenarbeit & Feedback:
Ich arbeite gerne im Team und gebe konstruktives Feedback.

Entwicklung & Lernen:
Ich bin stets bestrebt, mich weiterzuentwickeln und Neues zu lernen.

Energie & Belastung:
Ich fühle mich energiegeladen und kann mit der Arbeitsbelastung gut umgehen.

Kultur & Werte:
Die Unternehmenskultur entspricht meinen Werten.

Entscheidungsspielräume & Freiheit:
Ich habe ausreichend Entscheidungsspielräume in meiner Arbeit.

Wertschätzung & Gesehenwerden:
Ich fühle mich wertgeschätzt und gesehen in meinem Team.

Perspektive & Zukunft:
Ich sehe positive Perspektiven für meine berufliche Zukunft.

Verbesserungsvorschläge & Ideen:
Ich habe einige Ideen zur Verbesserung der Arbeitsprozesse.

Rollentausch & Führungsperspektive:
Ich könnte mir vorstellen, Führungsverantwortung zu übernehmen.

Empfehlungen für dein Mitarbeiterjahresgespräch:
1. Sprechen Sie über Ihre Erfolge und Leistungen
2. Diskutieren Sie Entwicklungsmöglichkeiten
3. Planen Sie konkrete nächste Schritte`)

  const testQuestions = [
    {
      id: '1',
      text: 'Was macht Sie stolz in Ihrer Arbeit?',
      category: 'Stolz & Leistung'
    },
    {
      id: '2', 
      text: 'Wie gehen Sie mit Herausforderungen um?',
      category: 'Herausforderungen'
    }
  ]

  const testAnswers = {
    '1': 'Ich bin stolz auf die erfolgreiche Umsetzung des letzten Projekts.',
    '2': 'Ich analysiere die Situation und entwickle einen strukturierten Lösungsansatz.'
  }

  const testFollowUpQuestions = {
    '1': ['Was war der Schlüssel zum Erfolg?'],
    '2': ['Wie haben Sie das Team dabei unterstützt?']
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">PDF-Download Test</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test-Daten</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Zusammenfassung:</strong> {testSummary.length} Zeichen</p>
            <p><strong>Fragen:</strong> {testQuestions.length}</p>
            <p><strong>Antworten:</strong> {Object.keys(testAnswers).length}</p>
          </div>
        </div>

        <PDFDownload initialSummary={testSummary} />
      </div>
    </div>
  )
} 