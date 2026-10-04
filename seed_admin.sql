-- =====================================================================
-- SETLAND — Seed akun admin
-- Jalankan di Supabase → SQL Editor SETELAH schema.sql.
--   nama     : admin
--   email    : adminsetland@gmail.com
--   password : 12345   (di-hash bcrypt oleh pgcrypto; Supabase Auth memverifikasi hash ini)
--
-- PENTING: "12345" sangat lemah. Segera ganti sebelum dipakai sungguhan
-- (Supabase → Authentication → Users → pilih admin → Send password recovery / Reset password).
-- =====================================================================

do $$
declare
  v_id    uuid;
  v_email text := 'adminsetland@gmail.com';
begin
  select id into v_id from auth.users where email = v_email;

  if v_id is null then
    v_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
      crypt('12345', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"nama_lengkap":"admin"}'::jsonb,
      now(), now(),
      '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_id, v_id::text,
      jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
      'email', now(), now(), now()
    );
  end if;

  -- Trigger handle_new_user membuat profil siswa/menunggu → naikkan menjadi admin aktif
  update public.profiles
     set nama_lengkap = 'admin', role = 'admin', status = 'aktif'
   where id = v_id;
end
$$;
