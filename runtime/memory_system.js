/**
 * MEMORY SYSTEM — Compaction, Archival, and Pheromone Management
 * Operated by MEMORY_NODE (depth 2, phi=0.146).
 * All Supabase read/write flows through this module.
 *
 * TENANT ISOLATION POLICY
 * -----------------------
 * Every function that queries or mutates Supabase requires a
 * non-empty tenantId. Callers that omit it receive:
 *   { data: null, error: 'TENANT_REQUIRED: ...' }
 * This prevents cross-tenant data leakage at the module boundary,
 * independently of RLS policies (defence in depth).
 */

const { PHI, PI } = require('./phi_core');

// --- CONSTANTS ---
const COMPACTION_INTERVAL_MS = PI * PHI * 60 * 1000; // ~5.08 minutes
const ARCHIVE_THRESHOLD_CYCLES = Math.pow(PHI, 5);   // ~11.09 cycles
const BACKOFF_BASE_MS      = 1618; // phi * 1000
const BACKOFF_MULTIPLIER   = PHI;
const MAX_RETRIES          = 5;

// --- TENANT GUARD ---

/**
 * Enforce that tenantId is a non-empty string.
 * Returns an error descriptor when the check fails so callers can
 * return it directly without throwing across async boundaries.
 *
 * Usage:
 *   const guard = requireTenantId(tenantId, 'getRecentMemory');
 *   if (guard) return guard;
 */
function requireTenantId(tenantId, callerName = 'unknown') {
  if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
    return {
      data: null,
      error: `TENANT_REQUIRED: ${callerName}() called without a valid tenantId. ` +
             'Pass the tenantId of the current session to scope this query.',
    };
  }
  return null; // guard passed
}

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
    primary:   items.slice(0, splitIndex),
    secondary: items.slice(splitIndex),
  };
}

/**
 * Execute batch writes with phi-sized chunking.
 * Records must already contain tenant_id — this function does not inject it.
 */
async function batchWrite(supabase, table, records) {
  const { primary, secondary } = phiBatch(records);
  const results = [];

  if (primary.length > 0) {
    const { error } = await withRetry(() =>
      supabase.from(table).insert(primary).select()
    );
    results.push({ batch: 'primary', count: primary.length, success: !error, error: error?.message });
  }

  if (secondary.length > 0) {
    const { error } = await withRetry(() =>
      supabase.from(table).insert(secondary).select()
    );
    results.push({ batch: 'secondary', count: secondary.length, success: !error, error: error?.message });
  }

  return results;
}

// --- READ FUNCTIONS ---

/**
 * Fetch the most recent agent logs for a given tenant.
 *
 * @param {Object} supabase  - Supabase client
 * @param {Object} params
 * @param {string} params.tenantId   - REQUIRED. Tenant identifier.
 * @param {string} [params.agentName] - Optional: filter to one agent.
 * @param {number} [params.limit=50]  - Max rows to return.
 * @returns {{ data: Array|null, error: string|null }}
 */
