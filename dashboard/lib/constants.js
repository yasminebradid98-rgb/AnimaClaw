// ANIMA OS Mathematical Constants
// These are the physics of the organism — not configurable.

export const PHI = 1.6180339887;
export const PI = 3.1415926535;
export const E = 2.7182818284;

// Derived constants
export const PHI_PRIMARY = 0.618;
export const PHI_SECONDARY = 0.382;
export const HARMONIC_BRIDGE = PI / (PHI * PHI); // ≈ 1.2002
export const PHI_SQUARED = PHI * PHI; // ≈ 2.618

// Timing (in seconds unless noted)
export const PULSE_INTERVAL = PI; // 3.14s
export const COMPACTION_INTERVAL_MIN = PI * PHI; // 5.08 min
export const EVOLUTION_CHECK_CYCLES = Math.floor(PI * PI); // ~10 cycles
export const FULL_RESET_CYCLES = Math.floor(Math.pow(PHI, 5)); // ~11 cycles

// Fractal
export const MAX_FRACTAL_DEPTH = 5;
export const FIBONACCI = [1, 1, 2, 3, 5, 8];

// Vitality thresholds
export const VITALITY_EXPAND = 1.0;
export const VITALITY_MAINTAIN = 0.618;
export const VITALITY_CRITICAL = 0.382;

// Design system colors
export const COLORS = {
  background: '#0a0a0f',
  bgLight: '#12121a',
  bgCard: '#16161f',
  gold: '#c9a84c',
  goldDim: '#8a7533',
  blue: '#4c7bc9',
  blueDim: '#3a5d99',
  green: '#4cc97b',
  red: '#c94c4c',
  text: '#e8e6e3',
  textDim: '#8a8780',
  border: '#2a2a35',
};

// Agent definitions
export const CORE_AGENTS = [
  { name: 'ROOT_ORCHESTRATOR', depth: 0, phiWeight: 1.0, role: 'Central Intelligence' },
  { name: 'PRIMARY_CELL', depth: 1, phiWeight: 0.618, role: 'Core Execution' },
  { name: 'SUPPORT_CELL', depth: 1, phiWeight: 0.382, role: 'Monitoring & Memory' },
  { name: 'MEMORY_NODE', depth: 2, phiWeight: 0.146, role: 'Persistent Memory' },
  { name: 'EVOLUTION_NODE', depth: 2, phiWeight: 0.236, role: 'Behavioral Evolution' },
  { name: 'IMMUNE_AGENT', depth: 2, phiWeight: 0.146, role: 'Security Scanner' },
];

// Status colors
export function getStatusColor(status) {
  switch (status) {
    case 'ALIVE': return COLORS.green;
    case 'HEALING': return COLORS.gold;
    case 'EVOLVING': return COLORS.blue;
    case 'SPAWNING': return COLORS.blue;
    case 'PRUNED': return COLORS.red;
    case 'DORMANT': return COLORS.textDim;
    default: return COLORS.textDim;
  }
}

export function getVitalityColor(score) {
  if (score >= VITALITY_MAINTAIN) return COLORS.green;
  if (score >= VITALITY_CRITICAL) return COLORS.gold;
  return COLORS.red;
}
