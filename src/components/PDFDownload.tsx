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

  const handleDownloadPDF = () => {
    // Erstelle HTML für Fragen und Antworten
    let questionsAndAnswersHTML = ''
    if (storedQuestions && storedQuestions.length > 0) {
      questionsAndAnswersHTML = `
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #10b981;">
          <h2 style="color: #065f46; margin-bottom: 20px;">Fragen und Antworten</h2>
          <div style="color: #064e3b; line-height: 1.6;">
      `
      
      storedQuestions.forEach((question, index) => {
        const answer = progress.answers[question.id]
        const followUpQuestions = progress.followUpQuestions[question.id] || []
        
        questionsAndAnswersHTML += `
          <div style="margin-bottom: 25px; padding: 15px; background-color: white; border-radius: 6px; border: 1px solid #e5e7eb;">
            <div style="margin-bottom: 10px;">
              <span style="background-color: #dbeafe; color: #1e40af; font-size: 12px; font-weight: 600; padding: 4px 8px; border-radius: 4px;">
                ${question.category}
              </span>
            </div>
            <h3 style="color: #1f2937; font-size: 16px; font-weight: 600; margin-bottom: 10px;">
              Frage ${index + 1}: ${question.question}
            </h3>
        `
        
        if (answer) {
          questionsAndAnswersHTML += `
            <div style="margin-bottom: 10px;">
              <strong style="color: #374151;">Antwort:</strong>
              <div style="background-color: #f3f4f6; padding: 10px; border-radius: 4px; margin-top: 5px; white-space: pre-wrap;">
                ${answer}
              </div>
            </div>
          `
        } else {
          questionsAndAnswersHTML += `
            <div style="margin-bottom: 10px;">
              <em style="color: #6b7280;">Nicht beantwortet</em>
            </div>
          `
        }
        
        // Follow-up Fragen und Antworten
        if (followUpQuestions.length > 0) {
          questionsAndAnswersHTML += `
            <div style="margin-top: 10px;">
              <strong style="color: #374151;">Vertiefende Nachfragen:</strong>
          `
          
          followUpQuestions.forEach((followUpQuestion, followUpIndex) => {
            const followUpAnswer = progress.answers[`${question.id}_followup_${followUpIndex}`]
            questionsAndAnswersHTML += `
              <div style="margin-top: 8px; padding: 8px; background-color: #f0fdf4; border-radius: 4px;">
                <div style="font-weight: 500; color: #166534; margin-bottom: 5px;">
                  ${followUpQuestion}
                </div>
            `
            
            if (followUpAnswer) {
              questionsAndAnswersHTML += `
                <div style="color: #15803d; font-style: italic;">
                  ${followUpAnswer}
                </div>
              `
            } else {
              questionsAndAnswersHTML += `
                <div style="color: #6b7280; font-style: italic;">
                  Nicht beantwortet
                </div>
              `
            }
            
            questionsAndAnswersHTML += `
              </div>
            `
          })
          
          questionsAndAnswersHTML += `
            </div>
          `
        }
        
        questionsAndAnswersHTML += `
          </div>
        `
      })
      
      questionsAndAnswersHTML += `
          </div>
        </div>
      `
    }

    // Einfache PDF-Generierung mit Browser-API
    const element = document.createElement('div')
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1f2937; text-align: center; margin-bottom: 30px;">
          Mitarbeiter:innen-Reflexion & Entwicklungsgespräch
        </h1>
        
        ${roleContext ? `
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #3b82f6;">
          <h2 style="color: #1e40af; margin-bottom: 15px;">Rollenkontext</h2>
          <div style="color: #1e3a8a; line-height: 1.6;">
            <p><strong>Arbeitsbereich:</strong> ${roleContext.workAreas.join(', ')}</p>
            <p><strong>Funktion:</strong> ${roleContext.functions.join(', ')}</p>
            <p><strong>Erfahrung:</strong> ${roleContext.experienceYears}</p>
            <p><strong>Kundenkontakt:</strong> ${roleContext.customerContact}</p>
            ${roleContext.dailyTasks ? `<p><strong>Tägliche Aufgaben:</strong> ${roleContext.dailyTasks}</p>` : ''}
          </div>
        </div>
        ` : ''}
        
        ${questionsAndAnswersHTML}
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #374151; margin-bottom: 15px;">Zusammenfassung der Selbstreflexion</h2>
          <div style="white-space: pre-wrap; line-height: 1.6; color: #4b5563;">
            ${summary}
          </div>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Generiert am ${new Date().toLocaleDateString('de-DE')} | 
            Hash-ID: ${hashId || 'Unbekannt'}
          </p>
        </div>
      </div>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Mitarbeiter:innen-Reflexion</title>
            <style>
              body { font-family: Arial, sans-serif; }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            ${element.innerHTML}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Zusammenfassung für dein Mitarbeiterjahresgespräch
        </h2>

        {!summary && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Klicke auf den Button unten, um eine KI-gestützte Zusammenfassung deiner Reflexion zu generieren.
            </p>
            <button
              onClick={handleGenerateSummary}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-md transition duration-200"
            >
              {isGenerating ? 'Generiere Zusammenfassung...' : 'Zusammenfassung generieren'}
            </button>
          </div>
        )}

        {summary && (
          <div className="space-y-6">
            {/* Buttons und Erläuterungen nach oben verschoben */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleDownloadPDF}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-md transition duration-200"
              >
                PDF herunterladen
              </button>
              <button
                onClick={() => {
                  // Prüfe ob eine Zusammenfassung generiert wurde
                  if (summary && summary.trim().length > 0) {
                    setShowResetWarning(true)
                  } else {
                    router.push('/questions')
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition duration-200"
              >
                Zurück zu Fragen
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Nächste Schritte:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Lade das PDF herunter und speichere es sicher</li>
                <li>• Nutze die Zusammenfassung zur Vorbereitung deines Gesprächs</li>
                <li>• Teile das PDF mit deiner Führungskraft vor dem Gespräch</li>
                <li>• Deine Daten werden automatisch nach 30 Tagen gelöscht</li>
              </ul>
            </div>

            {/* Zusammenfassung nach unten verschoben */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {summary}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reset Warning Modal */}
      {showResetWarning && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-md max-w-md mx-4 p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-800">
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
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Die generierte Zusammenfassung gelöscht</li>
                <li>• Du kannst deine Antworten bearbeiten</li>
                <li>• Eine neue Zusammenfassung generieren</li>
              </ul>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowResetWarning(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition duration-200"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  setShowResetWarning(false)
                  router.push('/questions')
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md transition duration-200"
              >
                Zurück zu Fragen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 