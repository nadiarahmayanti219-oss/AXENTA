import { Award, Info, Medal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { initials, type StudentMonth } from "@/lib/attendance";

export function GateSummaryCard({ tepat, telat, total }: { tepat: number; telat: number; total: number }) {
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  return (
    <Card className="p-6">
      <p className="overline text-muted">Ringkasan Tap Gerbang Utama Hari Ini</p>
      <div className="mt-4 space-y-5">
        <DistRow label="Tepat Waktu" color="bg-success" text="text-success" count={tepat} pct={pct(tepat)} />
        <DistRow label="Terlambat" color="bg-warning" text="text-amber-700" count={telat} pct={pct(telat)} />
      </div>
      <div className="mt-6 flex gap-2.5 rounded-xl border border-primary-100 bg-primary-50 p-4 text-xs leading-5 text-primary-dark">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          <b>Info Gerbang Utama:</b> Seluruh absensi direkam melalui perangkat NFC Reader <code>RDR-GERBANG-01</code> di
          Gerbang Utama Sekolah secara real-time.
        </p>
      </div>
    </Card>
  );
}

function DistRow({ label, color, text, count, pct }: { label: string; color: string; text: string; count: number; pct: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[13px]">
        <span className="flex items-center gap-2 text-ink">
          <span className={`h-2 w-2 rounded-full ${color}`} />
          {label}
        </span>
        <span className={`font-semibold ${text}`}>
          {count} siswa ({pct}%)
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const MEDAL = ["text-yellow-500", "text-slate-400", "text-amber-700"];

export function PunctualityLeaderboard({ students }: { students: StudentMonth[] }) {
  const top = students
    .filter((s) => s.tepat > 0)
    .sort((a, b) => b.tepat - a.tepat || b.pctTW - a.pctTW)
    .slice(0, 10);
  return (
    <Card className="p-6">
      <p className="overline flex items-center gap-2 text-muted">
        <Award className="h-4 w-4 text-yellow-500" />
        Siswa Paling Tepat Waktu
      </p>
      {top.length === 0 ? (
        <EmptyState>Belum ada data absensi siswa.</EmptyState>
      ) : (
        <ol className="mt-4 space-y-2">
          {top.map((s, i) => (
            <li key={s.siswa.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50">
              <span className="w-6 text-center text-sm font-bold text-muted">
                {i < 3 ? <Medal className={`mx-auto h-5 w-5 ${MEDAL[i]}`} /> : i + 1}
              </span>
              <Avatar text={initials(s.siswa.nama)} className="h-8 w-8 text-[11px]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">{s.siswa.nama}</p>
                <p className="text-[11px] text-muted">
                  Kelas {s.siswa.kelas} · {s.tepat}× tepat waktu
                </p>
              </div>
              <span className="text-sm font-bold text-success">{s.pctTW}%</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
