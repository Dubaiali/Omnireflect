'use client'

import { useState, useEffect } from 'react'
import { getAdminOverview } from '@/lib/storage'
import { HashEntry } from '@/lib/types'
import HashIDManager from './HashIDManager'

interface AdminTableData extends HashEntry {
  data?: {
    hashId: string
    answers: Record<string, string>
    followUpQuestions: Record<string, string[]>
    summary: string | null
    completedAt: string | null
    lastUpdated: string
    roleContext?: {
      firstName: string
      lastName: string
      workAreas: string[]
      functions: string[]
      experienceYears: string
      customerContact: string
      dailyTasks: string
    }
  }
}

export default function AdminTable() {
  const [data, setData] = useState<AdminTableData[]>([])
  const [selectedEntry, setSelectedEntry] = useState<AdminTableData | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showHashManager, setShowHashManager] = useState(false)

  useEffect(() => {
    const overview = getAdminOverview()
    setData(overview)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Abgeschlossen'
      case 'in_progress':
        return 'In Bearbeitung'
      case 'pending':
        return 'Ausstehend'
      default:
        return 'Unbekannt'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleViewDetails = (entry: AdminTableData) => {
    setSelectedEntry(entry)
    setShowDetails(true)
  }

  const handleDownloadPDF = (entry: AdminTableData) => {
    if (!entry.data?.summary) {
      alert('Keine Zusammenfassung verfügbar')
      return
    }

    const element = document.createElement('div')
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1f2937; text-align: center; margin-bottom: 30px;">
          Mitarbeiter:innen-Reflexion & Entwicklungsgespräch
        </h1>
        
        ${entry.data.roleContext ? `
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #374151; margin-bottom: 15px;">Mitarbeiterprofil</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
            <div><strong>Name:</strong> ${entry.data.roleContext.firstName} ${entry.data.roleContext.lastName}</div>
            <div><strong>Funktion:</strong> ${entry.data.roleContext.functions.join(', ')}</div>
            <div><strong>Arbeitsbereiche:</strong> ${entry.data.roleContext.workAreas.join(', ')}</div>
            <div><strong>Erfahrung:</strong> ${entry.data.roleContext.experienceYears}</div>
            <div><strong>Kundenkontakt:</strong> ${entry.data.roleContext.customerContact}</div>
          </div>
        </div>
        ` : ''}
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #374151; margin-bottom: 15px;">Zusammenfassung der Selbstreflexion</h2>
          <div style="white-space: pre-wrap; line-height: 1.6; color: #4b5563;">
            ${entry.data.summary}
          </div>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Generiert am ${new Date().toLocaleDateString('de-DE')} | 
            Hash-ID: ${entry.hashId}
          </p>
        </div>
      </div>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Mitarbeiter:innen-Reflexion - ${entry.hashId}</title>
            <style>
              body { font-family: Arial, sans-serif; }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            ${element.innerHTML}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Übersicht aller Reflexionen
            </h2>
            <button
              onClick={() => setShowHashManager(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Hash-IDs verwalten
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hash-ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Arbeitsbereiche
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Funktion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Erstellt am
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Letzter Zugriff
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((entry) => (
                <tr key={entry.hashId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {entry.hashId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">
                      {entry.data?.roleContext?.workAreas.join(', ') || entry.department || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {entry.data?.roleContext?.functions.join(', ') || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(entry.status)}`}>
                      {getStatusText(entry.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(entry.data?.lastUpdated)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(entry.lastAccess)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleViewDetails(entry)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Details
                    </button>
                    {entry.data?.summary && (
                      <button
                        onClick={() => handleDownloadPDF(entry)}
                        className="text-green-600 hover:text-green-900"
                      >
                        PDF
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedEntry && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Details für {selectedEntry.hashId}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mitarbeiterinformationen */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 border-b pb-2">Mitarbeiterprofil</h4>
                  
                  {selectedEntry.data?.roleContext ? (
                    <div className="space-y-3">
                      <div>
                        <strong>Name:</strong> {selectedEntry.data.roleContext.firstName} {selectedEntry.data.roleContext.lastName}
                      </div>
                      <div>
                        <strong>Funktion:</strong> {selectedEntry.data.roleContext.functions.join(', ')}
                      </div>
                      <div>
                        <strong>Arbeitsbereiche:</strong> 
                        <div className="mt-1">
                          {selectedEntry.data.roleContext.workAreas.map((area, index) => (
                            <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <strong>Erfahrungsjahre:</strong> {selectedEntry.data.roleContext.experienceYears}
                      </div>
                      <div>
                        <strong>Kundenkontakt:</strong> {selectedEntry.data.roleContext.customerContact}
                      </div>
                      {selectedEntry.data.roleContext.dailyTasks && (
                        <div>
                          <strong>Tägliche Aufgaben:</strong>
                          <p className="text-sm text-gray-600 mt-1">{selectedEntry.data.roleContext.dailyTasks}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500">Keine Profildaten verfügbar</div>
                  )}
                </div>

                {/* Dokumentinformationen */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 border-b pb-2">Dokumentstatus</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <strong>Hash-ID:</strong> {selectedEntry.hashId}
                    </div>
                    <div>
                      <strong>Status:</strong> {getStatusText(selectedEntry.status)}
                    </div>
                    <div>
                      <strong>Erstellt am:</strong> {formatDate(selectedEntry.data?.lastUpdated)}
                    </div>
                    <div>
                      <strong>Letzter Zugriff:</strong> {formatDate(selectedEntry.lastAccess)}
                    </div>
                    
                    {selectedEntry.data && (
                      <div>
                        <strong>Beantwortete Fragen:</strong> {Object.keys(selectedEntry.data.answers).length}
                      </div>
                    )}
                    
                    {selectedEntry.data?.summary && (
                      <div>
                        <strong>Zusammenfassung verfügbar:</strong> 
                        <span className="text-green-600 ml-1">Ja</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                {selectedEntry.data?.summary && (
                  <button
                    onClick={() => handleDownloadPDF(selectedEntry)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                  >
                    PDF herunterladen
                  </button>
                )}
                <button
                  onClick={() => setShowDetails(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hash-ID Manager Modal */}
      <HashIDManager 
        isOpen={showHashManager} 
        onClose={() => setShowHashManager(false)} 
      />
    </div>
  )
} 