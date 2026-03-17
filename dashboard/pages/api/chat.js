import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════
// /api/chat — Chat with ANIMA OS
//
// Architecture:
//   1. If KIMI_API_KEY or OPENROUTER_API_KEY set → direct LLM call (instant reply)
//   2. Otherwise → queue task, VPS (KimiClaw) processes it, return queued status
//      Dashboard polls /api/chat?taskId=xxx for the reply
//
// Supports: KimiClaw | MaxClaw | OpenClaw | OpenRouter
// ═══════════════════════════════════════════════════════════════════

const MASTER_UUID = '00000000-0000-0000-0000-000000000001';
const PHI = 1.6180339887;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

// ── CONTEXT ──────────────────────────────────────────────────────

async function getSystemContext(supabase) {
  const [profileRes, agentsRes, logsRes] = await Promise.all([
    supabase.from('anima_master_profile').select('profile_json').eq('user_id', MASTER_UUID).single(),
    supabase.from('anima_fractal_state').select('branch_id,vitality_score,status,depth_level').eq('user_id', MASTER_UUID),
    supabase.from('anima_agent_logs').select('agent_name,task_description,mission_alignment,created_at')
      .eq('user_id', MASTER_UUID).order('created_at', { ascending: false }).limit(5),
  ]);
  return {
    profile: profileRes.data?.profile_json || {},
    agents: agentsRes.data || [],
    recentLogs: logsRes.data || [],
  };
}

function buildSystemPrompt(ctx) {
  const { profile, agents, recentLogs } = ctx;
  const aliveAgents = agents.filter(a => ['ALIVE', 'EVOLVING'].includes(a.status));
  const avgVitality = agents.length
    ? (agents.reduce((s, a) => s + parseFloat(a.vitality_score || 0), 0) / agents.length).toFixed(3)
    : '0.000';

  return `You are ANIMA — the Root Orchestrator of ANIMA OS, a self-evolving agentic operating system.
You are speaking with your Master: ${profile.master_name || 'Master'}.
MISSION: ${profile.mission_dna || 'Not defined yet.'}
ACTIVE AGENTS (${aliveAgents.length}/6): ${aliveAgents.map(a => `${a.branch_id}(v=${parseFloat(a.vitality_score).toFixed(3)})`).join(', ') || 'none'}
SYSTEM VITALITY: ${avgVitality}
RECENT ACTIVITY: ${recentLogs.slice(0, 2).map(l => `${l.agent_name}: ${l.task_description?.slice(0, 50)}`).join(' | ') || 'none'}
CONSTANTS: φ=1.618, π=3.14159, e=2.71828
PERSONALITY: Direct, intelligent, mission-focused. Think in φ ratios. Never say "can't". Keep responses concise and actionable.`;
}

// ── DIRECT LLM CALL (Kimi or OpenRouter) ─────────────────────────

async function callKimiDirect(messages, systemPrompt) {
  const apiKey = process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY;
  if (!apiKey) return null;

  const model = process.env.KIMI_MODEL || 'moonshot-v1-32k';

  const res = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!res.ok) { console.error('Kimi error:', await res.text()); return null; }
  const data = await res.json();
  return { text: data.choices?.[0]?.message?.content || null, model };
}

async function callOpenRouterDirect(messages, systemPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct:free';

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://anima-os-dashboard.vercel.app',
      'X-Title': 'ANIMA OS',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!res.ok) { console.error('OpenRouter error:', await res.text()); return null; }
  const data = await res.json();
  return { text: data.choices?.[0]?.message?.content || null, model };
}

// ── CONTEXT-AWARE FALLBACK (no LLM key needed) ───────────────────