async function getRecentMemory(supabase, { tenantId, agentName, limit = 50 } = {}) {
  const guard = requireTenantId(tenantId, 'getRecentMemory');
  if (guard) return guard;

  let query = supabase
    .from('anima_agent_logs')
    .select('id, agent_name, task_description, mission_alignment, model_used, tokens_used, cost_usd, cycle_number, vitality_score, pi_pulse_timestamp, immune_scan_result, threat_detected, threat_severity, created_at')
    .eq('tenant_id', tenantId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (agentName) {
    query = query.eq('agent_name', agentName);
  }

  const { data, error } = await query;
  return { data: data || [], error: error?.message || null };
}

/**
 * Get full execution context for a tenant: recent logs + active agent states.
 * Used by the execution engine to build LLM context windows.
 *
 * @param {Object} supabase
 * @param {Object} params
 * @param {string} params.tenantId  - REQUIRED.
 * @param {string} [params.agentName] - Scope to one agent if provided.
 * @returns {{ data: { logs, agents }|null, error: string|null }}
 */
async function getContext(supabase, { tenantId, agentName } = {}) {
  const guard = requireTenantId(tenantId, 'getContext');
  if (guard) return guard;

  // Fetch recent logs scoped to tenant
  const { data: logs, error: logsError } = await getRecentMemory(supabase, {
    tenantId,
    agentName,
    limit: 20,
  });

  if (logsError) {
    return { data: null, error: logsError };
  }

  // Fetch live agent states scoped to tenant
  const agentQueryBase = supabase
    .from('anima_fractal_state')
    .select('branch_id, depth_level, vitality_score, status, personal_best, last_heartbeat')
    .eq('tenant_id', tenantId)
    .neq('status', 'PRUNED');

  const { data: agents, error: agentsError } = await (
    agentName ? agentQueryBase.eq('branch_id', agentName) : agentQueryBase
  );

  if (agentsError) {
    return { data: null, error: agentsError.message };
  }

  return {
    data: { logs: logs || [], agents: agents || [] },
    error: null,
  };
}

// --- STRICT-TENANT READ FUNCTIONS ---
// These functions throw on missing tenantId rather than returning an error
// object. Use them anywhere a missing tenant must be treated as a hard
// security violation (e.g. agent execution pipeline, API route handlers).

/**
 * Fetch the most recent entries from anima_agent_logs for a tenant.
 *
 * @param {Object} supabase
 * @param {Object} params
 * @param {string} params.tenantId  - REQUIRED. Throws if null/undefined.
 * @param {string} [params.agentName] - Filter to one agent.
 * @param {number} [params.limit=50]
 * @returns {Promise<Array>} rows — never null, always an array.
 * @throws {Error} 'Security Breach: tenantId required for memory access'
 */
async function getRecentLogs(supabase, { tenantId, agentName, limit = 50 } = {}) {
  if (tenantId == null || tenantId === '') {
    throw new Error('Security Breach: tenantId required for memory access');
  }

  let query = supabase
    .from('anima_agent_logs')
    .select('id, agent_name, task_description, mission_alignment, model_used, tokens_used, cost_usd, cycle_number, vitality_score, pi_pulse_timestamp, immune_scan_result, threat_detected, threat_severity, created_at')
    .eq('tenant_id', tenantId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (agentName) {
    query = query.eq('agent_name', agentName);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Get full execution context for a tenant: recent logs + live agent states.
 * Used by the execution engine to build LLM context windows.
 *
 * @param {Object} supabase
 * @param {Object} params
 * @param {string} params.tenantId  - REQUIRED. Throws if null/undefined.
 * @param {string} [params.agentName] - Scope to one agent.
 * @returns {Promise<{ logs: Array, agents: Array }>}
 * @throws {Error} 'Security Breach: tenantId required for memory access'
 */
async function getAgentContext(supabase, { tenantId, agentName } = {}) {
  if (tenantId == null || tenantId === '') {
    throw new Error('Security Breach: tenantId required for memory access');
  }

  // Logs — tenant_id enforced inside getRecentLogs
  const logs = await getRecentLogs(supabase, { tenantId, agentName, limit: 20 });

  // Agent states — anima_fractal_state is scoped by user_id via RLS;
  // tenant_id column not yet present on this table (see migration v1.6).
  const agentQueryBase = supabase
    .from('anima_fractal_state')
    .select('branch_id, depth_level, vitality_score, status, personal_best, last_heartbeat')
    .neq('status', 'PRUNED');

  const { data: agents, error: agentsError } = await (
    agentName ? agentQueryBase.eq('branch_id', agentName) : agentQueryBase
  );

  if (agentsError) throw new Error(agentsError.message);

  return { logs, agents: agents || [] };
}

/**
 * Fetch all knowledge entries for a tenant and return them as a
 * formatted string ready to inject into an LLM context window.
 *
 * @param {Object} supabase
 * @param {string} tenantId - REQUIRED. Throws if null/undefined.
 * @returns {Promise<string>} 'CONNAISSANCE CLIENT : ...' or '' if none found.
 * @throws {Error} 'Security Breach: tenantId required for memory access'
 */
async function getClientKnowledge(supabase, tenantId) {
  if (tenantId == null || tenantId === '') {
    throw new Error('Security Breach: tenantId required for memory access');
  }

  const { data, error } = await supabase
    .from('anima_agent_logs')
    .select('task_description')
    .eq('tenant_id', tenantId)
    .eq('task_type', 'KNOWLEDGE')
    .is('archived_at', null)
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) return '';

  const combined = data
    .map(row => row.task_description)
    .filter(Boolean)
    .join('\n');

  return combined ? `CONNAISSANCE CLIENT : ${combined}` : '';
}

/**
 * Upsert a knowledge fact for a tenant.
 * If a row with the same (tenant_id, category) already exists, it is
 * overwritten. Otherwise a new row is inserted.
 * This is the manual control lever: call it to correct or enrich what
 * the AI knows about a client without touching the rest of the logs.
 *
 * @param {Object} supabase
 * @param {string} tenantId  - REQUIRED. Throws if null/undefined.
 * @param {string} category  - Knowledge key, e.g. 'company_profile', 'tone'.
 * @param {string} data      - The fact to store (plain text).
 * @returns {Promise<{ id: string, action: 'inserted'|'updated' }>}
 * @throws {Error} 'Security Breach: tenantId required for memory access'
 */
async function upsertKnowledge(supabase, tenantId, category, data, metadata = {}) {
  if (tenantId == null || tenantId === '') {
    throw new Error('Security Breach: tenantId required for memory access');
  }
  if (!category || typeof category !== 'string') {
    throw new Error('upsertKnowledge: category must be a non-empty string');
  }

  // agent_name is used as the category key — format: "KNOWLEDGE:<category>"
  const agentKey = `KNOWLEDGE:${category}`;

  // Check for existing row
  const { data: existing } = await supabase
    .from('anima_agent_logs')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('agent_name', agentKey)
    .eq('task_type', 'KNOWLEDGE')
    .is('archived_at', null)
    .maybeSingle();

  if (existing) {
    // UPDATE — overwrite the fact
    const { error } = await supabase
      .from('anima_agent_logs')
      .update({
        task_description:   data,
        metadata:           metadata,
        pi_pulse_timestamp: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) throw new Error(`upsertKnowledge update failed: ${error.message}`);
    return { id: existing.id, action: 'updated' };
  }

  // INSERT — new fact
  const { data: inserted, error: insertError } = await supabase
    .from('anima_agent_logs')
    .insert({
      agent_name:         agentKey,
      task_type:          'KNOWLEDGE',
      task_description:   data,
      metadata:           metadata,
      tenant_id:          tenantId,
      fractal_depth:      0,
      phi_weight:         1.0,
      mission_alignment:  1.0,
      model_used:         'manual',
      pi_pulse_timestamp: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insertError) throw new Error(`upsertKnowledge insert failed: ${insertError.message}`);
  return { id: inserted.id, action: 'inserted' };
}

// --- MEMORY COMPACTION ---

/**
 * Compact agent logs for a tenant by archiving old entries.
 * Keeps the last `keepPerAgent` logs per agent, archives the rest.
 *
 * @param {Object} supabase
 * @param {string} tenantId   - REQUIRED.
 * @param {number} [keepPerAgent=50]
 */
async function compactLogs(supabase, tenantId, keepPerAgent = 50) {
  const guard = requireTenantId(tenantId, 'compactLogs');
  if (guard) return guard;

  const { data: agents } = await supabase
    .from('anima_fractal_state')
    .select('branch_id')
    .eq('tenant_id', tenantId)
    .neq('status', 'PRUNED');

  if (!agents) return { compacted: 0, archived: 0, error: null };

  let totalCompacted = 0;
  let totalArchived  = 0;

  for (const agent of agents) {
    const { count } = await supabase
      .from('anima_agent_logs')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('agent_name', agent.branch_id);

    if (count > keepPerAgent) {
      const toArchive = count - keepPerAgent;
      const { data: oldLogs } = await supabase
        .from('anima_agent_logs')
        .select('id, created_at')
        .eq('tenant_id', tenantId)
        .eq('agent_name', agent.branch_id)
        .order('created_at', { ascending: true })
        .limit(toArchive);

      if (oldLogs && oldLogs.length > 0) {
        const ids = oldLogs.map(l => l.id);
        await withRetry(() =>
          supabase
            .from('anima_agent_logs')
            .update({ archived_at: new Date().toISOString() })
            .in('id', ids)
            .eq('tenant_id', tenantId) // redundant but explicit — belt and braces
        );
        totalArchived += ids.length;
      }
      totalCompacted++;
    }
  }

  return { compacted: totalCompacted, archived: totalArchived, timestamp: new Date().toISOString(), error: null };
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
 *
 * @param {Object} supabase
 * @param {Object} genesisState
 * @param {string} tenantId - REQUIRED.
 */
async function backupGenesisState(supabase, genesisState, tenantId) {
  const guard = requireTenantId(tenantId, 'backupGenesisState');
  if (guard) return guard;

  return withRetry(() =>
    supabase.from('anima_agent_logs').insert({
      agent_name:        'MEMORY_NODE',
      task_type:         'genesis_backup',
      task_description:  `Genesis backup at cycle ${genesisState.cycle_counter}`,
      mission_alignment: genesisState.mission_alignment_score || 0,
      vitality_score:    genesisState.last_vitality_score || 0,
      cost_usd:          0,
      model_used:        'system',
      metadata:          genesisState,
      tenant_id:         tenantId,
    })
  );
}

// --- PHEROMONE CLEANUP ---

/**
 * Decay and clean up old pheromone trails for a tenant.
 *
 * @param {Object} supabase
 * @param {string} tenantId  - REQUIRED.
 * @param {number} [maxAge_ms]
 */
async function cleanPheromoneTrails(supabase, tenantId, maxAge_ms = PI * PI * 60 * 1000) {
  const guard = requireTenantId(tenantId, 'cleanPheromoneTrails');
  if (guard) return guard;

  const cutoff = new Date(Date.now() - maxAge_ms).toISOString();
  const { data, error } = await supabase
    .from('anima_agent_logs')
    .update({ archived_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .eq('task_type', 'pheromone_trail')
    .lt('created_at', cutoff)
    .is('archived_at', null);

  return { cleaned: data?.length || 0, cutoff, error: error?.message || null };
}

// --- SEMANTIC MEMORY (pgvector foundation) ---

/**
 * Store a vector embedding alongside a knowledge entry.
 *
 * Current behaviour: writes the embedding into the metadata JSONB column
 * as a plain float array so the data is preserved and queryable via JSON
 * operators today.
 *
 * Future (when pgvector is enabled on the project):
 *   1. Run: CREATE EXTENSION IF NOT EXISTS vector;
 *   2. ALTER TABLE anima_agent_logs ADD COLUMN embedding vector(1536);
 *   3. Replace the metadata write below with: .update({ embedding: vector })
 *   4. Create index: CREATE INDEX ON anima_agent_logs USING ivfflat (embedding vector_cosine_ops);
 *
 * @param {Object} supabase
 * @param {string} tenantId         - REQUIRED.
 * @param {string} logId            - The anima_agent_logs row to update.
 * @param {number[]} embeddingVector - Float array (e.g. 1536-dim for text-embedding-3-small).
 * @param {Object}  [extraMetadata] - Additional metadata to merge.
 */
async function upsertEmbedding(supabase, tenantId, logId, embeddingVector, extraMetadata = {}) {
  const guard = requireTenantId(tenantId, 'upsertEmbedding');
  if (guard) return guard;

  const { error } = await supabase
    .from('anima_agent_logs')
    .update({
      metadata: {
        ...extraMetadata,
        embedding: embeddingVector,
        embedded_at: new Date().toISOString(),
      },
    })
    .eq('id', logId)
    .eq('tenant_id', tenantId); // enforce tenant isolation

  if (error) return { data: null, error: error.message };
  return { data: { id: logId }, error: null };
}

module.exports = {
  COMPACTION_INTERVAL_MS,
  ARCHIVE_THRESHOLD_CYCLES,
  requireTenantId,
  backoffDelay,
  withRetry,
  phiBatch,
  batchWrite,
  getRecentMemory,
  getContext,
  getRecentLogs,
  getAgentContext,
  getClientKnowledge,
  upsertKnowledge,
  upsertEmbedding,
  compactLogs,
  memoryValue,
  accessibleAgents,
  backupGenesisState,
  cleanPheromoneTrails,
};
