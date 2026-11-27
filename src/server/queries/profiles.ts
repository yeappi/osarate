import type { PublicProfile } from "@/domain/types";
import { createSupabaseServer } from "@/server/supabase/server";

/** oshi_profiles は列権限で残高を隠しているため、select * は使えない */
export const PROFILE_COLUMNS = "user_id, handle, display_name, avatar_url, bio, charm_total, support_total";

export async function getProfileByHandle(handle: string): Promise<PublicProfile | null> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.from("oshi_profiles").select(PROFILE_COLUMNS).ilike("handle", handle).maybeSingle();
  return (data as PublicProfile | null) ?? null;
}

export async function searchProfiles(q: string): Promise<PublicProfile[]> {
  const supabase = await createSupabaseServer();
  const term = q.replace(/[%_,()]/g, "").trim();
  if (!term) return [];
  const { data } = await supabase
    .from("oshi_profiles")
    .select(PROFILE_COLUMNS)
    .or(`handle.ilike.%${term}%,display_name.ilike.%${term}%`)
    .limit(50);
  return (data as PublicProfile[] | null) ?? [];
}

export async function getFollowStats(userId: string, viewerId: string | null) {
  const supabase = await createSupabaseServer();
  const [following, followers, mine] = await Promise.all([
    supabase.from("oshi_follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
    supabase.from("oshi_follows").select("*", { count: "exact", head: true }).eq("followee_id", userId),
    viewerId
      ? supabase.from("oshi_follows").select("follower_id").eq("follower_id", viewerId).eq("followee_id", userId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return { following: following.count ?? 0, followers: followers.count ?? 0, isFollowing: !!mine.data };
}

export async function listFollowing(userId: string): Promise<PublicProfile[]> {
  const supabase = await createSupabaseServer();
  const { data: rows } = await supabase.from("oshi_follows").select("followee_id").eq("follower_id", userId);
  const ids = (rows ?? []).map((r) => r.followee_id as string);
  if (ids.length === 0) return [];
  const { data } = await supabase.from("oshi_profiles").select(PROFILE_COLUMNS).in("user_id", ids);
  return (data as PublicProfile[] | null) ?? [];
}
