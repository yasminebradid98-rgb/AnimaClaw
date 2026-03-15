/**
 * Tests for phi_core — the φ-weighted routing engine.
 */

const {
  PHI, PI, E,
  applyInterference,
  scoreAssignment,
  routeTask,
  qaoaRoute,
  allocateResources,
  harmonicBridge,
} = require('../phi_core');

// --- Constants Tests ---

console.log('=== PHI CORE TESTS ===\n');

function assert(condition, message) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`  PASS: ${message}`);
  }
}

// Constants
assert(Math.abs(PHI - 1.6180339887) < 0.0001, 'PHI is golden ratio');
assert(Math.abs(PI - 3.1415926535) < 0.0001, 'PI is correct');
assert(Math.abs(E - 2.7182818284) < 0.0001, 'E is correct');

// --- Interference Tests ---
console.log('\n--- Interference ---');

const constructive = applyInterference(0.8);
assert(constructive.type === 'CONSTRUCTIVE', 'Score > 0.618 is constructive');
assert(Math.abs(constructive.score - 0.8 * PHI) < 0.001, 'Constructive amplifies by phi');

const destructive = applyInterference(0.3);
assert(destructive.type === 'DESTRUCTIVE', 'Score < 0.618 is destructive');
assert(Math.abs(destructive.score - 0.3 * 0.382) < 0.001, 'Destructive suppresses by 0.382');

const maxed = applyInterference(1.5);
assert(maxed.score <= 1.618, 'Score capped at 1.618 golden ceiling');

const tiny = applyInterference(0.001);
assert(tiny.score < 0.001, 'Tiny scores nearly vanish');

// --- Score Assignment Tests ---
console.log('\n--- Score Assignment ---');

const task = { complexity: 8, urgency: 0.9, mission_alignment: 0.85 };
const agent = { depth: 1, phi_weight: 0.618, vitality_score: 0.8, current_load: 2, max_capacity: 10 };
const score = scoreAssignment(task, agent);
assert(score > 0, 'Score assignment produces positive score');

// --- Route Task Tests ---
console.log('\n--- Route Task ---');

const agents = [
  { branch_id: 'PRIMARY_CELL', depth: 1, phi_weight: 0.618, vitality_score: 0.8, status: 'ALIVE', current_load: 1, max_capacity: 10 },
  { branch_id: 'SUPPORT_CELL', depth: 1, phi_weight: 0.382, vitality_score: 0.7, status: 'ALIVE', current_load: 1, max_capacity: 10 },
  { branch_id: 'PRUNED_AGENT', depth: 2, phi_weight: 0.236, vitality_score: 0.1, status: 'PRUNED', current_load: 0, max_capacity: 10 },
];

const routing = routeTask(task, agents);
assert(routing.agent === 'PRIMARY_CELL', 'High-priority task routes to PRIMARY_CELL');
assert(routing.score > 0, 'Routing produces positive score');
assert(routing.interference !== null, 'Interference type is recorded');

// --- QAOA Tests ---
console.log('\n--- QAOA Routing ---');

const tasks = [
  { id: 'task1', complexity: 9, urgency: 1.0, mission_alignment: 0.95 },
  { id: 'task2', complexity: 5, urgency: 0.5, mission_alignment: 0.6 },
  { id: 'task3', complexity: 3, urgency: 0.3, mission_alignment: 0.4 },
];

const qaoa = qaoaRoute(tasks, agents.filter(a => a.status === 'ALIVE'));
assert(qaoa.assignments.length > 0, 'QAOA produces assignments');
assert(qaoa.assignments.length <= tasks.length, 'No more assignments than tasks');
assert(qaoa.pairings_evaluated > 0, 'QAOA evaluated pairings');
assert(qaoa.unassigned >= 0, 'Unassigned count is non-negative');

// --- Allocation Tests ---
console.log('\n--- Resource Allocation ---');

const alloc = allocateResources(1000, 'PRIMARY', 'SUPPORT');
assert(Math.abs(alloc.PRIMARY - 618) < 1, 'Primary gets 61.8%');
assert(Math.abs(alloc.SUPPORT - 382) < 1, 'Secondary gets 38.2%');
assert(Math.abs(alloc.PRIMARY + alloc.SUPPORT - 1000) < 1, 'Total is preserved');

// --- Harmonic Bridge Tests ---
console.log('\n--- Harmonic Bridge ---');

const hb = harmonicBridge(0.618);
assert(hb > 0, 'Harmonic bridge produces positive timing');
assert(hb < PI * 2, 'Timing is within reasonable range');

console.log('\n=== ALL TESTS COMPLETE ===\n');
