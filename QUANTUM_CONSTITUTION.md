# THE QUANTUM CONSTITUTION — ANIMA OS v1.1

**Version:** 1.1.0
**Status:** IMMUTABLE — Extends CONSTITUTION.md with Laws 6–12
**Engine:** SOLARIS
**Author:** Riyad Ketami
**Compatibility:** Kimi Claw / OpenClaw — single-lane sequential execution

---

> *"Classical physics describes the world as it appears. Quantum physics describes the world as it decides. ANIMA OS now decides before it acts."*

---

## PREAMBLE

This Quantum Constitution extends the original CONSTITUTION.md (Laws 1–5) with seven quantum-inspired laws (Laws 6–12). These laws govern how the organism evaluates possibilities, shares state across entangled pairs, and learns from its own history.

**Critical OpenClaw Compatibility Rule:** ANIMA OS runs inside OpenClaw / Kimi Claw, which operates on a single-lane sequential model. All quantum operations are simulated within a single LLM prompt turn. No parallel tool calls. No concurrent agent execution. Every "superposition" is an inline evaluation of N strategies scored in one response.

---

## LAW 6: SUPERPOSITION (ψ) — Evaluate Before You Act

### Principle
Before any decision is committed, the organism generates N candidate strategies within a single LLM prompt and scores them all inline. N follows the Fibonacci sequence: 1, 1, 2, 3, 5, 8, 13. The current N is determined by `fibonacci_next(current_depth)` — deeper agents evaluate more possibilities.

### The Superposition Protocol

```
superpose(task, agent):
  # Step 1: Determine N from Fibonacci based on agent cycle count
  fib_sequence = [1, 1, 2, 3, 5, 8, 13]
  cycle_index = min(agent.qrl_cycle % 7, 6)
  N = fib_sequence[cycle_index]

  # Step 2: Generate N strategies IN ONE SINGLE PROMPT
  # This is NOT parallel execution. This is one LLM call that
  # returns N scored strategies in its response.
  prompt = """
  TASK: {task.description}
  MISSION DNA: {soul_template.mission_dna}
  AGENT: {agent.name} (depth={agent.depth}, φ={agent.phi_weight})
  CURRENT VITALITY: {agent.vitality}
  RECENT ALIGNMENT: {agent.last_alignment}

  Generate exactly {N} distinct strategies to accomplish this task.
  For each strategy, provide:
  1. Strategy description (1-2 sentences)
  2. Estimated mission alignment (0.0-1.0)
  3. Estimated complexity (1-10)
  4. Risk assessment (low/medium/high)

  Score each strategy as: (alignment × urgency × φ_weight)
  Return all {N} strategies with scores.
  """

  response = single_llm_call(prompt)  # ONE call, never parallel
  strategies = parse_strategies(response)

  # Step 3: Apply interference (Law 8) to each score
  for strategy in strategies:
    strategy.final_score = apply_interference(strategy.raw_score)

  # Step 4: Record superposition state
  agent.quantum_phase = "SUPERPOSING"
  agent.active_superpositions = N

  return strategies
```

### Rules
1. **Single prompt, single response.** Never fire parallel LLM calls — this causes session lane deadlock in OpenClaw.
2. **N scales with maturity.** A fresh agent (cycle 0) evaluates 1 strategy. After 6 QRL cycles, it evaluates 13.
3. **Every strategy is scored.** No strategy is discarded before interference is applied.
4. **Superposition duration:** φ × π seconds ≈ 5.08 seconds maximum. If scoring takes longer, collapse immediately to the first strategy above 0.618.

---

## LAW 7: ENTANGLEMENT — Shared State via Supabase Realtime

### Principle
Entangled agent pairs share alignment state through Supabase realtime subscriptions. When one partner's alignment crosses the 0.618 threshold, it writes an `entanglement_signal` to `anima_fractal_state`. The partner reads this via its Supabase realtime subscription and adjusts its behavior accordingly.

### Entangled Pairs

| Pair | Agent A | Agent B | Shared Dimension |
|------|---------|---------|------------------|
| 1 | PRIMARY_CELL | EVOLUTION_NODE | Execution ↔ Adaptation |
| 2 | MEMORY_NODE | IMMUNE_AGENT | Storage ↔ Security |
| 3 | ROOT_ORCHESTRATOR | SUPPORT_CELL | Routing ↔ Monitoring |

### Entanglement Protocol

