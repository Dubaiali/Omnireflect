import { HashEntry } from './types'

export interface StoredData {
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

// Lokale Speicherung (für MVP)
export class LocalStorage {
  private static readonly STORAGE_KEY = 'mitarbeiter_reflexion_data'
  private static readonly ROLE_CONTEXT_KEY = 'mitarbeiter_role_context'

  static saveData(data: StoredData): void {
    try {
      const existingData = this.getAllData()
      existingData[data.hashId] = data
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingData))
    } catch (error) {
      console.error('Fehler beim Speichern der Daten:', error)
    }
  }

  static saveRoleContext(hashId: string, roleContext: any): void {
    try {
      const existingData = this.getAllData()
      if (!existingData[hashId]) {
        existingData[hashId] = {
          hashId,
          answers: {},
          followUpQuestions: {},
          summary: null,
          completedAt: null,
          lastUpdated: new Date().toISOString()
        }
      }
      existingData[hashId].roleContext = roleContext
      existingData[hashId].lastUpdated = new Date().toISOString()
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingData))
    } catch (error) {
      console.error('Fehler beim Speichern des Rollenkontexts:', error)
    }
  }

  static getData(hashId: string): StoredData | null {
    try {
      const allData = this.getAllData()
      return allData[hashId] || null
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error)
      return null
    }
  }

  static getAllData(): Record<string, StoredData> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.error('Fehler beim Laden aller Daten:', error)
      return {}
    }
  }

  static deleteData(hashId: string): void {
    try {
      const allData = this.getAllData()
      delete allData[hashId]
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allData))
    } catch (error) {
      console.error('Fehler beim Löschen der Daten:', error)
    }
  }

  static clearAllData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.error('Fehler beim Löschen aller Daten:', error)
    }
  }
}

// Admin-Funktionen für Übersicht
export function getAdminOverview(): Array<HashEntry & { data?: StoredData }> {
  const allData = LocalStorage.getAllData()
  
  // Lade Hash-Liste aus localStorage oder verwende Fallback
  let hashList: HashEntry[] = []
  try {
    const storedHashList = localStorage.getItem('hash-list')
    if (storedHashList) {
      hashList = JSON.parse(storedHashList)
    } else {
      // Fallback für Entwicklung
      hashList = [
        { hashId: 'mitarbeiter1', password: 'test123', name: 'Max Mustermann', department: 'IT', status: 'pending' as const },
        { hashId: 'mitarbeiter2', password: 'test456', name: 'Anna Schmidt', department: 'Marketing', status: 'in_progress' as const },
        { hashId: 'mitarbeiter3', password: 'test789', name: 'Tom Weber', department: 'Sales', status: 'completed' as const },
      ]
    }
  } catch (error) {
    console.error('Fehler beim Laden der Hash-Liste:', error)
    // Fallback bei Fehler
    hashList = [
      { hashId: 'mitarbeiter1', password: 'test123', name: 'Max Mustermann', department: 'IT', status: 'pending' as const },
    ]
  }

  return hashList.map(entry => {
    const storedData = allData[entry.hashId]
    
    // Wenn echte Daten vorhanden sind, verwende diese
    if (storedData) {
      return {
        ...entry,
        department: storedData.roleContext?.workAreas.join(', ') || entry.department,
        status: storedData.summary ? 'completed' as const : 
                Object.keys(storedData.answers).length > 0 ? 'in_progress' as const : 'pending' as const,
        lastAccess: storedData.lastUpdated,
        data: storedData
      }
    }
    
    return {
      ...entry,
      data: undefined
    }
  })
}

// Export-Funktion für PDF-Daten
export function exportDataForPDF(hashId: string): StoredData | null {
  return LocalStorage.getData(hashId)
} 