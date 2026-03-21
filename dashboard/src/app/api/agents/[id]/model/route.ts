import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { logger } from '@/lib/logger'

/**
 * PATCH /api/agents/[id]/model
 * Set AI provider and model for a specific agent.
 * These override system-wide ANIMA_AI_PROVIDER / ANIMA_AI_MODEL env vars.
 *
 * Body: {
 *   provider?: 'openai' | 'openrouter' | 'anthropic' | null  (null = use system default)
 *   model?: string | null   (null = use provider default)
 * }
 *
 * Examples:
 *   { provider: 'openrouter', model: 'openai/gpt-4o' }
 *   { provider: 'openai', model: 'gpt-4o-mini' }
 *   { provider: null, model: null }  ← reset to system default
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, 'operator')
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const db = getDatabase()
    const { id } = await params
    const workspaceId = auth.user.workspace_id ?? 1
    const body = await request.json()

    const provider: string | null = body.provider ?? null
    const model: string | null = body.model ?? null

    const VALID_PROVIDERS = ['openai', 'openrouter', 'anthropic', null]
    if (!VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json({ error: `Invalid provider. Use: openai, openrouter, anthropic, or null` }, { status: 400 })
    }

    // Find agent
    let agent: any
    if (isNaN(Number(id))) {
      agent = db.prepare('SELECT * FROM agents WHERE name = ? AND workspace_id = ?').get(id, workspaceId)
    } else {
      agent = db.prepare('SELECT * FROM agents WHERE id = ? AND workspace_id = ?').get(Number(id), workspaceId)
    }

    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

    // Merge into existing config
    let cfg: Record<string, any> = {}
    try { if (agent.config) cfg = JSON.parse(agent.config) } catch {}

    if (provider === null) {
      delete cfg.ai_provider
    } else {
      cfg.ai_provider = provider
    }

    if (model === null) {
      delete cfg.ai_model
    } else {
      cfg.ai_model = model
    }

    const now = Math.floor(Date.now() / 1000)
    db.prepare('UPDATE agents SET config = ?, updated_at = ? WHERE id = ? AND workspace_id = ?')
      .run(JSON.stringify(cfg), now, agent.id, workspaceId)

    logger.info({ agentId: agent.id, name: agent.name, provider, model }, 'Agent model config updated')

    return NextResponse.json({
      success: true,
      agent: agent.name,
      ai_provider: provider,
      ai_model: model,
      effective_model: model || `(${provider || 'system'} default)`,
    })
  } catch (error) {
    logger.error({ err: error }, 'PATCH /api/agents/[id]/model error')
    return NextResponse.json({ error: 'Failed to update agent model' }, { status: 500 })
  }
}

/**
 * GET /api/agents/[id]/model
 * Get the current AI provider/model config for an agent.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, 'viewer')
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const db = getDatabase()
    const { id } = await params
    const workspaceId = auth.user.workspace_id ?? 1

    let agent: any
    if (isNaN(Number(id))) {
      agent = db.prepare('SELECT * FROM agents WHERE name = ? AND workspace_id = ?').get(id, workspaceId)
    } else {
      agent = db.prepare('SELECT * FROM agents WHERE id = ? AND workspace_id = ?').get(Number(id), workspaceId)
    }

    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

    let cfg: Record<string, any> = {}
    try { if (agent.config) cfg = JSON.parse(agent.config) } catch {}

    return NextResponse.json({
      agent: agent.name,
      ai_provider: cfg.ai_provider || null,
      ai_model: cfg.ai_model || null,
      system_provider: process.env.ANIMA_AI_PROVIDER || 'auto',
      system_model: process.env.ANIMA_AI_MODEL || process.env.OPENROUTER_MODEL || '(provider default)',
      effective_provider: cfg.ai_provider || process.env.ANIMA_AI_PROVIDER || 'auto-detect',
      effective_model: cfg.ai_model || process.env.ANIMA_AI_MODEL || process.env.OPENROUTER_MODEL || '(provider default)',
    })
  } catch (error) {
    logger.error({ err: error }, 'GET /api/agents/[id]/model error')
    return NextResponse.json({ error: 'Failed to fetch agent model' }, { status: 500 })
  }
}
