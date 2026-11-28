"use client";

// 読み取り（ブラウザ → Supabase。RLS で守られている）
import type {
  Book,
  CanvasItem,
  DexEntry,
  Listing,
  Placement,
  PublicProfile,
  RankingRow,
  Sticker,
  Wallet,
} from "@/domain/types";
import { useQuery } from "./store";
import { must, sb } from "./supabase";

/** oshi_profiles は列権限で残高を隠しているため select * は使えない */
export const PROFILE_COLUMNS = "user_id, handle, display_name, avatar_url, bio, charm_total, support_total";
const STICKER_SELECT = "id, type_id, owner_id, serial_no, state, gifted, acquired_at, type:oshi_sticker_types(*)";
const BOOK_SELECT = "id, type_id, owner_id, serial_no, type:oshi_book_types(*)";

// ---------------------------------------------------------------- 自分

export type Me = { userId: string | null; profile: PublicProfile | null; wallet: Wallet | null };

async function fetchMe(): Promise<Me> {
  const { data } = await sb().auth.getSession();
  const userId = data.session?.user.id ?? null;
  if (!userId) return { userId: null, profile: null, wallet: null };
  const [profile, wallet] = await Promise.all([
    sb().from("oshi_profiles").select(PROFILE_COLUMNS).eq("user_id", userId).maybeSingle(),
    sb().rpc("oshi_my_wallet"),
  ]);
  return {
    userId,
    profile: (must(profile) as PublicProfile | null) ?? null,
    wallet: (must(wallet) as Wallet | null) ?? null,
  };
}

export const useMe = () => useQuery("me", fetchMe);

// ---------------------------------------------------------------- プロフィール

export async function fetchProfileByHandle(handle: string): Promise<PublicProfile | null> {
  const r = await sb().from("oshi_profiles").select(PROFILE_COLUMNS).ilike("handle", handle).maybeSingle();
  return (must(r) as PublicProfile | null) ?? null;
}

export const useProfileByHandle = (handle: string | null) =>
  useQuery(handle ? `profile:${handle.toLowerCase()}` : null, () => fetchProfileByHandle(handle!));

