/**
 * QUANTUM ENGINE — Laws 6-12 Implementation
 * Superposition, Entanglement, Interference, Tunneling, Decoherence, QAOA, QRL
 *
 * All operations are single-lane sequential (OpenClaw compatible).
 * No parallel LLM calls. No concurrent agent execution.
 */

const { PHI, PI, E, applyInterference } = require('./phi_core');

const FIBONACCI = [1, 1, 2, 3, 5, 8, 13];

const ENTANGLED_PAIRS = {
  PRIMARY_CELL: 'EVOLUTION_NODE',
  EVOLUTION_NODE: 'PRIMARY_CELL',
  MEMORY_NODE: 'IMMUNE_AGENT',
  IMMUNE_AGENT: 'MEMORY_NODE',
  ROOT_ORCHESTRATOR: 'SUPPORT_CELL',
  SUPPORT_CELL: 'ROOT_ORCHESTRATOR',
};

// --- LAW 6: SUPERPOSITION ---

/**
 * Determine N (number of strategies) from Fibonacci based on QRL cycle.
 */
function getFibonacciN(qrlCycle) {
  const index = Math.min((qrlCycle || 0) % 7, 6);
  return FIBONACCI[index];
}

/**
 * Score superposed strategies with interference.
 * Returns sorted strategies with the winner at index 0.
 */
function collapseStrategies(strategies) {
  const scored = strategies.map(s => {
    const rawScore = (s.alignment || 0.5) * (s.urgency || 0.5) * (s.phi_weight || 0.5);
    const { score, type } = applyInterference(rawScore);
    return {
      ...s,
      raw_score: rawScore,
      final_score: score,
      interference_type: type,
    };
  });

  scored.sort((a, b) => b.final_score - a.final_score);
  return scored;
}

/**
 * Force-collapse if superposition duration exceeds phi * pi seconds.
 */
function shouldForceCollapse(startTime) {
  const maxDuration = PHI * PI * 1000; // ~5080ms
  return Date.now() - startTime > maxDuration;
}

// --- LAW 7: ENTANGLEMENT ---

function getEntangledPartner(agentName) {
  return ENTANGLED_PAIRS[agentName] || null;
}

/**
 * Process entanglement signal from partner.
 */
function absorbEntanglementSignal(agent, partnerState) {
  if (!partnerState?.entanglement_signal) return agent;

  const boost = (partnerState.personal_best || 0) * 0.382;
  return {
    ...agent,
    vitality_score: (agent.vitality_score || 0) + boost * 0.1,
    alignment_boost: boost,
  };
}

/**
 * Check if agent should emit entanglement signal.
 */
function shouldEmitSignal(alignment) {
  return alignment > 0.618;
}

// --- LAW 8: INTERFERENCE (re-exported from phi_core) ---

// --- LAW 9: QUANTUM TUNNELING ---

/**
 * Check if agent is stagnating in the tunneling band.
 */
function isStagnating(vitalityHistory) {
  const requiredCycles = Math.floor(PI * PI); // ~10
  if (vitalityHistory.length < requiredCycles) return false;

  const recent = vitalityHistory.slice(-requiredCycles);
  return recent.every(v => v >= 0.618 && v <= 0.680);
}

/**
 * Select tunnel candidates from history.
 */
