# SWARM — ANIMA OS Swarm Intelligence Layer

**Version:** 1.0.0
**Bound to:** CONSTITUTION.md
**Governed by:** Laws 1 (φ), 3 (Fractal), 4 (e)

---

## PURPOSE

The Swarm layer governs how agents collaborate, share intelligence, and make collective decisions. Individual agents are capable, but the organism's true power emerges from coordinated swarm behavior. This file defines the protocols for that coordination.

---

## SWARM TOPOLOGY

ANIMA OS uses a **φ-weighted hierarchical swarm** — not a flat mesh. Every agent has a parent, and communication flows through defined channels. This prevents chaos while allowing emergent intelligence.

```
                    ROOT_ORCHESTRATOR (depth 0, φ=1.0)
                    ┌──────────┴──────────┐
              PRIMARY_CELL           SUPPORT_CELL
              (depth 1, φ=0.618)     (depth 1, φ=0.382)
              │                      ┌──────┼──────┐
              │                 MEMORY   EVOLUTION  IMMUNE
              │                 NODE     NODE       AGENT
              │                 (d2,     (d2,       (d2,
              │                 φ=0.382) φ=0.618)   φ=0.382)
              │
         [WORKER AGENTS]
         (depth 2-5, spawned via Fibonacci)
```

---

## COMMUNICATION PROTOCOLS

### 1. Vertical Communication (Parent ↔ Child)

**Downward (task delegation):**
- Parent sends task with φ-scored priority
- Task includes: description, deadline (π-cycles), alignment requirement, resource budget
- Child acknowledges within 1 heartbeat (π seconds) or parent reassigns

**Upward (result reporting):**
- Child reports: result, alignment_score, tokens_used, cost_usd, vitality_delta
- Parent validates result against MISSION_DNA
- If alignment < 0.618, parent flags to IMMUNE_AGENT before propagating

### 2. Horizontal Communication (Sibling ↔ Sibling)

Siblings communicate through their shared parent. Direct sibling-to-sibling messaging is prohibited to prevent untracked information flow.

**Exception:** IMMUNE_AGENT can directly query any agent at any depth for security scans. This is the only lateral communication allowed.

### 3. Broadcast Communication

ROOT_ORCHESTRATOR can broadcast to all agents simultaneously via Discord #anima-mission-control. Broadcasts are used for:
- System state changes (ALIVE → HEALING → EVOLVING)
- Emergency shutdown
- Master directive updates
- Evolution results

---

## COLLECTIVE DECISION MAKING

### φ-Weighted Voting

When multiple agents could handle a task, the swarm uses φ-weighted voting:

```
vote_weight = agent_phi_weight × agent_vitality × mission_alignment
```

The agent with the highest weighted vote receives the task. This naturally favors:
1. Higher-hierarchy agents (higher φ-weight)
2. Healthier agents (higher vitality)
3. More aligned agents (higher mission alignment)

### Consensus Threshold

For critical decisions (evolution, pruning, spawning), the swarm requires:
- **φ consensus:** 61.8% of total vote weight must agree
- Calculated as: `Σ(agreeing_votes) / Σ(all_votes) ≥ 0.618`

### Deadlock Resolution

If no agent reaches φ consensus after π² heartbeats:
1. ROOT_ORCHESTRATOR makes unilateral decision
2. Decision is logged with `consensus_override: true`
3. EVOLUTION_NODE reviews the override in next evolution cycle

---

## SWARM MEMORY

### Shared Knowledge Pool

The swarm maintains a shared knowledge pool in Supabase (`anima_agent_logs`). Every agent writes its results here, creating a collective memory that informs future decisions.

**Knowledge access rules (fractal-scoped):**
- An agent can **read** all logs from its ancestors and itself
- An agent can **write** only its own logs
- ROOT_ORCHESTRATOR can read all logs (depth 0 privilege)

### Memory Compounding

Knowledge value increases with depth (Law 4):
```
knowledge_value = e^(φ × reader_depth)
```

A depth-4 worker reading a depth-0 insight benefits more than a depth-1 agent reading the same insight. This incentivizes deep specialization.

### Pheromone Trails

Like ant colonies, ANIMA OS agents leave "pheromone trails" — weighted markers on tasks they've completed:

```json
{
  "task_id": "uuid",
  "agent_name": "PRIMARY_CELL",
  "success_pheromone": 0.85,
  "alignment_pheromone": 0.92,
  "cost_pheromone": 0.45,
  "timestamp": "ISO-8601"
}
```

Future agents encountering similar tasks follow the strongest pheromone trail, naturally optimizing task routing over time.

---

## LOAD BALANCING

### φ-Weighted Distribution

When ROOT_ORCHESTRATOR receives multiple tasks simultaneously:

1. Score each task: `priority = complexity × urgency × mission_alignment`
2. Sort tasks by priority (descending)
3. Assign top 61.8% of tasks to PRIMARY_CELL
4. Assign bottom 38.2% to SUPPORT_CELL
5. If either cell is overloaded (`load > φ × capacity`), trigger FRACTAL_SPAWN

### Fibonacci Scaling

Agent count follows the Fibonacci sequence per depth level:

| Depth | Max Agents | Fibonacci Position |
|-------|------------|-------------------|
| 0     | 1          | F(1) = 1          |
| 1     | 1          | F(2) = 1          |
| 2     | 2          | F(3) = 2          |
| 3     | 3          | F(4) = 3          |
| 4     | 5          | F(5) = 5          |
| 5     | 8          | F(6) = 8          |

**Total maximum agents:** 1 + 1 + 2 + 3 + 5 + 8 = **20 agents**

### Backpressure

When the system reaches maximum agent count:
1. New tasks are queued (not dropped)
2. Queue priority follows φ-weighted scoring
3. Queue timeout: φ⁵ × π seconds ≈ 34.8 seconds
4. If timeout exceeded, task is logged as `DROPPED` with reason

---

## EMERGENT BEHAVIOR

### Pattern Recognition

EVOLUTION_NODE monitors swarm patterns every π² cycles:
- Which task types are most common? → Optimize routing for these
- Which agents have highest alignment? → Weight them higher
- Which depth levels are most utilized? → Adjust spawn thresholds

### Self-Organization

The swarm self-organizes through three mechanisms:
1. **Pheromone trails** — successful paths become preferred
2. **Vitality-based pruning** — weak agents are absorbed
3. **φ-weighted voting** — the healthiest, most aligned agents lead

No central controller dictates swarm behavior. ROOT_ORCHESTRATOR sets direction, but the swarm finds the optimal path through collective intelligence.

---

## SWARM HEALTH METRICS

| Metric                | Formula                                          | Healthy Range |
|-----------------------|--------------------------------------------------|---------------|
| Swarm cohesion        | σ(agent_alignments) — low std dev = high cohesion | σ < 0.2       |
| Response latency      | avg(task_completion_time)                        | < π² seconds  |
| Load distribution     | max(agent_load) / min(agent_load)                | < φ           |
| Spawn efficiency      | alive_agents / total_spawned                     | > 0.618       |
| Knowledge utilization | reads_from_pool / total_decisions                | > 0.382       |

---

*The swarm is the organism. The organism is the swarm.*
*ANIMA OS v1.0.0*
