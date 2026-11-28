"use client";

import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { toast } from "@/components/Feedback";
import { claimQuest } from "@/client/mutations";
import { useQuests } from "@/client/queries";

/** クエストごとに、達成できる画面への道しるべ */
const WHERE: Record<string, { href: string; hint: string }> = {
  starter: { href: "/starter", hint: "はじまりのアイテムを選ぶ" },
  login_bonus: { href: "/me", hint: "画面上の「受け取る」" },
  bio: { href: "/me/edit", hint: "マイページの「編集する」" },
  open: { href: "/bag", hint: "バッグで「開封する」" },
  place: { href: "/stickers", hint: "シール帳を開いて「編集する」" },
  top3: { href: "/me/edit", hint: "「編集する」のTOP3" },
  buy: { href: "/dex/main", hint: "図鑑でシールを選ぶ" },
  follow: { href: "/search", hint: "探すからだれかのページへ" },
  give: { href: "/stickers", hint: "手持ちやバッグから贈る" },
};

/** はじめてのクエスト。全部受け取ったら表示しない */
export function QuestPanel() {
  const quests = useQuests(true);
  const list = quests.data;
  if (!list) return null;
  const remaining = list.filter((q) => !q.claimed);
  if (remaining.length === 0) return null;
  const total = list.reduce((a, q) => a + q.points, 0);
  const got = list.filter((q) => q.claimed).reduce((a, q) => a + q.points, 0);

  return (
    <section className="card mb-4 space-y-2">
      <div className="flex items-baseline justify-between">
        <h2 className="font-round text-base font-bold">はじめてのクエスト</h2>
        <span className="num text-xs text-sub">
          {got.toLocaleString()} / {total.toLocaleString()}pt
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${(got / total) * 100}%` }} />
      </div>
      <ul className="divide-y divide-line">
        {list.map((q) => {
          const w = WHERE[q.code];
          return (
            <li key={q.code} className="flex items-center gap-2 py-2 text-sm">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${q.claimed ? "bg-mint text-surface" : q.done ? "bg-gold" : "border border-line"}`}>
                {q.claimed ? "✓" : ""}
              </span>
              <span className="min-w-0 flex-1">
                <span className={q.claimed ? "text-sub line-through" : "font-medium"}>{q.title}</span>
                {!q.claimed && !q.done && w && (
                  <Link href={w.href} className="block text-[11px] text-accent-ink">
                    {w.hint} →
                  </Link>
                )}
              </span>
              {q.claimed ? (
                <span className="num text-xs text-sub">{q.points}pt</span>
              ) : q.done ? (
                <ActionForm
                  action={claimQuest}
                  submitLabel={`${q.points}pt 受け取る`}
                  variant="primary"
                  className="flex shrink-0"
                  onDone={(r) => {
                    if (r?.ok && remaining.length === 1) toast(`クエストコンプリート！ ${total.toLocaleString()}ptで好きなシールを集めよう`);
                  }}
                >
                  <input type="hidden" name="code" value={q.code} />
                </ActionForm>
              ) : (
                <span className="num shrink-0 text-xs text-sub">{q.points}pt</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
