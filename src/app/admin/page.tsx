'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminTable from '@/components/AdminTable'
import { adminCredentials } from '@/lib/hashList'
import Link from 'next/link'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (username === adminCredentials.username && password === adminCredentials.password) {
        setIsAuthenticated(true)
      } else {
        setError('Ungültige Anmeldedaten')
      }
    } catch (err) {
              setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUsername('')
    setPassword('')
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                OmniReflect Admin
              </h1>
              <p className="text-gray-600">
                Melde dich mit deinen Admin-Zugangsdaten an
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Benutzername
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="Admin-Benutzername"
                  required
                />
              </div>

              <div>
                <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Passwort
                </label>
                <input
                  id="adminPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="Admin-Passwort"
                  required
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
              >
                {isLoading ? 'Anmelden...' : 'Admin-Login'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Admin-Zugangsdaten:</h3>
              <div className="text-xs text-gray-600">
                <div>Benutzername: admin</div>
                <div>Passwort: admin123</div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link 
                href="/"
                className="text-gray-600 hover:text-gray-800 text-sm"
              >
                ← Zurück zur Startseite
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                OmniReflect Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Übersicht aller Mitarbeiter:innen-Reflexionen
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Admin abmelden
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <AdminTable />
      </main>
    </div>
  )
} 