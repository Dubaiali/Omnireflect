import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    const adminFile = path.join(dataDir, 'admin-credentials.json')
    
    const debugInfo = {
      cwd: process.cwd(),
      dataDir,
      adminFile,
      dataDirExists: fs.existsSync(dataDir),
      adminFileExists: fs.existsSync(adminFile),
      canReadDataDir: fs.accessSync ? (() => {
        try { fs.accessSync(dataDir, fs.constants.R_OK); return true; } catch { return false; }
      })() : 'unknown',
      canWriteDataDir: fs.accessSync ? (() => {
        try { fs.accessSync(dataDir, fs.constants.W_OK); return true; } catch { return false; }
      })() : 'unknown'
    }
    
    return NextResponse.json({
      success: true,
      debug: debugInfo
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 