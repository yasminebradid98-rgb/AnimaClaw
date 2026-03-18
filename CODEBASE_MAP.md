# CODEBASE_MAP.md
# AnimaClaw v1.7 — Machine Navigation Map
# Version: 1.0.0 | Generated: 2026-03-18 | Author: Claude Sonnet 4.6
# ─────────────────────────────────────────────────────────────────────────────
# PURPOSE: This file is read by AnimaClaw (AI agent) BEFORE making ANY change
#          to this codebase. It is not a README. It is a navigation index.
#          Do NOT modify this file unless you also update every section it
#          references. Treat it as ground truth.
# ─────────────────────────────────────────────────────────────────────────────

---

## SECTION 0 — MANDATORY PRE-MODIFICATION PROTOCOL

Before editing ANY file in this repository, AnimaClaw MUST execute the
following checklist in order. Skipping any step is a protocol violation.

```
STEP 1  Read this file (CODEBASE_MAP.md) in full
STEP 2  Check target file against SECTION 6 (PROTECTED FILES)
        → If protected: STOP. Do not modify under any circumstances.
STEP 3  Read the target file completely before writing any change
STEP 4  Identify all downstream consumers from SECTION 3 (dependency map)
STEP 5  Make the minimum-viable change. Do not refactor unrelated code.
STEP 6  Run TypeScript check:  pnpm --filter dashboard typecheck
        → If errors: fix before proceeding
STEP 7  Run unit tests:        pnpm --filter dashboard test
        → If failures: fix before proceeding
STEP 8  Create a feature branch — NEVER commit directly to main
        → Branch naming: animaclaw/<scope>/<short-description>
STEP 9  Open a Pull Request. Never force-push to main.
STEP 10 Update CODEBASE_MAP.md if you added/removed/renamed files
```

Emergency rollback point: `git reset --hard v1.7-stable`

---

## SECTION 1 — DIRECTORY TREE

