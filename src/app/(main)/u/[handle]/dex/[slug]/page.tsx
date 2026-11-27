"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loading } from "@/components/Loading";
import { DEXES } from "@/config/app";
import { useDex, useMe, useProfileByHandle } from "@/client/queries";
import { DexGrid, DexProgress } from "@/features/dex/DexGrid";

// 他人の図鑑。図鑑購入できるシールはその人へギフトできる
export default function UserDexPage() {
  const { handle, slug } = useParams<{ handle: string; slug: string }>();
  const router = useRouter();
  const dex = DEXES.find((d) => d.slug === slug);
  const profile = useProfileByHandle(decodeURIComponent(handle));
  const me = useMe();
  const p = profile.data ?? null;
  const entries = useDex(p?.user_id ?? null, slug);

  useEffect(() => {
    if (p && me.data?.userId === p.user_id) router.replace(`/dex/${slug}`);
  }, [p, me.data, slug, router]);

  if (!dex) return <p className="text-sm">図鑑が見つかりません</p>;
  if (profile.data === undefined) return <Loading error={profile.error} />;
  if (!p) return <p className="text-sm">ユーザーが見つかりません</p>;

  return (
    <div>
      <p className="text-sm">
        <Link href={`/u/${p.handle}`} className="link">← {p.display_name}</Link>
      </p>
      <nav className="my-3 flex gap-2">
        {DEXES.map((d) => (
          <Link key={d.slug} href={`/u/${p.handle}/dex/${d.slug}`} className={d.slug === slug ? "btn-primary min-h-9" : "btn"}>
            {d.name}
          </Link>
        ))}
      </nav>
      {!entries.data ? (
        <Loading error={entries.error} />
      ) : (
        <>
          <h1 className="font-round text-xl font-bold">
            {p.display_name} の図鑑：{dex.name}（{entries.data.filter((e) => e.owned).length} / {entries.data.length}）
          </h1>
          <DexProgress owned={entries.data.filter((e) => e.owned).length} total={entries.data.length} />
          <div className="h-3" />
          <DexGrid entries={entries.data} mode="gift" giftToHandle={p.handle} />
        </>
      )}
    </div>
  );
}
