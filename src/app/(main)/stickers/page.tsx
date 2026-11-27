"use client";

import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { BookTile } from "@/components/BookTile";
import { Loading } from "@/components/Loading";
import { StickerView } from "@/components/StickerView";
import { DEXES } from "@/config/app";
import { sendPresent } from "@/client/mutations";
import { useBooks, useMe, useStorage } from "@/client/queries";
import { RecipientFields } from "@/features/gift/RecipientFields";

// シール：保管（開封済み・未使用）とシール帳の一覧
export default function StickersPage() {
  const me = useMe();
  const uid = me.data?.userId ?? null;
  const storage = useStorage(uid);
  const books = useBooks(uid);

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
      {!books.data ? (
        <Loading error={books.error} />
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {books.data.map((b, i) => (
            <li key={b.id}>
              <BookTile id={b.id} name={b.type.name} sub={`No.${b.serial_no}・${b.type.page_count}P`} index={i} />
            </li>
          ))}
        </ul>
      )}

      <h2 className="h2">保管{storage.data && `（${storage.data.length}枚）`}</h2>
      {!storage.data ? (
        <Loading error={storage.error} />
      ) : storage.data.length === 0 ? (
        <p className="text-sm text-sub">開封済みのシールはここに入ります</p>
      ) : (
        <ul className="space-y-2">
          {storage.data.map((s) => (
            <li key={s.id} className="card flex items-center gap-3">
              <StickerView name={s.type.name} imagePath={s.type.image_path} w={s.type.width} h={s.type.height} fixed={48} />
              <div className="flex-1 text-sm">
                {s.type.name} <span className="text-xs text-sub">No.{s.serial_no}</span>
                <details className="mt-1">
                  <summary className="link cursor-pointer text-xs">プレゼントする</summary>
                  <ActionForm action={sendPresent} submitLabel="プレゼント" confirm="このシールをプレゼントしますか？">
                    <input type="hidden" name="stickerId" value={s.id} />
                    <RecipientFields />
                  </ActionForm>
                </details>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
