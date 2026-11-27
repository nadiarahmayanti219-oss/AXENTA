import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api";
import { normalizeUid } from "@/lib/attendance";

export const dynamic = "force-dynamic";

const rowSchema = z.object({
  nama: z.string().trim().min(1, "nama wajib"),
  nis: z.string().trim().optional().nullable(),
  kelas: z.string().trim().min(1, "kelas wajib"),
  nfc_uid: z.string().trim().min(1, "nfc_uid wajib"),
});
const bodySchema = z.object({ rows: z.array(z.unknown()).min(1).max(5000) });

/** Import siswa (rows hasil parse Excel di client). Upsert berdasarkan nfc_uid. */
export async function POST(req: NextRequest) {
  const r = await requireSession({ admin: true });
  if ("error" in r) return r.error;

  const body = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ ok: false, error: "Data kosong / tidak valid" }, { status: 400 });

  const errors: { row: number; message: string }[] = [];
  const seen = new Set<string>();
  const valid: { sekolah_id: string; nama: string; nis: string | null; kelas: string; nfc_uid: string; aktif: boolean }[] = [];

  body.data.rows.forEach((raw, i) => {
    const p = rowSchema.safeParse(raw);
    if (!p.success) {
      errors.push({ row: i + 2, message: p.error.issues.map((x) => x.message).join(", ") });
      return;
    }
    const uid = normalizeUid(p.data.nfc_uid);
    if (seen.has(uid)) {
      errors.push({ row: i + 2, message: `nfc_uid ${uid} duplikat di file` });
      return;
    }
    seen.add(uid);
    valid.push({
      sekolah_id: r.ctx.profil.sekolah_id,
      nama: p.data.nama,
      nis: p.data.nis || null,
      kelas: p.data.kelas.toUpperCase(),
      nfc_uid: uid,
      aktif: true,
    });
  });

  if (errors.length) return NextResponse.json({ ok: false, error: "Validasi gagal", errors }, { status: 422 });

  const { error } = await r.ctx.supabase.from("siswa").upsert(valid, { onConflict: "sekolah_id,nfc_uid" });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, imported: valid.length });
}
