"use client";

import { ActionForm } from "@/components/ActionForm";
import { Loading } from "@/components/Loading";
import {
  adminCreateBookType,
  adminCreateListing,
  adminCreateStickerType,
  adminGrant,
  adminSetListingActive,
  adminSetStickerTypeActive,
} from "@/client/mutations";
import { useAllTypes, useListings, useMe } from "@/client/queries";
import { formatNum } from "@/domain/format";
import { uploadStickerImage } from "@/server/services/admin";

const createStickerType = adminCreateStickerType(uploadStickerImage);

// 運営画面（最小限）。権限は DB 関数側でも確認している
export default function AdminPage() {
  const me = useMe();
  const types = useAllTypes();
  const shopQ = useListings("shop");
  const prizeQ = useListings("prize");
  if (me.data?.wallet && !me.data.wallet.is_admin) return <p className="text-sm">権限がありません</p>;
  if (!types.data || !shopQ.data || !prizeQ.data) return <Loading error={types.error ?? shopQ.error ?? prizeQ.error} />;
  const { stickerTypes, bookTypes } = types.data;
  const shop = shopQ.data;
  const prize = prizeQ.data;
  const col = "flex flex-col gap-1 text-sm";

  return (
    <div className="space-y-6">
      <h1 className="h2">運営</h1>

      <section>
        <h2 className="h2">シール種別を作成</h2>
        <ActionForm action={createStickerType} submitLabel="作成" className={col}>
          <select name="dex" className="input">
            <option value="main">メイン図鑑</option>
            <option value="elite">精鋭図鑑</option>
          </select>
          <input name="name" required placeholder="名前" className="input" />
          <input name="image" type="file" accept="image/*" />
          <div className="flex gap-1">
            <input name="width" type="number" required min={1} max={360} placeholder="幅" className="input w-20" />
            <input name="height" type="number" required min={1} max={480} placeholder="高さ" className="input w-20" />
            <input name="charm" type="number" required min={0} placeholder="魅力値" className="input w-24" />
          </div>
          <input name="priceOverride" type="number" min={0} placeholder="価格の個別指定（空欄なら魅力値×10）" className="input" />
          <div className="flex gap-1">
            <select name="kind" className="input"><option value="basic">基本</option><option value="special">特別</option></select>
            <select name="rarity" className="input">
              <option value="common">コモン</option><option value="rare">レア</option><option value="epic">エピック</option><option value="legend">レジェンド</option>
            </select>
            <select name="visibility" className="input"><option value="always">常に図鑑に表示</option><option value="owned">所持するまで非表示</option></select>
          </div>
          <label><input type="checkbox" name="purchasable" defaultChecked /> 図鑑から購入可</label>
          <input name="maxSupply" type="number" min={1} placeholder="発行上限（任意）" className="input" />
        </ActionForm>
        <ul className="mt-2 space-y-1 text-xs">
          {stickerTypes.map((t) => (
            <li key={t.id} className="flex items-center gap-2">
              <span className="flex-1">
                #{t.id} [{t.dex_id}] {t.name} 魅力値{t.charm} 発行{t.issued_count}
                {t.is_active ? "" : "（停止中）"}
              </span>
              <ActionForm action={adminSetStickerTypeActive} submitLabel={t.is_active ? "停止" : "再開"}>
                <input type="hidden" name="typeId" value={t.id} />
                <input type="hidden" name="active" value={t.is_active ? "false" : "true"} />
              </ActionForm>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="h2">シール帳種別を作成</h2>
        <ActionForm action={adminCreateBookType} submitLabel="作成" className={col}>
          <input name="name" required placeholder="名前" className="input" />
          <div className="flex gap-1">
            <input name="pageCount" type="number" required min={1} max={50} placeholder="ページ数" className="input w-24" />
            <input name="charm" type="number" min={0} placeholder="魅力値" className="input w-24" />
            <input name="theme" placeholder="テーマ" className="input w-24" />
          </div>
        </ActionForm>
        <ul className="mt-2 text-xs">
          {bookTypes.map((b) => (
            <li key={b.id}>#{b.id} {b.name}（{b.page_count}P・魅力値{b.charm}）</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="h2">出品（SHOP / 景品）</h2>
        <ActionForm action={adminCreateListing} submitLabel="出品" className={col}>
          <div className="flex gap-1">
            <select name="venue" className="input"><option value="shop">SHOP（pt）</option><option value="prize">景品（玉）</option></select>
            <select name="kind" className="input"><option value="sticker">シール</option><option value="book">シール帳</option></select>
            <input name="typeId" type="number" required placeholder="種別ID" className="input w-24" />
          </div>
          <div className="flex gap-1">
            <input name="price" type="number" required min={0} placeholder="価格" className="input w-24" />
            <input name="stock" type="number" min={0} placeholder="在庫（任意）" className="input w-24" />
            <input name="perUserLimit" type="number" min={1} placeholder="1人上限" className="input w-24" />
          </div>
          <label>開始 <input name="startsAt" type="datetime-local" className="input" /></label>
          <label>終了 <input name="endsAt" type="datetime-local" className="input" /></label>
        </ActionForm>
        <ul className="mt-2 space-y-1 text-xs">
          {[...shop, ...prize].map((l) => (
            <li key={l.id} className="flex items-center gap-2">
              <span className="flex-1">
                #{l.id} [{l.venue}] {l.sticker_type?.name ?? l.book_type?.name} {formatNum(l.price)} 販売{l.sold_count}
                {l.stock != null && `/${l.stock}`}
              </span>
              <ActionForm action={adminSetListingActive} submitLabel="停止">
                <input type="hidden" name="listingId" value={l.id} />
                <input type="hidden" name="active" value="false" />
              </ActionForm>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="h2">付与</h2>
        <ActionForm action={adminGrant} submitLabel="付与" className={col}>
          <input name="to" required placeholder="@ユーザーID" className="input" />
          <div className="flex gap-1">
            <select name="kind" className="input">
              <option value="sticker">シール</option><option value="book">シール帳</option><option value="points">ポイント</option>
            </select>
            <input name="typeId" type="number" placeholder="種別ID" className="input w-24" />
            <input name="qty" type="number" min={1} max={100} defaultValue={1} className="input w-16" />
            <input name="points" type="number" min={1} placeholder="pt" className="input w-24" />
          </div>
          <select name="state" className="input"><option value="sealed">未開封で付与</option><option value="opened">開封済みで付与</option></select>
        </ActionForm>
      </section>
    </div>
  );
}
