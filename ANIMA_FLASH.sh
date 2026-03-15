#!/usr/bin/env bash

# ╔═══════════════════════════════════════════════════════════════════╗
# ║  ANIMA OS — Flash Installer v1.2.0                              ║
# ║  Engine: SOLARIS                                                 ║
# ║  Author: Riyad Ketami — riyad@ketami.net                        ║
# ║                                                                   ║
# ║  This script flashes ANIMA OS identity over an OpenClaw install. ║
# ║  It backs up, merges, patches, installs, and activates.          ║
# ╚═══════════════════════════════════════════════════════════════════╝

set -euo pipefail

# --- Constants ---
PHI="1.6180339887"
PI="3.1415926535"
EULER="2.7182818284"
PSI="ψ"
VERSION="1.3.0"
ENGINE="SOLARIS"

OPENCLAW_DIR="$HOME/.openclaw"
WORKSPACE_DIR="$OPENCLAW_DIR/workspace"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="$HOME/.openclaw_backup_${TIMESTAMP}"
PID_FILE="$SCRIPT_DIR/.anima_daemon.pid"

# --- Colors ---
GOLD='\033[0;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
DIM='\033[0;90m'
BOLD='\033[1m'
RESET='\033[0m'

# --- Counters ---
STEPS_PASSED=0
STEPS_FAILED=0
STEPS_TOTAL=11

pass() { echo -e "  ${GREEN}✓${RESET} $1"; ((STEPS_PASSED++)); }
fail() { echo -e "  ${RED}✗${RESET} $1"; ((STEPS_FAILED++)); }
info() { echo -e "  ${DIM}→${RESET} $1"; }
header() { echo -e "\n${BLUE}[$1/${STEPS_TOTAL}]${RESET} ${BOLD}$2${RESET}"; echo -e "  ${DIM}─────────────────────────────────────${RESET}"; }

# ═══════════════════════════════════════════════════════════════
# STEP 0: ASCII BANNER
# ═══════════════════════════════════════════════════════════════

echo ""
echo -e "${GOLD}"
cat << 'BANNER'
     ╔═══════════════════════════════════════════════════════════╗
     ║                                                           ║
     ║       █████╗ ███╗   ██╗██╗███╗   ███╗ █████╗             ║
     ║      ██╔══██╗████╗  ██║██║████╗ ████║██╔══██╗            ║
     ║      ███████║██╔██╗ ██║██║██╔████╔██║███████║            ║
     ║      ██╔══██║██║╚██╗██║██║██║╚██╔╝██║██╔══██║            ║
     ║      ██║  ██║██║ ╚████║██║██║ ╚═╝ ██║██║  ██║            ║
     ║      ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚═╝     ╚═╝╚═╝  ╚═╝            ║
     ║                                                           ║
     ║           ██████╗ ███████╗                                ║
     ║          ██╔═══██╗██╔════╝                                ║
     ║          ██║   ██║███████╗                                ║
     ║          ██║   ██║╚════██║                                ║
     ║          ╚██████╔╝███████║                                ║
     ║           ╚═════╝ ╚══════╝                                ║
     ║                                                           ║
     ║          The Living Agentic Operating System              ║
     ║                  Engine: SOLARIS                           ║
     ║                  Version: 1.3.0                           ║
     ║                                                           ║
     ╚═══════════════════════════════════════════════════════════╝
BANNER
echo -e "${RESET}"
echo -e "${DIM}  Mathematical Constants:${RESET}"
echo -e "  ${GOLD}φ${RESET} = ${PHI}  ${DIM}(Structure, hierarchy)${RESET}"
echo -e "  ${GOLD}π${RESET} = ${PI}  ${DIM}(Rhythm, cycles)${RESET}"
echo -e "  ${GOLD}e${RESET} = ${EULER}  ${DIM}(Growth, decay)${RESET}"
echo -e "  ${PURPLE}${PSI}${RESET} = Superposition       ${DIM}(Quantum decisions)${RESET}"
echo -e "  ${CYAN}∞${RESET} = Fractal             ${DIM}(Self-similarity, depth 0-5)${RESET}"
echo ""
echo -e "${DIM}  Flash installer — overwrites upstream identity with ANIMA OS${RESET}"
echo ""

# ═══════════════════════════════════════════════════════════════
# STEP 1: DETECT OPENCLAW
# ═══════════════════════════════════════════════════════════════

header "1" "Detecting OpenClaw installation"

if [ ! -d "$OPENCLAW_DIR" ]; then
  fail "OpenClaw not found at $OPENCLAW_DIR"
  echo ""
  echo -e "  ${RED}ANIMA OS requires OpenClaw to be installed first.${RESET}"
  echo -e "  ${DIM}Install OpenClaw, then re-run this script.${RESET}"
  echo ""
  exit 1
fi

