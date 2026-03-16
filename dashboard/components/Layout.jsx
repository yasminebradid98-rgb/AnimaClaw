import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import PiPulse from './PiPulse';
import SystemStatus, { AnimaLogo } from './SystemStatus';

const NAV_ITEMS = [
  { href: '/', label: 'Mission Control', icon: '\u2318' },
  { href: '/agents', label: 'Agents', icon: '\u25c7' },
  { href: '/quantum', label: 'Quantum', icon: '\u03c8' },
  { href: '/evolution', label: 'Evolution', icon: '\u21bb' },
  { href: '/costs', label: 'Costs', icon: '\u03a3' },
  { href: '/settings', label: 'Settings', icon: '\u2699' },
];

export default function Layout({ children, systemState, vitalityScore }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-anima-bg flex">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded bg-anima-bg-card border border-anima-border text-anima-gold"
      >
        {sidebarOpen ? '\u2715' : '\u2630'}
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — 38.2% on desktop, overlay on mobile */}
      <aside className={`
        fixed md:static z-40
        w-[280px] min-h-screen
        border-r border-white/5 bg-anima-bg/95 backdrop-blur-sm
        flex flex-col
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <AnimaLogo size={36} />
            <div>
              <h1 className="text-xl font-bold text-anima-gold tracking-wide">ANIMA OS</h1>
              <p className="text-[10px] font-mono text-anima-text-secondary">SOLARIS v1.5.0</p>
            </div>
          </div>
        </div>

        {/* Pulse */}
        <div className="px-6 py-4 border-b border-white/5">
          <PiPulse state={systemState || 'DORMANT'} vitality={vitalityScore || 0} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          {NAV_ITEMS.map(item => {
            const isActive = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'text-anima-gold bg-anima-gold/5 border-r-2 border-anima-gold'
                    : 'text-anima-text-secondary hover:text-anima-text hover:bg-white/[0.02]'
                }`}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* System Status */}
        <div className="px-6 py-4 border-t border-white/5">
          <SystemStatus />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 text-[10px] font-mono text-anima-text-secondary">
          <div>{String.fromCharCode(966)}=1.618 {String.fromCharCode(960)}=3.14159 e=2.71828</div>
          <div className="mt-1">Riyad Ketami &mdash; riyad@ketami.net</div>
        </div>
      </aside>

      {/* Main Content — 61.8% */}
      <main className="flex-1 overflow-auto md:ml-0">
        {children}
      </main>
    </div>
  );
}
