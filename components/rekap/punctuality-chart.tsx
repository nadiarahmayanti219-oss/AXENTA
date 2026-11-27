"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { COLORS, tooltipStyle } from "@/components/dashboard/charts";
import { Card, CardHeader } from "@/components/ui/card";
import type { MonthStats } from "@/lib/attendance";
import { cn } from "@/lib/cn";
import { HARI_SHORT, formatTime, hhmm, toMinutes } from "@/lib/time";
import type { AturanJam, Kehadiran } from "@/lib/types";

export function PunctualityChart({
  stats,
  kehadiran,
  aturan,
  tz,
}: {
  stats: MonthStats;
  kehadiran: Kehadiran[];
  aturan: AturanJam[];
  tz: string;
}) {
  const [tab, setTab] = useState<"harian" | "jam">("harian");

  const daily = useMemo(() => {
    const ids = new Set(stats.students.map((s) => s.siswa.id));
    return stats.days.map((d) => {
      const recs = kehadiran.filter((k) => k.tanggal === d.date && ids.has(k.siswa_id));
      return {
        label: `${HARI_SHORT[d.hari]} ${d.day}`,
        tepat: recs.filter((k) => k.status === "tepat_waktu").length,
        telat: recs.filter((k) => k.status === "telat").length,
      };
    });
  }, [stats, kehadiran]);

  // Tenggat yang paling umum dipakai sebagai garis referensi
  const tenggat = useMemo(() => {
    const counts = new Map<string, number>();
    aturan.filter((a) => a.aktif).forEach((a) => counts.set(hhmm(a.tenggat_absensi), (counts.get(hhmm(a.tenggat_absensi)) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "07:15";
  }, [aturan]);

  const histogram = useMemo(() => {
    const ids = new Set(stats.students.map((s) => s.siswa.id));
    const buckets = new Map<number, number>();
    kehadiran
      .filter((k) => ids.has(k.siswa_id))
      .forEach((k) => {
        const m = toMinutes(formatTime(k.jam_tap, tz));
        const b = Math.floor(m / 5) * 5;
        buckets.set(b, (buckets.get(b) ?? 0) + 1);
      });
    if (!buckets.size) return [];
    const keys = [...buckets.keys()];
    const min = Math.min(...keys, toMinutes(tenggat) - 30);
    const max = Math.max(...keys, toMinutes(tenggat) + 15);
    const out = [];
    for (let m = min; m <= max; m += 5) {
      const label = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
      out.push({ label, jumlah: buckets.get(m) ?? 0, late: m > toMinutes(tenggat) });
    }
    return out;
  }, [stats, kehadiran, tz, tenggat]);

  const axis = { tickLine: false, axisLine: false, tick: { fill: COLORS.axis, fontSize: 11 } } as const;

  return (
    <Card className="p-6">
      <CardHeader
        title="Grafik Ketepatan Waktu"
        subtitle={tab === "harian" ? "Visualisasi kehadiran per hari" : `Sebaran jam tap (interval 5 menit) · tenggat ${tenggat}`}
        action={
          <div className="flex rounded-full bg-slate-100 p-1 text-xs font-medium">
            {(["harian", "jam"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn("rounded-full px-3 py-1.5 transition-colors", tab === t ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink")}
              >
                {t === "harian" ? "Grafik Harian" : "Detail Jam Tap"}
              </button>
            ))}
          </div>
        }
      />
      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          {tab === "harian" ? (
            <BarChart data={daily} margin={{ left: -20, right: 8 }}>
              <CartesianGrid vertical={false} stroke={COLORS.grid} strokeDasharray="4 4" />
              <XAxis dataKey="label" {...axis} interval={0} angle={daily.length > 15 ? -35 : 0} textAnchor={daily.length > 15 ? "end" : "middle"} height={daily.length > 15 ? 48 : 30} />
              <YAxis allowDecimals={false} {...axis} domain={[0, (max: number) => Math.max(4, max)]} />
              <Tooltip {...tooltipStyle} />
              <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12, color: "#64748B" }} />
              <Bar dataKey="tepat" name="Tepat Waktu" stackId="a" fill={COLORS.tepat} maxBarSize={24} />
              <Bar dataKey="telat" name="Telat" stackId="a" fill={COLORS.telat} radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          ) : (
            <BarChart data={histogram} margin={{ left: -20, right: 8 }}>
              <CartesianGrid vertical={false} stroke={COLORS.grid} strokeDasharray="4 4" />
              <XAxis dataKey="label" {...axis} />
              <YAxis allowDecimals={false} {...axis} domain={[0, (max: number) => Math.max(4, max)]} />
              <Tooltip {...tooltipStyle} formatter={(v) => [`${v} tap`, "Jumlah"]} />
              <ReferenceLine x={tenggat} stroke={COLORS.gerbang} strokeDasharray="4 4" label={{ value: "Tenggat", fill: COLORS.gerbang, fontSize: 11, position: "top" }} />
              <Bar dataKey="jumlah" radius={[4, 4, 0, 0]} maxBarSize={28}>
                {histogram.map((h) => (
                  <Cell key={h.label} fill={h.late ? COLORS.telat : COLORS.tepat} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
