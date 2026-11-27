"use client";

import { useRef } from "react";
import { StickerView } from "@/components/StickerView";
import { toLogical, type Size } from "@/domain/canvas";
import type { CanvasItem } from "@/domain/types";

type Props = {
  canvas: Size;
  items: CanvasItem[];
  displayWidth?: number;
  selectedId?: string | null;
  /** 何もない所をタップ（論理座標） */
  onCanvasTap?: (x: number, y: number) => void;
  onItemTap?: (stickerId: string) => void;
  className?: string;
};

/** シール帳のページ・プロフィール背景で共通のキャンバス表示。後に貼ったものが上 */
export function CanvasBoard({ canvas, items, displayWidth = 320, selectedId, onCanvasTap, onItemTap, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const scale = displayWidth / canvas.w;
  const rendered = { w: displayWidth, h: canvas.h * scale };

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden border bg-white ${className ?? ""}`}
      style={{ width: rendered.w, height: rendered.h }}
      onClick={(e) => {
        if (!onCanvasTap || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const p = toLogical(e.clientX - r.left, e.clientY - r.top, rendered, canvas);
        onCanvasTap(p.x, p.y);
      }}
    >
      {items.map((it) => (
        <button
          type="button"
          key={it.sticker_id}
          className={`absolute ${selectedId === it.sticker_id ? "outline outline-2 outline-blue-500" : ""}`}
          style={{ left: it.x * scale, top: it.y * scale }}
          onClick={(e) => {
            if (!onItemTap) return;
            e.stopPropagation();
            onItemTap(it.sticker_id);
          }}
        >
          <StickerView name={it.name} imagePath={it.image_path} w={it.w} h={it.h} scale={scale} />
        </button>
      ))}
    </div>
  );
}
