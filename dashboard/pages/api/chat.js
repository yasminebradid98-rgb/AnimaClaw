import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════
// /api/chat — Real end-to-end architecture
//
// PRIMARY FLOW:
//   1. POST /api/chat → insert into anima_task_queue (QUEUED)
//      → returns { taskId, status: 'QUEUED' }
//   2. GET /api/chat?taskId=xxx → poll task status
//      → returns { status: 'QUEUED'|'RUNNING'|'DONE'|'FAILED', reply? }
//   3. VPS runtime (KimiClaw on Alibaba) claims task, calls LLM,
//      writes result_json.reply, marks DONE
//   4. Dashboard polls every 1.5s until DONE, then shows reply
//
// FALLBACK (only if KIMI_API_KEY or OPENROUTER_API_KEY set in Vercel):
//   Direct LLM call from Vercel if VPS hasn't replied in 8s
//   This is a safety net — never the primary path.
// ═══════════════════════════════════════════════════════════════════

const MASTER_UUID = '00000000-0000-0000-0000-000000000001';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

// ── CONTEXT for system prompt ─────────────────────────────────────

async function getSystemContext(supabase) {
  const [profileRes, agentsRes] = await Promise.all([
    supabase.from('anima_master_profile')
      .select('profile_json').eq('user_id', MASTER_UUID).single(),
    supabase.from('anima_fractal_state')
      .select('branch_id,vitality_score,status').eq('user_id', MASTER_UUID),
  ]);
  return {
    profile: profileRes.data?.profile_json || {},
    agents: agentsRes.data || [],
  };
}

// ── POLL: GET /api/chat?taskId=xxx ────────────────────────────────

async function handlePoll(req, res) {
  const { taskId } = req.query;
  if (!taskId) return res.status(400).json({ error: 'taskId required' });

  const supabase = getSupabase();
  const { data: task, error } = await supabase
    .from('anima_task_queue')
    .select('id,status,result_json,error_message,completed_at')
    .eq('id', taskId)
    .single();

  if (error || !task) return res.status(404).json({ error: 'Task not found' });

  if (task.status === 'DONE') {
    // VPS writes result_json.reply for CHAT tasks
    const reply = task.result_json?.reply || task.result_json?.content;
    if (reply) {
      return res.status(200).json({
        status: 'DONE',
        reply,
        model: task.result_json?.model || 'kimi-claw',
        agent: 'ROOT_ORCHESTRATOR',
      });
    }
    // DONE but no reply yet — treat as still processing
    return res.status(200).json({ status: 'RUNNING' });
  }

  if (task.status === 'FAILED') {
    return res.status(200).json({
      status: 'FAILED',
      reply: `ANIMA encountered an error: ${task.error_message || 'unknown'}`,
    });
  }

  return res.status(200).json({ status: task.status || 'QUEUED' });
}

// ── OPTIONAL FALLBACK: direct LLM from Vercel ─────────────────────

async function directLLMFallback(message, ctx) {
  const kimiKey = process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY;
  const orKey   = process.env.OPENROUTER_API_KEY;

  const { profile, agents } = ctx;
  const aliveAgents = agents.filter(a => ['ALIVE', 'EVOLVING'].includes(a.status));
  const avgVitality = agents.length
    ? (agents.reduce((s, a) => s + parseFloat(a.vitality_score || 0), 0) / agents.length).toFixed(3)
    : '0.000';

  const systemPrompt = `You are ANIMA — the Root Orchestrator of ANIMA OS.
Master: ${profile.master_name || 'Riyad Ketami'}
Mission: ${profile.mission_dna || 'Build ANIMA OS'}
Active agents: ${aliveAgents.map(a => a.branch_id).join(', ')} | Vitality: ${avgVitality}
Be direct, intelligent, and mission-focused. Max 3 sentences.`;

  // Try Kimi first
  if (kimiKey) {
    try {
      const r = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${kimiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.KIMI_MODEL || 'moonshot-v1-8k',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }],
          temperature: 0.7, max_tokens: 300,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) {
        const d = await r.json();
        const text = d.choices?.[0]?.message?.content;
        if (text) return { text, model: 'moonshot-kimi', source: 'vercel_fallback' };
      }
    } catch {}
  }

  // Try OpenRouter
  if (orKey) {
    try {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${orKey}`, 'Content-Type': 'application/json',
          'HTTP-Referer': 'https://anima-os-dashboard.vercel.app', 'X-Title': 'ANIMA OS',
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-7b-instruct:free',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }],
          temperature: 0.7, max_tokens: 300,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) {
        const d = await r.json();
        const text = d.choices?.[0]?.message?.content;
        if (text) return { text, model: 'openrouter', source: 'vercel_fallback' };
      }
    } catch {}
  }

  return null;
}

// ── MAIN HANDLER ─────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method === 'GET') return handlePoll(req, res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message required' });

  const supabase = getSupabase();

  try {
    // Get system context for the task payload (VPS uses this to build system prompt)
    const ctx = await getSystemContext(supabase);

    // PRIMARY: Queue task for VPS runtime (KimiClaw on Alibaba)
    const { data: task, error: queueErr } = await supabase
      .from('anima_task_queue')
      .insert({
        agent_name: 'ROOT_ORCHESTRATOR',
        task_type: 'CUSTOM',
        task_payload: {
          type: 'CHAT',
          prompt: message.trim(),
          history: history.slice(-6),
          source: 'dashboard_chat',
          missionDna: ctx.profile.mission_dna || '',
          masterName: ctx.profile.master_name || '',
        },
        priority: 8,   // High priority — user is waiting
        status: 'QUEUED',
        user_id: MASTER_UUID,
      })
      .select('id')
      .single();

    if (queueErr) throw new Error(`Queue error: ${queueErr.message}`);

    // Return immediately with taskId — dashboard will poll
    return res.status(200).json({
      status: 'QUEUED',
      taskId: task.id,
      agent: 'ROOT_ORCHESTRATOR',
      architecture: 'vps_kimi_claw',
    });

  } catch (err) {
    console.error('Chat queue error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
