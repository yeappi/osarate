import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "@/config/app";

/**
 * メール送信（登録確認・パスワード再設定）専用のクライアント。
 * PKCE ではなく implicit フローでリンクを発行するため、
 * メールをどのブラウザ・アプリで開いても /auth/confirm でセッションを確立できる。
 * セッションは保持しない（ここでは送信のみ）。
 */
export function createSupabaseForEmailLinks() {
  const { url, anonKey } = supabaseEnv();
  return createClient(url, anonKey, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
