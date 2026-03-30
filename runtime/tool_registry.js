/**
 * TOOL REGISTRY — AnimaOS Tool Agents
 * Version: 1.0.0
 *
 * Tool Agents = "les bras" de NEXUS.
 * Ce sont des fonctions de code pur — elles n'appellent PAS de LLM.
 * Elles reçoivent des paramètres, exécutent une action, retournent un résultat.
 *
 * Chaque outil expose :
 *   - schema  : définition JSON Schema compatible OpenAI function calling
 *   - handler : async (params, tenantId, supabase) => result
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════
// REGISTRY
// ═══════════════════════════════════════════════════════════════════

const registry = new Map(); // name → { schema, handler }

/**
 * Enregistre un outil dans le registry.
 * @param {string} name
 * @param {Object} schema  - JSON Schema (parameters)
 * @param {Function} handler - async (params, tenantId, supabase) => any
 */
function registerTool(name, schema, handler) {
  if (registry.has(name)) {
    console.warn(`[ToolRegistry] Outil "${name}" déjà enregistré — écrasement.`);
  }
  registry.set(name, { schema, handler });
}

/**
 * Retourne tous les schemas au format OpenAI tools array.
 */
function getToolSchemas() {
  const tools = [];
  for (const [name, { schema }] of registry) {
    tools.push({
      type: 'function',
      function: {
        name,
        description: schema.description,
        parameters: schema.parameters,
      },
    });
  }
  return tools;
}

/**
 * Exécute un outil par son nom.
 * @returns {{ success: boolean, result?: any, error?: string }}
 */
async function executeTool(name, params, tenantId, supabase) {
  const tool = registry.get(name);
  if (!tool) {
    return { success: false, error: `Outil inconnu: "${name}"` };
  }
  try {
    const result = await tool.handler(params, tenantId, supabase);
    return { success: true, result };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getTool(name) { return registry.get(name) || null; }
function listTools()   { return Array.from(registry.keys()); }

// ═══════════════════════════════════════════════════════════════════
// OUTILS NATIFS (Tool Agents intégrés)
// ═══════════════════════════════════════════════════════════════════

// ── 1. MEMORY SEARCH ───────────────────────────────────────────────
registerTool(
  'memory_search',
  {
    description: 'Recherche dans la mémoire/base de connaissance du tenant (produits, prix, infos client, historique).',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'La requête de recherche en langage naturel.' },
        limit: { type: 'number', description: 'Nombre max de résultats (défaut: 5).', default: 5 },
      },
      required: ['query'],
    },
  },
  async ({ query, limit = 5 }, tenantId, supabase) => {
    if (!supabase || !tenantId) return { entries: [], message: 'Mémoire non disponible.' };
    const { data, error } = await supabase
      .from('memory_entries')
      .select('key, content, created_at')
      .eq('tenant_id', tenantId)
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return { entries: data || [], count: (data || []).length };
  }
);

