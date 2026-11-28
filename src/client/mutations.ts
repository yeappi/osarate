"use client";

// 書き込み（ブラウザ → DB関数。所有・残高・権限のチェックは DB 関数が行う）
// 成功したら invalidateAll() で表示中のデータを取り直す
import { toUserMessage } from "@/domain/errors";
import type { ActionState } from "@/domain/action";
import type { CanvasItem } from "@/domain/types";
import { clearCache, invalidateAll } from "./store";
import { sb } from "./supabase";

export type FormAction = (fd: FormData) => Promise<ActionState>;

async function rpc<T>(fn: string, args: Record<string, unknown> | undefined, okMessage: (data: T) => string): Promise<ActionState> {
  const { data, error } = await sb().rpc(fn, args);
  if (error) return { ok: false, message: toUserMessage(error.message) };
  invalidateAll();
  return { ok: true, message: okMessage(data as T), data };
}

const s = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
};
const n = (fd: FormData, k: string): number | null => {
  const v = s(fd, k);
  if (v === "") return null;
  const x = Number(v);
  return Number.isInteger(x) ? x : null;
};
const b = (fd: FormData, k: string) => ["on", "true", "1"].includes(s(fd, k));
const req = (fd: FormData) => s(fd, "requestId");

async function userIdOf(handle: string): Promise<string | null> {
  const h = handle.replace(/^@/, "").trim();
  if (!h) return null;
  const { data } = await sb().from("oshi_profiles").select("user_id").ilike("handle", h).maybeSingle();
  return (data?.user_id as string | undefined) ?? null;
}

const NO_USER: ActionState = { ok: false, message: "贈り先のユーザーが見つかりません" };

// ---------------------------------------------------------------- プロフィール

export const createProfile: FormAction = (fd) =>
  rpc("oshi_create_profile", { p_handle: s(fd, "handle"), p_display_name: s(fd, "display_name") }, () => "作成しました");

export const updateProfile: FormAction = (fd) =>
  rpc("oshi_update_profile", { p_display_name: s(fd, "display_name"), p_bio: s(fd, "bio"), p_avatar_url: s(fd, "avatar_url") }, () => "保存しました");

export const claimLoginBonus: FormAction = () =>
  rpc<{ claimed: boolean; amount?: number; streak: number }>("oshi_claim_login_bonus", undefined, (d) =>
    d.claimed ? `ログインボーナス ${d.amount}pt（${d.streak}日連続）` : "今日のログインボーナスは受け取り済みです",
  );

export const setFavorites: FormAction = (fd) =>
  rpc("oshi_set_favorites", { p_sticker_ids: fd.getAll("sticker").map(String) }, () => "TOP3を保存しました");

export const setFavBooks: FormAction = (fd) =>
  rpc("oshi_set_fav_books", { p_book_ids: fd.getAll("book").map(String) }, () => "お気に入りシール帳を保存しました");

export const saveProfileBg = (items: Pick<CanvasItem, "sticker_id" | "x" | "y">[]) =>
  rpc("oshi_set_profile_bg", { p_items: items.map((i) => ({ sticker_id: i.sticker_id, x: i.x, y: i.y })) }, () => "背景を保存しました");

export const follow: FormAction = (fd) => {
  const unfollow = s(fd, "mode") === "unfollow";
  return rpc(unfollow ? "oshi_unfollow" : "oshi_follow", { p_target: s(fd, "target") }, () =>
    unfollow ? "フォローを解除しました" : "フォローしました",
  );
};

export const claimQuest: FormAction = (fd) =>
  rpc<{ points: number }>("oshi_claim_quest", { p_request_id: req(fd), p_code: s(fd, "code") }, (d) => `${d.points}pt 受け取りました`);

export const chooseStarter: FormAction = (fd) =>
  rpc(
    "oshi_choose_starter",
    { p_request_id: req(fd), p_sticker_type: n(fd, "stickerType"), p_book_type: n(fd, "bookType") },
    () => "受け取りました",
  );

// ---------------------------------------------------------------- 所持品・ギフト

