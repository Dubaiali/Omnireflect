# Umgebungsvariablen-Konfiguration

## Übersicht

OmniReflect verwendet Umgebungsvariablen für die Konfiguration von Admin- und Mitarbeiter-Credentials. Dies ermöglicht eine sichere und flexible Konfiguration für verschiedene Umgebungen.

## Erforderliche Umgebungsvariablen

### Admin-Credentials
```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password
ADMIN_NAME=Administrator Name
```

### Mitarbeiter-Credentials
```bash
# Mitarbeiter 1
EMPLOYEE1_HASHID=emp_001_abc123def456
EMPLOYEE1_PASSWORD=SecurePassword123!
EMPLOYEE1_NAME=Max Mustermann
EMPLOYEE1_DEPARTMENT=IT

# Mitarbeiter 2
EMPLOYEE2_HASHID=emp_002_ghi789jkl012
EMPLOYEE2_PASSWORD=AnotherSecurePassword456!
EMPLOYEE2_NAME=Anna Schmidt
EMPLOYEE2_DEPARTMENT=Marketing

# Weitere Mitarbeiter...
EMPLOYEE3_HASHID=emp_003_mno345pqr678
EMPLOYEE3_PASSWORD=ThirdSecurePassword789!
EMPLOYEE3_NAME=Peter Müller
EMPLOYEE3_DEPARTMENT=Vertrieb
```

## Setup-Anweisungen

### 1. Lokale Entwicklung (.env.local)

Erstelle eine `.env.local` Datei im Projektroot:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Security Configuration
PASSWORD_SALT=OmniReflect2024_LocalDev_Salt
JWT_SECRET=OmniReflect2024_LocalDev_JWT_Secret
ENCRYPTION_KEY=OmniReflect2024_LocalDev_Encryption_Key

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=OmniAdmin2024_Local!
ADMIN_NAME=Lokaler Administrator

# Employee Credentials
EMPLOYEE1_HASHID=emp_md87yj1f_904c447c80694dc5
EMPLOYEE1_PASSWORD=Tvr39RN%Jg$7
EMPLOYEE1_NAME=Max Mustermann
EMPLOYEE1_DEPARTMENT=IT

EMPLOYEE2_HASHID=emp_md87yj1i_495fdbe7c5212ef9
EMPLOYEE2_PASSWORD=A#7^So8gUV03
EMPLOYEE2_NAME=Anna Schmidt
EMPLOYEE2_DEPARTMENT=Marketing

# Environment
NODE_ENV=development
```

### 2. Produktionsumgebung

Für die Produktion verwende sichere, zufällig generierte Passwörter:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your-production-openai-api-key

# Security Configuration (GENERIERT MIT generate-production-keys.js)
PASSWORD_SALT=your-super-secure-random-salt
JWT_SECRET=your-super-secure-jwt-secret
ENCRYPTION_KEY=your-super-secure-encryption-key

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-super-secure-admin-password
ADMIN_NAME=Produktions-Administrator

# Employee Credentials
EMPLOYEE1_HASHID=emp_prod_001_abc123def456
EMPLOYEE1_PASSWORD=YourSecurePassword123!
EMPLOYEE1_NAME=Max Mustermann
EMPLOYEE1_DEPARTMENT=IT

EMPLOYEE2_HASHID=emp_prod_002_ghi789jkl012
EMPLOYEE2_PASSWORD=AnotherSecurePassword456!
EMPLOYEE2_NAME=Anna Schmidt
EMPLOYEE2_DEPARTMENT=Marketing

# Environment
NODE_ENV=production
```

## Sicherheitsrichtlinien

### Passwort-Anforderungen
- **Admin-Passwörter:** Mindestens 16 Zeichen, Sonderzeichen, Zahlen, Groß-/Kleinschreibung
- **Mitarbeiter-Passwörter:** Mindestens 12 Zeichen, Sonderzeichen, Zahlen, Groß-/Kleinschreibung
- **Hash-IDs:** Eindeutig, mindestens 8 Zeichen, alphanumerisch mit Unterstrichen

### Sichere Generierung
```bash
# Beispiel für sichere Passwort-Generierung
openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
```

## Hash-ID Format

Das empfohlene Format für Hash-IDs:
```
emp_{prefix}_{unique_id}
```

Beispiele:
- `emp_prod_001_abc123def456`
- `emp_dev_001_xyz789uvw012`
- `emp_test_001_mno345pqr678`

## Troubleshooting

### Keine Admin-Credentials gefunden
Wenn keine Admin-Credentials geladen werden:
1. Prüfe ob `ADMIN_USERNAME` und `ADMIN_PASSWORD` in der `.env.local` gesetzt sind
2. Stelle sicher, dass die Datei im Projektroot liegt
3. Starte den Development-Server neu

### Keine Mitarbeiter gefunden
Wenn keine Mitarbeiter geladen werden:
1. Prüfe ob mindestens `EMPLOYEE1_HASHID` und `EMPLOYEE1_PASSWORD` gesetzt sind
2. Stelle sicher, dass die Umgebungsvariablen korrekt formatiert sind
3. Prüfe die Konsole für Debug-Ausgaben

### Debug-Ausgaben
Die Anwendung gibt Debug-Informationen aus:
- `Lade X Mitarbeiter aus Umgebungsvariablen`
- `Lade Admin-Credentials aus Umgebungsvariablen`
- `Keine Umgebungsvariablen gefunden, verwende Standard-Mitarbeiter`

## Migration von der alten Konfiguration

Die alte Konfiguration mit hartcodierten Credentials wurde entfernt. Um zu migrieren:

1. Erstelle eine `.env.local` Datei
2. Kopiere die Admin- und Mitarbeiter-Credentials in die Umgebungsvariablen
3. Starte die Anwendung neu

Die Anwendung lädt automatisch die Credentials aus den Umgebungsvariablen. 