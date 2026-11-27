"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

const ITEMS = [
  { href: "/search", label: "探す", icon: "search" },
  { href: "/shop", label: "SHOP", icon: "shop" },
  { href: "/me", label: "プロフ", icon: "profile" },
  { href: "/play", label: "遊び場", icon: "play" },
  { href: "/stickers", label: "シール", icon: "sticker" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {ITEMS.map((i) => {
          const active = path.startsWith(i.href);
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-0.5 text-[10px] ${active ? "font-bold text-accent" : "text-sub"}`}
              >
                <span className={`flex h-7 w-11 items-center justify-center rounded-full ${active ? "bg-accent-soft" : ""}`}>
                  <Icon name={i.icon} size={22} strokeWidth={active ? 2 : 1.8} />
                </span>
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
