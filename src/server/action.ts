import { toUserMessage } from "@/domain/errors";
import { createSupabaseServer } from "@/server/supabase/server";

import type { ActionState } from "@/domain/action";
export type { ActionState };

export function ok(message: string, data?: unknown): ActionState {
  return { ok: true, message, data };
}

export function fail(message: string): ActionState {
  return { ok: false, message };
}

/** RPC を呼び、エラーは利用者向け文言に変換して返す */
export async function callRpc<T = unknown>(
  fn: string,
  args?: Record<string, unknown>,
): Promise<{ data: T | null; error: string | null }> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc(fn, args);
  if (error) return { data: null, error: toUserMessage(error.message) };
  return { data: data as T, error: null };
}

// ---- FormData の取り出し ----

export function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export function int(fd: FormData, key: string): number | null {
  const s = str(fd, key);
  if (s === "") return null;
  const n = Number(s);
  return Number.isInteger(n) ? n : null;
}

export function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

/** ActionForm が自動で付ける冪等キー */
export function requestId(fd: FormData): string {
  return str(fd, "requestId");
}
