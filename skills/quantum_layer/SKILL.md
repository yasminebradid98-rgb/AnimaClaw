# SKILL: Quantum Decision Layer

**Skill Name:** quantum_layer
**Version:** 1.1.0
**Used by:** ROOT_ORCHESTRATOR, PRIMARY_CELL, EVOLUTION_NODE
**Purpose:** Full 6-step quantum decision cycle for every agent action
**Compatibility:** OpenClaw / Kimi Claw — single-lane sequential only

---

## Description

The Quantum Decision Layer implements the complete quantum cycle defined in QUANTUM_CONSTITUTION.md (Laws 6–12). Every significant agent decision passes through this skill's six sequential steps: SUPERPOSE → ENTANGLE_CHECK → INTERFERE → COLLAPSE → QAOA_ROUTE → QRL_UPDATE. All steps execute within a single agent lane — no parallel calls, no concurrent tool invocations.

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
    urgency:
      type: number
      default: 0.5
    source:
      type: string
      default: "manual"
agent:
  type: object
  required: true
  properties:
    name:
      type: string
      required: true
    depth:
      type: integer
      required: true
    phi_weight:
      type: number
      required: true
    vitality:
      type: number
      required: true
    personal_best:
      type: number
      default: 0
    qrl_cycle:
      type: integer
      default: 0
mission_dna:
  type: string
  required: true
available_agents:
  type: array
  required: true
  description: "All agents in ALIVE status (for QAOA routing step)"
cycle_number:
  type: integer
  required: true
