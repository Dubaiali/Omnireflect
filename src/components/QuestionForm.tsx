'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/state/sessionStore'
import { generateFollowUpQuestions } from '@/lib/gpt'

const questions = [
  {
    id: 'role',
    question: 'Was machst du in deinem Job am liebsten?',
    category: 'Arbeit'
  },
  {
    id: 'achievements',
    question: 'Worauf bist du im letzten Jahr besonders stolz?',
    category: 'Erfolge'
  },
  {
    id: 'challenges',
    question: 'Was war für dich schwierig und wie hast du es gelöst?',
    category: 'Herausforderungen'
  },
  {
    id: 'development',
    question: 'Was möchtest du noch lernen oder besser können?',
    category: 'Entwicklung'
  },
  {
    id: 'feedback',
    question: 'Wie findest du das Feedback von deinem Chef und Kollegen?',
    category: 'Feedback'
  },
  {
    id: 'collaboration',
    question: 'Wie läuft die Zusammenarbeit mit deinen Kollegen?',
    category: 'Team'
  },
  {
    id: 'goals',
    question: 'Was möchtest du im nächsten Jahr erreichen?',
    category: 'Ziele'
  },
  {
    id: 'support',
    question: 'Was brauchst du, um deine Ziele zu erreichen?',
    category: 'Unterstützung'
  },
  {
    id: 'work_life',
    question: 'Wie zufrieden bist du mit deiner Work-Life-Balance?',
    category: 'Work-Life-Balance'
  },
  {
    id: 'future',
    question: 'Wo siehst du dich in 3-5 Jahren?',
    category: 'Zukunft'
  }
]

export default function QuestionForm() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([])
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false)
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({})
  
  const router = useRouter()
  const { 
    saveAnswer, 
    saveFollowUpQuestions, 
    progress, 
    nextStep 
  } = useSessionStore()

  const currentQuestion = questions[currentQuestionIndex]

  useEffect(() => {
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
  }, [currentQuestionIndex, currentQuestion.id, progress])

  const handleAnswerSubmit = async () => {
    if (!currentAnswer.trim()) return

    // Speichere Antwort
    saveAnswer(currentQuestion.id, currentAnswer)

    // Prüfe, ob die Antwort ausreichend detailliert ist
    const isDetailed = currentAnswer.length > 50 // Mindestens 50 Zeichen
    
    if (isDetailed) {
      // Generiere Follow-up-Fragen nur bei detaillierten Antworten
      setIsGeneratingFollowUp(true)
      try {
        const followUps = await generateFollowUpQuestions(
          currentQuestion.question,
          currentAnswer
        )
        setFollowUpQuestions(followUps)
        saveFollowUpQuestions(currentQuestion.id, followUps)
        setShowFollowUp(true)
      } catch (error) {
        console.error('Fehler bei Follow-up-Generierung:', error)
        setFollowUpQuestions([
          'Kannst du das noch etwas genauer erklären?',
          'Was bedeutet das für dich?'
        ])
        setShowFollowUp(true)
      } finally {
        setIsGeneratingFollowUp(false)
      }
    } else {
      // Bei kurzen Antworten direkt zur nächsten Frage
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        setCurrentAnswer('')
        nextStep()
      } else {
        // Alle Fragen beantwortet - zur Zusammenfassung
        router.push('/summary')
      }
    }
  }

  const handleFollowUpSubmit = () => {
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