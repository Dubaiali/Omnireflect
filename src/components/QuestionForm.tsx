'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/state/sessionStore'
import { generateFollowUpQuestions, generatePersonalizedQuestions, Question } from '@/lib/gpt'

export default function QuestionForm() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([])
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false)
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({})
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true)
  
  const router = useRouter()
  const { 
    saveAnswer, 
    saveFollowUpQuestions, 
    progress, 
    roleContext,
    nextStep 
  } = useSessionStore()

  // Lade personalisierte Fragen beim ersten Laden
  useEffect(() => {
    const loadPersonalizedQuestions = async () => {
      setIsLoadingQuestions(true)
      try {
        const personalizedQuestions = await generatePersonalizedQuestions(roleContext || undefined)
        setQuestions(personalizedQuestions)
      } catch (error) {
        console.error('Fehler beim Laden der personalisierten Fragen:', error)
        // Fallback zu Standard-Fragen
        setQuestions([
          {
            id: 'role',
            question: 'Wie verstehst du deine aktuelle Rolle im Unternehmen und welche Verantwortlichkeiten sind dir besonders wichtig?',
            category: 'Rollenverständnis'
          },
          {
            id: 'achievements',
            question: 'Welche Erfolge und Leistungen machst du im vergangenen Jahr besonders stolz?',
            category: 'Leistungen'
          },
          {
            id: 'challenges',
            question: 'Mit welchen Herausforderungen hast du dich konfrontiert gesehen und wie hast du diese bewältigt?',
            category: 'Herausforderungen'
          },
          {
            id: 'development',
            question: 'In welchen Bereichen würdest du gerne wachsen und dich weiterentwickeln?',
            category: 'Entwicklung'
          },
          {
            id: 'feedback',
            question: 'Wie bewertest du die Qualität des Feedbacks, das du von Kolleg:innen und Vorgesetzten erhältst?',
            category: 'Feedback'
          },
          {
            id: 'collaboration',
            question: 'Wie erlebst du die Zusammenarbeit im Team und welche Verbesserungen würdest du dir wünschen?',
            category: 'Zusammenarbeit'
          },
          {
            id: 'goals',
            question: 'Welche konkreten Ziele hast du dir für das kommende Jahr gesetzt?',
            category: 'Ziele'
          },
          {
            id: 'support',
            question: 'Welche Art von Unterstützung oder Ressourcen würden dir helfen, deine Ziele zu erreichen?',
            category: 'Unterstützung'
          },
          {
            id: 'work_life',
            question: 'Wie zufrieden bist du mit deiner Work-Life-Balance und was könnte verbessert werden?',
            category: 'Work-Life-Balance'
          },
          {
            id: 'future',
            question: 'Wo siehst du dich in 3-5 Jahren und welche Schritte sind dafür notwendig?',
            category: 'Zukunftsperspektive'
          }
        ])
      } finally {
        setIsLoadingQuestions(false)
      }
    }

    loadPersonalizedQuestions()
  }, [roleContext])

  const currentQuestion = questions[currentQuestionIndex]

  useEffect(() => {
    if (!currentQuestion) return
    
    // Lade gespeicherte Antwort für aktuelle Frage
    const savedAnswer = progress.answers[currentQuestion.id]
    if (savedAnswer) {
      setCurrentAnswer(savedAnswer)
    }
    
    // Lade gespeicherte Follow-up-Fragen
    const savedFollowUps = progress.followUpQuestions[currentQuestion.id]
    if (savedFollowUps) {
      setFollowUpQuestions(savedFollowUps)
    }
  }, [currentQuestionIndex, currentQuestion, progress])

  const handleAnswerSubmit = async () => {
    if (!currentAnswer.trim() || !currentQuestion) return

    // Speichere Antwort
    saveAnswer(currentQuestion.id, currentAnswer)

    // Generiere Follow-up-Fragen mit Rollenkontext
    setIsGeneratingFollowUp(true)
    try {
      const followUps = await generateFollowUpQuestions(
        currentQuestion.question,
        currentAnswer,
        roleContext || undefined
      )
      setFollowUpQuestions(followUps)
      saveFollowUpQuestions(currentQuestion.id, followUps)
      setShowFollowUp(true)
    } catch (error) {
      console.error('Fehler bei Follow-up-Generierung:', error)
      setFollowUpQuestions([
        'Können Sie das noch etwas genauer erklären?',
        'Was bedeutet das für Ihre zukünftige Entwicklung?'
      ])
      setShowFollowUp(true)
    } finally {
      setIsGeneratingFollowUp(false)
    }
  }

  const handleFollowUpSubmit = () => {
    if (!currentQuestion) return
    
    // Speichere Follow-up-Antworten
    Object.entries(followUpAnswers).forEach(([question, answer]) => {
      if (answer.trim()) {
        saveAnswer(`${currentQuestion.id}_followup_${question}`, answer)
      }
    })

    // Nächste Frage oder Zusammenfassung
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setCurrentAnswer('')
      setFollowUpQuestions([])
      setShowFollowUp(false)
      setFollowUpAnswers({})
      nextStep()
    } else {
      // Alle Fragen beantwortet - zur Zusammenfassung
      router.push('/summary')
    }
  }

  if (isLoadingQuestions) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Personalisiere deine Reflexionsfragen
            </h3>
            <p className="text-gray-600 mb-4">
              Basierend auf deinem Rollenkontext werden maßgeschneiderte Fragen erstellt...
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="animate-pulse bg-blue-100 rounded-full h-3 w-3"></div>
              <div className="flex-1">
                <div className="text-sm text-gray-700 mb-1">Analysiere Rollenkontext...</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-1000" style={{ width: '30%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="animate-pulse bg-blue-100 rounded-full h-3 w-3"></div>
              <div className="flex-1">
                <div className="text-sm text-gray-700 mb-1">Generiere personalisierte Fragen...</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-1000" style={{ width: '70%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="animate-pulse bg-gray-300 rounded-full h-3 w-3"></div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">Bereite Fragenkatalog vor...</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gray-400 h-2 rounded-full transition-all duration-1000" style={{ width: '0%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600">Keine Fragen verfügbar.</p>
        </div>
      </div>
    )
  }

  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Fortschrittsanzeige */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            Frage {currentQuestionIndex + 1} von {questions.length}
          </span>
          <span className="text-sm text-gray-600">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Aktuelle Frage */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-4">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
            {currentQuestion.category}
          </span>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {currentQuestion.question}
        </h2>

        <textarea
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          className="w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Schreibe deine Antwort hier..."
        />

        <button
          onClick={handleAnswerSubmit}
          disabled={!currentAnswer.trim() || isGeneratingFollowUp}
          className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
        >
          {isGeneratingFollowUp ? 'Generiere Nachfragen...' : 'Antwort speichern'}
        </button>

        {/* Ladebalken für Follow-up-Generierung */}
        {isGeneratingFollowUp && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <div className="flex-1">
                <div className="text-sm text-blue-800 font-medium mb-1">
                  Generiere personalisierte Nachfragen...
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Basierend auf deiner Antwort und deinem Rollenkontext werden vertiefende Fragen erstellt.
            </p>
          </div>
        )}
      </div>

      {/* Follow-up-Fragen */}
      {showFollowUp && followUpQuestions.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4">
            Vertiefende Nachfragen:
          </h3>
          
          <div className="space-y-4">
            {followUpQuestions.map((question, index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-green-700 mb-2">
                  {question}
                </label>
                <textarea
                  value={followUpAnswers[index] || ''}
                  onChange={(e) => setFollowUpAnswers({
                    ...followUpAnswers,
                    [index]: e.target.value
                  })}
                  className="w-full h-20 p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Deine Antwort..."
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleFollowUpSubmit}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
          >
            {currentQuestionIndex < questions.length - 1 ? 'Nächste Frage' : 'Zur Zusammenfassung'}
          </button>
        </div>
      )}
    </div>
  )
} 