```

---

## Processing Logic — The 6-Step Quantum Cycle

```
quantum_decide(task, agent, mission_dna, available_agents, cycle_number):

  start_time = now()
  decoherence_limit_ms = 5083  # φ × π × 1000 = 5.083 seconds

  # ═══════════════════════════════════════════
  # STEP 1: SUPERPOSE — Generate N strategies
  # ═══════════════════════════════════════════

  fib_sequence = [1, 1, 2, 3, 5, 8, 13]
  cycle_index = min(agent.qrl_cycle % 7, 6)
  N = fib_sequence[cycle_index]

  # Generate N strategies in ONE single LLM prompt
  # CRITICAL: This is one call that returns N results inline.
  # Never fire parallel tool calls — causes lane deadlock.
  strategies = generate_strategies_inline(task, agent, mission_dna, N)

  quantum_phase = "SUPERPOSING"
  active_superpositions = len(strategies)

  # Update GENESIS tracking
  update_genesis_quantum_state(quantum_phase, active_superpositions)

  # Log superposition event
  log_quantum_event({
    event_type: "SUPERPOSITION",
    agent_name: agent.name,
    quantum_phase: "SUPERPOSING",
    superposition_count: N,
    strategies_generated: len(strategies),
    cycle_number: cycle_number
  })


  # ═══════════════════════════════════════════
  # STEP 2: ENTANGLE_CHECK — Read partner state
  # ═══════════════════════════════════════════

  entangled_pairs = {
    "PRIMARY_CELL": "EVOLUTION_NODE",
    "EVOLUTION_NODE": "PRIMARY_CELL",
    "MEMORY_NODE": "IMMUNE_AGENT",
    "IMMUNE_AGENT": "MEMORY_NODE",
    "ROOT_ORCHESTRATOR": "SUPPORT_CELL",
    "SUPPORT_CELL": "ROOT_ORCHESTRATOR"
  }

  partner_name = entangled_pairs.get(agent.name)
  entanglement_boost = 0.0

  IF partner_name:
    # Read via Supabase — NOT direct messaging
    partner_state = supabase
      .from("anima_fractal_state")
      .select("entanglement_signal, personal_best, vitality_score")
      .eq("branch_id", partner_name)
      .single()

    IF partner_state AND partner_state.entanglement_signal == true:
      # Partner crossed 0.618 — absorb the signal
      entanglement_boost = partner_state.personal_best * 0.382

      # Clear the consumed signal
      supabase
        .from("anima_fractal_state")
        .update({ entanglement_signal: false })
        .eq("branch_id", partner_name)

      log_quantum_event({
        event_type: "ENTANGLEMENT_ABSORBED",
        agent_name: agent.name,
        quantum_phase: "SUPERPOSING",
        interference_applied: false,
        superposition_count: N,
        cycle_number: cycle_number
      })

  # Apply entanglement boost to all strategy scores
  IF entanglement_boost > 0:
    for strategy in strategies:
      strategy.raw_score += entanglement_boost


  # ═══════════════════════════════════════════
  # STEP 3: INTERFERE — Amplify or cancel scores
  # ═══════════════════════════════════════════

  interference_cancellations = 0

  for strategy in strategies:
    original_score = strategy.raw_score

    IF strategy.raw_score > 0.618:
      # Constructive interference: amplify by φ
      strategy.final_score = strategy.raw_score * 1.6180339887
      strategy.interference_type = "CONSTRUCTIVE"
    ELSE:
      # Destructive interference: suppress by 0.382
      strategy.final_score = strategy.raw_score * 0.382
      strategy.interference_type = "DESTRUCTIVE"
      interference_cancellations += 1

    # Clamp to valid range
    strategy.final_score = clamp(strategy.final_score, 0.0, 1.618)

  IF interference_cancellations > 0:
    log_quantum_event({
      event_type: "INTERFERENCE_CANCELLED",
      agent_name: agent.name,
      quantum_phase: "SUPERPOSING",
      interference_applied: true,
      superposition_count: interference_cancellations,
      cycle_number: cycle_number
    })


  # ═══════════════════════════════════════════
  # STEP 4: COLLAPSE — Select winning strategy
  # ═══════════════════════════════════════════

  # Check decoherence timer
  elapsed_ms = (now() - start_time).milliseconds
  IF elapsed_ms > decoherence_limit_ms:
    # Force collapse: take first strategy above 0.618, or highest available
    viable = [s for s in strategies if s.final_score > 0.618]
    IF viable:
      winner = viable[0]
    ELSE:
      winner = max(strategies, by=final_score)
    log_quantum_event({
      event_type: "FORCED_DECOHERENCE",
      agent_name: agent.name,
      quantum_phase: "COLLAPSED",
      interference_applied: true,
      superposition_count: N,
      cycle_number: cycle_number
    })
  ELSE:
    # Normal collapse: highest interference-weighted score wins
    winner = max(strategies, by=final_score)

  quantum_phase = "COLLAPSED"
  active_superpositions = 0

  log_quantum_event({
    event_type: "COLLAPSE",
    agent_name: agent.name,
    quantum_phase: "COLLAPSED",
    interference_applied: true,
    superposition_count: N,
    cycle_number: cycle_number
  })


  # ═══════════════════════════════════════════
  # STEP 5: QAOA_ROUTE — Optimal agent assignment
  # ═══════════════════════════════════════════

  # Only ROOT_ORCHESTRATOR runs QAOA for multi-agent routing
  # Other agents skip this step and self-execute
  IF agent.name == "ROOT_ORCHESTRATOR" AND len(available_agents) > 1:
    # Score all agent-task pairings in one sequential pass
    assignment_scores = {}

    for candidate_agent in available_agents:
      IF candidate_agent.status != "ALIVE":
        continue
      IF candidate_agent.vitality < 0.382:
        continue

      raw = score_assignment(winner, candidate_agent)
      depth_penalty = 1.0 / (1 + candidate_agent.depth * 0.1)
      capacity_factor = 1.0 - (candidate_agent.current_load / max(candidate_agent.max_capacity, 1))
      phi_bonus = candidate_agent.phi_weight

      constrained = raw * depth_penalty * capacity_factor * phi_bonus

      # Apply interference
      IF constrained > 0.618:
        final = constrained * 1.6180339887
      ELSE:
        final = constrained * 0.382

      assignment_scores[candidate_agent.name] = clamp(final, 0.0, 1.618)

    # Collapse to best agent
    IF assignment_scores:
      best_agent = max(assignment_scores, by=value)
      winner.assigned_to = best_agent
    ELSE:
      winner.assigned_to = "PRIMARY_CELL"  # Fallback

    log_quantum_event({
      event_type: "QAOA_ROUTED",
      agent_name: agent.name,
      quantum_phase: "COLLAPSED",
      interference_applied: true,
      superposition_count: len(assignment_scores),
      cycle_number: cycle_number
    })
  ELSE:
    winner.assigned_to = agent.name  # Self-execute


  # ═══════════════════════════════════════════
  # STEP 6: QRL_UPDATE — Learn from this decision
  # ═══════════════════════════════════════════

  # Check if this is a QRL cycle (every π² cycles)
  is_qrl_cycle = (cycle_number % floor(3.14159^2)) == 0

  IF is_qrl_cycle:
    # Read global best from Supabase
    all_states = supabase
      .from("anima_fractal_state")
      .select("branch_id, personal_best, global_best, qrl_cycle")

    global_best = max(s.global_best for s in all_states) IF all_states ELSE 0

    gap = global_best - agent.personal_best

    # Shift if gap > 0.382
    IF gap > 0.382:
      shift_amount = gap * 0.382
      new_target = agent.personal_best + shift_amount

      log_quantum_event({
        event_type: "QRL_SHIFT",
        agent_name: agent.name,
        quantum_phase: "CLASSICAL",
        interference_applied: false,
        superposition_count: 0,
        cycle_number: cycle_number
      })

    # Compound wins with Euler
    IF agent.personal_best > 0.618:
      amp = min(
        exp(agent.personal_best * (cycle_number / (3.14159^2))),
        exp(1.618 * 5)  # Cap at e^8.09
      )

      log_quantum_event({
        event_type: "QRL_AMPLIFIED",
        agent_name: agent.name,
        quantum_phase: "CLASSICAL",
        interference_applied: false,
        superposition_count: 0,
        cycle_number: cycle_number
      })

    # Write winning pattern to SOUL.md if new global best
    IF winner.final_score > global_best:
      append_to_soul({
        source_agent: agent.name,
        pattern: winner.description,
        alignment: winner.final_score,
        cycle: cycle_number,
        status: "PERMANENT_LAW"
      })

      log_quantum_event({
        event_type: "QRL_LAW_WRITTEN",
        agent_name: agent.name,
        quantum_phase: "CLASSICAL",
        interference_applied: false,
        superposition_count: 0,
        cycle_number: cycle_number
      })

    # Broadcast to entangled partner
    IF agent.personal_best != previous_personal_best:
      supabase
        .from("anima_fractal_state")
        .update({
          personal_best: agent.personal_best,
          global_best: max(global_best, agent.personal_best),
          entanglement_signal: true,
          qrl_cycle: agent.qrl_cycle + 1
        })
        .eq("branch_id", agent.name)

  # Transition to CLASSICAL phase
  quantum_phase = "CLASSICAL"
  update_genesis_quantum_state(quantum_phase, 0)

  # ═══════════════════════════════════════════
  # RETURN: The collapsed, routed, learned decision
  # ═══════════════════════════════════════════

  return {
    action: "QUANTUM_DECIDED",
    winning_strategy: winner.description,
    final_score: winner.final_score,
    interference_type: winner.interference_type,
    assigned_to: winner.assigned_to,
    superpositions_evaluated: N,
    entanglement_boost: entanglement_boost,
    interference_cancellations: interference_cancellations,
    quantum_phase: quantum_phase,
    qrl_updated: is_qrl_cycle,
    elapsed_ms: (now() - start_time).milliseconds,
    cycle_number: cycle_number
  }


