import type { AturanJam, Kehadiran, NfcReader, Profil, Sekolah, Siswa } from "./types";

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return (
    url.startsWith("https://") &&
    !url.includes("xxxxxxxx") &&
    key.length > 30 &&
    !key.endsWith("...")
  );
}

export const DEMO_SEKOLAH_ID = "00000000-0000-0000-0000-000000000001";

export const DEMO_SEKOLAH: Sekolah = {
  id: DEMO_SEKOLAH_ID,
  nama: "SDI AL-Irsyadiah",
  timezone: "Asia/Jakarta",
  bobot_halte: 10,
  bobot_gerbang: 2,
};

export const DEMO_PROFIL: Profil = {
  id: "00000000-0000-0000-0000-000000000099",
  sekolah_id: DEMO_SEKOLAH_ID,
  nama: "AXENTA",
  role: "admin",
};

const NAMES: [string, string][] = [
  ["Ahmad Rasyid", "8159FF7B"],
  ["Aisyah Putri", "NFC-4A-002"],
  ["Bagas Prasetyo", "NFC-4A-003"],
  ["Citra Maharani", "NFC-4A-004"],
  ["Dian Saputra", "NFC-4A-005"],
  ["Eka Wulandari", "NFC-4A-006"],
  ["Fajar Nugroho", "NFC-4A-007"],
  ["Gita Pramesti", "NFC-4A-008"],
  ["Hendra Wijaya", "NFC-4A-009"],
  ["Indah Permata", "NFC-4A-010"],
  ["Joko Susanto", "NFC-4A-011"],
  ["Kartika Sari", "NFC-4A-012"],
  ["Lukman Hakim", "NFC-4A-013"],
  ["Maya Anggraeni", "NFC-4A-014"],
  ["Naufal Azhari", "NFC-4A-015"],
  ["Olivia Rahma", "NFC-4A-016"],
  ["Putra Perdana", "NFC-4A-017"],
  ["Qonita Zahra", "NFC-4A-018"],
  ["Rizky Maulana", "NFC-4A-019"],
  ["Siti Nurhaliza", "NFC-4A-020"],
  ["Teguh Wibowo", "NFC-4A-021"],
  ["Umi Kalsum", "NFC-4A-022"],
  ["Vino Adhitya", "NFC-4A-023"],
  ["Winda Kusuma", "NFC-4A-024"],
  ["Yusuf Firmansyah", "NFC-4A-025"],
];

export const DEMO_SISWA: Siswa[] = NAMES.map(([nama, nfc_uid], i) => ({
  id: `demo-siswa-${String(i + 1).padStart(2, "0")}`,
  sekolah_id: DEMO_SEKOLAH_ID,
  nis: `2024${String(i + 1).padStart(3, "0")}`,
  nama,
  kelas: "4A",
  nfc_uid,
  aktif: true,
}));

export const DEMO_ATURAN: AturanJam[] = Array.from({ length: 7 }, (_, i) => ({
  id: `demo-aturan-${i + 1}`,
  sekolah_id: DEMO_SEKOLAH_ID,
  hari: i + 1,
  jam_masuk: "07:00:00",
  tenggat_absensi: "07:00:00",
  aktif: i < 5,
}));

export const DEMO_READERS: NfcReader[] = [
  {
    id: "demo-reader-halte",
    sekolah_id: DEMO_SEKOLAH_ID,
    kode: "RDR-HALTE-01",
    nama: "Reader Halte Bus Sekolah",
    lokasi: "halte",
    mode_registrasi: false,
    last_uid: null,
    last_uid_at: null,
    last_seen: null,
  },
  {
    id: "demo-reader-gerbang",
    sekolah_id: DEMO_SEKOLAH_ID,
    kode: "RDR-GERBANG-01",
    nama: "Reader Gerbang Utama",
    lokasi: "gerbang",
    mode_registrasi: false,
    last_uid: null,
    last_uid_at: null,
    last_seen: null,
  },
];

export const DEMO_KEHADIRAN: Kehadiran[] = [];
