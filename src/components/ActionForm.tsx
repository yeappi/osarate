"use client";

import { useState, useTransition } from "react";
import type { ActionState } from "@/domain/action";
import { haptic } from "@/client/haptic";
import { confirmDialog, toast } from "./Feedback";

type Props = {
  /** ブラウザ側の操作関数（client/mutations）または Server Action を包んだ関数 */
  action: (formData: FormData) => Promise<ActionState>;
  children?: React.ReactNode;
  submitLabel?: string;
  /** 送る前の確認文（アプリ内のダイアログで聞く） */
  confirm?: string;
  confirmLabel?: string;
  danger?: boolean;
  className?: string;
  /** 送信ボタンの格：primary=いちばん押してほしい、accent=買う・贈る、plain=ふつう */
  variant?: "primary" | "accent" | "plain";
  /** 結果をボタンの下にも残す（エラーの理由を読ませたい入力フォーム向け） */
  inline?: boolean;
  onDone?: (state: ActionState) => void;
};

const VARIANT = { primary: "btn-primary", accent: "btn-accent", plain: "btn" } as const;

/**
 * 操作を呼ぶ共通フォーム。
 * - 冪等キー(requestId)を自動付与。成功したら新しいキーに切り替える（失敗時・連打時は同じキー）
 * - 結果はトーストで出す（データの取り直しは操作関数側で行う）
 */
export function ActionForm({ action, children, submitLabel, confirm, confirmLabel, danger, className, variant = "plain", inline, onDone }: Props) {
  const [state, setState] = useState<ActionState>(null);
  const [reqId, setReqId] = useState(() => crypto.randomUUID());
  const [pending, startTransition] = useTransition();
  const [bounce, setBounce] = useState(0);

  return (
    <form
      className={className ?? "flex flex-wrap items-center gap-2"}
      onSubmit={async (e) => {
        e.preventDefault();
        if (pending) return;
        const form = e.currentTarget;
        if (confirm && !(await confirmDialog(confirm, { okLabel: confirmLabel ?? submitLabel, danger }))) return;
        const fd = new FormData(form);
        startTransition(async () => {
          const r = await action(fd);
          setState(r);
          if (r) toast(r.message, r.ok);
          if (r?.ok) {
            setReqId(crypto.randomUUID());
            setBounce((b) => b + 1);
            haptic("success");
          }
          onDone?.(r);
        });
      }}
    >
      <input type="hidden" name="requestId" value={reqId} />
      {children}
      {submitLabel && (
        <button type="submit" key={bounce} disabled={pending} className={`${VARIANT[variant]} ${bounce ? "animate-jelly" : ""}`}>
          {pending ? "…" : submitLabel}
        </button>
      )}
      {state && (inline || !state.ok) && (
        <p className={`w-full text-xs ${state.ok ? "text-mint" : "text-accent-ink"}`}>{state.message}</p>
      )}
    </form>
  );
}
