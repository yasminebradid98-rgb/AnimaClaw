import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PHI, PI, E, COLORS } from '../lib/constants';

/**
 * ANIMA OS Logo — Golden Spiral / φ Geometry
 * SVG based on the golden ratio spiral.
 */
function AnimaLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer golden circle */}
      <circle cx="50" cy="50" r="45" stroke={COLORS.gold} strokeWidth="1.5" opacity="0.3" />
      {/* φ spiral approximation */}
      <path
        d="M 50 5 A 45 45 0 0 1 95 50 A 27.8 27.8 0 0 1 67.2 77.8 A 17.2 17.2 0 0 1 50 60.6 A 10.6 10.6 0 0 1 60.6 50 A 6.6 6.6 0 0 1 54 56.6 A 4 4 0 0 1 50 52.6"
        stroke={COLORS.gold}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Center dot */}
      <circle cx="50" cy="50" r="3" fill={COLORS.gold} />
      {/* Inner grid lines (φ ratio) */}
      <line x1="50" y1="5" x2="50" y2="95" stroke={COLORS.gold} strokeWidth="0.3" opacity="0.15" />
      <line x1="5" y1="50" x2="95" y2="50" stroke={COLORS.gold} strokeWidth="0.3" opacity="0.15" />
      {/* φ point markers */}
      <circle cx="50" cy="19.1" r="1.5" fill={COLORS.gold} opacity="0.5" />
      <circle cx="80.9" cy="50" r="1.5" fill={COLORS.gold} opacity="0.5" />
    </svg>
  );
}

/**
 * Supabase connection status indicator.
 */
function ConnectionIndicator() {
  const [status, setStatus] = useState('checking'); // checking | connected | offline

  useEffect(() => {
    async function check() {
      try {
        const { error } = await supabase.from('anima_fractal_state').select('id').limit(1);
        setStatus(error ? 'offline' : 'connected');
      } catch {
        setStatus('offline');
      }
    }
    check();

    // Re-check every π × 10 seconds
    const interval = setInterval(check, Math.round(PI * 10000));
    return () => clearInterval(interval);
  }, []);

  const colors = {
    checking: COLORS.gold,
    connected: COLORS.green,
    offline: COLORS.red,
  };

  const labels = {
    checking: 'Checking...',
    connected: 'Supabase Live',
    offline: 'Offline',
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className={`w-2 h-2 rounded-full ${status === 'connected' ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: colors[status] }}
      />
      <span className="font-mono" style={{ color: colors[status] }}>
        {labels[status]}
      </span>
    </div>
  );
}

/**
 * Dark / Light theme toggle.
 */
function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('anima-theme');
    if (saved === 'light') {
      setDark(false);
      document.documentElement.classList.add('light-theme');
    }
  }, []);

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.remove('light-theme');
        localStorage.setItem('anima-theme', 'dark');
      } else {
        document.documentElement.classList.add('light-theme');
        localStorage.setItem('anima-theme', 'light');
      }
      return next;
    });
  }, []);

  return (
    <button
      onClick={toggle}
      className="text-xs font-mono px-2 py-1 rounded border border-anima-border hover:border-anima-gold transition-colors"
      style={{ color: COLORS.textDim }}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? String.fromCodePoint(0x263E) : String.fromCodePoint(0x2600)} {dark ? 'Dark' : 'Light'}
    </button>
  );
}

/**
 * Vitality formula display.
 */
function VitalityFormula() {
  return (
    <div className="text-[10px] font-mono text-anima-text-dim leading-relaxed">
      <span className="text-anima-gold">vitality</span> = (
      <span className="text-anima-gold">{String.fromCharCode(966)}</span>
      <sup>depth</sup> {String.fromCharCode(215)}{' '}
      <span className="text-anima-gold">e</span>
      <sup>alignment</sup>) {String.fromCharCode(247)} (
      <span className="text-anima-gold">{String.fromCharCode(960)}</span>
      <sup>cycle_age</sup>) {String.fromCharCode(215)} fractal_score
    </div>
  );
}

/**
 * Export GENESIS state as JSON.
 */
function ExportButton() {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const [{ data: agents }, { data: profile }, { data: evolution }] = await Promise.all([
        supabase.from('anima_fractal_state').select('*'),
        supabase.from('anima_master_profile').select('*').limit(1),
        supabase.from('anima_evolution_log').select('*').order('cycle_number', { ascending: false }).limit(10),
      ]);

      const state = {
        export_version: '1.5.0',
        engine: 'SOLARIS',
        exported_at: new Date().toISOString(),
        constants: { phi: PHI, pi: PI, e: E },
        agents: agents || [],
        profile: profile?.[0] || null,
        recent_evolution: evolution || [],
      };

      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anima_genesis_state_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="text-xs font-mono px-2 py-1 rounded border border-anima-border hover:border-anima-gold transition-colors disabled:opacity-50"
      style={{ color: COLORS.textDim }}
    >
      {exporting ? 'Exporting...' : `${String.fromCodePoint(0x2B07)} Export State`}
    </button>
  );
}

/**
 * Combined system status bar for the sidebar.
 */
export default function SystemStatus() {
  return (
    <div className="space-y-3">
      <ConnectionIndicator />
      <VitalityFormula />
      <div className="flex gap-2">
        <ThemeToggle />
        <ExportButton />
      </div>
    </div>
  );
}

export { AnimaLogo, ConnectionIndicator, ThemeToggle, VitalityFormula, ExportButton };
