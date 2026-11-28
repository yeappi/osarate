"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Loading } from "@/components/Loading";
import { DEXES, VISIBLE_DEXES } from "@/config/app";
import { useDex, useMe } from "@/client/queries";
import { DexGrid, DexProgress } from "@/features/dex/DexGrid";

export default function MyDexPage() {
  const { slug } = useParams<{ slug: string }>();
  const dex = DEXES.find((d) => d.slug === slug);
  const me = useMe();
  const entries = useDex(me.data?.userId ?? null, slug);
  if (!dex) return <p className="text-sm">図鑑が見つかりません</p>;

  return (
    <div>
      {VISIBLE_DEXES.length > 1 && (
        <nav className="mb-3 flex gap-2">
          {VISIBLE_DEXES.map((d) => (
            <Link key={d.slug} href={`/dex/${d.slug}`} className={d.slug === slug ? "btn-primary min-h-9" : "btn"}>
              {d.name}
            </Link>
          ))}
        </nav>
      )}
      {!entries.data ? (
        <Loading error={entries.error} />
      ) : (
        <>
          <div className="flex items-baseline justify-between">
            <h1 className="font-round text-xl font-bold">図鑑</h1>
            <span className="text-xs text-sub">
              集めた <b className="num text-sm text-ink">{entries.data.filter((e) => e.owned).length}</b> / {entries.data.length}
            </span>
          </div>
          <DexProgress owned={entries.data.filter((e) => e.owned).length} total={entries.data.length} />
          <div className="h-3" />
          <DexGrid entries={entries.data} mode="self" />
        </>
      )}
    </div>
  );
}
