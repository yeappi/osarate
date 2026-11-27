"use client";

import Link from "next/link";
import { BookTile } from "@/components/BookTile";
import { Loading } from "@/components/Loading";
import { DEXES } from "@/config/app";
import { fetchDex, useBooks, useFollowStats, useMe, useSetting, useShowcase } from "@/client/queries";
import { useQuery } from "@/client/store";
import type { PublicProfile } from "@/domain/types";
import { ProfileCard } from "./ProfileCard";

/** プロフィール画面の本体（自分・他人で共通） */
export function ProfileView({ profile }: { profile: PublicProfile }) {
  const me = useMe();
  const viewerId = me.data?.userId ?? null;
  const isSelf = viewerId === profile.user_id;
  const follow = useFollowStats(profile.user_id, viewerId);
  const showcase = useShowcase(profile.user_id);
  const books = useBooks(profile.user_id);
  const canvas = useSetting<{ w: number; h: number }>("profile_bg_canvas");
  const dex = useQuery(`dexsummary:${profile.user_id}`, () =>
    Promise.all(
      DEXES.map(async (d) => {
        const entries = await fetchDex(profile.user_id, d.slug);
        return { ...d, owned: entries.filter((e) => e.owned).length, total: entries.length };
      }),
    ),
  );

  return (
    <div>
      {showcase.data && follow.data ? (
        <ProfileCard
          profile={profile}
          isSelf={isSelf}
          follow={follow.data}
          favorites={showcase.data.favorites}
          favBooks={showcase.data.books}
          background={showcase.data.background}
          bgCanvas={canvas.data ?? { w: 360, h: 480 }}
        />
      ) : (
        <Loading error={showcase.error ?? follow.error} />
      )}

      <h2 className="h2">シール帳</h2>
      {!books.data ? (
        <Loading error={books.error} />
      ) : books.data.length === 0 ? (
        <p className="text-sm text-sub">まだありません</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {books.data.map((b, i) => (
            <li key={b.id}>
              <BookTile id={b.id} name={b.type.name} sub={`No.${b.serial_no}・${b.type.page_count}P`} index={i} />
            </li>
          ))}
        </ul>
      )}

      <h2 className="h2">図鑑</h2>
      {!dex.data ? (
        <Loading error={dex.error} />
      ) : (
        <ul className="space-y-2">
          {dex.data.map((d) => (
            <li key={d.slug}>
              <Link href={isSelf ? `/dex/${d.slug}` : `/u/${profile.handle}/dex/${d.slug}`} className="card block text-sm">
                {d.name}：{d.owned} / {d.total}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
