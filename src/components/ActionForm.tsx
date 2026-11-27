"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ActionState } from "@/server/action";

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children?: React.ReactNode;
  submitLabel?: string;
  confirm?: string;
  className?: string;
};

/**
 * Server Action を呼ぶ共通フォーム。
 * - 冪等キー(requestId)を自動付与。成功したら新しいキーに切り替える（失敗時は同じキーで再送できる）
 * - 結果メッセージを表示し、成功時は画面を再取得する
 */
export function ActionForm({ action, children, submitLabel, confirm, className }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);
  const [reqId, setReqId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (state?.ok) {
      setReqId(crypto.randomUUID());
      router.refresh();
    }
  }, [state, router]);

  return (
    <form
      action={formAction}
      className={className ?? "flex flex-wrap items-center gap-2"}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      <input type="hidden" name="requestId" value={reqId} />
      {children}
      {submitLabel && (
        <button type="submit" disabled={pending} className="btn">
          {pending ? "…" : submitLabel}
        </button>
      )}
      {state && (
        <p className={`w-full text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}>{state.message}</p>
      )}
    </form>
  );
}
