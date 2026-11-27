"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { Loading } from "@/components/Loading";
import { StickerView } from "@/components/StickerView";
import { setFavBooks, setFavorites, signOut, updateProfile } from "@/client/mutations";
import { useBooks, useMe, useSetting, useShowcase, useStickers } from "@/client/queries";
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
        <ActionForm action={updateProfile} submitLabel="保存" className="flex flex-col gap-2">
          <label className="text-sm">
            表示名
            <input name="display_name" defaultValue={p.display_name} required maxLength={30} className="input w-full" />
          </label>
          <label className="text-sm">
            自己紹介
            <textarea name="bio" defaultValue={p.bio} maxLength={200} className="input w-full" rows={3} />
          </label>
          <label className="text-sm">
            アイコン画像URL（仮。アップロードはデザイン工程で）
            <input name="avatar_url" defaultValue={p.avatar_url ?? ""} className="input w-full" />
          </label>
        </ActionForm>
      </section>

      <section>
        <h2 className="h2">TOP3（お気に入りシール・最大3枚）</h2>
        <ActionForm action={setFavorites} submitLabel="TOP3を保存" className="flex flex-col gap-2">
          <ul className="flex flex-wrap gap-2">
            {opened.data.map((s) => (
              <li key={s.id}>
                <label className="flex flex-col items-center text-[10px]">
                  <StickerView name={s.type.name} imagePath={s.type.image_path} w={s.type.width} h={s.type.height} fixed={48} />
                  <input type="checkbox" name="sticker" value={s.id} defaultChecked={favIds.has(s.id)} />
                </label>
              </li>
            ))}
          </ul>
          {opened.data.length === 0 && <p className="text-sm text-sub">開封済みのシールがありません</p>}
        </ActionForm>
      </section>

      <section>
        <h2 className="h2">お気に入りシール帳（最大3冊）</h2>
        <ActionForm action={setFavBooks} submitLabel="保存" className="flex flex-col gap-2">
          <ul className="space-y-1">
            {books.data.map((b) => (
              <li key={b.id}>
                <label className="text-sm">
                  <input type="checkbox" name="book" value={b.id} defaultChecked={favBookIds.has(b.id)} /> {b.type.name} No.{b.serial_no}
                </label>
              </li>
            ))}
          </ul>
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

      <button
        className="text-sm underline"
        onClick={async () => {
          await signOut();
          router.replace("/login");
        }}
      >
        ログアウト
      </button>
    </div>
  );
}
