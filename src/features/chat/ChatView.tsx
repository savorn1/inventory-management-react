import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useChatStore } from './store'
import { useChatSocket } from '@/hooks/useChatSocket'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/hooks/useToast'
import { usersApi } from '@/api/users.api'
import type { SysUserDTO } from '@/api/users.api'
import type { ConversationDTO, MessageDTO } from '@/api/chat.api'
import type { TypingEvent } from '@/hooks/useChatSocket'
import { initials } from '@/utils/format'

function timeLabel(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  if (isToday) {
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('en-CA')
}

function resolveConvName(
  c: ConversationDTO,
  convMembers: Record<number, number[]>,
  userMap: Record<number, string>,
  currentUserId: number | undefined,
): string {
  if (c.name) return c.name
  if (c.type === 'PRIVATE') {
    const otherId = convMembers[c.id]?.find(id => id !== currentUserId)
    if (otherId) return userMap[otherId] ?? `Conversation #${c.id}`
  }
  return `Conversation #${c.id}`
}

function Avatar({ name, size = 'md', src }: { name: string; size?: 'sm' | 'md'; src?: string | null }) {
  const cls = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${cls} rounded-full object-cover shrink-0`}
        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
      />
    )
  }
  return (
    <div className={`${cls} rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold shrink-0`}>
      {initials(name || '?')}
    </div>
  )
}

// ---------- New conversation modal ----------

interface NewConvModalProps {
  onClose: () => void
  onCreated: (conv: ConversationDTO) => void
}

function NewConvModal({ onClose, onCreated }: NewConvModalProps) {
  const { t } = useTranslation()
  const store = useChatStore()
  const [users, setUsers] = useState<SysUserDTO[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [name, setName] = useState('')
  const [type, setType] = useState<'DIRECT' | 'GROUP'>('DIRECT')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    usersApi.getAll(1, 100).then(res => setUsers(res.data))
  }, [])


  function toggle(id: number) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  async function submit() {
    if (selected.length === 0) return
    setSaving(true)
    try {
      const conv = await store.createConversation({
        type,
        name: type === 'GROUP' ? name || undefined : undefined,
        memberIds: selected,
      })
      onCreated(conv)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-5 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">{t('chat.newConversation')}</h2>
          <button className="text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer p-1" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex gap-2">
          {(['DIRECT', 'GROUP'] as const).map(t2 => (
            <button
              key={t2}
              onClick={() => { setType(t2); setSelected([]) }}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${
                type === t2 ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
              }`}
            >
              {t2 === 'DIRECT' ? t('chat.direct') : t('chat.group')}
            </button>
          ))}
        </div>

        {type === 'GROUP' && (
          <input
            type="text"
            placeholder={t('chat.groupNamePlaceholder')}
            value={name}
            onChange={e => setName(e.target.value)}
            className="h-9 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
          />
        )}

        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {users.map(u => (
            <label key={u.id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type={type === 'DIRECT' ? 'radio' : 'checkbox'}
                name="user"
                checked={selected.includes(u.id)}
                onChange={() => {
                  if (type === 'DIRECT') setSelected([u.id])
                  else toggle(u.id)
                }}
                className="accent-indigo-600"
              />
              <Avatar name={u.name} size="sm" />
              <span className="text-sm text-slate-700">{u.name}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={submit}
            disabled={selected.length === 0 || saving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer border-0"
          >
            {saving ? t('common.saving') : t('chat.start')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------- Conversation list ----------

interface ConvListProps {
  conversations: ConversationDTO[]
  activeId: number | null
  onSelect: (id: number) => void
  onNew: () => void
  loading: boolean
  currentUserId: number | undefined
  userMap: Record<number, string>
  convMembers: Record<number, number[]>
  unreadCounts: Record<number, number>
  mutedIds: number[]
}

function ConvList({ conversations, activeId, onSelect, onNew, loading, currentUserId, userMap, convMembers, unreadCounts, mutedIds }: ConvListProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h1 className="font-bold text-slate-800 text-base">{t('chat.title')}</h1>
        <button
          onClick={onNew}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 border-0 cursor-pointer"
          title={t('chat.newConversation')}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center text-slate-400 text-sm py-10">{t('common.loading')}</div>
        ) : conversations.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-10">{t('chat.noConversations')}</div>
        ) : (
          conversations.map(c => {
            const cName = resolveConvName(c, convMembers, userMap, currentUserId)
            const isMe = c.lastMessage?.senderId === currentUserId
            const senderName = !isMe && c.lastMessage
              ? userMap[c.lastMessage.senderId] ?? null
              : null
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left border-0 cursor-pointer transition-colors ${
                  c.id === activeId ? 'bg-indigo-50' : 'bg-white hover:bg-slate-50'
                }`}
              >
                <Avatar name={cName} src={c.avatar} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-sm truncate ${unreadCounts[c.id] > 0 ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'}`}>{cName}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {mutedIds.includes(c.id) ? (
                        <svg className="w-3 h-3 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M13.73 21a2 2 0 01-3.46 0M18.63 13A17.89 17.89 0 0118 8M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14M18 8a6 6 0 00-9.33-5" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : unreadCounts[c.id] > 0 && (
                        <span className="text-[10px] bg-indigo-600 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-medium">
                          {unreadCounts[c.id] > 99 ? '99+' : unreadCounts[c.id]}
                        </span>
                      )}
                      {c.lastMessage && (
                        <span className="text-[11px] text-slate-400">
                          {timeLabel(c.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  {c.lastMessage && (
                    <p className="text-xs text-slate-500 truncate">
                      {isMe
                        ? `${t('chat.you')}: `
                        : senderName
                          ? `${senderName}: `
                          : ''}
                      {c.lastMessage.content}
                    </p>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

// ---------- Reminder modal ----------

function tomorrowAt9am(): number {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(9, 0, 0, 0)
  return d.getTime()
}

interface ReminderModalProps {
  msg: MessageDTO
  onClose: () => void
  onSet: (remindAt: number) => void
}

function ReminderModal({ msg, onClose, onSet }: ReminderModalProps) {
  const { t } = useTranslation()
  const [custom, setCustom] = useState('')
  const [minDatetime] = useState(() => new Date(Date.now() + 60_000).toISOString().slice(0, 16))

  const presets: { label: string; getAt: () => number }[] = [
    { label: t('chat.reminderIn20m'),    getAt: () => Date.now() + 20 * 60 * 1000 },
    { label: t('chat.reminderIn1h'),     getAt: () => Date.now() + 60 * 60 * 1000 },
    { label: t('chat.reminderIn3h'),     getAt: () => Date.now() + 3 * 60 * 60 * 1000 },
    { label: t('chat.reminderTomorrow'), getAt: tomorrowAt9am },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-5 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
            {t('chat.setReminder')}
          </h2>
          <button className="text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer p-1" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {msg.content && (
          <div className="px-3 py-2 bg-slate-50 rounded-lg text-xs text-slate-500 line-clamp-2 border-l-2 border-slate-300">
            {msg.content}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {presets.map(p => (
            <button
              key={p.label}
              onClick={() => onSet(p.getAt())}
              className="w-full py-2 px-3 text-sm text-left rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 cursor-pointer transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-500">{t('chat.reminderCustom')}</label>
          <input
            type="datetime-local"
            value={custom}
            min={minDatetime}
            onChange={e => setCustom(e.target.value)}
            className="h-9 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => custom && onSet(new Date(custom).getTime())}
            disabled={!custom}
            className="py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 border-0 cursor-pointer transition-colors"
          >
            {t('chat.reminderSet')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------- Message bubble ----------

interface MessageBubbleProps {
  msg: MessageDTO
  isMe: boolean
  senderName: string | undefined
  replyToMsg: MessageDTO | undefined
  replyToSenderName: string | undefined
  onEdit: (id: number, content: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onReply: (msg: MessageDTO) => void
  onRemind: (msg: MessageDTO) => void
}

function MessageBubble({ msg, isMe, senderName, replyToMsg, replyToSenderName, onEdit, onDelete, onReply, onRemind }: MessageBubbleProps) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(msg.content ?? '')
  const editRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) {
      editRef.current?.focus()
      editRef.current?.select()
    }
  }, [editing])

  async function handleEditSave() {
    const trimmed = editText.trim()
    if (!trimmed || trimmed === msg.content) { setEditing(false); return }
    await onEdit(msg.id, trimmed)
    setEditing(false)
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSave() }
    if (e.key === 'Escape') { setEditing(false); setEditText(msg.content ?? '') }
  }

  const replyBtn = (
    <button
      onClick={() => onReply(msg)}
      className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
      title={t('chat.reply')}
    >
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" />
        <path d="M13 21l-4-4 4-4" />
        <path d="M9 17h8a2 2 0 002-2v-3" />
      </svg>
    </button>
  )

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-1 group`}>
      {!isMe && senderName && (
        <span className="text-[11px] text-slate-400 ml-1 mb-0.5">{senderName}</span>
      )}
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full`}>
        {/* Own message actions: reply + remind + edit + delete on the left */}
        {isMe && !msg.deleted && !editing && (
          <div className="flex items-center gap-1 mr-2 self-center opacity-0 group-hover:opacity-100 transition-opacity">
            {replyBtn}
            <button
              onClick={() => onRemind(msg)}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
              title={t('chat.setReminder')}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
            </button>
            <button
              onClick={() => { setEditText(msg.content ?? ''); setEditing(true) }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
              title={t('common.edit')}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(msg.id)}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors"
              title={t('common.delete')}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            </button>
          </div>
        )}

        {editing ? (
          <div className="max-w-[75%] flex flex-col gap-1">
            <textarea
              ref={editRef}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={handleEditKeyDown}
              rows={2}
              className="px-3 py-2 border border-indigo-400 rounded-2xl text-sm outline-none resize-none leading-relaxed"
            />
            <div className="flex gap-1.5 justify-end">
              <button
                onClick={() => { setEditing(false); setEditText(msg.content ?? '') }}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 bg-white cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleEditSave}
                className="px-2.5 py-1 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 border-0 cursor-pointer"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
              isMe
                ? 'bg-indigo-600 text-white rounded-br-sm'
                : 'bg-white text-slate-800 shadow-sm rounded-bl-sm'
            }`}
          >
            {replyToMsg && (
              <div className={`text-xs px-2 py-1.5 mb-1.5 rounded-lg border-l-2 ${
                isMe ? 'bg-indigo-500/30 border-indigo-300' : 'bg-slate-100 border-slate-300'
              }`}>
                <div className={`font-medium mb-0.5 truncate ${isMe ? 'text-indigo-200' : 'text-slate-600'}`}>
                  {replyToSenderName ?? '…'}
                </div>
                <div className={`truncate ${isMe ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {replyToMsg.deleted ? <em>{t('chat.messageDeleted')}</em> : replyToMsg.content}
                </div>
              </div>
            )}
            {msg.deleted ? (
              <em className="opacity-60">{t('chat.messageDeleted')}</em>
            ) : (
              msg.content
            )}
            <div className={`text-[10px] mt-0.5 ${isMe ? 'text-indigo-200 text-right' : 'text-slate-400'}`}>
              {timeLabel(msg.createdAt)}
              {msg.editedAt && ' · edited'}
            </div>
          </div>
        )}

        {/* Others' message actions: reply + remind on the right */}
        {!isMe && !msg.deleted && !editing && (
          <div className="flex items-center gap-1 ml-2 self-center opacity-0 group-hover:opacity-100 transition-opacity">
            {replyBtn}
            <button
              onClick={() => onRemind(msg)}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
              title={t('chat.setReminder')}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------- Message panel ----------

// ---------- Members panel ----------

interface MembersPanelProps {
  memberIds: number[]
  userMap: Record<number, string>
  currentUserId: number | undefined
  onClose: () => void
}

function MembersPanel({ memberIds, userMap, currentUserId, onClose }: MembersPanelProps) {
  const { t } = useTranslation()
  return (
    <div className="w-56 shrink-0 border-l border-slate-100 bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <span className="text-sm font-semibold text-slate-700">{t('chat.members')} ({memberIds.length})</span>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {memberIds.map(id => {
          const name = userMap[id] ?? `User #${id}`
          const isMe = id === currentUserId
          return (
            <div key={id} className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50">
              <Avatar name={name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-700 truncate">{name}</div>
                {isMe && (
                  <div className="text-[10px] text-indigo-500 font-medium">{t('chat.you')}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------- Message panel ----------

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

function MsgPanel({
  conversation, messages, loading, hasMore, connected, isTyping,
  currentUserId, userMap, convMembers, isMuted, onLoadMore, onSend, onTyping, onEdit, onDelete, onToggleMute,
}: MsgPanelProps) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [replyingTo, setReplyingTo] = useState<MessageDTO | null>(null)
  const [reminderTarget, setReminderTarget] = useState<MessageDTO | null>(null)
  const [showMembers, setShowMembers] = useState(false)
  const store = useChatStore()
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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
        {/* Typing indicator */}
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
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.messagePlaceholder')}
            rows={1}
            className="flex-1 resize-none px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 leading-relaxed overflow-y-auto"
            style={{ minHeight: '40px', maxHeight: '128px' }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 border-0 cursor-pointer shrink-0 transition-colors"
          >
            <svg className="w-4 h-4 translate-x-px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22 11 13 2 9l20-7z" />
            </svg>
          </button>
        </div>
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

// ---------- Root view ----------

export function ChatView() {
  const store = useChatStore()
  const auth = useAuthStore()
  const toast = useToastStore()
  const [showNewConv, setShowNewConv] = useState(false)
  const [showMobileConvList, setShowMobileConvList] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const typingClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentUserIdRef = useRef(auth.profile?.id)

  const currentUserId = auth.profile?.id
  const convIds = useMemo(() => store.conversations.map(c => c.id), [store.conversations])

  useEffect(() => { currentUserIdRef.current = currentUserId }, [currentUserId])

  const handleMessage = useCallback((msg: MessageDTO) => {
    store.addRealtimeMessage(msg)
  }, [])

  const handleTypingEvent = useCallback((event: TypingEvent) => {
    if (event.userId === currentUserIdRef.current) return
    if (typingClearTimer.current) clearTimeout(typingClearTimer.current)
    if (event.typing) {
      setIsTyping(true)
      typingClearTimer.current = setTimeout(() => setIsTyping(false), 3000)
    } else {
      typingClearTimer.current = null
      setIsTyping(false)
    }
  }, [])

  const { connected, sendTyping } = useChatSocket(store.activeId, convIds, handleMessage, handleTypingEvent)

  useEffect(() => { store.fetchConversations() }, [])

  useEffect(() => {
    function check() {
      const now = Date.now()
      for (const r of store.reminders) {
        if (r.remindAt <= now) {
          toast.add(`🔔 ${r.preview || '…'}`, 'info', 8000)
          store.dismissReminder(r.id)
        }
      }
    }
    check()
    const id = setInterval(check, 30_000)
    return () => clearInterval(id)
  }, [store.reminders, store, toast])

  const activeConv = store.conversations.find(c => c.id === store.activeId)

  async function handleSelect(id: number) {
    setIsTyping(false)
    await store.selectConversation(id)
    setShowMobileConvList(false)
  }

  function handleLoadMore() {
    store.fetchMessages(store.msgPage + 1)
  }

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* Conversation list — always visible on md+, toggled on mobile */}
      <div className={`w-full md:w-72 lg:w-80 border-r border-slate-100 bg-white shrink-0 flex flex-col ${showMobileConvList ? 'flex' : 'hidden md:flex'}`}>
        <ConvList
          conversations={store.conversations}
          activeId={store.activeId}
          onSelect={handleSelect}
          onNew={() => setShowNewConv(true)}
          loading={store.loadingConv}
          currentUserId={currentUserId}
          userMap={store.userMap}
          convMembers={store.convMembers}
          unreadCounts={store.unreadCounts}
          mutedIds={store.mutedIds}
        />
      </div>

      {/* Message panel */}
      <div className={`flex-1 flex flex-col min-w-0 ${showMobileConvList && !store.activeId ? 'hidden md:flex' : 'flex'}`}>
        {/* Mobile back button */}
        {store.activeId && (
          <button
            className="md:hidden flex items-center gap-1.5 px-4 py-2 text-sm text-indigo-600 bg-white border-b border-slate-100 border-0 cursor-pointer"
            onClick={() => setShowMobileConvList(true)}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back
          </button>
        )}
        <MsgPanel
          conversation={activeConv}
          messages={store.messages}
          loading={store.loadingMsgs}
          hasMore={store.hasMore}
          connected={connected}
          isTyping={isTyping}
          currentUserId={currentUserId}
          userMap={store.userMap}
          convMembers={store.convMembers}
          onLoadMore={handleLoadMore}
          onSend={store.sendMessage}
          onTyping={sendTyping}
          onEdit={store.editMessage}
          onDelete={store.deleteMessage}
          isMuted={store.activeId !== null && store.mutedIds.includes(store.activeId)}
          onToggleMute={() => store.activeId !== null && store.toggleMute(store.activeId)}
        />
      </div>

      {showNewConv && (
        <NewConvModal
          onClose={() => setShowNewConv(false)}
          onCreated={conv => {
            setShowNewConv(false)
            handleSelect(conv.id)
          }}
        />
      )}
    </div>
  )
}
