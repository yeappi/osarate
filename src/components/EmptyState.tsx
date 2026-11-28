/** 空の画面。小さなシールの絵と一言で、次にすることを伝える */
export function EmptyState({ image = "/stickers/fresh_b_sparkle.png", title, children }: { image?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[22px] border border-dashed border-line px-4 py-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" className="animate-wiggle h-12 w-12 object-contain opacity-80" />
      <p className="text-sm font-bold">{title}</p>
      {children && <div className="text-xs text-sub">{children}</div>}
    </div>
  );
}
