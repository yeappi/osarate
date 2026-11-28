"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { confirmDialog, toast } from "@/components/Feedback";
import { Icon } from "@/components/Icon";
import { StickerView } from "@/components/StickerView";
import { placeCentered } from "@/domain/canvas";
import type { CanvasItem } from "@/domain/types";
import { placeSticker, removeSticker } from "@/client/mutations";
import { CanvasBoard } from "./CanvasBoard";

type StorageSticker = { sticker_id: string; name: string; image_path: string | null; w: number; h: number };

type Props = {
  bookId: string;
  pageCount: number;
  canvas: { w: number; h: number };
  items: (CanvasItem & { page: number })[];
  storage: StorageSticker[];
  editable: boolean;
};

/** 画面の幅に合わせたページの表示幅 */
function useDisplayWidth(max = 400) {
  const [w, setW] = useState(320);
  useEffect(() => {
    const f = () => setW(Math.min(max, Math.max(280, window.innerWidth - 32)));
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, [max]);
  return w;
}

/**
 * シール帳の閲覧・編集。
 * 見るモードが基本。「編集する」で、手持ちから選んでページをタップで貼る／貼ったシールをタップで移動・剥がす。
 * ページは左右スワイプでもめくれる。回転・重ね順・拡縮は今後。
 */
export function BookEditor({ bookId, pageCount, canvas, items, storage, editable }: Props) {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [lastPlaced, setLastPlaced] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const width = useDisplayWidth();
  const touch = useRef<number | null>(null);
  const canEdit = editable && editing;

  const pageItems = items.filter((i) => i.page === page);
  const fits = (s: { w: number; h: number }) => s.w <= canvas.w && s.h <= canvas.h;
  // 同じシールはまとめて「×3」で出す（選ぶと、その中の1枚を貼る）
  const groups = (() => {
    const m = new Map<string, { first: StorageSticker; count: number }>();
    for (const st of storage) {
      const k = `${st.name}|${st.image_path ?? ""}`;
      const g = m.get(k);
      if (g) g.count++;
      else m.set(k, { first: st, count: 1 });
    }
    return [...m.values()];
  })();
  const pickedSize = storage.find((s) => s.sticker_id === picked) ?? items.find((i) => i.sticker_id === picked) ?? null;
  const pickedIsPlaced = !!items.find((i) => i.sticker_id === picked);

  function run(fn: () => Promise<{ ok: boolean; message: string } | null>, after?: () => void) {
    startTransition(async () => {
      const r = await fn();
      if (r && !r.ok) toast(r.message, false);
      if (r?.ok) {
        setPicked(null);
        after?.();
      }
    });
  }

  function onCanvasTap(x: number, y: number) {
    if (!canEdit || !picked || !pickedSize) return;
    const pos = placeCentered(x, y, { w: pickedSize.w, h: pickedSize.h }, canvas);
    if (!pos) {
      toast("このシールはページより大きいため貼れません", false);
      return;
    }
    const id = picked;
    run(() => placeSticker({ stickerId: id, bookId, page, ...pos }), () => setLastPlaced(id));
  }

  const go = (p: number) => {
    if (p < 1 || p > pageCount) return;
    setPage(p);
    setPicked(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button aria-label="前のページ" className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface disabled:text-line" disabled={page <= 1} onClick={() => go(page - 1)}>
            <Icon name="back" size={16} strokeWidth={2} />
          </button>
          <span className="num w-14 text-center text-sm">
            {page} <span className="text-sub">/ {pageCount}</span>
          </span>
          <button aria-label="次のページ" className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface disabled:text-line" disabled={page >= pageCount} onClick={() => go(page + 1)}>
            <Icon name="next" size={16} strokeWidth={2} />
          </button>
        </div>
        {editable && (
          <button
            className={editing ? "btn-primary" : "btn"}
            onClick={() => {
              setEditing(!editing);
              setPicked(null);
              setLastPlaced(null);
            }}
          >
            {editing ? "完了" : "編集する"}
          </button>
        )}
      </div>

      <div
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current === null || picked) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          touch.current = null;
          if (dx > 60) go(page - 1);
          if (dx < -60) go(page + 1);
        }}
      >
        <CanvasBoard
          canvas={canvas}
          items={pageItems}
          displayWidth={width}
          selectedId={picked}
          popId={lastPlaced}
          className="mx-auto"
          onCanvasTap={canEdit ? onCanvasTap : undefined}
          onItemTap={canEdit ? (id) => setPicked(picked === id ? null : id) : undefined}
        />
      </div>

      {canEdit && (
        <>
          <div className="flex min-h-9 items-center justify-center gap-2 text-center text-xs text-sub">
            {picked ? (pickedIsPlaced ? "移動先をタップ" : "貼りたい場所をタップ") : "下の手持ちからシールを選ぶか、貼ってあるシールをタップ"}
            {pending && "（処理中…）"}
            {picked && pickedIsPlaced && (
              <button
                className="btn !min-h-8 !px-3 text-xs"
                disabled={pending}
                onClick={async () => {
                  if (await confirmDialog("このシールを剥がして、手持ちに戻しますか？", { okLabel: "剥がす" })) run(() => removeSticker(picked));
                }}
              >
                剥がす
              </button>
            )}
            {!picked && lastPlaced && items.some((i) => i.sticker_id === lastPlaced) && (
              <button className="btn !min-h-8 !px-3 text-xs" disabled={pending} onClick={() => run(() => removeSticker(lastPlaced), () => setLastPlaced(null))}>
                元に戻す
              </button>
            )}
          </div>

          <div className="sticky bottom-16 z-[5] -mx-4 rounded-t-[26px] bg-surface/95 px-4 pb-3 pt-2 shadow-[0_-8px_24px_rgba(60,40,20,0.08)] backdrop-blur">
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-line" />
            <h2 className="mb-2 font-round text-sm font-bold">
              手持ち <span className="font-sans text-xs font-normal text-sub">選んでページをタップ</span>
            </h2>
            {storage.length === 0 ? (
              <p className="text-sm text-sub">貼れるシールがありません。バッグで開封すると、ここに出ます</p>
            ) : (
              <ul className="flex gap-2 overflow-x-auto pb-1">
                {groups.map(({ first: s, count }) => {
                  const ok = fits(s);
                  return (
                    <li key={s.sticker_id} className="shrink-0">
                      <button
                        type="button"
                        disabled={!ok}
                        title={ok ? s.name : "ページより大きいので貼れません"}
                        className={`relative rounded-tile ${picked === s.sticker_id ? "ring-2 ring-accent" : ""} ${ok ? "" : "opacity-35"}`}
                        onClick={() => setPicked(picked === s.sticker_id ? null : s.sticker_id)}
                      >
                        <StickerView name={s.name} imagePath={s.image_path} w={s.w} h={s.h} fixed={56} />
                        {count > 1 && <span className="num absolute -right-1 -top-1 rounded-full bg-ink px-1.5 text-[10px] text-surface">×{count}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