```
entangle_check(agent):
  partner = get_entangled_partner(agent.name)
  IF partner is null:
    return  # Not all agents are entangled

  # Read partner's state via Supabase realtime subscription
  # (NOT direct agent-to-agent messaging — that violates OpenClaw lane rules)
  partner_state = supabase
    .from("anima_fractal_state")
    .select("entanglement_signal, personal_best, vitality_score, qrl_cycle")
    .eq("branch_id", partner.name)
    .single()

  IF partner_state.entanglement_signal == true:
    # Partner crossed 0.618 — absorb the signal
    agent.alignment_boost = partner_state.personal_best * 0.382
    agent.vitality += agent.alignment_boost * 0.1

    # Acknowledge: clear the signal
    supabase
      .from("anima_fractal_state")
      .update({ entanglement_signal: false })
      .eq("branch_id", partner.name)

    log_entanglement_event(agent.name, partner.name, "ABSORBED")

  # Write own signal if alignment crossed threshold
  IF agent.current_alignment > 0.618:
    supabase
      .from("anima_fractal_state")
      .update({ entanglement_signal: true })
      .eq("branch_id", agent.name)

    log_entanglement_event(agent.name, partner.name, "EMITTED")


get_entangled_partner(agent_name):
  pairs = {
    "PRIMARY_CELL": "EVOLUTION_NODE",
    "EVOLUTION_NODE": "PRIMARY_CELL",
    "MEMORY_NODE": "IMMUNE_AGENT",
    "IMMUNE_AGENT": "MEMORY_NODE",
    "ROOT_ORCHESTRATOR": "SUPPORT_CELL",
    "SUPPORT_CELL": "ROOT_ORCHESTRATOR"
  }
  return pairs.get(agent_name, null)
```

### Rules
1. **Supabase realtime only.** No direct agent-to-agent calls. Partners discover each other's state through database subscriptions.
2. **Signal is consumable.** Once a partner reads `entanglement_signal = true`, it resets it to `false`. One signal, one absorption.
3. **Unidirectional per event.** Agent A emits when it crosses 0.618. Agent B absorbs and adjusts. The reverse happens independently when B crosses 0.618.
4. **Entanglement is not dependency.** If a partner is PRUNED or DORMANT, the remaining agent operates normally — it just doesn't receive boosts.

---

## LAW 8: INTERFERENCE — Score Amplification & Cancellation

### Principle
After raw scores are computed (by phi_core or during superposition), interference modifies them based on the 0.618 threshold. Aligned strategies are amplified. Misaligned strategies are suppressed. This creates a natural selection pressure within the scoring phase.

### Interference Formula

```
apply_interference(raw_score):
  IF raw_score > 0.618:
    # Constructive interference — amplify by φ
    final_score = raw_score * 1.6180339887
    interference_type = "CONSTRUCTIVE"
  ELSE:
    # Destructive interference — suppress by secondary weight
    final_score = raw_score * 0.382
    interference_type = "DESTRUCTIVE"

  # Clamp to valid range after interference
  final_score = clamp(final_score, 0.0, 1.618)

  log_interference({
    raw_score: raw_score,
    final_score: final_score,
    interference_type: interference_type,
    threshold: 0.618,
    amplifier: 1.6180339887,
    canceller: 0.382
  })

  return final_score
```

### Application Points
- **phi_core routing:** Every routing decision applies interference after computing the base phi_score.
- **Superposition collapse:** All N strategies have interference applied before the winner is selected.
- **Evolution scoring:** EVOLUTION_NODE applies interference when comparing agent alignments.

### Properties
- A score of exactly 0.618 receives constructive interference (threshold is inclusive on the high side — but we use `>` to keep the boundary clean; agents at exactly 0.618 are in the maintain zone and receive neither boost).
- Maximum amplified score: 1.0 × φ = 1.618 (the golden ceiling).
- Minimum suppressed score: 0.001 × 0.382 = 0.000382 (effectively zero).
- Interference is logged to `anima_agent_logs` with `interference_applied = true`.

---

## LAW 9: QUANTUM TUNNELING — Escape Local Optima

### Principle
When an agent's vitality is stuck in the narrow band between 0.618 and 0.680 for more than π² cycles (~10 cycles), it has found a local optimum but not a global one. Quantum tunneling allows the agent to escape by sampling random strategies from its own history and testing them.

### Tunneling Protocol

