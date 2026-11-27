import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/server/supabase/server";

// 確認メール・パスワード再設定メールのリンク先。code をセッションに交換して next へ
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/me";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/me";

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
  }
  return NextResponse.redirect(new URL("/login", url.origin));
}