```
ANIMA.clawd/                         ← Monorepo root
│
├── CODEBASE_MAP.md                  ← THIS FILE — agent navigation map
├── CONSTITUTION.md                  ← ⛔ PROTECTED — governance charter
├── QUANTUM_CONSTITUTION.md          ← ⛔ PROTECTED — quantum law layer
├── natural_law.json                 ← ⛔ PROTECTED — mathematical constants
├── GENESIS.md                       ← Origin story, philosophical foundation
├── SOLARIS.md                       ← SOLARIS engine specification
├── IMMUNE.md                        ← Immune system documentation
├── SWARM.md                         ← Swarm coordination docs
├── WHITEPAPER.md                    ← Public whitepaper
├── MASTER_TEMPLATE.json             ← Agent spawn template
├── SOUL_TEMPLATE.md                 ← Agent soul template
├── CHANGELOG.md                     ← Root-level changelog
├── README.md                        ← Public-facing readme
├── SECURITY.md                      ← Security policy
├── CONTRIBUTING.md                  ← Contribution guide
├── GATEWAY.md                       ← Gateway architecture notes
├── DOCUMENTATION.md                 ← Documentation index
├── QUICKSTART.md                    ← Fast onboarding guide
├── openclaw.json                    ← OpenClaw runtime config
├── package.json                     ← Root npm workspace config
├── ecosystem.config.js              ← PM2 process manager config (VPS)
│
├── agents/                          ← Agent role specifications
│   ├── EVOLUTION_NODE.md
│   ├── IMMUNE_AGENT.md
│   ├── MEMORY_NODE.md
│   ├── PRIMARY_CELL.md
│   ├── ROOT_ORCHESTRATOR.md
│   └── SUPPORT_CELL.md
│
├── core/                            ← Core ANIMA OS config
│   ├── anima_config.json            ← Natural law constants (φ, π, e)
│   └── SOUL.md                      ← Soul framework documentation
│
├── converter/                       ← Brand/schema conversion utilities
│   ├── PROTECTED_FILES.json         ← ⛔ PROTECTED — immune scanner whitelist
│   ├── anima_converter.js
│   ├── brand_patch.js
│   └── merge_config.js
│
├── docs/                            ← High-level architecture docs
│   ├── AGENTS.md
│   └── DEPLOY.md
│
├── integrations/                    ← Third-party integration configs
│   ├── helicone_setup.md
│   ├── langfuse_setup.md
│   ├── lark_notify.js
│   ├── n8n_webhook.json
│   └── ollama_fallback.md
│
├── onboarding/                      ← Agent onboarding modes
│   ├── ORACLE_MODE.md
│   ├── SPARK_MODE.md
│   └── WILD_MODE.md
│
├── runtime/                         ← SOLARIS runtime engine (Node.js)
│   ├── cli.js                       ← CLI entry point
│   ├── evolution_engine.js          ← Evolution cycle logic
│   ├── execution_engine.js          ← Task execution pipeline
│   ├── executor.js                  ← Low-level command executor
│   ├── immune_scanner.js            ← File integrity checker
│   ├── index.js                     ← Runtime entry point
│   ├── llm_client.js                ← LLM abstraction layer
│   ├── memory_system.js             ← Memory read/write
│   ├── natural_law.js               ← φ/π/e constants at runtime
│   ├── phi_core.js                  ← Golden ratio calculations
│   ├── quantum_engine.js            ← QRL event processing
│   ├── swarm.js                     ← Multi-agent coordination
│   └── tests/
│       ├── immune_scanner.test.js
│       ├── phi_core.test.js
│       ├── quantum_engine.test.js
│       └── swarm.test.js
│
├── setup/                           ← Daemon setup scripts
│   ├── pi_pulse_daemon.js           ← π-pulse heartbeat daemon v1.2.0
│   └── verify.js                    ← Environment verification
│
├── skills/                          ← Pluggable skill definitions
│   ├── discord_nerve/SKILL.md
│   ├── fractal_spawn/SKILL.md
│   ├── phi_core/SKILL.md
│   ├── pi_pulse/SKILL.md
│   ├── quantum_layer/SKILL.md
│   ├── supabase_memory/SKILL.md
│   └── telegram_pulse/SKILL.md
│
└── dashboard/                       ← Next.js 16 Mission Control UI
    ├── .env                         ← ⛔ PROTECTED — secrets (never commit)
    ├── package.json                 ← dashboard dependencies
    ├── tsconfig.json                ← TypeScript config (strict mode)
    ├── tailwind.config.js           ← Tailwind + void theme
    ├── postcss.config.js
    ├── eslint.config.mjs
    ├── vitest.config.ts             ← Unit test config
    ├── playwright.config.ts         ← E2E test config
    ├── ecosystem.config.js          ← PM2 config for VPS deployment
    ├── vercel.json                  ← Vercel deployment overrides
    ├── openapi.json                 ← OpenAPI spec
    ├── CLAUDE.md                    ← Claude Code instructions for dashboard
    │
    ├── src/
    │   ├── app/
    │   │   ├── [[...panel]]/
    │   │   │   └── page.tsx         ← ★ CORE: single catch-all page, ContentRouter
    │   │   ├── login/page.tsx       ← Auth page (outside catch-all)
    │   │   ├── layout.tsx           ← Root layout (fonts, i18n, providers)
    │   │   ├── globals.css          ← All custom CSS: void-panel, badge-*, glow-*
    │   │   └── api/                 ← Next.js Route Handlers (see Section 2)
    │   │
    │   ├── components/
    │   │   ├── layout/              ← Chrome-level UI
    │   │   │   ├── nav-rail.tsx     ← ★ Left sidebar navigation (navGroups)
    │   │   │   ├── header-bar.tsx   ← Top bar with connection status
    │   │   │   ├── live-feed.tsx    ← SSE event feed
    │   │   │   ├── local-mode-banner.tsx
    │   │   │   ├── update-banner.tsx
    │   │   │   ├── openclaw-update-banner.tsx
    │   │   │   └── openclaw-doctor-banner.tsx
    │   │   │
    │   │   ├── panels/              ← Full-page panel components (one per route)
    │   │   │   ├── anima-vitals-panel.tsx    ← π-pulse live dashboard [ANIMACLAW]
    │   │   │   ├── activity-feed-panel.tsx
    │   │   │   ├── agent-comms-panel.tsx
    │   │   │   ├── agent-cost-panel.tsx
    │   │   │   ├── agent-squad-panel-phase3.tsx
    │   │   │   ├── alert-rules-panel.tsx
    │   │   │   ├── audit-trail-panel.tsx
    │   │   │   ├── channels-panel.tsx
    │   │   │   ├── chat-page-panel.tsx
    │   │   │   ├── cost-tracker-panel.tsx    ← Uses recharts LineChart/PieChart/BarChart
    │   │   │   ├── cron-management-panel.tsx
    │   │   │   ├── debug-panel.tsx
    │   │   │   ├── exec-approval-panel.tsx
    │   │   │   ├── gateway-config-panel.tsx
    │   │   │   ├── github-sync-panel.tsx
    │   │   │   ├── integrations-panel.tsx
    │   │   │   ├── log-viewer-panel.tsx
    │   │   │   ├── memory-browser-panel.tsx
    │   │   │   ├── memory-graph.tsx
    │   │   │   ├── multi-gateway-panel.tsx
    │   │   │   ├── nodes-panel.tsx
    │   │   │   ├── notifications-panel.tsx
    │   │   │   ├── office-panel.tsx
    │   │   │   ├── orchestration-bar.tsx
    │   │   │   ├── security-audit-panel.tsx
    │   │   │   ├── settings-panel.tsx
    │   │   │   ├── skills-panel.tsx
    │   │   │   ├── standup-panel.tsx
    │   │   │   ├── super-admin-panel.tsx
    │   │   │   ├── task-board-panel.tsx
    │   │   │   ├── user-management-panel.tsx
    │   │   │   └── webhook-panel.tsx
    │   │   │
    │   │   ├── dashboard/           ← Dashboard subcomponents
    │   │   │   ├── dashboard.tsx    ← Overview tab layout
    │   │   │   ├── widget-primitives.tsx  ← ★ Shared atoms: HealthRow, StatRow, SignalPill, MetricCard, LogRow
    │   │   │   ├── widget-grid.tsx  ← Widget grid layout
    │   │   │   ├── stats-grid.tsx
    │   │   │   ├── sessions-list.tsx
    │   │   │   ├── sidebar.tsx
    │   │   │   ├── agent-network.tsx
    │   │   │   └── widgets/
    │   │   │       ├── event-stream-widget.tsx
    │   │   │       ├── gateway-health-widget.tsx  ← Golden signals pattern
    │   │   │       ├── github-signal-widget.tsx
    │   │   │       ├── maintenance-widget.tsx
    │   │   │       ├── metric-cards-widget.tsx
    │   │   │       ├── onboarding-checklist-widget.tsx
    │   │   │       ├── quick-actions-widget.tsx
    │   │   │       ├── runtime-health-widget.tsx  ← HealthRow usage pattern
    │   │   │       ├── security-audit-widget.tsx
    │   │   │       ├── session-workbench-widget.tsx
    │   │   │       └── task-flow-widget.tsx
    │   │   │
    │   │   ├── anima/               ← AnimaClaw-specific components
    │   │   │   ├── AnimaAgentList.tsx
    │   │   │   ├── AnimaMemoryGraph.tsx
    │   │   │   ├── ClientWorkspace.tsx
    │   │   │   └── UsageTierPanel.tsx
    │   │   │
    │   │   ├── chat/
    │   │   │   └── chat-panel.tsx
    │   │   │
    │   │   ├── modals/
    │   │   │   ├── exec-approval-overlay.tsx
    │   │   │   └── project-manager-modal.tsx
    │   │   │
    │   │   ├── onboarding/
    │   │   │   └── onboarding-wizard.tsx
    │   │   │
    │   │   ├── ErrorBoundary.tsx
    │   │   └── ui/                  ← Shadcn/Radix primitives (button, loader, etc.)
    │   │
    │   ├── lib/                     ← Pure utility modules (no UI)
    │   │   ├── use-vitals.ts        ← ★ Pi-pulse polling hook (10s, visibility-aware)
    │   │   ├── use-smart-poll.ts    ← Generic visibility-aware polling hook
    │   │   ├── use-server-events.ts ← SSE subscription hook
    │   │   ├── use-focus-trap.ts
    │   │   ├── db.ts                ← SQLite db access (local runtime)
    │   │   ├── auth.ts              ← Session auth utilities
    │   │   ├── config.ts            ← Runtime config loader
    │   │   ├── navigation.ts        ← panelHref, useNavigateToPanel
    │   │   ├── navigation-metrics.ts
    │   │   ├── plugins.ts           ← Plugin panel registry
    │   │   ├── websocket.ts         ← WebSocket hook
    │   │   ├── version.ts           ← APP_VERSION constant
    │   │   ├── models.ts            ← MODEL_CATALOG
    │   │   ├── logger.ts            ← Server-side logger
    │   │   ├── client-logger.ts     ← Client-side logger factory
    │   │   ├── security-scan.ts
    │   │   ├── scheduler.ts
    │   │   ├── sessions.ts
    │   │   ├── tasks.ts
    │   │   ├── agents.ts
    │   │   └── [40+ other utility modules]
    │   │
    │   ├── store/
    │   │   └── index.ts             ← ★ Zustand global store (useMissionControl)
    │   │
    │   ├── styles/
    │   │   └── design-tokens.ts     ← HSL color constants, spacing, radius
    │   │
    │   ├── theme/
    │   │   └── anima-theme.ts       ← Theme overrides
    │   │
    │   ├── types/
    │   │   └── index.ts             ← Global TypeScript types
    │   │
    │   └── plugins/
    │       └── hyperbrowser-example.ts
    │
    ├── tests/                       ← Playwright E2E tests (50+ specs)
    ├── docs/                        ← Dashboard-specific documentation
    ├── messages/                    ← i18n translation files (10 locales)
    ├── scripts/                     ← Build/CI utilities
    ├── skills/                      ← Claude Code skills (installer, manage)
    └── wiki/                        ← GitHub wiki content
```

