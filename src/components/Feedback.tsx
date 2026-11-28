"use client";

import { useEffect, useState } from "react";

// 画面全体で共通の「トースト（操作の結果）」と「確認ダイアログ」。ルートのレイアウトに1つだけ置く

type Toast = { id: number; message: string; ok: boolean };
let toasts: Toast[] = [];
let seq = 0;
const toastListeners = new Set<() => void>();

/** 画面下に数秒だけ結果を出す */
export function toast(message: string, ok = true) {
  if (!message) return;
  const t = { id: ++seq, message, ok };
  toasts = [...toasts, t].slice(-3);
  toastListeners.forEach((l) => l());
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    toastListeners.forEach((l) => l());
  }, ok ? 2600 : 4200);
}

type Confirm = { message: string; okLabel: string; danger: boolean; resolve: (v: boolean) => void };
let current: Confirm | null = null;
const confirmListeners = new Set<() => void>();

/** ブラウザ標準の confirm の代わり。アプリの見た目で確認する */
export function confirmDialog(message: string, opts?: { okLabel?: string; danger?: boolean }): Promise<boolean> {
  return new Promise((resolve) => {
    current?.resolve(false);
    current = { message, okLabel: opts?.okLabel ?? "OK", danger: !!opts?.danger, resolve };
    confirmListeners.forEach((l) => l());
  });
}

function closeConfirm(v: boolean) {
  const c = current;
  current = null;
  confirmListeners.forEach((l) => l());
  c?.resolve(v);
}

export function FeedbackHost() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    toastListeners.add(l);
    confirmListeners.add(l);
    return () => {
      toastListeners.delete(l);
      confirmListeners.delete(l);
    };
  }, []);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-toast max-w-sm rounded-2xl px-4 py-2.5 text-center text-sm font-medium shadow-lg ${
              t.ok ? "bg-ink text-surface" : "bg-accent text-surface"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
      {current && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center" onClick={() => closeConfirm(false)}>
          <div className="animate-sheet w-full max-w-sm rounded-[26px] bg-surface p-5 shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{current.message}</p>
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn flex-1" onClick={() => closeConfirm(false)}>
                やめる
              </button>
              <button
                type="button"
                autoFocus
                className={`flex-1 ${current.danger ? "btn-primary !bg-accent" : "btn-primary"}`}
                onClick={() => closeConfirm(true)}
              >
                {current.okLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
