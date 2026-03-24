/**
 * NETWORK CONNECTOR — External Webhook Receiver
 * Layer 5: AnimaNetwork → AnimaClaw bridge
 *
 * Starts an HTTP server that accepts POST /webhook payloads from
 * external systems (AnimaNetwork, Zapier, n8n, etc.) and injects
 * them as pending tasks into anima_task_queue.
 *
 * Security: requests must include the header
 *   X-Anima-Secret: <ANIMA_WEBHOOK_SECRET env var>
 *
 * Usage:
 *   const { startConnector } = require('./runtime/network_connector');
 *   startConnector({ port: 4000, supabase });
 */

const http = require('http');
const { createClient } = require('@supabase/supabase-js');
const { enqueueTask } = require('./execution_engine');

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_PORT = process.env.ANIMA_CONNECTOR_PORT || 4000;
const WEBHOOK_SECRET = process.env.ANIMA_WEBHOOK_SECRET || null;

// ═══════════════════════════════════════════════════════════════════
// REQUEST HELPERS
// ═══════════════════════════════════════════════════════════════════

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

// ═══════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════

function isAuthorized(req) {
  if (!WEBHOOK_SECRET) return true; // no secret configured → open (dev mode)
  return req.headers['x-anima-secret'] === WEBHOOK_SECRET;
}

// ═══════════════════════════════════════════════════════════════════
// PAYLOAD VALIDATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Expected webhook payload:
 * {
 *   agentId:   string  (required) — target agent, e.g. "ManagerAgent"
 *   taskType:  string  (optional) — defaults to "LLM_CALL"
 *   payload:   object  (required) — task content
 *   tenantId:  string  (optional) — tenant scoping
 *   priority:  number  (optional, 1-10) — defaults to 5
 * }
 */
function validatePayload(body) {
  if (!body || typeof body !== 'object') {
    return 'Body must be a JSON object';
  }
  if (!body.agentId || typeof body.agentId !== 'string') {
    return 'agentId (string) is required';
  }
  if (!body.payload || typeof body.payload !== 'object') {
    return 'payload (object) is required';
  }
  if (body.priority !== undefined) {
    const p = Number(body.priority);
    if (isNaN(p) || p < 1 || p > 10) return 'priority must be an integer between 1 and 10';
  }
  return null; // valid
}

// ═══════════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════════

async function router(req, res, supabase) {
  const url = req.url.split('?')[0];
  const method = req.method;

  // ── Health check ──
  if (method === 'GET' && url === '/health') {
    return send(res, 200, { status: 'ok', service: 'AnimaClaw Network Connector' });
  }

  // ── Webhook entry point ──
  if (method === 'POST' && url === '/webhook') {
    if (!isAuthorized(req)) {
      return send(res, 401, { error: 'Unauthorized: invalid or missing X-Anima-Secret' });
    }

    let body;
    try {
      body = await readBody(req);
    } catch (err) {
      return send(res, 400, { error: err.message });
    }

    const validationError = validatePayload(body);
    if (validationError) {
      return send(res, 422, { error: validationError });
    }

    try {
      const task = await enqueueTask(supabase, {
        agentId:  body.agentId,
        taskType: body.taskType || 'LLM_CALL',
        payload:  body.payload,
        priority: body.priority ? Number(body.priority) : 5,
        tenantId: body.tenantId || null,
      });

      console.log(`[NetworkConnector] Task ${task.id} enqueued for ${body.agentId}`);
      return send(res, 201, { taskId: task.id, status: 'pending', agentId: body.agentId });

    } catch (err) {
      console.error('[NetworkConnector] Enqueue error:', err.message);
      return send(res, 500, { error: err.message });
    }
  }

  // ── 404 fallback ──
  return send(res, 404, { error: `Route ${method} ${url} not found` });
}

// ═══════════════════════════════════════════════════════════════════
// SERVER
// ═══════════════════════════════════════════════════════════════════

/**
 * Start the network connector HTTP server.
 *
 * @param {Object} options
 * @param {number} [options.port]      - Port to listen on (default: 4000)
 * @param {Object} [options.supabase]  - Supabase client (created from env if omitted)
 * @returns {http.Server}
 */
function startConnector({ port = DEFAULT_PORT, supabase } = {}) {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY required');
    supabase = createClient(url, key);
  }

  const server = http.createServer((req, res) => {
    router(req, res, supabase).catch(err => {
      console.error('[NetworkConnector] Unhandled error:', err.message);
      send(res, 500, { error: 'Internal server error' });
    });
  });

  server.listen(port, () => {
    console.log(`[NetworkConnector] Listening on port ${port}`);
    console.log(`[NetworkConnector] Webhook: POST http://localhost:${port}/webhook`);
    console.log(`[NetworkConnector] Secret: ${WEBHOOK_SECRET ? 'configured' : 'NONE (dev mode)'}`);
  });

  return server;
}

module.exports = { startConnector, router };
