import { describe, expect, it } from "vitest";
import { extractErrorCode, toUserMessage } from "./errors";

describe("extractErrorCode", () => {
  it("コードそのものを返す", () => {
    expect(extractErrorCode("insufficient_points")).toBe("insufficient_points");
  });
  it("前後に文言があっても拾う", () => {
    expect(extractErrorCode('ERROR: not_owner (SQLSTATE P0001)')).toBe("not_owner");
  });
  it("部分一致では拾わない", () => {
    expect(extractErrorCode("not_ownerX")).toBeNull();
  });
  it("未知は null", () => {
    expect(extractErrorCode("something else")).toBeNull();
    expect(extractErrorCode(undefined)).toBeNull();
  });
});

describe("toUserMessage", () => {
  it("日本語に変換する", () => {
    expect(toUserMessage("insufficient_points")).toBe("ポイントが足りません");
  });
  it("未知は汎用文言", () => {
    expect(toUserMessage("boom")).toBe("エラーが発生しました");
  });
});
