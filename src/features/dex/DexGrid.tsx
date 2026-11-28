"use client";

import { useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import { StickerView } from "@/components/StickerView";
import { buySticker } from "@/client/mutations";
import { formatPt, rarityLabel } from "@/domain/format";
import type { DexEntry } from "@/domain/types";

type Props =
  | { entries: DexEntry[]; mode: "self" }
  | { entries: DexEntry[]; mode: "gift"; giftToHandle: string }
  | { entries: DexEntry[]; mode: "view" };

const RARITY_TONE: Record<string, string> = {
  common: "bg-muted text-sub",
  rare: "bg-mint-soft text-mint",
  epic: "bg-accent-soft text-accent-ink",
  legend: "bg-gold-soft text-ink",
};

/** 収集率のバー */
export function DexProgress({ owned, total }: { owned: number; total: number }) {
  const pct = total ? Math.round((owned / total) * 100) : 0;
  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
      <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

const CATEGORIES: { key: string; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "theme", label: "テーマ" },
  { key: "base", label: "基礎" },
  { key: "legend", label: "高額" },
  { key: "starter", label: "はじまり" },
  { key: "other", label: "その他" },
];

/** 図鑑の一覧。self=自分用に購入、gift=相手へ購入＋ギフト、view=閲覧のみ */
export function DexGrid(props: Props) {
  const [cat, setCat] = useState("all");
  const [series, setSeries] = useState("");
  if (props.entries.length === 0) return <p className="text-sm text-sub">まだシールがありません</p>;

  const cats = CATEGORIES.filter((c) => c.key === "all" || props.entries.some((e) => e.category === c.key));
  const inCat = cat === "all" ? props.entries : props.entries.filter((e) => e.category === cat);
  const seriesList = [...new Set(inCat.map((e) => e.series).filter(Boolean))];
  const entries = series ? inCat.filter((e) => e.series === series) : inCat;

  return (
    <>
    <div className="mb-2 flex flex-wrap gap-1.5">
      {cats.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => {
            setCat(c.key);
            setSeries("");
          }}
          className={`rounded-full px-3 py-1 text-xs ${cat === c.key ? "bg-ink text-surface" : "bg-muted text-sub"}`}
        >
          {c.label}
        </button>
      ))}
    </div>
    {cat !== "all" && seriesList.length > 1 && (
      <div className="mb-3 flex flex-wrap gap-1.5">
        {["", ...seriesList].map((s) => (
          <button
            key={s || "_all"}
            type="button"
            onClick={() => setSeries(s)}
            className={`rounded-full border px-2.5 py-0.5 text-[11px] ${series === s ? "border-ink text-ink" : "border-line text-sub"}`}
          >
            {s || "すべて"}
          </button>
        ))}
      </div>
    )}
    <ul className="grid grid-cols-2 gap-3">
      {entries.map((e) => (
        <li
          key={e.type_id}
          className={`flex flex-col gap-2 rounded-[22px] bg-surface p-3 ${e.owned ? "border border-line" : "border border-dashed border-line"}`}
        >
          <div className="flex h-24 items-center justify-center rounded-tile bg-muted">
            <StickerView name={e.name} imagePath={e.image_path} w={e.width} h={e.height} fixed={76} gray={!e.owned && !e.dex_purchasable} />
          </div>
          <div className={`text-[13px] font-bold leading-tight ${e.owned ? "" : "text-sub"}`}>{e.name}</div>
          <div className="flex items-center justify-between gap-1">
            <span className="font-num text-xs font-medium text-sub">{e.dex_purchasable ? formatPt(e.price) : "図鑑では買えない"}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] ${RARITY_TONE[e.rarity] ?? RARITY_TONE.common}`}>{rarityLabel(e.rarity)}</span>
          </div>
          {e.dex_purchasable && props.mode === "self" && (
            <ActionForm action={buySticker} className="flex flex-col gap-1.5">
              <input type="hidden" name="typeId" value={e.type_id} />
              <div className="flex items-center gap-1.5">
                <input name="qty" type="number" min={1} max={10} defaultValue={1} aria-label="枚数" className="input w-14 py-1" />
                <label className="flex items-center gap-1 text-[11px] text-sub">
                  <input type="checkbox" name="open" /> すぐ開封
                </label>
              </div>
              <button className="btn-accent w-full">買う</button>
            </ActionForm>
          )}
          {e.dex_purchasable && props.mode === "gift" && (
            <ActionForm action={buySticker} confirm={`${formatPt(e.price)}でギフトしますか？`} className="flex flex-col gap-1.5">
              <input type="hidden" name="typeId" value={e.type_id} />
              <input type="hidden" name="giftTo" value={props.giftToHandle} />
              <input name="message" maxLength={100} placeholder="メッセージ（任意）" className="input w-full py-1 text-xs" />
              <button className="btn-accent w-full">ギフトする</button>
            </ActionForm>
          )}
          {!e.dex_purchasable && (
            <div className="flex min-h-9 items-center justify-center rounded-xl border border-line text-xs text-sub">
              {e.owned ? "収集済み" : "未収集"}
            </div>
          )}
        </li>
      ))}
    </ul>
    </>
  );
}
