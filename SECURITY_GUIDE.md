# 🔒 Omnireflect Security Guide

## Übersicht

Dieser Guide beschreibt alle implementierten Sicherheitsmaßnahmen und wie du Benachrichtigungen erhältst.

## 🛡️ Implementierte Sicherheitsmaßnahmen

### 1. **Fail2ban - SSH-Brute-Force-Schutz**
- **Was es macht**: Blockiert IPs nach fehlgeschlagenen SSH-Login-Versuchen
- **Konfiguration**: `/etc/fail2ban/jail.local`
- **Einstellungen**:
  - Max 3 Fehlversuche → 2 Stunden Ban
  - DDoS-Schutz: Max 10 Versuche in 60 Sekunden → 1 Stunde Ban

### 2. **Security Monitoring**
- **Skript**: `/var/www/omnireflect/monitor-security.sh`
- **Läuft**: Alle 30 Minuten per Cron
- **Überwacht**:
  - Miner-Prozesse (xmrig, c3pool)
  - Verdächtige Dateien
  - Netzwerkverbindungen
  - Systemd-Services
  - PM2/Nginx-Status
- **Logs**: `/var/log/omnireflect-security.log`

### 3. **File Integrity Monitoring**
- **Skript**: `/usr/local/bin/check-file-integrity.sh`
- **Läuft**: Täglich um 03:00 Uhr
- **Überwacht kritische Dateien**:
  - `/etc/ssh/sshd_config`
  - `/etc/passwd`, `/etc/shadow`
  - `.env.production`
  - Nginx-Konfiguration
- **Logs**: `/var/log/omnireflect-integrity.log`

### 4. **Automatische Backups**
- **Skript**: `/var/www/omnireflect/backup-automated.sh`
- **Läuft**: Täglich um 02:00 Uhr
- **Backup-Verzeichnis**: `/var/backups/omnireflect/`
- **Retention**: 30 Tage
- **Logs**: `/var/log/omnireflect-backup.log`

### 5. **Automatische Security-Updates**
- **Paket**: `unattended-upgrades`
- **Konfiguration**: `/etc/apt/apt.conf.d/50unattended-upgrades`
- **Aktualisiert**: Nur Security-Updates automatisch

### 6. **Firewall (UFW)**
- **Status**: Aktiv
- **Offene Ports**: 22 (SSH), 80 (HTTP), 443 (HTTPS)
- **SSH Rate-Limiting**: Aktiviert

## 🔔 Benachrichtigungssysteme

### Option 1: E-Mail-Alerts

**Setup:**
```bash
ssh root@194.55.13.15
cd /var/www/omnireflect
./setup-security-alerts.sh
```

**Konfiguration:**
- E-Mail-Adresse wird beim Setup abgefragt
- Alerts werden an diese Adresse gesendet
- Alert-Skript: `/usr/local/bin/send-security-alert.sh`

**Test:**
```bash
echo "Test Alert" | mail -s "Test" deine-email@example.com
```

### Option 2: Webhook-Alerts (Slack/Discord/Telegram)

**Setup:**
```bash
ssh root@194.55.13.15
cd /var/www/omnireflect
./setup-webhook-alerts.sh
```

**Webhook-URLs erstellen:**
- **Slack**: https://api.slack.com/messaging/webhooks
- **Discord**: Kanal-Einstellungen → Integrationen → Webhooks
- **Telegram**: Bot erstellen mit @BotFather

**Test:**
```bash
/usr/local/bin/send-webhook-alert.sh "Test" "Dies ist ein Test"
```

### Option 3: Kombination (Empfohlen)

Beide Systeme können parallel laufen für Redundanz.

## 🚨 Automatische Reaktionen

Bei kritischen Alerts (≥2 Probleme) werden automatisch Maßnahmen ergriffen:

1. **Verdächtige Prozesse stoppen**
   - xmrig, miner-Prozesse
   - ntpclient-Backdoor

2. **Verdächtige Dateien isolieren**
   - Werden in Quarantäne verschoben

3. **Alert senden**
   - E-Mail + Webhook

