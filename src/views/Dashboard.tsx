import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCategoryStore } from '@/features/categories/store'
import { useProductStore } from '@/features/products/store'
import { useBrandStore } from '@/features/brands/store'
import { useSupplierStore } from '@/features/suppliers/store'
import { useClientStore } from '@/features/clients/store'
import { useUserStore } from '@/features/users/store'
import { useRoleStore } from '@/features/roles/store'

const stats = [
  { labelKey: 'nav.categories', storeKey: 'categories', bg: 'bg-indigo-50', iconColor: 'text-indigo-600', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', link: '/categories' },
  { labelKey: 'nav.products',   storeKey: 'products',   bg: 'bg-teal-50',   iconColor: 'text-teal-600',   icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',                                                           link: '/products' },
  { labelKey: 'nav.brands',     storeKey: 'brands',     bg: 'bg-orange-50', iconColor: 'text-orange-500', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', link: '/brands' },
  { labelKey: 'nav.suppliers',  storeKey: 'suppliers',  bg: 'bg-purple-50', iconColor: 'text-purple-600', icon: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',   link: '/suppliers' },
  { labelKey: 'nav.clients',    storeKey: 'clients',    bg: 'bg-red-50',    iconColor: 'text-red-500',    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', link: '/clients' },
  { labelKey: 'nav.users',      storeKey: 'users',      bg: 'bg-sky-50',    iconColor: 'text-sky-600',    icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z', link: '/users' },
  { labelKey: 'nav.roles',      storeKey: 'roles',      bg: 'bg-amber-50',  iconColor: 'text-amber-600',  icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', link: '/roles' },
]

export function Dashboard() {
  const { t } = useTranslation()
  const categoryStore = useCategoryStore()
  const productStore  = useProductStore()
  const brandStore    = useBrandStore()
  const supplierStore = useSupplierStore()
  const clientStore   = useClientStore()
  const userStore     = useUserStore()
  const roleStore     = useRoleStore()

  useEffect(() => {
    Promise.all([
      categoryStore.fetchAll(1, 1),
      productStore.fetchAll(1, 1),
      brandStore.fetchAll(1, 1),
      supplierStore.fetchAll(1, 1),
      clientStore.fetchAll(1, 1),
      userStore.fetchAll(1, 1),
      roleStore.fetchAll(1, 1),
    ])
  }, [])

  const counts: Record<string, number> = {
    categories: categoryStore.totalCount,
    products:   productStore.totalCount,
    brands:     brandStore.totalCount,
    suppliers:  supplierStore.totalCount,
    clients:    clientStore.totalCount,
    users:      userStore.totalCount,
    roles:      roleStore.totalCount,
  }

  return (
    <div className="p-4 md:p-7 flex flex-col gap-5 md:gap-7">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
        {stats.map(stat => (
          <Link
            key={stat.labelKey}
            to={stat.link}
            className="bg-white rounded-xl p-5 md:p-6 flex items-center gap-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 no-underline"
          >
            <div className={`${stat.bg} ${stat.iconColor} w-12 h-12 rounded-xl flex items-center justify-center shrink-0`}>
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={stat.icon} />
              </svg>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-none mb-1">{counts[stat.storeKey]}</p>
              <p className="text-sm text-slate-500 font-medium">{t(stat.labelKey)}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-6 md:p-8 text-white">
        <h2 className="text-xl md:text-2xl font-bold mb-2">{t('dashboard.welcome')}</h2>
        <p className="text-sm text-indigo-100 leading-relaxed max-w-xl">{t('dashboard.welcomeDesc')}</p>
      </div>
    </div>
  )
}
