#!/usr/bin/env node

/**
 * EXECUTOR — PM2-runnable Task Execution Daemon
 * Version: 1.0.0
 * Engine: SOLARIS
 *
 * Usage:
 *   pm2 start runtime/executor.js --name AnimaExecutor
 *   pm2 start runtime/executor.js --name AnimaExecutor -- interval 1000
 *
 * This daemon continuously processes tasks from anima_task_queue.
 */

const path = require('path');
const fs = require('fs');

// Load .env from project root
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { ExecutionEngine } = require('./execution_engine');

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const PID_FILE = path.join(__dirname, '..', '.anima_executor_pid');
const INTERVAL_MS = parseInt(process.argv[2]) || parseInt(process.env.ANIMA_EXECUTOR_INTERVAL) || 1000;

// ═══════════════════════════════════════════════════════════════════
// DAEMON CONTROL
// ═══════════════════════════════════════════════════════════════════

function writePidFile() {
  fs.writeFileSync(PID_FILE, process.pid.toString(), 'utf-8');
}

function removePidFile() {
  try {
    fs.unlinkSync(PID_FILE);
  } catch {}
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

async function main() {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║  ANIMA OS — Task Executor v1.0.0                  ║');
  console.log(`║  Interval: ${INTERVAL_MS}ms                        ║`);
  console.log(`║  PID: ${process.pid.toString().padEnd(37)}║`);
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log();

  writePidFile();

  // Create engine from environment
  let engine;
  try {
    engine = ExecutionEngine.fromEnv();
  } catch (error) {
    console.error('Failed to initialize:', error.message);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n[Executor] Received ${signal}, stopping...`);
    engine.stop();
    removePidFile();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    console.error('[Executor] Uncaught exception:', err);
    // Don't exit — let PM2 restart
  });

  // Run loop
  try {
    await engine.runLoop({
      continuous: true,
      intervalMs: INTERVAL_MS,
    });
  } catch (error) {
    console.error('[Executor] Fatal error:', error);
    removePidFile();
    process.exit(1);
  }
}

main();
