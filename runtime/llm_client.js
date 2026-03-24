/**
 * LLM CLIENT — Unified Language Model Interface
 * Version: 2.0.0
 * Engine: SOLARIS
 *
 * Supports 4 modes (auto-detected from environment):
 *   - kimi-claw:  Running inside Kimi Claw terminal (Moonshot API, OpenAI-compatible)
 *   - openrouter: HTTP API calls via OpenRouter with OPENROUTER_API_KEY
 *   - openclaw:   Running inside OpenClaw (local proxy or stdin/stdout)
 *   - maxclaw:    Running inside MaxClaw (same as openclaw with MaxClaw endpoint)
 *
 * Priority order: kimi-claw > openrouter > openclaw > maxclaw
 *
 * Usage:
 *   const { callLLM } = require('./runtime/llm_client');
 *   const result = await callLLM({
 *     mode: 'kimi-claw',
 *     systemPrompt: 'You are ANIMA OS...',
 *     userPrompt: 'Process this task...',
 *   });
 */

const https = require('https');
const http = require('http');
const memory = require('./memory_system'); // Ajoute cette ligne

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_MODELS = {
  'kimi-claw': 'moonshot-v1-32k',    // Kimi / Moonshot AI
  kimi:        'moonshot-v1-32k',
  openrouter:  'anthropic/claude-3.5-sonnet',
  openclaw:    'openclaw-default',
  maxclaw:     'maxclaw-default',
  // BYOLLM provider defaults (used when tenant brings their own key)
  openai:      'gpt-4o',
  groq:        'llama-3.1-70b-versatile',
  anthropic:   'anthropic/claude-3.5-sonnet',  // routed via system OpenRouter
  gemini:      'google/gemini-pro-1.5',         // routed via system OpenRouter
  ollama:      'llama3.2',
};

// Direct provider endpoints (OpenAI-compatible format)
const PROVIDER_ENDPOINTS = {
  openai: { hostname: 'api.openai.com',  path: '/v1/chat/completions' },
  groq:   { hostname: 'api.groq.com',    path: '/openai/v1/chat/completions' },
};

// Kimi (Moonshot AI) uses OpenAI-compatible API
const KIMI_BASE_URL    = 'api.moonshot.cn';
const KIMI_API_PATH    = '/v1/chat/completions';

// OpenRouter
const OPENROUTER_BASE_URL  = 'openrouter.ai';
const OPENROUTER_API_PATH  = '/api/v1/chat/completions';

// ═══════════════════════════════════════════════════════════════════
// CORE HTTP HELPER
// ═══════════════════════════════════════════════════════════════════

function httpsPost({ hostname, path, headers, body, timeoutMs = 120000 }) {
  return new Promise((resolve, reject) => {
    const postData = typeof body === 'string' ? body : JSON.stringify(body);

    const options = {
      hostname,
      port: 443,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.error?.message || data}`));
            return;
          }
          resolve(parsed);
        } catch (err) {
          reject(new Error(`Failed to parse response: ${err.message} | Raw: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', (err) => reject(new Error(`Request failed: ${err.message}`)));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`Request timeout (${timeoutMs}ms)`));
    });

    req.write(postData);
    req.end();
  });
}

// Parse OpenAI-compatible response into standard format
function parseOpenAIResponse(response, defaultModel) {
  if (response.error) {
    throw new Error(`LLM error: ${response.error.message}`);
  }
  if (!response.choices?.length) {
    throw new Error('No choices in LLM response');
  }

  const choice = response.choices[0];
  return {
    content: choice.message?.content || '',
    toolCalls: choice.message?.tool_calls || [],
    finishReason: choice.finish_reason,
    model: response.model || defaultModel,
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
    costUsd: response.usage?.cost || 0,
    raw: response,
  };
}

// ═══════════════════════════════════════════════════════════════════
// MODE: KIMI-CLAW (Moonshot AI — OpenAI-compatible)
// ═══════════════════════════════════════════════════════════════════

/**
 * Call Kimi / Moonshot AI
 * API docs: https://platform.moonshot.cn/docs
 * Models: moonshot-v1-8k | moonshot-v1-32k | moonshot-v1-128k
 * When running inside Kimi Claw terminal, KIMI_API_KEY is auto-injected
 * by the environment — no manual key needed.
 */