export const presentBook: FormAction = async (fd) => {
  const to = await userIdOf(s(fd, "to"));
  if (!to) return NO_USER;
  return rpc("oshi_present_book", { p_request_id: req(fd), p_book_id: s(fd, "bookId"), p_to: to }, () => "シール帳をプレゼントしました");
};

export const openSticker: FormAction = (fd) =>
  rpc("oshi_open_sticker", { p_sticker_id: s(fd, "stickerId") }, () => "開封しました。手持ちに入りました");

export const sendGift: FormAction = async (fd) => {
  const to = await userIdOf(s(fd, "to"));
  if (!to) return NO_USER;
  return rpc<{ reward: number }>(
    "oshi_send_gift",
    { p_request_id: req(fd), p_sticker_id: s(fd, "stickerId"), p_to: to, p_message: s(fd, "message") || null },
    (d) => `ギフトを贈りました（相手に還元 ${d.reward}pt）`,
  );
};

export const sendPresent: FormAction = async (fd) => {
  const to = await userIdOf(s(fd, "to"));
  if (!to) return NO_USER;
  return rpc("oshi_send_present", { p_request_id: req(fd), p_sticker_id: s(fd, "stickerId"), p_to: to }, () => "プレゼントしました");
};

export const placeSticker = (i: { stickerId: string; bookId: string; page: number; x: number; y: number }) =>
  rpc("oshi_place_sticker", { p_sticker_id: i.stickerId, p_book_id: i.bookId, p_page: i.page, p_x: Math.round(i.x), p_y: Math.round(i.y) }, () => "貼りました");

export const removeSticker = (stickerId: string) => rpc("oshi_remove_sticker", { p_sticker_id: stickerId }, () => "剥がしました");

// ---------------------------------------------------------------- 購入

type BuyResult = { spent: number; points: number; gift: { reward: number } | null };
const buyMessage = (gifted: boolean, opened = false) => (d: BuyResult) =>
  gifted
    ? `ギフトしました（${d.spent}pt）。相手に ${d.gift?.reward ?? 0}pt 還元されました`
    : opened
      ? `購入しました。手持ちに入りました（残り ${d.points}pt）`
      : `購入しました。未開封でバッグに入りました（残り ${d.points}pt）`;

export const buySticker: FormAction = async (fd) => {
  const handle = s(fd, "giftTo");
  const to = handle ? await userIdOf(handle) : null;
  if (handle && !to) return NO_USER;
  return rpc<BuyResult>(
    "oshi_buy_sticker",
    {
      p_request_id: req(fd),
      p_type_id: n(fd, "typeId"),
      p_qty: n(fd, "qty") ?? 1,
      p_open: b(fd, "open"),
      p_gift_to: to,
      p_message: s(fd, "message") || null,
    },
    buyMessage(!!to, b(fd, "open")),
  );
};

export const buyListing: FormAction = async (fd) => {
  const handle = s(fd, "giftTo") || s(fd, "to");
  const to = handle ? await userIdOf(handle) : null;
  if (handle && !to) return NO_USER;
  return rpc<BuyResult>(
    "oshi_buy_listing",
    { p_request_id: req(fd), p_listing_id: n(fd, "listingId"), p_open: b(fd, "open"), p_gift_to: to, p_message: s(fd, "message") || null },
    buyMessage(!!to, b(fd, "open")),
  );
};

// ---------------------------------------------------------------- 運営（権限は DB 関数が確認）

export const adminSetStickerTypeActive: FormAction = (fd) =>
  rpc("oshi_admin_set_sticker_type_active", { p_type_id: n(fd, "typeId"), p_active: b(fd, "active") }, () => "更新しました");

export const adminCreateBookType: FormAction = (fd) =>
  rpc<number>(
    "oshi_admin_create_book_type",
    { p_name: s(fd, "name"), p_page_count: n(fd, "pageCount"), p_charm: n(fd, "charm") ?? 0, p_price_override: n(fd, "priceOverride"), p_theme: s(fd, "theme") || "plain" },
    (id) => `シール帳種別を作成しました（ID: ${id}）`,
  );

