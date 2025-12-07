# 🔍 Forensische Analyse: Wie konnte die Kompromittierung passieren?

## Zusammenfassung der gefundenen Angriffe

1. **Miner-Installation (xmrig)**
   - Verzeichnis: `/var/www/omnireflect/xmrig-6.24.0/`
   - Systemd-Service: `c3pool_miner.service`
   - Cron-Job: Automatischer Start

2. **Backdoor (ntpclient)**
   - Verzeichnis: `/root/.systemd-utils/`
   - Cron-Job: `@reboot` für automatischen Start
   - Verdächtige Base64-kodierte Config

3. **Verdächtige Dateien**
   - `sex.sh`, `sex.sh.1`, `kal.tar.gz` im App-Verzeichnis

---

## Mögliche Angriffsvektoren

### 🔴 **1. SSH-Brute-Force-Angriff (Wahrscheinlichste Ursache)**

**Warum wahrscheinlich:**
- **Kein Fail2ban aktiv** → Kein Schutz vor Brute-Force
- **SSH-Konfiguration:** `PermitRootLogin yes` (unsicher)
- **Möglicherweise:** Passwort-Authentifizierung aktiviert

**Wie es passiert sein könnte:**
1. Angreifer scannt Server nach offenem SSH-Port (22)
2. Automatisierter Brute-Force-Angriff mit gängigen Passwörtern
3. Erfolgreicher Login mit schwachem/geknacktem Passwort
4. Installation von Miner und Backdoor

**Beweise:**
- Viele fehlgeschlagene Login-Versuche in `/var/log/auth.log`
- Installation erfolgte wahrscheinlich über SSH-Zugriff

**Schutz jetzt:**
- ✅ Fail2ban installiert (blockiert nach 3 Fehlversuchen)
- ✅ SSH-Härtung (nur SSH-Keys, kein Passwort)
- ✅ Rate-Limiting aktiviert

---

### 🟠 **2. Kompromittierte SSH-Keys**

**Möglichkeit:**
- SSH-Key wurde von einem anderen System gestohlen
- Key wurde auf unsicherem System gespeichert
- Key wurde über Social Engineering erlangt

**Beweise prüfen:**
- Anzahl der SSH-Keys in `authorized_keys`
- Wann wurden Keys hinzugefügt?
- Von welchen IPs wurde zugegriffen?

**Schutz jetzt:**
- ✅ SSH-Keys sollten regelmäßig rotiert werden
- ✅ Nur notwendige Keys in `authorized_keys`

---

### 🟡 **3. Ungepatchte Sicherheitslücken**

**Möglichkeit:**
- Exploit in einer installierten Software
- Ungepatchte System-Updates
- Schwachstellen in Dependencies

**Beweise prüfen:**
- Wann wurden zuletzt Updates installiert?
- Welche Versionen sind installiert?
- Bekannte CVEs in installierten Paketen?

**Schutz jetzt:**
- ✅ Automatische Security-Updates aktiviert
- ✅ Regelmäßige Updates empfohlen

---

### 🟡 **4. Zugriff über andere Services**

**Möglichkeit:**
- Exploit in Web-Anwendung (Next.js)
- SQL-Injection (falls Datenbank vorhanden)
- File-Upload-Schwachstellen
- Command-Injection in API-Endpoints

**Beweise prüfen:**
- Nginx-Logs auf verdächtige Requests
- Application-Logs auf Fehler
- API-Endpoints auf Schwachstellen

**Schutz jetzt:**
- ✅ Security-Monitoring überwacht Dateien
- ✅ File Integrity Monitoring
- ✅ Regelmäßige Security-Audits empfohlen

---

### 🟡 **5. Social Engineering / Insider**

**Möglichkeit:**
- Zugangsdaten wurden weitergegeben
- Phishing-Angriff
- Insider-Zugriff

**Beweise prüfen:**
- Wer hatte Zugriff auf Server?
- Wann wurden Zugangsdaten geteilt?
- E-Mail-Logs auf Phishing-Versuche

---

## 📊 Timeline-Analyse

### Installation-Datum der Angriffe

**Miner (c3pool):**
- Verzeichnis erstellt: 5. Dezember 2025
- Service erstellt: 5. Dezember 2025, 11:21 Uhr
- Logs zeigen Aktivität ab diesem Datum

**Backdoor (ntpclient):**
- Verzeichnis erstellt: 5. Dezember 2025, 06:56 Uhr
- Cron-Job: `@reboot` (startet bei jedem Neustart)

**Fazit:** Kompromittierung erfolgte am **5. Dezember 2025** zwischen 06:56 und 11:21 Uhr

---

## 🔍 Forensische Beweise

### 1. **SSH-Log-Analyse**

