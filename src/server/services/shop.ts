"use server";

import { bool, callRpc, fail, int, ok, requestId, resolveHandle, str, type ActionState } from "@/server/action";

type BuyResult = { spent: number; points: number; gift: { reward: number } | null };

async function giftTarget(fd: FormData): Promise<{ to: string | null; error: string | null }> {
  const handle = str(fd, "giftTo");
  if (!handle) return { to: null, error: null };
  const to = await resolveHandle(handle);
  return to ? { to, error: null } : { to: null, error: "贈り先のユーザーが見つかりません" };
}

function resultMessage(r: BuyResult | null, gifted: boolean): string {
  if (!r) return "購入しました";
  if (gifted) return `ギフトしました（${r.spent}pt、相手に還元 ${r.gift?.reward ?? 0}pt）`;
  return `購入しました（${r.spent}pt、残り ${r.points}pt）`;
}

/** 図鑑からの購入。giftTo があれば購入と同時にギフト */
export async function buyStickerAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const target = await giftTarget(fd);
  if (target.error) return fail(target.error);
  const { data, error } = await callRpc<BuyResult>("oshi_buy_sticker", {
    p_request_id: requestId(fd),
    p_type_id: int(fd, "typeId"),
    p_qty: int(fd, "qty") ?? 1,
    p_open: bool(fd, "open"),
    p_gift_to: target.to,
    p_message: str(fd, "message") || null,
  });
  return error ? fail(error) : ok(resultMessage(data, !!target.to), data);
}

export async function buyListingAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const target = await giftTarget(fd);
  if (target.error) return fail(target.error);
  const { data, error } = await callRpc<BuyResult>("oshi_buy_listing", {
    p_request_id: requestId(fd),
    p_listing_id: int(fd, "listingId"),
    p_open: bool(fd, "open"),
    p_gift_to: target.to,
    p_message: str(fd, "message") || null,
  });
  return error ? fail(error) : ok(resultMessage(data, !!target.to), data);
}
