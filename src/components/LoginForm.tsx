'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/state/sessionStore'

export default function LoginForm() {
  const [hashId, setHashId] = useState('')
  const [password, setPassword] = useState('')
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
        // Immer zur Role-Context-Seite navigieren
        router.push('/role-context')
      } else {
        setError(data.error || 'Ungültige Hash-ID oder Passwort')
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
            placeholder="z.B. abc123"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Passwort
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Dein Passwort"
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
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
        >
          {isLoading ? 'Anmelden...' : 'Anmelden'}
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Datenschutz & Sicherheit</h3>
        <p className="text-sm text-blue-700">
          Deine Daten werden anonymisiert gespeichert und sind nur dir und deiner Führungskraft zugänglich.
        </p>
      </div>
    </div>
  )
} 