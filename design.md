# Design System — AXENTA Dashboard

> Dokumen desain UI/UX untuk dashboard **AXENTA (Automated Experience for Entry and Attendance)**.
> Implementasi: **Next.js + Tailwind CSS + shadcn/ui + lucide-react + Recharts**.

---

## 1. Prinsip Desain

1. **Clean & Airy** — latar abu-abu sangat terang, kartu putih dengan sudut membulat besar dan bayangan halus.
2. **Kontras Navigasi** — sidebar navy gelap memisahkan navigasi dari konten.
3. **Data First** — angka besar & tebal, label kecil uppercase, status berwarna konsisten.
4. **Real-time Feedback** — indikator status (NFC Reader, koneksi Supabase) selalu terlihat.
5. **Bahasa Indonesia** di seluruh antarmuka.

## 2. Warna

### 2.1 Palet Inti

| Token | Hex | Penggunaan |
|---|---|---|
| `sidebar` | `#0B1424` | Latar sidebar |
| `sidebar-muted` | `#1A2436` | Kartu status NFC di sidebar, hover menu |
| `sidebar-text` | `#CBD5E1` | Teks menu non-aktif |
| `primary` | `#2563EB` | Menu aktif, tombol utama, link, avatar |
| `primary-dark` | `#1E40AF` | Gradien kartu statistik (awal) |
| `primary-50` | `#EFF6FF` | Latar avatar inisial, badge sekolah, ikon bulat |
| `primary-100` | `#DBEAFE` | Border chip, info box |
| `background` | `#F4F6FA` | Latar area konten |
| `surface` | `#FFFFFF` | Kartu, topbar |
| `border` | `#E5E9F0` | Garis kartu, tabel, input |
| `text` | `#0F172A` | Judul & angka |
| `text-muted` | `#64748B` | Subjudul, label |
| `text-subtle` | `#94A3B8` | Placeholder, header tabel, sumbu grafik |

### 2.2 Warna Status

| Status | Token | Hex | Contoh |
|---|---|---|---|
| Tepat Waktu / Sukses | `success` | `#15803D` | Dot legenda, teks "0 siswa (0%)" |
| Telat | `warning` | `#F59E0B` | Legenda "Telat" |
| Gerbang (Potensi Tinggi) / Bahaya | `danger` | `#DC2626` | % TW rendah, "Telat" di aturan jam, Hapus |
| Absen / Netral | `neutral` | `#94A3B8` | Legenda "Absen", status offline |
| Danger surface | `danger-50` | `#FEF2F2` | Latar zona reset database |
| Danger border | `danger-200` | `#FECACA` | Border zona reset & tombol Hapus |

### 2.3 Gradien Kartu Statistik
```css
background: linear-gradient(135deg, #1E40AF 0%, #2563EB 100%);
/* ornamen lingkaran transparan di pojok kanan atas */
.card-hero::after { background: rgba(255,255,255,0.08); border-radius: 9999px; }
```

## 3. Tipografi

Font: **Inter** (via `next/font/google`), fallback `system-ui, sans-serif`.

| Gaya | Ukuran / Line-height | Weight | Penggunaan |
|---|---|---|---|
| `display` | 28px / 36px | 700 | Angka statistik ("25", "0%") |
| `h1` | 24px / 32px | 700 | Judul halaman ("Dashboard Kehadiran") |
| `h2` | 18px / 28px | 700 | Judul section ("Analisis Asesmen Karakter…") |
| `h3` | 15px / 22px | 600 | Judul kartu ("Distribusi Kehadiran") |
| `body` | 14px / 20px | 400 | Teks umum |
| `small` | 12px / 16px | 400 | Subjudul kartu, NFC UID |
| `overline` | 11px / 16px, `tracking-wide`, UPPERCASE | 600 | Label kartu ("TOTAL SISWA TERPANTAU"), header tabel |
| `brand` | 20px | 800 | Logo "AXENTA" |

## 4. Spasi, Radius, Bayangan

