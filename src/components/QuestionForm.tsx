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
  const [countdown, setCountdown] = useState(30) // 30 Sekunden Countdown
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isOnline, setIsOnline] = useState(true)
  
  const router = useRouter()
  const { 
    saveAnswer, 
    saveFollowUpQuestions, 
    progress, 
    roleContext,
    nextStep,
    isAuthenticated
  } = useSessionStore()

  // Internetverbindungsprüfung
  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    checkOnlineStatus()
    window.addEventListener('online', checkOnlineStatus)
    window.addEventListener('offline', checkOnlineStatus)

    return () => {
      window.removeEventListener('online', checkOnlineStatus)
      window.removeEventListener('offline', checkOnlineStatus)
    }
  }, [])

  // Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isLoadingQuestions && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isLoadingQuestions, countdown])

  // Lade personalisierte Fragen beim ersten Laden
  const loadPersonalizedQuestions = async (isRetry = false) => {
    // Verhindere mehrfaches Laden, wenn bereits Fragen vorhanden sind
    if (questions.length > 0 && !isRetry) {
      return
    }
    
    setIsLoadingQuestions(true)
    setHasError(false)
    if (!isRetry) {
      setCountdown(30) // Reset countdown nur beim ersten Versuch
      setRetryCount(0)
    }
    
    // Validierung: Prüfe ob roleContext vollständig ist
    if (!roleContext || !roleContext.workAreas || !roleContext.functions || 
        !roleContext.experienceYears || !roleContext.customerContact) {
      console.error('DEBUG: roleContext ist unvollständig:', roleContext)
      setHasError(true)
      setQuestions([])
      setIsLoadingQuestions(false)
      router.push('/role-context')
      return
    }
    
    // Validierung: Prüfe ob functions Array nicht leer ist
    if (!roleContext.functions || roleContext.functions.length === 0) {
      console.error('DEBUG: functions Array ist leer:', roleContext.functions)
      setHasError(true)
      setQuestions([])
      setIsLoadingQuestions(false)
      router.push('/role-context')
      return
    }
    
    try {
      const personalizedQuestions = await generatePersonalizedQuestions(roleContext)
      setQuestions(personalizedQuestions)
      setHasError(false)
      
      // Reset alle Formularfelder bei Neugenerierung
      setCurrentQuestionIndex(0)
      setCurrentAnswer('')
      setFollowUpQuestions([])
      setFollowUpAnswers({})
      setShowFollowUp(false)
    } catch (error) {
      console.error('Fehler beim Laden der personalisierten Fragen:', error)
      
      // Wenn der Fehler mit dem Rollenkontext zusammenhängt, zur Role-Context-Seite weiterleiten
      if (error instanceof Error && error.message.includes('Rollenkontext')) {
        router.push('/role-context')
        return
      }
      
      // Spezifische Behandlung von Rate Limit Fehlern
      if (error instanceof Error && error.message.includes('Rate limit')) {
        setHasError(true)
        setQuestions([])
        // Automatischer Retry nach 30 Sekunden bei Rate Limit
        setTimeout(() => {
          if (retryCount < 3) {
            handleRetry()
          }
        }, 30000)
        return
      }
      
      setHasError(true)
      setQuestions([])
    } finally {
      setIsLoadingQuestions(false)
    }
  }

  useEffect(() => {
    // Nur beim ersten Laden oder wenn keine Fragen vorhanden sind
    if (questions.length === 0) {
      loadPersonalizedQuestions()
    }
  }, []) // Entferne roleContext aus den Dependencies

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    loadPersonalizedQuestions(true)
  }

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
      // Keine Fallback-Fragen mehr - direkt zur nächsten Frage
      setShowFollowUp(false)
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        setCurrentAnswer('')
        setFollowUpQuestions([])
        setFollowUpAnswers({})
        nextStep()
      } else {
        router.push('/summary')
      }
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

  const handleSkipToSummary = () => {
    // Speichere aktuelle Antwort falls vorhanden
    if (currentAnswer.trim() && currentQuestion) {
      saveAnswer(currentQuestion.id, currentAnswer)
    }
    
    // Springe direkt zur letzten Frage
    setCurrentQuestionIndex(questions.length - 1)
    setCurrentAnswer('')
    setFollowUpQuestions([])
    setShowFollowUp(false)
    setFollowUpAnswers({})
  }

  if (isLoadingQuestions) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              <span className="text-3xl">🤖</span> Ich erstelle jetzt deine persönlichen Vorbereitungsfragen <span className="text-3xl">🤖</span>
            </h3>
            <p className="text-gray-600 text-lg">
              Noch {countdown} Sekunden...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (hasError && !isLoadingQuestions) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Fehler beim Laden der Fragen
          </h3>
          
          <div className="flex items-center justify-center space-x-2 mb-4">
            {isOnline ? (
              <>
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
                <span className="text-sm text-green-600">Internetverbindung verfügbar</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
                </svg>
                <span className="text-sm text-red-600">Keine Internetverbindung</span>
              </>
            )}
          </div>
          
          <p className="text-gray-600 mb-4">
            {isOnline 
              ? (hasError && retryCount > 0 && retryCount < 3 
                  ? "Rate limit überschritten. Automatischer Retry in 30 Sekunden..."
                  : "Es konnte keine Verbindung zum Server hergestellt werden. Bitte versuche es erneut.")
              : "Bitte stelle sicher, dass du mit dem Internet verbunden bist."
            }
          </p>
          
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mb-4">
              Versuch {retryCount} fehlgeschlagen
            </p>
          )}
          
          <div className="space-x-4">
            <button
              onClick={handleRetry}
              disabled={!isOnline}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
            >
              Erneut versuchen
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
            >
              Seite neu laden
            </button>
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

  // Prüfe ob eine Frage bereits beantwortet wurde
  const isQuestionAnswered = (questionId: string) => {
    return progress.answers[questionId] && progress.answers[questionId].trim().length > 0
  }

  // Navigiere zu einer spezifischen Frage
  const navigateToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index)
      // Antwort wird automatisch durch useEffect geladen
      setFollowUpQuestions([])
      setShowFollowUp(false)
      setFollowUpAnswers({})
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Fragen-Übersicht */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Fragen-Übersicht
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {questions.map((question, index) => (
            <button
              key={question.id}
              onClick={() => navigateToQuestion(index)}
              className={`
                p-2 rounded-md text-xs font-medium transition-all duration-200
                ${currentQuestionIndex === index 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : isQuestionAnswered(question.id)
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
              title={`Frage ${index + 1}: ${question.category}`}
            >
              <div className="flex items-center justify-center space-x-1">
                <span>{index + 1}</span>
                {isQuestionAnswered(question.id) && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-500 flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-100 rounded"></div>
            <span>Nicht beantwortet</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-100 rounded"></div>
            <span>Beantwortet</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span>Aktuell</span>
          </div>
        </div>
      </div>

      {/* Fortschrittsanzeige */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">
            Frage {currentQuestionIndex + 1} von {questions.length}
          </span>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">
              {Math.round(progressPercentage)}%
            </span>
            {currentQuestionIndex < questions.length - 1 && (
              <button
                onClick={handleSkipToSummary}
                className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded-md transition duration-200"
                title="Direkt zur letzten Frage springen"
              >
                ⏭️ Zur Zusammenfassung
              </button>
            )}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Navigation-Buttons */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
          disabled={currentQuestionIndex === 0}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium rounded-md transition duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Zurück</span>
        </button>
        
        <button
          onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
          disabled={currentQuestionIndex === questions.length - 1}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition duration-200"
        >
          <span>Weiter</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Aktuelle Frage */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="mb-2">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
            {currentQuestion.category}
          </span>
        </div>
        
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          {currentQuestion.question}
        </h2>

        <textarea
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          className="w-full h-16 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Schreibe deine Antwort hier..."
        />

        <div className="flex justify-between items-center mt-4">
          <button
            onClick={handleAnswerSubmit}
            disabled={!currentAnswer.trim() || isGeneratingFollowUp}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
          >
            {isGeneratingFollowUp ? 'Generiere Nachfragen...' : 'Antwort speichern'}
          </button>
          
          {isQuestionAnswered(currentQuestion.id) && (
            <span className="text-sm text-green-600 flex items-center space-x-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Antwort gespeichert</span>
            </span>
          )}
        </div>

        {/* Ladebalken für Follow-up-Generierung */}
        {isGeneratingFollowUp && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <div className="flex-1">
                <div className="text-sm text-blue-800 font-medium mb-1">
                  Generiere personalisierte Nachfragen...
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Basierend auf deiner Antwort und deinem Rollenkontext werden vertiefende Fragen erstellt.
            </p>
          </div>
        )}
      </div>

      {/* Follow-up-Fragen */}
      {showFollowUp && followUpQuestions.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <h3 className="text-md font-semibold text-green-800 mb-3">
            Vertiefende Nachfragen:
          </h3>
          
          <div className="space-y-3">
            {followUpQuestions.map((question, index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  {question}
                </label>
                <textarea
                  value={followUpAnswers[index] || ''}
                  onChange={(e) => setFollowUpAnswers({
                    ...followUpAnswers,
                    [index]: e.target.value
                  })}
                  className="w-full h-16 p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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