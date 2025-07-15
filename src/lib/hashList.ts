import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

export interface HashEntry {
  hashId: string
  password: string
  name?: string
  department?: string
  status: 'pending' | 'in_progress' | 'completed'
  lastAccess?: string
}

// Sichere Hash-Funktion
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + process.env.PASSWORD_SALT).digest('hex')
}

// User aus Datei laden
function loadHashListFromFile(): HashEntry[] | null {
  try {
    const filePath = path.resolve(process.cwd(), 'users.json')
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(fileContent).map((entry: any) => ({
        ...entry,
        password: hashPassword(entry.password)
      }))
    }
    return null
  } catch (err) {
    console.error('Fehler beim Laden der users.json:', err)
    return null
  }
}

// Hash-Liste aus Umgebungsvariablen laden (Fallback)
function loadHashListFromEnv(): HashEntry[] {
  const hashListEnv = process.env.HASH_LIST
  if (!hashListEnv) {
    // Fallback für Entwicklung
    return [
      {
        hashId: 'mitarbeiter1',
        password: hashPassword('OmniReflect2024!'),
        name: 'Max Mustermann',
        department: 'IT',
        status: 'pending',
      }
    ]
  }
  try {
    return JSON.parse(hashListEnv).map((entry: any) => ({
      ...entry,
      password: hashPassword(entry.password)
    }))
  } catch (err) {
    console.error('Fehler beim Parsen der HASH_LIST:', err, 'HASH_LIST:', hashListEnv)
    return []
  }
}

// Hash-Liste dynamisch laden
export function getHashList(): HashEntry[] {
  return loadHashListFromFile() || loadHashListFromEnv()
}

// Admin-Credentials aus Umgebungsvariablen
export const adminCredentials = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'OmniAdmin2024!',
}

export function validateHash(hashId: string, password: string): HashEntry | null {
  const hashedPassword = hashPassword(password)
  const hashList = getHashList()
  return hashList.find(entry => 
    entry.hashId === hashId && entry.password === hashedPassword
  ) || null
}

export function updateHashStatus(hashId: string, status: HashEntry['status']): void {
  const hashList = getHashList()
  const entry = hashList.find(e => e.hashId === hashId)
  if (entry) {
    entry.status = status
    entry.lastAccess = new Date().toISOString()
  }
}

// Admin-Validierung
export function validateAdmin(username: string, password: string): boolean {
  return username === adminCredentials.username && password === adminCredentials.password
} 