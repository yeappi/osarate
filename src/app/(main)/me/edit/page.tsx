import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { StickerView } from "@/components/StickerView";
import { BgEditor } from "@/features/profile/BgEditor";
import { getSetting } from "@/server/queries/catalog";
import { getShowcase, listBooks, listStickers } from "@/server/queries/items";
import { requireMe } from "@/server/queries/me";
import { setFavBooksAction, setFavoritesAction, updateProfileAction } from "@/server/services/profile";
import { signOutAction } from "@/server/services/auth";

export default async function EditProfilePage() {
  const me = await requireMe();
  if (!me) redirect("/welcome");
  const [opened, books, showcase, canvas, bgMax] = await Promise.all([
    listStickers(me.user.id, "opened"), // シール帳に貼っているものも選べる
    listBooks(me.user.id),
    getShowcase(me.user.id),
    getSetting<{ w: number; h: number }>("profile_bg_canvas"),
    getSetting<number>("profile_bg_max"),
  ]);
  const favIds = new Set(showcase.favorites.map((f) => f.sticker_id));
  const favBookIds = new Set(showcase.books.map((b) => b.id));
  const p = me.profile;

  return (
    <div className="space-y-4">
      <p className="text-sm">
        <Link href="/me" className="link">← プロフィールへ</Link>
      </p>

      <section>
        <h2 className="h2">プロフィール</h2>
        <ActionForm action={updateProfileAction} submitLabel="保存" className="flex flex-col gap-2">
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
        <ActionForm action={setFavoritesAction} submitLabel="TOP3を保存" className="flex flex-col gap-2">
          <ul className="flex flex-wrap gap-2">
            {opened.map((s) => (
              <li key={s.id}>
                <label className="flex flex-col items-center text-[10px]">
                  <StickerView name={s.type.name} imagePath={s.type.image_path} w={s.type.width} h={s.type.height} fixed={48} />
                  <input type="checkbox" name="sticker" value={s.id} defaultChecked={favIds.has(s.id)} />
                </label>
              </li>
            ))}
          </ul>
          {opened.length === 0 && <p className="text-sm text-gray-500">開封済みのシールがありません</p>}
        </ActionForm>
      </section>

      <section>
        <h2 className="h2">お気に入りシール帳（最大3冊）</h2>
        <ActionForm action={setFavBooksAction} submitLabel="保存" className="flex flex-col gap-2">
          <ul className="space-y-1">
            {books.map((b) => (
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
          canvas={canvas ?? { w: 360, h: 480 }}
          max={bgMax ?? 20}
          initial={showcase.background}
          candidates={opened.map((s) => ({
            sticker_id: s.id,
            name: s.type.name,
            image_path: s.type.image_path,
            w: s.type.width,
            h: s.type.height,
          }))}
        />
      </section>

      <form action={signOutAction}>
        <button className="text-sm underline">ログアウト</button>
      </form>
    </div>
  );
}
