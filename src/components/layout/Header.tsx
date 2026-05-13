import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth'
import { initials } from '@/utils/format'

const pageTitleKeys: Record<string, string> = {
  '/dashboard':  'nav.dashboard',
  '/categories': 'nav.categories',
  '/products':   'nav.products',
  '/brands':     'nav.brands',
  '/suppliers':  'nav.suppliers',
  '/clients':    'nav.clients',
  '/users':      'nav.users',
  '/roles':      'nav.roles',
  '/orders':     'nav.orders',
}

interface Props {
  onToggleSidebar: () => void
}

export function Header({ onToggleSidebar }: Props) {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const auth = useAuthStore()

  function toggleLocale() {
    const next = i18n.language === 'en' ? 'zh' : 'en'
    i18n.changeLanguage(next)
    localStorage.setItem('locale', next)
  }

  async function handleLogout() {
    await auth.logout()
    navigate('/login')
  }

  const titleKey = pageTitleKeys[location.pathname]

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-7 shrink-0">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border-0 bg-transparent cursor-pointer"
          onClick={onToggleSidebar}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg md:text-xl font-bold text-slate-800 m-0">
          {titleKey ? t(titleKey) : 'Admin'}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors bg-transparent cursor-pointer"
          onClick={toggleLocale}
        >
          {i18n.language === 'en' ? '中文' : 'EN'}
        </button>

        {auth.profile && (
          <span className="hidden sm:block text-sm text-slate-500 font-medium">
            {auth.profile.username}
          </span>
        )}

        <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {auth.profile ? initials(auth.profile.username) : 'A'}
        </div>

        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors border-0 bg-transparent cursor-pointer"
          title={t('auth.logout')}
          onClick={handleLogout}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">{t('auth.logout')}</span>
        </button>
      </div>
    </header>
  )
}
