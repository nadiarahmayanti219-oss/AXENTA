import { NextResponse, type NextRequest } from "next/server";
import { authenticateDevice } from "@/lib/device";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let kode: string | undefined;
  try {
    const body = await req.json();
    if (typeof body?.reader === "string") kode = body.reader;
  } catch {
    // body opsional
  }
  const auth = await authenticateDevice(req, kode);
  if (!auth) return NextResponse.json({ ok: false, error: "INVALID_DEVICE_KEY" }, { status: 401 });

  const now = new Date().toISOString();
  await auth.admin.from("nfc_reader").update({ last_seen: now }).eq("id", auth.reader.id);

  return NextResponse.json({
    ok: true,
    time: now,
    reader: auth.reader.kode,
    lokasi: auth.reader.lokasi,
    mode_registrasi: auth.reader.mode_registrasi,
  });
}