| Token | Nilai |
|---|---|
| Grid spasi | kelipatan 4px (`4, 8, 12, 16, 20, 24, 32`) |
| Padding konten halaman | `32px` (desktop), `16px` (mobile) |
| Gap antar kartu | `16–24px` |
| Padding kartu | `20–24px` |
| `radius-card` | `16px` (`rounded-2xl`) |
| `radius-input` | `10px` |
| `radius-pill` | `9999px` (tombol, badge, menu aktif, search) |
| `shadow-card` | `0 1px 2px rgba(15,23,42,.04), 0 4px 16px rgba(15,23,42,.06)` |
| `shadow-hero` | `0 8px 24px rgba(37,99,235,.25)` |

## 5. Layout

```
┌────────────┬──────────────────────────────────────────────┐
│  SIDEBAR   │  TOPBAR (64px)  [🏫 SDI AL-Irsyadiah] AXENTA ⓐ │
│  240px     ├──────────────────────────────────────────────┤
│  navy      │                                              │
│            │   KONTEN (bg #F4F6FA, padding 32px)           │
│  Logo      │   Judul Halaman + Subjudul                    │
│  Menu      │   ...kartu-kartu...                           │
│            │                                              │
│ [● NFC..]  │                                              │
│ ⓐ AXENTA ⇥ │                                              │
└────────────┴──────────────────────────────────────────────┘
```

- **Sidebar**: lebar `240px`, `position: fixed`, tinggi penuh.
- **Topbar**: tinggi `64px`, latar putih, border bawah `border`, sticky.
- **Max-width konten**: fluid; halaman Pengaturan dibatasi `max-w-3xl`.
- **Breakpoint**: `sm 640`, `md 768`, `lg 1024`, `xl 1280`. Di bawah `lg` sidebar menjadi drawer (tombol hamburger di topbar).

## 6. Komponen Global

### 6.1 Sidebar
- **Brand**: logo bulat putih 40px (ikon gelombang/mobilitas) + "AXENTA" (putih, 800) + subjudul "Automated Experience for Entry and Attendance" (11px, `sidebar-text`).
- **Menu item**: tinggi 44px, padding `12px 16px`, ikon lucide 18px + label 14px.
  - Default: teks `sidebar-text`, transparan.
  - Hover: latar `sidebar-muted`.
  - Aktif: latar `primary`, teks putih, `rounded-full`/`rounded-xl`, weight 600.
- **Ikon menu**: Dashboard `LayoutDashboard`, Rekap Kehadiran `CalendarCheck`, Data Siswa `Users`, Aturan Jam Sekolah `Clock`, Pengaturan `Settings`.
- **Status NFC Reader**: pill `sidebar-muted`, dot 6px (`neutral` offline / `success` online + animasi pulse), teks "NFC Reader Offline" / "NFC Reader Online".
- **Footer user**: avatar 36px bulat `primary` dengan inisial putih, nama (600, putih) + role (12px muted), ikon `LogOut` di kanan; dipisahkan border atas.

### 6.2 Topbar
- Kiri: badge sekolah — pill `primary-50`, ikon `School` 14px, teks 13px 600 `text`.
- Kanan: divider vertikal, nama (13px 700) + role (12px muted) rata kanan, avatar 36px `primary`.

### 6.3 Page Header
- `h1` + subjudul `text-muted` 14px, margin bawah 24px.
- Aksi halaman di kanan (Data Siswa, Rekap).

### 6.4 Tombol

| Varian | Gaya | Contoh |
|---|---|---|
| Primary | bg `primary`, teks putih, pill, h-9, ikon kiri | "Tambah Siswa", "Simpan Perubahan" |
| Secondary/Outline | bg putih, border `border`, teks `text-muted`, pill | "Template", "Export Siswa", "Import Excel", "Export Excel" |
| Danger Outline | bg putih, border `danger-200`, teks `danger`, ikon `Trash2` | "Hapus Kehadiran" |
| Link | teks `primary` 13px 500 | "Lihat Semua Data" |

### 6.5 Badge / Chip
- Pill kecil `h-6 px-2.5 text-[11px] font-semibold`.
- Pada kartu hero: `bg-white/20 text-white` ("Aktif", "Perlu Perhatian").
- Pada kartu putih: `bg-slate-100 text-slate-600` ("≥3 hari", "Sen-Jum").

### 6.6 Input & Select
- Search: pill, h-10, ikon `Search` kiri, placeholder "Cari nama atau kelas…", lebar 340px.
- Select (bulan, kelas, jam/menit, sort): h-9, `radius-input`, border `border`, ikon chevron.
- Month picker: tombol outline dengan ikon `Calendar` + "November 2026".

