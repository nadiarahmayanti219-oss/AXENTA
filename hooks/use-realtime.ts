"use client";

import { useEffect, useId, useRef, useState } from "react";
import { isSupabaseConfigured } from "@/lib/demo";
import { createClient } from "@/lib/supabase/client";

type Payload = { eventType: "INSERT" | "UPDATE" | "DELETE"; new: Record<string, unknown>; old: Record<string, unknown> };

/** Subscribe ke perubahan tabel Supabase (postgres_changes). Callback selalu versi terbaru. */
export function useRealtime(table: string, callback: (payload: Payload) => void, enabled = true) {
  const cb = useRef(callback);
  cb.current = callback;
  const id = useId();

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured()) return;
    const sb = createClient();
    const channel = sb
      .channel(`rt-${table}-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, (payload) => cb.current(payload as unknown as Payload))
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, [table, id, enabled]);
}

/** Re-render berkala (untuk status online/offline berbasis waktu). */
export function useTick(ms: number) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
  return tick;
}
