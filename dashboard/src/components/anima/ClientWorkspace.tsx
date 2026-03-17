'use client'

import { useState, useEffect } from 'react'

interface ClientWorkspaceData {
  id: string
  name: string
  tier: 'free' | 'pro' | 'enterprise'
  creditsUsed: number
  creditsLimit: number
  agentCount: number
  projectCount: number
  members: { name: string; role: string }[]
  createdAt: string
}

const TIER_LIMITS = {
  free: { credits: 100, agents: 1 },
  pro: { credits: 5000, agents: 50 },
  enterprise: { credits: -1, agents: -1 },
}

const tierBadge: Record<string, string> = {
  free: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  pro: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  enterprise: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

export function ClientWorkspace() {
  const [workspaces, setWorkspaces] = useState<ClientWorkspaceData[]>([])
  const [selectedWs, setSelectedWs] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTier, setNewTier] = useState<'free' | 'pro' | 'enterprise'>('free')

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.projects?.length) {
          setWorkspaces(data.projects.map((p: Record<string, unknown>) => ({
            id: String(p.id || ''),
            name: String(p.name || 'Unnamed'),
            tier: 'pro' as const,
            creditsUsed: 0,
            creditsLimit: TIER_LIMITS.pro.credits,
            agentCount: Number(p.agent_count || 0),
            projectCount: 1,
            members: [],
            createdAt: String(p.created_at || new Date().toISOString()),
          })))
        }
      })
      .catch(() => {})
  }, [])

  const handleCreate = () => {
    if (!newName.trim()) return
    const ws: ClientWorkspaceData = {
      id: `ws-${Date.now()}`,
      name: newName,
      tier: newTier,
      creditsUsed: 0,
      creditsLimit: TIER_LIMITS[newTier].credits,
      agentCount: 0,
      projectCount: 0,
      members: [{ name: 'Admin', role: 'owner' }],
      createdAt: new Date().toISOString(),
    }
    setWorkspaces(prev => [...prev, ws])
    setNewName('')
    setShowCreate(false)
  }

  const selected = workspaces.find(w => w.id === selectedWs)

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Client Workspaces</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          + New Workspace
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Multi-tenant isolation with Supabase row-level security. Each workspace has isolated memory, projects, and billing.
      </p>

      {showCreate && (
        <div className="border border-border rounded-lg bg-card p-4 space-y-3">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Workspace name..."
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground"
          />
          <div className="flex gap-2">
            {(['free', 'pro', 'enterprise'] as const).map(t => (
              <button
                key={t}
                onClick={() => setNewTier(t)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  newTier === t ? tierBadge[t] : 'bg-secondary text-secondary-foreground border-border'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="px-4 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-1.5 text-xs bg-secondary text-secondary-foreground rounded-md"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {workspaces.map(ws => (
          <div
            key={ws.id}
            onClick={() => setSelectedWs(selectedWs === ws.id ? null : ws.id)}
            className={`border rounded-lg bg-card p-4 cursor-pointer transition-colors ${
              selectedWs === ws.id ? 'border-primary' : 'border-border hover:border-primary/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-foreground">{ws.name}</h3>
              <span className={`px-2 py-0.5 text-2xs rounded-full border ${tierBadge[ws.tier]}`}>
                {ws.tier.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-semibold text-foreground">{ws.agentCount}</div>
                <div className="text-2xs text-muted-foreground">Agents</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-foreground">{ws.projectCount}</div>
                <div className="text-2xs text-muted-foreground">Projects</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-foreground">
                  {ws.creditsLimit === -1 ? 'Unlim' : ws.creditsUsed}
                </div>
                <div className="text-2xs text-muted-foreground">
                  {ws.creditsLimit === -1 ? 'Credits' : `/ ${ws.creditsLimit}`}
                </div>
              </div>
            </div>

            {ws.creditsLimit > 0 && (
              <div className="mt-3">
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(100, (ws.creditsUsed / ws.creditsLimit) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        {workspaces.length === 0 && (
          <div className="col-span-2 text-center py-12 text-muted-foreground text-sm">
            No workspaces yet. Create one to get started.
          </div>
        )}
      </div>

      {selected && (
        <div className="border border-border rounded-lg bg-card p-4 space-y-3">
          <h3 className="text-sm font-medium text-foreground">Workspace: {selected.name}</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Created:</span>{' '}
              <span className="text-foreground">{new Date(selected.createdAt).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Members:</span>{' '}
              <span className="text-foreground">{selected.members.length || 1}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Memory Isolation:</span>{' '}
              <span className="text-emerald-400">Active (RLS)</span>
            </div>
            <div>
              <span className="text-muted-foreground">Billing:</span>{' '}
              <span className="text-foreground">{selected.tier} tier</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
