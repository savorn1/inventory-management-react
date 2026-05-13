import { useState } from 'react'
import { useToast } from './useToast'

export function useCrud<T extends { id: number }, F extends object>(options: {
  add: (payload: F) => Promise<void>
  update: (id: number, payload: F) => Promise<void>
  remove: (id: number) => Promise<void>
  defaultForm: () => F
  toForm: (item: T) => F
  label: string
}) {
  const toast = useToast()
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<F>(options.defaultForm)

  function openAdd() {
    setEditingId(null)
    setForm(options.defaultForm())
    setShowModal(true)
  }

  function openEdit(item: T) {
    setEditingId(item.id)
    setForm(options.toForm(item))
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
  }

  function setField<K extends keyof F>(key: K, value: F[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const label = options.label.charAt(0).toUpperCase() + options.label.slice(1)

  async function save() {
    setSaving(true)
    try {
      if (editingId !== null) {
        await options.update(editingId, { ...form })
        toast.add(`${label} updated successfully.`)
      } else {
        await options.add({ ...form })
        toast.add(`${label} created successfully.`)
      }
      setShowModal(false)
    } catch {
      toast.add(`Failed to save ${options.label}. Please try again.`, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: number) {
    if (!confirm(`Delete this ${options.label}?`)) return
    try {
      await options.remove(id)
      toast.add(`${label} deleted successfully.`)
    } catch {
      toast.add(`Failed to delete ${options.label}. Please try again.`, 'error')
    }
  }

  return { showModal, editingId, form, saving, openAdd, openEdit, closeModal, setField, save, remove }
}
