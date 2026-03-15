import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { trace_id, observation_id, event_type, data } = req.body;

  const { error } = await supabase
    .from('anima_agent_logs')
    .insert({
      agent_name: data?.agent_name || 'langfuse_trace',
      task_type: 'langfuse_observation',
      task_description: `Langfuse ${event_type}: ${trace_id}`,
      mission_alignment: data?.score || 0.5,
      vitality_score: 0.5,
      cost_usd: data?.cost_usd || 0,
      model_used: data?.model || 'unknown',
      metadata: { trace_id, observation_id, event_type, langfuse_data: data },
    });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ received: true, trace_id });
}
