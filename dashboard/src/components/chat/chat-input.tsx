'use client'

import Image from 'next/image'
import { useRef, useEffect, useState, useCallback } from 'react'
import { useMissionControl, type ChatAttachment } from '@/store'
import { Button } from '@/components/ui/button'

interface ChatInputProps {
  onSend: (content: string, attachments?: ChatAttachment[]) => void
  onAbort?: () => void
  disabled?: boolean
  agents?: Array<{ name: string; role: string }>
  isGenerating?: boolean
}

// ─── Voice recording hook ────────────────────────────────────────────────────

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
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        setState('processing')
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onload = () => {
          onRecorded({
            name: `voice-${Date.now()}.webm`,
            type: 'audio/webm',
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

  const fmtSeconds = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return { state, seconds: fmtSeconds(seconds), start, stop }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function AttachmentChip({
  att,
  index,
  onRemove,
}: {
  att: ChatAttachment
  index: number
  onRemove: (i: number) => void
}) {
  const isImage = att.type.startsWith('image/')
  const isAudio = att.type.startsWith('audio/')

  const fmtSize = (b: number) => {
    if (b < 1024) return `${b} B`
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
    return `${(b / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="relative group flex-shrink-0">
      {isImage ? (
        <div className="relative rounded-lg overflow-hidden border border-border/60 bg-surface-1">
          <Image
            src={att.dataUrl}
            alt={att.name}
            width={64}
            height={64}
            unoptimized
            className="w-16 h-16 object-cover"
          />
          <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white/80 px-1 py-0.5 truncate">
            {fmtSize(att.size)}
          </div>
        </div>
      ) : isAudio ? (
        <div className="flex items-center gap-2 rounded-lg border border-[#22D3EE]/30 bg-[#22D3EE]/5 px-3 py-2 w-44">
          <div className="flex-shrink-0 text-[#22D3EE]">
            <WaveformIcon />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-medium text-[#22D3EE] truncate">Voice message</div>
            <div className="text-[9px] text-muted-foreground font-mono-tight">{fmtSize(att.size)}</div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-surface-1 px-3 py-2 w-40">
          <div className="text-muted-foreground flex-shrink-0">
            <FileIcon />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-medium text-foreground truncate">{att.name}</div>
            <div className="text-[9px] text-muted-foreground font-mono-tight">{fmtSize(att.size)}</div>
          </div>
        </div>
      )}

      {/* Remove button */}
      <button
        onClick={() => onRemove(index)}
        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex shadow-md z-10 hover:bg-red-400"
        aria-label="Remove attachment"
      >
        ✕
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ChatInput({ onSend, onAbort, disabled, agents = [], isGenerating }: ChatInputProps) {
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
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 160) + 'px'
    }
  }, [])

  useEffect(() => { autoResize() }, [chatInput, autoResize])

  useEffect(() => {
    if (!disabled) textareaRef.current?.focus()
  }, [disabled])

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

  // ── Drag and drop ─────────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true) }, [])
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false) }, [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
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

  // ── Voice recorder ────────────────────────────────────────────────────────

  const { state: recState, seconds: recTime, start: startRec, stop: stopRec } = useVoiceRecorder(addAudio)

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
      const newPos = atIdx + name.length + 2
      el.setSelectionRange(newPos, newPos)
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

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="relative flex-shrink-0 safe-area-bottom"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag-over overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-30 flex items-center justify-center rounded-xl border-2 border-dashed border-[#22D3EE]/50 bg-[#22D3EE]/5 backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center gap-1 text-[#22D3EE]">
            <UploadIcon />
            <span className="text-xs font-medium">Drop files here</span>
          </div>
        </div>
      )}

      {/* Mention dropdown */}
      {showMentions && filteredAgents.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-card/95 backdrop-blur-lg border border-border rounded-xl shadow-xl overflow-hidden max-h-44 overflow-y-auto z-20">
          <div className="px-3 py-1.5 border-b border-border/50">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Mention agent</span>
          </div>
          {filteredAgents.map((agent, i) => (
            <button
              key={agent.name}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                i === mentionIndex ? 'bg-[#22D3EE]/10 text-foreground' : 'text-foreground hover:bg-surface-1'
              }`}
              onMouseDown={(e) => { e.preventDefault(); insertMention(agent.name) }}
            >
              <div className="w-6 h-6 rounded-full bg-surface-2 flex items-center justify-center text-[10px] font-bold text-muted-foreground border border-border/50 flex-shrink-0">
                {agent.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium">@{agent.name}</span>
              <span className="text-muted-foreground text-xs ml-auto">{agent.role}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main input card */}
      <div
        className={`mx-0 border-t border-border bg-card/80 backdrop-blur-sm transition-all duration-200 ${
          isDragOver ? 'bg-[#22D3EE]/5' : ''
        }`}
      >
        {/* Inner glass container */}
        <div
          className={`m-3 rounded-xl border transition-all duration-200 bg-surface-1/60 backdrop-blur-sm ${
            isFocused
              ? 'border-[#22D3EE]/40 shadow-[0_0_0_3px_hsl(187_82%_53%_/_0.08)]'
              : 'border-border/60 shadow-sm'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          {/* Attachment strip */}
          {attachments.length > 0 && (
            <div className="flex gap-2 px-3 pt-3 pb-1 overflow-x-auto scrollbar-none">
              {attachments.map((att, idx) => (
                <AttachmentChip key={idx} att={att} index={idx} onRemove={removeAttachment} />
              ))}
            </div>
          )}

          {/* Textarea */}
          <div className="px-3 pt-2.5 pb-1">
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
                  ? 'Select a conversation…'
                  : recState === 'recording'
                  ? '🎙 Recording… press stop when done'
                  : 'Message… (@mention · Enter to send · Shift+Enter for newline)'
              }
              disabled={disabled || isSendingMessage || recState === 'recording'}
              rows={1}
              className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none disabled:opacity-40 transition-colors leading-relaxed"
              style={{ minHeight: '28px', maxHeight: '160px' }}
            />
          </div>

          {/* Recording progress bar */}
          {recState === 'recording' && (
            <div className="px-3 pb-1">
              <div className="flex items-center gap-2">
                <div className="flex gap-[3px] items-end h-4">
                  {[3, 6, 4, 7, 3, 5, 6, 4, 5, 3].map((h, i) => (
                    <div
                      key={i}
                      className="w-[2px] rounded-full bg-red-400"
                      style={{
                        height: `${h * 2}px`,
                        animation: `waveBar 0.8s ease-in-out ${i * 0.07}s infinite alternate`,
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs font-mono-tight text-red-400">{recTime}</span>
                <span className="text-[10px] text-muted-foreground">Recording…</span>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="mx-3 border-t border-border/40" />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-2 py-1.5">
            {/* Left: action buttons */}
            <div className="flex items-center gap-0.5">
              {/* File / image upload */}
              <ToolbarButton
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isSendingMessage}
                title="Attach file or image"
                label="Attach"
              >
                <PaperclipIcon />
              </ToolbarButton>

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

              {/* Voice record */}
              {recState === 'recording' ? (
                <button
                  onClick={stopRec}
                  title="Stop recording"
                  className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 transition-colors animate-pulse"
                >
                  <StopIcon />
                  <span className="font-mono-tight">{recTime}</span>
                </button>
              ) : recState === 'processing' ? (
                <ToolbarButton disabled title="Processing…">
                  <span className="w-3.5 h-3.5 border-2 border-[#22D3EE]/30 border-t-[#22D3EE] rounded-full animate-spin inline-block" />
                </ToolbarButton>
              ) : (
                <ToolbarButton
                  onClick={startRec}
                  disabled={disabled || isSendingMessage}
                  title="Record voice message"
                  label="Voice"
                  className="hover:text-[#22D3EE] hover:bg-[#22D3EE]/10"
                >
                  <MicIcon />
                </ToolbarButton>
              )}
            </div>

            {/* Right: hint + send/stop */}
            <div className="flex items-center gap-2">
              {!isGenerating && !hasContent && (
                <span className="hidden sm:inline text-[10px] text-muted-foreground/40 font-mono-tight select-none">
                  ↵ send · ⇧↵ newline
                </span>
              )}

              {isGenerating && onAbort ? (
                <button
                  onClick={onAbort}
                  title="Stop generation"
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
                    <rect x="1" y="1" width="10" height="10" rx="1.5" />
                  </svg>
                  Stop
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  title="Send message (Enter)"
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${
                    canSend
                      ? 'bg-[#22D3EE] text-[#07090C] hover:bg-[#22D3EE]/90 shadow-[0_0_12px_hsl(187_82%_53%_/_0.35)]'
                      : 'bg-surface-2 text-muted-foreground/30 cursor-not-allowed'
                  }`}
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
      </div>
    </div>
  )
}

// ─── Toolbar button primitive ─────────────────────────────────────────────────

function ToolbarButton({
  children,
  onClick,
  disabled,
  title,
  label,
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  title?: string
  label?: string
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={label || title}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:text-foreground hover:bg-surface-2 ${className}`}
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
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <rect x="1" y="1" width="10" height="10" rx="1.5" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2L7 9" />
      <path d="M14 2l-5 12-2-5-5-2 12-5z" />
    </svg>
  )
}

function WaveformIcon() {
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M1 7h1M3 4v6M5 2v10M7 5v4M9 3v8M11 5v4M13 4v6M15 7h1" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V6L9 1z" />
      <path d="M9 1v5h5" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  )
}
