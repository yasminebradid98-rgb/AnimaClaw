#!/usr/bin/env node

/**
 * ANIMA OS CLI — Command-line interface for managing the organism.
 *
 * Usage:
 *   node runtime/cli.js <command>
 *
 * Commands:
 *   status    — Show system state from GENESIS.md
 *   health    — Run health checks on all integrations
 *   agents    — List all agents with vitality scores
 *   pulse     — Trigger a single heartbeat pulse
 *   evolve    — Trigger an evolution cycle
 *   compact   — Run memory compaction
 *   immune    — Run immune scan
 *   version   — Show version info
 */

const fs = require('fs');
const path = require('path');
const { PHI, PI, E, AGENT_REGISTRY } = require('./phi_core');

const ROOT = path.resolve(__dirname, '..');
const GENESIS_PATH = path.join(ROOT, 'GENESIS.md');
const NATURAL_LAW_PATH = path.join(ROOT, 'natural_law.json');

// --- HELPERS ---

function readGenesis() {
  try {
    const content = fs.readFileSync(GENESIS_PATH, 'utf-8');
    const yamlMatch = content.match(/```yaml\n([\s\S]*?)```/);
    if (!yamlMatch) return {};
    const yaml = yamlMatch[1];
    const state = {};
    for (const line of yaml.split('\n')) {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length) {
        const value = valueParts.join(':').trim();
        state[key.trim()] = value === 'null' ? null : value === 'true' ? true : value === 'false' ? false : isNaN(value) ? value : parseFloat(value);
      }
    }
    return state;
  } catch {
    return {};
  }
}

