# 🚀 OmniReflect Deployment Guide

## 📋 Sicherheitscheckliste vor Deployment

### ✅ Kritische Sicherheitsmaßnahmen

- [ ] **Umgebungsvariablen konfiguriert**
  - [ ] `OPENAI_API_KEY` gesetzt
  - [ ] `PASSWORD_SALT` generiert (mindestens 32 Zeichen)
  - [ ] `ADMIN_USERNAME` und `ADMIN_PASSWORD` geändert
  - [ ] `HASH_LIST` mit echten Nutzerdaten konfiguriert

- [ ] **HTTPS erzwingen**
  - [ ] SSL-Zertifikat installiert
  - [ ] HTTP zu HTTPS Redirect konfiguriert
  - [ ] HSTS Header aktiviert

- [ ] **Rate Limiting aktiviert**
  - [ ] API-Routes geschützt
  - [ ] Limits für Produktion angepasst

- [ ] **Session-Management**
  - [ ] Sichere Cookies konfiguriert
  - [ ] Session-Timeout gesetzt
  - [ ] CSRF-Schutz aktiviert

## 🔧 Deployment-Schritte

### 1. Umgebungsvariablen konfigurieren

```bash
# .env.local erstellen
cp env.example .env.local

# Sichere Werte generieren
PASSWORD_SALT=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)
```

### 2. Produktions-Build erstellen

```bash
npm run build
npm start
```

### 3. Vercel Deployment (Empfohlen)

```bash
# Vercel CLI installieren
npm i -g vercel

# Projekt deployen
vercel --prod

# Umgebungsvariablen in Vercel Dashboard setzen
```

### 4. Alternative: Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## 🛡️ Sicherheitskonfiguration

### Firewall-Regeln
```bash
# Nur HTTPS (443) und SSH (22) erlauben
ufw allow 443
ufw allow 22
ufw enable
```

### Nginx-Konfiguration
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 Monitoring & Logging

### Logging-Konfiguration
```typescript
// src/lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, meta)
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error)
  },
  security: (message: string, meta?: any) => {
    console.warn(`[SECURITY] ${new Date().toISOString()}: ${message}`, meta)
  }
}
```

### Health Check Endpoint
```typescript
// src/app/api/health/route.ts
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  })
}
```

## 🔍 Sicherheitsaudit

### Automatisierte Tests
```bash
# Sicherheitsaudit
npm audit

# Dependency-Check
npm audit fix

# Code-Qualität
npm run lint
```

### Manuelle Sicherheitstests
- [ ] SQL-Injection-Tests
- [ ] XSS-Tests
- [ ] CSRF-Tests
- [ ] Rate-Limiting-Tests
- [ ] Session-Management-Tests

## 📈 Performance-Optimierung

### Caching-Strategie
```typescript
// src/lib/cache.ts
const cache = new Map()

export function getCachedData(key: string) {
  const item = cache.get(key)
  if (item && Date.now() - item.timestamp < 5 * 60 * 1000) {
    return item.data
  }
  return null
}
```

### CDN-Konfiguration
- Statische Assets über CDN
- API-Responses cachen
- Bilder optimieren

## 🚨 Incident Response

### Notfall-Kontakte
- System-Administrator: [Kontakt]
- Security-Team: [Kontakt]
- OpenAI-Support: [Kontakt]

### Rollback-Plan
```bash
# Schneller Rollback
git checkout previous-version
npm run build
npm start
```

## 📚 Wartung & Updates

### Regelmäßige Tasks
- [ ] Dependencies aktualisieren (wöchentlich)
- [ ] Security-Patches installieren (sofort)
- [ ] Logs überprüfen (täglich)
- [ ] Backup testen (wöchentlich)
- [ ] Performance-Monitoring (kontinuierlich)

### Update-Prozess
```bash
# Staging-Umgebung testen
git checkout staging
npm install
npm run build
npm run test

# Produktion updaten
git checkout main
git pull origin main
npm install
npm run build
npm start
```

## 🔐 Compliance & Datenschutz

### DSGVO-Compliance
- [ ] Datenschutzerklärung aktualisiert
- [ ] Cookie-Consent implementiert
- [ ] Datenlöschung automatisiert
- [ ] Audit-Logs aktiviert

### Backup-Strategie
```bash
# Automatisches Backup
0 2 * * * /usr/local/bin/backup-omnireflect.sh

# Backup-Script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /backups/omnireflect_$DATE.tar.gz /app/data
```

---

**⚠️ WICHTIG:** Diese Checkliste vor jedem Deployment durchgehen! 