---

## SECTION 2 — ROUTING STRUCTURE

### URL → Panel mapping

All URLs are handled by `src/app/[[...panel]]/page.tsx` (catch-all route).
The `activeTab` variable is derived from the URL path segment.

```
URL PATH              CASE IN ContentRouter        COMPONENT RENDERED
─────────────────     ────────────────────────     ─────────────────────────────────
/                     'overview' (default)          <Dashboard />
/agents               'agents'                      <AgentSquadPanelPhase3 />
/tasks                'tasks'                       <TaskBoardPanel />
/chat                 'chat'                        <ChatPagePanel />
/channels             'channels'                    <ChannelsPanel />          [gateway required]
/skills               'skills'                      <SkillsPanel />
/memory               'memory'                      <MemoryBrowserPanel />
/activity             'activity'                    <ActivityFeedPanel />
/logs                 'logs'                        <LogViewerPanel />
/cost-tracker         'cost-tracker'                <CostTrackerPanel />
/tokens               'tokens'                      → redirects to cost-tracker
/agent-costs          'agent-costs'                 → redirects to cost-tracker
/nodes                'nodes'                       <NodesPanel />             [gateway required]
/exec-approvals       'exec-approvals'              <ExecApprovalPanel />      [gateway required]
/office               'office'                      <OfficePanel />
/cron                 'cron'                        <CronManagementPanel />
/webhooks             'webhooks'                    <WebhookPanel />
/alerts               'alerts'                      <AlertRulesPanel />
/github               'github'                      <GitHubSyncPanel />
/security             'security'                    <SecurityAuditPanel />
/users                'users'                       <UserManagementPanel />
/audit                'audit'                       <AuditTrailPanel />
/gateways             'gateways'                    <MultiGatewayPanel />      [gateway required]
/gateway-config       'gateway-config'              <GatewayConfigPanel />     [gateway required]
/integrations         'integrations'                <IntegrationsPanel />
/settings             'settings'                    <SettingsPanel />
/super-admin          'super-admin'                 <SuperAdminPanel />
/debug                'debug'                       <DebugPanel />
/notifications        'notifications'               <NotificationsPanel />
/standup              'standup'                     <StandupPanel />
/sessions             'sessions'                    <SessionDetailsPanel />
/history              'history'                     <AgentHistoryPanel />
/anima-vitals         'anima-vitals'                <AnimaVitalsPanel />       [ANIMACLAW group]
/anima-agents         'anima-agents'                <AnimaAgentList />         [ANIMACLAW group]
/anima-workspaces     'anima-workspaces'            <ClientWorkspace />        [ANIMACLAW group]
/anima-usage          'anima-usage'                 <UsageTierPanel />         [ANIMACLAW group]
/anima-memory         'anima-memory'                <AnimaMemoryGraph />       [ANIMACLAW group]
```

