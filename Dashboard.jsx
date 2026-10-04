import { Link } from 'react-router-dom'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { flatItems } from '../config/menu'
import { useAuth } from '../context/AuthContext'

function salam(profile) {
  if (profile.role === 'guru') {
    const sapaan = profile.jenis_kelamin === 'Perempuan' ? 'Ibu' : 'Bapak'
    return `Selamat datang ${sapaan} ${profile.nama_lengkap}`
  }
  if (profile.role === 'admin') return 'Selamat datang, Admin'
  return `Selamat datang, ${profile.nama_lengkap}`
}

export default function Dashboard() {
  const { profile } = useAuth()
  const role = profile.role
  const items = flatItems(role).filter((i) => i.path)

  return (
    <div>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-900 p-6 text-white shadow-lift sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-cyan-300/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <p className="relative flex items-center gap-2 text-sm font-medium text-brand-100">
          <Sparkles className="h-4 w-4" /> SETLAND · Himpunan Kelas 7
        </p>
        <h1 className="relative mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{salam(profile)}</h1>
        <p className="relative mt-2 max-w-xl text-sm text-brand-100 sm:text-base">
          Pilih menu di sidebar atau pintasan di bawah untuk memulai.
        </p>
      </div>

      <h2 className="mb-4 mt-8 text-sm font-semibold uppercase tracking-wider text-slate-400">Pintasan</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => {
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={`/${role}/${item.path}`}
              style={{ animationDelay: `${i * 50}ms` }}
              className="card group animate-fade-up p-5 transition duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-brand-600" />
              </div>
              <h3 className="mt-4 font-bold text-slate-900">{item.label}</h3>
              <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
