'use client'

import Image from 'next/image'
import { useRef, useEffect, useState, useCallback } from 'react'
import { useMissionControl, type ChatAttachment } from '@/store'

interface ChatInputProps {
  onSend: (content: string, attachments?: ChatAttachment[]) => void
  onAbort?: () => void
  disabled?: boolean
  agents?: Array<{ name: string; role: string }>
  isGenerating?: boolean
  compact?: boolean
}

// ─── Voice recorder hook ─────────────────────────────────────────────────────

type RecordingState = 'idle' | 'recording' | 'processing'

function useVoiceRecorder(onRecorded: (attachment: ChatAttachment) => void) {
  const [state, setState] = useState<RecordingState>('idle')
  const [seconds, setSeconds] = useState(0)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(async () => {
    if (state !== 'idle') return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
      const supportedType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
      const recorder = new MediaRecorder(stream, supportedType ? { mimeType: supportedType } : {})
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        setState('processing')
        const mimeType = recorder.mimeType || 'audio/webm'
        const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm'
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const reader = new FileReader()
        reader.onload = () => {
          onRecorded({
            name: `voice-${Date.now()}.${ext}`,
            type: mimeType,
            size: blob.size,
            dataUrl: reader.result as string,
          })
          setState('idle')
          setSeconds(0)
        }
        reader.readAsDataURL(blob)
      }

      recorder.start(100)
      mediaRef.current = recorder
      setState('recording')
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    } catch {
      setState('idle')
    }
  }, [state, onRecorded])

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    mediaRef.current?.stop()
    mediaRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      mediaRef.current?.stop()
    }
  }, [])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  return { state, seconds: fmt(seconds), start, stop }
}

// ─── Attachment chip ──────────────────────────────────────────────────────────

