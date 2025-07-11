import { NextRequest, NextResponse } from 'next/server'
import { clearCookie } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true })
    
    // Alle Cookies löschen
    clearCookie(response, 'session-token')
    clearCookie(response, 'admin-token')
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten.' },
      { status: 500 }
    )
  }
} 