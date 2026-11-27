import "server-only";
import { createHash, randomBytes } from "crypto";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const hashKey = (key: string) => createHash("sha256").update(key).digest("hex");
export const generateDeviceKey = () => randomBytes(24).toString("hex");

export interface DeviceReader {
  id: string;
  sekolah_id: string;
  kode: string;
  nama: string;
  lokasi: "gerbang";
  mode_registrasi: boolean;
}

/** Validasi header x-device-key (+ kode reader opsional). */
export async function authenticateDevice(req: NextRequest, kode?: string) {
  const key = req.headers.get("x-device-key");
  if (!key) return null;
  const admin = createAdminClient();
  let q = admin
    .from("nfc_reader")
    .select("id, sekolah_id, kode, nama, lokasi, mode_registrasi")
    .eq("device_key_hash", hashKey(key));
  if (kode) q = q.eq("kode", kode);
  const { data } = await q.maybeSingle();
  return data ? { admin, reader: { ...(data as DeviceReader), lokasi: "gerbang" as const } } : null;
}

// Rate limit sederhana per instance (30 req/menit/device)
const hits = new Map<string, number[]>();
export function rateLimited(id: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const arr = (hits.get(id) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(id, arr);
  return arr.length > limit;
}
