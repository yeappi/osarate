"use client";

import Link from "next/link";
import { BookTile } from "@/components/BookTile";
import { Loading } from "@/components/Loading";
import { VISIBLE_DEXES } from "@/config/app";
import { fetchDex, useBooks, useFollowStats, useMe, useSetting, useShowcase } from "@/client/queries";
import { useQuery } from "@/client/store";
import type { PublicProfile } from "@/domain/types";
import { ProfileActions, SafetyActions } from "./ProfileActions";
import { ProfileCard } from "./ProfileCard";

/** プロフィール画面の本体（自分・他人で共通） */
export function ProfileView({ profile, preview }: { profile: PublicProfile; preview?: boolean }) {
  const me = useMe();
  const viewerId = me.data?.userId ?? null;
  const isOwner = viewerId === profile.user_id;
  // preview：自分のプロフィールを、他人からの見え方で表示する
  const isSelf = isOwner && !preview;
  const follow = useFollowStats(profile.user_id, viewerId);
  const showcase = useShowcase(profile.user_id);
  const books = useBooks(profile.user_id);
  const canvas = useSetting<{ w: number; h: number }>("profile_bg_canvas");
  const dex = useQuery(`dexsummary:${profile.user_id}`, () =>
    Promise.all(
      VISIBLE_DEXES.map(async (d) => {
        const entries = await fetchDex(profile.user_id, d.slug);
        return { ...d, owned: entries.filter((e) => e.owned).length, total: entries.length };
      }),
    ),
  );

  return (
    <div>
      {isOwner && preview && (
        <Link href="/me" className="mb-3 block rounded-2xl bg-gold-soft px-3 py-2 text-center text-xs">
          みんなからはこう見えています。<b>マイページへ戻る</b>
        </Link>
      )}
      {showcase.data && follow.data ? (
        <ProfileCard
          profile={profile}
          isSelf={isSelf}
          guest={!viewerId}
          readonly={isOwner && preview}
          follow={follow.data}
          favorites={showcase.data.favorites}
          favBooks={showcase.data.books}
          background={showcase.data.background}
          bgCanvas={canvas.data ?? { w: 360, h: 480 }}
        />
      ) : (
        <Loading error={showcase.error ?? follow.error} />
      )}
      <ProfileActions profile={profile} />

      <h2 className="h2">シール帳</h2>
      {!books.data ? (
        <Loading error={books.error} />
      ) : books.data.length === 0 ? (
        <p className="text-sm text-sub">まだありません</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {books.data.map((b, i) => (
            <li key={b.id}>
              <BookTile id={b.id} name={b.type.name} sub={`${b.type.page_count}ページ`} index={i} theme={b.type.theme} />
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
                <span className="flex items-center justify-between">
                  <span>
                    {d.owned} / {d.total} 種類を集めました
                  </span>
                  <span className="text-sub">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!preview && <SafetyActions profile={profile} />}
    </div>
  );
}
