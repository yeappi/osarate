"use client";

import { ActionForm } from "@/components/ActionForm";
import { StickerView } from "@/components/StickerView";
import { formatPt } from "@/domain/format";
import { Loading } from "@/components/Loading";
import { buyListing } from "@/client/mutations";
import { useListings } from "@/client/queries";

// SHOP：限定品のみ。基本のシールは図鑑から購入する
export default function ShopPage() {
  const q = useListings("shop");
  if (!q.data) return <Loading error={q.error} />;
  const listings = q.data;
  return (
    <div>
      <h1 className="h2">SHOP（限定品）</h1>
      {listings.length === 0 && <p className="text-sm text-sub">販売中の商品はありません</p>}
      <ul className="space-y-3">
        {listings.map((l) => {
          const st = l.sticker_type;
          const bt = l.book_type;
          const left = l.stock == null ? null : l.stock - l.sold_count;
          return (
            <li key={l.id} className="card space-y-2">
              <div className="flex gap-3">
                {st ? (
                  <StickerView name={st.name} imagePath={st.image_path} w={st.width} h={st.height} fixed={72} />
                ) : (
                  <div className="flex h-[72px] w-[72px] items-center justify-center border bg-accent-soft text-xs">シール帳</div>
                )}
                <div className="text-sm">
                  <div className="font-bold">{st?.name ?? bt?.name}</div>
                  <div>{formatPt(l.price)}</div>
                  <div className="text-xs text-sub">
                    {left != null && `残り ${left}`}
                    {l.ends_at && `　〜${new Date(l.ends_at).toLocaleString("ja-JP")}`}
                    {l.per_user_limit && `　1人${l.per_user_limit}個まで`}
                    {bt && `　${bt.page_count}ページ`}
                  </div>
                </div>
              </div>
              <ActionForm action={buyListing} submitLabel="自分用に買う">
                <input type="hidden" name="listingId" value={l.id} />
                {st && (
                  <label className="text-xs">
                    <input type="checkbox" name="open" /> すぐ開封
                  </label>
                )}
              </ActionForm>
              {st && (
                <ActionForm action={buyListing} submitLabel="ギフトする" confirm={`${formatPt(l.price)}でギフトしますか？`}>
                  <input type="hidden" name="listingId" value={l.id} />
                  <input name="giftTo" required placeholder="贈り先 @ユーザーID" className="input w-40" />
                  <input name="message" maxLength={100} placeholder="メッセージ（任意）" className="input flex-1" />
                </ActionForm>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
