import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// Verwende Standard-Schriftarten für bessere Kompatibilität
// @react-pdf/renderer unterstützt standardmäßig Helvetica, Times-Roman und Courier
// Wir verwenden Helvetica als primäre Schriftart

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: '2px solid #e5e7eb'
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1'
  },
  headerInfo: {
    textAlign: 'right'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 5
  },
  section: {
    marginBottom: 25
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 6
  },
  card: {
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    border: '1px solid #e5e7eb'
  },
  blueCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6'
  },
  greenCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981'
  },
  orangeCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b'
  },
  purpleCard: {
    backgroundColor: '#faf5ff',
    borderColor: '#8b5cf6'
  },
  indigoCard: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1'
  },
  emeraldCard: {
    backgroundColor: '#ecfdf5',
    borderColor: '#059669'
  },
  amberCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#d97706'
  },
  violetCard: {
    backgroundColor: '#f5f3ff',
    borderColor: '#7c3aed'
  },
  tealCard: {
    backgroundColor: '#f0fdfa',
    borderColor: '#0d9488'
  },
  skyCard: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0284c7'
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10
  },
  blueTitle: {
    color: '#1e40af'
  },
  greenTitle: {
    color: '#065f46'
  },
  orangeTitle: {
    color: '#92400e'
  },
  purpleTitle: {
    color: '#5b21b6'
  },
  indigoTitle: {
    color: '#3730a3'
  },
  emeraldTitle: {
    color: '#064e3b'
  },
  amberTitle: {
    color: '#78350f'
  },
  violetTitle: {
    color: '#4c1d95'
  },
  tealTitle: {
    color: '#134e4a'
  },
  skyTitle: {
    color: '#0c4a6e'
  },
  cardContent: {
    fontSize: 12,
    lineHeight: 1.5,
    color: '#374151'
  },
  blueContent: {
    color: '#1e3a8a'
  },
  greenContent: {
    color: '#065f46'
  },
  orangeContent: {
    color: '#92400e'
  },
  purpleContent: {
    color: '#5b21b6'
  },
  indigoContent: {
    color: '#3730a3'
  },
  emeraldContent: {
    color: '#064e3b'
  },
  amberContent: {
    color: '#78350f'
  },
  violetContent: {
    color: '#4c1d95'
  },
  tealContent: {
    color: '#134e4a'
  },
  skyContent: {
    color: '#0c4a6e'
  },
  executiveSummary: {
    backgroundColor: '#eff6ff',
    borderLeft: '4px solid #3b82f6',
    padding: 15,
    marginBottom: 20,
    borderRadius: 8
  },
  executiveSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10
  },
  executiveSummaryContent: {
    fontSize: 12,
    lineHeight: 1.5,
    color: '#1e3a8a'
  },
  recommendations: {
    backgroundColor: '#f0fdf4',
    borderLeft: '4px solid #10b981',
    padding: 15,
    marginBottom: 20,
    borderRadius: 8
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 10
  },
  recommendationsContent: {
    fontSize: 12,
    lineHeight: 1.5,
    color: '#065f46'
  },
  analysisHeader: {
    backgroundColor: '#eef2ff',
    border: '1px solid #6366f1',
    padding: 10,
    marginBottom: 15,
    borderRadius: 8,
    textAlign: 'center'
  },
  analysisHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3730a3'
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  gridItem: {
    width: '48%',
    marginBottom: 15
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: '1px solid #e5e7eb',
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center'
  }
})

interface PDFDocumentProps {
  summary: string
  questions: Array<{
    id: string
    question: string
    category: string
  }>
  answers: Record<string, string>
  followUpQuestions: Record<string, string[]>
  roleContext: {
    firstName: string
    lastName: string
    workAreas: string[]
  } | null
  userName: string
  department: string
}

