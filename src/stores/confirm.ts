import { create } from 'zustand'

interface ConfirmState {
  show: boolean
  message: string
  onConfirm: () => void
  open: (message: string, onConfirm: () => void) => void
  close: () => void
}

export const useConfirmStore = create<ConfirmState>((set) => ({
  show: false,
  message: '',
  onConfirm: () => {},

  open(message, onConfirm) {
    set({ show: true, message, onConfirm })
  },

  close() {
    set({ show: false, onConfirm: () => {} })
  },
}))
