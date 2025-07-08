import { NextRequest, NextResponse } from 'next/server'
import { validateAdmin } from '@/lib/hashList'
import { generateSessionToken, setSecureCookie } from '@/lib/session'
import { validateAndSanitize, adminLoginSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Input validieren und sanitieren
    const validatedData = validateAndSanitize(adminLoginSchema, body)
    
    const { username, password } = validatedData
    
    // Admin validieren
    const isValid = validateAdmin(username, password)
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Ungültige Admin-Zugangsdaten' },
        { status: 401 }
      )
    }
    
    // Admin-Session-Token generieren
    const sessionData = {
      username,
      timestamp: Date.now(),
      role: 'admin'
    }
    
    const sessionToken = generateSessionToken(sessionData)
    
    // Sichere Response
    const response = NextResponse.json({
      success: true,
      role: 'admin'
    })
    
    // Sichere Cookie setzen
    setSecureCookie(response, 'admin-token', sessionToken)
    
    return response
    
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.' },
      { status: 500 }
    )
  }
} 