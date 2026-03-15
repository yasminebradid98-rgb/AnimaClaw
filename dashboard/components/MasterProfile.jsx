import { useState } from 'react';
import { COLORS } from '../lib/constants';

const PROFILE_FIELDS = [
  'master_name', 'brand', 'mission_dna', 'primary_platform',
  'tools_stack', 'goal_90_days', 'main_obstacles', 'communication_style',
  'business_model', 'content_topics', 'first_automation', 'system_prohibitions',
  'team_structure', 'timezone',
];

function calculateCompleteness(profileJson) {
  if (!profileJson) return 0;
  let filled = 0;
  for (const field of PROFILE_FIELDS) {
    const val = profileJson[field];
    if (val === null || val === undefined || val === '') continue;
    if (Array.isArray(val) && val.length === 0) continue;
    filled++;
  }
  return Math.round((filled / PROFILE_FIELDS.length) * 100);
}

function ModeBadge({ mode }) {
  const config = {
    SPARK: { bg: '#c9a84c22', border: '#c9a84c', text: '#c9a84c', icon: String.fromCodePoint(0x26A1) },
    ORACLE: { bg: '#4c7bc922', border: '#4c7bc9', text: '#4c7bc9', icon: String.fromCodePoint(0x1F52E) },
    WILD: { bg: '#4cc97b22', border: '#4cc97b', text: '#4cc97b', icon: String.fromCodePoint(0x1F300) },
  };
  const c = config[mode] || config.SPARK;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono"
      style={{ backgroundColor: c.bg, border: `1px solid ${c.border}`, color: c.text }}
    >
      {c.icon} {mode}
    </span>
  );
}