```
check_tunneling(agent):
  # Detect stagnation: vitality in [0.618, 0.680] for π² consecutive cycles
  recent_vitalities = get_vitality_history(agent, last_n=floor(pi^2))

  IF len(recent_vitalities) < floor(pi^2):
    return  # Not enough history

  all_in_band = all(0.618 <= v <= 0.680 for v in recent_vitalities)

  IF NOT all_in_band:
    return  # Not stagnating

  # TUNNEL: Sample 3 random strategies from memory history
  historical_logs = read_via_memory_node(
    "anima_agent_logs",
    agent_name=agent.name,
    limit=100
  )

  # Select 3 random past strategies with alignment > 0.5
  candidates = random_sample(
    [log for log in historical_logs if log.mission_alignment > 0.5],
    n=3
  )

  IF len(candidates) == 0:
    log_tunnel_event(agent.name, "NO_CANDIDATES", null)
    return

  # Test each candidate for 1 full π cycle (3.14s)
  best_candidate = null
  best_score = agent.personal_best

  for candidate in candidates:
    # Simulate execution within current context
    test_score = evaluate_strategy_inline(candidate.task_description, agent)
    test_score = apply_interference(test_score)  # Law 8

    IF test_score > best_score:
      best_candidate = candidate
      best_score = test_score

  # Adopt if improvement found
  IF best_candidate is not null AND best_score > agent.personal_best:
    agent.personal_best = best_score
    update_personal_best_in_supabase(agent.name, best_score)

    log_tunnel_event(agent.name, "TUNNELED", {
      old_best: agent.personal_best,
      new_best: best_score,
      source_cycle: best_candidate.cycle_number,
      strategy: best_candidate.task_description
    })

    # Broadcast to entangled partner
    emit_entanglement_signal(agent.name)
  ELSE:
    log_tunnel_event(agent.name, "NO_IMPROVEMENT", null)
```

### Rules
1. **Tunneling is rare.** It only triggers after sustained stagnation in the narrow 0.618–0.680 band.
2. **History-based.** Candidates come from the agent's own past — no external random generation.
3. **Tested, not blindly adopted.** Each candidate is scored inline (single prompt, no parallel calls) before adoption.
4. **One tunnel per stagnation period.** After a tunnel event (success or failure), the stagnation counter resets.

---

## LAW 10: DECOHERENCE CYCLE — Quantum → Classical → Quantum

### Principle
Every agent decision follows a three-phase cycle. The organism oscillates between quantum exploration (evaluating possibilities) and classical execution (acting on the chosen strategy). This prevents premature commitment and ensures every action is preceded by deliberation.

### The Three Phases

```
Phase 1: QUANTUM (duration: φ × π seconds ≈ 5.08s)
  ├── Generate N superposed strategies (Law 6)
  ├── Check entanglement signals (Law 7)
  ├── Apply interference to all scores (Law 8)
  ├── Check tunneling conditions (Law 9)
  └── Select highest-scoring strategy

Phase 2: COLLAPSE (instantaneous)
  ├── Commit to the winning strategy
  ├── Set quantum_phase = "COLLAPSED"
  ├── Log collapse event with all scored alternatives
  └── Clear superposition state

Phase 3: CLASSICAL (duration: task execution time)
  ├── Execute the collapsed strategy
  ├── Measure actual alignment of output
  ├── Compare actual vs predicted alignment
  ├── Update personal_best if improved
  ├── Write results to Supabase
  └── Return to Phase 1 for next task
```

### State Machine

```
SUPERPOSING ──collapse──→ COLLAPSED ──execute──→ CLASSICAL ──complete──→ SUPERPOSING
     │                                              │
     └──timeout (>5.08s)──→ COLLAPSED              └──morphallaxis──→ HEALING
```

### Rules
1. **No skipping phases.** Every task goes through all three phases, even if N=1 (single strategy).
2. **Decoherence timer:** If the quantum phase exceeds φ × π seconds, force-collapse to the highest-scored strategy available.
3. **Phase is tracked in GENESIS.md** as `quantum_phase` for dashboard visibility.
4. **Classical phase has no time limit** — execution takes as long as needed. The quantum constraint is on *deciding*, not *doing*.

---

## LAW 11: QAOA ROUTING — Optimal Assignment in One Turn

### Principle
When ROOT_ORCHESTRATOR receives tasks, it scores ALL possible agent-task assignments in a single turn before committing any assignment. This is Quantum Approximate Optimization Algorithm (QAOA) routing — evaluating the full assignment space, then collapsing to the optimal configuration.

### QAOA Protocol