// ── 2. MEMORY WRITE ────────────────────────────────────────────────
registerTool(
  'memory_write',
  {
    description: 'Sauvegarde une information importante dans la mémoire persistante du tenant.',
    parameters: {
      type: 'object',
      properties: {
        key:     { type: 'string', description: 'Identifiant unique de la mémoire (ex: "client_preference_langue").' },
        content: { type: 'string', description: 'Contenu à mémoriser.' },
      },
      required: ['key', 'content'],
    },
  },
  async ({ key, content }, tenantId, supabase) => {
    if (!supabase || !tenantId) throw new Error('Supabase requis pour écrire en mémoire.');
    const { error } = await supabase
      .from('memory_entries')
      .upsert({ tenant_id: tenantId, key, content, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { saved: true, key };
  }
);

// ── 3. TASK CREATE ──────────────────────────────────────────────────
registerTool(
  'task_create',
  {
    description: 'Crée une tâche dans la file d\'exécution pour un agent spécifique.',
    parameters: {
      type: 'object',
      properties: {
        task_type:   { type: 'string', description: 'Type de tâche (ex: "email_campaign", "data_analysis").' },
        description: { type: 'string', description: 'Description détaillée de ce que l\'agent doit faire.' },
        agent_id:    { type: 'string', description: 'ID de l\'agent ciblé (optionnel — NEXUS route si absent).' },
        priority:    { type: 'number', description: 'Priorité 1-10 (défaut: 5).', default: 5 },
        payload:     { type: 'object', description: 'Données additionnelles pour la tâche.' },
      },
      required: ['task_type', 'description'],
    },
  },
  async ({ task_type, description, agent_id, priority = 5, payload = {} }, tenantId, supabase) => {
    if (!supabase) throw new Error('Supabase requis pour créer une tâche.');
    const { data, error } = await supabase
      .from('anima_task_queue')
      .insert({
        task_type,
        task_status: 'pending',
        payload: { ...payload, description },
        agent_id: agent_id || null,
        priority,
        tenant_id: tenantId || null,
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return { created: true, task_id: data.id, task_type, priority };
  }
);

// ── 4. TASK LIST ────────────────────────────────────────────────────
registerTool(
  'task_list',
  {
    description: 'Liste les tâches récentes dans la file d\'exécution.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed', 'all'], default: 'all' },
        limit:  { type: 'number', description: 'Nombre max de tâches (défaut: 10).', default: 10 },
      },
    },
  },
  async ({ status = 'all', limit = 10 }, tenantId, supabase) => {
    if (!supabase) return { tasks: [] };
    let query = supabase
      .from('anima_task_queue')
      .select('id, task_type, task_status, priority, created_at, agent_id')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (tenantId) query = query.eq('tenant_id', tenantId);
    if (status !== 'all') query = query.eq('task_status', status);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { tasks: data || [], count: (data || []).length };
  }
);

// ── 5. AGENT LIST ───────────────────────────────────────────────────
registerTool(
  'agent_list',
  {
    description: 'Liste les agents disponibles et leur statut (idle, active, offline).',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['idle', 'active', 'offline', 'all'], default: 'all' },
      },
    },
  },
  async ({ status = 'all' }, tenantId, supabase) => {
    if (!supabase) return { agents: [] };
    let query = supabase
      .from('agents')
      .select('id, name, role, status, last_seen')
      .order('last_seen', { ascending: false });
    if (status !== 'all') query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { agents: data || [], count: (data || []).length };
  }
);

// ── 6. AGENT MESSAGE ────────────────────────────────────────────────
registerTool(
  'agent_message',
  {
    description: 'Envoie un message direct à un agent spécifique.',
    parameters: {
      type: 'object',
      properties: {
        agent_id: { type: 'string', description: 'ID ou nom de l\'agent destinataire.' },
        message:  { type: 'string', description: 'Contenu du message à envoyer.' },
        priority: { type: 'string', enum: ['normal', 'urgent'], default: 'normal' },
      },
      required: ['agent_id', 'message'],
    },
  },
  async ({ agent_id, message, priority = 'normal' }, tenantId, supabase) => {
    if (!supabase) throw new Error('Supabase requis pour envoyer un message.');
    const { error } = await supabase
      .from('activities')
      .insert({
        type: 'nexus_message',
        agent_id,
        content: message,
        metadata: { priority, source: 'NEXUS', tenant_id: tenantId },
        created_at: new Date().toISOString(),
      });
    if (error) throw new Error(error.message);
    return { sent: true, agent_id, preview: message.slice(0, 80) };
  }
);

// ── 7. COST CHECK ───────────────────────────────────────────────────
registerTool(
  'cost_check',
  {
    description: 'Vérifie la consommation et les coûts API du tenant sur une période.',
    parameters: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Nombre de jours à analyser (défaut: 7).', default: 7 },
      },
    },
  },
  async ({ days = 7 }, tenantId, supabase) => {
    if (!supabase || !tenantId) return { costs: [], total_usd: 0 };
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('anima_agent_logs')
      .select('model_used, tokens_used, cost_usd, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', since)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    const total = (data || []).reduce((sum, r) => sum + (r.cost_usd || 0), 0);
    const byModel = {};
    for (const row of (data || [])) {
      const m = row.model_used || 'unknown';
      byModel[m] = (byModel[m] || 0) + (row.cost_usd || 0);
    }
    return { total_usd: parseFloat(total.toFixed(6)), by_model: byModel, period_days: days };
  }
);

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  registerTool,
  executeTool,
  getToolSchemas,
  getTool,
  listTools,
};
