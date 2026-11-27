"use client";

// 遊び場（パチ屋）。本体とは「玉残高」と「ポイント増減」だけでつながる
import { invalidateAll } from "@/client/store";
import { sb } from "@/client/supabase";
import type { ActionState } from "@/domain/action";
import { toUserMessage } from "@/domain/errors";
import { tierLabel } from "@/domain/format";

async function call<T>(fn: string, args: Record<string, unknown>, msg: (d: T) => string): Promise<ActionState> {
  const { data, error } = await sb().rpc(fn, args);
  if (error) return { ok: false, message: toUserMessage(error.message) };
  invalidateAll();
  return { ok: true, message: msg(data as T), data };
}
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const n = (fd: FormData, k: string) => Number(s(fd, k)) || null;

export const lend = (fd: FormData) =>
  call<{ balls: number }>("oshi_pachi_lend", { p_request_id: s(fd, "requestId"), p_points: n(fd, "points") }, (d) => `玉を借りました（持ち玉 ${d.balls}）`);

export const cashout = (fd: FormData) =>
  call<{ gained: number }>("oshi_pachi_cashout", { p_request_id: s(fd, "requestId"), p_balls: n(fd, "balls") }, (d) => `精算しました（+${d.gained}pt）`);

type SpinResult = { results: { tier: string; pay: number }[]; payout: number; balls: number };

export const spin = (fd: FormData) =>
  call<SpinResult>("oshi_pachi_spin", { p_request_id: s(fd, "requestId"), p_machine: n(fd, "machine"), p_spins: n(fd, "spins") }, (d) => {
    const best = d.results.reduce((a, b) => (b.pay > a.pay ? b : a), d.results[0]);
    const head = best && best.pay > 0 ? `${tierLabel(best.tier)}！ ` : "";
    return `${head}${d.results.length}回転 → 払い出し ${d.payout}玉（持ち玉 ${d.balls}）`;
  });

export const exchange = (fd: FormData) =>
  call("oshi_pachi_exchange", { p_request_id: s(fd, "requestId"), p_listing_id: n(fd, "listingId") }, () => "景品と交換しました（バッグに入りました）");
