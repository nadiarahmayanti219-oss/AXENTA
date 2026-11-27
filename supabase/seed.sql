-- =====================================================================
-- AXENTA — Seed data contoh (SDI AL-Irsyadiah, 25 siswa kelas 4A, 2 reader)
-- Jalankan SETELAH 0001_init.sql dan SEBELUM membuat user pertama.
-- =====================================================================

insert into public.sekolah (id, nama, timezone, bobot_halte, bobot_gerbang)
values ('00000000-0000-0000-0000-000000000001', 'SDI AL-Irsyadiah', 'Asia/Jakarta', 10, 2)
on conflict (id) do nothing;

insert into public.siswa (sekolah_id, nama, kelas, nfc_uid) values
('00000000-0000-0000-0000-000000000001','Ahmad Rasyid','4A','8159FF7B'),
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

-- Reader demo. Device key: "demo-halte-key" & "demo-gerbang-key"
-- (Ganti dengan key acak via menu Pengaturan > NFC Reader untuk produksi)
insert into public.nfc_reader (sekolah_id, kode, nama, lokasi, device_key_hash) values
('00000000-0000-0000-0000-000000000001','RDR-HALTE-01','Reader Halte Bus Sekolah','halte',
  encode(extensions.digest('demo-halte-key','sha256'),'hex')),
('00000000-0000-0000-0000-000000000001','RDR-GERBANG-01','Reader Gerbang Utama','gerbang',
  encode(extensions.digest('demo-gerbang-key','sha256'),'hex'))
on conflict (kode) do nothing;
