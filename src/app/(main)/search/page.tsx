"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AvatarImage } from "@/features/profile/AvatarImage";
import { Loading } from "@/components/Loading";
import { RANKING_METRICS, RANKING_PERIODS } from "@/config/app";
import { useFollowing, useMe, useRanking, useSearch } from "@/client/queries";
import { formatNum } from "@/domain/format";
import type { PublicProfile } from "@/domain/types";

function UserRow({ p, right, highlight }: { p: Pick<PublicProfile, "handle" | "display_name" | "avatar_url">; right?: React.ReactNode; highlight?: boolean }) {
  return (
    <li>
      <Link href={`/u/${p.handle}`} className={`card flex items-center gap-3 text-sm ${highlight ? "border-accent bg-accent-soft" : ""}`}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft font-round font-bold text-accent-ink">
          <AvatarImage url={p.avatar_url} letter={p.display_name.slice(0, 1)} />
        </span>
        <span className="min-w-0 flex-1 truncate">
          {p.display_name} <span className="text-xs text-sub">@{p.handle}</span>
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
  const [period, setPeriod] = useState<string>("week");
  const userId = me.data?.userId ?? null;

  // 入力中に検索する（少し待ってから）
  useEffect(() => {
    const v = input.trim();
    const t = setTimeout(() => {
      setQ(v);
      if (v) setTab("search");
    }, 350);
    return () => clearTimeout(t);
  }, [input]);

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
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="ユーザーIDか名前で検索" type="search" className="input flex-1" />
        <button className="btn">検索</button>
      </form>
      <nav className="mb-3 flex gap-2">
        {(
          [
            ["ranking", "ランキング"],
            ["following", "フォロー中"],
          ] as const
        ).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={tab === k ? "btn-primary min-h-9" : "btn"}>
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
              <button key={m.key} onClick={() => setMetric(m.key)} className={`rounded-full px-3 py-1 text-xs ${m.key === metric ? "bg-ink font-bold text-surface" : "bg-surface text-sub"}`}>
                {m.label}
              </button>
            ))}
            <span className="w-full" />
            {RANKING_PERIODS.map((p) => (
              <button key={p.key} onClick={() => setPeriod(p.key)} className={`rounded-full px-3 py-1 text-xs ${p.key === period ? "bg-accent-soft font-bold text-accent-ink" : "text-sub"}`}>
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
  if (!q) return <p className="text-sm text-sub">ユーザーIDか表示名で検索</p>;
  if (!users.data) return <Loading error={users.error} />;
  if (users.data.length === 0) return <p className="text-sm text-sub">見つかりませんでした</p>;
  return <ul className="space-y-2">{users.data.map((u) => <UserRow key={u.user_id} p={u} />)}</ul>;
}

function Following({ userId }: { userId: string | null }) {
  const users = useFollowing(userId);
  if (!users.data) return <Loading error={users.error} />;
  if (users.data.length === 0) return <p className="text-sm text-sub">まだフォローしていません</p>;
  return <ul className="space-y-2">{users.data.map((u) => <UserRow key={u.user_id} p={u} />)}</ul>;
}

function Ranking({ metric, period, me }: { metric: string; period: string; me: string | null }) {
  const rows = useRanking(metric, period, me);
  if (!rows.data) return <Loading error={rows.error} />;
  const data = rows.data;
  const mine = data.find((r) => r.user_id === me);
  return (
    <div>
      <p className="mb-2 rounded-2xl bg-muted px-3 py-2 text-sm">
        あなた：{mine ? <b className="num">{mine.rnk}位（{formatNum(mine.value)}）</b> : "まだランク外。シールを集めたり贈ったりすると載ります"}
      </p>
      {rows.data.length === 0 ? (
        <p className="text-sm text-sub">この期間のランキングはまだありません。期間を「累計」にすると見られるかもしれません</p>
      ) : (
        <>
        <div className="mb-3 grid grid-cols-3 items-end gap-2">
          {[1, 0, 2].map((i) => {
            const r = data[i];
            if (!r) return <div key={i} />;
            const h = i === 0 ? "h-28" : i === 1 ? "h-20" : "h-16";
            const medal = ["bg-gold", "bg-line", "bg-[#e2b48a]"][i];
            return (
              <Link key={r.user_id} href={`/u/${r.handle}`} className="flex flex-col items-center gap-1 text-center">
                <span className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-surface bg-accent-soft font-round font-bold text-accent-ink shadow ${i === 0 ? "h-14 w-14" : ""}`}>
                  <AvatarImage url={r.avatar_url} letter={r.display_name.slice(0, 1)} />
                </span>
                <span className="w-full truncate text-[11px] font-bold">{r.display_name}</span>
                <span className={`flex w-full flex-col items-center justify-center rounded-t-xl ${medal} ${h}`}>
                  <span className="num text-lg">{i + 1}</span>
                  <span className="num text-[10px]">{formatNum(r.value)}</span>
                </span>
              </Link>
            );
          })}
        </div>
        <ol className="space-y-2">
          {rows.data.slice(3).map((r) => (
            <UserRow key={r.user_id} p={r} highlight={r.user_id === me} right={<span className="flex items-baseline gap-2"><span className="num text-sm text-accent-ink">{r.rnk}位</span><span className="num">{formatNum(r.value)}</span></span>} />
          ))}
        </ol>
        </>
      )}
    </div>
  );
}
