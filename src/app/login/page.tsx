import LoginForm from '@/components/LoginForm'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              OmniReflect
            </h1>
            <p className="text-gray-600">
              Melde dich mit deiner Hash-ID und deinem Passwort an
            </p>
          </div>

          <LoginForm />

          <div className="mt-8 text-center">
            <Link 
              href="/"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Zurück zur Startseite
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 