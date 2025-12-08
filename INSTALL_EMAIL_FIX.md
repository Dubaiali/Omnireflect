# 🔧 E-Mail-Flut Fix Installation

## Problem
Du bekommst alle 15 Minuten Security-E-Mails, obwohl keine neuen Bedrohungen vorhanden sind.

## Lösung
Dieser umfassende Fix behebt das Problem an allen Stellen:

1. ✅ `send-security-alert.sh` - Deduplizierung hinzugefügt
2. ✅ `auto-security-response.sh` - Prüft nur aktive Bedrohungen
3. ✅ `monitor-security.sh` - Problematische Erweiterung entfernt

## Installation

### Schritt 1: SSH zum Server
```bash
ssh root@194.55.13.15
```

### Schritt 2: Ins Projekt-Verzeichnis wechseln
```bash
cd /var/www/omnireflect
```

### Schritt 3: Fix-Skript kopieren

**Option A: Von lokalem Rechner kopieren**
```bash
# Auf deinem lokalen Rechner:
scp fix-email-flood-complete.sh root@194.55.13.15:/var/www/omnireflect/
```

**Option B: Skript direkt auf Server erstellen**
```bash
# Auf dem Server, kopiere den Inhalt von fix-email-flood-complete.sh
# Oder lade es von GitHub herunter
```

### Schritt 4: Fix ausführen
```bash
chmod +x fix-email-flood-complete.sh
./fix-email-flood-complete.sh
```

## Was wird geändert?

### 1. send-security-alert.sh
- **Vorher:** Sendet E-Mail bei jedem Aufruf
- **Nachher:** Deduplizierung - max. 1 E-Mail pro Alert pro Stunde

### 2. auto-security-response.sh
- **Vorher:** Zählt alle "ALERT:" Einträge im Log (auch alte)
- **Nachher:** Prüft nur AKTIVE Bedrohungen mit Deduplizierung

### 3. monitor-security.sh
- **Vorher:** Problematische Erweiterung sendet E-Mails ohne Deduplizierung
- **Nachher:** Erweiterung entfernt, nutzt eigene Deduplizierung

## Erwartetes Verhalten nach Fix

✅ **Keine E-Mails** wenn keine neuen Bedrohungen  
✅ **Max 1 E-Mail pro Stunde** bei derselben Bedrohung  
✅ **Sofortige E-Mail** nur bei neuer, kritischer Bedrohung  
✅ **Anwendung bleibt stabil** - keine Funktionsänderungen

## Prüfen ob Fix funktioniert

```bash
# Prüfe Deduplizierung in send-security-alert.sh
grep -q "ALERT_HISTORY_FILE" /usr/local/bin/send-security-alert.sh && echo "✅ Deduplizierung aktiv" || echo "❌ Nicht gefunden"

# Prüfe auto-security-response.sh
grep -q "is_new_alert" /usr/local/bin/auto-security-response.sh && echo "✅ Deduplizierung aktiv" || echo "❌ Nicht gefunden"

# Prüfe Cron-Jobs
crontab -l | grep -E "auto-security-response|monitor-security"

# Prüfe Alert-Historie
cat /tmp/omnireflect-*-alert-history.txt
```

## Falls weiterhin E-Mails kommen

1. **Prüfe Logs:**
   ```bash
   tail -50 /var/log/omnireflect-security.log
   ```

2. **Prüfe ob andere Skripte E-Mails senden:**
   ```bash
   grep -r "send-security-alert\|mail -s" /usr/local/bin/ /var/www/omnireflect/*.sh
   ```

3. **Prüfe Cron-Jobs:**
   ```bash
   crontab -l
   ```

4. **Teste manuell:**
   ```bash
   # Sollte keine E-Mail senden (wenn bereits gesendet)
   /usr/local/bin/send-security-alert.sh "Test" "Test Alert"
   # Warte 1 Minute, dann nochmal - sollte wieder keine senden
   /usr/local/bin/send-security-alert.sh "Test" "Test Alert"
   ```

## Backup wiederherstellen (falls nötig)

```bash
# Finde Backups
ls -la /usr/local/bin/*.backup.*
ls -la /var/www/omnireflect/*.backup.*

# Wiederherstellen (Beispiel)
cp /usr/local/bin/send-security-alert.sh.backup.20241208_143000 /usr/local/bin/send-security-alert.sh
chmod +x /usr/local/bin/send-security-alert.sh
```
