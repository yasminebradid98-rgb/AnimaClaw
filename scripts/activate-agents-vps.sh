#!/bin/bash
# Activate all Anima OS agents on the VPS
# Run via Hostinger web terminal:
#   bash /root/AnimaClaw/scripts/activate-agents-vps.sh

set -e

PROJECT_DIR="/root/AnimaClaw"
DASHBOARD_DIR="$PROJECT_DIR/dashboard"
ENV_FILE="$DASHBOARD_DIR/.env"

echo "=== Anima OS — Activating agents ==="
echo ""
echo "  ⬡  NEXUS    — The convergence point (φ=1.0)"
echo "  ⚒  FORGE    — The builder/executor  (φ=0.618)"
echo "  🛡  AEGIS    — The shield/coordinator (φ=0.382)"
echo "  ◈  AKASHA   — The cosmic memory field (φ=0.146)"
echo "  ∞  MORPHEUS — The transformer/adaptor (φ=0.236)"
echo "  👁  ARGUS    — The all-seeing guardian (φ=0.146)"
echo ""

# 1. Pull latest code
echo "→ Pulling latest code..."
cd "$PROJECT_DIR"
git pull origin main

# 2. Set ANIMA_OS_CONFIG_PATH so the dashboard reads the real openclaw.json
if ! grep -q "ANIMA_OS_CONFIG_PATH" "$ENV_FILE" 2>/dev/null; then
    echo "" >> "$ENV_FILE"
    echo "# Anima OS project config (holds real agent definitions)" >> "$ENV_FILE"
    echo "ANIMA_OS_CONFIG_PATH=/root/AnimaClaw/openclaw.json" >> "$ENV_FILE"
    echo "→ Added ANIMA_OS_CONFIG_PATH to .env"
else
    # Update existing value
    sed -i "s|ANIMA_OS_CONFIG_PATH=.*|ANIMA_OS_CONFIG_PATH=/root/AnimaClaw/openclaw.json|" "$ENV_FILE"
    echo "→ ANIMA_OS_CONFIG_PATH confirmed in .env"
fi

# 3. Install + build
echo "→ Installing dependencies..."
cd "$DASHBOARD_DIR"
pnpm install --frozen-lockfile

echo "→ Building dashboard..."
pnpm build

# 4. Restart PM2 — triggers seedDefaultAgents on first boot → creates all 6 agents in DB
echo "→ Restarting PM2..."
pm2 restart animaclaw 2>/dev/null || pm2 restart all

sleep 6

# 5. Trigger live agent sync (reads openclaw.json → upserts agents into DB)
API_KEY=$(grep "^API_KEY=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2-)
if [ -n "$API_KEY" ]; then
    echo "→ Triggering agent sync..."
    RESULT=$(curl -s -X POST "http://localhost:3000/api/agents/sync" \
        -H "x-api-key: $API_KEY" \
        -H "Content-Type: application/json")
    echo "  Sync result: $RESULT"
else
    echo "  (API_KEY not set — agents will be seeded on next restart automatically)"
fi

echo ""
echo "✅ All Anima OS agents activated!"
echo "   Visit https://animaos.ketami.net → Agents panel"
