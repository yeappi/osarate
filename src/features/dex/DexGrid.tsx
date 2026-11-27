"use client";

import { ActionForm } from "@/components/ActionForm";
import { StickerView } from "@/components/StickerView";
import { formatPt, rarityLabel } from "@/domain/format";
import type { DexEntry } from "@/domain/types";
import { buySticker } from "@/client/mutations";

type Props =
  | { entries: DexEntry[]; mode: "self" }
  | { entries: DexEntry[]; mode: "gift"; giftToHandle: string }
  | { entries: DexEntry[]; mode: "view" };

/** 図鑑の一覧。self=自分用に購入、gift=相手へ購入＋ギフト、view=閲覧のみ */
export function DexGrid(props: Props) {
  const { entries } = props;
  if (entries.length === 0) return <p className="text-sm text-gray-500">まだシールがありません</p>;
  return (
    <ul className="space-y-2">
      {entries.map((e) => (
        <li key={e.type_id} className="card flex gap-3">
          <StickerView name={e.name} imagePath={e.image_path} w={e.width} h={e.height} fixed={64} gray={!e.owned} />
          <div className="flex-1 space-y-1 text-sm">
            <div className="font-bold">
              {e.name} <span className="text-xs font-normal">{rarityLabel(e.rarity)}</span>
            </div>
            <div className="text-xs text-gray-600">
              魅力値 {e.charm}・{formatPt(e.price)}・{e.owned ? "収集済み" : "未収集"}
            </div>
            {e.dex_purchasable && props.mode === "self" && (
              <ActionForm action={buySticker} submitLabel="買う">
                <input type="hidden" name="typeId" value={e.type_id} />
                <input name="qty" type="number" min={1} max={10} defaultValue={1} className="input w-14" />
                <label className="text-xs">
                  <input type="checkbox" name="open" /> すぐ開封
                </label>
              </ActionForm>
            )}
            {e.dex_purchasable && props.mode === "gift" && (
              <ActionForm action={buySticker} submitLabel="ギフトする" confirm={`${formatPt(e.price)}でギフトしますか？`}>
                <input type="hidden" name="typeId" value={e.type_id} />
                <input type="hidden" name="giftTo" value={props.giftToHandle} />
                <input name="message" maxLength={100} placeholder="メッセージ（任意）" className="input w-full" />
              </ActionForm>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
