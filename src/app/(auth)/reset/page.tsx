"use client";

import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { requestResetAction } from "@/server/services/auth";

export default function ResetPage() {
  return (
    <div className="space-y-4">
      <h2 className="h2">パスワード再設定</h2>
      <ActionForm action={(fd) => requestResetAction(null, fd)} submitLabel="再設定メールを送る" variant="primary" inline className="flex flex-col gap-2">
        <input name="email" type="email" required placeholder="メールアドレス" className="input" />
      </ActionForm>
      <p className="text-sm">
        <Link href="/login" className="link">ログインへ戻る</Link>
      </p>
    </div>
  );
}
