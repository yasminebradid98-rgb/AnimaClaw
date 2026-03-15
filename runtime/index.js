/**
 * ANIMA OS Runtime — Unified entry point for all runtime modules.
 */

const phiCore = require('./phi_core');
const quantumEngine = require('./quantum_engine');
const swarm = require('./swarm');
const immuneScanner = require('./immune_scanner');
const evolutionEngine = require('./evolution_engine');
const memorySystem = require('./memory_system');

module.exports = {
  // Core routing
  ...phiCore,

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
};
