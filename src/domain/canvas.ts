// シール帳・プロフィール背景の座標計算（純粋関数）
// 座標はシールの左上、単位は論理座標（既定 360×480）

export type Size = { w: number; h: number };

export function fits(x: number, y: number, item: Size, canvas: Size): boolean {
  return x >= 0 && y >= 0 && x + item.w <= canvas.w && y + item.h <= canvas.h;
}

/**
 * タップ位置（論理座標）を中心にシールを置いたときの左上座標。
 * キャンバスからはみ出す場合は内側に寄せる。シールがキャンバスより大きい場合は null。
 */
export function placeCentered(cx: number, cy: number, item: Size, canvas: Size): { x: number; y: number } | null {
  if (item.w > canvas.w || item.h > canvas.h) return null;
  const x = clamp(Math.round(cx - item.w / 2), 0, canvas.w - item.w);
  const y = clamp(Math.round(cy - item.h / 2), 0, canvas.h - item.h);
  return { x, y };
}

/** 画面上のピクセル位置 → 論理座標 */
export function toLogical(px: number, py: number, rendered: Size, canvas: Size): { x: number; y: number } {
  return { x: (px / rendered.w) * canvas.w, y: (py / rendered.h) * canvas.h };
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}
