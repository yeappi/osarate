import Link from "next/link";

const TONES = ["bg-accent-soft", "bg-mint-soft", "bg-gold-soft"];

/** シール帳の一覧用タイル */
export function BookTile({ id, name, sub, index }: { id: string; name: string; sub: string; index: number }) {
  return (
    <Link
      href={`/stickers/books/${id}`}
      className={`flex h-24 flex-col justify-end rounded-tile p-2.5 transition active:scale-[0.97] ${TONES[index % TONES.length]}`}
    >
      <span className="text-xs font-bold leading-tight">{name}</span>
      <span className="text-[10px] text-sub">{sub}</span>
    </Link>
  );
}
