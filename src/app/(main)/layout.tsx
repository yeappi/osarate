"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { refresh } from "@/client/store";
import { ActionForm } from "@/components/ActionForm";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { Loading } from "@/components/Loading";
import { claimLoginBonus } from "@/client/mutations";
import { useMe, useStarterOptions, useUnreadGifts } from "@/client/queries";
import { formatNum } from "@/domain/format";
import { CountUp } from "@/components/CountUp";

// ログイン必須の画面の枠。画面自体は静的に配信し、データはブラウザから取得する
// ログインしていなくても見られる画面（シェアされたプロフィール・図鑑・シール帳）
const PUBLIC_PATH = /^\/(u\/[^/]+(\/dex\/[^/]+)?|stickers\/books\/[^/]+)\/?$/;

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_PATH.test(pathname);
  const me = useMe();
  const starter = useStarterOptions(!!me.data?.profile);
  const unreadUid = me.data?.profile ? me.data.userId : null;
  const unread = useUnreadGifts(unreadUid);

  // 届いたギフトに気づけるよう、未読数は1分ごとに確かめる
  useEffect(() => {
    if (!unreadUid) return;
    const t = setInterval(() => refresh(`unread:${unreadUid}`), 60_000);
    return () => clearInterval(t);
  }, [unreadUid]);

  useEffect(() => {
    if (!me.data || !me.fresh) return;
    if (!me.data.userId) {
      if (!isPublic) router.replace("/login");
    }
    else if (!me.data.profile) router.replace("/welcome");
    else if (starter.data && starter.fresh && !starter.data.chosen) router.replace("/starter");
  }, [me.data, me.fresh, starter.data, starter.fresh, router, isPublic]);

  // ログインしていない人が、公開の画面を開いたとき：見るだけの枠
  if (me.data && !me.data.userId && isPublic) {
    return (
      <div className="mx-auto min-h-screen max-w-md pb-12">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-bg/90 px-4 pb-2 pt-3 backdrop-blur">
          <span className="font-round text-lg font-bold">推されーと</span>
          <div className="flex gap-2">
            <Link href="/login" className="btn">ログイン</Link>
            <Link href="/signup" className="btn-accent">はじめる</Link>
          </div>
        </header>
        <main className="px-4 pb-4 pt-1">{children}</main>
      </div>
    );
  }

  if (!me.data?.profile || !me.data.wallet) return <Loading error={me.error} />;
  const w = me.data.wallet;

  return (
    <div className="mx-auto min-h-screen max-w-md pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-line/60 bg-bg/90 px-4 pb-2 pt-3 backdrop-blur">
        <Link href="/me" className="chip pl-1.5" aria-label="ポイント">
          <span className="num flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] text-surface">P</span>
          <span className="num text-[15px]">
            <CountUp value={Number(w.points)} />
          </span>
          <span className="text-[11px] text-sub">ポイント</span>
        </Link>
        <div className="flex items-center gap-1.5">
          {w.balls > 0 && (
            <Link href="/play" className="chip px-2 text-sub" aria-label="持ち玉">
              <Icon name="ball" size={14} strokeWidth={2} />
              <span className="font-num text-[13px] font-medium">{formatNum(w.balls)}</span>
            </Link>
          )}
          {w.is_admin && (
            <HeaderIcon href="/admin" label="運営" icon="admin" />
          )}
          <HeaderIcon href="/gifts" label="ギフト" icon="gift" badge={unread.data ?? 0} />
          <HeaderIcon href="/bag" label="バッグ" icon="bag" />
        </div>
      </header>
      {w.login_bonus_available && (
        <div className="mx-4 mb-2 flex items-center justify-between gap-2 rounded-2xl bg-gold-soft px-3 py-2">
          <span className="text-xs font-bold">今日のログインボーナス</span>
          <ActionForm action={claimLoginBonus} submitLabel="受け取る" variant="primary" />
        </div>
      )}
      <main key={pathname} className="animate-fade px-4 pb-4 pt-1">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

function HeaderIcon({ href, label, icon, badge = 0 }: { href: string; label: string; icon: string; badge?: number }) {
  return (
    <Link href={href} aria-label={label} className="relative flex w-11 flex-col items-center gap-0.5 text-[9px] text-sub">
      <span className="flex h-8 w-8 items-center justify-center rounded-tile border border-line bg-surface text-ink">
        <Icon name={icon} size={18} />
      </span>
      {label}
      {badge > 0 && (
        <span className="num absolute -right-0.5 -top-1 min-w-5 rounded-full bg-accent px-1 text-center text-[11px] leading-5 text-surface">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}