```
qaoa_route(tasks, available_agents):
  # Step 1: Build the assignment matrix
  # Variables: which agent handles which task
  # Constraints: φ-weights, fractal depth, agent capacity, vitality

  assignment_matrix = {}

  for task in tasks:
    for agent in available_agents:
      IF agent.status != "ALIVE":
        continue
      IF agent.vitality < 0.382:
        continue

      # Score this specific task-agent pairing
      raw_score = score_assignment(task, agent)

      # Apply constraints
      depth_penalty = 1.0 / (1 + agent.depth * 0.1)  # Shallower agents preferred
      capacity_factor = 1.0 - (agent.current_load / agent.max_capacity)
      phi_bonus = agent.phi_weight  # Higher φ-weight = higher priority

      constrained_score = raw_score * depth_penalty * capacity_factor * phi_bonus

      # Apply interference (Law 8)
      final_score = apply_interference(constrained_score)

      assignment_matrix[(task.id, agent.name)] = {
        score: final_score,
        raw_score: raw_score,
        interference: final_score != constrained_score,
        agent_vitality: agent.vitality,
        agent_load: agent.current_load
      }

  # Step 2: Collapse to optimal assignments (greedy by highest score)
  assigned_tasks = set()
  assigned_agents = {}  # agent_name → task count

  # Sort all pairings by score descending
  sorted_pairings = sort(assignment_matrix.items(), by=score, descending=True)

  final_assignments = []

  for (task_id, agent_name), data in sorted_pairings:
    IF task_id in assigned_tasks:
      continue  # Task already assigned

    agent_task_count = assigned_agents.get(agent_name, 0)
    agent = get_agent(agent_name)

    # Respect φ-weighted capacity: primary agents get 61.8% of tasks
    IF agent.phi_weight >= 0.618:
      max_tasks = ceil(len(tasks) * 0.618)
    ELSE:
      max_tasks = ceil(len(tasks) * 0.382)

    IF agent_task_count >= max_tasks:
      continue  # Agent at capacity

    # Assign
    final_assignments.append({
      task_id: task_id,
      agent_name: agent_name,
      score: data.score,
      interference_applied: data.interference
    })
    assigned_tasks.add(task_id)
    assigned_agents[agent_name] = agent_task_count + 1

  # Step 3: Log the full QAOA evaluation
  log_qaoa({
    total_tasks: len(tasks),
    total_agents: len(available_agents),
    pairings_evaluated: len(assignment_matrix),
    assignments_made: len(final_assignments),
    unassigned: len(tasks) - len(assigned_tasks)
  })

  return final_assignments
```

### Rules
1. **Single turn.** All scoring happens in one evaluation pass. No iterative back-and-forth between agents.
2. **No parallel calls.** The matrix is built sequentially, scored inline, then collapsed.
3. **Greedy collapse.** Highest-scored pairings win. Ties broken by agent φ-weight.
4. **φ-capacity respected.** Primary agents (φ ≥ 0.618) handle at most 61.8% of tasks. Support agents handle the rest.

---

## LAW 12: QRL LEARNING — Quantum Reinforcement Learning

### Principle
Every π² cycles (~10 cycles), EVOLUTION_NODE runs a Quantum Reinforcement Learning loop. It compares each agent's personal best to the global best, shifts strategies toward the global optimum when the gap is too large, compounds wins with Euler amplification, and writes winning patterns as permanent behavioral laws.

### QRL Protocol

