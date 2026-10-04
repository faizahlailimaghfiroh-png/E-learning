import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Logo from './Logo'

export default function AuthShell({ title, subtitle, backTo = '/', backLabel = 'Ganti peran', children }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-cyan-200/60 blur-3xl" />

      <div className="relative w-full max-w-md animate-fade-up">
        <Link to={backTo} className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>

        <div className="card p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <Logo size={40} />
            <div>
              <p className="text-xs font-semibold tracking-widest text-brand-600">SETLAND</p>
              <h1 className="text-xl font-bold text-slate-900">{title}</h1>
            </div>
          </div>
          {subtitle && <p className="-mt-3 mb-6 text-sm text-slate-500">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  )
}
