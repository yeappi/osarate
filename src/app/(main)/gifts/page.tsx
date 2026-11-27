import Link from "next/link";
import { redirect } from "next/navigation";
import { listTransfers } from "@/server/queries/items";
import { requireMe } from "@/server/queries/me";

export default async function GiftsPage() {
  const me = await requireMe();
  if (!me) redirect("/welcome");
  const rows = await listTransfers(me.user.id);

  return (
    <div>
      <h1 className="h2">ギフト・プレゼント履歴</h1>
      {rows.length === 0 && <p className="text-sm text-gray-500">まだありません</p>}
      <ul className="space-y-2">
        {rows.map((r) => {
          const received = r.to_user === me.user.id;
          const other = received ? r.from : r.to;
          return (
            <li key={r.id} className="card text-sm">
              <div>
                {received ? "受け取り" : "送信"}・{r.kind === "gift" ? "ギフト" : "プレゼント"}：{r.sticker.type.name}
              </div>
              <div className="text-xs text-gray-600">
                {received ? "from" : "to"} <Link href={`/u/${other.handle}`} className="link">{other.display_name}</Link>
                {r.kind === "gift" && received && `・還元 ${r.reward}pt（${r.rate_pct}%）`}
                ・{new Date(r.created_at).toLocaleString("ja-JP")}
              </div>
              {r.message && <p className="mt-1">「{r.message}」</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
