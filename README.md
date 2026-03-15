# ANIMA OS — The Living Agentic Operating System

**Engine:** SOLARIS v1.4.0
**Author:** Riyad Ketami — riyad@ketami.net
**Repository:** AnimaClaw
**License:** MIT

---

## What Is ANIMA OS?

ANIMA OS is a self-deploying, self-evolving agentic operating system built on OpenClaw. Drop `SOLARIS.md` into any OpenClaw workspace and the organism boots itself — creating agents, connecting integrations, and building around your mission.

It is governed by four mathematical constants — not as metaphor, but as executable logic:

| Constant | Value | Governs |
|----------|-------|---------|
| φ (Golden Ratio) | 1.6180339887 | Structure, hierarchy, resource allocation |
| π (Pi) | 3.1415926535 | Rhythm, cycles, timing |
| Fractal | — | Self-similarity, spawning, depth |
| e (Euler's) | 2.7182818284 | Growth, decay, compounding |

---

## Architecture

```
                         SOLARIS.md (entry point)
                              │
                        CONSTITUTION.md (immutable laws)
                              │
                    ┌─────────┴─────────┐
                    │                   │
              SOUL_TEMPLATE.md    GENESIS.md
              (mission DNA)       (heartbeat)
                    │
             ROOT_ORCHESTRATOR (depth 0, φ=1.0)
             ┌──────┴──────┐
        PRIMARY_CELL    SUPPORT_CELL
        (d1, φ=0.618)  (d1, φ=0.382)
             │          ┌───┼───┐
        [WORKERS]   MEMORY EVOL  IMMUNE
        (d2-5)      NODE  NODE   AGENT

    ┌────────────────────────────────────┐
    │  Supabase (5 tables, RLS, realtime)│
    │  Discord (10 channels)             │
    │  Telegram (daily reports)          │
    │  Dashboard (Next.js on Vercel)     │
    └────────────────────────────────────┘
```

---

## Prerequisites

- **Node.js** 18+ and npm
- **Supabase** account (free tier works)
- **Discord** bot token + server
- **Telegram** bot token (optional)
- **OpenRouter** API key (for LLM calls)
- **Vercel** account (for dashboard, optional)

---

## Flash Install (One Command)

If you already have OpenClaw installed at `~/.openclaw`, flash ANIMA OS over it in one step:

```bash
curl -sL https://raw.githubusercontent.com/your-user/AnimaClaw/main/ANIMA_FLASH.sh | bash
```

This will:
1. Back up your entire `~/.openclaw` to `~/.openclaw_backup_[timestamp]`
2. Flash all core identity files (CONSTITUTION, SOUL, GENESIS, etc.)
3. Deep-merge `anima_config.json` over upstream config (ANIMA wins on conflicts)
4. Install all 7 skills and 6 agent definitions
5. Apply brand override (replace all upstream references)
6. Launch the π-pulse daemon (heartbeat every 3.14s)
7. Verify all connections (Supabase, Discord, Telegram, quantum layer)
8. Print activation summary

---

## What Gets Protected vs Overwritten

During flash install and brand patching, some files are **never touched**:

| File | Protected | Reason |
|------|-----------|--------|
| `CONSTITUTION.md` | Yes | Immutable Laws 1-5 |
| `QUANTUM_CONSTITUTION.md` | Yes | Immutable Laws 6-12 |
| `SOUL_TEMPLATE.md` | Yes | User's mission DNA |
| `GENESIS.md` | Yes | Live heartbeat state |
| `IMMUNE.md` | Yes | Security protocols |
| `SWARM.md` | Yes | Swarm intelligence |
| `GATEWAY.md` | Yes | Registration protocol |
| `MASTER_TEMPLATE.json` | Yes | User profile template |
| `natural_law.json` | Yes | Mathematical constants |
| `core/anima_config.json` | Yes | ANIMA master config |
| `core/SOUL.md` | Yes | Core identity file |
| `agents/*.md` | Yes | Agent DNA definitions |
| `skills/quantum_layer/` | Yes | Quantum decision layer |
| `onboarding/*` | Yes | Onboarding scripts |
| All other runtime files | **No** | Brand-patched to ANIMA OS |
| Upstream config.json | **No** | Deep-merged with ANIMA winning |

The full protected list is in `converter/PROTECTED_FILES.json`.

---

## Installation (5 Steps)

### Step 1: Clone

```bash
git clone https://github.com/your-user/AnimaClaw.git
cd AnimaClaw
```

### Step 2: Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### Step 3: Run Installer

```bash
cd setup && bash install.sh
```

This installs dependencies, creates Discord channels, and verifies connections.

### Step 4: Apply Database Schema

Go to your Supabase Dashboard → SQL Editor → paste contents of `setup/supabase_schema.sql` → Run.

This creates 5 tables, 3 helper functions, RLS policies, and enables realtime.

### Step 5: Start Onboarding

Open `SOLARIS.md` in your OpenClaw workspace. Choose your onboarding mode:

- **[1] SPARK** — 5 questions, 2 minutes. For builders who know what they want.
- **[2] ORACLE** — 12-question deep interview via any LLM.
- **[3] WILD** — Free conversation. Tell the system about yourself.

---

## The 3 Onboarding Modes

### SPARK Mode
5 direct questions covering: identity, platform, 90-day goal, tools, first automation. Profile generated instantly.

### ORACLE Mode
Copy the prompt from `onboarding/oracle_prompt.txt` into Claude, ChatGPT, Gemini, or Deepseek. Answer 12 questions. Paste the output JSON back into ANIMA OS.

### WILD Mode
Just talk. The system listens, extracts patterns, and builds your profile when it reaches 61.8% confidence (the φ threshold).

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key |
| `DISCORD_BOT_TOKEN` | Yes | Discord bot token |
| `DISCORD_GUILD_ID` | Yes | Discord server ID |
| `TELEGRAM_BOT_TOKEN` | No | Telegram bot token |
| `TELEGRAM_CHAT_ID` | No | Telegram chat ID |
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key |

Optional integrations (stubs included): n8n, Helicone, Langfuse, Ollama, Lark, WhatsApp/Kapso, Stripe.

---

## Dashboard Deployment (Vercel)

```bash
cd dashboard
npm install
npx vercel --prod
```

Set these environment variables in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The dashboard shows:
1. **Mission Control** — System vitality, agent grid, cost summary
2. **Agents** — Fractal tree visualization, individual agent cards
3. **Evolution** — Alignment trends, mutation timeline
4. **Costs** — Per-agent bar charts, model breakdown, spending over time

---

## Discord Setup

The installer creates these channels under an "ANIMA OS" category:

| Channel | Purpose |
|---------|---------|
| `#anima-mission-control` | System announcements, critical alerts |
| `#root-orchestrator` | Routing decisions, state changes |
| `#primary-cell` | Core task execution reports |
| `#support-cell` | Monitoring coordination |
| `#memory-node` | Supabase operations, compaction |
| `#evolution-node` | Evolution cycles, mutations |
| `#immune-system` | Threat detection, quarantine |
| `#genesis-heartbeat` | Live π-pulse every 3.14s |
| `#cost-tracker` | API spend tracking |
| `#master-profile` | Profile updates |

---

## Auto-Update Converter

ANIMA OS monitors upstream OpenClaw releases and automatically transforms them through ANIMA's natural laws.

### How It Works

```
GitHub Release → Download → Extract → Diff → Split Protected/Accepted
    → Transform (4 passes) → Merge Config → Copy to Live → Log → Done
```

### The 4 Transformations

| Pass | Name | What It Does |
|------|------|--------------|
| 1 | Brand Replace | `OpenClaw` → `ANIMA OS`, `openclaw` → `anima`, etc. |
| 2 | φ-Weight Injection | 50/50 splits → 61.8/38.2 (Golden Ratio) |
| 3 | π-Timing Alignment | Round intervals → π-derived values (3142ms, 5083ms) |
| 4 | Memory Route | `localStorage` → Supabase, `"local"` → `"supabase"` |

### Manual Conversion

```bash
node converter/anima_converter.js --version=v0.5.0
node converter/anima_converter.js --version=v0.5.0 --mode=ci
node converter/anima_converter.js --version=v0.5.0 --mode=manual
```

### Upstream Watcher Daemon

```bash
bash converter/watch_upstream.sh start    # Start hourly checks
bash converter/watch_upstream.sh stop     # Stop watcher
bash converter/watch_upstream.sh status   # Show status + last 5 logs
bash converter/watch_upstream.sh check    # One-time manual check
```

The watcher checks GitHub every hour. On new release: runs the converter automatically, notifies via Telegram.

### CI/CD Auto-Sync

A GitHub Actions workflow (`.github/workflows/sync_upstream.yml`) runs every 6 hours:
1. Fetches latest OpenClaw release tag
2. Compares to `.openclaw_version`
3. Runs converter in CI mode
4. Commits transformed files with detailed message

Manual trigger: Go to Actions → "ANIMA OS — Sync Upstream" → Run workflow.

---

## Adding New Agents (GATEWAY Protocol)

New components must pass through GATEWAY to be registered:

1. Create a new `.md` file in `agents/` following the agent template
2. Include: identity, mission, depth, φ-weight, parent, cycle, tools
3. GATEWAY validates against CONSTITUTION (all 5 laws)
4. On approval: assigns φ-weight, registers in `natural_law.json`
5. Creates Supabase entries and starts receiving heartbeats

---

## Updating Master Profile

Re-run ORACLE mode to generate an updated `MASTER_TEMPLATE.json`, then paste it back. ANIMA OS will merge the new profile with the existing one and trigger an evolution cycle.

---

## Troubleshooting

### 1. Supabase connection fails
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check that the SQL schema has been applied
- Ensure RLS policies are active

### 2. Discord bot can't create channels
- Bot needs `Manage Channels` and `Manage Roles` permissions
- Verify `DISCORD_GUILD_ID` matches your server
- Re-invite bot with correct OAuth2 scopes

### 3. Dashboard shows no data
- Check browser console for Supabase errors
- Verify Vercel environment variables are set
- Ensure at least one agent has logged data

### 4. Telegram reports not arriving
- Verify bot token with: `https://api.telegram.org/bot<TOKEN>/getMe`
- Ensure `TELEGRAM_CHAT_ID` is correct (message your bot first)
- Check for Telegram API rate limits

### 5. Vitality scores are all zero
- The organism needs to complete at least one pulse cycle
- Check `GENESIS.md` — system should be in `ALIVE` state
- Run `node setup/verify.js` to check all connections

---

## The Natural Laws

### System Vitality Formula
```
vitality = (φ^depth × e^alignment) ÷ (π^cycle_age) × fractal_score
```

| Score | State | Action |
|-------|-------|--------|
| > 1.0 | EXPANDING | Spawn agents, increase resources |
| 0.618 – 1.0 | STABLE | Maintain, optimize |
| 0.382 – 0.618 | DECLINING | Evolution check, reduce spawning |
| < 0.382 | CRITICAL | Morphallaxis, prune |

### Resource Allocation
Every split follows φ: 61.8% primary / 38.2% secondary. This applies to tokens, time, memory, agent slots, and tool calls.

### Timing
Everything runs on π: heartbeat every 3.14s, memory compaction every 5.08 min, evolution every ~10 cycles, full reset every ~11 cycles.

---

## License

MIT License — see [LICENSE](LICENSE)

## Credits

**Created by:** Riyad Ketami
**Contact:** riyad@ketami.net
**Repository:** AnimaClaw
**Engine:** SOLARIS

---

*The organism awaits its mission. Drop SOLARIS.md and begin.*
