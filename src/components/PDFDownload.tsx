'use client'

import { useState, useEffect } from 'react'
import { useSessionStore } from '@/state/sessionStore'
import { generateSummary } from '@/lib/gpt'

interface PDFDownloadProps {
  initialSummary?: string
}

export default function PDFDownload({ initialSummary }: PDFDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [summary, setSummary] = useState<string>('')
  const { progress, hashId, roleContext } = useSessionStore()

  // Verwende initialSummary wenn verfügbar
  useEffect(() => {
    if (initialSummary) {
      setSummary(initialSummary)
    }
  }, [initialSummary])

  const handleGenerateSummary = async () => {
    setIsGenerating(true)
    try {
      const generatedSummary = await generateSummary(
        progress.answers,
        progress.followUpQuestions,
        roleContext || undefined
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
          Zusammenfassung & PDF-Export
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
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Deine Zusammenfassung:
              </h3>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {summary}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleDownloadPDF}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-md transition duration-200"
              >
                PDF herunterladen
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
          </div>
        )}
      </div>
    </div>
  )
} 