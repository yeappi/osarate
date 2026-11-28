"use client";

import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { BookTile } from "@/components/BookTile";
import { Loading } from "@/components/Loading";
import { StickerView } from "@/components/StickerView";
import { openSticker, sendGift } from "@/client/mutations";
import { useBooks, useMe, useStickers } from "@/client/queries";
import { RecipientFields, useToParam } from "@/features/gift/RecipientFields";
import { groupByType } from "@/domain/group";

// バッグ：未開封シールとシール帳。未開封シールは開封するかギフトに使う
export default function BagPage() {
  const me = useMe();
  const uid = me.data?.userId ?? null;
  const sealed = useStickers(uid, "sealed");
  const books = useBooks(uid);
  const toParam = useToParam();
  const groups = groupByType(sealed.data ?? [], (x) => (x.gifted ? "g" : ""));

  return (
    <div>
      <h1 className="h2">バッグ：未開封シール{sealed.data && `（${sealed.data.length}）`}</h1>
      {!sealed.data ? (
        <Loading error={sealed.error} />
      ) : sealed.data.length === 0 ? (
        <p className="text-sm text-sub">未開封のシールはありません</p>
      ) : (
        <ul className="space-y-2">
          {groups.map(({ first: s, count }) => (
            <li key={s.id} className="card space-y-2">
              <div className="flex items-center gap-3">
                <StickerView name={s.type.name} imagePath={s.type.image_path} w={s.type.width} h={s.type.height} fixed={48} sealed />
                <div className="flex-1 text-sm">
                  {s.type.name} {count > 1 && <span className="num text-xs text-sub">×{count}</span>}
                  <div className="text-xs text-sub">
                    魅力値 {s.type.charm}
                    {s.gifted && "・受け取ったギフト"}
                  </div>
                </div>
                <ActionForm action={openSticker} submitLabel="開封" confirm="開封すると戻せません。ギフトにも使えなくなります。">
                  <input type="hidden" name="stickerId" value={s.id} />
                </ActionForm>
              </div>
              {!s.gifted && (
                <details open={!!toParam}>
                  <summary className="link cursor-pointer text-xs">ギフトする</summary>
                  <ActionForm action={sendGift} submitLabel="ギフト" confirm="このシールを1枚ギフトしますか？">
                    <input type="hidden" name="stickerId" value={s.id} />
                    <RecipientFields withMessage />
                  </ActionForm>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}

      <h2 className="h2">シール帳{books.data && `（${books.data.length}）`}</h2>
      {!books.data ? (
        <Loading error={books.error} />
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {books.data.map((b, i) => (
            <li key={b.id}>
              <BookTile id={b.id} name={b.type.name} sub={`No.${b.serial_no}`} index={i} theme={b.type.theme} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
