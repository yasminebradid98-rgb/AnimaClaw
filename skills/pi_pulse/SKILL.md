# SKILL: π-Pulse Heartbeat Manager

**Skill Name:** pi_pulse
**Version:** 1.0.0
**Used by:** ROOT_ORCHESTRATOR
**Purpose:** Execute the organism's heartbeat every π seconds

---

## Description

The π-Pulse Heartbeat Manager runs on a π-second interval (3.1415926535 seconds). It checks all agent vitality scores, updates GENESIS.md, pushes heartbeat data to the #genesis-heartbeat Discord channel, and triggers EVOLUTION_NODE if any agent's vitality drops below the 0.618 threshold.

This is the organism's breath. Without it, the organism is dead.

---

## Input Parameters

```yaml
genesis_state:
  type: object
  required: true
  description: "Current GENESIS.md parsed state"
  properties:
    system_state:
      type: string
      enum: ["ALIVE", "HEALING", "EVOLVING", "DORMANT"]
    cycle_counter:
      type: integer
    emergency_shutdown:
      type: boolean
agent_registry:
  type: array
  required: true
  description: "All registered agents with current vitality scores"
  items:
    type: object
    properties:
      name:
        type: string
      depth:
        type: integer
      phi_weight:
        type: number
      vitality:
        type: number
      status:
        type: string
```

---

## Processing Logic

```
pulse(genesis_state, agent_registry):

  # Guard: Emergency shutdown
  IF genesis_state.emergency_shutdown:
    return {action: "HALT", reason: "emergency_shutdown_active"}

  # Step 1: Increment cycle
  new_cycle = genesis_state.cycle_counter + 1

  # Step 2: Calculate individual vitalities
  vitality_report = []
  for agent in agent_registry:
    IF agent.status == "PRUNED":
      continue

    vitality = calculate_vitality(
      depth = agent.depth,
      alignment = get_latest_alignment(agent.name),
      cycle_age = new_cycle - get_last_evolution_cycle(agent.name),
      fractal_score = get_fractal_score(agent.name)
    )

    vitality_report.append({
      name: agent.name,
      depth: agent.depth,
      phi_weight: agent.phi_weight,
      vitality: round(vitality, 4),
      status: determine_status(vitality, agent.status)
    })

  # Step 3: Calculate system vitality
  total_weighted = sum(v.vitality * v.phi_weight for v in vitality_report)
  total_weights = sum(v.phi_weight for v in vitality_report)
  system_vitality = total_weighted / total_weights IF total_weights > 0 ELSE 0

  # Step 4: Determine system state
  min_vitality = min(v.vitality for v in vitality_report) IF vitality_report ELSE 0

  IF genesis_state.system_state == "DORMANT":
    new_state = "DORMANT"  # Only master can wake from dormant
  ELIF any(v.status == "EVOLVING" for v in vitality_report):
    new_state = "EVOLVING"
  ELIF min_vitality < 0.618:
    new_state = "HEALING"
  ELSE:
    new_state = "ALIVE"

  # Step 5: Check evolution trigger
  evolution_due = false
  IF new_cycle % floor(3.14159^2) == 0:  # Every ~10 cycles
    evolution_due = true

  # Step 6: Check morphallaxis trigger
  morphallaxis_needed = false
  IF system_vitality < 0.618:
    morphallaxis_needed = true

  # Step 7: Build updated genesis state
  updated_genesis = {
    system_state: new_state,
    cycle_counter: new_cycle,
    last_vitality_score: round(system_vitality, 4),
    mission_alignment_score: calculate_system_alignment(vitality_report),
    active_agent_count: count(v for v in vitality_report if v.status != "PRUNED"),
    pending_tasks_count: get_pending_task_count(),
    last_pulse_timestamp: now(),
    uptime_seconds: genesis_state.uptime_seconds + 3.1415926535,
    emergency_shutdown: false
  }

  IF evolution_due:
    updated_genesis.next_evolution_due_at_cycle = new_cycle + floor(3.14159^2)

  # Step 8: Build heartbeat message for Discord
  heartbeat = format_heartbeat(updated_genesis, vitality_report)

  return {
    action: "PULSE_COMPLETE",
    genesis: updated_genesis,
    vitality_report: vitality_report,
    heartbeat_message: heartbeat,
    evolution_due: evolution_due,
    morphallaxis_needed: morphallaxis_needed,
    system_vitality: system_vitality
  }


determine_status(vitality, current_status):
  IF current_status == "QUARANTINED":
    return "QUARANTINED"
  IF vitality >= 0.618:
    return "ALIVE"
  IF vitality >= 0.382:
    return "HEALING"
  return "HEALING"


format_heartbeat(genesis, vitality_report):
  bar_length = 20

  lines = []
  lines.append("━━━ ANIMA PULSE ━━━")
  lines.append("State: {genesis.system_state}")
  lines.append("Cycle: #{genesis.cycle_counter}")
  lines.append("Vitality: {format_bar(genesis.last_vitality_score, bar_length)}")
  lines.append("Alignment: {format_percent(genesis.mission_alignment_score)}")
  lines.append("Agents: {genesis.active_agent_count} active")
  lines.append("")

  for v in vitality_report:
    status_icon = "●" IF v.status == "ALIVE" ELSE "◐" IF v.status == "HEALING" ELSE "○"
    bar = format_bar(v.vitality, 10)
    lines.append("{status_icon} {v.name}: {bar} {v.vitality:.3f}")

  lines.append("")
  lines.append("⏱ {genesis.last_pulse_timestamp}")

  return "\n".join(lines)


format_bar(value, length):
  filled = round(value * length)
  empty = length - filled
  return "█" * filled + "░" * empty
```

