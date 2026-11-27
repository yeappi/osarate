export function Loading({ error }: { error?: string }) {
  if (error) return <p className="p-4 text-sm text-accent-ink">{error}</p>;
  return (
    <div className="flex items-center gap-2 p-4 text-sm text-sub" role="status">
      <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
      読み込み中…
    </div>
  );
}
