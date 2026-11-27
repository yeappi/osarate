"use client";

import { useState, useTransition } from "react";
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

/**
 * シール帳の閲覧・編集。
 * 操作：保管からシールを選ぶ → ページをタップで貼る。貼ったシールをタップ → 移動先をタップ or 剥がす。
 * 回転・重ね順・拡縮は MVP 外。
 */
export function BookEditor({ bookId, pageCount, canvas, items, storage, editable }: Props) {
  const [page, setPage] = useState(1);
  const [picked, setPicked] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const pageItems = items.filter((i) => i.page === page);
  const pickedSize =
    storage.find((s) => s.sticker_id === picked) ?? items.find((i) => i.sticker_id === picked) ?? null;
  const pickedIsPlaced = !!items.find((i) => i.sticker_id === picked);

  function run(fn: () => Promise<{ ok: boolean; message: string } | null>) {
    startTransition(async () => {
      const r = await fn();
      setMessage(r?.message ?? null);
      if (r?.ok) setPicked(null);
    });
  }

  function onCanvasTap(x: number, y: number) {
    if (!editable || !picked || !pickedSize) return;
    const pos = placeCentered(x, y, { w: pickedSize.w, h: pickedSize.h }, canvas);
    if (!pos) {
      setMessage("このシールはページより大きいため貼れません");
      return;
    }
    run(() => placeSticker({ stickerId: picked, bookId, page, ...pos }));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-4">
        <button aria-label="前のページ" className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface disabled:text-line" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          <Icon name="back" size={16} strokeWidth={2} />
        </button>
        <div className="flex items-center gap-1.5" aria-label={`${page} / ${pageCount} ページ`}>
          {Array.from({ length: pageCount }, (_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i + 1 === page ? "w-5 bg-accent" : "w-1.5 bg-line"}`} />
          ))}
        </div>
        <button aria-label="次のページ" className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface disabled:text-line" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>
          <Icon name="next" size={16} strokeWidth={2} />
        </button>
      </div>

      <CanvasBoard
        canvas={canvas}
        items={pageItems}
        selectedId={picked}
        className="mx-auto"
        onCanvasTap={editable ? onCanvasTap : undefined}
        onItemTap={editable ? (id) => setPicked(picked === id ? null : id) : undefined}
      />

      {editable && (
        <>
          <p className="text-center text-xs text-sub">
            {picked
              ? pickedIsPlaced
                ? "移動先をタップ、または「剥がす」"
                : "貼りたい場所をタップ"
              : "下の保管からシールを選ぶか、貼ってあるシールをタップ"}
            {pending && "（処理中…）"}
          </p>
          {picked && pickedIsPlaced && (
            <button className="btn-primary mx-auto flex" disabled={pending} onClick={() => run(() => removeSticker(picked))}>
              剥がす
            </button>
          )}
          {message && <p className="text-center text-sm">{message}</p>}

          <div className="rounded-t-[26px] bg-surface px-4 pb-4 pt-3 shadow-[0_-8px_24px_rgba(60,40,20,0.06)]">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-line" />
          <h2 className="mb-2 font-round text-sm font-bold">保管 <span className="font-sans text-xs font-normal text-sub">選んでページをタップ</span></h2>
          {storage.length === 0 ? (
            <p className="text-sm text-sub">貼れるシールがありません</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {storage.map((s) => (
                <li key={s.sticker_id}>
                  <button
                    type="button"
                    className={`rounded-tile ${picked === s.sticker_id ? "ring-2 ring-accent" : ""}`}
                    onClick={() => setPicked(picked === s.sticker_id ? null : s.sticker_id)}
                  >
                    <StickerView name={s.name} imagePath={s.image_path} w={s.w} h={s.h} fixed={56} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          </div>
        </>
      )}
    </div>
  );
}
