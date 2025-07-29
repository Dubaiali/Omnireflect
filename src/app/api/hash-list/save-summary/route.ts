import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface SummaryData {
  hashId: string
  summary: string
  htmlContent?: string
  roleContext?: {
    firstName: string
    lastName: string
    workAreas: string[]
    functions: string[]
    experienceYears: string
    customerContact: string
    dailyTasks: string
  }
  answers?: Record<string, string>
  followUpQuestions?: Record<string, string[]>
  questions?: any[] // Neue Feld für die ursprünglichen Fragen
  completedAt: string
}

const SUMMARIES_FILE = path.join(process.cwd(), 'data', 'summaries.json')

// Stelle sicher, dass das data-Verzeichnis existiert
function ensureDataDirectory() {
  const dataDir = path.dirname(SUMMARIES_FILE)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Lade gespeicherte Zusammenfassungen
function loadSummaries(): Record<string, SummaryData> {
  try {
    ensureDataDirectory()
    if (fs.existsSync(SUMMARIES_FILE)) {
      const data = fs.readFileSync(SUMMARIES_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Fehler beim Laden der Zusammenfassungen:', error)
  }
  return {}
}

// Speichere Zusammenfassungen
function saveSummaries(summaries: Record<string, SummaryData>): void {
  try {
    ensureDataDirectory()
    fs.writeFileSync(SUMMARIES_FILE, JSON.stringify(summaries, null, 2))
    console.log(`Zusammenfassungen gespeichert: ${Object.keys(summaries).length} Einträge`)
  } catch (error) {
    console.error('Fehler beim Speichern der Zusammenfassungen:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { hashId, summary, htmlContent, roleContext, answers, followUpQuestions, questions } = body
    
    if (!hashId || !summary) {
      return NextResponse.json(
        { error: 'Hash-ID und Zusammenfassung sind erforderlich' },
        { status: 400 }
      )
    }
    
    // Lade bestehende Zusammenfassungen
    const summaries = loadSummaries()
    
    // Speichere neue Zusammenfassung
    summaries[hashId] = {
      hashId,
      summary,
      htmlContent,
      roleContext,
      answers,
      followUpQuestions,
      questions, // Speichere auch die ursprünglichen Fragen
      completedAt: new Date().toISOString()
    }
    
    // Speichere auf Server
    saveSummaries(summaries)
    
    return NextResponse.json({
      success: true,
      message: `Zusammenfassung für ${hashId} gespeichert`,
      hashId
    })
    
  } catch (error) {
    console.error('Fehler beim Speichern der Zusammenfassung:', error)
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Zusammenfassung' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hashId = searchParams.get('hashId')
    
    const summaries = loadSummaries()
    
    if (hashId) {
      // Spezifische Zusammenfassung abrufen
      const summary = summaries[hashId]
      if (summary) {
        return NextResponse.json({
          success: true,
          summary
        })
      } else {
        return NextResponse.json(
          { error: 'Zusammenfassung nicht gefunden' },
          { status: 404 }
        )
      }
    } else {
      // Alle Zusammenfassungen abrufen
      return NextResponse.json({
        success: true,
        summaries
      })
    }
    
  } catch (error) {
    console.error('Fehler beim Abrufen der Zusammenfassungen:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Zusammenfassungen' },
      { status: 500 }
    )
  }
} 