import { NextRequest, NextResponse } from 'next/server'
import { validateHash, validateAdmin } from '@/lib/hashList'
import { generateSessionToken, setSecureCookie } from '@/lib/session'
import { validateAndSanitize, loginSchema, adminLoginSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Input validieren und sanitieren
    const validatedData = validateAndSanitize(loginSchema, body)
    
    const { hashId, password } = validatedData
    
    // Hash validieren
    const user = validateHash(hashId, password)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Ungültige Hash-ID oder Passwort' },
        { status: 401 }
      )
    }
    
    // Session-Token generieren
    const sessionData = {
      hashId: user.hashId,
      timestamp: Date.now(),
      role: 'user'
    }
    
    const sessionToken = generateSessionToken(sessionData)
    
    // Sichere Response
    const response = NextResponse.json({
      success: true,
      user: {
        hashId: user.hashId,
        name: user.name,
        department: user.department,
        status: user.status
      }
    })
    
    // Sichere Cookie setzen
    setSecureCookie(response, 'session-token', sessionToken)
    
    return response
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.' },
      { status: 500 }
    )
  }
} 