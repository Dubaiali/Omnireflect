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



// Hash-Liste aus Umgebungsvariablen generieren
function getEmployeesFromEnv(): HashEntry[] {
  const employees: HashEntry[] = []
  let index = 1
  
  while (true) {
    const hashId = process.env[`EMPLOYEE${index}_HASHID`]
    const password = process.env[`EMPLOYEE${index}_PASSWORD`]
    const name = process.env[`EMPLOYEE${index}_NAME`]
    const department = process.env[`EMPLOYEE${index}_DEPARTMENT`]
    
    if (!hashId || !password) {
      break // Keine weiteren Mitarbeiter gefunden
    }
    
    employees.push({
      hashId,
      password: hashPassword(password),
      name: name || 'Unbekannt',
      department: department || 'Unbekannt',
      status: 'pending' as const,
    })
    
    index++
  }
  
  return employees
}

// Statische Hash-Liste als Fallback (nur wenn keine Umgebungsvariablen gesetzt sind)
function getStaticHashList(): HashEntry[] {
  const envEmployees = getEmployeesFromEnv()
  
  if (envEmployees.length > 0) {
    console.log(`Lade ${envEmployees.length} Mitarbeiter aus Umgebungsvariablen`)
    
    // Lade Blacklist der gelöschten Hash-IDs
    const BLACKLIST_FILE = path.join(process.cwd(), 'data', 'deleted-hash-ids.json')
    let deletedHashIds: string[] = []
    
    try {
      if (fs.existsSync(BLACKLIST_FILE)) {
        const data = fs.readFileSync(BLACKLIST_FILE, 'utf8')
        deletedHashIds = JSON.parse(data)
        console.log(`Blacklist geladen: ${deletedHashIds.length} gelöschte Hash-IDs`)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Blacklist:', error)
    }
    
    // Filtere gelöschte Hash-IDs aus
    const filteredEmployees = envEmployees.filter(employee => !deletedHashIds.includes(employee.hashId))
    
    if (filteredEmployees.length !== envEmployees.length) {
      console.log(`${envEmployees.length - filteredEmployees.length} Mitarbeiter aus Blacklist gefiltert`)
    }
    
    return filteredEmployees
  }
  
  // Fallback: Standard-Mitarbeiter (nur für Entwicklung)
  console.log('Keine Umgebungsvariablen gefunden, verwende Standard-Mitarbeiter')
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
  
  // Wenn dynamische Einträge vorhanden sind, verwende nur diese
  if (dynamicHashList.length > 0) {
    return dynamicHashList
  }
  
  // Fallback: Lade statische Liste (mit Blacklist-Filter)
  const staticList = getStaticHashList()
  return staticList
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
  
  // Zusätzlich: Markiere Hash-ID als gelöscht, falls sie aus Umgebungsvariablen kam
  // Lade die Blacklist der gelöschten Hash-IDs
  const BLACKLIST_FILE = path.join(process.cwd(), 'data', 'deleted-hash-ids.json')
  let deletedHashIds: string[] = []
  
  try {
    if (fs.existsSync(BLACKLIST_FILE)) {
      const data = fs.readFileSync(BLACKLIST_FILE, 'utf8')
      deletedHashIds = JSON.parse(data)
    }
  } catch (error) {
    console.error('Fehler beim Laden der Blacklist:', error)
  }
  
  // Füge Hash-ID zur Blacklist hinzu, falls sie noch nicht existiert
  if (!deletedHashIds.includes(hashId)) {
    deletedHashIds.push(hashId)
    
    try {
      ensureDataDirectory()
      fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(deletedHashIds, null, 2))
      console.log(`Hash-ID ${hashId} zur Blacklist hinzugefügt`)
    } catch (error) {
      console.error('Fehler beim Speichern der Blacklist:', error)
    }
  }
  
  return removed
}

// Admin-Credentials aus Umgebungsvariablen
export const adminCredentials = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || '',
  name: process.env.ADMIN_NAME || 'Administrator'
}

// Admin-Credentials-Verwaltung
const ADMIN_CREDENTIALS_FILE = path.join(process.cwd(), 'data', 'admin-credentials.json')

interface AdminCredential {
  username: string
  password: string
  name?: string
  isDefault?: boolean
}

