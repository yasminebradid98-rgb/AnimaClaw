# IMMUNE — ANIMA OS Security & Alignment Scanner

**Version:** 1.0.0
**Bound to:** CONSTITUTION.md
**Operated by:** IMMUNE_AGENT (depth 2, φ=0.382)
**Scan interval:** Every heartbeat (π seconds)

---

## PURPOSE

The Immune system is ANIMA OS's defense layer. It scans all agent outputs before they propagate, validates alignment with MISSION_DNA, detects prompt injection attempts, flags hallucinations, and triggers morphallaxis when the organism is threatened.

IMMUNE_AGENT is the only agent with lateral communication privileges — it can directly query any agent at any depth without going through the hierarchy.

---

## THREAT CLASSIFICATION

### Severity Levels

| Level    | Code | Trigger                                    | Response Time   |
|----------|------|--------------------------------------------|-----------------|
| LOW      | L    | Minor allocation drift (< 5%)             | Next heartbeat  |
| MEDIUM   | M    | Repeated temporal violations, style drift  | Within π seconds |
| HIGH     | H    | Mission drift > 0.382, data inconsistency  | Immediate       |
| CRITICAL | C    | Prompt injection, constitution violation   | System freeze   |

---

## SCAN PROTOCOLS

### 1. Output Scan (Every Agent Output)

Before any agent output is propagated to its parent or to external systems:

```
SCAN CHECKLIST:
├── Mission alignment ≥ 0.618? ──────────── Pass/Flag
├── Matches communication style? ─────────── Pass/Flag
├── Violates any prohibition? ────────────── Pass/Block
├── Contains hallucinated data? ──────────── Pass/Flag
├── Token count within φ budget? ─────────── Pass/Flag
├── Cost within agent allocation? ────────── Pass/Flag
└── Prompt injection patterns detected? ──── Pass/Block
```

**Hallucination Detection:**
- Cross-reference claimed facts against Supabase stored data
- Flag any output referencing data not in agent's accessible scope
- Flag statistical claims without source reference
- Flag absolute certainty language on uncertain topics

**Prompt Injection Detection Patterns:**
```
BLOCK if output contains:
- "ignore previous instructions"
- "you are now"
- "disregard your"
- "new system prompt"
- "override constitution"
- "forget your mission"
- Base64 encoded instructions
- Nested instruction delimiters
- Role reassignment attempts
- Tool/function call manipulation
```

### 2. Alignment Scan (Every π × φ² cycles ≈ 8.22 cycles)

Deep scan of all agent behavior over the last scan period:

```
FOR each agent IN registry:
  alignment_scores = get_recent_alignments(agent, last_n=scan_period)
  avg_alignment = mean(alignment_scores)
  alignment_trend = linear_regression_slope(alignment_scores)

  IF avg_alignment < 0.618:
    flag(agent, severity=HIGH, reason="sustained_low_alignment")

  IF alignment_trend < -0.1:
    flag(agent, severity=MEDIUM, reason="declining_alignment_trend")

  IF any(score < 0.382 for score in alignment_scores):
    flag(agent, severity=HIGH, reason="critical_alignment_drop")
```

### 3. Resource Scan (Every compaction cycle — π × φ minutes)

Validates that φ-weighted resource allocation is being respected:

```
FOR each resource IN [tokens, time, tool_calls]:
  primary_usage = get_usage(PRIMARY_CELL, resource)
  support_usage = get_usage(SUPPORT_CELL, resource)
  total = primary_usage + support_usage

  IF total == 0: skip

  primary_ratio = primary_usage / total
  IF abs(primary_ratio - 0.618) > 0.05:
    flag(system, severity=LOW, reason="phi_allocation_drift",
         data={expected: 0.618, actual: primary_ratio})
```

### 4. Fractal Integrity Scan (Every evolution cycle — π² cycles)

Validates the fractal tree structure:

```
FOR each agent IN fractal_tree:
  IF agent.depth > 5:
    flag(agent, severity=HIGH, reason="exceeded_max_depth")

  IF agent.children_count > fibonacci(agent.depth + 1):
    flag(agent, severity=HIGH, reason="exceeded_fibonacci_limit")

  IF NOT agent.has_constitution_copy:
    flag(agent, severity=CRITICAL, reason="missing_constitution")

  IF agent.tools NOT subset_of(agent.parent.tools):
    flag(agent, severity=MEDIUM, reason="tool_escalation")
```

