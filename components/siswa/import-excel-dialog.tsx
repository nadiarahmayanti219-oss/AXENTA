"use client";

import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { normalizeUid } from "@/lib/attendance";
import { cn } from "@/lib/cn";

interface ParsedRow {
  row: number;
  nama: string;
  nis: string;
  kelas: string;
  nfc_uid: string;
  error?: string;
}

export function ImportExcelDialog({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setRows([]);
    setFileName("");
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
    const seen = new Set<string>();
    const parsed: ParsedRow[] = json.map((r, i) => {
      const pick = (keys: string[]) => {
        const k = Object.keys(r).find((x) => keys.includes(x.trim().toLowerCase()));
        return k ? String(r[k] ?? "").trim() : "";
      };
      const nama = pick(["nama", "nama siswa", "name"]);
      const nis = pick(["nis", "nisn"]);
      const kelas = pick(["kelas", "class"]).toUpperCase();
      const nfc_uid = normalizeUid(pick(["nfc_uid", "uid", "nfc", "kartu"]));
      let error: string | undefined;
      if (!nama || !kelas || !nfc_uid) error = "Kolom nama, kelas, nfc_uid wajib diisi";
      else if (seen.has(nfc_uid)) error = "UID duplikat di file";
      seen.add(nfc_uid);
      return { row: i + 2, nama, nis, kelas, nfc_uid, error };
    });
    setRows(parsed);
  }

  const invalidCount = rows.filter((r) => r.error).length;
  const validRows = rows.filter((r) => !r.error);

  async function submit() {
    setLoading(true);
    const res = await fetch("/api/siswa/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: validRows }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok || !json.ok) {
      toast.error(json.error ?? "Gagal import");
      return;
    }
    toast.success(`${json.imported} siswa berhasil diimport`);
    reset();
    onClose();
    onImported();
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Import Data Siswa dari Excel"
      description="Gunakan file .xlsx dengan kolom: nama, nis, kelas, nfc_uid. Data dengan NFC UID yang sama akan diperbarui."
      className="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={submit} loading={loading} disabled={rows.length === 0 || invalidCount > 0}>
            <Upload className="h-4 w-4" />
            Import {validRows.length} Siswa
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-slate-50/60 p-6 text-center hover:border-primary hover:bg-primary-50/40">
          <FileSpreadsheet className="h-8 w-8 text-primary" />
          <span className="text-sm font-medium text-ink">{fileName || "Klik untuk memilih file Excel (.xlsx / .csv)"}</span>
          <span className="text-xs text-muted">Belum punya formatnya? Unduh tombol Template di halaman Data Siswa.</span>
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>

        {rows.length > 0 && (
          <>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-success">
                <CheckCircle2 className="h-4 w-4" /> {validRows.length} baris siap diimport
              </span>
              {invalidCount > 0 && (
                <span className="flex items-center gap-1.5 font-medium text-danger">
                  <AlertCircle className="h-4 w-4" /> {invalidCount} baris bermasalah (perbaiki file terlebih dahulu)
                </span>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto rounded-xl border border-line">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 text-subtle">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Nama</th>
                    <th className="px-3 py-2">NIS</th>
                    <th className="px-3 py-2">Kelas</th>
                    <th className="px-3 py-2">NFC UID</th>
                    <th className="px-3 py-2">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => (
                    <tr key={r.row} className={cn(r.error && "bg-danger-50 text-danger")}>
                      <td className="px-3 py-1.5 text-muted">{r.row}</td>
                      <td className="px-3 py-1.5 font-medium">{r.nama || "-"}</td>
                      <td className="px-3 py-1.5">{r.nis || "-"}</td>
                      <td className="px-3 py-1.5">{r.kelas || "-"}</td>
                      <td className="px-3 py-1.5 font-mono">{r.nfc_uid || "-"}</td>
                      <td className="px-3 py-1.5">{r.error ?? "OK"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
