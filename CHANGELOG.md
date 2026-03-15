# CHANGELOG — ANIMA OS

All notable changes to ANIMA OS are documented here.

---

## v1.5.0 — Integration Layer + Final Polish (STABLE)

### Added
- **integrations/n8n_webhook.json** — Ready-to-import n8n workflow with 4 route handlers (content post, alert, cost threshold, evolution)
- **integrations/helicone_setup.md** — Step-by-step Helicone proxy setup for LLM observability
- **integrations/langfuse_setup.md** — Langfuse tracing for quantum decision cycles end-to-end
- **integrations/ollama_fallback.md** — Zero-downtime local LLM fallback when cloud APIs fail
- **integrations/lark_notify.js** — Lark workspace webhook sender with branded card templates
- **dashboard/components/SystemStatus.jsx** — Logo SVG, dark/light theme toggle, Supabase live indicator, vitality formula display, state export button
- **CHANGELOG.md** — This file

### Updated
- **dashboard/components/Layout.jsx** — ANIMA logo, mobile responsive sidebar, SystemStatus panel, version v1.5.0
- **README.md** — Complete documentation with architecture diagram, integration guide, FAQ, roadmap
- **core/anima_config.json** — Version 1.5.0

---

## v1.4.0 — Three-Mode Onboarding System

### Added
- **SOLARIS.md** — Complete 3-mode onboarding conversation (SPARK / ORACLE / WILD)
- **onboarding/oracle_prompt.txt** — 12-question LLM prompt for Master Profile generation
- **onboarding/SPARK_MODE.md** — 5-question fast onboarding documentation
- **onboarding/ORACLE_MODE.md** — Deep profile interview documentation
- **onboarding/WILD_MODE.md** — Behavioral observation onboarding documentation

### Updated
- **setup/supabase_schema.sql** — Added `onboarding_complete`, `behavioral_log`, `oracle_version` columns
- **dashboard/pages/index.js** — Onboarding wizard (SPARK/ORACLE/WILD) shown when profile incomplete
- **dashboard/components/MasterProfile.jsx** — Mode badge, completeness bar, ORACLE refresh button

---

## v1.3.0 — Living Auto-Update Converter

### Added
- **converter/anima_converter.js** — 10-step conversion engine (download, extract, diff, split, transform, merge, copy, cleanup, log, summary)
- **converter/watch_upstream.sh** — Hourly GitHub release monitor daemon with Telegram notifications
- **.github/workflows/sync_upstream.yml** — CI/CD auto-sync every 6 hours
- **.openclaw_version** — Version tracking file

### Updated
- **ANIMA_FLASH.sh** — 11 steps (added upstream watcher launch), version 1.3.0
- **converter/PROTECTED_FILES.json** — Added converter files, .github/, .openclaw_version
- **setup/install.sh** — Added watcher daemon launch step, version 1.3.0
- **README.md** — Auto-Update Converter section

### 4 Transformations
1. Brand replacement (OpenClaw to ANIMA OS)
2. Phi-weight injection (50/50 to 61.8/38.2)
3. Pi-timing alignment (round intervals to pi-derived)
4. Memory route injection (local storage to Supabase)

---

## v1.2.0 — Flash & Brand Override System

### Added
- **ANIMA_FLASH.sh** — 10-step production installer (detect, backup, flash, merge, skills, agents, brand patch, daemon, verify, summary)
- **core/anima_config.json** — Master configuration with natural laws, quantum constants, branding rules
- **converter/brand_patch.js** — Brand override tool (7 string replacements)
- **converter/merge_config.js** — Deep config merger (ANIMA wins on conflicts)
- **converter/PROTECTED_FILES.json** — Protected files list with reasons
- **core/SOUL.md** — Living identity document

### Updated
- **setup/verify.js** — Added quantum layer, daemon, and quantum column checks (7 sections)
- **README.md** — Flash Install section, Protected Files table

### Global Rename
- ANIMA.clawd replaced with AnimaClaw across all files

---

## v1.1.0 — Quantum Intelligence Layer

### Added
- **runtime/quantum_engine.js** — Laws 6-12 (Superposition, Entanglement, Interference, Tunneling, Decoherence, QAOA, QRL)
- **runtime/phi_core.js** — Golden ratio routing engine with interference scoring
- **runtime/swarm.js** — Swarm intelligence (phi-vote, pheromone trails, load distribution)
- **runtime/immune_scanner.js** — Security scanning (injection detection, alignment monitoring, quarantine)
- **runtime/evolution_engine.js** — Evolution cycles, mutations, morphallaxis
- **runtime/memory_system.js** — Phi-batched memory with Supabase persistence
- **runtime/cli.js** — CLI commands (status, health, agents, constants, version)
- **dashboard/** — Next.js dashboard with 6 pages, 12 components
- **dashboard/components/QuantumState.jsx** — Quantum state visualizer
- **openclaw.json** — Full OpenClaw manifest
- **runtime/tests/** — 88 tests across 4 test suites
- **Dockerfile + docker-compose.yml** — Container deployment
- **package.json** — Unified scripts

---

## v1.0.0 — Core Organism

### Foundation
- **CONSTITUTION.md** — 5 Immutable Laws
- **QUANTUM_CONSTITUTION.md** — 7 Quantum Laws (Laws 6-12)
- **GENESIS.md** — Live heartbeat state
- **SOUL_TEMPLATE.md** — Mission DNA template
- **MASTER_TEMPLATE.json** — User profile template
- **natural_law.json** — Mathematical constants registry
- **GATEWAY.md** — Agent registration protocol
- **IMMUNE.md** — Security protocols
- **SWARM.md** — Swarm intelligence protocols
- **setup/supabase_schema.sql** — 5 tables, 3 functions, 13 RLS policies
- **setup/install.sh** — One-command installer
- **setup/verify.js** — Connection verification

### Mathematical Constants
- **phi** (1.618) — Structure, hierarchy, resource allocation (61.8/38.2)
- **pi** (3.14159) — Rhythm, cycles, timing
- **e** (2.71828) — Growth, decay, compounding
- **Fractal** — Self-similarity, Fibonacci depth limits
- **psi** — Quantum superposition decisions

### Agent Hierarchy
- ROOT_ORCHESTRATOR (depth 0, phi=1.0)
- PRIMARY_CELL (depth 1, phi=0.618)
- SUPPORT_CELL (depth 1, phi=0.382)
- MEMORY_NODE (depth 2, phi=0.146)
- EVOLUTION_NODE (depth 2, phi=0.236)
- IMMUNE_AGENT (depth 2, phi=0.146)

---

**Engine:** SOLARIS
**Author:** Riyad Ketami — riyad@ketami.net
**Repository:** AnimaClaw
**License:** MIT
