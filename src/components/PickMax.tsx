"use client";

import { useState } from "react";

/**
 * 最大 max 個まで選べるタイル選択（選んだ順に番号が付く）。フォームの中で使い、name の hidden 入力を出す
 */
export function PickMax<T extends { id: string }>({
  items,
  initial,
  max,
  name,
  render,
}: {
  items: T[];
  initial: string[];
  max: number;
  name: string;
  render: (item: T) => React.ReactNode;
}) {
  const [sel, setSel] = useState<string[]>(initial.filter((id) => items.some((i) => i.id === id)).slice(0, max));
  return (
    <>
      <p className="text-xs text-sub">
        {sel.length} / {max} 選択中{sel.length >= max && "（外すと、ほかを選べます）"}
      </p>
      <ul className="flex flex-wrap gap-2">
        {items.map((it) => {
          const idx = sel.indexOf(it.id);
          const on = idx >= 0;
          const full = !on && sel.length >= max;
          return (
            <li key={it.id}>
              <button
                type="button"
                disabled={full}
                onClick={() => setSel(on ? sel.filter((x) => x !== it.id) : [...sel, it.id])}
                className={`relative rounded-tile transition ${on ? "ring-2 ring-accent" : ""} ${full ? "opacity-40" : ""}`}
              >
                {render(it)}
                {on && <span className="num absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] text-surface">{idx + 1}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {sel.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
    </>
  );
}
