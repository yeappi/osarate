import Link from "next/link";

const TONES = ["bg-accent-soft", "bg-mint-soft", "bg-gold-soft"];

/** シール帳の種類ごとの表紙の色（theme 列）。ない場合は並び順で色を変える */
export const BOOK_THEME_TONE: Record<string, string> = {
  kraft: "bg-[#E6D5B8] text-[#4A3A26]",
  midnight: "bg-[#2B2F4A] text-[#F1EDE4]",
  rose: "bg-[#F2D0D4] text-[#5A2E36]",
};

export function bookTone(theme: string | undefined, index: number) {
  return (theme && BOOK_THEME_TONE[theme]) || TONES[index % TONES.length];
}

/** シール帳の一覧用タイル */
export function BookTile({ id, name, sub, index, theme }: { id: string; name: string; sub: string; index: number; theme?: string }) {
  return (
    <Link
      href={`/stickers/books/${id}`}
      className={`flex h-24 flex-col justify-end rounded-tile p-2.5 transition active:scale-[0.97] ${bookTone(theme, index)}`}
    >
      <span className="text-xs font-bold leading-tight">{name}</span>
      <span className="text-[10px] opacity-70">{sub}</span>
    </Link>
  );
}
