import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { computeStatus, normalizeUid } from "@/lib/attendance";
import { authenticateDevice, rateLimited } from "@/lib/device";
import { TZ_DEFAULT, zonedParts } from "@/lib/time";

export const dynamic = "force-dynamic";

const schema = z.object({
  uid: z.string().min(1).max(64),
  reader: z.string().min(1).max(64).optional(),
  ts: z.string().optional(), // ISO; dipakai untuk tap dari buffer offline
});

const fail = (error: string, status: number, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ ok: false, error, ...extra }, { status });

export async function POST(req: NextRequest) {
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return fail("INVALID_BODY", 400);
  }

  const auth = await authenticateDevice(req, body.reader);
  if (!auth) return fail("INVALID_DEVICE_KEY", 401);
  const { admin, reader } = auth;
  if (rateLimited(reader.id)) return fail("RATE_LIMITED", 429);

  const uid = normalizeUid(body.uid);
  const now = new Date();

  await admin
    .from("nfc_reader")
    .update({ last_seen: now.toISOString(), last_uid: uid, last_uid_at: now.toISOString() })
    .eq("id", reader.id);

  // Mode registrasi: hanya kirim UID ke form Tambah Siswa, tidak dicatat sebagai kehadiran.
  if (reader.mode_registrasi) {
    return NextResponse.json({ ok: true, registration: true, uid });
  }

  const { data: sekolah } = await admin
    .from("sekolah")
    .select("timezone, bobot_halte, bobot_gerbang")
    .eq("id", reader.sekolah_id)
    .single();
  const tz = sekolah?.timezone ?? TZ_DEFAULT;

  const { data: siswa } = await admin
    .from("siswa")
    .select("id, nama, kelas, aktif")
    .eq("sekolah_id", reader.sekolah_id)
    .eq("nfc_uid", uid)
    .maybeSingle();
  if (!siswa) return fail("UID_NOT_REGISTERED", 404, { uid });
  if (!siswa.aktif) return fail("STUDENT_INACTIVE", 403, { nama: siswa.nama });

  // Waktu server = sumber utama. ts dari perangkat hanya diterima untuk tap offline (≤ 7 hari, tidak di masa depan).
  let tapAt = now;
  if (body.ts) {
    const t = new Date(body.ts);
    const diff = now.getTime() - t.getTime();
    if (!isNaN(t.getTime()) && diff > 30_000 && diff < 7 * 86_400_000) tapAt = t;
  }
  const local = zonedParts(tapAt, tz);

  const { data: aturan } = await admin
    .from("aturan_jam")
    .select("tenggat_absensi, aktif")
    .eq("sekolah_id", reader.sekolah_id)
    .eq("hari", local.hari)
    .maybeSingle();
  if (!aturan || !aturan.aktif) return fail("NOT_SCHOOL_DAY", 422, { nama: siswa.nama });

  const status = computeStatus(local.time, aturan.tenggat_absensi);
  const bobot = reader.lokasi === "halte" ? (sekolah?.bobot_halte ?? 10) : (sekolah?.bobot_gerbang ?? 2);

  const { error } = await admin.from("kehadiran").insert({
    sekolah_id: reader.sekolah_id,
    siswa_id: siswa.id,
    reader_id: reader.id,
    tanggal: local.date,
    jam_tap: tapAt.toISOString(),
    lokasi: reader.lokasi,
    bobot_eco: bobot,
    status,
  });

  if (error) {
    if (error.code === "23505") {
      const { data: existing } = await admin
        .from("kehadiran")
        .select("status, lokasi, jam_tap")
        .eq("siswa_id", siswa.id)
        .eq("tanggal", local.date)
        .maybeSingle();
      return NextResponse.json({
        ok: true,
        duplicate: true,
        nama: siswa.nama,
        status: existing?.status ?? status,
        lokasi: existing?.lokasi ?? reader.lokasi,
      });
    }
    return fail("DB_ERROR", 500, { message: error.message });
  }

  return NextResponse.json({
    ok: true,
    nama: siswa.nama,
    kelas: siswa.kelas,
    status,
    lokasi: reader.lokasi,
    bobot,
    jam: local.time.slice(0, 5),
  });
}
