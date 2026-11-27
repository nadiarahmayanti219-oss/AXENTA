import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_ATURAN, DEMO_KEHADIRAN, DEMO_READERS, DEMO_SISWA, isSupabaseConfigured } from "./demo";
import { fetchAll } from "./fetch-all";
import { monthRange } from "./time";
import type { AturanJam, Kehadiran, NfcReader, Siswa } from "./types";

export const READER_COLS = "id, sekolah_id, kode, nama, lokasi, mode_registrasi, last_uid, last_uid_at, last_seen, created_at";

export async function loadSiswa(sb: SupabaseClient, opts: { aktifOnly?: boolean; kelas?: string } = {}) {
  if (!isSupabaseConfigured()) {
    return DEMO_SISWA.filter((s) => (!opts.aktifOnly || s.aktif) && (!opts.kelas || s.kelas === opts.kelas));
  }
  try {
    return await fetchAll<Siswa>((from, to) => {
      let q = sb.from("siswa").select("*").order("kelas").order("nama").range(from, to);
      if (opts.aktifOnly) q = q.eq("aktif", true);
      if (opts.kelas) q = q.eq("kelas", opts.kelas);
      return q;
    });
  } catch {
    return DEMO_SISWA.filter((s) => (!opts.aktifOnly || s.aktif) && (!opts.kelas || s.kelas === opts.kelas));
  }
}

export async function loadAturan(sb: SupabaseClient) {
  if (!isSupabaseConfigured()) return DEMO_ATURAN;
  try {
    const { data, error } = await sb.from("aturan_jam").select("*").order("hari");
    if (error) throw error;
    return (data?.length ? data : DEMO_ATURAN) as AturanJam[];
  } catch {
    return DEMO_ATURAN;
  }
}

export async function loadKehadiranRange(sb: SupabaseClient, start: string, end: string) {
  if (!isSupabaseConfigured()) {
    return DEMO_KEHADIRAN.filter((k) => k.tanggal >= start && k.tanggal <= end);
  }
  try {
    return await fetchAll<Kehadiran>((from, to) =>
      sb.from("kehadiran").select("*").gte("tanggal", start).lte("tanggal", end).order("tanggal").range(from, to),
    );
  } catch {
    return DEMO_KEHADIRAN.filter((k) => k.tanggal >= start && k.tanggal <= end);
  }
}

export async function loadKehadiranMonth(sb: SupabaseClient, ym: string) {
  const { start, end } = monthRange(ym);
  return loadKehadiranRange(sb, start, end);
}

export async function loadReaders(sb: SupabaseClient) {
  if (!isSupabaseConfigured()) return DEMO_READERS;
  try {
    const { data, error } = await sb.from("nfc_reader").select(READER_COLS).order("created_at");
    if (error) throw error;
    return ((data ?? []) as NfcReader[]).filter((r) => r.lokasi === "gerbang" || r.kode === "RDR-GERBANG-01");
  } catch {
    return DEMO_READERS;
  }
}

export function errMsg(e: unknown) {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return "Terjadi kesalahan";
}
