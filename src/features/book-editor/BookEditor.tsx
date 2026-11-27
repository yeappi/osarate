"use client";

import { useState, useTransition } from "react";
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
      <div className="flex items-center justify-between text-sm">
        <button className="btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button>
        <span>{page} / {pageCount} ページ</span>
        <button className="btn" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>→</button>
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
          <p className="text-xs text-gray-600">
            {picked
              ? pickedIsPlaced
                ? "移動先をタップ、または「剥がす」"
                : "貼りたい場所をタップ"
              : "下の保管からシールを選ぶか、貼ってあるシールをタップ"}
            {pending && "（処理中…）"}
          </p>
          {picked && pickedIsPlaced && (
            <button className="btn" disabled={pending} onClick={() => run(() => removeSticker(picked))}>
              剥がす
            </button>
          )}
          {message && <p className="text-sm">{message}</p>}

          <h2 className="h2">保管（開封済み・未使用）</h2>
          {storage.length === 0 ? (
            <p className="text-sm text-gray-500">貼れるシールがありません</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {storage.map((s) => (
                <li key={s.sticker_id}>
                  <button
                    type="button"
                    className={picked === s.sticker_id ? "outline outline-2 outline-blue-500" : ""}
                    onClick={() => setPicked(picked === s.sticker_id ? null : s.sticker_id)}
                  >
                    <StickerView name={s.name} imagePath={s.image_path} w={s.w} h={s.h} fixed={56} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
