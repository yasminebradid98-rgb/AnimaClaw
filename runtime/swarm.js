/**
 * SWARM — Swarm Intelligence Coordination Layer
 * Governs agent collaboration, collective decisions, and pheromone trails.
 */

const { PHI, PI, applyInterference } = require('./phi_core');

// --- PHI-WEIGHTED VOTING ---

/**
 * Calculate vote weight for an agent.
 */
function voteWeight(agent) {
  return (agent.phi_weight || 0.382) * (agent.vitality_score || 0.5) * (agent.mission_alignment || 0.5);
}

/**
 * Run phi-weighted voting across agents for a decision.
 * Returns { decision, consensus, votes, override }
 */
function phiVote(agents, options) {
  const votes = {};
  let totalWeight = 0;

  for (const agent of agents) {
    if (agent.status === 'PRUNED' || agent.status === 'QUARANTINED') continue;

    const weight = voteWeight(agent);
    totalWeight += weight;

    // Each agent votes for the option closest to its alignment
    const vote = agent.preferred_option || options[0];
    if (!votes[vote]) votes[vote] = 0;
    votes[vote] += weight;
  }

  // Find winner
  const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  const winner = sorted[0];
  const consensus = totalWeight > 0 ? winner[1] / totalWeight : 0;

  return {
    decision: winner ? winner[0] : null,
    consensus,
    reached_phi_consensus: consensus >= 0.618,
    votes: Object.fromEntries(sorted),
    total_weight: totalWeight,
  };
}

// --- PHEROMONE TRAILS ---

/**
 * Create a pheromone trail entry for a completed task.
 */
function createPheromoneTrail(taskId, agentName, result) {
  return {
    task_id: taskId,
    agent_name: agentName,
    success_pheromone: result.success ? Math.min(result.alignment * PHI, 1.0) : 0.1,
    alignment_pheromone: result.alignment || 0.5,
    cost_pheromone: result.cost_usd ? Math.max(1.0 - result.cost_usd, 0.1) : 0.5,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Find the strongest pheromone trail for a task type.
 */
function followPheromoneTrail(trails, taskType) {
  const matching = trails.filter(t => t.task_type === taskType);
  if (matching.length === 0) return null;

  // Decay old trails exponentially
  const now = Date.now();
  const scored = matching.map(t => {
    const age = (now - new Date(t.timestamp).getTime()) / 1000;
    const decay = Math.exp(-age / (PI * PI * 60)); // decay over ~10 minutes
    const strength = t.success_pheromone * t.alignment_pheromone * decay;
    return { ...t, strength };
  });

  scored.sort((a, b) => b.strength - a.strength);
  return scored[0];
}

// --- LOAD BALANCING ---

/**
 * Distribute tasks following phi-weighted load balancing.
 * Top 61.8% by priority → PRIMARY_CELL, bottom 38.2% → SUPPORT_CELL.
 */
function distributeLoad(tasks) {
  const sorted = [...tasks].sort((a, b) => {
    const scoreA = (a.complexity || 5) * (a.urgency || 0.5) * (a.mission_alignment || 0.5);
    const scoreB = (b.complexity || 5) * (b.urgency || 0.5) * (b.mission_alignment || 0.5);
    return scoreB - scoreA;
  });

  const splitIndex = Math.ceil(sorted.length * 0.618);

  return {
    primary: sorted.slice(0, splitIndex),
    support: sorted.slice(splitIndex),
    split_ratio: {
      primary_count: splitIndex,
      support_count: sorted.length - splitIndex,
      primary_pct: sorted.length > 0 ? (splitIndex / sorted.length * 100).toFixed(1) : '0',
      support_pct: sorted.length > 0 ? ((sorted.length - splitIndex) / sorted.length * 100).toFixed(1) : '0',
    },
  };
}

// --- BACKPRESSURE ---

/**
 * Calculate Fibonacci-based max agents at a given depth.
 */
function maxAgentsAtDepth(depth) {
  const fib = [1, 1, 2, 3, 5, 8];
  return fib[Math.min(depth, 5)] || 1;
}

/**
 * Check if system is at capacity.
 */
function isAtCapacity(agents) {
  const byDepth = {};
  for (const agent of agents) {
    if (agent.status === 'PRUNED') continue;
    const d = agent.depth || 0;
    byDepth[d] = (byDepth[d] || 0) + 1;
  }

  for (const [depth, count] of Object.entries(byDepth)) {
    if (count >= maxAgentsAtDepth(parseInt(depth))) return true;
  }
  return false;
}

/**
 * Queue timeout in seconds: phi^5 * pi ≈ 34.8s
 */
const QUEUE_TIMEOUT_MS = Math.pow(PHI, 5) * PI * 1000;

// --- SWARM HEALTH METRICS ---

/**
 * Calculate swarm cohesion (low std dev = high cohesion).
 */
function swarmCohesion(agents) {
  const alignments = agents
    .filter(a => a.status !== 'PRUNED')
    .map(a => a.mission_alignment || 0.5);

  if (alignments.length === 0) return 0;

  const mean = alignments.reduce((s, v) => s + v, 0) / alignments.length;
  const variance = alignments.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / alignments.length;
  return Math.sqrt(variance);
}

/**
 * Calculate spawn efficiency.
 */
function spawnEfficiency(agents) {
  const alive = agents.filter(a => a.status === 'ALIVE' || a.status === 'HEALING').length;
  const total = agents.length;
  return total > 0 ? alive / total : 0;
}

module.exports = {
  voteWeight,
  phiVote,
  createPheromoneTrail,
  followPheromoneTrail,
  distributeLoad,
  maxAgentsAtDepth,
  isAtCapacity,
  QUEUE_TIMEOUT_MS,
  swarmCohesion,
  spawnEfficiency,
};
