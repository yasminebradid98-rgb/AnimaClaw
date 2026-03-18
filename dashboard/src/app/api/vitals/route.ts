import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

export async function GET(req: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: 'Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env' },
      { status: 503 }
    )
  }

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '80'), 200)

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/anima_agent_logs` +
      `?select=id,pi_pulse_timestamp,cycle_number,vitality_score,task_description,` +
      `evolution_cycle,qrl_number,agent_name,anima_state,agents_active,queue_state,` +
      `phi_weight,mission_alignment,fractal_depth,model_used,tokens_used,cost_usd` +
      `&order=pi_pulse_timestamp.desc&limit=${limit}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        // No Next.js cache — always fresh
        cache: 'no-store',
      }
    )

    if (!res.ok) {
      const body = await res.text()
      return NextResponse.json(
        { error: `Supabase error ${res.status}`, detail: body },
        { status: 502 }
      )
    }

    const data = await res.json()

    // Compute summary stats server-side
    const latest = data[0] ?? null
    const qrlEvents = data.filter((r: { qrl_number: number }) => r.qrl_number > 0)
    const avgVitality =
      data.length > 0
        ? data.reduce((s: number, r: { vitality_score: number }) => s + (r.vitality_score ?? 0), 0) / data.length
        : 0

    return NextResponse.json({
      records: data,
      meta: {
        count: data.length,
        latest,
        avgVitality: parseFloat(avgVitality.toFixed(4)),
        qrlEventCount: qrlEvents.length,
        latestQrl: qrlEvents[0]?.qrl_number ?? 0,
        latestCycle: latest?.cycle_number ?? 0,
        anima_state: latest?.anima_state ?? 'DORMANT',
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to reach Supabase', detail: String(err) },
      { status: 502 }
    )
  }
}
