"use server";

import { callRpc, fail, ok, requestId, resolveHandle, str, type ActionState } from "@/server/action";

export async function openStickerAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { error } = await callRpc("oshi_open_sticker", { p_sticker_id: str(fd, "stickerId") });
  return error ? fail(error) : ok("開封しました。保管に入りました");
}

type GiftResult = { reward: number; rate_pct: number };

export async function sendGiftAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const to = await resolveHandle(str(fd, "to"));
  if (!to) return fail("贈り先のユーザーが見つかりません");
  const { data, error } = await callRpc<GiftResult>("oshi_send_gift", {
    p_request_id: requestId(fd),
    p_sticker_id: str(fd, "stickerId"),
    p_to: to,
    p_message: str(fd, "message") || null,
  });
  if (error) return fail(error);
  return ok(`ギフトを贈りました（相手に還元 ${data?.reward ?? 0}pt）`, data);
}

export async function sendPresentAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const to = await resolveHandle(str(fd, "to"));
  if (!to) return fail("贈り先のユーザーが見つかりません");
  const { error } = await callRpc("oshi_send_present", {
    p_request_id: requestId(fd),
    p_sticker_id: str(fd, "stickerId"),
    p_to: to,
  });
  return error ? fail(error) : ok("プレゼントしました");
}

/** シール帳エディタから直接呼ぶ（貼る・移動） */
export async function placeSticker(input: {
  stickerId: string;
  bookId: string;
  page: number;
  x: number;
  y: number;
}): Promise<ActionState> {
  const { error } = await callRpc("oshi_place_sticker", {
    p_sticker_id: input.stickerId,
    p_book_id: input.bookId,
    p_page: input.page,
    p_x: Math.round(input.x),
    p_y: Math.round(input.y),
  });
  return error ? fail(error) : ok("貼りました");
}

export async function removeSticker(stickerId: string): Promise<ActionState> {
  const { error } = await callRpc("oshi_remove_sticker", { p_sticker_id: stickerId });
  return error ? fail(error) : ok("剥がしました");
}
