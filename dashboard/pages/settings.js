import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { fetchMasterProfile } from '../lib/supabase';

const INTEGRATION_LIST = [
  { name: 'Supabase', key: 'supabase', required: true, envVars: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY'] },
  { name: 'Discord', key: 'discord', required: true, envVars: ['DISCORD_BOT_TOKEN', 'DISCORD_GUILD_ID'] },
  { name: 'OpenRouter', key: 'openrouter', required: true, envVars: ['OPENROUTER_API_KEY'] },
  { name: 'Telegram', key: 'telegram', required: false, envVars: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'] },
  { name: 'n8n', key: 'n8n', required: false, envVars: ['N8N_WEBHOOK_URL'] },
  { name: 'Helicone', key: 'helicone', required: false, envVars: ['HELICONE_API_KEY'] },
  { name: 'Langfuse', key: 'langfuse', required: false, envVars: ['LANGFUSE_PUBLIC_KEY', 'LANGFUSE_SECRET_KEY'] },
  { name: 'Ollama', key: 'ollama', required: false, envVars: ['OLLAMA_BASE_URL'] },
  { name: 'Stripe', key: 'stripe', required: false, envVars: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'] },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchMasterProfile().then(data => {
      if (data?.[0]) setProfile(data[0]);
    });
  }, []);

  return (
    <Layout systemState="ALIVE">
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-anima-text">System Settings</h1>
          <p className="text-sm text-anima-text-secondary mt-1">
            Configuration, integrations, and system constants
          </p>
        </div>

        {/* Constants */}
        <div className="p-5 rounded-lg border border-white/5 bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-anima-text mb-4">Mathematical Constants (Immutable)</h3>
          <div className="grid grid-cols-4 gap-4">
            {[
              { symbol: '\u03c6', name: 'Golden Ratio', value: '1.6180339887', desc: 'Structure, hierarchy' },
              { symbol: '\u03c0', name: 'Pi', value: '3.1415926535', desc: 'Rhythm, cycles' },
              { symbol: 'e', name: "Euler's Number", value: '2.7182818284', desc: 'Growth, decay' },
              { symbol: '\u221e', name: 'Fractal', value: 'Self-similar', desc: 'Depth 0-5' },
            ].map(c => (
              <div key={c.symbol} className="p-3 rounded border border-white/5">
                <div className="text-2xl text-anima-gold font-mono">{c.symbol}</div>
                <div className="text-xs text-anima-text mt-1">{c.name}</div>
                <div className="text-xs font-mono text-anima-text-secondary mt-0.5">{c.value}</div>
                <div className="text-[10px] text-anima-text-secondary mt-1">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Timing */}
        <div className="grid grid-cols-2 gap-4" style={{ gridTemplateColumns: '61.8% 38.2%' }}>
          <div className="p-5 rounded-lg border border-white/5 bg-white/[0.02]">
            <h3 className="text-sm font-semibold text-anima-text mb-4">Cycle Timing (\u03c0-derived)</h3>
            <div className="space-y-2">
              {[
                { event: 'Heartbeat', interval: '\u03c0 seconds', value: '3.14s' },
                { event: 'Memory compaction', interval: '\u03c0 \u00d7 \u03c6 minutes', value: '5.08 min' },
                { event: 'Alignment scan', interval: '\u03c0 \u00d7 \u03c6\u00b2 cycles', value: '~8.22 cycles' },
                { event: 'Evolution check', interval: '\u03c0\u00b2 cycles', value: '~9.87 cycles' },
                { event: 'Full reset', interval: '\u03c6\u2075 cycles', value: '~11.09 cycles' },
                { event: 'Daily report', interval: '\u03c0 \u00d7 \u03c6\u00b3 hours', value: '~13.28h' },
              ].map(t => (
                <div key={t.event} className="flex justify-between text-xs font-mono">
                  <span className="text-anima-text">{t.event}</span>
                  <span className="text-anima-text-secondary">{t.interval}</span>
                  <span className="text-anima-gold">{t.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-lg border border-white/5 bg-white/[0.02]">
            <h3 className="text-sm font-semibold text-anima-text mb-4">Vitality Thresholds</h3>
            <div className="space-y-3">
              {[
                { label: 'EXPANDING', range: '> 1.0', color: '#4cc97b', action: 'Spawn agents' },
                { label: 'STABLE', range: '0.618 \u2013 1.0', color: '#c9a84c', action: 'Maintain' },
                { label: 'DECLINING', range: '0.382 \u2013 0.618', color: '#c94c4c', action: 'Evolve' },
                { label: 'CRITICAL', range: '< 0.382', color: '#ff0000', action: 'Morphallaxis' },
              ].map(v => (
                <div key={v.label} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} />
                  <span className="text-xs text-anima-text w-20">{v.label}</span>
                  <span className="text-xs font-mono text-anima-text-secondary flex-1">{v.range}</span>
                  <span className="text-[10px] text-anima-text-secondary">{v.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="p-5 rounded-lg border border-white/5 bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-anima-text mb-4">Integrations</h3>
          <div className="space-y-2">
            {INTEGRATION_LIST.map(int => (
              <div key={int.key} className="flex items-center justify-between p-3 rounded border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    int.required ? 'bg-anima-green' : 'bg-anima-text-secondary'
                  }`} />
                  <span className="text-sm text-anima-text">{int.name}</span>
                  {int.required && (
                    <span className="text-[9px] font-mono text-anima-gold bg-anima-gold/10 px-1.5 py-0.5 rounded">
                      REQUIRED
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {int.envVars.map(v => (
                    <span key={v} className="text-[9px] font-mono text-anima-text-secondary bg-white/5 px-1.5 py-0.5 rounded">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Summary */}
        {profile && (
          <div className="p-5 rounded-lg border border-white/5 bg-white/[0.02]">
            <h3 className="text-sm font-semibold text-anima-text mb-4">Master Profile</h3>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-anima-text-secondary">Name:</span>{' '}
                <span className="text-anima-text">{profile.profile_data?.master_name || '\u2014'}</span>
              </div>
              <div>
                <span className="text-anima-text-secondary">Brand:</span>{' '}
                <span className="text-anima-text">{profile.profile_data?.brand || '\u2014'}</span>
              </div>
              <div>
                <span className="text-anima-text-secondary">Platform:</span>{' '}
                <span className="text-anima-text">{profile.profile_data?.primary_platform || '\u2014'}</span>
              </div>
              <div>
                <span className="text-anima-text-secondary">Onboarding:</span>{' '}
                <span className="text-anima-text">{profile.onboarding_mode || '\u2014'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