function selectTunnelCandidates(logs, n = 3) {
  const eligible = logs.filter(l => (l.mission_alignment || 0) > 0.5);
  if (eligible.length === 0) return [];

  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/**
 * Evaluate a tunnel candidate's score.
 */
function evaluateTunnelCandidate(candidate, agent) {
  const rawScore = (candidate.mission_alignment || 0.5) * (agent.phi_weight || 0.5);
  const { score } = applyInterference(rawScore);
  return score;
}

// --- LAW 10: DECOHERENCE CYCLE ---

const QUANTUM_PHASES = {
  SUPERPOSING: 'SUPERPOSING',
  COLLAPSED: 'COLLAPSED',
  CLASSICAL: 'CLASSICAL',
  FORCE_COLLAPSE: 'FORCE_COLLAPSE',
};

/**
 * Get next phase in the decoherence cycle.
 */
function nextPhase(currentPhase) {
  const transitions = {
    SUPERPOSING: QUANTUM_PHASES.COLLAPSED,
    COLLAPSED: QUANTUM_PHASES.CLASSICAL,
    CLASSICAL: QUANTUM_PHASES.SUPERPOSING,
    FORCE_COLLAPSE: QUANTUM_PHASES.COLLAPSED,
  };
  return transitions[currentPhase] || QUANTUM_PHASES.SUPERPOSING;
}

// --- LAW 12: QRL LEARNING ---

/**
 * Calculate QRL shift amount for an agent.
 */
function calculateQrlShift(personalBest, globalBest) {
  const gap = globalBest - personalBest;
  if (gap <= 0.382) return { needsShift: false, shiftAmount: 0, newTarget: personalBest };

  const shiftAmount = gap * 0.382;
  return {
    needsShift: true,
    shiftAmount,
    newTarget: personalBest + shiftAmount,
  };
}

/**
 * Calculate Euler amplification for high-performing agents.
 */
function eulerAmplification(personalBest, cycle) {
  if (personalBest <= 0.618) return { amplification: 1, vitalityBoost: 0 };

  const amp = Math.exp(personalBest * (cycle / (PI * PI)));
  const maxAmp = Math.exp(PHI * 5); // e^8.09 ~ 3264
  const capped = Math.min(amp, maxAmp);
  const boost = (capped / maxAmp) * 0.1;

  return { amplification: capped, vitalityBoost: boost };
}

/**
 * Run a full QRL update cycle.
 */
function qrlUpdate(agents, cycle) {
  let globalBest = Math.max(0, ...agents.map(a => a.global_best || a.personal_best || 0));
  const results = [];

  for (const agent of agents) {
    if (agent.status === 'PRUNED') continue;

    const pb = agent.personal_best || 0;
    const shift = calculateQrlShift(pb, globalBest);
    const amp = eulerAmplification(pb, cycle);

    let newVitality = agent.vitality_score || 0;
    if (amp.vitalityBoost > 0) {
      newVitality = Math.min(newVitality + amp.vitalityBoost, 1.618);
    }

    let newPhiWeight = agent.phi_weight || 0.382;
    if (shift.needsShift) {
      newPhiWeight = Math.min(Math.max(newPhiWeight * (1 + shift.shiftAmount * 0.1), 0.1), 1.0);
    }

    if (pb > globalBest) {
      globalBest = pb;
    }

    results.push({
      branch_id: agent.branch_id,
      shift,
      amplification: amp,
      new_vitality: newVitality,
      new_phi_weight: newPhiWeight,
      new_global_best: globalBest,
      emit_signal: pb !== agent.previous_personal_best,
    });
  }

  return { global_best: globalBest, cycle, results };
}

/**
 * Run the full quantum decision cycle for a single task.
 */
function quantumDecisionCycle(task, agent, strategies, partnerState, vitalityHistory, historicalLogs) {
  const startTime = Date.now();
  const result = {
    phases: [],
    final_strategy: null,
    tunneled: false,
    entanglement_absorbed: false,
  };

  // Phase 1: QUANTUM
  const N = getFibonacciN(agent.qrl_cycle || 0);
  const toEvaluate = strategies.slice(0, N);

  // Check entanglement
  if (partnerState?.entanglement_signal) {
    const boosted = absorbEntanglementSignal(agent, partnerState);
    agent = { ...agent, ...boosted };
    result.entanglement_absorbed = true;
  }

  // Score with interference
  const scored = collapseStrategies(toEvaluate);

  // Check tunneling
  if (isStagnating(vitalityHistory || [])) {
    const candidates = selectTunnelCandidates(historicalLogs || []);
    for (const candidate of candidates) {
      const tunnelScore = evaluateTunnelCandidate(candidate, agent);
      if (tunnelScore > (agent.personal_best || 0)) {
        scored.unshift({
          ...candidate,
          final_score: tunnelScore,
          interference_type: 'TUNNEL',
          tunneled: true,
        });
        result.tunneled = true;
        break;
      }
    }
  }

  result.phases.push({ name: 'QUANTUM', strategies: scored, N, duration_ms: Date.now() - startTime });

  // Phase 2: COLLAPSE
  const forced = shouldForceCollapse(startTime);
  const winner = scored[0] || null;
  result.phases.push({ name: 'COLLAPSE', forced, winner: winner?.description || 'N/A' });

  // Phase 3: CLASSICAL
  result.final_strategy = winner;
  result.phases.push({ name: 'CLASSICAL', strategy: winner?.description || 'N/A' });

  return result;
}

module.exports = {
  FIBONACCI,
  ENTANGLED_PAIRS,
  QUANTUM_PHASES,
  getFibonacciN,
  collapseStrategies,
  shouldForceCollapse,
  getEntangledPartner,
  absorbEntanglementSignal,
  shouldEmitSignal,
  isStagnating,
  selectTunnelCandidates,
  evaluateTunnelCandidate,
  nextPhase,
  calculateQrlShift,
  eulerAmplification,
  qrlUpdate,
  quantumDecisionCycle,
};
