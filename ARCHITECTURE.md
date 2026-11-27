# ARCHITECTURE.md

推されーと MVP の構造・責務・データの流れ。仕様は SPEC.md、作業ルールは AGENTS.md を参照。

## 1. 技術スタック

- Next.js（App Router）+ TypeScript
- Supabase（Postgres / Auth / Storage）— `pachilife` プロジェクトを共有
- ホスティング：Vercel（プレビュー環境で確認してから本番）
- テスト：Vitest（TS）、DB関数は素のSQLテスト（`supabase/tests/*_test.sql`、`bash scripts/test-db.sh` でローカル実行）

## 2. 設計の芯

**ポイントと所有権に関わる処理は、すべて Postgres の関数（RPC）で行う。**

- 1関数＝1トランザクション。残高更新・所有権移動・履歴記録を同じ関数内で行う。
- 関数は `security definer` で、冒頭で `auth.uid()` を確認する。
- クライアント（anon / authenticated ロール）には **更新系テーブルへの INSERT/UPDATE/DELETE 権限を与えない**。読み取りは RLS で必要な範囲のみ。
- 将来 Discord から操作する場合も同じ関数を呼ぶ（その時に「サーバー専用ラッパー関数」を追加する。今は作らない）。

これにより、UI を作り直しても業務ロジックは壊れず、ChatGPT／Claude どちらが UI を触っても安全側に倒れる。

## 3. ディレクトリ構成

```
src/
  app/                  # ルーティングと画面（UIのみ）
    (auth)/ (main)/ admin/ api/
  components/           # 汎用UI部品（ボタン、モーダル、シール表示など）
  features/             # 機能ごとのUI部品（profile, book-editor, dex, gift）
  server/
    services/           # 業務の入口。RPC呼び出しとエラー変換のみ（"use server" アクション）
    queries/            # 読み取り専用の取得関数
    supabase/           # クライアント生成（server / browser / admin）
  domain/               # 純粋関数・型（表示用計算、バリデーション、エラーコード）
  minigame/             # パチ屋：UI と services を自己完結させる
  config/               # 設定の型と取得（値そのものは DB の oshi_settings）
supabase/
  migrations/           # 全DB変更（テーブル・RLS・関数・初期データ）
  tests/                # SQLテスト（BEGIN…ROLLBACK で自己完結）と _supabase_stub.sql
scripts/
  test-db.sh            # 使い捨てPostgresで migrations＋SQLテストを実行
```

### 依存の向き

```
app / features / minigame(UI)
        ↓
server/services , server/queries
        ↓
Supabase RPC（DB関数）  ← 重要ロジックはここ
```

- UI → services のみ呼ぶ。UI から Supabase を直接呼ばない（読み取りも queries 経由）。
- `domain/` はどこからでも使ってよいが、DBやReactに依存しない。

## 4. DB（すべて `public` スキーマ、接頭辞 `oshi_`）

既存アプリと同じ「接頭辞方式」に揃える。独自スキーマにすると Data API の公開スキーマ設定（プロジェクト全体の設定）を変える必要があるため避ける。ストレージは専用バケット `oshi-stickers`（公開読み取り・2MB・画像のみ。書き込みは運営画面から Service Role で行い、storage.objects にポリシーは追加しない）。

| テーブル | 役割 |
|---|---|
| `oshi_settings` | 数値設定（key / jsonb） |
| `oshi_profiles` | アプリ固有プロフィール。points, balls, charm_total, support_total, ログイン連続日数 |
| `oshi_admins` | 運営ユーザー |
| `oshi_dexes` | 図鑑（main / elite） |
| `oshi_sticker_types` | シール種別 |
| `oshi_book_types` | シール帳種別 |
| `oshi_stickers` | シール個体（owner, type, serial, state=sealed/opened, gifted_once） |
| `oshi_books` | シール帳個体 |
| `oshi_placements` | シール帳への貼付（sticker_id UNIQUE → 二重貼付を DB で禁止） |
| `oshi_profile_favorites` | TOP3（slot 1-3） |
| `oshi_profile_fav_books` | お気に入りシール帳（slot 1-3） |
| `oshi_profile_bg` | 背景装飾（sticker 参照・座標） |
| `oshi_dex_progress` | 図鑑の「一度でも所持した」記録 |
| `oshi_shop_listings` | SHOP・景品交換所の出品 |
| `oshi_point_ledger` | ポイント変動履歴（delta, balance_after, reason, ref） |
| `oshi_item_events` | 個体の取得・開封・譲渡履歴 |
| `oshi_charm_ledger` | ユーザー魅力値の増減履歴（期間ランキング用。クライアント非公開） |
| `oshi_follows` | フォロー |
| `oshi_requests` | 冪等キー（user_id, request_id）と結果 |
| `oshi_transfers` | ギフト・プレゼントの記録（ギフトは sticker_id 部分UNIQUE＝還元1回） |
| `oshi_ball_ledger` | 玉の変動履歴 |
| `oshi_listing_purchases` | 出品ごとの購入数（1人あたり上限用） |
| `oshi_pachi_machines` / `oshi_pachi_daily` / `oshi_pachi_secret` | 台・本日の公開統計・非公開設定 |

## 5. 主要 RPC

