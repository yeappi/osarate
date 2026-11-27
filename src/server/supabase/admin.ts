import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "@/config/app";

/**
 * Service Role クライアント。RLS を無視するため、用途は限定する：
 *   - 運営画面からの画像アップロード（呼び出し前に運営権限を確認すること）
 * クライアントコンポーネントから絶対に import しない。
 */
export function createSupabaseAdmin() {
  const { url } = supabaseEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY が未設定です");
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