### 6.7 Kartu (Card)
- bg putih, `radius-card`, `shadow-card`, border `border` tipis opsional.
- Header kartu: `h3` + subjudul `small text-muted`, aksi di kanan.

### 6.8 Tabel
- Header: `overline` `text-subtle`, border bawah.
- Baris: tinggi 44px, border bawah `border`, hover `slate-50`.
- Nama siswa: teks `primary` 500 (clickable).
- Nilai `% TW` rendah: `danger` bold; ≥ 80%: `success`.

### 6.9 Empty State
- Teks tengah `text-subtle` 14px, contoh: "Belum ada data absensi siswa.", opsional ilustrasi/ikon 40px.

### 6.10 Info Box (Metodologi)
- bg `primary-50`, border `primary-100`, radius 12px, ikon `Info` `primary`, teks 12px `#1E40AF`, label tebal "Metodologi Estimasi:".

### 6.11 Danger Zone
- bg `danger-50`, border `danger-200`, radius 12px, ikon `ShieldAlert` merah, judul `danger` 600, teks deskripsi `danger` 13px, kode inline (`Kehadiran`, `TRUNCATE TABLE ...`) dalam chip putih monospace border merah muda.

### 6.12 Status Connection Card
- Ikon `CheckCircle2` dalam lingkaran `success/10`, judul "Koneksi Database Supabase Aktif", subjudul muted. Versi error: ikon `XCircle` merah.

### 6.13 Dialog Konfirmasi
- shadcn `AlertDialog`, judul tebal, deskripsi, input konfirmasi "Ketik HAPUS", tombol Batal (outline) + Hapus (bg `danger`).

### 6.14 Toast
- shadcn `Sonner`, pojok kanan atas. Contoh: "Perubahan berhasil disimpan", "Tap baru: Ahmad Rasyid — Tepat Waktu".

## 7. Spesifikasi Halaman

### 7.1 Dashboard Kehadiran
1. **Baris statistik** — grid 4 kolom (`xl:grid-cols-4 md:grid-cols-2`), tinggi ±140px.
   - Kartu 1 & 2: **hero gradient** biru, ikon dalam lingkaran `white/15`, badge kanan atas, label overline putih, angka `display` putih.
   - Kartu 3 & 4: putih, ikon dalam lingkaran `primary-50` (`AlertTriangle`, `CalendarDays`), badge abu, angka `display` `text`, caption muted ("siswa di bulan ini", "hari efektif").
2. **Baris 2** — grid `5fr / 7fr`:
   - **Distribusi Kehadiran**: donut chart (Recharts `PieChart`, innerRadius 70%), total di tengah (angka 24px + "TOTAL" overline). Legenda bawah: dot hijau "Tepat Waktu 0%", dot kuning "Telat 0%", dot abu "Absen 0%".
   - **Aktivitas Terbaru**: tabel kolom SISWA · KELAS · TITIK TAP · JAM TAP · TANGGAL · STATUS. Titik tap ditampilkan chip ("Gerbang Utama"); status chip (hijau "Tepat Waktu", kuning "Telat"). Baris baru muncul dengan animasi highlight `primary-50` 1.5 detik.
3. **Divider** + section header: ikon `ShieldCheck` biru + `h2` "Monitoring Kehadiran Gerbang Utama Sekolah" + subjudul.
4. **Baris 3** — grid `5fr / 7fr`:
   - Kolom kiri (stack):
     - **Ringkasan Tap Gerbang Utama Hari Ini**: label overline; dua baris (Tepat Waktu & Terlambat) dengan progress bar; info box Gerbang Utama di bawah.
     - **Siswa Paling Tepat Waktu**: ikon `Award` kuning, overline; list peringkat (no., avatar inisial, nama, kelas, persentase tepat waktu).
   - Kolom kanan: **Tren Kehadiran Mingguan (Gerbang Utama)** — ikon `Zap` biru, judul, subjudul; select urutan di kanan dengan ikon `ArrowUpDown`; grouped bar chart (hijau Tepat Waktu, kuning Telat), grid horizontal putus-putus `#EEF2F7`, label sumbu "Sel 10", "Rab 11"; legenda bawah dengan kotak warna.

