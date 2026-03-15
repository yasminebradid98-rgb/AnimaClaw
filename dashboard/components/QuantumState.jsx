'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PHI, PI, EULER, FIBONACCI_SEQUENCE } from '../lib/constants';

const QUANTUM_PHASES = ['SUPERPOSING', 'COLLAPSED', 'CLASSICAL'];
const PHASE_COLORS = {
  SUPERPOSING: '#9b59b6',
  COLLAPSED: '#c9a84c',
  CLASSICAL: '#4cc97b',
  FORCE_COLLAPSE: '#c94c4c',
};

const ENTANGLED_PAIRS = [
  { a: 'PRIMARY_CELL', b: 'EVOLUTION_NODE', dimension: 'Execution \u2194 Adaptation' },
  { a: 'MEMORY_NODE', b: 'IMMUNE_AGENT', dimension: 'Storage \u2194 Security' },
  { a: 'ROOT_ORCHESTRATOR', b: 'SUPPORT_CELL', dimension: 'Routing \u2194 Monitoring' },
];

function applyInterference(rawScore) {
  if (rawScore > 0.618) {
    return Math.min(rawScore * PHI, 1.618);
  }
  return rawScore * 0.382;
}

function SuperpositionWave({ strategies, phase }) {
  if (!strategies || strategies.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-anima-text-secondary font-mono uppercase tracking-wider">
          Superposed Strategies (N={strategies.length})
        </span>
        <span className="text-xs font-mono" style={{ color: PHASE_COLORS[phase] || '#8a8780' }}>
          {phase}
        </span>
      </div>
      {strategies.map((s, i) => {
        const interfered = applyInterference(s.score);
        const isWinner = phase === 'COLLAPSED' && i === 0;
        const barWidth = Math.min((interfered / 1.618) * 100, 100);
        const interferenceType = s.score > 0.618 ? 'CONSTRUCTIVE' : 'DESTRUCTIVE';

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{
              opacity: phase === 'COLLAPSED' && !isWinner ? 0.3 : 1,
              x: 0,
            }}
            transition={{ delay: i * 0.1 }}
            className={`relative p-2 rounded border ${
              isWinner
                ? 'border-anima-gold bg-anima-gold/10'
                : 'border-white/5 bg-white/[0.02]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-anima-text truncate max-w-[60%]">
                {s.description || `Strategy ${i + 1}`}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono ${
                  interferenceType === 'CONSTRUCTIVE' ? 'text-anima-green' : 'text-anima-red'
                }`}>
                  {interferenceType === 'CONSTRUCTIVE' ? '+\u03c6' : '\u00d70.382'}
                </span>
                <span className="text-xs font-mono text-anima-gold">
                  {interfered.toFixed(3)}
                </span>
              </div>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  backgroundColor: isWinner ? '#c9a84c' : interferenceType === 'CONSTRUCTIVE' ? '#4cc97b' : '#c94c4c',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${barWidth}%` }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              />
            </div>
            {isWinner && (
              <motion.div
                className="absolute -right-1 -top-1 w-4 h-4 bg-anima-gold rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
              >
                <span className="text-[8px] text-anima-bg font-bold">\u2713</span>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function EntanglementMap({ agents }) {
  return (
    <div className="space-y-3">
      <span className="text-xs text-anima-text-secondary font-mono uppercase tracking-wider">
        Entangled Pairs
      </span>
      {ENTANGLED_PAIRS.map((pair, i) => {
        const agentA = agents?.find(a => a.branch_id === pair.a);
        const agentB = agents?.find(a => a.branch_id === pair.b);
        const signalA = agentA?.entanglement_signal;
        const signalB = agentB?.entanglement_signal;

        return (
          <div key={i} className="flex items-center gap-2 p-2 rounded border border-white/5 bg-white/[0.02]">
            <div className="flex-1 text-right">
              <div className="text-xs font-mono text-anima-text">{pair.a}</div>
              <div className="text-[10px] text-anima-text-secondary">
                pb: {agentA?.personal_best?.toFixed(3) || '0.000'}
              </div>
            </div>

            <div className="flex flex-col items-center gap-1 px-3">
              <div className="flex items-center gap-1">
                {signalA && (
                  <motion.div
                    className="w-2 h-2 rounded-full bg-purple-400"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: PI, repeat: Infinity }}
                  />
                )}
                <div className="w-8 h-px bg-white/20 relative">
                  {(signalA || signalB) && (
                    <motion.div
                      className="absolute inset-0 bg-purple-400"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1.618, repeat: Infinity }}
                    />
                  )}
                </div>
                {signalB && (
                  <motion.div
                    className="w-2 h-2 rounded-full bg-purple-400"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: PI, repeat: Infinity }}
                  />
                )}
              </div>
              <span className="text-[9px] text-anima-text-secondary">{pair.dimension}</span>
            </div>

            <div className="flex-1">
              <div className="text-xs font-mono text-anima-text">{pair.b}</div>
              <div className="text-[10px] text-anima-text-secondary">
                pb: {agentB?.personal_best?.toFixed(3) || '0.000'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DecoherenceCycle({ currentPhase, phaseTimer }) {
  const phases = [
    { name: 'QUANTUM', duration: `${(PHI * PI).toFixed(2)}s`, color: '#9b59b6' },
    { name: 'COLLAPSE', duration: 'instant', color: '#c9a84c' },
    { name: 'CLASSICAL', duration: 'variable', color: '#4cc97b' },
  ];

  const activeIndex = phases.findIndex(
    p => p.name === currentPhase || (currentPhase === 'SUPERPOSING' && p.name === 'QUANTUM')
  );

  return (
    <div className="space-y-3">
      <span className="text-xs text-anima-text-secondary font-mono uppercase tracking-wider">
        Decoherence Cycle
      </span>
      <div className="flex items-center gap-1">
        {phases.map((p, i) => (
          <div key={p.name} className="flex items-center gap-1 flex-1">
            <motion.div
              className="flex-1 h-2 rounded-full relative overflow-hidden"
              style={{
                backgroundColor: i <= activeIndex ? `${p.color}33` : 'rgba(255,255,255,0.05)',
              }}
            >
              {i === activeIndex && (
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ backgroundColor: p.color }}
                  animate={{ width: ['0%', '100%'] }}
                  transition={{
                    duration: p.name === 'QUANTUM' ? PHI * PI : p.name === 'COLLAPSE' ? 0.3 : 2,
                    repeat: i === activeIndex ? Infinity : 0,
                  }}
                />
              )}
              {i < activeIndex && (
                <div className="absolute inset-0 rounded-full" style={{ backgroundColor: p.color }} />
              )}
            </motion.div>
            {i < phases.length - 1 && (
              <svg width="8" height="8" className="flex-shrink-0 opacity-30">
                <path d="M0 4 L8 4 M5 1 L8 4 L5 7" stroke="white" fill="none" strokeWidth="1" />
              </svg>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        {phases.map((p, i) => (
          <span
            key={p.name}
            className="text-[10px] font-mono"
            style={{ color: i === activeIndex ? p.color : '#8a8780' }}
          >
            {p.name} ({p.duration})
          </span>
        ))}
      </div>
    </div>
  );
}

function QRLStatus({ agents, globalBest, qrlCycle }) {
  const sortedAgents = [...(agents || [])].sort(
    (a, b) => (b.personal_best || 0) - (a.personal_best || 0)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-anima-text-secondary font-mono uppercase tracking-wider">
          QRL Learning
        </span>
        <span className="text-[10px] font-mono text-anima-text-secondary">
          Cycle #{qrlCycle || 0} | Global Best: {(globalBest || 0).toFixed(3)}
        </span>
      </div>
      <div className="space-y-1">
        {sortedAgents.map(agent => {
          const pb = agent.personal_best || 0;
          const gap = (globalBest || 0) - pb;
          const needsShift = gap > 0.382;
          const barWidth = Math.min((pb / 1.618) * 100, 100);

          return (
            <div key={agent.branch_id} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-anima-text-secondary w-28 truncate">
                {agent.branch_id}
              </span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: needsShift ? '#c94c4c' : pb > 0.618 ? '#4cc97b' : '#c9a84c',
                  }}
                />
              </div>
              <span className="text-[10px] font-mono w-12 text-right" style={{
                color: needsShift ? '#c94c4c' : '#8a8780'
              }}>
                {pb.toFixed(3)}
              </span>
              {needsShift && (
                <span className="text-[9px] text-anima-red font-mono">SHIFT</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 text-[10px] text-anima-text-secondary">
        <span>Next QRL: {Math.ceil(PI * PI)} cycles</span>
        <span>Shift rate: 38.2%</span>
        <span>Euler amp: e^(pb \u00d7 cycle/\u03c0\u00b2)</span>
      </div>
    </div>
  );
}

function TunnelingIndicator({ agent }) {
  if (!agent?.tunneling_active) return null;

  return (
    <motion.div
      className="flex items-center gap-2 p-2 rounded border border-purple-500/30 bg-purple-500/5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="w-3 h-3 rounded-full bg-purple-500"
        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
        transition={{ duration: PI, repeat: Infinity }}
      />
      <div>
        <span className="text-xs text-purple-300 font-mono">TUNNELING</span>
        <span className="text-[10px] text-anima-text-secondary ml-2">
          {agent.branch_id} escaping local optimum ({agent.vitality_score?.toFixed(3)})
        </span>
      </div>
    </motion.div>
  );
}

export default function QuantumState({ agents, quantumData }) {
  const [currentPhase, setCurrentPhase] = useState('SUPERPOSING');
  const [phaseTimer, setPhaseTimer] = useState(0);

  const qrlCycle = quantumData?.qrl_cycle || 0;
  const globalBest = Math.max(0, ...(agents || []).map(a => a.global_best || 0));
  const strategies = quantumData?.superpositions || [];
  const tunnelingAgent = (agents || []).find(a => a.tunneling_active);

  useEffect(() => {
    const phaseDuration = {
      SUPERPOSING: PHI * PI * 1000,
      COLLAPSED: 300,
      CLASSICAL: 2000,
    };

    const timer = setInterval(() => {
      setCurrentPhase(prev => {
        const idx = QUANTUM_PHASES.indexOf(prev);
        return QUANTUM_PHASES[(idx + 1) % QUANTUM_PHASES.length];
      });
      setPhaseTimer(0);
    }, phaseDuration[currentPhase]);

    return () => clearInterval(timer);
  }, [currentPhase]);

  useEffect(() => {
    const tick = setInterval(() => setPhaseTimer(t => t + 100), 100);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-anima-text">Quantum State</h2>
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: PHASE_COLORS[currentPhase] }}
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.618, repeat: Infinity }}
          />
          <span className="text-xs font-mono" style={{ color: PHASE_COLORS[currentPhase] }}>
            {currentPhase}
          </span>
        </div>
      </div>

      <DecoherenceCycle currentPhase={currentPhase} phaseTimer={phaseTimer} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ gridTemplateColumns: '61.8% 38.2%' }}>
        <div className="space-y-4">
          <SuperpositionWave strategies={strategies} phase={currentPhase} />
          <QRLStatus agents={agents} globalBest={globalBest} qrlCycle={qrlCycle} />
        </div>
        <div className="space-y-4">
          <EntanglementMap agents={agents} />
          {tunnelingAgent && <TunnelingIndicator agent={tunnelingAgent} />}
        </div>
      </div>
    </div>
  );
}
