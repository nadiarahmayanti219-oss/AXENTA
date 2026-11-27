import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api";
import { READER_COLS } from "@/lib/data";
import { generateDeviceKey, hashKey } from "@/lib/device";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  kode: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Kode hanya huruf, angka, - dan _"),
  nama: z.string().trim().min(1).max(80),
  lokasi: z.enum(["halte", "gerbang"]),
});

/** Buat reader baru. Device key plaintext hanya dikembalikan SEKALI. */
export async function POST(req: NextRequest) {
  const r = await requireSession({ admin: true });
  if ("error" in r) return r.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "INVALID_BODY" }, { status: 400 });
  }
  const key = generateDeviceKey();
  const { data, error } = await r.ctx.supabase
    .from("nfc_reader")
    .insert({
      sekolah_id: r.ctx.profil.sekolah_id,
      kode: parsed.data.kode.toUpperCase(),
      nama: parsed.data.nama,
      lokasi: parsed.data.lokasi,
      device_key_hash: hashKey(key),
    })
    .select(READER_COLS)
    .single();
  if (error) {
    const msg = error.code === "23505" ? "Kode reader sudah dipakai" : error.message;
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
  return NextResponse.json({ ok: true, reader: data, device_key: key });
}

/** Rotasi device key: PATCH /api/reader?id=... */
export async function PATCH(req: NextRequest) {
  const r = await requireSession({ admin: true });
  if ("error" in r) return r.error;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "ID_REQUIRED" }, { status: 400 });
  const key = generateDeviceKey();
  const { error } = await r.ctx.supabase.from("nfc_reader").update({ device_key_hash: hashKey(key) }).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, device_key: key });
}
