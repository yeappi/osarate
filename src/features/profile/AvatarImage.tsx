"use client";

import { useState } from "react";

/** アイコン画像。読み込めないときは名前の1文字目を出す */
export function AvatarImage({ url, letter }: { url: string | null; letter: string }) {
  const [broken, setBroken] = useState(false);
  if (!url || broken) return <>{letter}</>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />;
}
