'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSessionStore } from '@/state/sessionStore'
import RoleContextForm from '@/components/RoleContextForm'
import Link from 'next/link'

function RoleContextContent() {
  const { isAuthenticated, roleContext, logout } = useSessionStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditing = searchParams.get('edit') === 'true'

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  // Zeige die Komponente wenn authentifiziert
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
                {isEditing ? 'Bearbeite dein Profil' : 'Definiere dein Profil für personalisierte Reflexionsfragen'}
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
        <RoleContextForm isEditing={isEditing} />
      </main>
    </div>
  )
}

export default function RoleContextPage() {
  return (
    <Suspense fallback={<div>Laden...</div>}>
      <RoleContextContent />
    </Suspense>
  )
} 