#!/usr/bin/env node

/**
 * ANIMA OS — Lark Notification Sender v1.5.0
 * Engine: SOLARIS
 * Author: Riyad Ketami — riyad@ketami.net
 *
 * Sends formatted card notifications to a Lark workspace webhook.
 * Called by pi_pulse_daemon.js on critical events:
 *   - Evolution events
 *   - Alignment drops below 0.618
 *   - Cost threshold breaches
 *   - Quantum tunneling events
 *
 * Usage:
 *   const { sendLarkNotification } = require('./integrations/lark_notify');
 *   await sendLarkNotification('evolution', { cycle: 42, alignment: 0.85 });
 *
 * Environment:
 *   LARK_WEBHOOK_URL — Your Lark bot webhook URL
 */

const https = require('https');
const path = require('path');

// --- Constants ---
const PHI = 1.6180339887;
const PI = 3.1415926535;
const VERSION = '1.5.0';

// Load .env
try {
  require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
} catch {
  // dotenv optional
}

const LARK_WEBHOOK_URL = process.env.LARK_WEBHOOK_URL || '';

// --- Card Templates ---

function buildEvolutionCard(data) {
  return {
    msg_type: 'interactive',
    card: {
      config: { wide_screen_mode: true },
      header: {
        title: { tag: 'plain_text', content: 'ANIMA OS — Evolution Event' },
        template: 'gold',
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**Cycle:** #${data.cycle || 0}\n**Global Alignment:** ${(data.alignment || 0).toFixed(4)}\n**Mutation:** ${data.mutation || 'None'}\n**Branches Spawned:** ${data.spawned || 0}\n**Branches Pruned:** ${data.pruned || 0}`,
          },
        },
        {
          tag: 'hr',
        },
        {
          tag: 'note',
          elements: [
            {
              tag: 'plain_text',
              content: `Engine: SOLARIS v${VERSION} | φ=${PHI} | π=${PI}`,
            },
          ],
        },
      ],
    },
  };
}

function buildAlignmentDropCard(data) {
  const severity = data.alignment < 0.382 ? 'CRITICAL' : 'WARNING';
  const template = data.alignment < 0.382 ? 'red' : 'orange';

  return {
    msg_type: 'interactive',
    card: {
      config: { wide_screen_mode: true },
      header: {
        title: { tag: 'plain_text', content: `ANIMA OS — Alignment ${severity}` },
        template,
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**Agent:** ${data.agent || 'Unknown'}\n**Alignment:** ${(data.alignment || 0).toFixed(4)} (threshold: 0.618)\n**Vitality:** ${(data.vitality || 0).toFixed(4)}\n**Cycle:** #${data.cycle || 0}\n**Action:** ${severity === 'CRITICAL' ? 'Morphallaxis triggered' : 'Evolution check scheduled'}`,
          },
        },
        {
          tag: 'hr',
        },
        {
          tag: 'note',
          elements: [
            {
              tag: 'plain_text',
              content: `Engine: SOLARIS v${VERSION} | Threshold: φ-1 = 0.618`,
            },
          ],
        },
      ],
    },
  };
}

function buildCostThresholdCard(data) {
  return {
    msg_type: 'interactive',
    card: {
      config: { wide_screen_mode: true },
      header: {
        title: { tag: 'plain_text', content: 'ANIMA OS — Cost Threshold Breach' },
        template: 'orange',
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**Agent:** ${data.agent || 'Unknown'}\n**Model:** ${data.model || 'Unknown'}\n**Cost:** $${(data.cost_usd || 0).toFixed(4)}\n**Tokens:** ${data.tokens || 0}\n**Threshold:** $${data.threshold || 1.00}\n**Cycle:** #${data.cycle || 0}`,
          },
        },
        {
          tag: 'hr',
        },
        {
          tag: 'note',
          elements: [
            {
              tag: 'plain_text',
              content: `Engine: SOLARIS v${VERSION} | Cost tracking active`,
            },
          ],
        },
      ],
    },
  };
}

function buildTunnelingCard(data) {
  return {
    msg_type: 'interactive',
    card: {
      config: { wide_screen_mode: true },
      header: {
        title: { tag: 'plain_text', content: 'ANIMA OS — Quantum Tunneling Event' },
        template: 'purple',
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**Agent:** ${data.agent || 'Unknown'}\n**Stagnation Cycles:** ${data.stagnation_cycles || 0} (threshold: π² ≈ 9.87)\n**Previous Score:** ${(data.previous_score || 0).toFixed(4)}\n**Tunnel Score:** ${(data.tunnel_score || 0).toFixed(4)}\n**Band:** [0.618, 0.680]\n**Result:** Escaped local optimum`,
          },
        },
        {
          tag: 'hr',
        },
        {
          tag: 'note',
          elements: [
            {
              tag: 'plain_text',
              content: `Engine: SOLARIS v${VERSION} | Law 9: Quantum Tunneling`,
            },
          ],
        },
      ],
    },
  };
}

// --- Send Function ---

/**
 * Send a notification to Lark.
 * @param {'evolution'|'alignment_drop'|'cost_threshold'|'tunneling'} eventType
 * @param {object} data — Event-specific data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendLarkNotification(eventType, data) {
  if (!LARK_WEBHOOK_URL) {
    return { success: false, error: 'LARK_WEBHOOK_URL not configured' };
  }

  let card;
  switch (eventType) {
    case 'evolution':
      card = buildEvolutionCard(data);
      break;
    case 'alignment_drop':
      card = buildAlignmentDropCard(data);
      break;
    case 'cost_threshold':
      card = buildCostThresholdCard(data);
      break;
    case 'tunneling':
      card = buildTunnelingCard(data);
      break;
    default:
      return { success: false, error: `Unknown event type: ${eventType}` };
  }

  const payload = JSON.stringify(card);

  return new Promise((resolve) => {
    try {
      const url = new URL(LARK_WEBHOOK_URL);

      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve({ success: true });
          } else {
            resolve({ success: false, error: `HTTP ${res.statusCode}: ${body}` });
          }
        });
      });

      req.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });

      req.setTimeout(5000, () => {
        req.destroy();
        resolve({ success: false, error: 'Request timed out (5s)' });
      });

      req.write(payload);
      req.end();
    } catch (err) {
      resolve({ success: false, error: err.message });
    }
  });
}

// --- CLI execution ---
if (require.main === module) {
  const eventType = process.argv[2] || 'evolution';
  const testData = {
    evolution: { cycle: 42, alignment: 0.854, mutation: 'Strategy shift', spawned: 1, pruned: 0 },
    alignment_drop: { agent: 'PRIMARY_CELL', alignment: 0.312, vitality: 0.456, cycle: 42 },
    cost_threshold: { agent: 'ROOT_ORCHESTRATOR', model: 'claude-3-opus', cost_usd: 2.45, tokens: 15000, threshold: 1.00, cycle: 42 },
    tunneling: { agent: 'EVOLUTION_NODE', stagnation_cycles: 11, previous_score: 0.45, tunnel_score: 0.652 },
  };

  console.log(`Sending test ${eventType} notification to Lark...`);
  sendLarkNotification(eventType, testData[eventType] || testData.evolution)
    .then((result) => {
      if (result.success) {
        console.log('Sent successfully.');
      } else {
        console.log(`Failed: ${result.error}`);
      }
    });
}

module.exports = { sendLarkNotification };
