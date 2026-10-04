import { Link, Navigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Logo from '../components/Logo'
import { FullPageLoader } from '../components/ui'
import { roleCards } from '../config/menu'
import { useAuth } from '../context/AuthContext'

export default function RolePicker() {
  const { profile, loading } = useAuth()

  if (loading) return <FullPageLoader />
  if (profile) return <Navigate to={`/${profile.role}`} replace />

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-cyan-200/60 blur-3xl" />

      <div className="relative w-full max-w-4xl">
        <div className="mb-10 animate-fade-up text-center">
          <div className="mb-4 flex justify-center">
            <Logo size={64} />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">SETLAND</h1>
          <p className="mt-3 text-base text-slate-500 sm:text-lg">Belajar Himpunan Kelas 7 dengan cara yang menyenangkan.</p>
          <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-brand-600">Masuk sebagai</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {Object.entries(roleCards).map(([key, info], i) => {
            const Icon = info.icon
            return (
              <Link
                key={key}
                to={`/login/${key}`}
                style={{ animationDelay: `${120 + i * 90}ms` }}
                className="card group animate-fade-up p-6 transition duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lift"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">{info.label}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{info.desc}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                  Lanjutkan
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
