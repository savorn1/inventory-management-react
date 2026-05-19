import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { MessageDTO } from '@/api/chat.api'
import { timeLabel } from '../utils'

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

export function MessageBubble({ msg, isMe, senderName, replyToMsg, replyToSenderName, onEdit, onDelete, onReply, onRemind }: MessageBubbleProps) {
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
