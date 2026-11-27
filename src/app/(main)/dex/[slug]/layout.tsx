import { DEXES } from "@/config/app";

// 図鑑は種類が固定なので静的に生成する（タブ切り替えでサーバー待ちを起こさない）
export const dynamicParams = false;
export function generateStaticParams() {
  return DEXES.map((d) => ({ slug: d.slug }));
}

export default function DexLayout({ children }: { children: React.ReactNode }) {
  return children;
}