### NavRail group structure (src/components/layout/nav-rail.tsx)

```
GROUP: core          (no label)
  overview · agents · tasks · chat · channels · skills · memory

GROUP: observe       label="OBSERVE"
  activity · logs · cost-tracker · nodes · exec-approvals · office

GROUP: automate      label="AUTOMATE"
  cron · webhooks · alerts · github

GROUP: admin         label="ADMIN"
  security · users · audit · gateway-parent[gateways, gateway-config] · integrations · debug · settings

GROUP: animaclaw     label="ANIMACLAW"
  anima-vitals · anima-agents · anima-workspaces · anima-usage · anima-memory
```

### API Routes (src/app/api/)

```
VITALS (AnimaClaw)
  GET  /api/vitals                  Supabase proxy → anima_agent_logs (pi-pulse data)

AUTH
  POST /api/auth/login              Credential auth, sets session cookie
  POST /api/auth/logout
  GET  /api/auth/me                 Current user from session
  GET  /api/auth/users
  POST /api/auth/access-requests
  GET/POST /api/auth/google         OAuth Google flow
  DELETE /api/auth/google/disconnect

AGENTS
  GET/POST     /api/agents          List / create agents
  GET/PUT/DEL  /api/agents/[id]     Single agent CRUD
  POST         /api/agents/[id]/wake
  POST         /api/agents/[id]/heartbeat
  GET/POST     /api/agents/[id]/memory
  GET/POST     /api/agents/[id]/keys
  GET/POST     /api/agents/[id]/soul
  POST         /api/agents/register
  POST         /api/agents/sync
  POST         /api/agents/message
  POST         /api/agents/evals
  POST         /api/agents/optimize
  GET/POST     /api/agents/comms

TASKS
  GET/POST     /api/tasks
  GET/PUT/DEL  /api/tasks/[id]
  POST         /api/tasks/[id]/broadcast
  POST         /api/tasks/[id]/branch
  GET/POST     /api/tasks/[id]/comments
  GET          /api/tasks/outcomes
  GET          /api/tasks/queue
  POST         /api/tasks/regression
  GET          /api/claude-tasks

SESSIONS
  GET          /api/sessions
  POST         /api/sessions/continue
  POST         /api/sessions/[id]/control
  GET          /api/sessions/transcript
  GET          /api/sessions/transcript/aggregate
  GET          /api/sessions/transcript/gateway

MEMORY
  GET/POST/DEL /api/memory
  GET          /api/memory/context
  GET          /api/memory/graph
  GET          /api/memory/health
  POST         /api/memory/links
  POST         /api/memory/process

GATEWAYS
  GET/POST     /api/gateways
  POST         /api/gateways/connect
  POST         /api/gateways/discover
  GET          /api/gateways/health
  GET          /api/gateways/health/history

TOKENS / COST
  GET          /api/tokens
  POST         /api/tokens/rotate
  GET          /api/tokens/by-agent

NOTIFICATIONS
  GET/POST     /api/notifications
  POST         /api/notifications/deliver

CRON / SCHEDULER
  GET/POST/DEL /api/cron
  GET/POST     /api/scheduler
  POST         /api/schedule-parse

WEBHOOKS
  GET/POST/DEL /api/webhooks
  GET          /api/webhooks/deliveries

ALERTS
  GET/POST/DEL /api/alerts

EXEC APPROVALS
  GET/POST/PUT /api/exec-approvals

NODES
  GET          /api/nodes

PROJECTS
  GET/POST     /api/projects
  GET/PUT/DEL  /api/projects/[id]
  GET/POST     /api/projects/[id]/agents
  GET/POST     /api/projects/[id]/tasks

CHAT
  GET/POST     /api/chat/conversations
  GET/POST     /api/chat/messages
  GET/PUT/DEL  /api/chat/messages/[id]
  GET/PUT      /api/chat/session-prefs

MISC
  GET          /api/status           Capabilities + subscription check
  GET          /api/activities
  GET          /api/audit
  GET/POST     /api/settings
  GET          /api/logs
  GET          /api/search
  GET          /api/export
  GET          /api/diagnostics
  POST         /api/debug
  GET          /api/events           SSE stream
  GET          /api/connect
  GET          /api/releases/check
  POST         /api/releases/update
  GET          /api/openclaw/version
  POST         /api/openclaw/update
  GET          /api/openclaw/doctor
  GET/POST     /api/skills
  GET          /api/skills/registry
  GET          /api/integrations
  GET          /api/security-audit
  GET          /api/security-scan
  POST         /api/security-scan/agent
  POST         /api/security-scan/fix
  GET          /api/users
  POST         /api/spawn
  POST         /api/cleanup
  GET          /api/backup
  POST         /api/pipelines
  POST         /api/pipelines/run
  POST         /api/standup
  GET          /api/channels
  GET/POST     /api/docs
  GET          /api/docs/tree
  GET          /api/docs/content
  GET          /api/docs/search
  GET          /api/index
  GET          /api/mentions
  POST         /api/gnap
  POST         /api/adapters
  GET          /api/hermes
  GET          /api/hermes/memory
  GET          /api/hermes/tasks
  GET          /api/local/agents-doc
  GET          /api/local/flight-deck
  POST         /api/local/terminal
  GET          /api/claude/sessions
  GET          /api/super/tenants
  DEL          /api/super/tenants/[id]/decommission
  GET          /api/super/provision-jobs
  POST         /api/super/provision-jobs/[id]/run
  GET          /api/super/os-users
  GET/POST     /api/quality-review
```

