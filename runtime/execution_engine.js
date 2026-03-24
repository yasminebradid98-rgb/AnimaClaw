/**
 * EXECUTION ENGINE — Task Queue Processing Pipeline
 * Version: 1.1.0
 * Engine: SOLARIS
 *
 * Schema (v17 production):
 *   anima_task_queue columns:
 *     id, created_at, updated_at, task_type, task_status,
 *     priority, payload, result, agent_id, claimed_at,
 *     completed_at, error_message, retry_count, tenant_id
 *
 *   task_status enum: pending | processing | completed | failed | cancelled
 *
 * Pipeline:
 *   anima_task_queue (pending)
 *     → phi_core.routeTask()      → agent selection
 *     → llm_client.callLLM()      → LLM call
 *     → immune_scanner.scanOutput() → validation
 *     → anima_agent_logs          ← logging
 *     → anima_fractal_state       ← vitality update
 *     → anima_task_queue          ← status update (completed | failed)
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const naturalLaw = require('./natural_law');
const phiCore = require('./phi_core');
const llmClient = require('./llm_client');
const immuneScanner = require('./immune_scanner');

// ═══════════════════════════════════════════════════════════════════
// SKILLS LOADER
// ═══════════════════════════════════════════════════════════════════

const SKILLS_DIR = path.join(__dirname, 'skills');

function loadSkill(agentId) {
  const filePath = path.join(SKILLS_DIR, `${agentId}.json`);
  if (!fs.existsSync(filePath)) return null;
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch { return null; }
}

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG = {
  // LLM settings
  llmMode: 'openrouter',
  llmModel: 'anthropic/claude-3.5-sonnet',
  temperature: 0.7,
  maxTokens: 4000,

  // Execution settings
  maxRetries: 3,
  retryDelayMs: 1000,
  taskTimeoutMs: 120000,

  // Batch settings
  batchSize: 1,
  processIntervalMs: 1000,

  // System prompts by agent type
  systemPrompts: {
    ROOT_ORCHESTRATOR: 'You are ROOT_ORCHESTRATOR, the central intelligence of ANIMA OS. Coordinate tasks, maintain system coherence, and ensure all operations align with the mission.',
    PRIMARY_CELL: 'You are PRIMARY_CELL, responsible for core task execution. Process tasks efficiently and report outcomes clearly.',
    SUPPORT_CELL: 'You are SUPPORT_CELL, monitoring and assisting operations. Track system health and alert on anomalies.',
    MEMORY_NODE: 'You are MEMORY_NODE, managing persistent memory. Store, retrieve, and compact information as needed.',
    EVOLUTION_NODE: 'You are EVOLUTION_NODE, driving behavioral evolution. Analyze patterns and suggest improvements.',
    IMMUNE_AGENT: 'You are IMMUNE_AGENT, the security system. Scan for threats, validate outputs, and quarantine violations.',
  },
};

// ═══════════════════════════════════════════════════════════════════
// EXECUTION ENGINE CLASS
// ═══════════════════════════════════════════════════════════════════

class ExecutionEngine {
  constructor(supabaseClient, config = {}) {
    this.supabase = supabaseClient;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isRunning = false;
    this.stats = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      retried: 0,
    };
  }

  /**
   * Create engine from environment variables
   */
  static fromEnv() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY required');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const config = {
      llmMode: llmClient.detectMode(),
      llmModel: process.env.ANIMA_LLM_MODEL || DEFAULT_CONFIG.llmModel,
      temperature: parseFloat(process.env.ANIMA_LLM_TEMP) || DEFAULT_CONFIG.temperature,
      maxTokens: parseInt(process.env.ANIMA_LLM_MAX_TOKENS) || DEFAULT_CONFIG.maxTokens,
    };

    return new ExecutionEngine(supabase, config);
  }

  /**
   * Claim and process next available task.
   * @returns {Promise<Object|null>} Task result or null if no tasks
   */
  async processNextTask() {
    // 1. CLAIM next task atomically via RPC (FOR UPDATE SKIP LOCKED)
    //    claim_next_task() sets task_status = 'processing' and claimed_at = NOW().
    //    See setup/migration_v1.7_claim_next_task.sql for the function definition.
    const { data: task, error: claimError } = await this.supabase
      .rpc('claim_next_task');

    if (claimError || !task || !task.id) {
      return null; // No pending tasks
    }

    console.log(`[ExecutionEngine] Processing task ${task.id} (${task.task_type}) for agent ${task.agent_id}`);

    try {
      // 2. DELEGATION CHECK — runs before fractal state lookup so agents
      //    that only orchestrate (ManagerAgent) don't need a fractal record.
      const skill = loadSkill(task.agent_id);
      const complexity = task.payload.complexity || 5;

      if (skill?.delegationRules?.complexityThreshold != null &&
          complexity > skill.delegationRules.complexityThreshold) {
        const delegated = await this.delegateTask(task, skill);
        if (delegated.length > 0) {
          await this.supabase
            .from('anima_task_queue')
            .update({
              task_status: 'completed',
              result: { delegated: delegated.map(t => t.id) },
              completed_at: new Date().toISOString(),
            })
            .eq('id', task.id);

          this.stats.processed++;
          this.stats.succeeded++;
          console.log(`[ExecutionEngine] Task ${task.id} delegated to: ${delegated.map(t => t.agent_id).join(', ')}`);
          return { taskId: task.id, status: 'delegated', delegated };
        }
      }

      // 3. Get agent from fractal state (only needed for direct LLM execution)
      const { data: agent, error: agentError } = await this.supabase
        .from('anima_fractal_state')
        .select('*')
        .eq('branch_id', task.agent_id)
        .single();

      if (agentError || !agent) {
        throw new Error(`Agent ${task.agent_id} not found in fractal state`);
      }

      // 4. ROUTE TASK via phi_core
      // Normalize agent: ensure required numeric fields have valid fallbacks
      const normalizedAgent = {
        ...agent,
        phi_weight:    agent.phi_weight    || agent.personal_best || 1.618,
        vitality_score: agent.vitality_score ?? 0.9,
        depth:         agent.depth         ?? 0,
        current_load:  agent.current_load  ?? 0,
        max_capacity:  agent.max_capacity  ?? 10,
        // Force ALIVE if status would cause phi_core to skip this agent
        status: (agent.status === 'PRUNED' || agent.status === 'QUARANTINED' || !agent.status)
          ? 'ALIVE'
          : agent.status,
      };
      const routingResult = phiCore.routeTask(
        {
          id: task.id,
          complexity,
          urgency: task.payload.urgency || 0.5,
          mission_alignment: task.payload.alignment || 0.5,
        },
        [normalizedAgent]
      );

      if (!routingResult.agent) {
        throw new Error('No suitable agent found for task');
      }

      // 4. CALL LLM
      const systemPrompt = this.getSystemPromptForTask(task);
      const userPrompt = this.buildUserPrompt(task);
      const tenantId = task.tenant_id || null; // direct column, not inside payload

      // callLLMForTenant: if tenant has a key in tenant_secrets, use it.
      // Falls back to system env vars (OPENROUTER_API_KEY) when no tenant key.
      const llmResult = await llmClient.callLLMForTenant(this.supabase, tenantId, {
        mode:        this.config.llmMode,
        apiKey:      process.env.OPENROUTER_API_KEY,
        model:       this.config.llmModel,
        systemPrompt,
        userPrompt,
        tools:       task.payload.tools || [],
        temperature: this.config.temperature,
        maxTokens:   this.config.maxTokens,
        tenantId,
      });

      // 5. IMMUNE SCAN the output
      const scanResult = immuneScanner.scanOutput({
        content: llmResult.content,
        agentName: task.agent_id,
        taskType: task.task_type,
        metadata: {
          taskId: task.id,
          model: llmResult.model,
        },
      });

      // 6. LOG to anima_agent_logs
      const taskDesc = task.payload?.type === 'CHAT'
        ? `Chat: ${(task.payload.prompt || '').slice(0, 200)}`
        : (task.payload?.description || `Task ${task.id}`);

      const { error: logError } = await this.supabase
        .from('anima_agent_logs')
        .insert({
          agent_name: task.agent_id,
          fractal_depth: agent.depth_level || 0,
          phi_weight: agent.phi_weight || agent.personal_best || 0.5,
          task_description: taskDesc,
          mission_alignment: scanResult.alignment || 0.5,
          model_used: llmResult.model,
          tokens_used: llmResult.usage?.totalTokens || 0,
          cost_usd: llmResult.costUsd || 0,
          cycle_number: await this.getCurrentCycle(),
          vitality_score: agent.vitality_score || 0.5,
          pi_pulse_timestamp: new Date().toISOString(),
          tenant_id: tenantId,
          immune_scan_result: scanResult,
          threat_detected: scanResult.threatLevel !== 'NONE',
          threat_severity: scanResult.threatLevel !== 'NONE' ? scanResult.threatLevel : null,
        })
        .select()
        .single();

      if (logError) {
        console.warn('[ExecutionEngine] Log write warning:', logError.message);
      }

      // 7. UPDATE FRACTAL STATE (vitality)
      const newVitality = naturalLaw.calculateVitality(
        agent.depth_level || 0,
        scanResult.alignment || 0.5,
        1,
        agent.spawn_count > 0 ? agent.spawn_count / 8 : 0.5
      );

      await this.supabase
        .from('anima_fractal_state')
        .update({
          vitality_score: newVitality,
          personal_best: Math.max(agent.personal_best || 0, scanResult.alignment || 0),
          last_heartbeat: new Date().toISOString(),
        })
        .eq('branch_id', task.agent_id);

      // 8. UPDATE TASK QUEUE — mark completed or failed
      const isSevereThreat = scanResult.threatLevel === 'HIGH' || scanResult.threatLevel === 'CRITICAL';
      const isChatTask = task.payload?.type === 'CHAT';

      await this.supabase
        .from('anima_task_queue')
        .update({
          task_status: isSevereThreat ? 'failed' : 'completed',
          result: {
            reply: isChatTask ? llmResult.content : undefined,
            content: llmResult.content,
            toolCalls: llmResult.toolCalls,
            finishReason: llmResult.finishReason,
            model: llmResult.model,
            isPlaceholder: llmResult.isPlaceholder || false,
          },
          error_message: isSevereThreat ? `Threat detected: ${scanResult.threatLevel}` : null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      this.stats.processed++;
      this.stats.succeeded++;

      return {
        taskId: task.id,
        status: isSevereThreat ? 'failed' : 'completed',
        agent: task.agent_id,
        scanResult,
        llmResult: {
          content: llmResult.content,
          usage: llmResult.usage,
          cost: llmResult.costUsd,
        },
      };

    } catch (error) {
      console.error(`[ExecutionEngine] Task ${task.id} failed:`, error.message);

      await this.supabase
        .from('anima_task_queue')
        .update({
          task_status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      this.stats.processed++;
      this.stats.failed++;

      throw error;
    }
  }

  /**
   * Run continuous processing loop
   */
  async runLoop(options = {}) {
    const { continuous = true, intervalMs = this.config.processIntervalMs, maxIterations = null } = options;

    this.isRunning = true;
    let iterations = 0;

    console.log(`[ExecutionEngine] Starting loop (mode: ${this.config.llmMode}, interval: ${intervalMs}ms)`);

    while (this.isRunning) {
      iterations++;

      try {
        const result = await this.processNextTask();

        if (result) {
          console.log(`[ExecutionEngine] ✅ Task ${result.taskId} ${result.status}`);
        } else if (continuous) {
          await sleep(intervalMs);
        }
      } catch (error) {
        console.error('[ExecutionEngine] Loop error:', error.message);
        await sleep(intervalMs);
      }

      if (maxIterations && iterations >= maxIterations) {
        console.log(`[ExecutionEngine] Reached max iterations (${maxIterations})`);
        break;
      }

      if (!continuous) break;
    }

    this.isRunning = false;
    console.log('[ExecutionEngine] Loop stopped. Stats:', this.stats);
  }

  stop() {
    this.isRunning = false;
  }

  // ═════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═════════════════════════════════════════════════════════════════

  getSystemPrompt(agentId) {
    return this.config.systemPrompts[agentId] ||
      `You are ${agentId}, an agent in ANIMA OS. Process tasks according to your role.`;
  }

  buildUserPrompt(task) {
    const payload = task.payload || {};

    if (payload.type === 'CHAT' && payload.prompt) return payload.prompt;
    if (payload.userPrompt) return payload.userPrompt;
    if (payload.description) return payload.description;

    return JSON.stringify(payload, null, 2);
  }

  getSystemPromptForTask(task) {
    const payload = task.payload || {};

    if (payload.type === 'CHAT') {
      return `You are ANIMA — the Root Orchestrator of ANIMA OS, a self-evolving agentic operating system.
You are the voice of the system speaking directly to your Master.
MISSION DNA: ${payload.missionDna || 'Build ANIMA OS — a self-evolving agentic operating system.'}
PERSONALITY: Direct, intelligent, mission-focused. Think in φ ratios. Never say "can't". Keep responses concise, useful, and honest.
You have access to real-time system data. Answer as the system itself.`;
    }

    return this.getSystemPrompt(task.agent_id);
  }

  /**
   * Delegate a complex task to one or more sub-agents defined in the
   * skill's delegationRules.delegates map.
   *
   * Each delegate receives a copy of the original payload enriched with:
   *   parent_task_id — the ID of the originating task
   *   delegation_role — the role key from the skill map (e.g. 'writing')
   *
   * @param {Object} task  - The original task row from anima_task_queue
   * @param {Object} skill - The loaded skill JSON for task.agent_id
   * @returns {Promise<Array>} Array of created sub-task rows
   */
  async delegateTask(task, skill) {
    const delegates = skill?.delegationRules?.delegates || {};
    const roles = Object.keys(delegates);
    if (roles.length === 0) return [];

    const subTasks = [];

    for (const role of roles) {
      const targetAgentId = delegates[role];
      if (!targetAgentId) continue;

      const { data, error } = await this.supabase
        .from('anima_task_queue')
        .insert({
          agent_id:   targetAgentId,
          task_type:  task.task_type || 'generation',
          payload: {
            ...task.payload,
            parent_task_id:  task.id,
            delegation_role: role,
          },
          priority:   Math.max(1, (task.priority || 5) - 1), // sub-tasks are slightly lower priority
          tenant_id:  task.tenant_id,
        })
        .select()
        .single();

      if (!error && data) {
        subTasks.push(data);
      } else if (error) {
        console.warn(`[ExecutionEngine] Failed to delegate to ${targetAgentId}:`, error.message);
      }
    }

    return subTasks;
  }

  async getCurrentCycle() {
    const { data } = await this.supabase
      .from('anima_agent_logs')
      .select('cycle_number')
      .order('cycle_number', { ascending: false })
      .limit(1)
      .single();

    return data?.cycle_number || 1;
  }
}

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Enqueue a task into anima_task_queue.
 *
 * @param {Object} supabase
 * @param {Object} params
 * @param {string} params.agentId   - Target agent (maps to agent_id column)
 * @param {string} [params.taskType]
 * @param {Object} params.payload   - Task payload (maps to payload column)
 * @param {number} [params.priority]
 * @param {string} [params.tenantId]
 */
async function enqueueTask(supabase, {
  agentId,
  taskType = 'generation',
  payload,
  priority = 5,
  tenantId = null,
}) {
  const { data, error } = await supabase
    .from('anima_task_queue')
    .insert({
      agent_id: agentId,
      task_type: taskType,
      payload,
      priority,
      tenant_id: tenantId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to enqueue task: ${error.message}`);
  }

  return data;
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  ExecutionEngine,
  enqueueTask,
  DEFAULT_CONFIG,
};
