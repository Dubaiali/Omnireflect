'use client'

import { useState } from 'react'

export default function TestQuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const testRoleContexts = {
    max: {
      firstName: "Max",
      lastName: "Mustermann",
      workAreas: ["Softwareentwicklung"],
      functions: ["Entwickler"],
      experienceYears: "5 Jahre",
      customerContact: "Intern"
    },
    anna: {
      firstName: "Anna",
      lastName: "Schmidt",
      workAreas: ["Brillenberatung", "Kontaktlinse"],
      functions: ["Mitarbeiter"],
      experienceYears: "3–5 Jahre",
      customerContact: "Ja, täglich"
    },
    peter: {
      firstName: "Peter",
      lastName: "Weber",
      workAreas: ["Werkstatt"],
      functions: ["Fachverantwortlicher"],
      experienceYears: "länger als 10 Jahre",
      customerContact: "Teilweise / abhängig von Kundenfrequenz"
    }
  }

  const generateQuestions = async (roleContext: any) => {
    setLoading(true)
    setError('')
    setDebugInfo(null)
    
    try {
      console.log('DEBUG: Teste Fragen-Generierung mit:', roleContext)
      
      const response = await fetch('/api/gpt/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roleContext }),
      })

      const data = await response.json()
      
      setDebugInfo({
        status: response.status,
        statusText: response.statusText,
        data: data
      })

      if (response.ok) {
        setQuestions(data.questions || [])
        console.log('DEBUG: Fragen erfolgreich generiert:', data.questions?.length)
      } else {
        setError(data.error || 'Fehler bei der Fragen-Generierung')
        console.error('DEBUG: API-Fehler:', data.error)
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten: ' + (err as Error).message)
      console.error('DEBUG: Netzwerk-Fehler:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Test: Fragen-Generierung
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Object.entries(testRoleContexts).map(([name, context]) => (
            <div key={name} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 capitalize">{name}</h2>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto mb-4">
                {JSON.stringify(context, null, 2)}
              </pre>
              
              <button
                onClick={() => generateQuestions(context)}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
              >
                {loading ? 'Generiere Fragen...' : 'Fragen generieren'}
              </button>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <h3 className="text-red-800 font-semibold mb-2">Fehler:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {debugInfo && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <h3 className="text-yellow-800 font-semibold mb-2">Debug-Informationen:</h3>
            <pre className="text-sm text-yellow-700 overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        {questions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              ✅ Generierte Fragen ({questions.length})
            </h2>
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                      {index + 1}
                    </span>
                    <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded">
                      {question.category}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    {question.question}
                  </h3>
                  <p className="text-sm text-gray-600">
                    ID: {question.id}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 