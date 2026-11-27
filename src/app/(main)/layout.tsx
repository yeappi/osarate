"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ActionForm } from "@/components/ActionForm";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { Loading } from "@/components/Loading";
import { claimLoginBonus } from "@/client/mutations";
import { useMe } from "@/client/queries";
import { formatNum } from "@/domain/format";

// ログイン必須の画面の枠。画面自体は静的に配信し、データはブラウザから取得する
export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const me = useMe();

  useEffect(() => {
    if (!me.data || !me.fresh) return;
    if (!me.data.userId) router.replace("/login");
    else if (!me.data.profile) router.replace("/welcome");
  }, [me.data, me.fresh, router]);

  if (!me.data?.profile || !me.data.wallet) return <Loading error={me.error} />;
  const w = me.data.wallet;

  return (
    <div className="mx-auto min-h-screen max-w-md pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-bg/90 px-4 pb-2 pt-3 backdrop-blur">
        <span className="chip pl-1.5">
          <span className="num flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] text-surface">P</span>
          <span className="num text-[15px]">{formatNum(w.points)}</span>
          <span className="text-[11px] text-sub">pt</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="chip text-sub" title="持ち玉">
            <Icon name="ball" size={14} strokeWidth={2} />
            <span className="font-num text-[13px] font-medium">{formatNum(w.balls)}</span>
          </span>
          {w.is_admin && (
            <Link href="/admin" aria-label="運営" className="flex h-10 w-10 items-center justify-center rounded-tile border border-line bg-surface text-sub">
              <Icon name="admin" />
            </Link>
          )}
          <Link href="/bag" aria-label="バッグ" className="flex h-10 w-10 items-center justify-center rounded-tile border border-line bg-surface">
            <Icon name="bag" />
          </Link>
        </div>
      </header>
      {w.login_bonus_available && (
        <div className="mx-4 mb-1 rounded-2xl bg-gold-soft px-3 py-2">
          <ActionForm action={claimLoginBonus} submitLabel="ログインボーナスを受け取る" />
        </div>
      )}
      <main className="px-4 pb-4 pt-1">{children}</main>
      <BottomNav />
    </div>
  );
}
