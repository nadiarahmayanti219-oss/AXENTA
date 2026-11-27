export type Role = "admin" | "guru";
export type Lokasi = "gerbang";
export type StatusHadir = "tepat_waktu" | "telat";

export interface Sekolah {
  id: string;
  nama: string;
  timezone: string;
}

export interface Profil {
  id: string;
  sekolah_id: string;
  nama: string;
  role: Role;
}

export interface Siswa {
  id: string;
  sekolah_id: string;
  nis: string | null;
  nama: string;
  kelas: string;
  nfc_uid: string;
  aktif: boolean;
  created_at?: string;
}

export interface NfcReader {
  id: string;
  sekolah_id: string;
  kode: string;
  nama: string;
  lokasi: Lokasi;
  mode_registrasi: boolean;
  last_uid: string | null;
  last_uid_at: string | null;
  last_seen: string | null;
  created_at?: string;
}

export interface AturanJam {
  id?: string;
  sekolah_id: string;
  hari: number; // 1=Senin..7=Minggu
  jam_masuk: string; // "07:00:00"
  tenggat_absensi: string;
  aktif: boolean;
}

export interface Kehadiran {
  id: string;
  sekolah_id: string;
  siswa_id: string;
  reader_id: string | null;
  tanggal: string; // YYYY-MM-DD
  jam_tap: string; // ISO
  lokasi: Lokasi;
  status: StatusHadir;
  created_at?: string;
}

export interface KehadiranWithSiswa extends Kehadiran {
  siswa: { nama: string; kelas: string } | null;
}
