# ARCHITECTURE.md

推されーと MVP の構造・責務・データの流れ。仕様は SPEC.md、作業ルールは AGENTS.md を参照。

## 1. 技術スタック

- Next.js（App Router）+ TypeScript
- Supabase（Postgres / Auth / Storage）— `pachilife` プロジェクトを共有
- ホスティング：Vercel（プレビュー環境で確認してから本番）
- テスト：Vitest（TS）、pgTAP（DB関数、`supabase test db`）

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
  features/             # 機能ごとのUI（profile, book-editor, dex, shop, bag, gifts, ranking, search）
  server/
    services/           # 業務の入口。RPC呼び出しとエラー変換のみ（"use server" アクション）
    queries/            # 読み取り専用の取得関数
    supabase/           # クライアント生成（server / browser / admin）
  domain/               # 純粋関数・型（表示用計算、バリデーション、エラーコード）
  minigame/             # パチ屋：UI と services を自己完結させる
  config/               # 設定の型と取得（値そのものは DB の oshi_settings）
supabase/
  migrations/           # 全DB変更（テーブル・RLS・関数・初期データ）
  tests/                # pgTAP テスト
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

既存アプリと同じ「接頭辞方式」に揃える。独自スキーマにすると Data API の公開スキーマ設定（プロジェクト全体の設定）を変える必要があるため避ける。ストレージは専用バケット `oshi-stickers`。

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
| `oshi_gifts` | ギフト記録（sticker_id UNIQUE → 還元は個体につき一度） |
| `oshi_point_ledger` | ポイント変動履歴（delta, balance_after, reason, ref） |
| `oshi_item_events` | 個体の取得・開封・譲渡履歴 |
| `oshi_charm_ledger` | ユーザー魅力値の増減履歴（期間ランキング用） |
| `oshi_follows` | フォロー |
| `oshi_requests` | 冪等キー（user_id, request_id）と結果 |
| `oshi_pachi_machines` / `oshi_pachi_daily` / `oshi_pachi_secret` | 台・本日の公開統計・非公開設定 |

## 5. 主要 RPC

| 関数 | 内容 |
|---|---|
| `oshi_create_profile` | プロフィール作成＋初期付与 |
| `oshi_claim_login_bonus` | ログインボーナス判定・付与 |
| `oshi_buy_sticker(type, qty, mode, to_user)` | 図鑑購入。mode=self/gift |
| `oshi_buy_listing(listing, mode, to_user)` | SHOP購入 |
| `oshi_open_sticker` | 開封 |
| `oshi_send_gift(sticker, to_user, message)` | 未開封ギフト＋還元抽選 |
| `oshi_send_present(sticker, to_user)` | 開封済みプレゼント（貼付中なら剥がす） |
| `oshi_place_sticker` / `oshi_move_sticker` / `oshi_remove_sticker` | 貼付・移動・剥がし |
| `oshi_set_favorites` / `oshi_set_fav_books` / `oshi_set_profile_bg` | 展示設定 |
| `oshi_follow` / `oshi_unfollow` | フォロー |
| `oshi_pachi_lend` / `oshi_pachi_spin` / `oshi_pachi_cashout` / `oshi_pachi_exchange` | 遊び場 |
| `oshi_admin_*` | 運営操作（`oshi_admins` を確認） |

全更新系 RPC は第1引数に `p_request_id uuid` を取り、`oshi_requests` で冪等化する。

### 共通の内部関数（クライアントから呼べない）

- `_oshi_change_points(user, delta, reason, ref)` — 残高更新＋ledger＋応援力加算。マイナス残高なら例外。
- `_oshi_grant_sticker(user, type, state, source)` — シリアル採番＋個体作成＋図鑑記録＋魅力値加算＋履歴。
- `_oshi_transfer_sticker(sticker, to_user, kind)` — 所有権移動＋貼付・TOP3・背景の解除＋魅力値増減＋履歴。
- `_oshi_setting(key)` — 設定取得。

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
