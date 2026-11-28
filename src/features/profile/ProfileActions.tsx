"use client";

import Link from "next/link";
import { ShareButton } from "@/components/ShareButton";
import { block, report } from "@/client/mutations";
import { useFollowers, useIsBlocked, useMe } from "@/client/queries";
import { ActionForm } from "@/components/ActionForm";
import type { PublicProfile } from "@/domain/types";

/** プロフィールの下の操作：フォロワー一覧・シェア */
export function ProfileActions({ profile }: { profile: PublicProfile }) {
  const followers = useFollowers(profile.user_id);

  return (
    <div className="mt-3 flex items-start justify-between gap-2">
      <details className="flex-1 text-sm">
        <summary className="cursor-pointer text-xs text-sub">フォロワー一覧{followers.data && `（${followers.data.length}）`}</summary>
        {followers.data && followers.data.length === 0 && <p className="mt-1 text-xs text-sub">まだいません</p>}
        <ul className="mt-1 space-y-1">
          {(followers.data ?? []).map((p) => (
            <li key={p.user_id}>
              <Link href={`/u/${p.handle}`} className="link">
                {p.display_name}
              </Link>{" "}
              <span className="text-xs text-sub">@{p.handle}</span>
            </li>
          ))}
        </ul>
      </details>
      <ShareButton path={`/u/${profile.handle}`} title={`${profile.display_name}（@${profile.handle}）のシール帳｜推されーと`} className="btn !min-h-8 shrink-0 text-xs" />
    </div>
  );
}

/** 他人のプロフィールの一番下：ブロックと通報 */
export function SafetyActions({ profile }: { profile: PublicProfile }) {
  const me = useMe();
  const viewerId = me.data?.userId ?? null;
  const isSelf = viewerId === profile.user_id;
  const blocked = useIsBlocked(isSelf ? null : viewerId, profile.user_id);
  return (
    <div className="mt-8">
      {!isSelf && viewerId && (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs text-sub">ブロック・通報</summary>
          <div className="mt-2 space-y-3">
            <ActionForm
              action={block}
              submitLabel={blocked.data ? "ブロックを解除" : "ブロックする"}
              confirm={blocked.data ? undefined : "ブロックすると、この相手からギフト・プレゼントが届かなくなり、フォローも解除されます。"}
            >
              <input type="hidden" name="target" value={profile.user_id} />
              <input type="hidden" name="mode" value={blocked.data ? "unblock" : "block"} />
            </ActionForm>
            <ActionForm action={report} submitLabel="このユーザーを通報" className="flex flex-col gap-1">
              <input type="hidden" name="target" value={profile.user_id} />
              <input name="reason" maxLength={300} placeholder="理由（任意）" className="input w-full" />
            </ActionForm>
          </div>
        </details>
      )}
    </div>
  );
}
