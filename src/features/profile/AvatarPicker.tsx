"use client";

import { useState } from "react";
import { sb } from "@/client/supabase";

const SIZE = 256;

/** 画像を中央で正方形に切り抜き、256px の WebP にする */
async function toSquareWebp(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const s = Math.min(bmp.width, bmp.height);
  const c = document.createElement("canvas");
  c.width = SIZE;
  c.height = SIZE;
  c.getContext("2d")!.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, SIZE, SIZE);
  return await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("変換に失敗しました"))), "image/webp", 0.85));
}

/**
 * アイコン画像の選択（プロフィール編集フォームの中で使う）。
 * 選ぶとすぐ自分の置き場にアップロードし、URL を avatar_url に入れる。保存はフォームの「保存」で行う
 */
export function AvatarPicker({ userId, initial, initialLetter }: { userId: string; initial: string | null; initialLetter: string }) {
  const [url, setUrl] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft font-round text-2xl font-bold text-accent-ink">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          initialLetter
        )}
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <label className="btn cursor-pointer">
          {busy ? "アップロード中…" : "画像を選ぶ"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              setBusy(true);
              setErr(null);
              try {
                const blob = await toSquareWebp(f);
                const path = `${userId}/avatar.webp`;
                const up = await sb().storage.from("oshi-avatars").upload(path, blob, { contentType: "image/webp", upsert: true });
                if (up.error) throw new Error(up.error.message);
                const pub = sb().storage.from("oshi-avatars").getPublicUrl(path).data.publicUrl;
                setUrl(`${pub}?v=${Date.now()}`);
              } catch (x) {
                setErr(x instanceof Error ? `アップロードできませんでした（${x.message}）` : "アップロードできませんでした");
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
        {url && (
          <button type="button" className="link text-left text-xs" onClick={() => setUrl("")}>
            アイコンを外す
          </button>
        )}
        <span className="text-xs text-sub">選んだあと「保存」を押してください</span>
        {err && <span className="text-xs text-accent-ink">{err}</span>}
      </div>
      <input type="hidden" name="avatar_url" value={url} />
    </div>
  );
}
