"use client";

/** 短い振動（対応する端末だけ。iPhone の Safari は未対応で何も起きない） */
export function haptic(kind: "tap" | "success" | "big" = "tap") {
  try {
    const p = kind === "big" ? [18, 40, 28] : kind === "success" ? 14 : 8;
    navigator.vibrate?.(p);
  } catch {
    // 未対応
  }
}
