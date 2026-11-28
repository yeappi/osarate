"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMe } from "@/client/queries";

const HERO = [
  { src: "/stickers/legend_crown.webp", cls: "left-[52%] top-2 w-40 rotate-[-8deg]" },
  { src: "/stickers/legend_moon.webp", cls: "left-[66%] top-36 w-32 rotate-[10deg]" },
  { src: "/stickers/legend_peacock.webp", cls: "left-[34%] top-40 w-28 rotate-[6deg]" },
  { src: "/stickers/pop_pop_lucky.png", cls: "left-[6%] top-8 w-24 rotate-[-12deg]" },
  { src: "/stickers/dark_dk_ticket.png", cls: "left-[4%] top-36 w-32 rotate-[8deg]" },
  { src: "/stickers/starter_key.webp", cls: "left-[86%] top-6 w-12 rotate-[16deg]" },
];

// はじめて来た人向けのトップ。ログイン済みならマイページへ
export default function Home() {
  const router = useRouter();
  const me = useMe();
  useEffect(() => {
    if (me.data?.userId) router.replace("/me");
  }, [me.data, router]);

  return (
    <main className="mx-auto min-h-screen max-w-md overflow-hidden pb-10">
      <div className="paper relative h-64">
        {HERO.map((h) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={h.src} src={h.src} alt="" className={`animate-pop absolute drop-shadow-[0_6px_10px_rgba(60,40,20,0.18)] ${h.cls}`} />
        ))}
      </div>
      <div className="space-y-5 px-6 pt-6">
        <div>
          <h1 className="font-round text-4xl font-bold">推されーと</h1>
          <p className="mt-2 text-sm text-sub">シールを集めて、貼って、贈り合うシール帳アプリ</p>
        </div>
        <ul className="space-y-3 text-sm">
          <li className="card flex gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/stickers/dream_dd_label.png" alt="" className="h-11 w-11 shrink-0 object-contain" />
            <span>
              <b>シール帳に貼る</b>
              <br />
              <span className="text-sub">ポップ・ダーク・ゆめかわ…画風のちがうシールで、自分だけのページをつくる</span>
            </span>
          </li>
          <li className="card flex gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/stickers/pop_pop_capsule.png" alt="" className="h-11 w-11 shrink-0 object-contain" />
            <span>
              <b>友だちに贈る</b>
              <br />
              <span className="text-sub">未開封のシールを贈ると、受け取った人にポイントが返ってくることも</span>
            </span>
          </li>
          <li className="card flex gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/stickers/legend_crown.webp" alt="" className="h-11 w-11 shrink-0 object-contain" />
            <span>
              <b>集めて、競う</b>
              <br />
              <span className="text-sub">最高150,000ptの宝物シール。魅力値と応援力でランキング</span>
            </span>
          </li>
        </ul>
        <div className="flex flex-col gap-2">
          <Link href="/signup" className="btn-primary min-h-12 text-base">
            はじめる（無料）
          </Link>
          <Link href="/login" className="btn min-h-11">
            ログイン
          </Link>
        </div>
        <p className="text-center text-xs text-sub">
          <Link href="/terms" className="link">利用規約</Link>・<Link href="/privacy" className="link">プライバシーポリシー</Link>
        </p>
      </div>
    </main>
  );
}
