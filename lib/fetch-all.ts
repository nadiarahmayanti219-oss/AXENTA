import type { PostgrestError } from "@supabase/supabase-js";

type PageFetcher<T> = (from: number, to: number) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>;

/** Ambil seluruh baris (melewati batas default 1000 baris Supabase). */
export async function fetchAll<T>(fetcher: PageFetcher<T>, pageSize = 1000): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetcher(from, from + pageSize - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return out;
}
