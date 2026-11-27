import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/api";
import { buildMonthStats } from "@/lib/attendance";
import { DEMO_ATURAN, DEMO_KEHADIRAN, DEMO_SISWA, isSupabaseConfigured } from "@/lib/demo";
import { workbookResponse } from "@/lib/excel";
import { fetchAll } from "@/lib/fetch-all";
import { HARI_SHORT, formatTime, monthLabel, monthRange, todayStr } from "@/lib/time";
import type { AturanJam, Kehadiran, Siswa } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const r = await requireSession();
  if ("error" in r) return r.error;
  const { supabase, sekolah } = r.ctx;

  const bulan = req.nextUrl.searchParams.get("bulan") ?? todayStr(sekolah.timezone).slice(0, 7);
  const kelas = req.nextUrl.searchParams.get("kelas") || "";
  if (!/^\d{4}-\d{2}$/.test(bulan)) return NextResponse.json({ ok: false, error: "INVALID_MONTH" }, { status: 400 });

  const { start, end } = monthRange(bulan);
  let siswa: Siswa[] = DEMO_SISWA.filter((s) => !kelas || s.kelas === kelas);
  let aturanList: AturanJam[] = DEMO_ATURAN;
  let kehadiran: Kehadiran[] = DEMO_KEHADIRAN;

  if (isSupabaseConfigured()) {
    try {
      const [s, a, k] = await Promise.all([
        fetchAll<Siswa>((f, t) => {
          let q = supabase.from("siswa").select("*").eq("aktif", true).order("kelas").order("nama").range(f, t);
          if (kelas) q = q.eq("kelas", kelas);
          return q;
        }),
        supabase.from("aturan_jam").select("*"),
        fetchAll<Kehadiran>((f, t) =>
          supabase.from("kehadiran").select("*").gte("tanggal", start).lte("tanggal", end).range(f, t),
        ),
      ]);
      siswa = s;
      aturanList = (a.data ?? []) as AturanJam[];
      kehadiran = k;
    } catch {
      // Gunakan fallback demo jika database belum aktif
    }
  }

  const stats = buildMonthStats(siswa, kehadiran, aturanList, bulan, todayStr(sekolah.timezone));
  const tz = sekolah.timezone;

  const header = [
    "No",
    "Nama Siswa",
    "Kelas",
    "NFC UID",
    ...stats.days.map((d) => `${HARI_SHORT[d.hari]} ${d.day}`),
    "Tepat Waktu",
    "Telat",
    "Absen",
    "% TW",
  ];
  const rows = stats.students.map((s, i) => [
    i + 1,
    s.siswa.nama,
    s.siswa.kelas,
    s.siswa.nfc_uid,
    ...stats.days.map((d) => {
      const c = s.cells[d.date];
      if (c.status === "absen") return "A";
      if (c.status === "kosong") return "-";
      const jam = c.record ? formatTime(c.record.jam_tap, tz) : "";
      return `${c.status === "tepat_waktu" ? "TW" : "T"} ${jam}`;
    }),
    s.tepat,
    s.telat,
    s.absen,
    `${s.pctTW}%`,
  ]);

  const detail = [
    ["Tanggal", "Nama Siswa", "Kelas", "Jam Tap", "Titik Tap", "Status"],
    ...kehadiran
      .filter((k) => stats.students.some((s) => s.siswa.id === k.siswa_id))
      .sort((a, b) => a.jam_tap.localeCompare(b.jam_tap))
      .map((k) => {
        const s = siswa.find((x) => x.id === k.siswa_id);
        return [
          k.tanggal,
          s?.nama ?? "-",
          s?.kelas ?? "-",
          formatTime(k.jam_tap, tz),
          "Gerbang Utama",
          k.status === "tepat_waktu" ? "Tepat Waktu" : "Telat",
        ];
      }),
  ];

  const title = [[`Rekap Kehadiran AXENTA — ${sekolah.nama} — ${monthLabel(bulan)}${kelas ? ` — Kelas ${kelas}` : ""}`], ["Keterangan: TW = Tepat Waktu, T = Telat, A = Absen, - = belum ada data"], []];

  return workbookResponse(
    [
      { name: "Rekap", rows: [...title, header, ...rows], widths: [5, 24, 7, 13, ...stats.days.map(() => 9), 11, 7, 7, 7] },
      { name: "Detail Tap", rows: detail, widths: [12, 24, 7, 9, 16, 12] },
    ],
    `Rekap_Kehadiran_AXENTA_${kelas || "Semua"}_${bulan}.xlsx`,
  );
}