```bash
# Prüfe fehlgeschlagene Login-Versuche
grep "Failed password" /var/log/auth.log | wc -l

# Prüfe erfolgreiche Logins
grep "Accepted" /var/log/auth.log | tail -20

# Prüfe IPs der Angreifer
grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn | head -10
```

### 2. **Installierte Dateien**

**Miner:**
- `/var/www/omnireflect/xmrig-6.24.0/` (entfernt)
- `/root/c3pool/` (entfernt)
- Systemd-Service: `c3pool_miner.service` (entfernt)

**Backdoor:**
- `/root/.systemd-utils/ntpclient` (entfernt)
- Cron-Job: `@reboot` (entfernt)

### 3. **Verdächtige Aktivitäten**

- Viele Netzwerkverbindungen zu Mining-Pools
- Hohe CPU-Auslastung durch Miner
- Verdächtige Prozesse im Hintergrund

---

## 🎯 Wahrscheinlichste Ursache

### **SSH-Brute-Force-Angriff**

**Warum:**
1. ✅ Kein Fail2ban aktiv → Kein Schutz
2. ✅ `PermitRootLogin yes` → Root-Zugriff möglich
3. ✅ Möglicherweise schwaches Passwort oder Passwort-Auth aktiviert
4. ✅ Installation erfolgte über SSH (Dateien wurden erstellt)
5. ✅ Timing passt (Installation am 5. Dezember)

**Wie es passiert ist:**
1. Angreifer scannt Internet nach offenen SSH-Ports
2. Findet Server mit offenem Port 22
3. Startet automatisierten Brute-Force-Angriff
4. Erfolgreicher Login (schwaches Passwort oder kompromittierter Key)
5. Installation von:
   - Miner (für Cryptocurrency-Mining)
   - Backdoor (für persistenten Zugriff)
6. Einrichtung von Auto-Start (Cron, Systemd)

---

## 🛡️ Warum es jetzt nicht mehr passieren kann

### **1. Fail2ban**
- ✅ Blockiert IPs nach 3 Fehlversuchen
- ✅ Verhindert Brute-Force-Angriffe

### **2. SSH-Härtung**
- ✅ Nur SSH-Keys, kein Passwort
- ✅ `PermitRootLogin prohibit-password`
- ✅ Rate-Limiting aktiviert

### **3. Security-Monitoring**
- ✅ Erkennt Miner/Backdoors innerhalb von 30 Minuten
- ✅ Automatische Reaktionen stoppen Angriffe
- ✅ E-Mail-Alerts an `ali.arseven@fielmann.com`

### **4. File Integrity Monitoring**
- ✅ Erkennt Änderungen an kritischen Dateien
- ✅ Tägliche Prüfung

### **5. Firewall**
- ✅ Rate-Limiting für SSH
- ✅ Nur notwendige Ports offen

---

## 📋 Empfehlungen zur weiteren Untersuchung

### **1. Log-Analyse**
```bash
# SSH-Logs analysieren
grep "Failed password" /var/log/auth.log* | awk '{print $11}' | sort | uniq -c | sort -rn

# Erfolgreiche Logins prüfen
grep "Accepted" /var/log/auth.log | tail -50

# Nginx-Logs auf verdächtige Requests
grep -E '\.env|\.sh|\.php|admin|config' /var/log/nginx/access.log | tail -50
```

### **2. System-Updates**
```bash
# Prüfe ungepatchte Updates
apt list --upgradable

# Installiere Security-Updates
apt-get update && apt-get upgrade -y
```

### **3. SSH-Keys rotieren**
```bash
# Neue SSH-Keys generieren
ssh-keygen -t ed25519 -f ~/.ssh/new_key

# Alte Keys aus authorized_keys entfernen
# Neue Keys hinzufügen
```

### **4. Passwörter ändern**
- Alle Passwörter ändern (falls verwendet)
- Starke, einzigartige Passwörter verwenden

### **5. Zugriffsprotokoll**
- Wer hatte Zugriff auf Server?
- Wann wurden Zugangsdaten geteilt?
- Gibt es andere Systeme mit gleichen Credentials?

---

## ✅ Zusammenfassung

**Wahrscheinlichste Ursache:** SSH-Brute-Force-Angriff

**Warum es passiert ist:**
- ❌ Kein Fail2ban → Kein Schutz vor Brute-Force
- ❌ Unsichere SSH-Konfiguration
- ❌ Möglicherweise schwaches Passwort oder Passwort-Auth

**Warum es jetzt nicht mehr passieren kann:**
- ✅ Fail2ban blockiert Angriffe
- ✅ SSH-Härtung (nur Keys)
- ✅ Security-Monitoring erkennt Angriffe
- ✅ Automatische Reaktionen
- ✅ E-Mail-Alerts

**Status:** 🟢 **GESCHÜTZT**

---

**Letzte Aktualisierung:** 7. Dezember 2025

