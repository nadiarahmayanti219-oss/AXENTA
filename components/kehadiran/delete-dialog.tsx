"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { monthLabel } from "@/lib/time";

export function DeleteKehadiranDialog({
  open,
  onClose,
  defaultMonth,
  onDone,
  allowTotal = true,
}: {
  open: boolean;
  onClose: () => void;
  defaultMonth: string;
  onDone?: () => void;
  allowTotal?: boolean;
}) {
  const [mode, setMode] = useState<"bulan" | "total">("bulan");
  const [bulan, setBulan] = useState(defaultMonth);
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setMode("bulan");
      setBulan(defaultMonth);
      setConfirm("");
    }
  }, [open, defaultMonth]);

  async function submit() {
    setLoading(true);
    const url = mode === "bulan" ? `/api/kehadiran?bulan=${bulan}` : "/api/kehadiran";
    const res = await fetch(url, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok || !json.ok) {
      toast.error(json.error === "FORBIDDEN_ADMIN_ONLY" ? "Hanya admin yang dapat menghapus kehadiran" : `Gagal: ${json.error ?? res.statusText}`);
      return;
    }
    toast.success(`${json.deleted} data kehadiran berhasil dihapus`);
    onClose();
    onDone?.();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Hapus Data Kehadiran"
      description="Tindakan ini tidak dapat dibatalkan. Data master siswa dan sekolah tidak akan terpengaruh."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button variant="danger-solid" onClick={submit} loading={loading} disabled={confirm !== "HAPUS" || (mode === "bulan" && !bulan)}>
            <Trash2 className="h-4 w-4" />
            Hapus
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className={cn("grid gap-2", allowTotal && "grid-cols-2")}>
          <ModeOption active={mode === "bulan"} onClick={() => setMode("bulan")} title="Per Bulan" desc="Hapus kehadiran pada bulan tertentu" />
          {allowTotal && (
            <ModeOption active={mode === "total"} onClick={() => setMode("total")} title="Reset Total" desc="Hapus seluruh riwayat kehadiran" danger />
          )}
        </div>
        {mode === "bulan" && (
          <div>
            <Label htmlFor="bulan-hapus">Bulan</Label>
            <Input id="bulan-hapus" type="month" value={bulan} onChange={(e) => setBulan(e.target.value)} />
            {bulan && <p className="mt-1 text-xs text-muted">Semua kehadiran {monthLabel(bulan)} akan dihapus.</p>}
          </div>
        )}
        <div>
          <Label htmlFor="confirm-hapus">
            Ketik <code className="rounded bg-danger-50 px-1 font-mono text-danger">HAPUS</code> untuk konfirmasi
          </Label>
          <Input id="confirm-hapus" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="HAPUS" autoComplete="off" />
        </div>
      </div>
    </Dialog>
  );
}

function ModeOption({ active, onClick, title, desc, danger }: { active: boolean; onClick: () => void; title: string; desc: string; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3 text-left transition-colors",
        active ? (danger ? "border-danger bg-danger-50" : "border-primary bg-primary-50") : "border-line hover:bg-slate-50",
      )}
    >
      <p className={cn("text-sm font-semibold", danger && active ? "text-danger" : "text-ink")}>{title}</p>
      <p className="mt-0.5 text-xs text-muted">{desc}</p>
    </button>
  );
}
