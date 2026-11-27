-- =====================================================================
-- AXENTA — Automated Experience for Entry and Attendance
-- Migration 0001: skema inti, RLS, realtime, RPC
-- Jalankan di Supabase Dashboard > SQL Editor (atau `supabase db push`)
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- TABEL
-- ---------------------------------------------------------------------
create table if not exists public.sekolah (
  id            uuid primary key default gen_random_uuid(),
  nama          text not null,
  timezone      text not null default 'Asia/Jakarta',
  bobot_halte   int  not null default 10,
  bobot_gerbang int  not null default 2,
  created_at    timestamptz not null default now()
);

create table if not exists public.profil (
  id         uuid primary key references auth.users(id) on delete cascade,
  sekolah_id uuid not null references public.sekolah(id) on delete cascade,
  nama       text not null,
  role       text not null default 'guru' check (role in ('admin','guru')),
  created_at timestamptz not null default now()
);

create table if not exists public.siswa (
  id         uuid primary key default gen_random_uuid(),
  sekolah_id uuid not null references public.sekolah(id) on delete cascade,
  nis        text,
  nama       text not null,
  kelas      text not null,
  nfc_uid    text not null,
  aktif      boolean not null default true,
  created_at timestamptz not null default now(),
  constraint siswa_uid_unik unique (sekolah_id, nfc_uid)
);
create index if not exists siswa_sekolah_idx on public.siswa (sekolah_id, kelas);

create table if not exists public.nfc_reader (
  id               uuid primary key default gen_random_uuid(),
  sekolah_id       uuid not null references public.sekolah(id) on delete cascade,
  kode             text not null unique,
  nama             text not null,
  lokasi           text not null check (lokasi in ('halte','gerbang')),
  device_key_hash  text not null,
  mode_registrasi  boolean not null default false,
  last_uid         text,
  last_uid_at      timestamptz,
  last_seen        timestamptz,
  created_at       timestamptz not null default now()
);

create table if not exists public.aturan_jam (
  id              uuid primary key default gen_random_uuid(),
  sekolah_id      uuid not null references public.sekolah(id) on delete cascade,
  hari            smallint not null check (hari between 1 and 7), -- 1=Senin .. 7=Minggu
  jam_masuk       time not null default '07:00',
  tenggat_absensi time not null default '07:15',
  aktif           boolean not null default true,
  constraint aturan_jam_unik unique (sekolah_id, hari),
  constraint tenggat_valid check (tenggat_absensi >= jam_masuk)
);

create table if not exists public.kehadiran (
  id         uuid primary key default gen_random_uuid(),
  sekolah_id uuid not null references public.sekolah(id) on delete cascade,
  siswa_id   uuid not null references public.siswa(id) on delete cascade,
  reader_id  uuid references public.nfc_reader(id) on delete set null,
  tanggal    date not null,
  jam_tap    timestamptz not null,
  lokasi     text not null check (lokasi in ('halte','gerbang')),
  bobot_eco  int  not null default 0,
  status     text not null check (status in ('tepat_waktu','telat')),
  created_at timestamptz not null default now(),
  constraint kehadiran_harian_unik unique (siswa_id, tanggal)
);
create index if not exists kehadiran_tanggal_idx on public.kehadiran (sekolah_id, tanggal);
create index if not exists kehadiran_siswa_idx   on public.kehadiran (siswa_id, tanggal);
create index if not exists kehadiran_jam_idx     on public.kehadiran (sekolah_id, jam_tap desc);

-- ---------------------------------------------------------------------
-- HELPER
-- ---------------------------------------------------------------------
create or replace function public.my_sekolah_id()
returns uuid language sql stable security definer set search_path = public as $$
  select sekolah_id from public.profil where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profil where id = auth.uid() and role = 'admin')
$$;

-- Buat aturan jam default (Sen–Jum aktif) saat sekolah baru dibuat
create or replace function public.handle_new_sekolah()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.aturan_jam (sekolah_id, hari, jam_masuk, tenggat_absensi, aktif)
  select new.id, d, '07:00', '07:15', d <= 5 from generate_series(1,7) d
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_sekolah_created on public.sekolah;
create trigger on_sekolah_created after insert on public.sekolah
for each row execute function public.handle_new_sekolah();

