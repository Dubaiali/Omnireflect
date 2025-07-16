import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { HashEntry } from '@/lib/types'

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

export async function GET(request: NextRequest) {
  try {
    const hashList = loadHashListFromFile()
    if (hashList) {
      return NextResponse.json(hashList)
    } else {
      return NextResponse.json({ error: 'Hash-Liste nicht gefunden' }, { status: 404 })
    }
  } catch (error) {
    console.error('Fehler beim Laden der Hash-Liste:', error)
    return NextResponse.json({ error: 'Interner Server-Fehler' }, { status: 500 })
  }
} 