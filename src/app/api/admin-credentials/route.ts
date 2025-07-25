import { NextRequest, NextResponse } from 'next/server'
import { adminCredentials, validateAdmin } from '@/lib/hashList'
import crypto from 'crypto'

// Sichere Hash-Funktion mit Fallback-Salt
function hashPassword(password: string): string {
  const salt = process.env.PASSWORD_SALT || 'OmniReflect2024_FallbackSalt'
  return crypto.createHash('sha256').update(password + salt).digest('hex')
}

// Dynamische Admin-Credentials (im Speicher)
let dynamicAdminCredentials: Array<{username: string, password: string, name?: string}> = []

// GET: Admin-Credentials abrufen
export async function GET() {
  try {
    // Kombiniere statische und dynamische Admin-Credentials
    const allAdmins = [
      {
        username: adminCredentials.username,
        password: '***HIDDEN***', // Passwort wird nicht zurückgegeben
        name: 'Haupt-Administrator',
        isDefault: true
      },
      ...dynamicAdminCredentials.map(admin => ({
        ...admin,
        password: '***HIDDEN***',
        isDefault: false
      }))
    ]
    
    return NextResponse.json({
      admins: allAdmins,
      success: true
    })
  } catch (error) {
    console.error('Fehler beim Abrufen der Admin-Credentials:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Admin-Credentials' },
      { status: 500 }
    )
  }
}

// POST: Neue Admin-Credentials hinzufügen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.username || !body.plainPassword) {
      return NextResponse.json(
        { error: 'Username und Passwort sind erforderlich' },
        { status: 400 }
      )
    }

    // Prüfe auf Duplikate
    const existingAdmin = dynamicAdminCredentials.find(admin => admin.username === body.username)
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin-Username existiert bereits' },
        { status: 400 }
      )
    }

    // Prüfe auf Konflikt mit Standard-Admin
    if (body.username === adminCredentials.username) {
      return NextResponse.json(
        { error: 'Username ist bereits für den Haupt-Administrator reserviert' },
        { status: 400 }
      )
    }

    const newAdmin = {
      username: body.username,
      password: hashPassword(body.plainPassword),
      name: body.name || body.username
    }

    dynamicAdminCredentials.push(newAdmin)
    
    return NextResponse.json({
      success: true,
      message: `Admin ${body.username} erfolgreich hinzugefügt`,
      username: body.username
    })
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Admin-Credentials:', error)
    return NextResponse.json(
      { error: 'Fehler beim Hinzufügen der Admin-Credentials' },
      { status: 500 }
    )
  }
}

// DELETE: Admin-Credentials entfernen
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    
    if (!username) {
      return NextResponse.json(
        { error: 'Username ist erforderlich' },
        { status: 400 }
      )
    }

    // Verhindere Löschung des Haupt-Administrators
    if (username === adminCredentials.username) {
      return NextResponse.json(
        { error: 'Haupt-Administrator kann nicht gelöscht werden' },
        { status: 400 }
      )
    }

    const initialLength = dynamicAdminCredentials.length
    dynamicAdminCredentials = dynamicAdminCredentials.filter(admin => admin.username !== username)
    const removed = initialLength !== dynamicAdminCredentials.length
    
    if (removed) {
      return NextResponse.json({
        success: true,
        message: `Admin ${username} erfolgreich entfernt`
      })
    } else {
      return NextResponse.json(
        { error: `Admin ${username} nicht gefunden` },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Fehler beim Entfernen der Admin-Credentials:', error)
    return NextResponse.json(
      { error: 'Fehler beim Entfernen der Admin-Credentials' },
      { status: 500 }
    )
  }
} 