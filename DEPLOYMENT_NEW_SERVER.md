# 🚀 Deployment auf neuem Server

Dein alter Server wurde gekündigt. So setzt du alles neu auf:

## **Schritt 1: Neuen VPS erstellen**

### **Option A: Netcup (günstig, deutsch)**

1. Gehe zu: https://www.netcup.de/kontoverwaltung/einstellungen/
2. **VPS bestellen:** https://www.netcup.de/bestellen/produkt.php?produkt=1716
3. Wähle:
   - **VPS 8000 G10s** oder größer (mind. 8GB RAM)
   - **Ubuntu 22.04 LTS** oder **24.04 LTS**
   - **SSH Key hinzufügen** (optional)
4. Klicke: **"Bestellen"**

Nach Bestellung:
- **IP-Adresse:** findest du im Netcup Control Panel unter "Server-Verwaltung" → "VPS"
- **Root-Passwort:** wird per E-Mail verschickt

### **Option B: Hetzner (größer, mehr Performance)**

1. Gehe zu: https://console.hetzner.com
2. Klicke: **"Create Project"** → Projekt erstellen
3. Klicke: **"Add Server"**
4. Wähle:
   - **Ubuntu 24.04 LTS**
   - **Cloud - CCX23** (oder größer)
   - **Frankfurt/Nürnberg**
   - **SSH Key hinzufügen** (deinen Public Key)
5. Klicke: **"Buy & Create"**

## **Schritt 2: SSH-Zugang testen**

```bash
ssh root@[NEUE_IP]
```

Falls du keinen SSH-Key hast:
```bash
ssh root@[NEUE_IP]
# Passwort eingeben (wird bei Server-Erstellung angezeigt)
```

## **Schritt 3: Server-Setup automatisch**

```bash
chmod +x setup-new-server.sh
./setup-new-server.sh
```

Das Skript fordert dich auf:
- IP-Adresse eingeben
- SSH-User eingeben (meist 'root')

Das Skript installiert:
- Node.js 20.x
- PM2
- Nginx
- Certbot (für SSL)
- Firewall-Regeln

## **Schritt 4: .env.production erstellen**

```bash
chmod +x create-env-production.sh
./create-env-production.sh
```

Das Skript fordert dich auf:
- OpenAI API Key
- Admin-Passwort

## **Schritt 5: Deployment-Skript aktualisieren**

Öffne `deploy-production.sh` und ändere Zeile 28:

```bash
SERVER="root@[NEUE_IP]"  # <-- Deine neue IP hier eintragen
```

## **Schritt 6: Deployment ausführen**

```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

Das Skript macht automatisch:
- Code deployen
- Build erstellen
- PM2 konfigurieren
- Nginx konfigurieren
- SSL-Zertifikat erstellen

## **Schritt 7: Domain DNS aktualisieren**

Gehe zu deinem DNS-Provider und ändere den A-Record:

```
reflect.omni-scient.com → [NEUE_IP]
```

Warte 5-10 Minuten, bis DNS propagiert ist.

## **WICHTIG: Daten-Sicherung**

**⚠️ ALTE DATEN SIND WEG!**

Falls du alte Mitarbeiterdaten und Zusammenfassungen hattest, musst du diese manuell neu anlegen über das Admin-Dashboard.

## **Troubleshooting**

### SSH-Verbindung schlägt fehl
```bash
# Prüfe ob Server läuft
ping [NEUE_IP]

# Versuche mit Passwort
ssh root@[NEUE_IP]
```

### Website lädt nicht
```bash
# Prüfe PM2
ssh root@[NEUE_IP] "pm2 status"

# Prüfe Nginx
ssh root@[NEUE_IP] "systemctl status nginx"

# Prüfe Logs
ssh root@[NEUE_IP] "pm2 logs reflect-app"
```

### SSL-Zertifikat fehlt
```bash
ssh root@[NEUE_IP] "certbot --nginx -d reflect.omni-scient.com --non-interactive --agree-tos --email admin@omni-scient.com"
```

### Port ist gesperrt
```bash
ssh root@[NEUE_IP] "sudo ufw status"
ssh root@[NEUE_IP] "sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp"
```

## **Nach dem Deployment**

### Admin-Zugang
- **URL:** https://reflect.omni-scient.com/admin
- **Username:** admin
- **Password:** [Das von dir eingestellte Passwort]

### Erste Schritte
1. Login als Admin
2. Neue Mitarbeiter mit Hash-IDs anlegen
3. Prüfen ob alles funktioniert

### Logs überwachen
```bash
ssh root@[NEUE_IP] "pm2 logs reflect-app --lines 50"
```

---

**Bei Problemen:** Erstelle ein Issue auf GitHub oder kontaktiere mich direkt.