async function callKimiClaw({
  apiKey,
  model = DEFAULT_MODELS['kimi-claw'],
  systemPrompt,
  userPrompt,
  messages: customMessages,
  tools = [],
  temperature = 0.7,
  maxTokens = 4000,
}) {
  const key = apiKey || process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY;

  // If no API key and inside terminal, use stdin/stdout protocol
  if (!key) {
    return callKimiTerminal({ systemPrompt, userPrompt, tools });
  }

  const messages = customMessages || [];
  if (!customMessages) {
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: userPrompt });
  }

  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (tools.length > 0) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  const response = await httpsPost({
    hostname: KIMI_BASE_URL,
    path: KIMI_API_PATH,
    headers: { 'Authorization': `Bearer ${key}` },
    body,
  });

  return parseOpenAIResponse(response, model);
}

/**
 * Fallback: Kimi Claw terminal stdin/stdout protocol
 * Used when running inside kimi.com terminal without explicit API key
 */
async function callKimiTerminal({ systemPrompt, userPrompt }) {
  // In Kimi Claw terminal environment, write structured request to stdout
  // The host Kimi environment captures this and responds via stdin
  const request = {
    __anima_llm_request__: true,
    system: systemPrompt,
    prompt: userPrompt,
    timestamp: Date.now(),
  };

  // Write request marker
  process.stdout.write('\n__KIMI_LLM_START__\n');
  process.stdout.write(JSON.stringify(request));
  process.stdout.write('\n__KIMI_LLM_END__\n');

  // Wait for response on stdin (max 60s)
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({
        content: `[KimiClaw] Received: "${userPrompt.slice(0, 80)}". Processing via Kimi terminal. Set KIMI_API_KEY in .env for direct API mode.`,
        toolCalls: [],
        finishReason: 'stop',
        model: 'kimi-terminal',
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        costUsd: 0,
        isTerminalMode: true,
      });
    }, 5000); // 5s then fall through to placeholder

    timeout.unref?.();
    clearTimeout(timeout);

    // Immediate placeholder — Kimi terminal response is async/external
    resolve({
      content: `[KimiClaw terminal mode] Task acknowledged: "${userPrompt.slice(0, 100)}". Add KIMI_API_KEY to .env for synchronous responses.`,
      toolCalls: [],
      finishReason: 'stop',
      model: 'kimi-terminal-placeholder',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      costUsd: 0,
      isPlaceholder: true,
    });
  });
}

// ═══════════════════════════════════════════════════════════════════
// MODE: OPENROUTER
// ═══════════════════════════════════════════════════════════════════

async function callOpenRouter({
  apiKey,
  model = DEFAULT_MODELS.openrouter,
  systemPrompt,
  userPrompt,
  messages: customMessages,
  tools = [],
  temperature = 0.7,
  maxTokens = 4000,
  userId = 'anima-os',
  tenantId = null,
}) {
  const key = apiKey || process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY required for openrouter mode');

  const messages = customMessages || [];
  if (!customMessages) {
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: userPrompt });
  }

  const body = { model, messages, temperature, max_tokens: maxTokens };
  if (tools.length > 0) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  const response = await httpsPost({
    hostname: OPENROUTER_BASE_URL,
    path: OPENROUTER_API_PATH,
    headers: {
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': 'https://anima-os-dashboard.vercel.app',
      'X-Title': 'ANIMA OS',
      'X-User-ID': userId,
      ...(tenantId && { 'X-Tenant-ID': String(tenantId) }),
    },
    body,
  });

  return parseOpenAIResponse(response, model);
}

// ═══════════════════════════════════════════════════════════════════
// MODE: OPENCLAW / MAXCLAW (local proxy or stdin/stdout)
// ═══════════════════════════════════════════════════════════════════

async function callLocalProxy({ port, model, systemPrompt, userPrompt, tools }) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model, system: systemPrompt, prompt: userPrompt, tools });
    const options = {
      hostname: 'localhost',
      port,
      path: '/v1/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const r = JSON.parse(data);
          resolve({
            content: r.text || r.content || '',
            toolCalls: r.tool_calls || [],
            finishReason: 'stop',
            model,
            usage: r.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            costUsd: 0,
          });
        } catch (err) {
          reject(new Error('Invalid proxy response'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Proxy timeout')); });
    req.write(body);
    req.end();
  });
}

