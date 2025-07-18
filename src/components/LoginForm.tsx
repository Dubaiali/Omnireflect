'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/state/sessionStore'

export default function LoginForm() {
  const [hashId, setHashId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const login = useSessionStore(state => state.login)
  const resetProgress = useSessionStore(state => state.resetProgress)
  const router = useRouter()

  // Formulareingaben beim Laden der Komponente löschen
  useEffect(() => {
    setHashId('')
    setPassword('')
    setError('')
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hashId, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Alle vorherigen Daten zurücksetzen
        resetProgress()
        // Login durchführen
        login(hashId)
        // Zur Welcome-Seite navigieren
        router.push('/welcome')
      } else {
        setError(data.error || 'Ungültige Hash-ID oder Passwort')
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleTestLogin = async (testUser: 'max' | 'anna') => {
    setError('')
    setIsLoading(true)

    const testCredentials = {
      max: {
        hashId: 'emp_md87yj1f_904c447c80694dc5',
        password: 'Tvr39RN%Jg$7'
      },
      anna: {
        hashId: 'emp_md87yj1i_495fdbe7c5212ef9',
        password: 'A#7^So8gUV03'
      }
    }

    const credentials = testCredentials[testUser]

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Alle vorherigen Daten zurücksetzen
        resetProgress()
        // Login durchführen
        login(credentials.hashId)
        // Zur Welcome-Seite navigieren
        router.push('/welcome')
      } else {
        setError(data.error || 'Test-Login fehlgeschlagen')
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="hashId" className="block text-sm font-medium text-gray-700 mb-2">
            Hash-ID
          </label>
          <input
            id="hashId"
            type="text"
            value={hashId}
            onChange={(e) => setHashId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Deine persönliche Hash-ID"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Passwort
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Dein persönliches Passwort"
              required
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
        >
          {isLoading ? 'Anmelden...' : 'Anmelden'}
        </button>
      </form>

      {/* Test-Login-Buttons */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-3 text-sm">🧪 Test-Login (Entwicklung)</h3>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleTestLogin('max')}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2 px-4 rounded-md transition duration-200 text-sm"
          >
            {isLoading ? 'Anmelden...' : '👨‍💻 Max Mustermann (IT) - Test-Login'}
          </button>
          <button
            type="button"
            onClick={() => handleTestLogin('anna')}
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-2 px-4 rounded-md transition duration-200 text-sm"
          >
            {isLoading ? 'Anmelden...' : '👩‍💼 Anna Schmidt (Marketing) - Test-Login'}
          </button>
        </div>
        <p className="text-xs text-yellow-700 mt-2">
          Diese Buttons sind nur für Entwicklungs- und Testzwecke gedacht.
        </p>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">Datenschutz & Sicherheit</h3>
        <p className="text-sm text-gray-700">
          Deine Daten werden anonymisiert gespeichert und sind nur dir und deiner Führungskraft zugänglich.
        </p>
      </div>
    </div>
  )
} 