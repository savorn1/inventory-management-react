import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth'

export function LoginView() {
  const { t }    = useTranslation()
  const navigate = useNavigate()
  const auth     = useAuthStore()

  const [form, setForm]     = useState({ name: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await auth.login(form.name, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-900">InvenAdmin</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-1">{t('auth.signIn')}</h1>
        <p className="text-sm text-slate-500 mb-6">{t('auth.subtitle')}</p>

        <form className="flex flex-col gap-4" onSubmit={submit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">{t('auth.username')}</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors"
              placeholder={t('auth.username')}
              autoComplete="username"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">{t('auth.password')}</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors"
              placeholder={t('auth.password')}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm transition-colors cursor-pointer border-0 mt-1"
          >
            {loading ? t('auth.loggingIn') : t('auth.signIn')}
          </button>
        </form>
      </div>
    </div>
  )
}
