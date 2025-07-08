import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

interface SessionData {
  hashId?: string
  username?: string
  timestamp: number
  role?: string
}

// Sichere Session-Token-Generierung
export function generateSessionToken(data: SessionData): string {
  const payload = JSON.stringify(data)
  return Buffer.from(payload).toString('base64')
}

// Session-Token validieren
export function validateSessionToken(token: string): SessionData | null {
  try {
    const payload = Buffer.from(token, 'base64').toString()
    const data: SessionData = JSON.parse(payload)
    
    // Token ist 24 Stunden gültig
    if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
      return null
    }
    
    return data
  } catch {
    return null
  }
}

// Sichere Cookie setzen
export function setSecureCookie(response: NextResponse, name: string, value: string): NextResponse {
  response.cookies.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 Stunden
    path: '/'
  })
  return response
}

// Cookie löschen
export function clearCookie(response: NextResponse, name: string): NextResponse {
  response.cookies.set(name, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  })
  return response
}

// Session aus Request extrahieren
export function getSessionFromRequest(request: NextRequest): SessionData | null {
  const sessionToken = request.cookies.get('session-token')?.value
  if (!sessionToken) return null
  
  return validateSessionToken(sessionToken)
}

// Admin-Token validieren
export function validateAdminToken(token: string): boolean {
  try {
    const payload = Buffer.from(token, 'base64').toString()
    const data = JSON.parse(payload)
    
    // Admin-Token ist 8 Stunden gültig
    if (Date.now() - data.timestamp > 8 * 60 * 60 * 1000) {
      return false
    }
    
    return data.role === 'admin' && data.username === process.env.ADMIN_USERNAME
  } catch {
    return false
  }
} 