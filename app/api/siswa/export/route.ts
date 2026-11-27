import { requireSession } from "@/lib/api";
import { DEMO_SISWA, isSupabaseConfigured } from "@/lib/demo";
import { workbookResponse } from "@/lib/excel";
import { fetchAll } from "@/lib/fetch-all";
import type { Siswa } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const r = await requireSession();
  if ("error" in r) return r.error;
  const siswa = isSupabaseConfigured()
    ? await fetchAll<Siswa>((f, t) =>
        r.ctx.supabase.from("siswa").select("*").order("kelas").order("nama").range(f, t),
      )
    : DEMO_SISWA;
  const rows = [
    ["nama", "nis", "kelas", "nfc_uid", "aktif"],
    ...siswa.map((s) => [s.nama, s.nis ?? "", s.kelas, s.nfc_uid, s.aktif ? "ya" : "tidak"]),
  ];
  const date = new Date().toISOString().slice(0, 10);
  return workbookResponse([{ name: "Siswa", rows, widths: [28, 14, 8, 16, 8] }], `Data_Siswa_${date}.xlsx`);
}
