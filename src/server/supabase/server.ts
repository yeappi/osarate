import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "@/config/app";

/**
 * 利用者のセッション（JWT）で動く Supabase クライアント。RLS が効く。
 * Server Component / Server Action / Route Handler から使う。
 */
export async function createSupabaseServer() {
  const cookieStore = await cookies();
  const { url, anonKey } = supabaseEnv();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component からは Cookie を書けない。セッション更新は proxy.ts が担う
        }
      },
    },
  });
}
