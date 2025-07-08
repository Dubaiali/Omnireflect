import { HashEntry } from './hashList'

export interface StoredData {
  hashId: string
  answers: Record<string, string>
  followUpQuestions: Record<string, string[]>
  summary: string | null
  completedAt: string | null
  lastUpdated: string
}

// Lokale Speicherung (für MVP)
export class LocalStorage {
  private static readonly STORAGE_KEY = 'mitarbeiter_reflexion_data'

  static saveData(data: StoredData): void {
    try {
      const existingData = this.getAllData()
      existingData[data.hashId] = data
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingData))
    } catch (error) {
      console.error('Fehler beim Speichern der Daten:', error)
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
  
  // Hier würden wir normalerweise die Hash-Liste aus der Datenbank laden
  // Für das MVP verwenden wir die statische Liste
  const hashList = [
    { hashId: 'abc123', password: 'test123', name: 'Max Mustermann', department: 'IT', status: 'pending' as const },
    { hashId: 'def456', password: 'test456', name: 'Anna Schmidt', department: 'Marketing', status: 'in_progress' as const },
    { hashId: 'ghi789', password: 'test789', name: 'Tom Weber', department: 'Sales', status: 'completed' as const },
    { hashId: 'jkl012', password: 'test012', name: 'Lisa Müller', department: 'HR', status: 'pending' as const },
    { hashId: 'mno345', password: 'test345', name: 'Paul Fischer', department: 'Finance', status: 'in_progress' as const },
  ]

  return hashList.map(entry => ({
    ...entry,
    data: allData[entry.hashId] || undefined
  }))
}

// Export-Funktion für PDF-Daten
export function exportDataForPDF(hashId: string): StoredData | null {
  return LocalStorage.getData(hashId)
} 