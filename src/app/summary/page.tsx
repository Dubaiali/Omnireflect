'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/state/sessionStore'
import PDFDownload from '@/components/PDFDownload'
import Link from 'next/link'

export default function SummaryPage() {
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
              <h1 className="text-2xl font-bold text-gray-900">
                Zusammenfassung & PDF-Export
              </h1>
              <p className="text-sm text-gray-600">
                Generiere eine KI-gestützte Zusammenfassung deiner Reflexion
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/role-context"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Rollenkontext bearbeiten
              </Link>
              <Link
                href="/questions"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Zurück zu Fragen
              </Link>
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
        <PDFDownload />
      </main>
    </div>
  )
} 