import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { resolve as pathResolve, join as pathJoin } from 'path'
import { existsSync, readFileSync } from 'fs'

/**
 * POST /api/agents/reseed
 * Admin-only: clears all seeded agents and reseeds from openclaw.json.
 * Use this to replace fake/stale agents with the real Anima OS agents.
 */
export async function POST(request: NextRequest) {
  const auth = requireRole(request, 'admin')
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const db = getDatabase()
    const workspaceId = auth.user.workspace_id ?? 1

    const configPath =
      process.env.ANIMA_OS_CONFIG_PATH ||
      pathResolve(process.cwd(), '..', 'openclaw.json')

    if (!existsSync(configPath)) {
      return NextResponse.json({ error: `openclaw.json not found at ${configPath}` }, { status: 404 })
    }

    let projectConfig: any
    try {
      projectConfig = JSON.parse(readFileSync(configPath, 'utf8'))
    } catch {
      return NextResponse.json({ error: 'Failed to parse openclaw.json' }, { status: 500 })
    }

    const agents: any[] = projectConfig?.agents || []
    if (agents.length === 0) {
      return NextResponse.json({ error: 'No agents found in openclaw.json' }, { status: 400 })
    }

    const projectRoot = pathResolve(configPath, '..')
    const now = Math.floor(Date.now() / 1000)

    // Count existing agents
    const existingCount = (db.prepare('SELECT COUNT(*) as count FROM agents WHERE workspace_id = ?').get(workspaceId) as any).count

    // Delete all seeded agents in this workspace (preserves manually-created ones if source differs)
    // We delete ALL agents and reseed cleanly since fake ones have source='seed' too
    db.prepare('DELETE FROM agents WHERE workspace_id = ?').run(workspaceId)

    const insert = db.prepare(`
      INSERT INTO agents (name, role, soul_content, status, source, created_at, updated_at, config, workspace_id)
      VALUES (?, ?, ?, 'idle', 'seed', ?, ?, ?, ?)
    `)

    let seeded = 0
    db.transaction(() => {
      for (const agent of agents) {
        const displayName: string = agent.name
        const techId: string = agent.id || agent.name
        if (!displayName) continue

        const role: string = agent.tagline || agent.description || displayName.toLowerCase()

        let soulContent: string | null = null
        if (agent.file) {
          const agentFilePath = pathJoin(projectRoot, agent.file)
          if (existsSync(agentFilePath)) {
            try { soulContent = readFileSync(agentFilePath, 'utf8') } catch {}
          }
        }

        const cfg = JSON.stringify({
          id:          techId,
          phi_weight:  agent.phi_weight  ?? null,
          depth:       agent.depth       ?? null,
          parent:      agent.parent      ?? null,
          cycle:       agent.cycle       ?? null,
          tools:       agent.tools       ?? [],
          emoji:       agent.emoji       ?? null,
          tagline:     agent.tagline     ?? agent.description ?? '',
          description: agent.description ?? '',
        })

        insert.run(displayName, role, soulContent, now, now, cfg, workspaceId)

        seeded++
      }
    })()

    logger.info({ seeded, cleared: existingCount }, 'Reseeded Anima OS agents via API')

    return NextResponse.json({
      success: true,
      cleared: existingCount,
      seeded,
      agents: agents.map((a: any) => ({ name: a.name, id: a.id, emoji: a.emoji })),
    })
  } catch (error) {
    logger.error({ err: error }, 'POST /api/agents/reseed error')
    return NextResponse.json({ error: 'Failed to reseed agents' }, { status: 500 })
  }
}
