# SKILL: φ-Core Routing Engine

**Skill Name:** phi_core
**Version:** 1.0.0
**Used by:** ROOT_ORCHESTRATOR, PRIMARY_CELL
**Purpose:** Score task complexity and return φ-weighted routing decisions

---

## Description

The φ-Core Routing Engine accepts any incoming task, scores its complexity on a 1-10 scale, calculates mission alignment, and returns a routing decision with the appropriate φ-weight assigned. This is the nervous system's decision-making core — every task passes through this skill before execution.

---

## Input Parameters

```yaml
task:
  type: object
  required: true
  properties:
    description:
      type: string
      required: true
      description: "Full text description of the task to be routed"
    source:
      type: string
      required: false
      default: "manual"
      description: "Where the task originated (manual, automation, webhook, schedule)"
    urgency:
      type: number
      required: false
      default: 0.5
      min: 0.0
      max: 1.0
      description: "How time-sensitive the task is (0=low, 1=critical)"
    context:
      type: object
      required: false
      description: "Additional context data relevant to the task"
mission_dna:
  type: string
  required: true
  description: "The mission DNA string from SOUL_TEMPLATE.md"
available_agents:
  type: array
  required: true
  description: "List of agents currently in ALIVE status with their φ-weights and vitality scores"
```

---

## Processing Logic

```
phi_route(task, mission_dna, available_agents):

  # Step 1: Score complexity (1-10)
  complexity_factors = {
    token_estimate: estimate_tokens(task.description),
    tool_count: count_required_tools(task.description),
    dependency_depth: assess_dependencies(task.description),
    domain_specificity: assess_domain(task.description),
    creativity_required: assess_creativity(task.description)
  }

  complexity = weighted_sum({
    token_estimate: normalize(complexity_factors.token_estimate, 0, 10000) * 2,
    tool_count: min(complexity_factors.tool_count, 5) * 0.5,
    dependency_depth: min(complexity_factors.dependency_depth, 5) * 0.5,
    domain_specificity: complexity_factors.domain_specificity * 1.0,
    creativity_required: complexity_factors.creativity_required * 1.0
  })

  complexity = clamp(round(complexity), 1, 10)

  # Step 2: Calculate mission alignment
  alignment = semantic_similarity(task.description, mission_dna)
  alignment = clamp(alignment, 0.0, 1.0)

  # Step 3: Calculate φ-score
  phi_score = (complexity / 10) * task.urgency * alignment

  # Step 4: Determine routing
  IF phi_score >= 0.618:
    target = "PRIMARY_CELL"
    weight = 0.618
    priority = "HIGH"
  ELIF phi_score >= 0.382:
    target = "PRIMARY_CELL"
    weight = 0.382
    priority = "MEDIUM"
  ELSE:
    target = "SUPPORT_CELL"
    weight = 0.382
    priority = "LOW"

  # Step 5: Check target availability
  target_agent = find_agent(available_agents, target)
  IF target_agent.vitality < 0.382:
    # Target is unhealthy, route to alternative
    target = find_healthiest_alternative(available_agents, target)
    weight = recalculate_weight(target)

  # Step 6: Build routing decision
  decision = {
    task_id: generate_uuid(),
    target_agent: target,
    phi_weight: weight,
    priority: priority,
    complexity_score: complexity,
    mission_alignment: alignment,
    phi_score: phi_score,
    urgency: task.urgency,
    estimated_tokens: complexity_factors.token_estimate,
    routed_at: now()
  }

  return decision
```

---

## Output Format

```json
{
  "task_id": "uuid-v4",
  "target_agent": "PRIMARY_CELL",
  "phi_weight": 0.618,
  "priority": "HIGH",
  "complexity_score": 7,
  "mission_alignment": 0.856,
  "phi_score": 0.714,
  "urgency": 0.8,
  "estimated_tokens": 2400,
  "routed_at": "2026-03-15T12:00:00.000Z"
}
```

---

## Error Handling

```
IF task.description is empty:
  return error("INVALID_INPUT", "Task description cannot be empty")

IF mission_dna is empty:
  return error("NO_MISSION", "SOUL_TEMPLATE.md not loaded — run onboarding first")

IF available_agents is empty:
  return error("NO_AGENTS", "No agents in ALIVE status — check GENESIS.md")

IF all agents have vitality < 0.382:
  return error("SYSTEM_CRITICAL", "All agents below critical vitality — triggering morphallaxis")
  trigger_morphallaxis()

IF supabase_write_fails:
  queue_log_for_retry()
  proceed_with_routing()  # Don't block routing on logging failure
```

---

## Supabase Logging

After every routing decision, log via MEMORY_NODE:

```json
{
  "agent_name": "phi_core",
  "fractal_depth": 0,
  "phi_weight": 1.0,
  "task_description": "ROUTED: {task_summary} → {target_agent} (φ={phi_weight})",
  "mission_alignment": 0.856,
  "model_used": "phi_routing_engine",
  "tokens_used": 0,
  "cost_usd": 0.0,
  "cycle_number": 0,
  "vitality_score": 0.0,
  "pi_pulse_timestamp": "2026-03-15T12:00:00.000Z"
}
```

---

*Every task finds its place. φ decides where.*
*ANIMA OS v1.0.0*
