export function formatPt(n: number | string | null | undefined): string {
  return `${Number(n ?? 0).toLocaleString("ja-JP")}pt`;
}

export function formatNum(n: number | string | null | undefined): string {
  return Number(n ?? 0).toLocaleString("ja-JP");
}

const RARITY_LABEL: Record<string, string> = {
  common: "コモン",
  rare: "レア",
  epic: "エピック",
  legend: "レジェンド",
};

export function rarityLabel(r: string): string {
  return RARITY_LABEL[r] ?? r;
}

const TIER_LABEL: Record<string, string> = { miss: "ハズレ", hit: "当たり", big: "大当たり", jackpot: "超大当たり" };

export function tierLabel(t: string): string {
  return TIER_LABEL[t] ?? t;
}
