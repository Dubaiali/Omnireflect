'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/state/sessionStore'
import Link from 'next/link'

export default function WelcomePage() {
  const { isAuthenticated, logout } = useSessionStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <button
                onClick={() => {
                  logout()
                  router.push('/')
                }}
                className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
              >
                OmniReflect
              </button>
              <p className="text-sm text-gray-600">
                Willkommen bei deiner persönlichen Reflexion
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Willkommen bei OmniReflect! 👋
              </h1>
              <p className="text-lg text-gray-600">
                Dein persönlicher Begleiter für das Mitarbeiterjahresgespräch
              </p>
            </div>

            <div className="space-y-6 text-gray-700">
              <div className="bg-blue-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-blue-900 mb-3">
                  Was erwartet dich hier?
                </h2>
                <p className="text-blue-800">
                  OmniReflect hilft dir dabei, dich optimal auf dein Mitarbeiterjahresgespräch vorzubereiten. 
                  Durch eine strukturierte Reflexion deiner Rolle, Erfahrungen und Ziele wirst du Klarheit gewinnen 
                  und das Gespräch produktiv gestalten können.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">1. Rollenkontext</h3>
                  <p className="text-sm text-gray-600">
                    Teile uns deine Rolle, Erfahrung und Aufgaben mit, damit wir die Fragen optimal auf dich abstimmen können.
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🤔</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">2. Persönliche Reflexion</h3>
                  <p className="text-sm text-gray-600">
                    Beantworte 11 maßgeschneiderte Fragen zu deiner Rolle, Leistung, Herausforderungen und Zukunft.
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📋</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">3. Zusammenfassung</h3>
                  <p className="text-sm text-gray-600">
                    Erhalte eine strukturierte Zusammenfassung deiner Reflexion als Grundlage für das Gespräch.
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                  💡 Tipp für eine erfolgreiche Reflexion
                </h3>
                <p className="text-yellow-800">
                  Nimm dir Zeit für jede Frage und sei ehrlich mit dir selbst. Es gibt keine richtigen oder falschen Antworten - 
                  es geht darum, deine Perspektive zu reflektieren und Klarheit zu gewinnen. 
                  Du kannst jederzeit zu den Fragen zurückkehren und deine Antworten anpassen.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  🔒 Deine Daten sind sicher
                </h3>
                <p className="text-gray-700">
                  Alle deine Antworten werden nur lokal in deinem Browser gespeichert und sind nur für dich sichtbar. 
                  Die KI-generierten Fragen und Zusammenfassungen werden nicht dauerhaft gespeichert.
                </p>
              </div>
            </div>

            <div className="text-center mt-8">
              <Link
                href="/role-context"
                className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-lg transition duration-200 shadow-lg hover:shadow-xl"
              >
                <span className="mr-2">🚀</span>
                Jetzt starten
                <span className="ml-2">→</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 