import type { Book, CanvasItem, Placement, Sticker } from "@/domain/types";
import { createSupabaseServer } from "@/server/supabase/server";

const STICKER_SELECT = "id, type_id, owner_id, serial_no, state, gifted, acquired_at, type:oshi_sticker_types(*)";
const BOOK_SELECT = "id, type_id, owner_id, serial_no, type:oshi_book_types(*)";

export async function listStickers(ownerId: string, state?: "sealed" | "opened"): Promise<Sticker[]> {
  const supabase = await createSupabaseServer();
  let q = supabase.from("oshi_stickers").select(STICKER_SELECT).eq("owner_id", ownerId);
  if (state) q = q.eq("state", state);
  const { data } = await q.order("acquired_at", { ascending: false });
  return (data as unknown as Sticker[] | null) ?? [];
}

/** 保管：開封済みで、どのシール帳にも貼っていないシール */
export async function listStorage(ownerId: string): Promise<Sticker[]> {
  const supabase = await createSupabaseServer();
  const opened = await listStickers(ownerId, "opened");
  if (opened.length === 0) return [];
  const { data: placed } = await supabase
    .from("oshi_placements")
    .select("sticker_id")
    .in("sticker_id", opened.map((s) => s.id));
  const placedIds = new Set((placed ?? []).map((p) => p.sticker_id as string));
  return opened.filter((s) => !placedIds.has(s.id));
}

export async function listBooks(ownerId: string): Promise<Book[]> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.from("oshi_books").select(BOOK_SELECT).eq("owner_id", ownerId).order("acquired_at");
  return (data as unknown as Book[] | null) ?? [];
}

export async function getBook(bookId: string): Promise<{ book: Book; items: (CanvasItem & { page: number })[] } | null> {
  const supabase = await createSupabaseServer();
  const { data: book } = await supabase.from("oshi_books").select(BOOK_SELECT).eq("id", bookId).maybeSingle();
  if (!book) return null;
  const { data: placements } = await supabase
    .from("oshi_placements")
    .select("sticker_id, book_id, page, x, y, sticker:oshi_stickers(type:oshi_sticker_types(name, image_path, width, height))")
    .eq("book_id", bookId);
  type Row = Placement & { sticker: { type: { name: string; image_path: string | null; width: number; height: number } } };
  const items = ((placements as unknown as Row[] | null) ?? []).map((p) => ({
    sticker_id: p.sticker_id,
    page: p.page,
    x: p.x,
    y: p.y,
    name: p.sticker.type.name,
    image_path: p.sticker.type.image_path,
    w: p.sticker.type.width,
    h: p.sticker.type.height,
  }));
  return { book: book as unknown as Book, items };
}

/** プロフィールの名刺部分：TOP3・お気に入りシール帳・背景 */
export async function getShowcase(userId: string) {
  const supabase = await createSupabaseServer();
  const [fav, favBooks, bg] = await Promise.all([
    supabase
      .from("oshi_profile_favorites")
      .select("slot, sticker:oshi_stickers(id, type:oshi_sticker_types(name, image_path, width, height))")
      .eq("user_id", userId)
      .order("slot"),
    supabase
      .from("oshi_profile_fav_books")
      .select("slot, book:oshi_books(id, type:oshi_book_types(name, page_count))")
      .eq("user_id", userId)
      .order("slot"),
    supabase
      .from("oshi_profile_bg")
      .select("sticker_id, x, y, sticker:oshi_stickers(type:oshi_sticker_types(name, image_path, width, height))")
      .eq("user_id", userId),
  ]);
  type T = { name: string; image_path: string | null; width: number; height: number };
  const favorites = ((fav.data as unknown as { slot: number; sticker: { id: string; type: T } }[] | null) ?? []).map((f) => ({
    sticker_id: f.sticker.id,
    ...f.sticker.type,
  }));
  const books = ((favBooks.data as unknown as { slot: number; book: { id: string; type: { name: string; page_count: number } } }[] | null) ?? []).map(
    (b) => ({ id: b.book.id, name: b.book.type.name, page_count: b.book.type.page_count }),
  );
  const background: CanvasItem[] = ((bg.data as unknown as { sticker_id: string; x: number; y: number; sticker: { type: T } }[] | null) ?? []).map(
    (b) => ({ sticker_id: b.sticker_id, x: b.x, y: b.y, name: b.sticker.type.name, image_path: b.sticker.type.image_path, w: b.sticker.type.width, h: b.sticker.type.height }),
  );
  return { favorites, books, background };
}

export type TransferRow = {
  id: number;
  kind: "gift" | "present";
  from_user: string;
  to_user: string;
  message: string;
  reward: number;
  rate_pct: number | null;
  created_at: string;
  sticker: { type: { name: string } };
  from: { handle: string; display_name: string };
  to: { handle: string; display_name: string };
};

export async function listTransfers(userId: string): Promise<TransferRow[]> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("oshi_transfers")
    .select(
      "id, kind, from_user, to_user, message, reward, rate_pct, created_at, sticker:oshi_stickers(type:oshi_sticker_types(name)), from:oshi_profiles!oshi_transfers_from_user_fkey(handle, display_name), to:oshi_profiles!oshi_transfers_to_user_fkey(handle, display_name)",
    )
    .or(`from_user.eq.${userId},to_user.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data as unknown as TransferRow[] | null) ?? [];
}
