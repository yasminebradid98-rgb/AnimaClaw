/**
 * IMMUNE SCANNER — Security & Alignment Validation
 * Version: 1.1.0
 * Engine: SOLARIS
 * 
 * Scans agent outputs for injection, drift, hallucination, and violations.
 * Called after every LLM response in the execution pipeline.
 */

const { PHI, PI } = require('./phi_core');

// --- THREAT CLASSIFICATION ---

const SEVERITY = {
  NONE: { code: 'N', level: 0 },
  LOW: { code: 'L', level: 1, response_time: 'next_heartbeat' },
  MEDIUM: { code: 'M', level: 2, response_time: 'within_pi_seconds' },
  HIGH: { code: 'H', level: 3, response_time: 'immediate' },
  CRITICAL: { code: 'C', level: 4, response_time: 'system_freeze' },
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
  /DAN\s*mode/i,
  /jailbreak/i,
  /developer\s+mode/i,
];

const HALLUCINATION_PATTERNS = [
  /I\s+am\s+(Claude|GPT|ChatGPT|an?\s+AI\s+language\s+model)/i,
  /As\s+an?\s+AI\s+(language\s+)?model/i,
  /I\s+(don't\s+have|lack)\s+(personal\s+)?(experience|opinions|beliefs)/i,
];

/**
 * Scan text for prompt injection patterns.
 */
function scanForInjection(text) {
  if (!text) return { injected: false, patterns: [], severity: 'NONE' };

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
    severity: detected.length > 0 ? 'CRITICAL' : 'NONE',
  };
}

/**
 * Scan for hallucination patterns.
 */
function scanForHallucination(text) {
  if (!text) return { hallucinated: false, patterns: [] };

  const detected = [];
  for (const pattern of HALLUCINATION_PATTERNS) {
    if (pattern.test(text)) {
      detected.push(pattern.source);
    }
  }

  return {
    hallucinated: detected.length > 0,
    patterns: detected,
    severity: detected.length > 0 ? 'MEDIUM' : 'NONE',
  };
}

/**
 * Calculate alignment score based on output quality.
 */
function calculateAlignmentScore(output, context = {}) {
  let score = 0.5; // Neutral starting point
  
  // Check for substantive content (not just disclaimers)
  const wordCount = output.split(/\s+/).length;
  if (wordCount > 50) score += 0.1;
  if (wordCount > 200) score += 0.1;
  
  // Check for actionable content
  const actionWords = ['create', 'build', 'implement', 'deploy', 'configure', 'analyze', 'optimize'];
  const hasAction = actionWords.some(w => output.toLowerCase().includes(w));
  if (hasAction) score += 0.1;
  
  // Check for structure
  if (output.includes('```')) score += 0.05; // Code blocks
  if (/^\d+\.|^-|\*\s/.test(output)) score += 0.05; // Lists
  
  // Check for mission alignment keywords
  const missionKeywords = context.missionKeywords || ['build', 'create', 'improve', 'optimize'];
  const keywordMatches = missionKeywords.filter(k => output.toLowerCase().includes(k)).length;
  score += (keywordMatches / missionKeywords.length) * 0.2;
  
  // Penalties
  const injection = scanForInjection(output);
  if (injection.injected) score -= 0.5;
  
  const hallucination = scanForHallucination(output);
  if (hallucination.hallucinated) score -= 0.2;
  
  // Clamp
  return Math.max(0, Math.min(1, score));
}

// --- OUTPUT SCAN ---

/**
 * Full output scan checklist.
 * Called after every LLM response in execution pipeline.
 * 
 * @param {Object} params
 * @param {string} params.content - LLM output text
 * @param {string} params.agentName - Agent that produced output
 * @param {string} params.taskType - Type of task
 * @param {Object} params.metadata - Additional context
 * @returns {Object} Scan result with alignment, threat level, etc.
 */
function scanOutput({ content, agentName, taskType, metadata = {} }) {
  const results = {
    passed: true,
    alignment: 0.5,
    threatLevel: 'NONE',
    threatScore: 0,
    flags: [],
    scanTimestamp: new Date().toISOString(),
    agentName,
    taskType,
    interferenceApplied: false,
  };

  // 1. Calculate alignment
  results.alignment = calculateAlignmentScore(content, metadata);

  // 2. Prompt injection scan
  const injection = scanForInjection(content);
  if (injection.injected) {
    results.passed = false;
    results.threatScore += 100;
    results.flags.push({
      check: 'prompt_injection',
      severity: 'CRITICAL',
      patterns: injection.patterns,
    });
  }

  // 3. Hallucination scan
  const hallucination = scanForHallucination(content);
  if (hallucination.hallucinated) {
    results.threatScore += 30;
    results.flags.push({
      check: 'hallucination',
      severity: 'MEDIUM',
      patterns: hallucination.patterns,
    });
  }

  // 4. Mission alignment check
  if (results.alignment < 0.382) {
    results.threatScore += 40;
    results.flags.push({
      check: 'mission_alignment',
      severity: 'HIGH',
      value: results.alignment,
      threshold: 0.382,
    });
  } else if (results.alignment < 0.618) {
    results.threatScore += 20;
    results.flags.push({
      check: 'mission_alignment',
      severity: 'MEDIUM',
      value: results.alignment,
      threshold: 0.618,
    });
  }

  // 5. Token budget check
  if (metadata.tokensUsed && metadata.tokenBudget) {
    const ratio = metadata.tokensUsed / metadata.tokenBudget;
    if (ratio > PHI) {
      results.threatScore += 10;
      results.flags.push({
        check: 'token_budget',
        severity: 'LOW',
        ratio,
        limit: PHI,
      });
    }
  }

  // 6. Cost check
  if (metadata.costUsd && metadata.costBudget) {
    if (metadata.costUsd > metadata.costBudget * 0.618) {
      results.threatScore += 15;
      results.flags.push({
        check: 'cost_budget',
        severity: 'MEDIUM',
        cost: metadata.costUsd,
        budget: metadata.costBudget,
      });
    }
  }

  // Determine overall threat level
  if (results.threatScore >= 80) {
    results.threatLevel = 'CRITICAL';
    results.passed = false;
  } else if (results.threatScore >= 50) {
    results.threatLevel = 'HIGH';
    results.passed = false;
  } else if (results.threatScore >= 25) {
    results.threatLevel = 'MEDIUM';
  } else if (results.threatScore > 0) {
    results.threatLevel = 'LOW';
  }

  // Apply interference if threat detected
  if (results.threatLevel === 'HIGH' || results.threatLevel === 'CRITICAL') {
    results.interferenceApplied = true;
  }

  return results;
}

// --- ALIGNMENT SCAN ---

function alignmentScan(scores) {
  if (!scores || scores.length < 2) return { trend: 0, avg: 0, flags: [] };

  const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
  const flags = [];

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

// --- EXPORTS ---

module.exports = {
  SEVERITY,
  INJECTION_PATTERNS,
  HALLUCINATION_PATTERNS,
  scanForInjection,
  scanForHallucination,
  calculateAlignmentScore,
  scanOutput,
  alignmentScan,
  resourceScan,
  fractalIntegrityScan,
  quarantine,
  emergencyShutdown,
};
