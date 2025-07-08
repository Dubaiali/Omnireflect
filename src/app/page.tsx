import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Reflexio
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            KI-gestützte Vorbereitung für dein Mitarbeiterjahresgespräch
          </p>
          
          <div className="space-y-4">
            <Link 
              href="/login"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              Mitarbeiter:in Login
            </Link>
            
            <Link 
              href="/admin"
              className="block w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              Admin-Bereich
            </Link>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Datenschutz & Sicherheit</h3>
            <p className="text-sm text-blue-700">
              Deine Daten werden anonymisiert gespeichert und sind nur dir und deiner Führungskraft zugänglich.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
