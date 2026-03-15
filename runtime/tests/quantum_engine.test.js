/**
 * Tests for quantum_engine — Laws 6-12 implementation.
 */

const {
  getFibonacciN,
  collapseStrategies,
  shouldForceCollapse,
  getEntangledPartner,
  absorbEntanglementSignal,
  shouldEmitSignal,
  isStagnating,
  selectTunnelCandidates,
  nextPhase,
  calculateQrlShift,
  eulerAmplification,
  qrlUpdate,
  QUANTUM_PHASES,
} = require('../quantum_engine');

console.log('=== QUANTUM ENGINE TESTS ===\n');

function assert(condition, message) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`  PASS: ${message}`);
  }
}

// --- Law 6: Superposition ---
console.log('--- Law 6: Superposition ---');

assert(getFibonacciN(0) === 1, 'Cycle 0 → N=1');
assert(getFibonacciN(1) === 1, 'Cycle 1 → N=1');
assert(getFibonacciN(2) === 2, 'Cycle 2 → N=2');
assert(getFibonacciN(6) === 13, 'Cycle 6 → N=13');
assert(getFibonacciN(7) === 1, 'Cycle 7 wraps → N=1');

const strategies = [
  { description: 'A', alignment: 0.9, urgency: 0.8, phi_weight: 0.618 },
  { description: 'B', alignment: 0.3, urgency: 0.5, phi_weight: 0.382 },
  { description: 'C', alignment: 0.7, urgency: 0.9, phi_weight: 0.618 },
];

const collapsed = collapseStrategies(strategies);
assert(collapsed.length === 3, 'All strategies scored');
assert(collapsed[0].final_score >= collapsed[1].final_score, 'Sorted by score descending');
assert(collapsed[0].interference_type !== undefined, 'Interference type assigned');

// --- Law 7: Entanglement ---
console.log('\n--- Law 7: Entanglement ---');

assert(getEntangledPartner('PRIMARY_CELL') === 'EVOLUTION_NODE', 'PRIMARY_CELL ↔ EVOLUTION_NODE');
assert(getEntangledPartner('MEMORY_NODE') === 'IMMUNE_AGENT', 'MEMORY_NODE ↔ IMMUNE_AGENT');
assert(getEntangledPartner('ROOT_ORCHESTRATOR') === 'SUPPORT_CELL', 'ROOT ↔ SUPPORT');
assert(getEntangledPartner('UNKNOWN') === null, 'Unknown agent has no partner');

const agent = { vitality_score: 0.5 };
const partner = { entanglement_signal: true, personal_best: 0.8 };
const boosted = absorbEntanglementSignal(agent, partner);
assert(boosted.vitality_score > agent.vitality_score, 'Entanglement boosts vitality');
assert(boosted.alignment_boost > 0, 'Alignment boost recorded');

assert(shouldEmitSignal(0.7) === true, 'Emit signal above 0.618');
assert(shouldEmitSignal(0.5) === false, 'No signal below 0.618');

// --- Law 8: Interference (tested in phi_core) ---

// --- Law 9: Tunneling ---
console.log('\n--- Law 9: Tunneling ---');

const stagnating = Array(10).fill(0.650);
assert(isStagnating(stagnating) === true, 'Detects stagnation in [0.618, 0.680] band');

const notStagnating = [0.7, 0.5, 0.8, 0.6, 0.65, 0.7, 0.5, 0.8, 0.6, 0.65];
assert(isStagnating(notStagnating) === false, 'No stagnation with varied vitalities');

const tooShort = [0.65, 0.65, 0.65];
assert(isStagnating(tooShort) === false, 'Not enough history for stagnation');

const logs = [
  { mission_alignment: 0.8, task_description: 'Strategy A' },
  { mission_alignment: 0.3, task_description: 'Strategy B' },
  { mission_alignment: 0.6, task_description: 'Strategy C' },
];
const candidates = selectTunnelCandidates(logs, 2);
assert(candidates.length <= 2, 'Selects at most N candidates');
assert(candidates.every(c => c.mission_alignment > 0.5), 'All candidates above 0.5 alignment');

// --- Law 10: Decoherence ---
console.log('\n--- Law 10: Decoherence ---');

assert(nextPhase('SUPERPOSING') === 'COLLAPSED', 'SUPERPOSING → COLLAPSED');
assert(nextPhase('COLLAPSED') === 'CLASSICAL', 'COLLAPSED → CLASSICAL');
assert(nextPhase('CLASSICAL') === 'SUPERPOSING', 'CLASSICAL → SUPERPOSING');
assert(nextPhase('FORCE_COLLAPSE') === 'COLLAPSED', 'FORCE_COLLAPSE → COLLAPSED');

const pastTime = Date.now() - 10000;
assert(shouldForceCollapse(pastTime) === true, 'Force collapse after >5.08s');
assert(shouldForceCollapse(Date.now()) === false, 'No force collapse for fresh start');

// --- Law 12: QRL ---
console.log('\n--- Law 12: QRL ---');

const shift = calculateQrlShift(0.3, 0.9);
assert(shift.needsShift === true, 'Gap > 0.382 triggers shift');
assert(Math.abs(shift.shiftAmount - 0.6 * 0.382) < 0.001, 'Shift is 38.2% of gap');
assert(shift.newTarget > 0.3, 'New target is higher');

const noShift = calculateQrlShift(0.8, 0.9);
assert(noShift.needsShift === false, 'Small gap does not trigger shift');

const amp = eulerAmplification(0.8, 10);
assert(amp.amplification > 1, 'High performer gets amplification');
assert(amp.vitalityBoost > 0, 'Vitality boost is positive');

const noAmp = eulerAmplification(0.3, 10);
assert(noAmp.amplification === 1, 'Low performer gets no amplification');
assert(noAmp.vitalityBoost === 0, 'No vitality boost');

// QRL Update
const agentsForQrl = [
  { branch_id: 'A', personal_best: 0.3, global_best: 0.9, vitality_score: 0.5, phi_weight: 0.618, status: 'ALIVE' },
  { branch_id: 'B', personal_best: 0.8, global_best: 0.9, vitality_score: 0.7, phi_weight: 0.382, status: 'ALIVE' },
];
const qrl = qrlUpdate(agentsForQrl, 10);
assert(qrl.results.length === 2, 'QRL processes all alive agents');
assert(qrl.global_best >= 0.8, 'Global best is tracked');

console.log('\n=== ALL TESTS COMPLETE ===\n');
