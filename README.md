# SETLAND — E-learning Himpunan Kelas 7

Stack: React + Vite + Tailwind CSS + React Router · Supabase (PostgreSQL, Auth, Storage, RLS) · Recharts · SheetJS · Vercel.

Status: **Modul 1** (setup + database + autentikasi) selesai. Menu lain berupa halaman "Segera hadir" sampai modulnya dikerjakan.

## Struktur folder

```
setland/
├── public/favicon.svg
├── supabase/
│   ├── schema.sql          # tabel + fungsi + trigger + RLS + Storage
│   └── seed_admin.sql      # akun admin
├── src/
│   ├── main.jsx
│   ├── App.jsx             # daftar route per peran
│   ├── index.css
│   ├── config/menu.js      # menu sidebar tiap peran
│   ├── context/AuthContext.jsx
│   ├── lib/supabase.js
│   ├── components/         # Layout, ProtectedRoute, AuthShell, Logo, ui
│   └── pages/              # RolePicker, Login, Register, Dashboard, Placeholder
├── .env.example  .gitignore  vercel.json
├── index.html  package.json  vite.config.js  tailwind.config.js  postcss.config.js
```

## 1. Jalankan di komputer

Prasyarat: Node.js 18+ (disarankan 20), VSCode, Git.

```bash
npm install
cp .env.example .env     # Windows: copy .env.example .env
# isi .env (langkah 2), lalu:
npm run dev
```

Buka http://localhost:5173

## 2. Setup Supabase

1. Buat akun & project baru di https://supabase.com (simpan password database).
2. **Authentication → Providers → Email**: matikan **Confirm email** (akun diverifikasi lewat ACC admin).
3. **SQL Editor → New query**: tempel isi `supabase/schema.sql` → **Run**. Lalu tempel `supabase/seed_admin.sql` → **Run**.
4. **Project Settings → API**: salin **Project URL** dan **anon public key** ke `.env`:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
5. Uji: pilih **Admin** → nama `admin`, email `adminsetland@gmail.com`, password `12345`.
   Segera ganti password admin (Authentication → Users).

Uji registrasi: daftar sebagai siswa/guru → akun berstatus `menunggu` dan tidak bisa masuk. Sampai Modul 2 selesai, ACC manual lewat SQL Editor:

```sql
update public.profiles set status = 'aktif' where email = 'email_peserta@contoh.com';
```

## 3. Push ke GitHub

```bash
git init
git add .
git commit -m "Modul 1: setup, database, autentikasi"
git branch -M main
git remote add origin https://github.com/USERNAME/setland.git
git push -u origin main
```

Pastikan `.env` tidak ikut ter-commit (sudah ada di `.gitignore`).

## 4. Deploy ke Vercel

1. https://vercel.com → **Add New → Project** → import repo `setland`.
2. Framework: **Vite** (terdeteksi otomatis). Build: `npm run build`, output: `dist`.
3. **Environment Variables**: isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
4. **Deploy**. Setiap `git push` ke `main` akan otomatis ter-deploy.
5. Supabase → **Authentication → URL Configuration**: isi **Site URL** dengan domain Vercel Anda.

## Catatan keamanan & desain

- Hak akses ditegakkan di database lewat RLS. Role/status tidak bisa diubah pengguna sendiri (trigger `protect_profile`); role `admin` tidak bisa dibuat lewat registrasi.
- Akses berjenjang (Latihan butuh LKPD terkumpul, Evaluasi butuh Latihan terkumpul) dan jendela waktu mulai–selesai dicek di database memakai jam server (`siswa_boleh_akses`). Aturan "dikerjakan" = ada minimal satu tugas jenis sebelumnya yang sudah dikumpulkan.
- Kunci jawaban ada di tabel terpisah `soal_kunci` (khusus guru/admin) supaya tidak terbaca siswa.
- Kolom penilaian AI/guru pada `jawaban` tidak bisa diisi siswa (trigger `protect_jawaban`).
- Kunci rahasia (`SUPABASE_SERVICE_ROLE_KEY`, `AI_API_KEY`) hanya untuk fungsi server (Modul 2 & 5), tidak pernah dengan awalan `VITE_`.
- Tambah peserta langsung dari web (Modul 2) memerlukan fungsi server karena membuat akun Auth butuh service role.
