import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
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

// ─── Auth: vérifie X-Api-Key OU session cookie ───────────────────────────────
// Retourne null si aucune auth valide.

function checkAuth(request: NextRequest): { ok: true; isApiKey: boolean } | { ok: false } {
  // 1. Essai via getUserFromRequest (session cookie + API key vs env API_KEY)
  const user = getUserFromRequest(request)
  if (user) return { ok: true, isApiKey: user.id === 0 }

  // 2. Fallback : clé ANIMA_CHAT_KEY dédiée à cette route (optionnelle)
  const animaChatKey = (process.env.ANIMA_CHAT_KEY || '').trim()
  if (animaChatKey) {
    const provided = (
      request.headers.get('x-api-key') ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
      ''
    ).trim()
    if (provided && provided === animaChatKey) return { ok: true, isApiKey: true }
  }

  return { ok: false }
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const authResult = checkAuth(request)
  if (!authResult.ok) {
    return NextResponse.json(
      { error: 'Unauthorized — fournir X-Api-Key ou se connecter au dashboard' },
      { status: 401 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { prompt, agentId, missionDna, tenantId: tenantIdOverride } = body as {
    prompt?: string
    agentId?: string
    missionDna?: string
    // Permet de passer 'studio_argile' directement dans le body (API key auth)
    tenantId?: string | number
  }

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return NextResponse.json({ error: '"prompt" est requis' }, { status: 400 })
  }

  // Résolution du tenant :
  // - Si la requête vient de l'API key et que tenantId est fourni → on le respecte
  // - Sinon on lit le tenant_id numérique de la session SQLite
  // - Fallback : tenant_id numérique 1 (workspace par défaut)
  const user = getUserFromRequest(request)
  const tenantId: string | number =
    tenantIdOverride ??
    user?.tenant_id ??
    Number(process.env.ANIMA_DEFAULT_TENANT_ID || 1)

  // Vérification Supabase
  if (!process.env.SUPABASE_URL) {
    return NextResponse.json({ error: 'SUPABASE_URL non configuré sur le serveur' }, { status: 500 })
  }

  // ── Enqueue CHAT task ──────────────────────────────────────────────────────
  let task: { id: string }
  try {
    task = await supabaseInsert<{ id: string }>('anima_task_queue', {
      agent_id:  agentId || 'ROOT_ORCHESTRATOR',
      task_type: 'generation',
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
    taskId:   task.id,
    tenantId,
    agentId:  agentId || 'ROOT_ORCHESTRATOR',
  })
}

export const dynamic = 'force-dynamic'
