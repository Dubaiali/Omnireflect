'use client'

import { useState, useEffect } from 'react'
import { getAdminOverview } from '@/lib/storage'
import { HashEntry } from '@/lib/hashList'

interface AdminTableData extends HashEntry {
  data?: {
    hashId: string
    answers: Record<string, string>
    followUpQuestions: Record<string, string[]>
    summary: string | null
    completedAt: string | null
    lastUpdated: string
  }
}

export default function AdminTable() {
  const [data, setData] = useState<AdminTableData[]>([])
  const [selectedEntry, setSelectedEntry] = useState<AdminTableData | null>(null)
  const [showDetails, setShowDetails] = useState(false)

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
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Übersicht aller Mitarbeiter:innen-Reflexionen
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hash-ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Abteilung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.department || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(entry.status)}`}>
                      {getStatusText(entry.status)}
                    </span>
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
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Details für {selectedEntry.name || selectedEntry.hashId}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <strong>Hash-ID:</strong> {selectedEntry.hashId}
                </div>
                <div>
                  <strong>Abteilung:</strong> {selectedEntry.department || '-'}
                </div>
                <div>
                  <strong>Status:</strong> {getStatusText(selectedEntry.status)}
                </div>
                <div>
                  <strong>Letzter Zugriff:</strong> {formatDate(selectedEntry.lastAccess)}
                </div>
                
                {selectedEntry.data && (
                  <div>
                    <strong>Antworten:</strong> {Object.keys(selectedEntry.data.answers).length}
                  </div>
                )}
                
                {selectedEntry.data?.summary && (
                  <div>
                    <strong>Zusammenfassung verfügbar:</strong> Ja
                  </div>
                )}
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
    </div>
  )
} 