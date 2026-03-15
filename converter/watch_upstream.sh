#!/usr/bin/env bash

# ╔═══════════════════════════════════════════════════════════════════╗
# ║  ANIMA OS — Upstream Watch Daemon v1.3.0                         ║
# ║  Engine: SOLARIS                                                  ║
# ║  Author: Riyad Ketami — riyad@ketami.net                         ║
# ║                                                                    ║
# ║  Monitors OpenClaw GitHub releases every hour.                    ║
# ║  On new release: runs anima_converter.js, notifies via Telegram. ║
# ║                                                                    ║
# ║  Usage:                                                            ║
# ║    bash converter/watch_upstream.sh start                          ║
# ║    bash converter/watch_upstream.sh stop                           ║
# ║    bash converter/watch_upstream.sh status                         ║
# ║    bash converter/watch_upstream.sh check                          ║
# ╚═══════════════════════════════════════════════════════════════════╝

set -euo pipefail

# --- Constants ---
PHI="1.6180339887"
PI="3.1415926535"
VERSION="1.3.0"
CHECK_INTERVAL=3600  # 1 hour in seconds

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_FILE="$PROJECT_ROOT/.anima_watcher.pid"
LOG_FILE="$PROJECT_ROOT/.anima_watcher.log"
VERSION_FILE="$PROJECT_ROOT/.openclaw_version"
CONVERTER="$SCRIPT_DIR/anima_converter.js"

# GitHub API
GITHUB_OWNER="openclaw"
GITHUB_REPO="openclaw"
GITHUB_API="https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest"

# Colors
GOLD='\033[0;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
DIM='\033[0;90m'
RESET='\033[0m'

# --- Load .env if present ---
if [ -f "$PROJECT_ROOT/.env" ]; then
  set -a
  source "$PROJECT_ROOT/.env" 2>/dev/null || true
  set +a
fi

# ═══════════════════════════════════════════════════════════
# LOGGING
# ═══════════════════════════════════════════════════════════

log() {
  local timestamp
  timestamp="$(date '+%Y-%m-%d %H:%M:%S')"
  echo "[$timestamp] $1" >> "$LOG_FILE"
}

log_rotate() {
  # Rotate log if > 1MB
  if [ -f "$LOG_FILE" ]; then
    local size
    size=$(wc -c < "$LOG_FILE" 2>/dev/null || echo 0)
    if [ "$size" -gt 1048576 ]; then
      mv "$LOG_FILE" "${LOG_FILE}.old"
      log "Log rotated (previous log at ${LOG_FILE}.old)"
    fi
  fi
}

# ═══════════════════════════════════════════════════════════
# TELEGRAM NOTIFICATION
# ═══════════════════════════════════════════════════════════

notify_telegram() {
  local message="$1"

  if [ -z "${TELEGRAM_BOT_TOKEN:-}" ] || [ -z "${TELEGRAM_CHAT_ID:-}" ]; then
    log "Telegram not configured — skipping notification"
    return
  fi

  local url="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage"
  local payload="{\"chat_id\":\"${TELEGRAM_CHAT_ID}\",\"text\":\"${message}\",\"parse_mode\":\"Markdown\"}"

  curl -s -X POST "$url" \
    -H "Content-Type: application/json" \
    -d "$payload" > /dev/null 2>&1 || log "Telegram notification failed"
}

# ═══════════════════════════════════════════════════════════
# FETCH LATEST RELEASE
# ═══════════════════════════════════════════════════════════

get_latest_version() {
  local response
  response=$(curl -s -H "User-Agent: ANIMA-OS-Watcher/${VERSION}" "$GITHUB_API" 2>/dev/null)

  if [ -z "$response" ]; then
    echo ""
    return
  fi

  # Extract tag_name from JSON (portable, no jq dependency)
  echo "$response" | grep -o '"tag_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/'
}