-- Hubungkan user baru ke sekolah pertama. User pertama = admin.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_sekolah uuid;
  v_role    text;
begin
  select id into v_sekolah from public.sekolah order by created_at limit 1;
  if v_sekolah is null then
    insert into public.sekolah (nama) values ('Sekolah Saya') returning id into v_sekolah;
  end if;
  v_role := case when exists (select 1 from public.profil where sekolah_id = v_sekolah) then 'guru' else 'admin' end;
  insert into public.profil (id, sekolah_id, nama, role)
  values (new.id, v_sekolah,
          coalesce(new.raw_user_meta_data->>'nama', split_part(new.email, '@', 1)),
          v_role)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- RPC
-- ---------------------------------------------------------------------
-- Hapus kehadiran per bulan (p_bulan = tanggal apa pun di bulan tsb) atau semua bila null
create or replace function public.rpc_reset_kehadiran(p_bulan date default null)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_count int;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang dapat menghapus data kehadiran';
  end if;
  if p_bulan is null then
    delete from public.kehadiran where sekolah_id = public.my_sekolah_id();
  else
    delete from public.kehadiran
    where sekolah_id = public.my_sekolah_id()
      and tanggal >= date_trunc('month', p_bulan)::date
      and tanggal <  (date_trunc('month', p_bulan) + interval '1 month')::date;
  end if;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.sekolah    enable row level security;
alter table public.profil     enable row level security;
alter table public.siswa      enable row level security;
alter table public.nfc_reader enable row level security;
alter table public.aturan_jam enable row level security;
alter table public.kehadiran  enable row level security;

-- sekolah
drop policy if exists sekolah_select on public.sekolah;
create policy sekolah_select on public.sekolah for select to authenticated
  using (id = public.my_sekolah_id());
drop policy if exists sekolah_update on public.sekolah;
create policy sekolah_update on public.sekolah for update to authenticated
  using (id = public.my_sekolah_id() and public.is_admin())
  with check (id = public.my_sekolah_id());

-- profil
drop policy if exists profil_select on public.profil;
create policy profil_select on public.profil for select to authenticated
  using (sekolah_id = public.my_sekolah_id());

-- siswa
drop policy if exists siswa_select on public.siswa;
create policy siswa_select on public.siswa for select to authenticated
  using (sekolah_id = public.my_sekolah_id());
drop policy if exists siswa_write on public.siswa;
create policy siswa_write on public.siswa for all to authenticated
  using (sekolah_id = public.my_sekolah_id() and public.is_admin())
  with check (sekolah_id = public.my_sekolah_id() and public.is_admin());

-- nfc_reader
drop policy if exists reader_select on public.nfc_reader;
create policy reader_select on public.nfc_reader for select to authenticated
  using (sekolah_id = public.my_sekolah_id());
drop policy if exists reader_write on public.nfc_reader;
create policy reader_write on public.nfc_reader for all to authenticated
  using (sekolah_id = public.my_sekolah_id() and public.is_admin())
  with check (sekolah_id = public.my_sekolah_id() and public.is_admin());

-- aturan_jam
drop policy if exists aturan_select on public.aturan_jam;
create policy aturan_select on public.aturan_jam for select to authenticated
  using (sekolah_id = public.my_sekolah_id());
drop policy if exists aturan_write on public.aturan_jam;
create policy aturan_write on public.aturan_jam for all to authenticated
  using (sekolah_id = public.my_sekolah_id() and public.is_admin())
  with check (sekolah_id = public.my_sekolah_id() and public.is_admin());

-- kehadiran (insert dilakukan server via service_role)
drop policy if exists kehadiran_select on public.kehadiran;
create policy kehadiran_select on public.kehadiran for select to authenticated
  using (sekolah_id = public.my_sekolah_id());
drop policy if exists kehadiran_delete on public.kehadiran;
create policy kehadiran_delete on public.kehadiran for delete to authenticated
  using (sekolah_id = public.my_sekolah_id() and public.is_admin());

-- ---------------------------------------------------------------------
-- REALTIME
-- ---------------------------------------------------------------------
do $$
begin
  begin alter publication supabase_realtime add table public.kehadiran;  exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.nfc_reader; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.siswa;      exception when duplicate_object then null; end;
end $$;
