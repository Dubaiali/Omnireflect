'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/state/sessionStore'

interface RoleContext {
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
  'Mitarbeiter:in',
  'Abteilungsleitung',
  'Ausbilder:in',
  'Azubi / Lernende:r',
  'Andere'
]

const experienceOptions = [
  '< 6 Monate',
  '6–12 Monate',
  '1–3 Jahre',
  '3–5 Jahre',
  'länger als 5 Jahre',
  'länger als 10 Jahre',
  'länger als 15 Jahre',
  'Freitext'
]

const customerContactOptions = [
  'Ja, täglich',
  'Teilweise / abhängig von Kundenfrequenz',
  'Kaum oder gar nicht'
]

export default function RoleContextForm() {
  const router = useRouter()
  const { saveRoleContext } = useSessionStore()
  
  const [formData, setFormData] = useState<RoleContext>({
    workAreas: [],
    functions: [],
    experienceYears: '',
    customerContact: '',
    dailyTasks: ''
  })
  
  const [otherWorkArea, setOtherWorkArea] = useState('')
  const [otherFunction, setOtherFunction] = useState('')
  const [customExperience, setCustomExperience] = useState('')

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

    const finalExperienceYears = formData.experienceYears === 'Freitext' 
      ? customExperience.trim() 
      : formData.experienceYears

    const roleContext: RoleContext = {
      workAreas: finalWorkAreas,
      functions: finalFunctions,
      experienceYears: finalExperienceYears,
      customerContact: formData.customerContact,
      dailyTasks: formData.dailyTasks
    }

    saveRoleContext(roleContext)
    router.push('/questions')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Mein Profil
            </h1>
            <p className="text-gray-600 text-left">
              Deine Informationen helfen uns dabei, dein Mitarbeiterjahresgespräch ideal nur für dich vorzubereiten. Bitte nimm dir einen Moment Zeit, um die Daten sorgfältig und wahrheitsgemäß auszufüllen - das macht unsere Zusammenarbeit umso wertvoller für dich.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Arbeitsbereich */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                In welchem Bereich arbeitest du aktuell?
              </h2>
              <p className="text-sm text-gray-600 mb-4">Mehrfachauswahl möglich</p>
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
                <div className="mt-4">
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
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Welche Funktion hast du aktuell?
              </h2>
              <p className="text-sm text-gray-600 mb-4">Bitte wähle eine Funktion aus</p>
              <div className="space-y-3">
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
                <div className="mt-4">
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
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Wie lange arbeitest du bereits in dieser Rolle?
              </h2>
              <div className="space-y-3">
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
              {formData.experienceYears === 'Freitext' && (
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="z.B. seit 22 Jahren"
                    value={customExperience}
                    onChange={(e) => setCustomExperience(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Kundenkontakt */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Arbeitest du hauptsächlich im Kundenkontakt?
              </h2>
              <div className="space-y-3">
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
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Wenn du magst, kannst du kurz beschreiben, was deine Aufgabe im Alltag ausmacht?
              </h2>
              <textarea
                value={formData.dailyTasks}
                onChange={(e) => setFormData(prev => ({ ...prev, dailyTasks: e.target.value }))}
                placeholder="Optional - hilft uns dabei, deine Fragen noch persönlicher zu gestalten"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Weiter zur Reflexion
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 