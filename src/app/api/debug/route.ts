import { NextRequest, NextResponse } from 'next/server'
import { validateHash, getHashList } from '@/lib/hashList'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    // Umgebungsvariablen prüfen
    const envVars = {
      PASSWORD_SALT: process.env.PASSWORD_SALT,
      HASH_LIST: process.env.HASH_LIST,
      ADMIN_USERNAME: process.env.ADMIN_USERNAME,
      NODE_ENV: process.env.NODE_ENV
    }

    // Hash-Liste laden
    const hashList = getHashList()

    // Test-Hash berechnen
    const testPassword = 'OmniReflect2024!'
    const testHash = crypto.createHash('sha256').update(testPassword + process.env.PASSWORD_SALT).digest('hex')

    // Validierung testen
    const validationResult = validateHash('mitarbeiter1', testPassword)

    return NextResponse.json({
      success: true,
      envVars,
      hashList,
      testPassword,
      testHash,
      validationResult,
      hashListLength: hashList.length
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 