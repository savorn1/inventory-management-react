import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useUserStore } from './store'
import { useRoleStore } from '@/features/roles/store'
import { useAuthStore } from '@/stores/auth'
import { AppTable, AppPagination, AppModal, AppButton } from '@/components/ui'
import { initials } from '@/utils/format'

export function UserView() {
  const { t } = useTranslation()
  const store     = useUserStore()
  const roleStore = useRoleStore()
  const auth      = useAuthStore()

  useEffect(() => {
    Promise.all([store.fetchAll(1, 10), roleStore.fetchAll(1, 100)])
  }, [])

  const [showModal, setShowModal]     = useState(false)
  const [editingId, setEditingId]     = useState<number | null>(null)
  const [saving, setSaving]           = useState(false)
  const [loadingUser, setLoadingUser] = useState(false)

  const defaultForm = () => ({ name: '', password: '', status: 'ACTIVE', roleIds: [] as number[] })
  const [form, setForm] = useState(defaultForm())

  function openAdd() {
    setEditingId(null)
    setForm(defaultForm())
    setShowModal(true)
  }

  async function openEdit(id: number) {
    setEditingId(id)
    setForm(defaultForm())
    setLoadingUser(true)
    setShowModal(true)
    try {
      const res = await store.getById(id)
      const item = res.data
      setForm({ name: item.name, password: '', status: item.status, roleIds: item.roleIds ?? [] })
    } finally {
      setLoadingUser(false)
    }
  }

  async function save() {
    setSaving(true)
    try {
      if (editingId !== null) {
        const payload: { name: string; password?: string; status: string; roleIds: number[] } = { name: form.name, status: form.status, roleIds: form.roleIds }
        if (form.password) payload.password = form.password
        await store.update(editingId, payload)
      } else {
        const newUser = await store.add({ name: form.name, password: form.password, status: form.status })
        if (form.roleIds.length && newUser?.id) {
          await store.update(newUser.id, { name: newUser.name, status: newUser.status, roleIds: form.roleIds })
        }
      }
      setShowModal(false)
    } finally {
      setSaving(false)
    }
  }

  function toggleRole(id: number) {
    setForm(f => ({
      ...f,
      roleIds: f.roleIds.includes(id) ? f.roleIds.filter(r => r !== id) : [...f.roleIds, id],
    }))
  }

  function getRoleNames(roleIds: number[]) {
    if (!roleIds?.length) return []
    return roleStore.items.filter(r => roleIds.includes(r.id)).map(r => r.name)
  }

  return (
    <div className="p-4 md:p-7 flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={store.search}
          onChange={e => store.searchByName(e.target.value)}
          className="h-9 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 flex-1 min-w-0 max-w-xs placeholder:text-slate-400"
          placeholder={t('user.searchPlaceholder')}
        />
        <select
          value={store.statusFilter}
          onChange={e => store.filterByStatus(e.target.value)}
          className="h-9 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white"
        >
          <option value="">{t('common.allStatus')}</option>
          <option value="ACTIVE">{t('status.active')}</option>
          <option value="INACTIVE">{t('status.inactive')}</option>
        </select>
        {auth.can('USER_CREATE') && (
          <AppButton onClick={openAdd}>+ {t('user.addTitle')}</AppButton>
        )}
      </div>

      <AppTable
        head={<>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-10">#</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('user.username')}</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('user.roles')}</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('common.status')}</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('common.actions')}</th>
        </>}
        body={
          store.loading ? (
            <tr><td colSpan={5} className="text-center text-slate-400 py-12">{t('common.loading')}</td></tr>
          ) : store.items.length === 0 ? (
            <tr><td colSpan={5} className="text-center text-slate-400 py-12">{t('user.noData')}</td></tr>
          ) : store.items.map((item, idx) => (
            <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 text-slate-400">{(store.page - 1) * store.size + idx + 1}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {initials(item.name)}
                  </div>
                  <span className="font-semibold text-slate-800 whitespace-nowrap">{item.name}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {getRoleNames(item.roleIds ?? []).length ? (
                    getRoleNames(item.roleIds ?? []).map(name => (
                      <span key={name} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{name}</span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-sm">—</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${item.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {item.status === 'ACTIVE' ? t('status.active') : t('status.inactive')}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  {auth.can('USER_UPDATE') && <AppButton variant="edit" size="sm" onClick={() => openEdit(item.id)}>{t('common.edit')}</AppButton>}
                  {auth.can('USER_DELETE') && <AppButton variant="delete" size="sm" onClick={() => store.remove(item.id)}>{t('common.delete')}</AppButton>}
                </div>
              </td>
            </tr>
          ))
        }
      />

      <AppPagination
        page={store.page} totalPages={store.totalPages} totalCount={store.totalCount}
        size={store.size} loading={store.loading}
        onChange={store.goToPage} onSizeChange={store.changeSize}
      />

      <AppModal show={showModal} title={editingId ? t('user.editTitle') : t('user.addTitle')} onClose={() => setShowModal(false)}>
        {loadingUser ? (
          <div className="py-10 text-center text-slate-400 text-sm">{t('common.loading')}</div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); save() }}>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">{t('user.username')} *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                placeholder={t('user.usernamePlaceholder')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">
                {t('user.password')} {editingId ? t('user.passwordKeep') : '*'}
              </label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required={!editingId}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                placeholder={t('user.passwordPlaceholder')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">{t('user.status')} *</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} required
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white">
                <option value="ACTIVE">{t('status.active')}</option>
                <option value="INACTIVE">{t('status.inactive')}</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-600">{t('user.roles')}</label>
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
                {roleStore.items.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-slate-400">{t('user.noRoles')}</div>
                ) : roleStore.items.map(role => (
                  <label key={role.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-indigo-600"
                      checked={form.roleIds.includes(role.id)}
                      onChange={() => toggleRole(role.id)} />
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-sm text-slate-700">{role.name}</span>
                      <span className="font-mono text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{role.code}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-1">
              <AppButton variant="cancel" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</AppButton>
              <AppButton variant="primary" type="submit" disabled={saving}>
                {saving ? t('common.saving') : (editingId ? t('common.update') : t('common.add'))}
              </AppButton>
            </div>
          </form>
        )}
      </AppModal>
    </div>
  )
}
