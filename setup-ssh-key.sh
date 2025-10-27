#!/bin/bash

# SSH-Key auf Server kopieren
# DU MUSST DICH EINMAL MANUELL EINLOGGEN

echo "📋 Kopiere SSH-Key auf Server..."
echo ""
echo "Führe DIESEN Befehl aus (du wirst nach Passwort gefragt):"
echo ""
echo "ssh-copy-id -i ~/.ssh/netcup_key.pub root@194.55.13.15"
echo ""
echo "Dann kannst du dich ohne Passwort einloggen."
echo ""
echo "ODER kopiere diesen Key manuell:"
echo ""
cat ~/.ssh/netcup_key.pub
echo ""

