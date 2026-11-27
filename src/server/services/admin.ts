"use server";

import { STICKER_BUCKET } from "@/config/app";
import { bool, callRpc, fail, int, ok, requestId, resolveHandle, str, type ActionState } from "@/server/action";
import { getMe } from "@/server/queries/me";
import { createSupabaseAdmin } from "@/server/supabase/admin";

// 権限の最終判定は DB 関数（_oshi_require_admin）が行う。ここでの確認は画像アップロードのため

async function uploadImage(file: File): Promise<{ path: string | null; error: string | null }> {
  if (!file || file.size === 0) return { path: null, error: null };
  if (!file.type.startsWith("image/")) return { path: null, error: "画像ファイルを選んでください" };
  if (file.size > 2 * 1024 * 1024) return { path: null, error: "画像は2MB以下にしてください" };
  const ext = (file.name.split(".").pop() ?? "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `types/${crypto.randomUUID()}.${ext}`;
  const { error } = await createSupabaseAdmin().storage.from(STICKER_BUCKET).upload(path, file, {
    contentType: file.type,
  });
  return error ? { path: null, error: "画像のアップロードに失敗しました" } : { path, error: null };
}

export async function createStickerTypeAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await getMe();
  if (!me.wallet?.is_admin) return fail("権限がありません");
  const img = await uploadImage(fd.get("image") as File);
  if (img.error) return fail(img.error);
  const { data, error } = await callRpc<number>("oshi_admin_create_sticker_type", {
    p_dex_id: str(fd, "dex"),
    p_name: str(fd, "name"),
    p_width: int(fd, "width"),
    p_height: int(fd, "height"),
    p_charm: int(fd, "charm"),
    p_image_path: img.path,
    p_price_override: int(fd, "priceOverride"),
    p_kind: str(fd, "kind") || "basic",
    p_rarity: str(fd, "rarity") || "common",
    p_dex_visibility: str(fd, "visibility") || "always",
    p_dex_purchasable: bool(fd, "purchasable"),
    p_max_supply: int(fd, "maxSupply"),
    p_sort: int(fd, "sort") ?? 0,
  });
  return error ? fail(error) : ok(`シール種別を作成しました（ID: ${data}）`);
}

export async function setStickerTypeActiveAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { error } = await callRpc("oshi_admin_set_sticker_type_active", {
    p_type_id: int(fd, "typeId"),
    p_active: bool(fd, "active"),
  });
  return error ? fail(error) : ok("更新しました");
}

export async function createBookTypeAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { data, error } = await callRpc<number>("oshi_admin_create_book_type", {
    p_name: str(fd, "name"),
    p_page_count: int(fd, "pageCount"),
    p_charm: int(fd, "charm") ?? 0,
    p_price_override: int(fd, "priceOverride"),
    p_theme: str(fd, "theme") || "plain",
  });
  return error ? fail(error) : ok(`シール帳種別を作成しました（ID: ${data}）`);
}

export async function createListingAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const kind = str(fd, "kind");
  const starts = str(fd, "startsAt");
  const ends = str(fd, "endsAt");
  const { data, error } = await callRpc<number>("oshi_admin_create_listing", {
    p_venue: str(fd, "venue"),
    p_sticker_type_id: kind === "sticker" ? int(fd, "typeId") : null,
    p_book_type_id: kind === "book" ? int(fd, "typeId") : null,
    p_price: int(fd, "price"),
    p_stock: int(fd, "stock"),
    p_per_user_limit: int(fd, "perUserLimit"),
    p_starts_at: starts ? new Date(starts).toISOString() : null,
    p_ends_at: ends ? new Date(ends).toISOString() : null,
  });
  return error ? fail(error) : ok(`出品しました（ID: ${data}）`);
}

export async function setListingActiveAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { error } = await callRpc("oshi_admin_set_listing_active", {
    p_listing_id: int(fd, "listingId"),
    p_active: bool(fd, "active"),
  });
  return error ? fail(error) : ok("更新しました");
}

export async function grantAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await resolveHandle(str(fd, "to"));
  if (!user) return fail("ユーザーが見つかりません");
  const kind = str(fd, "kind");
  const { error } = await callRpc("oshi_admin_grant", {
    p_request_id: requestId(fd),
    p_user: user,
    p_kind: kind,
    p_type_id: kind === "points" ? null : int(fd, "typeId"),
    p_qty: int(fd, "qty") ?? 1,
    p_state: str(fd, "state") || "sealed",
    p_points: kind === "points" ? int(fd, "points") : null,
  });
  return error ? fail(error) : ok("付与しました");
}
