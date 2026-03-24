import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { logger } from '@/lib/logger'

// ─── Supabase REST helpers (no SDK — uses native fetch) ──────────────────────

function supabaseHeaders() {
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || ''
  return {
    'Content-Type': 'application/json',
    'apikey': key,
    'Authorization': `Bearer ${key}`,
  }
}

function supabaseUrl(table: string, query = '') {
  const base = process.env.SUPABASE_URL
  if (!base) throw new Error('SUPABASE_URL is not set')
  return `${base}/rest/v1/${table}${query ? `?${query}` : ''}`
}

async function supabaseInsert<T>(table: string, row: Record<string, unknown>): Promise<T> {
  const res = await fetch(supabaseUrl(table), {
    method: 'POST',
    headers: { ...supabaseHeaders(), 'Prefer': 'return=representation' },
    body: JSON.stringify(row),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.message || `Supabase insert error ${res.status}`)
  // REST returns an array
  return Array.isArray(json) ? json[0] : json
}

async function supabaseSelectOne<T>(
  table: string,
  filters: Record<string, string>,
  columns = '*',
): Promise<T | null> {
  const params = new URLSearchParams({ select: columns })
  for (const [k, v] of Object.entries(filters)) params.append(k, v)

  const res = await fetch(supabaseUrl(table, params.toString()), {
    method: 'GET',
    headers: { ...supabaseHeaders(), 'Accept': 'application/json' },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.message || `Supabase select error ${res.status}`)
  return Array.isArray(json) && json.length > 0 ? json[0] : null
}

// ─── Poll helpers ────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 600
const POLL_TIMEOUT_MS  = 60_000   // 60 s max

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

interface TaskRow {
  task_status: string
  result: { reply?: string; content?: string } | null
  error_message: string | null
}

async function pollTaskResult(taskId: string): Promise<{ reply: string; status: string }> {
  const deadline = Date.now() + POLL_TIMEOUT_MS

  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS)

    let row: TaskRow | null = null
    try {
      row = await supabaseSelectOne<TaskRow>(
        'anima_task_queue',
        { 'id': `eq.${taskId}` },
        'task_status,result,error_message',
      )
    } catch (err) {
      logger.warn({ taskId, err }, '[anima-chat] poll error — retrying')
      continue
    }

    if (!row) continue

    if (row.task_status === 'completed') {
      const reply = row.result?.reply || row.result?.content || '(no reply)'
      return { reply, status: 'completed' }
    }

    if (row.task_status === 'failed') {
      return {
        reply: row.error_message || 'L\'agent a rencontré une erreur.',
        status: 'failed',
      }
    }
    // 'pending' | 'processing' → keep polling
  }

  return {
    reply: 'Timeout : l\'agent n\'a pas répondu dans les 60 secondes.',
    status: 'timeout',
  }
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const auth = requireRole(request, 'viewer')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { prompt, agentId, missionDna } = body as {
    prompt?: string
    agentId?: string
    missionDna?: string
  }

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return NextResponse.json({ error: '"prompt" est requis' }, { status: 400 })
  }

  // tenant_id comes from the authenticated user's session
  const tenantId: number = auth.user.tenant_id

  // Verify Supabase is configured before doing anything
  if (!process.env.SUPABASE_URL) {
    return NextResponse.json({ error: 'SUPABASE_URL non configuré sur le serveur' }, { status: 500 })
  }

  // ── Enqueue CHAT task ──────────────────────────────────────────────────────
  let task: { id: string }
  try {
    task = await supabaseInsert<{ id: string }>('anima_task_queue', {
      agent_id:  agentId || 'ROOT_ORCHESTRATOR',
      task_type: 'chat',
      priority:  7,
      tenant_id: tenantId,
      payload: {
        type:       'CHAT',
        prompt:     prompt.trim(),
        missionDna: missionDna || 'Build ANIMA OS — a self-evolving agentic operating system.',
      },
    })
  } catch (err: any) {
    logger.error({ err }, '[anima-chat] Échec insertion task')
    return NextResponse.json(
      { error: 'Impossible d\'envoyer le message à l\'agent', detail: err.message },
      { status: 500 },
    )
  }

  logger.info(
    { taskId: task.id, tenantId, agentId: agentId || 'ROOT_ORCHESTRATOR' },
    '[anima-chat] Task enqueued',
  )

  // ── Poll until AnimaExecutor delivers the reply ────────────────────────────
  const { reply, status } = await pollTaskResult(task.id)

  return NextResponse.json({
    reply,
    status,
    taskId:  task.id,
    tenantId,
    agentId: agentId || 'ROOT_ORCHESTRATOR',
  })
}

export const dynamic = 'force-dynamic'
