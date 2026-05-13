import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useConfirmStore } from '@/stores/confirm'
import { AppButton } from './AppButton'

export function AppConfirmModal() {
  const { t } = useTranslation()
  const { show, message, onConfirm, close } = useConfirmStore()

  if (!show) return null

  function handleConfirm() {
    onConfirm()
    close()
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) close() }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-5 flex flex-col gap-4">
          <p className="text-sm text-slate-700">{message}</p>
          <div className="flex justify-end gap-2">
            <AppButton variant="cancel" type="button" onClick={close}>{t('common.cancel')}</AppButton>
            <AppButton variant="delete" type="button" onClick={handleConfirm}>{t('common.delete')}</AppButton>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
