#!/usr/bin/env node

/**
 * ANIMA OS — Connection Verification
 * Version: 1.0.0
 * Engine: SOLARIS
 *
 * Checks all required connections are live:
 * - Supabase (database + tables)
 * - Discord (bot + channels)
 * - Telegram (bot)
 * - Environment variables
 *
 * Usage: node verify.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// ANSI colors
const GOLD = '\x1b[33m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

const PASS = `${GREEN}✓${RESET}`;
const FAIL = `${RED}✗${RESET}`;
const SKIP = `${GOLD}○${RESET}`;

const results = {
  passed: 0,
  failed: 0,
  skipped: 0
};

function pass(msg) {
  console.log(`  ${PASS} ${msg}`);
  results.passed++;
}

function fail(msg) {
  console.log(`  ${FAIL} ${msg}`);
  results.failed++;
}

function skip(msg) {
  console.log(`  ${SKIP} ${msg}`);
  results.skipped++;
}

async function checkEnvVars() {
  console.log(`\n${BLUE}[1/7]${RESET} Environment Variables`);
  console.log('  ─────────────────────────────────────');

  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'DISCORD_BOT_TOKEN',
    'DISCORD_GUILD_ID',
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_CHAT_ID',
    'OPENROUTER_API_KEY'
  ];

  for (const varName of required) {
    const value = process.env[varName];
    if (value && value.length > 0) {
      const masked = value.substring(0, 8) + '...' + value.substring(value.length - 4);
      pass(`${varName} = ${masked}`);
    } else {
      fail(`${varName} — not set`);
    }
  }
}

async function checkSupabase() {
  console.log(`\n${BLUE}[2/7]${RESET} Supabase Connection`);
  console.log('  ─────────────────────────────────────');

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    skip('Supabase credentials not configured — skipping');
    return;
  }

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(url, key);

    // Test connection by querying each table
    const tables = [
      'anima_agent_logs',
      'anima_fractal_state',
      'anima_evolution_log',
      'anima_cost_tracker',
      'anima_master_profile'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('id').limit(1);
        if (error) {
          if (error.code === '42P01') {
            fail(`Table ${table} — does not exist (run supabase_schema.sql)`);
          } else if (error.code === 'PGRST301') {
            // RLS policy blocking — table exists but no auth
            pass(`Table ${table} — exists (RLS active)`);
          } else {
            fail(`Table ${table} — ${error.message}`);
          }
        } else {
          pass(`Table ${table} — accessible`);
        }
      } catch (e) {
        fail(`Table ${table} — ${e.message}`);
      }
    }

    // Test helper functions
    try {
      const { data, error } = await supabase.rpc('calculate_vitality', {
        p_depth: 0,
        p_alignment: 0.8,
        p_cycle_age: 1,
        p_fractal_score: 1.0
      });
      if (error) {
        if (error.code === '42883') {
          fail('Function calculate_vitality — not found (run supabase_schema.sql)');
        } else {
          fail(`Function calculate_vitality — ${error.message}`);
        }
      } else {
        pass(`Function calculate_vitality — returns ${data}`);
      }
    } catch (e) {
      fail(`Function calculate_vitality — ${e.message}`);
    }

  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      fail('Supabase JS client not installed — run: npm install @supabase/supabase-js');
    } else {
      fail(`Supabase connection — ${e.message}`);
    }
  }
}

async function checkDiscord() {
  console.log(`\n${BLUE}[3/7]${RESET} Discord Connection`);
  console.log('  ─────────────────────────────────────');

  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!token || !guildId) {
    skip('Discord credentials not configured — skipping');
    return;
  }

  try {
    const { Client, GatewayIntentBits } = require('discord.js');
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });

    await client.login(token);
    pass(`Bot logged in as ${client.user.tag}`);

    const guild = await client.guilds.fetch(guildId);
    pass(`Connected to server: ${guild.name}`);

    // Check for ANIMA channels
    const channels = await guild.channels.fetch();
    const expectedChannels = [
      'anima-mission-control', 'root-orchestrator', 'primary-cell',
      'support-cell', 'memory-node', 'evolution-node', 'immune-system',
      'genesis-heartbeat', 'cost-tracker', 'master-profile'
    ];

    let foundCount = 0;
    for (const name of expectedChannels) {
      const found = channels.find(c => c && c.name === name);
      if (found) {
        foundCount++;
      }
    }

    if (foundCount === expectedChannels.length) {
      pass(`All ${expectedChannels.length} channels found`);
    } else if (foundCount > 0) {
      fail(`${foundCount}/${expectedChannels.length} channels found — run discord_setup.js`);
    } else {
      fail('No ANIMA channels found — run discord_setup.js');
    }

    await client.destroy();

  } catch (e) {
    if (e.code === 'TokenInvalid') {
      fail('Invalid Discord bot token');
    } else if (e.code === 'MODULE_NOT_FOUND') {
      fail('discord.js not installed — run: npm install discord.js');
    } else {
      fail(`Discord — ${e.message}`);
    }
  }
}

async function checkTelegram() {
  console.log(`\n${BLUE}[4/7]${RESET} Telegram Connection`);
  console.log('  ─────────────────────────────────────');

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token) {
    skip('TELEGRAM_BOT_TOKEN not configured — skipping');
    return;
  }

  try {
    const https = require('https');

    const response = await new Promise((resolve, reject) => {
      const url = `https://api.telegram.org/bot${token}/getMe`;
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        });
      }).on('error', reject);
    });

    if (response.ok) {
      pass(`Bot connected: @${response.result.username}`);
    } else {
      fail(`Telegram API error: ${response.description}`);
    }

    if (chatId) {
      pass(`Chat ID configured: ${chatId}`);
    } else {
      fail('TELEGRAM_CHAT_ID not set');
    }

  } catch (e) {
    fail(`Telegram — ${e.message}`);
  }
}

async function checkQuantumLayer() {
  console.log(`\n${BLUE}[5/7]${RESET} Quantum Layer (Laws 6-12)`);
  console.log('  ─────────────────────────────────────');

  const fs = require('fs');
  const rootDir = path.resolve(__dirname, '..');

  // Check quantum files exist
  const quantumFiles = [
    'QUANTUM_CONSTITUTION.md',
    'skills/quantum_layer/SKILL.md',
    'runtime/quantum_engine.js',
    'core/anima_config.json',
    'core/SOUL.md',
  ];

  for (const file of quantumFiles) {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      pass(`${file} — exists`);
    } else {
      fail(`${file} — missing`);
    }
  }

  // Check entanglement pairs in natural_law.json
  try {
    const nlPath = path.join(rootDir, 'natural_law.json');
    if (fs.existsSync(nlPath)) {
      const nl = JSON.parse(fs.readFileSync(nlPath, 'utf-8'));
      const agents = nl.agent_registry || {};
      const pairs = [
        ['primary_cell', 'evolution_node'],
        ['memory_node', 'immune_agent'],
        ['root_orchestrator', 'support_cell'],
      ];
      let pairsFound = 0;
      for (const [a, b] of pairs) {
        if (agents[a] && agents[b]) pairsFound++;
      }
      if (pairsFound === 3) {
        pass('All 3 entanglement pairs registered in natural_law.json');
      } else {
        fail(`${pairsFound}/3 entanglement pairs found in natural_law.json`);
      }
    } else {
      fail('natural_law.json — not found');
    }
  } catch (e) {
    fail(`natural_law.json — ${e.message}`);
  }
}

async function checkDaemon() {
  console.log(`\n${BLUE}[6/7]${RESET} Pi Pulse Daemon`);
  console.log('  ─────────────────────────────────────');

  const fs = require('fs');
  const rootDir = path.resolve(__dirname, '..');
  const pidFile = path.join(rootDir, '.anima_daemon.pid');

  if (!fs.existsSync(pidFile)) {
    skip('Daemon PID file not found — daemon not running');
    return;
  }

  try {
    const pid = parseInt(fs.readFileSync(pidFile, 'utf-8').trim());
    if (isNaN(pid)) {
      fail('Invalid PID in .anima_daemon.pid');
      return;
    }

    try {
      process.kill(pid, 0); // Signal 0 = check if process exists
      pass(`π-pulse daemon running (PID: ${pid})`);
    } catch {
      fail(`Daemon PID ${pid} not running — restart with: node setup/pi_pulse_daemon.js start`);
    }
  } catch (e) {
    fail(`Cannot read PID file — ${e.message}`);
  }
}

async function checkQuantumColumns() {
  console.log(`\n${BLUE}[7/7]${RESET} Supabase Quantum Columns`);
  console.log('  ─────────────────────────────────────');

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    skip('Supabase not configured — skipping quantum column check');
    return;
  }

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(url, key);

    // Check for quantum-specific columns in anima_fractal_state
    const quantumColumns = [
      'entanglement_signal',
      'personal_best',
      'global_best',
      'qrl_cycle',
      'quantum_phase',
    ];

    const { data, error } = await supabase
      .from('anima_fractal_state')
      .select(quantumColumns.join(','))
      .limit(1);

    if (error) {
      if (error.message && error.message.includes('column')) {
        fail(`Quantum columns missing in anima_fractal_state — run schema migration`);
      } else if (error.code === 'PGRST301') {
        pass('anima_fractal_state accessible (RLS active, columns assumed present)');
      } else {
        fail(`Quantum column check — ${error.message}`);
      }
    } else {
      pass(`Quantum columns present: ${quantumColumns.join(', ')}`);
    }
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      skip('Supabase client not installed — skipping');
    } else {
      fail(`Quantum column check — ${e.message}`);
    }
  }
}

async function main() {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║  ANIMA OS — Connection Verification   ║');
  console.log('║  Engine: SOLARIS v1.2.0               ║');
  console.log('╚═══════════════════════════════════════╝');

  await checkEnvVars();
  await checkSupabase();
  await checkDiscord();
  await checkTelegram();
  await checkQuantumLayer();
  await checkDaemon();
  await checkQuantumColumns();

  // Summary
  console.log('\n═══════════════════════════════════════');
  console.log('  VERIFICATION SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`  ${PASS} Passed:  ${results.passed}`);
  console.log(`  ${FAIL} Failed:  ${results.failed}`);
  console.log(`  ${SKIP} Skipped: ${results.skipped}`);
  console.log('');

  if (results.failed === 0) {
    console.log(`  ${GREEN}All systems operational. The organism is ready.${RESET}`);
  } else {
    console.log(`  ${GOLD}Some checks failed. Fix the issues above and re-run:${RESET}`);
    console.log('  node setup/verify.js');
  }
  console.log('');

  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch(e => {
  console.error(`\n${RED}Unexpected error: ${e.message}${RESET}`);
  process.exit(1);
});
