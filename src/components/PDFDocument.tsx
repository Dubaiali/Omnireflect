import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Registriere eine moderne Schriftart
Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
})

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Inter'
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
  questions: any[]
  answers: Record<string, string>
  followUpQuestions: Record<string, string[]>
  roleContext: any
  userName: string
  department: string
}

const formatSummarySections = (summary: string) => {
  const sections = summary.split(/\n(?=\d+\.|KERNAUSSAGEN:|PRIORITÄTSANALYSE:|ENTWICKLUNGSBEREICHE:|HANDLUNGSEMPFEHLUNGEN:|Einleitung:|Systematische Analyse:|Empfehlungen für dein Mitarbeiterjahresgespräch:|FÜHRUNGSPERSPEKTIVE & VERBESSERUNGSVORSCHLÄGE:)/)
  
  return sections.map((section, index) => {
    const trimmedSection = section.trim()
    if (!trimmedSection) return null
    
    if (trimmedSection.includes('KERNAUSSAGEN:') || trimmedSection.includes('Einleitung:')) {
      return {
        type: 'kernaussagen',
        title: 'Kernaussagen',
        content: trimmedSection.replace(/^(KERNAUSSAGEN:|Einleitung:)/, '').trim(),
        color: 'blue'
      }
    }
    
    if (trimmedSection.includes('FÜHRUNGSPERSPEKTIVE & VERBESSERUNGSVORSCHLÄGE:') || trimmedSection.includes('Führungsperspektive & Verbesserungsvorschläge:')) {
      return {
        type: 'fuehrungsperspektive',
        title: 'Führungsperspektive & Verbesserungsvorschläge',
        content: trimmedSection.replace(/^(FÜHRUNGSPERSPEKTIVE & VERBESSERUNGSVORSCHLÄGE:|Führungsperspektive & Verbesserungsvorschläge:)/, '').trim(),
        color: 'indigo'
      }
    }
    
    if (trimmedSection.includes('PRIORITÄTSANALYSE:') || trimmedSection.includes('Systematische Analyse:')) {
      const items = trimmedSection
        .replace(/^(PRIORITÄTSANALYSE:|Systematische Analyse:)/, '')
        .split(/\n(?=\d+\.)/)
        .filter(item => item.trim())
        .map(item => {
          const match = item.match(/^(\d+)\.\s*(.+)/)
          return match ? { number: match[1], content: match[2].trim() } : null
        })
        .filter(Boolean)
      
      return {
        type: 'prioritaetsanalyse',
        title: 'Prioritätsanalyse',
        items,
        color: 'green'
      }
    }
    
    if (trimmedSection.includes('ENTWICKLUNGSBEREICHE:')) {
      return {
        type: 'entwicklungsbereiche',
        title: 'Entwicklungsbereiche',
        content: trimmedSection.replace(/^ENTWICKLUNGSBEREICHE:/, '').trim(),
        color: 'orange'
      }
    }
    
    if (trimmedSection.includes('HANDLUNGSEMPFEHLUNGEN:') || trimmedSection.includes('Empfehlungen für dein Mitarbeiterjahresgespräch:')) {
      const recommendations = trimmedSection
        .replace(/^(HANDLUNGSEMPFEHLUNGEN:|Empfehlungen für dein Mitarbeiterjahresgespräch:)/, '')
        .split(/\n(?=\d+\.|•)/)
        .filter(item => item.trim())
        .map(item => item.replace(/^(\d+\.|•)\s*/, '').trim())
        .filter(Boolean)
      
      return {
        type: 'handlungsempfehlungen',
        title: 'Handlungsempfehlungen',
        items: recommendations,
        color: 'purple'
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
  roleContext, 
  userName, 
  department 
}) => {
  const summarySections = formatSummarySections(summary)
  const currentDate = new Date().toLocaleDateString('de-DE')
  
  // Gruppiere Fragen für bessere Seitenaufteilung (max. 4 Fragen pro Seite)
  const questionsPerPage = 4
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
        <Text style={styles.subtitle}>Strukturierte Selbstreflexion</Text>
        
        {summarySections.map((section, index) => (
          <View key={index} style={[styles.card, styles[`${section.color}Card`]]}>
            <Text style={[styles.cardTitle, styles[`${section.color}Title`]]}>
              {section.title}
            </Text>
            
            {section.type === 'kernaussagen' && (
              <Text style={[styles.cardContent, styles[`${section.color}Content`]]}>
                {section.content}
              </Text>
            )}
            
            {section.type === 'fuehrungsperspektive' && (
              <Text style={[styles.cardContent, styles[`${section.color}Content`]]}>
                {section.content}
              </Text>
            )}
            
            {section.type === 'prioritaetsanalyse' && (
              <View>
                {section.items.map((item, itemIndex) => (
                  <View key={itemIndex} style={styles.numberedItem}>
                    <View style={styles.number}>
                      <Text>{item.number}</Text>
                    </View>
                    <Text style={[styles.cardContent, styles[`${section.color}Content`]]}>
                      {item.content}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            
            {section.type === 'entwicklungsbereiche' && (
              <Text style={[styles.cardContent, styles[`${section.color}Content`]]}>
                {section.content}
              </Text>
            )}
            
            {section.type === 'handlungsempfehlungen' && (
              <View>
                {section.items.map((item, itemIndex) => (
                  <View key={itemIndex} style={styles.bulletItem}>
                    <View style={styles.bullet} />
                    <Text style={[styles.cardContent, styles[`${section.color}Content`]]}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
        
        <View style={styles.footer}>
          <Text>Diese Zusammenfassung wurde automatisch generiert. Deine Daten werden nach 30 Tagen gelöscht.</Text>
        </View>
        
        <Text style={styles.pageNumber}>1</Text>
      </Page>
      
      {/* Weitere Seiten: Fragen und Antworten */}
      {questionPages.map((pageQuestions, pageIndex) => (
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
              
              return (
                <View key={question.id} style={styles.questionCard}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.category}>{question.category}</Text>
                    <Text style={styles.questionNumber}>
                      Frage {pageIndex * questionsPerPage + questionIndex + 1}
                    </Text>
                  </View>
                  
                  <Text style={styles.questionText}>{question.question}</Text>
                  
                  {answer ? (
                    <View>
                      <Text style={styles.answerLabel}>Antwort:</Text>
                      <Text style={styles.answerText}>{answer}</Text>
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