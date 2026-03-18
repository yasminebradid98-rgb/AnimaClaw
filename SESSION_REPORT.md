# AnimaClaw v1.7 — Full Session Report
**Date:** 2026-03-18
**Purpose:** Complete context handoff for a new Claude Code instance to continue this project without any prior knowledge gap.

---

## 0. TL;DR — What This Project Is

**AnimaClaw v1.7** is a self-hosted, self-evolving AI agent operating system.
It consists of:
- A **Next.js 16 Mission Control dashboard** (the UI you see) running on a VPS
- A **pi_pulse_daemon** (Node.js) that fires every π seconds (3141 ms) as the system heartbeat
- A **Supabase cloud database** where all agent logs, vitals, tasks, and memory are stored
- A **runtime engine** (SOLARIS) with natural-law mathematical constants (φ, π, e) governing behavior

The system is designed so AnimaClaw can eventually **modify its own codebase** — this session established the safety guardrails and live data pipeline for that.

---

## 1. Infrastructure & Access

### 1.1 VPS — Production Server
| Key | Value |
|---|---|
| **IP** | `72.62.236.19` |
| **Provider** | Hostinger |
| **OS** | Linux |
| **Project root** | `/root/AnimaClaw/` |
| **Dashboard source** | `/root/AnimaClaw/dashboard/` |
| **Dashboard port** | `80` (HTTP, served via PM2 + ecosystem.config.js) |
| **SSH** | Blocked from Mac (too many auth failures). Use Hostinger web terminal instead. |

**VPS Terminal access (Hostinger web terminal):**
Tokens expire. To get a fresh token:
1. Log into `hpanel.hostinger.com`
2. Go to VPS → your server → Terminal
3. The terminal opens at a URL like `https://int.hostingervps.com/terminal?token=<TOKEN>`
4. If the button opens a new tab instead of redirecting, run this in the browser console first:
   ```js
   window.open = function(url) { window.location.href = url; }
   ```
   Then click the Terminal button — it redirects to the token URL instead of opening a popup.

**Key VPS files:**
```
/root/AnimaClaw/.env                  ← Supabase credentials (SUPABASE_URL, SUPABASE_ANON_KEY)
/root/AnimaClaw/PROTECTED_FILES.json  ← Files the immune scanner will never delete
/root/AnimaClaw/setup/pi_pulse_daemon.js  ← The heartbeat daemon (v1.2.0 SOLARIS Engine)
```

**Start/restart daemon on VPS:**
```bash
cd /root/AnimaClaw
node setup/pi_pulse_daemon.js    # or via PM2: pm2 restart pi-pulse
```

---

### 1.2 Supabase — Cloud Database
| Key | Value |
|---|---|
| **Project name** | animaclaw-v17 |
| **Project ref** | `alrmwsfzamwsxhgockyj` |
| **Region** | (check Supabase dashboard) |
| **Dashboard URL** | `https://supabase.com/dashboard/project/alrmwsfzamwsxhgockyj` |
| **REST API base** | `https://alrmwsfzamwsxhgockyj.supabase.co` |
| **Schema applied** | ANIMA OS v1.5.0 (6 tables, 4 functions, 17 RLS policies, realtime enabled) |

**Credentials location:**
`/root/AnimaClaw/.env` on the VPS:
```env
SUPABASE_URL=https://alrmwsfzamwsxhgockyj.supabase.co
SUPABASE_ANON_KEY=<anon key from Supabase dashboard>
```

Also set in the dashboard `.env`:
```
dashboard/.env   ← Next.js reads SUPABASE_URL + SUPABASE_ANON_KEY at build/runtime
```

**Supabase Management API note:**
The Management API (`https://api.supabase.com/v1/projects/{ref}/database/query`) can only be called from `supabase.com` origin (strict CORS). To run raw SQL (schema changes, ALTER TABLE, etc.), open the Supabase SQL Editor tab in your browser and run JS from the browser console — or use the SQL Editor directly.

---

