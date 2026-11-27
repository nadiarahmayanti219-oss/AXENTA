import "server-only";
import { NextResponse } from "next/server";
import { DEMO_PROFIL, DEMO_SEKOLAH, isSupabaseConfigured } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";
import type { Profil, Sekolah } from "@/lib/types";

export async function getSessionContext() {
  if (!isSupabaseConfigured()) {
    return {
      supabase: null as unknown as Awaited<ReturnType<typeof createClient>>,
      user: { id: DEMO_PROFIL.id, email: "admin@axenta.sch.id" },
      profil: DEMO_PROFIL,
      sekolah: DEMO_SEKOLAH,
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profil")
    .select("id, sekolah_id, nama, role, sekolah:sekolah_id (id, nama, timezone, bobot_halte, bobot_gerbang)")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return { supabase, user, profil: null, sekolah: null };
  const { sekolah, ...profil } = data as unknown as Profil & { sekolah: Sekolah };
  return { supabase, user, profil: profil as Profil, sekolah };
}

export const jsonError = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

/** Guard untuk route handler: butuh login (dan opsional admin). */
export async function requireSession(opts: { admin?: boolean } = {}) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: jsonError("UNAUTHORIZED", 401) } as const;
  if (!ctx.profil || !ctx.sekolah) return { error: jsonError("PROFILE_NOT_FOUND", 403) } as const;
  if (opts.admin && ctx.profil.role !== "admin") return { error: jsonError("FORBIDDEN_ADMIN_ONLY", 403) } as const;
  return { ctx: { ...ctx, profil: ctx.profil, sekolah: ctx.sekolah } } as const;
}
