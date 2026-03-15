import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PHI = 1.6180339887;

function applyInterference(rawScore) {
  if (rawScore > 0.618) {
    return Math.min(rawScore * PHI, 1.618);
  }
  return rawScore * 0.382;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Return quantum state for all agents
    const { data: agents, error } = await supabase
      .from('anima_fractal_state')
      .select('branch_id, status, vitality_score, personal_best, global_best, qrl_cycle, entanglement_signal, quantum_phase')
      .neq('status', 'PRUNED');

    if (error) return res.status(500).json({ error: error.message });

    const entangledPairs = [
      { a: 'PRIMARY_CELL', b: 'EVOLUTION_NODE', dimension: 'Execution <-> Adaptation' },
      { a: 'MEMORY_NODE', b: 'IMMUNE_AGENT', dimension: 'Storage <-> Security' },
      { a: 'ROOT_ORCHESTRATOR', b: 'SUPPORT_CELL', dimension: 'Routing <-> Monitoring' },
    ];

    const globalBest = Math.max(0, ...agents.map(a => a.global_best || 0));
    const maxQrlCycle = Math.max(0, ...agents.map(a => a.qrl_cycle || 0));

    return res.status(200).json({
      agents,
      entangled_pairs: entangledPairs,
      global_best: globalBest,
      qrl_cycle: maxQrlCycle,
    });
  }

  if (req.method === 'POST') {
    const { action } = req.body;

    if (action === 'superpose') {
      // Score N strategies with interference
      const { strategies } = req.body;
      if (!strategies || !Array.isArray(strategies)) {
        return res.status(400).json({ error: 'strategies array required' });
      }

      const scored = strategies.map(s => ({
        ...s,
        raw_score: s.score,
        interfered_score: applyInterference(s.score),
        interference_type: s.score > 0.618 ? 'CONSTRUCTIVE' : 'DESTRUCTIVE',
      }));

      scored.sort((a, b) => b.interfered_score - a.interfered_score);

      return res.status(200).json({
        strategies: scored,
        collapsed_to: scored[0] || null,
        phase: 'COLLAPSED',
      });
    }

    if (action === 'entangle_check') {
      const { agent_name } = req.body;
      if (!agent_name) return res.status(400).json({ error: 'agent_name required' });

      const pairs = {
        PRIMARY_CELL: 'EVOLUTION_NODE',
        EVOLUTION_NODE: 'PRIMARY_CELL',
        MEMORY_NODE: 'IMMUNE_AGENT',
        IMMUNE_AGENT: 'MEMORY_NODE',
        ROOT_ORCHESTRATOR: 'SUPPORT_CELL',
        SUPPORT_CELL: 'ROOT_ORCHESTRATOR',
      };

      const partner = pairs[agent_name];
      if (!partner) return res.status(200).json({ entangled: false });

      const { data } = await supabase
        .from('anima_fractal_state')
        .select('entanglement_signal, personal_best, vitality_score, qrl_cycle')
        .eq('branch_id', partner)
        .single();

      return res.status(200).json({
        entangled: true,
        partner,
        partner_state: data,
      });
    }

    return res.status(400).json({ error: 'Unknown action. Use: superpose, entangle_check' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
