/**
 * AnimaClaw OpenClaw Gateway Adapter
 * Connects Mission Control to AnimaClaw's multi-provider routing system.
 * Routes requests through OpenClaw gateway with provider selection based on task type.
 */

export interface AnimaProvider {
  id: string
  name: string
  category: 'speed' | 'reasoning'
  status: 'active' | 'degraded' | 'offline'
  latencyMs?: number
}

export interface AnimaGatewayConfig {
  baseURL: string
  providers: string[]
  memorySync: {
    supabase: string | undefined
    mode: string
  }
  providerRouting: {
    speed: string[]
    reasoning: string[]
  }
}

export const animaOpenClawGateway: AnimaGatewayConfig = {
  baseURL: process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:8000/gateway',
  providers: process.env.ANIMA_PROVIDERS?.split(',') || [],
  memorySync: {
    supabase: process.env.SUPABASE_URL,
    mode: process.env.AGENT_MEMORY_MODE || 'structured',
  },
  providerRouting: {
    speed: ['kimi', 'deepseek'],
    reasoning: ['claude', 'gemini'],
  },
}

const DEFAULT_PROVIDERS: AnimaProvider[] = [
  { id: 'claude', name: 'Claude', category: 'reasoning', status: 'active' },
  { id: 'kimi', name: 'Kimi', category: 'speed', status: 'active' },
  { id: 'deepseek', name: 'DeepSeek', category: 'speed', status: 'active' },
  { id: 'gemini', name: 'Gemini', category: 'reasoning', status: 'active' },
]

export function getActiveProviders(): AnimaProvider[] {
  const configured = animaOpenClawGateway.providers
  if (configured.length === 0) return DEFAULT_PROVIDERS
  return DEFAULT_PROVIDERS.filter(p => configured.includes(p.id))
}

export function routeProvider(taskType: 'speed' | 'reasoning'): string {
  const pool = animaOpenClawGateway.providerRouting[taskType]
  const available = pool.filter(id =>
    getActiveProviders().some(p => p.id === id && p.status === 'active')
  )
  return available[0] || pool[0] || 'claude'
}

export async function sendToGateway(payload: {
  agentId: string
  message: string
  taskType?: 'speed' | 'reasoning'
  context?: Record<string, unknown>
}): Promise<{ response: string; provider: string; tokensUsed: number }> {
  const provider = routeProvider(payload.taskType || 'reasoning')

  const res = await fetch(`${animaOpenClawGateway.baseURL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agent_id: payload.agentId,
      message: payload.message,
      provider,
      memory_mode: animaOpenClawGateway.memorySync.mode,
      context: payload.context || {},
    }),
  })

  if (!res.ok) {
    throw new Error(`Gateway error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  return {
    response: data.response || '',
    provider: data.provider || provider,
    tokensUsed: data.tokens_used || 0,
  }
}

export async function syncMemoryToSupabase(agentId: string, memory: Record<string, unknown>): Promise<void> {
  const supabaseUrl = animaOpenClawGateway.memorySync.supabase
  if (!supabaseUrl) return

  await fetch(`${supabaseUrl}/rest/v1/agent_memory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_ANON_KEY || '',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      agent_id: agentId,
      memory_data: memory,
      updated_at: new Date().toISOString(),
    }),
  })
}

export function isAnimaClawMode(): boolean {
  return process.env.ANIMA_CLAW_MODE === 'true'
}
