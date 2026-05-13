import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { AppToast } from '@/components/ui/AppToast'
import { useAuthStore } from '@/stores/auth'

export function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const auth     = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      navigate('/login', { replace: true })
      return
    }
    if (!auth.profile) {
      auth.fetchProfile()
    }
  }, [location.pathname])

  return (
    <>
      <AppToast />
      <div className="flex min-h-screen bg-slate-100">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex flex-col flex-1 min-w-0">
          <Header onToggleSidebar={() => setSidebarOpen(s => !s)} />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  )
}
