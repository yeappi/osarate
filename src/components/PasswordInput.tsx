"use client";

import { useState } from "react";

/** 表示・非表示を切り替えられるパスワード欄 */
export function PasswordInput({ name = "password", placeholder, autoComplete, minLength }: { name?: string; placeholder: string; autoComplete: string; minLength?: number }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center rounded-xl border border-line bg-surface pr-1 focus-within:border-accent">
      <input
        name={name}
        type={show ? "text" : "password"}
        required
        minLength={minLength}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full bg-transparent px-3 py-2 text-sm outline-none"
      />
      <button type="button" onClick={() => setShow(!show)} className="shrink-0 rounded-lg px-2 py-1 text-xs text-sub" aria-label={show ? "パスワードを隠す" : "パスワードを表示"}>
        {show ? "隠す" : "表示"}
      </button>
    </div>
  );
}
