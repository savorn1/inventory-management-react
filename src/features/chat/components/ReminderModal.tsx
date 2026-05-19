import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { MessageDTO } from '@/api/chat.api'

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

export function ReminderModal({ msg, onClose, onSet }: ReminderModalProps) {
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
