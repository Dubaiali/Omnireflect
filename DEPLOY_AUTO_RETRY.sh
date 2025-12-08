#!/bin/bash
set -e
SERVER="root@194.55.13.15"
MAX_RETRIES=10
RETRY_DELAY=30

echo "═══════════════════════════════════════════════════════"
echo "  AUTOMATISCHES Deployment - E-Mail-Flut Fix"
echo "═══════════════════════════════════════════════════════"
echo ""

ssh_with_retry() {
    local cmd="$1"
    local retry=0
    while [ $retry -lt $MAX_RETRIES ]; do
        echo "📡 Versuche Verbindung ($((retry + 1))/$MAX_RETRIES)..."
        if ssh -i ~/.ssh/netcup_key -o ConnectTimeout=15 -o StrictHostKeyChecking=no "$SERVER" "$cmd" 2>&1 || ssh -i ~/.ssh/id_rsa -o ConnectTimeout=15 -o StrictHostKeyChecking=no "$SERVER" "$cmd" 2>&1 || ssh -o ConnectTimeout=15 -o StrictHostKeyChecking=no "$SERVER" "$cmd" 2>&1; then
            return 0
        fi
        retry=$((retry + 1))
        if [ $retry -lt $MAX_RETRIES ]; then
            echo "⚠️  Warte ${RETRY_DELAY}s und versuche erneut..."
            sleep $RETRY_DELAY
        fi
    done
    return 1
}

scp_with_retry() {
    local src="$1"
    local dst="$2"
    local retry=0
    while [ $retry -lt $MAX_RETRIES ]; do
        echo "📤 Versuche Upload ($((retry + 1))/$MAX_RETRIES)..."
        if scp -i ~/.ssh/netcup_key -o ConnectTimeout=15 -o StrictHostKeyChecking=no "$src" "$dst" 2>&1 || scp -i ~/.ssh/id_rsa -o ConnectTimeout=15 -o StrictHostKeyChecking=no "$src" "$dst" 2>&1 || scp -o ConnectTimeout=15 -o StrictHostKeyChecking=no "$src" "$dst" 2>&1; then
            return 0
        fi
        retry=$((retry + 1))
        if [ $retry -lt $MAX_RETRIES ]; then
            echo "⚠️  Warte ${RETRY_DELAY}s und versuche erneut..."
            sleep $RETRY_DELAY
        fi
    done
    return 1
}

if [ ! -f "STOP_EMAILS_SOFORT.sh" ]; then
    echo "❌ STOP_EMAILS_SOFORT.sh nicht gefunden!"
    exit 1
fi

echo "📤 Kopiere Fix-Skript auf Server..."
if ! scp_with_retry "STOP_EMAILS_SOFORT.sh" "$SERVER:/tmp/STOP_EMAILS_SOFORT.sh"; then
    echo "❌ Upload fehlgeschlagen!"
    exit 1
fi

echo "✅ Skript kopiert"
echo "🔧 Führe Fix aus..."

if ! ssh_with_retry "chmod +x /tmp/STOP_EMAILS_SOFORT.sh && /tmp/STOP_EMAILS_SOFORT.sh"; then
    echo "❌ Fix fehlgeschlagen!"
    exit 1
fi

echo ""
echo "✅ Fix erfolgreich installiert!"