function CompletenessBar({ percent }) {
  const barColor = percent >= 61.8 ? '#4cc97b' : percent >= 38.2 ? '#c9a84c' : '#c94c4c';
  return (
    <div className="mt-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-anima-text-dim">Profile Completeness</span>
        <span className="text-xs font-mono" style={{ color: barColor }}>{percent}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-anima-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}

export default function MasterProfile({ profile }) {
  const [showOraclePrompt, setShowOraclePrompt] = useState(false);
  const p = profile?.profile_json || profile || {};
  const hasProfile = p.master_name || p.brand || p.mission_dna;
  const completeness = calculateCompleteness(p);
  const onboardingMode = profile?.onboarding_mode || 'N/A';

  if (!hasProfile) {
    return (
      <div className="bg-anima-bg-card rounded-lg border border-anima-border p-6">
        <h3 className="text-sm font-semibold text-anima-text-dim mb-2">Master Profile</h3>
        <div className="text-center py-6">
          <p className="text-anima-text-dim">No profile configured yet.</p>
          <p className="text-sm text-anima-text-dim mt-1">
            Run SOLARIS.md to begin onboarding.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-anima-bg-card rounded-lg border border-anima-border p-6">
      {/* Header with mode badge */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-semibold text-anima-text-dim">Master Profile</h3>
          <h2 className="text-xl font-bold text-anima-text mt-1">
            {p.master_name || 'Unknown'}
          </h2>
          {p.brand && (
            <p className="text-sm text-anima-gold">{p.brand}</p>
          )}
        </div>
        <div className="text-right space-y-1">
          <ModeBadge mode={onboardingMode} />
          <br />
          <span className="text-xs font-mono text-anima-text-dim">
            v{profile?.version || '1.0.0'}
          </span>
          {profile?.oracle_version > 0 && (
            <>
              <br />
              <span className="text-xs font-mono text-anima-text-dim">
                Oracle v{profile.oracle_version}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Completeness bar */}
      <CompletenessBar percent={completeness} />

      {/* Mission DNA */}
      {p.mission_dna && (
        <div className="mt-4 mb-4">
          <span className="text-xs font-semibold text-anima-text-dim">MISSION DNA</span>
          <p className="text-sm text-anima-text mt-1 italic">
            &quot;{p.mission_dna}&quot;
          </p>
        </div>
      )}

      {/* Key info grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {p.primary_platform && (
          <div>
            <span className="text-anima-text-dim">Platform</span>
            <p className="text-anima-text font-mono">{p.primary_platform}</p>
          </div>
        )}
        {p.business_model && (
          <div>
            <span className="text-anima-text-dim">Model</span>
            <p className="text-anima-text font-mono">{p.business_model}</p>
          </div>
        )}
        {p.goal_90_days && (
          <div className="col-span-2">
            <span className="text-anima-text-dim">90-Day Goal</span>
            <p className="text-anima-text">{p.goal_90_days}</p>
          </div>
        )}
        {p.first_automation && (
          <div className="col-span-2">
            <span className="text-anima-text-dim">First Automation</span>
            <p className="text-anima-text">{p.first_automation}</p>
          </div>
        )}
        {p.system_prohibitions && p.system_prohibitions.length > 0 && (
          <div className="col-span-2">
            <span className="text-anima-text-dim">Prohibitions</span>
            <ul className="text-anima-text mt-1">
              {p.system_prohibitions.map((item, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-red-400 shrink-0">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Phi Profile */}
      {p.phi_profile && (
        <div className="mt-4 pt-3 border-t border-anima-border flex gap-4 text-xs">
          <div>
            <span className="text-anima-text-dim">{String.fromCharCode(966)} Primary</span>
            <p className="font-mono text-anima-gold">{p.phi_profile.primary_focus_weight}</p>
          </div>
          <div>
            <span className="text-anima-text-dim">{String.fromCharCode(966)} Support</span>
            <p className="font-mono text-anima-blue">{p.phi_profile.support_focus_weight}</p>
          </div>
          <div>
            <span className="text-anima-text-dim">Evolution</span>
            <p className="font-mono text-anima-text">{p.phi_profile.evolution_frequency}</p>
          </div>
          <div>
            <span className="text-anima-text-dim">Cycles</span>
            <p className="font-mono text-anima-text">{p.total_cycles || 0}</p>
          </div>
        </div>
      )}

      {/* Behavioral log count (WILD mode) */}
      {onboardingMode === 'WILD' && profile?.behavioral_log && (
        <div className="mt-3 pt-3 border-t border-anima-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-anima-text-dim">Behavioral Observations</span>
            <span className="font-mono text-anima-text">
              {Array.isArray(profile.behavioral_log) ? profile.behavioral_log.length : 0} logged
            </span>
          </div>
          {!profile?.onboarding_complete && (
            <p className="text-xs text-anima-text-dim mt-1 italic">
              Profile building in progress... ({completeness}% complete)
            </p>
          )}
        </div>
      )}

      {/* Refresh Profile (ORACLE) button */}
      <div className="mt-4 pt-3 border-t border-anima-border">
        <button
          onClick={() => setShowOraclePrompt(!showOraclePrompt)}
          className="text-xs text-anima-gold hover:text-anima-text transition-colors font-mono"
        >
          {showOraclePrompt ? 'Hide Oracle Prompt' : `${String.fromCodePoint(0x1F52E)} Refresh Profile (ORACLE)`}
        </button>

        {showOraclePrompt && (
          <div className="mt-3 p-3 rounded bg-anima-bg border border-anima-border">
            <p className="text-xs text-anima-text-dim mb-2">
              Copy this prompt into Claude, ChatGPT, Gemini, or Deepseek. Answer 12 questions.
              Paste the JSON back via Settings or re-run onboarding.
            </p>
            <div className="bg-anima-bg-card p-3 rounded text-xs font-mono text-anima-text-dim max-h-40 overflow-y-auto whitespace-pre-wrap">
              {`You are ANIMA ORACLE — Master Profile Architect.\n\nYou are building a Master Profile for a human deploying ANIMA OS.\nAsk 12 questions ONE AT A TIME, then output MASTER_TEMPLATE.json.\n\nSee onboarding/oracle_prompt.txt for the full prompt.`}
            </div>
            <p className="text-xs text-anima-text-dim mt-2">
              Full prompt: <code className="text-anima-gold">onboarding/oracle_prompt.txt</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
