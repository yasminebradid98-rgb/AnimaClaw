#!/bin/bash
# Activate all Anima OS agents on the VPS
# Run this via the Hostinger web terminal: bash /root/AnimaClaw/scripts/activate-agents-vps.sh

set -e

OPENCLAW_JSON="/root/.openclaw/openclaw.json"
PROJECT_DIR="/root/AnimaClaw"

echo "=== Anima OS — Activating all agents ==="

# 1. Patch openclaw.json to include agent definitions
echo "→ Patching $OPENCLAW_JSON with Anima agents..."
python3 - <<'PYEOF'
import json, os

path = "/root/.openclaw/openclaw.json"

with open(path, "r") as f:
    cfg = json.load(f)

agents = [
    {"id": "claude",    "name": "Claude",    "identity": {"name": "Claude",    "emoji": "🧠", "theme": "cyan"},    "model": {"primary": "claude-opus-4-5"}},
    {"id": "kimi",      "name": "Kimi",      "identity": {"name": "Kimi",      "emoji": "⚡", "theme": "violet"}, "model": {"primary": "moonshot-v1-8k"}},
    {"id": "deepseek",  "name": "DeepSeek",  "identity": {"name": "DeepSeek",  "emoji": "🔍", "theme": "blue"},   "model": {"primary": "deepseek-chat"}},
    {"id": "gemini",    "name": "Gemini",    "identity": {"name": "Gemini",    "emoji": "💎", "theme": "emerald"}, "model": {"primary": "gemini-pro"}},
    {"id": "openclaw",  "name": "OpenClaw",  "identity": {"name": "OpenClaw",  "emoji": "🦀", "theme": "orange"}, "model": {"primary": "openclaw"}},
    {"id": "hermes",    "name": "Hermes",    "identity": {"name": "Hermes",    "emoji": "🪽", "theme": "amber"},  "model": {"primary": "hermes"}},
    {"id": "codex",     "name": "Codex",     "identity": {"name": "Codex",     "emoji": "💻", "theme": "indigo"}, "model": {"primary": "gpt-4o"}},
]

# Only add agents that aren't already defined
existing_ids = {a.get("id") for a in cfg.get("agents", [])}
new_agents = [a for a in agents if a["id"] not in existing_ids]

if "agents" not in cfg:
    cfg["agents"] = []

cfg["agents"].extend(new_agents)

with open(path, "w") as f:
    json.dump(cfg, f, indent=2)

print(f"  Added {len(new_agents)} agent(s) to openclaw.json")
print(f"  Total agents in config: {len(cfg['agents'])}")
PYEOF

# 2. Pull latest code
echo "→ Pulling latest code..."
cd "$PROJECT_DIR"
git pull origin main

# 3. Install deps + build
echo "→ Installing dependencies..."
cd "$PROJECT_DIR/dashboard"
pnpm install --frozen-lockfile

echo "→ Building dashboard..."
pnpm build

# 4. Restart PM2 (triggers agent seeding on next DB init)
echo "→ Restarting PM2 processes..."
pm2 restart animaclaw 2>/dev/null || pm2 restart all

# 5. Trigger agent sync via API (after 5s warm-up)
sleep 5
API_KEY=$(cat "$PROJECT_DIR/dashboard/.env" 2>/dev/null | grep "^API_KEY=" | cut -d= -f2-)
if [ -n "$API_KEY" ]; then
    echo "→ Triggering agent sync via API..."
    curl -s -X POST "http://localhost:3000/api/agents/sync" \
        -H "x-api-key: $API_KEY" \
        -H "Content-Type: application/json" | python3 -m json.tool 2>/dev/null || true
else
    echo "  (API_KEY not found in .env — skipping sync trigger)"
fi

echo ""
echo "✅ Done! All Anima OS agents have been activated."
echo "   Visit https://animaos.ketami.net → Agents panel to see them."
