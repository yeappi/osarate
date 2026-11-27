"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { fail, ok, str, type ActionState } from "@/server/action";
import { createSupabaseForEmailLinks } from "@/server/supabase/implicit";
import { createSupabaseServer } from "@/server/supabase/server";

async function origin(): Promise<string> {
  const h = await headers();
  const o = h.get("origin");
  if (o) return o;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

/** メールリンクの戻り先。クエリを付けない（Supabase の Redirect URLs と照合されるため） */
async function confirmUrl(): Promise<string> {
  return `${await origin()}/auth/confirm`;
}

const RATE_LIMITED = "メールの送信が混み合っています。しばらく（1時間ほど）待ってから再度お試しください";

function isRateLimited(error: { status?: number; code?: string } | null): boolean {
  return !!error && (error.status === 429 || error.code === "over_email_send_rate_limit");
}

export async function signInAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email: str(fd, "email"), password: str(fd, "password") });
  if (error) return fail("メールアドレスかパスワードが違います");
  redirect("/me");
}

export async function signUpAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const password = str(fd, "password");
  if (password.length < 8) return fail("パスワードは8文字以上にしてください");
  const { data, error } = await createSupabaseForEmailLinks().auth.signUp({
    email: str(fd, "email"),
    password,
    options: { emailRedirectTo: await confirmUrl() },
  });
  if (isRateLimited(error)) return fail(RATE_LIMITED);
  if (error) return fail("登録できませんでした。入力内容を確認してください");
  if (data.session) {
    // メール確認が不要な設定の場合はその場でログイン状態にする
    const supabase = await createSupabaseServer();
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
    redirect("/welcome");
  }
  // 登録済みかどうかは明かさない（Supabase も登録済みアドレスにはメールを送らない）
  return ok(
    "確認メールを送りました。届かない場合は、すでに登録済みの可能性があります。ログインをお試しください（NSNS など同じアカウントを使うアプリと共通です）",
  );
}

export async function requestResetAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { error } = await createSupabaseForEmailLinks().auth.resetPasswordForEmail(str(fd, "email"), {
    redirectTo: await confirmUrl(),
  });
  if (isRateLimited(error)) return fail(RATE_LIMITED);
  // 登録有無を推測されないよう、それ以外は結果にかかわらず同じ文言
  return ok("再設定用のメールを送りました（登録済みの場合）。リンクは1回だけ有効です");
}

/** /auth/confirm から呼ぶ：メールリンクで受け取ったトークンを Cookie セッションにする */
export async function adoptSessionAction(tokens: { access_token: string; refresh_token: string }): Promise<ActionState> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.setSession(tokens);
  return error ? fail("リンクを確認できませんでした。もう一度メールを送ってください") : ok("確認しました");
}

export async function updatePasswordAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const password = str(fd, "password");
  if (password.length < 8) return fail("パスワードは8文字以上にしてください");
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return fail("変更できませんでした。もう一度「パスワードを忘れた」からやり直してください");
  redirect("/me");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}
