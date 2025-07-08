export interface HashEntry {
  hashId: string
  password: string
  name?: string
  department?: string
  status: 'pending' | 'in_progress' | 'completed'
  lastAccess?: string
}

export const hashList: HashEntry[] = [
  {
    hashId: 'abc123',
    password: 'test123',
    name: 'Max Mustermann',
    department: 'IT',
    status: 'pending',
  },
  {
    hashId: 'def456',
    password: 'test456',
    name: 'Anna Schmidt',
    department: 'Marketing',
    status: 'in_progress',
    lastAccess: '2024-01-15T10:30:00Z',
  },
  {
    hashId: 'ghi789',
    password: 'test789',
    name: 'Tom Weber',
    department: 'Sales',
    status: 'completed',
    lastAccess: '2024-01-14T15:45:00Z',
  },
  {
    hashId: 'jkl012',
    password: 'test012',
    name: 'Lisa Müller',
    department: 'HR',
    status: 'pending',
  },
  {
    hashId: 'mno345',
    password: 'test345',
    name: 'Paul Fischer',
    department: 'Finance',
    status: 'in_progress',
    lastAccess: '2024-01-16T09:15:00Z',
  },
]

export const adminCredentials = {
  username: 'admin',
  password: 'admin123',
}

export function validateHash(hashId: string, password: string): HashEntry | null {
  return hashList.find(entry => 
    entry.hashId === hashId && entry.password === password
  ) || null
}

export function updateHashStatus(hashId: string, status: HashEntry['status']): void {
  const entry = hashList.find(e => e.hashId === hashId)
  if (entry) {
    entry.status = status
    entry.lastAccess = new Date().toISOString()
  }
} 