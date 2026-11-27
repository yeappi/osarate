"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/search", label: "探す" },
  { href: "/shop", label: "SHOP" },
  { href: "/me", label: "プロフ" },
  { href: "/play", label: "遊び場" },
  { href: "/stickers", label: "シール" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-white">
      <ul className="mx-auto flex max-w-md">
        {ITEMS.map((i) => (
          <li key={i.href} className="flex-1">
            <Link href={i.href} className={`block py-3 text-center text-sm ${path.startsWith(i.href) ? "font-bold" : ""}`}>
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
