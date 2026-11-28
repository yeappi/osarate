"use client";

import { useEffect, useId, useState } from "react";
import { useFollowing, useMe } from "@/client/queries";
import { sb } from "@/client/supabase";

/**
 * ギフト・プレゼントの宛先入力（フォームの中で使う）。
 * フォロー中の人から選べる。入力したIDの表示名を出して、送り間違いを防ぐ。
 * URL の ?to=@handle があれば最初から入れておく（お礼を返す導線）。
 */
export function RecipientFields({ withMessage }: { withMessage?: boolean }) {
  const listId = useId();
  const me = useMe();
  const following = useFollowing(me.data?.userId ?? null);
  const [to, setTo] = useState("");
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("to");
    if (q) setTo(q.startsWith("@") ? q : `@${q}`);
  }, []);

  // 入力したIDの表示名を確かめる（フォロー中ならその場で、それ以外は少し待ってから問い合わせ）
  useEffect(() => {
    const h = to.replace(/^@/, "").trim();
    setName(null);
    if (!/^[A-Za-z0-9_]{3,20}$/.test(h)) return;
    const f = following.data?.find((p) => p.handle.toLowerCase() === h.toLowerCase());
    if (f) {
      setName(f.display_name);
      return;
    }
    const t = setTimeout(async () => {
      const { data } = await sb().from("oshi_profiles").select("display_name").ilike("handle", h).maybeSingle();
      setName((data?.display_name as string | undefined) ?? "");
    }, 400);
    return () => clearTimeout(t);
  }, [to, following.data]);

  return (
    <div className="flex w-full flex-col gap-1">
      <input
        name="to"
        required
        list={listId}
        placeholder="贈り先 @ユーザーID"
        className="input w-full"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        autoComplete="off"
      />
      <datalist id={listId}>
        {(following.data ?? []).map((p) => (
          <option key={p.user_id} value={`@${p.handle}`}>
            {p.display_name}
          </option>
        ))}
      </datalist>
      {name !== null && (
        <p className={`text-xs ${name ? "text-mint" : "text-accent-ink"}`}>{name ? `→ ${name} さんに贈ります` : "このユーザーは見つかりません"}</p>
      )}
      {withMessage && <input name="message" maxLength={100} placeholder="メッセージ（任意）" className="input w-full" />}
    </div>
  );
}

/** URL の ?to=（お礼を返すときの宛先）。あれば贈る欄を開いておく */
export function useToParam() {
  const [to, setTo] = useState<string | null>(null);
  useEffect(() => {
    setTo(new URLSearchParams(window.location.search).get("to"));
  }, []);
  return to;
}
