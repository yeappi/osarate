import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { signUpAction } from "@/server/services/auth";

export default function SignUpPage() {
  return (
    <div className="space-y-4">
      <h2 className="h2">新規登録</h2>
      <ActionForm action={signUpAction} submitLabel="登録する" className="flex flex-col gap-2">
        <input name="email" type="email" required placeholder="メールアドレス" className="input" autoComplete="email" />
        <input name="password" type="password" required minLength={8} placeholder="パスワード（8文字以上）" className="input" autoComplete="new-password" />
      </ActionForm>
      <p className="text-sm">
        <Link href="/login" className="link">ログインへ戻る</Link>
      </p>
    </div>
  );
}
