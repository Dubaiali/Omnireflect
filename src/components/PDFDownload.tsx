'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/state/sessionStore'
import { generateSummary } from '@/lib/gpt'

interface PDFDownloadProps {
  initialSummary?: string
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

  const formatSummary = (summaryText: string) => {
    if (!summaryText) return null
    
    const sections = summaryText.split(/\n(?=\d+\.|KERNAUSSAGEN:|PRIORITÄTSANALYSE:|ENTWICKLUNGSBEREICHE:|HANDLUNGSEMPFEHLUNGEN:|Einleitung:|Systematische Analyse:|Empfehlungen für dein Mitarbeiterjahresgespräch:)/)
    
    return sections.map((section, index) => {
      const trimmedSection = section.trim()
      if (!trimmedSection) return null
      
      // Erkenne Sektionen
      if (trimmedSection.includes('KERNAUSSAGEN:') || trimmedSection.includes('Einleitung:')) {
        return (
          <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-blue-900">Kernaussagen</h4>
            </div>
            <div className="text-blue-800 leading-relaxed">
              {trimmedSection.replace(/^(KERNAUSSAGEN:|Einleitung:)/, '').trim()}
            </div>
          </div>
        )
      }
      
      if (trimmedSection.includes('FÜHRUNGSPERSPEKTIVE & VERBESSERUNGSVORSCHLÄGE:') || trimmedSection.includes('Führungsperspektive & Verbesserungsvorschläge:')) {
        return (
          <div key={index} className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
            <div className="flex items-center mb-4">
              <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-indigo-900">Führungsperspektive & Verbesserungsvorschläge</h4>
            </div>
            <div className="text-indigo-800 leading-relaxed">
              {trimmedSection.replace(/^(FÜHRUNGSPERSPEKTIVE & VERBESSERUNGSVORSCHLÄGE:|Führungsperspektive & Verbesserungsvorschläge:)/, '').trim()}
            </div>
          </div>
        )
      }
      
      if (trimmedSection.includes('PRIORITÄTSANALYSE:') || trimmedSection.includes('Systematische Analyse:')) {
        const items = trimmedSection
          .replace(/^(PRIORITÄTSANALYSE:|Systematische Analyse:)/, '')
          .split(/\n(?=\d+\.)/)
          .filter(item => item.trim())
        
        return (
          <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-green-900">Prioritätsanalyse</h4>
            </div>
            <div className="space-y-4">
              {items.map((item, itemIndex) => {
                const match = item.match(/^(\d+)\.\s*(.+)/)
                if (match) {
                  const [, number, content] = match
                  return (
                    <div key={itemIndex} className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-start">
                        <div className="bg-green-100 text-green-700 font-semibold rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">
                          {number}
                        </div>
                        <div className="text-green-800 leading-relaxed flex-1">
                          {content.trim()}
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              })}
            </div>
          </div>
        )
      }
      
      if (trimmedSection.includes('ENTWICKLUNGSBEREICHE:')) {
        return (
          <div key={index} className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center mb-4">
              <div className="bg-orange-100 p-2 rounded-lg mr-3">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-orange-900">Entwicklungsbereiche</h4>
            </div>
            <div className="text-orange-800 leading-relaxed">
              {trimmedSection.replace(/^ENTWICKLUNGSBEREICHE:/, '').trim()}
            </div>
          </div>
        )
      }
      
      if (trimmedSection.includes('HANDLUNGSEMPFEHLUNGEN:') || trimmedSection.includes('Empfehlungen für dein Mitarbeiterjahresgespräch:')) {
        const recommendations = trimmedSection
          .replace(/^(HANDLUNGSEMPFEHLUNGEN:|Empfehlungen für dein Mitarbeiterjahresgespräch:)/, '')
          .split(/\n(?=\d+\.|•)/)
          .filter(item => item.trim())
        
        return (
          <div key={index} className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 p-2 rounded-lg mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-purple-900">Handlungsempfehlungen</h4>
            </div>
            <div className="space-y-3">
              {recommendations.map((rec, recIndex) => {
                const cleanRec = rec.replace(/^(\d+\.|•)\s*/, '').trim()
                if (cleanRec) {
                  return (
                    <div key={recIndex} className="flex items-start space-x-3">
                      <div className="bg-purple-100 p-1 rounded-full mt-1">
                        <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-purple-800 leading-relaxed">{cleanRec}</span>
                    </div>
                  )
                }
                return null
              })}
            </div>
          </div>
        )
      }
      
      // Fallback für andere Inhalte
      return (
        <div key={index} className="bg-gray-50 rounded-lg p-4">
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {trimmedSection}
          </div>
        </div>
      )
    }).filter(Boolean)
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

              {/* Zusammenfassung */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6">
                  <div className="flex items-center">
                    <div className="bg-white/20 p-3 rounded-lg mr-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">KI-Zusammenfassung</h3>
                      <p className="text-purple-100">Deine strukturierte Selbstreflexion</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="space-y-6">
                    {formatSummary(summary)}
                  </div>
                </div>
              </div>
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