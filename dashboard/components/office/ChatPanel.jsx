import { useState, useRef, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════
// CHAT PANEL — Real end-to-end architecture
//
// Flow:
//   1. User sends message
//   2. POST /api/chat → task queued in Supabase (QUEUED)
//   3. Poll GET /api/chat?taskId=xxx every 1.5s
//   4. VPS (KimiClaw on Alibaba) claims task, calls Kimi LLM, writes reply
//   5. Dashboard shows real reply from ROOT_ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════

const POLL_INTERVAL_MS = 1500;   // ~π/2 seconds
const POLL_TIMEOUT_MS  = 45000;  // 45s max wait

export default function ChatPanel() {
  const [messages, setMessages] = useState([
    {
      role: 'anima',
      text: 'ANIMA OS online. Routing through ROOT_ORCHESTRATOR on Alibaba VPS via KimiClaw.',
      ts: Date.now(),
      agent: 'ROOT_ORCHESTRATOR',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingTaskId, setPendingTaskId] = useState(null);
  const [waitSeconds, setWaitSeconds] = useState(0);
  const scrollRef    = useRef(null);
  const pollRef      = useRef(null);
  const timerRef     = useRef(null);
  const startTimeRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Cleanup intervals on unmount
  useEffect(() => () => {
    clearInterval(pollRef.current);
    clearInterval(timerRef.current);
  }, []);

  // ── STOP POLLING ─────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    clearInterval(pollRef.current);
    clearInterval(timerRef.current);
    setPendingTaskId(null);
    setWaitSeconds(0);
  }, []);

  // ── START POLLING ─────────────────────────────────────────────────
  const startPolling = useCallback((taskId) => {
    setPendingTaskId(taskId);
    startTimeRef.current = Date.now();
    setWaitSeconds(0);

    // Seconds counter for UX
    timerRef.current = setInterval(() => {
      setWaitSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    // Poll every 1.5s
    pollRef.current = setInterval(async () => {
      const elapsed = Date.now() - startTimeRef.current;
      try {
        const res  = await fetch(`/api/chat?taskId=${taskId}`);
        const data = await res.json();

        if (data.status === 'DONE' && data.reply) {
          stopPolling();
          setMessages(prev => [...prev, {
            role: 'anima',
            text: data.reply,
            ts: Date.now(),
            agent: data.agent || 'ROOT_ORCHESTRATOR',
            model: data.model,
          }]);
          setLoading(false);
          return;
        }

        if (data.status === 'FAILED') {
          stopPolling();
          setMessages(prev => [...prev, {
            role: 'error',
            text: data.reply || 'Task failed on VPS.',
            ts: Date.now(),
          }]);
          setLoading(false);
          return;
        }

        // Timeout
        if (elapsed > POLL_TIMEOUT_MS) {
          stopPolling();
          setMessages(prev => [...prev, {
            role: 'error',
            text: `VPS runtime did not reply after ${Math.floor(elapsed / 1000)}s.\n\nMake sure the execution engine is running on Alibaba VPS:\n  cd ~/AnimaClaw && node runtime/cli.js run\n\nTask ${taskId.slice(0, 8)} is queued — VPS will process it when online.`,
            ts: Date.now(),
          }]);
          setLoading(false);
        }
      } catch (err) {
        console.warn('[ChatPanel] Poll error:', err.message);
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  // ── SEND ─────────────────────────────────────────────────────────
  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text, ts: Date.now() }]);
    setLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Chat failed');

      if (data.status === 'QUEUED' && data.taskId) {
        // Primary path: poll for VPS reply
        startPolling(data.taskId);
      } else if (data.reply) {
        // Fallback: immediate reply
        setMessages(prev => [...prev, {
          role: 'anima',
          text: data.reply,
          ts: Date.now(),
          agent: data.agent || 'ROOT_ORCHESTRATOR',
          model: data.model,
        }]);
        setLoading(false);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'error',
        text: `Error: ${err.message}`,
        ts: Date.now(),
      }]);
      setLoading(false);
    }
  }

  // ── RENDER ────────────────────────────────────────────────────────
  return (
    <div className="bg-anima-bg-card rounded-lg border border-anima-border flex flex-col h-full">

      {/* Header */}
      <div className="px-3 py-2 border-b border-anima-border flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full transition-colors ${
          loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'
        }`} />
        <span className="text-xs font-semibold text-anima-text">Chat with ANIMA</span>
        <span className="text-[10px] text-anima-text-secondary ml-auto">
          ROOT_ORCHESTRATOR · KimiClaw VPS
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[150px] max-h-[300px]"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-1.5 rounded-lg text-xs ${
              msg.role === 'user'
                ? 'bg-anima-gold/20 text-anima-gold'
                : msg.role === 'error'
                ? 'bg-red-900/20 text-red-400'
                : 'bg-white/5 text-anima-text'
            }`}>
              {msg.role === 'anima' && (
                <span className="text-[9px] text-anima-text-secondary block mb-0.5">
                  {msg.agent || 'ANIMA'}{msg.model ? ` · ${msg.model}` : ''}
                </span>
              )}
              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}

        {/* Thinking / polling indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 px-3 py-2 rounded-lg text-xs space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 150, 300].map(delay => (
                    <span
                      key={delay}
                      className="w-1.5 h-1.5 bg-anima-gold rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-anima-text-secondary">
                  {waitSeconds < 2
                    ? 'Routing to ROOT_ORCHESTRATOR…'
                    : waitSeconds < 8
                    ? `KimiClaw processing… (${waitSeconds}s)`
                    : `Waiting for Alibaba VPS… (${waitSeconds}s)`
                  }
                </span>
              </div>
              {pendingTaskId && (
                <div className="text-[9px] text-anima-text-secondary/40 font-mono">
                  task {pendingTaskId.slice(0, 8)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-2 border-t border-anima-border flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={loading ? 'Waiting for ANIMA…' : 'Talk to ANIMA…'}
          disabled={loading}
          className="flex-1 bg-anima-bg border border-anima-border rounded px-3 py-1.5 text-xs text-anima-text placeholder:text-anima-text-secondary/40 focus:outline-none focus:border-anima-gold/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-3 py-1.5 bg-anima-gold/20 text-anima-gold text-xs rounded border border-anima-gold/30 hover:bg-anima-gold/30 disabled:opacity-30 transition-colors"
        >
          {loading ? '…' : 'Send'}
        </button>
      </form>
    </div>
  );
}
