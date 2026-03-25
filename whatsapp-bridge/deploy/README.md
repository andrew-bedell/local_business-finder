# WhatsApp Bridge — VPS Deployment

Deploy the WhatsApp bridge to a Hetzner (or any Ubuntu/Debian) VPS for 24/7 uptime.

## Requirements

- Ubuntu 22.04+ or Debian 12+
- 1GB+ RAM (Chromium headless uses ~300-400MB)
- 500MB disk for dependencies + session cache
- Outbound HTTPS only (no inbound ports needed)

## First-Time Setup

```bash
# 1. Copy the whatsapp-bridge directory to the VPS
scp -r whatsapp-bridge/ user@your-vps:/tmp/

# 2. SSH in and run setup
ssh user@your-vps
sudo bash /tmp/whatsapp-bridge/deploy/setup.sh

# 3. First-time QR scan (REQUIRED before starting the service)
sudo -u whatsapp node /opt/whatsapp-bridge/index.js

# 4. Scan QR with WhatsApp → Link Device
# 5. Wait for "connected and ready" message
# 6. Ctrl+C to stop

# 7. Start the service
sudo systemctl start whatsapp-bridge
```

## Common Operations

### View logs (live)
```bash
sudo journalctl -u whatsapp-bridge -f
```

### View recent logs
```bash
sudo journalctl -u whatsapp-bridge --since "1 hour ago"
```

### Check status
```bash
sudo systemctl status whatsapp-bridge
```

### Restart
```bash
sudo systemctl restart whatsapp-bridge
```

### Stop
```bash
sudo systemctl stop whatsapp-bridge
```

## Updating the Bridge Code

```bash
# 1. Copy updated files to VPS
scp index.js respond.js db.js match-contact.js package.json user@your-vps:/tmp/

# 2. SSH in and deploy
ssh user@your-vps
sudo systemctl stop whatsapp-bridge
sudo cp /tmp/{index,respond,db,match-contact}.js /opt/whatsapp-bridge/
sudo cp /tmp/package.json /opt/whatsapp-bridge/
cd /opt/whatsapp-bridge && sudo npm install --production --no-audit --no-fund
sudo chown -R whatsapp:whatsapp /opt/whatsapp-bridge
sudo systemctl start whatsapp-bridge
sudo journalctl -u whatsapp-bridge -f
```

## Troubleshooting

### Session expired / QR needed again

WhatsApp sessions expire if the linked phone is offline or if WhatsApp forces a re-link. Signs: logs show QR code output or "auth_failure".

```bash
sudo systemctl stop whatsapp-bridge
sudo rm -rf /opt/whatsapp-bridge/.wwebjs_auth
sudo -u whatsapp node /opt/whatsapp-bridge/index.js
# Scan QR, wait for "connected and ready", Ctrl+C
sudo systemctl start whatsapp-bridge
```

### Chromium crash / out of memory

If the bridge keeps restarting, check memory:

```bash
free -h
sudo journalctl -u whatsapp-bridge --since "10 min ago" --no-pager
```

Chromium needs ~300-400MB. If the VPS is tight on RAM, add swap:

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Edit environment variables

```bash
sudo nano /opt/whatsapp-bridge/.env
sudo systemctl restart whatsapp-bridge
```

### Service won't start

```bash
# Check for config errors
sudo systemd-analyze verify whatsapp-bridge.service

# Try running manually to see the error
sudo -u whatsapp node /opt/whatsapp-bridge/index.js
```

### Puppeteer can't find Chromium

whatsapp-web.js bundles its own Chromium via Puppeteer. If it fails to download during `npm install`, install system Chromium as a fallback:

```bash
sudo apt-get install -y chromium-browser || sudo apt-get install -y chromium
```

Then set the path in `.env`:

```
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```
