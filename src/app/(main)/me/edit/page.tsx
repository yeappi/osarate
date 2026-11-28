"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { Loading } from "@/components/Loading";
import { PickMax } from "@/components/PickMax";
import { StickerView } from "@/components/StickerView";
import { bookTone } from "@/components/BookTile";
import { setFavBooks, setFavorites, signOut, updateProfile } from "@/client/mutations";
import { useBooks, useMe, useSetting, useShowcase, useStickers } from "@/client/queries";
import { AvatarPicker } from "@/features/profile/AvatarPicker";
import { BgEditor } from "@/features/profile/BgEditor";

export default function EditProfilePage() {
  const router = useRouter();
  const me = useMe();
  const uid = me.data?.userId ?? null;
  const opened = useStickers(uid, "opened"); // シール帳に貼っているものも選べる
  const books = useBooks(uid);
  const showcase = useShowcase(uid);
  const canvas = useSetting<{ w: number; h: number }>("profile_bg_canvas");
  const bgMax = useSetting<number>("profile_bg_max");

  const p = me.data?.profile;
  if (!p || !opened.data || !books.data || !showcase.data) {
    return <Loading error={me.error ?? opened.error ?? books.error ?? showcase.error} />;
  }
  const favIds = new Set(showcase.data.favorites.map((f) => f.sticker_id));
  const favBookIds = new Set(showcase.data.books.map((b) => b.id));

  return (
    <div className="space-y-4">
      <p className="text-sm">
        <Link href="/me" className="link">← プロフィールへ</Link>
      </p>

      <section>
        <h2 className="h2">プロフィール</h2>
        <ActionForm action={updateProfile} submitLabel="保存" variant="primary" className="flex flex-col gap-2">
          <label className="text-sm">
            表示名
            <input name="display_name" defaultValue={p.display_name} required maxLength={30} className="input w-full" />
          </label>
          <label className="text-sm">
            自己紹介
            <textarea name="bio" defaultValue={p.bio} maxLength={200} className="input w-full" rows={3} />
          </label>
          <div className="text-sm">
            アイコン
            <AvatarPicker userId={p.user_id} initial={p.avatar_url} initialLetter={p.display_name.slice(0, 1)} />
          </div>
        </ActionForm>
      </section>

      <section>
        <h2 className="h2">TOP3（プロフィールに飾るシール）</h2>
        <ActionForm action={setFavorites} submitLabel="TOP3を保存" variant="primary" className="flex flex-col gap-2">
          {opened.data.length === 0 ? (
            <p className="text-sm text-sub">開封済みのシールがありません</p>
          ) : (
            <PickMax
              items={opened.data}
              initial={[...favIds]}
              max={3}
              name="sticker"
              render={(s) => <StickerView name={s.type.name} imagePath={s.type.image_path} w={s.type.width} h={s.type.height} fixed={56} />}
            />
          )}
        </ActionForm>
      </section>

      <section>
        <h2 className="h2">お気に入りシール帳（プロフィールに出す）</h2>
        <ActionForm action={setFavBooks} submitLabel="保存" variant="primary" className="flex flex-col gap-2">
          <PickMax
            items={books.data}
            initial={[...favBookIds]}
            max={3}
            name="book"
            render={(b) => (
              <span className={`flex h-20 w-16 flex-col justify-end rounded-[8px_14px_14px_8px] p-1.5 text-left text-[10px] font-bold leading-tight ${bookTone(b.type.theme, 0)}`}>
                {b.type.name}
              </span>
            )}
          />
        </ActionForm>
      </section>

      <section>
        <h2 className="h2">背景</h2>
        <BgEditor
          canvas={canvas.data ?? { w: 360, h: 480 }}
          max={bgMax.data ?? 20}
          initial={showcase.data.background}
          candidates={opened.data.map((s) => ({
            sticker_id: s.id,
            name: s.type.name,
            image_path: s.type.image_path,
            w: s.type.width,
            h: s.type.height,
          }))}
        />
      </section>

      <section className="space-y-2 border-t border-line pt-4">
        <h2 className="font-round text-base font-bold">アカウント</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/reset" className="btn">パスワードを変更</Link>
          <button
            className="btn"
            onClick={async () => {
              await signOut();
              router.replace("/");
            }}
          >
            ログアウト
          </button>
        </div>
        <p className="text-xs text-sub">メールアドレスの変更・退会は、いまは運営へのお問い合わせで受け付けています。</p>
      </section>
    </div>
  );
}
