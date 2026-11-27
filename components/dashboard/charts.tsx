"use client";

import { ArrowUpDown, Zap } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/input";

export const COLORS = {
  tepat: "#15803D",
  telat: "#F59E0B",
  absen: "#94A3B8",
  halte: "#15803D",
  gerbang: "#DC2626",
  grid: "#EEF2F7",
  axis: "#94A3B8",
  primary: "#2563EB",
};

export const tooltipStyle = {
  contentStyle: {
    borderRadius: 10,
    border: "1px solid #E5E9F0",
    boxShadow: "0 4px 16px rgba(15,23,42,.08)",
    fontSize: 12,
  },
  cursor: { fill: "rgba(37,99,235,0.05)" },
};

export function AttendanceDonut({ tepat, telat, absen }: { tepat: number; telat: number; absen: number }) {
  const total = tepat + telat + absen;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const data = [
    { name: "Tepat Waktu", value: tepat, fill: COLORS.tepat },
    { name: "Telat", value: telat, fill: COLORS.telat },
    { name: "Absen", value: absen, fill: COLORS.absen },
  ];

  return (
    <Card className="flex flex-col justify-between p-6">
      <CardHeader title="Distribusi Kehadiran" subtitle="Ringkasan status bulan berjalan" />
      <div className="relative mx-auto my-6 flex h-56 w-56 shrink-0 items-center justify-center">
        {total > 0 && (
          <ResponsiveContainer width={224} height={224}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={74}
                outerRadius={98}
                paddingAngle={2}
                stroke="none"
                isAnimationActive
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={d.fill} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        )}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[28px] font-bold leading-8 text-ink">{total}</span>
          <span className="overline mt-0.5 text-subtle">Total</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[13px] text-muted">
        <Legend2 color={COLORS.tepat} label="Tepat Waktu" value={`${pct(tepat)}%`} />
        <Legend2 color={COLORS.telat} label="Telat" value={`${pct(telat)}%`} />
        <Legend2 color={COLORS.absen} label="Absen" value={`${pct(absen)}%`} />
      </div>
    </Card>
  );
}

function Legend2({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label} <b className="text-ink">{value}</b>
    </span>
  );
}

export interface WeeklyPoint {
  label: string;
  date: string;
  halte: number;
  gerbang: number;
}

export function WeeklyLocationChart({
  data,
  order,
  onOrderChange,
}: {
  data: WeeklyPoint[];
  order: "asc" | "desc";
  onOrderChange: (o: "asc" | "desc") => void;
}) {
  const sorted = order === "asc" ? data : [...data].reverse();
  return (
    <Card className="flex h-full flex-col p-6">
      <CardHeader
        icon={<Zap className="mt-0.5 h-4 w-4 text-primary" />}
        title="Tren Lokasi Tap Mingguan"
        subtitle="Jumlah sebaran tap di halte sekolah vs gerbang dalam 5 hari sekolah terakhir."
        action={
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-subtle" />
            <Select value={order} onChange={(e) => onOrderChange(e.target.value as "asc" | "desc")} aria-label="Urutan tanggal">
              <option value="asc">Tanggal (Lama → Baru)</option>
              <option value="desc">Tanggal (Baru → Lama)</option>
            </Select>
          </div>
        }
      />
      <div className="mt-6 h-72 w-full">
        <ResponsiveContainer width="100%" height={288}>
          <BarChart data={sorted} barGap={4} margin={{ left: -20, right: 8 }}>
            <CartesianGrid vertical={false} stroke={COLORS.grid} strokeDasharray="4 4" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: COLORS.axis, fontSize: 11 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: COLORS.axis, fontSize: 11 }} domain={[0, (max: number) => Math.max(4, max)]} />
            <Tooltip {...tooltipStyle} />
            <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12, color: "#64748B", paddingTop: 12 }} />
            <Bar dataKey="halte" name="Tap Halte (Rendah Emisi)" fill={COLORS.halte} radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="gerbang" name="Tap Gerbang (Potensi Tinggi)" fill={COLORS.gerbang} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
