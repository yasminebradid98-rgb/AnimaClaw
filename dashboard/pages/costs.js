import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import CostTracker from '../components/CostTracker';
import { fetchCostData, subscribeToTable } from '../lib/supabase';
import { COLORS } from '../lib/constants';

const NAV_ITEMS = [
  { href: '/', label: 'Mission Control' },
  { href: '/agents', label: 'Agents' },
  { href: '/evolution', label: 'Evolution' },
  { href: '/costs', label: 'Costs', active: true },
];

export default function CostsPage() {
  const [costs, setCosts] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchCostData(period);
        setCosts(data);
      } catch (e) {
        console.error('Failed to load cost data:', e);
      } finally {
        setLoading(false);
      }
    }
    load();

    const unsub = subscribeToTable('anima_cost_tracker', () => {
      fetchCostData(period).then(setCosts).catch(console.error);
    });
    return unsub;
  }, [period]);

  return (
    <>
      <Head>
        <title>ANIMA OS — Cost Analytics</title>
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
            <div className="animate-fade-in">
              <CostTracker costs={costs} period={period} />
            </div>
          )}
        </main>
      </div>
    </>
  );
}
