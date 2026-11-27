"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ActionForm } from "@/components/ActionForm";
import { Loading } from "@/components/Loading";
import { createProfile, signOut } from "@/client/mutations";
import { useMe } from "@/client/queries";

// 初回プロフィール作成
export default function WelcomePage() {
  const router = useRouter();
  const me = useMe();

  useEffect(() => {
    if (!me.data || !me.fresh) return;
    if (!me.data.userId) router.replace("/login");
    else if (me.data.profile) router.replace("/me");
  }, [me.data, me.fresh, router]);

  if (!me.fresh || !me.data?.userId || me.data.profile) return <Loading error={me.error} />;

  return (
    <main className="mx-auto max-w-sm space-y-4 p-6">
      <h1 className="font-round text-2xl font-bold">ようこそ</h1>
      <p className="text-sm">プロフィールを作成してください。ユーザーIDはあとから変更できません。</p>
      <ActionForm
        action={createProfile}
        submitLabel="はじめる"
        className="flex flex-col gap-2"
        onDone={(r) => r?.ok && router.replace("/me")}
      >
        <label className="text-sm">
          ユーザーID（英数字と _、3〜20文字）
          <input name="handle" required pattern="[A-Za-z0-9_]{3,20}" className="input w-full" />
        </label>
        <label className="text-sm">
          表示名
          <input name="display_name" required maxLength={30} className="input w-full" />
        </label>
      </ActionForm>
      <button
        className="text-sm underline"
        onClick={async () => {
          await signOut();
          router.replace("/login");
        }}
      >
        ログアウト
      </button>
    </main>
  );
}