### 1.3 GitHub Repository
| Key | Value |
|---|---|
| **Repo** | `https://github.com/riyad7creator/AnimaClaw` |
| **Branch** | `main` |
| **Stable tag** | `v1.7-stable` (commit `ce12e07`) |
| **Latest commit** | `2e22025` — premium chat UI |

**Clone:**
```bash
git clone https://github.com/riyad7creator/AnimaClaw.git
cd AnimaClaw/dashboard
pnpm install
pnpm dev
```

---

### 1.4 Local Mac Development
| Key | Value |
|---|---|
| **Project root** | `/Users/mac/Documents/01 - Projects/AnimaOs/ANIMA.clawd/` |
| **Dashboard source** | `/Users/mac/Documents/01 - Projects/AnimaOs/ANIMA.clawd/dashboard/` |
| **Node** | >= 22 (LTS) required |
| **Package manager** | `pnpm` only (no npm/yarn) |

```bash
# Dev server
cd /Users/mac/Documents/01\ -\ Projects/AnimaOs/ANIMA.clawd/dashboard
pnpm dev       # → http://localhost:3000

# Type check (must pass 0 errors before any commit)
pnpm typecheck

# Tests
pnpm test
pnpm test:e2e
```

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | ^16.1.6 |
| UI | React | ^19.0.1 |
| Language | TypeScript | ^5.x |
| State | Zustand | ^5.0.11 |
| Styling | Tailwind CSS | ^3.4.17 |
| Charts | Recharts | ^3.7.0 |
| i18n | next-intl | ^4.8.3 |
| DB (local) | SQLite (better-sqlite3) | — |
| DB (cloud) | Supabase (PostgreSQL) | — |
| Testing | Vitest + Playwright | — |
| Deploy | PM2 on Hostinger VPS | — |

---

## 3. Supabase Schema — ANIMA OS v1.5.0

### Tables created
```sql
anima_agent_logs         ← PRIMARY: pi-pulse writes here every π seconds
anima_master_profile     ← AnimaClaw's identity/soul config
anima_task_queue         ← Agent task queue
anima_memory             ← Long-term memory nodes
anima_sessions           ← Agent session records
anima_constitutional_log ← Constitutional governance audit
```

### `anima_agent_logs` — key columns (38 total)
The pi_pulse_daemon writes to this table. These are the most important columns:

```sql
id                  UUID PRIMARY KEY
created_at          TIMESTAMPTZ
pi_pulse_timestamp  TIMESTAMPTZ    ← daemon's main timestamp
cycle_number        INTEGER        ← heartbeat cycle count
evolution_cycle     INTEGER        ← evolution cycle (every ~9 heartbeats)
agent_name          TEXT           ← 'pi-pulse'
vitality_score      NUMERIC        ← 0–1 health score
health_score        NUMERIC
mission_alignment   NUMERIC
phi_weight          NUMERIC        ← φ = 1.618...
fractal_depth       NUMERIC
anima_state         TEXT           ← DORMANT/ACTIVE/EVOLVING/QRL
agents_active       INTEGER
queue_state         TEXT
qrl_number          INTEGER        ← Quantum Reinforcement Loop event number
evolution_cycle     INTEGER
task_description    TEXT
node_id             TEXT
model_used          TEXT
tokens_used         INTEGER
cost_usd            NUMERIC
status              TEXT
log_data            JSONB
raw_payload         JSONB
```

### Schema fix history (applied this session)
The schema was applied iteratively via Management API from the Supabase SQL Editor tab because:
- Mixed content restrictions block HTTP→HTTPS calls
- CORS blocks non-supabase.com origins from Management API

Fixes applied in order:
1. Initial schema (6 tables) via `POST https://api.supabase.com/v1/projects/alrmwsfzamwsxhgockyj/database/query`
2. `ALTER TABLE anima_agent_logs ADD COLUMN pi_pulse_timestamp TIMESTAMPTZ` (daemon uses this, not `evolution_timestamp`)
3. `ALTER TABLE anima_agent_logs ALTER COLUMN user_id TYPE TEXT` (daemon passes `undefined` as string, UUID type rejected it)
4. Added: `task_description`, `node_id`, `response_time_ms`, `error_count`, `success_count`, `memory_mb`, `raw_payload`
5. Added: `vitality_score`, `health_score`, `entropy`, `coherence`, `resonance`
6. `NOTIFY pgrst, 'reload schema'` after each change (required to refresh PostgREST schema cache)
7. Restart pi_pulse_daemon after schema changes

