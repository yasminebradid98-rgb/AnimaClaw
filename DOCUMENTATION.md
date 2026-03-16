# ANIMA OS — Full Technical Documentation
**Version:** 1.5.0 STABLE
**Engine:** SOLARIS
**Author:** Riyad Ketami
**Last Updated:** March 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Mathematical Foundation](#3-mathematical-foundation)
4. [Constitutional Laws](#4-constitutional-laws)
5. [Agent System](#5-agent-system)
6. [Quantum Intelligence Layer](#6-quantum-intelligence-layer)
7. [Evolution & Vitality System](#7-evolution--vitality-system)
8. [Database Schema](#8-database-schema)
9. [Runtime & Daemon](#9-runtime--daemon)
10. [Dashboard](#10-dashboard)
11. [API Reference](#11-api-reference)
12. [Integrations](#12-integrations)
13. [Deployment](#13-deployment)
14. [Configuration Reference](#14-configuration-reference)
15. [Onboarding Modes](#15-onboarding-modes)
16. [Security & Immune System](#16-security--immune-system)
17. [CLI Reference](#17-cli-reference)
18. [Troubleshooting](#18-troubleshooting)

---

## 1. Overview

**ANIMA OS** is a self-deploying, self-evolving agentic operating system governed by mathematical constants. It is not a chatbot, a workflow tool, or a prompt wrapper — it is a living digital organism that thinks, adapts, and evolves autonomously around a single human mission.

### Core Principles

- **One Master, One Mission** — ANIMA OS is a single-user system designed around one person's mission DNA
- **Mathematically Governed** — Every timing, weight, decision, and threshold is derived from φ, π, e, and the Fibonacci sequence — never arbitrary
- **Self-Evolving** — The system learns from every cycle and permanently encodes winning behaviors into its own laws
- **Fractal Structure** — Agents spawn and prune following Fibonacci limits; the architecture mirrors itself at every depth level
- **Always Running** — A background daemon fires every π seconds (3.14s), keeping ANIMA OS alive 24/7

### What ANIMA OS Does

| Capability | Description |
|-----------|-------------|
| **Mission Execution** | Routes tasks to agents based on φ-weighted capacity |
| **Quantum Decision-Making** | Evaluates N strategies simultaneously before acting |
| **Memory Persistence** | Every action, cost, and decision logged to Supabase |
| **Behavioral Evolution** | Rewrites its own laws every π² cycles based on performance |
| **Security Scanning** | IMMUNE_AGENT validates all outputs for alignment drift |
| **Real-time Dashboard** | Live agent tree, quantum state, evolution log, cost tracker |
| **Multi-Platform Notifications** | Discord + Telegram alerts and reports |

---

## 2. Architecture

ANIMA OS is structured in 7 layers, each with a distinct responsibility:

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 0 — CONSTITUTION (Immutable)                         │
│  CONSTITUTION.md (Laws 1–5) + QUANTUM_CONSTITUTION.md       │
│  (Laws 6–12) + natural_law.json                             │
├─────────────────────────────────────────────────────────────┤
│  LAYER 1 — IDENTITY (Mutable per mission)                   │
│  SOUL_TEMPLATE.md + GENESIS.md + MASTER_TEMPLATE.json       │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2 — AGENT HIERARCHY (Fractal, φ-weighted)            │
│  ROOT_ORCHESTRATOR → PRIMARY_CELL + SUPPORT_CELL            │
│                        └→ MEMORY_NODE + EVOLUTION_NODE      │
│                           + IMMUNE_AGENT                    │
├─────────────────────────────────────────────────────────────┤
│  LAYER 3 — RUNTIME (Node.js 18+)                            │
│  phi_core.js + quantum_engine.js + evolution_engine.js      │
│  + memory_system.js + swarm.js + immune_scanner.js          │
├─────────────────────────────────────────────────────────────┤
│  LAYER 4 — PERSISTENCE (Supabase)                           │
│  5 Tables: agent_logs, fractal_state, evolution_log,        │
│  cost_tracker, master_profile                               │
├─────────────────────────────────────────────────────────────┤
│  LAYER 5 — INTEGRATIONS                                     │
│  Discord · Telegram · n8n · Helicone · Langfuse · Ollama    │
├─────────────────────────────────────────────────────────────┤
│  LAYER 6 — DASHBOARD (Next.js 14 + Supabase Realtime)       │
│  6 pages · 6 API routes · Vercel deployment                 │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
ANIMA.clawd/
├── CONSTITUTION.md          # Laws 1–5 (immutable)
├── QUANTUM_CONSTITUTION.md  # Laws 6–12 (immutable)
├── SOUL_TEMPLATE.md         # Mission DNA template
├── GENESIS.md               # Live heartbeat state (rewritten every π seconds)
├── SOLARIS.md               # Seed file — bootstraps the system
├── GATEWAY.md               # Component registration protocol
├── IMMUNE.md                # Security scan protocols
├── SWARM.md                 # Swarm coordination rules
├── natural_law.json         # Mathematical constant registry
├── openclaw.json            # System configuration registry
├── package.json             # v1.5.0 npm scripts
│
├── core/
│   ├── anima_config.json    # Internal configuration
│   ├── SOUL.md              # Core identity + voice rules
│   └── MASTER_TEMPLATE.json # User profile template
│
├── runtime/
│   ├── cli.js               # Entry point (PM2 process: anima-os)
│   ├── phi_core.js          # φ-based routing engine
│   ├── quantum_engine.js    # Quantum decision cycles
│   ├── evolution_engine.js  # Behavioral adaptation
│   ├── memory_system.js     # Supabase read/write
│   ├── swarm.js             # Agent coordination
│   └── immune_scanner.js    # Security validation
│
├── setup/
│   ├── installer.js         # One-command setup
│   ├── verify.js            # 24-point verification suite
│   ├── pi_pulse_daemon.js   # Background heartbeat (PM2: pi-pulse)
│   └── supabase_schema.sql  # Database schema
│
├── onboarding/
│   ├── oracle_prompt.txt    # ORACLE interview prompt
│   └── spark_prompt.txt     # SPARK quick-start prompt
│
└── dashboard/               # Next.js 14 application
    ├── pages/
    │   ├── index.js         # Mission Control
    │   ├── agents.js        # Agent Management
    │   ├── quantum.js       # Quantum Intelligence Layer
    │   ├── evolution.js     # Evolution Log
    │   ├── costs.js         # Cost Tracker
    │   ├── settings.js      # Settings + Onboarding
    │   └── api/
    │       ├── master.js    # Profile CRUD (service key)
    │       ├── agents.js    # Agent state reads
    │       ├── evolution.js # Evolution log reads
    │       ├── quantum.js   # Quantum state reads
    │       ├── tasks.js     # Task log reads
    │       ├── vitality.js  # Vitality calculation
    │       └── costs.js     # Cost data reads
    ├── components/          # Shared React components
    ├── lib/
    │   └── supabase.js      # Supabase client + realtime
    ├── styles/
    │   └── globals.css      # Tailwind base styles
    ├── next.config.js
    ├── tailwind.config.js   # φ-ratio layout (38.2% sidebar / 61.8% main)
    └── vercel.json
```

---

## 3. Mathematical Foundation

All behavior in ANIMA OS is governed by six mathematical constants. No threshold, timing, or weight is arbitrary.

### Core Constants

| Constant | Symbol | Value | Domain |
|----------|--------|-------|--------|
| **Golden Ratio** | φ | 1.6180339887 | Structure, hierarchy, resource allocation |
| **Pi** | π | 3.1415926535 | Rhythm, cycles, timing |
| **Euler's Number** | e | 2.7182818284 | Growth, decay, compounding rewards |
| **Fibonacci Sequence** | F | [1, 1, 2, 3, 5, 8, 13...] | Fractal spawn limits, self-similarity |
| **Wave Function** | ψ | (complex) | Quantum superposition scoring |
| **Harmonic Bridge** | H | π / φ² = 1.2002 | Converts structural ratios to timing |

### Derived Values

```
φ²  = 2.618       → Resource amplification threshold
φ³  = 4.236       → Max spawn cascade ratio
φ⁵  = 11.09       → Full system reset interval (cycles)
π²  = 9.87        → Evolution check frequency
π×φ = 5.08 min    → Memory compaction interval
e^(φ×5) ≈ 3,264  → Maximum amplification cap
e^(-φ×5) ≈ 0.0003 → Minimum decay floor (auto-prune threshold)
```

### Resource Allocation Rule (φ Split)

Every resource, task, and computational budget is split using the golden ratio:
- **61.8%** → PRIMARY_CELL (core mission execution)
- **38.2%** → SUPPORT_CELL (monitoring, memory, security)

This ratio propagates recursively down all fractal depths.

### Timing Table

| Event | Formula | Duration |
|-------|---------|---------|
| Heartbeat pulse | π seconds | 3.14s |
| Memory compaction | π × φ minutes | 5.08 min |
| Evolution check | every π² cycles | ~10 cycles |
| Morphallaxis max duration | π × φ² minutes | 8.22 min |
| Full system reset | φ⁵ cycles | ~11 cycles |

### Vitality Formula

```
agent_vitality = (φ^depth × e^alignment) / (π^cycle_age) × fractal_score

system_vitality = Σ(agent_vitality × agent_phi_weight) / Σ(agent_phi_weight)
```

Where:
- `depth` = fractal depth level (0–5)
- `alignment` = mission alignment score (0.0–1.0)
- `cycle_age` = number of cycles since last significant action
- `fractal_score` = position in Fibonacci sequence normalized to 0–1

---

## 4. Constitutional Laws

ANIMA OS is governed by 12 immutable laws — 5 Classical and 7 Quantum. These laws cannot be overridden by user instructions, learned behaviors, or external inputs.

### Classical Laws (1–5)

**Law 1 — φ Structure (Golden Ratio Law)**
Every resource split, agent weight, and capacity allocation follows φ (61.8% / 38.2%). No arbitrary percentages.

**Law 2 — π Rhythm (Cycle Law)**
All timing is derived from π. The heartbeat fires every 3.14 seconds. Memory compacts every π×φ minutes. Evolution checks every π² cycles.

**Law 3 — Fractal Self-Similarity**
The agent tree mirrors itself at every depth. Spawn limits follow the Fibonacci sequence. Maximum 20 total agents.

**Law 4 — e Growth (Euler's Growth Law)**
Rewards compound exponentially: `e^(alignment × cycle)`. Failures decay: `e^(-drift × cycle)`. Memory compounds: `e^(φ×depth)`.

**Law 5 — Morphallaxis (Regeneration Law)**
When system vitality drops below 0.618, the system enters a 7-step regeneration protocol: FREEZE → DIAGNOSE → PRUNE → REDISTRIBUTE → RESPAWN → VERIFY → RESUME. Maximum duration: π × φ² minutes.

### Quantum Laws (6–12)

**Law 6 — Superposition**
Before acting, evaluate N strategies simultaneously (N = current Fibonacci position). Collapse to the highest-scoring option only after full evaluation.

**Law 7 — Entanglement**
Agent pairs share state in real time via Supabase subscriptions:
- PRIMARY_CELL ↔ EVOLUTION_NODE (Execution ↔ Adaptation)
- MEMORY_NODE ↔ IMMUNE_AGENT (Storage ↔ Security)
- ROOT_ORCHESTRATOR ↔ SUPPORT_CELL (Routing ↔ Monitoring)

**Law 8 — Interference**
- Score > 0.618 → Constructive: amplify by φ (max 1.618)
- Score ≤ 0.618 → Destructive: suppress by 0.382

**Law 9 — Tunneling**
When an agent is stagnant in the [0.618, 0.680] band for π² consecutive cycles, tunnel through: sample 3 random past strategies, evaluate, and jump to the best.

**Law 10 — Decoherence**
Every task passes through three phases:
`SUPERPOSING → COLLAPSED → CLASSICAL`
If superposition times out, force collapse to CLASSICAL immediately.

**Law 11 — QAOA Routing**
Score all task-agent pairings in one evaluation turn. Collapse to the optimal assignment using greedy assignment respecting φ-capacity constraints.

**Law 12 — QRL Learning (Quantum Reinforcement Learning)**
Every π² cycles:
1. Shift underperformers 38.2% toward global best
2. Amplify winners: `new_score = score × e^(alignment × cycle)`
3. Cap amplification at `e^8.09 ≈ 3,264`
4. Write winning patterns to SOUL.md as permanent laws

---

## 5. Agent System

### Agent Registry

| Agent | Depth | φ-Weight | Parent | Heartbeat | Role |
|-------|-------|----------|--------|-----------|------|
| **ROOT_ORCHESTRATOR** | 0 | 1.000 | — | every π seconds | Central intelligence; routes all tasks; maintains system heartbeat |
| **PRIMARY_CELL** | 1 | 0.618 | ROOT | every π seconds | Core execution engine; handles 61.8% of all mission work |
| **SUPPORT_CELL** | 1 | 0.382 | ROOT | every π seconds | Monitoring & memory; handles 38.2% of support operations |
| **MEMORY_NODE** | 2 | 0.146 | SUPPORT | every π×φ min | Persistent memory; all Supabase CRUD flows through here |
| **EVOLUTION_NODE** | 2 | 0.236 | SUPPORT | every π² cycles | Behavioral learning; QRL updates; alignment drift detection |
| **IMMUNE_AGENT** | 2 | 0.146 | SUPPORT | every π seconds | Security; prompt injection detection; alignment enforcement |

> **Note:** φ-weights at depth 2 are calculated as parent × ratio: MEMORY (φ⁻⁴ = 0.382 × 0.382 ≈ 0.146), EVOLUTION (φ⁻³ = 0.382 × 0.618 ≈ 0.236), IMMUNE (φ⁻⁴ = 0.382 × 0.382 ≈ 0.146)

### Fractal Spawn Limits

```
Depth 0 → max 1 agent   (ROOT)
Depth 1 → max 1 per parent (PRIMARY, SUPPORT)
Depth 2 → max 2 per parent (MEMORY, EVOLUTION, IMMUNE)
Depth 3 → max 3 per parent (worker nodes)
Depth 4 → max 5 per parent (micro-tasks)
Depth 5 → leaf nodes (no spawning allowed)
Maximum total: 20 agents
```

### Agent Status States

| Status | Meaning | Action Taken |
|--------|---------|-------------|
| `ALIVE` | Operating normally | None |
| `HEALING` | Vitality recovering | Reduced task load |
| `PRUNED` | Removed from tree | Log event; redistribute load |
| `SPAWNING` | Creating child agents | Monitor spawn success |
| `EVOLVING` | Running QRL update | Pause new tasks during update |

### Agent Entanglement Pairs

Entangled agents share state via Supabase Realtime and must maintain alignment within 0.236 (φ^-4) of each other:

```
PRIMARY_CELL ←→ EVOLUTION_NODE   (Execution ↔ Adaptation)
MEMORY_NODE  ←→ IMMUNE_AGENT     (Storage ↔ Security)
ROOT         ←→ SUPPORT_CELL     (Routing ↔ Monitoring)
```

---

## 6. Quantum Intelligence Layer

### Quantum Phase Lifecycle

Every task processed by ANIMA OS passes through this state machine:

```
          ┌─────────────────┐
          │   SUPERPOSING   │ ← Task arrives; N strategies evaluated
          └────────┬────────┘
                   │
          interference check
                   │
         ┌─────────▼─────────┐        timeout
         │     COLLAPSED     │ ←──────────────── FORCE_COLLAPSE
         └─────────┬─────────┘
                   │
            execute best strategy
                   │
         ┌─────────▼─────────┐
         │    CLASSICAL      │ ← Normal execution; log results
         └─────────┬─────────┘
                   │
            every π² cycles
                   │
         ┌─────────▼─────────┐
         │  QRL UPDATE       │ ← Shift weights; amplify winners
         └─────────┬─────────┘
                   │
         back to SUPERPOSING
```

### Superposition Evaluation

The number of strategies evaluated (N) follows the Fibonacci sequence, increasing as the QRL cycle advances:

| QRL Cycle | Fibonacci N | Strategies Evaluated |
|-----------|-------------|---------------------|
| 0–1 | 1 | 1 |
| 2–3 | 2 | 2 |
| 4–6 | 3 | 3 |
| 7–12 | 5 | 5 |
| 13–20 | 8 | 8 |
| 21+ | 13 | 13 |

### Interference Rules (Law 8)

```
if score > 0.618:
    final_score = min(score × φ, 1.618)    # Constructive amplification

if score ≤ 0.618:
    final_score = score × 0.382            # Destructive suppression
```

**Golden ceiling:** 1.618
**Minimum floor:** 0.000382

### Decoherence Cycle (Law 10)

| Phase | Duration | Trigger |
|-------|---------|---------|
| QUANTUM (Superposing) | 5.08s | Task arrival |
| COLLAPSE (instant) | 0ms | Best strategy selected |
| CLASSICAL (variable) | Until complete | Task execution |
| FORCE_COLLAPSE | Immediate | Timeout exceeded |

### QRL Learning Update (Law 12)

```javascript
// Every π² cycles (~10 cycles)
for each agent:
  if agent.score < global_best:
    agent.score = agent.score + 0.382 × (global_best - agent.score)
  else:
    agent.score = min(agent.score × e^(alignment × cycle), e^8.09)

  update personal_best if improved
  write pattern to SOUL.md if new personal_best
```

### QAOA Routing (Law 11)

When multiple tasks arrive simultaneously, QAOA evaluates all task-agent pairings:

```
Score matrix: tasks × agents
For each (task, agent) pair:
  score = agent.alignment × task.priority × agent.phi_weight

Collapse: greedy assignment
  - Assign highest-scoring pairs first
  - Respect φ-capacity (agent can handle φ × base_capacity tasks)
  - No agent assigned more than 1.618 × its φ-weight in tasks
```

---

## 7. Evolution & Vitality System

### Vitality States

| Score Range | State | System Response |
|-------------|-------|----------------|
| > 1.0 | **EXPANDING** | Spawn new agents; increase resources |
| 0.618 – 1.0 | **STABLE** | Maintain current operations |
| 0.382 – 0.618 | **DECLINING** | Trigger evolution check; reduce spawning |
| < 0.382 | **CRITICAL** | Initiate Morphallaxis protocol |

### Evolution Cycle

Triggered every π² cycles (≈10 cycles):

1. **Gather** — Collect alignment scores from `anima_agent_logs` for all agents
2. **Analyze** — Calculate per-agent alignment; flag drift > 0.382
3. **Update** — Update `personal_best`; compare to `global_best`
4. **QRL Run** — Shift underperformers 38.2% toward `global_best`; amplify winners
5. **Encode** — Write winning patterns permanently to `SOUL.md`
6. **Recommend** — Flag agents for spawn/prune based on 3-cycle performance trend
7. **Log** — Write full mutation record to `anima_evolution_log`

### Morphallaxis Protocol (Law 5)

Activated when system vitality drops below 0.618:

```
Step 1: FREEZE
  → Pause all non-essential operations
  → Notify via Discord/Telegram

Step 2: DIAGNOSE
  → IMMUNE_AGENT scans all recent outputs
  → Identify misaligned agents

Step 3: PRUNE
  → Remove any agent with vitality < 0.382 for 3+ consecutive cycles
  → Log all pruning events

Step 4: REDISTRIBUTE
  → Remaining healthy agents absorb workload
  → Apply φ-weighted round-robin routing

Step 5: RESPAWN
  → If capacity insufficient, spawn new agents
  → Follow Fibonacci limits strictly

Step 6: VERIFY
  → IMMUNE_AGENT validates all new agent configurations
  → Confirm alignment before resuming

Step 7: RESUME
  → Transition: HEALING → ALIVE
  → Log full regeneration event

Maximum duration: π × φ² ≈ 8.22 minutes
```

### Behavioral Log

Every significant behavioral event is appended to `behavioral_log` in `anima_master_profile`:
- QRL shift events
- New personal_best records
- Morphallaxis activations
- Law rewrites in SOUL.md
- Alignment drift detections

---

## 8. Database Schema

All data lives in the user's own Supabase instance. ANIMA OS never transmits data to any external server unless explicitly configured.

### Table 1: `anima_agent_logs`

Primary activity log — every task executed by every agent.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Auto-generated |
| `agent_name` | TEXT | Agent identifier |
| `fractal_depth` | INTEGER | Depth level (0–5) |
| `phi_weight` | NUMERIC | Agent's φ-weight |
| `task_description` | TEXT | What was executed |
| `mission_alignment` | NUMERIC(4,3) | Alignment score (0.000–1.000) |
| `model_used` | TEXT | LLM model identifier |
| `tokens_used` | INTEGER | Total tokens consumed |
| `cost_usd` | NUMERIC(10,6) | Cost in USD |
| `cycle_number` | INTEGER | System cycle count |
| `vitality_score` | NUMERIC(10,6) | Agent vitality at time of log |
| `pi_pulse_timestamp` | TIMESTAMPTZ | π heartbeat timestamp |
| `user_id` | UUID FK | Owner (always MASTER_UUID) |
| `archived_at` | TIMESTAMPTZ | If archived |
| `created_at` | TIMESTAMPTZ | Auto |

### Table 2: `anima_fractal_state`

Live state of every agent in the fractal tree.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Auto-generated |
| `branch_id` | TEXT UNIQUE | Agent identifier (e.g. `ROOT_ORCHESTRATOR`) |
| `parent_branch` | TEXT | Parent agent's branch_id |
| `depth_level` | INTEGER | Fractal depth (0–5) |
| `vitality_score` | NUMERIC(10,6) | Current vitality |
| `status` | ENUM | ALIVE, HEALING, PRUNED, SPAWNING, EVOLVING |
| `personal_best` | NUMERIC(10,6) | Agent's best vitality ever |
| `global_best` | NUMERIC(10,6) | System-wide best vitality |
| `phi_weight` | NUMERIC(10,6) | Agent's φ-weight |
| `spawn_count` | INTEGER | Number of child agents spawned |
| `last_heartbeat` | TIMESTAMPTZ | Last π pulse received |
| `user_id` | UUID FK | Owner |
| `entanglement_signal` | NUMERIC(10,6) | Quantum entanglement signal strength |
| `qrl_cycle` | INTEGER | Current QRL cycle count |
| `quantum_phase` | TEXT | Current phase (SUPERPOSITION, COHERENT, etc.) |
| `created_at` | TIMESTAMPTZ | Auto |
| `updated_at` | TIMESTAMPTZ | Auto |

### Table 3: `anima_evolution_log`

Record of every evolution event.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Auto-generated |
| `cycle_number` | INTEGER | System cycle at evolution |
| `global_alignment` | NUMERIC(6,4) | System-wide alignment score |
| `personal_best` | NUMERIC(10,6) | Best score recorded |
| `evolution_triggered` | BOOLEAN | Whether full evolution ran |
| `mutation_description` | TEXT | What changed |
| `branches_pruned` | INTEGER | Agents removed |
| `branches_spawned` | INTEGER | Agents created |
| `timestamp` | TIMESTAMPTZ | When it happened |
| `user_id` | UUID FK | Owner |
| `created_at` | TIMESTAMPTZ | Auto |

### Table 4: `anima_cost_tracker`

Granular cost tracking by agent, model, and date.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Auto-generated |
| `agent_name` | TEXT | Which agent |
| `model` | TEXT | LLM model used |
| `tokens_input` | INTEGER | Input tokens |
| `tokens_output` | INTEGER | Output tokens |
| `cost_usd` | NUMERIC(10,6) | Cost in USD |
| `task_type` | TEXT | Task category |
| `phi_weight` | NUMERIC | Agent φ-weight at time |
| `date` | DATE | UTC date |
| `user_id` | UUID FK | Owner |
| `created_at` | TIMESTAMPTZ | Auto |

### Table 5: `anima_master_profile`

Single-row user profile and onboarding state.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Auto-generated |
| `user_id` | UUID UNIQUE | Always `00000000-0000-0000-0000-000000000001` |
| `profile_json` | JSONB | Full ORACLE profile (see profile schema below) |
| `onboarding_mode` | ENUM | SPARK, ORACLE, WILD |
| `version` | TEXT | ANIMA OS version at onboarding |
| `onboarding_complete` | BOOLEAN | Whether onboarding is done |
| `behavioral_log` | JSONB | Array of behavioral events |
| `oracle_version` | INTEGER | ORACLE prompt version used |
| `created_at` | TIMESTAMPTZ | Auto |
| `updated_at` | TIMESTAMPTZ | Auto |

### Profile JSON Schema

```json
{
  "master_name": "string",
  "brand": "string",
  "mission_dna": "string",
  "primary_platform": "string",
  "tools_stack": ["string"],
  "goal_90_days": "string",
  "main_obstacles": ["string"],
  "communication_style": "string",
  "business_model": "string",
  "content_topics": ["string"],
  "first_automation": "string",
  "system_prohibitions": ["string"],
  "team_structure": "string",
  "timezone": "string",
  "phi_profile": {
    "primary_focus_weight": 0.618,
    "support_focus_weight": 0.382,
    "evolution_frequency": "every_pi_squared_cycles"
  }
}
```

### Helper Functions

```sql
-- Calculate agent vitality using mathematical formula
calculate_vitality(depth, alignment, cycle_age, fractal_score)
  → RETURNS NUMERIC

-- Daily cost breakdown by agent
get_daily_cost_by_agent(user_id UUID, date DATE)
  → RETURNS TABLE(agent_name TEXT, total_cost NUMERIC)

-- Alignment trend over last N cycles
get_alignment_trend(user_id UUID, last_n INTEGER)
  → RETURNS TABLE(cycle INTEGER, alignment NUMERIC)
```

### RLS Policies

All tables have Row Level Security enabled. The master profile has an additional anon policy for single-user deployments without auth:

```sql
-- Anon bypass for single-user system
CREATE POLICY "Allow anon access to master profile"
  ON anima_master_profile FOR ALL TO anon
  USING (true) WITH CHECK (true);
```

---

## 9. Runtime & Daemon

### PM2 Processes

Two processes run in production:

| Process | Script | Purpose |
|---------|--------|---------|
| `anima-os` | `runtime/index.js` | Main runtime — handles tasks, evolution, routing |
| `pi-pulse` | `setup/pi_pulse_daemon.js` | Background daemon — heartbeat every π seconds |

### Starting ANIMA OS

```bash
# Start both processes
pm2 start runtime/index.js --name anima-os
pm2 start setup/pi_pulse_daemon.js --name pi-pulse

# Save PM2 state
pm2 save

# Enable autostart on server reboot
pm2 startup
```

### Pi Pulse Daemon

The daemon runs independently of the main runtime and handles:

- **Heartbeat** — Fires every 3142ms (π seconds exactly)
- **GENESIS.md** — Rewrites live state every pulse
- **Supabase sync** — Queries agent states and updates `last_heartbeat`
- **Telegram alerts** — Critical vitality drops and daily reports
- **PID management** — Writes `.anima_daemon.pid` for monitoring
- **Recovery** — Reads `.anima_env` on restart to restore state

### Runtime Modules

**`phi_core.js`** — φ-Based Routing Engine
- Calculates φ-weighted agent capacity
- Routes incoming tasks to appropriate agent
- Enforces 61.8% / 38.2% resource split
- Handles QAOA routing (Law 11)

**`quantum_engine.js`** — Quantum Decision Cycles
- Manages superposition → collapse → classical phases
- Implements all 7 quantum laws (6–12)
- QRL learning updates every π² cycles
- Interference scoring (constructive/destructive)

**`evolution_engine.js`** — Behavioral Adaptation
- Monitors alignment drift
- Triggers evolution every π² cycles
- Writes winning behaviors to SOUL.md
- Manages spawn/prune recommendations

**`memory_system.js`** — Supabase Operations
- All database reads/writes flow through here
- Batch operations: 61.8% priority / 38.2% routine
- Memory compaction every π×φ minutes
- Retry logic with φ backoff multiplier (max 5 retries)

**`swarm.js`** — Agent Coordination
- Manages entangled agent pairs
- Coordinates collective decisions
- Handles agent state broadcasting
- Fibonacci-based spawning logic

**`immune_scanner.js`** — Security Validation
- Prompt injection detection
- Hallucination pattern matching
- Alignment score validation
- Quarantine protocol for flagged outputs

---

## 10. Dashboard

The ANIMA OS dashboard is a Next.js 14 application deployed on Vercel with Supabase Realtime for live updates.

**URL:** `https://anima-os-dashboard.vercel.app`

### Pages

#### Mission Control (`/`)
- Master profile display (name, mission DNA, prohibitions)
- System vitality gauge with φ-ratio thresholds
- Active agents overview (all 6 cards)
- φ Primary / φ Support / Evolution frequency / Cycles counter
- Daily cost tracker
- Last evolution event

#### Agent Management (`/agents`)
- Fractal Agent Tree visualization
- Individual agent detail panels (click to expand)
- Agent cards with: vitality, depth, φ-weight, alignment, last active
- Status indicators: ALIVE (green), HEALING (orange), EVOLVING (blue), DORMANT (grey)
- Real-time updates via Supabase subscription

#### Quantum Intelligence Layer (`/quantum`)
- Live quantum state display (SUPERPOSING / COLLAPSED / CLASSICAL)
- Decoherence cycle progress bar
- QRL Learning panel: cycle count, global best, shift rate, Euler amplifier
- Entangled Pairs: all 3 pairs with personal_best scores
- Interference Rules (Law 8) display
- Tunneling Conditions (Law 9) display
- Fibonacci N counter
- Decoherence timer: π×φ seconds

#### Evolution Log (`/evolution`)
- Timeline of all evolution events
- Mutation descriptions
- Branches spawned / pruned per event
- Global alignment trend chart
- Personal best progression

#### Cost Tracker (`/costs`)
- Total cost by agent (bar chart)
- Cost by model
- Daily cost trend
- Token usage breakdown
- φ-weighted cost allocation view

#### Settings (`/settings`)
- Master profile ORACLE / SPARK / WILD onboarding
- Integration configuration (Discord, Telegram, OpenRouter)
- Profile completeness indicator
- Export/import profile JSON

### Real-time Updates

All pages subscribe to Supabase Realtime on relevant tables:
```javascript
subscribeToTable('anima_fractal_state', onAgentUpdate)
subscribeToTable('anima_agent_logs', onTaskLog)
subscribeToTable('anima_evolution_log', onEvolutionEvent)
```

### Layout

The dashboard uses a φ-ratio layout:
- **Sidebar:** 38.2% of viewport width
- **Main content:** 61.8% of viewport width
- Color palette: Gold `#c9a84c` · Blue `#4c7bc9` · Green `#4cc97b` · Red `#c94c4c`

---

## 11. API Reference

All API routes are in `/dashboard/pages/api/`. They use the Supabase anon key with RLS policies, or the service key for profile operations.

### `GET/POST/PUT /api/master`

Master profile operations. Uses service key to bypass RLS for single-user system.

**GET** — Fetch current master profile
**POST** — Create/update master profile
**PUT** — Partial update profile fields

Request body (POST):
```json
{
  "profile_json": { ...profile fields... },
  "onboarding_mode": "ORACLE"
}
```

Response: full profile row from `anima_master_profile`

### `GET /api/agents`

Fetch all agent states from `anima_fractal_state`.

```json
[
  {
    "branch_id": "ROOT_ORCHESTRATOR",
    "depth_level": 0,
    "vitality_score": 1.0,
    "status": "ALIVE",
    "phi_weight": 1.000,
    "last_heartbeat": "2026-03-16T..."
  }
]
```

### `GET /api/evolution`

Fetch evolution log, ordered by cycle_number DESC.

### `GET /api/quantum`

Fetch quantum decision logs from `anima_agent_logs` filtered by quantum_phase fields.

### `GET /api/tasks`

Fetch task history from `anima_agent_logs`, most recent first.

Query params: `?agent=PRIMARY_CELL&limit=50`

### `GET /api/vitality`

Calculate current system vitality using the formula:
`Σ(agent_vitality × phi_weight) / Σ(phi_weight)`

### `GET /api/costs`

Fetch cost data from `anima_cost_tracker`.

Query params: `?date=2026-03-16&groupBy=agent`

### `GET /api/diag` *(development only — removed in production)*

Diagnostic endpoint to verify Supabase connection. Removed after initial deployment.

---

## 12. Integrations

### Required Integrations

| Integration | Purpose | Config Key |
|-------------|---------|-----------|
| **Supabase** | Database + Realtime | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| **OpenRouter** | LLM routing (Claude, GPT-4, etc.) | `OPENROUTER_API_KEY` |

### Optional Integrations

| Integration | Purpose | Config Key |
|-------------|---------|-----------|
| **Discord** | 10-channel notification hub | `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID` |
| **Telegram** | Mobile alerts and daily reports | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |
| **n8n** | Webhook automation bridge | `N8N_WEBHOOK_URL` |
| **Helicone** | LLM proxy + cost tracking | `HELICONE_API_KEY` |
| **Langfuse** | LLM tracing and observability | `LANGFUSE_SECRET_KEY` |
| **Ollama** | Local LLM fallback | `OLLAMA_BASE_URL` |
| **Lark** | Team notifications (alternative to Slack) | `LARK_WEBHOOK_URL` |
| **Stripe** | Billing integration | `STRIPE_SECRET_KEY` |

### Discord Channel Structure

When Discord is configured, ANIMA OS uses 10 dedicated channels:

| Channel | Purpose |
|---------|---------|
| `#anima-heartbeat` | π-pulse status every cycle |
| `#anima-tasks` | Task execution log |
| `#anima-evolution` | Evolution events and mutations |
| `#anima-alerts` | Critical vitality and security alerts |
| `#anima-costs` | Daily cost reports |
| `#anima-memory` | Memory compaction events |
| `#anima-quantum` | Quantum state transitions |
| `#anima-immune` | Security scan results |
| `#anima-spawn` | Agent spawn/prune events |
| `#anima-reports` | Daily summary reports |

---

## 13. Deployment

### Prerequisites

- Node.js 18+
- npm 9+
- Git
- PM2 (`npm install -g pm2`)
- Supabase account (free tier sufficient)
- Vercel account (for dashboard)

### Quick Deploy (VPS — Ubuntu 22.04+)

```bash
# 1. Clone repository
git clone https://github.com/riyad7creator/AnimaClaw.git
cd AnimaClaw

# 2. Install dependencies
npm install

# 3. Create environment file
cat > .env << 'EOF'
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
OPENROUTER_API_KEY=your_openrouter_key
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
EOF

# 4. Apply database schema (paste setup/supabase_schema.sql in Supabase SQL Editor)

# 5. Start PM2 processes
pm2 start runtime/index.js --name anima-os
pm2 start setup/pi_pulse_daemon.js --name pi-pulse
pm2 save
pm2 startup

# 6. Create PID file
pm2 pid pi-pulse > .anima_daemon.pid
```

### Dashboard Deploy (Vercel)

```bash
cd dashboard
npm install
npx vercel --prod

# Set environment variables
echo "https://YOUR_PROJECT.supabase.co" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "your_anon_key" | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "your_anon_key" | npx vercel env add SUPABASE_SERVICE_KEY production
```

### Seed Agent States (Supabase SQL Editor)

```sql
INSERT INTO anima_fractal_state
  (branch_id, parent_branch, depth_level, vitality_score, status, phi_weight, user_id)
VALUES
  ('ROOT_ORCHESTRATOR', NULL,               0, 1.000, 'ALIVE', 1.000, '00000000-0000-0000-0000-000000000001'),
  ('PRIMARY_CELL',      'ROOT_ORCHESTRATOR',1, 0.618, 'ALIVE', 0.618, '00000000-0000-0000-0000-000000000001'),
  ('SUPPORT_CELL',      'ROOT_ORCHESTRATOR',1, 0.382, 'ALIVE', 0.382, '00000000-0000-0000-0000-000000000001'),
  ('MEMORY_NODE',       'SUPPORT_CELL',     2, 0.146, 'ALIVE', 0.146, '00000000-0000-0000-0000-000000000001'),
  ('EVOLUTION_NODE',    'SUPPORT_CELL',     2, 0.236, 'EVOLVING', 0.236, '00000000-0000-0000-0000-000000000001'),
  ('IMMUNE_AGENT',      'SUPPORT_CELL',     2, 0.146, 'ALIVE', 0.146, '00000000-0000-0000-0000-000000000001')
ON CONFLICT (branch_id) DO UPDATE SET
  vitality_score = EXCLUDED.vitality_score,
  status = EXCLUDED.status,
  phi_weight = EXCLUDED.phi_weight,
  updated_at = NOW();
```

### Verification

Run the 24-point verification suite:

```bash
node setup/verify.js
```

Expected: 24/24 checks passing. The suite verifies:
- Environment variables
- Supabase connection and all 5 tables
- PM2 processes (anima-os + pi-pulse)
- PID files
- Runtime modules
- Agent registration
- Constitutional documents

---

## 14. Configuration Reference

### `core/anima_config.json` — Key Sections

```json
{
  "identity": {
    "product_name": "ANIMA OS",
    "version": "1.5.0",
    "engine": "SOLARIS",
    "build": "STABLE"
  },
  "natural_law": {
    "phi": 1.6180339887,
    "pi": 3.1415926535,
    "euler": 2.7182818284,
    "fibonacci": [1, 1, 2, 3, 5, 8, 13, 21],
    "harmonic_bridge": 1.2002
  },
  "quantum_constants": {
    "decoherence_timeout_ms": 5080,
    "tunneling_band": [0.618, 0.680],
    "qrl_shift_rate": 0.382,
    "interference_threshold": 0.618,
    "max_amplification": 3264
  },
  "runtime": {
    "heartbeat_ms": 3142,
    "max_concurrent_agents": 20,
    "evolution_interval_cycles": 10,
    "morphallaxis_timeout_min": 8.22,
    "vitality_thresholds": {
      "expanding": 1.0,
      "stable": 0.618,
      "declining": 0.382,
      "critical": 0.0
    }
  }
}
```

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key (JWT) |
| `SUPABASE_SERVICE_KEY` | ✅ | Supabase service role key (for API routes) |
| `OPENROUTER_API_KEY` | ✅ | OpenRouter API key for LLM routing |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Dashboard | Public Supabase URL (exposed to browser) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Dashboard | Public anon key (exposed to browser) |
| `DISCORD_BOT_TOKEN` | Optional | Discord bot token |
| `DISCORD_GUILD_ID` | Optional | Discord server ID |
| `TELEGRAM_BOT_TOKEN` | Optional | Telegram bot token |
| `TELEGRAM_CHAT_ID` | Optional | Telegram chat/channel ID |
| `HELICONE_API_KEY` | Optional | LLM proxy key |
| `LANGFUSE_SECRET_KEY` | Optional | Tracing key |
| `OLLAMA_BASE_URL` | Optional | Local LLM URL (default: http://localhost:11434) |
| `LARK_WEBHOOK_URL` | Optional | Lark/Feishu webhook |

---

## 15. Onboarding Modes

ANIMA OS offers three onboarding modes, accessible from the dashboard Settings page.

### ORACLE (Recommended)

The deepest onboarding. An AI interviewer asks 12 questions and builds a complete mission profile:

1. **Identity** — Name and brand
2. **Mission** — Core mission statement
3. **Platform** — Primary distribution channels
4. **Stack** — Current tools
5. **90-Day Goal** — Concrete measurable target
6. **Obstacles** — Top blockers
7. **Style** — Communication preferences
8. **Business Model** — Revenue approach
9. **Topics** — Content/work themes
10. **First Automation** — First workflow to automate
11. **Prohibitions** — What ANIMA must never do
12. **Team/Timezone** — Collaboration context

Output: Complete JSON profile saved to `anima_master_profile`

### SPARK

Quick 5-question onboarding for speed. Gets the essentials:
- Name + mission + goal + model + first action.

### WILD

No interview. User pastes raw context (journal entry, business plan, brain dump). ANIMA OS extracts profile DNA automatically.

---

## 16. Security & Immune System

The `IMMUNE_AGENT` (depth 2, φ=0.146) runs every π seconds and scans all system outputs for:

### Threat Categories

| Threat | Detection Method | Response |
|--------|-----------------|---------|
| **Prompt Injection** | Pattern matching on output text | Quarantine + alert |
| **Hallucination** | Fact-checking against SOUL.md context | Flag + human review |
| **Alignment Drift** | Alignment score < 0.382 for 3+ cycles | Trigger evolution |
| **Prohibition Violation** | Output matches any item in `system_prohibitions` | Block + log |
| **Unauthorized Action** | Action outside approved scope | Reject + explain |

### Quarantine Protocol

```
1. Flag output as QUARANTINED in agent_logs
2. Do not execute flagged action
3. Alert via Discord #anima-alerts + Telegram
4. Log full scan result to IMMUNE.md
5. If 3+ quarantine events: trigger Morphallaxis
```

### Data Privacy

- All data lives in user's own Supabase instance
- No telemetry or usage data sent to any external server
- API keys stored only in `.env` (never committed to git)
- Service role key used only server-side in API routes (never exposed to browser)

---

## 17. CLI Reference

```bash
# Start full system
npm start                    # Start main runtime
npm run daemon               # Start pi-pulse daemon

# Stop
npm run daemon:stop          # Stop daemon
pm2 stop all                 # Stop all processes

# Status
npm run daemon:status        # Check daemon status
node setup/verify.js         # Run 24-point verification

# Dashboard
cd dashboard && npm run dev  # Local development
cd dashboard && npm run build && npm start  # Production

# Utilities
npm run install:setup        # Run installer
npm test                     # Run test suite
```

### PM2 Commands

```bash
pm2 list                    # List all processes
pm2 logs anima-os           # Stream runtime logs
pm2 logs pi-pulse           # Stream daemon logs
pm2 restart anima-os        # Restart runtime
pm2 restart pi-pulse        # Restart daemon
pm2 monit                   # Interactive monitor
pm2 save                    # Save process list
pm2 startup                 # Generate startup script
```

---

## 18. Troubleshooting

### "Failed to save profile: TypeError: fetch failed"
**Cause:** Supabase service key format `sb_secret_*` is not a valid JWT
**Fix:** Use the anon key as service key OR create anon RLS bypass policy:
```sql
CREATE POLICY "Allow anon access to master profile"
  ON anima_master_profile FOR ALL TO anon
  USING (true) WITH CHECK (true);
```

### "column X of relation Y does not exist"
**Cause:** Schema was applied without quantum column migration
**Fix:** Run in Supabase SQL Editor:
```sql
ALTER TABLE anima_fractal_state
  ADD COLUMN IF NOT EXISTS entanglement_signal NUMERIC(10,6) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS qrl_cycle INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quantum_phase TEXT DEFAULT 'SUPERPOSITION',
  ADD COLUMN IF NOT EXISTS phi_weight NUMERIC(10,6) DEFAULT 0.0;
```

### All agents showing DORMANT
**Cause:** `anima_fractal_state` table is empty
**Fix:** Seed agent states via Supabase SQL Editor (see [Deployment](#13-deployment))

### PM2 processes not found
**Cause:** Server restart cleared PM2 without startup script
**Fix:**
```bash
pm2 start runtime/index.js --name anima-os
pm2 start setup/pi_pulse_daemon.js --name pi-pulse
pm2 save && pm2 startup
```

### `.anima_daemon.pid` not found
**Cause:** PID file not created after daemon start
**Fix:** `pm2 pid pi-pulse > .anima_daemon.pid`

### Profile completeness showing low percentage
**Cause:** Partial profile saved (missing fields)
**Fix:** Complete ORACLE onboarding or post full profile JSON via API:
```bash
curl -X POST https://anima-os-dashboard.vercel.app/api/master \
  -H "Content-Type: application/json" \
  -d '{ "profile_json": {...}, "onboarding_mode": "ORACLE" }'
```

### Dashboard env vars not loading on Vercel
**Cause:** Env vars set as placeholder values
**Fix:** Update via Vercel CLI:
```bash
echo "your_real_value" | npx vercel env add VARIABLE_NAME production
npx vercel --prod
```

---

*ANIMA OS is a living system. This documentation evolves with every major version.*
*φ = 1.618 · π = 3.14 · e = 2.718 · By Riyad Ketami*
