"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import { Loading } from "@/components/Loading";
import { StickerView } from "@/components/StickerView";
import { markGiftsSeen, report } from "@/client/mutations";
import { useMe, useTransfers } from "@/client/queries";

export default function GiftsPage() {
  const me = useMe();
  const uid = me.data?.userId ?? null;
  const rows = useTransfers(uid);
  const [tab, setTab] = useState<"in" | "out">("in");

  // 開いた時点の未読を覚えておき（NEW表示用）、既読にする
  const unseen = useRef<Set<number> | null>(null);
  useEffect(() => {
    if (!rows.data || !uid || unseen.current) return;
    unseen.current = new Set(rows.data.filter((r) => r.to_user === uid && !r.seen_at).map((r) => r.id));
    if (unseen.current.size > 0) void markGiftsSeen();
  }, [rows.data, uid]);

  const list = (rows.data ?? []).filter((r) => (tab === "in" ? r.to_user === uid : r.from_user === uid));

  return (
    <div>
      <h1 className="h2 mt-1">贈りもの</h1>
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-full bg-muted p-1 text-sm">
        {(
          [
            ["in", "もらった"],
            ["out", "贈った"],
          ] as const
        ).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full py-1.5 ${tab === k ? "bg-surface font-bold shadow-sm" : "text-sub"}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === "in" && (
        <p className="mb-3 text-xs text-sub">未開封で贈られたシール（ギフト）は、受け取った人にポイントが還元されます。還元率は贈られるたびに抽選です。</p>
      )}

      {!rows.data ? (
        <Loading error={rows.error} />
      ) : list.length === 0 ? (
        <p className="card text-center text-sm text-sub">{tab === "in" ? "まだもらった贈りものはありません" : "まだ贈ったことはありません"}</p>
      ) : (
        <ul className="space-y-2">
          {list.map((r) => {
            const received = r.to_user === uid;
            const other = received ? r.from : r.to;
            const isNew = received && (unseen.current?.has(r.id) ?? !r.seen_at);
            const t = r.sticker.type;
            return (
              <li key={r.id} className={`card space-y-2 text-sm ${isNew ? "border-accent" : ""}`}>
                <div className="flex gap-3">
                  <StickerView name={t.name} imagePath={t.image_path} w={t.width} h={t.height} fixed={56} />
                  <div className="flex-1">
                    <div className="font-bold">
                      {isNew && <span className="mr-1 rounded-full bg-accent px-1.5 text-[10px] text-surface">NEW</span>}
                      {t.name}
                    </div>
                    <div className="text-xs text-sub">
                      <Link href={`/u/${other.handle}`} className="link">{other.display_name}</Link> {received ? "さんから" : "さんへ"}・
                      {r.kind === "gift" ? "ギフト" : "プレゼント"}・{new Date(r.created_at).toLocaleDateString("ja-JP")}
                    </div>
                    {r.kind === "gift" && received && (
                      <div className="mt-0.5 text-xs">
                        還元 <b className="num text-accent-ink">{r.reward}pt</b>
                      </div>
                    )}
                  </div>
                </div>
                {r.message && <p className="rounded-xl bg-muted px-3 py-2">「{r.message}」</p>}
                {received && (
                  <div className="flex items-center gap-2">
                    <Link href={`/stickers?to=@${other.handle}`} className="btn-accent !min-h-8 text-xs">お礼に手持ちから贈る</Link>
                    <Link href={`/u/${other.handle}/dex/main`} className="btn !min-h-8 text-xs">図鑑から</Link>
                    <details className="ml-auto text-xs">
                      <summary className="cursor-pointer list-none px-2 text-sub" aria-label="その他">…</summary>
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
