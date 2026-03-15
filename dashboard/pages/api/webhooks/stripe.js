import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const config = {
  api: { bodyParser: false },
};

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBody = await readBody(req);
  let event;

  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  // Log Stripe event as cost data
  const eventType = event.type || 'unknown';
  const amount = event.data?.object?.amount ? event.data.object.amount / 100 : 0;

  const { error } = await supabase
    .from('anima_cost_tracker')
    .insert({
      agent_name: 'stripe_webhook',
      model_used: 'stripe',
      tokens_input: 0,
      tokens_output: 0,
      cost_usd: amount,
      task_type: `stripe:${eventType}`,
      metadata: { stripe_event_id: event.id, event_type: eventType },
    });

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ received: true });
}
