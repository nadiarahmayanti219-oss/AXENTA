"use client";

import { Check } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { STATUS_LABEL, type CellStatus, type MonthStats, type StudentMonth } from "@/lib/attendance";
import { cn } from "@/lib/cn";
import { HARI_SHORT, formatTime } from "@/lib/time";
import type { Kehadiran } from "@/lib/types";

export function StatusCell({ status, record, tz }: { status: CellStatus; record?: Kehadiran; tz: string }) {
  const title = record
    ? `${STATUS_LABEL[status]} · ${formatTime(record.jam_tap, tz)} · ${record.lokasi === "halte" ? "Halte" : "Gerbang"}`
    : STATUS_LABEL[status];
  if (status === "kosong") return <span className="text-subtle" title={title}>-</span>;
  const cls = {
    tepat_waktu: "bg-green-50 text-success",
    telat: "bg-amber-50 text-amber-700",
    absen: "bg-danger-50 text-danger",
  }[status];
  return (
    <span title={title} className={cn("inline-flex h-[22px] w-[22px] items-center justify-center rounded-full text-[10px] font-bold", cls)}>
      {status === "tepat_waktu" ? <Check className="h-3 w-3" strokeWidth={3} /> : status === "telat" ? "T" : "A"}
    </span>
  );
}

export function RekapTable({
  stats,
  loading,
  tz,
  onSelect,
}: {
  stats: MonthStats;
  loading: boolean;
  tz: string;
  onSelect: (s: StudentMonth) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-3 p-6 pb-4">
        <CardHeader title="Tabel Rekap Kehadiran" subtitle={`${stats.students.length} siswa • ${stats.days.length} hari sekolah`} />
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted">
          <LegendDot cls="bg-green-50 text-success" label="Tepat Waktu" sym="✓" />
          <LegendDot cls="bg-amber-50 text-amber-700" label="Telat" sym="T" />
          <LegendDot cls="bg-danger-50 text-danger" label="Absen" sym="A" />
          <span className="inline-flex items-center gap-1.5"><span className="text-subtle">-</span> Belum ada data</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-[13px]">
          <thead>
            <tr className="text-subtle">
              <th scope="col" className="overline sticky left-0 z-10 w-12 border-y border-line bg-slate-50 px-4 py-3 text-left">No</th>
              <th scope="col" className="overline sticky left-12 z-10 min-w-48 border-y border-r border-line bg-slate-50 px-3 py-3 text-left">Nama Siswa</th>
              {stats.days.map((d) => (
                <th key={d.date} scope="col" className="min-w-14 border-y border-line bg-slate-50 px-1 py-2 text-center">
                  <div className="overline">{HARI_SHORT[d.hari]}</div>
                  <div className="text-[11px] font-normal">{d.day}</div>
                </th>
              ))}
              <th scope="col" className="overline sticky right-0 z-10 min-w-16 border-y border-l border-line bg-slate-50 px-3 py-3 text-center">% TW</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={stats.days.length + 3} className="border-b border-line px-4 py-3">
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))}
            {!loading &&
              stats.students.map((s, i) => (
                <tr key={s.siswa.id} className="group">
                  <td className="sticky left-0 border-b border-line bg-white px-4 py-2.5 text-muted group-hover:bg-slate-50">{i + 1}</td>
                  <td className="sticky left-12 border-b border-r border-line bg-white px-3 py-2.5 group-hover:bg-slate-50">
                    <button onClick={() => onSelect(s)} className="text-left font-medium text-primary hover:underline">
                      {s.siswa.nama}
                    </button>
                  </td>
                  {stats.days.map((d) => (
                    <td key={d.date} className="border-b border-line px-1 py-2.5 text-center group-hover:bg-slate-50">
                      <StatusCell status={s.cells[d.date].status} record={s.cells[d.date].record} tz={tz} />
                    </td>
                  ))}
                  <td
                    className={cn(
                      "sticky right-0 border-b border-l border-line bg-white px-3 py-2.5 text-center font-bold group-hover:bg-slate-50",
                      s.pctTW >= 80 ? "text-success" : "text-danger",
                    )}
                  >
                    {s.pctTW}%
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {!loading && stats.students.length === 0 && <EmptyState>Tidak ada siswa pada filter ini.</EmptyState>}
        {!loading && stats.students.length > 0 && stats.days.length === 0 && (
          <EmptyState>Tidak ada hari sekolah aktif di bulan ini. Atur di menu Aturan Jam Sekolah.</EmptyState>
        )}
      </div>
    </Card>
  );
}

function LegendDot({ cls, label, sym }: { cls: string; label: string; sym: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold", cls)}>{sym}</span>
      {label}
    </span>
  );
}
