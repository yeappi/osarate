import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/server/supabase/server";

// 旧方式（PKCE）のリンク用。新しく送るメールは /auth/confirm に戻る。
// code をセッションに交換して next へ。失敗したら理由を /auth/confirm で表示する
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/me";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/me";

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
  }
  return NextResponse.redirect(new URL("/auth/confirm?error=link_failed", url.origin));
}
