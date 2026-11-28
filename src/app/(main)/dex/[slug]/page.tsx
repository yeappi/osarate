"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Loading } from "@/components/Loading";
import { DEXES } from "@/config/app";
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
      <nav className="mb-3 flex gap-2">
        {DEXES.map((d) => (
          <Link key={d.slug} href={`/dex/${d.slug}`} className={d.slug === slug ? "btn-primary min-h-9" : "btn"}>
            {d.name}
          </Link>
        ))}
      </nav>
      {!entries.data ? (
        <Loading error={entries.error} />
      ) : (
        <>
          <h1 className="font-round text-xl font-bold">
            図鑑：{dex.name}（{entries.data.filter((e) => e.owned).length} / {entries.data.length}）
          </h1>
          <DexProgress owned={entries.data.filter((e) => e.owned).length} total={entries.data.length} />
          <div className="h-3" />
          <DexGrid entries={entries.data} mode="self" />
        </>
      )}
    </div>
  );
}
