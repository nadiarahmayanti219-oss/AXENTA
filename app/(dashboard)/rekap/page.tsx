"use client";

import { Calendar, Download, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { LokasiChip, StatusChip } from "@/components/dashboard/recent-activity";
import { DeleteKehadiranDialog } from "@/components/kehadiran/delete-dialog";
import { PageHeader } from "@/components/layout/app-shell";
import { useApp } from "@/components/providers/app-provider";
import { PunctualityChart } from "@/components/rekap/punctuality-chart";
import { RekapTable } from "@/components/rekap/rekap-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRealtime } from "@/hooks/use-realtime";
import { buildMonthStats, type StudentMonth } from "@/lib/attendance";
import { errMsg, loadAturan, loadKehadiranMonth, loadSiswa } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { HARI_LONG, currentMonth, formatDate, formatTime, monthLabel, todayStr } from "@/lib/time";
import type { AturanJam, Kehadiran, Siswa } from "@/lib/types";

export default function RekapPage() {
  const { sekolah, isAdmin } = useApp();
  const tz = sekolah.timezone;
  const [bulan, setBulan] = useState(currentMonth(tz));
  const [kelas, setKelas] = useState("");
  const [loading, setLoading] = useState(true);
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [aturan, setAturan] = useState<AturanJam[]>([]);
  const [kehadiran, setKehadiran] = useState<Kehadiran[]>([]);
  const [selected, setSelected] = useState<StudentMonth | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const monthInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const sb = createClient();
    try {
      const [s, a, k] = await Promise.all([loadSiswa(sb, { aktifOnly: true }), loadAturan(sb), loadKehadiranMonth(sb, bulan)]);
      setSiswa(s);
      setAturan(a);
      setKehadiran(k);
    } catch (e) {
      toast.error(`Gagal memuat rekap: ${errMsg(e)}`);
    } finally {
      setLoading(false);
    }
  }, [bulan]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useRealtime("kehadiran", () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(load, 500);
  });

  const kelasList = useMemo(() => [...new Set(siswa.map((s) => s.kelas))].sort(), [siswa]);
  const filtered = useMemo(() => (kelas ? siswa.filter((s) => s.kelas === kelas) : siswa), [siswa, kelas]);
  const stats = useMemo(() => buildMonthStats(filtered, kehadiran, aturan, bulan, todayStr(tz)), [filtered, kehadiran, aturan, bulan, tz]);

  const exportUrl = `/api/rekap/export?bulan=${bulan}${kelas ? `&kelas=${encodeURIComponent(kelas)}` : ""}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Rekap Kehadiran" subtitle="Pantau rekap kehadiran siswa di Gerbang Utama berdasarkan bulan dan kelas." />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-4 text-[13px] font-medium text-ink hover:bg-slate-50">
            <Calendar className="h-4 w-4 text-muted" />
            {monthLabel(bulan)}
            <input
              ref={monthInput}
              type="month"
              value={bulan}
              onChange={(e) => e.target.value && setBulan(e.target.value)}
              onClick={(e) => (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.()}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Pilih bulan"
            />
          </label>
          <Select value={kelas} onChange={(e) => setKelas(e.target.value)} className="rounded-full" aria-label="Filter kelas">
            <option value="">Semua Kelas</option>
            {kelasList.map((k) => (
              <option key={k} value={k}>
                Kelas {k}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Hapus Kehadiran
            </Button>
          )}
          <a href={exportUrl}>
            <Button variant="outline">
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </a>
        </div>
      </div>

      <RekapTable stats={stats} loading={loading} tz={tz} onSelect={setSelected} />
      <PunctualityChart stats={stats} kehadiran={kehadiran} aturan={aturan} tz={tz} />

      <DeleteKehadiranDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} defaultMonth={bulan} onDone={load} allowTotal={false} />

      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.siswa.nama ?? ""}
        description={selected ? `Kelas ${selected.siswa.kelas} · ${selected.siswa.nfc_uid} · ${monthLabel(bulan)}` : undefined}
        className="max-w-xl"
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <Mini label="Tepat Waktu" value={selected.tepat} cls="text-success" />
              <Mini label="Telat" value={selected.telat} cls="text-amber-600" />
              <Mini label="Absen" value={selected.absen} cls="text-danger" />
            </div>
            <div className="divide-y divide-line rounded-xl border border-line">
              {stats.days
                .filter((d) => selected.cells[d.date].status !== "kosong")
                .map((d) => {
                  const c = selected.cells[d.date];
                  return (
                    <div key={d.date} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
                      <span className="text-ink">
                        {HARI_LONG[d.hari]}, {formatDate(d.date)}
                      </span>
                      {c.record ? (
                        <span className="flex items-center gap-2">
                          <span className="tabular-nums text-muted">{formatTime(c.record.jam_tap, tz)}</span>
                          <LokasiChip />
                          <StatusChip status={c.record.status} />
                        </span>
                      ) : (
                        <Badge tone="danger">Absen</Badge>
                      )}
                    </div>
                  );
                })}
              {stats.days.every((d) => selected.cells[d.date].status === "kosong") && (
                <p className="px-4 py-6 text-center text-sm text-subtle">Belum ada data di bulan ini.</p>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function Mini({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className={`text-xl font-bold ${cls}`}>{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