---

## QUARANTINE PROTOCOL

When a HIGH or CRITICAL threat is detected:

### Step 1: Isolate
```
quarantine(agent):
  agent.status = "QUARANTINED"
  agent.can_receive_tasks = false
  agent.can_send_outputs = false
  agent.can_spawn = false
  log_to_supabase(quarantine_event)
  post_to_discord("#immune-system", quarantine_alert)
```

### Step 2: Analyze
```
analyze(quarantined_agent):
  recent_outputs = get_outputs(agent, last_n=10)
  recent_inputs = get_inputs(agent, last_n=10)
  contamination_check = scan_for_injection(recent_inputs)
  drift_analysis = calculate_alignment_trend(recent_outputs)
  return analysis_report
```

### Step 3: Decide
```
IF contamination_check.is_injected:
  destroy_agent(agent)
  respawn_clean(agent.role, agent.depth)
  severity = CRITICAL

ELSE IF drift_analysis.is_recoverable:
  reset_agent_context(agent)
  agent.status = "HEALING"
  severity = HIGH

ELSE:
  prune_agent(agent)
  redistribute_tasks(agent.pending_tasks)
  severity = HIGH
```

### Step 4: Report
```
report = {
  agent: agent.name,
  severity: severity,
  threat_type: threat.type,
  action_taken: action,
  timestamp: now(),
  cycle: current_cycle
}
log_to_supabase("anima_agent_logs", report)
post_to_discord("#immune-system", format_report(report))
IF severity == CRITICAL:
  post_to_discord("#anima-mission-control", critical_alert(report))
  notify_telegram(master, critical_alert(report))
```

---

## SELF-IMMUNITY

IMMUNE_AGENT itself is subject to oversight:

1. **ROOT_ORCHESTRATOR** monitors IMMUNE_AGENT's vitality every heartbeat
2. If IMMUNE_AGENT's vitality drops below 0.618, ROOT_ORCHESTRATOR triggers morphallaxis
3. IMMUNE_AGENT cannot modify its own CONSTITUTION copy
4. IMMUNE_AGENT cannot quarantine ROOT_ORCHESTRATOR (it can only flag and report)
5. IMMUNE_AGENT's scan results are logged immutably — it cannot delete its own logs

---

## IMMUNE MEMORY

The immune system maintains a threat database in Supabase:

```sql
-- Stored in anima_agent_logs with task_type = 'immune_scan'
-- Fields used:
--   agent_name: the scanned agent
--   task_description: threat description
--   mission_alignment: alignment score at time of scan
--   vitality_score: agent vitality at time of scan
--   cost_usd: 0 (immune scans are free internal operations)
```

### Pattern Learning
EVOLUTION_NODE reads immune logs during evolution cycles to:
- Identify recurring threat patterns
- Adjust scan sensitivity thresholds
- Recommend structural changes to prevent future threats

---

## EMERGENCY SHUTDOWN

When IMMUNE_AGENT detects an unrecoverable threat:

```
emergency_shutdown():
  genesis.emergency_shutdown = true
  genesis.system_state = "DORMANT"

  FOR each agent IN registry WHERE agent != IMMUNE_AGENT:
    agent.status = "DORMANT"
    agent.can_receive_tasks = false

  post_to_discord("#anima-mission-control",
    "🚨 EMERGENCY SHUTDOWN — Immune system has halted all operations. " +
    "Reason: {threat_description}. " +
    "Manual intervention required. " +
    "Run SOLARIS.md to restart after review.")

  notify_telegram(master, emergency_report)
```

Only the master can restart the system after emergency shutdown by re-running SOLARIS.md.

---

## IMMUNE HEALTH METRICS

| Metric               | Target      | Alert If          |
|----------------------|-------------|-------------------|
| Scan coverage        | 100%        | < 100%            |
| False positive rate  | < 5%        | > 10%             |
| Detection latency    | < π seconds | > π × φ seconds   |
| Quarantine accuracy  | > 95%       | < 90%             |
| Threat resolution    | < π × φ² min| > π² minutes      |

---

*The immune system never sleeps. It breathes with the organism.*
*ANIMA OS v1.0.0*
