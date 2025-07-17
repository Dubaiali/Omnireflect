'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/state/sessionStore'
import { generateSummary } from '@/lib/gpt'

interface PDFDownloadProps {
  initialSummary?: string
}

// Hilfsfunktion: Zusammenfassung in Abschnitte parsen
function parseSummary(summary: string) {
  if (!summary) return { intro: '', categories: [], recommendations: '' }

  // Einfache Aufteilung nach Zeilenumbrüchen
  const lines = summary.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  let intro = ''
  let recommendations = ''
  const categories: { title: string, content: string }[] = []
  
  let currentSection = 'intro'
  let currentContent = ''
  let currentTitle = ''

  for (const line of lines) {
    // Einleitung erkennen
    if (line.includes('Einleitung:')) {
      currentSection = 'intro'
      currentContent = line.replace('Einleitung:', '').trim()
      continue
    }
    
    // Empfehlungen erkennen
    if (line.includes('Empfehlungen für dein Mitarbeiterjahresgespräch:')) {
      if (currentSection === 'category' && currentTitle && currentContent) {
        categories.push({ title: currentTitle, content: currentContent.trim() })
      }
      currentSection = 'recommendations'
      currentContent = line.replace('Empfehlungen für dein Mitarbeiterjahresgespräch:', '').trim()
      continue
    }
    
    // Kategorien erkennen (flexibler)
    const categoryTitles = [
      'Führungsperspektive & Verbesserungsvorschläge',
      'Stolz & persönliche Leistung', 
      'Herausforderungen & Umgang mit Druck',
      'Verantwortung & Selbstorganisation',
      'Zusammenarbeit & Feedback',
      'Entwicklung & Lernen',
      'Energie & Belastung',
      'Kultur & Werte',
      'Entscheidungsspielräume & Freiheit',
      'Wertschätzung & Gesehenwerden',
      'Perspektive & Zukunft',
      'Rollentausch & Führungsperspektive'
    ]
    
    // Prüfe, ob die Zeile eine Kategorie enthält (mit oder ohne Doppelpunkt)
    const matchingCategory = categoryTitles.find(title => 
      line.includes(title) && (line.endsWith(':') || line.endsWith(title))
    )
    
    if (matchingCategory) {
      // Vorherige Kategorie speichern
      if (currentSection === 'category' && currentTitle && currentContent) {
        categories.push({ title: currentTitle, content: currentContent.trim() })
      }
      
      currentSection = 'category'
      currentTitle = matchingCategory
      currentContent = ''
      continue
    }
    
    // Inhalt zur aktuellen Sektion hinzufügen
    if (currentSection === 'intro') {
      intro += (intro ? '\n' : '') + line
    } else if (currentSection === 'category') {
      currentContent += (currentContent ? '\n' : '') + line
    } else if (currentSection === 'recommendations') {
      recommendations += (recommendations ? '\n' : '') + line
    }
  }
  
  // Letzte Kategorie speichern
  if (currentSection === 'category' && currentTitle && currentContent) {
    categories.push({ title: currentTitle, content: currentContent.trim() })
  }
  
  console.log('Raw parsing result:', { intro: intro.length, categories: categories.length, recommendations: recommendations.length })
  console.log('Found categories:', categories.map(c => c.title))
  console.log('Intro content:', intro)
  console.log('First few lines of summary:', lines.slice(0, 10))
  
  return { 
    intro: intro.trim(), 
    categories, 
    recommendations: recommendations.trim() 
  }
}

