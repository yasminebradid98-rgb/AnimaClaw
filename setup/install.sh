#!/bin/bash

# ============================================================
# ANIMA OS — One-Command Install Script
# Version: 1.5.0
# Engine: SOLARIS
# Author: Riyad Ketami <riyad@ketami.net>
#
# Usage: cd setup && bash install.sh
# Tested on: Ubuntu 22.04 LTS, macOS 13+
# ============================================================

set -e

# Colors
GOLD='\033[1;33m'
BLUE='\033[1;34m'
GREEN='\033[1;32m'
RED='\033[1;31m'
RESET='\033[0m'

# Constants
PHI="1.618"
PI="3.14159"
REQUIRED_NODE_VERSION=18

print_banner() {
  echo ""
  echo -e "${GOLD}"
  echo "  ╔═══════════════════════════════════════╗"
  echo "  ║                                       ║"
  echo "  ║      ANIMA OS — SOLARIS Installer      ║"
  echo "  ║      The Living Agentic OS             ║"
  echo "  ║      Version 1.3.0                     ║"
  echo "  ║                                       ║"
  echo "  ╚═══════════════════════════════════════╝"
  echo -e "${RESET}"
  echo ""
}

check_command() {
  if ! command -v "$1" &> /dev/null; then
    echo -e "${RED}ERROR: $1 is not installed.${RESET}"
    echo "  Install $1 and run this script again."
    exit 1
  fi
}

print_step() {
  echo -e "\n${BLUE}[$1/8]${RESET} $2"
  echo "  ─────────────────────────────────────"
}

print_success() {
  echo -e "  ${GREEN}✓${RESET} $1"
}

print_fail() {
  echo -e "  ${RED}✗${RESET} $1"
}

# ============================================================
# MAIN
# ============================================================

print_banner

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SETUP_DIR="$PROJECT_ROOT/setup"
DASHBOARD_DIR="$PROJECT_ROOT/dashboard"
ENV_FILE="$PROJECT_ROOT/.env"
ENV_EXAMPLE="$PROJECT_ROOT/.env.example"

# ── STEP 1: Check prerequisites ──
print_step 1 "Checking prerequisites (v1.3.0)"

check_command node
check_command npm
check_command npx

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt "$REQUIRED_NODE_VERSION" ]; then
  echo -e "${RED}ERROR: Node.js v${REQUIRED_NODE_VERSION}+ required. Found v$(node -v).${RESET}"
  exit 1
fi
print_success "Node.js $(node -v)"
print_success "npm $(npm -v)"

# Check for optional tools
if command -v supabase &> /dev/null; then
  print_success "Supabase CLI $(supabase --version 2>/dev/null || echo 'installed')"
  HAS_SUPABASE_CLI=true
else
  echo -e "  ${GOLD}○${RESET} Supabase CLI not found (optional — can run SQL manually)"
  HAS_SUPABASE_CLI=false
fi

# ── STEP 2: Install dependencies ──
print_step 2 "Installing dependencies"

# Setup dependencies
cd "$SETUP_DIR"
if [ ! -f package.json ]; then
  npm init -y --silent > /dev/null 2>&1
fi
npm install discord.js dotenv @supabase/supabase-js --save --silent 2>/dev/null
print_success "Setup dependencies installed"

# Dashboard dependencies
if [ -f "$DASHBOARD_DIR/package.json" ]; then
  cd "$DASHBOARD_DIR"
  npm install --silent 2>/dev/null
  print_success "Dashboard dependencies installed"
else
  echo -e "  ${GOLD}○${RESET} Dashboard package.json not found — skipping"
fi

cd "$SETUP_DIR"

# ── STEP 3: Configure environment ──
print_step 3 "Configuring environment variables"

if [ -f "$ENV_FILE" ]; then
  print_success ".env file already exists"
  echo "  Loading existing configuration..."
else
  if [ -f "$ENV_EXAMPLE" ]; then
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    echo "  Created .env from .env.example"
  else
    touch "$ENV_FILE"
    echo "  Created empty .env file"
  fi

  echo ""
  echo -e "  ${GOLD}Configure your environment variables:${RESET}"
  echo ""

  # Prompt for each required variable
  declare -a VARS=(
    "SUPABASE_URL:Your Supabase project URL (e.g., https://xxx.supabase.co)"
    "SUPABASE_ANON_KEY:Your Supabase anonymous/public key"
    "SUPABASE_SERVICE_KEY:Your Supabase service role key"
    "DISCORD_BOT_TOKEN:Your Discord bot token"
    "DISCORD_GUILD_ID:Your Discord server (guild) ID"
    "TELEGRAM_BOT_TOKEN:Your Telegram bot token (from @BotFather)"
    "TELEGRAM_CHAT_ID:Your Telegram chat ID"
    "OPENROUTER_API_KEY:Your OpenRouter API key"
  )

  for VAR_DEF in "${VARS[@]}"; do
    VAR_NAME="${VAR_DEF%%:*}"
    VAR_DESC="${VAR_DEF#*:}"

    # Check if already set
    if grep -q "^${VAR_NAME}=" "$ENV_FILE" 2>/dev/null; then
      CURRENT=$(grep "^${VAR_NAME}=" "$ENV_FILE" | cut -d= -f2-)
      if [ -n "$CURRENT" ] && [ "$CURRENT" != "''" ] && [ "$CURRENT" != "\"\"" ]; then
        print_success "$VAR_NAME already set"
        continue
      fi
    fi

    echo -e "  ${BLUE}$VAR_DESC${RESET}"
    read -r -p "  $VAR_NAME=" VALUE

    if [ -n "$VALUE" ]; then
      # Remove existing line if present
      if grep -q "^${VAR_NAME}=" "$ENV_FILE" 2>/dev/null; then
        sed -i.bak "/^${VAR_NAME}=/d" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
      fi
      echo "${VAR_NAME}=${VALUE}" >> "$ENV_FILE"
      print_success "$VAR_NAME configured"
    else
      echo -e "  ${GOLD}○${RESET} $VAR_NAME skipped (set later in .env)"
    fi
    echo ""
  done
