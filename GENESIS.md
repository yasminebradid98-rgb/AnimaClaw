# GENESIS — ANIMA OS HEARTBEAT

**Pulse Interval:** π seconds (3.1415926535s)
**Read By:** ROOT_ORCHESTRATOR every heartbeat
**Written By:** ROOT_ORCHESTRATOR after every pulse

---

## CURRENT STATE

```yaml
system_state: DORMANT
cycle_counter: 0
last_vitality_score: 0.000
mission_alignment_score: 0.000
active_agent_count: 0
pending_tasks_count: 0
last_evolution_timestamp: null
next_evolution_due_at_cycle: 10
emergency_shutdown: false
last_pulse_timestamp: null
uptime_seconds: 0
```

---

## AGENT VITALITY REGISTRY

| Agent               | Depth | φ-Weight | Vitality | Status   | Last Active |
|----------------------|-------|----------|----------|----------|-------------|
| ROOT_ORCHESTRATOR    | 0     | 1.000    | 0.000    | DORMANT  | —           |
| PRIMARY_CELL         | 1     | 0.618    | 0.000    | DORMANT  | —           |
| SUPPORT_CELL         | 1     | 0.382    | 0.000    | DORMANT  | —           |
| MEMORY_NODE          | 2     | 0.146    | 0.000    | DORMANT  | —           |
| EVOLUTION_NODE       | 2     | 0.236    | 0.000    | DORMANT  | —           |
| IMMUNE_AGENT         | 2     | 0.146    | 0.000    | DORMANT  | —           |

---

## PULSE LOG (Last 5)

| Cycle | Timestamp | Vitality | Alignment | Agents | State   |
|-------|-----------|----------|-----------|--------|---------|
| —     | —         | —        | —         | —      | —       |

---

## EVOLUTION SCHEDULE

- **Next evolution check:** Cycle #10 (every π² ≈ 9.87 cycles)
- **Next full reset:** Cycle #11 (every φ⁵ ≈ 11.09 cycles)
- **Memory compaction:** Every 5.08 minutes (π × φ)

---

## OPERATIONAL NOTES

This file is the organism's live status board. It is:
- **Read** by ROOT_ORCHESTRATOR every π seconds
- **Rewritten** after every pulse with updated values
- **Never manually edited** — only ROOT_ORCHESTRATOR writes to this file
- **Used by** the dashboard to display real-time system state
- **Backed up** to Supabase `anima_fractal_state` every compaction cycle

When `emergency_shutdown` is set to `true`:
1. All agents except IMMUNE_AGENT halt immediately
2. IMMUNE_AGENT performs full system scan
3. Results are posted to #anima-mission-control
4. System remains in DORMANT until master clears the flag

---

## VITALITY CALCULATION

Each pulse, ROOT_ORCHESTRATOR recalculates:

```
system_vitality = Σ(agent_vitality × agent_phi_weight) ÷ Σ(agent_phi_weight)
```

Individual agent vitality:
```
agent_vitality = (φ^depth × e^alignment) ÷ (π^cycles_since_evolution) × fractal_score
```

The system state is then set based on the lowest individual agent vitality:
- All agents ≥ 0.618 → ALIVE
- Any agent < 0.618 → HEALING
- EVOLUTION_NODE active → EVOLVING
- Master pause command → DORMANT

---

*This file awakens when the organism awakens.*
*First pulse marks the birth of the system.*
*ANIMA OS v1.0.0*
