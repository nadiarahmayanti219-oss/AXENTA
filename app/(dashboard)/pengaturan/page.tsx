"use client";

import { CheckCircle2, Copy, Cpu, Database, KeyRound, Plus, Radio, Save, School, ShieldAlert, Trash2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LokasiChip } from "@/components/dashboard/recent-activity";
import { DeleteKehadiranDialog } from "@/components/kehadiran/delete-dialog";
import { PageHeader } from "@/components/layout/app-shell";
import { isReaderOnline } from "@/components/layout/nfc-status-pill";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, IconCircle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/misc";
import { useRealtime, useTick } from "@/hooks/use-realtime";
import { cn } from "@/lib/cn";
import { errMsg, loadReaders } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { currentMonth, timeAgo } from "@/lib/time";
import type { NfcReader } from "@/lib/types";

export default function PengaturanPage() {
  const { sekolah, isAdmin } = useApp();
  const router = useRouter();
  const [resetOpen, setResetOpen] = useState(false);
  const [connected, setConnected] = useState(true);
  const [readers, setReaders] = useState<NfcReader[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newKey, setNewKey] = useState<{ kode: string; key: string } | null>(null);

  // Form profil sekolah
  const [namaSekolah, setNamaSekolah] = useState(sekolah.nama);
  const [tz, setTz] = useState(sekolah.timezone);
  const [savingSekolah, setSavingSekolah] = useState(false);

  useTick(15_000);

  const load = useCallback(async () => {
    try {
      setReaders(await loadReaders(createClient()));
      setConnected(true);
    } catch {
      setConnected(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  useRealtime("nfc_reader", load);

  async function saveSekolah(e: React.FormEvent) {
    e.preventDefault();
    setSavingSekolah(true);
    const { error } = await createClient()
      .from("sekolah")
      .update({
        nama: namaSekolah.trim(),
        timezone: tz,
      })
      .eq("id", sekolah.id);
    setSavingSekolah(false);
    if (error) {
      toast.error(`Gagal menyimpan: ${errMsg(error)}`);
      return;
    }
    toast.success("Pengaturan sekolah disimpan");
    router.refresh();
  }

  async function rotateKey(r: NfcReader) {
    if (!confirm(`Buat device key baru untuk ${r.kode}? Key lama tidak akan berlaku lagi.`)) return;
    const res = await fetch(`/api/reader?id=${r.id}`, { method: "PATCH" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      toast.error(json.error ?? "Gagal membuat key");
      return;
    }
    setNewKey({ kode: r.kode, key: json.device_key });
  }

  async function deleteReader(r: NfcReader) {
    if (!confirm(`Hapus reader ${r.kode}?`)) return;
    const { error } = await createClient().from("nfc_reader").delete().eq("id", r.id);
    if (error) toast.error(errMsg(error));
    else {
      toast.success("Reader dihapus");
      load();
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Pengaturan Sistem AXENTA" subtitle="Konfigurasi perangkat NFC Gerbang Utama, pemeliharaan basis data, dan profil sekolah." />

      {/* Manajemen Basis Data */}
      <Card className="p-6">
        <CardHeader
          icon={
            <IconCircle>
              <Database className="h-5 w-5" />
            </IconCircle>
          }
          title="Manajemen Basis Data (Database)"
          subtitle="Kelola dan bersihkan data riwayat presensi di Supabase tanpa perlu menjalankan SQL manual."
        />
        <hr className="my-5 border-line" />
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-5">
          <div className="flex items-start gap-2.5 text-danger">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <h4 className="text-[13px] font-semibold">Pembersihan Data Kehadiran (Reset Database)</h4>
              <p className="mt-1 text-xs leading-5">
                Fitur ini menghapus rekaman di tabel{" "}
                <code className="rounded border border-danger-200 bg-white px-1.5 py-0.5 font-mono text-[11px]">Kehadiran</code> di
                Supabase. Anda dapat memilih untuk menghapus per bulan tertentu atau melakukan <b>Reset Total</b> (setara perintah{" "}
                <code className="rounded border border-danger-200 bg-white px-1.5 py-0.5 font-mono text-[11px]">
                  TRUNCATE TABLE &quot;Kehadiran&quot; CASCADE;
                </code>
                ).
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-danger-200/70 pt-3">
            <p className="text-xs text-muted">Data master siswa dan sekolah tidak akan terpengaruh.</p>
            <Button variant="danger" onClick={() => setResetOpen(true)} disabled={!isAdmin}>
              <Trash2 className="h-4 w-4" />
              Hapus Kehadiran
            </Button>
          </div>
        </div>
      </Card>

      {/* Status koneksi Supabase */}
      <Card className="flex items-center gap-3.5 p-5">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            connected ? "bg-green-50 text-success" : "bg-danger-50 text-danger",
          )}
        >
          {connected ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">
            {connected ? "Koneksi Database Supabase Aktif" : "Koneksi Database Supabase Terputus"}
          </p>
          <p className="text-xs text-muted">
            Sinkronisasi tabel Siswa, Kehadiran, NfcReader, dan Sekolah terhubung secara realtime.
          </p>
        </div>
      </Card>

      {/* Manajemen NFC Reader */}
      <Card className="p-6">
        <CardHeader
          icon={
            <IconCircle>
              <Cpu className="h-5 w-5" />
            </IconCircle>
          }
          title="Perangkat NFC Reader Gerbang Utama (NodeMCU ESP8266)"
          subtitle="Kelola perangkat reader di Gerbang Utama Sekolah, lalu salin device key ke firmware."
          action={
            isAdmin && (
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" />
                Tambah Reader
              </Button>
            )
          }
        />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-line text-subtle">
                <th className="overline py-2.5 pr-3">Kode</th>
                <th className="overline py-2.5 pr-3">Nama</th>
                <th className="overline py-2.5 pr-3">Titik Lokasi</th>
                <th className="overline py-2.5 pr-3">Status</th>
                <th className="overline py-2.5 pr-3">Terakhir Aktif</th>
                {isAdmin && <th className="overline py-2.5 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {readers.map((r) => {
                const online = isReaderOnline(r);
                return (
                  <tr key={r.id}>
                    <td className="py-3 pr-3 font-mono text-xs font-semibold text-ink">{r.kode}</td>
                    <td className="py-3 pr-3 text-ink">{r.nama}</td>
                    <td className="py-3 pr-3">
                      <LokasiChip />
                    </td>
                    <td className="py-3 pr-3">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span className={cn("h-2 w-2 rounded-full", online ? "bg-success" : "bg-subtle")} />
                        {online ? "Online" : "Offline"}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-xs text-muted">{timeAgo(r.last_seen)}</td>
                    {isAdmin && (
                      <td className="py-3 text-right">
                        <div className="inline-flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => rotateKey(r)} title="Buat device key baru">
                            <KeyRound className="h-3.5 w-3.5" />
                            Key Baru
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteReader(r)} aria-label="Hapus reader">
                            <Trash2 className="h-4 w-4 text-danger" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {readers.length === 0 && <EmptyState>Belum ada perangkat NFC Reader Gerbang Utama.</EmptyState>}
        </div>
      </Card>

      {/* Profil Sekolah */}
      <Card className="p-6">
        <CardHeader
          icon={
            <IconCircle>
              <School className="h-5 w-5" />
            </IconCircle>
          }
          title="Profil Sekolah"
          subtitle="Nama sekolah di topbar dan zona waktu absensi."
        />
        <form onSubmit={saveSekolah} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="nama-sekolah">Nama Sekolah</Label>
              <Input id="nama-sekolah" required disabled={!isAdmin} value={namaSekolah} onChange={(e) => setNamaSekolah(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="tz">Zona Waktu</Label>
              <Select id="tz" disabled={!isAdmin} value={tz} onChange={(e) => setTz(e.target.value)} className="h-10 w-full">
                <option value="Asia/Jakarta">WIB — Asia/Jakarta (GMT+7)</option>
                <option value="Asia/Makassar">WITA — Asia/Makassar (GMT+8)</option>
                <option value="Asia/Jayapura">WIT — Asia/Jayapura (GMT+9)</option>
              </Select>
            </div>
          </div>
          {isAdmin && (
            <div className="flex justify-end">
              <Button type="submit" loading={savingSekolah}>
                <Save className="h-4 w-4" />
                Simpan Pengaturan
              </Button>
            </div>
          )}
        </form>
      </Card>

      <DeleteKehadiranDialog open={resetOpen} onClose={() => setResetOpen(false)} defaultMonth={currentMonth(sekolah.timezone)} />

      <AddReaderDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(kode, key) => {
          setAddOpen(false);
          setNewKey({ kode, key });
          load();
        }}
      />

      <Dialog
        open={!!newKey}
        onClose={() => setNewKey(null)}
        title={`Device Key — ${newKey?.kode ?? ""}`}
        description="Simpan key ini sekarang. Demi keamanan, key hanya ditampilkan sekali dan disimpan dalam bentuk hash SHA-256."
        footer={<Button onClick={() => setNewKey(null)}>Selesai</Button>}
      >
        {newKey && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-line bg-slate-50 p-3 font-mono text-xs break-all">
              <Radio className="h-4 w-4 shrink-0 text-primary" />
              <span className="flex-1">{newKey.key}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(newKey.key);
                  toast.success("Device key disalin");
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                Salin
              </Button>
            </div>
            <p className="text-xs text-muted">
              Masukkan ke konstanta <code>DEVICE_KEY</code> dan <code>READER_CODE = &quot;{newKey.kode}&quot;</code> pada{" "}
              <code>firmware/axenta_reader/axenta_reader.ino</code>.
            </p>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function AddReaderDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (kode: string, key: string) => void;
}) {
  const [kode, setKode] = useState("RDR-GERBANG-01");
  const [nama, setNama] = useState("Reader Gerbang Utama");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/reader", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kode, nama, lokasi: "gerbang" }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok || !json.ok) {
      toast.error(json.error ?? "Gagal menambah reader");
      return;
    }
    onCreated(json.reader.kode, json.device_key);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Tambah Perangkat NFC Reader Gerbang Utama"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form="add-reader" loading={loading}>
            Buat & Generate Key
          </Button>
        </>
      }
    >
      <form id="add-reader" onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="kode">Kode Perangkat</Label>
          <Input id="kode" required value={kode} onChange={(e) => setKode(e.target.value.toUpperCase())} className="font-mono uppercase" />
        </div>
        <div>
          <Label htmlFor="nama-r">Nama / Deskripsi</Label>
          <Input id="nama-r" required value={nama} onChange={(e) => setNama(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="lok">Titik Lokasi</Label>
          <Input id="lok" disabled value="Gerbang Utama Sekolah" />
        </div>
      </form>
    </Dialog>
  );
}
