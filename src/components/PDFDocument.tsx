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
  cardContent: {
    fontSize: 12,
    lineHeight: 1.5
  },
  blueContent: {
    color: '#1e40af'
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
  numberedItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start'
  },
  number: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginRight: 10,
    marginTop: 2
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start'
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8b5cf6',
    marginRight: 10,
    marginTop: 6
  },
  questionsSection: {
    marginTop: 30
  },
  questionCard: {
    padding: 15,
    marginBottom: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    border: '1px solid #e5e7eb'
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  category: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#3b82f6',
    backgroundColor: '#dbeafe',
    padding: '4px 8px',
    borderRadius: 4
  },
  questionNumber: {
    fontSize: 10,
    color: '#6b7280'
  },
  questionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
    lineHeight: 1.4
  },
  answerLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 5
  },
  answerText: {
    fontSize: 12,
    color: '#374151',
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 4,
    lineHeight: 1.5
  },
  followUpSection: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 4
  },
  followUpLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 5
  },
  followUpQuestion: {
    fontSize: 11,
    fontWeight: '500',
    color: '#166534',
    marginBottom: 5
  },
  followUpAnswer: {
    fontSize: 11,
    color: '#15803d',
    fontStyle: 'italic'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#6b7280',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 40,
    fontSize: 10,
    color: '#6b7280'
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

const formatSummarySections = (summary: string) => {
  // Neue Struktur basierend auf dem optimierten Summary-Prompt
  const sections = summary.split(/\n(?=Einleitung:|Systematische Analyse:|Stolz & persönliche Leistung:|Herausforderungen & Umgang mit Druck:|Verantwortung & Selbstorganisation:|Zusammenarbeit & Feedback:|Entwicklung & Lernen:|Energie & Belastung:|Kultur & Werte:|Entscheidungsspielräume & Freiheit:|Wertschätzung & Gesehenwerden:|Perspektive & Zukunft:|Verbesserungsvorschläge & Ideen:|Rollentausch & Führungsperspektive:|Empfehlungen für dein Mitarbeiterjahresgespräch:)/)
  
  return sections.map((section, index) => {
    const trimmedSection = section.trim()
    if (!trimmedSection) return null
    
    // Einleitung
    if (trimmedSection.includes('Einleitung:')) {
      return {
        type: 'einleitung',
        title: 'Einleitung & Überblick',
        content: trimmedSection.replace(/^Einleitung:/, '').trim(),
        color: 'blue'
      }
    }
    
    // Systematische Analyse - Überschrift
    if (trimmedSection.includes('Systematische Analyse:')) {
      return {
        type: 'analyse_header',
        title: 'Systematische Analyse',
        content: 'Detaillierte Betrachtung aller Reflexionsbereiche',
        color: 'indigo'
      }
    }
    
    // Stolz & persönliche Leistung
    if (trimmedSection.includes('Stolz & persönliche Leistung:')) {
      const content = trimmedSection.replace(/^Stolz & persönliche Leistung:/, '').trim()
      return {
        type: 'stolz',
        title: 'Stolz & persönliche Leistung',
        content: content || '- nicht zu reflektieren -',
        color: 'green'
      }
    }
    
    // Herausforderungen
    if (trimmedSection.includes('Herausforderungen & Umgang mit Druck:')) {
      const content = trimmedSection.replace(/^Herausforderungen & Umgang mit Druck:/, '').trim()
      return {
        type: 'herausforderungen',
        title: 'Herausforderungen & Umgang mit Druck',
        content: content || '- nicht zu reflektieren -',
        color: 'orange'
      }
    }
    
    // Verantwortung
    if (trimmedSection.includes('Verantwortung & Selbstorganisation:')) {
      const content = trimmedSection.replace(/^Verantwortung & Selbstorganisation:/, '').trim()
      return {
        type: 'verantwortung',
        title: 'Verantwortung & Selbstorganisation',
        content: content || '- nicht zu reflektieren -',
        color: 'purple'
      }
    }
    
    // Zusammenarbeit
    if (trimmedSection.includes('Zusammenarbeit & Feedback:')) {
      const content = trimmedSection.replace(/^Zusammenarbeit & Feedback:/, '').trim()
      return {
        type: 'zusammenarbeit',
        title: 'Zusammenarbeit & Feedback',
        content: content || '- nicht zu reflektieren -',
        color: 'blue'
      }
    }
    
    // Entwicklung
    if (trimmedSection.includes('Entwicklung & Lernen:')) {
      const content = trimmedSection.replace(/^Entwicklung & Lernen:/, '').trim()
      return {
        type: 'entwicklung',
        title: 'Entwicklung & Lernen',
        content: content || '- nicht zu reflektieren -',
        color: 'green'
      }
    }
    
    // Energie
    if (trimmedSection.includes('Energie & Belastung:')) {
      const content = trimmedSection.replace(/^Energie & Belastung:/, '').trim()
      return {
        type: 'energie',
        title: 'Energie & Belastung',
        content: content || '- nicht zu reflektieren -',
        color: 'orange'
      }
    }
    
    // Kultur & Werte
    if (trimmedSection.includes('Kultur & Werte:')) {
      const content = trimmedSection.replace(/^Kultur & Werte:/, '').trim()
      return {
        type: 'kultur',
        title: 'Kultur & Werte',
        content: content || '- nicht zu reflektieren -',
        color: 'purple'
      }
    }
    
    // Entscheidungsspielräume
    if (trimmedSection.includes('Entscheidungsspielräume & Freiheit:')) {
      const content = trimmedSection.replace(/^Entscheidungsspielräume & Freiheit:/, '').trim()
      return {
        type: 'entscheidungen',
        title: 'Entscheidungsspielräume & Freiheit',
        content: content || '- nicht zu reflektieren -',
        color: 'indigo'
      }
    }
    
    // Wertschätzung
    if (trimmedSection.includes('Wertschätzung & Gesehenwerden:')) {
      const content = trimmedSection.replace(/^Wertschätzung & Gesehenwerden:/, '').trim()
      return {
        type: 'wertschaetzung',
        title: 'Wertschätzung & Gesehenwerden',
        content: content || '- nicht zu reflektieren -',
        color: 'green'
      }
    }
    
    // Perspektive & Zukunft
    if (trimmedSection.includes('Perspektive & Zukunft:')) {
      const content = trimmedSection.replace(/^Perspektive & Zukunft:/, '').trim()
      return {
        type: 'perspektive',
        title: 'Perspektive & Zukunft',
        content: content || '- nicht zu reflektieren -',
        color: 'blue'
      }
    }
    
    // Verbesserungsvorschläge & Ideen
    if (trimmedSection.includes('Verbesserungsvorschläge & Ideen:')) {
      const content = trimmedSection.replace(/^Verbesserungsvorschläge & Ideen:/, '').trim()
      return {
        type: 'verbesserungen',
        title: 'Verbesserungsvorschläge & Ideen',
        content: content || '- nicht zu reflektieren -',
        color: 'indigo'
      }
    }
    
    // Rollentausch
    if (trimmedSection.includes('Rollentausch & Führungsperspektive:')) {
      const content = trimmedSection.replace(/^Rollentausch & Führungsperspektive:/, '').trim()
      return {
        type: 'rollentausch',
        title: 'Rollentausch & Führungsperspektive',
        content: content || '- nicht zu reflektieren -',
        color: 'purple'
      }
    }
    
    // Empfehlungen
    if (trimmedSection.includes('Empfehlungen für dein Mitarbeiterjahresgespräch:')) {
      const recommendations = trimmedSection
        .replace(/^Empfehlungen für dein Mitarbeiterjahresgespräch:/, '')
        .split(/\n(?=\d+\.|•)/)
        .filter(item => item.trim())
        .map(item => item.replace(/^(\d+\.|•)\s*/, '').trim())
        .filter(Boolean)
      
      return {
        type: 'empfehlungen',
        title: 'Empfehlungen für dein Mitarbeiterjahresgespräch',
        items: recommendations,
        color: 'green'
      }
    }
    
    return null
  }).filter(Boolean)
}

  const PDFDocument: React.FC<PDFDocumentProps> = ({ 
    summary, 
    questions, 
    answers, 
    followUpQuestions, 
    userName, 
    department 
  }) => {
  const summarySections = formatSummarySections(summary)
  const currentDate = new Date().toLocaleDateString('de-DE')
  
  // Debug-Logging
  console.log('PDFDocument - Questions:', questions.length)
  console.log('PDFDocument - Questions data:', questions)
  console.log('PDFDocument - Answers:', Object.keys(answers).length)
  console.log('PDFDocument - Answers data:', answers)
  console.log('PDFDocument - FollowUpQuestions:', Object.keys(followUpQuestions).length)
  
  // Gruppiere Fragen für bessere Seitenaufteilung (max. 3 Fragen pro Seite für bessere Lesbarkeit)
  const questionsPerPage = 3
  const questionPages = []
  for (let i = 0; i < questions.length; i += questionsPerPage) {
    questionPages.push(questions.slice(i, i + questionsPerPage))
  }

  return (
    <Document>
      {/* Erste Seite: Zusammenfassung */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>OmniReflect</Text>
          <View style={styles.headerInfo}>
            <Text style={styles.subtitle}>{userName}</Text>
            <Text style={styles.subtitle}>{department}</Text>
            <Text style={styles.subtitle}>{currentDate}</Text>
          </View>
        </View>
        
        <Text style={styles.title}>KI-Zusammenfassung</Text>
        <Text style={styles.subtitle}>Persönliche Entwicklung & Selbstreflexion</Text>
        
        {summarySections.map((section, index) => (
          section && (
            <View key={index} style={[styles.card, styles[`${section.color}Card` as keyof typeof styles]]}>
              <Text style={[styles.cardTitle, styles[`${section.color}Title` as keyof typeof styles]]}>
                {section.title}
              </Text>
              
              {section.type === 'einleitung' && (
                <Text style={[styles.cardContent, styles[`${section.color}Content` as keyof typeof styles]]}>
                  {section.content}
                </Text>
              )}
              
              {section.type === 'analyse_header' && (
                <Text style={[styles.cardContent, styles[`${section.color}Content` as keyof typeof styles]]}>
                  {section.content}
                </Text>
              )}
              
              {section.type === 'stolz' && (
                <Text style={[styles.cardContent, styles[`${section.color}Content` as keyof typeof styles]]}>
                  {section.content}
                </Text>
              )}
              
              {section.type === 'herausforderungen' && (
                <Text style={[styles.cardContent, styles[`${section.color}Content` as keyof typeof styles]]}>
                  {section.content}
                </Text>
              )}
              
              {section.type === 'verantwortung' && (
                <Text style={[styles.cardContent, styles[`${section.color}Content` as keyof typeof styles]]}>
                  {section.content}
                </Text>
              )}
              
              {section.type === 'zusammenarbeit' && (
                <Text style={[styles.cardContent, styles[`${section.color}Content` as keyof typeof styles]]}>
                  {section.content}
                </Text>
              )}
              
              {section.type === 'entwicklung' && (
                <Text style={[styles.cardContent, styles[`${section.color}Content` as keyof typeof styles]]}>
                  {section.content}
                </Text>
              )}
              
              {section.type === 'energie' && (
                <Text style={[styles.cardContent, styles[`${section.color}Content` as keyof typeof styles]]}>
                  {section.content}
                </Text>
              )}
              
              {section.type === 'kultur' && (
                <Text style={[styles.cardContent, styles[`${section.color}Content` as keyof typeof styles]]}>
                  {section.content}
                </Text>
              )}
              
              {section.type === 'entscheidungen' && (
                <Text style={[styles.cardContent, styles[`${section.color}Content` as keyof typeof styles]]}>
                  {section.content}
                </Text>
              )}
              
              {section.type === 'wertschaetzung' && (
                <Text style={[styles.cardContent, styles[`${section.color}Content` as keyof typeof styles]]}>
                  {section.content}
                </Text>
              )}
              
              {section.type === 'perspektive' && (
                <Text style={[styles.cardContent, styles[`${section.color}Content` as keyof typeof styles]]}>
                  {section.content}
                </Text>
              )}
              
              {section.type === 'verbesserungen' && (
                <Text style={[styles.cardContent, styles[`${section.color}Content` as keyof typeof styles]]}>
                  {section.content}
                </Text>
              )}
              
              {section.type === 'rollentausch' && (
                <Text style={[styles.cardContent, styles[`${section.color}Content` as keyof typeof styles]]}>
                  {section.content}
                </Text>
              )}
              
              {section.type === 'empfehlungen' && (
                <View>
                  {section.items.map((item, itemIndex) => (
                    <View key={itemIndex} style={styles.bulletItem}>
                      <View style={styles.bullet} />
                      <Text style={[styles.cardContent, styles[`${section.color}Content` as keyof typeof styles]]}>
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )
        ))}
        
        <View style={styles.footer}>
          <Text>Diese Zusammenfassung wurde automatisch generiert. Deine Daten werden nach 30 Tagen gelöscht.</Text>
        </View>
        
        <Text style={styles.pageNumber}>1</Text>
      </Page>
      
      {/* Weitere Seiten: Fragen und Antworten */}
      {questions.length > 0 && questionPages.map((pageQuestions, pageIndex) => (
        <Page key={pageIndex + 1} size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.logo}>OmniReflect</Text>
            <View style={styles.headerInfo}>
              <Text style={styles.subtitle}>{userName}</Text>
              <Text style={styles.subtitle}>{currentDate}</Text>
            </View>
          </View>
          
          <View style={styles.questionsSection}>
            <Text style={styles.sectionTitle}>Fragen und Antworten</Text>
            
            {pageQuestions.map((question, questionIndex) => {
              const answer = answers[question.id]
              const followUps = followUpQuestions[question.id] || []
              
              // Sicherheitsprüfung für question.question (korrekte Feldbezeichnung)
              const questionText = question.question || question.text || 'Frage nicht verfügbar'
              console.log(`Rendering question ${question.id}:`, questionText.substring(0, 50) + '...')
              console.log(`Answer for ${question.id}:`, answer ? (answer.substring ? answer.substring(0, 50) + '...' : 'Invalid answer format') : 'No answer')
              
              return (
                <View key={question.id} style={styles.questionCard}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.category}>{question.category}</Text>
                    <Text style={styles.questionNumber}>
                      Frage {pageIndex * questionsPerPage + questionIndex + 1}
                    </Text>
                  </View>
                  
                  <Text style={styles.questionText}>{questionText}</Text>
                  
                  {answer ? (
                    <View>
                      <Text style={styles.answerLabel}>Antwort:</Text>
                      <Text style={styles.answerText}>{typeof answer === 'string' ? answer : 'Antwort nicht verfügbar'}</Text>
                    </View>
                  ) : (
                    <Text style={styles.answerText}>Nicht beantwortet</Text>
                  )}
                  
                  {followUps.length > 0 && (
                    <View style={styles.followUpSection}>
                      <Text style={styles.followUpLabel}>Vertiefende Nachfragen:</Text>
                      {followUps.map((followUp, followUpIndex) => {
                        const followUpAnswer = answers[`${question.id}_followup_${followUpIndex}`]
                        return (
                          <View key={followUpIndex}>
                            <Text style={styles.followUpQuestion}>{followUp}</Text>
                            {followUpAnswer && (
                              <Text style={styles.followUpAnswer}>{followUpAnswer}</Text>
                            )}
                          </View>
                        )
                      })}
                    </View>
                  )}
                </View>
              )
            })}
          </View>
          
          <View style={styles.footer}>
            <Text>Diese Zusammenfassung wurde automatisch generiert. Deine Daten werden nach 30 Tagen gelöscht.</Text>
          </View>
          
          <Text style={styles.pageNumber}>{pageIndex + 2}</Text>
        </Page>
      ))}
    </Document>
  )
}

export default PDFDocument 