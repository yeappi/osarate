import Link from "next/link";
import { redirect } from "next/navigation";
import { RANKING_METRICS, RANKING_PERIODS } from "@/config/app";
import { formatNum } from "@/domain/format";
import type { PublicProfile } from "@/domain/types";
import { getRanking } from "@/server/queries/catalog";
import { requireMe } from "@/server/queries/me";
import { listFollowing, searchProfiles } from "@/server/queries/profiles";

type SP = Promise<{ q?: string; tab?: string; metric?: string; period?: string }>;

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

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const me = await requireMe();
  if (!me) redirect("/welcome");
  const tab = sp.tab ?? "ranking";
  const metric = RANKING_METRICS.some((m) => m.key === sp.metric) ? sp.metric! : "charm";
  const period = RANKING_PERIODS.some((p) => p.key === sp.period) ? sp.period! : "day";

  return (
    <div>
      <form className="mb-3 flex gap-2">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="ユーザーを検索" className="input flex-1" />
        <input type="hidden" name="tab" value="search" />
        <button className="btn">検索</button>
      </form>
      <nav className="mb-3 flex gap-3 text-sm">
        {[
          ["ranking", "ランキング"],
          ["following", "フォロー中"],
        ].map(([k, label]) => (
          <Link key={k} href={`/search?tab=${k}`} className={tab === k ? "font-bold" : "link"}>
            {label}
          </Link>
        ))}
      </nav>

      {tab === "search" && <SearchResults q={sp.q ?? ""} />}
      {tab === "following" && <Following userId={me.user.id} />}
      {tab === "ranking" && <Ranking metric={metric} period={period} me={me.user.id} />}
    </div>
  );
}

async function SearchResults({ q }: { q: string }) {
  const users = await searchProfiles(q);
  if (users.length === 0) return <p className="text-sm text-gray-500">見つかりませんでした</p>;
  return <ul className="space-y-2">{users.map((u) => <UserRow key={u.user_id} p={u} />)}</ul>;
}

async function Following({ userId }: { userId: string }) {
  const users = await listFollowing(userId);
  if (users.length === 0) return <p className="text-sm text-gray-500">まだフォローしていません</p>;
  return <ul className="space-y-2">{users.map((u) => <UserRow key={u.user_id} p={u} />)}</ul>;
}

async function Ranking({ metric, period, me }: { metric: string; period: string; me: string }) {
  const rows = await getRanking(metric, period, me);
  const mine = rows.find((r) => r.user_id === me);
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-3 text-sm">
        {RANKING_METRICS.map((m) => (
          <Link key={m.key} href={`/search?tab=ranking&metric=${m.key}&period=${period}`} className={m.key === metric ? "font-bold" : "link"}>
            {m.label}
          </Link>
        ))}
        <span>｜</span>
        {RANKING_PERIODS.map((p) => (
          <Link key={p.key} href={`/search?tab=ranking&metric=${metric}&period=${p.key}`} className={p.key === period ? "font-bold" : "link"}>
            {p.label}
          </Link>
        ))}
      </div>
      <p className="mb-2 text-sm">あなた：{mine ? `${mine.rnk}位（${formatNum(mine.value)}）` : "圏外"}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">まだランキングがありません</p>
      ) : (
        <ol className="space-y-2">
          {rows.map((r) => (
            <UserRow key={r.user_id} p={r} right={<span className="font-bold">{r.rnk}位　{formatNum(r.value)}</span>} />
          ))}
        </ol>
      )}
    </div>
  );
}
