"use server";

import { STICKER_BUCKET } from "@/config/app";
import { callRpc } from "@/server/action";
import { createSupabaseAdmin } from "@/server/supabase/admin";

/**
 * 運営画面からのシール画像アップロード（Service Role が必要なのでサーバーで行う）。
 * 種別の作成そのものはブラウザから DB 関数を呼ぶ（権限は DB 関数が確認）。
 */
export async function uploadStickerImage(fd: FormData): Promise<{ path: string | null; error: string | null }> {
  const file = fd.get("image");
  if (!(file instanceof File) || file.size === 0) return { path: null, error: null };

  const { data: wallet } = await callRpc<{ is_admin: boolean } | null>("oshi_my_wallet");
  if (!wallet?.is_admin) return { path: null, error: "権限がありません" };

  if (!file.type.startsWith("image/")) return { path: null, error: "画像ファイルを選んでください" };
  if (file.size > 2 * 1024 * 1024) return { path: null, error: "画像は2MB以下にしてください" };
  const ext = (file.name.split(".").pop() ?? "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `types/${crypto.randomUUID()}.${ext}`;
  const { error } = await createSupabaseAdmin().storage.from(STICKER_BUCKET).upload(path, file, { contentType: file.type });
  return error ? { path: null, error: "画像のアップロードに失敗しました" } : { path, error: null };
}
