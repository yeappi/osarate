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
  /** 貼った直後のシール（ぺたっと出す） */
  popId?: string | null;
  /** 何もない所をタップ（論理座標） */
  onCanvasTap?: (x: number, y: number) => void;
  onItemTap?: (stickerId: string) => void;
  className?: string;
};

/** シール帳のページ・プロフィール背景で共通のキャンバス表示。後に貼ったものが上 */
export function CanvasBoard({ canvas, items, displayWidth = 320, selectedId, popId, onCanvasTap, onItemTap, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const scale = displayWidth / canvas.w;
  const rendered = { w: displayWidth, h: canvas.h * scale };

  return (
    <div
      ref={ref}
      className={`paper relative overflow-hidden rounded-[10px_22px_22px_10px] shadow-[0_1px_0_var(--t-line),0_14px_34px_rgba(60,40,20,0.12),inset_8px_0_0_var(--t-muted)] ${className ?? ""}`}
      style={{ width: rendered.w, height: rendered.h }}
      onClick={(e) => {
        if (!onCanvasTap || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const p = toLogical(e.clientX - r.left, e.clientY - r.top, rendered, canvas);
        onCanvasTap(p.x, p.y);
      }}
    >
      {items.map((it) => {
        // 小さいシールでも指で触れるように、見えない触れる範囲を最低44pxまで広げる
        const pad = Math.max(0, (44 - Math.min(it.w, it.h) * scale) / 2);
        return (
        <button
          type="button"
          key={it.sticker_id}
          className={`absolute rounded-xl ${selectedId === it.sticker_id ? "outline-2 outline-offset-4 outline-dashed outline-accent" : ""} ${popId === it.sticker_id ? "animate-pop" : ""}`}
          style={{ left: it.x * scale, top: it.y * scale }}
          onClick={(e) => {
            if (!onItemTap) return;
            e.stopPropagation();
            onItemTap(it.sticker_id);
          }}
        >
          {pad > 0 && <span aria-hidden className="absolute" style={{ inset: -pad }} />}
          <StickerView name={it.name} imagePath={it.image_path} w={it.w} h={it.h} scale={scale} />
        </button>
        );
      })}
    </div>
  );
}
