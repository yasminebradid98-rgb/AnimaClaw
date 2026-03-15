import { createClient } from '@supabase/supabase-js';
import { calculateVitality, calculateSystemVitality } from '../../lib/vitality';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch all active agents
    const { data: agents, error: agentError } = await supabase
      .from('anima_fractal_state')
      .select('*')
      .neq('status', 'PRUNED')
      .order('depth_level', { ascending: true });

    if (agentError) throw agentError;

    if (!agents || agents.length === 0) {
      return res.status(200).json({
        system_vitality: 0,
        system_state: 'DORMANT',
        agents: [],
      });
    }

    // Calculate vitality for each agent
    const agentVitalities = agents.map(agent => {
      const vitality = calculateVitality(
        agent.depth_level || 0,
        agent.personal_best || 0.5,
        Math.max(1, Math.floor((Date.now() - new Date(agent.last_heartbeat).getTime()) / (3141.5926535))),
        agent.spawn_count > 0 ? agent.spawn_count / 8 : 0.5
      );

      return {
        branch_id: agent.branch_id,
        depth: agent.depth_level,
        phi_weight: parseFloat(agent.vitality_score) || 0,
        vitality_score: vitality,
        status: agent.status,
        personal_best: agent.personal_best,
      };
    });

    // Calculate system vitality
    const systemVitality = calculateSystemVitality(agentVitalities);

    // Determine system state
    const minVitality = Math.min(...agentVitalities.map(a => a.vitality_score));
    const hasEvolving = agentVitalities.some(a => a.status === 'EVOLVING');
    let systemState = 'ALIVE';
    if (hasEvolving) systemState = 'EVOLVING';
    else if (minVitality < 0.618) systemState = 'HEALING';
    else if (minVitality === 0) systemState = 'DORMANT';

    return res.status(200).json({
      system_vitality: parseFloat(systemVitality.toFixed(6)),
      system_state: systemState,
      agents: agentVitalities,
      calculated_at: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
