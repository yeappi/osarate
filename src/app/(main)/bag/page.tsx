"use client";

import Link from "next/link";
import { useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import { Loading } from "@/components/Loading";
import { Sheet } from "@/components/Sheet";
import { StickerView } from "@/components/StickerView";
import { openSticker, sendGift } from "@/client/mutations";
import { useMe, useStickers } from "@/client/queries";
import { groupByType } from "@/domain/group";
import type { Sticker } from "@/domain/types";
import { RecipientFields, useToParam } from "@/features/gift/RecipientFields";

// バッグ：未開封のシール。開封して手持ちにするか、未開封のままギフトに使う
export default function BagPage() {
  const me = useMe();
  const uid = me.data?.userId ?? null;
  const sealed = useStickers(uid, "sealed");
  const toParam = useToParam();
  const groups = groupByType(sealed.data ?? [], (x) => (x.gifted ? "g" : ""));
  const [opened, setOpened] = useState<Sticker | null>(null);

  return (
    <div>
      <h1 className="h2 mt-1">バッグ（未開封のシール）</h1>
      <div className="mb-3 rounded-2xl bg-muted px-3 py-2 text-xs leading-relaxed text-sub">
        <b className="text-ink">開封</b>すると手持ちに入り、シール帳に貼れます。
        <br />
        <b className="text-ink">未開封のまま贈る（ギフト）</b>と、受け取った人にポイントが還元されることがあります。開封済みのシールは「プレゼント」として贈れます（還元なし）。
      </div>
      {!sealed.data ? (
        <Loading error={sealed.error} />
      ) : sealed.data.length === 0 ? (
        <p className="card text-center text-sm text-sub">未開封のシールはありません</p>
      ) : (
        <ul className="space-y-2">
          {groups.map(({ first: s, count }) => (
            <li key={s.id} className="card space-y-2">
              <div className="flex items-center gap-3">
                <StickerView name={s.type.name} imagePath={s.type.image_path} w={s.type.width} h={s.type.height} fixed={56} sealed />
                <div className="flex-1 text-sm">
                  <span className="font-bold">{s.type.name}</span> {count > 1 && <span className="num text-xs text-sub">×{count}</span>}
                  <div className="text-xs text-sub">{s.gifted ? "もらったギフト（もう一度は贈れません）" : `魅力値 +${s.type.charm}`}</div>
                </div>
                <ActionForm
                  action={openSticker}
                  submitLabel="開封する"
                  variant="primary"
                  confirm={`${s.type.name} を開封しますか？\n開封すると手持ちに入って、シール帳に貼れるようになります。`}
                  confirmLabel="開封する"
                  onDone={(r) => r?.ok && setOpened(s)}
                >
                  <input type="hidden" name="stickerId" value={s.id} />
                </ActionForm>
              </div>
              {!s.gifted && (
                <details open={!!toParam}>
                  <summary className="cursor-pointer text-xs text-sub">未開封のまま贈る（ギフト）</summary>
                  <ActionForm action={sendGift} submitLabel="1枚ギフトする" variant="accent" confirm={`${s.type.name} を1枚ギフトしますか？`} className="mt-1 flex flex-col gap-1">
                    <input type="hidden" name="stickerId" value={s.id} />
                    <RecipientFields withMessage />
                  </ActionForm>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}

      <Sheet open={!!opened} onClose={() => setOpened(null)}>
        {opened && (
          <div className="flex flex-col items-center gap-4 pb-2 text-center">
            <p className="font-round text-sm font-bold text-accent-ink">開封しました！</p>
            <div className="paper flex min-h-52 w-full items-center justify-center rounded-[22px] p-6">
              <div className="animate-pop">
                <StickerView
                  name={opened.type.name}
                  imagePath={opened.type.image_path}
                  w={opened.type.width}
                  h={opened.type.height}
                  scale={Math.min(200, Math.max(opened.type.width, opened.type.height) * 1.6) / Math.max(opened.type.width, opened.type.height)}
                />
              </div>
            </div>
            <p className="font-bold">{opened.type.name}</p>
            <div className="flex w-full gap-2">
              <button className="btn flex-1" onClick={() => setOpened(null)}>
                続けて開ける
              </button>
              <Link href="/stickers" className="btn-primary flex-1">
                シール帳に貼る
              </Link>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
