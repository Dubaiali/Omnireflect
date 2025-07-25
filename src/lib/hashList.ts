import crypto from 'crypto'
import { HashEntry } from './types'
import fs from 'fs'
import path from 'path'

// Pfad zur persistenten Hash-Liste
const HASH_LIST_FILE = path.join(process.cwd(), 'data', 'hash-list.json')

// Pfad zur persistenten Admin-Credentials-Liste
const ADMIN_CREDENTIALS_FILE = path.join(process.cwd(), 'data', 'admin-credentials.json')

// Sichere Hash-Funktion mit Fallback-Salt
function hashPassword(password: string): string {
  const salt = process.env.PASSWORD_SALT || 'OmniReflect2024_FallbackSalt'
  return crypto.createHash('sha256').update(password + salt).digest('hex')
}

// Dynamische Hash-Liste (im Speicher)
let dynamicHashList: HashEntry[] = []

// Dynamische Admin-Credentials (im Speicher)
let dynamicAdminCredentials: Array<{username: string, password: string, name?: string}> = []

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

// Lade persistente Admin-Credentials
function loadPersistentAdminCredentials(): Array<{username: string, password: string, name?: string}> {
  try {
    ensureDataDirectory()
    if (fs.existsSync(ADMIN_CREDENTIALS_FILE)) {
      const data = fs.readFileSync(ADMIN_CREDENTIALS_FILE, 'utf8')
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (error) {
    console.error('Fehler beim Laden der persistenten Admin-Credentials:', error)
  }
  return []
}

// Speichere persistente Admin-Credentials
function savePersistentAdminCredentials(credentials: Array<{username: string, password: string, name?: string}>): void {
  try {
    ensureDataDirectory()
    fs.writeFileSync(ADMIN_CREDENTIALS_FILE, JSON.stringify(credentials, null, 2))
    console.log(`Persistente Admin-Credentials gespeichert: ${credentials.length} Einträge`)
  } catch (error) {
    console.error('Fehler beim Speichern der persistenten Admin-Credentials:', error)
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

// Admin-Validierung
export function validateAdmin(username: string, password: string): boolean {
  // Lade persistente Admin-Credentials beim ersten Aufruf
  if (dynamicAdminCredentials.length === 0) {
    dynamicAdminCredentials = loadPersistentAdminCredentials()
  }
  
  // Prüfe zuerst gegen statische Admin-Credentials
  if (username === adminCredentials.username && password === adminCredentials.password) {
    console.log(`Admin-Validierung erfolgreich für Haupt-Admin: ${username}`)
    return true
  }
  
  // Prüfe gegen dynamische Admin-Credentials
  const hashedPassword = hashPassword(password)
  const dynamicAdmin = dynamicAdminCredentials.find(admin => 
    admin.username === username && admin.password === hashedPassword
  )
  
  if (dynamicAdmin) {
    console.log(`Admin-Validierung erfolgreich für dynamischen Admin: ${username}`)
    return true
  }
  
  console.log(`Admin-Validierung fehlgeschlagen für: ${username}`)
  return false
}

// Admin-Credentials-Verwaltung
export function addAdminCredential(entry: {username: string, plainPassword: string, name?: string}): void {
  // Lade persistente Admin-Credentials beim ersten Aufruf
  if (dynamicAdminCredentials.length === 0) {
    dynamicAdminCredentials = loadPersistentAdminCredentials()
  }
  
  const hashedCredential = {
    username: entry.username,
    password: hashPassword(entry.plainPassword),
    name: entry.name || entry.username
  }
  
  // Prüfe auf Duplikate
  const existingIndex = dynamicAdminCredentials.findIndex(admin => admin.username === entry.username)
  if (existingIndex >= 0) {
    dynamicAdminCredentials[existingIndex] = hashedCredential
  } else {
    dynamicAdminCredentials.push(hashedCredential)
  }
  
  // Speichere persistent
  savePersistentAdminCredentials(dynamicAdminCredentials)
  
  console.log(`Admin-Credential ${entry.username} hinzugefügt/aktualisiert`)
}

export function removeAdminCredential(username: string): boolean {
  // Lade persistente Admin-Credentials beim ersten Aufruf
  if (dynamicAdminCredentials.length === 0) {
    dynamicAdminCredentials = loadPersistentAdminCredentials()
  }
  
  const initialLength = dynamicAdminCredentials.length
  dynamicAdminCredentials = dynamicAdminCredentials.filter(admin => admin.username !== username)
  const removed = initialLength !== dynamicAdminCredentials.length
  
  if (removed) {
    // Speichere persistent
    savePersistentAdminCredentials(dynamicAdminCredentials)
    console.log(`Admin-Credential ${username} entfernt`)
  }
  
  return removed
}

export function getAdminCredentials(): Array<{username: string, name?: string, isDefault?: boolean}> {
  // Lade persistente Admin-Credentials beim ersten Aufruf
  if (dynamicAdminCredentials.length === 0) {
    dynamicAdminCredentials = loadPersistentAdminCredentials()
  }
  
  return [
    {
      username: adminCredentials.username,
      name: 'Haupt-Administrator',
      isDefault: true
    },
    ...dynamicAdminCredentials.map(admin => ({
      username: admin.username,
      name: admin.name,
      isDefault: false
    }))
  ]
}

// Debug-Funktion
export function debugHashList() {
  // Lade Admin-Credentials beim Debug-Aufruf
  if (dynamicAdminCredentials.length === 0) {
    dynamicAdminCredentials = loadPersistentAdminCredentials()
  }
  
  return {
    staticCount: getStaticHashList().length,
    dynamicCount: dynamicHashList.length,
    totalCount: getHashList().length,
    dynamicEntries: dynamicHashList.map(e => ({ hashId: e.hashId, name: e.name, status: e.status })),
    persistentFile: HASH_LIST_FILE,
    persistentFileExists: fs.existsSync(HASH_LIST_FILE),
    adminCredentialsCount: dynamicAdminCredentials.length,
    adminCredentialsFile: ADMIN_CREDENTIALS_FILE,
    adminCredentialsFileExists: fs.existsSync(ADMIN_CREDENTIALS_FILE),
    adminCredentials: dynamicAdminCredentials.map(admin => ({ username: admin.username, name: admin.name }))
  }
} 