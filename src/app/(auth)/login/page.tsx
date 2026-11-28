"use client";

import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { PasswordInput } from "@/components/PasswordInput";
import { signInAction } from "@/server/services/auth";

export default function LoginPage() {
  return (
    <div className="space-y-4">
      <h2 className="h2">ログイン</h2>
      <ActionForm action={(fd) => signInAction(null, fd)} submitLabel="ログイン" variant="primary" inline className="flex flex-col gap-2">
        <input name="email" type="email" required placeholder="メールアドレス" className="input" autoComplete="email" />
        <PasswordInput placeholder="パスワード" autoComplete="current-password" />
      </ActionForm>
      <p className="text-sm">
        <Link href="/signup" className="link">新規登録</Link>　/　<Link href="/reset" className="link">パスワードを忘れた</Link>
      </p>
    </div>
  );
}
