'use client'

import { useState, useEffect } from 'react'
import { getAdminOverview } from '@/lib/storage'
import { HashEntry } from '@/lib/types'
import HashIDManager from './HashIDManager'

// Hilfsfunktion: Zusammenfassung in Abschnitte parsen (aus PDFDownload.tsx kopiert)
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
  
  return { 
    intro: intro.trim(), 
    categories, 
    recommendations: recommendations.trim() 
  }
}

// Icon-Mapping für Kategorien (aus PDFDownload.tsx kopiert)
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

// Farb-Mapping für Kategorien (aus PDFDownload.tsx kopiert)
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

interface AdminTableData extends HashEntry {
  data?: {
    hashId: string
    answers: Record<string, string>
    followUpQuestions: Record<string, string[]>
    summary: string | null
    htmlContent?: string
    completedAt: string | null
    lastUpdated: string
    roleContext?: {
      firstName: string
      lastName: string
      workAreas: string[]
      functions: string[]
      experienceYears: string
      customerContact: string
      dailyTasks: string
    }
  }
}

export default function AdminTable() {
  const [data, setData] = useState<AdminTableData[]>([])
  const [selectedEntry, setSelectedEntry] = useState<AdminTableData | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showHashManager, setShowHashManager] = useState(false)

  const loadData = async () => {
    try {
      // Lade Hash-Liste von der API
      const hashResponse = await fetch('/api/hash-list')
      if (hashResponse.ok) {
        const hashData = await hashResponse.json()
        if (hashData.success && hashData.hashList) {
          // Lade auch die gespeicherten Zusammenfassungen
          const summariesResponse = await fetch('/api/hash-list/save-summary')
          let summaries: Record<string, any> = {}
          
          if (summariesResponse.ok) {
            const summariesData = await summariesResponse.json()
            if (summariesData.success && summariesData.summaries) {
              summaries = summariesData.summaries
            }
          }
          
          setData(hashData.hashList.map((entry: HashEntry) => {
            const summaryData = summaries[entry.hashId]
            return {
              ...entry,
              data: summaryData ? {
                hashId: entry.hashId,
                answers: summaryData.answers || {},
                followUpQuestions: summaryData.followUpQuestions || {},
                summary: summaryData.summary,
                htmlContent: summaryData.htmlContent,
                completedAt: summaryData.completedAt,
                lastUpdated: summaryData.completedAt,
                roleContext: summaryData.roleContext
              } : undefined
            }
          }))
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error)
      // Fallback: Verwende getAdminOverview
      const overview = getAdminOverview()
      setData(overview)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Abgeschlossen'
      case 'in_progress':
        return 'In Bearbeitung'
      case 'pending':
        return 'Ausstehend'
      default:
        return 'Unbekannt'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleViewDetails = (entry: AdminTableData) => {
    setSelectedEntry(entry)
    setShowDetails(true)
  }

  const [showSummary, setShowSummary] = useState(false)
  const [selectedSummary, setSelectedSummary] = useState<AdminTableData | null>(null)

  const handleViewSummary = (entry: AdminTableData) => {
    if (!entry.data?.summary) {
      alert('Keine Zusammenfassung verfügbar')
      return
    }
    setSelectedSummary(entry)
    setShowSummary(true)
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Statistik-Karten */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Gesamt</p>
              <p className="text-2xl font-semibold text-gray-900">{data.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Abgeschlossen</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.filter(entry => entry.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Bearbeitung</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.filter(entry => entry.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ausstehend</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.filter(entry => entry.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Übersicht aller Reflexionen
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={loadData}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Aktualisieren
              </button>
              <button
                onClick={() => setShowHashManager(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Hash-IDs verwalten
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hash-ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Abteilung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Letzter Zugriff
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((entry) => (
                <tr key={entry.hashId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="font-mono text-xs">
                      {entry.hashId}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {entry.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {entry.department || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(entry.status)}`}>
                      {getStatusText(entry.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(entry.lastAccess)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleViewDetails(entry)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Details
                    </button>
                    {entry.data?.summary && (
                      <button
                        onClick={() => handleViewSummary(entry)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Zusammenfassung
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedEntry && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Details für {selectedEntry.hashId}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mitarbeiterinformationen */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 border-b pb-2">Mitarbeiterprofil</h4>
                  
                  {selectedEntry.data?.roleContext ? (
                    <div className="space-y-3">
                      <div>
                        <strong>Name:</strong> {selectedEntry.data.roleContext.firstName} {selectedEntry.data.roleContext.lastName}
                      </div>
                      <div>
                        <strong>Funktion:</strong> {selectedEntry.data.roleContext.functions.join(', ')}
                      </div>
                      <div>
                        <strong>Arbeitsbereiche:</strong> 
                        <div className="mt-1">
                          {selectedEntry.data.roleContext.workAreas.map((area, index) => (
                            <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <strong>Erfahrungsjahre:</strong> {selectedEntry.data.roleContext.experienceYears}
                      </div>
                      <div>
                        <strong>Kundenkontakt:</strong> {selectedEntry.data.roleContext.customerContact}
                      </div>
                      {selectedEntry.data.roleContext.dailyTasks && (
                        <div>
                          <strong>Tägliche Aufgaben:</strong>
                          <p className="text-sm text-gray-600 mt-1">{selectedEntry.data.roleContext.dailyTasks}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500">Keine Profildaten verfügbar</div>
                  )}
                </div>

                {/* Dokumentinformationen */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 border-b pb-2">Dokumentstatus</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <strong>Hash-ID:</strong> {selectedEntry.hashId}
                    </div>
                    <div>
                      <strong>Status:</strong> {getStatusText(selectedEntry.status)}
                    </div>
                    <div>
                      <strong>Erstellt am:</strong> {formatDate(selectedEntry.data?.lastUpdated)}
                    </div>
                    <div>
                      <strong>Letzter Zugriff:</strong> {formatDate(selectedEntry.lastAccess)}
                    </div>
                    
                    {selectedEntry.data && (
                      <div>
                        <strong>Beantwortete Fragen:</strong> {Object.keys(selectedEntry.data.answers).length}
                      </div>
                    )}
                    
                    {selectedEntry.data?.summary && (
                      <div>
                        <strong>Zusammenfassung verfügbar:</strong> 
                        <span className="text-green-600 ml-1">Ja</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                {selectedEntry.data?.summary && (
                  <button
                    onClick={() => handleViewSummary(selectedEntry)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                  >
                    Zusammenfassung anzeigen
                  </button>
                )}
                <button
                  onClick={() => setShowDetails(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zusammenfassung Modal */}
      {showSummary && selectedSummary && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Zusammenfassung für {selectedSummary.data?.roleContext ? 
                    `${selectedSummary.data.roleContext.firstName} ${selectedSummary.data.roleContext.lastName}` : 
                    selectedSummary.hashId}
                </h3>
                <button
                  onClick={() => setShowSummary(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Mitarbeiterprofil */}
              {selectedSummary.data?.roleContext && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Mitarbeiterprofil
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><strong>Name:</strong> {selectedSummary.data.roleContext.firstName} {selectedSummary.data.roleContext.lastName}</div>
                    <div><strong>Funktion:</strong> {selectedSummary.data.roleContext.functions.join(', ')}</div>
                    <div><strong>Arbeitsbereiche:</strong> {selectedSummary.data.roleContext.workAreas.join(', ')}</div>
                    <div><strong>Erfahrung:</strong> {selectedSummary.data.roleContext.experienceYears}</div>
                    <div><strong>Kundenkontakt:</strong> {selectedSummary.data.roleContext.customerContact}</div>
                    {selectedSummary.data.roleContext.dailyTasks && (
                      <div className="md:col-span-2">
                        <strong>Tägliche Aufgaben:</strong>
                        <p className="text-gray-700 mt-1">{selectedSummary.data.roleContext.dailyTasks}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Exakte HTML-Ansicht der Zusammenfassung */}
              {selectedSummary.data?.htmlContent ? (
                <div className="space-y-8">
                  {/* Gespeichertes HTML anzeigen */}
                  <div 
                    className="summary-html-content"
                    dangerouslySetInnerHTML={{ __html: selectedSummary.data.htmlContent }}
                  />
                  
                  {/* Fragen und Antworten */}
                  {selectedSummary.data.answers && Object.keys(selectedSummary.data.answers).length > 0 && (
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-6 shadow-sm">
                      <div className="flex items-center mb-6">
                        <div className="bg-gray-100 p-2 rounded-lg mr-3">
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-lg font-semibold text-gray-900">Fragen und Antworten</span>
                      </div>
                      
                      <div className="space-y-6">
                        {Object.entries(selectedSummary.data.answers).map(([questionId, answer], index) => {
                          const followUps = selectedSummary.data.followUpQuestions?.[questionId] || []
                          
                          return (
                            <div key={questionId} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                              <div className="flex justify-between items-center mb-3">
                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                                  Frage {index + 1}
                                </span>
                                <span className="text-gray-500 text-sm">
                                  ID: {questionId}
                                </span>
                              </div>
                              
                              <div className="mb-3">
                                <span className="font-semibold text-gray-700 text-sm">Antwort:</span>
                                <div className="bg-gray-50 p-3 rounded border mt-1 text-gray-700 whitespace-pre-line">
                                  {answer}
                                </div>
                              </div>
                              
                              {followUps.length > 0 && (
                                <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                                  <span className="font-semibold text-green-700 text-sm">Vertiefende Nachfragen:</span>
                                  {followUps.map((followUp, followUpIndex) => {
                                    const followUpAnswer = selectedSummary.data.answers?.[`${questionId}_followup_${followUpIndex}`]
                                    return (
                                      <div key={followUpIndex} className="mt-2">
                                        <div className="font-medium text-green-700 text-sm">{followUp}</div>
                                        {followUpAnswer && (
                                          <div className="text-green-600 italic text-sm mt-1 bg-white p-2 rounded border">
                                            {followUpAnswer}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Fallback: Alte Darstellung wenn kein HTML gespeichert ist */
                <div className="space-y-8">
                  {(() => {
                    const { intro, categories, recommendations } = parseSummary(selectedSummary.data?.summary || '')
                    
                    // Fallback: Wenn keine Kategorien gefunden wurden, zeige den Text strukturiert an
                    if (categories.length === 0) {
                      return (
                        <div className="space-y-6">
                          {/* Einleitung */}
                          {intro && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-6 rounded-xl shadow-sm">
                              <div className="flex items-center mb-3">
                                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <span className="text-lg font-semibold text-blue-900">Einleitung</span>
                              </div>
                              <div className="text-blue-900 leading-relaxed whitespace-pre-line">{intro}</div>
                            </div>
                          )}
                          
                          {/* Systematische Analyse */}
                          {selectedSummary.data?.summary?.includes('Systematische Analyse:') && (
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 shadow-sm">
                              <div className="flex items-center mb-3">
                                <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                                <span className="text-lg font-semibold text-indigo-900">Systematische Analyse</span>
                              </div>
                              <div className="text-indigo-900 leading-relaxed whitespace-pre-line">
                                {selectedSummary.data.summary.split('Systematische Analyse:')[1]?.split('Empfehlungen')[0]?.trim() || ''}
                              </div>
                            </div>
                          )}
                          
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
                    
                    return (
                      <>
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
                        
                        {/* Systematische Analyse Header */}
                        {categories.length > 0 && (
                          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
                            <div className="flex items-center justify-center">
                              <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <span className="text-lg font-semibold text-indigo-900">Systematische Analyse</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Kategorien Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                          {categories.map(cat => {
                            const color = getCategoryColor(cat.title)
                            
                            return (
                              <div key={cat.title} className={`border rounded-xl shadow-sm overflow-hidden ${color.bg} ${color.border} hover:shadow-md`}>
                                <div className="p-5">
                                  <div className="flex items-center space-x-3 mb-3">
                                    <div className={`p-2 rounded-lg ${color.bg.replace('50', '100')}`}>
                                      <div className={color.title}>
                                        {getCategoryIcon(cat.title)}
                                      </div>
                                    </div>
                                    <div>
                                      <h3 className={`text-base font-bold ${color.title}`}>
                                        {cat.title}
                                      </h3>
                                    </div>
                                  </div>
                                  <div className={`whitespace-pre-line leading-relaxed ${color.text} text-sm`}>
                                    {cat.content}
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
                      </>
                    )
                  })()}
                </div>
              )}
              
              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
                <p>
                  Generiert am {formatDate(selectedSummary.data?.completedAt)} | 
                  Hash-ID: {selectedSummary.hashId}
                </p>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowSummary(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hash-ID Manager Modal */}
      <HashIDManager 
        isOpen={showHashManager} 
        onClose={() => setShowHashManager(false)} 
      />
    </div>
  )
} 