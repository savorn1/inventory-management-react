import { useRef, useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth'
import { initials } from '@/utils/format'

const PAGE_TITLE_KEYS: Record<string, string> = {
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

const LOCALES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'zh', label: '中文', name: '中文' },
  { code: 'kh', label: 'ខ្មែរ', name: 'ខ្មែរ' },
]

interface Props {
  onToggleSidebar: () => void
}

function GlobeIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

export function Header({ onToggleSidebar }: Props) {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const auth = useAuthStore()

  const [localeOpen, setLocaleOpen] = useState(false)
  const localeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (localeRef.current && !localeRef.current.contains(e.target as Node)) {
        setLocaleOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function selectLocale(code: string) {
    i18n.changeLanguage(code)
    localStorage.setItem('locale', code)
    setLocaleOpen(false)
  }

  async function handleLogout() {
    await auth.logout()
    navigate('/login')
  }

  const titleKey = PAGE_TITLE_KEYS[location.pathname]
  const currentLocale = LOCALES.find(l => l.code === i18n.language) ?? LOCALES[0]

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-7 shrink-0">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border-0 bg-transparent cursor-pointer"
          onClick={onToggleSidebar}
        >
          <MenuIcon />
        </button>
        <h1 className="text-lg md:text-xl font-bold text-slate-800 m-0">
          {titleKey ? t(titleKey) : 'Admin'}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={localeRef}>
          <button
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors bg-transparent cursor-pointer"
            onClick={() => setLocaleOpen(o => !o)}
          >
            <GlobeIcon />
            {currentLocale.label}
            <ChevronIcon open={localeOpen} />
          </button>

          {localeOpen && (
            <div className="absolute right-0 mt-1.5 w-32 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
              {LOCALES.map(locale => (
                <button
                  key={locale.code}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-left transition-colors border-0 cursor-pointer
                    ${locale.code === i18n.language
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  onClick={() => selectLocale(locale.code)}
                >
                  <span className="font-semibold w-8 shrink-0">{locale.label}</span>
                  <span className="text-slate-400">{locale.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

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
          <LogoutIcon />
          <span className="hidden sm:inline">{t('auth.logout')}</span>
        </button>
      </div>
    </header>
  )
}
