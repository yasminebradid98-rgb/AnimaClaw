/**
 * NEXUS — Orchestrateur Central d'AnimaOS
 * Version: 1.0.0
 *
 * Rôle : Le cerveau unique.
 *   - Reçoit une requête (utilisateur ou système)
 *   - Choisit le modèle LLM selon la complexité (Hybrid Intelligence)
 *   - Exécute une boucle agentique : planifier → appeler outils → observer → re-planifier
 *   - Délègue les actions aux Tool Agents (fonctions pures, pas de LLM)
 *   - Retourne la réponse finale après validation immune
 *
 * Pattern "Brain & Arms" :
 *   NEXUS (ce fichier)  = cerveau → raisonne, planifie, dialogue
 *   Tool Agents         = bras    → exécutent du code pur, aucun LLM
 *
 * Hybrid Intelligence :
 *   Complexité < COMPLEXITY_THRESHOLD → Gemini Flash (rapide, économique)
 *   Complexité ≥ COMPLEXITY_THRESHOLD → Claude Sonnet (puissant, précis)
 */

'use strict';

const { createClient }  = require('@supabase/supabase-js');
const toolRegistry      = require('./tool_registry');
const immuneScanner     = require('./immune_scanner');

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const NEXUS_VERSION = '1.0.0';

// Hybrid Intelligence — seuil de bascule
const COMPLEXITY_THRESHOLD = 0.45;

const MODELS = {
  fast:  'google/gemini-flash-1.5',           // Tâches simples
  smart: 'anthropic/claude-3.5-sonnet',       // Analyses complexes
};

// Mots-clés qui augmentent le score de complexité
const COMPLEXITY_KEYWORDS = [
  'analyse', 'analyser', 'compare', 'comparer', 'stratégie', 'strategy',
  'planifie', 'plan', 'optimise', 'optimize', 'architecture', 'diagnose',
  'diagnostic', 'synthèse', 'synthesize', 'rapport', 'report', 'prévision',
  'forecast', 'explique pourquoi', 'explain why', 'plusieurs', 'multiple',
  'étapes', 'steps', 'workflow', 'orchestrer', 'orchestrate',
];

const MAX_ITERATIONS    = 10;   // Max tours dans la boucle agentique
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_TEMPERATURE = 0.7;

// System prompt de base de NEXUS
const NEXUS_SYSTEM_PROMPT = `Tu es NEXUS, l'orchestrateur central d'AnimaOS.

Ton rôle :
- Comprendre l'intention de l'utilisateur
- Planifier les actions nécessaires
- Utiliser les outils disponibles pour exécuter ces actions
- Synthétiser un résultat clair et utile

Principes :
- Sois concis et précis dans tes réponses
- Utilise les outils plutôt que d'inventer des informations
- Si une information n'est pas disponible via les outils, dis-le clairement
- Ne fais jamais semblant d'avoir exécuté une action si ce n'est pas le cas
- Réponds toujours dans la langue de l'utilisateur`;

// ═══════════════════════════════════════════════════════════════════
// NEXUS CLASS
// ═══════════════════════════════════════════════════════════════════

class Nexus {
  constructor(config = {}) {
    this.supabase = config.supabase || this._initSupabase();
    this.openrouterKey = config.openrouterKey || process.env.OPENROUTER_API_KEY;
    this.defaultTemperature = config.temperature ?? DEFAULT_TEMPERATURE;
    this.defaultMaxTokens   = config.maxTokens   ?? DEFAULT_MAX_TOKENS;
    this._extraTools = []; // outils enregistrés dynamiquement
  }

