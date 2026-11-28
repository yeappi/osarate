// DB関数が raise するエラーコード → 画面に出す文言
// コードを追加したら supabase/migrations 側と揃えること

export const ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: "ログインしてください",
  anonymous_not_allowed: "このアカウントでは利用できません",
  profile_required: "プロフィールを作成してください",
  profile_exists: "プロフィールは作成済みです",
  invalid_handle: "ユーザーIDは英数字と _ の3〜20文字にしてください",
  handle_taken: "そのユーザーIDは使われています",
  invalid_display_name: "表示名は1〜30文字にしてください",
  bio_too_long: "自己紹介は200文字以内にしてください",
  forbidden: "権限がありません",
  request_id_required: "通信エラーが発生しました。やり直してください",
  request_id_reused: "通信エラーが発生しました。画面を更新してください",
  request_in_progress: "処理中です。少し待ってから確認してください",
  insufficient_points: "ポイントが足りません。はじめてのクエスト・ログインボーナス・パチ屋で貯められます",
  insufficient_balls: "玉が足りません",
  not_purchasable: "このシールは購入できません",
  not_on_sale: "販売期間外です",
  sold_out: "売り切れです",
  purchase_limit: "購入上限に達しています",
  invalid_qty: "枚数が正しくありません",
  invalid_amount: "数量が正しくありません",
  book_not_giftable: "シール帳はギフトにできません",
  not_owner: "所持していないアイテムです",
  gift_requires_sealed: "ギフトにできるのは未開封のシールだけです",
  already_gifted: "一度ギフトに使われたシールは再度ギフトにできません",
  present_requires_opened: "プレゼントできるのは開封済みのシールだけです",
  cannot_gift_self: "自分には贈れません",
  quest_not_found: "クエストが見つかりません",
  quest_not_done: "まだ達成していません",
  quest_already_claimed: "受け取り済みです",
  invalid_starter: "選べないアイテムです",
  starter_already_chosen: "初期アイテムは選択済みです",
  blocked: "この相手には贈れません",
  cannot_block_self: "自分はブロックできません",
  cannot_report_self: "自分は通報できません",
  too_many_reports: "通報の回数が多すぎます。時間をおいてください",
  cannot_like_own: "自分のシール帳にはいいねできません",
  book_not_empty: "シールが貼ってあるシール帳はプレゼントできません。先に剥がしてください",
  user_not_found: "ユーザーが見つかりません",
  message_too_long: "メッセージが長すぎます",
  place_requires_opened: "未開封のシールは貼れません。先に開封してください",
  invalid_page: "ページが正しくありません",
  out_of_page: "はみ出しています。位置を調整してください",
  too_many: "選べる数を超えています",
  duplicate_item: "同じアイテムが重複しています",
  cannot_follow_self: "自分はフォローできません",
  machine_not_found: "台が見つかりません",
  invalid_ranking: "ランキングの指定が正しくありません",
  sticker_type_not_found: "シールが見つかりません",
  book_type_not_found: "シール帳が見つかりません",
  invalid_kind: "種類の指定が正しくありません",
};

/** Supabase のエラーメッセージ等からエラーコードを取り出す */
export function extractErrorCode(message: string | null | undefined): string | null {
  if (!message) return null;
  const trimmed = message.trim();
  if (trimmed in ERROR_MESSAGES) return trimmed;
  const hit = Object.keys(ERROR_MESSAGES).find((code) => new RegExp(`\\b${code}\\b`).test(trimmed));
  return hit ?? null;
}

export function toUserMessage(message: string | null | undefined): string {
  const code = extractErrorCode(message);
  return code ? ERROR_MESSAGES[code] : "エラーが発生しました";
}
