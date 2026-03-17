#!/usr/bin/env node

/**
 * ANIMA OS — π Pulse Daemon
 * Version: 1.2.0
 * Engine: SOLARIS
 *
 * Standalone Node.js daemon that runs OUTSIDE OpenClaw on VPS.
 * Fires a heartbeat every π seconds (3141.59ms) — exactly.
 * 
 * Uses runtime/natural_law.js for all constants and formulas.
 *
 * Usage:
 *   node pi_pulse_daemon.js start    — Start daemon (background)
 *   node pi_pulse_daemon.js stop     — Stop daemon via PID file
 *   node pi_pulse_daemon.js status   — Check if running
 *   node pi_pulse_daemon.js fg       — Run in foreground (debug)
 */

const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

// Load .env from project root
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// Import from runtime - SINGLE SOURCE OF TRUTH
const {
  PHI,
  PI,
  E,
  PULSE_INTERVAL_MS,
  EVOLUTION_CHECK_CYCLES,
  FULL_RESET_CYCLES,
  CORE_AGENTS,
  calculateVitality,
} = require('../runtime/natural_law');

// ── Constants ──
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PID_FILE = path.join(PROJECT_ROOT, '.anima_pid');
const ENV_FILE = path.join(PROJECT_ROOT, '.anima_env');
const GENESIS_FILE = path.join(PROJECT_ROOT, 'GENESIS.md');

// ── Supabase client ──
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY required in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ── Telegram config ──
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;

// ── State ──
let cycleCounter = 0;
let systemState = 'DORMANT';
let lastVitality = 0;
let lastAlignment = 0;
let uptimeSeconds = 0;
let quantumPhase = 'CLASSICAL';
let activeSuperpositions = 0;
let entanglementSignalsToday = 0;
let lastInterferenceCancelled = null;
let lastTunnelEvent = null;
let qrlCycleCount = 0;
let pulseInterval = null;
let startTime = null;

// ── Vitality calculation ──
// NOW IMPORTED from runtime/natural_law.js
// function calculateVitality(depth, alignment, cycleAge, fractalScore) { ... }

