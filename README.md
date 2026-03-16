# ANIMA OS — The Living Agentic Operating System

**Engine:** SOLARIS v1.5.0 STABLE
**Author:** Riyad Ketami — riyad@ketami.net
**Repository:** [AnimaClaw](https://github.com/riyad7creator/AnimaClaw)
**License:** MIT

---

## What Is ANIMA OS?

ANIMA OS is a self-deploying, self-evolving agentic operating system. Drop `SOLARIS.md` into any OpenClaw workspace — the organism boots itself, creates agents, connects integrations, and continuously evolves around your mission.

It is governed by four mathematical constants — not as metaphor, but as **executable logic**:

| Constant | Value | Governs |
|----------|-------|---------|
| φ (Golden Ratio) | 1.6180339887 | Structure, hierarchy, resource allocation |
| π (Pi) | 3.1415926535 | Rhythm, cycles, timing |
| e (Euler's) | 2.7182818284 | Growth, decay, compounding |
| Fractal | Fibonacci | Self-similarity, spawning depth |

---

## Architecture (Full Stack)

```
╔═══════════════════════════════════════════════════════════════════════╗
║                         ANIMA OS v1.5.0                               ║
║                    Engine: SOLARIS | Entry: SOLARIS.md                ║
╠═══════════════════════════════════════════════════════════════════════╣
║  LAYER 0 — CONSTITUTION (Immutable)                                   ║
║  ┌─────────────────────────────────────────────────────────────────┐  ║
║  │ CONSTITUTION.md  ·  QUANTUM_CONSTITUTION.md  ·  natural_law.json│  ║
║  │ 5 Classical Laws + 7 Quantum Laws                               │  ║
║  └─────────────────────────────────────────────────────────────────┘  ║
╠═══════════════════════════════════════════════════════════════════════╣
║  LAYER 1 — IDENTITY (Mutable per mission)                             ║
║  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐    ║
║  │  SOUL_TEMPLATE   │  │   GENESIS.md     │  │  MASTER_TEMPLATE │    ║
║  │  (mission DNA)   │  │   (heartbeat)    │  │  (user profile)  │    ║
║  └──────────────────┘  └──────────────────┘  └──────────────────┘    ║
╠═══════════════════════════════════════════════════════════════════════╣
║  LAYER 2 — AGENT HIERARCHY (Fractal, φ-weighted)                      ║
║                                                                       ║
║              ROOT_ORCHESTRATOR  (depth=0, φ=1.0)                      ║
║                      │                                                ║
║          ┌───────────┴───────────┐                                    ║
║          │                       │                                    ║
║    PRIMARY_CELL             SUPPORT_CELL                               ║
║    (d=1, φ=0.618)           (d=1, φ=0.382)                            ║
║          │                  ┌────┼─────┐                              ║
║     [WORKER CELLS]     MEMORY  EVOL   IMMUNE                          ║
║     (d=2..5, Fib)       NODE   NODE   AGENT                           ║
║                        (d=2)  (d=2)  (d=2)                            ║
╠═══════════════════════════════════════════════════════════════════════╣
║  LAYER 3 — RUNTIME (Node.js 18+)                                      ║
║  ┌──────────────┐  ┌────────────────┐  ┌───────────────┐             ║
║  │  phi_core.js │  │ quantum_engine │  │ immune_scanner│             ║
║  │  (routing)   │  │  (decisions)   │  │  (security)   │             ║
║  └──────────────┘  └────────────────┘  └───────────────┘             ║
║  ┌──────────────┐  ┌────────────────┐  ┌───────────────┐             ║
║  │ memory_system│  │ evolution_engine│  │   swarm.js    │             ║
║  │  (JSONB)     │  │  (e^alignment) │  │  (cohesion)   │             ║
║  └──────────────┘  └────────────────┘  └───────────────┘             ║
╠═══════════════════════════════════════════════════════════════════════╣
║  LAYER 4 — PERSISTENCE (Supabase)                                     ║
║  ┌───────────────────────────────────────────────────────────────┐    ║
║  │  anima_agent_logs  ·  anima_fractal_state  ·  anima_cost_     │    ║
║  │  tracker  ·  anima_evolution_log  ·  anima_master_profile     │    ║
║  │  RLS enabled  ·  Realtime subscriptions  ·  JSONB behavioral  │    ║
║  └───────────────────────────────────────────────────────────────┘    ║
╠═══════════════════════════════════════════════════════════════════════╣
║  LAYER 5 — INTEGRATIONS                                               ║
║  n8n  ·  Helicone  ·  Langfuse  ·  Ollama  ·  Lark  ·  Discord       ║
║  Telegram  ·  OpenRouter  ·  Vercel  ·  Stripe                        ║
╠═══════════════════════════════════════════════════════════════════════╣
║  LAYER 6 — DASHBOARD (Next.js 14 + Tailwind + Supabase Realtime)      ║
║  Mission Control  ·  Agents  ·  Quantum  ·  Evolution  ·  Costs       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## Quick Start (60 seconds)

```bash
# 1. Clone
git clone https://github.com/riyad7creator/AnimaClaw.git
cd AnimaClaw

# 2. Install + configure
cd setup && bash install.sh

# 3. Apply database schema
# Paste setup/supabase_schema.sql into Supabase SQL Editor and Run

# 4. Start onboarding
# Open SOLARIS.md in your OpenClaw workspace
# Choose: [1] SPARK  [2] ORACLE  [3] WILD

# 5. Launch dashboard
cd dashboard && npm run dev
# Open http://localhost:3000
```

---

## Onboarding — Three Modes

ANIMA OS learns your mission through one of three paths:

### SPARK Mode — 60 seconds
5 rapid-fire questions. Instant profile. Start building now.
```
Run: npm run setup → choose [1] SPARK
Time: ~60 seconds
Output: partial MASTER_TEMPLATE.json (upgradeable)
```

### ORACLE Mode — Deep Profile
12 questions via any external LLM. Maximum profile depth.
```
1. Copy oracle_prompt.txt from onboarding/oracle_prompt.txt
2. Paste into ChatGPT / Claude / Gemini
3. Answer all 12 questions
4. Paste the JSON output back into dashboard
```
Supported LLMs: ChatGPT-4o · Claude 3.5 Sonnet · Gemini 1.5 Pro · Mistral Large · Any LLM with 8k+ context

### WILD Mode — Behavioral Learning
No setup. ANIMA observes your behavior and builds your profile.
```
Completion: phi-threshold (0.618 confidence) OR 50 interactions OR 7 days
Privacy: all logs stored locally in Supabase JSONB, never transmitted
```

---

## The 12 Immutable Laws

### Classical Laws (1–5)
| # | Law | Principle |
|---|-----|-----------|
| 1 | φ-Weighted Routing | Every task assigned by golden ratio score |
| 2 | Fractal Depth | Agents spawn to Fibonacci limits (1,1,2,3,5,8...) |
| 3 | π-Pulse Timing | Heartbeat every 3.14s, memory every 5.08min |
| 4 | e-Growth Decay | Vitality compounds by Euler's number |
| 5 | Immune Vigilance | IMMUNE_AGENT scans every cycle |

### Quantum Laws (6–12)
| # | Law | Principle |
|---|-----|-----------|
| 6 | Superposition | Tasks exist in all states until observed |
| 7 | Entanglement | Correlated agents share state updates |
| 8 | Interference | Constructive (>0.618) amplifies; destructive (<0.618) dampens |
| 9 | Tunneling | High-urgency tasks bypass queue barriers |
| 10 | Decoherence | Isolation prevents environmental noise |
| 11 | Measurement | Observation collapses to classical execution |
| 12 | QRL | Quantum Reinforcement Learning via EVOLUTION_NODE |

---

## System Vitality Formula

```
vitality = (phi^depth x e^alignment) / (pi^cycle_age) x fractal_score
```

| Score | State | Action |
|-------|-------|--------|
| > 1.0 | EXPANDING | Spawn agents, increase resources |
| 0.618 – 1.0 | STABLE | Maintain, optimize |
| 0.382 – 0.618 | DECLINING | Evolution check, reduce spawning |
| < 0.382 | CRITICAL | Morphallaxis, prune dead branches |

---

## Resource Allocation

Every resource split follows φ: **61.8% primary / 38.2% secondary**.

This applies to: tokens, time, memory, agent slots, tool calls, cost budgets.

---

## Auto-Update Converter (v1.3+)

ANIMA OS monitors OpenClaw upstream and auto-applies updates through 4 transformation layers:

```
OpenClaw Release
      |
[1] Brand Replace    — OpenClaw -> ANIMA OS, openclaw.json -> anima_config.json
      |
[2] phi-Weight Inject  — Add phi_weight to all agent definitions
      |
[3] pi-Timing Align   — Align all timing values to pi multiples
      |
[4] Memory Route     — Inject GENESIS.md memory pathways
      |
Protected Files Merge -> Live Apply -> Supabase Log
```

```bash
# Manual conversion
node converter/anima_converter.js --version=v2.1.0 --mode=manual

# Start watcher daemon (checks GitHub API hourly)
bash converter/watch_upstream.sh start
bash converter/watch_upstream.sh status
bash converter/watch_upstream.sh stop

# CI/CD auto-sync (runs every 6 hours via GitHub Actions)
# See: .github/workflows/sync_upstream.yml
```

---

## Integration Guide

### 1. n8n — Workflow Automation
Import `integrations/n8n_webhook.json` into your n8n instance.

| Route | Trigger | Action |
|-------|---------|--------|
| PRIMARY_CELL | agent_name = PRIMARY_CELL | Forward to content pipeline |
| IMMUNE_AGENT | agent_name = IMMUNE_AGENT | Send security alert |
| Cost > $1 | cost_usd > 1.0 | Trigger cost threshold flow |
| EVOLUTION_NODE | agent_name = EVOLUTION_NODE | Log evolution event |

```bash
# Set in .env
N8N_WEBHOOK_URL=https://your-n8n.com/webhook/anima-agent-log
```

### 2. Helicone — LLM Observability
Proxy all LLM calls through Helicone for cost tracking and tracing.

```javascript
// Change base URL to:
baseURL: "https://oai.hconeai.com/v1"

// Add custom headers:
"Helicone-Property-Agent": agentName,
"Helicone-Property-Depth": agentDepth.toString(),
"Helicone-Property-Cycle": cycleNumber.toString(),
"Helicone-Property-Engine": "SOLARIS"
```

See `integrations/helicone_setup.md` for full configuration.

### 3. Langfuse — LLM Tracing
Wrap `quantumDecisionCycle` with 5 traced spans:

| Span | Measures |
|------|----------|
| superposition | Candidate generation time |
| interference | phi-scoring computation |
| collapse | Decision selection |
| classical_execution | Agent execution time |
| immune_scan | Security check duration |

```bash
npm install langfuse
LANGFUSE_SECRET_KEY=your-secret-key
LANGFUSE_PUBLIC_KEY=your-public-key
```

See `integrations/langfuse_setup.md` for full trace setup.

### 4. Ollama — Local LLM Fallback
ANIMA OS auto-switches to local models on timeout/5xx/429 errors.

```bash
# Install and pull model
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3:8b

# Fallback trigger default: 5083ms (phi x pi x 1000)
# In core/anima_config.json: "fallback_trigger_ms": 5083
```

Health check runs every 31416ms (pi x 10,000). See `integrations/ollama_fallback.md`.

### 5. Lark — Team Notifications
```javascript
const { sendLarkNotification } = require('./integrations/lark_notify');

await sendLarkNotification('evolution', { agent: 'EVOLUTION_NODE', cycle: 42 });
await sendLarkNotification('cost_threshold', { cost: 2.50, limit: 1.00 });
```

```bash
LARK_WEBHOOK_URL=https://open.larksuite.com/open-apis/bot/v2/hook/your-id
```

### 6. Discord — Nerve Center
ANIMA OS creates 10 Discord channels automatically:

| Channel | Purpose |
|---------|---------|
| #anima-pulse | Real-time heartbeat events |
| #anima-agents | Agent status updates |
| #anima-evolution | Evolution cycle logs |
| #anima-immune | Security scan alerts |
| #anima-costs | Cost tracking |
| #anima-memory | Memory compaction events |
| #anima-quantum | Quantum decision logs |
| #anima-errors | Error alerts |
| #anima-missions | Mission milestones |
| #anima-reports | Daily reports |

```bash
DISCORD_BOT_TOKEN=your-bot-token
DISCORD_GUILD_ID=your-server-id
node setup/discord_setup.js
```

---

## Dashboard

Built on Next.js 14 + Tailwind CSS + Supabase Realtime. Deploy to Vercel in one command.

```bash
# Development
cd dashboard && npm run dev

# Production deploy
cd dashboard && npx vercel --prod
```

**Required Vercel environment variables:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Dashboard pages:**
| Route | Description | Data Source |
|-------|-------------|-------------|
| `/` | Mission Control | anima_fractal_state + anima_agent_logs |
| `/agents` | Agent tree + cards | anima_fractal_state (realtime) |
| `/quantum` | Quantum state visualizer | anima_agent_logs |
| `/evolution` | Evolution timeline | anima_evolution_log |
| `/costs` | Cost charts + totals | anima_cost_tracker |
| `/settings` | Profile + integrations | anima_master_profile |

---

## File Structure

```
AnimaClaw/
├── SOLARIS.md               <- Drop this into OpenClaw to boot
├── CONSTITUTION.md          <- 5 Classical Laws (immutable)
├── QUANTUM_CONSTITUTION.md  <- 7 Quantum Laws (immutable)
├── GENESIS.md               <- System heartbeat
├── GATEWAY.md               <- Agent admission control
├── SOUL_TEMPLATE.md         <- Mission DNA template
├── SWARM.md                 <- Swarm coordination
├── IMMUNE.md                <- Defense protocols
├── ANIMA_FLASH.sh           <- Flash installer
├── natural_law.json         <- Law registry
├── core/
│   └── anima_config.json    <- System configuration (v1.5.0)
├── agents/                  <- Agent definition files (6)
├── runtime/                 <- Node.js execution engine
│   ├── cli.js               <- CLI interface
│   ├── phi_core.js          <- phi-weighted routing
│   ├── quantum_engine.js    <- Quantum decision cycles
│   ├── immune_scanner.js    <- Security scanning
│   ├── memory_system.js     <- JSONB memory management
│   ├── evolution_engine.js  <- e^alignment growth
│   ├── swarm.js             <- Multi-agent coordination
│   └── tests/               <- Test suite (4 test files)
├── converter/               <- Auto-update pipeline
│   ├── anima_converter.js   <- 4-transformation engine
│   ├── watch_upstream.sh    <- GitHub watcher daemon
│   ├── brand_patch.js       <- Brand transformation
│   ├── merge_config.js      <- Config deep-merger
│   └── PROTECTED_FILES.json <- Files never overwritten
├── onboarding/              <- Three-mode onboarding
│   ├── SPARK_MODE.md
│   ├── ORACLE_MODE.md
│   ├── WILD_MODE.md
│   └── oracle_prompt.txt    <- Paste into any LLM
├── integrations/            <- External service connectors
│   ├── n8n_webhook.json
│   ├── helicone_setup.md
│   ├── langfuse_setup.md
│   ├── ollama_fallback.md
│   └── lark_notify.js
├── setup/
│   ├── install.sh           <- One-command setup
│   ├── discord_setup.js     <- Discord channel creator
│   ├── pi_pulse_daemon.js   <- pi-pulse heartbeat
│   ├── supabase_schema.sql  <- DB schema (safe re-runnable)
│   └── verify.js            <- Connection verification
├── dashboard/               <- Next.js 14 dashboard
│   ├── pages/               <- 6 routes + 6 API routes
│   ├── components/          <- 12 React components
│   ├── lib/                 <- Supabase, vitality, constants
│   └── styles/              <- Tailwind + globals
├── skills/                  <- OpenClaw skill modules (7)
├── .github/
│   └── workflows/
│       └── sync_upstream.yml  <- Auto-sync CI/CD (every 6h)
├── .env.example             <- All environment variables
└── CHANGELOG.md             <- Full version history
```

---

## CLI Reference

```bash
# Check system status
npm run status

# Health check all connections
npm run health

# List active agents
npm run agents

# Show mathematical constants
npm run constants

# Run test suite (all 4 test files)
npm test

# Start pi-pulse daemon
npm run daemon
npm run daemon:stop
npm run daemon:status

# Auto-update converter
bash converter/watch_upstream.sh start
bash converter/watch_upstream.sh status
bash converter/watch_upstream.sh stop
node converter/anima_converter.js --version=v2.0 --mode=manual
```

---

## Frequently Asked Questions

**Q1: Do I need to configure everything before starting?**
No. SPARK mode starts in 60 seconds. You can upgrade your profile to ORACLE mode at any time from the dashboard Settings page.

**Q2: What is OpenClaw and why is it not mentioned in the UI?**
OpenClaw is the underlying agent execution platform. ANIMA OS is the governance and intelligence layer built on top of it. The branding separation is intentional — users see ANIMA OS only.

**Q3: Can I run ANIMA OS without Supabase?**
The runtime CLI and tests work without Supabase. The dashboard, realtime features, memory persistence, and evolution logs all require Supabase. The free tier is sufficient.

**Q4: How does phi-routing actually work?**
Every task receives a score: `phi_score = (complexity/10) x urgency x alignment x agent.phi_weight x depth_penalty`. The highest-scoring available agent gets the task. PRIMARY_CELL (phi=0.618) always outscores SUPPORT_CELL (phi=0.382) at equal inputs.

**Q5: What happens when vitality drops below 0.382?**
The IMMUNE_AGENT triggers Morphallaxis Protocol: spawning halts, low-vitality agents are pruned, and EVOLUTION_NODE runs an emergency e^alignment recalibration.

**Q6: Can I add custom agents?**
Yes. Create a `.md` file in `agents/` with `depth`, `phi_weight`, `parent`, and `cycle_role` fields. GATEWAY.md validates against all 12 Laws before admission.

**Q7: How do I re-run ORACLE onboarding?**
Dashboard > Settings > "Refresh Profile (ORACLE)" > copy the prompt > run through your LLM > paste JSON back. ANIMA merges and triggers an evolution cycle.

**Q8: Is my data sent anywhere?**
All data lives in your own Supabase instance. ANIMA OS never transmits data externally except through integrations you explicitly configure. WILD mode behavioral logs are stored in your Supabase `behavioral_log JSONB` column only.

**Q9: What does the auto-update converter protect?**
Files listed in `converter/PROTECTED_FILES.json` are never overwritten: all ANIMA identity files, onboarding docs, converter itself, `.github/`, `core/anima_config.json`, and `natural_law.json`.

**Q10: How do I deploy to VPS instead of Vercel?**
```bash
bash deploy-vps.sh
# Or manually with PM2:
pm2 start runtime/cli.js --name anima-os
cd dashboard && npm run build && pm2 start npm --name anima-dashboard -- start
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Supabase connection fails | Verify `SUPABASE_URL` + `SUPABASE_ANON_KEY`. Confirm SQL schema was applied. |
| Discord bot error | Bot needs `Manage Channels` + `Manage Roles`. Re-invite with correct OAuth2 scopes. |
| Dashboard shows no data | Check browser console. Verify Vercel env vars. Ensure at least one pulse cycle ran. |
| Telegram not arriving | Test token via `https://api.telegram.org/bot<TOKEN>/getMe`. Check CHAT_ID. |
| Vitality scores all zero | System needs at least one pulse cycle. Run `node setup/verify.js`. |
| Watcher daemon fails | Run `bash converter/watch_upstream.sh status`. Delete stale `.anima_watcher.pid` if needed. |
| ORACLE JSON parse error | LLM must output raw JSON only — no markdown fences. Validate with `JSON.parse()` first. |

---

## Roadmap — v2.0

| Feature | Description |
|---------|-------------|
| Voice Interface | Real-time voice commands via WebRTC + Whisper transcription |
| Eyela.ai SaaS Layer | Multi-tenant ANIMA OS hosting — spin up instances per client |
| Long-Term Memory | Vector embeddings via pgvector for semantic agent memory |
| Mobile Dashboard | React Native companion app with push vitality alerts |
| Agent Marketplace | Community skill modules with phi-compatibility scoring |
| Auto-ORACLE | ANIMA interviews users autonomously via Discord DM |
| Cost Optimizer | Automatic model routing by cost-per-token x alignment |
| Swarm Intelligence | Cross-instance ANIMA OS coordination protocol |

---

## Version History

See [CHANGELOG.md](CHANGELOG.md) for the complete file-by-file history.

| Version | Highlights |
|---------|------------|
| v1.5 STABLE | Integration layer: n8n, Helicone, Langfuse, Ollama, Lark. Mobile-responsive dashboard. |
| v1.4 | Three-mode onboarding: SPARK, ORACLE, WILD. Dashboard onboarding wizard. |
| v1.3 | Living Update Converter: 4-transformation auto-sync pipeline + watcher daemon. |
| v1.2 | Quantum Layer: 7 Quantum Laws + quantum decision cycles. |
| v1.1 | Immune System: IMMUNE_AGENT + morphallaxis protocol. |
| v1.0 | Genesis: fractal agents, phi-routing, Supabase 5-table schema. |

---

## License

MIT License — see [LICENSE](LICENSE)

Copyright © 2026 Riyad Ketami

---

## Credits

**Created by:** Riyad Ketami
**Contact:** riyad@ketami.net
**Repository:** [github.com/riyad7creator/AnimaClaw](https://github.com/riyad7creator/AnimaClaw)
**Engine:** SOLARIS

---

*The organism awaits its mission. Drop SOLARIS.md and begin.*