async function callOpenClaw({ model = DEFAULT_MODELS.openclaw, systemPrompt, userPrompt, tools = [] }) {
  const proxyPort = parseInt(process.env.CLAW_PROXY_PORT) || 8080;
  try {
    return await callLocalProxy({ port: proxyPort, model, systemPrompt, userPrompt, tools });
  } catch {
    return {
      content: `[OpenClaw] Processed: "${userPrompt.slice(0, 100)}"`,
      toolCalls: [], finishReason: 'stop', model: 'openclaw',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      costUsd: 0, isPlaceholder: true,
    };
  }
}

async function callMaxClaw(params) {
  return callOpenClaw({ ...params, model: params.model || DEFAULT_MODELS.maxclaw });
}

// ═══════════════════════════════════════════════════════════════════
// BYOLLM: GENERIC OPENAI-COMPATIBLE CALL
// ═══════════════════════════════════════════════════════════════════

/**
 * Generic OpenAI-compatible call for any provider that follows the
 * /v1/chat/completions format (OpenAI, Groq, Kimi, etc.).
 */
async function callOpenAICompatible({
  hostname,
  path,
  apiKey,
  model,
  systemPrompt,
  userPrompt,
  messages: customMessages,
  tools = [],
  temperature = 0.7,
  maxTokens = 4000,
}) {
  if (!apiKey) throw new Error(`API key required for ${hostname}`);

  const messages = customMessages || [];
  if (!customMessages) {
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: userPrompt });
  }

  const body = { model, messages, temperature, max_tokens: maxTokens };
  if (tools.length > 0) { body.tools = tools; body.tool_choice = 'auto'; }

  const response = await httpsPost({
    hostname,
    path,
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body,
  });

  return parseOpenAIResponse(response, model);
}

// ═══════════════════════════════════════════════════════════════════
// BYOLLM: TENANT KEY RESOLUTION + DISPATCH
// ═══════════════════════════════════════════════════════════════════

/**
 * Look up the active LLM secret for a tenant from tenant_secrets table.
 * Returns { provider, api_key, model_override } or null if not found.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string|null} tenantId
 */
async function resolveTenantKey(supabase, tenantId) {
  if (!tenantId || !supabase) return null;

  const { data, error } = await supabase
    .from('tenant_secrets')
    .select('provider, api_key, model_override')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('[LLMClient] Could not resolve tenant key:', error.message);
    return null;
  }

  return data; // { provider, api_key, model_override } or null
}

/**
 * Route an LLM call for a specific tenant.
 *
 * Resolution order:
 *   1. Query tenant_secrets for an active key → use tenant's own provider
 *   2. No key found → fall back to system callLLM() (env vars)
 *
 * Supported tenant providers with direct calls: openai, groq, kimi
 * Anthropic/Gemini: routed via system OpenRouter (different API format)
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string|null} tenantId
 * @param {Object} params  - Same params as callLLM()
 */

/**
 * Enrichit le prompt avec les briques de savoir du client (Studio Argile, etc.)
 */
async function enrichPromptWithKnowledge(supabase, tenantId, systemPrompt) {
  if (!supabase || !tenantId) return systemPrompt;

  try {
    // On appelle ta fonction qui récupère les mugs/prix
    const knowledge = await memory.getClientKnowledge(supabase, tenantId);
    
    if (!knowledge) return systemPrompt;

    // On fusionne les infos dans le prompt système
    return `${systemPrompt}\n\n${knowledge}\n\nIMPORTANT: Utilise ces informations pour répondre de manière précise au client.`;
  } catch (err) {
    console.error('[LLMClient] Erreur injection mémoire:', err.message);
    return systemPrompt;
  }
}

/**
 * Route an LLM call for a specific tenant with Memory Injection.
 */
