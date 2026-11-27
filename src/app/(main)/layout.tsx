"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ActionForm } from "@/components/ActionForm";
import { BottomNav } from "@/components/BottomNav";
import { Loading } from "@/components/Loading";
import { claimLoginBonus } from "@/client/mutations";
import { useMe } from "@/client/queries";
import { formatNum, formatPt } from "@/domain/format";

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
    <div className="mx-auto min-h-screen max-w-md pb-20">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-white px-3 py-2 text-sm">
        <span className="font-bold">{formatPt(w.points)}</span>
        <span>玉 {formatNum(w.balls)}</span>
        <Link href="/bag" className="btn">バッグ</Link>
        {w.is_admin && <Link href="/admin" className="link">運営</Link>}
      </header>
      {w.login_bonus_available && (
        <div className="border-b bg-yellow-50 px-3 py-2">
          <ActionForm action={claimLoginBonus} submitLabel="ログインボーナスを受け取る" />
        </div>
      )}
      <main className="p-3">{children}</main>
      <BottomNav />
    </div>
  );
}
