import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DEXES } from "@/config/app";
import { DexGrid } from "@/features/dex/DexGrid";
import { getDex } from "@/server/queries/catalog";
import { requireMe } from "@/server/queries/me";

export default async function MyDexPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dex = DEXES.find((d) => d.slug === slug);
  if (!dex) notFound();
  const me = await requireMe();
  if (!me) redirect("/welcome");
  const entries = await getDex(me.user.id, slug);
  const owned = entries.filter((e) => e.owned).length;

  return (
    <div>
      <nav className="mb-2 flex gap-3 text-sm">
        {DEXES.map((d) => (
          <Link key={d.slug} href={`/dex/${d.slug}`} className={d.slug === slug ? "font-bold" : "link"}>
            {d.name}
          </Link>
        ))}
      </nav>
      <h1 className="h2">図鑑：{dex.name}（{owned} / {entries.length}）</h1>
      <DexGrid entries={entries} mode="self" />
    </div>
  );
}
