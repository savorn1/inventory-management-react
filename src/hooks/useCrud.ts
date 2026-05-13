import { useState } from 'react'
import { useToast } from './useToast'
import { useConfirmStore } from '@/stores/confirm'

export type FormErrors<F> = Partial<Record<keyof F, string>>

export function useCrud<T extends { id: number }, F extends object>(options: {
  add: (payload: F) => Promise<void>
  update: (id: number, payload: F) => Promise<void>
  remove: (id: number) => Promise<void>
  defaultForm: () => F
  toForm: (item: T) => F
  label: string
  validate?: (form: F) => FormErrors<F>
}) {
  const toast = useToast()
  const confirm = useConfirmStore()
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<F>(options.defaultForm)
  const [errors, setErrors] = useState<FormErrors<F>>({})

  function openAdd() {
    setEditingId(null)
    setForm(options.defaultForm())
    setErrors({})
    setShowModal(true)
  }

  function openEdit(item: T) {
    setEditingId(item.id)
    setForm(options.toForm(item))
    setErrors({})
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setErrors({})
  }

  function setField<K extends keyof F>(key: K, value: F[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const label = options.label.charAt(0).toUpperCase() + options.label.slice(1)

  async function save() {
    if (options.validate) {
      const validationErrors = options.validate(form)
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }
    }

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
    } catch (err) {
      toast.add(err instanceof Error ? err.message : `Failed to save ${options.label}.`, 'error')
    } finally {
      setSaving(false)
    }
  }

  function remove(id: number) {
    confirm.open(`Delete this ${options.label}?`, async () => {
      try {
        await options.remove(id)
        toast.add(`${label} deleted successfully.`)
      } catch (err) {
        toast.add(err instanceof Error ? err.message : `Failed to delete ${options.label}.`, 'error')
      }
    })
  }

  return { showModal, editingId, form, errors, saving, openAdd, openEdit, closeModal, setField, save, remove }
}
