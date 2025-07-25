import { NextRequest, NextResponse } from 'next/server'
import { getAdminCredentials, addAdminCredential, removeAdminCredential } from '@/lib/hashList'

// GET: Admin-Credentials abrufen
export async function GET() {
  try {
    console.log('Admin-Credentials API: GET-Anfrage empfangen')
    
    const admins = getAdminCredentials()
    console.log(`Admin-Credentials API: ${admins.length} Admins gefunden`)
    
    return NextResponse.json({
      admins: admins.map(admin => ({
        ...admin,
        password: '***HIDDEN***' // Passwort wird nicht zurückgegeben
      })),
      success: true,
      count: admins.length
    })
  } catch (error) {
    console.error('Fehler beim Abrufen der Admin-Credentials:', error)
    return NextResponse.json(
      { 
        error: 'Fehler beim Abrufen der Admin-Credentials',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    )
  }
}

// POST: Neue Admin-Credentials hinzufügen
export async function POST(request: NextRequest) {
  try {
    console.log('Admin-Credentials API: POST-Anfrage empfangen')
    
    const body = await request.json()
    console.log('Admin-Credentials API: Request body:', { ...body, password: '***HIDDEN***' })
    
    if (!body.username || !body.plainPassword) {
      return NextResponse.json(
        { error: 'Username und Passwort sind erforderlich', success: false },
        { status: 400 }
      )
    }

    // Prüfe auf Konflikt mit Standard-Admin
    const adminCredentials = getAdminCredentials()
    const existingAdmin = adminCredentials.find(admin => admin.username === body.username)
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin-Username existiert bereits', success: false },
        { status: 400 }
      )
    }

    addAdminCredential({
      username: body.username,
      plainPassword: body.plainPassword,
      name: body.name || body.username
    })
    
    console.log(`Admin-Credentials API: Admin ${body.username} erfolgreich hinzugefügt`)
    
    return NextResponse.json({
      success: true,
      message: `Admin ${body.username} erfolgreich hinzugefügt`,
      username: body.username
    })
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Admin-Credentials:', error)
    return NextResponse.json(
      { 
        error: 'Fehler beim Hinzufügen der Admin-Credentials',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    )
  }
}

// DELETE: Admin-Credentials entfernen
export async function DELETE(request: NextRequest) {
  try {
    console.log('Admin-Credentials API: DELETE-Anfrage empfangen')
    
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    
    console.log('Admin-Credentials API: Username zum Löschen:', username)
    
    if (!username) {
      return NextResponse.json(
        { error: 'Username ist erforderlich', success: false },
        { status: 400 }
      )
    }

    // Verhindere Löschung des Haupt-Administrators
    const adminCredentials = getAdminCredentials()
    const mainAdmin = adminCredentials.find(admin => admin.isDefault)
    if (username === mainAdmin?.username) {
      return NextResponse.json(
        { error: 'Haupt-Administrator kann nicht gelöscht werden', success: false },
        { status: 400 }
      )
    }

    const removed = removeAdminCredential(username)
    
    if (removed) {
      console.log(`Admin-Credentials API: Admin ${username} erfolgreich entfernt`)
      return NextResponse.json({
        success: true,
        message: `Admin ${username} erfolgreich entfernt`
      })
    } else {
      console.log(`Admin-Credentials API: Admin ${username} nicht gefunden`)
      return NextResponse.json(
        { error: `Admin ${username} nicht gefunden`, success: false },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Fehler beim Entfernen der Admin-Credentials:', error)
    return NextResponse.json(
      { 
        error: 'Fehler beim Entfernen der Admin-Credentials',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    )
  }
} 