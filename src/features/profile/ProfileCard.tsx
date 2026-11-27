"use client";

import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { StickerView } from "@/components/StickerView";
import { formatNum } from "@/domain/format";
import type { CanvasItem, PublicProfile } from "@/domain/types";
import { follow as followAction } from "@/client/mutations";

type Props = {
  profile: PublicProfile;
  isSelf: boolean;
  follow: { following: number; followers: number; isFollowing: boolean };
  favorites: { sticker_id: string; name: string; image_path: string | null; width: number; height: number }[];
  favBooks: { id: string; name: string; page_count: number }[];
  background: CanvasItem[];
  bgCanvas: { w: number; h: number };
};

const CARD_W = 360;
const FIXED = 88; // TOP3・お気に入りシール帳の表示サイズ（固有サイズに関係なく固定）

/** プロフィールの名刺部分（最初の1画面）。骨格なので見た目は最小限 */
export function ProfileCard({ profile, isSelf, follow, favorites, favBooks, background, bgCanvas }: Props) {
  const scale = CARD_W / bgCanvas.w;
  return (
    <section className="relative mx-auto overflow-hidden border bg-white" style={{ width: CARD_W, minHeight: bgCanvas.h * scale }}>
      {/* 背景のシール */}
      {background.map((b) => (
        <div key={b.sticker_id} className="absolute" style={{ left: b.x * scale, top: b.y * scale }}>
          <StickerView name={b.name} imagePath={b.image_path} w={b.w} h={b.h} scale={scale} />
        </div>
      ))}

      <div className="relative flex flex-col items-center gap-2 p-4">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border bg-gray-100 text-2xl">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            profile.display_name.slice(0, 1)
          )}
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">{profile.display_name}</div>
          <div className="text-xs text-gray-500">@{profile.handle}</div>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <div className="text-xs">魅力値</div>
            <div className="text-xl font-bold">{formatNum(profile.charm_total)}</div>
          </div>
          <div>
            <div className="text-xs">応援力</div>
            <div className="text-xl font-bold">{formatNum(profile.support_total)}</div>
          </div>
        </div>
        <div className="text-xs">
          フォロー {follow.following}　フォロワー {follow.followers}
        </div>
        {profile.bio && <p className="whitespace-pre-wrap text-center text-sm">{profile.bio}</p>}

        {isSelf ? (
          <Link href="/me/edit" className="btn">プロフィール・展示を編集</Link>
        ) : (
          <div className="flex gap-2">
            <ActionForm action={followAction} submitLabel={follow.isFollowing ? "フォロー解除" : "フォロー"}>
              <input type="hidden" name="target" value={profile.user_id} />
              <input type="hidden" name="mode" value={follow.isFollowing ? "unfollow" : "follow"} />
            </ActionForm>
            <Link href={`/u/${profile.handle}/dex/main`} className="btn-primary">ギフトを贈る</Link>
          </div>
        )}

        {/* TOP3 ＋ お気に入りシール帳（1冊なら横、2〜3冊なら下） */}
        <div className={`flex gap-2 ${favBooks.length === 1 ? "flex-row" : "flex-col items-center"}`}>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => {
              const f = favorites[i];
              return f ? (
                <div key={f.sticker_id} className="border-2 border-white shadow">
                  <StickerView name={f.name} imagePath={f.image_path} w={f.width} h={f.height} fixed={FIXED} />
                </div>
              ) : (
                <div key={i} className="border border-dashed" style={{ width: FIXED, height: FIXED }} />
              );
            })}
          </div>
          {favBooks.length > 0 && (
            <div className="flex gap-2">
              {favBooks.map((b) => (
                <Link
                  key={b.id}
                  href={`/stickers/books/${b.id}`}
                  className="flex items-center justify-center border-2 border-white bg-pink-50 p-1 text-center text-[10px] shadow"
                  style={{ width: FIXED, height: FIXED }}
                >
                  {b.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
