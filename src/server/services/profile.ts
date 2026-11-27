"use server";

import { redirect } from "next/navigation";
import type { CanvasItem } from "@/domain/types";
import { callRpc, fail, ok, str, type ActionState } from "@/server/action";

export async function createProfileAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { error } = await callRpc("oshi_create_profile", {
    p_handle: str(fd, "handle"),
    p_display_name: str(fd, "display_name"),
  });
  if (error) return fail(error);
  redirect("/me");
}

export async function updateProfileAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { error } = await callRpc("oshi_update_profile", {
    p_display_name: str(fd, "display_name"),
    p_bio: str(fd, "bio"),
    p_avatar_url: str(fd, "avatar_url"),
  });
  return error ? fail(error) : ok("保存しました");
}

export async function claimLoginBonusAction(_prev: ActionState, _fd: FormData): Promise<ActionState> {
  const { data, error } = await callRpc<{ claimed: boolean; amount?: number; streak: number }>("oshi_claim_login_bonus");
  if (error) return fail(error);
  if (!data?.claimed) return ok("今日のログインボーナスは受け取り済みです");
  return ok(`ログインボーナス ${data.amount}pt（${data.streak}日連続）`);
}

export async function setFavoritesAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const ids = fd.getAll("sticker").map(String);
  const { error } = await callRpc("oshi_set_favorites", { p_sticker_ids: ids });
  return error ? fail(error) : ok("TOP3を保存しました");
}

export async function setFavBooksAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const ids = fd.getAll("book").map(String);
  const { error } = await callRpc("oshi_set_fav_books", { p_book_ids: ids });
  return error ? fail(error) : ok("お気に入りシール帳を保存しました");
}

/** 背景エディタから直接呼ぶ */
export async function saveProfileBg(items: Pick<CanvasItem, "sticker_id" | "x" | "y">[]): Promise<ActionState> {
  const { error } = await callRpc("oshi_set_profile_bg", {
    p_items: items.map((i) => ({ sticker_id: i.sticker_id, x: i.x, y: i.y })),
  });
  return error ? fail(error) : ok("背景を保存しました");
}

export async function followAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const target = str(fd, "target");
  const unfollow = str(fd, "mode") === "unfollow";
  const { error } = await callRpc(unfollow ? "oshi_unfollow" : "oshi_follow", { p_target: target });
  if (error) return fail(error);
  return ok(unfollow ? "フォローを解除しました" : "フォローしました");
}
