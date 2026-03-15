import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import QuantumState from '../components/QuantumState';
import { fetchFractalState, subscribeToTable } from '../lib/supabase';

export default function QuantumPage() {
  const [agents, setAgents] = useState([]);
  const [systemState, setSystemState] = useState('DORMANT');

  useEffect(() => {
    async function load() {
      const data = await fetchFractalState();
      if (data) setAgents(data);
      const alive = data?.filter(a => a.status !== 'PRUNED') || [];
      if (alive.length > 0) setSystemState('ALIVE');
    }
    load();

    const unsub = subscribeToTable('anima_fractal_state', (payload) => {
      setAgents(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(a => a.branch_id === payload.new.branch_id);
        if (idx >= 0) updated[idx] = payload.new;
        else updated.push(payload.new);
        return updated;
      });
    });

    return () => unsub?.();
  }, []);

  const globalBest = Math.max(0, ...agents.map(a => a.global_best || 0));
  const qrlCycle = Math.max(0, ...agents.map(a => a.qrl_cycle || 0));

  const quantumData = {
    qrl_cycle: qrlCycle,
    superpositions: [],
  };

  return (
    <Layout systemState={systemState}>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-anima-text">Quantum Intelligence Layer</h1>
          <p className="text-sm text-anima-text-secondary mt-1">
            Laws 6&ndash;12 &mdash; Superposition, Entanglement, Interference, Tunneling, Decoherence, QAOA, QRL
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Global Best', value: globalBest.toFixed(3), color: '#4cc97b' },
            { label: 'QRL Cycle', value: `#${qrlCycle}`, color: '#c9a84c' },
            { label: 'Entangled Pairs', value: '3', color: '#9b59b6' },
            { label: 'Decoherence \u03c6\u00d7\u03c0', value: `${(1.618 * 3.14159).toFixed(2)}s`, color: '#4c7bc9' },
            { label: 'Fibonacci N', value: `[${[1,1,2,3,5,8,13].join(',')}]`, color: '#8a8780' },
          ].map(stat => (
            <div key={stat.label} className="p-4 rounded-lg border border-white/5 bg-white/[0.02]">
              <div className="text-[10px] font-mono text-anima-text-secondary uppercase tracking-wider">
                {stat.label}
              </div>
              <div className="text-lg font-mono mt-1" style={{ color: stat.color }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Main Quantum State */}
        <div className="p-6 rounded-lg border border-white/5 bg-white/[0.02]">
          <QuantumState agents={agents} quantumData={quantumData} />
        </div>

        {/* Interference Rules Reference */}
        <div className="grid grid-cols-2 gap-4" style={{ gridTemplateColumns: '61.8% 38.2%' }}>
          <div className="p-5 rounded-lg border border-white/5 bg-white/[0.02]">
            <h3 className="text-sm font-semibold text-anima-text mb-3">Interference Rules (Law 8)</h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-anima-green">
                <span>score &gt; 0.618</span>
                <span>CONSTRUCTIVE: score &times; \u03c6 (max 1.618)</span>
              </div>
              <div className="flex justify-between text-anima-red">
                <span>score &le; 0.618</span>
                <span>DESTRUCTIVE: score &times; 0.382</span>
              </div>
              <div className="h-px bg-white/5 my-2" />
              <div className="flex justify-between text-anima-text-secondary">
                <span>Golden ceiling</span><span>1.618</span>
              </div>
              <div className="flex justify-between text-anima-text-secondary">
                <span>Minimum floor</span><span>0.000382</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-lg border border-white/5 bg-white/[0.02]">
            <h3 className="text-sm font-semibold text-anima-text mb-3">Tunneling Conditions (Law 9)</h3>
            <div className="space-y-2 text-xs font-mono text-anima-text-secondary">
              <div>Stagnation band: [0.618, 0.680]</div>
              <div>Required cycles: \u03c0\u00b2 \u2248 10 consecutive</div>
              <div>Candidate sampling: 3 random from history</div>
              <div>Min alignment: 0.5 for candidates</div>
              <div className="h-px bg-white/5 my-2" />
              <div>Cooldown after tunnel: \u03c6\u2075 \u2248 11 cycles</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
