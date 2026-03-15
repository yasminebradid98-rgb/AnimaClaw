import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { event_type, agent_name, task_description, data } = req.body;

  if (!event_type) {
    return res.status(400).json({ error: 'event_type is required' });
  }

  // Log the incoming webhook
  const { error } = await supabase
    .from('anima_agent_logs')
    .insert({
      agent_name: agent_name || 'n8n_webhook',
      task_type: 'webhook_inbound',
      task_description: task_description || `n8n event: ${event_type}`,
      mission_alignment: 0.5,
      vitality_score: 0.5,
      cost_usd: 0,
      model_used: 'n8n',
      metadata: { event_type, source: 'n8n', data },
    });

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({
    received: true,
    event_type,
    timestamp: new Date().toISOString(),
  });
}
