'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingTime, setLoadingTime] = useState(0)
  const [showResetWarning, setShowResetWarning] = useState(false)
 
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isOnline, setIsOnline] = useState(true)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const questionParam = searchParams.get('question')
  
  const { 
    saveAnswer, 
    saveFollowUpQuestions, 
    progress, 
    roleContext,
    questions: storedQuestions,
    saveQuestions,
    nextStep,
    isAuthenticated,
    hasRoleContextChanged,
    saveToStorage
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



  // Lade personalisierte Fragen beim ersten Laden
  const loadPersonalizedQuestions = async (isRetry = false, forceRegenerate = false) => {
    // Verhindere mehrfaches Laden während der Generierung
    if (isLoadingQuestions && !isRetry) {
      return
    }
    
    // Wenn wir von der Zusammenfassung zurückkommen, verwende die gespeicherten Fragen
    if (questionParam && storedQuestions && storedQuestions.length > 0) {
      setQuestions(storedQuestions)
      setIsLoadingQuestions(false)
      return
    }
    
    // Prüfe ob bereits Fragen im Store gespeichert sind (nur bei Retry oder Neugenerierung überspringen)
    if (storedQuestions && storedQuestions.length > 0 && !isRetry && !forceRegenerate) {
      setQuestions(storedQuestions)
      setIsLoadingQuestions(false)
      return
    }
    
    setIsLoadingQuestions(true)
    setHasError(false)
    setLoadingProgress(0)
    setLoadingTime(0)
    
    // Starte Progress-Animation
    const startTime = Date.now()
    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      setLoadingTime(Math.floor(elapsed))
      // Simuliere realistischen Fortschritt (0-90% in 8 Sekunden)
      const progress = Math.min(90, (elapsed / 8) * 90)
      setLoadingProgress(progress)
    }, 100)
    
    if (!isRetry) {
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
      
      // Beende Progress-Animation
      clearInterval(progressInterval)
      setLoadingProgress(100)
      
      setQuestions(personalizedQuestions)
      saveQuestions(personalizedQuestions) // Speichere Fragen im Store
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
      clearInterval(progressInterval)
      setIsLoadingQuestions(false)
    }
  }

  useEffect(() => {
    // Wenn Rollenkontext vorhanden ist und keine Fragen geladen sind, lade sie
    if (roleContext && questions.length === 0) {
      if (storedQuestions && storedQuestions.length > 0) {
        setQuestions(storedQuestions)
        setIsLoadingQuestions(false)
      } else if (!isLoadingQuestions) {
        loadPersonalizedQuestions()
      }
    }
  }, [roleContext, questions.length, storedQuestions, isLoadingQuestions])

  // Prüfe URL-Parameter für direkte Navigation zu einer spezifischen Frage
  // WICHTIG: Diese Logik wird NUR ausgeführt, wenn Fragen bereits geladen sind
  useEffect(() => {
    if (questions.length > 0 && questionParam && !isLoadingQuestions) {
      const targetQuestionIndex = parseInt(questionParam) - 1 // Frage 11 = Index 10
      if (targetQuestionIndex >= 0 && targetQuestionIndex < questions.length) {
        console.log(`DEBUG: Navigating to question ${questionParam} (index ${targetQuestionIndex})`)
        setCurrentQuestionIndex(targetQuestionIndex)
        // Entferne den URL-Parameter nach der Navigation
        router.replace('/questions')
      }
    }
  }, [questions.length, questionParam, router, isLoadingQuestions])

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
    } else {
      // Reset currentAnswer wenn keine gespeicherte Antwort vorhanden ist
      setCurrentAnswer('')
    }
    
    // Lade gespeicherte Follow-up-Fragen
    const savedFollowUps = progress.followUpQuestions[currentQuestion.id]
    if (savedFollowUps && savedFollowUps.length > 0) {
      setFollowUpQuestions(savedFollowUps)
      setShowFollowUp(true)
      
      // Lade gespeicherte Follow-up-Antworten
      const savedFollowUpAnswers: Record<string, string> = {}
      savedFollowUps.forEach((_, index) => {
        const followUpAnswer = progress.answers[`${currentQuestion.id}_followup_${index}`]
        if (followUpAnswer) {
          savedFollowUpAnswers[index] = followUpAnswer
        }
      })
      setFollowUpAnswers(savedFollowUpAnswers)
    } else {
      // Reset followUpQuestions wenn keine gespeicherten Follow-ups vorhanden sind
      setFollowUpQuestions([])
      setShowFollowUp(false)
      setFollowUpAnswers({})
    }
  }, [currentQuestionIndex, currentQuestion, progress])

  const handleAnswerSubmit = async () => {
    if (!currentAnswer.trim() || !currentQuestion) return

    // Speichere Antwort
    saveAnswer(currentQuestion.id, currentAnswer)
    saveToStorage()

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
    Object.entries(followUpAnswers).forEach(([index, answer]) => {
      if (answer.trim()) {
        saveAnswer(`${currentQuestion.id}_followup_${index}`, answer)
      }
    })
    saveToStorage()

    // Nächste Frage oder Zusammenfassung
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setCurrentAnswer('')
      // Follow-ups werden automatisch durch useEffect geladen
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
    // Follow-ups werden automatisch durch useEffect geladen
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
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Fortschritt</span>
                <span className="text-sm text-gray-600">{Math.round(loadingProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            </div>
            
            <p className="text-gray-600 text-lg mb-2">
              Ich erstelle deine persönlichen Fragen...
            </p>
            <p className="text-sm text-gray-500">
              {loadingTime > 0 ? `${loadingTime} Sekunden` : 'Starte...'}
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

  // Prüfe ob alle Fragen beantwortet wurden
  const allQuestionsAnswered = questions.every(question => isQuestionAnswered(question.id))
  
  // Zähle beantwortete Fragen
  const answeredQuestionsCount = questions.filter(question => isQuestionAnswered(question.id)).length
  const totalQuestionsCount = questions.length

  // Navigiere zu einer spezifischen Frage
  const navigateToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index)
      // Antwort und Follow-ups werden automatisch durch useEffect geladen
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Erweiterte Navigation */}
      <div className="mb-4 bg-white rounded-lg shadow-md p-3">
        <div className="flex items-center justify-center gap-1">
          {/* Überschrift */}
          <h3 className="text-sm font-semibold text-gray-800 mr-4">
            Mein Fortschritt
          </h3>
          
          {/* Rollenkontext Button */}
          <button
            onClick={() => {
              const answeredQuestions = Object.keys(progress.answers).length
              console.log('DEBUG: Rollenkontext Button geklickt!')
              console.log('DEBUG: answeredQuestions:', answeredQuestions)
              console.log('DEBUG: progress.answers:', progress.answers)
              
              if (answeredQuestions > 0) {
                console.log('DEBUG: Zeige Popup - setShowResetWarning(true)')
                setShowResetWarning(true)
              } else {
                console.log('DEBUG: Keine Antworten - navigiere direkt')
                router.push('/role-context?edit=true')
              }
            }}
            className="w-8 h-8 rounded-md text-xs font-medium transition-all duration-200 flex items-center justify-center bg-green-100 text-green-800 hover:bg-green-200"
            title={Object.keys(progress.answers).length > 0 ? "Rollenkontext bearbeiten (Achtung: Löscht alle Antworten)" : "Rollenkontext bearbeiten"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
          
          {/* Separator */}
          <div className="w-4 h-px bg-gray-300"></div>
          
          {/* Fragen Buttons */}
          {questions.map((question, index) => (
            <button
              key={question.id}
              onClick={() => navigateToQuestion(index)}
              className={`
                w-8 h-8 rounded-md text-xs font-medium transition-all duration-200 flex items-center justify-center
                ${currentQuestionIndex === index 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : isQuestionAnswered(question.id)
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
              title={`Frage ${index + 1}: ${question.category}`}
            >
              <div className="flex items-center justify-center">
                <span>{index + 1}</span>
                {isQuestionAnswered(question.id) && (
                  <svg className="w-2 h-2 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          ))}
          
          {/* Separator und Zusammenfassung Button */}
          {answeredQuestionsCount > 0 && (
            <>
              <div className="w-4 h-px bg-gray-300"></div>
              
              {/* Zusammenfassung Button */}
              <button
                onClick={() => allQuestionsAnswered && router.push('/summary')}
                disabled={!allQuestionsAnswered}
                className={`
                  w-8 h-8 rounded-md text-xs font-medium transition-all duration-200 flex items-center justify-center
                  ${allQuestionsAnswered 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer' 
                    : 'bg-orange-100 text-orange-800 cursor-not-allowed'
                  }
                `}
                title={allQuestionsAnswered 
                  ? "Zur Zusammenfassung (alle Fragen beantwortet)" 
                  : `Zur Zusammenfassung (${answeredQuestionsCount}/${totalQuestionsCount} Fragen beantwortet) - erst verfügbar wenn alle Fragen beantwortet sind`
                }
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </>
          )}
          
          {/* Legende */}
          <div className="flex items-center space-x-2 text-xs text-gray-500 ml-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-gray-100 rounded"></div>
              <span>offen</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-100 rounded"></div>
              <span>beantwortet</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded"></div>
              <span>aktuell</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fortschrittsanzeige */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
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

      {/* Navigation-Buttons */}
      <div className="flex justify-between items-center mb-4">
        {currentQuestionIndex > 0 && (
          <button
            onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Zurück</span>
          </button>
        )}
        
        {currentQuestionIndex === 0 && <div></div>} {/* Spacer für erste Frage */}
        
        {/* Weiter-Button nur anzeigen, wenn es nicht die letzte Frage ist */}
        {currentQuestionIndex < questions.length - 1 && (
          <button
            onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-200"
          >
            <span>Weiter</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
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
          <h3 className="text-md font-semibold text-green-800 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Vertiefende Nachfragen:
          </h3>
          
          <div className="space-y-3">
            {followUpQuestions.map((question, index) => {
              const hasAnswer = followUpAnswers[index] && followUpAnswers[index].trim().length > 0
              return (
                <div key={index}>
                  <label className="block text-sm font-medium text-green-700 mb-1 flex items-center">
                    {question}
                    {hasAnswer && (
                      <svg className="w-4 h-4 ml-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </label>
                  <textarea
                    value={followUpAnswers[index] || ''}
                    onChange={(e) => setFollowUpAnswers({
                      ...followUpAnswers,
                      [index]: e.target.value
                    })}
                    className={`w-full h-16 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      hasAnswer ? 'border-green-400 bg-green-50' : 'border-green-300'
                    }`}
                    placeholder="Deine Antwort..."
                  />
                </div>
              )
            })}
          </div>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={handleFollowUpSubmit}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
            >
              {currentQuestionIndex < questions.length - 1 ? 'Nächste Frage' : 'Zur Zusammenfassung'}
            </button>
            
            {/* Zeige Status der Follow-up-Antworten */}
            {Object.values(followUpAnswers).some(answer => answer.trim().length > 0) && (
              <span className="text-sm text-green-600 flex items-center space-x-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Nachfragen beantwortet</span>
              </span>
            )}
          </div>
        </div>
      )}

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
                  Prozess neu starten?
                </h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">
                Du hast bereits {Object.keys(progress.answers).length} Frage{Object.keys(progress.answers).length > 1 ? 'n' : ''} beantwortet.
              </p>
              <p className="text-sm text-gray-600 mb-3">
                Wenn du den Rollenkontext änderst, werden:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Alle deine Antworten gelöscht</li>
                <li>• Neue Fragen generiert</li>
                <li>• Der gesamte Prozess neu gestartet</li>
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
                  router.push('/role-context?edit=true')
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md transition duration-200"
              >
                Neu starten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 