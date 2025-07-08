'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/state/sessionStore'
import QuestionForm from '@/components/QuestionForm'
import Link from 'next/link'

export default function QuestionsPage() {
  const { isAuthenticated, logout, roleContext } = useSessionStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    } else if (!roleContext) {
      // Wenn Rollenkontext nicht ausgefüllt ist, zum Rollenkontext-Formular weiterleiten
      router.push('/role-context')
    }
  }, [isAuthenticated, roleContext, router])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (!isAuthenticated || !roleContext) {
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
                Beantworte die Fragen zur Vorbereitung deines Mitarbeiterjahresgesprächs
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
      <main className="py-8">
        <QuestionForm />
      </main>
    </div>
  )
} 