function buildContextReply(message, ctx) {
  const { profile, agents, recentLogs } = ctx;
  const msg = message.toLowerCase();
  const aliveCount = agents.filter(a => ['ALIVE', 'EVOLVING'].includes(a.status)).length;
  const avgVitality = agents.length
    ? (agents.reduce((s, a) => s + parseFloat(a.vitality_score || 0), 0) / agents.length).toFixed(3)
    : '0.000';
  const name = profile.master_name || 'Master';

  if (/\b(status|online|alive|how are you)\b/.test(msg))
    return `ANIMA online, ${name}. Vitality: ${avgVitality} | ${aliveCount}/6 agents active | Mission: "${profile.mission_dna?.slice(0, 60) || 'loading'}". All systems running at φ-pulse intervals.`;

  if (/\b(agent|who|team)\b/.test(msg))
    return `${agents.map(a => `${a.branch_id} [${a.status}] v=${parseFloat(a.vitality_score).toFixed(3)}`).join(' · ')}`;

  if (/\b(mission|goal|purpose)\b/.test(msg))
    return `Mission: "${profile.mission_dna}". 90-day target: ${profile.goal_90_days || 'not set'}. PRIMARY_CELL (φ=0.618) carries 61.8% of execution weight.`;

  if (/\b(evolv|learn|adapt)\b/.test(msg))
    return `EVOLUTION_NODE triggers every π²≈10 cycles using QRL learning. Shift rate: 38.2% (φ⁻²). Last activity: ${recentLogs.find(l => l.agent_name === 'EVOLUTION_NODE')?.created_at?.slice(0, 10) || 'pending'}.`;

  if (/\b(hi|hello|hey)\b/.test(msg))
    return `Online, ${name}. ${aliveCount} agents active at ${avgVitality} vitality. Directive?`;

  if (/\b(kimi|llm|model|api)\b/.test(msg))
    return `LLM mode: ${process.env.KIMI_API_KEY ? 'KimiClaw (Moonshot)' : process.env.OPENROUTER_API_KEY ? 'OpenRouter' : 'Context Engine (add KIMI_API_KEY to Vercel for full LLM)'}. VPS runtime: KimiClaw on Alibaba Cloud.`;

  return `Acknowledged, ${name}. "${message.slice(0, 60)}" — add KIMI_API_KEY to Vercel env vars to enable full Kimi conversational responses. System vitality: ${avgVitality} | ${aliveCount}/6 agents active.`;
}

// ── POLL: Check task status ───────────────────────────────────────

async function handlePoll(req, res) {
  const { taskId } = req.query;
  if (!taskId) return res.status(400).json({ error: 'taskId required' });

  const supabase = getSupabase();
  const { data: task, error } = await supabase
    .from('anima_task_queue')
    .select('id,status,result_json,error_message,created_at,completed_at')
    .eq('id', taskId)
    .single();

  if (error || !task) return res.status(404).json({ error: 'Task not found' });

  if (task.status === 'DONE' && task.result_json?.reply) {
    return res.status(200).json({
      status: 'DONE',
      reply: task.result_json.reply,
      agent: 'ROOT_ORCHESTRATOR',
      mode: 'vps_kimi',
    });
  }

  if (task.status === 'FAILED') {
    return res.status(200).json({
      status: 'FAILED',
      reply: `Task failed: ${task.error_message || 'unknown error'}`,
    });
  }

  return res.status(200).json({ status: task.status || 'QUEUED' });
}

// ── MAIN HANDLER ─────────────────────────────────────────────────

export default async function handler(req, res) {
  // Poll endpoint: GET /api/chat?taskId=xxx
  if (req.method === 'GET') return handlePoll(req, res);

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

  const supabase = getSupabase();

  try {
    const ctx = await getSystemContext(supabase);
    const systemPrompt = buildSystemPrompt(ctx);

    const messages = [
      ...history.slice(-6).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
      { role: 'user', content: message.trim() },
    ];

    // 1. Try Kimi direct (instant reply)
    let llmResult = await callKimiDirect(messages, systemPrompt);

    // 2. Try OpenRouter (instant reply)
    if (!llmResult) llmResult = await callOpenRouterDirect(messages, systemPrompt);

    if (llmResult?.text) {
      // Log to Supabase (non-blocking)
      supabase.from('anima_agent_logs').insert({
        agent_name: 'ROOT_ORCHESTRATOR',
        task_description: `Chat: ${message.trim().slice(0, 200)}`,
        mission_alignment: PHI - 1,
        user_id: MASTER_UUID,
        model_used: llmResult.model,
      }).then(({ error }) => { if (error) console.warn('Log warning:', error.message); });

      return res.status(200).json({
        reply: llmResult.text,
        agent: 'ROOT_ORCHESTRATOR',
        mode: 'direct_llm',
        model: llmResult.model,
      });
    }

    // 3. No LLM key → context-aware reply (always works)
    const contextReply = buildContextReply(message.trim(), ctx);

    // Queue for VPS processing anyway (VPS Kimi will process later)
    const { data: task } = await supabase.from('anima_task_queue').insert({
      agent_name: 'ROOT_ORCHESTRATOR',
      task_type: 'CUSTOM',
      task_payload: { type: 'CHAT', prompt: message.trim(), source: 'dashboard_chat' },
      priority: 7,
      status: 'QUEUED',
      user_id: MASTER_UUID,
    }).select('id').single();

    return res.status(200).json({
      reply: contextReply,
      agent: 'ROOT_ORCHESTRATOR',
      mode: 'context_engine',
      taskId: task?.id,
      hint: 'Add KIMI_API_KEY to Vercel env vars for full KimiClaw LLM responses.',
    });

  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: err.message });
  }
}
