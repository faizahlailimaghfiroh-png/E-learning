import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { ROLE_LABEL, useAuth } from '../context/AuthContext'
import { menus } from '../config/menu'
import Logo from './Logo'
import { ConfirmDialog } from './ui'

export default function Layout({ role }) {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [confirmOut, setConfirmOut] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const linkTo = (p) => (p ? `/${role}/${p}` : `/${role}`)
  const nama = profile?.nama_lengkap || ''
  const initial = nama.trim().charAt(0).toUpperCase() || '?'

  async function doLogout() {
    setLoggingOut(true)
    await logout()
    setLoggingOut(false)
    setConfirmOut(false)
    navigate('/', { replace: true })
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <Logo size={34} />
        <div>
          <p className="text-base font-extrabold tracking-wide text-slate-900">SETLAND</p>
          <p className="text-[11px] text-slate-500">Panel {ROLE_LABEL[role]}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4" aria-label="Navigasi utama">
        {menus[role].groups.map((g, gi) => (
          <div key={gi}>
            {g.title && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{g.title}</p>
            )}
            <ul className="space-y-1">
              {g.items.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.path || 'home'}>
                    <NavLink
                      to={linkTo(item.path)}
                      end={!item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                          isActive
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
                        }`
                      }
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">{nama}</p>
            <p className="text-xs text-slate-500">{ROLE_LABEL[role]}</p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmOut(true)}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
            aria-label="Keluar"
            title="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:pl-72">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-white lg:block">{sidebar}</aside>

      {/* Drawer mobile */}
      <div className={`fixed inset-0 z-40 lg:hidden ${open ? '' : 'pointer-events-none'}`}>
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-3 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
          {sidebar}
        </aside>
      </div>

      {/* Top bar mobile */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Logo size={28} />
        <span className="text-base font-extrabold tracking-wide text-slate-900">SETLAND</span>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div key={location.pathname} className="animate-fade-up">
          <Outlet />
        </div>
      </main>

      <ConfirmDialog
        open={confirmOut}
        title="Keluar dari SETLAND"
        message="Apakah anda yakin ingin keluar?"
        confirmText="Ya, keluar"
        danger
        loading={loggingOut}
        onConfirm={doLogout}
        onCancel={() => setConfirmOut(false)}
      />
    </div>
  )
}
