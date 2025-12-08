# 🔧 E-Mail-Flut Fix

## Problem
Du bekommst alle 15 Minuten Security-E-Mails, obwohl keine neuen Bedrohungen vorhanden sind.

## Ursache
Das Skript `/usr/local/bin/auto-security-response.sh` sendet E-Mails **ohne Deduplizierung**:
- Läuft alle 15 Minuten per Cron
- Prüft alte Log-Einträge (nicht nur aktive Bedrohungen)
- Sendet jedes Mal eine E-Mail, wenn ≥3 "ALERT:" Strings im Log stehen

## Lösung

### Option 1: Automatisch (wenn SSH funktioniert)
```bash
./fix-email-flood.sh
```

### Option 2: Manuell auf Server kopieren

1. **SSH-Verbindung zum Server:**
```bash
ssh root@194.55.13.15
```

2. **Backup erstellen:**
```bash
cp /usr/local/bin/auto-security-response.sh /usr/local/bin/auto-security-response.sh.backup
```

3. **Neue Version erstellen:**
```bash
cat > /usr/local/bin/auto-security-response.sh << 'EOF'
#!/bin/bash
# Automatische Reaktionen auf kritische Security-Alerts
# MIT DEDUPLIZIERUNG - verhindert E-Mail-Flut

LOG_FILE="/var/log/omnireflect-security.log"
ALERT_THRESHOLD=3

# Alert-Historie für Deduplizierung
ALERT_HISTORY_FILE="/tmp/omnireflect-response-alert-history.txt"
touch "$ALERT_HISTORY_FILE"

# Prüfe ob dieser Alert bereits in den letzten 60 Minuten gesendet wurde
is_new_alert() {
    local alert_msg="$1"
    local alert_hash=$(echo "$alert_msg" | md5sum | cut -d' ' -f1)
    local cutoff_time=$(($(date +%s) - 3600))  # 60 Minuten
    
    # Prüfe Historie
    if grep -q "^$alert_hash:" "$ALERT_HISTORY_FILE" 2>/dev/null; then
        local last_sent=$(grep "^$alert_hash:" "$ALERT_HISTORY_FILE" | cut -d: -f2)
        if [ "$last_sent" -ge "$cutoff_time" ]; then
            return 1  # Nicht neu
        fi
    fi
    
    # Alert als gesendet markieren
    echo "$alert_hash:$(date +%s)" >> "$ALERT_HISTORY_FILE"
    # Alte Einträge löschen (älter als 24h)
    awk -v cutoff=$(($(date +%s) - 86400)) -F: '$2 > cutoff' "$ALERT_HISTORY_FILE" > "$ALERT_HISTORY_FILE.tmp" 2>/dev/null
    mv "$ALERT_HISTORY_FILE.tmp" "$ALERT_HISTORY_FILE" 2>/dev/null || true
    
    return 0  # Neu
}

# Prüfe auf kritische Alerts (nur AKTIVE, nicht alte Log-Einträge)
ACTIVE_CRITICAL_ALERTS=0

# Prüfe auf AKTIVE Miner-Prozesse
if ps aux | grep -E 'xmrig|miner|c3pool' | grep -v grep > /dev/null; then
    ACTIVE_CRITICAL_ALERTS=$((ACTIVE_CRITICAL_ALERTS + 1))
fi

# Prüfe auf AKTIVE Backdoor-Prozesse
if ps aux | grep -E '/root/.systemd-utils/ntpclient' | grep -v grep > /dev/null; then
    ACTIVE_CRITICAL_ALERTS=$((ACTIVE_CRITICAL_ALERTS + 1))
fi

# Prüfe auf AKTUELLE kritische Alerts in den letzten 5 Minuten (nicht alle alten)
if [ -f "$LOG_FILE" ]; then
    RECENT_CRITICAL=$(grep "ALERT:" "$LOG_FILE" 2>/dev/null | grep -E "Miner|Backdoor|PM2.*läuft nicht|Nginx.*läuft nicht" | tail -5 | wc -l || echo "0")
    if [ "$RECENT_CRITICAL" -gt 0 ]; then
        ACTIVE_CRITICAL_ALERTS=$((ACTIVE_CRITICAL_ALERTS + RECENT_CRITICAL))
    fi
fi

# NUR bei AKTIVEN kritischen Bedrohungen handeln
if [ "$ACTIVE_CRITICAL_ALERTS" -ge "$ALERT_THRESHOLD" ]; then
    ALERT_MSG="Critical Security Threat: $ACTIVE_CRITICAL_ALERTS aktive Bedrohungen erkannt. Automatische Maßnahmen wurden ergriffen."
    
    # Nur senden wenn NEU (Deduplizierung)
    if is_new_alert "$ALERT_MSG"; then
        # Automatische Maßnahmen:
        # 1. Alle verdächtigen Prozesse stoppen
        pkill -9 xmrig 2>/dev/null || true
        pkill -9 -f "/root/.systemd-utils/ntpclient" 2>/dev/null || true
        
        # 2. Verdächtige Dateien isolieren
        find /var/www/omnireflect -name 'xmrig*' -o -name 'miner*' 2>/dev/null | while read file; do
            mv "$file" "$file.quarantine.$(date +%s)" 2>/dev/null || true
        done
        
        # 3. Alert senden (NUR wenn neu)
        if [ -f "/usr/local/bin/send-security-alert.sh" ]; then
            /usr/local/bin/send-security-alert.sh "Critical Security Threat" "$ALERT_MSG" &
        fi
        
        # 4. Log erstellen
        echo "[$(date)] AUTOMATIC RESPONSE: $ACTIVE_CRITICAL_ALERTS active threats detected, actions taken" >> "$LOG_FILE"
    fi
fi
EOF

chmod +x /usr/local/bin/auto-security-response.sh
```

4. **Testen:**
```bash
/usr/local/bin/auto-security-response.sh
```

## Was wurde geändert?

✅ **Deduplizierung:** Max 1 E-Mail pro Alert-Typ pro Stunde  
✅ **Nur aktive Bedrohungen:** Prüft nicht alte Log-Einträge  
✅ **Intelligente Prüfung:** Nur bei echten, aktiven Bedrohungen  
✅ **Keine E-Mail-Flut:** Wiederholte Checks senden keine E-Mails mehr

## Prüfen ob Fix funktioniert

```bash
# Prüfe ob Deduplizierung aktiv ist
grep -A 5 "is_new_alert" /usr/local/bin/auto-security-response.sh

# Prüfe Alert-Historie
cat /tmp/omnireflect-response-alert-history.txt

# Prüfe Logs
tail -20 /var/log/omnireflect-auto-response.log
```

## Erwartetes Verhalten nach Fix

- ✅ **Keine E-Mails** wenn keine neuen Bedrohungen
- ✅ **1 E-Mail pro Stunde** bei derselben Bedrohung
- ✅ **Sofortige E-Mail** bei neuer, kritischer Bedrohung
- ✅ **Keine E-Mail-Flut** mehr