export default function PDFDownload({ initialSummary }: PDFDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [summary, setSummary] = useState<string>('')
  const [showResetWarning, setShowResetWarning] = useState(false)
  const { progress, hashId, roleContext, questions: storedQuestions } = useSessionStore()
  const router = useRouter()

  // Verwende initialSummary wenn verfügbar
  useEffect(() => {
    if (initialSummary && !summary) {
      setSummary(initialSummary)
    }
  }, [initialSummary])

  const handleGenerateSummary = async () => {
    setIsGenerating(true)
    try {
      const generatedSummary = await generateSummary(
        progress.answers,
        progress.followUpQuestions,
        roleContext || undefined,
        storedQuestions || undefined
      )
      setSummary(generatedSummary)
    } catch (error) {
      console.error('Fehler bei der Zusammenfassungsgenerierung:', error)
      setSummary('Es gab einen Fehler bei der Generierung der Zusammenfassung.')
    } finally {
      setIsGenerating(false)
    }
  }

  // NEUE DARSTELLUNG DER ZUSAMMENFASSUNG
  const renderSummary = (summaryText: string) => {
    const { intro, categories, recommendations } = parseSummary(summaryText)
    
    // Debug-Ausgabe
    console.log('Parsed summary:', { intro: intro.length, categories: categories.length, recommendations: recommendations.length })
    console.log('Categories found:', categories.map(c => c.title))
    
    // Fallback: Wenn keine Kategorien gefunden wurden, zeige den Text einfach an
    if (categories.length === 0) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="text-gray-800 whitespace-pre-line leading-relaxed">
            {summaryText}
          </div>
        </div>
      )
    }
    
    return (
      <div className="space-y-8">
        {/* Einleitung */}
        {intro && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-xl shadow-sm">
            <div className="flex items-center mb-2">
              <svg className="w-6 h-6 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-lg font-semibold text-blue-900">Einleitung</span>
            </div>
            <div className="text-blue-900 leading-relaxed whitespace-pre-line">{intro}</div>
          </div>
        )}
        {/* Kategorien */}
        <div className="grid md:grid-cols-2 gap-6">
          {categories.map(cat => (
            <div key={cat.title} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="text-base font-bold text-indigo-700 mb-2">{cat.title}</div>
              <div className="text-gray-800 whitespace-pre-line">{cat.content}</div>
            </div>
          ))}
        </div>
        {/* Empfehlungen */}
        {recommendations && (
          <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-xl shadow-sm">
            <div className="flex items-center mb-2">
              <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" /></svg>
              <span className="text-lg font-semibold text-green-900">Empfehlungen für dein Mitarbeiterjahresgespräch</span>
            </div>
            <div className="text-green-900 leading-relaxed whitespace-pre-line">{recommendations}</div>
          </div>
        )}
      </div>
    )
  }

  const handleDownloadPDF = async () => {
    try {
      const { pdf } = await import('@react-pdf/renderer')
      const PDFDocument = (await import('./PDFDocument')).default
      
      const blob = await pdf(
        <PDFDocument
          summary={summary || ''}
          questions={storedQuestions || []}
          answers={progress.answers}
          followUpQuestions={progress.followUpQuestions}
          roleContext={roleContext}
          userName={roleContext ? `${roleContext.firstName} ${roleContext.lastName}` : 'Nicht angegeben'}
          department={roleContext?.workAreas.join(', ') || 'Nicht angegeben'}
        />
      ).toBlob()
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `OmniReflect_Zusammenfassung_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Fehler beim PDF-Download:', error)
      alert('Fehler beim PDF-Download. Bitte versuche es erneut.')
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header mit Erfolgs-Badge */}
      <div className="mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-green-100 p-3 rounded-full">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
          🎉 Deine Reflexion ist bereit!
        </h1>
        <p className="text-lg text-gray-600 text-center">
          Hier ist deine KI-gestützte Zusammenfassung für das Mitarbeiterjahresgespräch
        </p>
      </div>

      {/* Action Buttons und Nächste Schritte - über dem Header */}
      {summary && (
        <div className="mb-6 space-y-6">
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleDownloadPDF}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>PDF herunterladen</span>
            </button>
            <button
              onClick={() => {
                if (summary && summary.trim().length > 0) {
                  setShowResetWarning(true)
                } else {
                  router.push('/questions?question=12')
                }
              }}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Zurück zu Fragen</span>
            </button>
          </div>

          {/* Nächste Schritte Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-blue-900">Nächste Schritte</h4>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-1 rounded-full mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-blue-800">Lade das PDF herunter und speichere es sicher</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-1 rounded-full mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-blue-800">Nutze die Zusammenfassung zur Vorbereitung deines Gesprächs</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-1 rounded-full mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-blue-800">Teile das PDF mit deiner Führungskraft vor dem Gespräch</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-orange-100 p-1 rounded-full mt-0.5">
                    <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm text-blue-800">Deine Daten werden automatisch nach 30 Tagen gelöscht</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header der Zusammenfassung */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Zusammenfassung & PDF-Export
              </h2>
              <p className="text-blue-100">
                Generiert am {new Date().toLocaleDateString('de-DE', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <span className="text-white font-semibold text-sm">
                {storedQuestions?.length || 0} Fragen beantwortet
              </span>
            </div>
          </div>
        </div>

        <div className="p-8">
          {!summary && (
            <div className="text-center py-12">
              <div className="bg-blue-50 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                KI-Zusammenfassung generieren
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Basierend auf deinen Antworten erstelle ich eine strukturierte Zusammenfassung für dein Mitarbeiterjahresgespräch.
              </p>
              <button
                onClick={handleGenerateSummary}
                disabled={isGenerating}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                {isGenerating ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generiere Zusammenfassung...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Zusammenfassung generieren</span>
                  </div>
                )}
              </button>
            </div>
          )}

          {summary && (
            <div className="space-y-8">
              {renderSummary(summary)}
            </div>
          )}
        </div>
      </div>

      {/* Reset Warning Modal */}
      {showResetWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="bg-orange-100 p-3 rounded-full">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Zusammenfassung verlieren?
                  </h3>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-3">
                  Du hast bereits eine Zusammenfassung generiert.
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  Wenn du zurück zu den Fragen gehst, wird:
                </p>
                <ul className="text-sm text-gray-600 space-y-2 ml-4">
                  <li className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Die generierte Zusammenfassung gelöscht</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Du kannst deine Antworten bearbeiten</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Eine neue Zusammenfassung generieren</span>
                  </li>
                </ul>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowResetWarning(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    setShowResetWarning(false)
                    router.push('/questions?question=12')
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-lg transition duration-200"
                >
                  Zurück zu Fragen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 