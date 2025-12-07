# 🔔 Webhook-Alerts Setup Guide

## Übersicht

Webhook-Alerts sind eine zuverlässige Alternative zu E-Mails. Sie funktionieren sofort ohne komplexe E-Mail-Konfiguration.

## Schritt 1: Webhook-URL erstellen

### Option A: Slack (Empfohlen)

1. **Gehe zu:** https://api.slack.com/apps
2. **Klicke auf:** "Create New App" → "From scratch"
3. **App-Name:** z.B. "Omnireflect Alerts"
4. **Workspace auswählen**
5. **Links:** "Incoming Webhooks" → "Activate Incoming Webhooks"
6. **"Add New Webhook to Workspace"** → Kanal auswählen
7. **Webhook-URL kopieren** (sieht aus wie: `https://hooks.slack.com/services/...`)

### Option B: Discord

1. **Kanal öffnen** → Rechtsklick → "Kanal bearbeiten"
2. **Integrationen** → "Webhooks" → "Neuer Webhook"
3. **Webhook-Name:** z.B. "Omnireflect Security"
4. **Kanal auswählen**
5. **"Webhook-URL kopieren"** klicken
6. **Webhook-URL kopieren** (sieht aus wie: `https://discord.com/api/webhooks/...`)

### Option C: Telegram

1. **@BotFather aufrufen** in Telegram
2. **`/newbot`** senden
3. **Bot-Namen eingeben**
4. **Bot-Username eingeben**
5. **Token erhalten**
6. **Webhook-URL erstellen:** `https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<CHAT_ID>`

---

## Schritt 2: Webhook auf Server konfigurieren

```bash
ssh root@194.55.13.15
cd /var/www/omnireflect
./setup-webhook-alerts.sh
```

**Wenn abgefragt:**
- Webhook-URL eingeben (die du in Schritt 1 kopiert hast)
- Enter drücken

**Das Skript:**
- Erstellt `/usr/local/bin/send-webhook-alert.sh`
- Integriert Webhook in Security-Monitoring
- Sendet Test-Webhook

---

## Schritt 3: Testen

```bash
# Test-Webhook senden
/usr/local/bin/send-webhook-alert.sh "Test Alert" "Dies ist ein Test-Alert vom Omnireflect Security System"
```

**Erwartetes Ergebnis:**
- Nachricht erscheint in deinem Slack/Discord/Telegram-Kanal

---

## Was wird überwacht?

Du erhältst Webhook-Alerts bei:

- ✅ Miner-Prozesse gefunden
- ✅ Backdoor-Prozesse gefunden
- ✅ Verdächtige Dateien gefunden
- ✅ SSH-Brute-Force-Angriffe (Fail2ban)
- ✅ Datei-Änderungen
- ✅ PM2/Nginx-Ausfälle
- ✅ Kritische Security-Alerts

---

## Webhook-Format

Die Alerts werden als strukturierte Nachrichten gesendet:

**Slack/Discord:**
```json
{
  "embeds": [{
    "title": "🔒 Omnireflect Security Alert",
    "description": "Alert-Details",
    "fields": [
      {"name": "Server", "value": "hostname"},
      {"name": "IP", "value": "194.55.13.15"},
      {"name": "Zeit", "value": "2025-12-07 18:00:00"}
    ]
  }]
}
```

---

## Troubleshooting

### Webhook funktioniert nicht?

```bash
# Webhook-URL prüfen
cat /usr/local/bin/send-webhook-alert.sh | grep WEBHOOK_URL

# Manuell testen
curl -X POST "DEINE_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text":"Test"}'
```

### Webhook-URL ändern?

```bash
# Setup erneut ausführen
./setup-webhook-alerts.sh
# Neue URL eingeben
```

### Webhook-Logs prüfen?

```bash
tail -f /var/log/omnireflect-webhook-alerts.log
```

---

## Vorteile von Webhook-Alerts

✅ **Sofortige Benachrichtigungen** - Keine Verzögerung  
✅ **Zuverlässig** - Keine Spam-Filter  
✅ **Einfach** - Keine E-Mail-Konfiguration  
✅ **Strukturiert** - Schöne Formatierung  
✅ **Mobile** - Benachrichtigungen auf dem Handy  

---

## Vergleich: Webhook vs. E-Mail

| Feature | Webhook | E-Mail |
|---------|---------|--------|
| Setup-Zeit | 2 Minuten | 10+ Minuten |
| Zuverlässigkeit | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Spam-Filter | ❌ Nein | ✅ Ja |
| Mobile | ✅ Ja | ✅ Ja |
| Formatierung | ✅ Schön | ⚠️ Einfach |

**Empfehlung:** Webhook-Alerts für sofortige, zuverlässige Benachrichtigungen!

---

**Fertig!** Du erhältst jetzt Webhook-Alerts bei allen Security-Problemen. 🎉

