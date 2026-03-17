'use client'

import { useState, useEffect } from 'react'

interface TierInfo {
  id: string
  label: string
  credits: number
  agents: number
  providers: string[]
  features: string[]
  color: string
  price: string
}

interface UsageData {
  creditsUsed: number
  creditsLimit: number
  tier: string
  agentsActive: number
  requestsToday: number
  tokensUsed: number
  costEstimate: number
  providerBreakdown: { provider: string; tokens: number; cost: number }[]
}

const TIERS: TierInfo[] = [
  {
    id: 'free',
    label: 'Free',
    credits: 100,
    agents: 1,
    providers: ['deepseek'],
    features: ['Basic agents', 'Single workspace', 'Community support'],
    color: '#94a3b8',
    price: '$0/mo',
  },
  {
    id: 'pro',
    label: 'Pro',
    credits: 5000,
    agents: -1,
    providers: ['claude', 'kimi', 'deepseek', 'gemini'],
    features: ['All agents', 'Priority providers', 'Multi-workspace', 'Memory sync', 'Email support'],
    color: '#6366f1',
    price: '$49/mo',
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    credits: -1,
    agents: -1,
    providers: ['claude', 'kimi', 'deepseek', 'gemini', 'custom'],
    features: ['Unlimited credits', 'Custom agents', 'Dedicated infra', 'SLA', 'Priority support'],
    color: '#f59e0b',
    price: 'Custom',
  },
]

export function UsageTierPanel() {
  const [currentTier, setCurrentTier] = useState<string>('pro')
  const [usage, setUsage] = useState<UsageData>({
    creditsUsed: 0,
    creditsLimit: 5000,
    tier: 'pro',
    agentsActive: 0,
    requestsToday: 0,
    tokensUsed: 0,
    costEstimate: 0,
    providerBreakdown: [],
  })

  useEffect(() => {
    fetch('/api/agents')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.agents) {
          setUsage(prev => ({
            ...prev,
            agentsActive: data.agents.filter((a: Record<string, string>) => a.status === 'online').length,
          }))
        }
      })
      .catch(() => {})
  }, [])

  const activeTier = TIERS.find(t => t.id === currentTier) || TIERS[1]
  const usagePercent = activeTier.credits > 0 ? Math.min(100, (usage.creditsUsed / activeTier.credits) * 100) : 0

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-lg font-semibold text-foreground">Usage & Tiers</h2>

      {/* Current usage summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Credits Used', value: `${usage.creditsUsed}/${activeTier.credits === -1 ? '\u221e' : activeTier.credits}` },
          { label: 'Active Agents', value: String(usage.agentsActive) },
          { label: 'Requests Today', value: String(usage.requestsToday) },
          { label: 'Est. Cost', value: `$${usage.costEstimate.toFixed(2)}` },
        ].map(stat => (
          <div key={stat.label} className="border border-border rounded-lg bg-card p-3 text-center">
            <div className="text-xl font-semibold text-foreground">{stat.value}</div>
            <div className="text-2xs text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Usage bar */}
      {activeTier.credits > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Credit Usage</span>
            <span>{usagePercent.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${usagePercent}%`,
                backgroundColor: usagePercent > 80 ? '#ef4444' : usagePercent > 60 ? '#f59e0b' : activeTier.color,
              }}
            />
          </div>
        </div>
      )}

      {/* Provider breakdown */}
      {usage.providerBreakdown.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Provider Breakdown</h3>
          {usage.providerBreakdown.map(pb => (
            <div key={pb.provider} className="flex items-center justify-between text-xs py-1">
              <span className="text-foreground capitalize">{pb.provider}</span>
              <span className="text-muted-foreground">{pb.tokens.toLocaleString()} tokens / ${pb.cost.toFixed(4)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tier cards */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">Available Plans</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {TIERS.map(tier => (
            <div
              key={tier.id}
              className={`border rounded-lg bg-card p-4 transition-colors cursor-pointer ${
                currentTier === tier.id
                  ? 'border-2'
                  : 'border-border hover:border-primary/40'
              }`}
              style={currentTier === tier.id ? { borderColor: tier.color } : undefined}
              onClick={() => setCurrentTier(tier.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-foreground">{tier.label}</span>
                <span className="text-xs font-medium" style={{ color: tier.color }}>{tier.price}</span>
              </div>

              <div className="space-y-1 mb-3">
                <div className="text-xs text-muted-foreground">
                  {tier.credits === -1 ? 'Unlimited' : tier.credits.toLocaleString()} credits/mo
                </div>
                <div className="text-xs text-muted-foreground">
                  {tier.agents === -1 ? 'Unlimited' : tier.agents} agent{tier.agents !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="space-y-1">
                {tier.features.map(f => (
                  <div key={f} className="text-2xs text-muted-foreground flex items-center gap-1.5">
                    <span style={{ color: tier.color }}>+</span> {f}
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-2 border-t border-border">
                <div className="text-2xs text-muted-foreground">Providers:</div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {tier.providers.map(p => (
                    <span key={p} className="px-1.5 py-0.5 text-2xs bg-secondary rounded capitalize">{p}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
