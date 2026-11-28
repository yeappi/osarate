"use client";

import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { Icon } from "@/components/Icon";
import { StickerView } from "@/components/StickerView";
import { follow as followAction } from "@/client/mutations";
import { formatNum } from "@/domain/format";
import type { CanvasItem, PublicProfile } from "@/domain/types";

type Props = {
  profile: PublicProfile;
  isSelf: boolean;
  /** ログインしていない閲覧者 */
  guest?: boolean;
  follow: { following: number; followers: number; isFollowing: boolean };
  favorites: { sticker_id: string; name: string; image_path: string | null; width: number; height: number }[];
  favBooks: { id: string; name: string; page_count: number }[];
  background: CanvasItem[];
  bgCanvas: { w: number; h: number };
};

const CARD_W = 358;
const FIXED = 88; // TOP3・お気に入りシール帳の表示サイズ（固有サイズに関係なく固定）

/**
 * プロフィールの名刺部分（最初の1画面）。
 * 将来のプロフィール着せ替えは、この section に data-theme を付けて切り替える。
 */
export function ProfileCard({ profile, isSelf, guest, follow, favorites, favBooks, background, bgCanvas }: Props) {
  const scale = CARD_W / bgCanvas.w;
  return (
    <section
      className="relative mx-auto overflow-hidden rounded-card border border-line bg-surface shadow-soft"
      style={{ width: CARD_W, minHeight: bgCanvas.h * scale }}
    >
      {/* 背景のシール */}
      {background.map((b) => (
        <div key={b.sticker_id} className="absolute" style={{ left: b.x * scale, top: b.y * scale }}>
          <StickerView name={b.name} imagePath={b.image_path} w={b.w} h={b.h} scale={scale} />
        </div>
      ))}

      <div className="relative flex flex-col items-center gap-2.5 px-4 pb-5 pt-6">
        <div className="h-[84px] w-[84px] rounded-full bg-[conic-gradient(var(--t-accent),var(--t-gold),var(--t-mint),var(--t-accent))] p-[3px]">
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-[3px] border-surface bg-accent-soft font-round text-3xl font-bold text-accent-ink">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              profile.display_name.slice(0, 1)
            )}
          </div>
        </div>

        <div className="text-center">
          <div className="font-round text-[22px] font-bold tracking-wide">{profile.display_name}</div>
          <div className="mt-0.5 text-xs text-sub">@{profile.handle}</div>
        </div>

        <div className="mt-1 grid w-full grid-cols-2 gap-2.5">
          <div className="rounded-2xl bg-accent-soft px-3 py-2.5 text-center">
            <div className="text-[11px] font-medium text-accent-ink">魅力値</div>
            <div className="num text-[26px] leading-tight text-accent-ink">{formatNum(profile.charm_total)}</div>
          </div>
          <div className="rounded-2xl bg-mint-soft px-3 py-2.5 text-center">
            <div className="text-[11px] font-medium text-mint">応援力</div>
            <div className="num text-[26px] leading-tight text-mint">{formatNum(profile.support_total)}</div>
          </div>
        </div>

        <div className="flex gap-4 text-xs text-sub">
          <span>
            <b className="num text-[13px] text-ink">{follow.following}</b> フォロー
          </span>
          <span>
            <b className="num text-[13px] text-ink">{follow.followers}</b> フォロワー
          </span>
        </div>

        {profile.bio && <p className="whitespace-pre-wrap text-center text-sm leading-relaxed">{profile.bio}</p>}

        {/* TOP3 ＋ お気に入りシール帳（1冊なら横、2〜3冊なら下） */}
        <div className={`mt-1 flex gap-2.5 ${favBooks.length === 1 ? "flex-row" : "flex-col items-center"}`}>
          <div className="flex gap-2.5">
            {[0, 1, 2].map((i) => {
              const f = favorites[i];
              return f ? (
                <div key={f.sticker_id} className="rounded-[18px] border-[3px] border-surface shadow-lift">
                  <StickerView name={f.name} imagePath={f.image_path} w={f.width} h={f.height} fixed={FIXED - 6} />
                </div>
              ) : (
                <div key={i} className="rounded-[18px] border-[1.5px] border-dashed border-line" style={{ width: FIXED, height: FIXED }} />
              );
            })}
          </div>
          {favBooks.length > 0 && (
            <div className="flex gap-2.5">
              {favBooks.map((b) => (
                <Link
                  key={b.id}
                  href={`/stickers/books/${b.id}`}
                  className="flex flex-col justify-end rounded-[18px] border-[3px] border-surface bg-accent-soft p-2 shadow-lift"
                  style={{ width: FIXED, height: FIXED }}
                >
                  <span className="text-[11px] font-bold leading-tight">{b.name}</span>
                  <span className="text-[10px] text-sub">{b.page_count}P</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {isSelf ? (
            <Link href="/me/edit" className="btn">プロフィール・展示を編集</Link>
          ) : guest ? (
            <Link href="/signup" className="btn-primary">はじめて、フォローやギフトをする</Link>
          ) : (
            <>
              <ActionForm action={followAction} submitLabel={follow.isFollowing ? "フォロー中" : "フォロー"} className="flex">
                <input type="hidden" name="target" value={profile.user_id} />
                <input type="hidden" name="mode" value={follow.isFollowing ? "unfollow" : "follow"} />
              </ActionForm>
              <Link href={`/u/${profile.handle}/dex/main`} className="btn-primary">
                <Icon name="gift" size={16} strokeWidth={2} />
                ギフトを贈る
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
