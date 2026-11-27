import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Outfit, Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";

// 文字はテーマの部品（--font-body / --font-round-face / --font-num-face）として渡す
const body = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-body", preload: false });
const round = Zen_Maru_Gothic({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-round-face", preload: false });
const num = Outfit({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-num-face" });

export const metadata: Metadata = {
  title: "推されーと",
  description: "シール帳アプリ",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" data-theme="komorebi" className={`${body.variable} ${round.variable} ${num.variable}`}>
      <body>{children}</body>
    </html>
  );
}
