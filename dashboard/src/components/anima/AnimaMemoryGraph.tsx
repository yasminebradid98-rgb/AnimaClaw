'use client'

import { useState, useEffect } from 'react'

interface MemoryEntry {
  id: string
  agentId: string
  agentName: string
  type: 'task' | 'user' | 'context' | 'workflow'
  key: string
  value: string
  summary: string
  updatedAt: string
  tokens: number
}

interface WorkflowState {
  id: string
  name: string
  currentStep: number
  totalSteps: number
  status: 'running' | 'waiting' | 'completed' | 'failed'
  steps: { label: string; status: string }[]
}

const typeColors: Record<string, string> = {
  task: 'bg-blue-500/20 text-blue-300',
  user: 'bg-purple-500/20 text-purple-300',
  context: 'bg-emerald-500/20 text-emerald-300',
  workflow: 'bg-amber-500/20 text-amber-300',
}

const workflowStatusColors: Record<string, string> = {
  running: 'text-blue-400',
  waiting: 'text-yellow-400',
  completed: 'text-emerald-400',
  failed: 'text-red-400',
}

export function AnimaMemoryGraph() {
  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [workflows, setWorkflows] = useState<WorkflowState[]>([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterAgent, setFilterAgent] = useState<string>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    fetch('/api/memory/graph?agent=all')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.agents) {
          const entries: MemoryEntry[] = []
          for (const agent of data.agents) {
            if (agent.memories) {
              for (const mem of agent.memories) {
                entries.push({
                  id: mem.id || `${agent.name}-${entries.length}`,
                  agentId: agent.id || agent.name,
                  agentName: agent.name,
                  type: mem.type || 'context',
                  key: mem.key || mem.title || 'untitled',
                  value: mem.value || mem.content || '',
                  summary: mem.summary || (mem.content || '').slice(0, 100),
                  updatedAt: mem.updated_at || new Date().toISOString(),
                  tokens: mem.tokens || 0,
                })
              }
            }
          }
          setMemories(entries)
        }
      })
      .catch(() => {})

    fetch('/api/workflows')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.workflows) {
          setWorkflows(data.workflows.map((w: Record<string, unknown>) => ({
            id: String(w.id || ''),
            name: String(w.name || ''),
            currentStep: Number(w.current_step || 0),
            totalSteps: Number(w.total_steps || 1),
            status: String(w.status || 'running') as WorkflowState['status'],
            steps: Array.isArray(w.steps) ? w.steps : [],
          })))
        }
      })
      .catch(() => {})
  }, [])

  const agents = Array.from(new Set(memories.map(m => m.agentName)))
  const totalTokens = memories.reduce((sum, m) => sum + m.tokens, 0)

  const filtered = memories.filter(m => {
    if (filterType !== 'all' && m.type !== filterType) return false
    if (filterAgent !== 'all' && m.agentName !== filterAgent) return false
    if (search && !m.key.toLowerCase().includes(search.toLowerCase()) && !m.summary.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleSaveEdit = (id: string) => {
    setMemories(prev => prev.map(m => m.id === id ? { ...m, value: editValue, summary: editValue.slice(0, 100) } : m))
    setEditingId(null)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Structured Memory Viewer</h2>
        <div className="text-xs text-muted-foreground">
          {memories.length} entries / {totalTokens.toLocaleString()} tokens
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Per-agent/user/task memory (NOT raw chat history). Searchable, editable context with context window optimization.
      </p>

      {/* Search and filters */}
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search memory..."
          className="flex-1 min-w-[200px] px-3 py-1.5 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground"
        />
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-1.5 text-xs bg-background border border-border rounded-md text-foreground"
        >
          <option value="all">All Types</option>
          <option value="task">Task</option>
          <option value="user">User</option>
          <option value="context">Context</option>
          <option value="workflow">Workflow</option>
        </select>
        <select
          value={filterAgent}
          onChange={e => setFilterAgent(e.target.value)}
          className="px-3 py-1.5 text-xs bg-background border border-border rounded-md text-foreground"
        >
          <option value="all">All Agents</option>
          {agents.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Workflow states */}
      {workflows.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Active Workflows</h3>
          {workflows.map(wf => (
            <div key={wf.id} className="border border-border rounded-lg bg-card p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground">{wf.name}</span>
                <span className={`text-xs ${workflowStatusColors[wf.status]}`}>
                  Step {wf.currentStep}/{wf.totalSteps} - {wf.status}
                </span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: wf.totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1.5 rounded-full ${
                      i < wf.currentStep ? 'bg-primary' : i === wf.currentStep ? 'bg-yellow-400' : 'bg-secondary'
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Memory entries */}
      <div className="space-y-2">
        {filtered.map(mem => (
          <div key={mem.id} className="border border-border rounded-lg bg-card p-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-2xs rounded-full ${typeColors[mem.type]}`}>
                  {mem.type}
                </span>
                <span className="text-xs text-muted-foreground">{mem.agentName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xs text-muted-foreground">{mem.tokens} tokens</span>
                <button
                  onClick={() => { setEditingId(mem.id); setEditValue(mem.value) }}
                  className="text-2xs text-primary hover:text-primary/80"
                >
                  Edit
                </button>
              </div>
            </div>

            <div className="mt-1.5">
              <div className="text-xs font-medium text-foreground">{mem.key}</div>
              {editingId === mem.id ? (
                <div className="mt-1 space-y-1">
                  <textarea
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-background border border-border rounded text-foreground resize-none"
                    rows={3}
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleSaveEdit(mem.id)}
                      className="px-2 py-0.5 text-2xs bg-primary text-primary-foreground rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 py-0.5 text-2xs bg-secondary text-secondary-foreground rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">{mem.summary}</p>
              )}
            </div>

            <div className="text-2xs text-muted-foreground mt-1.5">
              Updated: {new Date(mem.updatedAt).toLocaleString()}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {memories.length === 0 ? 'No memory entries yet. Agents will populate memory as they work.' : 'No matching entries.'}
          </div>
        )}
      </div>
    </div>
  )
}