実体は `supabase/migrations/*_oshi_rpc.sql` / `*_oshi_pachi.sql`。引数の詳細はそちらを正とする。

| 関数 | 内容 |
|---|---|
| `oshi_create_profile(handle, display_name)` | プロフィール作成＋初期pt・初期シール帳 |
| `oshi_update_profile(display_name, bio, avatar_url)` | プロフィール編集 |
| `oshi_my_wallet()` | 本人の pt・玉・連続ログイン・ログボ可否・運営か |
| `oshi_claim_login_bonus()` | ログボ（日付で冪等） |
| `oshi_buy_sticker(req, type, qty, open, gift_to, msg)` | 図鑑購入。gift_to 指定で購入＋ギフト |
| `oshi_buy_listing(req, listing, open, gift_to, msg)` | SHOP購入 |
| `oshi_open_sticker(sticker)` | 開封 |
| `oshi_send_gift(req, sticker, to, msg)` | 未開封ギフト＋還元抽選 |
| `oshi_send_present(req, sticker, to)` | 開封済みプレゼント（貼付・TOP3・背景は自動解除） |
| `oshi_place_sticker(sticker, book, page, x, y)` / `oshi_remove_sticker` | 貼る・移動・剥がす |
| `oshi_set_favorites(ids[])` / `oshi_set_fav_books(ids[])` / `oshi_set_profile_bg(json)` | 展示（全置き換え） |
| `oshi_follow` / `oshi_unfollow` | フォロー |
| `oshi_dex_view(user, dex)` | 図鑑の収集状況（非表示シールは所持歴がある場合のみ） |
| `oshi_ranking(metric, period, me)` | ランキング（上位＋自分の行。列は rnk/user_id/handle/…/value） |
| `oshi_pachi_lend` / `_spin` / `_cashout` / `_exchange` | 遊び場 |
| `oshi_admin_*` | 運営（`oshi_admins` 登録者のみ） |

- `req`（p_request_id）を取る関数は冪等。同じIDの再送は前回結果を返す。同じIDを別の関数に使うと `request_id_reused`。
- エラーは `raise exception '<コード>'`（例：`insufficient_points`, `not_owner`）。UI 向け文言は `src/domain/errors.ts` で対応付ける。
- `oshi_profiles` は列権限で `points` / `balls` / ログイン情報を隠している。クライアントで `select *` は使えない（列を明示する）。

### 共通の内部関数（クライアントから呼べない）

- `_oshi_change_points` / `_oshi_change_balls` / `_oshi_change_charm` — 残高更新＋履歴。不足なら例外。
- `_oshi_grant_sticker` / `_oshi_grant_book` — シリアル採番・図鑑記録・魅力値・履歴。
- `_oshi_transfer_sticker` — 所有権移動＋展示解除＋魅力値移動＋履歴。
- `_oshi_do_gift` — 還元抽選＋移転＋記録。
- `_oshi_idem_start` / `_oshi_idem_finish` — 冪等キー。
- `_oshi_setting` / `_oshi_today` / `_oshi_period_start` — 設定・日付。

## 5.5 画面からの呼び出し方

- フォーム操作はすべて `components/ActionForm.tsx` 経由。Server Action（`(prev, formData) => ActionState`）を呼び、結果メッセージを表示、成功時に `router.refresh()`。
- **冪等キー**：ActionForm がフォームごとに `requestId` を自動で付け、成功するまで同じ値を使い回す（失敗後の再送・連打は同じキー）。成功したら新しいキーに切り替える。
- シール帳エディタ・背景エディタ（クライアント部品）は `placeSticker` / `removeSticker` / `saveProfileBg` を直接呼ぶ。
- 宛先は画面では `@handle` で入力し、Server Action 側で `user_id` に変換する。
- RPC のエラーコードは `server/action.ts` の `callRpc` で日本語に変換される。

## 6. データの流れ（例：SHOPでギフト購入）

```
[SHOP画面] 「ギフトする」→ 相手選択 → 確定
   → services.shop.buyListing({listingId, mode:'gift', to, requestId})
   → rpc oshi_buy_listing
       1. 冪等チェック
       2. 在庫・期間・上限チェック（行ロック）
       3. _oshi_change_points(送り手, -価格, 'purchase')   ※応援力+価格
       4. _oshi_grant_sticker(送り手, 未開封)
       5. oshi_send_gift 相当の処理（還元抽選 → _oshi_change_points(受け手, +還元)）
       6. _oshi_transfer_sticker(→受け手)
       7. 結果を oshi_requests に保存して返す
   → 画面更新
```

## 7. 認証・権限

- `@supabase/ssr` で Cookie セッション。`src/proxy.ts`（Next.js 16 で middleware から改名）で未ログインを `/login` へ、プロフィール未作成を `/welcome` へ。
- サーバー用クライアントは利用者の JWT で動かす（RLS が効く）。Service Role Key は運営画面の画像アップロード等、サーバー側の限られた箇所のみで使用し、クライアントに出さない。

## 8. 外部連携の置き場所

- Discord：将来 `src/integrations/discord/`（または別リポジトリ）。本体からは参照しない。
- パチ屋：`src/minigame/` に閉じ込める。本体は `oshi_pachi_*` RPC と玉残高以外を知らない。
