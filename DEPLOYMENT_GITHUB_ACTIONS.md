# GitHub Actions Deployment Setup

## Automatisches Deployment über GitHub Actions

Dieses Repository verwendet GitHub Actions für automatisches Deployment auf den Produktionsserver.

### Setup

1. **GitHub Secrets konfigurieren:**
   - Gehe zu `Settings` > `Secrets and variables` > `Actions`
   - Füge folgende Secrets hinzu:
     - `SERVER_HOST`: `188.68.48.168`
     - `SERVER_USER`: `root`
     - `SERVER_PORT`: `22`
     - `SERVER_SSH_KEY`: Dein privater SSH-Schlüssel für den Server

2. **SSH-Schlüssel generieren (falls noch nicht vorhanden):**
   ```bash
   ssh-keygen -t rsa -b 4096 -C "github-actions@omnireflect"
   ```

3. **Öffentlichen Schlüssel auf Server hinzufügen:**
   ```bash
   ssh root@188.68.48.168 "mkdir -p ~/.ssh && echo 'DEIN_PUBLIC_KEY' >> ~/.ssh/authorized_keys"
   ```

### Deployment-Prozess

Das Deployment wird automatisch ausgelöst bei:
- Push auf den `main` Branch
- Manueller Trigger über GitHub Actions UI

### Workflow-Schritte

1. **Code auschecken** - Lädt den neuesten Code
2. **Node.js Setup** - Installiert Node.js 18
3. **Dependencies installieren** - `npm ci`
4. **Build erstellen** - `npm run build`
5. **Deploy auf Server** - SSH-Verbindung und Deployment-Skript

### Server-Deployment-Skript

```bash
cd /var/www/omnireflect
git pull origin main
npm ci --only=production
npm run build
pm2 restart reflect-app || pm2 start npm --name reflect-app -- start
pm2 save
```

### Monitoring

- **GitHub Actions**: Überwache den Deployment-Status in der Actions-Tab
- **Server-Logs**: `pm2 logs reflect-app`
- **Anwendung**: https://reflect.omni-scient.com

### Rollback

Falls ein Deployment fehlschlägt:
1. Gehe zu GitHub Actions
2. Wähle den vorherigen erfolgreichen Workflow
3. Klicke "Re-run jobs"

### Troubleshooting

**Deployment schlägt fehl:**
- Prüfe GitHub Secrets
- Prüfe SSH-Verbindung
- Prüfe Server-Logs

**Anwendung funktioniert nicht:**
- Prüfe PM2-Status: `pm2 status`
- Prüfe Anwendungs-Logs: `pm2 logs reflect-app`
- Prüfe Nginx-Logs: `tail -f /var/log/nginx/error.log`

### Vorteile des GitHub Actions Deployments

✅ **Automatisiert** - Keine manuellen Schritte nötig
✅ **Sicher** - Verschlüsselte Secrets
✅ **Nachverfolgbar** - Vollständige Deployment-Historie
✅ **Rollback** - Einfaches Zurücksetzen bei Problemen
✅ **Konsistent** - Immer gleicher Deployment-Prozess 