import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useCategoryStore } from './store'
import { useAuthStore } from '@/stores/auth'
import { useCrud } from '@/hooks/useCrud'
import { AppTable, AppPagination, AppModal, AppButton } from '@/components/ui'
import type { CategoryDTO } from '@/api/categories.api'

export function CategoryView() {
  const { t } = useTranslation()
  const store = useCategoryStore()
  const auth  = useAuthStore()

  useEffect(() => { store.fetchAll(1, 10) }, [store.fetchAll])

  const { showModal, form, errors, saving, openAdd, closeModal, setField, save, remove } =
    useCrud<CategoryDTO, { name: string; description: string }>({
      add: store.add,
      update: async () => {},
      remove: store.remove,
      defaultForm: () => ({ name: '', description: '' }),
      toForm: item => ({ name: item.name, description: item.description }),
      label: 'category',
      validate: f => {
        const e: Record<string, string> = {}
        if (!f.name.trim()) e.name = t('validation.required')
        else if (f.name.trim().length < 2) e.name = t('validation.minLength', { min: 2 })
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
          placeholder={t('category.searchPlaceholder')}
        />
        {auth.can('CATEGORY_CREATE') && (
          <AppButton onClick={openAdd}>+ {t('category.addTitle')}</AppButton>
        )}
      </div>

      <AppTable
        head={<>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-10">#</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('common.name')}</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('common.description')}</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('common.actions')}</th>
        </>}
        body={
          store.loading ? (
            <tr><td colSpan={4} className="text-center text-slate-400 py-12">{t('common.loading')}</td></tr>
          ) : store.items.length === 0 ? (
            <tr><td colSpan={4} className="text-center text-slate-400 py-12">{t('category.noData')}</td></tr>
          ) : store.items.map((item, idx) => (
            <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 text-slate-400">{(store.page - 1) * store.size + idx + 1}</td>
              <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{item.name}</td>
              <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{item.description || '—'}</td>
              <td className="px-4 py-3">
                {auth.can('CATEGORY_DELETE') && (
                  <AppButton variant="delete" size="sm" onClick={() => remove(item.id)}>{t('common.delete')}</AppButton>
                )}
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

      <AppModal show={showModal} title={t('category.addTitle')} onClose={closeModal}>
        <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); save() }}>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">{t('category.name')} *</label>
            <input value={form.name} onChange={e => setField('name', e.target.value)}
              className={`px-3 py-2 border rounded-lg text-sm outline-none ${errors.name ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-indigo-500'}`}
              placeholder={t('category.namePlaceholder')} />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">{t('category.description')}</label>
            <textarea value={form.description} onChange={e => setField('description', e.target.value)} rows={3}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 resize-y font-sans"
              placeholder={t('category.descriptionPlaceholder')} />
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <AppButton variant="cancel" type="button" onClick={closeModal}>{t('common.cancel')}</AppButton>
            <AppButton variant="primary" type="submit" disabled={saving}>
              {saving ? t('common.saving') : t('common.add')}
            </AppButton>
          </div>
        </form>
      </AppModal>
    </div>
  )
}