### 7.2 Rekap Kehadiran
- **Toolbar**: kiri — month picker + select "Semua Kelas"; kanan — "Hapus Kehadiran" (danger outline) + "Export Excel" (outline, ikon `Download`).
- **Kartu Tabel Rekap**: judul + "25 siswa • 21 hari sekolah".
  - Kolom NO (48px), NAMA SISWA (sticky, 200px), kolom hari (56px, header 2 baris: "SEN" overline + tanggal), kolom % TW (sticky kanan).
  - Sel status: `✓` hijau (Tepat), `T` kuning (Telat), `A` abu/merah muda (Absen), `-` abu (belum ada data). Bisa berupa dot/bulat 22px berwarna.
  - Scrollbar horizontal tipis di bawah tabel.
- **Kartu Grafik Ketepatan Waktu**: segmented control kanan atas ("Grafik Harian" aktif putih ber-shadow, "Detail Jam Tap"); stacked bar per tanggal sekolah, legenda hijau "Tepat Waktu", kuning "Telat".

### 7.3 Data Siswa
- **Header aksi** (kanan): Template (`Download`), Export Siswa (`FileText`), Import Excel (`Upload`), Tambah Siswa (primary, `UserPlus`).
- **Search** + teks "Menampilkan **25** siswa".
- **Grid kartu siswa**: `grid-cols-1 sm:2 lg:3 xl:4`, gap 16px.
  - Kartu: putih, radius 16px, padding 16px, flex row; avatar 40px bulat `primary-50` dengan inisial `primary` 600 (contoh "AR"); nama 14px 600, "Kelas 4A" 12px muted, NFC UID 11px `text-subtle` (monospace opsional).
  - Hover: border `primary-100`, shadow sedikit naik, cursor pointer → modal detail/edit.
- **Modal Tambah/Edit Siswa**: field Nama, NIS, Kelas (combobox), NFC UID + tombol "Scan Kartu" (status menunggu tap dengan animasi gelombang NFC).
- **Modal Import**: dropzone dashed, preview tabel dengan baris error berwarna merah muda, tombol "Import N Siswa".

### 7.4 Aturan Jam Sekolah
- Kartu tunggal: header ikon `Clock` biru + "Jam Absensi Kehadiran", deskripsi dengan kata **Telat** berwarna `danger`.
- Tabel 3 kolom: **Hari** | **Jam Masuk** (sub: "Waktu resmi masuk sekolah") | **Tenggat Absensi** (sub: "Batas akhir tap — lewat ini dianggap telat").
- Setiap sel waktu: dua select kecil (jam & menit, 64px) dipisah ":".
- Tambahan: switch aktif/libur di kolom Hari (baris nonaktif opacity 50%).
- Footer: kiri teks kecil "Perubahan berlaku pada absensi NFC tap berikutnya secara real-time.", kanan tombol primary `Save` "Simpan Perubahan" (disabled bila tidak ada perubahan).

### 7.5 Pengaturan Sistem
- Konten `max-w-3xl`, stack kartu gap 24px.
- **Kartu Manajemen Basis Data**: ikon `Database` dalam lingkaran `primary-50`, judul, subjudul; di dalamnya Danger Zone "Pembersihan Data Kehadiran (Reset Database)"; footer zona: teks "Data master siswa dan sekolah tidak akan terpengaruh." + tombol danger outline "Hapus Kehadiran" → dialog pilihan (Per Bulan / Reset Total).
- **Kartu Koneksi Supabase**: status connection card.
- **Kartu NFC Reader**: tabel perangkat (Kode, Nama, Lokasi chip, Bobot, Status dot, Terakhir Aktif), tombol "Tambah Reader"; device key ditampilkan sekali dalam dialog dengan tombol salin.
- **Kartu Profil Sekolah & Bobot Eco**: form input + tombol simpan.

### 7.6 Login
- Layout split: kiri panel navy dengan logo AXENTA & tagline; kanan kartu form putih (Email, Password, tombol primary full-width "Masuk").

## 8. Visualisasi Data (Recharts)

