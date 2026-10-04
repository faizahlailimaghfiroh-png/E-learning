-- =====================================================================
-- SETLAND — Skema database + Row Level Security (Modul 1)
-- Jalankan SEKALI di Supabase → SQL Editor pada project baru.
-- Setelah itu jalankan supabase/seed_admin.sql.
-- =====================================================================

create extension if not exists pgcrypto;

-- =====================================================================
-- 1. TABEL
-- =====================================================================

create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  nama_lengkap   text not null,
  email          text not null,
  tanggal_lahir  date,
  jenis_kelamin  text check (jenis_kelamin in ('Laki-laki', 'Perempuan')),
  role           text not null default 'siswa' check (role in ('siswa', 'guru', 'admin')),
  status         text not null default 'menunggu' check (status in ('menunggu', 'aktif', 'ditolak', 'nonaktif')),
  created_at     timestamptz not null default now()
);

create table public.materi (
  id            uuid primary key default gen_random_uuid(),
  judul         text not null,
  deskripsi     text,
  youtube_url   text not null,
  dibuat_oleh   uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);

create table public.tugas (
  id            uuid primary key default gen_random_uuid(),
  jenis         text not null check (jenis in ('lkpd', 'latihan', 'evaluasi')),
  judul         text not null,
  deskripsi     text,
  mulai         timestamptz not null,
  selesai       timestamptz not null,
  deadline      timestamptz,
  dibuat_oleh   uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  constraint tugas_waktu_valid check (selesai > mulai)
);

create table public.soal (
  id          uuid primary key default gen_random_uuid(),
  tugas_id    uuid not null references public.tugas (id) on delete cascade,
  nomor       int not null,
  pertanyaan  text not null,
  bobot       numeric not null default 1,
  created_at  timestamptz not null default now(),
  unique (tugas_id, nomor)
);

-- Kunci jawaban dipisah dari tabel soal supaya TIDAK PERNAH terbaca siswa (RLS bekerja per baris).
create table public.soal_kunci (
  soal_id        uuid primary key references public.soal (id) on delete cascade,
  kunci_jawaban  text not null
);

create table public.pengumpulan (
  id            uuid primary key default gen_random_uuid(),
  tugas_id      uuid not null references public.tugas (id) on delete cascade,
  siswa_id      uuid not null references public.profiles (id) on delete cascade,
  status        text not null default 'draft' check (status in ('draft', 'dikumpulkan', 'dinilai_ai', 'dinilai_guru')),
  waktu_mulai   timestamptz not null default now(),
  waktu_kumpul  timestamptz,
  unique (tugas_id, siswa_id)
);

create table public.jawaban (
  id               uuid primary key default gen_random_uuid(),
  pengumpulan_id   uuid not null references public.pengumpulan (id) on delete cascade,
  soal_id          uuid not null references public.soal (id) on delete cascade,
  isi_teks         text,
  file_paths       text[] not null default '{}',   -- path di bucket Storage "jawaban"
  ai_benar         boolean,
  ai_skor          numeric,
  ai_scaffolding   text,
  guru_skor        numeric,
  guru_feedback    text,
  updated_at       timestamptz not null default now(),
  unique (pengumpulan_id, soal_id)
);

create table public.nilai (
  pengumpulan_id  uuid primary key references public.pengumpulan (id) on delete cascade,
  nilai_ai        numeric,
  nilai_akhir     numeric,
  pesan_guru      text,
  dinilai_oleh    uuid references public.profiles (id) on delete set null,
  dinilai_at      timestamptz
);

create table public.pengumuman (
  id           uuid primary key default gen_random_uuid(),
  judul        text not null,
  isi          text not null,
  dibuat_oleh  uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

create table public.log_kecurangan (
  id              uuid primary key default gen_random_uuid(),
  siswa_id        uuid not null references public.profiles (id) on delete cascade,
  tugas_id        uuid not null references public.tugas (id) on delete cascade,
  jam_keluar      timestamptz not null,
  jam_kembali     timestamptz,
  durasi_detik    int,
  created_at      timestamptz not null default now()
);

create index on public.soal (tugas_id);
create index on public.pengumpulan (siswa_id);
create index on public.pengumpulan (tugas_id);
create index on public.jawaban (pengumpulan_id);
create index on public.log_kecurangan (siswa_id);
create index on public.log_kecurangan (tugas_id);

-- =====================================================================
-- 2. FUNGSI BANTU (SECURITY DEFINER agar tidak rekursif dengan RLS)
--    Peran hanya terbaca bila akun berstatus "aktif".
-- =====================================================================

create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and status = 'aktif'
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() = 'admin', false)
$$;

create or replace function public.is_staff()   -- guru atau admin
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('guru', 'admin'), false)
$$;

create or replace function public.is_siswa()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() = 'siswa', false)
$$;

-- Tugas sedang dibuka? (waktu dicek memakai jam SERVER)
create or replace function public.tugas_terbuka(t uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.tugas tg
    where tg.id = t and now() >= tg.mulai and now() <= tg.selesai
  )
