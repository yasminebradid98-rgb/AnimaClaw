import { PHI, PI, E, VITALITY_MAINTAIN, VITALITY_CRITICAL } from './constants';

/**
 * Calculate agent vitality score
 * Formula: (φ^depth × e^alignment) / (π^cycle_age) × fractal_score
 */
export function calculateVitality(depth, alignment, cycleAge, fractalScore) {
  const safeAlignment = Math.max(0, Math.min(1, alignment));
  const safeCycleAge = Math.max(1, cycleAge);
  const safeFractalScore = Math.max(0.001, fractalScore);
  const safeDepth = Math.max(0, Math.min(5, depth));

  const numerator = Math.pow(PHI, safeDepth) * Math.exp(safeAlignment);
  const denominator = Math.pow(PI, Math.min(safeCycleAge, 10));
  const result = (numerator / denominator) * safeFractalScore;

  return Math.max(0, Math.min(100, result));
}

/**
 * Calculate system-wide vitality (φ-weighted average)
 */
export function calculateSystemVitality(agents) {
  if (!agents || agents.length === 0) return 0;

  let totalWeighted = 0;
  let totalWeights = 0;

  for (const agent of agents) {
    const weight = agent.phi_weight || agent.phiWeight || 0;
    const vitality = agent.vitality_score || agent.vitality || 0;
    totalWeighted += vitality * weight;
    totalWeights += weight;
  }

  return totalWeights > 0 ? totalWeighted / totalWeights : 0;
}

/**
 * Calculate success amplification: e^(alignment × cycle)
 */
export function successAmplification(alignment, cycle) {
  const result = Math.exp(alignment * (cycle / (PI * PI)));
  const maxReward = Math.exp(PHI * 5);
  return Math.min(result, maxReward);
}

/**
 * Calculate failure decay: e^(-drift × cycle)
 */
export function failureDecay(drift, cycle) {
  const result = Math.exp(-drift * (cycle / (PI * PI)));
  const minPenalty = Math.exp(-PHI * 5);
  return Math.max(result, minPenalty);
}

/**
 * Determine system state from vitality scores
 */
export function determineSystemState(agents) {
  if (!agents || agents.length === 0) return 'DORMANT';

  const vitalities = agents.map(a => a.vitality_score || a.vitality || 0);
  const minVitality = Math.min(...vitalities);
  const hasEvolving = agents.some(a => (a.status || '').toUpperCase() === 'EVOLVING');

  if (hasEvolving) return 'EVOLVING';
  if (minVitality >= VITALITY_MAINTAIN) return 'ALIVE';
  if (minVitality >= VITALITY_CRITICAL) return 'HEALING';
  return 'HEALING';
}

/**
 * Format vitality as a visual bar string
 */
export function vitalityBar(score, length = 10) {
  const filled = Math.round(Math.min(score, 1) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Format vitality as percentage
 */
export function vitalityPercent(score) {
  return `${(score * 100).toFixed(1)}%`;
}

/**
 * Calculate harmonic bridge: converts φ-weight to timing adjustment
 */
export function harmonicBridge(phiWeight) {
  const bridge = PI / (PHI * PHI);
  return PI * (phiWeight * bridge);
}
