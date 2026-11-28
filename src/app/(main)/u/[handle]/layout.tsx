import type { Metadata } from "next";
import { supabaseEnv } from "@/config/app";

// シェアされたときのカード（タイトル・説明）。画面自体はブラウザで描く
export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const h = decodeURIComponent(handle).replace(/[^A-Za-z0-9_]/g, "");
  try {
    const { url, anonKey } = supabaseEnv();
    const res = await fetch(`${url}/rest/v1/oshi_profiles?select=display_name,handle,bio&handle=ilike.${h}&limit=1`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      next: { revalidate: 300 },
    });
    const rows = (await res.json()) as { display_name: string; handle: string; bio: string | null }[];
    const p = rows[0];
    if (!p) return {};
    const title = `${p.display_name}（@${p.handle}）のシール帳｜推されーと`;
    const description = p.bio?.slice(0, 100) || "シールを集めて、貼って、贈り合うシール帳アプリ";
    return {
      title,
      description,
      openGraph: { title, description, siteName: "推されーと", images: ["/og.png"], type: "profile", locale: "ja_JP" },
      twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
    };
  } catch {
    return {};
  }
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return children;
}
