# Langfuse Integration — Quantum Decision Tracing

**Engine:** SOLARIS v1.5.0
**Effort:** 10 minutes
**Traces:** Complete quantum decision cycles end-to-end

---

## What Langfuse Does

Langfuse traces the full lifecycle of quantum decision cycles in ANIMA OS:

```
Superposition (evaluate N strategies)
  → Interference (amplify/suppress scores)
    → Collapse (select winner)
      → Classical (execute)
        → IMMUNE scan (validate output)
```

Each step becomes a span in the trace, linked together for full observability.

---

## Setup

### Step 1: Get Langfuse Credentials

1. Sign up at [langfuse.com](https://langfuse.com) or self-host
2. Create a project named "ANIMA OS"
3. Get your `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY`

### Step 2: Add to .env

```
LANGFUSE_PUBLIC_KEY=pk-lf-xxxxx
LANGFUSE_SECRET_KEY=sk-lf-xxxxx
LANGFUSE_HOST=https://cloud.langfuse.com
```

### Step 3: Install SDK

```bash
npm install langfuse
```

### Step 4: Initialize in quantum_layer SKILL.md

Add tracing to the quantum decision cycle in `runtime/quantum_engine.js`:

```javascript
const { Langfuse } = require('langfuse');

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_HOST,
});

// Wrap quantumDecisionCycle with tracing
async function tracedQuantumDecision(task, agents, supabase) {
  const trace = langfuse.trace({
    name: 'quantum_decision_cycle',
    metadata: {
      engine: 'SOLARIS',
      task_type: task.type,
      agent_count: agents.length,
    },
  });

  // Span 1: Superposition
  const superSpan = trace.span({ name: 'superposition' });
  const strategies = evaluateStrategies(task, agents);
  superSpan.end({ output: { strategy_count: strategies.length } });

  // Span 2: Interference
  const interSpan = trace.span({ name: 'interference' });
  const scored = applyInterference(strategies);
  interSpan.end({ output: { amplified: scored.filter(s => s.score > 0.618).length } });

  // Span 3: Collapse
  const collapseSpan = trace.span({ name: 'collapse' });
  const winner = collapseStrategies(scored);
  collapseSpan.end({ output: { winner: winner.agent, score: winner.score } });

  // Span 4: Classical execution
  const execSpan = trace.span({ name: 'classical_execution' });
  const result = await executeTask(winner, task);
  execSpan.end({ output: { success: result.success } });

  // Span 5: Immune scan
  const immuneSpan = trace.span({ name: 'immune_scan' });
  const scanResult = scanOutput(result);
  immuneSpan.end({ output: { passed: scanResult.passed, threats: scanResult.threats } });

  trace.update({ output: { result: result.success ? 'success' : 'failed' } });

  await langfuse.flushAsync();
  return result;
}
```

---

## Traced Events

| Event | Langfuse Entity | Metadata |
|-------|----------------|----------|
| Quantum cycle start | Trace | task type, agent count |
| Superposition | Span | strategy count, scores |
| Interference | Span | amplified count, suppressed count |
| Collapse | Span | winner agent, final score |
| Classical execution | Span | success/failure, tokens used |
| Immune scan | Span | passed, threat list |
| Entanglement signal | Event | partner agent, signal value |
| Tunneling | Event | stagnation cycles, escape score |
| QRL update | Event | personal_best, global_best, shift |

---

## Linking to IMMUNE_AGENT

Every immune scan result is attached to the quantum trace:

```javascript
trace.event({
  name: 'immune_scan_result',
  metadata: {
    injection_detected: scanResult.injection,
    alignment_ok: scanResult.alignment > 0.618,
    token_budget_ok: scanResult.withinBudget,
    cost_ok: scanResult.withinCostLimit,
    action: scanResult.action, // 'pass' | 'quarantine' | 'shutdown'
  },
});
```

This creates a direct link between quantum decisions and security validation in the Langfuse dashboard.

---

## Dashboard Views

In Langfuse, you can see:
- **Traces**: Full quantum cycles with timing per span
- **Scores**: Alignment and vitality trends over cycles
- **Costs**: Token usage per quantum decision
- **Latency**: Time spent in superposition vs execution
- **Errors**: Failed collapses, immune quarantines