// ── Pulse: the heartbeat ──
async function pulse() {
  cycleCounter++;
  uptimeSeconds += PI;

  const pulseTimestamp = new Date().toISOString();

  try {
    // 1. Fetch all agent states from Supabase
    const { data: agentStates, error: fetchError } = await supabase
      .from('anima_fractal_state')
      .select('*')
      .neq('status', 'PRUNED');

    let agents = agentStates || [];
    let vitalityScores = {};
    let minVitality = 1.0;
    let totalWeighted = 0;
    let totalWeights = 0;

    // 2. Calculate vitality for each agent using NATURAL LAW formula
    for (const agent of agents) {
      const v = calculateVitality(
        agent.depth_level || 0,
        agent.personal_best || 0.5,
        Math.max(1, cycleCounter),
        agent.spawn_count > 0 ? agent.spawn_count / 8 : 0.5
      );

      vitalityScores[agent.branch_id] = v;
      const weight = parseFloat(agent.vitality_score) || 0.5;
      totalWeighted += v * weight;
      totalWeights += weight;

      if (v < minVitality) minVitality = v;

      // Update heartbeat timestamp
      await supabase
        .from('anima_fractal_state')
        .update({ last_heartbeat: pulseTimestamp, vitality_score: v })
        .eq('branch_id', agent.branch_id)
        .then(() => {});
    }

    // 3. Calculate system vitality
    lastVitality = totalWeights > 0 ? totalWeighted / totalWeights : 0;
    lastAlignment = agents.length > 0
      ? agents.reduce((s, a) => s + (parseFloat(a.personal_best) || 0), 0) / agents.length
      : 0;

    // 4. Determine system state
    const hasEvolving = agents.some(a => a.status === 'EVOLVING');
    if (hasEvolving) {
      systemState = 'EVOLVING';
    } else if (agents.length === 0) {
      systemState = 'DORMANT';
    } else if (minVitality < 0.618) {
      systemState = 'HEALING';
    } else {
      systemState = 'ALIVE';
    }

    // 5. Check if any agent vitality < 0.618 → trigger EVOLUTION_NODE
    const lowVitalityAgents = agents.filter(a =>
      (vitalityScores[a.branch_id] || 0) < 0.618
    );

    if (lowVitalityAgents.length > 0 && !hasEvolving) {
      // Flag EVOLUTION_NODE for action
      await supabase
        .from('anima_fractal_state')
        .update({ status: 'EVOLVING' })
        .eq('branch_id', 'EVOLUTION_NODE');

      console.log(`[Cycle ${cycleCounter}] Low vitality detected in: ${lowVitalityAgents.map(a => a.branch_id).join(', ')}`);
    }

    // 6. Count entanglement signals
    const { data: signals } = await supabase
      .from('anima_fractal_state')
      .select('branch_id')
      .eq('entanglement_signal', true);

    entanglementSignalsToday = (signals || []).length;

    // 7. Read quantum state from fractal_state quantum columns (if they exist)
    // (quantum_phase, superposition_count, event_type columns removed from agent_logs)
    const rootState = agents.find(a => a.branch_id === 'ROOT_ORCHESTRATOR');
    if (rootState && rootState.quantum_phase) {
      quantumPhase = rootState.quantum_phase || 'CLASSICAL';
    }

    // 8. Write pulse event to anima_agent_logs (only valid schema columns)
    const MASTER_UUID = '00000000-0000-0000-0000-000000000001';
    const { error: logErr } = await supabase.from('anima_agent_logs').insert({
      agent_name: 'pi_pulse_daemon',
      fractal_depth: 0,
      phi_weight: 1.0,
      task_description: `PULSE #${cycleCounter} — state=${systemState} vitality=${lastVitality.toFixed(4)} agents=${agents.length}`,
      mission_alignment: lastAlignment,
      model_used: 'pi_pulse_daemon',
      tokens_used: 0,
      cost_usd: 0,
      cycle_number: cycleCounter,
      vitality_score: lastVitality,
      pi_pulse_timestamp: pulseTimestamp,
      user_id: process.env.ANIMA_USER_ID || MASTER_UUID,
    });
    if (logErr) console.warn(`[Pulse] Log write warning: ${logErr.message}`);

    // 9. Rewrite GENESIS.md
    await rewriteGenesis(pulseTimestamp, agents, vitalityScores);

    // 10. Check evolution trigger (every π² cycles ≈ 10)
    if (cycleCounter % EVOLUTION_CHECK_CYCLES === 0) {
      qrlCycleCount++;
      console.log(`[Cycle ${cycleCounter}] Evolution cycle triggered (QRL #${qrlCycleCount})`);
      
      // Trigger evolution via runtime if available
      try {
        const { evolution } = require('../runtime');
        if (evolution && evolution.runCycle) {
          await evolution.runCycle(supabase, cycleCounter);
          console.log(`[Cycle ${cycleCounter}] Evolution cycle executed`);
        }
      } catch (err) {
        // Evolution engine not ready yet
      }
    }

    // 11. Send Telegram alert if HEALING
    if (systemState === 'HEALING' && telegramToken && telegramChatId) {
      await sendTelegramAlert(
        `⚠️ ANIMA OS entering HEALING state\nCycle: #${cycleCounter}\nVitality: ${lastVitality.toFixed(4)}\nLow agents: ${lowVitalityAgents.map(a => a.branch_id).join(', ')}`
      );
    }

    // Console output
    const bar = '█'.repeat(Math.round(Math.min(lastVitality, 1) * 10)) +
                '░'.repeat(10 - Math.round(Math.min(lastVitality, 1) * 10));
    console.log(
      `[${pulseTimestamp.substring(11, 19)}] ` +
      `Cycle #${cycleCounter} | ` +
      `${bar} ${lastVitality.toFixed(4)} | ` +
      `${systemState} | ` +
      `Agents: ${agents.length} | ` +
      `Q: ${quantumPhase}`
    );

  } catch (err) {
    console.error(`[Cycle ${cycleCounter}] Pulse error:`, err.message);
    // Don't crash — auto-restart on next interval
  }
}