get_current_version() {
  if [ -f "$VERSION_FILE" ]; then
    cat "$VERSION_FILE" | tr -d '[:space:]'
  else
    echo "none"
  fi
}

# ═══════════════════════════════════════════════════════════
# CHECK FOR UPDATE
# ═══════════════════════════════════════════════════════════

check_update() {
  log_rotate

  local current_version
  current_version="$(get_current_version)"

  local latest_version
  latest_version="$(get_latest_version)"

  if [ -z "$latest_version" ]; then
    log "ERROR: Could not fetch latest version from GitHub"
    return 1
  fi

  log "Check: current=${current_version} latest=${latest_version}"

  if [ "$current_version" = "$latest_version" ]; then
    log "Up to date (${current_version})"
    return 0
  fi

  # New version available
  log "NEW RELEASE: ${latest_version} (current: ${current_version})"
  notify_telegram "🔄 *ANIMA OS Update Detected*\n\nNew upstream release: \`${latest_version}\`\nCurrent: \`${current_version}\`\nRunning converter..."

  # Run converter
  if [ -f "$CONVERTER" ]; then
    log "Running converter: ${latest_version}"

    if node "$CONVERTER" "--version=${latest_version}" "--mode=auto" >> "$LOG_FILE" 2>&1; then
      log "Conversion SUCCESS for ${latest_version}"
      notify_telegram "✅ *ANIMA OS Updated*\n\nSuccessfully converted \`${latest_version}\`\nEngine: SOLARIS v${VERSION}"
    else
      log "Conversion FAILED for ${latest_version}"
      notify_telegram "❌ *ANIMA OS Update Failed*\n\nFailed to convert \`${latest_version}\`\nCheck logs: ${LOG_FILE}"
      return 1
    fi
  else
    log "ERROR: Converter not found at ${CONVERTER}"
    return 1
  fi

  return 0
}

# ═══════════════════════════════════════════════════════════
# DAEMON LOOP
# ═══════════════════════════════════════════════════════════

daemon_loop() {
  log "Watcher daemon started (PID: $$, interval: ${CHECK_INTERVAL}s)"
  log "Monitoring: ${GITHUB_OWNER}/${GITHUB_REPO}"
  log "Engine: SOLARIS v${VERSION}"

  # Write PID
  echo "$$" > "$PID_FILE"

  # Trap cleanup
  trap 'log "Daemon stopping (PID: $$)"; rm -f "$PID_FILE"; exit 0' SIGTERM SIGINT

  # Initial check
  check_update || true

  # Loop
  while true; do
    sleep "$CHECK_INTERVAL"
    check_update || true
  done
}

# ═══════════════════════════════════════════════════════════
# COMMANDS
# ═══════════════════════════════════════════════════════════

cmd_start() {
  echo -e "${GOLD}ANIMA OS — Upstream Watcher v${VERSION}${RESET}"
  echo -e "${DIM}Engine: SOLARIS${RESET}"
  echo ""

  # Check if already running
  if [ -f "$PID_FILE" ]; then
    local old_pid
    old_pid=$(cat "$PID_FILE")
    if kill -0 "$old_pid" 2>/dev/null; then
      echo -e "  ${GREEN}✓${RESET} Watcher already running (PID: ${old_pid})"
      return 0
    fi
    rm -f "$PID_FILE"
  fi

  # Start daemon in background
  nohup bash "$0" _daemon > /dev/null 2>&1 &
  local daemon_pid=$!

  sleep 1

  if kill -0 "$daemon_pid" 2>/dev/null; then
    echo -e "  ${GREEN}✓${RESET} Watcher started (PID: ${daemon_pid})"
    echo -e "  ${DIM}→${RESET} Check interval: ${CHECK_INTERVAL}s (1 hour)"
    echo -e "  ${DIM}→${RESET} Log: ${LOG_FILE}"
    echo -e "  ${DIM}→${RESET} PID file: ${PID_FILE}"
  else
    echo -e "  ${RED}✗${RESET} Watcher failed to start"
    return 1
  fi
}