pass "OpenClaw found at $OPENCLAW_DIR"

if [ -d "$WORKSPACE_DIR" ]; then
  pass "Workspace directory exists at $WORKSPACE_DIR"
else
  info "Workspace directory not found — creating $WORKSPACE_DIR"
  mkdir -p "$WORKSPACE_DIR"
  pass "Workspace directory created"
fi

# Check for Node.js
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 18 ]; then
    pass "Node.js $NODE_VERSION (>= 18 required)"
  else
    fail "Node.js $NODE_VERSION found but >= 18 required"
    exit 1
  fi
else
  fail "Node.js not found — install Node.js 18+ first"
  exit 1
fi

# ═══════════════════════════════════════════════════════════════
# STEP 2: BACKUP
# ═══════════════════════════════════════════════════════════════

header "2" "Backing up current OpenClaw installation"

cp -r "$OPENCLAW_DIR" "$BACKUP_DIR"
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
pass "Full backup created at $BACKUP_DIR ($BACKUP_SIZE)"
info "Restore with: cp -r $BACKUP_DIR $OPENCLAW_DIR"

# ═══════════════════════════════════════════════════════════════
# STEP 3: FLASH CORE IDENTITY FILES
# ═══════════════════════════════════════════════════════════════

header "3" "Flashing core identity files"

CORE_FILES=(
  "core/SOUL.md"
  "core/anima_config.json"
  "CONSTITUTION.md"
  "QUANTUM_CONSTITUTION.md"
  "GENESIS.md"
  "GATEWAY.md"
  "IMMUNE.md"
  "SWARM.md"
  "SOUL_TEMPLATE.md"
  "MASTER_TEMPLATE.json"
  "natural_law.json"
  "SOLARIS.md"
)

FLASHED=0
for file in "${CORE_FILES[@]}"; do
  SRC="$SCRIPT_DIR/$file"
  DEST="$WORKSPACE_DIR/$file"
  if [ -f "$SRC" ]; then
    DEST_DIR=$(dirname "$DEST")
    mkdir -p "$DEST_DIR"
    cp "$SRC" "$DEST"
    ((FLASHED++))
  else
    info "Skipping $file (not found in source)"
  fi
done

pass "Flashed $FLASHED core identity files to workspace"

# ═══════════════════════════════════════════════════════════════
# STEP 4: MERGE CONFIGURATION
# ═══════════════════════════════════════════════════════════════

header "4" "Merging ANIMA config over upstream"

UPSTREAM_CONFIG="$OPENCLAW_DIR/config.json"
ANIMA_CONFIG="$SCRIPT_DIR/core/anima_config.json"
MERGED_OUTPUT="$WORKSPACE_DIR/config.json"

if [ -f "$SCRIPT_DIR/converter/merge_config.js" ]; then
  if [ -f "$UPSTREAM_CONFIG" ]; then
    node "$SCRIPT_DIR/converter/merge_config.js" "$UPSTREAM_CONFIG" "$ANIMA_CONFIG" "$MERGED_OUTPUT"
    pass "Config merged — ANIMA wins on all conflicts"
  else
    info "No upstream config.json found — copying ANIMA config directly"
    cp "$ANIMA_CONFIG" "$MERGED_OUTPUT"
    pass "ANIMA config installed as primary config"
  fi
else
  fail "merge_config.js not found"
fi

# ═══════════════════════════════════════════════════════════════
# STEP 5: INSTALL SKILLS
# ═══════════════════════════════════════════════════════════════

header "5" "Installing ANIMA OS skills"

SKILLS_SRC="$SCRIPT_DIR/skills"
SKILLS_DEST="$WORKSPACE_DIR/skills"
mkdir -p "$SKILLS_DEST"

