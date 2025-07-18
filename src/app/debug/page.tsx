'use client'

import { useEffect, useState } from 'react'
import { useSessionStore } from '@/state/sessionStore'

export default function DebugPage() {
  const [mounted, setMounted] = useState(false)
  const sessionStore = useSessionStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>Loading...</div>
  }

  const debugInfo = {
    hashId: sessionStore.hashId,
    isAuthenticated: sessionStore.isAuthenticated,
    roleContext: sessionStore.roleContext,
    questions: sessionStore.questions,
    isGeneratingQuestions: sessionStore.isGeneratingQuestions,
    progress: sessionStore.progress
  }

  const resetEverything = () => {
    sessionStore.clearQuestionsAndProgress()
    sessionStore.logout()
    window.location.reload()
  }

  const setTestRoleContext = () => {
    const testContext = {
      firstName: "Max",
      lastName: "Mustermann",
      workAreas: ["Softwareentwicklung"],
      functions: ["Entwickler"],
      experienceYears: "5 Jahre",
      customerContact: "Intern",
      dailyTasks: "Programmierung und Code-Reviews"
    }
    sessionStore.saveRoleContext(testContext)
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🐛 Debug: Session Store
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Aktionen</h2>
            <div className="space-y-3">
              <button
                onClick={resetEverything}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
              >
                Alles zurücksetzen
              </button>
              <button
                onClick={setTestRoleContext}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
              >
                Test-Rollenkontext setzen
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Status</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Authentifiziert:</span>
                <span className={sessionStore.isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                  {sessionStore.isAuthenticated ? 'Ja' : 'Nein'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Hash ID:</span>
                <span className="font-mono">{sessionStore.hashId || 'Keine'}</span>
              </div>
              <div className="flex justify-between">
                <span>Rollenkontext:</span>
                <span className={sessionStore.roleContext ? 'text-green-600' : 'text-red-600'}>
                  {sessionStore.roleContext ? 'Gesetzt' : 'Nicht gesetzt'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Fragen:</span>
                <span className="font-mono">{sessionStore.questions?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Generierung läuft:</span>
                <span className={sessionStore.isGeneratingQuestions ? 'text-yellow-600' : 'text-gray-600'}>
                  {sessionStore.isGeneratingQuestions ? 'Ja' : 'Nein'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Vollständige Debug-Informationen</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Navigation</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/login"
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200 text-center"
            >
              Login
            </a>
            <a
              href="/role-context"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200 text-center"
            >
              Rollenkontext
            </a>
            <a
              href="/questions"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200 text-center"
            >
              Fragen
            </a>
            <a
              href="/test-questions"
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200 text-center"
            >
              Test
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 