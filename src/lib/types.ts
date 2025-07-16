export interface HashEntry {
  hashId: string
  password: string
  name?: string
  department?: string
  status: 'pending' | 'in_progress' | 'completed'
  lastAccess?: string
} 