// Verwende die gleiche parseSummary Funktion wie in PDFDownload.tsx
const parseSummary = (summary: string) => {
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

// Farb-Mapping für Kategorien (wie in PDFDownload.tsx)
const getCategoryColor = (title: string) => {
  const colorMap: { [key: string]: { card: string, title: string, content: string } } = {
    'Stolz & persönliche Leistung': {
      card: 'greenCard',
      title: 'greenTitle',
      content: 'greenContent'
    },
    'Herausforderungen & Umgang mit Druck': {
      card: 'orangeCard',
      title: 'orangeTitle',
      content: 'orangeContent'
    },
    'Verantwortung & Selbstorganisation': {
      card: 'purpleCard',
      title: 'purpleTitle',
      content: 'purpleContent'
    },
    'Zusammenarbeit & Feedback': {
      card: 'blueCard',
      title: 'blueTitle',
      content: 'blueContent'
    },
    'Entwicklung & Lernen': {
      card: 'emeraldCard',
      title: 'emeraldTitle',
      content: 'emeraldContent'
    },
    'Energie & Belastung': {
      card: 'amberCard',
      title: 'amberTitle',
      content: 'amberContent'
    },
    'Kultur & Werte': {
      card: 'violetCard',
      title: 'violetTitle',
      content: 'violetContent'
    },
    'Entscheidungsspielräume & Freiheit': {
      card: 'indigoCard',
      title: 'indigoTitle',
      content: 'indigoContent'
    },
    'Wertschätzung & Gesehenwerden': {
      card: 'tealCard',
      title: 'tealTitle',
      content: 'tealContent'
    },
    'Perspektive & Zukunft': {
      card: 'skyCard',
      title: 'skyTitle',
      content: 'skyContent'
    },
    'Verbesserungsvorschläge & Ideen': {
      card: 'indigoCard',
      title: 'indigoTitle',
      content: 'indigoContent'
    },
    'Rollentausch & Führungsperspektive': {
      card: 'purpleCard',
      title: 'purpleTitle',
      content: 'purpleContent'
    }
  }
  return colorMap[title] || {
    card: 'card',
    title: 'cardTitle',
    content: 'cardContent'
  }
}

const PDFDocument: React.FC<PDFDocumentProps> = ({ 
  summary, 
  questions, 
  answers, 
  followUpQuestions, 
  userName, 
  department 
}) => {
  const { intro, categories, recommendations } = parseSummary(summary)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>OmniReflect</Text>
          <View style={styles.headerInfo}>
            <Text style={styles.subtitle}>Zusammenfassung & PDF-Export</Text>
            <Text style={styles.subtitle}>Generiert am {new Date().toLocaleDateString('de-DE')}</Text>
          </View>
        </View>

        {/* Executive Summary */}
        {intro && (
          <View style={styles.executiveSummary}>
            <Text style={styles.executiveSummaryTitle}>Executive Summary</Text>
            <Text style={styles.executiveSummaryContent}>{intro}</Text>
          </View>
        )}

        {/* Systematische Analyse Header */}
        {categories.length > 0 && (
          <View style={styles.analysisHeader}>
            <Text style={styles.analysisHeaderTitle}>Systematische Analyse</Text>
          </View>
        )}

        {/* Kategorien Grid */}
        <View style={styles.gridContainer}>
          {categories.map((cat, index) => {
            const color = getCategoryColor(cat.title)
            return (
              <View key={index} style={[styles.gridItem, styles[color.card as keyof typeof styles]]}>
                <Text style={[styles.cardTitle, styles[color.title as keyof typeof styles]]}>
                  {cat.title}
                </Text>
                <Text style={[styles.cardContent, styles[color.content as keyof typeof styles]]}>
                  {cat.content}
                </Text>
              </View>
            )
          })}
        </View>

        {/* Empfehlungen */}
        {recommendations && (
          <View style={styles.recommendations}>
            <Text style={styles.recommendationsTitle}>Empfehlungen für dein Mitarbeiterjahresgespräch</Text>
            <Text style={styles.recommendationsContent}>{recommendations}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Diese Zusammenfassung wurde automatisch generiert. Deine Daten werden nach 30 Tagen gelöscht.</Text>
        </View>
      </Page>
    </Document>
  )
}

export default PDFDocument 