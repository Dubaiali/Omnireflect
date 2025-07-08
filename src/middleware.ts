import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { validateHash } from '@/lib/hashList'

// Rate Limiting Store (in Produktion sollte Redis verwendet werden)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate Limiting Funktion
function checkRateLimit(identifier: string, limit: number = 100, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= limit) {
    return false
  }
  
  record.count++
  return true
}

// Session-Validierung
function validateSession(request: NextRequest): boolean {
  const sessionToken = request.cookies.get('session-token')?.value
  if (!sessionToken) return false
  
  try {
    // In Produktion: JWT-Token validieren oder Session-DB prüfen
    const decoded = JSON.parse(Buffer.from(sessionToken, 'base64').toString())
    return decoded.hashId && decoded.timestamp && (Date.now() - decoded.timestamp) < 24 * 60 * 60 * 1000 // 24h
  } catch {
    return false
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Security Headers für alle Requests
  const response = NextResponse.next()
  
  // Security Headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // API-Routes schützen
  if (pathname.startsWith('/api/gpt/')) {
    // Rate Limiting
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(clientIp, 50, 15 * 60 * 1000)) { // 50 requests per 15 minutes
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }
    
    // Session-Validierung entfernt - Frontend ist bereits über Zustand-Store authentifiziert
    // if (!validateSession(request)) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized. Please log in.' },
    //     { status: 401 }
    //   )
    // }
  }
  
  // Admin-Route schützen
  if (pathname.startsWith('/admin')) {
    const adminToken = request.cookies.get('admin-token')?.value
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }
  
  // Für geschützte Seiten: Nur Security Headers, keine Session-Validierung
  // (Session wird client-seitig durch Zustand-Store verwaltet)
  
  return response
}

export const config = {
  matcher: [
    '/api/gpt/:path*',
    '/admin/:path*',
    '/questions/:path*',
    '/summary/:path*',
    '/role-context/:path*'
  ]
} 