---

## SECTION 3 — COMPONENT DEPENDENCY MAP

### Atomic primitives (src/components/dashboard/widget-primitives.tsx)

These are imported by many components. Changes here have wide blast radius.

```
MetricCard      ← used by: metric-cards-widget.tsx, dashboard.tsx
SignalPill      ← used by: gateway-health-widget.tsx, runtime-health-widget.tsx,
                           anima-vitals-panel.tsx
HealthRow       ← used by: runtime-health-widget.tsx, gateway-health-widget.tsx,
                           anima-vitals-panel.tsx
StatRow         ← used by: runtime-health-widget.tsx, anima-vitals-panel.tsx
LogRow          ← used by: log-viewer-panel.tsx, activity-feed-panel.tsx
```

### Panels → dependencies

```
anima-vitals-panel.tsx
  → @/lib/use-vitals                (polling hook)
  → @/components/dashboard/widget-primitives  (HealthRow, StatRow, SignalPill)
  → recharts                        (LineChart, Line, Tooltip, ResponsiveContainer, ReferenceLine)

cost-tracker-panel.tsx
  → recharts                        (PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
                                     CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar)
  → @/lib/client-logger
  → @/store

runtime-health-widget.tsx
  → @/components/dashboard/widget-primitives (HealthRow, StatRow)
  → @/store

gateway-health-widget.tsx
  → @/components/dashboard/widget-primitives (SignalPill, HealthRow)
  → @/lib/use-smart-poll

dashboard.tsx (overview tab)
  → @/components/dashboard/widget-primitives
  → @/components/dashboard/widgets/*  (all 11 widgets)
  → @/store

page.tsx (ContentRouter)
  → ALL panel components (35+ imports)
  → @/components/layout/nav-rail
  → @/components/layout/header-bar
  → @/components/layout/live-feed
  → @/store
  → @/lib/websocket
  → @/lib/use-server-events
  → @/lib/navigation
  → @/lib/plugins
```

### Hooks → data sources

```
useVitals()         → GET /api/vitals      → Supabase anima_agent_logs
useSmartPoll()      → any URL (generic)
useServerEvents()   → GET /api/events      → SSE stream from runtime
useWebSocket()      → wss://gateway        → Gateway WebSocket
useMissionControl() → Zustand store        → in-memory global state
```

---

## SECTION 4 — DATA FLOW

### Pi-Pulse live data path

```
VPS (72.62.236.19)
└── setup/pi_pulse_daemon.js        fires every π seconds (3141ms)
    └── writes row to Supabase
        table: anima_agent_logs
        project: alrmwsfzamwsxhgockyj
        key columns:
          pi_pulse_timestamp  TIMESTAMPTZ  ← heartbeat time
          vitality_score      NUMERIC      ← 0.0–1.0 health score
          cycle_number        INTEGER      ← heartbeat count
          evolution_cycle     INTEGER      ← evolution epoch (increments ~every 9 beats)
          qrl_number          INTEGER      ← Quantum Reinforcement Loop event ID (0 = no event)
          task_description    TEXT         ← active task summary
          agent_name          TEXT         ← 'pi-pulse'
          anima_state         TEXT         ← ACTIVE / DORMANT / EVOLVING / QRL
          agents_active       INTEGER
          queue_state         TEXT
          phi_weight          NUMERIC      ← φ = 1.618...
          mission_alignment   NUMERIC      ← 0.0–1.0
          fractal_depth       NUMERIC
          model_used          TEXT
          tokens_used         INTEGER
          cost_usd            NUMERIC

Dashboard (browser)
└── AnimaVitalsPanel renders
    └── useVitals(limit=80, interval=10_000)
        ├── polls every 10s (pauses if tab hidden, resumes on focus)
        └── GET /api/vitals?limit=80
            └── src/app/api/vitals/route.ts
                ├── reads SUPABASE_URL + SUPABASE_ANON_KEY from env
                ├── fetch Supabase REST API
                │   GET {SUPABASE_URL}/rest/v1/anima_agent_logs
                │   ?select=[17 columns]&order=pi_pulse_timestamp.desc&limit=N
                └── returns { records: VitalRecord[], meta: VitalsMeta }
                    meta computed server-side:
                      count, latest, avgVitality,
                      qrlEventCount, latestQrl, latestCycle, anima_state
```

