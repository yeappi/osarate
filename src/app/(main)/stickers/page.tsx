"use client";

import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { BookTile } from "@/components/BookTile";
import { Loading } from "@/components/Loading";
import { EmptyState } from "@/components/EmptyState";
import { StickerView } from "@/components/StickerView";
import { sendPresent } from "@/client/mutations";
import { useBooks, useMe, useStickers, useStorage } from "@/client/queries";
import { groupByType } from "@/domain/group";
import { RecipientFields, useToParam } from "@/features/gift/RecipientFields";

// シール帳タブ：自分のシール帳と、貼れる手持ちシール（開封済み・未使用）
export default function StickersPage() {
  const me = useMe();
  const uid = me.data?.userId ?? null;
  const storage = useStorage(uid);
  const books = useBooks(uid);
  const sealed = useStickers(uid, "sealed");
  const toParam = useToParam();
  const groups = groupByType(storage.data ?? []);

  return (
    <div>
      <h1 className="h2 mt-1">シール帳</h1>
      {!books.data ? (
        <Loading error={books.error} rows={1} />
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {books.data.map((b, i) => (
            <li key={b.id}>
              <BookTile id={b.id} name={b.type.name} sub={`${b.type.page_count}ページ`} index={i} theme={b.type.theme} />
            </li>
          ))}
        </ul>
      )}

      {!!sealed.data?.length && (
        <Link href="/bag" className="mt-4 flex items-center justify-between rounded-2xl bg-gold-soft px-4 py-3 text-sm">
          <span>
            未開封のシールが <b className="num">{sealed.data.length}</b> 枚あります
          </span>
          <span className="font-bold">開ける →</span>
        </Link>
      )}

      <div className="mt-5 flex items-baseline justify-between">
        <h2 className="font-round text-base font-bold">手持ちのシール{storage.data && <span className="ml-1 text-xs font-normal text-sub">{storage.data.length}枚</span>}</h2>
        <Link href="/gifts" className="link text-xs">贈りもの履歴</Link>
      </div>
      <p className="mb-2 text-xs text-sub">開封済みで、まだ貼っていないシールです。シール帳を開いて貼れます。</p>
      {!storage.data ? (
        <Loading error={storage.error} />
      ) : storage.data.length === 0 ? (
        <EmptyState image="/stickers/mat_puffy_dot.png" title="手持ちのシールはまだありません">
          <Link href="/dex/main" className="link">図鑑</Link>でシールを買って、バッグで開封するとここに入ります
        </EmptyState>
      ) : (
        <>
          {toParam && <p className="mb-2 rounded-xl bg-accent-soft px-3 py-2 text-xs text-accent-ink">{toParam} さんへのお礼：贈りたいシールの「プレゼントする」を押してください</p>}
          <ul className="grid grid-cols-2 gap-2">
            {groups.map(({ first: s, count }) => (
              <li key={s.id} className="card flex flex-col items-center gap-1 p-2">
                <div className="relative">
                  <StickerView name={s.type.name} imagePath={s.type.image_path} w={s.type.width} h={s.type.height} fixed={72} />
                  {count > 1 && <span className="num absolute -right-1 -top-1 rounded-full bg-ink px-1.5 text-[10px] text-surface">×{count}</span>}
                </div>
                <span className="w-full truncate text-center text-xs font-bold">{s.type.name}</span>
                <details className="w-full text-center" open={!!toParam}>
                  <summary className="cursor-pointer text-[11px] text-sub">プレゼントする</summary>
                  <ActionForm
                    action={sendPresent}
                    submitLabel="1枚プレゼント"
                    variant="accent"
                    confirm={`${s.type.name} を1枚プレゼントしますか？`}
                    className="mt-1 flex flex-col gap-1"
                  >
                    <input type="hidden" name="stickerId" value={s.id} />
                    <RecipientFields />
                  </ActionForm>
                </details>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
