"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { fail, ok, str, type ActionState } from "@/server/action";
import { createSupabaseServer } from "@/server/supabase/server";

async function origin(): Promise<string> {
  const h = await headers();
  const o = h.get("origin");
  if (o) return o;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
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
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email: str(fd, "email"),
    password,
    options: { emailRedirectTo: `${await origin()}/auth/callback?next=/welcome` },
  });
  if (error) return fail("登録できませんでした。入力内容を確認してください");
  if (data.session) redirect("/welcome");
  return ok("確認メールを送りました。メール内のリンクを開いてください");
}

export async function requestResetAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createSupabaseServer();
  await supabase.auth.resetPasswordForEmail(str(fd, "email"), {
    redirectTo: `${await origin()}/auth/callback?next=/reset/update`,
  });
  // 登録有無を推測されないよう、結果にかかわらず同じ文言
  return ok("再設定用のメールを送りました（登録済みの場合）");
}

export async function updatePasswordAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const password = str(fd, "password");
  if (password.length < 8) return fail("パスワードは8文字以上にしてください");
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return fail("変更できませんでした。もう一度メールからやり直してください");
  redirect("/me");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}