**Skript**: `/usr/local/bin/auto-security-response.sh`  
**Läuft**: Alle 15 Minuten per Cron

## 📊 Monitoring & Logs

### Log-Dateien

| Log-Datei | Inhalt | Rotation |
|-----------|--------|----------|
| `/var/log/omnireflect-security.log` | Security-Monitoring | 30 Tage |
| `/var/log/omnireflect-security-alerts.log` | Alert-Historie | 90 Tage |
| `/var/log/omnireflect-backup.log` | Backup-Status | 12 Wochen |
| `/var/log/omnireflect-integrity.log` | File-Integrity-Checks | 30 Tage |
| `/var/log/fail2ban.log` | SSH-Brute-Force-Attacken | System-Standard |

### Logs anzeigen

```bash
# Security-Logs
tail -f /var/log/omnireflect-security.log

# Alerts
tail -f /var/log/omnireflect-security-alerts.log

# Fail2ban-Status
fail2ban-client status sshd

# Backup-Status
tail -f /var/log/omnireflect-backup.log
```

## 🔍 Manuelle Prüfungen

### Security-Check durchführen

```bash
ssh root@194.55.13.15
cd /var/www/omnireflect
./monitor-security.sh
```

### Server-Sicherheit prüfen

```bash
ssh root@194.55.13.15
cd /var/www/omnireflect
./check-server-security.sh
```

### Fail2ban-Status

```bash
fail2ban-client status
fail2ban-client status sshd
```

## 🛠️ Wartung

### Fail2ban-IPs freigeben

```bash
# Alle IPs anzeigen
fail2ban-client status sshd

# IP freigeben
fail2ban-client set sshd unbanip IP_ADRESSE
```

### File Integrity neu initialisieren

```bash
rm /var/lib/omnireflect/file-integrity.db
/usr/local/bin/check-file-integrity.sh
```

### Backup manuell erstellen

```bash
/var/www/omnireflect/backup-automated.sh
```

## 📋 Checkliste: Verhindern von Kompromittierungen

### ✅ Implementiert

- [x] Fail2ban für SSH-Schutz
- [x] Security-Monitoring alle 30 Minuten
- [x] File Integrity Monitoring
- [x] Automatische Backups
- [x] E-Mail/Webhook-Alerts
- [x] Automatische Reaktionen auf Alerts
- [x] Firewall mit Rate-Limiting
- [x] SSH-Härtung (nur Keys, kein Passwort)
- [x] Automatische Security-Updates

### 🔄 Regelmäßige Aufgaben

- [ ] Wöchentlich: Security-Logs prüfen
- [ ] Monatlich: Fail2ban-Status prüfen
- [ ] Monatlich: File Integrity prüfen
- [ ] Quartal: Security-Updates manuell prüfen
- [ ] Quartal: Backup-Wiederherstellung testen

## 🆘 Im Notfall

### Server kompromittiert?

1. **Sofortige Maßnahmen:**
   ```bash
   # Alle verdächtigen Prozesse stoppen
   pkill -9 xmrig
   pkill -9 -f ntpclient
   
   # Firewall verschärfen
   ufw deny 22/tcp
   
   # Monitoring ausführen
   /var/www/omnireflect/monitor-security.sh
   ```

2. **Alert senden:**
   ```bash
   /usr/local/bin/send-security-alert.sh "KRITISCH" "Server möglicherweise kompromittiert!"
   ```

3. **Backup wiederherstellen:**
   ```bash
   # Neuestes Backup finden
   ls -lt /var/backups/omnireflect/ | head -2
   
   # Daten wiederherstellen
   cp -r /var/backups/omnireflect/YYYYMMDD_HHMMSS/data/* /var/www/omnireflect/data/
   ```

## 📞 Support

Bei Fragen oder Problemen:
1. Logs prüfen: `/var/log/omnireflect-*.log`
2. Monitoring ausführen: `./monitor-security.sh`
3. GitHub Issues: https://github.com/Dubaiali/Omnireflect/issues

---

**Letzte Aktualisierung**: 7. Dezember 2025  
**Version**: 1.0

