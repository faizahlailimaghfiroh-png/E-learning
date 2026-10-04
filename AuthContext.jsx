import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export const ROLE_LABEL = { siswa: 'Siswa', guru: 'Guru', admin: 'Admin' }

function pesanError(error) {
  const m = (error?.message || '').toLowerCase()
  if (m.includes('invalid login credentials')) return 'Email atau password salah.'
  if (m.includes('email not confirmed'))
    return 'Email belum terkonfirmasi. Matikan "Confirm email" di Supabase (lihat README).'
  if (m.includes('already registered') || m.includes('already been registered')) return 'Email ini sudah terdaftar.'
  if (m.includes('password should be at least')) return 'Password minimal 6 karakter.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.'
  if (m.includes('failed to fetch') || m.includes('network')) return 'Tidak dapat terhubung ke server. Periksa koneksi internet.'
  return error?.message || 'Terjadi kesalahan. Coba lagi.'
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  // true saat login()/register() berjalan, agar pemuat profil otomatis tidak ikut campur
  const busy = useRef(false)

  // 1) Pantau sesi Supabase
  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      if (!data.session) setLoading(false)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (!s) {
        setProfile(null)
        setLoading(false)
      }
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  // 2) Muat profil saat sesi ada (mis. refresh halaman). Hanya akun berstatus "aktif" yang diterima.
  const userId = session?.user?.id
  useEffect(() => {
    if (!userId || busy.current) return
    let active = true
    setLoading(true)
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return
        if (data && data.status === 'aktif') {
          setProfile(data)
        } else {
          setProfile(null)
          if (data) supabase.auth.signOut() // akun belum/tidak aktif → keluarkan
        }
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [userId])

  const login = useCallback(async ({ role, nama, email, password }) => {
    busy.current = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) throw new Error(pesanError(error))

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle()

      const tolak = async (msg) => {
        await supabase.auth.signOut()
        throw new Error(msg)
      }
      if (!prof) return await tolak('Profil akun tidak ditemukan. Hubungi admin.')
      if (prof.role !== role)
        return await tolak(`Akun ini terdaftar sebagai ${ROLE_LABEL[prof.role]}. Pilih peran yang sesuai di halaman awal.`)
      if (prof.nama_lengkap.trim().toLowerCase() !== nama.trim().toLowerCase())
        return await tolak('Nama lengkap tidak sesuai dengan data akun.')
      if (prof.status === 'menunggu')
        return await tolak('Akun Anda masih menunggu persetujuan (ACC) admin. Silakan coba lagi nanti.')
      if (prof.status === 'ditolak') return await tolak('Registrasi akun Anda ditolak oleh admin.')
      if (prof.status === 'nonaktif') return await tolak('Akun Anda dinonaktifkan. Hubungi admin.')

      setProfile(prof)
      return prof
    } finally {
      busy.current = false
    }
  }, [])

  const register = useCallback(async (v) => {
    busy.current = true
    try {
      const { data, error } = await supabase.auth.signUp({
        email: v.email.trim(),
        password: v.password,
        options: {
          data: {
            nama_lengkap: v.nama_lengkap.trim(),
            tanggal_lahir: v.tanggal_lahir,
            jenis_kelamin: v.jenis_kelamin,
            role: v.role,
          },
        },
      })
      if (error) throw new Error(pesanError(error))
      // Email yang sudah terdaftar: Supabase mengembalikan user tanpa identities
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0)
        throw new Error('Email ini sudah terdaftar.')
      // Jika "Confirm email" dimatikan, signUp langsung membuat sesi → akhiri, tunggu ACC admin
      if (data.session) await supabase.auth.signOut()
    } finally {
      busy.current = false
    }
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const value = useMemo(
    () => ({ session, profile, loading, login, register, logout }),
    [session, profile, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx
}
