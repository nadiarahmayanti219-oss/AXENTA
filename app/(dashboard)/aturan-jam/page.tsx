"use client";

import { Clock, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/app-shell";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, Switch } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/misc";
import { cn } from "@/lib/cn";
import { errMsg, loadAturan } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { HARI_LONG, hhmm } from "@/lib/time";
import type { AturanJam } from "@/lib/types";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

function defaultRows(sekolah_id: string): AturanJam[] {
  return Array.from({ length: 7 }, (_, i) => ({
    sekolah_id,
    hari: i + 1,
    jam_masuk: "07:00",
    tenggat_absensi: "07:00",
    aktif: i < 5,
  }));
}

export default function AturanJamPage() {
  const { profil, isAdmin } = useApp();
  const [rows, setRows] = useState<AturanJam[]>([]);
  const [snapshot, setSnapshot] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await loadAturan(createClient());
      const norm = (data.length === 7 ? data : defaultRows(profil.sekolah_id)).map((r) => ({
        ...r,
        jam_masuk: hhmm(r.jam_masuk),
        tenggat_absensi: hhmm(r.tenggat_absensi),
      }));
      setRows(norm);
      setSnapshot(JSON.stringify(norm));
    } catch (e) {
      toast.error(`Gagal memuat aturan jam: ${errMsg(e)}`);
    } finally {
      setLoading(false);
    }
  }, [profil.sekolah_id]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = JSON.stringify(rows) !== snapshot;

  function patch(hari: number, partial: Partial<AturanJam>) {
    setRows((prev) => prev.map((r) => (r.hari === hari ? { ...r, ...partial } : r)));
  }

  async function save() {
    for (const r of rows) {
      if (r.tenggat_absensi < r.jam_masuk) {
        toast.error(`${HARI_LONG[r.hari]}: Tenggat absensi tidak boleh lebih awal dari jam masuk`);
        return;
      }
    }
    setSaving(true);
    const payload = rows.map((r) => ({
      sekolah_id: profil.sekolah_id,
      hari: r.hari,
      jam_masuk: r.jam_masuk,
      tenggat_absensi: r.tenggat_absensi,
      aktif: r.aktif,
    }));
    const { error } = await createClient().from("aturan_jam").upsert(payload, { onConflict: "sekolah_id,hari" });
    setSaving(false);
    if (error) {
      toast.error(`Gagal menyimpan: ${errMsg(error)}`);
      return;
    }
    setSnapshot(JSON.stringify(rows));
    toast.success("Aturan jam sekolah berhasil disimpan");
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Aturan Jam Sekolah" subtitle="Kelola jadwal jam masuk dan tenggat absensi sekolah per hari." />

      <Card className="p-6">
        <div className="flex items-start gap-2.5">
          <Clock className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Jam Absensi Kehadiran</h2>
            <p className="mt-0.5 text-xs text-muted">
              Atur batas waktu jam masuk dan tenggat absensi bagi siswa per hari. Absensi yang dilakukan setelah tenggat
              absensi akan dianggap <b className="text-danger">Telat.</b>
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-ink">
                <th className="py-3 pr-4 font-semibold">Hari</th>
                <th className="py-3 pr-4">
                  <div className="font-semibold">Jam Masuk</div>
                  <div className="text-xs font-normal text-muted">Waktu resmi masuk sekolah</div>
                </th>
                <th className="py-3 pr-4">
                  <div className="font-semibold">Tenggat Absensi</div>
                  <div className="text-xs font-normal text-muted">Batas akhir tap — lewat ini dianggap telat</div>
                </th>
                <th className="py-3 text-right font-semibold">Hari Aktif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading &&
                Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="py-3">
                      <Skeleton className="h-9 w-full" />
                    </td>
                  </tr>
                ))}
              {!loading &&
                rows.map((r) => (
                  <tr key={r.hari} className={cn(!r.aktif && "opacity-50")}>
                    <td className="py-3.5 pr-4 font-medium text-ink">{HARI_LONG[r.hari]}</td>
                    <td className="py-3.5 pr-4">
                      <TimeSelect value={r.jam_masuk} disabled={!isAdmin || !r.aktif} onChange={(v) => patch(r.hari, { jam_masuk: v })} />
                    </td>
                    <td className="py-3.5 pr-4">
                      <TimeSelect value={r.tenggat_absensi} disabled={!isAdmin || !r.aktif} onChange={(v) => patch(r.hari, { tenggat_absensi: v })} />
                    </td>
                    <td className="py-3.5 text-right">
                      <Switch checked={r.aktif} disabled={!isAdmin} onChange={(v) => patch(r.hari, { aktif: v })} label={`Hari aktif ${HARI_LONG[r.hari]}`} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">Perubahan berlaku pada absensi NFC tap berikutnya secara real-time.</p>
        {isAdmin && (
          <Button onClick={save} loading={saving} disabled={!dirty}>
            <Save className="h-4 w-4" />
            Simpan Perubahan
          </Button>
        )}
      </div>
    </div>
  );
}

function TimeSelect({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const [h = "07", m = "00"] = value.split(":");
  const minuteList = MINUTES.includes(m) ? MINUTES : [...MINUTES, m].sort();
  return (
    <div className="inline-flex items-center gap-1.5">
      <Select value={h} disabled={disabled} onChange={(e) => onChange(`${e.target.value}:${m}`)} className="w-16" aria-label="Jam">
        {HOURS.map((hr) => (
          <option key={hr} value={hr}>
            {hr}
          </option>
        ))}
      </Select>
      <span className="font-semibold text-muted">:</span>
      <Select value={m} disabled={disabled} onChange={(e) => onChange(`${h}:${e.target.value}`)} className="w-16" aria-label="Menit">
        {minuteList.map((mn) => (
          <option key={mn} value={mn}>
            {mn}
          </option>
        ))}
      </Select>
    </div>
  );
}
