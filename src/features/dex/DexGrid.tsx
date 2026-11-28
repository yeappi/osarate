"use client";

import { useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import { Sheet } from "@/components/Sheet";
import { StickerView } from "@/components/StickerView";
import { buySticker } from "@/client/mutations";
import { useMe } from "@/client/queries";
import { formatNum, formatPt, rarityLabel } from "@/domain/format";
import type { DexEntry } from "@/domain/types";

type Props =
  | { entries: DexEntry[]; mode: "self" }
  | { entries: DexEntry[]; mode: "gift"; giftToHandle: string; giftToName?: string }
  | { entries: DexEntry[]; mode: "view" };

const RARITY_TONE: Record<string, string> = {
  common: "bg-muted text-sub",
  rare: "bg-mint-soft text-mint",
  epic: "bg-accent-soft text-accent-ink",
  legend: "bg-gold-soft text-ink",
};
const RARITY_NOTE: Record<string, string> = {
  common: "いつでも手に入る、普段づかいのシール",
  rare: "少し特別なシール",
  epic: "各テーマの目玉",
  legend: "宝物クラス。持っているだけで魅力値が大きく上がる",
};

/** 収集率のバー */
export function DexProgress({ owned, total }: { owned: number; total: number }) {
  const pct = total ? Math.round((owned / total) * 100) : 0;
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="num text-xs text-sub">{pct}%</span>
    </div>
  );
}

const CATEGORIES: { key: string; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "theme", label: "テーマ" },
  { key: "base", label: "基礎" },
  { key: "legend", label: "宝物" },
  { key: "starter", label: "はじまり" },
  { key: "other", label: "その他" },
];
const SORTS = [
  { key: "default", label: "おすすめ順" },
  { key: "cheap", label: "安い順" },
  { key: "expensive", label: "高い順" },
  { key: "missing", label: "未収集から" },
] as const;

