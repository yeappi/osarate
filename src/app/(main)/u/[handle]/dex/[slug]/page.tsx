import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DEXES } from "@/config/app";
import { DexGrid } from "@/features/dex/DexGrid";
import { getDex } from "@/server/queries/catalog";
import { getMe } from "@/server/queries/me";
import { getProfileByHandle } from "@/server/queries/profiles";

// 他人の図鑑。図鑑購入できるシールはその人へギフトできる
export default async function UserDexPage({ params }: { params: Promise<{ handle: string; slug: string }> }) {
  const { handle, slug } = await params;
  const dex = DEXES.find((d) => d.slug === slug);
  const profile = await getProfileByHandle(decodeURIComponent(handle));
  if (!dex || !profile) notFound();
  const me = await getMe();
  if (me.user?.id === profile.user_id) redirect(`/dex/${slug}`);
  const entries = await getDex(profile.user_id, slug);
  const owned = entries.filter((e) => e.owned).length;

  return (
    <div>
      <p className="text-sm">
        <Link href={`/u/${profile.handle}`} className="link">← {profile.display_name}</Link>
      </p>
      <nav className="my-2 flex gap-3 text-sm">
        {DEXES.map((d) => (
          <Link key={d.slug} href={`/u/${profile.handle}/dex/${d.slug}`} className={d.slug === slug ? "font-bold" : "link"}>
            {d.name}
          </Link>
        ))}
      </nav>
      <h1 className="h2">
        {profile.display_name} の図鑑：{dex.name}（{owned} / {entries.length}）
      </h1>
      <DexGrid entries={entries} mode="gift" giftToHandle={profile.handle} />
    </div>
  );
}
