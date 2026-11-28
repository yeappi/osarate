"use client";

import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { Icon } from "@/components/Icon";
import { Loading } from "@/components/Loading";
import { EmptyState } from "@/components/EmptyState";
import { StickerView } from "@/components/StickerView";
import { buyListing } from "@/client/mutations";
import { useListings } from "@/client/queries";
import { formatPt } from "@/domain/format";
import { RecipientFields } from "@/features/gift/RecipientFields";

// SHOP：期間・数量限定の品と、遊び場への入口。普段のシールは図鑑から買う
export default function ShopPage() {
  const q = useListings("shop");

  return (
    <div className="space-y-4">
      <h1 className="h2 mt-1">SHOP</h1>

      <div className="grid grid-cols-2 gap-2">
        <Link href="/dex/main" className="card flex flex-col gap-1">
          <Icon name="dex" />
          <b className="text-sm">図鑑で買う</b>
          <span className="text-[11px] text-sub">いつでも買える、すべてのシール</span>
        </Link>
        <Link href="/play" className="card flex flex-col gap-1">
          <Icon name="play" />
          <b className="text-sm">遊び場</b>
          <span className="text-[11px] text-sub">パチ屋で玉を増やして景品と交換</span>
        </Link>
      </div>

      <h2 className="font-round text-base font-bold">限定品</h2>
      {!q.data ? (
        <Loading error={q.error} />
      ) : q.data.length === 0 ? (
        <EmptyState image="/stickers/pop_pop_price.png" title="いま販売中の限定品はありません">次の入荷をお楽しみに</EmptyState>
      ) : (
        <ul className="space-y-3">
          {q.data.map((l) => {
            const st = l.sticker_type;
            const bt = l.book_type;
            const left = l.stock == null ? null : l.stock - l.sold_count;
            return (
              <li key={l.id} className="card space-y-3">
                <div className="flex gap-3">
                  {st ? (
                    <StickerView name={st.name} imagePath={st.image_path} w={st.width} h={st.height} fixed={72} />
                  ) : (
                    <div className="flex h-[72px] w-[60px] flex-col justify-end rounded-[8px_14px_14px_8px] bg-accent-soft p-1.5 text-[10px] font-bold">{bt?.name}</div>
                  )}
                  <div className="flex-1 text-sm">
                    <div className="font-bold">{st?.name ?? bt?.name}</div>
                    <div className="num">{formatPt(l.price)}</div>
                    <div className="text-xs text-sub">
                      {[left != null && `残り ${left}`, l.ends_at && `〜${new Date(l.ends_at).toLocaleDateString("ja-JP")}`, l.per_user_limit && `1人${l.per_user_limit}個まで`, bt && `${bt.page_count}ページ`]
                        .filter(Boolean)
                        .join("・")}
                    </div>
                  </div>
                </div>
                <ActionForm action={buyListing} submitLabel="買う" variant="primary" className="flex">
                  <input type="hidden" name="listingId" value={l.id} />
                </ActionForm>
                {st && (
                  <details>
                    <summary className="cursor-pointer text-xs text-sub">だれかに贈る</summary>
                    <ActionForm action={buyListing} submitLabel="贈る" variant="accent" confirm={`${formatPt(l.price)}で贈りますか？`} className="mt-1 flex flex-col gap-1">
                      <input type="hidden" name="listingId" value={l.id} />
                      <RecipientFields withMessage />
                    </ActionForm>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
