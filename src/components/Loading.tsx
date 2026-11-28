/** 読み込み中は骨組み（グレーの帯）を出して、画面がガタッと切り替わらないようにする */
export function Loading({ error, rows = 3 }: { error?: string; rows?: number }) {
  if (error) return <p className="p-4 text-sm text-accent-ink">{error}</p>;
  return (
    <div className="space-y-2 py-2" role="status" aria-label="読み込み中">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton h-14 rounded-[22px]" style={{ opacity: 1 - i * 0.2 }} />
      ))}
    </div>
  );
}
