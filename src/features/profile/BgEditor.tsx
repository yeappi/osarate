"use client";

import { useState, useTransition } from "react";
import { StickerView } from "@/components/StickerView";
import { placeCentered } from "@/domain/canvas";
import type { CanvasItem } from "@/domain/types";
import { CanvasBoard } from "@/features/book-editor/CanvasBoard";
import { saveProfileBg } from "@/client/mutations";

type Candidate = Omit<CanvasItem, "x" | "y">;

type Props = { canvas: { w: number; h: number }; initial: CanvasItem[]; candidates: Candidate[]; max: number };

/** プロフィール背景の編集。手元で並べてから「保存」で確定（シールは参照のみで、保管・シール帳からは消えない） */
export function BgEditor({ canvas, initial, candidates, max }: Props) {
  const [items, setItems] = useState<CanvasItem[]>(initial);
  const [picked, setPicked] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const pickedItem = items.find((i) => i.sticker_id === picked) ?? candidates.find((c) => c.sticker_id === picked) ?? null;
  const pickedPlaced = items.some((i) => i.sticker_id === picked);
  const unused = candidates.filter((c) => !items.some((i) => i.sticker_id === c.sticker_id));

  function onCanvasTap(x: number, y: number) {
    if (!pickedItem) return;
    if (!pickedPlaced && items.length >= max) {
      setMessage(`背景に置けるのは${max}枚までです`);
      return;
    }
    const pos = placeCentered(x, y, { w: pickedItem.w, h: pickedItem.h }, canvas);
    if (!pos) return;
    const next = { ...pickedItem, ...pos };
    setItems([...items.filter((i) => i.sticker_id !== next.sticker_id), next]);
    setPicked(null);
  }

  return (
    <div className="space-y-2">
      <CanvasBoard
        canvas={canvas}
        items={items}
        selectedId={picked}
        onCanvasTap={onCanvasTap}
        onItemTap={(id) => setPicked(picked === id ? null : id)}
        className="mx-auto"
      />
      <div className="flex gap-2">
        {picked && pickedPlaced && (
          <button
            className="btn"
            onClick={() => {
              setItems(items.filter((i) => i.sticker_id !== picked));
              setPicked(null);
            }}
          >
            外す
          </button>
        )}
        <button
          className="btn-primary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await saveProfileBg(items);
              setMessage(r?.message ?? null);
            })
          }
        >
          背景を保存
        </button>
      </div>
      {message && <p className="text-sm">{message}</p>}
      <p className="text-xs text-sub">シールを選んで背景をタップ。置いたシールをタップで選択→移動先をタップ or 外す</p>
      <ul className="flex flex-wrap gap-2">
        {unused.map((c) => (
          <li key={c.sticker_id}>
            <button
              type="button"
              className={picked === c.sticker_id ? "outline outline-2 outline-accent" : ""}
              onClick={() => setPicked(picked === c.sticker_id ? null : c.sticker_id)}
            >
              <StickerView name={c.name} imagePath={c.image_path} w={c.w} h={c.h} fixed={48} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
