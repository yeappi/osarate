"use client";

import Link from "next/link";
import { useMe, useStickers, useTransfers, useUnreadGifts } from "@/client/queries";

/** マイページの一番上：今日やること（毎日開く理由） */
export function TodayCard() {
  const me = useMe();
  const uid = me.data?.userId ?? null;
  const sealed = useStickers(uid, "sealed");
  const unread = useUnreadGifts(uid);
  const transfers = useTransfers(uid);
  const w = me.data?.wallet;

  const weekAgo = Date.now() - 7 * 86400_000;
  const openedByOthers = (transfers.data ?? []).filter(
    (t) => t.from_user === uid && t.kind === "gift" && t.sticker.state === "opened" && t.sticker.owner_id === t.to_user && Date.parse(t.created_at) > weekAgo,
  );

  const items: { key: string; text: React.ReactNode; href: string; cta: string; hot?: boolean }[] = [];
  if (w?.login_bonus_available) items.push({ key: "bonus", text: "ログインボーナスが受け取れます", href: "#", cta: "上の「受け取る」", hot: true });
  if (unread.data) items.push({ key: "gift", text: <>贈りものが <b className="num">{unread.data}</b> 件届いています</>, href: "/gifts", cta: "開ける", hot: true });
  if (sealed.data?.length) items.push({ key: "sealed", text: <>未開封のシールが <b className="num">{sealed.data.length}</b> 枚</>, href: "/bag", cta: "開封する" });
  for (const t of openedByOthers.slice(0, 2)) {
    items.push({ key: `op${t.id}`, text: <>{t.to.display_name} さんが、あなたのギフト「{t.sticker.type.name}」を開けました</>, href: "/gifts", cta: "見る" });
  }
  if (items.length === 0) return null;

  return (
    <section className="mb-4 space-y-1.5">
      <h2 className="h2 !mt-1">きょうのこと</h2>
      <ul className="space-y-1.5">
        {items.map((i) => (
          <li key={i.key}>
            {i.href === "#" ? (
              <div className="flex items-center gap-2 rounded-2xl bg-gold-soft px-3 py-2.5 text-sm">
                <span className="flex-1">{i.text}</span>
                <span className="text-xs text-sub">{i.cta}</span>
              </div>
            ) : (
              <Link href={i.href} className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm ${i.hot ? "bg-accent-soft" : "bg-muted"}`}>
                <span className="flex-1">{i.text}</span>
                <span className="text-xs font-bold">{i.cta} →</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
