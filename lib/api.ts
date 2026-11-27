import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DEMO_PROFIL, DEMO_SEKOLAH, isSupabaseConfigured } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";
import type { Profil, Sekolah } from "@/lib/types";

export async function getSessionContext() {
  const cookieStore = await cookies();
  const hasBuiltInAdmin = cookieStore.get("axenta_admin_session")?.value === "1";

  if (!isSupabaseConfigured()) {
    return {
      supabase: null as unknown as Awaited<ReturnType<typeof createClient>>,
      user: { id: DEMO_PROFIL.id, email: "admin@AXENTA.com" },
      profil: DEMO_PROFIL,
      sekolah: DEMO_SEKOLAH,
    };
  }

  const supabase = await createClient();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profil")
        .select("id, sekolah_id, nama, role, sekolah:sekolah_id (id, nama, timezone)")
        .eq("id", user.id)
        .maybeSingle();
      if (!data) {
        if (hasBuiltInAdmin) {
          return { supabase, user, profil: DEMO_PROFIL, sekolah: DEMO_SEKOLAH };
        }
        return { supabase, user, profil: null, sekolah: null };
      }
      const { sekolah, ...profil } = data as unknown as Profil & { sekolah: Sekolah };
      return { supabase, user, profil: profil as Profil, sekolah };
    }
  } catch {
    // Jika koneksi Supabase sedang offline/paused dan cookie admin aktif, gunakan profil default Admin AXENTA
  }

  if (hasBuiltInAdmin) {
    return {
      supabase,
      user: { id: DEMO_PROFIL.id, email: "admin@AXENTA.com" },
      profil: DEMO_PROFIL,
      sekolah: DEMO_SEKOLAH,
    };
  }

  return null;
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
