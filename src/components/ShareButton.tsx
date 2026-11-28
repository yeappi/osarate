"use client";

import { useState } from "react";

/** 共有ボタン。スマホは共有シート、それ以外はURLをコピー */
export function ShareButton({ path, title, className }: { path: string; title: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className ?? "btn"}
      onClick={async () => {
        const url = `${window.location.origin}${path}`;
        try {
          if (navigator.share) {
            await navigator.share({ title, url });
            return;
          }
          await navigator.clipboard.writeText(url);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          // 共有シートを閉じた場合など
        }
      }}
    >
      {done ? "リンクをコピーしました" : "シェア"}
    </button>
  );
}