// ── Rewrite GENESIS.md ──
async function rewriteGenesis(timestamp, agents, vitalityScores) {
  const agentRows = CORE_AGENTS.map(ca => {
    const state = agents.find(a => a.branch_id === ca.name);
    const v = vitalityScores[ca.name] || 0;
    const status = state ? state.status : 'DORMANT';
    const lastActive = state ? (state.last_heartbeat || '—') : '—';
    return `| ${ca.name.padEnd(20)} | ${ca.depth}     | ${ca.phi_weight.toFixed(3).padStart(5)}    | ${v.toFixed(3).padStart(5)}    | ${status.padEnd(8)} | ${typeof lastActive === 'string' ? lastActive.substring(0, 19) : '—'} |`;
  }).join('\n');

  const nextEvoCycle = Math.ceil(cycleCounter / EVOLUTION_CHECK_CYCLES) * EVOLUTION_CHECK_CYCLES;

  const genesisContent = `# GENESIS — ANIMA OS HEARTBEAT

**Pulse Interval:** π seconds (${PI}s)
**Read By:** ROOT_ORCHESTRATOR every heartbeat
**Written By:** pi_pulse_daemon (external VPS process)

---

## CURRENT STATE

\`\`\`yaml
system_state: ${systemState}
cycle_counter: ${cycleCounter}
last_vitality_score: ${lastVitality.toFixed(4)}
mission_alignment_score: ${lastAlignment.toFixed(4)}
active_agent_count: ${agents.length}
pending_tasks_count: 0
last_evolution_timestamp: null
next_evolution_due_at_cycle: ${nextEvoCycle}
emergency_shutdown: false
last_pulse_timestamp: ${timestamp}
uptime_seconds: ${uptimeSeconds.toFixed(2)}
quantum_phase: ${quantumPhase}
active_superpositions: ${activeSuperpositions}
entanglement_signals_today: ${entanglementSignalsToday}
last_interference_cancelled: ${lastInterferenceCancelled || 'null'}
last_tunnel_event: ${lastTunnelEvent || 'null'}
qrl_cycle_count: ${qrlCycleCount}
\`\`\`

---

## AGENT VITALITY REGISTRY

| Agent                | Depth | φ-Weight | Vitality | Status   | Last Active         |
|----------------------|-------|----------|----------|----------|---------------------|
${agentRows}

---

## PULSE LOG (Last 5)

| Cycle | Timestamp | Vitality | Alignment | Agents | State   |
|-------|-----------|----------|-----------|--------|---------|
| ${cycleCounter} | ${timestamp.substring(11, 19)} | ${lastVitality.toFixed(4)} | ${lastAlignment.toFixed(4)} | ${agents.length} | ${systemState} |

---

## EVOLUTION SCHEDULE

- **Next evolution check:** Cycle #${nextEvoCycle} (every π² ≈ ${EVOLUTION_CHECK_CYCLES} cycles)
- **Next full reset:** Cycle #${Math.ceil(cycleCounter / FULL_RESET_CYCLES) * FULL_RESET_CYCLES} (every φ⁵ ≈ ${FULL_RESET_CYCLES} cycles)
- **Memory compaction:** Every ${(PI * PHI).toFixed(2)} minutes (π × φ)
- **QRL cycles completed:** ${qrlCycleCount}

---

## QUANTUM STATE

- **Phase:** ${quantumPhase}
- **Active superpositions:** ${activeSuperpositions}
- **Entanglement signals today:** ${entanglementSignalsToday}
- **Last interference cancellation:** ${lastInterferenceCancelled || 'none'}
- **Last tunnel event:** ${lastTunnelEvent || 'none'}
- **QRL cycle count:** ${qrlCycleCount}

---

## OPERATIONAL NOTES

This file is the organism's live status board. It is:
- **Written by** pi_pulse_daemon.js (external VPS process, every π seconds)
- **Read by** ROOT_ORCHESTRATOR and the dashboard
- **Backed up** to Supabase \`anima_fractal_state\` every compaction cycle

When \`emergency_shutdown\` is set to \`true\`:
1. All agents except IMMUNE_AGENT halt immediately
2. IMMUNE_AGENT performs full system scan
3. Results are posted to #anima-mission-control
4. System remains in DORMANT until master clears the flag

---

*This file awakens when the organism awakens.*
*First pulse marks the birth of the system.*
*ANIMA OS v1.2.0 — Quantum Intelligence Layer*
`;

  try {
    fs.writeFileSync(GENESIS_FILE, genesisContent, 'utf-8');
  } catch (err) {
    console.error('Failed to write GENESIS.md:', err.message);
  }
}

