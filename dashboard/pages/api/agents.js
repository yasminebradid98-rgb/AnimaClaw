import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { agent_name, limit = 50, since_cycle } = req.query;

    let query = supabase
      .from('anima_agent_logs')
      .select('*')
      .is('archived_at', null)
      .order('pi_pulse_timestamp', { ascending: false })
      .limit(parseInt(limit));

    if (agent_name) query = query.eq('agent_name', agent_name);
    if (since_cycle) query = query.gte('cycle_number', parseInt(since_cycle));

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const log = req.body;
    if (!log.agent_name) {
      return res.status(400).json({ error: 'agent_name is required' });
    }

    const { data, error } = await supabase
      .from('anima_agent_logs')
      .insert({
        agent_name: log.agent_name,
        fractal_depth: log.fractal_depth || 0,
        phi_weight: log.phi_weight || 1.0,
        task_description: log.task_description || '',
        mission_alignment: log.mission_alignment || 0,
        model_used: log.model_used || 'unknown',
        tokens_used: log.tokens_used || 0,
        cost_usd: log.cost_usd || 0,
        cycle_number: log.cycle_number || 0,
        vitality_score: log.vitality_score || 0,
        user_id: log.user_id,
      })
      .select();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
