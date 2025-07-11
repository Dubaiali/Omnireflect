'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/state/sessionStore'
import PDFDownload from '@/components/PDFDownload'
import Link from 'next/link'

export default function SummaryPage() {
  const { isAuthenticated, logout, roleContext, progress, hashId } = useSessionStore()
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [summary, setSummary] = useState<string>('')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingTime, setLoadingTime] = useState(0)

  useEffect(() => {
    // Wenn keine Antworten vorhanden sind, zurück zu den Fragen
    if (!progress.answers || Object.keys(progress.answers).length === 0) {
      router.push('/questions')
      return
    }

    // Wenn keine Zusammenfassung vorhanden ist, automatisch generieren
    if (!summary && !isGenerating && progress.answers && Object.keys(progress.answers).length > 0) {
      handleAutoGenerateSummary()
    }
  }, [progress.answers, summary, isGenerating, router])

  const handleAutoGenerateSummary = async () => {
    if (isGenerating) return
    
    setIsGenerating(true)
    setLoadingProgress(0)
    setLoadingTime(0)
    
    // Starte Progress-Animation
    const startTime = Date.now()
    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      setLoadingTime(Math.floor(elapsed))
      // Simuliere realistischen Fortschritt (0-90% in 6 Sekunden)
      const progress = Math.min(90, (elapsed / 6) * 90)
      setLoadingProgress(progress)
    }, 100)
    
    try {
      const { generateSummary } = await import('@/lib/gpt')
      const generatedSummary = await generateSummary(
        progress.answers,
        progress.followUpQuestions,
        roleContext || undefined
      )
      
      // Beende Progress-Animation
      clearInterval(progressInterval)
      setLoadingProgress(100)
      
      setSummary(generatedSummary)
    } catch (error) {
      console.error('Fehler bei der automatischen Zusammenfassungsgenerierung:', error)
      setSummary('Es gab einen Fehler bei der Generierung der Zusammenfassung.')
    } finally {
      clearInterval(progressInterval)
      setIsGenerating(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  // Zeige Ladebildschirm während der Generierung
  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Meine Zusammenfassung
                </h1>
                <p className="text-sm text-gray-600">
                  Generiere eine KI-gestützte Zusammenfassung deiner Reflexion
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="py-8">
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  <span className="text-3xl">🤖</span> Ich erstelle jetzt deine Zusammenfassung <span className="text-3xl">🤖</span>
                </h3>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Fortschritt</span>
                    <span className="text-sm text-gray-600">{Math.round(loadingProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                  </div>
                </div>
                
                <p className="text-gray-600 text-lg mb-2">
                  Ich erstelle deine Zusammenfassung...
                </p>
                <p className="text-sm text-gray-500">
                  {loadingTime > 0 ? `${loadingTime} Sekunden` : 'Starte...'}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Meine Zusammenfassung
              </h1>
              <p className="text-sm text-gray-600">
                Deine KI-gestützte Zusammenfassung ist bereit
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  Abmelden
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <PDFDownload initialSummary={summary} />
      </main>
    </div>
  )
} 