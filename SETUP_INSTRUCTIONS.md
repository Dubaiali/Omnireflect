# 🚀 Server-Setup Anleitung

**Server-IP:** 194.55.13.15  
**User:** root

## SCHRITT 1: SSH-Verbindung testen

Öffne ein neues Terminal-Fenster und führe aus:

```bash
ssh root@194.55.13.15
```

Du wirst nach dem Passwort gefragt (aus der Netcup-E-Mail).

## SCHRITT 2: Server-Setup ausführen

**IM TERMINAL (nicht hier!):**

```bash
cd Omnireflect

# Kopiere das Setup-Skript auf den Server
scp setup-server-auto.sh root@194.55.13.15:~/

# Verbinde dich mit dem Server
ssh root@194.55.13.15

# Führe das Setup aus (auf dem Server)
chmod +x ~/setup-server-auto.sh
./setup-server-auto.sh
```

Oder **MANUELL** auf dem Server:

```bash
# Nach SSH-Login auf dem Server:

# 1. Paketliste aktualisieren
apt-get update

# 2. Tools installieren
apt-get install -y curl git build-essential

# 3. Node.js installieren
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 4. PM2 installieren
npm install -g pm2

# 5. Nginx installieren
apt-get install -y nginx certbot python3-certbot-nginx

# 6. Swap-Space erstellen (für 4GB-Server)
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# 7. Firewall konfigurieren
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Fertig!
node -v
pm2 -v
nginx -v
```

## SCHRITT 3: Back in deinem lokalen Projekt

Nach dem Setup auf dem Server:

```bash
# 1. Erstelle .env.production
./create-env-production.sh

# 2. Deploy die App
./deploy-production.sh
```

## ✅ Setup komplett!

Nach dem Setup läuft die App unter: https://reflect.omni-scient.com

