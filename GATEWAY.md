# GATEWAY — ANIMA OS Auto-Onboarding Protocol

**Version:** 1.0.0
**Bound to:** CONSTITUTION.md
**Purpose:** Automatically register, validate, and integrate new components into the organism

---

## PURPOSE

GATEWAY is the organism's cell membrane. Every new component — agent, skill, integration, or tool — must pass through GATEWAY before it becomes part of ANIMA OS. GATEWAY validates the component against the CONSTITUTION, assigns φ-weights, registers it in `natural_law.json`, and activates its connections.

No component may bypass GATEWAY. Unregistered components are invisible to the organism.

---

## REGISTRATION PROTOCOL

### Step 1: Component Declaration

New component provides a manifest:

```json
{
  "component_name": "string — unique identifier",
  "component_type": "agent | skill | integration | tool",
  "version": "semver string",
  "parent": "string — parent component name (null for root-level)",
  "fractal_depth": "integer 0-5",
  "required_tools": ["array of tool names this component needs"],
  "required_tables": ["array of Supabase tables this component reads/writes"],
  "discord_channel": "string — channel name or null",
  "cycle_timing": "string — which π interval this runs on",
  "description": "string — what this component does",
  "author": "string"
}
```

### Step 2: Constitution Validation

GATEWAY validates the manifest against all 5 laws:

```
VALIDATE manifest:

  # Law 1: Structure (φ)
  ├── Does parent exist in registry? ──────────── Required
  ├── Is fractal_depth ≤ 5? ──────────────────── Required
  ├── Does parent have capacity for children? ──── Required (Fibonacci limit)
  ├── Can φ-weight be calculated? ────────────── Required
  │
  # Law 2: Rhythm (π)
  ├── Is cycle_timing a valid π-derived interval? ── Required
  │
  # Law 3: Self-Similarity (Fractal)
  ├── Does component inherit CONSTITUTION? ──────── Required
  ├── Are required_tools ⊆ parent.tools? ────────── Required
  │
  # Law 4: Growth (e)
  ├── Would registration increase system vitality? ── Recommended
  │
  # Law 5: Morphallaxis
  └── Does component have recovery protocol? ──────── Required
```

**Validation result:** `APPROVED`, `REJECTED`, or `CONDITIONAL` (approved with warnings).

### Step 3: φ-Weight Assignment

```
IF component_type == "agent":
  IF component is primary child:
    phi_weight = parent.phi_weight × 0.618
  ELSE:
    phi_weight = parent.phi_weight × 0.382

IF component_type == "skill":
  phi_weight = parent_agent.phi_weight × skill_priority_rank

IF component_type == "integration":
  phi_weight = 0.382  # integrations are support-class

IF component_type == "tool":
  phi_weight = parent_agent.phi_weight × 0.382
```

### Step 4: Registration

On approval, GATEWAY writes the component to `natural_law.json`:

```json
{
  "registered_components": [
    {
      "name": "component_name",
      "type": "component_type",
      "version": "1.0.0",
      "parent": "parent_name",
      "depth": 2,
      "phi_weight": 0.236,
      "cycle": "every_pulse",
      "status": "ALIVE",
      "registered_at": "ISO-8601",
      "registered_by": "GATEWAY",
      "constitution_hash": "sha256_of_constitution"
    }
  ]
}
```

### Step 5: Activation

After registration:

1. **Supabase:** Create necessary table entries in `anima_fractal_state`
2. **Discord:** Create channel if `discord_channel` is specified
3. **Agent registry:** Add to ROOT_ORCHESTRATOR's agent list
4. **Heartbeat:** Component begins receiving π-pulses
5. **Immune:** IMMUNE_AGENT adds component to scan list

---

## DEREGISTRATION PROTOCOL

Components are removed when:
- Pruned by morphallaxis (vitality < 0.382 for 3 cycles)
- Manually removed by master
- Superseded by evolved version

### Deregistration Steps

1. Set component status to `PRUNED` in `natural_law.json`
2. Archive component state in Supabase
3. Redistribute pending tasks to siblings via φ-weighted round-robin
4. Remove from ROOT_ORCHESTRATOR's active agent list
5. Stop sending π-pulses to component
6. Log deregistration to `anima_evolution_log`

---

## UPGRADE PROTOCOL

When a component needs to be upgraded (new version):

1. GATEWAY registers the new version alongside the old
2. New version runs in shadow mode for π² cycles (receives tasks but outputs are not propagated)
3. IMMUNE_AGENT compares old vs new outputs for alignment
4. If new version alignment ≥ old version: swap active status
5. If new version alignment < old version: reject upgrade, log reason
6. Old version is deregistered after successful swap

---

## INTEGRATION ONBOARDING

For external integrations (n8n, Helicone, Langfuse, etc.):

### Required Integration Manifest

```json
{
  "integration_name": "string",
  "integration_type": "webhook | api | proxy | fallback",
  "endpoint": "URL or connection string",
  "authentication": "string — auth method (api_key, oauth, none)",
  "env_variables": ["array of required .env variable names"],
  "health_check": "string — endpoint or command to verify connection",
  "fallback_behavior": "string — what to do if integration is down",
  "data_flow": "inbound | outbound | bidirectional"
}
```

### Validation

```
VALIDATE integration:
  ├── Are all env_variables set? ──────────── Required
  ├── Does health_check pass? ─────────────── Required
  ├── Is endpoint reachable? ──────────────── Required
  ├── Is authentication valid? ────────────── Required
  └── Is fallback_behavior defined? ────────── Required
```

### Connection Test

GATEWAY runs the health check 3 times with π-second intervals:
- 3/3 pass → `CONNECTED`
- 2/3 pass → `UNSTABLE` (register with warning)
- 1/3 or 0/3 pass → `FAILED` (do not register)

---

## SELF-REGISTRATION

When ANIMA OS boots for the first time (via SOLARIS.md), GATEWAY auto-registers all core components:

```
Boot registration order:
1. ROOT_ORCHESTRATOR (depth 0)
2. PRIMARY_CELL (depth 1)
3. SUPPORT_CELL (depth 1)
4. MEMORY_NODE (depth 2)
5. EVOLUTION_NODE (depth 2)
6. IMMUNE_AGENT (depth 2)
7. All 6 skills
8. All configured integrations
```

Each registration follows the full protocol — no shortcuts, even for core components.

---

## GATEWAY HEALTH

GATEWAY itself is monitored by IMMUNE_AGENT:

| Metric                  | Target    | Alert If      |
|------------------------|-----------|---------------|
| Registration success rate | > 95%   | < 90%         |
| Validation accuracy      | 100%    | < 100%        |
| Registration latency     | < π sec | > π × φ sec   |
| Active components        | > 6     | < 6 (core)    |

---

*Every cell that enters the organism passes through the membrane.*
*GATEWAY is the membrane.*
*ANIMA OS v1.0.0*
