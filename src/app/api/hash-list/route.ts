import { NextRequest, NextResponse } from 'next/server'
import { getHashList, addHashEntry, removeHashEntry, debugHashList } from '@/lib/hashList'
import { HashEntry } from '@/lib/types'

// GET: Hash-Liste abrufen
export async function GET() {
  try {
    const hashList = getHashList()
    const debug = debugHashList()
    
    return NextResponse.json({
      hashList,
      debug,
      success: true
    })
  } catch (error) {
    console.error('Fehler beim Abrufen der Hash-Liste:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Hash-Liste' },
      { status: 500 }
    )
  }
}

// POST: Hash-Liste aktualisieren oder neue Hash-ID hinzufügen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Prüfe ob es sich um eine einzelne Hash-ID oder eine Liste handelt
    if (body.hashId && body.plainPassword) {
      // Einzelne Hash-ID hinzufügen
      const newEntry: Omit<HashEntry, 'password'> & { plainPassword: string } = {
        hashId: body.hashId,
        plainPassword: body.plainPassword,
        name: body.name,
        department: body.department,
        status: body.status || 'pending'
      }
      
      addHashEntry(newEntry)
      
      return NextResponse.json({
        success: true,
        message: `Hash-ID ${body.hashId} erfolgreich hinzugefügt`,
        hashId: body.hashId
      })
    } else if (Array.isArray(body)) {
      // Liste von Hash-IDs hinzufügen
      const hashEntries: HashEntry[] = body
      
      // Validierung der Hash-Einträge
      if (!hashEntries.every(entry => entry.hashId && entry.password)) {
        return NextResponse.json(
          { error: 'Ungültiges Format: Alle Einträge müssen hashId und password haben' },
          { status: 400 }
        )
      }
      
      // Hier würde normalerweise die Hash-Liste persistent gespeichert werden
      console.log('Hash-Liste aktualisiert:', hashEntries.length, 'Einträge')
      
      return NextResponse.json({
        success: true,
        message: `${hashEntries.length} Hash-Einträge aktualisiert`,
        count: hashEntries.length
      })
    } else {
      return NextResponse.json(
        { error: 'Ungültiges Format: Erwarte hashId und plainPassword oder Array' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Hash-Liste:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Hash-Liste' },
      { status: 500 }
    )
  }
}

// DELETE: Hash-ID entfernen
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hashId = searchParams.get('hashId')
    
    if (!hashId) {
      return NextResponse.json(
        { error: 'Hash-ID ist erforderlich' },
        { status: 400 }
      )
    }
    
    const removed = removeHashEntry(hashId)
    
    if (removed) {
      return NextResponse.json({
        success: true,
        message: `Hash-ID ${hashId} erfolgreich entfernt`
      })
    } else {
      return NextResponse.json(
        { error: `Hash-ID ${hashId} nicht gefunden` },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Fehler beim Entfernen der Hash-ID:', error)
    return NextResponse.json(
      { error: 'Fehler beim Entfernen der Hash-ID' },
      { status: 500 }
    )
  }
} 