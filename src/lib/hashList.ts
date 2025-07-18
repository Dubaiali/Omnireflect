import crypto from 'crypto'
import { HashEntry } from './types'

// Sichere Hash-Funktion
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + process.env.PASSWORD_SALT).digest('hex')
}

// Hash-Liste aus Umgebungsvariablen laden (Fallback)
function loadHashListFromEnv(): HashEntry[] {
  // Direkte Definition der Hash-Liste um JSON-Parsing-Probleme zu vermeiden
  const hashList = [
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
  
  return hashList
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