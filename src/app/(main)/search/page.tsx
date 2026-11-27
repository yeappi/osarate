"use client";

import Link from "next/link";
import { useState } from "react";
import { Loading } from "@/components/Loading";
import { RANKING_METRICS, RANKING_PERIODS } from "@/config/app";
import { useFollowing, useMe, useRanking, useSearch } from "@/client/queries";
import { formatNum } from "@/domain/format";
import type { PublicProfile } from "@/domain/types";

function UserRow({ p, right }: { p: Pick<PublicProfile, "handle" | "display_name">; right?: React.ReactNode }) {
  return (
    <li>
      <Link href={`/u/${p.handle}`} className="card flex items-center justify-between text-sm">
        <span>
          {p.display_name} <span className="text-xs text-gray-500">@{p.handle}</span>
        </span>
        {right}
      </Link>
    </li>
  );
}

// タブ・絞り込みは画面内の状態で切り替える（URL を変えないのでサーバー待ちが起きない）
export default function SearchPage() {
  const me = useMe();
  const [tab, setTab] = useState<"ranking" | "following" | "search">("ranking");
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [metric, setMetric] = useState<string>("charm");
  const [period, setPeriod] = useState<string>("day");
  const userId = me.data?.userId ?? null;

  return (
    <div>
      <form
        className="mb-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(input.trim());
          setTab("search");
        }}
      >
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="ユーザーを検索" className="input flex-1" />
        <button className="btn">検索</button>
      </form>
      <nav className="mb-3 flex gap-3 text-sm">
        {(
          [
            ["ranking", "ランキング"],
            ["following", "フォロー中"],
          ] as const
        ).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={tab === k ? "font-bold" : "link"}>
            {label}
          </button>
        ))}
      </nav>

      {tab === "search" && <SearchResults q={q} />}
      {tab === "following" && <Following userId={userId} />}
      {tab === "ranking" && (
        <div>
          <div className="mb-2 flex flex-wrap gap-3 text-sm">
            {RANKING_METRICS.map((m) => (
              <button key={m.key} onClick={() => setMetric(m.key)} className={m.key === metric ? "font-bold" : "link"}>
                {m.label}
              </button>
            ))}
            <span>｜</span>
            {RANKING_PERIODS.map((p) => (
              <button key={p.key} onClick={() => setPeriod(p.key)} className={p.key === period ? "font-bold" : "link"}>
                {p.label}
              </button>
            ))}
          </div>
          <Ranking metric={metric} period={period} me={userId} />
        </div>
      )}
    </div>
  );
}

function SearchResults({ q }: { q: string }) {
  const users = useSearch(q);
  if (!q) return <p className="text-sm text-gray-500">ユーザーIDか表示名で検索</p>;
  if (!users.data) return <Loading error={users.error} />;
  if (users.data.length === 0) return <p className="text-sm text-gray-500">見つかりませんでした</p>;
  return <ul className="space-y-2">{users.data.map((u) => <UserRow key={u.user_id} p={u} />)}</ul>;
}

function Following({ userId }: { userId: string | null }) {
  const users = useFollowing(userId);
  if (!users.data) return <Loading error={users.error} />;
  if (users.data.length === 0) return <p className="text-sm text-gray-500">まだフォローしていません</p>;
  return <ul className="space-y-2">{users.data.map((u) => <UserRow key={u.user_id} p={u} />)}</ul>;
}

function Ranking({ metric, period, me }: { metric: string; period: string; me: string | null }) {
  const rows = useRanking(metric, period, me);
  if (!rows.data) return <Loading error={rows.error} />;
  const mine = rows.data.find((r) => r.user_id === me);
  return (
    <div>
      <p className="mb-2 text-sm">あなた：{mine ? `${mine.rnk}位（${formatNum(mine.value)}）` : "圏外"}</p>
      {rows.data.length === 0 ? (
        <p className="text-sm text-gray-500">まだランキングがありません</p>
      ) : (
        <ol className="space-y-2">
          {rows.data.map((r) => (
            <UserRow key={r.user_id} p={r} right={<span className="font-bold">{r.rnk}位　{formatNum(r.value)}</span>} />
          ))}
        </ol>
      )}
    </div>
  );
}
