"use client";

import { useRef, useState } from "react";
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
  /** ドラッグで動かして離した（左上の論理座標）。指定したときだけドラッグできる */
  onItemDrop?: (stickerId: string, x: number, y: number) => void;
  /** ページをめくった向き（めくる動き用） */
  flip?: "next" | "prev" | null;
  className?: string;
};

/** シールごとに少しだけ傾ける（貼った感じを出す。IDから決まるので毎回同じ角度） */
function tilt(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 70) - 35) / 10; // -3.5〜+3.5度
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/** シール帳のページ・プロフィール背景で共通のキャンバス表示。後に貼ったものが上 */
export function CanvasBoard({ canvas, items, displayWidth = 320, selectedId, popId, onCanvasTap, onItemTap, onItemDrop, flip, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const scale = displayWidth / canvas.w;
  const rendered = { w: displayWidth, h: canvas.h * scale };
  const drag = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);
  const [dragPos, setDragPos] = useState<{ id: string; x: number; y: number } | null>(null);

  return (
    <div
      ref={ref}
      className={`paper relative overflow-hidden rounded-[10px_22px_22px_10px] shadow-[0_1px_0_var(--t-line),0_14px_34px_rgba(60,40,20,0.12),inset_8px_0_0_var(--t-muted)] ${
        flip === "next" ? "animate-flip-next" : flip === "prev" ? "animate-flip-prev" : ""
      } ${className ?? ""}`}
      style={{ width: rendered.w, height: rendered.h, touchAction: onItemDrop ? "none" : "pan-y" }}
      onClick={(e) => {
        if (!onCanvasTap || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const p = toLogical(e.clientX - r.left, e.clientY - r.top, rendered, canvas);
        onCanvasTap(p.x, p.y);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const dx = (e.clientX - d.sx) / scale;
        const dy = (e.clientY - d.sy) / scale;
        if (!d.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
        d.moved = true;
        const it = items.find((i) => i.sticker_id === d.id);
        if (!it) return;
        setDragPos({ id: d.id, x: clamp(d.ox + dx, 0, canvas.w - it.w), y: clamp(d.oy + dy, 0, canvas.h - it.h) });
      }}
      onPointerLeave={() => {
        drag.current = null;
        setDragPos(null);
      }}
      onPointerUp={() => {
        const d = drag.current;
        drag.current = null;
        if (!d) return;
        if (d.moved && dragPos && onItemDrop) onItemDrop(d.id, Math.round(dragPos.x), Math.round(dragPos.y));
        else onItemTap?.(d.id);
        setTimeout(() => setDragPos(null), 400);
      }}
    >
      {items.map((it) => {
        // 小さいシールでも指で触れるように、見えない触れる範囲を最低44pxまで広げる
        const pad = Math.max(0, (44 - Math.min(it.w, it.h) * scale) / 2);
        const pos = dragPos?.id === it.sticker_id ? dragPos : it;
        const dragging = dragPos?.id === it.sticker_id && !!drag.current;
        return (
          <button
            type="button"
            key={it.sticker_id}
            className={`absolute rounded-xl ${selectedId === it.sticker_id ? "outline-2 outline-offset-4 outline-dashed outline-accent" : ""} ${popId === it.sticker_id ? "animate-pop" : ""} ${dragging ? "z-10 scale-110 drop-shadow-xl" : ""}`}
            style={{ left: pos.x * scale, top: pos.y * scale, transform: dragging ? undefined : `rotate(${tilt(it.sticker_id)}deg)`, transition: dragging ? "none" : "transform .15s" }}
            onPointerDown={(e) => {
              if (!onItemDrop) return;
              e.stopPropagation();
              drag.current = { id: it.sticker_id, sx: e.clientX, sy: e.clientY, ox: it.x, oy: it.y, moved: false };
            }}
            onClick={(e) => {
              e.stopPropagation();
              // ドラッグできる画面では、タップの判定は onPointerUp で行う
              if (!onItemDrop) onItemTap?.(it.sticker_id);
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
