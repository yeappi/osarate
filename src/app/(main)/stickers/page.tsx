import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { StickerView } from "@/components/StickerView";
import { DEXES } from "@/config/app";
import { RecipientFields } from "@/features/gift/RecipientFields";
import { listBooks, listStorage } from "@/server/queries/items";
import { requireMe } from "@/server/queries/me";
import { sendPresentAction } from "@/server/services/items";

// シール：保管（開封済み・未使用）とシール帳の一覧
export default async function StickersPage() {
  const me = await requireMe();
  if (!me) redirect("/welcome");
  const [storage, books] = await Promise.all([listStorage(me.user.id), listBooks(me.user.id)]);

  return (
    <div>
      <nav className="mb-3 flex gap-3 text-sm">
        {DEXES.map((d) => (
          <Link key={d.slug} href={`/dex/${d.slug}`} className="link">図鑑：{d.name}</Link>
        ))}
        <Link href="/bag" className="link">バッグ</Link>
        <Link href="/gifts" className="link">ギフト履歴</Link>
      </nav>

      <h1 className="h2">シール帳</h1>
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

      <h2 className="h2">保管（{storage.length}枚）</h2>
      {storage.length === 0 && <p className="text-sm text-gray-500">開封済みのシールはここに入ります</p>}
      <ul className="space-y-2">
        {storage.map((s) => (
          <li key={s.id} className="card flex items-center gap-3">
            <StickerView name={s.type.name} imagePath={s.type.image_path} w={s.type.width} h={s.type.height} fixed={48} />
            <div className="flex-1 text-sm">
              {s.type.name} <span className="text-xs text-gray-500">No.{s.serial_no}</span>
              <details className="mt-1">
                <summary className="cursor-pointer text-xs link">プレゼントする</summary>
                <ActionForm action={sendPresentAction} submitLabel="プレゼント" confirm="このシールをプレゼントしますか？">
                  <input type="hidden" name="stickerId" value={s.id} />
                  <RecipientFields />
                </ActionForm>
              </details>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
