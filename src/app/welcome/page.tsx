import { redirect } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { getMe } from "@/server/queries/me";
import { createProfileAction } from "@/server/services/profile";
import { signOutAction } from "@/server/services/auth";

// 初回プロフィール作成
export default async function WelcomePage() {
  const me = await getMe();
  if (!me.user) redirect("/login");
  if (me.profile) redirect("/me");

  return (
    <main className="mx-auto max-w-sm space-y-4 p-6">
      <h1 className="text-2xl font-bold">ようこそ</h1>
      <p className="text-sm">プロフィールを作成してください。ユーザーIDはあとから変更できません。</p>
      <ActionForm action={createProfileAction} submitLabel="はじめる" className="flex flex-col gap-2">
        <label className="text-sm">
          ユーザーID（英数字と _、3〜20文字）
          <input name="handle" required pattern="[A-Za-z0-9_]{3,20}" className="input w-full" />
        </label>
        <label className="text-sm">
          表示名
          <input name="display_name" required maxLength={30} className="input w-full" />
        </label>
      </ActionForm>
      <form action={signOutAction}>
        <button className="text-sm underline">ログアウト</button>
      </form>
    </main>
  );
}
