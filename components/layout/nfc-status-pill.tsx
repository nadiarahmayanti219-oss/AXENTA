"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { loadReaders } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import type { NfcReader } from "@/lib/types";
import { useRealtime, useTick } from "@/hooks/use-realtime";

export const ONLINE_WINDOW_MS = 60_000;
export const isReaderOnline = (r: Pick<NfcReader, "last_seen">) =>
  !!r.last_seen && Date.now() - new Date(r.last_seen).getTime() < ONLINE_WINDOW_MS;

export function NfcStatusPill() {
  const [readers, setReaders] = useState<NfcReader[]>([]);
  useTick(15_000);

  const refresh = useCallback(() => {
    loadReaders(createClient()).then(setReaders).catch(() => {});
  }, []);
  useEffect(refresh, [refresh]);
  useRealtime("nfc_reader", refresh);

  const online = readers.filter(isReaderOnline).length;
  const label =
    readers.length === 0
      ? "Belum ada NFC Reader"
      : online === 0
        ? "NFC Reader Offline"
        : `NFC Reader Online (${online}/${readers.length})`;

  return (
    <div className="flex items-center gap-2 rounded-full bg-sidebar-muted px-4 py-2.5 text-xs font-medium text-sidebar-text">
      <span className="relative flex h-1.5 w-1.5">
        {online > 0 && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />}
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", online > 0 ? "bg-green-400" : "bg-subtle")} />
      </span>
      {label}
    </div>
  );
}