$$;

-- Siswa sudah mengumpulkan minimal satu tugas dengan jenis tertentu?
create or replace function public.sudah_kerjakan_jenis(j text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.pengumpulan p
    join public.tugas tg on tg.id = p.tugas_id
    where p.siswa_id = auth.uid() and tg.jenis = j and p.status <> 'draft'
  )
$$;

-- Akses berjenjang + jendela waktu:
--   LKPD    : bebas (selama dibuka)
--   Latihan : terkunci sebelum ada LKPD yang dikumpulkan
--   Evaluasi: terkunci sebelum ada Latihan yang dikumpulkan
create or replace function public.siswa_boleh_akses(t uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_siswa() and exists (
    select 1 from public.tugas tg
    where tg.id = t
      and now() >= tg.mulai and now() <= tg.selesai
      and (
        tg.jenis = 'lkpd'
        or (tg.jenis = 'latihan'  and public.sudah_kerjakan_jenis('lkpd'))
        or (tg.jenis = 'evaluasi' and public.sudah_kerjakan_jenis('latihan'))
      )
  )
$$;

-- Siswa sudah mengumpulkan tugas ini? (boleh membuka kembali untuk belajar)
create or replace function public.sudah_kumpul(t uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.pengumpulan p
    where p.tugas_id = t and p.siswa_id = auth.uid() and p.status <> 'draft'
  )
$$;

-- Pengumpulan milik siswa, masih draft, dan tugasnya masih dibuka?
create or replace function public.pengumpulan_draft_milikku(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.pengumpulan p
    join public.tugas tg on tg.id = p.tugas_id
    where p.id = pid and p.siswa_id = auth.uid() and p.status = 'draft'
      and now() >= tg.mulai and now() <= tg.selesai
  )
$$;

-- Nilai evaluasi baru terlihat siswa setelah guru menetapkan nilai akhir
create or replace function public.boleh_lihat_nilai(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.pengumpulan p
    join public.tugas tg on tg.id = p.tugas_id
    left join public.nilai n on n.pengumpulan_id = p.id
    where p.id = pid and p.siswa_id = auth.uid()
      and (tg.jenis <> 'evaluasi' or n.nilai_akhir is not null)
  )
$$;

-- =====================================================================
-- 3. TRIGGER
-- =====================================================================

-- 3a. Buat profil otomatis saat user mendaftar. Role hanya boleh siswa/guru
--     (admin TIDAK bisa dibuat lewat registrasi) dan status awal "menunggu".
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, nama_lengkap, email, tanggal_lahir, jenis_kelamin, role, status)
  values (
    new.id,
    coalesce(nullif(trim(meta ->> 'nama_lengkap'), ''), split_part(new.email, '@', 1)),
    new.email,
    nullif(meta ->> 'tanggal_lahir', '')::date,
    case when meta ->> 'jenis_kelamin' in ('Laki-laki', 'Perempuan') then meta ->> 'jenis_kelamin' end,
    case when meta ->> 'role' = 'guru' then 'guru' else 'siswa' end,
    'menunggu'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3b. Pengguna biasa tidak boleh mengubah role/status dirinya sendiri.
create or replace function public.protect_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.id is distinct from old.id
       or new.role is distinct from old.role
       or new.status is distinct from old.status then
      raise exception 'Tidak berwenang mengubah id, role, atau status akun.';
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_profile_trg
  before update on public.profiles
  for each row execute function public.protect_profile();

-- 3c. Siswa tidak boleh menulis kolom hasil penilaian AI / guru pada jawaban.
create or replace function public.protect_jawaban()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_staff() then
    if tg_op = 'INSERT' then
      new.ai_benar := null;  new.ai_skor := null;  new.ai_scaffolding := null;
      new.guru_skor := null; new.guru_feedback := null;
    else
      new.ai_benar := old.ai_benar;  new.ai_skor := old.ai_skor;  new.ai_scaffolding := old.ai_scaffolding;
      new.guru_skor := old.guru_skor; new.guru_feedback := old.guru_feedback;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger protect_jawaban_trg
  before insert or update on public.jawaban
  for each row execute function public.protect_jawaban();

-- =====================================================================
-- 4. ROW LEVEL SECURITY
--    Semua tabel dikunci; akses hanya lewat policy di bawah.
--    (Service role di Edge/Serverless Function melewati RLS — dipakai untuk Cek AI.)
-- =====================================================================

alter table public.profiles       enable row level security;
alter table public.materi         enable row level security;
alter table public.tugas          enable row level security;
alter table public.soal           enable row level security;
alter table public.soal_kunci     enable row level security;
alter table public.pengumpulan    enable row level security;
alter table public.jawaban        enable row level security;
alter table public.nilai          enable row level security;
alter table public.pengumuman     enable row level security;
alter table public.log_kecurangan enable row level security;

-- ---------- profiles ----------
create policy "profiles: baca diri sendiri atau staf"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());

