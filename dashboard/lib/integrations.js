/**
 * Integration helpers for optional services.
 * Each integration exposes a health check and a send/proxy function.
 * Stubs return graceful fallbacks when not configured.
 */

// --- Helicone Proxy ---
export function createHeliconeProxy(apiKey) {
  const baseUrl = 'https://oai.hconeai.com/v1';
  if (!apiKey) return null;

  return {
    baseUrl,
    headers: {
      'Helicone-Auth': `Bearer ${apiKey}`,
    },
    async healthCheck() {
      try {
        const resp = await fetch(`${baseUrl}/models`, {
          headers: this.headers,
        });
        return resp.ok;
      } catch {
        return false;
      }
    },
  };
}

// --- Langfuse Tracing ---
export function createLangfuseClient(publicKey, secretKey, host) {
  if (!publicKey || !secretKey) return null;

  const baseUrl = host || 'https://cloud.langfuse.com';

  return {
    async trace(name, metadata) {
      try {
        const resp = await fetch(`${baseUrl}/api/public/traces`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString('base64')}`,
          },
          body: JSON.stringify({ name, metadata }),
        });
        return resp.ok ? await resp.json() : null;
      } catch {
        return null;
      }
    },
    async healthCheck() {
      try {
        const resp = await fetch(`${baseUrl}/api/public/health`, {
          headers: {
            Authorization: `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString('base64')}`,
          },
        });
        return resp.ok;
      } catch {
        return false;
      }
    },
  };
}

// --- Ollama Local Fallback ---
export function createOllamaClient(baseUrl) {
  const url = baseUrl || 'http://localhost:11434';

  return {
    async generate(model, prompt) {
      try {
        const resp = await fetch(`${url}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: model || 'llama3:8b', prompt, stream: false }),
        });
        if (!resp.ok) return null;
        const data = await resp.json();
        return data.response;
      } catch {
        return null;
      }
    },
    async healthCheck() {
      try {
        const resp = await fetch(`${url}/api/tags`);
        return resp.ok;
      } catch {
        return false;
      }
    },
  };
}

// --- n8n Webhook ---
export function createN8nClient(webhookUrl) {
  if (!webhookUrl) return null;

  return {
    async trigger(eventType, data) {
      try {
        const resp = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_type: eventType, timestamp: new Date().toISOString(), data }),
        });
        return resp.ok;
      } catch {
        return false;
      }
    },
    async healthCheck() {
      try {
        const resp = await fetch(webhookUrl, { method: 'HEAD' });
        return resp.status < 500;
      } catch {
        return false;
      }
    },
  };
}

// --- Lark Webhook ---
export function createLarkClient(webhookUrl) {
  if (!webhookUrl) return null;

  return {
    async send(title, content) {
      try {
        const resp = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            msg_type: 'interactive',
            card: {
              header: { title: { tag: 'plain_text', content: title } },
              elements: [{ tag: 'div', text: { tag: 'plain_text', content } }],
            },
          }),
        });
        return resp.ok;
      } catch {
        return false;
      }
    },
  };
}

// --- WhatsApp via Kapso ---
export function createKapsoClient(webhookUrl) {
  if (!webhookUrl) return null;

  return {
    async send(to, message) {
      try {
        const resp = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, message, timestamp: new Date().toISOString() }),
        });
        return resp.ok;
      } catch {
        return false;
      }
    },
  };
}
