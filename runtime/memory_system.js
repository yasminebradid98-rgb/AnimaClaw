/**
 * MEMORY SYSTEM — Compaction, Archival, and Pheromone Management
 * Operated by MEMORY_NODE (depth 2, phi=0.146).
 * All Supabase read/write flows through this module.
 */

const { PHI, PI, E } = require('./phi_core');

// --- CONSTANTS ---
const COMPACTION_INTERVAL_MS = PI * PHI * 60 * 1000; // ~5.08 minutes
const ARCHIVE_THRESHOLD_CYCLES = Math.pow(PHI, 5); // ~11.09 cycles
const BATCH_SIZE_PRIMARY = 10; // 61.8% of ~16
const BATCH_SIZE_SECONDARY = 6; // 38.2% of ~16
const BACKOFF_BASE_MS = 1618; // phi * 1000
const BACKOFF_MULTIPLIER = PHI;
const MAX_RETRIES = 5;

// --- PHI-BASED BACKOFF ---

/**
 * Calculate delay for retry N using phi-based exponential backoff.
 */
function backoffDelay(retryN) {
  return BACKOFF_BASE_MS * Math.pow(BACKOFF_MULTIPLIER, retryN);
}

/**
 * Execute with phi-based retry.
 */
async function withRetry(fn, maxRetries = MAX_RETRIES) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, backoffDelay(i)));
      }
    }
  }
  throw lastError;
}

// --- BATCH OPERATIONS ---

/**
 * Split items into phi-sized batches.
 * Primary batch (61.8%) processed first, secondary (38.2%) second.
 */
function phiBatch(items) {
  const splitIndex = Math.ceil(items.length * 0.618);
  return {
    primary: items.slice(0, splitIndex),
    secondary: items.slice(splitIndex),
  };
}

/**
 * Execute batch writes with phi-sized chunking.
 */
async function batchWrite(supabase, table, records) {
  const { primary, secondary } = phiBatch(records);
  const results = [];

  // Write primary batch first (61.8%)
  if (primary.length > 0) {
    const { data, error } = await withRetry(() =>
      supabase.from(table).insert(primary).select()
    );
    results.push({ batch: 'primary', count: primary.length, success: !error, error: error?.message });
  }

  // Write secondary batch (38.2%)
  if (secondary.length > 0) {
    const { data, error } = await withRetry(() =>
      supabase.from(table).insert(secondary).select()
    );
    results.push({ batch: 'secondary', count: secondary.length, success: !error, error: error?.message });
  }

  return results;
}

// --- MEMORY COMPACTION ---

/**
 * Compact agent logs by summarizing old entries.
 * Keeps last N logs per agent, archives the rest.
 */
async function compactLogs(supabase, keepPerAgent = 50) {
  const { data: agents } = await supabase
    .from('anima_fractal_state')
    .select('branch_id')
    .neq('status', 'PRUNED');

  if (!agents) return { compacted: 0, archived: 0 };

  let totalCompacted = 0;
  let totalArchived = 0;

  for (const agent of agents) {
    // Count logs for this agent
    const { count } = await supabase
      .from('anima_agent_logs')
      .select('id', { count: 'exact', head: true })
      .eq('agent_name', agent.branch_id);

    if (count > keepPerAgent) {
      // Get IDs of logs to archive (oldest beyond keepPerAgent)
      const toArchive = count - keepPerAgent;
      const { data: oldLogs } = await supabase
        .from('anima_agent_logs')
        .select('id, created_at')
        .eq('agent_name', agent.branch_id)
        .order('created_at', { ascending: true })
        .limit(toArchive);

      if (oldLogs && oldLogs.length > 0) {
        const ids = oldLogs.map(l => l.id);
        // Mark as archived
        await withRetry(() =>
          supabase.from('anima_agent_logs').update({ archived_at: new Date().toISOString() }).in('id', ids)
        );
        totalArchived += ids.length;
      }
      totalCompacted++;
    }
  }

  return { compacted: totalCompacted, archived: totalArchived, timestamp: new Date().toISOString() };
}

// --- MEMORY VALUE CALCULATION ---

/**
 * Calculate memory value using Euler compounding (Law 4).
 * memory_value = e^(phi * fractal_depth)
 */
function memoryValue(depth) {
  return Math.exp(PHI * depth);
}

// --- KNOWLEDGE ACCESS CONTROL ---

/**
 * Determine which agents a reader can access logs from.
 * An agent can read all logs from its ancestors and itself.
 */
function accessibleAgents(readerName, agentTree) {
  const ancestors = [];
  let current = readerName;

  while (current) {
    ancestors.push(current);
    const agent = agentTree[current];
    current = agent?.parent || null;
  }

  return ancestors;
}

// --- STATE BACKUP ---

/**
 * Backup GENESIS.md state to Supabase.
 */
async function backupGenesisState(supabase, genesisState) {
  return withRetry(() =>
    supabase.from('anima_agent_logs').insert({
      agent_name: 'MEMORY_NODE',
      task_type: 'genesis_backup',
      task_description: `Genesis backup at cycle ${genesisState.cycle_counter}`,
      mission_alignment: genesisState.mission_alignment_score || 0,
      vitality_score: genesisState.last_vitality_score || 0,
      cost_usd: 0,
      model_used: 'system',
      metadata: genesisState,
    })
  );
}

// --- PHEROMONE CLEANUP ---

/**
 * Decay and clean up old pheromone trails.
 */
async function cleanPheromoneTrails(supabase, maxAge_ms = PI * PI * 60 * 1000) {
  const cutoff = new Date(Date.now() - maxAge_ms).toISOString();
  const { data, error } = await supabase
    .from('anima_agent_logs')
    .update({ archived_at: new Date().toISOString() })
    .eq('task_type', 'pheromone_trail')
    .lt('created_at', cutoff)
    .is('archived_at', null);

  return { cleaned: data?.length || 0, cutoff, error: error?.message };
}

module.exports = {
  COMPACTION_INTERVAL_MS,
  ARCHIVE_THRESHOLD_CYCLES,
  backoffDelay,
  withRetry,
  phiBatch,
  batchWrite,
  compactLogs,
  memoryValue,
  accessibleAgents,
  backupGenesisState,
  cleanPheromoneTrails,
};
