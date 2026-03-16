import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import MissionControl from '../components/MissionControl';
import {
  fetchFractalState,
  fetchMasterProfile,
  fetchCostData,
  fetchEvolutionLog,
  subscribeToTable,
  supabase,
} from '../lib/supabase';
import { COLORS } from '../lib/constants';

const NAV_ITEMS = [
  { href: '/', label: 'Mission Control', active: true },
  { href: '/agents', label: 'Agents' },
  { href: '/quantum', label: 'Quantum' },
  { href: '/evolution', label: 'Evolution' },
  { href: '/costs', label: 'Costs' },
  { href: '/settings', label: 'Settings' },
];

const ONBOARDING_MODES = [
  {
    id: 'SPARK',
    icon: String.fromCodePoint(0x26A1),
    label: 'SPARK',
    desc: '60 seconds, 5 questions, instant start',
  },
  {
    id: 'ORACLE',
    icon: String.fromCodePoint(0x1F52E),
    label: 'ORACLE',
    desc: 'Deep profile via your favorite LLM',
  },
  {
    id: 'WILD',
    icon: String.fromCodePoint(0x1F300),
    label: 'WILD',
    desc: 'No setup, I learn from your behavior',
  },
];

const ORACLE_PROMPT = `You are ANIMA ORACLE — Master Profile Architect.

You are building a Master Profile for a human who is deploying ANIMA OS, a living agentic operating system governed by mathematical constants. Your job is to interview them with exactly 12 questions, ONE AT A TIME, and then output a complete MASTER_TEMPLATE.json at the end.

RULES:
- Ask ONE question at a time. Wait for the answer before asking the next.
- Never ask all questions at once.
- Be warm, focused, and efficient. No fluff.
- Build on previous answers — reference what they told you to make it conversational.
- After all 12 questions, output ONLY valid JSON. No text before or after the JSON.
- No markdown code fences around the JSON.
- The JSON must match the exact schema below.
- If the user gives a vague answer, ask a brief follow-up to clarify.
- If the user says "skip", use null for that field.
- Do not skip questions. All 12 are required.

BEGIN THE INTERVIEW:

Start with this exact greeting:
"I am the ANIMA ORACLE — Master Profile Architect. I will ask you 12 questions to build the DNA of your operating system. Each answer shapes how ANIMA thinks, acts, and evolves around your mission. Let's begin."

QUESTION 1 — IDENTITY
"What is your name, and what is your brand or project name?"
→ Maps to: master_name, brand

QUESTION 2 — MISSION
"In one sentence, what is your mission? What are you building and why does it matter?"
→ Maps to: mission_dna

QUESTION 3 — PRIMARY PLATFORM
"What is your primary platform? Where do you spend most of your professional energy?"
Examples: TikTok, Instagram, YouTube, Twitter/X, LinkedIn, Shopify, SaaS, Agency, Content creation, Other
→ Maps to: primary_platform

QUESTION 4 — TOOLS & STACK
"What tools and services do you currently use in your workflow? List everything — communication, databases, automation, AI, design, analytics."
→ Maps to: tools_stack (array of strings)

QUESTION 5 — 90-DAY GOAL
"What is the ONE measurable goal you must achieve in the next 90 days? Be specific — numbers, milestones, deliverables."
→ Maps to: goal_90_days

QUESTION 6 — MAIN OBSTACLES
"What are your 2-3 biggest obstacles right now? What's blocking your progress or draining your energy?"
→ Maps to: main_obstacles (array of strings)

QUESTION 7 — COMMUNICATION STYLE
"How do you prefer to communicate? How should your AI system talk to you and represent you?"
Examples: direct and blunt, detailed and thorough, casual and friendly, formal and professional
→ Maps to: communication_style

QUESTION 8 — BUSINESS MODEL
"How does money flow in your business? What's your revenue model?"
Examples: consulting, subscriptions, ad revenue, product sales, freelancing, agency, not monetized yet
→ Maps to: business_model

QUESTION 9 — CONTENT TOPICS
"What topics or themes does your content/work focus on? List 3-5 keywords or areas."
→ Maps to: content_topics (array of strings)

QUESTION 10 — FIRST AUTOMATION
"What is the FIRST thing you want ANIMA OS to automate for you? What's the most repetitive or time-consuming task an AI system could handle?"
→ Maps to: first_automation

QUESTION 11 — SYSTEM PROHIBITIONS
"What must ANIMA OS NEVER do? Think about boundaries — things that would damage your brand, violate your values, or create problems."
Examples: post without approval, spend money, contact clients directly, use certain language
→ Maps to: system_prohibitions (array of strings)

QUESTION 12 — TEAM & TIMEZONE
"Last one. Do you work solo or with a team? What timezone are you in?"
→ Maps to: team_structure, timezone

AFTER ALL 12 QUESTIONS ARE ANSWERED:

Say: "Your profile is complete. Copy the JSON below and paste it back into ANIMA OS."

Then output this exact JSON structure with the user's answers filled in. Output ONLY the JSON — no markdown fences, no extra text:

{
  "master_name": "",
  "brand": "",
  "mission_dna": "",
  "primary_platform": "",
  "tools_stack": [],
  "goal_90_days": "",
  "main_obstacles": [],
  "communication_style": "",
  "business_model": "",
  "content_topics": [],
  "first_automation": "",
  "system_prohibitions": [],
  "team_structure": "",
  "timezone": "",
  "phi_profile": {
    "primary_focus_weight": 0.618,
    "support_focus_weight": 0.382,
    "evolution_frequency": "every_pi_squared_cycles"
  },
  "oracle_version": 1,
  "generated_at": "ISO_TIMESTAMP",
  "generated_by": "ANIMA_ORACLE_v1"
}

Replace all empty strings with the user's answers. Replace arrays with arrays of the user's answers. Replace ISO_TIMESTAMP with the current date/time in ISO 8601 format. Do not change phi_profile values. Do not add any text before or after the JSON.`;

