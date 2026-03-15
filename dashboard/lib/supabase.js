import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'ANIMA OS: Supabase credentials not configured. ' +
    'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export async function fetchAgentLogs(filters = {}) {
  let query = supabase
    .from('anima_agent_logs')
    .select('*')
    .is('archived_at', null)
    .order('pi_pulse_timestamp', { ascending: false });

  if (filters.agentName) query = query.eq('agent_name', filters.agentName);
  if (filters.limit) query = query.limit(filters.limit);
  if (filters.sinceCycle) query = query.gte('cycle_number', filters.sinceCycle);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchFractalState() {
  const { data, error } = await supabase
    .from('anima_fractal_state')
    .select('*')
    .order('depth_level', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchEvolutionLog(limit = 50) {
  const { data, error } = await supabase
    .from('anima_evolution_log')
    .select('*')
    .order('cycle_number', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function fetchCostData(dateRange = 'daily') {
  const { data, error } = await supabase
    .from('anima_cost_tracker')
    .select('*')
    .order('date', { ascending: false })
    .limit(dateRange === 'daily' ? 30 : dateRange === 'weekly' ? 12 : 365);

  if (error) throw error;
  return data || [];
}

export async function fetchMasterProfile() {
  const { data, error } = await supabase
    .from('anima_master_profile')
    .select('*')
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export function subscribeToTable(table, callback) {
  const channel = supabase
    .channel(`anima-${table}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      (payload) => callback(payload)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