function AttachmentChip({ att, index, onRemove }: {
  att: ChatAttachment; index: number; onRemove: (i: number) => void
}) {
  const isImage = att.type.startsWith('image/')
  const isAudio = att.type.startsWith('audio/')
  const fmt = (b: number) =>
    b < 1024 ? `${b}B` : b < 1048576 ? `${(b / 1024).toFixed(1)}KB` : `${(b / 1048576).toFixed(1)}MB`

  return (
    <div className="relative group flex-shrink-0">
      {isImage ? (
        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-border/60 bg-surface-1 shadow-sm">
          <Image
            src={att.dataUrl}
            alt={att.name}
            width={56}
            height={56}
            unoptimized
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-0.5 inset-x-0 text-[8px] text-white/70 text-center font-mono-tight px-0.5 truncate">
            {fmt(att.size)}
          </div>
        </div>
      ) : isAudio ? (
        <div className="flex items-center gap-2 rounded-xl border border-[#22D3EE]/25 bg-[#22D3EE]/5 px-3 py-2 w-44 shadow-sm">
          <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#22D3EE]/15 flex items-center justify-center text-[#22D3EE]">
            <WaveformIcon />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold text-[#22D3EE] truncate">Voice message</div>
            <div className="text-[9px] text-muted-foreground font-mono-tight">{fmt(att.size)}</div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-surface-1 px-3 py-2 w-40 shadow-sm">
          <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-surface-2 flex items-center justify-center text-muted-foreground">
            <FileIcon />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium text-foreground truncate">{att.name}</div>
            <div className="text-[9px] text-muted-foreground font-mono-tight">{fmt(att.size)}</div>
          </div>
        </div>
      )}
      <button
        onClick={() => onRemove(index)}
        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-background border border-border text-muted-foreground text-[9px] items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md z-10 hidden group-hover:flex hover:bg-red-500 hover:text-white hover:border-red-500"
        aria-label="Remove attachment"
      >
        ✕
      </button>
    </div>
  )
}

// ─── Main ChatInput ───────────────────────────────────────────────────────────

export function ChatInput({
  onSend,
  onAbort,
  disabled,
  agents = [],
  isGenerating,
  compact = false,
}: ChatInputProps) {
  const { chatInput, setChatInput, isSendingMessage } = useMissionControl()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const [mentionIndex, setMentionIndex] = useState(0)
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const filteredAgents = agents.filter((a) =>
    a.name.toLowerCase().includes(mentionFilter.toLowerCase())
  )

  // ── Auto-resize ───────────────────────────────────────────────────────────
  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, compact ? 120 : 200) + 'px'
  }, [compact])

  useEffect(() => { autoResize() }, [chatInput, autoResize])
  useEffect(() => { if (!disabled) textareaRef.current?.focus() }, [disabled])

  // ── File handling ─────────────────────────────────────────────────────────
  const addFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) return
      const reader = new FileReader()
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          { name: file.name, type: file.type, size: file.size, dataUrl: reader.result as string },
        ])
      }
      reader.readAsDataURL(file)
    })
  }, [])

  const addAudio = useCallback((att: ChatAttachment) => {
    setAttachments((prev) => [...prev, att])
  }, [])

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // ── Drag & drop ───────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(true)
  }, [])
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false)
  }, [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
  }, [addFiles])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    const images: File[] = []
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const f = items[i].getAsFile()
        if (f) images.push(f)
      }
    }
    if (images.length > 0) { e.preventDefault(); addFiles(images) }
  }, [addFiles])

  // ── Voice ─────────────────────────────────────────────────────────────────
  const {
    state: recState,
    seconds: recTime,
    start: startRec,
    stop: stopRec,
  } = useVoiceRecorder(addAudio)

  // ── Mentions ──────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setChatInput(value)
    const cursor = e.target.selectionStart
    const before = value.slice(0, cursor)
    const match = before.match(/@(\w*)$/)
    if (match) { setMentionFilter(match[1]); setShowMentions(true); setMentionIndex(0) }
    else setShowMentions(false)
  }

  const insertMention = (name: string) => {
    const el = textareaRef.current
    if (!el) return
    const cursor = el.selectionStart
    const before = chatInput.slice(0, cursor)
    const after = chatInput.slice(cursor)
    const atIdx = before.lastIndexOf('@')
    setChatInput(before.slice(0, atIdx) + `@${name} ` + after)
    setShowMentions(false)
    setTimeout(() => {
      const pos = atIdx + name.length + 2
      el.setSelectionRange(pos, pos)
      el.focus()
    }, 0)
  }

  // ── Keyboard ──────────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex((i) => Math.min(i + 1, filteredAgents.length - 1)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex((i) => Math.max(i - 1, 0)); return }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); if (filteredAgents[mentionIndex]) insertMention(filteredAgents[mentionIndex].name); return }
      if (e.key === 'Escape') { setShowMentions(false); return }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = () => {
    const trimmed = chatInput.trim()
    if ((!trimmed && attachments.length === 0) || disabled || isSendingMessage) return
    onSend(trimmed, attachments.length > 0 ? attachments : undefined)
    setChatInput('')
    setAttachments([])
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const hasContent = chatInput.trim().length > 0 || attachments.length > 0
  const canSend = hasContent && !disabled && !isSendingMessage

  // Waveform bar heights for recording animation
  const waveHeights = [3, 6, 4, 8, 3, 7, 5, 9, 4, 6, 3, 7, 5]

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="relative flex-shrink-0"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ── Drag overlay ─────────────────────────────────────────────────── */}
      {isDragOver && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#22D3EE]/60 bg-[#22D3EE]/5 backdrop-blur-sm pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-[#22D3EE]/15 flex items-center justify-center text-[#22D3EE]">
            <UploadCloudIcon />
          </div>
          <span className="text-xs font-medium text-[#22D3EE]">Drop to attach</span>
        </div>
      )}

      {/* ── Mention dropdown ─────────────────────────────────────────────── */}
      {showMentions && filteredAgents.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-card/98 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl overflow-hidden z-20">
          <div className="px-4 py-2 border-b border-border/50 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Mention agent</span>
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filteredAgents.map((agent, i) => (
              <button
                key={agent.name}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${
                  i === mentionIndex
                    ? 'bg-[#22D3EE]/10 text-foreground'
                    : 'text-foreground/80 hover:bg-surface-1'
                }`}
                onMouseDown={(e) => { e.preventDefault(); insertMention(agent.name) }}
              >
                <div className="w-7 h-7 rounded-full bg-surface-2 flex items-center justify-center text-[10px] font-bold text-muted-foreground border border-border/60 flex-shrink-0">
                  {agent.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">@{agent.name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{agent.role}</div>
                </div>
                {i === mentionIndex && (
                  <div className="text-[10px] text-[#22D3EE]/60 font-mono-tight">↵</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Main input surface ───────────────────────────────────────────── */}
      <div className={compact ? 'px-2 pb-2' : 'px-3 pb-3'}>
        <div
          className={[
            'rounded-2xl border overflow-hidden transition-all duration-200',
            'bg-card/80 backdrop-blur-sm',
            isFocused
              ? 'border-[#22D3EE]/50 shadow-[0_0_0_3px_hsl(187_82%_53%_/_0.10),0_4px_24px_rgba(0,0,0,0.3)]'
              : 'border-border/60 shadow-[0_2px_12px_rgba(0,0,0,0.2)]',
            disabled ? 'pointer-events-none' : '',
            isDragOver ? 'border-[#22D3EE]/60 bg-[#22D3EE]/5' : '',
          ].filter(Boolean).join(' ')}
        >
          {/* Attachment strip */}
          {attachments.length > 0 && (
            <div className="flex gap-2.5 px-4 pt-3 pb-1 overflow-x-auto scrollbar-none">
              {attachments.map((att, idx) => (
                <AttachmentChip key={idx} att={att} index={idx} onRemove={removeAttachment} />
              ))}
            </div>
          )}

          {/* Recording banner — replaces textarea while active */}
          {recState === 'recording' && (
            <div className="flex items-center gap-3 px-4 pt-3.5 pb-2">
              <div className="flex items-end gap-[3px] h-5 flex-shrink-0">
                {waveHeights.map((h, i) => (
                  <div
                    key={i}
                    className="w-[2.5px] rounded-full bg-red-400"
                    style={{
                      height: `${h * 2.5}px`,
                      animation: `chatWaveBar 0.7s ease-in-out ${i * 0.06}s infinite alternate`,
                    }}
                  />
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                  <span className="text-sm font-semibold text-red-400 font-mono-tight">{recTime}</span>
                  <span className="text-xs text-muted-foreground">Recording… press Stop when done</span>
                </div>
              </div>
            </div>
          )}

          {/* Textarea */}
          {recState !== 'recording' && (
            <div className={`px-4 ${attachments.length > 0 ? 'pt-2' : 'pt-3.5'} pb-1`}>
              <textarea
                ref={textareaRef}
                value={chatInput}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={
                  disabled
                    ? 'Select a conversation to start chatting…'
                    : recState === 'processing'
                    ? 'Processing voice message…'
                    : 'Ask AnimaClaw anything… (@mention an agent · ↵ send · ⇧↵ newline)'
                }
                disabled={disabled || isSendingMessage || recState !== 'idle'}
                rows={1}
                className={[
                  'w-full resize-none bg-transparent text-foreground',
                  'placeholder:text-muted-foreground/35 focus:outline-none',
                  'disabled:opacity-50 leading-relaxed',
                  compact ? 'text-xs' : 'text-sm',
                ].join(' ')}
                style={{
                  minHeight: compact ? '22px' : '28px',
                  maxHeight: compact ? '120px' : '200px',
                }}
              />
            </div>
          )}

          {/* Divider */}
          <div className="mx-4 border-t border-border/30" />

          {/* ── Toolbar ─────────────────────────────────────────────────── */}
          <div className={`flex items-center justify-between ${compact ? 'px-2 py-1.5' : 'px-3 py-2'}`}>

            {/* Left — action buttons */}
            <div className="flex items-center gap-1">

              {/* File / image upload */}
              {recState === 'idle' && (
                <>
                  <ActionButton
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isSendingMessage}
                    title="Attach image, PDF, or file (max 10 MB)"
                  >
                    <PaperclipIcon />
                    <span className="text-[11px] font-medium hidden sm:inline">Attach</span>
                  </ActionButton>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt,.md,.json,.csv,.zip"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) addFiles(e.target.files)
                      e.target.value = ''
                    }}
                  />
                </>
              )}

              {/* Voice — idle: record button */}
              {recState === 'idle' && (
                <ActionButton
                  onClick={startRec}
                  disabled={disabled || isSendingMessage}
                  title="Record a voice message"
                  hoverClass="hover:text-[#22D3EE] hover:bg-[#22D3EE]/10 hover:border-[#22D3EE]/20"
                >
                  <MicIcon />
                  <span className="text-[11px] font-medium hidden sm:inline">Voice</span>
                </ActionButton>
              )}

              {/* Voice — recording: stop button */}
              {recState === 'recording' && (
                <button
                  onClick={stopRec}
                  className="flex items-center gap-2 h-8 px-3 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 hover:border-red-500/40 transition-all"
                >
                  <StopIcon />
                  Stop recording
                </button>
              )}

              {/* Voice — processing */}
              {recState === 'processing' && (
                <div className="flex items-center gap-2 h-8 px-3 text-xs text-muted-foreground">
                  <span className="w-3.5 h-3.5 border-2 border-[#22D3EE]/30 border-t-[#22D3EE] rounded-full animate-spin inline-block" />
                  <span>Processing…</span>
                </div>
              )}
            </div>

            {/* Right — send / abort */}
            <div className="flex items-center gap-2">
              {isGenerating && onAbort ? (
                <button
                  onClick={onAbort}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 transition-all"
                >
                  <StopIcon />
                  Stop
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!canSend || recState !== 'idle'}
                  title="Send message (Enter)"
                  className={[
                    'flex items-center justify-center rounded-xl transition-all duration-200',
                    compact ? 'h-7 w-7' : 'h-8 w-8',
                    canSend && recState === 'idle'
                      ? 'bg-[#22D3EE] text-[#07090C] shadow-[0_0_16px_hsl(187_82%_53%_/_0.4),0_2px_8px_rgba(0,0,0,0.3)] hover:bg-[#22D3EE]/90 hover:shadow-[0_0_20px_hsl(187_82%_53%_/_0.5)] active:scale-95'
                      : 'bg-surface-2 text-muted-foreground/30 cursor-not-allowed',
                  ].join(' ')}
                >
                  {isSendingMessage ? (
                    <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin inline-block" />
                  ) : (
                    <SendIcon />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sub-line: attachment count / char count */}
        {(attachments.length > 0 || chatInput.length > 200) && (
          <div className="flex items-center justify-between mt-1.5 px-1">
            {attachments.length > 0 && (
              <span className="text-[10px] text-muted-foreground/50 font-mono-tight">
                {attachments.length} attachment{attachments.length > 1 ? 's' : ''}
              </span>
            )}
            {chatInput.length > 200 && (
              <span className="text-[10px] text-muted-foreground/50 font-mono-tight ml-auto">
                {chatInput.length} chars
              </span>
            )}
          </div>
        )}
      </div>

      {/* Inline keyframe — avoids globals.css dependency */}
      <style>{`
        @keyframes chatWaveBar {
          0%   { transform: scaleY(0.4); opacity: 0.6; }
          100% { transform: scaleY(1);   opacity: 1;   }
        }
      `}</style>
    </div>
  )
}

// ─── Action button primitive ──────────────────────────────────────────────────

function ActionButton({
  children,
  onClick,
  disabled,
  title,
  hoverClass = 'hover:text-foreground hover:bg-surface-2',
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  title?: string
  hoverClass?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={[
        'flex items-center gap-1.5 h-8 px-2.5 rounded-xl border border-transparent',
        'text-muted-foreground transition-all duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        hoverClass,
      ].join(' ')}
    >
      {children}
    </button>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function PaperclipIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 7.5l-5.8 5.8a3.2 3.2 0 01-4.5-4.5l5.8-5.8a2.1 2.1 0 013 3l-5.8 5.7a1 1 0 01-1.4-1.4l5.1-5.2" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="1" width="6" height="8" rx="3" />
      <path d="M2 8a6 6 0 0012 0M8 14v2M5 16h6" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
      <rect x="1" y="1" width="10" height="10" rx="2" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2L7 9" />
      <path d="M14 2l-5 12-2-5-5-2 12-5z" />
    </svg>
  )
}

function WaveformIcon() {
  return (
    <svg width="14" height="12" viewBox="0 0 16 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M1 7h1M3 4v6M5 2v10M7 5v4M9 3v8M11 5v4M13 4v6M15 7h1" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V6L9 1z" />
      <path d="M9 1v5h5" />
    </svg>
  )
}

function UploadCloudIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
  )
}
