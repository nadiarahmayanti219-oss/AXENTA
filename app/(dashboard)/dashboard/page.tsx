"use client";

import { AlertTriangle, CalendarDays, Clock, Leaf, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/app-shell";
import { useApp } from "@/components/providers/app-provider";
import { AttendanceDonut, WeeklyLocationChart, type WeeklyPoint } from "@/components/dashboard/charts";
import { EcoLeaderboard, TapDistributionCard } from "@/components/dashboard/eco";
import { RecentActivityTable } from "@/components/dashboard/recent-activity";
import { HeroStatCard, StatCard } from "@/components/dashboard/stat-cards";
import { useRealtime } from "@/hooks/use-realtime";
import { aturanMap, buildMonthStats, schoolDays } from "@/lib/attendance";
import { errMsg, loadAturan, loadKehadiranMonth, loadKehadiranRange, loadSiswa } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/demo";
import { createClient } from "@/lib/supabase/client";
import { HARI_SHORT, addDays, currentMonth, hariOf, todayStr } from "@/lib/time";
import type { AturanJam, Kehadiran, KehadiranWithSiswa, Siswa } from "@/lib/types";

export default function DashboardPage() {
  const { sekolah } = useApp();
  const tz = sekolah.timezone;
  const [loading, setLoading] = useState(true);
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [aturan, setAturan] = useState<AturanJam[]>([]);
  const [kehadiran, setKehadiran] = useState<Kehadiran[]>([]);
  const [weeklyRaw, setWeeklyRaw] = useState<Kehadiran[]>([]);
  const [recent, setRecent] = useState<KehadiranWithSiswa[]>([]);
  const [highlight, setHighlight] = useState<Set<string>>(new Set());
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const firstLoad = useRef(true);
  const recentIds = useRef<Set<string>>(new Set());

  const ym = currentMonth(tz);
  const today = todayStr(tz);

  const weekDates = useMemo(() => {
    const map = aturanMap(aturan);
    const out: string[] = [];
    for (let i = 0; i < 31 && out.length < 5; i++) {
      const d = addDays(today, -i);
      if (map.get(hariOf(d))?.aktif) out.unshift(d);
    }
    return out;
  }, [aturan, today]);

  const load = useCallback(async () => {
    const sb = createClient();
    try {
      const [s, a, k, r] = await Promise.all([
        loadSiswa(sb, { aktifOnly: true }),
        loadAturan(sb),
        loadKehadiranMonth(sb, ym),
        isSupabaseConfigured()
          ? sb.from("kehadiran").select("*, siswa:siswa_id (nama, kelas)").order("jam_tap", { ascending: false }).limit(10)
          : Promise.resolve({ data: [] }),
      ]);
      setSiswa(s);
      setAturan(a);
      setKehadiran(k);
      const recentRows = (r.data ?? []) as KehadiranWithSiswa[];
      if (!firstLoad.current) {
        const fresh = recentRows.filter((x) => !recentIds.current.has(x.id));
        if (fresh.length) {
          setHighlight(new Set(fresh.map((x) => x.id)));
          const f = fresh[0];
          toast.success(`Tap baru: ${f.siswa?.nama ?? "Siswa"} — ${f.status === "tepat_waktu" ? "Tepat Waktu" : "Telat"}`);
        }
      }
      recentIds.current = new Set(recentRows.map((x) => x.id));
      setRecent(recentRows);
      firstLoad.current = false;
    } catch (e) {
      toast.error(`Gagal memuat data: ${errMsg(e)}`);
    } finally {
      setLoading(false);
    }
  }, [ym]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!weekDates.length) return;
    loadKehadiranRange(createClient(), weekDates[0], weekDates[weekDates.length - 1])
      .then(setWeeklyRaw)
      .catch(() => {});
  }, [weekDates, kehadiran]);

  // Debounce refetch saat ada event realtime
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleReload = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(load, 400);
  }, [load]);
  useRealtime("kehadiran", scheduleReload);
  useRealtime("siswa", scheduleReload);

  const stats = useMemo(() => buildMonthStats(siswa, kehadiran, aturan, ym, today), [siswa, kehadiran, aturan, ym, today]);
  const hariSekolah = useMemo(() => schoolDays(ym, aturan).length, [ym, aturan]);
  const activeDaysLabel = useMemo(() => {
    const act = aturan.filter((a) => a.aktif).map((a) => a.hari).sort();
    if (!act.length) return "Libur";
    const contiguous = act.every((h, i) => i === 0 || h === act[i - 1] + 1);
    return contiguous ? `${HARI_SHORT[act[0]]}-${HARI_SHORT[act[act.length - 1]]}` : `${act.length} hari/minggu`;
  }, [aturan]);

  const todayRecs = kehadiran.filter((k) => k.tanggal === today);
  const halteToday = todayRecs.filter((k) => k.lokasi === "halte").length;
  const gerbangToday = todayRecs.length - halteToday;

  const weekly: WeeklyPoint[] = weekDates.map((d) => {
    const recs = weeklyRaw.filter((k) => k.tanggal === d);
    return {
      date: d,
      label: `${HARI_SHORT[hariOf(d)]} ${Number(d.slice(8))}`,
      halte: recs.filter((k) => k.lokasi === "halte").length,
      gerbang: recs.filter((k) => k.lokasi === "gerbang").length,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard Kehadiran" subtitle="Pantau ketepatan waktu dan aktivitas kehadiran siswa secara real-time." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <HeroStatCard icon={<Users className="h-5 w-5" />} badge="Aktif" label="Total Siswa Terpantau" value={siswa.length} loading={loading} />
        <HeroStatCard
          icon={<Clock className="h-5 w-5" />}
          badge={stats.avgPct >= 80 ? "Baik" : "Perlu Perhatian"}
          label="Rata-rata Ketepatan Waktu"
          value={`${stats.avgPct}%`}
          loading={loading}
        />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} badge="≥3 hari" label="Siswa Sering Telat" value={stats.seringTelat} caption="siswa di bulan ini" loading={loading} />
        <StatCard icon={<CalendarDays className="h-5 w-5" />} badge={activeDaysLabel} label="Hari Sekolah Bulan Ini" value={hariSekolah} caption="hari efektif" loading={loading} />
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <AttendanceDonut tepat={stats.totalTepat} telat={stats.totalTelat} absen={stats.totalAbsen} />
        </div>
        <div className="xl:col-span-7">
          <RecentActivityTable rows={recent} loading={loading} highlight={highlight} tz={tz} />
        </div>
      </div>

      <div className="pt-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
          <Leaf className="h-5 w-5 text-success" />
          Analisis Asesmen Karakter Lingkungan (Eco-Awareness)
        </h2>
        <p className="mt-0.5 text-xs text-muted">Indikator estimasi kepedulian lingkungan berdasarkan lokasi tap NFC siswa.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-5">
          <TapDistributionCard halte={halteToday} gerbang={gerbangToday} total={todayRecs.length} />
          <EcoLeaderboard students={stats.students} />
        </div>
        <div className="xl:col-span-7">
          <WeeklyLocationChart data={weekly} order={order} onOrderChange={setOrder} />
        </div>
      </div>
    </div>
  );
}
