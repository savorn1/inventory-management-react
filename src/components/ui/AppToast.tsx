import { createPortal } from 'react-dom'
import { useToast } from '@/hooks/useToast'

const icons = { success: '✓', error: '✕', info: 'i' }
const styles = { success: 'bg-emerald-500', error: 'bg-red-500', info: 'bg-indigo-500' }

export function AppToast() {
  const { toasts, remove } = useToast()

  return createPortal(
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 min-w-[260px] max-w-xs px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${styles[toast.type]}`}
        >
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
            {icons[toast.type]}
          </span>
          <span className="flex-1">{toast.message}</span>
          <button
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity text-base leading-none bg-transparent border-0 text-white cursor-pointer"
            onClick={() => remove(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>,
    document.body
  )
}
