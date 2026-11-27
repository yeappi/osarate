import { cache } from "react";
import type { PublicProfile, Wallet } from "@/domain/types";
import { createSupabaseServer } from "@/server/supabase/server";
import { PROFILE_COLUMNS } from "./profiles";

/** ログイン中のユーザー・プロフィール・残高（1リクエスト内でキャッシュ） */
export const getMe = cache(async () => {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null, wallet: null };

  const [{ data: profile }, { data: wallet }] = await Promise.all([
    supabase.from("oshi_profiles").select(PROFILE_COLUMNS).eq("user_id", user.id).maybeSingle(),
    supabase.rpc("oshi_my_wallet"),
  ]);
  return {
    user,
    profile: (profile as PublicProfile | null) ?? null,
    wallet: (wallet as Wallet | null) ?? null,
  };
});

/** プロフィール作成済みのユーザーを必須とする（画面用）。未作成なら null */
export async function requireMe() {
  const me = await getMe();
  if (!me.user || !me.profile || !me.wallet) return null;
  return { user: me.user, profile: me.profile, wallet: me.wallet };
}
