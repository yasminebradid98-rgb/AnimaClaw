# Helicone Integration — LLM Observability

**Engine:** SOLARIS v1.5.0
**Effort:** 5 minutes
**Tracks:** All LLM calls, cost per agent, latency, prompt versions

---

## What Helicone Does

Helicone sits as a proxy between ANIMA OS and OpenRouter. Every LLM call passes through Helicone, which logs:

- Token usage per request
- Cost per agent
- Latency (time to first token, total time)
- Prompt templates and versions
- Success/failure rates
- Model comparison metrics

---

## Setup (One-Line Change)

### Step 1: Get Your Helicone API Key

1. Sign up at [helicone.ai](https://helicone.ai)
2. Create a new project named "ANIMA OS"
3. Copy your API key

### Step 2: Update anima_config.json

Add to `core/anima_config.json` under a new `integrations` section:

```json
{
  "integrations": {
    "helicone": {
      "enabled": true,
      "api_key": "YOUR_HELICONE_API_KEY",
      "base_url": "https://oai.helicone.ai/v1"
    }
  }
}
```

### Step 3: Update OpenRouter Calls

Change your OpenRouter base URL from:
```
https://openrouter.ai/api/v1
```

To the Helicone proxy URL:
```
https://oai.helicone.ai/v1
```

Add these headers to every LLM request:

```javascript
headers: {
  'Helicone-Auth': `Bearer ${HELICONE_API_KEY}`,
  'Helicone-Property-Agent': agentName,        // e.g., "PRIMARY_CELL"
  'Helicone-Property-Depth': String(depth),     // e.g., "1"
  'Helicone-Property-Cycle': String(cycleNum),  // e.g., "42"
  'Helicone-Property-Engine': 'SOLARIS',
}
```

### Step 4: Add to .env

```
HELICONE_API_KEY=your_helicone_api_key_here
```

---

## What You See in Helicone Dashboard

| Metric | Source |
|--------|--------|
| Requests per agent | `Helicone-Property-Agent` header |
| Cost breakdown | Token counts per request |
| Latency percentiles | P50, P95, P99 per agent |
| Error rates | 4xx/5xx responses |
| Prompt versions | Request body fingerprinting |
| Model comparison | Model field in request |

---

## Agent-Level Tracking

Each agent in the fractal tree gets its own Helicone property:

| Agent | Helicone Property |
|-------|------------------|
| ROOT_ORCHESTRATOR | `Agent=ROOT_ORCHESTRATOR, Depth=0` |
| PRIMARY_CELL | `Agent=PRIMARY_CELL, Depth=1` |
| SUPPORT_CELL | `Agent=SUPPORT_CELL, Depth=1` |
| MEMORY_NODE | `Agent=MEMORY_NODE, Depth=2` |
| EVOLUTION_NODE | `Agent=EVOLUTION_NODE, Depth=2` |
| IMMUNE_AGENT | `Agent=IMMUNE_AGENT, Depth=2` |

This maps directly to ANIMA's cost tracking in `anima_cost_tracker`.

---

## Cost Alerts

Configure Helicone alerts for:
- Daily spend > $10
- Single request > $1
- Error rate > 5%
- Latency P95 > 10s

These complement ANIMA's built-in cost tracking with real-time external monitoring.
