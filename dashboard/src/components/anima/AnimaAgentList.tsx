'use client'

import { useState, useEffect } from 'react'

interface AnimaAgent {
  id: string
  name: string
  type: string
  description: string
  systemPrompt: string
  tools: string[]
  memoryScope: string
  tier: 'free' | 'pro' | 'enterprise'
  status: 'active' | 'idle' | 'offline'
  tasksCompleted: number
  languages: string[]
}

const PRESET_AGENTS: AnimaAgent[] = [
  {
    id: 'content-agent',
    name: 'Content Agent',
    type: 'content',
    description: 'TikTok/Reels scripts, SEO-optimized, platform-specific content generation',
    systemPrompt: 'You are a content creation specialist. Generate platform-specific content optimized for engagement. Support TikTok, Instagram Reels, YouTube Shorts, and blog posts. Always include SEO keywords and hashtag suggestions.',
    tools: ['web-search', 'seo-analyzer', 'content-formatter', 'hashtag-generator'],
    memoryScope: 'content-projects',
    tier: 'free',
    status: 'active',
    tasksCompleted: 0,
    languages: ['en', 'fr', 'ar'],
  },
  {
    id: 'research-agent',
    name: 'Research Agent',
    type: 'research',
    description: 'Deep web research, source verification, fact-checking with citations',
    systemPrompt: 'You are a research analyst. Conduct thorough research with source verification. Always cite sources, cross-reference claims, and flag unverified information. Produce structured research briefs.',
    tools: ['web-search', 'fact-checker', 'citation-builder', 'summary-engine'],
    memoryScope: 'research-data',
    tier: 'pro',
    status: 'active',
    tasksCompleted: 0,
    languages: ['en', 'fr'],
  },
  {
    id: 'customer-service-agent',
    name: 'Customer Service Agent',
    type: 'support',
    description: 'Multi-language support (EN/FR/AR), CRM integration, ticket management',
    systemPrompt: 'You are a customer service representative. Respond professionally in the customer\'s language (English, French, or Arabic). Escalate complex issues. Log all interactions to CRM. Maintain brand voice.',
    tools: ['crm-connector', 'ticket-manager', 'language-detector', 'knowledge-base'],
    memoryScope: 'customer-interactions',
    tier: 'pro',
    status: 'active',
    tasksCompleted: 0,
    languages: ['en', 'fr', 'ar'],
  },
  {
    id: 'workflow-agent',
    name: 'Workflow Agent',
    type: 'orchestrator',
    description: 'Multi-step orchestration: research -> write -> review -> post pipeline',
    systemPrompt: 'You are a workflow orchestrator. Break complex tasks into sequential steps, delegate to specialized agents, collect results, and assemble final deliverables. Track progress at each stage.',
    tools: ['agent-dispatcher', 'pipeline-manager', 'quality-checker', 'publisher'],
    memoryScope: 'workflow-state',
    tier: 'enterprise',
    status: 'active',
    tasksCompleted: 0,
    languages: ['en'],
  },
]

const tierColors: Record<string, string> = {
  free: 'bg-slate-500/20 text-slate-300',
  pro: 'bg-indigo-500/20 text-indigo-300',
  enterprise: 'bg-amber-500/20 text-amber-300',
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-400',
  idle: 'bg-yellow-400',
  offline: 'bg-red-400',
}

export function AnimaAgentList() {
  const [agents, setAgents] = useState<AnimaAgent[]>(PRESET_AGENTS)
  const [filter, setFilter] = useState<string>('all')
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/agents')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.agents?.length) {
          const merged = [...PRESET_AGENTS]
          for (const remote of data.agents) {
            if (!merged.find(a => a.id === remote.id)) {
              merged.push({
                id: remote.id || remote.name,
                name: remote.name || remote.id,
                type: remote.framework || 'custom',
                description: remote.description || '',
                systemPrompt: '',
                tools: [],
                memoryScope: 'default',
                tier: 'free',
                status: remote.status === 'online' ? 'active' : 'offline',
                tasksCompleted: remote.tasks_completed || 0,
                languages: ['en'],
              })
            }
          }
          setAgents(merged)
        }
      })
      .catch(() => {})
  }, [])

  const filtered = filter === 'all' ? agents : agents.filter(a => a.type === filter)

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">AnimaClaw Agent Registry</h2>
        <div className="flex gap-1">
          {['all', 'content', 'research', 'support', 'orchestrator'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.map(agent => (
          <div
            key={agent.id}
            className="border border-border rounded-lg bg-card p-4 hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${statusColors[agent.status]}`} />
                <div>
                  <h3 className="text-sm font-medium text-foreground">{agent.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{agent.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-2xs rounded-full ${tierColors[agent.tier]}`}>
                  {agent.tier.toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground">{agent.languages.join('/')}</span>
              </div>
            </div>

            {expandedAgent === agent.id && (
              <div className="mt-3 pt-3 border-t border-border space-y-2">
                <div>
                  <span className="text-2xs text-muted-foreground uppercase tracking-wide">System Prompt</span>
                  <p className="text-xs text-foreground/80 mt-1">{agent.systemPrompt}</p>
                </div>
                <div className="flex gap-4">
                  <div>
                    <span className="text-2xs text-muted-foreground uppercase tracking-wide">Tools</span>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {agent.tools.map(t => (
                        <span key={t} className="px-2 py-0.5 text-2xs bg-secondary rounded">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-2xs text-muted-foreground uppercase tracking-wide">Memory</span>
                    <p className="text-xs text-foreground/80 mt-1">{agent.memoryScope}</p>
                  </div>
                </div>
                <div className="text-2xs text-muted-foreground">
                  Tasks completed: {agent.tasksCompleted}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
