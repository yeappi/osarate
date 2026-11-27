export function Loading({ error }: { error?: string }) {
  if (error) return <p className="p-3 text-sm text-red-600">{error}</p>;
  return <p className="p-3 text-sm text-gray-500">読み込み中…</p>;
}
