"use client";

import Link from "next/link";
import { Loading } from "@/components/Loading";
import { useMe, useTransfers } from "@/client/queries";

export default function GiftsPage() {
  const me = useMe();
  const uid = me.data?.userId ?? null;
  const rows = useTransfers(uid);

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
            return (
              <li key={r.id} className="card text-sm">
                <div>
                  {received ? "受け取り" : "送信"}・{r.kind === "gift" ? "ギフト" : "プレゼント"}：{r.sticker.type.name}
                </div>
                <div className="text-xs text-sub">
                  {received ? "from" : "to"} <Link href={`/u/${other.handle}`} className="link">{other.display_name}</Link>
                  {r.kind === "gift" && received && `・還元 ${r.reward}pt（${r.rate_pct}%）`}・{new Date(r.created_at).toLocaleString("ja-JP")}
                </div>
                {r.message && <p className="mt-1">「{r.message}」</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
