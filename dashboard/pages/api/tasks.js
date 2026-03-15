import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET': {
      const { status, agent_name, limit = 50 } = req.query;

      let query = supabase
        .from('anima_agent_logs')
        .select('id, agent_name, task_description, mission_alignment, vitality_score, pi_pulse_timestamp, cycle_number')
        .is('archived_at', null)
        .order('pi_pulse_timestamp', { ascending: false })
        .limit(parseInt(limit));

      if (agent_name) query = query.eq('agent_name', agent_name);

      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });

      // Map to task format
      const tasks = (data || []).map(log => ({
        id: log.id,
        title: log.task_description,
        description: log.task_description,
        agent_name: log.agent_name,
        mission_alignment: log.mission_alignment,
        status: log.vitality_score >= 0.618 ? 'done' : log.vitality_score > 0 ? 'doing' : 'todo',
        cycle: log.cycle_number,
        timestamp: log.pi_pulse_timestamp,
      }));

      return res.status(200).json(tasks);
    }

    case 'POST': {
      const task = req.body;
      if (!task.description) {
        return res.status(400).json({ error: 'description is required' });
      }

      const { data, error } = await supabase
        .from('anima_agent_logs')
        .insert({
          agent_name: task.agent_name || 'UNASSIGNED',
          task_description: task.description,
          mission_alignment: task.mission_alignment || 0,
          phi_weight: task.phi_weight || 0.5,
          user_id: task.user_id,
        })
        .select();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }

    case 'PUT': {
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });

      const { data, error } = await supabase
        .from('anima_agent_logs')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    case 'DELETE': {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id is required' });

      const { error } = await supabase
        .from('anima_agent_logs')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ deleted: true });
    }

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
