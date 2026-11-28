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
  const points = me.data?.wallet?.points ?? 0;

  return (
    <div className="space-y-4">
      <h1 className="h2 mt-1">遊び場：パチ屋</h1>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-2xl bg-muted py-2">
          <div className="text-[11px] text-sub">持ち玉</div>
          <div className="num text-xl">{formatNum(balls)}</div>
        </div>
        <div className="rounded-2xl bg-muted py-2">
          <div className="text-[11px] text-sub">ポイント</div>
          <div className="num text-xl">{formatPt(points)}</div>
        </div>
      </div>
      <p className="text-xs text-sub">
        ポイントで玉を借りて台を回し、増えた玉は精算してポイントに戻すか、景品と交換できます。1pt = {cfg.rateIn}玉、精算は1玉 = {cfg.rateOut}pt です。
      </p>

      <section className="card space-y-3">
        <ActionForm action={lend} submitLabel="玉を借りる" variant="primary">
          <input key={`l${points}`} name="points" type="number" min={1} max={Math.max(1, points)} defaultValue={Math.max(1, Math.min(1000, points))} inputMode="numeric" className="input w-28" />
          <span className="text-xs text-sub">pt 分</span>
        </ActionForm>
        <ActionForm action={cashout} submitLabel="精算する">
          <input key={balls} name="balls" type="number" min={1} defaultValue={balls || 1} inputMode="numeric" className="input w-28" />
          <span className="text-xs text-sub">玉を精算</span>
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
                <div className="text-xs text-sub">
                  回転 {formatNum(m.spins)}・当たり {formatNum(m.hits)}（{m.spins ? ((m.hits / m.spins) * 100).toFixed(1) : "-"}%）・大当たり {m.big_hits}・最大{" "}
                  {formatNum(m.max_payout)}玉
                </div>
                <div className="flex flex-wrap gap-2">
                  {[1, cfg.max].map((n) => (
                    <ActionForm key={n} action={spin} submitLabel={`${n}回転`} variant={n === 1 ? "plain" : "primary"} inline>
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
          <p className="card text-center text-sm text-sub">いま交換できる景品はありません。入荷をお楽しみに</p>
        ) : (
          <ul className="space-y-2">
            {prizes.data.map((p) => (
              <li key={p.id} className="card flex items-center gap-3">
                {p.sticker_type ? (
                  <StickerView name={p.sticker_type.name} imagePath={p.sticker_type.image_path} w={p.sticker_type.width} h={p.sticker_type.height} fixed={56} />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center border bg-accent-soft text-[10px]">シール帳</div>
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
