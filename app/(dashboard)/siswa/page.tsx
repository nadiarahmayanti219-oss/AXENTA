"use client";

import { Download, FileText, Search, Upload, UserPlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/app-shell";
import { useApp } from "@/components/providers/app-provider";
import { ImportExcelDialog } from "@/components/siswa/import-excel-dialog";
import { StudentFormDialog } from "@/components/siswa/student-form-dialog";
import { Button } from "@/components/ui/button";
import { Avatar, EmptyState, Skeleton } from "@/components/ui/misc";
import { useRealtime } from "@/hooks/use-realtime";
import { initials } from "@/lib/attendance";
import { cn } from "@/lib/cn";
import { errMsg, loadSiswa } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import type { Siswa } from "@/lib/types";

export default function SiswaPage() {
  const { isAdmin } = useApp();
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [editing, setEditing] = useState<Siswa | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    try {
      setSiswa(await loadSiswa(createClient()));
    } catch (e) {
      toast.error(`Gagal memuat siswa: ${errMsg(e)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useRealtime("siswa", load);

  const filtered = useMemo(() => {
    if (!debounced) return siswa;
    return siswa.filter(
      (s) =>
        s.nama.toLowerCase().includes(debounced) ||
        s.kelas.toLowerCase().includes(debounced) ||
        `kelas ${s.kelas.toLowerCase()}`.includes(debounced) ||
        s.nfc_uid.toLowerCase().includes(debounced) ||
        (s.nis ?? "").toLowerCase().includes(debounced),
    );
  }, [siswa, debounced]);

  const kelasOptions = useMemo(() => [...new Set(siswa.map((s) => s.kelas))].sort(), [siswa]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Data Siswa"
        subtitle="Daftar siswa yang terdaftar dalam sistem AXENTA."
        actions={
          <>
            <a href="/api/siswa/template">
              <Button variant="outline">
                <Download className="h-4 w-4" />
                Template
              </Button>
            </a>
            <a href="/api/siswa/export">
              <Button variant="outline">
                <FileText className="h-4 w-4" />
                Export Siswa
              </Button>
            </a>
            {isAdmin && (
              <>
                <Button variant="outline" onClick={() => setImportOpen(true)}>
                  <Upload className="h-4 w-4" />
                  Import Excel
                </Button>
                <Button
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  <UserPlus className="h-4 w-4" />
                  Tambah Siswa
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama atau kelas..."
          className="h-10 w-full rounded-full border border-line bg-white pl-10 pr-4 text-sm text-ink placeholder:text-subtle shadow-card focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <p className="text-[13px] text-muted">
        Menampilkan <b className="text-ink">{filtered.length}</b> siswa
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading &&
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[88px] rounded-card bg-white" />)}
        {!loading &&
          filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setEditing(s);
                setFormOpen(true);
              }}
              className={cn(
                "flex items-center gap-3.5 rounded-card border border-line/70 bg-white p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-primary-100",
                !s.aktif && "opacity-55",
              )}
            >
              <Avatar text={initials(s.nama)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{s.nama}</p>
                <p className="text-xs text-muted">
                  Kelas {s.kelas}
                  {!s.aktif && " · Nonaktif"}
                </p>
                <p className="mt-0.5 truncate font-mono text-[11px] text-subtle">{s.nfc_uid}</p>
              </div>
            </button>
          ))}
      </div>

      {!loading && filtered.length === 0 && <EmptyState className="rounded-card bg-white py-12 shadow-card">Tidak ada siswa yang cocok.</EmptyState>}

      <StudentFormDialog open={formOpen} onClose={() => setFormOpen(false)} siswa={editing} kelasOptions={kelasOptions} onSaved={load} />
      <ImportExcelDialog open={importOpen} onClose={() => setImportOpen(false)} onImported={load} />
    </div>
  );
}