/** 図鑑の一覧。self=自分用に購入、gift=相手へ購入＋ギフト、view=閲覧のみ。タップで詳細シート */
export function DexGrid(props: Props) {
  const me = useMe();
  const points = me.data?.wallet?.points ?? null;
  const [cat, setCat] = useState("all");
  const [series, setSeries] = useState("");
  const [sort, setSort] = useState<(typeof SORTS)[number]["key"]>("default");
  const [openId, setOpenId] = useState<number | null>(null);
  if (props.entries.length === 0) return <p className="text-sm text-sub">まだシールがありません</p>;

  const cats = CATEGORIES.filter((c) => c.key === "all" || props.entries.some((e) => e.category === c.key));
  const inCat = cat === "all" ? props.entries : props.entries.filter((e) => e.category === cat);
  const seriesList = [...new Set(inCat.map((e) => e.series).filter(Boolean))];
  let entries = series ? inCat.filter((e) => e.series === series) : inCat;
  if (sort !== "default") {
    entries = [...entries].sort((a, b) =>
      sort === "cheap" ? a.price - b.price : sort === "expensive" ? b.price - a.price : Number(a.owned) - Number(b.owned),
    );
  }
  const selected = props.entries.find((e) => e.type_id === openId) ?? null;

  return (
    <>
      {props.mode === "gift" && (
        <p className="mb-3 rounded-2xl bg-accent-soft px-3 py-2 text-xs text-accent-ink">
          🎁 {props.giftToName ?? `@${props.giftToHandle}`} さんに贈るシールを選んでいます。持っていないシールが贈りもの向きです
        </p>
      )}
      <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
        {cats.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => {
              setCat(c.key);
              setSeries("");
            }}
            className={`shrink-0 rounded-full px-3 py-1 text-xs ${cat === c.key ? "bg-ink text-surface" : "bg-muted text-sub"}`}
          >
            {c.label}
          </button>
        ))}
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="ml-auto shrink-0 rounded-full border border-line bg-surface px-2 py-1 text-xs text-sub">
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      {cat !== "all" && seriesList.length > 1 && (
        <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
          {["", ...seriesList].map((s) => {
            const inS = inCat.filter((e) => e.series === s);
            const own = inS.filter((e) => e.owned).length;
            const left = inS.length - own;
            return (
              <button
                key={s || "_all"}
                type="button"
                onClick={() => setSeries(s)}
                className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] ${series === s ? "border-ink text-ink" : "border-line text-sub"} ${s && left === 0 ? "bg-gold-soft" : ""}`}
              >
                {s || "すべて"}
                {s && (
                  <span className="ml-1 font-num">
                    {left === 0 ? "★コンプ" : left === 1 ? "あと1枚！" : `${own}/${inS.length}`}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <ul className="grid grid-cols-3 gap-2">
        {entries.map((e) => (
          <li key={e.type_id}>
            <button
              type="button"
              onClick={() => setOpenId(e.type_id)}
              className={`flex w-full flex-col items-center gap-1 rounded-[18px] bg-surface p-2 text-left transition active:scale-[0.97] ${
                e.owned ? "border border-line" : "border border-dashed border-line"
              }`}
            >
              <div className="relative flex h-20 w-full items-center justify-center rounded-xl bg-muted">
                <StickerView name={e.name} imagePath={e.image_path} w={e.width} h={e.height} fixed={68} gray={!e.owned && !e.dex_purchasable} />
                {e.owned && <span className="absolute right-1 top-1 rounded-full bg-mint px-1.5 text-[9px] font-bold text-surface">所持</span>}
              </div>
              <span className={`w-full truncate text-[11px] font-bold ${e.owned ? "" : "text-sub"}`}>{e.name}</span>
              <span className="w-full font-num text-[11px] text-sub">{e.dex_purchasable ? formatPt(e.price) : "非売品"}</span>
            </button>
          </li>
        ))}
      </ul>

      <Sheet open={!!selected} onClose={() => setOpenId(null)}>
        {selected && <Detail e={selected} props={props} points={points} onDone={() => setOpenId(null)} />}
      </Sheet>
    </>
  );
}

function Detail({ e, props, points, onDone }: { e: DexEntry; props: Props; points: number | null; onDone: () => void }) {
  const [qty, setQty] = useState(1);
  const total = e.price * qty;
  const short = points !== null && total > points ? total - points : 0;
  const big = Math.min(220, Math.max(e.width, e.height) * 1.3) / Math.max(e.width, e.height);

  return (
    <div className="space-y-4">
      <div className="paper flex min-h-56 items-center justify-center rounded-[22px] p-4">
        <div className="animate-pop">
          <StickerView name={e.name} imagePath={e.image_path} w={e.width} h={e.height} scale={big} gray={!e.owned && !e.dex_purchasable} />
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-round text-lg font-bold">{e.name}</h3>
          <span className={`rounded-full px-2 py-0.5 text-[10px] ${RARITY_TONE[e.rarity] ?? RARITY_TONE.common}`}>{rarityLabel(e.rarity)}</span>
          {e.owned && <span className="text-xs text-mint">所持</span>}
        </div>
        <p className="mt-1 text-xs text-sub">
          {e.series && `${e.series}・`}
          {RARITY_NOTE[e.rarity] ?? ""}・魅力値 +{formatNum(e.charm)}
        </p>
      </div>

      {!e.dex_purchasable ? (
        <p className="rounded-2xl bg-muted px-3 py-2 text-xs text-sub">
          {e.category === "starter"
            ? "はじまりのアイテム。図鑑やSHOPでは買えず、持っている人からのプレゼントでしか手に入りません"
            : "いまは図鑑では買えません"}
        </p>
      ) : props.mode === "view" ? (
        <p className="text-sm">
          <span className="num text-lg">{formatPt(e.price)}</span>
        </p>
      ) : (
        <ActionForm
          action={buySticker}
          submitLabel={props.mode === "gift" ? `${formatPt(total)}で贈る` : `${formatPt(total)}で買う`}
          variant="primary"
          confirm={props.mode === "gift" ? `${e.name} を ${formatPt(total)} で贈りますか？` : undefined}
          className="flex flex-col gap-3"
          onDone={(r) => r?.ok && onDone()}
        >
          <input type="hidden" name="typeId" value={e.type_id} />
          {props.mode === "self" ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm">枚数</span>
                <div className="flex items-center gap-3">
                  <button type="button" className="btn h-9 w-9 !px-0" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="減らす">
                    −
                  </button>
                  <span className="num w-6 text-center text-lg">{qty}</span>
                  <button type="button" className="btn h-9 w-9 !px-0" onClick={() => setQty(Math.min(10, qty + 1))} aria-label="増やす">
                    ＋
                  </button>
                </div>
              </div>
              <input type="hidden" name="qty" value={qty} />
              <p className="text-xs text-sub">買ったシールは未開封でバッグに入ります。開封するまでは、だれかに贈ることもできます。</p>
            </>
          ) : (
            <>
              <input type="hidden" name="giftTo" value={props.giftToHandle} />
              <input name="message" maxLength={100} placeholder="ひとことメッセージ（任意）" className="input w-full" />
            </>
          )}
          {short > 0 && (
            <p className="text-xs text-accent-ink">
              あと {formatPt(short)} 足りません。はじめてのクエスト・ログインボーナス・遊び場で貯められます
            </p>
          )}
        </ActionForm>
      )}
    </div>
  );
}
