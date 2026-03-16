/**
 * EVOLUTION ENGINE — Behavioral Evolution & QRL Learning
 * Version: 1.1.0
 * Engine: SOLARIS
 * 
 * Runs every π² cycles (~10 cycles) via EVOLUTION_NODE.
 * Updates agent phi_weights and vitality in anima_fractal_state.
 * Logs evolution cycles to anima_evolution_log.
 */

const { PHI, PI, E, applyInterference } = require('./phi_core');
const { calculateQrlShift, eulerAmplification, qrlUpdate } = require('./quantum_engine');
const naturalLaw = require('./natural_law');

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

// --- EVOLUTION CYCLE (Database Integrated) ---

/**
 * Run a full evolution cycle and update database.
 * Called by pi_pulse_daemon every π² cycles.
 * 
 * @param {Object} supabase - Supabase client
 * @param {number} cycle - Current cycle number
 * @param {string} userId - User ID
 */
async function runCycle(supabase, cycle, userId) {
  console.log(`[EvolutionEngine] Running cycle ${cycle}...`);

  // 1. Fetch recent agent logs for performance analysis
  const { data: recentLogs, error: logsError } = await supabase
    .from('anima_agent_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('pi_pulse_timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24h
    .order('pi_pulse_timestamp', { ascending: false });

  if (logsError) {
    console.error('[EvolutionEngine] Failed to fetch logs:', logsError);
  }

  // 2. Calculate global best (best alignment across all agents)
  const globalBest = recentLogs && recentLogs.length > 0
    ? Math.max(...recentLogs.map(l => l.mission_alignment || 0))
    : 0.5;

  // 3. Fetch current agent states
  const { data: agents, error: agentsError } = await supabase
    .from('anima_fractal_state')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'PRUNED');

  if (agentsError) {
    throw new Error(`Failed to fetch agents: ${agentsError.message}`);
  }

  const results = {
    cycle,
    timestamp: new Date().toISOString(),
    mutations: [],
    pruned: [],
    spawned: [],
    phi_adjustments: {},
    global_alignment: globalBest,
  };

  // 4. Analyze each agent and update DB
  for (const agent of agents || []) {
    const agentLogs = (recentLogs || []).filter(l => l.agent_name === agent.branch_id);
    
    // Calculate personal best from this agent's logs
    const personalBest = agentLogs.length > 0
      ? Math.max(...agentLogs.map(l => l.mission_alignment || 0))
      : (agent.personal_best || 0.5);

    // Alignment history for drift detection
    const alignmentHistory = agentLogs
      .map(l => l.mission_alignment || 0)
      .reverse(); // Oldest first

    const drift = detectDrift(alignmentHistory);

    // Calculate new phi_weight based on performance
    let newPhiWeight = agent.phi_weight || naturalLaw.AGENT_REGISTRY[agent.branch_id]?.phi_weight || 0.5;
    
    if (personalBest > agent.global_best || 0) {
      // Agent is improving - increase weight (max 1.0)
      newPhiWeight = Math.min(1.0, newPhiWeight * 1.05);
      results.mutations.push({
        branch_id: agent.branch_id,
        mutation_type: 'PHI_AMPLIFICATION',
        description: `Performance improved (${personalBest.toFixed(3)} > ${(agent.global_best || 0).toFixed(3)}). Increasing φ-weight.`,
        old_phi: agent.phi_weight,
        new_phi: newPhiWeight,
      });
    } else if (drift.drifting && drift.severity === 'HIGH') {
      // Agent is drifting - decrease weight (min 0.1)
      newPhiWeight = Math.max(0.1, newPhiWeight * 0.95);
      results.mutations.push({
        branch_id: agent.branch_id,
        mutation_type: 'PHI_SUPPRESSION',
        description: `Drift detected (${drift.drift_score.toFixed(3)}). Decreasing φ-weight.`,
        old_phi: agent.phi_weight,
        new_phi: newPhiWeight,
      });
    }

    // Calculate new vitality
    const newVitality = naturalLaw.calculateVitality(
      agent.depth_level || 0,
      personalBest,
      1,
      agent.spawn_count > 0 ? agent.spawn_count / 8 : 0.5
    );

    // Update agent in database
    const { error: updateError } = await supabase
      .from('anima_fractal_state')
      .update({
        personal_best: personalBest,
        global_best: globalBest,
        phi_weight: newPhiWeight,
        vitality_score: newVitality,
        status: drift.drifting && drift.severity === 'HIGH' ? 'HEALING' : agent.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agent.id);

    if (updateError) {
      console.error(`[EvolutionEngine] Failed to update ${agent.branch_id}:`, updateError);
    }

    results.phi_adjustments[agent.branch_id] = {
      old: agent.phi_weight,
      new: newPhiWeight,
      personal_best: personalBest,
    };

    // Check for prune condition: vitality < 0.382 for 3+ cycles
    const vitalityHistory = agentLogs.slice(0, 3).map(l => l.vitality_score || 0);
    if (vitalityHistory.length >= 3 && vitalityHistory.every(v => v < 0.382)) {
      results.pruned.push({
        branch_id: agent.branch_id,
        reason: 'sustained_low_vitality',
        last_vitality: vitalityHistory[0],
      });

      // Mark as PRUNED in DB
      await supabase
        .from('anima_fractal_state')
        .update({ status: 'PRUNED' })
        .eq('id', agent.id);
    }
  }

  // 5. Check if spawning needed (morphallaxis)
  const aliveCount = (agents || []).filter(a => a.status === 'ALIVE').length;
  const prunedCount = results.pruned.length;
  if (prunedCount > 0 && aliveCount - prunedCount < 3) {
    results.spawned.push({
      reason: 'morphallaxis_respawn',
      count: prunedCount,
    });
  }

  // 6. Log to anima_evolution_log
  const { error: logError } = await supabase
    .from('anima_evolution_log')
    .insert({
      cycle_number: cycle,
      global_alignment: globalBest,
      personal_best: Math.max(...(agents || []).map(a => a.personal_best || 0), 0),
      evolution_triggered: results.mutations.length > 0 || results.pruned.length > 0,
      mutation_description: results.mutations.map(m => m.description).join('; ') || 'No mutations',
      branches_pruned: results.pruned.length,
      branches_spawned: results.spawned.length,
      phi_adjustments: results.phi_adjustments,
      user_id: userId,
    });

  if (logError) {
    console.error('[EvolutionEngine] Failed to log evolution:', logError);
  }

  console.log(`[EvolutionEngine] Cycle ${cycle} complete:`, {
    mutations: results.mutations.length,
    pruned: results.pruned.length,
    spawned: results.spawned.length,
    global_best: globalBest.toFixed(4),
  });

  return results;
}

// --- LEGACY: Non-async evolution cycle (for backwards compatibility) ---

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

function successReward(alignmentScore, cycleNumber) {
  return Math.exp(alignmentScore * cycleNumber);
}

function failurePenalty(driftScore, cycleNumber) {
  return Math.exp(-driftScore * cycleNumber);
}

// --- SOUL TEMPLATE MUTATION ---

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

// --- EXPORTS ---

module.exports = {
  calculateAlignment,
  detectDrift,
  runCycle,              // NEW: Async DB-integrated version
  runEvolutionCycle,     // LEGACY: Non-async version
  successReward,
  failurePenalty,
  proposeMutation,
  morphallaxis,
};