### Standard gateway data path

```
Browser
└── useMissionControl() [Zustand store]
    └── populated by:
        ├── useWebSocket()      ← live events from gateway WebSocket
        ├── useServerEvents()   ← SSE stream /api/events (local mode)
        └── fetch calls         ← various /api/* endpoints (REST)
```

### Supabase schema (ANIMA OS v1.5.0)

```
Tables (6):
  anima_agent_logs        ← pi-pulse writes here (38 columns)
  anima_master_profile    ← Agent identity and constitutional alignment
  anima_task_queue        ← Queued agent tasks
  anima_memory            ← Agent memory entries
  anima_sessions          ← Session state
  anima_constitutional_log ← Law-binding event log

RLS: 17 policies (all tables locked behind anon key)
Realtime: enabled on anima_agent_logs
PostgREST cache: refresh with NOTIFY pgrst, 'reload schema'
```

---

## SECTION 5 — DESIGN SYSTEM RULES

AnimaClaw MUST follow these rules exactly when writing UI components.
Deviating from these creates visual inconsistency and fails code review.

### Color tokens (src/styles/design-tokens.ts)

```typescript
// Primary accent — use for charts, active states, focus rings
--void-cyan     hsl(187 82% 53%)   #22D3EE   recharts: '#22D3EE'

// Secondary accent — use for success, growth metrics
--void-mint     hsl(160 60% 52%)   #34D399   recharts: '#34D399'

// Warning — use for moderate alerts, QRL events
--void-amber    hsl(38  92% 50%)   #F59E0B   recharts: '#FBBF24'

// Error / critical
--void-crimson  hsl(0   72% 51%)   #DC2626   recharts: '#F87171'

// Decorative accent
--void-violet   hsl(263 90% 66%)   #A78BFA

// Backgrounds (darkest to lightest)
--background    hsl(215 27% 4%)    #07090C   ← deepest void
--card          hsl(220 30% 8%)    #0F141C
--secondary     hsl(220 25% 11%)
--muted         hsl(220 20% 14%)
--border        hsl(220 20% 14%)
```

### Typography

```
font-mono-tight  →  JetBrains Mono / SF Mono / Fira Code (tabular-nums)
                    Use for: all numbers, timestamps, scores, IDs, status values
                    Apply with: className="font-mono-tight"

text-xs          →  0.75rem  — standard panel content
text-2xs         →  0.625rem — labels, metadata, secondary info
                    Apply with: className="text-2xs" (defined in tailwind.config.js)
text-sm          →  0.875rem — panel headers, section titles
```

### Layout primitives (CSS classes from globals.css)

```css
/* Container classes */
.void-panel      bg-card/90 + backdrop-blur + border + cyan inner glow
                 Use for: all data panels and cards
.panel           bg-card + border (no glass effect)
                 Use for: simpler non-animated containers

/* Structure inside a panel */
.panel-header    px-4 py-3 border-b flex items-center justify-between
                 Contents: left=title text, right=status badge or action
.panel-body      p-4
                 Contents: the panel data

/* Status badges — always inline with text-2xs or text-xs */
.badge-success   green  — bg-green-500/15  text-green-400  border-green-500/20
.badge-warning   amber  — bg-amber-500/15  text-amber-400  border-amber-500/20
.badge-error     red    — bg-red-500/15    text-red-400    border-red-500/20
.badge-info      blue   — bg-blue-500/15   text-blue-400   border-blue-500/20
.badge-neutral   muted  — bg-muted         text-muted-foreground  border-border

/* Glow effects — use sparingly on active/alert states */
.glow-cyan       0 0 20px hsl(void-cyan / 0.2), 0 0 40px hsl(void-cyan / 0.08)
.glow-mint       0 0 20px hsl(void-mint / 0.2), 0 0 40px hsl(void-mint / 0.08)
.glow-amber      0 0 20px hsl(void-amber / 0.2)
.glow-violet     0 0 20px hsl(void-violet / 0.2)

/* Animation */
.pulse-dot       scale pulse 2s infinite — use on live indicator dots
.pulse-live      opacity pulse 2s infinite — use on "LIVE" text badges
.shimmer         loading skeleton animation

/* Transitions */
.transition-smooth  transition-all duration-200 ease-out
```

### Component usage rules

```
HealthRow(label, value, status, bar?)
  → label:  text-xs text-muted-foreground (left)
  → value:  text-xs font-mono-tight colored by status (right)
  → bar:    optional progress bar (0–100), auto-colors red/amber/green
  → Use for: metric rows with optional visual bar

StatRow(label, value, alert?)
  → No bar, simpler layout, alert=true makes value red
  → Use for: key-value pairs without visual emphasis

SignalPill(label, value, tone)
  → tone: 'success' | 'warning' | 'info'
  → Use for: small labeled status chips in a grid

MetricCard(label, value, total?, subtitle?, icon, color)
  → color: 'blue' | 'green' | 'purple' | 'red'
  → Use for: large KPI number cards
```

