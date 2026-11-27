import type { AturanJam, Kehadiran, Siswa, StatusHadir } from "./types";
import { datesInMonth } from "./time";

/** Tap <= tenggat => tepat waktu, selain itu telat. localTime & tenggat format "HH:MM[:SS]". */
export function computeStatus(localTime: string, tenggat: string): StatusHadir {
  const norm = (t: string) => (t.length === 5 ? `${t}:00` : t.slice(0, 8));
  return norm(localTime) <= norm(tenggat) ? "tepat_waktu" : "telat";
}

export function aturanMap(aturan: AturanJam[]) {
  const map = new Map<number, AturanJam>();
  aturan.forEach((a) => map.set(a.hari, a));
  return map;
}

/** Tanggal-tanggal hari sekolah (hari aktif) dalam bulan. */
export function schoolDays(ym: string, aturan: AturanJam[]) {
  const map = aturanMap(aturan);
  return datesInMonth(ym).filter((d) => map.get(d.hari)?.aktif);
}

export type CellStatus = "tepat_waktu" | "telat" | "absen" | "kosong";

export interface StudentMonth {
  siswa: Siswa;
  tepat: number;
  telat: number;
  absen: number;
  pctTW: number;
  gerbang: number;
  cells: Record<string, { status: CellStatus; record?: Kehadiran }>;
}

export interface MonthStats {
  days: { date: string; day: number; hari: number }[];
  students: StudentMonth[];
  totalTepat: number;
  totalTelat: number;
  totalAbsen: number;
  avgPct: number;
  seringTelat: number;
}

/**
 * Hitung statistik bulanan.
 * - Suatu hari sekolah hanya dihitung memiliki siswa "absen" apabila pada tanggal tersebut
 *   memang tercatat aktivitas absensi di sekolah (minimal 1 tap) dan tanggal <= hari ini.
 *   Jika belum ada satu pun tap pada tanggal tersebut, seluruh siswa berstatus "kosong" (-).
 */
export function buildMonthStats(
  siswa: Siswa[],
  kehadiran: Kehadiran[],
  aturan: AturanJam[],
  ym: string,
  today: string,
): MonthStats {
  const days = schoolDays(ym, aturan);
  const activeDatesWithTap = new Set<string>();
  const byStudent = new Map<string, Map<string, Kehadiran>>();
  for (const k of kehadiran) {
    activeDatesWithTap.add(k.tanggal);
    if (!byStudent.has(k.siswa_id)) byStudent.set(k.siswa_id, new Map());
    byStudent.get(k.siswa_id)!.set(k.tanggal, k);
  }

  let totalTepat = 0;
  let totalTelat = 0;
  let totalAbsen = 0;
  let sumPct = 0;
  let seringTelat = 0;

  const students: StudentMonth[] = siswa.map((s) => {
    const recs = byStudent.get(s.id) ?? new Map<string, Kehadiran>();
    let tepat = 0, telat = 0, absen = 0, gerbang = 0;
    const cells: StudentMonth["cells"] = {};
    for (const d of days) {
      const r = recs.get(d.date);
      if (r) {
        if (r.status === "tepat_waktu") tepat++;
        else telat++;
        gerbang++;
        cells[d.date] = { status: r.status, record: r };
      } else if (d.date <= today && activeDatesWithTap.has(d.date)) {
        absen++;
        cells[d.date] = { status: "absen" };
      } else {
        cells[d.date] = { status: "kosong" };
      }
    }
    const denom = tepat + telat + absen;
    const pctTW = denom ? Math.round((tepat / denom) * 100) : 0;
    totalTepat += tepat;
    totalTelat += telat;
    totalAbsen += absen;
    sumPct += pctTW;
    if (telat >= 3) seringTelat++;
    return { siswa: s, tepat, telat, absen, pctTW, gerbang, cells };
  });

  return {
    days,
    students,
    totalTepat,
    totalTelat,
    totalAbsen,
    avgPct: siswa.length ? Math.round(sumPct / siswa.length) : 0,
    seringTelat,
  };
}

export function initials(nama: string) {
  return nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function normalizeUid(uid: string) {
  return uid.trim().toUpperCase().replace(/[\s:]/g, "");
}

export const STATUS_LABEL: Record<CellStatus, string> = {
  tepat_waktu: "Tepat Waktu",
  telat: "Telat",
  absen: "Absen",
  kosong: "Belum ada data",
};
