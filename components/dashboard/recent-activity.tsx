"use client";

import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { cn } from "@/lib/cn";
import { formatDate, formatTime } from "@/lib/time";
import type { KehadiranWithSiswa } from "@/lib/types";

export function LokasiChip() {
  return <Badge tone="primary">Gerbang Utama</Badge>;
}

export function StatusChip({ status }: { status: "tepat_waktu" | "telat" }) {
  return status === "tepat_waktu" ? <Badge tone="success">Tepat Waktu</Badge> : <Badge tone="warning">Telat</Badge>;
}

export function RecentActivityTable({
  rows,
  loading,
  highlight,
  tz,
}: {
  rows: KehadiranWithSiswa[];
  loading: boolean;
  highlight: Set<string>;
  tz: string;
}) {
  return (
    <Card className="flex flex-col p-6">
      <CardHeader
        title="Aktivitas Terbaru"
        subtitle="Tap NFC terakhir yang tercatat di Gerbang Utama"
        action={
          <Link href="/rekap" className="text-[13px] font-medium text-primary hover:underline">
            Lihat Semua Data
          </Link>
        }
      />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-[13px]">
          <thead>
            <tr className={cn("text-subtle", rows.length > 0 && "border-b border-line")}>
              {["Siswa", "Kelas", "Titik Tap", "Jam Tap", "Tanggal", "Status"].map((h) => (
                <th key={h} scope="col" className="overline py-2 pr-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="py-2.5">
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))}
            {!loading &&
              rows.map((r) => (
                <tr key={r.id} className={cn("border-b border-line last:border-0", highlight.has(r.id) && "animate-highlight")}>
                  <td className="py-3 pr-3 font-medium text-ink">{r.siswa?.nama ?? "-"}</td>
                  <td className="py-3 pr-3 text-muted">{r.siswa?.kelas ?? "-"}</td>
                  <td className="py-3 pr-3">
                    <LokasiChip />
                  </td>
                  <td className="py-3 pr-3 font-medium tabular-nums text-ink">{formatTime(r.jam_tap, tz)}</td>
                  <td className="py-3 pr-3 text-muted">{formatDate(r.tanggal)}</td>
                  <td className="py-3">
                    <StatusChip status={r.status} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && <EmptyState>Belum ada aktivitas absensi terbaru.</EmptyState>}
      </div>
    </Card>
  );
}
