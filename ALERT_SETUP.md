# 🔔 Alert-Setup Anleitung

## Schnellstart: Benachrichtigungen einrichten

### Option 1: E-Mail-Alerts (Empfohlen)

```bash
ssh root@194.55.13.15
cd /var/www/omnireflect
./setup-security-alerts.sh
```

**Während des Setups:**
- E-Mail-Adresse eingeben, wenn abgefragt
- Beispiel: `deine-email@example.com`

**Test:**
```bash
echo "Test Alert" | mail -s "Omnireflect Test" deine-email@example.com
```

### Option 2: Webhook-Alerts (Slack/Discord)

**Slack-Webhook erstellen:**
1. Gehe zu: https://api.slack.com/apps
2. Erstelle neue App → "Incoming Webhooks"
3. Webhook-URL kopieren

**Discord-Webhook erstellen:**
1. Kanal-Einstellungen → Integrationen → Webhooks
2. "Neuer Webhook" → URL kopieren

**Setup:**
```bash
ssh root@194.55.13.15
cd /var/www/omnireflect
./setup-webhook-alerts.sh
# Webhook-URL eingeben wenn abgefragt
```

**Test:**
```bash
/usr/local/bin/send-webhook-alert.sh "Test" "Dies ist ein Test-Alert"
```

## Was wird überwacht?

### Automatische Alerts bei:
- ✅ Miner-Prozesse gefunden (xmrig, c3pool)
- ✅ Verdächtige Dateien im App-Verzeichnis
- ✅ Verdächtige Systemd-Services
- ✅ PM2-Anwendung läuft nicht
- ✅ Nginx läuft nicht
- ✅ SSH-Brute-Force-Attacken (Fail2ban)
- ✅ Kritische Dateien wurden geändert

### Monitoring-Zeitplan:
- **Security-Check**: Alle 30 Minuten
- **File Integrity**: Täglich um 03:00 Uhr
- **Backup**: Täglich um 02:00 Uhr
- **Auto-Response**: Alle 15 Minuten (bei kritischen Alerts)

## Logs prüfen

```bash
# Security-Logs
tail -f /var/log/omnireflect-security.log

# Alerts
tail -f /var/log/omnireflect-security-alerts.log

# Fail2ban (SSH-Attacken)
tail -f /var/log/fail2ban.log
fail2ban-client status sshd
```

## Manueller Alert-Test

```bash
# E-Mail-Alert testen
/usr/local/bin/send-security-alert.sh "Test Alert" "Dies ist ein Test"

# Webhook-Alert testen
/usr/local/bin/send-webhook-alert.sh "Test Alert" "Dies ist ein Test"
```

## Wichtige Dateien

| Datei | Zweck |
|-------|-------|
| `/var/www/omnireflect/monitor-security.sh` | Haupt-Monitoring-Skript |
| `/usr/local/bin/send-security-alert.sh` | E-Mail-Alert-Versand |
| `/usr/local/bin/send-webhook-alert.sh` | Webhook-Alert-Versand |
| `/usr/local/bin/auto-security-response.sh` | Automatische Reaktionen |
| `/var/log/omnireflect-security.log` | Security-Logs |

## Troubleshooting

### E-Mails kommen nicht an?
```bash
# Postfix-Status prüfen
systemctl status postfix

# Mail-Log prüfen
tail -f /var/log/mail.log

# Test-Mail senden
echo "Test" | mail -s "Test" deine-email@example.com
```

### Webhook funktioniert nicht?
```bash
# Webhook-URL prüfen
cat /usr/local/bin/send-webhook-alert.sh | grep WEBHOOK_URL

# Manuell testen
curl -X POST "DEINE_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text":"Test"}'
```

## Nächste Schritte

1. ✅ E-Mail oder Webhook einrichten
2. ✅ Test-Alert senden
3. ✅ Monitoring-Logs prüfen
4. ✅ Fail2ban-Status prüfen

**Fertig!** Du erhältst jetzt automatisch Benachrichtigungen bei Sicherheitsproblemen.

