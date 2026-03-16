/**
 * ANIMA OS Runtime — Unified entry point for all runtime modules.
 * 
 * Usage:
 *   const runtime = require('./runtime');
 *   runtime.calculateVitality(depth, alignment, cycleAge, fractalScore);
 *   runtime.routeTask(task, agents);
 *   runtime.llm.callLLM({ mode, model, systemPrompt, userPrompt });
 *   runtime.execution.ExecutionEngine;
 */

const naturalLaw = require('./natural_law');
const phiCore = require('./phi_core');
const quantumEngine = require('./quantum_engine');
const swarm = require('./swarm');
const immuneScanner = require('./immune_scanner');
const evolutionEngine = require('./evolution_engine');
const memorySystem = require('./memory_system');
const llmClient = require('./llm_client');
const executionEngine = require('./execution_engine');

module.exports = {
  // Natural Law - Single source of truth for all constants
  ...naturalLaw,
  naturalLaw,
  
  // Core routing (also re-exports natural law for backward compat)
  ...phiCore,
  phiCore,

  // Quantum layer (Laws 6-12)
  quantum: quantumEngine,

  // Swarm intelligence
  swarm,

  // Immune system
  immune: immuneScanner,

  // Evolution engine
  evolution: evolutionEngine,

  // Memory system
  memory: memorySystem,
  
  // NEW: LLM Client (3 modes: openrouter, kimi-claw, openclaw)
  llm: llmClient,
  
  // NEW: Execution Engine (task queue pipeline)
  execution: executionEngine,
  ExecutionEngine: executionEngine.ExecutionEngine,
};
