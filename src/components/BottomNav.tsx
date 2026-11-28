"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

// 真ん中が主役のシール帳。遊び場は SHOP とヘッダーの玉から入る
const ITEMS = [
  { href: "/me", match: ["/me"], label: "マイページ", icon: "profile" },
  { href: "/dex/main", match: ["/dex"], label: "図鑑", icon: "dex" },
  { href: "/stickers", match: ["/stickers"], label: "シール帳", icon: "book", main: true },
  { href: "/search", match: ["/search", "/u/"], label: "探す", icon: "search" },
  { href: "/shop", match: ["/shop", "/play"], label: "SHOP", icon: "shop" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {ITEMS.map((i) => {
          const active = i.match.some((m) => path.startsWith(m));
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-0.5 text-[10px] ${active ? "font-bold text-accent" : "text-sub"}`}
              >
                {i.main ? (
                  <span className={`-mt-5 flex h-12 w-12 items-center justify-center rounded-full shadow-lg ${active ? "bg-accent text-surface" : "bg-ink text-surface"}`}>
                    <Icon name={i.icon} size={24} strokeWidth={2} />
                  </span>
                ) : (
                  <span className={`flex h-7 w-11 items-center justify-center rounded-full ${active ? "bg-accent-soft" : ""}`}>
                    <Icon name={i.icon} size={22} strokeWidth={active ? 2 : 1.8} />
                  </span>
                )}
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