**Confirmed working:** 98+ rows writing successfully as of session end.

---

## 4. Dashboard Architecture

### 4.1 Routing System
Single catch-all route: `src/app/[[...panel]]/page.tsx`

The `ContentRouter` function (switch statement) maps URL slugs → panel components.

**All routes:**
```
/overview          Dashboard (widgets grid)
/agents            Agent Squad
/tasks             Task Board
/chat              Full Chat Workspace
/channels          Channels
/skills            Skills
/memory            Memory Browser
/activity          Activity Feed
/logs              Log Viewer
/cost-tracker      Cost Tracker
/nodes             Nodes Panel
/exec-approvals    Exec Approval Panel
/office            Office Panel
/cron              Cron Management
/webhooks          Webhooks
/alerts            Alert Rules
/github            GitHub Sync
/security          Security Audit
/users             User Management
/audit             Audit Trail
/gateways          Multi-Gateway
/gateway-config    Gateway Config
/integrations      Integrations
/settings          Settings
/super-admin       Super Admin
/debug             Debug Panel
/anima-vitals      Pi Vitals Panel      ← BUILT THIS SESSION
/anima-agents      Anima Agent List
/anima-workspaces  Client Workspace
/anima-usage       Usage & Tiers
/anima-memory      Anima Memory Graph
```

### 4.2 Navigation Rail Groups
File: `src/components/layout/nav-rail.tsx`

```
CORE:       overview, agents, tasks, chat, channels, skills, memory
OBSERVE:    activity, logs, cost-tracker, nodes, exec-approvals, office
AUTOMATE:   cron, webhooks, alerts, github
ADMIN:      security, users, audit, gateway-parent, integrations, debug, settings
ANIMACLAW:  anima-vitals ← NEW, anima-agents, anima-workspaces, anima-usage, anima-memory
```

### 4.3 Design System — "Void" Dark Theme
File: `src/app/globals.css` + `src/styles/design-tokens.ts`

**Colors:**
```
#22D3EE  void-cyan   (primary accent, charts, focus rings, send button)
#34D399  void-mint   (success, secondary chart color)
#FBBF24  void-amber  (warning, QRL events)
#F87171  void-crimson (error, recording state)
#07090C  background  (deepest void)
#0F141C  card surface
```

**CSS classes (always use these, never raw Tailwind for layout):**
```css
.void-panel        /* glass card: bg-card/90 backdrop-blur border border-border rounded-lg + subtle cyan inset glow */
.panel             /* simpler card: bg-card border border-border rounded-lg */
.panel-header      /* px-4 py-3 border-b flex items-center justify-between */
.panel-body        /* p-4 */
.badge-success     /* green pill */
.badge-warning     /* amber pill */
.badge-error       /* red pill */
.badge-info        /* blue pill */
.badge-neutral     /* muted pill */
.glow-cyan         /* box-shadow cyan glow */
.glow-mint         /* box-shadow mint glow */
.glow-amber        /* box-shadow amber glow */
.font-mono-tight   /* JetBrains Mono, tabular-nums — use for all numbers/code */
.pulse-dot         /* animated scaling dot for live indicators */
.pulse-live        /* opacity pulse animation */
.shimmer           /* loading skeleton animation */
.text-2xs          /* font-size: 0.625rem (10px) — used everywhere for meta labels */
```

**Typography conventions:**
- `text-2xs` for timestamps, metadata, sublabels
- `font-mono-tight` for ALL numbers, scores, codes, timestamps
- `text-xs` for body content in panels
- `text-sm` for panel headings

### 4.4 Widget Primitives
File: `src/components/dashboard/widget-primitives.tsx`

```tsx
<HealthRow label="CPU" value="42%" status="good" bar={42} />
<StatRow label="Tokens" value="12,450" />
<SignalPill label="Mode" value="Active" tone="success" />
<MetricCard label="Sessions" value={5} icon={...} color="blue" />
```

