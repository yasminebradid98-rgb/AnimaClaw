import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET': {
      const { data, error } = await supabase
        .from('anima_master_profile')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data || null);
    }

    case 'POST': {
      const { profile_json, onboarding_mode, user_id } = req.body;

      if (!profile_json) {
        return res.status(400).json({ error: 'profile_json is required' });
      }

      // Add system timestamps
      const profileWithMeta = {
        ...profile_json,
        installed_at: profile_json.installed_at || new Date().toISOString(),
        last_evolution: profile_json.last_evolution || '',
        total_cycles: profile_json.total_cycles || 0,
      };

      const { data, error } = await supabase
        .from('anima_master_profile')
        .upsert({
          user_id: user_id,
          profile_json: profileWithMeta,
          onboarding_mode: onboarding_mode || 'SPARK',
          version: '1.0.0',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }

    case 'PUT': {
      const { user_id, updates } = req.body;
      if (!user_id) return res.status(400).json({ error: 'user_id is required' });

      // Fetch current profile
      const { data: current, error: fetchError } = await supabase
        .from('anima_master_profile')
        .select('profile_json')
        .eq('user_id', user_id)
        .single();

      if (fetchError) return res.status(500).json({ error: fetchError.message });

      // Merge updates into existing profile
      const mergedProfile = {
        ...(current?.profile_json || {}),
        ...updates,
      };

      const { data, error } = await supabase
        .from('anima_master_profile')
        .update({
          profile_json: mergedProfile,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user_id)
        .select();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