export const adminCreateListing: FormAction = (fd) => {
  const kind = s(fd, "kind");
  const starts = s(fd, "startsAt");
  const ends = s(fd, "endsAt");
  return rpc<number>(
    "oshi_admin_create_listing",
    {
      p_venue: s(fd, "venue"),
      p_sticker_type_id: kind === "sticker" ? n(fd, "typeId") : null,
      p_book_type_id: kind === "book" ? n(fd, "typeId") : null,
      p_price: n(fd, "price"),
      p_stock: n(fd, "stock"),
      p_per_user_limit: n(fd, "perUserLimit"),
      p_starts_at: starts ? new Date(starts).toISOString() : null,
      p_ends_at: ends ? new Date(ends).toISOString() : null,
    },
    (id) => `出品しました（ID: ${id}）`,
  );
};

export const adminSetListingActive: FormAction = (fd) =>
  rpc("oshi_admin_set_listing_active", { p_listing_id: n(fd, "listingId"), p_active: b(fd, "active") }, () => "更新しました");

export const adminGrant: FormAction = async (fd) => {
  const user = await userIdOf(s(fd, "to"));
  if (!user) return { ok: false, message: "ユーザーが見つかりません" };
  const kind = s(fd, "kind");
  return rpc(
    "oshi_admin_grant",
    {
      p_request_id: req(fd),
      p_user: user,
      p_kind: kind,
      p_type_id: kind === "points" ? null : n(fd, "typeId"),
      p_qty: n(fd, "qty") ?? 1,
      p_state: s(fd, "state") || "sealed",
      p_points: kind === "points" ? n(fd, "points") : null,
    },
    () => "付与しました",
  );
};

/** 画像アップロードはサーバー（Service Role）で行い、そのあと種別を作る */
export function adminCreateStickerType(upload: (fd: FormData) => Promise<{ path: string | null; error: string | null }>): FormAction {
  return async (fd) => {
    const img = await upload(fd);
    if (img.error) return { ok: false, message: img.error };
    return rpc<number>(
      "oshi_admin_create_sticker_type",
      {
        p_dex_id: s(fd, "dex"),
        p_name: s(fd, "name"),
        p_width: n(fd, "width"),
        p_height: n(fd, "height"),
        p_charm: n(fd, "charm"),
        p_image_path: img.path,
        p_price_override: n(fd, "priceOverride"),
        p_kind: s(fd, "kind") || "basic",
        p_rarity: s(fd, "rarity") || "common",
        p_dex_visibility: s(fd, "visibility") || "always",
        p_dex_purchasable: b(fd, "purchasable"),
        p_max_supply: n(fd, "maxSupply"),
        p_sort: n(fd, "sort") ?? 0,
      },
      (id) => `シール種別を作成しました（ID: ${id}）`,
    );
  };
}

// ---------------------------------------------------------------- ログアウト

export async function signOut() {
  await sb().auth.signOut();
  clearCache();
}

// ---------------------------------------------------------------- つながり・安全

export const markGiftsSeen = () => rpc("oshi_mark_gifts_seen", undefined, () => "");

export const toggleBookLike = (bookId: string) =>
  rpc<{ liked: boolean }>("oshi_toggle_book_like", { p_book_id: bookId }, (d) => (d.liked ? "いいねしました" : "いいねを取り消しました"));

export const block: FormAction = (fd) => {
  const unblock = s(fd, "mode") === "unblock";
  return rpc(unblock ? "oshi_unblock" : "oshi_block", { p_target: s(fd, "target") }, () =>
    unblock ? "ブロックを解除しました" : "ブロックしました。この相手からは贈り物が届かなくなります",
  );
};

export const report: FormAction = (fd) =>
  rpc(
    "oshi_report",
    { p_target: s(fd, "target"), p_transfer_id: n(fd, "transferId"), p_reason: s(fd, "reason") },
    () => "通報しました。運営が確認します",
  );

export const adminResolveReport: FormAction = (fd) =>
  rpc("oshi_admin_resolve_report", { p_id: n(fd, "id"), p_clear_message: b(fd, "clear") }, () => "対応済みにしました");
