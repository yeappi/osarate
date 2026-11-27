/** ギフト・プレゼントの宛先入力（フォームの中で使う） */
export function RecipientFields({ withMessage }: { withMessage?: boolean }) {
  return (
    <>
      <input name="to" required placeholder="贈り先 @ユーザーID" className="input w-40" />
      {withMessage && <input name="message" maxLength={100} placeholder="メッセージ（任意）" className="input flex-1" />}
    </>
  );
}
