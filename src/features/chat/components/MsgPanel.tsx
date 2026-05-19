import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ConversationDTO, MessageDTO } from '@/api/chat.api'
import { useChatStore } from '../store'
import { resolveConvName } from '../utils'
import { Avatar } from './Avatar'
import { MessageBubble } from './MessageBubble'
import { MembersPanel } from './MembersPanel'
import { ReminderModal } from './ReminderModal'

interface MsgPanelProps {
  conversation: ConversationDTO | undefined
  messages: MessageDTO[]
  loading: boolean
  hasMore: boolean
  connected: boolean
  isTyping: boolean
  currentUserId: number | undefined
  userMap: Record<number, string>
  convMembers: Record<number, number[]>
  isMuted: boolean
  onLoadMore: () => void
  onSend: (text: string, replyTo?: number) => Promise<void>
  onTyping: (typing: boolean) => void
  onEdit: (id: number, content: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onToggleMute: () => void
}

export function MsgPanel({
  conversation, messages, loading, hasMore, connected, isTyping,
  currentUserId, userMap, convMembers, isMuted, onLoadMore, onSend, onTyping, onEdit, onDelete, onToggleMute,
}: MsgPanelProps) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [replyingTo, setReplyingTo] = useState<MessageDTO | null>(null)
  const [reminderTarget, setReminderTarget] = useState<MessageDTO | null>(null)
  const [showMembers, setShowMembers] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const store = useChatStore()
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const emojiRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showEmoji) return
    function handleClick(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showEmoji])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function handleSend() {
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    const replyId = replyingTo?.id
    setText('')
    setReplyingTo(null)
    if (textareaRef.current) textareaRef.current.style.height = '40px'
    onTyping(false)
    try {
      await onSend(content, replyId)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
    if (e.key === 'Escape') setReplyingTo(null)
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`
    onTyping(true)
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => onTyping(false), 2000)
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm bg-slate-50">
        {t('chat.selectConversation')}
      </div>
    )
  }

  const convName = resolveConvName(conversation, convMembers, userMap, currentUserId)
  const isGroup = conversation.type === 'GROUP'
  const memberIds = convMembers[conversation.id] ?? []

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 bg-white shrink-0">
          <Avatar name={convName} src={conversation.avatar} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-800 text-sm truncate">{convName}</div>
            <div className={`text-[11px] font-medium ${connected ? 'text-green-500' : 'text-slate-400'}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${connected ? 'bg-green-500' : 'bg-slate-300'}`} />
              {connected ? t('chat.live') : t('chat.disconnected')}
            </div>
          </div>
          <button
            onClick={onToggleMute}
            className={`w-8 h-8 flex items-center justify-center rounded-full border cursor-pointer transition-colors ${
              isMuted
                ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
            title={isMuted ? t('chat.unmute') : t('chat.mute')}
          >
            {isMuted ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13.73 21a2 2 0 01-3.46 0M18.63 13A17.89 17.89 0 0118 8M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14M18 8a6 6 0 00-9.33-5" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            )}
          </button>
          {isGroup && (
            <button
              onClick={() => setShowMembers(v => !v)}
              className={`w-8 h-8 flex items-center justify-center rounded-full border cursor-pointer transition-colors ${
                showMembers
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
              title={t('chat.members')}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col bg-slate-50">
          {hasMore && (
            <button
              onClick={onLoadMore}
              className="self-center text-xs text-indigo-600 mb-3 bg-transparent border-0 cursor-pointer hover:underline"
            >
              {t('chat.loadMore')}
            </button>
          )}
          {loading && messages.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-10">{t('common.loading')}</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-10">{t('chat.noMessages')}</div>
          ) : (
            messages.map(msg => {
              const isMe = msg.senderId === currentUserId
              const senderName = !isMe && isGroup ? userMap[msg.senderId] : undefined
              const replyToMsg = msg.replyTo ? messages.find(m => m.id === msg.replyTo) : undefined
              const replyToSenderName = replyToMsg ? userMap[replyToMsg.senderId] : undefined
              return (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isMe={isMe}
                  senderName={senderName}
                  replyToMsg={replyToMsg}
                  replyToSenderName={replyToSenderName}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReply={setReplyingTo}
                  onRemind={setReminderTarget}
                />
              )
            })
          )}
          {isTyping && (
            <div className="flex justify-start mb-1">
              <div className="px-3.5 py-2 rounded-2xl rounded-bl-sm bg-white shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Reply preview bar */}
        {replyingTo && (
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border-t border-indigo-100 shrink-0">
            <div className="w-0.5 h-8 bg-indigo-400 rounded-full shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-indigo-600">
                {t('chat.replyingTo')} {userMap[replyingTo.senderId] ?? '…'}
              </div>
              <div className="text-xs text-slate-500 truncate">{replyingTo.content}</div>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer p-1 shrink-0"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t border-slate-100 bg-white shrink-0">
          <div className="flex items-end gap-2 border border-slate-200 rounded-2xl px-3 py-2 focus-within:border-indigo-400 transition-colors bg-white">
            {/* Emoji picker */}
            <div className="relative self-end mb-0.5 shrink-0" ref={emojiRef}>
              <button
                type="button"
                onClick={() => setShowEmoji(v => !v)}
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors border-0 cursor-pointer text-base leading-none ${showEmoji ? 'bg-indigo-100 text-indigo-600' : 'bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                title="Emoji"
              >
                😊
              </button>
              {showEmoji && (
                <div className="absolute bottom-9 left-0 z-20 bg-white border border-slate-200 rounded-xl shadow-lg p-2 grid grid-cols-8 gap-0.5 w-64">
                  {['😀','😂','😍','🥰','😎','🤔','😢','😡','👍','👎','❤️','🔥','🎉','✅','⭐','🙏','😊','🤣','😘','🥳','😅','😇','🤗','😴','👏','💪','🚀','💡','✨','🎯','💯','🤝'].map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => {
                        setText(t => t + e)
                        textareaRef.current?.focus()
                        setShowEmoji(false)
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-base hover:bg-slate-100 cursor-pointer border-0 bg-transparent leading-none"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.messagePlaceholder')}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed overflow-y-auto py-0.5"
              style={{ minHeight: '28px', maxHeight: '128px' }}
            />

            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 border-0 cursor-pointer shrink-0 transition-colors self-end mb-0.5"
            >
              <svg className="w-3.5 h-3.5 translate-x-px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22 11 13 2 9l20-7z" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 pl-1">{t('chat.sendHint')}</p>
        </div>
      </div>

      {isGroup && showMembers && (
        <MembersPanel
          memberIds={memberIds}
          userMap={userMap}
          currentUserId={currentUserId}
          onClose={() => setShowMembers(false)}
        />
      )}

      {reminderTarget && (
        <ReminderModal
          msg={reminderTarget}
          onClose={() => setReminderTarget(null)}
          onSet={remindAt => {
            store.addReminder({
              messageId: reminderTarget.id,
              conversationId: reminderTarget.conversationId,
              preview: (reminderTarget.content ?? '').slice(0, 80),
              remindAt,
            })
            setReminderTarget(null)
          }}
        />
      )}
    </div>
  )
}
