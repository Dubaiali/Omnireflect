import { NextRequest, NextResponse } from 'next/server'
import { validateHash, getHashList, debugHashList } from '@/lib/hashList'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    // Umgebungsvariablen prüfen
    const envVars = {
      PASSWORD_SALT: process.env.PASSWORD_SALT || 'Fallback-Salt verwendet',
      ADMIN_USERNAME: process.env.ADMIN_USERNAME,
      NODE_ENV: process.env.NODE_ENV
    }

    // Hash-Liste laden
    const hashList = getHashList()
    const debug = debugHashList()

    // Test-Hash berechnen
    const testPassword = 'OmniReflect2024!'
    const salt = process.env.PASSWORD_SALT || 'OmniReflect2024_FallbackSalt'
    const testHash = crypto.createHash('sha256').update(testPassword + salt).digest('hex')

    // Validierung testen
    const validationResult = validateHash('emp_md87yj1f_904c447c80694dc5', 'Tvr39RN%Jg$7')
    const validationResult2 = validateHash('emp_test123_abc456', 'TestPassword123!')

    // Teste verschiedene HashIDs
    const testCases = [
      { hashId: 'emp_md87yj1f_904c447c80694dc5', password: 'Tvr39RN%Jg$7', expected: true },
      { hashId: 'emp_test123_abc456', password: 'TestPassword123!', expected: true },
      { hashId: 'emp_bulk1_xyz789', password: 'BulkPassword123!', expected: true },
      { hashId: 'emp_invalid_123', password: 'InvalidPassword123!', expected: false }
    ]

    const testResults = testCases.map(testCase => ({
      ...testCase,
      result: validateHash(testCase.hashId, testCase.password) !== null,
      success: validateHash(testCase.hashId, testCase.password) !== null === testCase.expected
    }))

    return NextResponse.json({
      success: true,
      envVars,
      hashList,
      debug,
      testPassword,
      testHash,
      validationResult: validationResult ? 'Erfolgreich' : 'Fehlgeschlagen',
      validationResult2: validationResult2 ? 'Erfolgreich' : 'Fehlgeschlagen',
      testResults,
      hashListLength: hashList.length,
      allTestsPassed: testResults.every(r => r.success)
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 