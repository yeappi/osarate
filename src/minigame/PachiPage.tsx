"use client";

import { ActionForm } from "@/components/ActionForm";
import { Loading } from "@/components/Loading";
import { StickerView } from "@/components/StickerView";
import { useListings, useMe } from "@/client/queries";
import { formatNum, formatPt } from "@/domain/format";
import { cashout, exchange, lend, spin } from "./mutations";
import { useMachineBoard, useSpinConfig } from "./queries";

/** 遊び場の画面本体（minigame 層に閉じ込める） */
export function PachiPage() {
  const me = useMe();
  const board = useMachineBoard();
  const cfg = useSpinConfig();
  const prizes = useListings("prize");
  const balls = me.data?.wallet?.balls ?? 0;

  return (
    <div className="space-y-4">
      <h1 className="h2">遊び場：パチ屋</h1>
      <p className="text-sm">
        持ち玉 <b>{formatNum(balls)}</b>　/　{formatPt(me.data?.wallet?.points)}
      </p>

      <section className="card space-y-2">
        <ActionForm action={lend} submitLabel="玉を借りる">
          <input name="points" type="number" min={1} defaultValue={1000} className="input w-24" />
          <span className="text-xs">pt → {cfg.rateIn}玉/pt</span>
        </ActionForm>
        <ActionForm action={cashout} submitLabel="精算する">
          <input key={balls} name="balls" type="number" min={1} defaultValue={balls || 1} className="input w-24" />
          <span className="text-xs">玉 → {cfg.rateOut}pt/玉</span>
        </ActionForm>
      </section>

      <section>
        <h2 className="h2">台（本日の実績）　1回転 {cfg.cost}玉</h2>
        {!board.data ? (
          <Loading error={board.error} />
        ) : (
          <ul className="space-y-2">
            {board.data.map((m) => (
              <li key={m.id} className="card space-y-1">
                <div className="text-sm font-bold">{m.name}</div>
                <div className="text-xs text-gray-600">
                  回転 {formatNum(m.spins)}・当たり {formatNum(m.hits)}（{m.spins ? ((m.hits / m.spins) * 100).toFixed(1) : "-"}%）・大当たり {m.big_hits}・最大{" "}
                  {formatNum(m.max_payout)}玉
                </div>
                <div className="flex flex-wrap gap-2">
                  {[1, cfg.max].map((n) => (
                    <ActionForm key={n} action={spin} submitLabel={`${n}回転`}>
                      <input type="hidden" name="machine" value={m.id} />
                      <input type="hidden" name="spins" value={n} />
                    </ActionForm>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="h2">景品交換所</h2>
        {!prizes.data ? (
          <Loading error={prizes.error} />
        ) : prizes.data.length === 0 ? (
          <p className="text-sm text-gray-500">景品はありません</p>
        ) : (
          <ul className="space-y-2">
            {prizes.data.map((p) => (
              <li key={p.id} className="card flex items-center gap-3">
                {p.sticker_type ? (
                  <StickerView name={p.sticker_type.name} imagePath={p.sticker_type.image_path} w={p.sticker_type.width} h={p.sticker_type.height} fixed={56} />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center border bg-pink-50 text-[10px]">シール帳</div>
                )}
                <div className="flex-1 text-sm">
                  <div className="font-bold">{p.sticker_type?.name ?? p.book_type?.name}</div>
                  <div>{formatNum(p.price)}玉</div>
                </div>
                <ActionForm action={exchange} submitLabel="交換">
                  <input type="hidden" name="listingId" value={p.id} />
                </ActionForm>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