| Grafik | Tipe | Warna |
|---|---|---|
| Distribusi Kehadiran | Donut (`PieChart`) | `#15803D`, `#F59E0B`, `#94A3B8` |
| Tren Kehadiran Mingguan (Gerbang Utama) | Grouped `BarChart` | Tepat Waktu `#15803D`, Telat `#F59E0B` |
| Grafik Harian | Stacked `BarChart` | Tepat `#15803D`, Telat `#F59E0B` |
| Detail Jam Tap | `ScatterChart` (x: tanggal, y: jam) + garis referensi tenggat merah putus-putus | `#2563EB` |

Gaya umum: grid horizontal `#EEF2F7` dashed, sumbu tanpa garis, label 11px `text-subtle`, tooltip kartu putih radius 10px shadow, bar radius `[4,4,0,0]`.

## 9. Interaksi & Motion

| Elemen | Perilaku |
|---|---|
| Hover kartu | `translateY(-1px)` + shadow lebih kuat, 150 ms |
| Menu sidebar | transisi bg 150 ms |
| Data real-time | angka statistik animasi count-up; baris tabel baru fade-in + highlight |
| Status NFC Online | dot hijau `animate-pulse` |
| Loading | skeleton `slate-100` sesuai bentuk kartu/tabel |
| Submit | tombol menampilkan spinner `Loader2` + disabled |

## 10. Aksesibilitas

- Kontras teks minimal WCAG AA (4.5:1); teks putih di atas `primary` lolos.
- Status tidak hanya mengandalkan warna — sertakan teks/ikon (✓, T, A).
- Semua ikon tombol memiliki `aria-label`; fokus terlihat (`ring-2 ring-primary/40`).
- Tabel menggunakan `<th scope>`; grafik menyediakan ringkasan teks.

## 11. Tailwind Config (Ringkas)

```ts
// tailwind.config.ts
theme: {
  extend: {
    fontFamily: { sans: ["var(--font-inter)", "system-ui", "sans-serif"] },
    colors: {
      sidebar: { DEFAULT: "#0B1424", muted: "#1A2436", text: "#CBD5E1" },
      primary: { DEFAULT: "#2563EB", dark: "#1E40AF", 50: "#EFF6FF", 100: "#DBEAFE" },
      background: "#F4F6FA",
      border: "#E5E9F0",
      success: "#15803D",
      warning: "#F59E0B",
      danger: { DEFAULT: "#DC2626", 50: "#FEF2F2", 200: "#FECACA" },
    },
    borderRadius: { card: "16px", input: "10px" },
    boxShadow: {
      card: "0 1px 2px rgba(15,23,42,.04), 0 4px 16px rgba(15,23,42,.06)",
      hero: "0 8px 24px rgba(37,99,235,.25)",
    },
  },
}
```

## 12. Struktur Komponen

```
components/
├─ layout/      Sidebar, SidebarNavItem, NfcStatusPill, UserFooter, Topbar, SchoolBadge, PageHeader
├─ ui/          (shadcn) Button, Card, Badge, Input, Select, Table, Dialog, AlertDialog, Tabs, Switch, Skeleton, Sonner
├─ dashboard/   StatCard, HeroStatCard, AttendanceDonut, RecentActivityTable,
│               TapDistributionCard, MethodologyNote, EcoLeaderboard, WeeklyLocationChart
├─ rekap/       RekapToolbar, RekapTable, StatusCell, PunctualityChart, TapTimeScatter
├─ siswa/       StudentSearch, StudentCard, StudentGrid, StudentFormDialog, ImportExcelDialog, ScanCardButton
├─ aturan/      ScheduleTable, TimeSelect
└─ pengaturan/  DatabaseResetCard, DangerZone, ConnectionStatusCard, ReaderTable, SchoolProfileForm
```

## 13. Referensi Visual (Mapping Screenshot)

| Screenshot | Halaman | Komponen kunci |
|---|---|---|
| 1 | Dashboard Kehadiran | HeroStatCard ×2, StatCard ×2, AttendanceDonut, RecentActivityTable, Eco-Awareness section |
| 2 | Rekap Kehadiran | RekapToolbar, RekapTable (25 siswa × 21 hari), PunctualityChart |
| 3 | Data Siswa | Header aksi, StudentSearch, StudentGrid (4 kolom) |
| 4 | Aturan Jam Sekolah | ScheduleTable (Senin–Minggu), tombol Simpan |
| 5 | Pengaturan Sistem | DatabaseResetCard + DangerZone, ConnectionStatusCard |
