/**
 * Tests for swarm — collective intelligence and coordination.
 */

const {
  voteWeight,
  phiVote,
  createPheromoneTrail,
  distributeLoad,
  maxAgentsAtDepth,
  isAtCapacity,
  swarmCohesion,
  spawnEfficiency,
} = require('../swarm');

console.log('=== SWARM TESTS ===\n');

function assert(condition, message) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`  PASS: ${message}`);
  }
}

// --- Vote Weight ---
console.log('--- Vote Weight ---');

const weight = voteWeight({ phi_weight: 0.618, vitality_score: 0.8, mission_alignment: 0.9 });
assert(weight > 0, 'Vote weight is positive');
assert(Math.abs(weight - 0.618 * 0.8 * 0.9) < 0.001, 'Vote weight = phi * vitality * alignment');

// --- Phi Vote ---
console.log('\n--- Phi Vote ---');

const voters = [
  { branch_id: 'A', phi_weight: 0.618, vitality_score: 0.8, mission_alignment: 0.9, status: 'ALIVE', preferred_option: 'X' },
  { branch_id: 'B', phi_weight: 0.382, vitality_score: 0.7, mission_alignment: 0.8, status: 'ALIVE', preferred_option: 'Y' },
];

const vote = phiVote(voters, ['X', 'Y']);
assert(vote.decision !== null, 'Vote produces a decision');
assert(vote.total_weight > 0, 'Total weight is positive');
assert(typeof vote.reached_phi_consensus === 'boolean', 'Consensus status returned');

// --- Pheromone Trail ---
console.log('\n--- Pheromone Trail ---');

const trail = createPheromoneTrail('task-1', 'PRIMARY_CELL', { success: true, alignment: 0.9, cost_usd: 0.01 });
assert(trail.task_id === 'task-1', 'Task ID recorded');
assert(trail.success_pheromone > 0, 'Success pheromone is positive');
assert(trail.alignment_pheromone === 0.9, 'Alignment pheromone recorded');

const failTrail = createPheromoneTrail('task-2', 'AGENT', { success: false, alignment: 0.3 });
assert(failTrail.success_pheromone === 0.1, 'Failed trail has minimal pheromone');

// --- Load Distribution ---
console.log('\n--- Load Distribution ---');

const tasks = [
  { id: '1', complexity: 9, urgency: 1.0, mission_alignment: 0.95 },
  { id: '2', complexity: 7, urgency: 0.8, mission_alignment: 0.7 },
  { id: '3', complexity: 3, urgency: 0.3, mission_alignment: 0.4 },
  { id: '4', complexity: 5, urgency: 0.5, mission_alignment: 0.6 },
  { id: '5', complexity: 8, urgency: 0.9, mission_alignment: 0.85 },
];

const dist = distributeLoad(tasks);
assert(dist.primary.length + dist.support.length === 5, 'All tasks distributed');
assert(dist.primary.length === Math.ceil(5 * 0.618), 'Primary gets 61.8%');
assert(dist.support.length === 5 - Math.ceil(5 * 0.618), 'Support gets 38.2%');

// --- Fibonacci Agent Limits ---
console.log('\n--- Agent Limits ---');

assert(maxAgentsAtDepth(0) === 1, 'Depth 0: 1 agent');
assert(maxAgentsAtDepth(1) === 1, 'Depth 1: 1 agent');
assert(maxAgentsAtDepth(2) === 2, 'Depth 2: 2 agents');
assert(maxAgentsAtDepth(3) === 3, 'Depth 3: 3 agents');
assert(maxAgentsAtDepth(4) === 5, 'Depth 4: 5 agents');
assert(maxAgentsAtDepth(5) === 8, 'Depth 5: 8 agents');

// --- Capacity ---
console.log('\n--- Capacity ---');

const agents = [
  { depth: 0, status: 'ALIVE' },
  { depth: 1, status: 'ALIVE' },
];
assert(isAtCapacity(agents) === true, 'Depth 0 and 1 at Fibonacci limits');

// --- Swarm Health ---
console.log('\n--- Swarm Health ---');

const cohesion = swarmCohesion([
  { mission_alignment: 0.8, status: 'ALIVE' },
  { mission_alignment: 0.85, status: 'ALIVE' },
  { mission_alignment: 0.82, status: 'ALIVE' },
]);
assert(cohesion < 0.2, 'High cohesion (low std dev) for similar alignments');

const efficiency = spawnEfficiency([
  { status: 'ALIVE' },
  { status: 'ALIVE' },
  { status: 'PRUNED' },
]);
assert(Math.abs(efficiency - 2/3) < 0.01, 'Spawn efficiency = alive/total');

console.log('\n=== ALL TESTS COMPLETE ===\n');
