import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useRoleStore } from './store'
import { useAuthStore } from '@/stores/auth'
import { AppTable, AppPagination, AppModal, AppButton } from '@/components/ui'
import type { RoleDTO } from '@/api/roles.api'

export function RoleView() {
  const { t } = useTranslation()
  const store = useRoleStore()
  const auth  = useAuthStore()

  useEffect(() => {
    Promise.all([store.fetchAll(1, 10), store.fetchAllPermissions()])
  }, [])

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving]       = useState(false)

  const defaultForm = () => ({ name: '', code: '', isDefault: false, description: '', permissionIds: [] as number[] })
  const [form, setForm] = useState(defaultForm())

  function openAdd() {
    setEditingId(null)
    setForm(defaultForm())
    setShowModal(true)
  }

  function openEdit(item: RoleDTO) {
    setEditingId(item.id)
    setForm({ name: item.name, code: item.code, isDefault: item.isDefault, description: item.description ?? '', permissionIds: item.permissions?.map(p => p.id) ?? [] })
    setShowModal(true)
  }

  async function save() {
    setSaving(true)
    try {
      if (editingId !== null) {
        await store.update(editingId, { ...form })
      } else {
        await store.add({ ...form })
      }
      setShowModal(false)
    } finally {
      setSaving(false)
    }
  }

  function togglePermission(id: number) {
    setForm(f => ({
      ...f,
      permissionIds: f.permissionIds.includes(id) ? f.permissionIds.filter(p => p !== id) : [...f.permissionIds, id],
    }))
  }

  const permissionsByModule = useMemo(() => {
    const map = new Map<string, typeof store.allPermissions>()
    for (const p of store.allPermissions) {
      if (!map.has(p.module)) map.set(p.module, [])
      map.get(p.module)!.push(p)
    }
    return map
  }, [store.allPermissions])

  function isModuleAllChecked(module: string) {
    const perms = permissionsByModule.get(module) ?? []
    return perms.every(p => form.permissionIds.includes(p.id))
  }

  function toggleModule(module: string) {
    const perms = permissionsByModule.get(module) ?? []
    if (isModuleAllChecked(module)) {
      setForm(f => ({ ...f, permissionIds: f.permissionIds.filter(id => !perms.some(p => p.id === id)) }))
    } else {
      const toAdd = perms.map(p => p.id).filter(id => !form.permissionIds.includes(id))
      setForm(f => ({ ...f, permissionIds: [...f.permissionIds, ...toAdd] }))
    }
  }

  return (
    <div className="p-4 md:p-7 flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={store.search}
          onChange={e => store.searchByName(e.target.value)}
          className="h-9 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 flex-1 min-w-0 max-w-xs placeholder:text-slate-400"
          placeholder={t('role.searchPlaceholder')}
        />
        {auth.can('ROLE_CREATE') && (
          <AppButton onClick={openAdd}>+ {t('role.addTitle')}</AppButton>
        )}
      </div>

      <AppTable
        head={<>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-10">#</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('role.name')}</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('role.code')}</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('common.description')}</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('role.permissions')}</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('role.isDefault')}</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('common.actions')}</th>
        </>}
        body={
          store.loading ? (
            <tr><td colSpan={7} className="text-center text-slate-400 py-12">{t('common.loading')}</td></tr>
          ) : store.items.length === 0 ? (
            <tr><td colSpan={7} className="text-center text-slate-400 py-12">{t('role.noData')}</td></tr>
          ) : store.items.map((item, idx) => (
            <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 text-slate-400">{(store.page - 1) * store.size + idx + 1}</td>
              <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{item.name}</td>
              <td className="px-4 py-3">
                <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{item.code}</span>
              </td>
              <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{item.description || '—'}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                  {t('role.permissionsSelected', { n: item.permissions?.length ?? 0 })}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${item.isDefault ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                  {item.isDefault ? t('common.yes') : t('common.no')}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  {auth.can('ROLE_UPDATE') && <AppButton variant="edit" size="sm" onClick={() => openEdit(item)}>{t('common.edit')}</AppButton>}
                  {auth.can('ROLE_DELETE') && <AppButton variant="delete" size="sm" onClick={() => store.remove(item.id)}>{t('common.delete')}</AppButton>}
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

      <AppModal show={showModal} title={editingId ? t('role.editTitle') : t('role.addTitle')} onClose={() => setShowModal(false)}>
        <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); save() }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">{t('role.name')} *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                placeholder={t('role.namePlaceholder')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">{t('role.code')} *</label>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 font-mono"
                placeholder={t('role.codePlaceholder')} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">{t('role.description')}</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
              placeholder={t('role.descriptionPlaceholder')} />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" className="w-4 h-4 accent-indigo-600"
              checked={form.isDefault}
              onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} />
            <span className="text-sm text-slate-700">{t('role.isDefault')}</span>
          </label>

          {/* Permissions */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-600">{t('role.permissions')}</label>
            <div className="border border-slate-200 rounded-lg overflow-y-auto max-h-64 divide-y divide-slate-100">
              {Array.from(permissionsByModule.entries()).map(([module, perms]) => (
                <div key={module} className="p-3">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="checkbox" className="w-4 h-4 accent-indigo-600"
                      checked={isModuleAllChecked(module)}
                      onChange={() => toggleModule(module)} />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{module}</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1 pl-6">
                    {perms.map(perm => (
                      <label key={perm.id} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" className="w-3.5 h-3.5 accent-indigo-600"
                          checked={form.permissionIds.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)} />
                        <span className="text-xs text-slate-600">{perm.action}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400">{t('role.permissionsSelected', { n: form.permissionIds.length })}</p>
          </div>

          <div className="flex justify-end gap-2 mt-1">
            <AppButton variant="cancel" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</AppButton>
            <AppButton variant="primary" type="submit" disabled={saving}>
              {saving ? t('common.saving') : (editingId ? t('common.update') : t('common.add'))}
            </AppButton>
          </div>
        </form>
      </AppModal>
    </div>
  )
}