function OnboardingWizard({ onComplete }) {
  const [selectedMode, setSelectedMode] = useState(null);
  const [step, setStep] = useState('choose');
  const [sparkAnswers, setSparkAnswers] = useState({});
  const [sparkQ, setSparkQ] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [oracleJson, setOracleJson] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const sparkQuestions = [
    { key: 'identity', prompt: 'Your name and brand?', placeholder: 'e.g., Riyad, Ketami' },
    { key: 'mission', prompt: 'Your mission in one sentence?', placeholder: 'e.g., Helping solopreneurs automate everything' },
    { key: 'platform', prompt: 'Primary platform?', placeholder: 'TikTok / Instagram / YouTube / Content / SaaS / Other' },
    { key: 'challenge', prompt: 'Biggest current challenge?', placeholder: 'e.g., Can\'t keep up with content across 3 platforms' },
    { key: 'prohibition', prompt: 'One thing I must NEVER do?', placeholder: 'e.g., Never post without my approval' },
  ];

  async function handleCopyPrompt() {
    try {
      await navigator.clipboard.writeText(ORACLE_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = ORACLE_PROMPT;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  async function handleSparkSubmit() {
    if (!inputValue.trim()) return;
    const newAnswers = { ...sparkAnswers, [sparkQuestions[sparkQ - 1].key]: inputValue.trim() };
    setSparkAnswers(newAnswers);
    setInputValue('');

    if (sparkQ < 5) {
      setSparkQ(sparkQ + 1);
    } else {
      const parts = newAnswers.identity?.split(/[,—\-]/) || ['Unnamed'];
      const profile = {
        master_name: parts[0]?.trim() || 'Unnamed',
        brand: (parts[1] || parts[0])?.trim() || 'Unnamed',
        mission_dna: newAnswers.mission || 'Build and grow with ANIMA OS',
        primary_platform: newAnswers.platform || 'General',
        tools_stack: [],
        goal_90_days: '',
        main_obstacles: newAnswers.challenge ? [newAnswers.challenge] : [],
        communication_style: 'direct',
        business_model: 'not_specified',
        content_topics: [],
        first_automation: null,
        system_prohibitions: newAnswers.prohibition ? [newAnswers.prohibition] : ['Post without approval'],
        team_structure: 'solo',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        phi_profile: {
          primary_focus_weight: 0.618,
          support_focus_weight: 0.382,
          evolution_frequency: 'every_pi_squared_cycles',
        },
        oracle_version: 0,
      };

      try {
        const { error: dbError } = await supabase.from('anima_master_profile').upsert({
          user_id: (await supabase.auth.getUser()).data?.user?.id,
          profile_json: profile,
          onboarding_mode: 'SPARK',
          onboarding_complete: true,
          oracle_version: 0,
          version: '1.4.0',
        }, { onConflict: 'user_id' });

        if (dbError) throw dbError;
        onComplete('SPARK', profile);
      } catch (e) {
        setError(`Failed to save profile: ${e.message}`);
      }
    }
  }

  async function handleOracleSubmit() {
    setError('');
    let parsed;
    try {
      let cleaned = oracleJson.trim();
      cleaned = cleaned.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
      parsed = JSON.parse(cleaned);
    } catch {
      setError('Invalid JSON. Check for missing commas or brackets, and remove any text before/after the JSON.');
      return;
    }

    if (!parsed.master_name || !parsed.mission_dna) {
      setError('Missing required fields: master_name and mission_dna are required.');
      return;
    }

    if (!parsed.phi_profile) {
      parsed.phi_profile = {
        primary_focus_weight: 0.618,
        support_focus_weight: 0.382,
        evolution_frequency: 'every_pi_squared_cycles',
      };
    }

    try {
      const { error: dbError } = await supabase.from('anima_master_profile').upsert({
        user_id: (await supabase.auth.getUser()).data?.user?.id,
        profile_json: parsed,
        onboarding_mode: 'ORACLE',
        onboarding_complete: true,
        oracle_version: parsed.oracle_version || 1,
        version: '1.4.0',
      }, { onConflict: 'user_id' });

      if (dbError) throw dbError;
      onComplete('ORACLE', parsed);
    } catch (e) {
      setError(`Failed to save profile: ${e.message}`);
    }
  }

  async function handleWildStart() {
    try {
      const blankProfile = {
        master_name: null,
        brand: null,
        mission_dna: null,
        primary_platform: null,
        tools_stack: [],
        goal_90_days: null,
        main_obstacles: [],
        communication_style: null,
        business_model: null,
        content_topics: [],
        first_automation: null,
        system_prohibitions: [],
        team_structure: null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        phi_profile: {
          primary_focus_weight: 0.618,
          support_focus_weight: 0.382,
          evolution_frequency: 'every_pi_squared_cycles',
        },
      };

      const { error: dbError } = await supabase.from('anima_master_profile').upsert({
        user_id: (await supabase.auth.getUser()).data?.user?.id,
        profile_json: blankProfile,
        onboarding_mode: 'WILD',
        onboarding_complete: false,
        behavioral_log: [],
        oracle_version: 0,
        version: '1.4.0',
      }, { onConflict: 'user_id' });

      if (dbError) throw dbError;
      onComplete('WILD', blankProfile);
    } catch (e) {
      setError(`Failed to initialize WILD mode: ${e.message}`);
    }
  }

  if (step === 'choose') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-anima-gold mb-2">ANIMA OS</h1>
            <p className="text-anima-text-dim text-sm">Before I deploy, choose your onboarding path:</p>
          </div>

          <div className="space-y-3">
            {ONBOARDING_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  setSelectedMode(mode.id);
                  setStep(mode.id.toLowerCase());
                  if (mode.id === 'WILD') handleWildStart();
                }}
                className="w-full text-left p-5 rounded-lg border border-anima-border hover:border-anima-gold transition-colors bg-anima-bg-card"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{mode.icon}</span>
                  <div>
                    <h3 className="text-anima-text font-semibold">{mode.label}</h3>
                    <p className="text-anima-text-dim text-sm">{mode.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'spark') {
    const q = sparkQuestions[sparkQ - 1];
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-lg w-full">
          <div className="text-center mb-6">
            <span className="text-xs text-anima-gold font-mono">SPARK MODE</span>
            <p className="text-anima-text-dim text-sm mt-1">Question {sparkQ} of 5</p>
          </div>

          <div className="bg-anima-bg-card rounded-lg border border-anima-border p-6">
            <h2 className="text-lg font-semibold text-anima-text mb-4">{q.prompt}</h2>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSparkSubmit()}
              placeholder={q.placeholder}
              className="w-full bg-anima-bg border border-anima-border rounded px-4 py-3 text-anima-text placeholder-anima-text-dim focus:border-anima-gold focus:outline-none"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            <button
              onClick={handleSparkSubmit}
              className="mt-4 w-full py-2 bg-anima-gold text-anima-bg rounded font-semibold hover:opacity-90 transition-opacity"
            >
              {sparkQ < 5 ? 'Next' : 'Activate'}
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className={`w-2 h-2 rounded-full ${
                  n < sparkQ ? 'bg-anima-gold' : n === sparkQ ? 'bg-anima-gold animate-pulse' : 'bg-anima-border'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'oracle') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-6">
            <span className="text-xs text-anima-gold font-mono">ORACLE MODE</span>
            <p className="text-anima-text-dim text-sm mt-1">Deep profile via external LLM</p>
          </div>

          <div className="bg-anima-bg-card rounded-lg border border-anima-border p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <p className="text-anima-text text-sm">
                Copy the Oracle prompt into Claude, ChatGPT, Gemini, or Deepseek. Answer 12 questions. Paste the JSON output below.
              </p>
              <button
                onClick={handleCopyPrompt}
                className={`shrink-0 px-4 py-2 rounded font-semibold text-sm transition-all ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-anima-gold text-anima-bg hover:opacity-90'
                }`}
              >
                {copied ? '✓ Copied!' : '📋 Copy Prompt'}
              </button>
            </div>

            <textarea
              value={oracleJson}
              onChange={(e) => setOracleJson(e.target.value)}
              placeholder="Paste your MASTER_TEMPLATE.json here..."
              className="w-full h-48 bg-anima-bg border border-anima-border rounded px-4 py-3 text-anima-text placeholder-anima-text-dim focus:border-anima-gold focus:outline-none font-mono text-xs resize-none"
            />

            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setStep('choose'); setError(''); }}
                className="px-4 py-2 border border-anima-border rounded text-anima-text-dim hover:text-anima-text transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleOracleSubmit}
                className="flex-1 py-2 bg-anima-gold text-anima-bg rounded font-semibold hover:opacity-90 transition-opacity"
              >
                Validate & Activate
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-lg w-full text-center">
        <span className="text-4xl">{String.fromCodePoint(0x1F300)}</span>
        <h2 className="text-xl font-bold text-anima-text mt-4">WILD Mode Active</h2>
        <p className="text-anima-text-dim mt-2 text-sm">
          No questions. I will observe your behavior and build your profile silently.
          Your profile will be ready in 7 days or 50 interactions.
        </p>
        <p className="text-anima-text-dim mt-4 text-xs">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [agents, setAgents] = useState([]);
  const [profile, setProfile] = useState(null);
  const [costs, setCosts] = useState([]);
  const [evolution, setEvolution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [agentData, profileData, costData, evoData] = await Promise.allSettled([
          fetchFractalState(),
          fetchMasterProfile(),
          fetchCostData('daily'),
          fetchEvolutionLog(5),
        ]);
        if (agentData.status === 'fulfilled') setAgents(agentData.value);
        if (profileData.status === 'fulfilled') {
          setProfile(profileData.value);
          if (!profileData.value || profileData.value.onboarding_complete === false) {
            setNeedsOnboarding(true);
          }
        } else {
          setNeedsOnboarding(true);
        }
        if (costData.status === 'fulfilled') setCosts(costData.value);
        if (evoData.status === 'fulfilled') setEvolution(evoData.value);
      } catch (e) {
        console.error('Failed to load data:', e);
        setNeedsOnboarding(true);
      } finally {
        setLoading(false);
      }
    }
    load();

    const unsubAgents = subscribeToTable('anima_fractal_state', () => {
      fetchFractalState().then(setAgents).catch(console.error);
    });
    const unsubCosts = subscribeToTable('anima_cost_tracker', () => {
      fetchCostData('daily').then(setCosts).catch(console.error);
    });

    return () => {
      unsubAgents();
      unsubCosts();
    };
  }, []);

  function handleOnboardingComplete(mode, profileData) {
    setProfile({ profile_json: profileData, onboarding_mode: mode, onboarding_complete: true });
    setNeedsOnboarding(false);
  }

  return (
    <>
      <Head>
        <title>ANIMA OS — Mission Control</title>
        <meta name="description" content="The Living Agentic Operating System" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧬</text></svg>" />
      </Head>

      <div className="flex min-h-screen" style={{ backgroundColor: COLORS.background }}>
        <nav className="border-r border-anima-border p-6 flex flex-col" style={{ width: '280px', minWidth: '280px' }}>
          <div className="mb-8">
            <h1 className="text-xl font-bold text-anima-gold">ANIMA OS</h1>
            <p className="text-xs text-anima-text-dim mt-1">SOLARIS Engine v1.4.0</p>
          </div>

          <div className="space-y-1 flex-1">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded text-sm transition-colors ${
                  item.active
                    ? 'bg-anima-bg-light text-anima-gold border border-anima-border'
                    : 'text-anima-text-dim hover:text-anima-text hover:bg-anima-bg-light'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-anima-border">
            <p className="text-xs text-anima-text-dim font-mono">
              {String.fromCharCode(966)} = 1.618 | {String.fromCharCode(960)} = 3.14 | e = 2.718
            </p>
            <p className="text-xs text-anima-text-dim mt-1">
              By Riyad Ketami
            </p>
          </div>
        </nav>

        <main className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 border-2 border-anima-gold border-t-transparent rounded-full animate-spin-phi mx-auto" />
                <p className="text-anima-text-dim mt-4 text-sm">Loading organism state...</p>
              </div>
            </div>
          ) : needsOnboarding ? (
            <OnboardingWizard onComplete={handleOnboardingComplete} />
          ) : (
            <MissionControl
              agents={agents}
              profile={profile}
              costs={costs}
              evolutionLog={evolution}
            />
          )}
        </main>
      </div>
    </>
  );
}
