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
    department: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [bulkCount, setBulkCount] = useState(10)
  const [showBulkGenerator, setShowBulkGenerator] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadHashEntries()
    }
  }, [isOpen])

  const loadHashEntries = () => {
    // Lade aktuelle Hash-Liste aus localStorage oder API
    const stored = localStorage.getItem('hash-list')
    if (stored) {
      setHashEntries(JSON.parse(stored))
    }
  }

  const saveHashEntries = (entries: HashEntry[]) => {
    localStorage.setItem('hash-list', JSON.stringify(entries))
    setHashEntries(entries)
  }

  const generateHashId = () => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `mitarbeiter_${timestamp}_${random}`
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const handleAddEntry = () => {
    if (!newEntry.hashId || !newEntry.password) {
      alert('Hash-ID und Passwort sind erforderlich!')
      return
    }

    const entry: HashEntry = {
      hashId: newEntry.hashId,
      password: newEntry.password, // In Produktion würde hier gehasht werden
      name: newEntry.name || undefined,
      department: newEntry.department || undefined,
      status: 'pending',
      lastAccess: undefined
    }

    const updatedEntries = [...hashEntries, entry]
    saveHashEntries(updatedEntries)

    // Reset form
    setNewEntry({
      hashId: '',
      password: '',
      name: '',
      department: ''
    })
  }

  const handleDeleteEntry = (hashId: string) => {
    if (confirm(`Möchtest du die Hash-ID "${hashId}" wirklich löschen?`)) {
      const updatedEntries = hashEntries.filter(entry => entry.hashId !== hashId)
      saveHashEntries(updatedEntries)
    }
  }

  const handleAutoGenerate = () => {
    setNewEntry({
      hashId: generateHashId(),
      password: generatePassword(),
      name: '',
      department: ''
    })
  }

  const handleBulkGenerate = () => {
    if (bulkCount < 1 || bulkCount > 100) {
      alert('Bitte wähle eine Anzahl zwischen 1 und 100')
      return
    }

    const newEntries: HashEntry[] = []
    
    for (let i = 0; i < bulkCount; i++) {
      const entry: HashEntry = {
        hashId: generateHashId(),
        password: generatePassword(),
        name: undefined,
        department: undefined,
        status: 'pending',
        lastAccess: undefined
      }
      newEntries.push(entry)
    }

    const updatedEntries = [...hashEntries, ...newEntries]
    saveHashEntries(updatedEntries)
    
    alert(`${bulkCount} Hash-IDs wurden erfolgreich erstellt!`)
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Hash-IDs verwalten
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

        {/* Neue Hash-ID hinzufügen */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-800 mb-4">Neue Hash-ID erstellen</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hash-ID *
              </label>
              <input
                type="text"
                value={newEntry.hashId}
                onChange={(e) => setNewEntry(prev => ({ ...prev, hashId: e.target.value }))}
                placeholder="z.B. mitarbeiter1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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

        {/* Hash-Liste anzeigen */}
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h4 className="font-semibold text-gray-800">Aktuelle Hash-IDs</h4>
            <div className="flex space-x-2">
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
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleDeleteEntry(entry.hashId)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Löschen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
                Bulk Hash-IDs generieren
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
                Generiere mehrere Hash-IDs auf einmal für deine Mitarbeiter.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anzahl zu generierender Hash-IDs
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
                  Maximal 100 Hash-IDs auf einmal
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
                        Nach der Generierung solltest du die Hash-Liste exportieren und die Zugangsdaten sicher an deine Mitarbeiter weitergeben.
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
                {bulkCount} Hash-IDs generieren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 