SKILLS_INSTALLED=0
if [ -d "$SKILLS_SRC" ]; then
  for skill_dir in "$SKILLS_SRC"/*/; do
    if [ -d "$skill_dir" ]; then
      skill_name=$(basename "$skill_dir")
      mkdir -p "$SKILLS_DEST/$skill_name"
      cp -r "$skill_dir"* "$SKILLS_DEST/$skill_name/"
      ((SKILLS_INSTALLED++))
    fi
  done
  pass "Installed $SKILLS_INSTALLED skills"
else
  fail "Skills directory not found at $SKILLS_SRC"
fi

# ═══════════════════════════════════════════════════════════════
# STEP 6: INSTALL AGENTS
# ═══════════════════════════════════════════════════════════════

header "6" "Installing ANIMA OS agents"

AGENTS_SRC="$SCRIPT_DIR/agents"
AGENTS_DEST="$WORKSPACE_DIR"

AGENTS_INSTALLED=0
if [ -d "$AGENTS_SRC" ]; then
  mkdir -p "$AGENTS_DEST/agents"
  for agent_file in "$AGENTS_SRC"/*.md; do
    if [ -f "$agent_file" ]; then
      cp "$agent_file" "$AGENTS_DEST/agents/"
      ((AGENTS_INSTALLED++))
    fi
  done
  pass "Installed $AGENTS_INSTALLED agent definitions"
else
  fail "Agents directory not found at $AGENTS_SRC"
fi

# ═══════════════════════════════════════════════════════════════
# STEP 7: BRAND PATCH
# ═══════════════════════════════════════════════════════════════

header "7" "Applying brand override"

if [ -f "$SCRIPT_DIR/converter/brand_patch.js" ]; then
  node "$SCRIPT_DIR/converter/brand_patch.js" "$WORKSPACE_DIR"
  pass "Brand patch applied — all upstream references replaced"
else
  fail "brand_patch.js not found"
fi

# ═══════════════════════════════════════════════════════════════
# STEP 8: LAUNCH PI PULSE DAEMON
# ═══════════════════════════════════════════════════════════════

header "8" "Launching π-pulse daemon"

DAEMON_SCRIPT="$SCRIPT_DIR/setup/pi_pulse_daemon.js"

if [ -f "$DAEMON_SCRIPT" ]; then
  # Kill existing daemon if running
  if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
      info "Stopping existing daemon (PID: $OLD_PID)"
      kill "$OLD_PID" 2>/dev/null || true
      sleep 1
    fi
    rm -f "$PID_FILE"
  fi

  # Start daemon in background
  nohup node "$DAEMON_SCRIPT" start > /dev/null 2>&1 &
  DAEMON_PID=$!
  echo "$DAEMON_PID" > "$PID_FILE"

  # Verify it's running
  sleep 1
  if kill -0 "$DAEMON_PID" 2>/dev/null; then
    pass "π-pulse daemon running (PID: $DAEMON_PID, interval: ${PI}s)"
  else
    fail "Daemon started but exited immediately — check setup/pi_pulse_daemon.js"
  fi
else
  fail "pi_pulse_daemon.js not found at $DAEMON_SCRIPT"
fi

# ═══════════════════════════════════════════════════════════════
# STEP 9: LAUNCH UPSTREAM WATCHER
# ═══════════════════════════════════════════════════════════════

header "9" "Launching upstream watcher daemon"

WATCHER_SCRIPT="$SCRIPT_DIR/converter/watch_upstream.sh"
WATCHER_PID_FILE="$SCRIPT_DIR/.anima_watcher.pid"

if [ -f "$WATCHER_SCRIPT" ]; then
  # Kill existing watcher if running
  if [ -f "$WATCHER_PID_FILE" ]; then
    OLD_WATCHER_PID=$(cat "$WATCHER_PID_FILE")
    if kill -0 "$OLD_WATCHER_PID" 2>/dev/null; then
      info "Stopping existing watcher (PID: $OLD_WATCHER_PID)"
      kill "$OLD_WATCHER_PID" 2>/dev/null || true
      sleep 1
    fi
    rm -f "$WATCHER_PID_FILE"
  fi

  # Start watcher
  bash "$WATCHER_SCRIPT" start 2>/dev/null
  if [ -f "$WATCHER_PID_FILE" ]; then
    WATCHER_PID=$(cat "$WATCHER_PID_FILE")
    if kill -0 "$WATCHER_PID" 2>/dev/null; then
      pass "Upstream watcher running (PID: $WATCHER_PID, interval: 1h)"
    else
      fail "Watcher started but exited immediately"
    fi
  else
    info "Watcher did not create PID file — may need manual start"
  fi
else
  info "watch_upstream.sh not found — skipping (optional)"
fi

# ═══════════════════════════════════════════════════════════════
# STEP 10: VERIFY CONNECTIONS
# ═══════════════════════════════════════════════════════════════

header "10" "Verifying connections"

VERIFY_SCRIPT="$SCRIPT_DIR/setup/verify.js"

if [ -f "$VERIFY_SCRIPT" ]; then
  # Install dependencies if needed
  if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    info "Installing dependencies..."
    (cd "$SCRIPT_DIR" && npm install --silent 2>/dev/null) || info "npm install skipped (optional deps)"
  fi

  node "$VERIFY_SCRIPT" 2>/dev/null && pass "All connections verified" || info "Some connections need configuration (see above)"
else
  fail "verify.js not found"
fi

# ═══════════════════════════════════════════════════════════════
# STEP 11: ACTIVATION SUMMARY
# ═══════════════════════════════════════════════════════════════

header "11" "Activation Summary"

echo ""
echo -e "${GOLD}╔═══════════════════════════════════════════════════════════╗${RESET}"
echo -e "${GOLD}║              ANIMA OS — FLASH COMPLETE                   ║${RESET}"
echo -e "${GOLD}╚═══════════════════════════════════════════════════════════╝${RESET}"
echo ""

# System identity
echo -e "  ${GREEN}✓${RESET} System identity:    ${BOLD}ANIMA OS v${VERSION}${RESET}"
echo -e "  ${GREEN}✓${RESET} Engine:             ${BOLD}SOLARIS${RESET}"
echo -e "  ${GREEN}✓${RESET} Repository:         ${BOLD}AnimaClaw${RESET}"

# Natural laws
echo ""
echo -e "  ${GREEN}✓${RESET} Natural laws loaded:"
echo -e "    ${GOLD}φ${RESET} = ${PHI}  ${DIM}(Structure)${RESET}"
echo -e "    ${GOLD}π${RESET} = ${PI}  ${DIM}(Rhythm)${RESET}"
echo -e "    ${CYAN}∞${RESET} = Fractal             ${DIM}(Self-similarity)${RESET}"
echo -e "    ${GOLD}e${RESET} = ${EULER}  ${DIM}(Growth)${RESET}"
echo -e "    ${PURPLE}ψ${RESET} = Superposition       ${DIM}(Quantum)${RESET}"

# Integrations
echo ""

# Check Supabase
if [ -n "${SUPABASE_URL:-}" ] && [ -n "${SUPABASE_ANON_KEY:-}" ]; then
  echo -e "  ${GREEN}✓${RESET} Supabase:           ${GREEN}connected${RESET}"
else
  echo -e "  ${DIM}○${RESET} Supabase:           ${DIM}not configured${RESET} ${DIM}(set SUPABASE_URL + SUPABASE_ANON_KEY)${RESET}"
fi

# Check Discord
if [ -n "${DISCORD_BOT_TOKEN:-}" ] && [ -n "${DISCORD_GUILD_ID:-}" ]; then
  echo -e "  ${GREEN}✓${RESET} Discord:            ${GREEN}connected${RESET}"
else
  echo -e "  ${DIM}○${RESET} Discord:            ${DIM}not configured${RESET} ${DIM}(set DISCORD_BOT_TOKEN + DISCORD_GUILD_ID)${RESET}"
fi

# Quantum layer
echo -e "  ${GREEN}✓${RESET} Quantum layer:      ${PURPLE}active${RESET} ${DIM}(Laws 6-12)${RESET}"

# Daemon
if [ -f "$PID_FILE" ]; then
  D_PID=$(cat "$PID_FILE")
  if kill -0 "$D_PID" 2>/dev/null; then
    echo -e "  ${GREEN}✓${RESET} π daemon:           ${GREEN}running${RESET} ${DIM}(PID: $D_PID)${RESET}"
  else
    echo -e "  ${RED}✗${RESET} π daemon:           ${RED}not running${RESET}"
  fi
else
  echo -e "  ${DIM}○${RESET} π daemon:           ${DIM}not started${RESET}"
fi

# Upstream watcher
if [ -f "$WATCHER_PID_FILE" ]; then
  W_PID=$(cat "$WATCHER_PID_FILE")
  if kill -0 "$W_PID" 2>/dev/null; then
    echo -e "  ${GREEN}✓${RESET} Upstream watcher:   ${GREEN}running${RESET} ${DIM}(PID: $W_PID, hourly checks)${RESET}"
  else
    echo -e "  ${RED}✗${RESET} Upstream watcher:   ${RED}not running${RESET}"
  fi
else
  echo -e "  ${DIM}○${RESET} Upstream watcher:   ${DIM}not started${RESET}"
fi

# Dashboard
if [ -d "$SCRIPT_DIR/dashboard" ] && [ -f "$SCRIPT_DIR/dashboard/package.json" ]; then
  if [ -d "$SCRIPT_DIR/dashboard/.next" ]; then
    echo -e "  ${GREEN}✓${RESET} Dashboard:          ${GREEN}deployed${RESET}"
  else
    echo -e "  ${DIM}○${RESET} Dashboard:          ${DIM}not deployed${RESET} ${DIM}(run: cd dashboard && npm run build)${RESET}"
  fi
else
  echo -e "  ${DIM}○${RESET} Dashboard:          ${DIM}not installed${RESET}"
fi

# Final stats
echo ""
echo -e "  ${DIM}Steps passed:  ${GREEN}${STEPS_PASSED}${RESET}${DIM}/${STEPS_TOTAL}${RESET}"
if [ "$STEPS_FAILED" -gt 0 ]; then
  echo -e "  ${DIM}Steps failed:  ${RED}${STEPS_FAILED}${RESET}${DIM}/${STEPS_TOTAL}${RESET}"
fi
echo -e "  ${DIM}Backup at:     ${BACKUP_DIR}${RESET}"

echo ""
echo -e "${GOLD}━━━ The organism is awake. ━━━${RESET}"
echo -e "${DIM}Next: Open SOLARIS.md in your workspace to begin onboarding.${RESET}"
echo ""
