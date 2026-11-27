# AXENTA — Automated Experience for Entry and Attendance

Dashboard web **Next.js (App Router) + Supabase + NodeMCU ESP8266 (MFRC522 + LCD I2C + ESP32-CAM)** untuk sistem absensi siswa berbasis NFC secara real-time di **Gerbang Utama Sekolah**.

Dokumentasi lengkap berada di [`PRD.md`](PRD.md) dan [`design.md`](design.md).

## 1. Persiapan Supabase

1. Buat atau aktifkan project di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, jalankan isi file:
   1. [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) — membuat tabel, trigger, RPC, RLS, dan Realtime.
   2. [`supabase/seed.sql`](supabase/seed.sql) — mengisi sekolah **SDI AL-Irsyadiah**, data siswa kelas 4A (termasuk kartu tes IoT), 1 reader **Gerbang Utama** (`RDR-GERBANG-01`), dan akun login default:
      - **Email:** `admin@AXENTA.com` (atau `admin@axenta.com`)
      - **Password:** `admin`

## 2. Menjalankan Aplikasi Web

```bash
cp .env.example .env.local   # isi URL, ANON_KEY, dan SERVICE_ROLE_KEY dari Supabase
npm.cmd install
npm.cmd run dev
```

Buka `http://localhost:3000` (atau production `https://axenta-lime.vercel.app`) lalu login menggunakan:
- **Email:** `admin@AXENTA.com`
- **Password:** `admin`

## 3. Simulasi Tap NFC Gerbang Utama Tanpa Alat (via PowerShell)

Menggunakan reader `RDR-GERBANG-01` dengan key `demo-gerbang-key` (lokasi **Gerbang Utama**):

```powershell
# Heartbeat (mengubah status di sidebar menjadi "NFC Reader Online")
Invoke-RestMethod -Method POST https://axenta-lime.vercel.app/api/heartbeat `
  -Headers @{ "x-device-key" = "demo-gerbang-key" } `
  -ContentType "application/json" -Body '{"reader":"RDR-GERBANG-01"}'

# Tap siswa Ahmad Rasyid (UID: 8159FF7B) atau Siswa Tes IoT AXENTA (UID: A3B4C5D6)
Invoke-RestMethod -Method POST https://axenta-lime.vercel.app/api/tap `
  -Headers @{ "x-device-key" = "demo-gerbang-key" } `
  -ContentType "application/json" -Body '{"uid":"A3B4C5D6","reader":"RDR-GERBANG-01"}'
```

## 4. Firmware NodeMCU ESP8266

Buka [`firmware/axenta_reader/axenta_reader.ino`](firmware/axenta_reader/axenta_reader.ino) di Arduino IDE, sesuaikan `WIFI_SSID` dan `WIFI_PASS` (`SERVER_BASE`, `READER_CODE = "RDR-GERBANG-01"`, dan `DEVICE_KEY = "demo-gerbang-key"` sudah terisi otomatis), lalu flash ke board **NodeMCU 1.0 (ESP-12E Module)**.