### Recharts conventions

```typescript
// Always wrap in: <ResponsiveContainer width="100%" height={N}>
// Use stroke colors from void palette — never hardcode other colors
// Primary line:   stroke="#22D3EE"  strokeWidth={1.5}  dot={false}
// Secondary line: stroke="#34D399"  strokeWidth={1.5}  dot={false}
// Warning refs:   stroke="#FBBF24"  strokeDasharray="3 3" strokeOpacity={0.4}

// Custom tooltip pattern:
function MyTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded px-2.5 py-1.5 text-xs font-mono-tight shadow-lg">
      {/* content */}
    </div>
  )
}
```

### Hook patterns

```typescript
// Visibility-aware polling — always use this pattern, not setInterval alone
// See: src/lib/use-vitals.ts or src/lib/use-smart-poll.ts for reference
// Key behaviors:
//   1. Fetch immediately on mount
//   2. Pause interval when document.visibilityState === 'hidden'
//   3. Resume + immediate refetch when tab regains focus
//   4. Clean up interval on unmount
```

### Panel structure template

```tsx
'use client'
// 1. React imports
// 2. Library imports (recharts, etc.)
// 3. Local imports: hooks, primitives, types
// 4. Constants (colors, thresholds)
// 5. Helpers (pure functions)
// 6. Custom Tooltip component (if recharts used)
// 7. Main panel export function
// 8. Sub-components (rows, event items, etc.)
// 9. Icon component (inline SVG, w-5 h-5, viewBox="0 0 20 20")

export function MyPanel() {
  // hook calls at top
  // loading state → return spinner with font-mono-tight message
  // error state   → return void-panel with badge-error
  // main render   → flex flex-col gap-4 p-4 h-full overflow-y-auto
}
```

---

## SECTION 6 — PROTECTED FILES

AnimaClaw MUST NEVER modify these files under any circumstances.
There are no exceptions. If a task requires modifying a protected file,
the task must be escalated to human review.

```
PROTECTED FILE                          REASON
─────────────────────────────────────   ─────────────────────────────────────────
/ANIMA.clawd/CONSTITUTION.md            Governance charter — immutable law
/ANIMA.clawd/QUANTUM_CONSTITUTION.md    Quantum law layer — immutable law
/ANIMA.clawd/natural_law.json           Mathematical constants (φ, π, e)
/ANIMA.clawd/converter/PROTECTED_FILES.json  Immune scanner whitelist
/ANIMA.clawd/dashboard/.env             Secrets — SUPABASE_URL, keys, tokens
/ANIMA.clawd/dashboard/.env.local       Secrets (local override)
/ANIMA.clawd/dashboard/.env.production  Secrets (production)
```

Additionally, treat these as high-risk (require human approval before modifying):

```
HIGH-RISK FILE                          REASON
─────────────────────────────────────   ─────────────────────────────────────────
dashboard/src/store/index.ts            Global state — changes affect every panel
dashboard/src/app/globals.css           Design system — changes affect all UI
dashboard/src/styles/design-tokens.ts  Color palette — changes affect all charts
dashboard/src/app/[[...panel]]/page.tsx ContentRouter — all routes depend on this
dashboard/src/components/layout/nav-rail.tsx  Navigation — affects all users
dashboard/src/components/dashboard/widget-primitives.tsx  Used by 10+ components
dashboard/src/lib/auth.ts               Authentication logic
dashboard/src/lib/db.ts                 Database access layer
dashboard/src/app/api/auth/login/route.ts  Auth endpoint
dashboard/tsconfig.json                 Compiler config — strict mode enforced
dashboard/tailwind.config.js            CSS build config
```

---

## SECTION 7 — MODIFICATION RULES

### Rule 1: Branch-first

```bash
# Always create a branch before any change
git checkout -b animaclaw/<scope>/<description>
# Examples:
#   animaclaw/panel/add-entropy-chart
#   animaclaw/api/add-qrl-filter-endpoint
#   animaclaw/fix/vitals-loading-state
```

### Rule 2: Read before write

```
Before editing any file:
1. Read the ENTIRE file — not just the section you plan to change
2. Check Section 3 of this map for downstream consumers
3. If the file exports types/interfaces, search for all importers:
   grep -r "from '@/components/panels/anima-vitals-panel'" src/
```

### Rule 3: Type safety

```bash
# Run after every file change — zero errors required before committing
pnpm --filter dashboard typecheck

# Run unit tests
pnpm --filter dashboard test

# Run E2E tests (when adding new routes/endpoints)
pnpm --filter dashboard test:e2e
```

### Rule 4: Adding a new panel

```
Checklist for adding a panel at /my-panel:
□ Create: src/components/panels/my-panel.tsx
□ Add import to: src/app/[[...panel]]/page.tsx
□ Add case 'my-panel': to ContentRouter switch in page.tsx
□ Add nav item to: src/components/layout/nav-rail.tsx (correct group)
□ Add icon function to nav-rail.tsx (inline SVG, 20×20 viewBox)
□ Update CODEBASE_MAP.md Section 1 (directory tree) and Section 2 (routing)
□ Run typecheck → 0 errors
□ Commit and open PR
```

### Rule 5: Adding a new API route

