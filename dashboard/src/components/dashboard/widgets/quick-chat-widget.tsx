'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useMissionControl, type ChatAttachment } from '@/store'
import { useNavigateToPanel } from '@/lib/navigation'
import { ChatInput } from '@/components/chat/chat-input'
import type { DashboardData } from '../widget-primitives'

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuickMessage {
  id: number
  from: 'human' | string
  content: string
  ts: number
  attachments?: ChatAttachment[]
  status?: 'sending' | 'sent' | 'failed'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ─── Message row ─────────────────────────────────────────────────────────────

function QuickMessageRow({ msg }: { msg: QuickMessage }) {
  const isHuman = msg.from === 'human'
  return (
    <div className={`flex gap-2 ${isHuman ? 'flex-row-reverse' : 'flex-row'} items-end`}>
      {/* Avatar */}
      <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold
        ${isHuman ? 'bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/25' : 'bg-surface-2 text-muted-foreground border border-border/50'}`}>
        {isHuman ? 'Y' : msg.from.charAt(0).toUpperCase()}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] flex flex-col gap-0.5 ${isHuman ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-3 py-2 text-xs leading-relaxed ${
          isHuman
            ? 'bg-[#22D3EE] text-[#07090C] rounded-tr-sm font-medium'
            : 'bg-surface-2 text-foreground rounded-tl-sm border border-border/40'
        }`}>
          {msg.status === 'sending' ? (
            <span className="opacity-60">{msg.content}</span>
          ) : (
            msg.content
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-muted-foreground/40 font-mono-tight">{fmtTime(msg.ts)}</span>
          {isHuman && msg.status === 'sending' && (
            <span className="text-[9px] text-muted-foreground/40">sending…</span>
          )}
          {isHuman && msg.status === 'failed' && (
            <span className="text-[9px] text-red-400">failed</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Widget ───────────────────────────────────────────────────────────────────

export function QuickChatWidget({ data }: { data: DashboardData }) {
  const { agents, setActiveConversation, addChatMessage, updatePendingMessage } = useMissionControl()
  const navigateToPanel = useNavigateToPanel()

  const [messages, setMessages] = useState<QuickMessage[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pendingIdRef = useRef(-1)

  // Pick a default agent when the list loads
  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      const online = agents.find((a) => a.status === 'idle' || a.status === 'busy')
      setSelectedAgent(online?.name ?? agents[0].name)
    }
  }, [agents, selectedAgent])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const handleSend = useCallback(async (content: string, attachments?: ChatAttachment[]) => {
    if (!content.trim() && !attachments?.length) return

    // Use selected agent or fall back to ANIMA root orchestrator
    const targetAgent = selectedAgent || 'ROOT_ORCHESTRATOR'

    const tempId = --pendingIdRef.current
    const now = Math.floor(Date.now() / 1000)

    // Add optimistic human message
    const humanMsg: QuickMessage = {
      id: tempId,
      from: 'human',
      content,
      ts: now,
      attachments,
      status: 'sending',
    }
    setMessages((prev) => [...prev, humanMsg])
    setIsGenerating(true)

    try {
      const convId = `agent_${targetAgent}`

      // Mirror to main store so it shows up if they switch to /chat
      addChatMessage({
        id: tempId,
        conversation_id: convId,
        from_agent: 'human',
        to_agent: targetAgent,
        content,
        message_type: 'text' as const,
        attachments,
        created_at: now,
        pendingStatus: 'sending' as const,
      })

      // ── Route vers le moteur ANIMA (llm_client + mémoire tenant) ──────────
      const res = await fetch('/api/anima-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: content,
          agentId: targetAgent,
        }),
      })

      if (res.ok) {
        const body = await res.json()
        // Mark sent
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: 'sent' } : m))
        )
        // Add ANIMA reply
        if (body.reply) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              from: body.agentId || targetAgent,
              content: body.reply,
              ts: Math.floor(Date.now() / 1000),
            },
          ])
        }
      } else {
        const errBody = await res.json().catch(() => ({}))
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m))
        )
        updatePendingMessage(tempId, { pendingStatus: 'failed' })
        // Show error as system message
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            from: 'ANIMA',
            content: `Erreur : ${errBody.error || res.statusText}`,
            ts: Math.floor(Date.now() / 1000),
          },
        ])
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m))
      )
    } finally {
      setIsGenerating(false)
    }
  }, [selectedAgent, addChatMessage, updatePendingMessage])

  const openFullChat = () => {
    if (selectedAgent) setActiveConversation(`agent_${selectedAgent}`)
    navigateToPanel('chat')
  }

  const onlineAgents = agents.filter((a) => a.status === 'idle' || a.status === 'busy')
  const hasAgents = agents.length > 0

  return (
    <div className="panel flex flex-col h-full min-h-[320px]">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
          <h3 className="text-sm font-semibold text-foreground">Quick Chat</h3>
          {onlineAgents.length > 0 && (
            <span className="text-2xs text-muted-foreground font-mono-tight">
              {onlineAgents.length} agent{onlineAgents.length > 1 ? 's' : ''} online
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Agent selector */}
          {hasAgents && (
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="h-6 rounded-lg border border-border/50 bg-surface-1 px-2 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-[#22D3EE]/30 font-mono-tight"
            >
              {agents.map((a) => (
                <option key={a.name} value={a.name}>
                  {a.name}{a.status === 'idle' || a.status === 'busy' ? ' ●' : ''}
                </option>
              ))}
            </select>
          )}
          {/* Open full chat */}
          <button
            onClick={openFullChat}
            title="Open full chat panel"
            className="flex items-center gap-1 h-6 px-2 rounded-lg border border-border/50 text-[11px] text-muted-foreground hover:text-foreground hover:bg-surface-1 transition-colors"
          >
            <ExpandIcon />
            <span className="hidden sm:inline">Full chat</span>
          </button>
        </div>
      </div>

      {/* Message area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0 scrollbar-none"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
            <div className="w-10 h-10 rounded-2xl bg-[#22D3EE]/10 border border-[#22D3EE]/20 flex items-center justify-center text-[#22D3EE]">
              <ChatBubbleIcon />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-foreground/70">
                {`Message ${selectedAgent || 'ANIMA'}`}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Alimenté par le moteur ANIMA OS
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => <QuickMessageRow key={msg.id} msg={msg} />)
        )}

        {/* Generating indicator */}
        {isGenerating && (
          <div className="flex gap-2 items-end">
            <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold bg-surface-2 text-muted-foreground border border-border/50">
              {(selectedAgent || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="bg-surface-2 border border-border/40 rounded-2xl rounded-tl-sm px-3 py-2.5">
              <div className="flex gap-1 items-center">
                <div className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat input — reuses the same component with compact mode */}
      <div className="border-t border-border/50 flex-shrink-0">
        <ChatInput
          onSend={handleSend}
          disabled={false}
          agents={agents.map((a) => ({ name: a.name, role: a.role }))}
          isGenerating={isGenerating}
          compact
        />
      </div>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChatBubbleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10c0 .46-.06.9-.17 1.33C17.05 14.48 14.27 17 11 17c-.97 0-1.9-.2-2.74-.57L4 18l1.43-3.57A7.5 7.5 0 012 10a8 8 0 1116 0z" />
    </svg>
  )
}

function ExpandIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 2h4M2 2v4M14 14h-4M14 14v-4M2 14h4M2 14v-4M14 2h-4M14 2v4" />
    </svg>
  )
}
