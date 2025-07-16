import crypto from 'crypto'
import { HashEntry } from './types'

// Sichere Hash-Funktion
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + process.env.PASSWORD_SALT).digest('hex')
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

// Hash-Liste dynamisch laden (nur für Server-seitige Verwendung)
export function getHashList(): HashEntry[] {
  return loadHashListFromEnv()
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
  // Diese Funktion ist ein Platzhalter und tut aktuell nichts,
  // da die Hash-Liste nicht persistent gespeichert wird.
}

// Admin-Validierung
export function validateAdmin(username: string, password: string): boolean {
  return username === adminCredentials.username && password === adminCredentials.password
} 