```
Checklist:
□ Create: src/app/api/<name>/route.ts
□ Export: GET and/or POST function
□ No secrets in route file — read from process.env only
□ Return NextResponse.json() always
□ Handle errors with try/catch → return { error: '...' } + appropriate status
□ Document route in Section 2 of this map
□ Run typecheck → 0 errors
```

### Rule 6: Commit format

```
<type>(<scope>): <short description>

Types:
  feat      new feature / panel / endpoint
  fix       bug fix
  refactor  code restructure (no behavior change)
  style     CSS / design-system only
  test      tests only
  docs      documentation only
  meta      CODEBASE_MAP.md or tooling config

Examples:
  feat(panel): add entropy sparkline to anima-vitals
  fix(api): handle null vitality_score in /api/vitals
  meta: update CODEBASE_MAP.md routing table for new panel
```

### Rule 7: Never push to main directly

```bash
# Forbidden — never do this:
git push origin main

# Correct flow:
git push origin animaclaw/<scope>/<description>
gh pr create --title "..." --body "..."
# Wait for human approval before merging
```

### Rule 8: Environment variables

```
All secrets are accessed via process.env in API routes only.
Never access process.env in client components ('use client').
Never hardcode URLs, keys, or tokens anywhere.

Required env vars for dashboard:
  SUPABASE_URL        https://alrmwsfzamwsxhgockyj.supabase.co
  SUPABASE_ANON_KEY   (anon public key — safe for server-side fetch)
  DATABASE_URL        SQLite path for local runtime
  SESSION_SECRET      Cookie signing secret
  [others defined in dashboard/.env]
```

---

## SECTION 8 — TECH STACK REFERENCE

```
Runtime / Framework
  Next.js           16.1.6    App Router, catch-all [[...panel]] route
  React             19.0.1    Server + Client components
  TypeScript        5.7.2     Strict mode (noEmit checks enforced)
  Node.js           ≥20       Required (check-node-version.mjs enforces this)

Styling
  Tailwind CSS      3.4.17    Utility-first, extended with void theme
  globals.css                 Custom CSS: void-panel, badges, glows, animations
  JetBrains Mono              Monospace font for all data display

State & Data
  Zustand           5.0.11    Global state (useMissionControl)
  recharts          3.7.0     All charts (LineChart, PieChart, BarChart)
  next-intl         4.8.3     i18n (10 locales: en, ar, de, es, fr, ja, ko, pt, ru, zh)

External Services
  Supabase                    Cloud Postgres (project: alrmwsfzamwsxhgockyj)
  VPS (72.62.236.19)          AnimaClaw runtime, pi_pulse_daemon

Testing
  Vitest            2.1.5     Unit tests (src/lib/, API routes)
  Playwright                  E2E tests (tests/*.spec.ts, 50+ specs)

Package Manager
  pnpm                        Workspace monorepo

Deployment
  PM2               ecosystem.config.js    VPS process manager
  Vercel            vercel.json            Cloud deployment option
```

---

## SECTION 9 — KNOWN GOTCHAS

```
1. CATCH-ALL ROUTE
   src/app/[[...panel]]/page.tsx intercepts ALL unmatched paths.
   Static files in /public/ are served before the catch-all.
   API routes at /api/* are NOT intercepted.

2. SPECIAL CHARACTER IN PATH
   The catch-all route file is at: src/app/[[...panel]]/page.tsx
   Git and shell require quoting: 'src/app/[[...panel]]/page.tsx'
   git add 'src/app/[[...panel]]/page.tsx'

3. SUPABASE SCHEMA CACHE
   After adding columns to Supabase tables, run:
   NOTIFY pgrst, 'reload schema';
   Then restart pi_pulse_daemon on VPS.

4. MIXED CONTENT / CORS
   Dashboard at http://VPS:PORT cannot call https://api.supabase.com
   (CORS blocks it — Management API only allows supabase.com origin).
   All Supabase REST calls must go through /api/vitals (server-side proxy).

5. GATEWAY-REQUIRED PANELS
   Panels: channels, nodes, exec-approvals, gateways, gateway-config
   Render <LocalModeUnavailable /> when isLocal === true.
   Always check this when adding new gateway-dependent panels.

6. TYPESCRIPT STRICT MODE
   tsconfig.json has strict: true.
   All props must be typed. No implicit any. No unused vars.
   Run pnpm typecheck — it must return 0 errors before committing.

7. VITALS NULL SAFETY
   VitalRecord fields can be null (Supabase returns null for empty columns).
   Always use: meta?.latest?.field ?? fallback
   Never access nested props without optional chaining.

8. PI-PULSE EVOLUTION TIMING
   pi_pulse_daemon fires every 3141ms (π seconds).
   Evolution cycles occur every ~9 heartbeats (~28s).
   QRL events are rare (Quantum Reinforcement Loops).
   Do not alarm on empty QRL log — it is normal.

9. NAV-RAIL ICON FORMAT
   All icons are inline SVG components: function XxxIcon()
   ViewBox: "0 0 20 20", className="w-5 h-5", fill="none"
   stroke="currentColor" strokeWidth="1.5"
   Define icon function immediately before or after the group it appears in.
```

---

*Last updated: 2026-03-18 | Commit: post v1.7-stable savepoint*
*Update this file whenever you add/remove/rename any file, route, or component.*
