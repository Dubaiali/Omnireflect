import { NextRequest, NextResponse } from 'next/server'
import { updateHashStatus } from '@/lib/hashList'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { hashId, status } = body
    
    if (!hashId || !status) {
      return NextResponse.json(
        { error: 'Hash-ID und Status sind erforderlich' },
        { status: 400 }
      )
    }
    
    // Validiere Status
    const validStatuses = ['pending', 'in_progress', 'completed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Ungültiger Status. Erlaubte Werte: pending, in_progress, completed' },
        { status: 400 }
      )
    }
    
    // Update Status
    updateHashStatus(hashId, status)
    
    return NextResponse.json({
      success: true,
      message: `Status für ${hashId} auf ${status} aktualisiert`,
      hashId,
      status
    })
    
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Status:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Status' },
      { status: 500 }
    )
  }
} 