`status` accepts: `'good' | 'warn' | 'bad'`
`tone` accepts: `'success' | 'warning' | 'info'`

### 4.5 Zustand Store
File: `src/store/index.ts`

```tsx
const {
  activeTab, connection, sessions, agents, tasks, logs,
  chatInput, setChatInput, isSendingMessage,
  dashboardMode,           // 'local' | 'full'
  activeConversation,
  setActiveConversation,
  addChatMessage,
  replacePendingMessage,
  updatePendingMessage,
  // ... many more
} = useMissionControl()
```

### 4.6 Polling Hooks
- `useSmartPoll(fn, intervalMs, opts)` — generic visibility-aware polling (`src/lib/use-smart-poll.ts`)
- `useVitals(limit, intervalMs)` — Supabase pi-pulse data (`src/lib/use-vitals.ts`) ← **BUILT THIS SESSION**

---

## 5. Everything Built This Session

### 5.1 Supabase Schema (applied remotely)
Applied via Management API from browser console on supabase.com tab. Not a file — run against Supabase directly if re-applying.

### 5.2 New Files Created

#### `dashboard/src/app/api/vitals/route.ts`
**Purpose:** Server-side proxy to Supabase REST API. Fetches `anima_agent_logs`, computes summary metadata, returns `{ records[], meta{} }`. Never cached (`cache: 'no-store'`).

**Endpoint:** `GET /api/vitals?limit=80`

**Response shape:**
```json
{
  "records": [{ "id", "pi_pulse_timestamp", "vitality_score", "qrl_number", ... }],
  "meta": {
    "count": 80,
    "latest": { /* most recent VitalRecord */ },
    "avgVitality": 0.8234,
    "qrlEventCount": 12,
    "latestQrl": 47,
    "latestCycle": 234,
    "anima_state": "ACTIVE"
  }
}
```

#### `dashboard/src/lib/use-vitals.ts`
**Purpose:** Client hook. Polls `/api/vitals` every 10s. Visibility-aware (pauses on tab hide, refetches on focus).

```tsx
const { records, meta, loading, error, lastUpdated, refetch } = useVitals(80, 10_000)

// Helpers exported:
vitalityStatus(score)         // → 'good' | 'warn' | 'bad'
fmtTime(isoTimestamp)         // → 'HH:MM:SS'
fmtScore(number, decimals)    // → '0.8234'
```

**Types exported:** `VitalRecord`, `VitalsMeta`, `VitalsState`

#### `dashboard/src/components/panels/anima-vitals-panel.tsx`
**Purpose:** Full live vitals dashboard panel. Route: `/anima-vitals`.

**Sections:**
1. Header: state pill (DORMANT/ACTIVE/EVOLVING/QRL), last-updated, refresh button
2. KPI strip (4 cards): Vitality score, Evolution cycle, QRL events, Agents active
3. Vitality sparkline (recharts LineChart, cyan stroke, reference lines at 0.7/0.4)
4. Live Metrics sidebar: φ-weight, Mission Alignment (with progress bar), Fractal Depth, Queue/Model/Tokens/Cost
5. Signal pills row: Agent, Queue State, Evolution Cycle, Last QRL
6. Current Task (latest `task_description`)
7. QRL Event Log (last 8 QRL events)
8. Recent Pulses feed (last 12 raw heartbeats)

#### `dashboard/src/components/dashboard/widgets/quick-chat-widget.tsx`
**Purpose:** Overview dashboard widget. Lets user send messages to any agent directly from `/overview` without navigating to `/chat`.

**Features:**
- Agent selector dropdown (online agents marked `●`)
- Mini message thread (human cyan bubbles / agent surface bubbles)
- Animated typing indicator (3 bouncing dots)
- Full `ChatInput` in compact mode — file upload + voice recording work
- "Full chat →" opens `/chat` with agent pre-selected
- Registered in widget catalog, appears in both LOCAL and GATEWAY default layouts

#### `dashboard/src/components/chat/chat-input.tsx` (REWRITTEN)
**Purpose:** The main chat input used everywhere. Completely redesigned.

