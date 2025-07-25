'use client'

import { useState, useEffect } from 'react'
import { HashEntry } from '@/lib/types'

interface HashIDManagerProps {
  isOpen: boolean
  onClose: () => void
}

export default function HashIDManager({ isOpen, onClose }: HashIDManagerProps) {
  const [hashEntries, setHashEntries] = useState<HashEntry[]>([])
  const [newEntry, setNewEntry] = useState({
    hashId: '',
    password: '',
    name: '',
    department: '',
    role: 'employee' as 'employee' | 'admin'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [bulkCount, setBulkCount] = useState(10)
  const [bulkRole, setBulkRole] = useState<'employee' | 'admin'>('employee')
  const [showBulkGenerator, setShowBulkGenerator] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [generatedCredentials, setGeneratedCredentials] = useState<Array<{hashId: string, password: string}>>([])
  const [showGeneratedCredentials, setShowGeneratedCredentials] = useState(false)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [selectedHashId, setSelectedHashId] = useState<string>('')
  const [resetPassword, setResetPassword] = useState<string>('')
  const [adminCredentials, setAdminCredentials] = useState<Array<{username: string, name?: string, isDefault?: boolean}>>([])
  const [showAdminManager, setShowAdminManager] = useState(false)
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    password: '',
    name: ''
  })

  useEffect(() => {
    if (isOpen) {
      loadHashEntries()
      loadAdminCredentials()
    }
  }, [isOpen])

  const loadHashEntries = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/hash-list')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.hashList) {
          setHashEntries(data.hashList)
        } else {
          console.error('Ungültiges Format der Hash-Liste')
        }
      } else {
        console.error('Fehler beim Laden der Hash-Liste')
      }
    } catch (error) {
      console.error('Fehler beim Laden der Hash-Liste:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveHashEntries = async (entries: HashEntry[]) => {
    try {
      // Speichere lokal als Backup
      localStorage.setItem('hash-list', JSON.stringify(entries))
      setHashEntries(entries)
      
      // Aktualisiere die Server-seitige Hash-Liste
      await fetch('/api/hash-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entries),
      })
    } catch (error) {
      console.error('Fehler beim Speichern:', error)
    }
  }

  const generateHashId = (role: 'employee' | 'admin' = 'employee') => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    const prefix = role === 'admin' ? 'admin' : 'emp'
    return `${prefix}_${timestamp}_${random}`
  }

  const generateAdminUsername = () => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 6)
    return `admin_${timestamp}_${random}`
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const handleAddEntry = async () => {
    if (!newEntry.hashId || !newEntry.password) {
      alert('Hash-ID und Passwort sind erforderlich!')
      return
    }

    // Prüfe ob Hash-ID bereits existiert
    if (hashEntries.find(entry => entry.hashId === newEntry.hashId)) {
      alert('Diese Hash-ID existiert bereits!')
      return
    }

    try {
      // Erstelle Hash-ID über die API
      const response = await fetch('/api/hash-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hashId: newEntry.hashId,
          plainPassword: newEntry.password,
          name: newEntry.name || undefined,
          department: newEntry.department || undefined,
          status: 'pending'
        }),
      })

      if (response.ok) {
        // Lade die aktualisierte Liste
        await loadHashEntries()
        
            // Reset form
    setNewEntry({
      hashId: '',
      password: '',
      name: '',
      department: '',
      role: 'employee'
    })

        alert('Hash-ID erfolgreich erstellt!')
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error || 'Unbekannter Fehler'}`)
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Hash-ID:', error)
      alert('Fehler beim Erstellen der Hash-ID')
    }
  }

  const handleDeleteEntry = async (hashId: string) => {
    if (confirm(`Möchtest du die Hash-ID "${hashId}" wirklich löschen?`)) {
      const updatedEntries = hashEntries.filter(entry => entry.hashId !== hashId)
      await saveHashEntries(updatedEntries)
    }
  }

  const handleResetPassword = async (hashId: string) => {
    setSelectedHashId(hashId)
    setResetPassword(generatePassword())
    setShowPasswordReset(true)
  }

  const confirmPasswordReset = async () => {
    try {
      const response = await fetch('/api/hash-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hashId: selectedHashId,
          plainPassword: resetPassword,
          name: hashEntries.find(e => e.hashId === selectedHashId)?.name,
          department: hashEntries.find(e => e.hashId === selectedHashId)?.department,
          status: hashEntries.find(e => e.hashId === selectedHashId)?.status || 'pending'
        }),
      })

      if (response.ok) {
        // Lade die aktualisierte Liste
        await loadHashEntries()
        
        // Zeige die neuen Zugangsdaten an
        setGeneratedCredentials([{ hashId: selectedHashId, password: resetPassword }])
        setShowGeneratedCredentials(true)
        setShowPasswordReset(false)
        
        // Reset der Formular-Felder
        setSelectedHashId('')
        setResetPassword('')
        
        alert(`Passwort für ${selectedHashId} wurde erfolgreich gespeichert!`)
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error || 'Unbekannter Fehler'}`)
      }
    } catch (error) {
      console.error('Fehler beim Zurücksetzen des Passworts:', error)
      alert('Fehler beim Zurücksetzen des Passworts')
    }
  }

  const handleAutoGenerate = () => {
    setNewEntry({
      hashId: generateHashId(newEntry.role),
      password: generatePassword(),
      name: '',
      department: '',
      role: newEntry.role
    })
  }

  const handleAutoGenerateAdmin = () => {
    setNewAdmin({
      username: generateAdminUsername(),
      password: generatePassword(),
      name: ''
    })
  }

  const handleBulkGenerate = async () => {
    if (bulkCount < 1 || bulkCount > 100) {
      alert('Bitte wähle eine Anzahl zwischen 1 und 100')
      return
    }

    try {
      let successCount = 0
      const newCredentials: Array<{hashId: string, password: string}> = []
      
      for (let i = 0; i < bulkCount; i++) {
        const hashId = generateHashId(bulkRole)
        const password = generatePassword()
        
        const response = await fetch('/api/hash-list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            hashId,
            plainPassword: password,
            name: undefined,
            department: undefined,
            status: 'pending'
          }),
        })

        if (response.ok) {
          successCount++
          newCredentials.push({ hashId, password })
        }
      }

      // Lade die aktualisierte Liste
      await loadHashEntries()
      
      // Zeige die generierten Zugangsdaten an
      setGeneratedCredentials(newCredentials)
      setShowGeneratedCredentials(true)
      
      alert(`${successCount} von ${bulkCount} Hash-IDs wurden erfolgreich erstellt! Die Zugangsdaten werden angezeigt.`)
    } catch (error) {
      console.error('Fehler bei der Bulk-Generierung:', error)
      alert('Fehler bei der Bulk-Generierung')
    }
  }

  const exportHashList = () => {
    const dataStr = JSON.stringify(hashEntries, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'hash-list.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportCSV = () => {
    // CSV-Header
    const csvHeader = 'Hash-ID,Passwort,Name,Abteilung,Status\n'
    
    // CSV-Daten
    const csvData = hashEntries.map(entry => 
      `"${entry.hashId}","${entry.password}","${entry.name || ''}","${entry.department || ''}","${entry.status}"`
    ).join('\n')
    
    const csvContent = csvHeader + csvData
    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'mitarbeiter-zugangsdaten.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportGeneratedCredentials = () => {
    if (generatedCredentials.length === 0) return
    
    // CSV-Header
    const csvHeader = 'Hash-ID,Passwort\n'
    
    // CSV-Daten
    const csvData = generatedCredentials.map(cred => 
      `"${cred.hashId}","${cred.password}"`
    ).join('\n')
    
    const csvContent = csvHeader + csvData
    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `generierte-zugangsdaten-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const testLogin = async (hashId: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hashId, password }),
      })
      
      if (response.ok) {
        return true
      } else {
        return false
      }
    } catch (error) {
      return false
    }
  }

  // Admin-Verwaltung
  const loadAdminCredentials = async () => {
    try {
      const response = await fetch('/api/admin-credentials')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.admins) {
          setAdminCredentials(data.admins)
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Admin-Credentials:', error)
    }
  }

  const handleAddAdmin = async () => {
    if (!newAdmin.username || !newAdmin.password) {
      alert('Username und Passwort sind erforderlich!')
      return
    }

    try {
      const response = await fetch('/api/admin-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: newAdmin.username,
          plainPassword: newAdmin.password,
          name: newAdmin.name || newAdmin.username
        }),
      })

      if (response.ok) {
        await loadAdminCredentials()
        setNewAdmin({ username: '', password: '', name: '' })
        alert('Admin erfolgreich hinzugefügt!')
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error || 'Unbekannter Fehler'}`)
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Admins:', error)
      alert('Fehler beim Hinzufügen des Admins')
    }
  }

  const handleDeleteAdmin = async (username: string) => {
    if (confirm(`Möchtest du den Admin "${username}" wirklich löschen?`)) {
      try {
        const response = await fetch(`/api/admin-credentials?username=${username}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await loadAdminCredentials()
          alert('Admin erfolgreich gelöscht!')
        } else {
          const error = await response.json()
          alert(`Fehler: ${error.error || 'Unbekannter Fehler'}`)
        }
      } catch (error) {
        console.error('Fehler beim Löschen des Admins:', error)
        alert('Fehler beim Löschen des Admins')
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Zugangsverwaltung
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setShowAdminManager(false)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                !showAdminManager
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👥 Mitarbeiter
            </button>
            <button
              onClick={() => setShowAdminManager(true)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                showAdminManager
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔐 Administratoren
            </button>
          </nav>
        </div>

        {/* Neue Hash-ID hinzufügen */}
        {!showAdminManager && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-800 mb-4">Neuen Mitarbeiter-Zugang erstellen</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hash-ID *
              </label>
              <input
                type="text"
                value={newEntry.hashId}
                onChange={(e) => setNewEntry(prev => ({ ...prev, hashId: e.target.value }))}
                placeholder={newEntry.role === 'admin' ? "z.B. admin_mitarbeiter1" : "z.B. emp_mitarbeiter1"}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rolle *
              </label>
              <select
                value={newEntry.role}
                onChange={(e) => setNewEntry(prev => ({ 
                  ...prev, 
                  role: e.target.value as 'employee' | 'admin',
                  hashId: e.target.value === 'admin' ? newEntry.hashId.replace('emp_', 'admin_') : newEntry.hashId.replace('admin_', 'emp_')
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="employee">👥 Mitarbeiter</option>
                <option value="admin">🔐 Administrator</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passwort *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newEntry.password}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Sicheres Passwort"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name (optional)
              </label>
              <input
                type="text"
                value={newEntry.name}
                onChange={(e) => setNewEntry(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Max Mustermann"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Abteilung (optional)
              </label>
              <input
                type="text"
                value={newEntry.department}
                onChange={(e) => setNewEntry(prev => ({ ...prev, department: e.target.value }))}
                placeholder="IT, Marketing, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleAutoGenerate}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Auto-generieren
            </button>
            <button
              onClick={() => setShowBulkGenerator(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Bulk-Generieren
            </button>
            <button
              onClick={handleAddEntry}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Hinzufügen
            </button>
          </div>
        </div>
        )}

        {/* Hash-Liste anzeigen */}
        {!showAdminManager && (
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h4 className="font-semibold text-gray-800">Aktuelle Mitarbeiter-Zugänge</h4>
            <div className="flex space-x-2">
              <button
                onClick={loadHashEntries}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
              >
                Aktualisieren
              </button>
              <button
                onClick={exportCSV}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
              >
                CSV Export
              </button>
              <button
                onClick={exportHashList}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
              >
                JSON Export
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Lade Zugänge...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hash-ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abteilung</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {hashEntries.map((entry) => (
                    <tr key={entry.hashId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {entry.hashId}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {entry.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {entry.department || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          entry.status === 'completed' ? 'bg-green-100 text-green-800' :
                          entry.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {entry.status === 'completed' ? 'Abgeschlossen' :
                           entry.status === 'in_progress' ? 'In Bearbeitung' : 'Ausstehend'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm space-x-2">
                        <button
                          onClick={() => handleResetPassword(entry.hashId)}
                          className="text-blue-600 hover:text-blue-900 mr-2"
                          title="Passwort zurücksetzen"
                        >
                          🔄 Passwort
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.hashId)}
                          className="text-red-600 hover:text-red-900"
                          title="Hash-ID löschen"
                        >
                          Löschen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}

        {/* Admin-Verwaltung */}
        {showAdminManager && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-800 mb-4">Neuen Administrator hinzufügen</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                value={newAdmin.username}
                onChange={(e) => setNewAdmin(prev => ({ ...prev, username: e.target.value }))}
                placeholder="admin_username"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passwort *
              </label>
              <div className="relative">
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Sicheres Passwort"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showAdminPassword ? (
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name (optional)
              </label>
              <input
                type="text"
                value={newAdmin.name}
                onChange={(e) => setNewAdmin(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Admin Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleAutoGenerateAdmin}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Auto-generieren
            </button>
            <button
              onClick={handleAddAdmin}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Administrator hinzufügen
            </button>
          </div>
        </div>
        )}

        {/* Admin-Liste anzeigen */}
        {showAdminManager && (
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h4 className="font-semibold text-gray-800">Aktuelle Administratoren</h4>
            <div className="flex space-x-2">
              <button
                onClick={loadAdminCredentials}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
              >
                Aktualisieren
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Typ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktionen</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adminCredentials.map((admin) => (
                  <tr key={admin.username} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {admin.username}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {admin.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        admin.isDefault ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {admin.isDefault ? 'Haupt-Admin' : 'Administrator'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm space-x-2">
                      {!admin.isDefault && (
                        <button
                          onClick={() => handleDeleteAdmin(admin.username)}
                          className="text-red-600 hover:text-red-900"
                          title="Administrator löschen"
                        >
                          Löschen
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
          >
            Schließen
          </button>
        </div>
      </div>

      {/* Bulk Generator Modal */}
      {showBulkGenerator && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Bulk {bulkRole === 'admin' ? 'Administrator' : 'Mitarbeiter'}-Zugänge generieren
              </h3>
              <button
                onClick={() => setShowBulkGenerator(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Generiere mehrere Mitarbeiter-Zugänge auf einmal.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anzahl zu generierender Zugänge
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={bulkCount}
                  onChange={(e) => setBulkCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="z.B. 70"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Maximal 100 Zugänge auf einmal
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rolle für generierte Zugänge
                </label>
                <select
                  value={bulkRole}
                  onChange={(e) => setBulkRole(e.target.value as 'employee' | 'admin')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="employee">👥 Mitarbeiter</option>
                  <option value="admin">🔐 Administrator</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Alle generierten Zugänge erhalten diese Rolle
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Wichtiger Hinweis
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Nach der Generierung solltest du die Zugangsdaten exportieren und sicher an deine Mitarbeiter weitergeben.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowBulkGenerator(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                Abbrechen
              </button>
              <button
                onClick={handleBulkGenerate}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium"
              >
                {bulkCount} Zugänge generieren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Credentials Modal */}
      {showGeneratedCredentials && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Generierte Zugangsdaten
              </h3>
              <button
                onClick={() => {
                  setShowGeneratedCredentials(false)
                  setGeneratedCredentials([])
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Wichtiger Hinweis
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Diese Zugangsdaten werden nur einmal angezeigt. Bitte exportiere sie sofort und gib sie sicher an deine Mitarbeiter weiter.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border">
              <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h4 className="font-semibold text-gray-800">
                  {generatedCredentials.length} generierte Zugangsdaten
                </h4>
                <div className="flex space-x-2">
                  <button
                    onClick={exportGeneratedCredentials}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                  >
                    CSV Export
                  </button>
                  <button
                    onClick={() => {
                      const text = generatedCredentials.map(cred => 
                        `${cred.hashId}: ${cred.password}`
                      ).join('\n')
                      navigator.clipboard.writeText(text)
                      alert('Zugangsdaten in die Zwischenablage kopiert!')
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Kopieren
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hash-ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Passwort</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {generatedCredentials.map((cred, index) => (
                      <tr key={`${cred.hashId}-${index}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">
                          {cred.hashId}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">
                          {cred.password}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowGeneratedCredentials(false)
                  setGeneratedCredentials([])
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Passwort zurücksetzen
              </h3>
              <button
                onClick={() => setShowPasswordReset(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Passwort zurücksetzen für: {selectedHashId}
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Ein neues Passwort wurde generiert. Nach der Bestätigung wird das alte Passwort überschrieben.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Neues Passwort
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    readOnly
                  />
                  <button
                    onClick={() => setResetPassword(generatePassword())}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    title="Neues Passwort generieren"
                  >
                    🔄
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(resetPassword)
                      alert('Passwort in die Zwischenablage kopiert!')
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    title="Passwort kopieren"
                  >
                    📋
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Das Passwort wird automatisch generiert und kann angepasst werden.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Wichtiger Hinweis
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Das alte Passwort wird unwiderruflich überschrieben. Stelle sicher, dass du das neue Passwort sicher an den Mitarbeiter weitergegeben hast.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPasswordReset(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                Abbrechen
              </button>
              <button
                onClick={confirmPasswordReset}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Passwort speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 