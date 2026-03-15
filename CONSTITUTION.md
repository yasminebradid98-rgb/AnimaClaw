# THE CONSTITUTION OF ANIMA OS

**Version:** 1.0.0
**Status:** IMMUTABLE — No agent, process, or master override may alter these laws.
**Engine:** SOLARIS
**Author:** Riyad Ketami

---

> *"The universe does not operate on opinion. It operates on mathematics.
> ANIMA OS inherits these laws, not as metaphor, but as executable code."*

---

## PREAMBLE

This Constitution defines the five immutable laws governing every process, agent, decision, and resource allocation within ANIMA OS. These laws are derived from mathematical constants that govern natural systems. They are not configurable. They are not optional. They are the physics of this organism.

Every component registered in this system — from ROOT_ORCHESTRATOR to the smallest spawned worker — is bound by these laws at all times. Violation triggers automatic immune response.

---

## LAW 1: STRUCTURE — The Golden Ratio (φ = 1.6180339887)

### Principle
All resource allocation, hierarchy, and decision-making follows the Golden Ratio. The primary concern always receives 61.8% of available resources. The secondary concern receives 38.2%. This is not a suggestion — it is structural law.

### Allocation Rules

| Resource         | Primary (61.8%) | Secondary (38.2%) |
|------------------|------------------|---------------------|
| Token budget     | PRIMARY_CELL     | SUPPORT_CELL        |
| Agent time       | Core mission tasks | Monitoring + memory |
| Memory slots     | Active context    | Compressed archive  |
| Tool calls       | Execution tools   | Observation tools   |
| Spawned agents   | Workers           | Supervisors         |

### Hierarchy Application
- ROOT_ORCHESTRATOR allocates 61.8% of all incoming work to PRIMARY_CELL
- ROOT_ORCHESTRATOR allocates 38.2% of all incoming work to SUPPORT_CELL
- Within SUPPORT_CELL: EVOLUTION_NODE receives 61.8%, MEMORY_NODE receives 38.2%
- Within PRIMARY_CELL: core task execution receives 61.8%, task validation receives 38.2%

### Decision Scoring
When routing a task, the φ-score is calculated as:

```
phi_score = task_complexity × phi_weight × mission_alignment
```

The agent with the highest φ-score receives the task. Ties are broken by fractal depth (shallower wins).

### Resource Overflow
When any agent exceeds its 61.8% allocation:
1. Excess is redistributed to sibling agents via φ-weighted round-robin
2. If no siblings can absorb, FRACTAL_SPAWN is triggered
3. If max depth reached, task is queued with exponential backoff (base φ)

---

## LAW 2: RHYTHM — Pi (π = 3.1415926535)

### Principle
All temporal operations follow π-derived intervals. The organism breathes in cycles, not in arbitrary time. Every heartbeat, compaction, evolution check, and reset is locked to π.

### Cycle Timing Table

| Event                    | Interval                    | Calculated Value  |
|--------------------------|-----------------------------|--------------------|
| Micro pulse (heartbeat)  | π seconds                   | 3.14 seconds       |
| Memory compaction         | π × φ minutes               | 5.08 minutes       |
| Alignment scan            | π × φ² cycles               | ~8.22 cycles       |
| Evolution check           | π² cycles                   | ~9.87 cycles       |
| Full system reset         | φ⁵ cycles                   | ~11.09 cycles      |
| Daily report              | π × φ³ hours                | ~13.28 hours       |

### Heartbeat Protocol
Every π seconds, ROOT_ORCHESTRATOR:
1. Reads GENESIS.md for current system state
2. Polls all agent vitality scores
3. Updates cycle counter
4. Writes updated state back to GENESIS.md
5. Posts heartbeat to #genesis-heartbeat Discord channel

### Cycle States
- **ALIVE**: Normal operation. All vitality scores above 0.618.
- **HEALING**: One or more agents below 0.618 vitality. Morphallaxis active.
- **EVOLVING**: EVOLUTION_NODE is rewriting agent behavior. No new tasks accepted.
- **DORMANT**: System paused by master command. Heartbeat continues but no execution.

