import crypto from 'crypto'
import { HashEntry } from './types'
import fs from 'fs'
import path from 'path'

// Pfad zur persistenten Hash-Liste
const HASH_LIST_FILE = path.join(process.cwd(), 'data', 'hash-list.json')



// Sichere Hash-Funktion mit Fallback-Salt
function hashPassword(password: string): string {
  const salt = process.env.PASSWORD_SALT || 'OmniReflect2024_FallbackSalt'
  return crypto.createHash('sha256').update(password + salt).digest('hex')
}

// Dynamische Hash-Liste (im Speicher)
let dynamicHashList: HashEntry[] = []



// Stelle sicher, dass das data-Verzeichnis existiert
function ensureDataDirectory() {
  const dataDir = path.dirname(HASH_LIST_FILE)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Lade persistente Hash-Liste
function loadPersistentHashList(): HashEntry[] {
  try {
    ensureDataDirectory()
    if (fs.existsSync(HASH_LIST_FILE)) {
      const data = fs.readFileSync(HASH_LIST_FILE, 'utf8')
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (error) {
    console.error('Fehler beim Laden der persistenten Hash-Liste:', error)
  }
  return []
}

// Speichere persistente Hash-Liste
function savePersistentHashList(entries: HashEntry[]): void {
  try {
    ensureDataDirectory()
    fs.writeFileSync(HASH_LIST_FILE, JSON.stringify(entries, null, 2))
    console.log(`Persistente Hash-Liste gespeichert: ${entries.length} Einträge`)
  } catch (error) {
    console.error('Fehler beim Speichern der persistenten Hash-Liste:', error)
  }
}



// Statische Hash-Liste als Fallback
function getStaticHashList(): HashEntry[] {
  return [
    {
      hashId: 'emp_md87yj1f_904c447c80694dc5',
      password: hashPassword('Tvr39RN%Jg$7'),
      name: 'Max Mustermann',
      department: 'IT',
      status: 'pending' as const,
    },
    {
      hashId: 'emp_md87yj1i_495fdbe7c5212ef9',
      password: hashPassword('A#7^So8gUV03'),
      name: 'Anna Schmidt',
      department: 'Marketing',
      status: 'pending' as const,
    }
  ]
}

// Hash-Liste dynamisch laden (kombiniert statische und dynamische Einträge)
export function getHashList(): HashEntry[] {
  // Lade persistente Einträge beim ersten Aufruf
  if (dynamicHashList.length === 0) {
    dynamicHashList = loadPersistentHashList()
  }
  
  // Kombiniere statische und dynamische Listen, wobei dynamische Einträge Vorrang haben
  const staticList = getStaticHashList()
  const dynamicHashIds = new Set(dynamicHashList.map(entry => entry.hashId))
  
  // Füge nur statische Einträge hinzu, die nicht in der dynamischen Liste existieren
  const uniqueStaticEntries = staticList.filter(entry => !dynamicHashIds.has(entry.hashId))
  
  return [...uniqueStaticEntries, ...dynamicHashList]
}

// Neue Hash-ID hinzufügen
export function addHashEntry(entry: Omit<HashEntry, 'password'> & { plainPassword: string }): void {
  const hashedEntry: HashEntry = {
    hashId: entry.hashId,
    password: hashPassword(entry.plainPassword),
    name: entry.name,
    department: entry.department,
    status: entry.status
  }
  
  // Prüfe auf Duplikate
  const existingIndex = dynamicHashList.findIndex(e => e.hashId === entry.hashId)
  if (existingIndex >= 0) {
    dynamicHashList[existingIndex] = hashedEntry
  } else {
    dynamicHashList.push(hashedEntry)
  }
  
  // Speichere persistent
  savePersistentHashList(dynamicHashList)
  
  console.log(`Hash-ID ${entry.hashId} hinzugefügt/aktualisiert`)
}

// Hash-ID entfernen
export function removeHashEntry(hashId: string): boolean {
  const initialLength = dynamicHashList.length
  dynamicHashList = dynamicHashList.filter(entry => entry.hashId !== hashId)
  const removed = initialLength !== dynamicHashList.length
  
  if (removed) {
    // Speichere persistent
    savePersistentHashList(dynamicHashList)
    console.log(`Hash-ID ${hashId} entfernt`)
  }
  
  return removed
}

// Admin-Credentials aus Umgebungsvariablen
export const adminCredentials = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'OmniAdmin2024!',
}

export function validateHash(hashId: string, password: string): HashEntry | null {
  const hashedPassword = hashPassword(password)
  const hashList = getHashList()
  
  console.log(`Validierung: HashID=${hashId}, HashList-Länge=${hashList.length}`)
  
  const entry = hashList.find(entry => 
    entry.hashId === hashId && entry.password === hashedPassword
  )
  
  if (entry) {
    console.log(`Validierung erfolgreich für ${hashId}`)
  } else {
    console.log(`Validierung fehlgeschlagen für ${hashId}`)
  }
  
  return entry || null
}

export function updateHashStatus(hashId: string, status: HashEntry['status']): void {
  // Aktualisiere in der dynamischen Liste
  const dynamicEntry = dynamicHashList.find(entry => entry.hashId === hashId)
  if (dynamicEntry) {
    dynamicEntry.status = status
    // Speichere persistent
    savePersistentHashList(dynamicHashList)
    console.log(`Status für ${hashId} auf ${status} aktualisiert`)
  }
}

// Admin-Validierung (vereinfacht - nur für Haupt-Admin)
export function validateAdmin(username: string, password: string): boolean {
  return username === adminCredentials.username && password === adminCredentials.password
}

// Debug-Funktion
export function debugHashList() {
  return {
    staticCount: getStaticHashList().length,
    dynamicCount: dynamicHashList.length,
    totalCount: getHashList().length,
    dynamicEntries: dynamicHashList.map(e => ({ hashId: e.hashId, name: e.name, status: e.status })),
    persistentFile: HASH_LIST_FILE,
    persistentFileExists: fs.existsSync(HASH_LIST_FILE)
  }
} 