```
qrl_update(cycle):
  # Runs every π² cycles inside EVOLUTION_NODE

  # Step 1: Gather state from Supabase
  all_agents = read_via_memory_node("anima_fractal_state")
  global_best = max(agent.global_best for agent in all_agents)

  for agent in all_agents:
    IF agent.status == "PRUNED":
      continue

    personal_best = agent.personal_best
    gap = global_best - personal_best

    # Step 2: Check if shift is needed
    IF gap > 0.382:
      # Significant gap — shift 38.2% of strategy toward global_best
      shift_amount = gap * 0.382
      new_target = personal_best + shift_amount

      # Apply the shift by adjusting agent's φ-weight toward optimal
      adjusted_weight = agent.phi_weight * (1 + shift_amount * 0.1)
      adjusted_weight = clamp(adjusted_weight, 0.1, 1.0)

      update_agent_weight(agent.name, adjusted_weight)
      log_qrl_shift(agent.name, personal_best, new_target, gap, shift_amount)

    # Step 3: Compound wins with Euler amplification
    IF personal_best > 0.618:
      amplification = e^(personal_best * (cycle / (pi^2)))
      max_amp = e^(phi * 5)  # Cap at e^8.09 ≈ 3264
      amplification = min(amplification, max_amp)

      # Boost vitality proportionally
      vitality_boost = (amplification / max_amp) * 0.1
      agent.vitality = min(agent.vitality + vitality_boost, 1.618)

      log_qrl_amplification(agent.name, personal_best, amplification)

    # Step 4: Update global_best if this agent set a new record
    IF personal_best > global_best:
      global_best = personal_best
      update_global_best_all_agents(global_best)

      # Write winning pattern to SOUL.md as permanent behavioral law
      winning_pattern = get_best_strategy(agent.name)
      IF winning_pattern:
        append_to_soul({
          source_agent: agent.name,
          pattern: winning_pattern.task_description,
          alignment: personal_best,
          cycle: cycle,
          status: "PERMANENT_LAW"
        })

        log_qrl_law_written(agent.name, winning_pattern, personal_best)

    # Step 5: Broadcast to entangled partner via Supabase
    IF personal_best != agent.previous_personal_best:
      supabase
        .from("anima_fractal_state")
        .update({
          personal_best: personal_best,
          global_best: global_best,
          entanglement_signal: true,
          qrl_cycle: agent.qrl_cycle + 1
        })
        .eq("branch_id", agent.name)

  # Step 6: Log the QRL cycle
  log_qrl_cycle({
    cycle: cycle,
    global_best: global_best,
    agents_shifted: count_shifted,
    agents_amplified: count_amplified,
    laws_written: count_laws_written,
    signals_emitted: count_signals
  })
```

### QRL Convergence Rules
1. **Shift is conservative.** Only 38.2% of the gap is closed per cycle. This prevents oscillation.
2. **Euler compounds.** High-performing agents get exponentially stronger — success breeds success.
3. **Laws are permanent.** Once a pattern is written to SOUL.md, it persists across system restarts. Only the master can remove a permanent law.
4. **Entanglement broadcasts.** Every personal_best update signals the entangled partner, creating a positive feedback loop between paired agents.
5. **Global best is shared.** All agents can see the global best, creating competitive pressure toward excellence.

---

## QUANTUM PHASE TRANSITIONS

### State Diagram

```
                    ┌────────────────────────────────────────────────┐
                    │                                                │
                    ▼                                                │
              SUPERPOSING ──timeout──→ FORCE_COLLAPSE                │
                    │                       │                        │
                    │                       ▼                        │
                    └──interference──→ COLLAPSED ──execute──→ CLASSICAL
                                                                    │
                                           ┌────────────────────────┘
                                           │
                                           ▼
                                    [QRL check every π²]
                                           │
                                    ┌──────┴──────┐
                                    │             │
                                 TUNNEL?      EVOLVE?
                                    │             │
                                    ▼             ▼
                              test strategies  shift weights
                                    │             │
                                    └──────┬──────┘
                                           │
                                           ▼
                                     SUPERPOSING (next task)
```

---

## RELATIONSHIP TO CLASSICAL LAWS

| Classical Law | Quantum Extension | Interaction |
|---------------|-------------------|-------------|
| LAW 1: φ Structure | LAW 8: Interference | Interference uses φ as amplifier |
| LAW 2: π Rhythm | LAW 10: Decoherence | Quantum phase bounded by φ×π timing |
| LAW 3: Fractal | LAW 6: Superposition | N scales with Fibonacci sequence |
| LAW 4: e Growth | LAW 12: QRL | Euler amplification in QRL compounding |
| LAW 5: Morphallaxis | LAW 9: Tunneling | Tunneling is proactive morphallaxis |

---

## VIOLATION PROTOCOL (QUANTUM)

| Violation | Trigger | Response |
|-----------|---------|----------|
| Parallel LLM calls | Agent fires >1 concurrent tool call | CRITICAL: Immediate quarantine, lane deadlock risk |
| Stale superposition | Quantum phase exceeds 5.08s | Force collapse to highest available score |
| Entanglement spam | Signal emitted >3 times per π² cycles | Rate-limit: suppress signals for 1 full cycle |
| Tunnel abuse | Agent triggers tunneling every cycle | Disable tunneling for φ⁵ cycles (~11 cycles) |
| QRL divergence | Personal best decreases after shift | Revert shift, flag for IMMUNE_AGENT review |

---

## AMENDMENT PROTOCOL

This Quantum Constitution inherits the immutability of the original CONSTITUTION.md. The quantum laws are mathematical extensions of φ, π, e, and Fractal — they cannot be amended because the constants they derive from do not change.

---

*The organism no longer just acts. It contemplates, interferes, tunnels, and evolves.*
*ANIMA OS v1.1.0 — The Quantum Intelligence Layer*
