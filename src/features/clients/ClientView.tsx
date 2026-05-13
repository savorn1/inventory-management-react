import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useClientStore } from './store'
import { useAuthStore } from '@/stores/auth'
import { useCrud } from '@/hooks/useCrud'
import { AppTable, AppPagination, AppModal, AppButton } from '@/components/ui'
import { initials } from '@/utils/format'
import type { ClientDTO, ClientPayload } from '@/api/clients.api'

export function ClientView() {
  const { t } = useTranslation()
  const store = useClientStore()
  const auth  = useAuthStore()

  useEffect(() => { store.fetchAll(1, 10) }, [])

  const { showModal, editingId, form, errors, saving, openAdd, openEdit, closeModal, setField, save, remove } =
    useCrud<ClientDTO, ClientPayload>({
      add: store.add,
      update: store.update,
      remove: store.remove,
      defaultForm: () => ({ name: '', email: '', phone: '', gender: '', address: '' }),
      toForm: item => ({ name: item.name, email: item.email, phone: item.phone, gender: item.gender, address: item.address }),
      label: 'client',
      validate: f => {
        const e: Record<string, string> = {}
        if (!f.name.trim()) e.name = t('validation.required')
        else if (f.name.trim().length < 2) e.name = t('validation.minLength', { min: 2 })
        if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = t('validation.emailInvalid')
        if (f.phone && !/^[+\d\s\-()]{6,20}$/.test(f.phone)) e.phone = t('validation.phoneInvalid')
        return e
      },
    })

  return (
    <div className="p-4 md:p-7 flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={store.search}
          onChange={e => store.searchByName(e.target.value)}
          className="h-9 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 flex-1 min-w-0 max-w-xs placeholder:text-slate-400"
          placeholder={t('client.searchPlaceholder')}
        />
        {auth.can('CLIENT_CREATE') && (
          <AppButton onClick={openAdd} className='ml-auto'>+ {t('client.addTitle')}</AppButton>
        )}
      </div>

      <AppTable
        head={<>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-10">#</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('client.name')}</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('client.email')}</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('client.phone')}</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('client.gender')}</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('client.address')}</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('common.actions')}</th>
        </>}
        body={
          store.loading ? (
            <tr><td colSpan={7} className="text-center text-slate-400 py-12">{t('common.loading')}</td></tr>
          ) : store.items.length === 0 ? (
            <tr><td colSpan={7} className="text-center text-slate-400 py-12">{t('client.noData')}</td></tr>
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
              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{item.email || '—'}</td>
              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{item.phone || '—'}</td>
              <td className="px-4 py-3 text-slate-500 whitespace-nowrap capitalize">{item.gender || '—'}</td>
              <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">{item.address || '—'}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  {auth.can('CLIENT_UPDATE') && <AppButton variant="edit" size="sm" onClick={() => openEdit(item)}>{t('common.edit')}</AppButton>}
                  {auth.can('CLIENT_DELETE') && <AppButton variant="delete" size="sm" onClick={() => remove(item.id)}>{t('common.delete')}</AppButton>}
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

      <AppModal show={showModal} title={editingId ? t('client.editTitle') : t('client.addTitle')} onClose={closeModal}>
        <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); save() }}>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">{t('client.name')} *</label>
            <input value={form.name} onChange={e => setField('name', e.target.value)}
              className={`px-3 py-2 border rounded-lg text-sm outline-none ${errors.name ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-indigo-500'}`}
              placeholder={t('client.namePlaceholder')} />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">{t('client.email')}</label>
              <input value={form.email} onChange={e => setField('email', e.target.value)}
                className={`px-3 py-2 border rounded-lg text-sm outline-none ${errors.email ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-indigo-500'}`}
                placeholder={t('client.emailPlaceholder')} />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">{t('client.phone')}</label>
              <input value={form.phone} onChange={e => setField('phone', e.target.value)}
                className={`px-3 py-2 border rounded-lg text-sm outline-none ${errors.phone ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-indigo-500'}`}
                placeholder={t('client.phonePlaceholder')} />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">{t('client.gender')}</label>
            <select value={form.gender} onChange={e => setField('gender', e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white">
              <option value="">{t('common.select')}</option>
              <option value="male">{t('client.genderMale')}</option>
              <option value="female">{t('client.genderFemale')}</option>
              <option value="other">{t('client.genderOther')}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">{t('client.address')}</label>
            <textarea value={form.address} onChange={e => setField('address', e.target.value)} rows={2}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 resize-y font-sans"
              placeholder={t('client.addressPlaceholder')} />
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <AppButton variant="cancel" type="button" onClick={closeModal}>{t('common.cancel')}</AppButton>
            <AppButton variant="primary" type="submit" disabled={saving}>
              {saving ? t('common.saving') : (editingId ? t('common.update') : t('common.add'))}
            </AppButton>
          </div>
        </form>
      </AppModal>
    </div>
  )
}
