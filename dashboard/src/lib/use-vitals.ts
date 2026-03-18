'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VitalRecord {
  id: string
  pi_pulse_timestamp: string
  cycle_number: number
  vitality_score: number
  task_description: string | null
  evolution_cycle: number
  qrl_number: number
  agent_name: string
  anima_state: string
  agents_active: number
  queue_state: string
  phi_weight: number
  mission_alignment: number
  fractal_depth: number
  model_used: string | null
  tokens_used: number
  cost_usd: number
}

export interface VitalsMeta {
  count: number
  latest: VitalRecord | null
  avgVitality: number
  qrlEventCount: number
  latestQrl: number
  latestCycle: number
  anima_state: string
}

export interface VitalsState {
  records: VitalRecord[]
  meta: VitalsMeta | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  /** Call to force an immediate refresh */
  refetch: () => void
}

// ─── Default meta ─────────────────────────────────────────────────────────────

const DEFAULT_META: VitalsMeta = {
  count: 0,
  latest: null,
  avgVitality: 0,
  qrlEventCount: 0,
  latestQrl: 0,
  latestCycle: 0,
  anima_state: 'DORMANT',
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Polls /api/vitals every `intervalMs` (default 10 s).
 * Pauses when the tab is hidden; resumes and refetches immediately on tab focus.
 * Mirrors the useSmartPoll visibility pattern already in this codebase.
 */
export function useVitals(limit = 80, intervalMs = 10_000): VitalsState {
  const [records, setRecords] = useState<VitalRecord[]>([])
  const [meta, setMeta] = useState<VitalsMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isVisible = useRef(true)

  const fetchVitals = useCallback(async () => {
    try {
      const res = await fetch(`/api/vitals?limit=${limit}`, { cache: 'no-store' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setRecords(data.records ?? [])
      setMeta(data.meta ?? DEFAULT_META)
      setError(null)
      setLastUpdated(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [limit])

  const startPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (!isVisible.current) return
    intervalRef.current = setInterval(() => {
      if (isVisible.current) fetchVitals()
    }, intervalMs)
  }, [fetchVitals, intervalMs])

  useEffect(() => {
    // Initial fetch
    fetchVitals()
    startPolling()

    const handleVisibility = () => {
      isVisible.current = document.visibilityState === 'visible'
      if (isVisible.current) {
        fetchVitals()
        startPolling()
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchVitals, startPolling])

  return { records, meta, loading, error, lastUpdated, refetch: fetchVitals }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map a 0-1 vitality score to a status tier */
export function vitalityStatus(score: number): 'good' | 'warn' | 'bad' {
  if (score >= 0.7) return 'good'
  if (score >= 0.4) return 'warn'
  return 'bad'
}

/** Format pi_pulse_timestamp → HH:MM:SS */
export function fmtTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return '--:--:--'
  }
}

/** Format a float to fixed decimal with padding */
export function fmtScore(n: number | null | undefined, decimals = 4): string {
  if (n == null) return '-.----'
  return n.toFixed(decimals)
}
