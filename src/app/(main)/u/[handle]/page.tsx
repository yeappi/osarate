import Link from "next/link";
import { notFound } from "next/navigation";
import { DEXES } from "@/config/app";
import { ProfileCard } from "@/features/profile/ProfileCard";
import { getDexSummary, getSetting } from "@/server/queries/catalog";
import { getShowcase, listBooks } from "@/server/queries/items";
import { getMe } from "@/server/queries/me";
import { getFollowStats, getProfileByHandle } from "@/server/queries/profiles";

export default async function UserPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const profile = await getProfileByHandle(decodeURIComponent(handle));
  if (!profile) notFound();
  const me = await getMe();
  const isSelf = me.user?.id === profile.user_id;

  const [follow, showcase, books, dexes, bgCanvas] = await Promise.all([
    getFollowStats(profile.user_id, me.user?.id ?? null),
    getShowcase(profile.user_id),
    listBooks(profile.user_id),
    Promise.all(DEXES.map(async (d) => ({ ...d, ...(await getDexSummary(profile.user_id, d.slug)) }))),
    getSetting<{ w: number; h: number }>("profile_bg_canvas"),
  ]);

  return (
    <div>
      <ProfileCard
        profile={profile}
        isSelf={isSelf}
        follow={follow}
        favorites={showcase.favorites}
        favBooks={showcase.books}
        background={showcase.background}
        bgCanvas={bgCanvas ?? { w: 360, h: 480 }}
      />

      <h2 className="h2">シール帳</h2>
      {books.length === 0 ? (
        <p className="text-sm text-gray-500">まだありません</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {books.map((b) => (
            <li key={b.id}>
              <Link href={`/stickers/books/${b.id}`} className="card block text-center text-sm">
                {b.type.name}
                <div className="text-xs text-gray-500">No.{b.serial_no}・{b.type.page_count}P</div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className="h2">図鑑</h2>
      <ul className="space-y-2">
        {dexes.map((d) => (
          <li key={d.slug}>
            <Link href={isSelf ? `/dex/${d.slug}` : `/u/${profile.handle}/dex/${d.slug}`} className="card block text-sm">
              {d.name}：{d.owned} / {d.total}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
