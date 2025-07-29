'use client'

import React, { useState, useEffect } from 'react'
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
        line.includes('Empfehlungen für das Mitarbeiterjahresgespräch:') ||
        line.includes('**Empfehlungen für dein Mitarbeiterjahresgespräch:**')) {
      if (currentSection === 'category' && currentTitle && currentContent) {
        categories.push({ title: currentTitle, content: currentContent.trim() })
      }
      currentSection = 'recommendations'
      currentContent = line.replace('EMPFEHLUNGEN FÜR DEIN MITARBEITERJAHRESGESPRÄCH:', '')
                           .replace('Empfehlungen für dein Mitarbeiterjahresgespräch:', '')
                           .replace('Empfehlungen für dein Mitarbeiterjahresgespräch', '')
                           .replace('Empfehlungen für Ihr Mitarbeiterjahresgespräch:', '')
                           .replace('Empfehlungen für das Mitarbeiterjahresgespräch:', '')
                           .replace('**Empfehlungen für dein Mitarbeiterjahresgespräch:**', '')
                           .replace('**', '').trim()
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
    
    // Prüfe, ob die Zeile eine Kategorie enthält (mit oder ohne Doppelpunkt, mit oder ohne **)
    const matchingCategory = categoryTitles.find(title => {
      // Entferne ** und : für den Vergleich
      const cleanLine = line.replace(/\*\*/g, '').replace(/:/g, '').trim()
      const cleanTitle = title.trim()
      
      return cleanLine === cleanTitle || line.includes(`**${title}**`)
    })
    
    if (matchingCategory) {
      // Vorherige Kategorie speichern
      if (currentSection === 'category' && currentTitle && currentContent) {
        categories.push({ title: currentTitle, content: currentContent.trim() })
      }
      
      currentSection = 'category'
      currentTitle = matchingCategory.replace(/\*\*/g, '').replace(/:/g, '').trim()
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
  
  console.log('=== SUMMARY PARSING DEBUG ===')
  console.log('Raw parsing result:', { intro: intro.length, categories: categories.length, recommendations: recommendations.length })
  console.log('Found categories:', categories.map(c => c.title))
  console.log('Intro content:', intro.substring(0, 200) + '...')
  console.log('First 15 lines of summary:', lines.slice(0, 15))
  console.log('All lines that might be categories:')
  lines.forEach((line, index) => {
    if (line.includes('Stolz') || line.includes('Herausforderungen') || line.includes('Verantwortung') || 
        line.includes('Zusammenarbeit') || line.includes('Entwicklung') || line.includes('Energie') ||
        line.includes('Kultur') || line.includes('Entscheidung') || line.includes('Wertschätzung') ||
        line.includes('Perspektive') || line.includes('Verbesserung') || line.includes('Rollentausch')) {
      console.log(`Line ${index}: "${line}"`)
    }
  })
  console.log('=== CATEGORY MATCHING DEBUG ===')
  lines.forEach((line, index) => {
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
    
    categoryTitles.forEach(title => {
      const normalMatch = line.includes(title) && (line.endsWith(':') || line.endsWith(title))
      const boldMatch = line.includes(`**${title}**`) && (line.endsWith('**') || line.endsWith('**:'))
      
      if (normalMatch || boldMatch) {
        console.log(`✅ MATCH FOUND - Line ${index}: "${line}" matches "${title}"`)
        console.log(`   Normal match: ${normalMatch}, Bold match: ${boldMatch}`)
      }
    })
  })
  console.log('=== END CATEGORY MATCHING DEBUG ===')
  console.log('=== END DEBUG ===')
  
  return { 
    intro: intro.trim(), 
    categories, 
    recommendations: recommendations.trim() 
  }
}

// Icon-Mapping für Kategorien
const getCategoryIcon = (title: string) => {
  const iconMap: { [key: string]: React.ReactElement } = {
    'Stolz & persönliche Leistung': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    'Herausforderungen & Umgang mit Druck': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    'Verantwortung & Selbstorganisation': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    'Zusammenarbeit & Feedback': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    'Entwicklung & Lernen': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    'Energie & Belastung': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    'Kultur & Werte': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    ),
    'Entscheidungsspielräume & Freiheit': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'Wertschätzung & Gesehenwerden': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    'Perspektive & Zukunft': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    'Verbesserungsvorschläge & Ideen': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    'Rollentausch & Führungsperspektive': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  }
  return iconMap[title] || (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

// Farb-Mapping für Kategorien
const getCategoryColor = (title: string) => {
  const colorMap: { [key: string]: { bg: string, border: string, text: string, title: string } } = {
    'Stolz & persönliche Leistung': {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      title: 'text-green-700'
    },
    'Herausforderungen & Umgang mit Druck': {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-900',
      title: 'text-orange-700'
    },
    'Verantwortung & Selbstorganisation': {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-900',
      title: 'text-purple-700'
    },
    'Zusammenarbeit & Feedback': {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      title: 'text-blue-700'
    },
    'Entwicklung & Lernen': {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-900',
      title: 'text-emerald-700'
    },
    'Energie & Belastung': {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-900',
      title: 'text-amber-700'
    },
    'Kultur & Werte': {
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      text: 'text-violet-900',
      title: 'text-violet-700'
    },
    'Entscheidungsspielräume & Freiheit': {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      text: 'text-indigo-900',
      title: 'text-indigo-700'
    },
    'Wertschätzung & Gesehenwerden': {
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      text: 'text-teal-900',
      title: 'text-teal-700'
    },
    'Perspektive & Zukunft': {
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      text: 'text-sky-900',
      title: 'text-sky-700'
    },
    'Verbesserungsvorschläge & Ideen': {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      text: 'text-indigo-900',
      title: 'text-indigo-700'
    },
    'Rollentausch & Führungsperspektive': {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-900',
      title: 'text-purple-700'
    }
  }
  return colorMap[title] || {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-900',
    title: 'text-gray-700'
  }
}

export default function PDFDownload({ initialSummary }: PDFDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [summary, setSummary] = useState<string>('')
  const [showResetWarning, setShowResetWarning] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const { progress, roleContext, questions: storedQuestions } = useSessionStore()
  const router = useRouter()

  // Verwende initialSummary wenn verfügbar
  useEffect(() => {
    if (initialSummary && !summary) {
      setSummary(initialSummary)
    }
  }, [initialSummary, summary])

  // HTML-Export nach dem Rendering der Zusammenfassung
  useEffect(() => {
    if (summary) {
      // Kurze Verzögerung um sicherzustellen, dass das DOM gerendert ist
      const timer = setTimeout(() => {
        const htmlContent = exportSummaryHTML()
        if (htmlContent) {
          console.log('HTML-Inhalt exportiert:', htmlContent.length, 'Zeichen')
          // Automatisch speichern wenn HTML verfügbar ist
          handleSaveSummary(summary)
        }
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [summary])

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
      
      // Automatisch speichern nach der Generierung
      await handleSaveSummary(generatedSummary)
    } catch (error) {
      console.error('Fehler bei der Zusammenfassungsgenerierung:', error)
      setSummary('Es gab einen Fehler bei der Generierung der Zusammenfassung.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Funktion zum Exportieren des HTML-Inhalts
  const exportSummaryHTML = () => {
    const summaryRoot = document.getElementById('summary-root')
    if (summaryRoot) {
      return summaryRoot.outerHTML
    }
    return null
  }

  // Neue Funktion für das Speichern der Zusammenfassung
  const handleSaveSummary = async (summaryToSave: string) => {
    try {
      const { hashId } = useSessionStore.getState()
      if (hashId && summaryToSave) {
        console.log('Automatisches Speichern der Zusammenfassung...')
        
        // HTML-Inhalt exportieren
        const htmlContent = exportSummaryHTML()
        
        // Zusammenfassung auf Server speichern
        const summaryResponse = await fetch('/api/hash-list/save-summary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            hashId, 
            summary: summaryToSave,
            htmlContent: htmlContent,
            roleContext,
            answers: progress.answers,
            followUpQuestions: progress.followUpQuestions,
            questions: storedQuestions // Sende auch die ursprünglichen Fragen mit
          }),
        })
        
        if (summaryResponse.ok) {
          console.log('Zusammenfassung erfolgreich auf Server gespeichert')
        } else {
          console.warn('Fehler beim Speichern der Zusammenfassung auf Server')
        }
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Zusammenfassung:', error)
      // Fehler beim Speichern sollte die Anzeige nicht verhindern
    }
  }

  const toggleCategory = (title: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(title)) {
      newExpanded.delete(title)
    } else {
      newExpanded.add(title)
    }
    setExpandedCategories(newExpanded)
  }

  const expandAllCategories = () => {
    const { categories } = parseSummary(summary)
    setExpandedCategories(new Set(categories.map(cat => cat.title)))
  }

  const collapseAllCategories = () => {
    setExpandedCategories(new Set())
  }

  // NEUE DARSTELLUNG DER ZUSAMMENFASSUNG
  const renderSummary = (summaryText: string) => {
    const { intro, categories, recommendations } = parseSummary(summaryText)
    
    // Debug-Ausgabe
    console.log('=== RENDER SUMMARY DEBUG ===')
    console.log('Summary length:', summaryText.length)
    console.log('Parsed summary:', { intro: intro.length, categories: categories.length, recommendations: recommendations.length })
    console.log('Categories found:', categories.map(c => c.title))
    console.log('Expected categories:', [
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
    ])
    console.log('Missing categories:', [
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
    ].filter(expected => !categories.find(found => found.title === expected)))
    console.log('=== END RENDER DEBUG ===')
    
    // Fallback: Wenn keine Kategorien gefunden wurden, zeige den Text einfach an
    if (categories.length === 0) {
      console.log('⚠️ NO CATEGORIES FOUND - SHOWING FALLBACK')
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
        {/* Executive Summary */}
        {intro && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-6 rounded-xl shadow-sm">
                          <div className="flex items-center mb-3">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-lg font-semibold text-blue-900">Deine Zusammenfassung</span>
              </div>
            <div className="text-blue-900 leading-relaxed whitespace-pre-line">{intro}</div>
          </div>
        )}
        
        {/* Kategorien Header mit Controls */}
        {categories.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-lg font-semibold text-indigo-900">Systematische Analyse</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={expandAllCategories}
                  className="px-3 py-1 text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors"
                >
                  Alle öffnen
                </button>
                <button
                  onClick={collapseAllCategories}
                  className="px-3 py-1 text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors"
                >
                  Alle schließen
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Kategorien Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {categories.map(cat => {
            const color = getCategoryColor(cat.title)
            const isExpanded = expandedCategories.has(cat.title)
            
            return (
              <div key={cat.title} className={`border rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${color.bg} ${color.border} hover:shadow-md`}>
                <button
                  onClick={() => toggleCategory(cat.title)}
                  className="w-full p-5 text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${color.bg.replace('50', '100')}`}>
                        <div className={color.title}>
                          {getCategoryIcon(cat.title)}
                        </div>
                      </div>
                      <div>
                        <h3 className={`text-base font-bold ${color.title}`}>
                          {cat.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {isExpanded ? 'Klicken zum Schließen' : 'Klicken zum Öffnen'}
                        </p>
                      </div>
                    </div>
                    <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>
                
                {/* Expandable Content */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="px-5 pb-5">
                    <div className={`whitespace-pre-line leading-relaxed ${color.text} text-sm`}>
                      {cat.content}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Empfehlungen */}
        {recommendations && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 p-6 rounded-xl shadow-sm">
            <div className="flex items-center mb-3">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
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
      console.log('Starting print version generation...')
      
      // Speicherung erfolgt bereits automatisch beim Generieren der Zusammenfassung
      // Hier nur noch PDF-Download durchführen
      
      // Prüfe ob alle notwendigen Daten vorhanden sind
      if (!summary || summary.trim().length === 0) {
        alert('Keine Zusammenfassung verfügbar. Bitte generiere zuerst eine Zusammenfassung.')
        return
      }
      
      // Erstelle eine Druckversion der Zusammenfassungsseite
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        alert('Popup-Blocker verhindert das Öffnen des Druckfensters. Bitte erlauben Sie Popups für diese Seite.')
        return
      }
      
      // Erstelle den HTML-Inhalt für die Druckversion
      const { intro, categories, recommendations } = parseSummary(summary)
      const currentDate = new Date().toLocaleDateString('de-DE')
      const userName = roleContext ? `${roleContext.firstName} ${roleContext.lastName}` : 'Nicht angegeben'
      const department = roleContext?.workAreas.join(', ') || 'Nicht angegeben'
      
      // Alle Kategorien expandieren für die Druckversion
      const allExpandedCategories = new Set(categories.map(cat => cat.title))
      
      const printContent = `
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>OmniReflect - Zusammenfassung</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
              .no-print { display: none !important; }
              .page-break { page-break-before: always; }
              .avoid-break { page-break-inside: avoid; }
            }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          </style>
        </head>
        <body class="bg-white text-gray-900">
          <!-- Header -->
          <div class="flex justify-between items-center mb-8 pb-4 border-b-2 border-gray-200">
            <div class="text-2xl font-bold text-indigo-600">OmniReflect</div>
            <div class="text-right">
              <div class="text-sm text-gray-600">Zusammenfassung & PDF-Export</div>
              <div class="text-sm text-gray-600">Generiert am ${currentDate}</div>
            </div>
          </div>

          <!-- Benutzerinformationen -->
          <div class="bg-gray-50 p-4 mb-6 rounded-lg border border-gray-200">
            <h2 class="text-lg font-bold text-gray-800 mb-3">Teilnehmerinformationen</h2>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div><span class="font-semibold text-gray-700">Name:</span> <span class="text-gray-600">${userName}</span></div>
              <div><span class="font-semibold text-gray-700">Abteilung:</span> <span class="text-gray-600">${department}</span></div>
              <div><span class="font-semibold text-gray-700">Datum:</span> <span class="text-gray-600">${currentDate}</span></div>
            </div>
          </div>

          <!-- Deine Zusammenfassung -->
          ${intro ? `
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-6 rounded-xl mb-8">
              <div class="flex items-center mb-3">
                <div class="bg-blue-100 p-2 rounded-lg mr-3">
                  <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span class="text-lg font-semibold text-blue-900">Deine Zusammenfassung</span>
              </div>
              <div class="text-blue-900 leading-relaxed whitespace-pre-line">${intro}</div>
            </div>
          ` : ''}

          <!-- Systematische Analyse Header -->
          ${categories.length > 0 ? `
            <div class="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 mb-6">
              <div class="flex items-center justify-center">
                <div class="bg-indigo-100 p-2 rounded-lg mr-3">
                  <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span class="text-lg font-semibold text-indigo-900">Systematische Analyse</span>
              </div>
            </div>
          ` : ''}

          <!-- Kategorien Grid -->
          <div class="grid md:grid-cols-2 gap-6 mb-8">
            ${categories.map(cat => {
              const color = getCategoryColor(cat.title)
              const icon = getCategoryIcon(cat.title)
              return `
                <div class="border rounded-xl shadow-sm overflow-hidden ${color.bg} ${color.border} avoid-break">
                  <div class="p-5">
                    <div class="flex items-center space-x-3 mb-4">
                      <div class="p-2 rounded-lg ${color.bg.replace('50', '100')}">
                        <div class="${color.title}">
                          ${icon}
                        </div>
                      </div>
                      <div>
                        <h3 class="text-base font-bold ${color.title}">
                          ${cat.title}
                        </h3>
                      </div>
                    </div>
                    <div class="whitespace-pre-line leading-relaxed ${color.text} text-sm">
                      ${cat.content}
                    </div>
                  </div>
                </div>
              `
            }).join('')}
          </div>

          <!-- Empfehlungen -->
          ${recommendations ? `
            <div class="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 p-6 rounded-xl mb-8">
              <div class="flex items-center mb-3">
                <div class="bg-green-100 p-2 rounded-lg mr-3">
                  <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span class="text-lg font-semibold text-green-900">Empfehlungen für dein Mitarbeiterjahresgespräch</span>
              </div>
              <div class="text-green-900 leading-relaxed whitespace-pre-line">${recommendations}</div>
            </div>
          ` : ''}

          <!-- Fragen und Antworten -->
          ${storedQuestions && storedQuestions.length > 0 ? `
            <div class="page-break"></div>
            <h2 class="text-xl font-bold text-gray-800 mb-6">Fragen und Antworten</h2>
            ${storedQuestions.map((question, index) => {
              const answer = progress.answers[question.id]
              const followUps = progress.followUpQuestions[question.id] || []
              const questionText = question.question || question.text || 'Frage nicht verfügbar'
              
              return `
                <div class="bg-gray-50 p-4 mb-6 rounded-lg border border-gray-200 avoid-break">
                  <div class="flex justify-between items-center mb-3">
                    <span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">${question.category}</span>
                    <span class="text-gray-500 text-sm">Frage ${index + 1}</span>
                  </div>
                  <h3 class="font-bold text-gray-800 mb-3">${questionText}</h3>
                  ${answer ? `
                    <div class="mb-3">
                      <span class="font-semibold text-gray-700 text-sm">Antwort:</span>
                      <div class="bg-white p-3 rounded border mt-1 text-gray-700">${answer}</div>
                    </div>
                  ` : '<div class="text-gray-500 italic">Nicht beantwortet</div>'}
                  ${followUps.length > 0 ? `
                    <div class="bg-green-50 p-3 rounded border-l-4 border-green-400 mt-3">
                      <span class="font-semibold text-green-700 text-sm">Vertiefende Nachfragen:</span>
                      ${followUps.map((followUp, followUpIndex) => {
                        const followUpAnswer = progress.answers[`${question.id}_followup_${followUpIndex}`]
                        return `
                          <div class="mt-2">
                            <div class="font-medium text-green-700 text-sm">${followUp}</div>
                            ${followUpAnswer ? `<div class="text-green-600 italic text-sm mt-1">${followUpAnswer}</div>` : ''}
                          </div>
                        `
                      }).join('')}
                    </div>
                  ` : ''}
                </div>
              `
            }).join('')}
          ` : ''}

          <!-- Footer -->
          <div class="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            Diese Zusammenfassung wurde automatisch generiert.
          </div>

          <script>
            // Automatisch Druckdialog öffnen
            window.onload = function() {
          setTimeout(() => {
                window.print();
              }, 500);
            };
          </script>
        </body>
        </html>
      `
      
      printWindow.document.write(printContent)
      printWindow.document.close()
      
      console.log('Print version generated successfully')
      
    } catch (error) {
      console.error('Fehler beim Generieren der Druckversion:', error)
      alert('Fehler beim Generieren der Druckversion. Bitte versuchen Sie es erneut.')
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>Meine Zusammenfassung speichern</span>
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
              <span>Zurück zu den Fragen</span>
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
                  <span className="text-sm text-blue-800">Lade deine Zusammenfassung als PDF herunter</span>
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
            <div id="summary-root" className="space-y-8">
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