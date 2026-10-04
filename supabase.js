import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// true jika file .env sudah diisi
export const configured = Boolean(url && key)

// Hanya anon key yang boleh ada di frontend. Hak akses dijaga oleh RLS di database.
export const supabase = createClient(url || 'http://localhost', key || 'anon-key-belum-diisi', {
  auth: { persistSession: true, autoRefreshToken: true },
})