create policy "profiles: ubah diri sendiri"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "profiles: admin ubah semua"
  on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "profiles: admin hapus"
  on public.profiles for delete to authenticated
  using (public.is_admin());

-- ---------- materi ----------
create policy "materi: baca semua akun aktif"
  on public.materi for select to authenticated
  using (public.my_role() is not null);

create policy "materi: staf kelola"
  on public.materi for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ---------- tugas ----------
create policy "tugas: baca semua akun aktif"
  on public.tugas for select to authenticated
  using (public.my_role() is not null);

create policy "tugas: staf kelola"
  on public.tugas for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ---------- soal ----------
-- Siswa hanya melihat soal bila tugas sedang dibuka & prasyarat terpenuhi,
-- atau bila sudah mengumpulkan (untuk belajar kembali).
create policy "soal: staf kelola"
  on public.soal for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "soal: siswa baca sesuai akses"
  on public.soal for select to authenticated
  using (public.is_siswa() and (public.siswa_boleh_akses(tugas_id) or public.sudah_kumpul(tugas_id)));

-- ---------- soal_kunci (khusus staf) ----------
create policy "soal_kunci: staf kelola"
  on public.soal_kunci for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ---------- pengumpulan ----------
create policy "pengumpulan: baca milik sendiri atau staf"
  on public.pengumpulan for select to authenticated
  using (siswa_id = auth.uid() or public.is_staff());

create policy "pengumpulan: siswa mulai mengerjakan"
  on public.pengumpulan for insert to authenticated
  with check (
    public.is_siswa()
    and siswa_id = auth.uid()
    and status = 'draft'
    and public.siswa_boleh_akses(tugas_id)
  );

create policy "pengumpulan: siswa kumpulkan (hanya selagi draft & dibuka)"
  on public.pengumpulan for update to authenticated
  using (
    public.is_siswa() and siswa_id = auth.uid()
    and status = 'draft' and public.tugas_terbuka(tugas_id)
  )
  with check (siswa_id = auth.uid() and status in ('draft', 'dikumpulkan'));

create policy "pengumpulan: staf ubah"
  on public.pengumpulan for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "pengumpulan: staf hapus"
  on public.pengumpulan for delete to authenticated
  using (public.is_staff());

-- ---------- jawaban ----------
create policy "jawaban: baca milik sendiri atau staf"
  on public.jawaban for select to authenticated
  using (
    public.is_staff()
    or exists (select 1 from public.pengumpulan p where p.id = pengumpulan_id and p.siswa_id = auth.uid())
  );

create policy "jawaban: siswa isi (selagi draft & dibuka)"
  on public.jawaban for insert to authenticated
  with check (public.is_siswa() and public.pengumpulan_draft_milikku(pengumpulan_id));

create policy "jawaban: siswa ubah (selagi draft & dibuka)"
  on public.jawaban for update to authenticated
  using (public.is_siswa() and public.pengumpulan_draft_milikku(pengumpulan_id))
  with check (public.is_siswa() and public.pengumpulan_draft_milikku(pengumpulan_id));

create policy "jawaban: staf kelola"
  on public.jawaban for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ---------- nilai ----------
create policy "nilai: siswa baca nilainya (evaluasi menunggu nilai guru)"
  on public.nilai for select to authenticated
  using (public.is_siswa() and public.boleh_lihat_nilai(pengumpulan_id));

create policy "nilai: staf kelola"
  on public.nilai for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ---------- pengumuman ----------
create policy "pengumuman: baca semua akun aktif"
  on public.pengumuman for select to authenticated
  using (public.my_role() is not null);

create policy "pengumuman: staf kelola"
  on public.pengumuman for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ---------- log_kecurangan ----------
create policy "log_kecurangan: baca milik sendiri atau staf"
  on public.log_kecurangan for select to authenticated
  using (siswa_id = auth.uid() or public.is_staff());

create policy "log_kecurangan: siswa catat"
  on public.log_kecurangan for insert to authenticated
  with check (public.is_siswa() and siswa_id = auth.uid());

create policy "log_kecurangan: siswa lengkapi jam kembali"
  on public.log_kecurangan for update to authenticated
  using (public.is_siswa() and siswa_id = auth.uid())
  with check (public.is_siswa() and siswa_id = auth.uid());

create policy "log_kecurangan: staf hapus"
  on public.log_kecurangan for delete to authenticated
  using (public.is_staff());

-- =====================================================================
-- 5. STORAGE — bucket privat "jawaban" (foto/berkas jawaban siswa)
--    Struktur path: {id_siswa}/{id_pengumpulan}/{nama_berkas}
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'jawaban', 'jawaban', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

create policy "jawaban storage: siswa unggah ke folder sendiri"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'jawaban'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_siswa()
  );

create policy "jawaban storage: baca folder sendiri atau staf"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'jawaban'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff())
  );

create policy "jawaban storage: hapus folder sendiri atau staf"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'jawaban'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff())
  );
