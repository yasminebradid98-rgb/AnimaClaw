/**
 * PHI CORE — φ-Weighted Routing Engine
 * Governs all task routing decisions in ANIMA OS.
 *
 * Every task passes through phi_core before execution.
 * Scoring: phi_score = task_complexity × phi_weight × mission_alignment
 */

const PHI = 1.6180339887;
const PI = 3.1415926535;
const E = 2.7182818284;

const AGENT_REGISTRY = {
  ROOT_ORCHESTRATOR: { depth: 0, phi_weight: 1.0, parent: null },
  PRIMARY_CELL: { depth: 1, phi_weight: 0.618, parent: 'ROOT_ORCHESTRATOR' },
  SUPPORT_CELL: { depth: 1, phi_weight: 0.382, parent: 'ROOT_ORCHESTRATOR' },
  MEMORY_NODE: { depth: 2, phi_weight: 0.146, parent: 'SUPPORT_CELL' },
  EVOLUTION_NODE: { depth: 2, phi_weight: 0.236, parent: 'SUPPORT_CELL' },
  IMMUNE_AGENT: { depth: 2, phi_weight: 0.146, parent: 'SUPPORT_CELL' },
};

/**
 * Score a task-agent pairing.
 */
function scoreAssignment(task, agent) {
  const complexity = task.complexity || 5;
  const urgency = task.urgency || 0.5;
  const alignment = task.mission_alignment || 0.5;
  const agentVitality = agent.vitality_score || 0.5;

  const rawScore = (complexity / 10) * urgency * alignment * agent.phi_weight;
  const depthPenalty = 1.0 / (1 + agent.depth * 0.1);
  const capacityFactor = 1.0 - ((agent.current_load || 0) / (agent.max_capacity || 10));
  const vitalityBonus = agentVitality > 0.618 ? 1.0 : agentVitality;

  return rawScore * depthPenalty * capacityFactor * vitalityBonus;
}

/**
 * Apply interference (Law 8) to a raw score.
 */
function applyInterference(rawScore) {
  if (rawScore > 0.618) {
    return { score: Math.min(rawScore * PHI, 1.618), type: 'CONSTRUCTIVE' };
  }
  return { score: rawScore * 0.382, type: 'DESTRUCTIVE' };
}

/**
 * Route a single task to the best available agent.
 */
function routeTask(task, agents) {
  let bestAgent = null;
  let bestScore = -1;
  let bestInterference = null;

  for (const agent of agents) {
    if (agent.status === 'PRUNED' || agent.status === 'QUARANTINED') continue;
    if ((agent.vitality_score || 0) < 0.382) continue;

    const raw = scoreAssignment(task, agent);
    const { score, type } = applyInterference(raw);

    if (score > bestScore) {
      bestScore = score;
      bestAgent = agent;
      bestInterference = type;
    }
  }

  return {
    agent: bestAgent?.branch_id || bestAgent?.name || null,
    score: bestScore,
    interference: bestInterference,
    raw_score: bestScore > 0 ? (bestInterference === 'CONSTRUCTIVE' ? bestScore / PHI : bestScore / 0.382) : 0,
  };
}

/**
 * QAOA routing — assign multiple tasks to multiple agents optimally (Law 11).
 */
function qaoaRoute(tasks, agents) {
  const assignmentMatrix = {};

  // Score all pairings
  for (const task of tasks) {
    for (const agent of agents) {
      if (agent.status !== 'ALIVE' && agent.status !== 'HEALING') continue;
      if ((agent.vitality_score || 0) < 0.382) continue;

      const raw = scoreAssignment(task, agent);
      const { score, type } = applyInterference(raw);

      const key = `${task.id}:${agent.branch_id || agent.name}`;
      assignmentMatrix[key] = {
        task_id: task.id,
        agent_name: agent.branch_id || agent.name,
        score,
        raw_score: raw,
        interference: type,
        agent_vitality: agent.vitality_score,
        agent_load: agent.current_load || 0,
      };
    }
  }

  // Sort by score descending
  const sorted = Object.values(assignmentMatrix).sort((a, b) => b.score - a.score);

  const assignedTasks = new Set();
  const agentTaskCount = {};
  const finalAssignments = [];

  for (const entry of sorted) {
    if (assignedTasks.has(entry.task_id)) continue;

    const count = agentTaskCount[entry.agent_name] || 0;
    const agentDef = AGENT_REGISTRY[entry.agent_name];
    const maxTasks = (agentDef?.phi_weight || 0) >= 0.618
      ? Math.ceil(tasks.length * 0.618)
      : Math.ceil(tasks.length * 0.382);

    if (count >= maxTasks) continue;

    finalAssignments.push(entry);
    assignedTasks.add(entry.task_id);
    agentTaskCount[entry.agent_name] = count + 1;
  }

  return {
    assignments: finalAssignments,
    total_tasks: tasks.length,
    total_agents: agents.length,
    pairings_evaluated: Object.keys(assignmentMatrix).length,
    unassigned: tasks.length - assignedTasks.size,
  };
}

/**
 * Calculate phi-weighted resource allocation for two children.
 */
function allocateResources(total, primaryName, secondaryName) {
  return {
    [primaryName]: total * 0.618,
    [secondaryName]: total * 0.382,
  };
}

/**
 * Calculate harmonic bridge for timing adjustment.
 */
function harmonicBridge(phiWeight) {
  const bridge = PI / (PHI * PHI);
  return PI * phiWeight * bridge;
}

module.exports = {
  PHI,
  PI,
  E,
  AGENT_REGISTRY,
  scoreAssignment,
  applyInterference,
  routeTask,
  qaoaRoute,
  allocateResources,
  harmonicBridge,
};
