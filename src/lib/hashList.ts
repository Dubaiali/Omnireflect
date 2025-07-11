import crypto from 'crypto'

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

// Hash-Liste aus Umgebungsvariablen laden
function loadHashList(): HashEntry[] {
  const hashListEnv = process.env.HASH_LIST
  if (!hashListEnv) {
    // Fallback für Entwicklung
    return [
      {
        hashId: 'user',
        password: hashPassword('user123'),
        name: 'Test User',
        department: 'IT',
        status: 'pending',
      },
      {
        hashId: 'demo',
        password: hashPassword('demo123'),
        name: 'Demo User',
        department: 'Marketing',
        status: 'in_progress',
        lastAccess: '2024-01-15T10:30:00Z',
      },
      {
        hashId: 'test',
        password: hashPassword('test123'),
        name: 'Test Account',
        department: 'Sales',
        status: 'completed',
        lastAccess: '2024-01-14T15:45:00Z',
      },
    ]
  }

  try {
    return JSON.parse(hashListEnv).map((entry: any) => ({
      ...entry,
      password: hashPassword(entry.password)
    }))
  } catch {
    return []
  }
}

export const hashList: HashEntry[] = loadHashList()

// Admin-Credentials aus Umgebungsvariablen
export const adminCredentials = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123',
}

export function validateHash(hashId: string, password: string): HashEntry | null {
  const hashedPassword = hashPassword(password)
  return hashList.find(entry => 
    entry.hashId === hashId && entry.password === hashedPassword
  ) || null
}

export function updateHashStatus(hashId: string, status: HashEntry['status']): void {
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