---

## Output Format

```json
{
  "action": "PULSE_COMPLETE",
  "genesis": {
    "system_state": "ALIVE",
    "cycle_counter": 42,
    "last_vitality_score": 0.8234,
    "mission_alignment_score": 0.7891,
    "active_agent_count": 6,
    "pending_tasks_count": 3,
    "last_pulse_timestamp": "2026-03-15T12:00:03.141Z",
    "uptime_seconds": 131.95,
    "emergency_shutdown": false
  },
  "vitality_report": [
    {"name": "ROOT_ORCHESTRATOR", "depth": 0, "phi_weight": 1.0, "vitality": 0.9123, "status": "ALIVE"},
    {"name": "PRIMARY_CELL", "depth": 1, "phi_weight": 0.618, "vitality": 0.8456, "status": "ALIVE"}
  ],
  "heartbeat_message": "━━━ ANIMA PULSE ━━━\nState: ALIVE\n...",
  "evolution_due": false,
  "morphallaxis_needed": false,
  "system_vitality": 0.8234
}
```

---

## Error Handling

```
IF genesis_state is null or corrupted:
  # Regenerate from last known good state
  genesis_state = fetch_last_good_state_from_supabase()
  IF still null:
    genesis_state = create_default_genesis()
    log_warning("genesis_regenerated_from_default")

IF agent_registry is empty:
  return {action: "ERROR", reason: "no_agents_registered"}

IF discord_post_fails:
  queue_heartbeat_for_retry()
  continue_pulse()  # Don't block pulse on Discord failure

IF vitality_calculation_throws:
  set_agent_vitality(agent, 0.5)  # Safe default
  flag_for_review(agent)
```

---

## Supabase Logging

Heartbeat state is written to `anima_fractal_state` via MEMORY_NODE every pulse:

```json
{
  "branch_id": "root",
  "parent_branch": null,
  "depth_level": 0,
  "vitality_score": 0.8234,
  "status": "ALIVE",
  "personal_best": 0.9123,
  "global_best": 0.9456,
  "spawn_count": 6,
  "last_heartbeat": "2026-03-15T12:00:03.141Z"
}
```

---

*Every π seconds, the organism breathes. This is its breath.*
*ANIMA OS v1.0.0*