fi

# ── STEP 4: Run Supabase schema ──
print_step 4 "Setting up Supabase database"

SCHEMA_FILE="$SETUP_DIR/supabase_schema.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
  print_fail "supabase_schema.sql not found"
  exit 1
fi

# Source .env for variables
set -a
source "$ENV_FILE" 2>/dev/null || true
set +a

if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_KEY" ]; then
  # Try running via Supabase REST API using the SQL endpoint
  SUPABASE_DB_URL="${SUPABASE_URL}/rest/v1/"

  if [ "$HAS_SUPABASE_CLI" = true ]; then
    echo "  Running schema via Supabase CLI..."
    supabase db push --db-url "$SUPABASE_URL" < "$SCHEMA_FILE" 2>/dev/null && \
      print_success "Database schema applied" || \
      echo -e "  ${GOLD}○${RESET} CLI push failed — run SQL manually in Supabase dashboard"
  else
    echo -e "  ${GOLD}○${RESET} Supabase CLI not available"
    echo "  To apply the schema:"
    echo "    1. Go to your Supabase dashboard → SQL Editor"
    echo "    2. Paste the contents of setup/supabase_schema.sql"
    echo "    3. Click 'Run'"
    print_success "Schema file ready at setup/supabase_schema.sql"
  fi
else
  echo -e "  ${GOLD}○${RESET} Supabase credentials not configured — skipping"
  echo "  Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env, then run:"
  echo "  supabase db push < setup/supabase_schema.sql"
fi

# ── STEP 5: Set up Discord ──
print_step 5 "Setting up Discord channels"

if [ -n "$DISCORD_BOT_TOKEN" ] && [ -n "$DISCORD_GUILD_ID" ]; then
  echo "  Running discord_setup.js..."
  cd "$SETUP_DIR"
  node discord_setup.js && \
    print_success "Discord channels created" || \
    print_fail "Discord setup failed — check your bot token and guild ID"
else
  echo -e "  ${GOLD}○${RESET} Discord credentials not configured — skipping"
  echo "  Set DISCORD_BOT_TOKEN and DISCORD_GUILD_ID in .env, then run:"
  echo "  node setup/discord_setup.js"
fi

# ── STEP 6: Verify connections ──
print_step 6 "Verifying connections"

cd "$SETUP_DIR"
if [ -f verify.js ]; then
  node verify.js
else
  echo -e "  ${GOLD}○${RESET} verify.js not found — skipping verification"
fi

# ── STEP 7: Start upstream watcher ──
print_step 7 "Starting upstream watcher daemon"

WATCHER_SCRIPT="$PROJECT_ROOT/converter/watch_upstream.sh"
if [ -f "$WATCHER_SCRIPT" ]; then
  bash "$WATCHER_SCRIPT" start 2>/dev/null && \
    print_success "Upstream watcher started (hourly GitHub checks)" || \
    echo -e "  ${GOLD}○${RESET} Watcher failed to start — run manually: bash converter/watch_upstream.sh start"
else
  echo -e "  ${GOLD}○${RESET} watch_upstream.sh not found — skipping (optional)"
fi

# ── STEP 8: Summary ──
print_step 8 "Installation complete"

echo ""
echo -e "${GREEN}"
echo "  ╔═══════════════════════════════════════╗"
echo "  ║                                       ║"
echo "  ║      ANIMA OS — Installation Done      ║"
echo "  ║                                       ║"
echo "  ╚═══════════════════════════════════════╝"
echo -e "${RESET}"
echo ""
echo "  Next steps:"
echo ""
echo "  1. If you haven't already, apply the database schema:"
echo "     → Paste setup/supabase_schema.sql into Supabase SQL Editor"
echo ""
echo "  2. Deploy the dashboard:"
echo "     cd dashboard && npx vercel --prod"
echo ""
echo "  3. Start onboarding:"
echo "     Open SOLARIS.md in your OpenClaw workspace"
echo "     Choose: [1] SPARK  [2] ORACLE  [3] WILD"
echo ""
echo -e "  ${GOLD}φ = $PHI  |  π = $PI  |  e = 2.71828${RESET}"
echo ""
echo "  The organism awaits its mission."
echo ""
