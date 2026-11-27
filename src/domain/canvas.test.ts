import { describe, expect, it } from "vitest";
import { fits, placeCentered, toLogical } from "./canvas";

const page = { w: 360, h: 480 };

describe("fits", () => {
  it("ページ内なら true", () => expect(fits(0, 0, { w: 60, h: 40 }, page)).toBe(true));
  it("右端ちょうどは true", () => expect(fits(300, 0, { w: 60, h: 40 }, page)).toBe(true));
  it("はみ出しは false", () => expect(fits(301, 0, { w: 60, h: 40 }, page)).toBe(false));
  it("負の座標は false", () => expect(fits(-1, 0, { w: 60, h: 40 }, page)).toBe(false));
});

describe("placeCentered", () => {
  it("中心に置く", () => expect(placeCentered(180, 240, { w: 60, h: 40 }, page)).toEqual({ x: 150, y: 220 }));
  it("端では内側に寄せる", () => expect(placeCentered(355, 5, { w: 60, h: 40 }, page)).toEqual({ x: 300, y: 0 }));
  it("キャンバスより大きいと null", () => expect(placeCentered(0, 0, { w: 400, h: 40 }, page)).toBeNull());
  it("結果は常にページ内", () => {
    for (const [cx, cy] of [[0, 0], [360, 480], [10, 470]]) {
      const p = placeCentered(cx, cy, { w: 140, h: 140 }, page)!;
      expect(fits(p.x, p.y, { w: 140, h: 140 }, page)).toBe(true);
    }
  });
});

describe("toLogical", () => {
  it("表示サイズから論理座標へ", () => expect(toLogical(90, 120, { w: 180, h: 240 }, page)).toEqual({ x: 180, y: 240 }));
});
