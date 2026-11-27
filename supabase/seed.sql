-- =====================================================================
-- AXENTA — Seed data contoh (SDI AL-Irsyadiah, Siswa, 1 Reader Gerbang Utama, & Akun Admin)
-- Jalankan SETELAH 0001_init.sql di Supabase SQL Editor.
-- =====================================================================

insert into public.sekolah (id, nama, timezone)
values ('00000000-0000-0000-0000-000000000001', 'SDI AL-Irsyadiah', 'Asia/Jakarta')
on conflict (id) do nothing;

insert into public.siswa (sekolah_id, nama, kelas, nfc_uid) values
('00000000-0000-0000-0000-000000000001','Ahmad Rasyid','4A','8159FF7B'),
('00000000-0000-0000-0000-000000000001','Siswa Tes IoT AXENTA','4A','A3B4C5D6'),
('00000000-0000-0000-0000-000000000001','Aisyah Putri','4A','NFC-4A-002'),
('00000000-0000-0000-0000-000000000001','Bagas Prasetyo','4A','NFC-4A-003'),
('00000000-0000-0000-0000-000000000001','Citra Maharani','4A','NFC-4A-004'),
('00000000-0000-0000-0000-000000000001','Dian Saputra','4A','NFC-4A-005'),
('00000000-0000-0000-0000-000000000001','Eka Wulandari','4A','NFC-4A-006'),
('00000000-0000-0000-0000-000000000001','Fajar Nugroho','4A','NFC-4A-007'),
('00000000-0000-0000-0000-000000000001','Gita Pramesti','4A','NFC-4A-008'),
('00000000-0000-0000-0000-000000000001','Hendra Wijaya','4A','NFC-4A-009'),
('00000000-0000-0000-0000-000000000001','Indah Permata','4A','NFC-4A-010'),
('00000000-0000-0000-0000-000000000001','Joko Susanto','4A','NFC-4A-011'),
('00000000-0000-0000-0000-000000000001','Kartika Sari','4A','NFC-4A-012'),
('00000000-0000-0000-0000-000000000001','Lukman Hakim','4A','NFC-4A-013'),
('00000000-0000-0000-0000-000000000001','Maya Anggraeni','4A','NFC-4A-014'),
('00000000-0000-0000-0000-000000000001','Naufal Azhari','4A','NFC-4A-015'),
('00000000-0000-0000-0000-000000000001','Olivia Rahma','4A','NFC-4A-016'),
('00000000-0000-0000-0000-000000000001','Putra Perdana','4A','NFC-4A-017'),
('00000000-0000-0000-0000-000000000001','Qonita Zahra','4A','NFC-4A-018'),
('00000000-0000-0000-0000-000000000001','Rizky Maulana','4A','NFC-4A-019'),
('00000000-0000-0000-0000-000000000001','Siti Nurhaliza','4A','NFC-4A-020'),
('00000000-0000-0000-0000-000000000001','Teguh Wibowo','4A','NFC-4A-021'),
('00000000-0000-0000-0000-000000000001','Umi Kalsum','4A','NFC-4A-022'),
('00000000-0000-0000-0000-000000000001','Vino Adhitya','4A','NFC-4A-023'),
('00000000-0000-0000-0000-000000000001','Winda Kusuma','4A','NFC-4A-024'),
('00000000-0000-0000-0000-000000000001','Yusuf Firmansyah','4A','NFC-4A-025')
on conflict (sekolah_id, nfc_uid) do nothing;

-- Pastikan hanya ada Reader Gerbang Utama (tanpa reader lain)
delete from public.nfc_reader where kode != 'RDR-GERBANG-01';

-- Reader Gerbang Utama Sekolah. Device key: "demo-gerbang-key"
insert into public.nfc_reader (sekolah_id, kode, nama, lokasi, device_key_hash) values
('00000000-0000-0000-0000-000000000001','RDR-GERBANG-01','Reader Gerbang Utama','gerbang',
  encode(extensions.digest('demo-gerbang-key','sha256'),'hex'))
on conflict (kode) do nothing;

-- =====================================================================
-- Akun Login Default untuk Tes Web & IoT:
-- Email   : admin@AXENTA.com (atau admin@axenta.com)
-- Password: admin
-- =====================================================================
do $$
declare
  v_uid uuid := '00000000-0000-0000-0000-000000000099';
begin
  select id into v_uid from auth.users where lower(email) = 'admin@axenta.com' limit 1;

  if v_uid is null then
    v_uid := '00000000-0000-0000-0000-000000000099';
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_uid,
      'authenticated',
      'authenticated',
      'admin@axenta.com',
      extensions.crypt('admin', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"nama":"Admin AXENTA"}',
      now(), now(), '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(),
      v_uid,
      v_uid::text,
      format('{"sub":"%s","email":"admin@axenta.com"}', v_uid::text)::jsonb,
      'email',
      now(), now(), now()
    );
  else
    update auth.users
    set encrypted_password = extensions.crypt('admin', extensions.gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
    where id = v_uid;
  end if;

  insert into public.profil (id, sekolah_id, nama, role)
  values (v_uid, '00000000-0000-0000-0000-000000000001', 'Admin AXENTA', 'admin')
  on conflict (id) do update set nama = 'Admin AXENTA', role = 'admin';
end $$;
