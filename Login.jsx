import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import { Alert, Field, Spinner } from '../components/ui'
import { ROLE_LABEL, useAuth } from '../context/AuthContext'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const { role } = useParams()
  const { login, profile, loading } = useAuth()
  const [form, setForm] = useState({ nama: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)

  if (!ROLE_LABEL[role]) return <Navigate to="/" replace />
  if (!loading && profile) return <Navigate to={`/${profile.role}`} replace />

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setErrors((er) => ({ ...er, [k]: undefined }))
  }

  function validate() {
    const er = {}
    if (!form.nama.trim()) er.nama = 'Nama lengkap wajib diisi.'
    if (!form.email.trim()) er.email = 'Email wajib diisi.'
    else if (!EMAIL_RE.test(form.email.trim())) er.email = 'Format email tidak valid.'
    if (!form.password) er.password = 'Password wajib diisi.'
    return er
  }

  async function onSubmit(e) {
    e.preventDefault()
    setServerError('')
    const er = validate()
    setErrors(er)
    if (Object.keys(er).length) return

    setBusy(true)
    try {
      await login({ role, nama: form.nama, email: form.email, password: form.password })
      // Berhasil → AuthContext mengisi profil → halaman ini otomatis diarahkan ke dashboard peran
    } catch (err) {
      setServerError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title={`Masuk sebagai ${ROLE_LABEL[role]}`} subtitle="Masukkan data akun Anda untuk melanjutkan.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {serverError && <Alert>{serverError}</Alert>}

        <Field label="Nama lengkap" htmlFor="nama" error={errors.nama}>
          <input
            id="nama"
            type="text"
            autoComplete="name"
            value={form.nama}
            onChange={set('nama')}
            placeholder="Nama lengkap sesuai registrasi"
            className={`input ${errors.nama ? 'input-error' : ''}`}
            disabled={busy}
          />
        </Field>

        <Field label="Email" htmlFor="email" error={errors.email}>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={form.email}
            onChange={set('email')}
            placeholder="nama@email.com"
            className={`input ${errors.email ? 'input-error' : ''}`}
            disabled={busy}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password}>
          <div className="relative">
            <input
              id="password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              value={form.password}
              onChange={set('password')}
              placeholder="Password"
              className={`input pr-11 ${errors.password ? 'input-error' : ''}`}
              disabled={busy}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-600"
              aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <button type="submit" className="btn btn-primary w-full" disabled={busy}>
          {busy ? <Spinner className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
          {busy ? 'Memproses…' : 'Masuk'}
        </button>

        {role !== 'admin' && (
          <p className="pt-1 text-center text-sm text-slate-500">
            Belum punya akun?{' '}
            <Link to={`/daftar/${role}`} className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
              Registrasi dulu
            </Link>
          </p>
        )}
      </form>
    </AuthShell>
  )
}