cmd_stop() {
  echo -e "${GOLD}ANIMA OS — Upstream Watcher${RESET}"
  echo ""

  if [ ! -f "$PID_FILE" ]; then
    echo -e "  ${DIM}○${RESET} Watcher not running (no PID file)"
    return 0
  fi

  local pid
  pid=$(cat "$PID_FILE")

  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null
    rm -f "$PID_FILE"
    echo -e "  ${GREEN}✓${RESET} Watcher stopped (was PID: ${pid})"
    log "Daemon stopped by user"
  else
    rm -f "$PID_FILE"
    echo -e "  ${DIM}○${RESET} Watcher was not running (stale PID: ${pid})"
  fi
}

cmd_status() {
  echo -e "${GOLD}ANIMA OS — Upstream Watcher Status${RESET}"
  echo ""

  local current_version
  current_version="$(get_current_version)"
  echo -e "  Current version: ${BLUE}${current_version}${RESET}"

  if [ -f "$PID_FILE" ]; then
    local pid
    pid=$(cat "$PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      echo -e "  Watcher:         ${GREEN}running${RESET} (PID: ${pid})"
    else
      echo -e "  Watcher:         ${RED}stopped${RESET} (stale PID: ${pid})"
    fi
  else
    echo -e "  Watcher:         ${DIM}not running${RESET}"
  fi

  if [ -f "$LOG_FILE" ]; then
    local log_size
    log_size=$(wc -c < "$LOG_FILE" 2>/dev/null || echo 0)
    local log_lines
    log_lines=$(wc -l < "$LOG_FILE" 2>/dev/null || echo 0)
    echo -e "  Log:             ${log_lines} lines ($(( log_size / 1024 )) KB)"
    echo ""
    echo -e "  ${DIM}Last 5 log entries:${RESET}"
    tail -5 "$LOG_FILE" 2>/dev/null | while IFS= read -r line; do
      echo -e "    ${DIM}${line}${RESET}"
    done
  else
    echo -e "  Log:             ${DIM}no log file${RESET}"
  fi

  echo ""
}

cmd_check() {
  echo -e "${GOLD}ANIMA OS — Manual Update Check${RESET}"
  echo ""

  local current_version
  current_version="$(get_current_version)"
  echo -e "  Current: ${current_version}"

  local latest_version
  latest_version="$(get_latest_version)"

  if [ -z "$latest_version" ]; then
    echo -e "  ${RED}✗${RESET} Could not fetch latest version from GitHub"
    exit 1
  fi

  echo -e "  Latest:  ${latest_version}"

  if [ "$current_version" = "$latest_version" ]; then
    echo -e "  ${GREEN}✓${RESET} Already up to date"
  else
    echo -e "  ${GOLD}→${RESET} New version available: ${latest_version}"
    echo ""
    echo "  Run manually:"
    echo "    node converter/anima_converter.js --version=${latest_version}"
  fi

  echo ""
}

# ═══════════════════════════════════════════════════════════
# ENTRY POINT
# ═══════════════════════════════════════════════════════════

COMMAND="${1:-help}"

case "$COMMAND" in
  start)
    cmd_start
    ;;
  stop)
    cmd_stop
    ;;
  status)
    cmd_status
    ;;
  check)
    cmd_check
    ;;
  _daemon)
    daemon_loop
    ;;
  *)
    echo -e "${GOLD}ANIMA OS — Upstream Watcher v${VERSION}${RESET}"
    echo -e "${DIM}Engine: SOLARIS${RESET}"
    echo ""
    echo "Usage:"
    echo "  bash converter/watch_upstream.sh start    Start the watcher daemon"
    echo "  bash converter/watch_upstream.sh stop     Stop the watcher daemon"
    echo "  bash converter/watch_upstream.sh status   Show watcher status"
    echo "  bash converter/watch_upstream.sh check    Manual one-time check"
    echo ""
    ;;
esac
