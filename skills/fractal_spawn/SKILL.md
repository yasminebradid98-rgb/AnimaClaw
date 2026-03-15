# SKILL: Fractal Agent Spawning

**Skill Name:** fractal_spawn
**Version:** 1.0.0
**Used by:** PRIMARY_CELL, SUPPORT_CELL
**Purpose:** Spawn child agents following Fibonacci sequence and fractal rules

---

## Description

The Fractal Spawn skill accepts a parent agent and load level, calculates the next Fibonacci-based spawn count, creates child agent entries in `anima_fractal_state`, and returns the spawned agent configurations. All spawned agents inherit their parent's CONSTITUTION copy and a subset of their tools.

---

## Input Parameters

```yaml
parent:
  type: object
  required: true
  properties:
    name:
      type: string
      required: true
      description: "Name of the parent agent requesting the spawn"
    depth:
      type: integer
      required: true
      description: "Current fractal depth of the parent (0-4)"
    phi_weight:
      type: number
      required: true
      description: "Parent's current φ-weight"
    tools:
      type: array
      required: true
      description: "Parent's available tools"
    constitution_hash:
      type: string
      required: true
      description: "SHA-256 hash of parent's CONSTITUTION copy"
load_level:
  type: number
  required: true
  min: 0.0
  max: 10.0
  description: "Current load as ratio to capacity (> φ triggers spawn)"
task_domain:
  type: string
  required: false
  description: "Specialization domain for the spawned agent"
```

---

## Processing Logic

```
fractal_spawn(parent, load_level, task_domain):

  # Step 1: Validate spawn conditions
  IF parent.depth >= 5:
    return error("MAX_DEPTH", "Cannot spawn beyond depth 5")

  IF load_level <= 1.6180339887:  # φ
    return {action: "NO_SPAWN", reason: "load_below_phi_threshold"}

  # Step 2: Check Fibonacci limit
  child_depth = parent.depth + 1
  fibonacci_sequence = [1, 1, 2, 3, 5, 8]
  max_children = fibonacci_sequence[child_depth]
  current_children = count_active_children(parent.name)

  IF current_children >= max_children:
    return error("FIBONACCI_LIMIT",
      "Parent at depth {parent.depth} already has {current_children}/{max_children} children")

  # Step 3: Calculate spawn count
  available_slots = max_children - current_children
  load_demand = ceil((load_level - 1.6180339887) / 1.6180339887)
  spawn_count = min(load_demand, available_slots)
  spawn_count = max(spawn_count, 1)  # Always spawn at least 1

  # Step 4: Calculate child properties
  spawned_agents = []

  for i in range(spawn_count):
    # φ-weight: first child gets primary weight, rest get secondary
    IF i == 0:
      child_weight = parent.phi_weight * 0.618
    ELSE:
      child_weight = parent.phi_weight * 0.382

    # Tool subset: children get 61.8% of parent's tools (rounded up)
    tool_count = ceil(len(parent.tools) * 0.618)
    child_tools = parent.tools[:tool_count]

    # Cycle timing: inherited from parent, adjusted by harmonic bridge
    harmonic_bridge = 3.1415926535 / (1.6180339887 * 1.6180339887)  # ≈ 1.2002
    child_cycle = 3.1415926535 * (child_weight * harmonic_bridge)

    # Generate agent config
    branch_id = generate_uuid()
    agent_config = {
      branch_id: branch_id,
      name: "{parent.name}_WORKER_{i+1}_{child_depth}",
      parent_name: parent.name,
      parent_branch: parent.branch_id IF hasattr(parent, "branch_id") ELSE parent.name,
      depth: child_depth,
      phi_weight: round(child_weight, 6),
      tools: child_tools,
      cycle_seconds: round(child_cycle, 4),
      constitution_hash: parent.constitution_hash,
      mission_dna: "inherited",
      domain: task_domain OR "general",
      status: "SPAWNING",
      vitality: 0.618,  # Start at maintenance threshold
      personal_best: 0,
      global_best: 0,
      spawn_count: 0,
      created_at: now()
    }

    spawned_agents.append(agent_config)

  # Step 5: Register in Supabase via MEMORY_NODE
  for agent in spawned_agents:
    write_to_fractal_state({
      branch_id: agent.branch_id,
      parent_branch: agent.parent_branch,
      depth_level: agent.depth,
      vitality_score: agent.vitality,
      status: "SPAWNING",
      personal_best: 0,
      global_best: 0,
      spawn_count: 0,
      last_heartbeat: now()
    })

  # Step 6: Register via GATEWAY
  for agent in spawned_agents:
    register_via_gateway({
      component_name: agent.name,
      component_type: "agent",
      version: "1.0.0",
      parent: agent.parent_name,
      fractal_depth: agent.depth,
      required_tools: agent.tools,
      cycle_timing: "{agent.cycle_seconds}s",
      description: "Worker agent for {agent.domain} at depth {agent.depth}"
    })

  # Step 7: Transition spawned agents to ALIVE
  for agent in spawned_agents:
    update_status(agent.branch_id, "ALIVE")

  return {
    action: "SPAWNED",
    count: len(spawned_agents),
    agents: spawned_agents,
    parent_children_total: current_children + spawn_count,
    fibonacci_limit: max_children,
    slots_remaining: max_children - current_children - spawn_count
  }
```