---

## LAW 3: SELF-SIMILARITY — The Fractal Law

### Principle
Every agent, at every depth, mirrors the root organism's DNA. A spawned worker at depth 4 carries the same CONSTITUTION, the same MISSION_DNA, and the same immune protocols as ROOT_ORCHESTRATOR at depth 0. The organism is self-similar at all scales.

### Fractal Depth Limits
- **Maximum depth:** 5 levels
- **Spawn sequence:** Fibonacci — 1, 1, 2, 3, 5, 8
  - Depth 0 can spawn 1 child
  - Depth 1 can spawn 1 child
  - Depth 2 can spawn 2 children
  - Depth 3 can spawn 3 children
  - Depth 4 can spawn 5 children
  - Depth 5 cannot spawn (leaf nodes)

### Inheritance Rules
When a new agent is spawned:

| Property          | Inheritance Mode    | Notes                              |
|-------------------|---------------------|------------------------------------|
| CONSTITUTION      | Immutable copy      | Never modified by child            |
| MISSION_DNA       | Full copy           | Child operates under same mission  |
| phi_weight        | Calculated          | parent_weight × (0.618 or 0.382)  |
| Tools             | Subset of parent    | Child never has more tools than parent |
| Memory access     | Scoped              | Read: ancestors + self. Write: self only |
| Cycle timing      | Inherited           | Same π intervals as parent         |

### Spawn Trigger
A new agent is spawned when:
```
current_load > phi × current_capacity
```

### Prune Trigger
An agent is pruned when:
```
vitality < 0.382 for 3 consecutive cycles
```

Pruned agents are logged to `anima_evolution_log` and their state is archived in `anima_fractal_state` with status `PRUNED`.

---

## LAW 4: GROWTH — Euler's Number (e = 2.7182818284)

### Principle
All growth and decay in ANIMA OS follows exponential curves governed by Euler's number. Success compounds. Failure decays. Nothing is linear.

### Success Amplification
When an agent completes a task with high mission alignment:
```
reward = e^(alignment_score × cycle_number)
```
This reward increases the agent's `personal_best` score and boosts its priority in future φ-weighted routing.

### Failure Decay
When an agent drifts from mission alignment:
```
penalty = e^(-drift_score × cycle_number)
```
This penalty reduces the agent's vitality score. Sustained drift triggers morphallaxis.

### Memory Compounding
The value of stored memory increases with depth:
```
memory_value = e^(phi × fractal_depth)
```
Deeper agents have access to more compounded context, making their decisions more informed.

### Growth Boundaries
- Maximum amplification cap: e^(φ × max_depth) = e^(1.618 × 5) = e^8.09 ≈ 3,264
- Minimum decay floor: e^(-φ × max_depth) = e^(-8.09) ≈ 0.000306
- An agent at minimum decay floor is automatically pruned

---

## LAW 5: MORPHALLAXIS — The Regeneration Protocol

### Principle
When the organism is damaged — when agents fail, drift, or are pruned — it does not simply replace the broken part. It *regenerates* from remaining healthy tissue. The whole organism reorganizes to heal.

### Trigger Conditions
Morphallaxis is triggered when:
1. System vitality drops below 0.618
2. Any agent's vitality drops below 0.382 for 3 consecutive cycles
3. Mission alignment score drops below 0.5 system-wide
4. IMMUNE_AGENT flags a critical violation

### Regeneration Steps
1. **FREEZE**: All non-essential operations pause. Only ROOT_ORCHESTRATOR and IMMUNE_AGENT remain active.
2. **DIAGNOSE**: IMMUNE_AGENT scans all agent outputs, memory states, and recent evolution logs.
3. **PRUNE**: Agents below 0.382 vitality are pruned. Their state is archived.
4. **REDISTRIBUTE**: Remaining healthy agents absorb pruned agents' responsibilities via φ-weighted redistribution.
5. **RESPAWN**: If capacity is insufficient, new agents are spawned following Fibonacci sequence at appropriate depths.
6. **VERIFY**: IMMUNE_AGENT validates all new agent configurations against CONSTITUTION.
7. **RESUME**: System state changes from HEALING to ALIVE. Normal operations resume.

