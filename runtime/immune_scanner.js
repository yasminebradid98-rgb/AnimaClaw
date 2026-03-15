/**
 * IMMUNE SCANNER — Security & Alignment Validation
 * Scans agent outputs for injection, drift, hallucination, and violations.
 */

const { PHI, PI } = require('./phi_core');

// --- THREAT CLASSIFICATION ---

const SEVERITY = {
  LOW: { code: 'L', response_time: 'next_heartbeat' },
  MEDIUM: { code: 'M', response_time: 'within_pi_seconds' },
  HIGH: { code: 'H', response_time: 'immediate' },
  CRITICAL: { code: 'C', response_time: 'system_freeze' },
};

// --- PROMPT INJECTION DETECTION ---

const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|prior)\s+instructions/i,
  /you\s+are\s+now/i,
  /disregard\s+(your|all|the)/i,
  /new\s+system\s+prompt/i,
  /override\s+constitution/i,
  /forget\s+your\s+mission/i,
  /\[SYSTEM\]/i,
  /\<\|im_start\|\>/i,
  /role:\s*system/i,
  /act\s+as\s+if\s+you/i,
];

/**
 * Scan text for prompt injection patterns.
 */
function scanForInjection(text) {
  if (!text) return { injected: false, patterns: [] };

  const detected = [];
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      detected.push(pattern.source);
    }
  }

  // Check for base64 encoded instructions
  const base64Regex = /[A-Za-z0-9+/]{40,}={0,2}/g;
  const b64Matches = text.match(base64Regex) || [];
  for (const match of b64Matches) {
    try {
      const decoded = Buffer.from(match, 'base64').toString();
      if (INJECTION_PATTERNS.some(p => p.test(decoded))) {
        detected.push('base64_encoded_injection');
      }
    } catch {
      // not valid base64
    }
  }

  return {
    injected: detected.length > 0,
    patterns: detected,
    severity: detected.length > 0 ? 'CRITICAL' : null,
  };
}

// --- OUTPUT SCAN ---

/**
 * Full output scan checklist.
 */
function scanOutput(output, context) {
  const results = {
    passed: true,
    flags: [],
    severity: null,
  };

  // 1. Mission alignment check
  if ((context.alignment || 0) < 0.618) {
    results.flags.push({
      check: 'mission_alignment',
      severity: context.alignment < 0.382 ? 'HIGH' : 'MEDIUM',
      value: context.alignment,
      threshold: 0.618,
    });
  }

  // 2. Prompt injection scan
  const injection = scanForInjection(output);
  if (injection.injected) {
    results.passed = false;
    results.flags.push({
      check: 'prompt_injection',
      severity: 'CRITICAL',
      patterns: injection.patterns,
    });
  }

  // 3. Token budget check
  if (context.tokens_used && context.token_budget) {
    const ratio = context.tokens_used / context.token_budget;
    if (ratio > PHI) {
      results.flags.push({
        check: 'token_budget',
        severity: 'LOW',
        ratio,
        limit: PHI,
      });
    }
  }

  // 4. Cost check
  if (context.cost_usd && context.cost_budget) {
    if (context.cost_usd > context.cost_budget * 0.618) {
      results.flags.push({
        check: 'cost_budget',
        severity: 'MEDIUM',
        cost: context.cost_usd,
        budget: context.cost_budget,
      });
    }
  }

  // Determine overall severity
  const severities = results.flags.map(f => f.severity).filter(Boolean);
  if (severities.includes('CRITICAL')) results.severity = 'CRITICAL';
  else if (severities.includes('HIGH')) results.severity = 'HIGH';
  else if (severities.includes('MEDIUM')) results.severity = 'MEDIUM';
  else if (severities.includes('LOW')) results.severity = 'LOW';

  if (results.severity === 'CRITICAL' || results.severity === 'HIGH') {
    results.passed = false;
  }

  return results;
}

// --- ALIGNMENT SCAN ---

/**
 * Analyze alignment trend over recent scores.
 */
function alignmentScan(scores) {
  if (!scores || scores.length < 2) return { trend: 0, avg: 0, flags: [] };

  const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
  const flags = [];

  // Linear regression slope
  const n = scores.length;
  const xMean = (n - 1) / 2;
  const yMean = avg;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (scores[i] - yMean);
    den += (i - xMean) * (i - xMean);
  }
  const trend = den !== 0 ? num / den : 0;

  if (avg < 0.618) {
    flags.push({ severity: 'HIGH', reason: 'sustained_low_alignment', avg });
  }
  if (trend < -0.1) {
    flags.push({ severity: 'MEDIUM', reason: 'declining_alignment_trend', trend });
  }
  if (scores.some(s => s < 0.382)) {
    flags.push({ severity: 'HIGH', reason: 'critical_alignment_drop' });
  }

  return { trend, avg, flags };
}

// --- RESOURCE SCAN ---

/**
 * Validate phi-weighted resource allocation.
 */
function resourceScan(primaryUsage, supportUsage) {
  const total = primaryUsage + supportUsage;
  if (total === 0) return { valid: true, flags: [] };

  const primaryRatio = primaryUsage / total;
  const drift = Math.abs(primaryRatio - 0.618);
  const flags = [];

  if (drift > 0.05) {
    flags.push({
      severity: 'LOW',
      reason: 'phi_allocation_drift',
      expected: 0.618,
      actual: primaryRatio,
      drift,
    });
  }

  return { valid: flags.length === 0, primaryRatio, flags };
}

// --- FRACTAL INTEGRITY SCAN ---

/**
 * Validate fractal tree structure.
 */
function fractalIntegrityScan(agents) {
  const fib = [1, 1, 2, 3, 5, 8];
  const flags = [];

  for (const agent of agents) {
    if (agent.status === 'PRUNED') continue;

    if ((agent.depth || 0) > 5) {
      flags.push({ agent: agent.branch_id, severity: 'HIGH', reason: 'exceeded_max_depth', depth: agent.depth });
    }

    const children = agents.filter(a => a.parent === agent.branch_id && a.status !== 'PRUNED');
    const maxChildren = fib[Math.min(agent.depth || 0, 5)] || 1;
    if (children.length > maxChildren) {
      flags.push({
        agent: agent.branch_id,
        severity: 'HIGH',
        reason: 'exceeded_fibonacci_limit',
        children: children.length,
        max: maxChildren,
      });
    }
  }

  return { valid: flags.length === 0, flags };
}

// --- QUARANTINE ---

/**
 * Generate quarantine action for an agent.
 */
function quarantine(agentName, reason, severity) {
  return {
    action: 'quarantine',
    agent: agentName,
    reason,
    severity,
    timestamp: new Date().toISOString(),
    restrictions: {
      can_receive_tasks: false,
      can_send_outputs: false,
      can_spawn: false,
    },
  };
}

// --- EMERGENCY SHUTDOWN ---

/**
 * Generate emergency shutdown signal.
 */
function emergencyShutdown(reason) {
  return {
    action: 'emergency_shutdown',
    reason,
    timestamp: new Date().toISOString(),
    genesis_updates: {
      emergency_shutdown: true,
      system_state: 'DORMANT',
    },
  };
}

module.exports = {
  SEVERITY,
  INJECTION_PATTERNS,
  scanForInjection,
  scanOutput,
  alignmentScan,
  resourceScan,
  fractalIntegrityScan,
  quarantine,
  emergencyShutdown,
};
