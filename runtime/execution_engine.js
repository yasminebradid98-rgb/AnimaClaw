/**
 * EXECUTION ENGINE — Task Queue Processing Pipeline
 * Version: 1.0.0
 * Engine: SOLARIS
 *
 * Pipeline:
 *   anima_task_queue (QUEUED)
 *     → phi_core.routeTask() → agent selection
 *     → llm_client.callLLM() → LLM call
 *     → immune_scanner.scanOutput() → validation
 *     → anima_agent_logs ← logging
 *     → anima_fractal_state ← vitality update
 *     → anima_task_queue ← status update
 *
 * Usage:
 *   const { ExecutionEngine } = require('./runtime/execution_engine');
 *   const engine = new ExecutionEngine(supabaseClient);
 *   await engine.processNextTask();
 *   await engine.runLoop({ continuous: true, intervalMs: 1000 });
 */

const { createClient } = require('@supabase/supabase-js');
const naturalLaw = require('./natural_law');
const phiCore = require('./phi_core');
const llmClient = require('./llm_client');
const immuneScanner = require('./immune_scanner');

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
   * Claim and process next available task
   * @returns {Promise<Object|null>} Task result or null if no tasks
   */
  async processNextTask() {
    // 1. CLAIM next task atomically from queue
    const { data: task, error: claimError } = await this.supabase
      .rpc('claim_next_task', { p_user_id: await this.getUserId() });
    
    if (claimError || !task) {
      return null; // No tasks available
    }

    console.log(`[ExecutionEngine] Processing task ${task.id} (${task.task_type}) for ${task.agent_name}`);

    try {
      // 2. Get agent from fractal state
      const { data: agent, error: agentError } = await this.supabase
        .from('anima_fractal_state')
        .select('*')
        .eq('branch_id', task.agent_name)
        .single();

      if (agentError || !agent) {
        throw new Error(`Agent ${task.agent_name} not found in fractal state`);
      }

      // 3. ROUTE TASK via phi_core (validation step)
      const routingResult = phiCore.routeTask(
        {
          id: task.id,
          complexity: task.task_payload.complexity || 5,
          urgency: task.task_payload.urgency || 0.5,
          mission_alignment: task.task_payload.alignment || 0.5,
        },
        [agent]
      );

      if (!routingResult.agent) {
        throw new Error('No suitable agent found for task');
      }

      // 4. CALL LLM
      const systemPrompt = this.getSystemPrompt(task.agent_name);
      const userPrompt = this.buildUserPrompt(task);

      const llmResult = await llmClient.callLLM({
        mode: this.config.llmMode,
        apiKey: process.env.OPENROUTER_API_KEY,
        model: this.config.llmModel,
        systemPrompt,
        userPrompt,
        tools: task.task_payload.tools || [],
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        userId: task.user_id,
      });

      // 5. IMMUNE SCAN the output
      const scanResult = immuneScanner.scanOutput({
        content: llmResult.content,
        agentName: task.agent_name,
        taskType: task.task_type,
        metadata: {
          taskId: task.id,
          model: llmResult.model,
        },
      });

      // 6. LOG to anima_agent_logs
      const { data: logEntry, error: logError } = await this.supabase
        .from('anima_agent_logs')
        .insert({
          agent_name: task.agent_name,
          fractal_depth: agent.depth_level || 0,
          phi_weight: agent.phi_weight || 0.5,
          task_description: task.task_payload.description || `Task ${task.id}`,
          mission_alignment: scanResult.alignment || 0.5,
          model_used: llmResult.model,
          tokens_used: llmResult.usage.totalTokens,
          cost_usd: llmResult.costUsd,
          cycle_number: await this.getCurrentCycle(),
          vitality_score: agent.vitality_score || 0.5,
          event_type: task.task_type,
          quantum_phase: 'CLASSICAL',
          interference_applied: scanResult.interferenceApplied || false,
          superposition_count: 0,
          pi_pulse_timestamp: new Date().toISOString(),
          user_id: task.user_id,
          immune_scan_result: scanResult,
          threat_detected: scanResult.threatLevel !== 'NONE',
          threat_severity: scanResult.threatLevel !== 'NONE' ? scanResult.threatLevel : null,
        })
        .select()
        .single();

      if (logError) {
        console.error('[ExecutionEngine] Failed to log:', logError);
      }

      // 7. UPDATE FRACTAL STATE (vitality)
      const newVitality = naturalLaw.calculateVitality(
        agent.depth_level || 0,
        scanResult.alignment || 0.5,
        1, // cycle age
        agent.spawn_count > 0 ? agent.spawn_count / 8 : 0.5
      );

      await this.supabase
        .from('anima_fractal_state')
        .update({
          vitality_score: newVitality,
          personal_best: Math.max(agent.personal_best || 0, scanResult.alignment || 0),
          last_heartbeat: new Date().toISOString(),
        })
        .eq('branch_id', task.agent_name);

      // 8. UPDATE TASK QUEUE
      const isSevereThreat = scanResult.threatLevel === 'HIGH' || scanResult.threatLevel === 'CRITICAL';
      
      await this.supabase
        .from('anima_task_queue')
        .update({
          status: isSevereThreat ? 'FAILED' : 'DONE',
          result_json: {
            content: llmResult.content,
            toolCalls: llmResult.toolCalls,
            finishReason: llmResult.finishReason,
            scanResult,
            routingResult,
            isPlaceholder: llmResult.isPlaceholder || false,
          },
          error_message: isSevereThreat ? `Threat detected: ${scanResult.threatLevel}` : null,
          tokens_used: llmResult.usage.totalTokens,
          cost_usd: llmResult.costUsd,
          completed_at: new Date().toISOString(),
          agent_log_id: logEntry?.id || null,
          immune_scan_id: null, // Could reference a separate immune_scans table
        })
        .eq('id', task.id);

      this.stats.processed++;
      this.stats.succeeded++;

      return {
        taskId: task.id,
        status: isSevereThreat ? 'FAILED' : 'DONE',
        agent: task.agent_name,
        scanResult,
        llmResult: {
          content: llmResult.content,
          usage: llmResult.usage,
          cost: llmResult.costUsd,
        },
      };

    } catch (error) {
      console.error(`[ExecutionEngine] Task ${task.id} failed:`, error.message);
      
      // Update task as FAILED
      await this.supabase
        .from('anima_task_queue')
        .update({
          status: 'FAILED',
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
   * @param {Object} options
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
        } else {
          // No tasks, wait before checking again
          if (continuous) {
            await sleep(intervalMs);
          }
        }
      } catch (error) {
        console.error('[ExecutionEngine] Loop error:', error.message);
        await sleep(intervalMs);
      }

      if (maxIterations && iterations >= maxIterations) {
        console.log(`[ExecutionEngine] Reached max iterations (${maxIterations})`);
        break;
      }

      if (!continuous) {
        break;
      }
    }

    this.isRunning = false;
    console.log('[ExecutionEngine] Loop stopped');
    console.log('Stats:', this.stats);
  }

  /**
   * Stop the execution loop
   */
  stop() {
    this.isRunning = false;
  }

  // ═════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═════════════════════════════════════════════════════════════════

  getSystemPrompt(agentName) {
    return this.config.systemPrompts[agentName] || 
           `You are ${agentName}, an agent in ANIMA OS. Process tasks according to your role.`;
  }

  buildUserPrompt(task) {
    const payload = task.task_payload || {};
    
    if (payload.userPrompt) {
      return payload.userPrompt;
    }
    
    if (payload.description) {
      return payload.description;
    }
    
    return JSON.stringify(payload, null, 2);
  }

  async getUserId() {
    // In production, get from auth context
    // For now, use env or default
    return process.env.ANIMA_USER_ID || '00000000-0000-0000-0000-000000000000';
  }

  async getCurrentCycle() {
    // Get latest cycle from agent logs
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
 * Quick task enqueue helper
 */
async function enqueueTask(supabase, {
  agentName,
  taskType = 'LLM_CALL',
  payload,
  priority = 5,
  userId,
}) {
  const { data, error } = await supabase
    .from('anima_task_queue')
    .insert({
      agent_name: agentName,
      task_type: taskType,
      task_payload: payload,
      priority,
      user_id: userId,
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
