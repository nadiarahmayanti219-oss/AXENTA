import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/api";

export const dynamic = "force-dynamic";

/** DELETE /api/kehadiran?bulan=2026-11  → hapus per bulan. Tanpa param → reset total. */
export async function DELETE(req: NextRequest) {
  const r = await requireSession({ admin: true });
  if ("error" in r) return r.error;

  const bulan = req.nextUrl.searchParams.get("bulan");
  if (bulan && !/^\d{4}-\d{2}$/.test(bulan)) {
    return NextResponse.json({ ok: false, error: "INVALID_MONTH" }, { status: 400 });
  }

  const { data, error } = await r.ctx.supabase.rpc("rpc_reset_kehadiran", {
    p_bulan: bulan ? `${bulan}-01` : null,
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, deleted: data ?? 0 });
}