**What's new vs before:**
- `📎 Attach` button — labeled pill, opens file picker, drag-and-drop, paste image
- `🎙 Voice` button — labeled pill, turns cyan on hover
- Recording: full-width waveform animation + live timer + "Stop recording" pill
- Processing: spinner while encoding audio
- Rounded-2xl glass container with cyan glow focus ring
- Attachment chips: image thumbnails, audio chip, file chip — hover × to remove
- `compact` prop for use inside QuickChatWidget
- Divider line between textarea and toolbar
- Sub-line: attachment count + char count when relevant
- Inline `@keyframes chatWaveBar` (no globals dependency)

#### `/ANIMA.clawd/CODEBASE_MAP.md` (root of project)
**Purpose:** Machine-readable navigation map for AnimaClaw self-modification. Sections:
1. Full directory tree with file purposes
2. All routes and what they render
3. Component dependency map
4. Data flow (Supabase → API route → hook → panel)
5. Design system rules
6. PROTECTED files list
7. Mandatory modification protocol

---

### 5.3 Files Modified

| File | What changed |
|---|---|
| `src/app/[[...panel]]/page.tsx` | Added `import AnimaVitalsPanel` + `case 'anima-vitals': return <AnimaVitalsPanel />` |
| `src/components/layout/nav-rail.tsx` | Added `AnimaVitalsIcon` function + `{ id: 'anima-vitals', label: 'Pi Vitals', ... }` as first item in ANIMACLAW group |
| `src/components/dashboard/widget-grid.tsx` | Added `import QuickChatWidget` + `'quick-chat': QuickChatWidget` to WIDGET_COMPONENTS map |
| `src/lib/dashboard-widgets.ts` | Added `quick-chat` widget to CATALOG + both LOCAL and GATEWAY default layouts |

---

## 6. Git History This Session

```
2e22025  feat: premium chat UI — file upload, voice, and quick-chat overview widget
581d5e1  feat(chat): enhanced chat input — file upload, voice recording, better UX
271c217  meta: add CODEBASE_MAP.md for AnimaClaw self-modification navigation
ce12e07  savepoint: pre-self-modification v1.7 stable  ← TAG: v1.7-stable
68a48ea  rebrand + docs overhaul v1.7
```

**Tag `v1.7-stable` = `ce12e07`** — the emergency rollback point.

**Emergency rollback command:**
```bash
git reset --hard v1.7-stable
git push origin main --force
```

---

## 7. Protected Files — NEVER MODIFY

These files are governed by ANIMA OS constitutional law. AnimaClaw's immune scanner will flag modifications:

```
/ANIMA.clawd/CONSTITUTION.md
/ANIMA.clawd/QUANTUM_CONSTITUTION.md
/ANIMA.clawd/natural_law.json
/ANIMA.clawd/converter/PROTECTED_FILES.json
/ANIMA.clawd/dashboard/.env
```

---

## 8. AnimaClaw Self-Modification Protocol

Before any Claude Code instance modifies this codebase:

```
STEP 1  Read /ANIMA.clawd/CODEBASE_MAP.md (or ~/.openclaw/workspace/CODEBASE_MAP.md)
STEP 2  Check protected files list — if target is protected, STOP
STEP 3  Read the target file completely before writing any change
STEP 4  Make minimum-viable change only
STEP 5  pnpm typecheck → must return 0 errors
STEP 6  git checkout -b animaclaw/<scope>/<description>
STEP 7  NEVER push directly to main — open a Pull Request
STEP 8  Emergency rollback: git reset --hard v1.7-stable
```

**OpenClaw sandbox issue:** The OpenClaw agent is sandboxed to `~/.openclaw/workspace/`. It cannot read files outside that path. Fix:
```bash
# Run once to sync the map into the workspace:
cp "/Users/mac/Documents/01 - Projects/AnimaOs/ANIMA.clawd/CODEBASE_MAP.md" \
   ~/.openclaw/workspace/CODEBASE_MAP.md

# Add this alias to your shell for ongoing sync:
alias anima-sync-map='cp "/Users/mac/Documents/01 - Projects/AnimaOs/ANIMA.clawd/CODEBASE_MAP.md" ~/.openclaw/workspace/CODEBASE_MAP.md && echo "Map synced ✓"'
```

