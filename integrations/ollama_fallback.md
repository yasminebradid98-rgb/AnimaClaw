# Ollama Fallback — Zero-Downtime Local LLM

**Engine:** SOLARIS v1.5.0
**Effort:** 5 minutes
**Guarantees:** System never goes down, even with no internet

---

## What This Does

When cloud APIs (OpenRouter) fail or respond too slowly, ANIMA OS automatically falls back to a local Ollama instance. EVOLUTION_NODE detects the failure and reroutes all LLM calls to Ollama until cloud service recovers.

```
Cloud API call → timeout/error → EVOLUTION_NODE detects
  → Switch to Ollama → Continue operating
  → Periodic health check → Cloud recovers → Switch back
```

---

## Setup

### Step 1: Install Ollama

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh
```

### Step 2: Pull a Model

```bash
# Recommended for ANIMA OS (good balance of speed and quality)
ollama pull llama3.1:8b

# Lighter alternative
ollama pull phi3:mini

# Heavier alternative (if you have GPU)
ollama pull llama3.1:70b
```

### Step 3: Start Ollama

```bash
ollama serve
```

Default endpoint: `http://localhost:11434`

### Step 4: Update anima_config.json

Add to `core/anima_config.json`:

```json
{
  "integrations": {
    "ollama": {
      "enabled": true,
      "base_url": "http://localhost:11434",
      "fallback_model": "llama3.1:8b",
      "fallback_trigger_ms": 5083,
      "health_check_interval_ms": 31416,
      "auto_switch_back": true
    }
  }
}
```

### Step 5: Add to .env

```
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_FALLBACK_MODEL=llama3.1:8b
```

---

## How Fallback Works

### Detection (EVOLUTION_NODE)

```
1. Cloud API call times out after 5083ms (φ × π × 1000)
2. EVOLUTION_NODE receives failure event
3. Sets global flag: FALLBACK_MODE = true
4. All subsequent LLM calls route to Ollama
5. Health check runs every 31416ms (π × 10000)
6. When cloud responds 200: FALLBACK_MODE = false
```

### Trigger Conditions

| Condition | Action |
|-----------|--------|
| API response > 5083ms | Switch to Ollama |
| API returns 5xx | Switch to Ollama |
| API returns 429 (rate limit) | Switch to Ollama |
| Network error | Switch to Ollama |
| Ollama health check fails | Remain on cloud (or queue tasks) |

### Recovery

| Condition | Action |
|-----------|--------|
| Cloud health check returns 200 | Switch back to cloud |
| 3 consecutive cloud successes | Confirm recovery |
| Ollama becomes unavailable | Queue tasks, retry both |

---

## Model Mapping

When falling back, ANIMA maps cloud models to local equivalents:

| Cloud Model | Ollama Fallback |
|-------------|----------------|
| claude-3-opus | llama3.1:70b (if available) or llama3.1:8b |
| claude-3-sonnet | llama3.1:8b |
| gpt-4 | llama3.1:8b |
| gpt-3.5-turbo | phi3:mini |

---

## Limitations During Fallback

- Response quality may decrease depending on local model
- Token limits are model-dependent (Ollama models typically 4k-128k context)
- Quantum decision cycles still run but with local model scores
- Cost tracking shows $0.00 during Ollama usage
- IMMUNE_AGENT scans remain active on all outputs

---

## Monitoring

During fallback mode:
- Discord `#anima-mission-control` posts: "Fallback mode active — using local Ollama"
- Telegram notification sent (if configured)
- Dashboard shows fallback indicator
- `anima_agent_logs` records `model_used = 'ollama:llama3.1:8b'`
- Recovery logged: "Cloud API recovered — switching back to OpenRouter"
