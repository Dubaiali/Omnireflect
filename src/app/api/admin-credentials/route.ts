import { NextRequest, NextResponse } from 'next/server'
import { getAdminCredentials, addAdminCredential, removeAdminCredential } from '@/lib/hashList'

// GET: Admin-Credentials abrufen
export async function GET() {
  try {
    const admins = getAdminCredentials()
    
    return NextResponse.json({
      admins: admins.map(admin => ({
        ...admin,
        password: '***HIDDEN***' // Passwort wird nicht zurückgegeben
      })),
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

    // Prüfe auf Konflikt mit Standard-Admin
    const adminCredentials = getAdminCredentials()
    const existingAdmin = adminCredentials.find(admin => admin.username === body.username)
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin-Username existiert bereits' },
        { status: 400 }
      )
    }

    addAdminCredential({
      username: body.username,
      plainPassword: body.plainPassword,
      name: body.name || body.username
    })
    
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
    const adminCredentials = getAdminCredentials()
    const mainAdmin = adminCredentials.find(admin => admin.isDefault)
    if (username === mainAdmin?.username) {
      return NextResponse.json(
        { error: 'Haupt-Administrator kann nicht gelöscht werden' },
        { status: 400 }
      )
    }

    const removed = removeAdminCredential(username)
    
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