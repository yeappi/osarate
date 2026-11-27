import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { BottomNav } from "@/components/BottomNav";
import { formatNum, formatPt } from "@/domain/format";
import { getMe } from "@/server/queries/me";
import { claimLoginBonusAction } from "@/server/services/profile";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me.user) redirect("/login");
  if (!me.profile || !me.wallet) redirect("/welcome");
  const w = me.wallet;

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
          <ActionForm action={claimLoginBonusAction} submitLabel="ログインボーナスを受け取る" />
        </div>
      )}
      <main className="p-3">{children}</main>
      <BottomNav />
    </div>
  );
}