---

## Output Format

```json
{
  "action": "SPAWNED",
  "count": 2,
  "agents": [
    {
      "branch_id": "uuid-1",
      "name": "PRIMARY_CELL_WORKER_1_2",
      "parent_name": "PRIMARY_CELL",
      "depth": 2,
      "phi_weight": 0.381966,
      "tools": ["phi_core", "supabase_memory"],
      "cycle_seconds": 2.3291,
      "status": "ALIVE",
      "vitality": 0.618,
      "domain": "content_creation"
    },
    {
      "branch_id": "uuid-2",
      "name": "PRIMARY_CELL_WORKER_2_2",
      "parent_name": "PRIMARY_CELL",
      "depth": 2,
      "phi_weight": 0.236068,
      "tools": ["phi_core", "supabase_memory"],
      "cycle_seconds": 1.4392,
      "status": "ALIVE",
      "vitality": 0.618,
      "domain": "content_creation"
    }
  ],
  "parent_children_total": 2,
  "fibonacci_limit": 2,
  "slots_remaining": 0
}
```

---

## Error Handling

```
IF parent.depth >= 5:
  return {action: "ERROR", code: "MAX_DEPTH",
    message: "Depth 5 agents are leaf nodes and cannot spawn"}

IF fibonacci_limit_reached:
  return {action: "ERROR", code: "FIBONACCI_LIMIT",
    message: "All {max_children} slots at depth {child_depth} are filled"}

IF parent.constitution_hash != CANONICAL_HASH:
  alert(IMMUNE_AGENT, "spawn_with_invalid_constitution", parent.name)
  return {action: "ERROR", code: "CONSTITUTION_INVALID",
    message: "Parent constitution hash mismatch — spawn blocked"}

IF supabase_write_fails:
  # Rollback: don't leave orphaned state entries
  for agent in spawned_agents:
    delete_fractal_state(agent.branch_id)
  return {action: "ERROR", code: "STORAGE_FAILURE",
    message: "Failed to persist spawned agents — rolled back"}

IF gateway_registration_fails:
  # Agent exists in Supabase but not registered — mark as HEALING
  for agent in failed_registrations:
    update_status(agent.branch_id, "HEALING")
  retry_gateway_registration(failed_registrations)
```

---

## Supabase Logging

After every spawn event:

```json
{
  "agent_name": "fractal_spawn",
  "fractal_depth": 0,
  "phi_weight": 1.0,
  "task_description": "SPAWNED: {count} agents from {parent.name} at depth {child_depth}",
  "mission_alignment": 1.0,
  "model_used": "fractal_engine",
  "tokens_used": 0,
  "cost_usd": 0.0,
  "cycle_number": 0,
  "vitality_score": 0.0,
  "pi_pulse_timestamp": "ISO-8601"
}
```

---

*Life begets life. The Fibonacci spiral grows.*
*ANIMA OS v1.0.0*