export const useFollowStats = (userId: string | null, viewerId: string | null) =>
  useQuery(userId ? `follow:${userId}:${viewerId}` : null, async () => {
    const [following, followers, mine] = await Promise.all([
      sb().from("oshi_follows").select("*", { count: "exact", head: true }).eq("follower_id", userId!),
      sb().from("oshi_follows").select("*", { count: "exact", head: true }).eq("followee_id", userId!),
      viewerId
        ? sb().from("oshi_follows").select("follower_id").eq("follower_id", viewerId).eq("followee_id", userId!).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    return { following: following.count ?? 0, followers: followers.count ?? 0, isFollowing: !!mine.data };
  });

export const useSearch = (q: string) =>
  useQuery(q ? `search:${q}` : null, async () => {
    const term = q.replace(/[%_,()]/g, "").trim();
    if (!term) return [] as PublicProfile[];
    const r = await sb()
      .from("oshi_profiles")
      .select(PROFILE_COLUMNS)
      .or(`handle.ilike.%${term}%,display_name.ilike.%${term}%`)
      .limit(50);
    return (must(r) as PublicProfile[] | null) ?? [];
  });

export const useFollowing = (userId: string | null) =>
  useQuery(userId ? `following:${userId}` : null, async () => {
    const rows = must(await sb().from("oshi_follows").select("followee_id").eq("follower_id", userId!)) as
      | { followee_id: string }[]
      | null;
    const ids = (rows ?? []).map((r) => r.followee_id);
    if (ids.length === 0) return [] as PublicProfile[];
    return (must(await sb().from("oshi_profiles").select(PROFILE_COLUMNS).in("user_id", ids)) as PublicProfile[] | null) ?? [];
  });

// ---------------------------------------------------------------- 所持品

async function fetchStickers(ownerId: string, state?: "sealed" | "opened"): Promise<Sticker[]> {
  let q = sb().from("oshi_stickers").select(STICKER_SELECT).eq("owner_id", ownerId);
  if (state) q = q.eq("state", state);
  return (must(await q.order("acquired_at", { ascending: false })) as unknown as Sticker[] | null) ?? [];
}

export const useStickers = (ownerId: string | null, state?: "sealed" | "opened") =>
  useQuery(ownerId ? `stickers:${ownerId}:${state ?? "all"}` : null, () => fetchStickers(ownerId!, state));

/** 保管：開封済みで、どのシール帳にも貼っていないシール */
export const useStorage = (ownerId: string | null) =>
  useQuery(ownerId ? `storage:${ownerId}` : null, async () => {
    const opened = await fetchStickers(ownerId!, "opened");
    if (opened.length === 0) return [];
    const placed = must(await sb().from("oshi_placements").select("sticker_id").in("sticker_id", opened.map((s) => s.id))) as
      | { sticker_id: string }[]
      | null;
    const placedIds = new Set((placed ?? []).map((p) => p.sticker_id));
    return opened.filter((s) => !placedIds.has(s.id));
  });

export const useBooks = (ownerId: string | null) =>
  useQuery(ownerId ? `books:${ownerId}` : null, async () => {
    const r = await sb().from("oshi_books").select(BOOK_SELECT).eq("owner_id", ownerId!).order("acquired_at");
    return (must(r) as unknown as Book[] | null) ?? [];
  });

export type BookDetail = { book: Book; items: (CanvasItem & { page: number })[] };

export const useBook = (bookId: string | null) =>
  useQuery(bookId ? `book:${bookId}` : null, async (): Promise<BookDetail | null> => {
    const book = must(await sb().from("oshi_books").select(BOOK_SELECT).eq("id", bookId!).maybeSingle()) as unknown as Book | null;
    if (!book) return null;
    type Row = Placement & { sticker: { type: { name: string; image_path: string | null; width: number; height: number } } };
    const rows = must(
      await sb()
        .from("oshi_placements")
        .select("sticker_id, book_id, page, x, y, sticker:oshi_stickers(type:oshi_sticker_types(name, image_path, width, height))")
        .eq("book_id", bookId!),
    ) as unknown as Row[] | null;
    const items = (rows ?? []).map((p) => ({
      sticker_id: p.sticker_id,
      page: p.page,
      x: p.x,
      y: p.y,
      name: p.sticker.type.name,
      image_path: p.sticker.type.image_path,
      w: p.sticker.type.width,
      h: p.sticker.type.height,
    }));
    return { book, items };
  });

type TypeMini = { name: string; image_path: string | null; width: number; height: number };

export type Showcase = {
  favorites: ({ sticker_id: string } & TypeMini)[];
  books: { id: string; name: string; page_count: number }[];
  background: CanvasItem[];
};

export const useShowcase = (userId: string | null) =>
  useQuery(userId ? `showcase:${userId}` : null, async (): Promise<Showcase> => {
    const [fav, favBooks, bg] = await Promise.all([
      sb()
        .from("oshi_profile_favorites")
        .select("slot, sticker:oshi_stickers(id, type:oshi_sticker_types(name, image_path, width, height))")
        .eq("user_id", userId!)
        .order("slot"),
      sb().from("oshi_profile_fav_books").select("slot, book:oshi_books(id, type:oshi_book_types(name, page_count))").eq("user_id", userId!).order("slot"),
      sb()
        .from("oshi_profile_bg")
        .select("sticker_id, x, y, sticker:oshi_stickers(type:oshi_sticker_types(name, image_path, width, height))")
        .eq("user_id", userId!),
    ]);
    const favRows = (must(fav) as unknown as { sticker: { id: string; type: TypeMini } }[] | null) ?? [];
    const bookRows = (must(favBooks) as unknown as { book: { id: string; type: { name: string; page_count: number } } }[] | null) ?? [];
    const bgRows = (must(bg) as unknown as { sticker_id: string; x: number; y: number; sticker: { type: TypeMini } }[] | null) ?? [];
    return {
      favorites: favRows.map((f) => ({ sticker_id: f.sticker.id, ...f.sticker.type })),
      books: bookRows.map((b) => ({ id: b.book.id, name: b.book.type.name, page_count: b.book.type.page_count })),
      background: bgRows.map((b) => ({
        sticker_id: b.sticker_id,
        x: b.x,
        y: b.y,
        name: b.sticker.type.name,
        image_path: b.sticker.type.image_path,
        w: b.sticker.type.width,
        h: b.sticker.type.height,
      })),
    };
  });

export type TransferRow = {
  id: number;
  kind: "gift" | "present";
  from_user: string;
  to_user: string;
  message: string;
  reward: number;
  rate_pct: number | null;
  created_at: string;
  seen_at: string | null;
  sticker: { type: { name: string } };
  from: { handle: string; display_name: string };
  to: { handle: string; display_name: string };
};

export const useTransfers = (userId: string | null) =>
  useQuery(userId ? `transfers:${userId}` : null, async () => {
    const r = await sb()
      .from("oshi_transfers")
      .select(
        "id, kind, from_user, to_user, message, reward, rate_pct, created_at, seen_at, sticker:oshi_stickers(type:oshi_sticker_types(name)), from:oshi_profiles!oshi_transfers_from_user_fkey(handle, display_name), to:oshi_profiles!oshi_transfers_to_user_fkey(handle, display_name)",
      )
      .or(`from_user.eq.${userId},to_user.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(100);
    return (must(r) as unknown as TransferRow[] | null) ?? [];
  });

// ---------------------------------------------------------------- カタログ・ランキング

export async function fetchDex(userId: string, dex: string): Promise<DexEntry[]> {
  return (must(await sb().rpc("oshi_dex_view", { p_user: userId, p_dex: dex })) as DexEntry[] | null) ?? [];
}

export const useDex = (userId: string | null, dex: string) =>
  useQuery(userId ? `dex:${userId}:${dex}` : null, () => fetchDex(userId!, dex));

export const useListings = (venue: "shop" | "prize") =>
  useQuery(`listings:${venue}`, async () => {
    const r = await sb()
      .from("oshi_shop_listings")
      .select("id, venue, price, stock, sold_count, per_user_limit, starts_at, ends_at, sticker_type:oshi_sticker_types(*), book_type:oshi_book_types(*)")
      .eq("venue", venue)
      .eq("is_active", true)
      .order("sort");
    const now = Date.now();
    return ((must(r) as unknown as Listing[] | null) ?? []).filter(
      (l) => (!l.starts_at || Date.parse(l.starts_at) <= now) && (!l.ends_at || Date.parse(l.ends_at) > now),
    );
  });

export const useRanking = (metric: string, period: string, me: string | null) =>
  useQuery(`ranking:${metric}:${period}:${me}`, async () =>
    (must(await sb().rpc("oshi_ranking", { p_metric: metric, p_period: period, p_me: me })) as RankingRow[] | null) ?? [],
  );

export const useSetting = <T,>(key: string) =>
  useQuery(`setting:${key}`, async () => {
    const r = await sb().from("oshi_settings").select("value").eq("key", key).maybeSingle();
    return ((must(r) as { value: T } | null)?.value ?? null) as T | null;
  });

/** 運営用 */
export const useAllTypes = () =>
  useQuery("admin:types", async () => {
    const [st, bt] = await Promise.all([
      sb().from("oshi_sticker_types").select("*").order("dex_id").order("sort"),
      sb().from("oshi_book_types").select("*").order("id"),
    ]);
    type ST = { id: number; dex_id: string; name: string; charm: number; issued_count: number; is_active: boolean };
    type BT = { id: number; name: string; page_count: number; charm: number };
    return { stickerTypes: (must(st) as ST[] | null) ?? [], bookTypes: (must(bt) as BT[] | null) ?? [] };
  });

// ---------------------------------------------------------------- はじめて

export type Quest = { code: string; title: string; points: number; done: boolean; claimed: boolean };

export const useQuests = (enabled: boolean) =>
  useQuery(enabled ? "quests" : null, async () => must(await sb().rpc("oshi_quest_list")) as Quest[]);

export type StarterOptions = {
  chosen: boolean;
  stickers: { id: number; name: string; image_path: string | null; width: number; height: number }[];
  books: { id: number; name: string; theme: string; page_count: number }[];
};

export const useStarterOptions = (enabled: boolean) =>
  useQuery(enabled ? "starter" : null, async () => must(await sb().rpc("oshi_starter_options")) as StarterOptions);

// ---------------------------------------------------------------- つながり

/** 未読のギフト・プレゼント数 */
export const useUnreadGifts = (userId: string | null) =>
  useQuery(userId ? `unread:${userId}` : null, async () => {
    const r = await sb().from("oshi_transfers").select("id", { count: "exact", head: true }).eq("to_user", userId!).is("seen_at", null);
    if (r.error) throw new Error(r.error.message);
    return r.count ?? 0;
  });

/** フォロワーの一覧 */
export const useFollowers = (userId: string | null) =>
  useQuery(userId ? `followers:${userId}` : null, async () => {
    const rows = must(await sb().from("oshi_follows").select("follower_id").eq("followee_id", userId!)) as { follower_id: string }[] | null;
    const ids = (rows ?? []).map((r) => r.follower_id);
    if (ids.length === 0) return [] as PublicProfile[];
    return (must(await sb().from("oshi_profiles").select(PROFILE_COLUMNS).in("user_id", ids)) as PublicProfile[] | null) ?? [];
  });

/** 自分がブロックしている相手か */
export const useIsBlocked = (viewerId: string | null, targetId: string | null) =>
  useQuery(viewerId && targetId ? `block:${viewerId}:${targetId}` : null, async () => {
    const r = await sb().from("oshi_blocks").select("blocked_id").eq("blocker_id", viewerId!).eq("blocked_id", targetId!).maybeSingle();
    return !!must(r);
  });

/** シール帳のいいね数と、自分がいいね済みか */
export const useBookLikes = (bookId: string | null, viewerId: string | null) =>
  useQuery(bookId ? `likes:${bookId}:${viewerId}` : null, async () => {
    const [count, mine] = await Promise.all([
      sb().from("oshi_book_likes").select("user_id", { count: "exact", head: true }).eq("book_id", bookId!),
      viewerId
        ? sb().from("oshi_book_likes").select("user_id").eq("book_id", bookId!).eq("user_id", viewerId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    return { count: count.count ?? 0, liked: !!mine.data };
  });

/** 運営：未対応の通報 */
export type ReportRow = {
  id: number;
  created_at: string;
  reason: string;
  transfer_id: number | null;
  message: string | null;
  reporter_handle: string;
  target_handle: string;
  target_id: string;
};
export const useReports = (enabled: boolean) =>
  useQuery(enabled ? "admin:reports" : null, async () => must(await sb().rpc("oshi_admin_reports")) as ReportRow[]);
