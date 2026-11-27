import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { signInAction } from "@/server/services/auth";

export default function LoginPage() {
  return (
    <div className="space-y-4">
      <h2 className="h2">ログイン</h2>
      <ActionForm action={signInAction} submitLabel="ログイン" className="flex flex-col gap-2">
        <input name="email" type="email" required placeholder="メールアドレス" className="input" autoComplete="email" />
        <input name="password" type="password" required placeholder="パスワード" className="input" autoComplete="current-password" />
      </ActionForm>
      <p className="text-sm">
        <Link href="/signup" className="link">新規登録</Link>　/　<Link href="/reset" className="link">パスワードを忘れた</Link>
      </p>
    </div>
  );
}
