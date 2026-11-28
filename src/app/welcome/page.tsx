"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import { Loading } from "@/components/Loading";
import { createProfile, signOut } from "@/client/mutations";
import { useMe } from "@/client/queries";
import { sb } from "@/client/supabase";

const HANDLE_RE = /^[A-Za-z0-9_]{3,20}$/;

// 初回プロフィール作成
export default function WelcomePage() {
  const router = useRouter();
  const me = useMe();
  const [handle, setHandle] = useState("");
  const [name, setName] = useState("");
  const [taken, setTaken] = useState<boolean | null>(null);

  useEffect(() => {
    if (!me.data || !me.fresh) return;
    if (!me.data.userId) router.replace("/login");
    else if (me.data.profile) router.replace("/me");
  }, [me.data, me.fresh, router]);

  // 入力中に、使えるIDかどうかを確かめる
  useEffect(() => {
    setTaken(null);
    if (!HANDLE_RE.test(handle)) return;
    const t = setTimeout(async () => {
      const { data } = await sb().from("oshi_profiles").select("user_id").ilike("handle", handle).maybeSingle();
      setTaken(!!data);
    }, 400);
    return () => clearTimeout(t);
  }, [handle]);

  if (!me.fresh || !me.data?.userId || me.data.profile) return <Loading error={me.error} />;

  const formatOk = HANDLE_RE.test(handle);
  const hint = !handle
    ? "英数字と _（アンダーバー）で3〜20文字。あとから変更できません"
    : !formatOk
      ? "英数字と _ だけ、3〜20文字にしてください"
      : taken === null
        ? "確認中…"
        : taken
          ? "このIDはすでに使われています"
          : "使えます";

  return (
    <main className="mx-auto max-w-sm space-y-5 p-6">
      <div>
        <h1 className="font-round text-2xl font-bold">ようこそ</h1>
        <p className="mt-1 text-sm text-sub">あなたのプロフィールをつくりましょう。</p>
      </div>
      <ActionForm
        action={createProfile}
        submitLabel="つぎへ"
        variant="primary"
        className="flex flex-col gap-4"
        onDone={(r) => r?.ok && router.replace("/starter")}
      >
        <label className="block text-sm">
          <span className="font-bold">表示名</span>
          <span className="ml-2 text-xs text-sub">みんなに見える名前。あとで変えられます</span>
          <input name="display_name" required maxLength={30} value={name} onChange={(e) => setName(e.target.value)} className="input mt-1 w-full" />
        </label>
        <label className="block text-sm">
          <span className="font-bold">ユーザーID</span>
          <span className="ml-2 text-xs text-sub">プロフィールのURLになります</span>
          <div className="mt-1 flex items-center rounded-xl border border-line bg-surface pl-3 focus-within:border-accent">
            <span className="text-sub">@</span>
            <input
              name="handle"
              required
              pattern="[A-Za-z0-9_]{3,20}"
              value={handle}
              onChange={(e) => setHandle(e.target.value.trim())}
              autoCapitalize="off"
              autoCorrect="off"
              className="w-full bg-transparent px-1 py-2 text-sm outline-none"
            />
          </div>
          <span className={`mt-1 block text-xs ${formatOk && taken === false ? "text-mint" : formatOk && taken ? "text-accent-ink" : "text-sub"}`}>{hint}</span>
        </label>
      </ActionForm>
      <button
        className="text-xs text-sub underline"
        onClick={async () => {
          await signOut();
          router.replace("/login");
        }}
      >
        別のアカウントでログインする
      </button>
    </main>
  );
}
