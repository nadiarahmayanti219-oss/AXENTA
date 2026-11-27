# AXENTA — Automated Experience for Entry and Attendance

Dashboard web **Next.js (App Router) + Supabase + NodeMCU ESP8266 (MFRC522)** untuk absensi NFC real-time dan asesmen karakter kepedulian lingkungan (*Eco-Awareness*) siswa.

Dokumentasi lengkap berada di [`PRD.md`](PRD.md) dan [`design.md`](design.md).

## 1. Persiapan Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, jalankan isi file:
   1. [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) — membuat tabel, trigger, RPC, RLS, dan Realtime.
   2. [`supabase/seed.sql`](supabase/seed.sql) *(opsional)* — mengisi sekolah **SDI AL-Irsyadiah**, 25 siswa kelas 4A, dan 2 reader demo.
3. Buka **Authentication → Users → Add user → Create new user**.
   User pertama yang dibuat otomatis terdaftar sebagai **admin** sekolah.

## 2. Menjalankan Aplikasi Web

```bash
cp .env.example .env.local   # isi URL, ANON_KEY, dan SERVICE_ROLE_KEY dari Supabase
npm.cmd install
npm.cmd run dev
```

Buka `http://localhost:3000` lalu login dengan akun yang dibuat pada langkah 1.

## 3. Simulasi Tap NFC Tanpa Alat (via `curl` / PowerShell)

Jika memakai `seed.sql`, tersedia 2 reader dengan key demo:
- `RDR-HALTE-01` → key `demo-halte-key` (lokasi **Halte**, +10 poin eco)
- `RDR-GERBANG-01` → key `demo-gerbang-key` (lokasi **Gerbang**, +2 poin eco)

```powershell
# Heartbeat (mengubah status di sidebar menjadi "NFC Reader Online")
Invoke-RestMethod -Method POST http://localhost:3000/api/heartbeat `
  -Headers @{ "x-device-key" = "demo-halte-key" } `
  -ContentType "application/json" -Body '{"reader":"RDR-HALTE-01"}'

# Tap siswa Ahmad Rasyid (UID: 8159FF7B)
Invoke-RestMethod -Method POST http://localhost:3000/api/tap `
  -Headers @{ "x-device-key" = "demo-halte-key" } `
  -ContentType "application/json" -Body '{"uid":"8159FF7B","reader":"RDR-HALTE-01"}'
```

## 4. Firmware NodeMCU ESP8266

Buka [`firmware/umca_reader/umca_reader.ino`](firmware/umca_reader/umca_reader.ino) di Arduino IDE, sesuaikan `WIFI_SSID`, `WIFI_PASS`, `SERVER_BASE`, `READER_CODE`, dan `DEVICE_KEY`, lalu flash ke board **NodeMCU 1.0 (ESP-12E Module)**.
