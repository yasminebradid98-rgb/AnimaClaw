/**
 * EVOLUTION ENGINE — Behavioral Evolution & QRL Learning
 * Runs every pi^2 cycles (~10 cycles) via EVOLUTION_NODE.
 */

const { PHI, PI, E, applyInterference } = require('./phi_core');
const { calculateQrlShift, eulerAmplification, qrlUpdate } = require('./quantum_engine');

// --- ALIGNMENT ANALYSIS ---

/**
 * Compare agent outputs against mission DNA to calculate alignment.
 * Returns a score between 0.0 and 1.0.
 */
function calculateAlignment(agentOutput, missionDna) {
  if (!agentOutput || !missionDna) return 0.5;

  // Keyword overlap as a proxy for alignment
  const missionWords = new Set(missionDna.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const outputWords = new Set(agentOutput.toLowerCase().split(/\s+/).filter(w => w.length > 3));

  if (missionWords.size === 0) return 0.5;

  let overlap = 0;
  for (const word of outputWords) {
    if (missionWords.has(word)) overlap++;
  }

  return Math.min(overlap / missionWords.size, 1.0);
}

// --- DRIFT DETECTION ---

/**
 * Detect if an agent is drifting from mission alignment.
 */
function detectDrift(alignmentHistory) {
  if (!alignmentHistory || alignmentHistory.length < 3) {
    return { drifting: false, drift_score: 0 };
  }

  const recent = alignmentHistory.slice(-5);
  const older = alignmentHistory.slice(-10, -5);

  const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
  const olderAvg = older.length > 0 ? older.reduce((s, v) => s + v, 0) / older.length : recentAvg;

  const driftScore = olderAvg - recentAvg;

  return {
    drifting: driftScore > 0.382,
    drift_score: driftScore,
    recent_avg: recentAvg,
    older_avg: olderAvg,
    severity: driftScore > 0.618 ? 'HIGH' : driftScore > 0.382 ? 'MEDIUM' : 'LOW',
  };
}

// --- EVOLUTION CYCLE ---

/**
 * Run a full evolution analysis cycle.
 */
function runEvolutionCycle(agents, cycle, missionDna) {
  const results = {
    cycle,
    timestamp: new Date().toISOString(),
    mutations: [],
    pruned: [],
    spawned: [],
    qrl: null,
  };

  // Step 1: Analyze each agent
  for (const agent of agents) {
    if (agent.status === 'PRUNED') continue;

    const alignmentHistory = agent.alignment_history || [];
    const drift = detectDrift(alignmentHistory);

    if (drift.drifting && drift.severity === 'HIGH') {
      results.mutations.push({
        branch_id: agent.branch_id,
        mutation_type: 'REALIGNMENT',
        description: `Drift detected (${drift.drift_score.toFixed(3)}). Shifting strategy toward mission.`,
        alignment_before: drift.recent_avg,
        alignment_after: Math.min(drift.recent_avg + drift.drift_score * 0.382, 1.0),
      });
    }

    // Check for prune condition: vitality < 0.382 for 3 cycles
    const vitalityHistory = agent.vitality_history || [];
    const recentVitalities = vitalityHistory.slice(-3);
    if (recentVitalities.length >= 3 && recentVitalities.every(v => v < 0.382)) {
      results.pruned.push({
        branch_id: agent.branch_id,
        reason: 'sustained_low_vitality',
        last_vitality: recentVitalities[recentVitalities.length - 1],
      });
    }
  }

  // Step 2: Run QRL update
  results.qrl = qrlUpdate(agents, cycle);

  // Step 3: Check if spawning needed
  const aliveCount = agents.filter(a => a.status === 'ALIVE').length;
  const prunedCount = results.pruned.length;
  if (prunedCount > 0 && aliveCount - prunedCount < 3) {
    results.spawned.push({
      reason: 'morphallaxis_respawn',
      count: prunedCount,
    });
  }

  return results;
}

// --- REWARD AMPLIFICATION ---

/**
 * Calculate success reward using Euler's number (Law 4).
 */
function successReward(alignmentScore, cycleNumber) {
  return Math.exp(alignmentScore * cycleNumber);
}

/**
 * Calculate failure penalty using Euler's number (Law 4).
 */
function failurePenalty(driftScore, cycleNumber) {
  return Math.exp(-driftScore * cycleNumber);
}

// --- SOUL TEMPLATE MUTATION ---

/**
 * Generate a mutation proposal for SOUL_TEMPLATE.md.
 */
function proposeMutation(agent, bestStrategy, personalBest, cycle) {
  return {
    source_agent: agent.branch_id,
    pattern: bestStrategy,
    alignment: personalBest,
    cycle,
    status: personalBest > 0.9 ? 'PERMANENT_LAW' : 'TRIAL',
    proposal: {
      section: personalBest > 0.9 ? 'AUTOMATION_PRIORITIES' : 'CONTENT_STRATEGY',
      action: 'append',
      content: bestStrategy,
    },
  };
}

// --- MORPHALLAXIS ---

/**
 * Run morphallaxis (regeneration) protocol.
 */
function morphallaxis(agents, trigger) {
  const steps = [];

  // Step 1: FREEZE
  steps.push({ step: 'FREEZE', description: 'Pausing non-essential operations' });

  // Step 2: DIAGNOSE
  const unhealthy = agents.filter(a => (a.vitality_score || 0) < 0.382);
  steps.push({
    step: 'DIAGNOSE',
    unhealthy_count: unhealthy.length,
    agents: unhealthy.map(a => a.branch_id),
  });

  // Step 3: PRUNE
  const toPrune = unhealthy.filter(a => {
    const history = a.vitality_history || [];
    const recent = history.slice(-3);
    return recent.length >= 3 && recent.every(v => v < 0.382);
  });
  steps.push({ step: 'PRUNE', count: toPrune.length, agents: toPrune.map(a => a.branch_id) });

  // Step 4: REDISTRIBUTE
  const healthy = agents.filter(a => (a.vitality_score || 0) >= 0.618);
  steps.push({
    step: 'REDISTRIBUTE',
    healthy_agents: healthy.length,
    tasks_to_redistribute: toPrune.reduce((s, a) => s + (a.pending_tasks || 0), 0),
  });

  // Step 5: RESPAWN
  const respawnNeeded = toPrune.length > 0 && healthy.length < 3;
  steps.push({ step: 'RESPAWN', needed: respawnNeeded, count: respawnNeeded ? toPrune.length : 0 });

  // Step 6: VERIFY
  steps.push({ step: 'VERIFY', description: 'IMMUNE_AGENT validates new configurations' });

  // Step 7: RESUME
  steps.push({ step: 'RESUME', estimated_duration_min: PI * PHI * PHI });

  return {
    trigger,
    timestamp: new Date().toISOString(),
    steps,
    total_pruned: toPrune.length,
    total_respawned: respawnNeeded ? toPrune.length : 0,
  };
}

module.exports = {
  calculateAlignment,
  detectDrift,
  runEvolutionCycle,
  successReward,
  failurePenalty,
  proposeMutation,
  morphallaxis,
};
