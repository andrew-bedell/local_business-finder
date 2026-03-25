#!/usr/bin/env bash
# WhatsApp Bridge — One-time VPS Setup Script
# Tested on: Ubuntu 22.04 / 24.04 LTS, Debian 12
#
# Usage:
#   1. scp this entire whatsapp-bridge/ directory to the VPS
#   2. ssh into the VPS
#   3. sudo bash whatsapp-bridge/deploy/setup.sh
#   4. Do the first-time QR scan (see instructions at the end)

set -euo pipefail

# ── Must run as root ──

if [ "$(id -u)" -ne 0 ]; then
  echo "Error: This script must be run as root (use sudo)."
  exit 1
fi

BRIDGE_DIR="/opt/whatsapp-bridge"
SERVICE_USER="whatsapp"

echo "=== WhatsApp Bridge — VPS Setup ==="
echo ""

# ── Step 1: Install Node.js 20 LTS ──

if command -v node &>/dev/null && node -v | grep -q "^v20\|^v22"; then
  echo "[✓] Node.js $(node -v) already installed"
else
  echo "[1/6] Installing Node.js 20 LTS..."
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg 2>/dev/null
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list
  apt-get update -qq
  apt-get install -y -qq nodejs
  echo "[✓] Node.js $(node -v) installed"
fi

# ── Step 2: Install Chromium dependencies ──

echo "[2/6] Installing Chromium dependencies for Puppeteer..."
apt-get install -y -qq \
  chromium-browser 2>/dev/null || apt-get install -y -qq chromium 2>/dev/null || true
apt-get install -y -qq \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libpango-1.0-0 \
  libcairo2 \
  libasound2 \
  libxshmfence1 \
  fonts-liberation \
  libappindicator3-1 2>/dev/null || true
echo "[✓] Chromium dependencies installed"

# ── Step 3: Create dedicated user ──

if id "$SERVICE_USER" &>/dev/null; then
  echo "[✓] User '$SERVICE_USER' already exists"
else
  echo "[3/6] Creating system user '$SERVICE_USER'..."
  useradd --system --shell /usr/sbin/nologin --home-dir "$BRIDGE_DIR" "$SERVICE_USER"
  echo "[✓] User '$SERVICE_USER' created"
fi

# ── Step 4: Set up working directory ──

echo "[4/6] Setting up $BRIDGE_DIR..."
mkdir -p "$BRIDGE_DIR"

# Determine where the source files are (script's parent directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")"

# Copy application files
echo "  Copying bridge files from $SOURCE_DIR..."
cp "$SOURCE_DIR/index.js" "$BRIDGE_DIR/"
cp "$SOURCE_DIR/respond.js" "$BRIDGE_DIR/"
cp "$SOURCE_DIR/db.js" "$BRIDGE_DIR/"
cp "$SOURCE_DIR/match-contact.js" "$BRIDGE_DIR/"
cp "$SOURCE_DIR/package.json" "$BRIDGE_DIR/"
cp "$SOURCE_DIR/package-lock.json" "$BRIDGE_DIR/" 2>/dev/null || true

# Install dependencies
echo "  Running npm install..."
cd "$BRIDGE_DIR"
npm install --production --no-audit --no-fund 2>&1 | tail -1
echo "[✓] Application files installed to $BRIDGE_DIR"

# ── Step 5: Configure environment ──

if [ -f "$BRIDGE_DIR/.env" ]; then
  echo "[✓] .env file already exists — skipping"
  echo "    Edit with: sudo nano $BRIDGE_DIR/.env"
else
  echo "[5/6] Configuring environment variables..."
  echo ""

  read -rp "  SUPABASE_URL [https://xagfwyknlutmmtfufbfi.supabase.co]: " SUPABASE_URL
  SUPABASE_URL="${SUPABASE_URL:-https://xagfwyknlutmmtfufbfi.supabase.co}"

  read -rp "  SUPABASE_SECRET_KEY: " SUPABASE_SECRET_KEY
  if [ -z "$SUPABASE_SECRET_KEY" ]; then
    echo "  Warning: SUPABASE_SECRET_KEY is empty — you'll need to set it later."
  fi

  read -rp "  ANTHROPIC_API_KEY: " ANTHROPIC_API_KEY
  if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "  Warning: ANTHROPIC_API_KEY is empty — you'll need to set it later."
  fi

  cat > "$BRIDGE_DIR/.env" <<EOF
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SECRET_KEY=$SUPABASE_SECRET_KEY
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
EOF

  chmod 600 "$BRIDGE_DIR/.env"
  echo "[✓] .env written to $BRIDGE_DIR/.env"
fi

# ── Step 6: Install systemd service ──

echo "[6/6] Installing systemd service..."
cp "$SCRIPT_DIR/whatsapp-bridge.service" /etc/systemd/system/whatsapp-bridge.service
systemctl daemon-reload
systemctl enable whatsapp-bridge
echo "[✓] Service installed and enabled"

# ── Set ownership ──

chown -R "$SERVICE_USER":"$SERVICE_USER" "$BRIDGE_DIR"

# ── Done ──

echo ""
echo "========================================="
echo "  Setup complete!"
echo "========================================="
echo ""
echo "NEXT STEP: First-time QR code scan"
echo ""
echo "  The WhatsApp session needs a one-time QR scan."
echo "  Run this manually (do NOT start the service yet):"
echo ""
echo "    sudo -u whatsapp node $BRIDGE_DIR/index.js"
echo ""
echo "  1. Scan the QR code with WhatsApp → Link Device"
echo "  2. Wait for 'connected and ready' message"
echo "  3. Press Ctrl+C to stop"
echo ""
echo "  Then start the service:"
echo ""
echo "    sudo systemctl start whatsapp-bridge"
echo "    sudo systemctl status whatsapp-bridge"
echo "    sudo journalctl -u whatsapp-bridge -f"
echo ""
