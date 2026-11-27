"use client";

import { Radio, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label, Switch } from "@/components/ui/input";
import { useRealtime } from "@/hooks/use-realtime";
import { normalizeUid } from "@/lib/attendance";
import { errMsg } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import type { Siswa } from "@/lib/types";

export function StudentFormDialog({
  open,
  onClose,
  siswa,
  kelasOptions,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  siswa: Siswa | null;
  kelasOptions: string[];
  onSaved: () => void;
}) {
  const { profil, isAdmin } = useApp();
  const [nama, setNama] = useState("");
  const [nis, setNis] = useState("");
  const [kelas, setKelas] = useState("4A");
  const [uid, setUid] = useState("");
  const [aktif, setAktif] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setScanning(false);
      return;
    }
    setNama(siswa?.nama ?? "");
    setNis(siswa?.nis ?? "");
    setKelas(siswa?.kelas ?? kelasOptions[0] ?? "4A");
    setUid(siswa?.nfc_uid ?? "");
    setAktif(siswa?.aktif ?? true);
    setScanning(false);
  }, [open, siswa, kelasOptions]);

  // Saat mode "Scan Kartu" aktif, aktifkan mode_registrasi pada semua reader sekolah
  // lalu dengarkan perubahan last_uid via Realtime.
  useEffect(() => {
    if (!open || !scanning || !isAdmin) return;
    const sb = createClient();
    sb.from("nfc_reader").update({ mode_registrasi: true }).eq("sekolah_id", profil.sekolah_id).then();
    return () => {
      sb.from("nfc_reader").update({ mode_registrasi: false }).eq("sekolah_id", profil.sekolah_id).then();
    };
  }, [open, scanning, isAdmin, profil.sekolah_id]);

  useRealtime(
    "nfc_reader",
    (p) => {
      const nextUid = typeof p.new?.last_uid === "string" ? p.new.last_uid : "";
      if (nextUid) {
        setUid(nextUid);
        setScanning(false);
        toast.success(`Kartu terbaca: ${nextUid}`);
      }
    },
    open && scanning,
  );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;
    setLoading(true);
    const sb = createClient();
    const payload = {
      sekolah_id: profil.sekolah_id,
      nama: nama.trim(),
      nis: nis.trim() || null,
      kelas: kelas.trim().toUpperCase(),
      nfc_uid: normalizeUid(uid),
      aktif,
    };
    const { error } = siswa
      ? await sb.from("siswa").update(payload).eq("id", siswa.id)
      : await sb.from("siswa").insert(payload);
    setLoading(false);
    if (error) {
      toast.error(error.code === "23505" ? "NFC UID sudah digunakan siswa lain" : `Gagal: ${errMsg(error)}`);
      return;
    }
    toast.success(siswa ? "Data siswa diperbarui" : "Siswa berhasil ditambahkan");
    onClose();
    onSaved();
  }

  async function remove() {
    if (!siswa || !isAdmin || !confirm(`Hapus ${siswa.nama} beserta riwayat kehadirannya?`)) return;
    setLoading(true);
    const { error } = await createClient().from("siswa").delete().eq("id", siswa.id);
    setLoading(false);
    if (error) {
      toast.error(`Gagal menghapus: ${errMsg(error)}`);
      return;
    }
    toast.success("Siswa dihapus");
    onClose();
    onSaved();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={siswa ? "Detail Siswa" : "Tambah Siswa"}
      description={siswa ? `NFC UID: ${siswa.nfc_uid}` : "Daftarkan siswa baru beserta kartu NFC-nya."}
      footer={
        isAdmin ? (
          <div className="flex w-full items-center justify-between">
            {siswa ? (
              <Button type="button" variant="danger" onClick={remove} disabled={loading}>
                <Trash2 className="h-4 w-4" />
                Hapus
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" form="student-form" loading={loading}>
                Simpan
              </Button>
            </div>
          </div>
        ) : undefined
      }
    >
      <form id="student-form" onSubmit={save} className="space-y-4">
        <div>
          <Label htmlFor="nama">Nama Siswa</Label>
          <Input id="nama" required disabled={!isAdmin} value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Ahmad Rasyid" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="kelas">Kelas</Label>
            <Input id="kelas" list="kelas-list" required disabled={!isAdmin} value={kelas} onChange={(e) => setKelas(e.target.value)} placeholder="4A" />
            <datalist id="kelas-list">
              {kelasOptions.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
          </div>
          <div>
            <Label htmlFor="nis">NIS (Opsional)</Label>
            <Input id="nis" disabled={!isAdmin} value={nis} onChange={(e) => setNis(e.target.value)} placeholder="2024001" />
          </div>
        </div>
        <div>
          <Label htmlFor="uid">NFC UID</Label>
          <div className="flex gap-2">
            <Input
              id="uid"
              required
              disabled={!isAdmin}
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="8159FF7B"
              className="font-mono uppercase"
            />
            {isAdmin && (
              <Button
                type="button"
                variant={scanning ? "primary" : "outline"}
                onClick={() => setScanning((s) => !s)}
                className="h-10 shrink-0"
              >
                <Radio className={scanning ? "h-4 w-4 animate-pulse" : "h-4 w-4"} />
                {scanning ? "Menunggu Tap…" : "Scan Kartu"}
              </Button>
            )}
          </div>
          {scanning && (
            <p className="mt-1.5 text-xs text-primary">
              Tempelkan kartu NFC ke salah satu reader sekolah. Tap tidak akan dicatat sebagai absensi selama mode ini aktif.
            </p>
          )}
        </div>
        {siswa && (
          <div className="flex items-center justify-between rounded-xl border border-line p-3">
            <div>
              <p className="text-[13px] font-medium text-ink">Status Siswa Aktif</p>
              <p className="text-xs text-muted">Siswa nonaktif tidak dihitung dalam rekap & statistik.</p>
            </div>
            <Switch checked={aktif} onChange={setAktif} disabled={!isAdmin} label="Status aktif" />
          </div>
        )}
      </form>
    </Dialog>
  );
}
