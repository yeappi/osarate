"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "@/config/app";

type BrowserClient = ReturnType<typeof createBrowserClient>;
let client: BrowserClient | null = null;

/**
 * ブラウザ用 Supabase クライアント（Cookie セッションをサーバーと共有）。
 * 読み取りは RLS、書き込みは DB 関数（RPC）が守るので、ブラウザから直接呼んでよい。
 */
export function sb(): BrowserClient {
  if (!client) {
    const { url, anonKey } = supabaseEnv();
    client = createBrowserClient(url, anonKey);
  }
  return client;
}

/** { data, error } を data か例外にする */
export function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}
