"use client";

import Link from "next/link";
import { useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import { PasswordInput } from "@/components/PasswordInput";
import { signUpAction } from "@/server/services/auth";

export default function SignUpPage() {
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <div className="space-y-4">
        <h2 className="h2">確認メールを送りました</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          <li>メールに届いたリンクを開いてください（このスマホ・このブラウザでなくても大丈夫です）</li>
          <li>リンクを開くと、プロフィールづくりに進みます</li>
        </ol>
        <p className="text-xs text-sub">
          届かないときは、迷惑メールフォルダを確認してください。NSNS など同じアカウントを使うアプリで登録済みの場合はメールが届かないので、そのままログインできます。
        </p>
        <Link href="/login" className="btn">ログインへ</Link>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <h2 className="h2">新規登録</h2>
      <ActionForm action={(fd) => signUpAction(null, fd)} submitLabel="登録する" variant="primary" inline className="flex flex-col gap-2" onDone={(r) => r?.ok && setSent(true)}>
        <input name="email" type="email" required placeholder="メールアドレス" className="input" autoComplete="email" />
        <PasswordInput placeholder="パスワード（8文字以上）" autoComplete="new-password" minLength={8} />
      </ActionForm>
      <p className="text-xs text-sub">
        登録すると、<Link href="/terms" className="link">利用規約</Link>と<Link href="/privacy" className="link">プライバシーポリシー</Link>に同意したものとみなします。
      </p>
      <p className="text-sm">
        <Link href="/login" className="link">ログインへ戻る</Link>
      </p>
    </div>
  );
}
