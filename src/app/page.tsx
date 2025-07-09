export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #EBF4FF 0%, #E6E6FA 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '1rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#1F2937',
          marginBottom: '1rem'
        }}>
          OmniReflect
        </h1>
        
        <p style={{
          fontSize: '1.125rem',
          color: '#6B7280',
          marginBottom: '2rem'
        }}>
          KI-gestützte Vorbereitung für dein Mitarbeiterjahresgespräch
        </p>
        
        <div style={{ marginBottom: '2rem' }}>
          <a 
            href="/login"
            style={{
              display: 'block',
              width: '100%',
              backgroundColor: '#2563EB',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: '600',
              marginBottom: '1rem'
            }}
          >
            Mitarbeiter:in Login
          </a>
          
          <a 
            href="/admin"
            style={{
              display: 'block',
              width: '100%',
              backgroundColor: '#6B7280',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Admin-Bereich
          </a>
        </div>
        
        <div style={{
          padding: '1rem',
          backgroundColor: '#EBF8FF',
          borderRadius: '0.5rem'
        }}>
          <h3 style={{
            fontWeight: '600',
            color: '#1E40AF',
            marginBottom: '0.5rem'
          }}>
            Datenschutz & Sicherheit
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: '#1E40AF'
          }}>
            Deine Daten werden anonymisiert gespeichert und sind nur dir und deiner Führungskraft zugänglich.
          </p>
        </div>
      </div>
    </div>
  )
}