// Lade Admin-Credentials
function loadAdminCredentials(): AdminCredential[] {
  try {
    ensureDataDirectory()
    if (fs.existsSync(ADMIN_CREDENTIALS_FILE)) {
      const data = fs.readFileSync(ADMIN_CREDENTIALS_FILE, 'utf8')
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (error) {
    console.error('Fehler beim Laden der Admin-Credentials:', error)
  }
  
  // Prüfe ob Admin-Credentials in Umgebungsvariablen definiert sind
  if (adminCredentials.username && adminCredentials.password) {
    console.log('Lade Admin-Credentials aus Umgebungsvariablen')
    const envAdmin: AdminCredential = {
      username: adminCredentials.username,
      password: hashPassword(adminCredentials.password),
      name: adminCredentials.name,
      isDefault: false
    }
    
    // Speichere Admin aus Umgebungsvariablen
    saveAdminCredentials([envAdmin])
    return [envAdmin]
  }
  
  // Fallback: Leere Liste wenn keine Credentials definiert sind
  console.warn('Keine Admin-Credentials in Umgebungsvariablen oder Datei gefunden')
  return []
}

// Speichere Admin-Credentials
function saveAdminCredentials(admins: AdminCredential[]): void {
  try {
    ensureDataDirectory()
    fs.writeFileSync(ADMIN_CREDENTIALS_FILE, JSON.stringify(admins, null, 2))
    console.log(`Admin-Credentials gespeichert: ${admins.length} Admins`)
  } catch (error) {
    console.error('Fehler beim Speichern der Admin-Credentials:', error)
  }
}

// Admin-Credentials abrufen
export function getAdminCredentials(): AdminCredential[] {
  return loadAdminCredentials()
}

// Admin-Credential hinzufügen
export function addAdminCredential(admin: { username: string; plainPassword: string; name?: string }): void {
  const admins = loadAdminCredentials()
  
  const newAdmin: AdminCredential = {
    username: admin.username,
    password: hashPassword(admin.plainPassword),
    name: admin.name || admin.username
  }
  
  // Prüfe auf Duplikate
  const existingIndex = admins.findIndex(a => a.username === admin.username)
  if (existingIndex >= 0) {
    admins[existingIndex] = newAdmin
  } else {
    admins.push(newAdmin)
  }
  
  saveAdminCredentials(admins)
  console.log(`Admin ${admin.username} hinzugefügt/aktualisiert`)
}

// Admin-Credential entfernen
export function removeAdminCredential(username: string): boolean {
  const admins = loadAdminCredentials()
  const initialLength = admins.length
  const filteredAdmins = admins.filter(admin => admin.username !== username)
  const removed = initialLength !== filteredAdmins.length
  
  if (removed) {
    saveAdminCredentials(filteredAdmins)
    console.log(`Admin ${username} entfernt`)
  }
  
  return removed
}

export function validateHash(hashId: string, password: string): HashEntry | null {
  const hashedPassword = hashPassword(password)
  const hashList = getHashList()
  
  console.log(`Validierung: HashID=${hashId}, HashList-Länge=${hashList.length}`)
  console.log(`Eingegebenes Passwort-Hash: ${hashedPassword}`)
  
  const entry = hashList.find(entry => 
    entry.hashId === hashId && entry.password === hashedPassword
  )
  
  if (entry) {
    console.log(`Validierung erfolgreich für ${hashId}`)
  } else {
    console.log(`Validierung fehlgeschlagen für ${hashId}`)
    console.log(`Gefundene Einträge mit HashID ${hashId}:`, hashList.filter(e => e.hashId === hashId).map(e => ({ hashId: e.hashId, password: e.password.substring(0, 10) + '...' })))
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
  } else {
    // Falls der Eintrag nicht in der dynamischen Liste ist, füge ihn hinzu
    const staticList = getStaticHashList()
    const staticEntry = staticList.find(entry => entry.hashId === hashId)
    if (staticEntry) {
      const newEntry: HashEntry = {
        ...staticEntry,
        status: status
      }
      dynamicHashList.push(newEntry)
      savePersistentHashList(dynamicHashList)
      console.log(`Statischen Eintrag ${hashId} zu dynamischer Liste hinzugefügt und Status auf ${status} gesetzt`)
    } else {
      console.warn(`Hash-ID ${hashId} nicht gefunden für Status-Update`)
    }
  }
}

// Admin-Validierung (erweitert - unterstützt mehrere Admins)
export function validateAdmin(username: string, password: string): boolean {
  const admins = getAdminCredentials()
  const hashedPassword = hashPassword(password)
  
  const admin = admins.find(a => a.username === username && a.password === hashedPassword)
  return !!admin
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