# 📧 E-Mail-Troubleshooting

## Problem: Test-E-Mail kommt nicht an

### Mögliche Ursachen:

1. **Postfix nicht für externen Versand konfiguriert**
   - Postfix läuft nur lokal
   - Kein SMTP-Relay konfiguriert

2. **E-Mail landet im Spam-Ordner**
   - Server hat keine Reputation
   - Keine SPF/DKIM-Records

3. **DNS/MX-Records fehlen**
   - Server kann E-Mails nicht direkt versenden
   - Benötigt SMTP-Relay

4. **Firewall blockiert SMTP-Port**
   - Port 25/587/465 blockiert

---

## Lösungen:

### **Lösung 1: SMTP-Relay einrichten (Empfohlen)**

**Vorteile:**
- Zuverlässig
- E-Mails kommen an
- Keine DNS-Konfiguration nötig

**Anbieter:**
- SendGrid (kostenlos bis 100 E-Mails/Tag)
- Mailgun (kostenlos bis 5.000 E-Mails/Monat)
- Amazon SES (sehr günstig)

**Setup:**
```bash
ssh root@194.55.13.15
cd /var/www/omnireflect
./setup-email-relay.sh
# Option 1 wählen
# SMTP-Daten eingeben
```

---

### **Lösung 2: Webhook-Alerts (Einfachste Lösung)**

**Vorteile:**
- Funktioniert sofort
- Keine E-Mail-Konfiguration nötig
- Zuverlässiger als E-Mails
- Sofortige Benachrichtigungen

**Setup:**
```bash
ssh root@194.55.13.15
cd /var/www/omnireflect
./setup-webhook-alerts.sh
# Webhook-URL eingeben
```

**Webhook-URLs erstellen:**
- **Slack:** https://api.slack.com/messaging/webhooks
- **Discord:** Kanal-Einstellungen → Integrationen → Webhooks
- **Telegram:** Bot erstellen mit @BotFather

---

### **Lösung 3: Postfix für direkten Versand konfigurieren**

**Nachteile:**
- Benötigt DNS/MX-Records
- E-Mails landen oft im Spam
- Weniger zuverlässig

**Setup:**
```bash
ssh root@194.55.13.15
postconf -e "myhostname = reflect.omni-scient.com"
postconf -e "mydomain = omni-scient.com"
postconf -e "myorigin = \$mydomain"
postconf -e "inet_interfaces = loopback-only"
systemctl restart postfix
```

---

## Empfehlung:

**Für sofortige Lösung:** Webhook-Alerts verwenden
- Funktioniert sofort
- Zuverlässiger
- Keine Konfiguration nötig

**Für langfristige Lösung:** SMTP-Relay einrichten
- Professioneller
- E-Mails kommen an
- Gute Reputation

---

## Test:

```bash
# E-Mail testen
echo "Test" | mail -s "Test" ali.arseven@fielmann.com

# Webhook testen
/usr/local/bin/send-webhook-alert.sh "Test" "Dies ist ein Test"
```

---

**Nächste Schritte:**
1. Prüfe Spam-Ordner
2. Führe `./setup-webhook-alerts.sh` aus (empfohlen)
3. Oder richte SMTP-Relay ein: `./setup-email-relay.sh`

