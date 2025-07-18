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
    
    // Systematische Analyse - Überschrift (überspringen)
    if (line.includes('Systematische Analyse:')) {
      continue
    }
    
    // Empfehlungen erkennen (verbesserte Erkennung)
    if (line.includes('EMPFEHLUNGEN FÜR DEIN MITARBEITERJAHRESGESPRÄCH:') || 
        line.includes('Empfehlungen für dein Mitarbeiterjahresgespräch:') || 
        line.includes('Empfehlungen für dein Mitarbeiterjahresgespräch') ||
        line.includes('Empfehlungen für Ihr Mitarbeiterjahresgespräch:') ||
        line.includes('Empfehlungen für das Mitarbeiterjahresgespräch:')) {
      if (currentSection === 'category' && currentTitle && currentContent) {
        categories.push({ title: currentTitle, content: currentContent.trim() })
      }
      currentSection = 'recommendations'
      currentContent = line.replace('EMPFEHLUNGEN FÜR DEIN MITARBEITERJAHRESGESPRÄCH:', '')
                           .replace('Empfehlungen für dein Mitarbeiterjahresgespräch:', '')
                           .replace('Empfehlungen für dein Mitarbeiterjahresgespräch', '')
                           .replace('Empfehlungen für Ihr Mitarbeiterjahresgespräch:', '')
                           .replace('Empfehlungen für das Mitarbeiterjahresgespräch:', '').trim()
      continue
    }
    
    // Alle Kategorien erkennen (erweiterte Liste in korrekter Reihenfolge)
    const categoryTitles = [
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
      'Verbesserungsvorschläge & Ideen',
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
  const { progress, roleContext, questions: storedQuestions } = useSessionStore()
  const router = useRouter()

  // Verwende initialSummary wenn verfügbar
  useEffect(() => {
    if (initialSummary && !summary) {
      setSummary(initialSummary)
    }
  }, [initialSummary, summary])

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
    
    // Farben für verschiedene Kategorien
    const getCategoryColor = (title: string) => {
      const colorMap: { [key: string]: string } = {
        'Stolz & persönliche Leistung': 'green',
        'Herausforderungen & Umgang mit Druck': 'orange',
        'Verantwortung & Selbstorganisation': 'purple',
        'Zusammenarbeit & Feedback': 'blue',
        'Entwicklung & Lernen': 'emerald',
        'Energie & Belastung': 'amber',
        'Kultur & Werte': 'violet',
        'Entscheidungsspielräume & Freiheit': 'indigo',
        'Wertschätzung & Gesehenwerden': 'teal',
        'Perspektive & Zukunft': 'sky',
        'Verbesserungsvorschläge & Ideen': 'indigo',
        'Rollentausch & Führungsperspektive': 'purple'
      }
      return colorMap[title] || 'gray'
    }
    
    return (
      <div className="space-y-8">
        {/* Einleitung */}
        {intro && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-6 rounded-xl shadow-sm">
            <div className="flex items-center mb-3">
              <svg className="w-6 h-6 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-lg font-semibold text-blue-900">Einleitung & Überblick</span>
            </div>
            <div className="text-blue-900 leading-relaxed whitespace-pre-line">{intro}</div>
          </div>
        )}
        
        {/* Systematische Analyse Header */}
        {categories.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-lg font-semibold text-indigo-900">Systematische Analyse</span>
            </div>
          </div>
        )}
        
        {/* Kategorien */}
        <div className="grid md:grid-cols-2 gap-6">
          {categories.map(cat => {
            const color = getCategoryColor(cat.title)
            const colorClasses = {
              indigo: 'border-indigo-200 bg-indigo-50',
              green: 'border-green-200 bg-green-50',
              orange: 'border-orange-200 bg-orange-50',
              purple: 'border-purple-200 bg-purple-50',
              blue: 'border-blue-200 bg-blue-50',
              emerald: 'border-emerald-200 bg-emerald-50',
              amber: 'border-amber-200 bg-amber-50',
              violet: 'border-violet-200 bg-violet-50',
              teal: 'border-teal-200 bg-teal-50',
              sky: 'border-sky-200 bg-sky-50',
              gray: 'border-gray-200 bg-gray-50'
            }
            
            const textColors = {
              indigo: 'text-indigo-900',
              green: 'text-green-900',
              orange: 'text-orange-900',
              purple: 'text-purple-900',
              blue: 'text-blue-900',
              emerald: 'text-emerald-900',
              amber: 'text-amber-900',
              violet: 'text-violet-900',
              teal: 'text-teal-900',
              sky: 'text-sky-900',
              gray: 'text-gray-900'
            }
            
            const titleColors = {
              indigo: 'text-indigo-700',
              green: 'text-green-700',
              orange: 'text-orange-700',
              purple: 'text-purple-700',
              blue: 'text-blue-700',
              emerald: 'text-emerald-700',
              amber: 'text-amber-700',
              violet: 'text-violet-700',
              teal: 'text-teal-700',
              sky: 'text-sky-700',
              gray: 'text-gray-700'
            }
            
            return (
              <div key={cat.title} className={`border rounded-xl p-5 shadow-sm ${colorClasses[color as keyof typeof colorClasses]}`}>
                <div className={`text-base font-bold mb-3 ${titleColors[color as keyof typeof titleColors]}`}>
                  {cat.title}
                </div>
                <div className={`whitespace-pre-line leading-relaxed ${textColors[color as keyof typeof textColors]}`}>
                  {cat.content}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Empfehlungen */}
        {recommendations && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 p-6 rounded-xl shadow-sm">
            <div className="flex items-center mb-3">
              <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
      console.log('Starting PDF generation...')
      console.log('Summary length:', summary?.length)
      console.log('Stored questions:', storedQuestions?.length)
      console.log('Progress answers:', Object.keys(progress.answers || {}).length)
      console.log('Role context:', roleContext)
      
      // Prüfe ob alle notwendigen Daten vorhanden sind
      if (!summary || summary.trim().length === 0) {
        alert('Keine Zusammenfassung verfügbar. Bitte generiere zuerst eine Zusammenfassung.')
        return
      }
      
      if (!storedQuestions || storedQuestions.length === 0) {
        alert('Keine Fragen verfügbar. Bitte starte den Prozess neu.')
        return
      }
      
      // Versuche zuerst @react-pdf/renderer
      try {
        console.log('Loading @react-pdf/renderer...')
        const { pdf } = await import('@react-pdf/renderer')
        const PDFDocument = (await import('./PDFDocument')).default
        
        console.log('PDF components loaded successfully')
        console.log('Generating PDF blob...')
        
        const blob = await pdf(
          <PDFDocument
            summary={summary || ''}
            questions={storedQuestions || []}
            answers={progress.answers || {}}
            followUpQuestions={progress.followUpQuestions || {}}
            roleContext={roleContext}
            userName={roleContext ? `${roleContext.firstName} ${roleContext.lastName}` : 'Nicht angegeben'}
            department={roleContext?.workAreas.join(', ') || 'Nicht angegeben'}
          />
        ).toBlob()
        
        console.log('PDF blob generated, size:', blob.size)
        
        if (blob.size === 0) {
          throw new Error('Generated PDF is empty')
        }
        
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `OmniReflect_Zusammenfassung_${new Date().toISOString().split('T')[0]}.pdf`
        
        // Füge Link zum DOM hinzu und klicke ihn
        document.body.appendChild(link)
        link.click()
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }, 100)
        
        console.log('PDF download initiated successfully')
        return
        
      } catch (pdfError) {
        console.warn('@react-pdf/renderer failed, trying alternative method:', pdfError)
        
        // Versuche alternative PDF-Generierung mit jsPDF
        try {
          console.log('Trying jsPDF alternative...')
          const { jsPDF } = await import('jspdf')
          
          const doc = new jsPDF()
          
          // Titel
          doc.setFontSize(20)
          doc.text('OmniReflect - Zusammenfassung', 20, 20)
          
          // Metadaten
          doc.setFontSize(12)
          doc.text(`Generiert am: ${new Date().toLocaleDateString('de-DE')}`, 20, 35)
          doc.text(`Name: ${roleContext ? `${roleContext.firstName} ${roleContext.lastName}` : 'Nicht angegeben'}`, 20, 45)
          doc.text(`Abteilung: ${roleContext?.workAreas.join(', ') || 'Nicht angegeben'}`, 20, 55)
          
          // Zusammenfassung
          doc.setFontSize(14)
          doc.text('ZUSAMMENFASSUNG:', 20, 75)
          
          doc.setFontSize(10)
          const summaryLines = doc.splitTextToSize(summary, 170)
          let yPosition = 85
          
          for (let i = 0; i < summaryLines.length; i++) {
            if (yPosition > 270) {
              doc.addPage()
              yPosition = 20
            }
            doc.text(summaryLines[i], 20, yPosition)
            yPosition += 5
          }
          
          // Fragen und Antworten
          if (storedQuestions && storedQuestions.length > 0) {
            yPosition += 10
            if (yPosition > 270) {
              doc.addPage()
              yPosition = 20
            }
            
            doc.setFontSize(14)
            doc.text('BEANTWORTETE FRAGEN:', 20, yPosition)
            yPosition += 10
            
            doc.setFontSize(10)
            storedQuestions.forEach((q, index) => {
              const answer = progress.answers?.[q.id]
              if (answer) {
                if (yPosition > 270) {
                  doc.addPage()
                  yPosition = 20
                }
                
                doc.setFontSize(11)
                doc.text(`Frage ${index + 1}: ${q.text}`, 20, yPosition)
                yPosition += 8
                
                doc.setFontSize(10)
                const answerLines = doc.splitTextToSize(`Antwort: ${answer}`, 170)
                for (const line of answerLines) {
                  if (yPosition > 270) {
                    doc.addPage()
                    yPosition = 20
                  }
                  doc.text(line, 25, yPosition)
                  yPosition += 5
                }
                yPosition += 5
              }
            })
          }
          
          // Footer
          doc.setFontSize(8)
          doc.text('Diese Zusammenfassung wurde automatisch generiert. Deine Daten werden nach 30 Tagen gelöscht.', 20, 280)
          
          // PDF herunterladen
          doc.save(`OmniReflect_Zusammenfassung_${new Date().toISOString().split('T')[0]}.pdf`)
          
          console.log('PDF generated successfully with jsPDF')
          return
          
        } catch (jsPDFError) {
          console.warn('jsPDF also failed, using text fallback:', jsPDFError)
          
          // Fallback: Erstelle eine einfache Text-Datei
          const textContent = `OmniReflect - Zusammenfassung
Generiert am: ${new Date().toLocaleDateString('de-DE')}
Name: ${roleContext ? `${roleContext.firstName} ${roleContext.lastName}` : 'Nicht angegeben'}
Abteilung: ${roleContext?.workAreas.join(', ') || 'Nicht angegeben'}

ZUSAMMENFASSUNG:
${summary}

BEANTWORTETE FRAGEN:
${storedQuestions?.map(q => {
  const answer = progress.answers?.[q.id]
  return answer ? `\n${q.text}\nAntwort: ${answer}` : null
}).filter(Boolean).join('\n') || 'Keine Fragen beantwortet'}

---
Diese Zusammenfassung wurde automatisch generiert. Deine Daten werden nach 30 Tagen gelöscht.`
          
          const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `OmniReflect_Zusammenfassung_${new Date().toISOString().split('T')[0]}.txt`
          
          document.body.appendChild(link)
          link.click()
          
          setTimeout(() => {
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          }, 100)
          
          alert('PDF-Generierung fehlgeschlagen. Eine Text-Datei wurde stattdessen heruntergeladen.')
          return
        }
      }
      
    } catch (error) {
      console.error('Fehler beim PDF-Download:', error)
      
      // Detaillierte Fehlermeldung für verschiedene Szenarien
      let errorMessage = 'Fehler beim PDF-Download. '
      
      if (error instanceof Error) {
        if (error.message.includes('@react-pdf/renderer')) {
          errorMessage += 'PDF-Bibliothek konnte nicht geladen werden. Bitte lade die Seite neu und versuche es erneut.'
        } else if (error.message.includes('blob')) {
          errorMessage += 'PDF konnte nicht erstellt werden. Bitte stelle sicher, dass alle Daten verfügbar sind.'
        } else {
          errorMessage += error.message
        }
      }
      
      alert(errorMessage)
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
          Hier ist deine KI-gestützte Zusammenfassung für persönliche Entwicklung und das Mitarbeiterjahresgespräch
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
                  router.push('/questions')
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
                {storedQuestions?.filter(q => progress.answers[q.id])?.length || 0} von {storedQuestions?.length || 0} Fragen beantwortet
              </span>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Warnung bei wenigen beantworteten Fragen */}
          {summary && storedQuestions && progress.answers && (
            (() => {
              const answeredCount = storedQuestions.filter(q => progress.answers[q.id]).length
              const totalCount = storedQuestions.length
              if (answeredCount < 3 && answeredCount < totalCount) {
                return (
                  <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          <strong>Hinweis:</strong> Nur {answeredCount} von {totalCount} Fragen wurden beantwortet. 
                          Die Zusammenfassung basiert auf den verfügbaren Antworten. 
                          Für eine vollständigere Analyse empfehlen wir, alle Fragen zu beantworten.
                        </p>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            })()
          )}
          
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
                    router.push('/questions')
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