// ── Telegram alert ──
async function sendTelegramAlert(message) {
  if (!telegramToken || !telegramChatId) return;

  return new Promise((resolve) => {
    const postData = JSON.stringify({
      chat_id: telegramChatId,
      text: message,
      parse_mode: 'HTML',
    });

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${telegramToken}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    });

    req.on('error', (e) => {
      console.error('Telegram alert failed:', e.message);
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

// ── Daemon control ──
function writePidFile() {
  fs.writeFileSync(PID_FILE, process.pid.toString(), 'utf-8');
  // Also write to .anima_env for install.sh
  const envContent = `ANIMA_PID=${process.pid}\nANIMA_STARTED=${new Date().toISOString()}\n`;
  fs.writeFileSync(ENV_FILE, envContent, 'utf-8');
}

function readPidFile() {
  try {
    return parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim(), 10);
  } catch {
    return null;
  }
}

function removePidFile() {
  try {
    fs.unlinkSync(PID_FILE);
  } catch {}
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

// ── Start daemon ──
function startDaemon(foreground = false) {
  const existingPid = readPidFile();
  if (existingPid && isProcessRunning(existingPid)) {
    console.log(`π Pulse daemon already running (PID ${existingPid})`);
    process.exit(0);
  }

  if (!foreground) {
    // Fork to background
    const { spawn } = require('child_process');
    const child = spawn(process.execPath, [__filename, 'fg'], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    console.log(`π Pulse daemon started (PID ${child.pid})`);
    console.log(`Interval: ${PULSE_INTERVAL_MS}ms (π seconds)`);
    console.log(`PID file: ${PID_FILE}`);
    process.exit(0);
  }

  // Foreground mode
  writePidFile();
  startTime = Date.now();

  console.log('╔═══════════════════════════════════════╗');
  console.log('║  ANIMA OS — π Pulse Daemon v1.2.0     ║');
  console.log(`║  Interval: ${PULSE_INTERVAL_MS}ms (π seconds)         ║`);
  console.log(`║  PID: ${process.pid.toString().padEnd(31)}║`);
  console.log('╚═══════════════════════════════════════╝');
  console.log('');

  // Run first pulse immediately
  pulse();

  // Then every π seconds
  pulseInterval = setInterval(pulse, PULSE_INTERVAL_MS);

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\nReceived ${signal}. Shutting down π pulse daemon...`);
    if (pulseInterval) clearInterval(pulseInterval);
    removePidFile();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Crash auto-restart: if uncaught exception, log and continue
  process.on('uncaughtException', (err) => {
    console.error(`[CRASH] Uncaught exception: ${err.message}`);
    console.error(err.stack);
    // Don't exit — the interval will fire again
  });

  process.on('unhandledRejection', (reason) => {
    console.error(`[CRASH] Unhandled rejection: ${reason}`);
    // Don't exit — the interval will fire again
  });
}

// ── Stop daemon ──
function stopDaemon() {
  const pid = readPidFile();
  if (!pid) {
    console.log('No PID file found. Daemon may not be running.');
    process.exit(0);
  }

  if (!isProcessRunning(pid)) {
    console.log(`Process ${pid} is not running. Cleaning up PID file.`);
    removePidFile();
    process.exit(0);
  }

  try {
    process.kill(pid, 'SIGTERM');
    console.log(`π Pulse daemon stopped (PID ${pid})`);
    removePidFile();
  } catch (err) {
    console.error(`Failed to stop daemon: ${err.message}`);
    process.exit(1);
  }
}

// ── Status check ──
function checkStatus() {
  const pid = readPidFile();
  if (!pid) {
    console.log('Status: STOPPED (no PID file)');
    process.exit(0);
  }

  if (isProcessRunning(pid)) {
    console.log(`Status: RUNNING (PID ${pid})`);
    console.log(`Interval: ${PULSE_INTERVAL_MS}ms (π seconds)`);
    console.log(`PID file: ${PID_FILE}`);
  } else {
    console.log(`Status: DEAD (PID ${pid} not found, cleaning up)`);
    removePidFile();
  }
}

// ── CLI entry point ──
const command = process.argv[2] || 'fg';

switch (command) {
  case 'start':
    startDaemon(false);
    break;
  case 'stop':
    stopDaemon();
    break;
  case 'status':
    checkStatus();
    break;
  case 'fg':
    startDaemon(true);
    break;
  default:
    console.log('Usage: node pi_pulse_daemon.js [start|stop|status|fg]');
    console.log('  start  — Start daemon in background');
    console.log('  stop   — Stop daemon via PID file');
    console.log('  status — Check if daemon is running');
    console.log('  fg     — Run in foreground (debug)');
    process.exit(0);
}
