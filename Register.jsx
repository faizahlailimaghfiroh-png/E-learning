import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { CheckCircle2, Eye, EyeOff, UserPlus } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import { Alert, Field, Spinner } from '../components/ui'
import { ROLE_LABEL, useAuth } from '../context/AuthContext'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const TAHUN_INI = new Date().getFullYear()
const TAHUN = Array.from({ length: 81 }, (_, i) => TAHUN_INI - i)
const HARI = Array.from({ length: 31 }, (_, i) => i + 1)

function tanggalValid(d, m, y) {
  if (!d || !m || !y) return false
  const dt = new Date(Number(y), Number(m) - 1, Number(d))
  return (
    dt.getFullYear() === Number(y) &&
    dt.getMonth() === Number(m) - 1 &&
    dt.getDate() === Number(d) &&
    dt <= new Date()
  )
}

export default function Register() {
  const { role } = useParams()
  const { register, profile, loading } = useAuth()
  const [form, setForm] = useState({
    nama: '', d: '', m: '', y: '', jk: '', email: '', password: '', konfirmasi: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [show, setShow] = useState(false)

  if (role === 'admin') return <Navigate to="/login/admin" replace />
  if (!ROLE_LABEL[role]) return <Navigate to="/" replace />
  if (!loading && profile) return <Navigate to={`/${profile.role}`} replace />

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setErrors((er) => ({ ...er, [k]: undefined, ...(k === 'd' || k === 'm' || k === 'y' ? { tgl: undefined } : {}) }))
  }

  function validate() {
    const er = {}
    if (!form.nama.trim()) er.nama = 'Nama lengkap wajib diisi.'
    else if (form.nama.trim().length < 3) er.nama = 'Nama lengkap minimal 3 karakter.'
    if (!tanggalValid(form.d, form.m, form.y)) er.tgl = 'Pilih tanggal, bulan, dan tahun lahir yang valid.'
    if (!form.jk) er.jk = 'Pilih jenis kelamin.'
    if (!form.email.trim()) er.email = 'Email wajib diisi.'
    else if (!EMAIL_RE.test(form.email.trim())) er.email = 'Format email tidak valid.'
    if (!form.password) er.password = 'Password wajib diisi.'
    else if (form.password.length < 6) er.password = 'Password minimal 6 karakter.'
    if (!form.konfirmasi) er.konfirmasi = 'Konfirmasi password wajib diisi.'
    else if (form.konfirmasi !== form.password) er.konfirmasi = 'Konfirmasi password tidak sama.'
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
      await register({
        role,
        nama_lengkap: form.nama,
        tanggal_lahir: `${form.y}-${String(form.m).padStart(2, '0')}-${String(form.d).padStart(2, '0')}`,
        jenis_kelamin: form.jk,
        email: form.email,
        password: form.password,
      })
      setDone(true)
    } catch (err) {
      setServerError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <AuthShell title="Registrasi berhasil" backTo={`/login/${role}`} backLabel="Ke halaman masuk">
        <div className="flex flex-col items-center py-2 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            Akun Anda berstatus <b>menunggu</b>. Anda baru bisa masuk setelah admin menyetujui (ACC) registrasi ini.
          </p>
          <Link to={`/login/${role}`} className="btn btn-primary mt-6 w-full">
            Kembali ke halaman masuk
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={`Registrasi ${ROLE_LABEL[role]}`}
      subtitle="Lengkapi data berikut. Akun aktif setelah disetujui admin."
      backTo={`/login/${role}`}
      backLabel="Kembali ke masuk"
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {serverError && <Alert>{serverError}</Alert>}

        <Field label="Nama lengkap" htmlFor="nama" error={errors.nama}>
          <input
            id="nama" type="text" autoComplete="name" value={form.nama} onChange={set('nama')}
            placeholder="Nama lengkap"
            className={`input ${errors.nama ? 'input-error' : ''}`} disabled={busy}
          />
        </Field>

        <Field label="Tanggal lahir" htmlFor="tgl-d" error={errors.tgl}>
          <div className="grid grid-cols-[1fr_1.6fr_1.2fr] gap-2">
            <select id="tgl-d" aria-label="Tanggal" value={form.d} onChange={set('d')} className={`input ${errors.tgl ? 'input-error' : ''}`} disabled={busy}>
              <option value="">Tgl</option>
              {HARI.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
            <select aria-label="Bulan" value={form.m} onChange={set('m')} className={`input ${errors.tgl ? 'input-error' : ''}`} disabled={busy}>
              <option value="">Bulan</option>
              {BULAN.map((b, i) => <option key={b} value={i + 1}>{b}</option>)}
            </select>
            <select aria-label="Tahun" value={form.y} onChange={set('y')} className={`input ${errors.tgl ? 'input-error' : ''}`} disabled={busy}>
              <option value="">Tahun</option>
              {TAHUN.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </Field>

        <Field label="Jenis kelamin" error={errors.jk}>
          <div className="grid grid-cols-2 gap-2">
            {['Laki-laki', 'Perempuan'].map((g) => (
              <label
                key={g}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition ${
                  form.jk === g
                    ? 'border-brand-500 bg-brand-50 text-brand-700 ring-4 ring-brand-100'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                }`}
              >
                <input
                  type="radio" name="jk" value={g} checked={form.jk === g} onChange={set('jk')}
                  className="accent-brand-600" disabled={busy}
                />
                {g}
              </label>
            ))}
          </div>
        </Field>

        <Field label="Email" htmlFor="email" error={errors.email}>
          <input
            id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')}
            placeholder="nama@email.com"
            className={`input ${errors.email ? 'input-error' : ''}`} disabled={busy}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password} hint="Minimal 6 karakter.">
          <div className="relative">
            <input
              id="password" type={show ? 'text' : 'password'} autoComplete="new-password"
              value={form.password} onChange={set('password')} placeholder="Password"
              className={`input pr-11 ${errors.password ? 'input-error' : ''}`} disabled={busy}
            />
            <button
              type="button" onClick={() => setShow((s) => !s)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-600"
              aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <Field label="Konfirmasi password" htmlFor="konfirmasi" error={errors.konfirmasi}>
          <input
            id="konfirmasi" type={show ? 'text' : 'password'} autoComplete="new-password"
            value={form.konfirmasi} onChange={set('konfirmasi')} placeholder="Ulangi password"
            className={`input ${errors.konfirmasi ? 'input-error' : ''}`} disabled={busy}
          />
        </Field>

        <button type="submit" className="btn btn-primary w-full" disabled={busy}>
          {busy ? <Spinner className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {busy ? 'Mendaftarkan…' : 'Daftar'}
        </button>
      </form>
    </AuthShell>
  )
}
