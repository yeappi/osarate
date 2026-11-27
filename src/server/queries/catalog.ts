import type { DexEntry, Listing, RankingRow } from "@/domain/types";
import { createSupabaseServer } from "@/server/supabase/server";

export async function getDex(userId: string, dex: string): Promise<DexEntry[]> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.rpc("oshi_dex_view", { p_user: userId, p_dex: dex });
  return (data as DexEntry[] | null) ?? [];
}

export async function getDexSummary(userId: string, dex: string) {
  const entries = await getDex(userId, dex);
  return { owned: entries.filter((e) => e.owned).length, total: entries.length };
}

/** 販売中の出品（venue=shop は SHOP、prize は景品交換所） */
export async function listListings(venue: "shop" | "prize"): Promise<Listing[]> {
  const supabase = await createSupabaseServer();
  const now = Date.now();
  const { data } = await supabase
    .from("oshi_shop_listings")
    .select(
      "id, venue, price, stock, sold_count, per_user_limit, starts_at, ends_at, sticker_type:oshi_sticker_types(*), book_type:oshi_book_types(*)",
    )
    .eq("venue", venue)
    .eq("is_active", true)
    .order("sort");
  return ((data as unknown as Listing[] | null) ?? []).filter(
    (l) => (!l.starts_at || Date.parse(l.starts_at) <= now) && (!l.ends_at || Date.parse(l.ends_at) > now),
  );
}

export async function getRanking(metric: string, period: string, me: string | null): Promise<RankingRow[]> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.rpc("oshi_ranking", { p_metric: metric, p_period: period, p_me: me });
  return (data as RankingRow[] | null) ?? [];
}

export async function listStickerTypes() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.from("oshi_sticker_types").select("*").order("dex_id").order("sort");
  return data ?? [];
}

export async function listBookTypes() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.from("oshi_book_types").select("*").order("id");
  return data ?? [];
}

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.from("oshi_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as T | undefined) ?? null;
}
