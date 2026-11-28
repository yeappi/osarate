/** 同じ種類のシールをまとめる（保管・バッグの「×3」表示用）。順番は最初に出てきた順 */
export function groupByType<T extends { id: string; type_id: number }>(items: T[], extraKey?: (x: T) => string) {
  const map = new Map<string, { first: T; count: number }>();
  for (const it of items) {
    const k = `${it.type_id}:${extraKey ? extraKey(it) : ""}`;
    const g = map.get(k);
    if (g) g.count++;
    else map.set(k, { first: it, count: 1 });
  }
  return [...map.values()];
}