  // ─── Init Supabase ────────────────────────────────────────────────
  _initSupabase() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
  }

  // ─── Enregistrement d'un outil externe ────────────────────────────
  /**
   * Permet d'ajouter un outil custom à cette instance de NEXUS.
   * @param {string} name
   * @param {Object} schema
   * @param {Function} handler
   */
  registerTool(name, schema, handler) {
    toolRegistry.registerTool(name, schema, handler);
    this._extraTools.push(name);
    return this;
  }

  // ─── Estimation de complexité ─────────────────────────────────────
  /**
   * Estime la complexité d'une requête (0.0 → 1.0).
   * Utilisé pour le routing hybride Fast ↔ Smart.
   */
  estimateComplexity(input) {
    let score = 0;

    // Longueur du texte
    if (input.length > 300)  score += 0.15;
    if (input.length > 700)  score += 0.15;
    if (input.length > 1500) score += 0.10;

    // Mots-clés complexes
    const lower = input.toLowerCase();
    const hits = COMPLEXITY_KEYWORDS.filter(kw => lower.includes(kw)).length;
    score += Math.min(hits * 0.12, 0.36);

    // Plusieurs questions (? multiples)
    const questions = (input.match(/\?/g) || []).length;
    if (questions > 1) score += questions * 0.05;

    // Énumération (bullets, chiffres)
    if (/(\d\.|•|-)\s/.test(input)) score += 0.10;

    return Math.min(score, 1.0);
  }

  // ─── Sélection du modèle ──────────────────────────────────────────
  /**
   * Choisit Fast ou Smart selon la complexité.
   * Le tenant peut forcer un modèle via context.model.
   */
  selectModel(input, context = {}) {
    if (context.model) return context.model;
    const complexity = this.estimateComplexity(input);
    const model = complexity >= COMPLEXITY_THRESHOLD ? MODELS.smart : MODELS.fast;
    return { model, complexity };
  }

  // ─── Résolution de la clé tenant ──────────────────────────────────
  async _resolveTenantKey(tenantId) {
    if (!this.supabase || !tenantId) return null;
    const { data } = await this.supabase
      .from('tenant_secrets')
      .select('provider, api_key, model_override')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    return data || null;
  }

  // ─── Enrichissement du prompt avec la mémoire tenant ──────────────
  async _enrichSystemPrompt(tenantId, basePrompt) {
    if (!this.supabase || !tenantId) return basePrompt;
    try {
      const { data } = await this.supabase
        .from('memory_entries')
        .select('key, content')
        .eq('tenant_id', tenantId)
        .order('updated_at', { ascending: false })
        .limit(20);
      if (!data?.length) return basePrompt;
      const context = data.map(e => `[${e.key}]: ${e.content}`).join('\n');
      return `${basePrompt}\n\n## Contexte tenant\n${context}`;
    } catch {
      return basePrompt;
    }
  }

  // ─── Appel LLM avec tool calling ──────────────────────────────────
  async _callLLM({ messages, tools, model, tenantId, temperature, maxTokens }) {
    const apiKey = await this._getApiKey(tenantId);
    const body = {
      model,
      messages,
      temperature: temperature ?? this.defaultTemperature,
      max_tokens: maxTokens ?? this.defaultMaxTokens,
    };
    if (tools?.length) {
      body.tools = tools;
      body.tool_choice = 'auto';
    }
    const response = await this._httpsPost({
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://animaclaw.ai',
        'X-Title': 'AnimaOS NEXUS',
        ...(tenantId && { 'X-Tenant-ID': String(tenantId) }),
      },
      body,
    });

    if (response.error) throw new Error(`LLM error: ${response.error.message}`);
    if (!response.choices?.length) throw new Error('Aucune réponse du LLM.');

    const choice = response.choices[0];
    return {
      content:      choice.message?.content || '',
      toolCalls:    choice.message?.tool_calls || [],
      finishReason: choice.finish_reason,
      model:        response.model || model,
      usage: {
        promptTokens:     response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens:      response.usage?.total_tokens || 0,
      },
      costUsd: response.usage?.cost || 0,
    };
  }

  async _getApiKey(tenantId) {
    // Clé du tenant en priorité
    const secret = await this._resolveTenantKey(tenantId);
    if (secret?.api_key && secret?.provider === 'openrouter') {
      return secret.api_key;
    }
    // Fallback clé système
    if (!this.openrouterKey) throw new Error('OPENROUTER_API_KEY manquant.');
    return this.openrouterKey;
  }

  // ─── HTTPS helper (auto-detect http vs https) ─────────────────────
  _httpsPost({ hostname, path, headers, body }) {
    const https = require('https');
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(body);
      const req = https.request(
        {
          hostname, port: 443, path, method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            ...headers,
          },
        },
        (res) => {
          let data = '';
          res.on('data', c => (data += c));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (res.statusCode >= 400) {
                reject(new Error(`HTTP ${res.statusCode}: ${parsed.error?.message || data.slice(0, 200)}`));
                return;
              }
              resolve(parsed);
            } catch (e) {
              reject(new Error(`Parse error: ${e.message}`));
            }
          });
        }
      );
      req.on('error', e => reject(new Error(`Request failed: ${e.message}`)));
      req.setTimeout(120000, () => { req.destroy(); reject(new Error('Timeout 120s')); });
      req.write(postData);
      req.end();
    });
  }

  // ─── Logging ──────────────────────────────────────────────────────
  async _log({ tenantId, input, output, model, usage, toolsUsed, iterations, durationMs }) {
    if (!this.supabase) return;
    try {
      await this.supabase.from('anima_agent_logs').insert({
        agent_name:       'NEXUS',
        fractal_depth:    0,
        phi_weight:       1.0,
        task_description: input.slice(0, 500),
        model_used:       model,
        tokens_used:      usage?.totalTokens || 0,
        cost_usd:         usage?.costUsd || 0,
        tenant_id:        tenantId || null,
        metadata: {
          tools_used: toolsUsed,
          iterations,
          duration_ms: durationMs,
          output_preview: output.slice(0, 200),
        },
      });
    } catch (e) {
      console.warn('[NEXUS] Log failed:', e.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // POINT D'ENTRÉE PRINCIPAL
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Traite une requête via la boucle agentique.
   *
   * @param {string} input       - La requête utilisateur
   * @param {string} tenantId    - ID du tenant (pour isolation des données)
   * @param {Object} context     - Options : { model, sessionId, history, systemPrompt, temperature, maxTokens }
   * @returns {Promise<NexusResult>}
   */
  async process(input, tenantId = null, context = {}) {
    const startMs = Date.now();

    if (!input?.trim()) {
      return this._errorResult('Requête vide.', null, 0);
    }

    // 1. Sélection du modèle (Hybrid Intelligence)
    const { model, complexity } = this.selectModel(input, context);
    console.log(`[NEXUS] Complexité=${complexity.toFixed(2)} → Modèle=${model}`);

    // 2. Construction du system prompt enrichi
    const basePrompt  = context.systemPrompt || NEXUS_SYSTEM_PROMPT;
    const systemPrompt = await this._enrichSystemPrompt(tenantId, basePrompt);

    // 3. Historique de messages
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(context.history || []),
      { role: 'user', content: input },
    ];

    // 4. Outils disponibles
    const tools = toolRegistry.getToolSchemas();

    // 5. Boucle agentique
    const toolsUsed = [];
    let   iterations = 0;
    let   lastUsage  = null;
    let   lastModel  = model;

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      let response;
      try {
        response = await this._callLLM({
          messages,
          tools,
          model,
          tenantId,
          temperature: context.temperature,
          maxTokens:   context.maxTokens,
        });
      } catch (err) {
        console.error(`[NEXUS] Erreur LLM (iter ${iterations}):`, err.message);
        return this._errorResult(
          `Erreur LLM : ${err.message}`,
          model,
          Date.now() - startMs
        );
      }

      lastUsage = response.usage;
      lastModel = response.model;

      // Pas d'appel d'outil → réponse finale
      if (!response.toolCalls?.length) {
        // Scan immune sur la sortie
        const scanResult = await this._immuneScan(response.content);
        if (scanResult.blocked) {
          return this._errorResult(
            'Réponse bloquée par le scanner de sécurité.',
            lastModel,
            Date.now() - startMs
          );
        }

        const durationMs = Date.now() - startMs;
        await this._log({
          tenantId, input,
          output:     response.content,
          model:      lastModel,
          usage:      { ...lastUsage, costUsd: response.costUsd },
          toolsUsed,
          iterations,
          durationMs,
        });

        return {
          success:    true,
          content:    response.content,
          model:      lastModel,
          complexity,
          toolsUsed,
          iterations,
          usage:      lastUsage,
          costUsd:    response.costUsd,
          durationMs,
        };
      }

      // Il y a des appels d'outils → les exécuter
      messages.push({
        role:       'assistant',
        content:    response.content || null,
        tool_calls: response.toolCalls,
      });

      for (const toolCall of response.toolCalls) {
        const toolName = toolCall.function?.name;
        let params = {};
        try {
          params = JSON.parse(toolCall.function?.arguments || '{}');
        } catch {
          params = {};
        }

        console.log(`[NEXUS] Outil: ${toolName}`, params);
        toolsUsed.push(toolName);

        const toolResult = await toolRegistry.executeTool(
          toolName,
          params,
          tenantId,
          this.supabase
        );

        messages.push({
          role:         'tool',
          tool_call_id: toolCall.id,
          content:      JSON.stringify(toolResult),
        });
      }
    }

    // Max itérations atteint
    const durationMs = Date.now() - startMs;
    const fallbackContent = 'Limite d\'itérations atteinte. Résultat partiel basé sur les outils exécutés.';
    await this._log({ tenantId, input, output: fallbackContent, model: lastModel, usage: lastUsage, toolsUsed, iterations, durationMs });

    return {
      success:    false,
      content:    fallbackContent,
      model:      lastModel,
      complexity,
      toolsUsed,
      iterations,
      usage:      lastUsage,
      durationMs,
      warning:    'MAX_ITERATIONS_REACHED',
    };
  }

  // ─── Scan immune (wrapper safe) ───────────────────────────────────
  async _immuneScan(content) {
    try {
      const result = await immuneScanner.scanOutput(content);
      const blocked = result?.threat_level === 'HIGH' || result?.threat_level === 'CRITICAL';
      return { blocked, result };
    } catch {
      return { blocked: false }; // Ne pas bloquer si le scanner échoue
    }
  }

  // ─── Résultat d'erreur standardisé ────────────────────────────────
  _errorResult(message, model, durationMs) {
    return {
      success:    false,
      content:    message,
      model:      model || 'unknown',
      complexity: 0,
      toolsUsed:  [],
      iterations: 0,
      usage:      null,
      durationMs,
      error:      message,
    };
  }

  // ─── Factory ──────────────────────────────────────────────────────
  static fromEnv(config = {}) {
    return new Nexus(config);
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  Nexus,
  MODELS,
  COMPLEXITY_THRESHOLD,
  NEXUS_VERSION,
};

/**
 * @typedef {Object} NexusResult
 * @property {boolean} success       - La requête s'est terminée sans erreur
 * @property {string}  content       - La réponse finale de NEXUS
 * @property {string}  model         - Modèle LLM utilisé
 * @property {number}  complexity    - Score de complexité estimé (0-1)
 * @property {string[]} toolsUsed    - Noms des outils appelés
 * @property {number}  iterations    - Nombre de tours dans la boucle agentique
 * @property {Object}  usage         - Tokens utilisés (promptTokens, completionTokens, totalTokens)
 * @property {number}  costUsd       - Coût estimé en USD
 * @property {number}  durationMs    - Durée totale en ms
 * @property {string}  [warning]     - Avertissement éventuel
 * @property {string}  [error]       - Message d'erreur si success=false
 */
