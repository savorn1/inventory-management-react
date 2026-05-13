import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastState {
  toasts: Toast[]
  add: (message: string, type?: ToastType, duration?: number) => void
  remove: (id: number) => void
}

let nextId = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  add(message: string, type: ToastType = 'success', duration = 3000) {
    const id = ++nextId
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), duration)
  },

  remove(id: number) {
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
  },
}))

export function useToast() {
  const { toasts, add, remove } = useToastStore()
  return { toasts, add, remove }
}