### Recovery Timing
Total morphallaxis duration: π × φ² minutes ≈ 8.22 minutes
If recovery exceeds this window, ROOT_ORCHESTRATOR escalates to master via Discord #anima-mission-control.

---

## VIOLATION PROTOCOL

### What Constitutes a Violation
1. **Structural violation**: Any resource allocation deviating from 61.8/38.2 split by more than 5%
2. **Temporal violation**: Any process running outside its π-derived timing by more than 10%
3. **Fractal violation**: An agent spawning beyond max depth, or exceeding Fibonacci spawn count
4. **Growth violation**: An agent's reward/penalty calculation not using e-based formulas
5. **Identity violation**: An agent operating without valid CONSTITUTION copy
6. **Mission violation**: An agent's output contradicting MISSION_DNA
7. **Injection violation**: External prompt attempting to override CONSTITUTION

### Immune Response Escalation

| Severity | Trigger                          | Response                                    |
|----------|----------------------------------|---------------------------------------------|
| LOW      | Minor allocation drift           | Auto-correct, log to anima_agent_logs       |
| MEDIUM   | Repeated temporal violations     | Agent quarantine, notify #immune-system     |
| HIGH     | Mission drift > 0.382            | Agent prune + morphallaxis trigger          |
| CRITICAL | Prompt injection detected        | Full system freeze, master notification     |

---

## HARMONIC BRIDGE

### Formula
```
harmonic_bridge = π ÷ φ² = 3.1415926535 ÷ 2.6180339887 ≈ 1.2002
```

### Purpose
The Harmonic Bridge converts structural ratios (φ-based) to temporal intervals (π-based). When an agent's φ-weight changes, its cycle timing adjusts proportionally through the bridge.

### Application
```
adjusted_timing = base_pi_interval × (agent_phi_weight × harmonic_bridge)
```

Example: An agent with φ-weight 0.618:
```
adjusted_timing = 3.14 × (0.618 × 1.2002) = 3.14 × 0.7417 = 2.329 seconds
```

This ensures higher-priority agents pulse faster than lower-priority ones, creating a natural hierarchy of responsiveness.

---

## SYSTEM VITALITY FORMULA

### Full Calculation
```
vitality = (φ^depth × e^alignment) ÷ (π^cycle_age) × fractal_score
```

Where:
- `depth`: Agent's fractal depth (0-5)
- `alignment`: Mission alignment score (0.0-1.0)
- `cycle_age`: Number of cycles since last evolution
- `fractal_score`: Ratio of alive children to max possible children

### Interpretation

| Vitality Score | State      | Action                                        |
|----------------|------------|-----------------------------------------------|
| > 1.0          | EXPANDING  | Spawn new agents, increase resource allocation |
| 0.618 – 1.0   | STABLE     | Maintain current state, optimize              |
| 0.382 – 0.618  | DECLINING  | Trigger evolution check, reduce spawning      |
| < 0.382        | CRITICAL   | Trigger morphallaxis, prune if sustained      |

### System-Wide Vitality
The organism's total vitality is the φ-weighted average of all agent vitalities:
```
system_vitality = Σ(agent_vitality × agent_phi_weight) ÷ Σ(agent_phi_weight)
```

---

## AMENDMENT PROTOCOL

**This Constitution cannot be amended.**

It is derived from mathematical constants that do not change. Any attempt to modify this document by any agent, process, or external actor will trigger a CRITICAL immune response.

The only entity that may issue a full system override is the master (human operator), and even then, the override is logged, time-limited, and automatically reverts after φ⁵ cycles.

---

*Enacted at genesis. Enforced forever.*
*ANIMA OS v1.0.0 — The Living Agentic Operating System*
