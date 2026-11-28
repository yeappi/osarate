"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ActionForm } from "@/components/ActionForm";
import { Loading } from "@/components/Loading";
import { markGiftsSeen, report } from "@/client/mutations";
import { useMe, useTransfers } from "@/client/queries";

export default function GiftsPage() {
  const me = useMe();
  const uid = me.data?.userId ?? null;
  const rows = useTransfers(uid);

  // 開いた時点の未読を覚えておき（NEW表示用）、既読にする
  const unseen = useRef<Set<number> | null>(null);
  useEffect(() => {
    if (!rows.data || !uid || unseen.current) return;
    unseen.current = new Set(rows.data.filter((r) => r.to_user === uid && !r.seen_at).map((r) => r.id));
    if (unseen.current.size > 0) void markGiftsSeen();
  }, [rows.data, uid]);

  return (
    <div>
      <h1 className="h2">ギフト・プレゼント履歴</h1>
      {!rows.data ? (
        <Loading error={rows.error} />
      ) : rows.data.length === 0 ? (
        <p className="text-sm text-sub">まだありません</p>
      ) : (
        <ul className="space-y-2">
          {rows.data.map((r) => {
            const received = r.to_user === uid;
            const other = received ? r.from : r.to;
            const isNew = received && (unseen.current?.has(r.id) ?? !r.seen_at);
            return (
              <li key={r.id} className="card space-y-1 text-sm">
                <div>
                  {isNew && <span className="mr-1 rounded-full bg-accent px-1.5 text-[10px] font-bold text-surface">NEW</span>}
                  {received ? "受け取り" : "送信"}・{r.kind === "gift" ? "ギフト" : "プレゼント"}：{r.sticker.type.name}
                </div>
                <div className="text-xs text-sub">
                  {received ? "from" : "to"} <Link href={`/u/${other.handle}`} className="link">{other.display_name}</Link>
                  {r.kind === "gift" && received && `・還元 ${r.reward}pt（${r.rate_pct}%）`}・{new Date(r.created_at).toLocaleString("ja-JP")}
                </div>
                {r.message && <p>「{r.message}」</p>}
                {received && (
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                    <span className="text-sub">お礼を返す：</span>
                    <Link href={`/stickers?to=@${other.handle}`} className="link">手持ちから贈る</Link>
                    <Link href={`/u/${other.handle}/dex/main`} className="link">図鑑から贈る</Link>
                    <details className="ml-auto">
                      <summary className="cursor-pointer text-sub">通報</summary>
                      <ActionForm action={report} submitLabel="通報する" className="mt-1 flex flex-col gap-1">
                        <input type="hidden" name="target" value={r.from_user} />
                        <input type="hidden" name="transferId" value={r.id} />
                        <input name="reason" maxLength={300} placeholder="理由（任意）" className="input w-full" />
                      </ActionForm>
                    </details>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