function readNaturalLaw() {
  try {
    return JSON.parse(fs.readFileSync(NATURAL_LAW_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function bar(value, max = 1.0, width = 20) {
  const filled = Math.round((value / max) * width);
  return '\u2588'.repeat(Math.max(0, filled)) + '\u2591'.repeat(Math.max(0, width - filled));
}

function colorize(text, code) {
  return `\x1b[${code}m${text}\x1b[0m`;
}

const gold = t => colorize(t, 33);
const green = t => colorize(t, 32);
const red = t => colorize(t, 31);
const blue = t => colorize(t, 34);
const dim = t => colorize(t, 90);

// --- COMMANDS ---

function cmdStatus() {
  const state = readGenesis();
  console.log();
  console.log(gold('  \u2501\u2501\u2501 ANIMA PULSE \u2501\u2501\u2501'));
  console.log(`  State:     ${state.system_state === 'ALIVE' ? green(state.system_state) : red(state.system_state || 'DORMANT')}`);
  console.log(`  Cycle:     #${state.cycle_counter || 0}`);
  console.log(`  Vitality:  ${bar(state.last_vitality_score || 0)} ${(state.last_vitality_score || 0).toFixed(3)}`);
  console.log(`  Alignment: ${bar(state.mission_alignment_score || 0)} ${(state.mission_alignment_score || 0).toFixed(3)}`);
  console.log(`  Agents:    ${state.active_agent_count || 0} active`);
  console.log(`  Tasks:     ${state.pending_tasks_count || 0} pending`);
  console.log(`  Uptime:    ${state.uptime_seconds || 0}s`);
  console.log(`  Emergency: ${state.emergency_shutdown ? red('YES') : green('NO')}`);
  console.log(gold('  \u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501'));
  console.log();
}

function cmdAgents() {
  console.log();
  console.log(gold('  AGENT REGISTRY'));
  console.log(dim('  \u2500'.repeat(60)));

  for (const [name, info] of Object.entries(AGENT_REGISTRY)) {
    const depthBar = '\u00b7'.repeat(info.depth * 2);
    const phiStr = info.phi_weight.toFixed(3);
    console.log(`  ${depthBar}${name.padEnd(22 - info.depth * 2)} d=${info.depth}  \u03c6=${gold(phiStr)}  parent=${dim(info.parent || 'ROOT')}`);
  }

  console.log();
  console.log(dim(`  Total: ${Object.keys(AGENT_REGISTRY).length} agents | Max depth: 5 | Max agents: 20`));
  console.log();
}

function cmdHealth() {
  console.log();
  console.log(gold('  HEALTH CHECK'));
  console.log(dim('  \u2500'.repeat(40)));

  // Check files
  const files = [
    'CONSTITUTION.md', 'SOUL_TEMPLATE.md', 'GENESIS.md',
    'natural_law.json', 'openclaw.json', 'SOLARIS.md',
  ];
  for (const file of files) {
    const exists = fs.existsSync(path.join(ROOT, file));
    console.log(`  ${exists ? green('\u2713') : red('\u2717')} ${file}`);
  }

  // Check agents
  console.log();
  const agentFiles = ['ROOT_ORCHESTRATOR', 'PRIMARY_CELL', 'SUPPORT_CELL', 'MEMORY_NODE', 'EVOLUTION_NODE', 'IMMUNE_AGENT'];
  for (const agent of agentFiles) {
    const exists = fs.existsSync(path.join(ROOT, 'agents', `${agent}.md`));
    console.log(`  ${exists ? green('\u2713') : red('\u2717')} agents/${agent}.md`);
  }

  // Check skills
  console.log();
  const skills = ['phi_core', 'pi_pulse', 'fractal_spawn', 'supabase_memory', 'discord_nerve', 'telegram_pulse', 'quantum_layer'];
  for (const skill of skills) {
    const exists = fs.existsSync(path.join(ROOT, 'skills', skill, 'SKILL.md'));
    console.log(`  ${exists ? green('\u2713') : red('\u2717')} skills/${skill}/SKILL.md`);
  }

  // Check runtime
  console.log();
  const runtimeFiles = ['phi_core.js', 'quantum_engine.js', 'swarm.js', 'immune_scanner.js', 'evolution_engine.js', 'memory_system.js'];
  for (const file of runtimeFiles) {
    const exists = fs.existsSync(path.join(ROOT, 'runtime', file));
    console.log(`  ${exists ? green('\u2713') : red('\u2717')} runtime/${file}`);
  }

  // Check env
  console.log();
  const envExists = fs.existsSync(path.join(ROOT, '.env'));
  console.log(`  ${envExists ? green('\u2713') : red('\u2717')} .env file`);

  console.log();
}

function cmdVersion() {
  const law = readNaturalLaw();
  console.log();
  console.log(gold('  ANIMA OS'));
  console.log(`  Version: ${law.version || '1.1.0'}`);
  console.log(`  Engine:  SOLARIS`);
  console.log(`  Author:  Riyad Ketami`);
  console.log(`  Constants:`);
  console.log(`    \u03c6 = ${PHI}`);
  console.log(`    \u03c0 = ${PI}`);
  console.log(`    e = ${E}`);
  console.log(`    Harmonic Bridge = ${(PI / (PHI * PHI)).toFixed(4)}`);
  console.log();
}

function cmdConstants() {
  console.log();
  console.log(gold('  MATHEMATICAL CONSTANTS'));
  console.log(dim('  \u2500'.repeat(50)));
  console.log(`  \u03c6 (phi)     = ${PHI}  ${dim('Structure, hierarchy')}`);
  console.log(`  \u03c0 (pi)      = ${PI}  ${dim('Rhythm, cycles')}`);
  console.log(`  e (euler)    = ${E}  ${dim('Growth, decay')}`);
  console.log();
  console.log(gold('  DERIVED VALUES'));
  console.log(dim('  \u2500'.repeat(50)));
  console.log(`  Primary weight:   ${(0.618).toFixed(3)}  ${dim('(\u03c6 - 1)')}`);
  console.log(`  Secondary weight: ${(0.382).toFixed(3)}  ${dim('(1 - primary)')}`);
  console.log(`  Harmonic bridge:  ${(PI / (PHI * PHI)).toFixed(4)}  ${dim('(\u03c0 / \u03c6\u00b2)')}`);
  console.log(`  Heartbeat:        ${PI.toFixed(2)}s`);
  console.log(`  Compaction:       ${(PI * PHI).toFixed(2)} min`);
  console.log(`  Evolution:        ${(PI * PI).toFixed(2)} cycles`);
  console.log(`  Full reset:       ${Math.pow(PHI, 5).toFixed(2)} cycles`);
  console.log(`  Max amplification: ${Math.exp(PHI * 5).toFixed(0)}  ${dim('(e^(\u03c6\u00d75))')}`);
  console.log(`  Queue timeout:    ${(Math.pow(PHI, 5) * PI).toFixed(1)}s  ${dim('(\u03c6\u2075\u00d7\u03c0)')}`);
  console.log();
}

// --- MAIN ---

const command = process.argv[2];

const commands = {
  status: cmdStatus,
  health: cmdHealth,
  agents: cmdAgents,
  version: cmdVersion,
  constants: cmdConstants,
};

if (!command || command === 'help' || command === '--help') {
  console.log();
  console.log(gold('  ANIMA OS CLI'));
  console.log();
  console.log('  Usage: node runtime/cli.js <command>');
  console.log();
  console.log('  Commands:');
  console.log('    status     Show system state from GENESIS.md');
  console.log('    health     Run file and integration health checks');
  console.log('    agents     List all registered agents');
  console.log('    constants  Show mathematical constants and derived values');
  console.log('    version    Show version info');
  console.log('    help       Show this help message');
  console.log();
} else if (commands[command]) {
  commands[command]();
} else {
  console.error(red(`  Unknown command: ${command}`));
  console.error('  Run "node runtime/cli.js help" for available commands.');
  process.exit(1);
}