**Prompt template for AnimaClaw tasks:**
```
You are AnimaClaw v1.7. Read ~/.openclaw/workspace/CODEBASE_MAP.md first.
Codebase root: /Users/mac/Documents/01 - Projects/AnimaOs/ANIMA.clawd/
Dashboard: /Users/mac/Documents/01 - Projects/AnimaOs/ANIMA.clawd/dashboard/src/
Follow the mandatory protocol in Section 0 of the map before touching any file.

Task: [DESCRIBE WHAT YOU WANT HERE]
```

---

## 9. pi_pulse_daemon — How It Works

**File:** `/root/AnimaClaw/setup/pi_pulse_daemon.js` (v1.2.0 SOLARIS Engine)

**Timing:** Fires every π seconds = 3141 ms
**Evolution cycle:** Every ~9.87 heartbeats (π² cycles) it runs a deeper evolution step
**Writes to:** `anima_agent_logs` in Supabase

**Payload written per heartbeat:**
```js
{
  pi_pulse_timestamp: new Date().toISOString(),
  cycle_number: <counter>,
  agent_name: 'pi-pulse',
  vitality_score: <0-1 float>,
  anima_state: 'DORMANT' | 'ACTIVE' | 'EVOLVING' | 'QRL',
  evolution_cycle: <int>,
  qrl_number: <int, 0 if no QRL event>,
  task_description: <string>,
  phi_weight: 1.6180339887,
  mission_alignment: <0-1 float>,
  // ... + many more columns
}
```

**Status confirmed this session:** 98+ rows written, live data flowing.

---

## 10. Pending Work / Next Steps

These were discussed or partially started but not completed:

| Item | Status | Notes |
|---|---|---|
| **CODEBASE_MAP.md** creation | ⚠️ Interrupted | Was being written when session hit context limit — may be partial or complete on disk |
| **Self-modification branch workflow** | 🔲 Not started | AnimaClaw should use `animaclaw/<scope>/<desc>` branches + PRs |
| **VPS deploy of new dashboard build** | 🔲 Not done | Local changes committed to GitHub but VPS still runs older build. Need `git pull` + `pnpm build` on VPS |
| **GitHub repo → private** | 🔲 Deferred | User requested earlier, not completed |
| **Kimi Claw bot token config** | 🔲 Blocked | Token `sk-FT4MWDIQLOPMPHBYRT6PLZEDHH`, correct config path unknown |
| **Clean up `/root/AnimaClaw/dashboard/public/schema.sql`** | 🔲 Minor | Temp file left on VPS, safe to delete |

---

## 11. Key Architectural Decisions Made This Session

1. **Vitals data flow:** Supabase REST (not realtime subscription) polled every 10s via server-side proxy API route. Avoids exposing anon key to client, handles CORS.

2. **Route placement:** `/anima-vitals` added to ANIMACLAW nav group (not OBSERVE) — it's AnimaClaw's own nervous system readout, not a generic monitoring tool.

3. **Chat redesign philosophy:** Inspired by prompt-kit / 21st.dev — buttons have labels, not just icons; prominent glass container; waveform recording animation; attachment chips with hover-remove.

4. **Quick Chat widget:** Uses the same `ChatInput` with `compact` prop — single source of truth, both the overview widget and the `/chat` page use identical input logic.

5. **Self-modification savepoint:** `v1.7-stable` tag permanently marks the last known-good state before AnimaClaw has write access to its own platform.

---

## 12. How to Deploy Changes to VPS

```bash
# On VPS (via Hostinger web terminal):
cd /root/AnimaClaw
git pull origin main
cd dashboard
pnpm install --frozen-lockfile
pnpm build
pm2 restart all    # or: pm2 restart dashboard
```

If PM2 is not configured:
```bash
node .next/standalone/server.js   # standalone mode after build
```

---

*Report generated: 2026-03-18 | Session with Claude Sonnet | AnimaClaw v1.7*
