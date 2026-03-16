/**
 * LLM CLIENT — Unified Language Model Interface
 * Version: 1.0.0
 * Engine: SOLARIS
 *
 * Supports 3 modes:
 *   - openrouter: Classic HTTP API calls with OPENROUTER_API_KEY
 *   - kimi-claw: Running inside Kimi terminal (stdin/stdout)
 *   - openclaw/maxclaw: Running inside other Claw terminals
 *
 * Usage:
 *   const { callLLM } = require('./runtime/llm_client');
 *   const result = await callLLM({
 *     mode: 'openrouter',
 *     model: 'anthropic/claude-3.5-sonnet',
 *     systemPrompt: 'You are an AI agent...',
 *     userPrompt: 'Process this task...',
 *     tools: [...]
 *   });
 */

const https = require('https');
const http = require('http');

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_MODELS = {
  openrouter: 'anthropic/claude-3.5-sonnet',
  kimi: 'kimi-k2.5',
  openclaw: 'openclaw-default',
  maxclaw: 'maxclaw-default',
};

const OPENROUTER_BASE_URL = 'openrouter.ai';
const OPENROUTER_API_PATH = '/api/v1/chat/completions';

// ═══════════════════════════════════════════════════════════════════
// MODE: OPENROUTER — Real HTTP API calls
// ═══════════════════════════════════════════════════════════════════

/**
 * Call LLM via OpenRouter HTTP API
 * @param {Object} params
 * @returns {Promise<Object>} LLM response
 */
