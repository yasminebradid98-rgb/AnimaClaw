'use client'

import { useMemo } from 'react'
import {
  LineChart, Line, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useVitals, vitalityStatus, fmtTime, fmtScore, type VitalRecord } from '@/lib/use-vitals'
import { HealthRow, StatRow, SignalPill } from '@/components/dashboard/widget-primitives'

// ─── Constants ───────────────────────────────────────────────────────────────

const CYAN  = '#22D3EE'
const MINT  = '#34D399'
const AMBER = '#FBBF24'
const RED   = '#F87171'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stateColor(state: string) {
  switch (state.toUpperCase()) {
    case 'ACTIVE':   return 'bg-green-500/20 text-green-300 border-green-500/30'
    case 'DORMANT':  return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    case 'EVOLVING': return 'bg-cyan-500/20  text-cyan-300  border-cyan-500/30'
    case 'QRL':      return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    default:         return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }
}

function vitColor(status: 'good' | 'warn' | 'bad') {
  return status === 'good' ? 'text-green-400' : status === 'warn' ? 'text-amber-400' : 'text-red-400'
}

// Recharts custom tooltip
function VitTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as VitalRecord
  return (
    <div className="bg-card border border-border rounded px-2.5 py-1.5 text-xs font-mono-tight shadow-lg">
      <div className="text-muted-foreground">{fmtTime(d.pi_pulse_timestamp)}</div>
      <div className="text-[#22D3EE]">vit {fmtScore(d.vitality_score)}</div>
      {d.qrl_number > 0 && <div className="text-amber-400">QRL #{d.qrl_number}</div>}
    </div>
  )
}

// ─── Panel ───────────────────────────────────────────────────────────────────

