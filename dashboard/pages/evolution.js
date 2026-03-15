import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import EvolutionLog from '../components/EvolutionLog';
import AlignmentHistory from '../components/AlignmentHistory';
import { fetchEvolutionLog, fetchAgentLogs, subscribeToTable } from '../lib/supabase';
import { COLORS } from '../lib/constants';

const NAV_ITEMS = [
  { href: '/', label: 'Mission Control' },
  { href: '/agents', label: 'Agents' },
  { href: '/evolution', label: 'Evolution', active: true },
  { href: '/costs', label: 'Costs' },
];

export default function EvolutionPage() {
  const [events, setEvents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [evoData, logData] = await Promise.allSettled([
          fetchEvolutionLog(50),
          fetchAgentLogs({ limit: 200 }),
        ]);
        if (evoData.status === 'fulfilled') setEvents(evoData.value);
        if (logData.status === 'fulfilled') setLogs(logData.value);
      } catch (e) {
        console.error('Failed to load evolution data:', e);
      } finally {
        setLoading(false);
      }
    }
    load();

    const unsub = subscribeToTable('anima_evolution_log', () => {
      fetchEvolutionLog(50).then(setEvents).catch(console.error);
    });
    return unsub;
  }, []);

  const latestEvent = events.length > 0 ? events[0] : null;
  const personalBest = events.length > 0
    ? Math.max(...events.map(e => e.personal_best || 0))
    : 0;
  const globalAlignment = latestEvent ? latestEvent.global_alignment : 0;
  const totalMutations = events.filter(e => e.evolution_triggered).length;

  return (
    <>
      <Head>
        <title>ANIMA OS — Evolution</title>
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
                <h1 className="text-2xl font-bold text-anima-text">Evolution History</h1>
                <p className="text-anima-text-dim text-sm mt-1">
                  {events.length} evolution cycles recorded
                </p>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-anima-bg-card rounded-lg border border-anima-border p-4">
                  <span className="text-xs text-anima-text-dim">Global Alignment</span>
                  <p className="text-xl font-mono text-anima-blue mt-1">
                    {(globalAlignment * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-anima-bg-card rounded-lg border border-anima-border p-4">
                  <span className="text-xs text-anima-text-dim">Personal Best</span>
                  <p className="text-xl font-mono text-anima-gold mt-1">
                    {personalBest.toFixed(3)}
                  </p>
                </div>
                <div className="bg-anima-bg-card rounded-lg border border-anima-border p-4">
                  <span className="text-xs text-anima-text-dim">Total Mutations</span>
                  <p className="text-xl font-mono text-anima-text mt-1">
                    {totalMutations}
                  </p>
                </div>
                <div className="bg-anima-bg-card rounded-lg border border-anima-border p-4">
                  <span className="text-xs text-anima-text-dim">Evolution Cycles</span>
                  <p className="text-xl font-mono text-anima-text mt-1">
                    {events.length}
                  </p>
                </div>
              </div>

              {/* Alignment chart */}
              <AlignmentHistory logs={logs} />

              {/* Evolution timeline */}
              <EvolutionLog events={events} />
            </div>
          )}
        </main>
      </div>
    </>
  );
}
