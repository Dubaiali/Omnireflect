'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/state/sessionStore'

interface RoleContext {
  firstName: string
  lastName: string
  workAreas: string[]
  functions: string[]
  experienceYears: string
  customerContact: string
  dailyTasks: string
}

const workAreaOptions = [
  'Empfang',
  'Kasse',
  'Verkauf',
  'Werkstatt',
  'Refraktion',
  'Büro',
  'Kontaktlinse',
  'Hörakustik',
  'Anderes'
]

const functionOptions = [
  'Mitarbeiter',
  'Abteilungsleitung',
  'Ausbilder',
  'Auszubildender',
  'Fachverantwortlicher',
  'Andere'
]

const experienceOptions = [
  '< 6 Monate',
  '6–12 Monate',
  '1–3 Jahre',
  '3–5 Jahre',
  'länger als 5 Jahre',
  'länger als 10 Jahre',
  'länger als 15 Jahre'
]

const customerContactOptions = [
  'Ja, täglich',
  'Teilweise / abhängig von Kundenfrequenz',
  'Kaum oder gar nicht'
]

export default function RoleContextForm({ isEditing = false }: { isEditing?: boolean }) {
  const router = useRouter()
  const { saveRoleContext, roleContext } = useSessionStore()
  
  const [formData, setFormData] = useState<RoleContext>({
    firstName: roleContext?.firstName || '',
    lastName: roleContext?.lastName || '',
    workAreas: roleContext?.workAreas || [],
    functions: roleContext?.functions || [],
    experienceYears: roleContext?.experienceYears || '',
    customerContact: roleContext?.customerContact || '',
    dailyTasks: roleContext?.dailyTasks || ''
  })
  
  const [otherWorkArea, setOtherWorkArea] = useState('')
  const [otherFunction, setOtherFunction] = useState('')

  // Lade vorhandene Daten beim Bearbeiten
  useEffect(() => {
    if (isEditing && roleContext) {
      setFormData({
        firstName: roleContext.firstName || '',
        lastName: roleContext.lastName || '',
        workAreas: roleContext.workAreas,
        functions: roleContext.functions,
        experienceYears: roleContext.experienceYears,
        customerContact: roleContext.customerContact,
        dailyTasks: roleContext.dailyTasks
      })
    }
  }, [isEditing, roleContext])

  const handleWorkAreaChange = (area: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        workAreas: [...prev.workAreas, area]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        workAreas: prev.workAreas.filter(a => a !== area)
      }))
    }
  }

  const handleFunctionChange = (func: string) => {
    setFormData(prev => ({
      ...prev,
      functions: [func]
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validierung: Alle Pflichtfelder müssen ausgefüllt sein
    if (!formData.firstName.trim()) {
      alert('Bitte gib deinen Vornamen ein.')
      return
    }
    
    if (!formData.lastName.trim()) {
      alert('Bitte gib deinen Nachnamen ein.')
      return
    }
    
    if (formData.workAreas.length === 0) {
      alert('Bitte wähle mindestens einen Arbeitsbereich aus.')
      return
    }
    
    if (formData.functions.length === 0) {
      alert('Bitte wähle eine Funktion aus.')
      return
    }
    
    if (!formData.experienceYears) {
      alert('Bitte wähle deine Erfahrungsjahre aus.')
      return
    }
    
    if (!formData.customerContact) {
      alert('Bitte wähle aus, ob du im Kundenkontakt arbeitest.')
      return
    }
    
    // Füge "Anderes" Felder hinzu, falls ausgefüllt
    const finalWorkAreas = [...formData.workAreas]
    if (formData.workAreas.includes('Anderes') && otherWorkArea.trim()) {
      const index = finalWorkAreas.indexOf('Anderes')
      finalWorkAreas[index] = `Anderes: ${otherWorkArea.trim()}`
    }

    const finalFunctions = [...formData.functions]
    if (formData.functions.includes('Andere') && otherFunction.trim()) {
      const index = finalFunctions.indexOf('Andere')
      finalFunctions[index] = `Andere: ${otherFunction.trim()}`
    }

    const roleContext: RoleContext = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      workAreas: finalWorkAreas,
      functions: finalFunctions,
      experienceYears: formData.experienceYears,
      customerContact: formData.customerContact,
      dailyTasks: formData.dailyTasks
    }

    saveRoleContext(roleContext)
    router.push('/questions')
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Mein Profil
          </h1>
          <p className="text-gray-600 text-left text-sm">
            Deine Informationen helfen uns dabei, dein Mitarbeiterjahresgespräch ideal nur für dich vorzubereiten. Bitte nimm dir einen Moment Zeit, um die Daten sorgfältig und wahrheitsgemäß auszufüllen - das macht unsere Zusammenarbeit umso wertvoller für dich.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Wie ist dein Name?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vorname
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Dein Vorname"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nachname
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Dein Nachname"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Arbeitsbereich */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              In welchem Bereich arbeitest du aktuell?
            </h2>
            <p className="text-sm text-gray-600 mb-3">Mehrfachauswahl möglich</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {workAreaOptions.map((area) => (
                <label key={area} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.workAreas.includes(area)}
                    onChange={(e) => handleWorkAreaChange(area, e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{area}</span>
                </label>
              ))}
            </div>
            {formData.workAreas.includes('Anderes') && (
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Bitte spezifizieren..."
                  value={otherWorkArea}
                  onChange={(e) => setOtherWorkArea(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Funktionen */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Welche Funktion hast du aktuell?
            </h2>
            <p className="text-sm text-gray-600 mb-3">Bitte wähle eine Funktion aus</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {functionOptions.map((func) => (
                <label key={func} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="functions"
                    value={func}
                    checked={formData.functions.includes(func)}
                    onChange={() => handleFunctionChange(func)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{func}</span>
                </label>
              ))}
            </div>
            {formData.functions.includes('Andere') && (
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Bitte spezifizieren..."
                  value={otherFunction}
                  onChange={(e) => setOtherFunction(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Erfahrungsjahre */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Wie lange arbeitest du bereits in dieser Rolle?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {experienceOptions.map((option) => (
                <label key={option} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="experienceYears"
                    value={option}
                    checked={formData.experienceYears === option}
                    onChange={(e) => setFormData(prev => ({ ...prev, experienceYears: e.target.value }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Kundenkontakt */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Arbeitest du hauptsächlich im Kundenkontakt?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {customerContactOptions.map((option) => (
                <label key={option} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="customerContact"
                    value={option}
                    checked={formData.customerContact === option}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerContact: e.target.value }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tägliche Aufgaben */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Wenn du magst, kannst du kurz beschreiben, was deine Aufgabe im Alltag ausmacht?
            </h2>
            <textarea
              value={formData.dailyTasks}
              onChange={(e) => setFormData(prev => ({ ...prev, dailyTasks: e.target.value }))}
              placeholder="Optional - hilft uns dabei, deine Fragen noch persönlicher zu gestalten"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Meine Fragen generieren
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 