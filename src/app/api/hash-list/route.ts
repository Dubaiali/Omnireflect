import { NextRequest, NextResponse } from 'next/server'
import { getHashList } from '@/lib/hashList'
import { HashEntry } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const hashList: HashEntry[] = getHashList()
    if (hashList && hashList.length > 0) {
      return NextResponse.json(hashList)
    } else {
      return NextResponse.json({ error: 'Hash-Liste nicht gefunden' }, { status: 404 })
    }
  } catch (error) {
    console.error('Fehler beim Laden der Hash-Liste:', error)
    return NextResponse.json({ error: 'Interner Server-Fehler' }, { status: 500 })
  }
} 