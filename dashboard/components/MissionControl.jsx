import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import VitalityGauge from './VitalityGauge';
import PiPulse from './PiPulse';
import AgentCard from './AgentCard';
import CostTracker from './CostTracker';
import MasterProfile from './MasterProfile';
import { CORE_AGENTS } from '../lib/constants';
import { calculateSystemVitality, determineSystemState } from '../lib/vitality';

export default function MissionControl({ agents, profile, costs, evolutionLog }) {
  const agentData = agents && agents.length > 0
    ? agents
    : CORE_AGENTS.map(a => ({
        ...a,
        vitality_score: 0,
        status: 'DORMANT',
        mission_alignment: 0,
        last_heartbeat: null,
      }));

  const systemVitality = calculateSystemVitality(agentData);
  const systemState = determineSystemState(agentData);
  const lastEvolution = evolutionLog && evolutionLog.length > 0 ? evolutionLog[0] : null;
  const todayCost = costs
    ? costs.reduce((sum, c) => sum + parseFloat(c.cost_usd || 0), 0)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-anima-text">Mission Control</h1>
          <p className="text-anima-text-dim text-sm mt-1">
            ANIMA OS v1.0.0 — SOLARIS Engine
          </p>
        </div>
        <PiPulse state={systemState} />
      </div>

      {/* Top row: Profile + Vitality */}
      <div className="flex gap-6" style={{ flexDirection: 'row' }}>
        <div style={{ width: '61.8%' }}>
          <MasterProfile profile={profile} />
        </div>
        <div style={{ width: '38.2%' }}>
          <VitalityGauge score={systemVitality} state={systemState} />
        </div>
      </div>

      {/* Agent Grid */}
      <div>
        <h2 className="text-lg font-semibold text-anima-text mb-3">Active Agents</h2>
        <div className="grid grid-cols-3 gap-4">
          {agentData.map((agent, i) => (
            <motion.div
              key={agent.name || agent.branch_id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <AgentCard agent={agent} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom row: Cost + Evolution */}
      <div className="flex gap-6">
        <div style={{ width: '61.8%' }}>
          <div className="bg-anima-bg-card rounded-lg border border-anima-border p-4">
            <h3 className="text-sm font-semibold text-anima-text-dim mb-2">Daily Cost</h3>
            <p className="text-2xl font-mono text-anima-gold">
              ${todayCost.toFixed(4)}
            </p>
          </div>
        </div>
        <div style={{ width: '38.2%' }}>
          <div className="bg-anima-bg-card rounded-lg border border-anima-border p-4">
            <h3 className="text-sm font-semibold text-anima-text-dim mb-2">Last Evolution</h3>
            {lastEvolution ? (
              <div>
                <p className="text-sm text-anima-text font-mono">
                  Cycle #{lastEvolution.cycle_number}
                </p>
                <p className="text-xs text-anima-text-dim mt-1 truncate">
                  {lastEvolution.mutation_description || 'No mutations'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-anima-text-dim">No evolution events yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
