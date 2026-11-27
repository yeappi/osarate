"use server";

// 遊び場（パチ屋）。本体とは「玉残高」と「ポイント増減」だけでつながる
import { tierLabel } from "@/domain/format";
import { callRpc, fail, int, ok, requestId, type ActionState } from "@/server/action";

export async function lendAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { data, error } = await callRpc<{ balls: number }>("oshi_pachi_lend", {
    p_request_id: requestId(fd),
    p_points: int(fd, "points"),
  });
  return error ? fail(error) : ok(`玉を借りました（持ち玉 ${data?.balls}）`);
}

export async function cashoutAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { data, error } = await callRpc<{ gained: number; points: number }>("oshi_pachi_cashout", {
    p_request_id: requestId(fd),
    p_balls: int(fd, "balls"),
  });
  return error ? fail(error) : ok(`精算しました（+${data?.gained}pt）`);
}

type SpinResult = { results: { tier: string; pay: number }[]; payout: number; balls: number };

export async function spinAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { data, error } = await callRpc<SpinResult>("oshi_pachi_spin", {
    p_request_id: requestId(fd),
    p_machine: int(fd, "machine"),
    p_spins: int(fd, "spins"),
  });
  if (error || !data) return fail(error ?? "エラーが発生しました");
  const best = data.results.reduce((a, b) => (b.pay > a.pay ? b : a), data.results[0]);
  const head = best && best.pay > 0 ? `${tierLabel(best.tier)}！ ` : "";
  return ok(`${head}${data.results.length}回転 → 払い出し ${data.payout}玉（持ち玉 ${data.balls}）`, data);
}

export async function exchangeAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { error } = await callRpc("oshi_pachi_exchange", {
    p_request_id: requestId(fd),
    p_listing_id: int(fd, "listingId"),
  });
  return error ? fail(error) : ok("景品と交換しました（バッグに入りました）");
}
