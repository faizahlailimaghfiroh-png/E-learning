import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { TriangleAlert } from 'lucide-react'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { PageHeader } from './components/ui'
import { flatItems, menus } from './config/menu'
import { configured } from './lib/supabase'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Placeholder from './pages/Placeholder'
import Register from './pages/Register'
import RolePicker from './pages/RolePicker'

function SetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card max-w-lg p-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <TriangleAlert className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Supabase belum dikonfigurasi</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Salin <code className="rounded bg-slate-100 px-1.5 py-0.5">.env.example</code> menjadi{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5">.env</code>, isi{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5">VITE_SUPABASE_URL</code> dan{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5">VITE_SUPABASE_ANON_KEY</code>, lalu jalankan ulang{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5">npm run dev</code>.
        </p>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div>
      <PageHeader title="Halaman tidak ditemukan" subtitle="Alamat yang Anda buka tidak tersedia." />
      <Link to="/" className="btn btn-primary">
        Kembali
      </Link>
    </div>
  )
}

export default function App() {
  if (!configured) return <SetupNotice />

  return (
    <Routes>
      <Route path="/" element={<RolePicker />} />
      <Route path="/login/:role" element={<Login />} />
      <Route path="/daftar/:role" element={<Register />} />

      {Object.keys(menus).map((role) => (
        <Route
          key={role}
          path={`/${role}`}
          element={
            <ProtectedRoute roles={[role]}>
              <Layout role={role} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          {flatItems(role)
            .filter((item) => item.path)
            .map((item) => (
              <Route key={item.path} path={item.path} element={<Placeholder item={item} />} />
            ))}
          <Route path="*" element={<NotFound />} />
        </Route>
      ))}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
