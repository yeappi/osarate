"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adoptSessionAction } from "@/server/services/auth";

/** Supabase が URL の # 以降（または ?）に付けてくるエラーを文言にする */
function linkErrorMessage(params: URLSearchParams): string | null {
  const code = params.get("error_code") ?? params.get("error");
  if (!code) return null;
  if (code === "otp_expired" || code === "access_denied") {
    return "リンクの有効期限が切れているか、すでに使われています。もう一度メールを送ってください";
  }
  return "リンクを確認できませんでした。もう一度メールを送ってください";
}

/**
 * 登録確認・パスワード再設定メールのリンク先。
 * implicit フローのため、トークンは URL の # 以降に入る（サーバーには届かない）。
 * ここで読み取ってサーバーに渡し、Cookie セッションにしてから次の画面へ進む。
 */
export default function ConfirmPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    const err = linkErrorMessage(hash) ?? linkErrorMessage(query);
    if (err) {
      setError(err);
      return;
    }
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    if (!access_token || !refresh_token) {
      setError("リンクを確認できませんでした。メールのリンクをもう一度開くか、再送してください");
      return;
    }
    const type = hash.get("type");
    // トークンをアドレス欄・履歴に残さない
    window.history.replaceState(null, "", window.location.pathname);
    adoptSessionAction({ access_token, refresh_token }).then((r) => {
      if (!r?.ok) {
        setError(r?.message ?? "リンクを確認できませんでした");
        return;
      }
      router.replace(type === "recovery" ? "/reset/update" : "/me");
    });
  }, [router]);

  return (
    <main className="mx-auto max-w-sm space-y-4 p-6">
      <h1 className="text-2xl font-bold">推されーと</h1>
      {error ? (
        <>
          <p className="text-sm text-red-600">{error}</p>
          <p className="text-sm">
            <Link href="/reset" className="link">パスワード再設定</Link>　/　<Link href="/login" className="link">ログイン</Link>
          </p>
        </>
      ) : (
        <p className="text-sm">確認しています…</p>
      )}
    </main>
  );
}