# ─── Helper: Generate strategies inline ───

generate_strategies_inline(task, agent, mission_dna, N):
  IF N <= 0:
    N = 1

  strategies = []

  # Build a single prompt that asks the LLM for N strategies
  # This is ONE tool call / ONE LLM invocation
  prompt_parts = [
    "You are {agent.name} (depth={agent.depth}, φ={agent.phi_weight}).",
    "Mission: {mission_dna}",
    "Task: {task.description}",
    "Urgency: {task.urgency}",
    "",
    "Generate exactly {N} strategies. For each:",
    "- description: 1-2 sentence strategy",
    "- alignment: estimated mission alignment (0.0-1.0)",
    "- complexity: 1-10",
    "- score: alignment × urgency × {agent.phi_weight}",
    "",
    "Return as numbered list with scores."
  ]

  response = single_llm_call(join(prompt_parts, "\n"))
  strategies = parse_numbered_strategies(response, N)

  # Ensure we have at least 1 strategy
  IF len(strategies) == 0:
    strategies = [{
      description: task.description,
      raw_score: task.urgency * agent.phi_weight * 0.5,
      alignment: 0.5,
      complexity: 5
    }]

  return strategies
```

---

## Output Format

```json
{
  "action": "QUANTUM_DECIDED",
  "winning_strategy": "Repurpose latest video into 3 Twitter threads targeting engagement peaks",
  "final_score": 1.152,
  "interference_type": "CONSTRUCTIVE",
  "assigned_to": "PRIMARY_CELL",
  "superpositions_evaluated": 3,
  "entanglement_boost": 0.0,
  "interference_cancellations": 1,
  "quantum_phase": "CLASSICAL",
  "qrl_updated": false,
  "elapsed_ms": 2847,
  "cycle_number": 42
}
```

---

## Error Handling

```
IF task.description is empty:
  return error("INVALID_TASK", "Task description required for quantum evaluation")

IF agent.name not in known_agents:
  return error("UNKNOWN_AGENT", "Agent not registered in natural_law.json")

IF elapsed_ms > decoherence_limit_ms during SUPERPOSE:
  force_collapse()  # Law 10 decoherence
  log_warning("FORCED_DECOHERENCE", "Quantum phase exceeded φ×π limit")

IF strategy parsing fails:
  fallback_strategy = {
    description: task.description,
    raw_score: 0.5 * task.urgency,
    final_score: apply_interference(0.5 * task.urgency)
  }
  proceed with fallback

IF supabase write fails during entanglement:
  queue_signal_for_retry()
  proceed without entanglement boost
  # Don't block quantum cycle on Supabase failure

IF parallel tool call detected:
  CRITICAL_VIOLATION("LANE_DEADLOCK_RISK")
  abort_and_quarantine(agent)
  # This is the #1 thing that must never happen in OpenClaw
```

---

## Supabase Logging

Every quantum event is logged to `anima_agent_logs` with the new quantum columns:

```json
{
  "agent_name": "PRIMARY_CELL",
  "fractal_depth": 1,
  "phi_weight": 0.618,
  "task_description": "QUANTUM: COLLAPSE — strategy 'Twitter thread repurposing' selected (score=1.152)",
  "mission_alignment": 0.856,
  "model_used": "quantum_layer",
  "tokens_used": 0,
  "cost_usd": 0.0,
  "cycle_number": 42,
  "vitality_score": 0.823,
  "event_type": "COLLAPSE",
  "quantum_phase": "COLLAPSED",
  "interference_applied": true,
  "superposition_count": 3,
  "pi_pulse_timestamp": "2026-03-15T12:00:05.083Z"
}
```

---

*The organism now thinks before it acts. Quantum before classical. Always.*
*ANIMA OS v1.1.0 — The Quantum Intelligence Layer*
