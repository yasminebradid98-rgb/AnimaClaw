import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { limit = 50, agent } = req.query;

    let query = supabase
      .from('anima_evolution_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (agent) {
      query = query.eq('branch_id', agent);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const {
      branch_id,
      cycle_number,
      mutation_type,
      mutation_description,
      alignment_before,
      alignment_after,
      personal_best,
      global_best,
      branches_pruned = 0,
      branches_spawned = 0,
    } = req.body;

    if (!branch_id || !mutation_type) {
      return res.status(400).json({ error: 'branch_id and mutation_type are required' });
    }

    const { data, error } = await supabase
      .from('anima_evolution_log')
      .insert({
        branch_id,
        cycle_number,
        mutation_type,
        mutation_description,
        alignment_before,
        alignment_after,
        personal_best,
        global_best,
        branches_pruned,
        branches_spawned,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
