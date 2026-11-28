"use client";

import { ActionForm } from "@/components/ActionForm";
import { claimQuest } from "@/client/mutations";
import { useQuests } from "@/client/queries";

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
          {got} / {total}pt
        </span>
      </div>
      <ul className="space-y-1.5">
        {list.map((q) => (
          <li key={q.code} className="flex items-center gap-2 text-sm">
            <span className={`flex-1 ${q.claimed ? "text-sub line-through" : ""}`}>{q.title}</span>
            <span className="num text-xs text-sub">{q.points}pt</span>
            {q.claimed ? (
              <span className="w-20 text-center text-xs text-sub">受け取り済み</span>
            ) : q.done ? (
              <ActionForm action={claimQuest} submitLabel="受け取る" className="flex w-20 justify-center">
                <input type="hidden" name="code" value={q.code} />
              </ActionForm>
            ) : (
              <span className="w-20 text-center text-xs text-sub">未達成</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