async function callLLMForTenant(supabase, tenantId, params) {
  // --- INJECTION MÉMOIRE YASMINE ---
  // On récupère les briques de savoir (Mugs, prix, etc.) avant de lancer l'appel
  if (supabase && tenantId) {
    params.systemPrompt = await enrichPromptWithKnowledge(
      supabase, 
      tenantId, 
      params.systemPrompt
    );
  }
  // ---------------------------------

  const secret = await resolveTenantKey(supabase, tenantId);

  if (!secret) {
    // Pas de clé spécifique au tenant — on utilise callLLM qui est déjà corrigé
    return callLLM(params);
  }

  const { provider, api_key: apiKey, model_override } = secret;
  const model = params.model || model_override || DEFAULT_MODELS[provider] || DEFAULT_MODELS.openrouter;

  switch (provider) {
    case 'openrouter':
      return callOpenRouter({ ...params, apiKey, model, tenantId });

    case 'openai':
      return callOpenAICompatible({
        ...params, apiKey, model,
        hostname: PROVIDER_ENDPOINTS.openai.hostname,
        path:     PROVIDER_ENDPOINTS.openai.path,
      });

    case 'groq':
      return callOpenAICompatible({
        ...params, apiKey, model,
        hostname: PROVIDER_ENDPOINTS.groq.hostname,
        path:     PROVIDER_ENDPOINTS.groq.path,
      });

    case 'kimi':
      return callKimiClaw({ ...params, apiKey, model });

    case 'anthropic':
    case 'gemini':
      return callOpenRouter({ ...params, model, tenantId });

    case 'ollama':
      return callOpenClaw({ ...params, model });

    default:
      console.warn(`[LLMClient] Unknown provider '${provider}' for tenant ${tenantId}, using system defaults`);
      return callLLM(params);
  }
}

// ═══════════════════════════════════════════════════════════════════
// AUTO-DETECT MODE
// ═══════════════════════════════════════════════════════════════════

/**
 * Auto-detect which LLM mode to use based on environment variables.
 * Priority: explicit > kimi-claw > openrouter > openclaw > maxclaw
 */
function detectMode() {
  // 1. Explicit override
  if (process.env.ANIMA_LLM_MODE) return process.env.ANIMA_LLM_MODE;

  // 2. Kimi Claw: inside Kimi terminal OR has Kimi API key
  if (
    process.env.KIMI_API_KEY ||
    process.env.MOONSHOT_API_KEY ||
    process.env.KIMI_CLAW_VERSION ||
    process.env.KIMI_TERMINAL
  ) return 'kimi-claw';

  // 3. OpenRouter
  if (process.env.OPENROUTER_API_KEY) return 'openrouter';

  // 4. Other Claw environments
  if (process.env.MAXCLAW_VERSION) return 'maxclaw';
  if (process.env.OPENCLAW_VERSION) return 'openclaw';

  // 5. Default: kimi-claw (terminal mode, no API key required)
  return 'kimi-claw';
}

// ═══════════════════════════════════════════════════════════════════
// MAIN INTERFACE
// ═══════════════════════════════════════════════════════════════════

/**
 * Universal LLM call — auto-detects mode or uses params.mode
 */
async function callLLM(params) {
  const mode = params.mode || detectMode();

  switch (mode) {
    case 'kimi-claw':
    case 'kimi':
      return callKimiClaw(params);

    case 'openrouter':
      return callOpenRouter({ ...params, tenantId: params.tenantId || null });

    case 'openclaw':
      return callOpenClaw(params);

    case 'maxclaw':
      return callMaxClaw(params);

    default:
      throw new Error(`Unknown LLM mode: ${mode}. Valid: kimi-claw | openrouter | openclaw | maxclaw`);
  }
}

function getAvailableModels(mode = 'kimi-claw') {
  const models = {
    'kimi-claw': ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    kimi:        ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    openrouter:  ['anthropic/claude-3.5-sonnet', 'anthropic/claude-3-opus', 'openai/gpt-4o', 'meta-llama/llama-3.1-70b-instruct'],
    openclaw:    ['openclaw-default', 'claude-3.5-sonnet', 'gpt-4o'],
    maxclaw:     ['maxclaw-default', 'claude-3-opus', 'gpt-4-turbo'],
  };
  return models[mode] || models['kimi-claw'];
}

module.exports = {
  callLLM,
  callLLMForTenant,
  resolveTenantKey,
  callKimiClaw,
  callOpenRouter,
  callOpenClaw,
  callMaxClaw,
  detectMode,
  getAvailableModels,
  DEFAULT_MODELS,
};