export function AnimaVitalsPanel() {
  const { records, meta, loading, error, lastUpdated, refetch } = useVitals(80, 10_000)

  // Reverse so chart goes oldest → newest left to right
  const chartData = useMemo(() => [...records].reverse(), [records])

  // Last 8 QRL events for the event log
  const qrlEvents = useMemo(
    () => records.filter(r => r.qrl_number > 0).slice(0, 8),
    [records]
  )

  const vitStatus = meta ? vitalityStatus(meta.avgVitality) : 'bad'
  const latestVit = meta?.latest ? vitalityStatus(meta.latest.vitality_score) : 'bad'

  // ── Loading / error states ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm font-mono-tight">
        <span className="pulse-dot mr-2" />
        Awaiting pi-pulse signal…
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 void-panel">
        <div className="panel-header">
          <span className="text-sm font-mono-tight">Pi Vitals</span>
          <span className="badge-error">OFFLINE</span>
        </div>
        <div className="panel-body text-xs text-red-400 font-mono-tight py-4">{error}</div>
      </div>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">

      {/* ── Top header row ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PiPulseIcon />
          <h2 className="text-sm font-semibold font-mono-tight tracking-wide text-foreground">
            Pi Vitals
          </h2>
          <span className={`text-2xs px-2 py-0.5 rounded border font-mono-tight ${stateColor(meta?.anima_state ?? 'DORMANT')}`}>
            {meta?.anima_state ?? 'DORMANT'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-2xs text-muted-foreground font-mono-tight">
              updated {fmtTime(lastUpdated.toISOString())}
            </span>
          )}
          <button
            onClick={refetch}
            className="text-2xs text-muted-foreground hover:text-foreground border border-border rounded px-2 py-0.5 font-mono-tight transition-colors"
          >
            ↺ refresh
          </button>
        </div>
      </div>

      {/* ── KPI strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {/* Current vitality */}
        <div className="void-panel p-3 flex flex-col gap-0.5">
          <span className="text-2xs text-muted-foreground font-mono-tight uppercase tracking-wide">Vitality</span>
          <span className={`text-3xl font-bold font-mono-tight leading-none ${vitColor(latestVit)}`}>
            {meta?.latest ? fmtScore(meta.latest.vitality_score, 3) : '-.---'}
          </span>
          <span className="text-2xs text-muted-foreground font-mono-tight">
            avg {fmtScore(meta?.avgVitality, 3)}
          </span>
        </div>

        {/* Evolution cycle */}
        <div className="void-panel p-3 flex flex-col gap-0.5">
          <span className="text-2xs text-muted-foreground font-mono-tight uppercase tracking-wide">Cycle</span>
          <span className="text-3xl font-bold font-mono-tight leading-none text-[#22D3EE]">
            {meta?.latestCycle ?? 0}
          </span>
          <span className="text-2xs text-muted-foreground font-mono-tight">
            evolution {meta?.latest?.evolution_cycle ?? 0}
          </span>
        </div>

        {/* QRL events */}
        <div className="void-panel p-3 flex flex-col gap-0.5">
          <span className="text-2xs text-muted-foreground font-mono-tight uppercase tracking-wide">QRL Events</span>
          <span className="text-3xl font-bold font-mono-tight leading-none text-amber-400">
            {meta?.qrlEventCount ?? 0}
          </span>
          <span className="text-2xs text-muted-foreground font-mono-tight">
            latest #{meta?.latestQrl ?? 0}
          </span>
        </div>

        {/* Active agents */}
        <div className="void-panel p-3 flex flex-col gap-0.5">
          <span className="text-2xs text-muted-foreground font-mono-tight uppercase tracking-wide">Agents Active</span>
          <span className="text-3xl font-bold font-mono-tight leading-none text-[#34D399]">
            {meta?.latest?.agents_active ?? 0}
          </span>
          <span className="text-2xs text-muted-foreground font-mono-tight">
            {meta?.count ?? 0} pulses loaded
          </span>
        </div>
      </div>

      {/* ── Main content: chart + metrics ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Vitality sparkline ─ 2/3 width */}
        <div className="void-panel lg:col-span-2">
          <div className="panel-header">
            <span className="text-xs font-mono-tight text-muted-foreground">Vitality Score — last {records.length} pulses</span>
            <span className={`badge-${vitStatus === 'good' ? 'success' : vitStatus === 'warn' ? 'warning' : 'error'} text-2xs`}>
              {vitStatus.toUpperCase()}
            </span>
          </div>
          <div className="panel-body h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 6, right: 8, bottom: 0, left: -20 }}>
                <ReferenceLine y={0.7} stroke={MINT}  strokeDasharray="3 3" strokeOpacity={0.4} />
                <ReferenceLine y={0.4} stroke={AMBER} strokeDasharray="3 3" strokeOpacity={0.4} />
                <Line
                  type="monotone"
                  dataKey="vitality_score"
                  stroke={CYAN}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3, fill: CYAN }}
                />
                <Tooltip content={<VitTooltip />} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live metrics panel ─ 1/3 width */}
        <div className="void-panel">
          <div className="panel-header">
            <span className="text-xs font-mono-tight text-muted-foreground">Live Metrics</span>
          </div>
          <div className="panel-body space-y-3 py-2">
            <HealthRow
              label="φ-weight"
              value={fmtScore(meta?.latest?.phi_weight)}
              status={meta?.latest?.phi_weight != null && meta.latest.phi_weight >= 1.6 ? 'good' : 'warn'}
            />
            <HealthRow
              label="Mission Align"
              value={fmtScore(meta?.latest?.mission_alignment, 3)}
              status={vitalityStatus(meta?.latest?.mission_alignment ?? 0)}
              bar={Math.round((meta?.latest?.mission_alignment ?? 0) * 100)}
            />
            <HealthRow
              label="Fractal Depth"
              value={fmtScore(meta?.latest?.fractal_depth, 2)}
              status="good"
            />
            <div className="border-t border-border pt-2 space-y-2">
              <StatRow label="Queue" value={meta?.latest?.queue_state ?? '—'} />
              <StatRow label="Model" value={meta?.latest?.model_used ?? '—'} />
              <StatRow
                label="Tokens"
                value={meta?.latest?.tokens_used != null ? meta.latest.tokens_used.toLocaleString() : '—'}
              />
              <StatRow
                label="Cost"
                value={meta?.latest?.cost_usd != null ? `$${meta.latest.cost_usd.toFixed(6)}` : '—'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Signal pills row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <SignalPill
          label="Agent"
          value={meta?.latest?.agent_name ?? '—'}
          tone="info"
        />
        <SignalPill
          label="Queue State"
          value={meta?.latest?.queue_state ?? '—'}
          tone={meta?.latest?.queue_state === 'idle' ? 'success' : 'warning'}
        />
        <SignalPill
          label="Evolution Cycle"
          value={`#${meta?.latest?.evolution_cycle ?? 0}`}
          tone="info"
        />
        <SignalPill
          label="Last QRL"
          value={meta?.latestQrl ? `#${meta.latestQrl}` : 'none'}
          tone={meta?.latestQrl ? 'warning' : 'success'}
        />
      </div>

      {/* ── Latest task description ───────────────────────────────────────── */}
      {meta?.latest?.task_description && (
        <div className="void-panel">
          <div className="panel-header">
            <span className="text-xs font-mono-tight text-muted-foreground">Current Task</span>
            <span className="text-2xs text-muted-foreground font-mono-tight">
              {fmtTime(meta.latest.pi_pulse_timestamp)}
            </span>
          </div>
          <div className="panel-body py-2">
            <p className="text-xs font-mono-tight text-foreground/80 leading-relaxed">
              {meta.latest.task_description}
            </p>
          </div>
        </div>
      )}

      {/* ── QRL Event Log ─────────────────────────────────────────────────── */}
      <div className="void-panel">
        <div className="panel-header">
          <span className="text-xs font-mono-tight text-muted-foreground">
            QRL Event Log
          </span>
          <span className="text-2xs text-amber-400 font-mono-tight">
            {meta?.qrlEventCount ?? 0} events
          </span>
        </div>
        <div className="panel-body divide-y divide-border">
          {qrlEvents.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground font-mono-tight">
              No QRL events in current window
            </div>
          ) : (
            qrlEvents.map((r) => (
              <QrlEventRow key={r.id} record={r} />
            ))
          )}
        </div>
      </div>

      {/* ── Pulse feed (last 12 raw records) ─────────────────────────────── */}
      <div className="void-panel">
        <div className="panel-header">
          <span className="text-xs font-mono-tight text-muted-foreground">Recent Pulses</span>
          <span className="text-2xs text-muted-foreground font-mono-tight">π every 3.141s</span>
        </div>
        <div className="panel-body divide-y divide-border">
          {records.slice(0, 12).map((r) => (
            <PulseRow key={r.id} record={r} />
          ))}
        </div>
      </div>

    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function QrlEventRow({ record }: { record: VitalRecord }) {
  return (
    <div className="flex items-start gap-3 px-4 py-2 hover:bg-secondary/30 transition-colors">
      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold font-mono-tight text-amber-300">
            QRL #{record.qrl_number}
          </span>
          <span className="text-2xs text-muted-foreground font-mono-tight">
            cycle {record.cycle_number} · evo {record.evolution_cycle}
          </span>
        </div>
        {record.task_description && (
          <p className="text-xs text-muted-foreground font-mono-tight mt-0.5 truncate">
            {record.task_description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-2xs text-muted-foreground font-mono-tight">
            vit {fmtScore(record.vitality_score, 3)}
          </span>
          <span className="text-2xs text-muted-foreground font-mono-tight">
            {fmtTime(record.pi_pulse_timestamp)}
          </span>
        </div>
      </div>
    </div>
  )
}

function PulseRow({ record }: { record: VitalRecord }) {
  const status = vitalityStatus(record.vitality_score)
  const dotColor = status === 'good' ? 'bg-green-500' : status === 'warn' ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="flex items-center gap-3 px-4 py-1.5 hover:bg-secondary/30 transition-colors">
      <div className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
      <span className="text-2xs text-muted-foreground font-mono-tight w-16 shrink-0">
        {fmtTime(record.pi_pulse_timestamp)}
      </span>
      <span className={`text-2xs font-mono-tight w-14 shrink-0 ${vitColor(status)}`}>
        {fmtScore(record.vitality_score, 3)}
      </span>
      <span className="text-2xs text-muted-foreground font-mono-tight truncate flex-1">
        {record.task_description ?? record.agent_name}
      </span>
      {record.qrl_number > 0 && (
        <span className="text-2xs text-amber-400 font-mono-tight shrink-0">QRL #{record.qrl_number}</span>
      )}
    </div>
  )
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

function PiPulseIcon() {
  return (
    <svg className="w-5 h-5 text-[#22D3EE]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="10" r="7" strokeOpacity="0.4" />
      <path d="M3 10h2.5l2-4 2.5 8 2-6 1.5 3H17" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

