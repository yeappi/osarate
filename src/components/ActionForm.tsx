"use client";

import { useState, useTransition } from "react";
import type { ActionState } from "@/domain/action";

type Props = {
  /** ブラウザ側の操作関数（client/mutations）または Server Action を包んだ関数 */
  action: (formData: FormData) => Promise<ActionState>;
  children?: React.ReactNode;
  submitLabel?: string;
  confirm?: string;
  className?: string;
  onDone?: (state: ActionState) => void;
};

/**
 * 操作を呼ぶ共通フォーム。
 * - 冪等キー(requestId)を自動付与。成功したら新しいキーに切り替える（失敗時・連打時は同じキー）
 * - 結果メッセージを表示する（データの取り直しは操作関数側で行う）
 */
export function ActionForm({ action, children, submitLabel, confirm, className, onDone }: Props) {
  const [state, setState] = useState<ActionState>(null);
  const [reqId, setReqId] = useState(() => crypto.randomUUID());
  const [pending, startTransition] = useTransition();

  return (
    <form
      className={className ?? "flex flex-wrap items-center gap-2"}
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        if (confirm && !window.confirm(confirm)) return;
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const r = await action(fd);
          setState(r);
          if (r?.ok) setReqId(crypto.randomUUID());
          onDone?.(r);
        });
      }}
    >
      <input type="hidden" name="requestId" value={reqId} />
      {children}
      {submitLabel && (
        <button type="submit" disabled={pending} className="btn">
          {pending ? "…" : submitLabel}
        </button>
      )}
      {state && <p className={`w-full text-sm ${state.ok ? "text-mint" : "text-accent-ink"}`}>{state.message}</p>}
    </form>
  );
}
