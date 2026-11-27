import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { StickerView } from "@/components/StickerView";
import { formatPt } from "@/domain/format";
import { RecipientFields } from "@/features/gift/RecipientFields";
import { listBooks, listStickers } from "@/server/queries/items";
import { requireMe } from "@/server/queries/me";
import { openStickerAction, sendGiftAction } from "@/server/services/items";

// バッグ：未開封シールとシール帳。未開封シールは開封するかギフトに使う
export default async function BagPage() {
  const me = await requireMe();
  if (!me) redirect("/welcome");
  const [sealed, books] = await Promise.all([listStickers(me.user.id, "sealed"), listBooks(me.user.id)]);

  return (
    <div>
      <h1 className="h2">バッグ：未開封シール（{sealed.length}）</h1>
      {sealed.length === 0 && <p className="text-sm text-gray-500">未開封のシールはありません</p>}
      <ul className="space-y-2">
        {sealed.map((s) => {
          const price = s.type.price_override ?? null;
          return (
            <li key={s.id} className="card space-y-2">
              <div className="flex items-center gap-3">
                <StickerView name={s.type.name} imagePath={s.type.image_path} w={s.type.width} h={s.type.height} fixed={48} sealed />
                <div className="flex-1 text-sm">
                  {s.type.name} <span className="text-xs text-gray-500">No.{s.serial_no}</span>
                  <div className="text-xs text-gray-500">
                    魅力値 {s.type.charm}
                    {price != null && `・${formatPt(price)}`}
                    {s.gifted && "・受け取ったギフト"}
                  </div>
                </div>
                <ActionForm action={openStickerAction} submitLabel="開封" confirm="開封すると戻せません。ギフトにも使えなくなります。">
                  <input type="hidden" name="stickerId" value={s.id} />
                </ActionForm>
              </div>
              {!s.gifted && (
                <details>
                  <summary className="cursor-pointer text-xs link">ギフトする</summary>
                  <ActionForm action={sendGiftAction} submitLabel="ギフト" confirm="このシールをギフトしますか？">
                    <input type="hidden" name="stickerId" value={s.id} />
                    <RecipientFields withMessage />
                  </ActionForm>
                </details>
              )}
            </li>
          );
        })}
      </ul>

      <h2 className="h2">シール帳（{books.length}）</h2>
      <ul className="grid grid-cols-3 gap-2">
        {books.map((b) => (
          <li key={b.id}>
            <Link href={`/stickers/books/${b.id}`} className="card block text-center text-sm">
              {b.type.name}
              <div className="text-xs text-gray-500">No.{b.serial_no}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
