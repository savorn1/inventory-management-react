import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useOrderStore } from './store'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/hooks/useToast'
import { AppTable, AppPagination, AppButton, AppBadge } from '@/components/ui'
import type { BadgeVariant } from '@/components/ui'

function statusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = { PENDING: 'warning', CONFIRMED: 'warning', SHIPPED: 'success', DELIVERED: 'success', CANCELLED: 'danger' }
  return map[status] ?? 'warning'
}

function paymentVariant(status: string): BadgeVariant {
  return status === 'PAID' ? 'success' : status === 'PARTIAL' ? 'warning' : 'danger'
}

function fmt(n: number) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function OrderView() {
  const { t } = useTranslation()
  const store    = useOrderStore()
  const auth     = useAuthStore()
  const navigate = useNavigate()
  const toast    = useToast()

  useEffect(() => { store.fetchAll(1, 10) }, [])

  async function removeOrder(id: number) {
    if (!confirm('Delete this order?')) return
    try {
      await store.remove(id)
      toast.add('Order deleted successfully.')
    } catch {
      toast.add('Failed to delete order. Please try again.', 'error')
    }
  }

  return (
    <div className="p-4 md:p-7 flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={store.search}
          onChange={e => store.searchOrders(e.target.value)}
          className="h-9 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 flex-1 min-w-0 max-w-xs placeholder:text-slate-400"
          placeholder={t('order.searchPlaceholder')}
        />
        {auth.can('ORDER_CREATE') && (
          <AppButton onClick={() => navigate('/orders/create')}>+ {t('order.addTitle')}</AppButton>
        )}
      </div>

      <AppTable
        head={<>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-10">#</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('order.orderNo')}</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('order.client')}</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('order.orderDate')}</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('order.status')}</th>
          <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">{t('order.total')}</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('order.paymentStatus')}</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('common.actions')}</th>
        </>}
        body={
          store.loading ? (
            <tr><td colSpan={8} className="text-center text-slate-400 py-12">{t('common.loading')}</td></tr>
          ) : store.items.length === 0 ? (
            <tr><td colSpan={8} className="text-center text-slate-400 py-12">{t('order.noData')}</td></tr>
          ) : store.items.map((item, idx) => (
            <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 text-slate-400">{(store.page - 1) * store.size + idx + 1}</td>
              <td className="px-4 py-3 font-mono text-sm font-semibold text-indigo-700">{item.orderNo}</td>
              <td className="px-4 py-3 text-slate-700 font-medium">{item.clientName}</td>
              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{item.orderDate ? item.orderDate.slice(0, 10) : '—'}</td>
              <td className="px-4 py-3"><AppBadge variant={statusVariant(item.status)}>{item.status}</AppBadge></td>
              <td className="px-4 py-3 text-right font-semibold text-slate-800">${fmt(item.total)}</td>
              <td className="px-4 py-3"><AppBadge variant={paymentVariant(item.paymentStatus)}>{item.paymentStatus}</AppBadge></td>
              <td className="px-4 py-3">
                {auth.can('ORDER_DELETE') && (
                  <AppButton variant="delete" size="sm" onClick={() => removeOrder(item.id)}>{t('common.delete')}</AppButton>
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
    </div>
  )
}
