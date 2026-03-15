import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import FractalTree from '../components/FractalTree';
import AgentCard from '../components/AgentCard';
import { fetchFractalState, fetchAgentLogs, subscribeToTable } from '../lib/supabase';
import { COLORS, CORE_AGENTS } from '../lib/constants';

const NAV_ITEMS = [
  { href: '/', label: 'Mission Control' },
  { href: '/agents', label: 'Agents', active: true },
  { href: '/evolution', label: 'Evolution' },
  { href: '/costs', label: 'Costs' },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [agentData, logData] = await Promise.allSettled([
          fetchFractalState(),
          fetchAgentLogs({ limit: 50 }),
        ]);
        if (agentData.status === 'fulfilled' && agentData.value.length > 0) {
          setAgents(agentData.value);
        } else {
          setAgents(CORE_AGENTS.map(a => ({
            ...a,
            name: a.name,
            branch_id: a.name,
            depth_level: a.depth,
            phi_weight: a.phiWeight,
            vitality_score: 0,
            status: 'DORMANT',
            parent_branch: a.depth === 0 ? null : a.depth === 1 ? 'ROOT_ORCHESTRATOR' : 'SUPPORT_CELL',
          })));
        }
        if (logData.status === 'fulfilled') setLogs(logData.value);
      } catch (e) {
        console.error('Failed to load agents:', e);
      } finally {
        setLoading(false);
      }
    }
    load();

    const unsub = subscribeToTable('anima_fractal_state', () => {
      fetchFractalState().then(data => {
        if (data.length > 0) setAgents(data);
      }).catch(console.error);
    });
    return unsub;
  }, []);

  return (
    <>
      <Head>
        <title>ANIMA OS — Agents</title>
      </Head>

      <div className="flex min-h-screen" style={{ backgroundColor: COLORS.background }}>
        <nav className="border-r border-anima-border p-6 flex flex-col" style={{ width: '280px', minWidth: '280px' }}>
          <div className="mb-8">
            <h1 className="text-xl font-bold text-anima-gold">ANIMA OS</h1>
            <p className="text-xs text-anima-text-dim mt-1">SOLARIS Engine v1.0.0</p>
          </div>
          <div className="space-y-1 flex-1">
            {NAV_ITEMS.map(item => (
              <Link key={item.href} href={item.href}
                className={`block px-3 py-2 rounded text-sm transition-colors ${
                  item.active
                    ? 'bg-anima-bg-light text-anima-gold border border-anima-border'
                    : 'text-anima-text-dim hover:text-anima-text hover:bg-anima-bg-light'
                }`}>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-auto pt-4 border-t border-anima-border">
            <p className="text-xs text-anima-text-dim font-mono">
              {String.fromCharCode(966)} = 1.618 | {String.fromCharCode(960)} = 3.14
            </p>
          </div>
        </nav>

        <main className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-2 border-anima-gold border-t-transparent rounded-full animate-spin-phi" />
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h1 className="text-2xl font-bold text-anima-text">Agent Management</h1>
                <p className="text-anima-text-dim text-sm mt-1">
                  {agents.length} agents registered | Max fractal depth: 5
                </p>
              </div>

              {/* Fractal tree */}
              <FractalTree agents={agents} />

              {/* Agent grid */}
              <div>
                <h2 className="text-lg font-semibold text-anima-text mb-3">All Agents</h2>
                <div className="grid grid-cols-3 gap-4">
                  {agents.map((agent, i) => (
                    <AgentCard key={agent.branch_id || agent.name || i} agent={agent} />
                  ))}
                </div>
              </div>

              {/* Recent logs */}
              {logs.length > 0 && (
                <div className="bg-anima-bg-card rounded-lg border border-anima-border p-4">
                  <h3 className="text-sm font-semibold text-anima-text-dim mb-3">Recent Agent Activity</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {logs.slice(0, 20).map((log, i) => (
                      <div key={log.id || i} className="flex items-center gap-3 text-xs py-1 border-b border-anima-border last:border-0">
                        <span className="font-mono text-anima-gold w-32 truncate">{log.agent_name}</span>
                        <span className="text-anima-text flex-1 truncate">{log.task_description}</span>
                        <span className="font-mono text-anima-text-dim">
                          {((log.mission_alignment || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
