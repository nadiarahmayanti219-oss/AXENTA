"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/demo";

let client: SupabaseClient | null = null;

export function createClient() {
  if (!client) {
    const url = isSupabaseConfigured() ? process.env.NEXT_PUBLIC_SUPABASE_URL! : "https://placeholder.supabase.co";
    const key = isSupabaseConfigured() ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! : "placeholder-anon-key";
    client = createBrowserClient(url, key);
  }
  return client;
}
