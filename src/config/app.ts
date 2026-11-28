// アプリ全体の定数（調整が必要な数値は DB の oshi_settings に置く。ここには置かない）

export const STICKER_BUCKET = "oshi-stickers";

/** ログイン不要でアクセスできるパス（先頭一致） */
export const PUBLIC_PATHS = ["/login", "/signup", "/reset", "/auth"];

export const DEXES = [
  { slug: "main", name: "メイン" },
  { slug: "elite", name: "精鋭" },
] as const;

export const RANKING_METRICS = [
  { key: "charm", label: "魅力値" },
  { key: "support", label: "応援力" },
] as const;

export const RANKING_PERIODS = [
  { key: "day", label: "日間" },
  { key: "week", label: "週間" },
  { key: "month", label: "月間" },
  { key: "all", label: "累計" },
] as const;

export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です（.env.local）");
  }
  return { url, anonKey };
}
