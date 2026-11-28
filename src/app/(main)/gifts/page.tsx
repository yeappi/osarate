"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import { Loading } from "@/components/Loading";
import { EmptyState } from "@/components/EmptyState";
import { StickerView } from "@/components/StickerView";
import { markGiftsSeen, report } from "@/client/mutations";
import { haptic } from "@/client/haptic";
import { useMe, useTransfers } from "@/client/queries";

export default function GiftsPage() {
  const me = useMe();
  const uid = me.data?.userId ?? null;
  const rows = useTransfers(uid);
  const [tab, setTab] = useState<"in" | "out">("in");
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

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
        <EmptyState image="/stickers/dream_dd_wax.png" title={tab === "in" ? "まだ贈りものは届いていません" : "まだ贈ったことはありません"}>
          {tab === "in" ? "フォローした人から届くと、ここに出ます" : "手持ちやバッグ、相手の図鑑から贈れます"}
        </EmptyState>
      ) : (
        <ul className="space-y-2">
          {list.map((r) => {
            const received = r.to_user === uid;
            const other = received ? r.from : r.to;
            const isNew = received && (unseen.current?.has(r.id) ?? !r.seen_at);
            const t = r.sticker.type;
            // 届いたばかりの贈りものは、リボンの箱をタップして開ける
            if (isNew && !revealed.has(r.id)) {
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setRevealed(new Set([...revealed, r.id]));
                      haptic(["epic", "legend"].includes(t.rarity) ? "big" : "success");
                    }}
                    className="animate-wiggle flex w-full items-center gap-3 rounded-[22px] border-2 border-accent bg-accent-soft p-3 text-left"
                  >
                    <span className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-accent">
                      <span className="absolute inset-y-0 left-1/2 w-2 -translate-x-1/2 bg-gold" />
                      <span className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 bg-gold" />
                    </span>
                    <span className="flex-1 text-sm">
                      <b>{other.display_name}</b> さんから贈りもの
                      <br />
                      <span className="text-xs text-accent-ink">タップして開ける</span>
                    </span>
                  </button>
                </li>
              );
            }
            return (
              <li key={r.id} className={`card space-y-2 text-sm ${isNew ? "animate-pop border-accent" : ""}`}>
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
                    {!received && r.kind === "gift" && (
                      <div className="mt-0.5 text-xs">
                        {r.sticker.state === "opened" && r.sticker.owner_id === r.to_user ? (
                          <span className="text-mint">✓ 開封してもらえました</span>
                        ) : (
                          <span className="text-sub">まだ未開封</span>
                        )}
                      </div>
                    )}
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