async function callOpenRouter({
  apiKey,
  model = DEFAULT_MODELS.openrouter,
  systemPrompt,
  userPrompt,
  tools = [],
  temperature = 0.7,
  maxTokens = 4000,
  userId = 'anima-os',
}) {
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY required for openrouter mode');
  }

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userPrompt });

  const requestBody = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (tools && tools.length > 0) {
    requestBody.tools = tools;
    requestBody.tool_choice = 'auto';
  }

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(requestBody);

    const options = {
      hostname: OPENROUTER_BASE_URL,
      port: 443,
      path: OPENROUTER_API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://anima-os.vercel.app',
        'X-Title': 'ANIMA OS',
        'X-User-ID': userId,
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.error) {
            reject(new Error(`OpenRouter error: ${response.error.message}`));
            return;
          }

          if (!response.choices || response.choices.length === 0) {
            reject(new Error('No choices in OpenRouter response'));
            return;
          }

          const choice = response.choices[0];
          const result = {
            content: choice.message?.content || '',
            toolCalls: choice.message?.tool_calls || [],
            finishReason: choice.finish_reason,
            model: response.model,
            usage: {
              promptTokens: response.usage?.prompt_tokens || 0,
              completionTokens: response.usage?.completion_tokens || 0,
              totalTokens: response.usage?.total_tokens || 0,
            },
            costUsd: response.usage?.cost || 0,
            raw: response,
          };

          resolve(result);
        } catch (err) {
          reject(new Error(`Failed to parse OpenRouter response: ${err.message}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`OpenRouter request failed: ${err.message}`));
    });

    req.setTimeout(120000, () => {
      req.destroy();
      reject(new Error('OpenRouter request timeout (120s)'));
    });

    req.write(postData);
    req.end();
  });
}

// ═══════════════════════════════════════════════════════════════════
// MODE: KIMI-CLAW — Inside Kimi terminal
// ═══════════════════════════════════════════════════════════════════

/**
 * PLACEHOLDER: Call LLM via Kimi Claw terminal
 * 
 * INTEGRATION NOTE:
 * When running inside Kimi terminal, we cannot make HTTP calls to Kimi API.
 * Instead, we use stdin/stdout to communicate with the host Kimi process.
 * 
 * Expected implementation:
 * 1. Write request to process.stdout in a special format
 * 2. Host Kimi captures, processes, writes response to process.stdin
 * 3. We parse and return
 * 
 * For now, this is a placeholder that throws an error.
 * Implement when Kimi Claw exposes an SDK.
 */
async function callKimiClaw({
  model = DEFAULT_MODELS.kimi,
  systemPrompt,
  userPrompt,
  tools = [],
}) {
  // TODO: Implement when Kimi Claw provides SDK
  // For now, simulate with a warning
  
  console.warn('[LLM_CLIENT] kimi-claw mode is a placeholder');
  console.warn('  Expected: Kimi Claw SDK integration via stdin/stdout');
  console.warn('  Current: Simulating with mock response');
  
  // Mock response for testing
  return {
    content: `[KIMI-CLAW PLACEHOLDER] Would process: ${userPrompt.substring(0, 100)}...`,
    toolCalls: [],
    finishReason: 'stop',
    model: 'kimi-k2.5',
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    costUsd: 0,
    isPlaceholder: true,
  };
}

// ═══════════════════════════════════════════════════════════════════
// MODE: OPENCLAW/MAXCLAW — Inside other Claw terminals
// ═══════════════════════════════════════════════════════════════════

/**
 * PLACEHOLDER: Call LLM via OpenClaw or MaxClaw terminal
 * 
 * INTEGRATION NOTE:
 * Similar to kimi-claw but for other Claw environments.
 * May use local HTTP proxy or stdin/stdout protocol.
 * 
 * Expected implementation:
 * - Check for CLAW_MODE env var
 * - Connect to localhost proxy if available
 * - Fallback to stdin/stdout protocol
 */
async function callOpenClaw({
  model = DEFAULT_MODELS.openclaw,
  systemPrompt,
  userPrompt,
  tools = [],
}) {
  // Check for local proxy (some Claw setups expose localhost:8080)
  const proxyPort = process.env.CLAW_PROXY_PORT || 8080;
  
  try {
    // Attempt to connect to local proxy
    return await callLocalProxy({
      port: proxyPort,
      model,
      systemPrompt,
      userPrompt,
      tools,
    });
  } catch (err) {
    console.warn('[LLM_CLIENT] openclaw mode: local proxy unavailable');
    console.warn('  Expected: localhost:' + proxyPort + ' or stdin/stdout');
    
    // Fallback to placeholder
    return {
      content: `[OPENCLAW PLACEHOLDER] Would process: ${userPrompt.substring(0, 100)}...`,
      toolCalls: [],
      finishReason: 'stop',
      model: 'openclaw-default',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      costUsd: 0,
      isPlaceholder: true,
    };
  }
}

async function callMaxClaw({
  model = DEFAULT_MODELS.maxclaw,
  systemPrompt,
  userPrompt,
  tools = [],
}) {
  // MaxClaw is similar to OpenClaw but may have different protocol
  // For now, reuse OpenClaw logic
  return callOpenClaw({ model, systemPrompt, userPrompt, tools });
}

/**
 * Attempt to call local proxy server
 */
async function callLocalProxy({ port, model, systemPrompt, userPrompt, tools }) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      tools,
    });

    const options = {
      hostname: 'localhost',
      port,
      path: '/v1/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            content: response.text || response.content || '',
            toolCalls: response.tool_calls || [],
            finishReason: 'stop',
            model,
            usage: response.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            costUsd: 0,
          });
        } catch (err) {
          reject(new Error('Invalid proxy response'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Proxy timeout'));
    });
    req.write(requestBody);
    req.end();
  });
}

// ═══════════════════════════════════════════════════════════════════
// MAIN INTERFACE
// ═══════════════════════════════════════════════════════════════════

/**
 * Call LLM with specified mode
 * @param {Object} params
 * @param {string} params.mode - 'openrouter', 'kimi-claw', 'openclaw', 'maxclaw'
 * @param {string} params.model - Model identifier
 * @param {string} params.systemPrompt - System prompt
 * @param {string} params.userPrompt - User prompt
 * @param {Array} params.tools - Available tools
 * @param {number} params.temperature - Temperature (0-1)
 * @param {number} params.maxTokens - Max tokens
 * @returns {Promise<Object>} LLM response
 */
async function callLLM(params) {
  const mode = params.mode || 'openrouter';
  
  switch (mode) {
    case 'openrouter':
      return callOpenRouter(params);
    
    case 'kimi-claw':
    case 'kimi':
      return callKimiClaw(params);
    
    case 'openclaw':
      return callOpenClaw(params);
    
    case 'maxclaw':
      return callMaxClaw(params);
    
    default:
      throw new Error(`Unknown LLM mode: ${mode}`);
  }
}

/**
 * Auto-detect mode based on environment
 * @returns {string} Detected mode
 */
function detectMode() {
  // Check for explicit mode override
  if (process.env.ANIMA_LLM_MODE) {
    return process.env.ANIMA_LLM_MODE;
  }
  
  // Check for OpenRouter key
  if (process.env.OPENROUTER_API_KEY) {
    return 'openrouter';
  }
  
  // Check for Kimi environment
  if (process.env.KIMI_CLAW_VERSION || process.env.KIMI_TERMINAL) {
    return 'kimi-claw';
  }
  
  // Check for other Claw environments
  if (process.env.OPENCLAW_VERSION) {
    return 'openclaw';
  }
  
  if (process.env.MAXCLAW_VERSION) {
    return 'maxclaw';
  }
  
  // Default to openrouter (will fail gracefully if no key)
  return 'openrouter';
}

/**
 * Get available models for a mode
 * @param {string} mode 
 * @returns {Array} List of available models
 */
function getAvailableModels(mode = 'openrouter') {
  const models = {
    openrouter: [
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3-opus',
      'openai/gpt-4o',
      'openai/gpt-4-turbo',
      'meta-llama/llama-3.1-70b-instruct',
      'google/gemini-pro-1.5',
    ],
    'kimi-claw': ['kimi-k2.5', 'kimi-k1.5'],
    openclaw: ['openclaw-default', 'claude-3.5-sonnet', 'gpt-4o'],
    maxclaw: ['maxclaw-default', 'claude-3-opus', 'gpt-4-turbo'],
  };
  
  return models[mode] || models.openrouter;
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  callLLM,
  callOpenRouter,
  callKimiClaw,
  callOpenClaw,
  callMaxClaw,
  detectMode,
  getAvailableModels,
  DEFAULT_MODELS,
};
