-- =====================================================================
-- 推されーと：コアテーブル・RLS・設定値・内部関数
-- 方針：
--   * すべて public スキーマ、接頭辞 oshi_（既存アプリと同じ方式）
--   * クライアント(anon/authenticated)には書き込み権限を一切与えない
--   * 書き込みは security definer の RPC のみ（後続マイグレーション）
-- =====================================================================

-- ---------------------------------------------------------------------
-- 設定値
-- ---------------------------------------------------------------------
create table public.oshi_settings (
  key        text primary key,
  value      jsonb not null,
  note       text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- ユーザー
-- ---------------------------------------------------------------------
create table public.oshi_profiles (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  handle          text not null check (handle ~ '^[A-Za-z0-9_]{3,20}$'),
  display_name    text not null check (char_length(display_name) between 1 and 30),
  avatar_url      text,
  bio             text not null default '' check (char_length(bio) <= 200),
  points          bigint not null default 0 check (points >= 0),
  balls           bigint not null default 0 check (balls >= 0),
  charm_total     bigint not null default 0,
  support_total   bigint not null default 0,
  login_streak    int not null default 0,
  last_login_date date,
  created_at      timestamptz not null default now()
);
create unique index oshi_profiles_handle_lower_idx on public.oshi_profiles (lower(handle));

create table public.oshi_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.oshi_follows (
  follower_id uuid not null references public.oshi_profiles(user_id) on delete cascade,
  followee_id uuid not null references public.oshi_profiles(user_id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index oshi_follows_followee_idx on public.oshi_follows (followee_id);

-- ---------------------------------------------------------------------
-- マスタ：図鑑・シール種別・シール帳種別
-- ---------------------------------------------------------------------
create table public.oshi_dexes (
  id   text primary key,               -- 'main' / 'elite'
  name text not null,
  sort int  not null default 0
);

create table public.oshi_sticker_types (
  id              bigint generated always as identity primary key,
  dex_id          text not null references public.oshi_dexes(id),
  name            text not null,
  image_path      text,                -- ストレージ oshi-stickers 内のパス
  width           int  not null check (width between 1 and 360),
  height          int  not null check (height between 1 and 480),
  charm           int  not null check (charm >= 0),
  price_override  int  check (price_override >= 0), -- null なら charm × price_per_charm
  kind            text not null default 'basic' check (kind in ('basic','special')),
  rarity          text not null default 'common',
  dex_visibility  text not null default 'always' check (dex_visibility in ('always','owned')),
  dex_purchasable boolean not null default false,
  max_supply      int check (max_supply > 0),
  issued_count    int not null default 0,
  is_active       boolean not null default true,
  sort            int not null default 0,
  created_at      timestamptz not null default now()
);

create table public.oshi_book_types (
  id             bigint generated always as identity primary key,
  name           text not null,
  page_count     int  not null check (page_count between 1 and 50),
  page_w         int  not null default 360,
  page_h         int  not null default 480,
  theme          text not null default 'plain',
  charm          int  not null default 0 check (charm >= 0),
  price_override int  check (price_override >= 0),
  issued_count   int  not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 所持品（個体）
-- ---------------------------------------------------------------------
create table public.oshi_stickers (
  id          uuid primary key default gen_random_uuid(),
  type_id     bigint not null references public.oshi_sticker_types(id),
  owner_id    uuid not null references public.oshi_profiles(user_id) on delete cascade,
  serial_no   int not null,
  state       text not null default 'sealed' check (state in ('sealed','opened')),
  gifted      boolean not null default false,  -- 一度ギフトに使われたら true（再ギフト不可）
  acquired_at timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  unique (type_id, serial_no)
);
create index oshi_stickers_owner_idx on public.oshi_stickers (owner_id, state);

create table public.oshi_books (
  id          uuid primary key default gen_random_uuid(),
  type_id     bigint not null references public.oshi_book_types(id),
  owner_id    uuid not null references public.oshi_profiles(user_id) on delete cascade,
  serial_no   int not null,
  acquired_at timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  unique (type_id, serial_no)
);
create index oshi_books_owner_idx on public.oshi_books (owner_id);

-- シール帳への貼付：sticker_id が主キー → 1枚を複数箇所に貼れない
create table public.oshi_placements (
  sticker_id uuid primary key references public.oshi_stickers(id) on delete cascade,
  book_id    uuid not null references public.oshi_books(id) on delete cascade,
  page       int  not null check (page >= 1),
  x          int  not null check (x >= 0),
  y          int  not null check (y >= 0),
  placed_at  timestamptz not null default now()
);
create index oshi_placements_book_idx on public.oshi_placements (book_id, page);

-- 展示（参照のみ。保管やシール帳からは消えない）
create table public.oshi_profile_favorites (
  user_id    uuid not null references public.oshi_profiles(user_id) on delete cascade,
  slot       smallint not null check (slot between 1 and 3),
  sticker_id uuid not null references public.oshi_stickers(id) on delete cascade,
  primary key (user_id, slot),
  unique (user_id, sticker_id)
);

create table public.oshi_profile_fav_books (
  user_id uuid not null references public.oshi_profiles(user_id) on delete cascade,
  slot    smallint not null check (slot between 1 and 3),
  book_id uuid not null references public.oshi_books(id) on delete cascade,
  primary key (user_id, slot),
  unique (user_id, book_id)
);

create table public.oshi_profile_bg (
  user_id    uuid not null references public.oshi_profiles(user_id) on delete cascade,
  sticker_id uuid not null references public.oshi_stickers(id) on delete cascade,
  x          int not null check (x >= 0),
  y          int not null check (y >= 0),
  primary key (user_id, sticker_id)
);

-- 図鑑：一度でも所持したことがある記録
create table public.oshi_dex_progress (
  user_id           uuid not null references public.oshi_profiles(user_id) on delete cascade,
  type_id           bigint not null references public.oshi_sticker_types(id),
  first_acquired_at timestamptz not null default now(),
  primary key (user_id, type_id)
);

-- ---------------------------------------------------------------------
-- SHOP / 景品交換所
-- ---------------------------------------------------------------------
create table public.oshi_shop_listings (
  id              bigint generated always as identity primary key,
  venue           text not null check (venue in ('shop','prize')), -- prize = パチ屋景品（価格は玉）
  sticker_type_id bigint references public.oshi_sticker_types(id),
  book_type_id    bigint references public.oshi_book_types(id),
  price           int  not null check (price >= 0),
  stock           int  check (stock >= 0),
  sold_count      int  not null default 0,
  per_user_limit  int  check (per_user_limit > 0),
  starts_at       timestamptz,
  ends_at         timestamptz,
  is_active       boolean not null default true,
  sort            int not null default 0,
  created_at      timestamptz not null default now(),
  check ((sticker_type_id is null) <> (book_type_id is null))
);

create table public.oshi_listing_purchases (
  listing_id bigint not null references public.oshi_shop_listings(id) on delete cascade,
  user_id    uuid   not null references public.oshi_profiles(user_id) on delete cascade,
  qty        int    not null default 0,
  primary key (listing_id, user_id)
);

-- ---------------------------------------------------------------------
-- ギフト・プレゼント
-- ---------------------------------------------------------------------
create table public.oshi_transfers (
  id         bigint generated always as identity primary key,
  kind       text not null check (kind in ('gift','present')),
  sticker_id uuid not null references public.oshi_stickers(id) on delete cascade,
  from_user  uuid not null references public.oshi_profiles(user_id) on delete cascade,
  to_user    uuid not null references public.oshi_profiles(user_id) on delete cascade,
  message    text not null default '',
  base_price int,
  rate_pct   int,
  reward     int not null default 0,
  created_at timestamptz not null default now()
);
-- ギフト還元は個体につき一度限り（DBで保証）
create unique index oshi_transfers_gift_once_idx on public.oshi_transfers (sticker_id) where kind = 'gift';
create index oshi_transfers_to_idx on public.oshi_transfers (to_user, created_at desc);
create index oshi_transfers_from_idx on public.oshi_transfers (from_user, created_at desc);

-- ---------------------------------------------------------------------
-- 履歴
-- ---------------------------------------------------------------------
create table public.oshi_point_ledger (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.oshi_profiles(user_id) on delete cascade,
  delta         bigint not null,
  balance_after bigint not null,
  reason        text not null,
  is_support    boolean not null default false, -- 応援力に加算される消費か
  ref_type      text,
  ref_id        text,
  created_at    timestamptz not null default now()
);
create index oshi_point_ledger_user_idx on public.oshi_point_ledger (user_id, created_at desc);
create index oshi_point_ledger_support_idx on public.oshi_point_ledger (created_at) where is_support;

create table public.oshi_ball_ledger (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.oshi_profiles(user_id) on delete cascade,
  delta         bigint not null,
  balance_after bigint not null,
  reason        text not null,
  ref_id        text,
  created_at    timestamptz not null default now()
);
create index oshi_ball_ledger_user_idx on public.oshi_ball_ledger (user_id, created_at desc);

create table public.oshi_charm_ledger (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.oshi_profiles(user_id) on delete cascade,
  delta      bigint not null,
  reason     text not null,
  created_at timestamptz not null default now()
);
create index oshi_charm_ledger_created_idx on public.oshi_charm_ledger (created_at);

create table public.oshi_item_events (
  id         bigint generated always as identity primary key,
  item_kind  text not null check (item_kind in ('sticker','book')),
  item_id    uuid not null,
  event      text not null,   -- acquire / open / gift / present
  source     text,            -- dex / shop / prize / admin / signup / gift / present
  from_user  uuid,
  to_user    uuid,
  created_at timestamptz not null default now()
);
create index oshi_item_events_item_idx on public.oshi_item_events (item_id, created_at);

-- 冪等キー
create table public.oshi_requests (
  user_id    uuid not null,
  request_id uuid not null,
  fn         text not null,
  result     jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, request_id)
);

-- =====================================================================
-- 権限と RLS
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'oshi_settings','oshi_profiles','oshi_admins','oshi_follows','oshi_dexes',
    'oshi_sticker_types','oshi_book_types','oshi_stickers','oshi_books','oshi_placements',
    'oshi_profile_favorites','oshi_profile_fav_books','oshi_profile_bg','oshi_dex_progress',
    'oshi_shop_listings','oshi_listing_purchases','oshi_transfers','oshi_point_ledger',
    'oshi_ball_ledger','oshi_charm_ledger','oshi_item_events','oshi_requests'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- 公開して良い読み取り（誰でも／ログインユーザー）
do $$
declare t text;
begin
  foreach t in array array[
    'oshi_settings','oshi_follows','oshi_dexes','oshi_sticker_types','oshi_book_types',
    'oshi_stickers','oshi_books','oshi_placements','oshi_profile_favorites',
    'oshi_profile_fav_books','oshi_profile_bg','oshi_dex_progress','oshi_shop_listings'
  ] loop
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('create policy %I on public.%I for select using (true)', t || '_read', t);
  end loop;
end $$;

-- プロフィール：残高(points/balls)・ログイン情報は列権限で隠す。本人の残高は RPC oshi_my_wallet で返す
grant select (user_id, handle, display_name, avatar_url, bio, charm_total, support_total, created_at)
  on public.oshi_profiles to anon, authenticated;
create policy oshi_profiles_read on public.oshi_profiles for select using (true);

-- 本人のみ読める
grant select on public.oshi_admins, public.oshi_listing_purchases, public.oshi_transfers,
  public.oshi_point_ledger, public.oshi_ball_ledger to authenticated;
create policy oshi_admins_self on public.oshi_admins for select to authenticated
  using (user_id = (select auth.uid()));
create policy oshi_listing_purchases_self on public.oshi_listing_purchases for select to authenticated
  using (user_id = (select auth.uid()));
create policy oshi_transfers_party on public.oshi_transfers for select to authenticated
  using (from_user = (select auth.uid()) or to_user = (select auth.uid()));
create policy oshi_point_ledger_self on public.oshi_point_ledger for select to authenticated
  using (user_id = (select auth.uid()));
create policy oshi_ball_ledger_self on public.oshi_ball_ledger for select to authenticated
  using (user_id = (select auth.uid()));
-- oshi_charm_ledger / oshi_item_events / oshi_requests：クライアントからは読めない（ポリシーなし）

-- =====================================================================
-- 設定値（初期値）。数値の調整はここではなく oshi_settings の UPDATE で行う
-- =====================================================================
insert into public.oshi_settings (key, value, note) values
  ('timezone',              '"Asia/Tokyo"', '日付の区切り'),
  ('login_bonus_by_streak', '[50,60,70,85,100]', '連続日数ごとの付与pt。最後の値を以降維持'),
  ('signup_points',         '3000', 'プロフィール作成時の付与pt（仮）'),
  ('signup_book_type_id',   'null', 'プロフィール作成時に配るシール帳種別ID'),
  ('price_per_charm',       '10', '基本売値 = シール魅力値 × この値'),
  ('gift_return_table',     '[{"rate":0,"weight":45},{"rate":10,"weight":25},{"rate":30,"weight":15},{"rate":100,"weight":10},{"rate":200,"weight":4},{"rate":500,"weight":1}]', 'ギフト還元率(%)の抽選表。平均30%'),
  ('gift_message_max',      '100', 'ギフトメッセージ最大文字数'),
  ('dex_buy_max_qty',       '10', '図鑑購入の1回あたり最大枚数'),
  ('favorites_max',         '3', 'TOP3の枚数'),
  ('fav_books_max',         '3', 'お気に入りシール帳の冊数'),
  ('profile_bg_max',        '20', 'プロフィール背景に置けるシール数'),
  ('profile_bg_canvas',     '{"w":360,"h":480}', 'プロフィール背景の座標系'),
  ('ranking_limit',         '100', 'ランキング表示人数'),
  ('rounding',              '"floor"', '端数処理（全計算で切り捨て）');

-- =====================================================================
-- 内部関数（_oshi_*）：クライアントから実行不可
-- =====================================================================

create function public._oshi_setting(p_key text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select value from public.oshi_settings where key = p_key
$$;

create function public._oshi_setting_int(p_key text) returns bigint
language sql stable security definer set search_path = '' as $$
  select (value #>> '{}')::bigint from public.oshi_settings where key = p_key
$$;

create function public._oshi_today() returns date
language sql stable security definer set search_path = '' as $$
  select (now() at time zone (public._oshi_setting('timezone') #>> '{}'))::date
$$;

-- 期間の開始時刻（timezone 基準）。p_period: day / week / month / all
create function public._oshi_period_start(p_period text) returns timestamptz
language plpgsql stable security definer set search_path = '' as $$
declare
  v_tz text := public._oshi_setting('timezone') #>> '{}';
  v_local timestamp := now() at time zone v_tz;
begin
  return case p_period
    when 'day'   then date_trunc('day',   v_local) at time zone v_tz
    when 'week'  then date_trunc('week',  v_local) at time zone v_tz   -- 月曜始まり
    when 'month' then date_trunc('month', v_local) at time zone v_tz
    when 'all'   then '-infinity'::timestamptz
    else null end;
end $$;

-- ログイン中かつプロフィール作成済みのユーザーIDを返す
create function public._oshi_require_profile() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from public.oshi_profiles where user_id = v_uid) then
    raise exception 'profile_required';
  end if;
  return v_uid;
end $$;

create function public._oshi_require_admin() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or not exists (select 1 from public.oshi_admins where user_id = v_uid) then
    raise exception 'forbidden';
  end if;
  return v_uid;
end $$;

-- 冪等：初回なら null を返し処理続行、再送なら保存済み結果を返す
create function public._oshi_idem_start(p_uid uuid, p_request_id uuid, p_fn text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_result jsonb; v_fn text;
begin
  if p_request_id is null then raise exception 'request_id_required'; end if;
  insert into public.oshi_requests (user_id, request_id, fn) values (p_uid, p_request_id, p_fn)
    on conflict do nothing;
  if found then return null; end if;
  select fn, result into v_fn, v_result from public.oshi_requests
    where user_id = p_uid and request_id = p_request_id;
  if v_fn <> p_fn then raise exception 'request_id_reused'; end if;
  if v_result is null then raise exception 'request_in_progress'; end if;
  return v_result;
end $$;

create function public._oshi_idem_finish(p_uid uuid, p_request_id uuid, p_result jsonb) returns jsonb
language sql security definer set search_path = '' as $$
  update public.oshi_requests set result = p_result
    where user_id = p_uid and request_id = p_request_id
  returning p_result
$$;

-- ポイント増減（残高不足なら例外）。p_is_support=true の消費は応援力に加算
create function public._oshi_change_points(
  p_uid uuid, p_delta bigint, p_reason text,
  p_ref_type text default null, p_ref_id text default null, p_is_support boolean default false
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_balance bigint;
begin
  if p_delta = 0 then
    select points into v_balance from public.oshi_profiles where user_id = p_uid;
    return v_balance;
  end if;
  update public.oshi_profiles
     set points = points + p_delta,
         support_total = support_total + case when p_is_support and p_delta < 0 then -p_delta else 0 end
   where user_id = p_uid and points + p_delta >= 0
  returning points into v_balance;
  if not found then raise exception 'insufficient_points'; end if;
  insert into public.oshi_point_ledger (user_id, delta, balance_after, reason, is_support, ref_type, ref_id)
    values (p_uid, p_delta, v_balance, p_reason, p_is_support and p_delta < 0, p_ref_type, p_ref_id);
  return v_balance;
end $$;

create function public._oshi_change_balls(p_uid uuid, p_delta bigint, p_reason text, p_ref_id text default null)
returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_balance bigint;
begin
  update public.oshi_profiles set balls = balls + p_delta
   where user_id = p_uid and balls + p_delta >= 0
  returning balls into v_balance;
  if not found then raise exception 'insufficient_balls'; end if;
  if p_delta <> 0 then
    insert into public.oshi_ball_ledger (user_id, delta, balance_after, reason, ref_id)
      values (p_uid, p_delta, v_balance, p_reason, p_ref_id);
  end if;
  return v_balance;
end $$;

create function public._oshi_change_charm(p_uid uuid, p_delta bigint, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_delta = 0 then return; end if;
  update public.oshi_profiles set charm_total = charm_total + p_delta where user_id = p_uid;
  insert into public.oshi_charm_ledger (user_id, delta, reason) values (p_uid, p_delta, p_reason);
end $$;

-- シール種別の基本売値
create function public._oshi_sticker_price(p_type_id bigint) returns bigint
language sql stable security definer set search_path = '' as $$
  select coalesce(t.price_override, t.charm * public._oshi_setting_int('price_per_charm'))
    from public.oshi_sticker_types t where t.id = p_type_id
$$;

create function public._oshi_book_price(p_type_id bigint) returns bigint
language sql stable security definer set search_path = '' as $$
  select coalesce(t.price_override, t.charm * public._oshi_setting_int('price_per_charm'))
    from public.oshi_book_types t where t.id = p_type_id
$$;

-- シール個体の発行（シリアル採番・図鑑記録・魅力値加算・履歴）
create function public._oshi_grant_sticker(p_uid uuid, p_type_id bigint, p_state text, p_source text)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_type public.oshi_sticker_types; v_id uuid; v_serial int;
begin
  select * into v_type from public.oshi_sticker_types where id = p_type_id for update;
  if not found then raise exception 'sticker_type_not_found'; end if;
  if v_type.max_supply is not null and v_type.issued_count >= v_type.max_supply then
    raise exception 'sold_out';
  end if;
  v_serial := v_type.issued_count + 1;
  update public.oshi_sticker_types set issued_count = v_serial where id = p_type_id;
  insert into public.oshi_stickers (type_id, owner_id, serial_no, state)
    values (p_type_id, p_uid, v_serial, p_state) returning id into v_id;
  insert into public.oshi_dex_progress (user_id, type_id) values (p_uid, p_type_id)
    on conflict do nothing;
  perform public._oshi_change_charm(p_uid, v_type.charm, 'acquire');
  insert into public.oshi_item_events (item_kind, item_id, event, source, to_user)
    values ('sticker', v_id, 'acquire', p_source, p_uid);
  return v_id;
end $$;

create function public._oshi_grant_book(p_uid uuid, p_type_id bigint, p_source text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_type public.oshi_book_types; v_id uuid; v_serial int;
begin
  select * into v_type from public.oshi_book_types where id = p_type_id for update;
  if not found then raise exception 'book_type_not_found'; end if;
  v_serial := v_type.issued_count + 1;
  update public.oshi_book_types set issued_count = v_serial where id = p_type_id;
  insert into public.oshi_books (type_id, owner_id, serial_no)
    values (p_type_id, p_uid, v_serial) returning id into v_id;
  perform public._oshi_change_charm(p_uid, v_type.charm, 'acquire');
  insert into public.oshi_item_events (item_kind, item_id, event, source, to_user)
    values ('book', v_id, 'acquire', p_source, p_uid);
  return v_id;
end $$;

-- 所有者の確認付きでシールをロックして返す
create function public._oshi_lock_own_sticker(p_uid uuid, p_sticker_id uuid) returns public.oshi_stickers
language plpgsql security definer set search_path = '' as $$
declare v_s public.oshi_stickers;
begin
  select * into v_s from public.oshi_stickers where id = p_sticker_id for update;
  if not found or v_s.owner_id <> p_uid then raise exception 'not_owner'; end if;
  return v_s;
end $$;

-- 所有権移動（貼付・TOP3・背景を解除、魅力値を移し、図鑑・履歴を記録）
create function public._oshi_transfer_sticker(p_sticker_id uuid, p_to uuid, p_kind text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_s public.oshi_stickers; v_charm int;
begin
  select * into v_s from public.oshi_stickers where id = p_sticker_id for update;
  select charm into v_charm from public.oshi_sticker_types where id = v_s.type_id;
  delete from public.oshi_placements        where sticker_id = p_sticker_id;
  delete from public.oshi_profile_favorites where sticker_id = p_sticker_id;
  delete from public.oshi_profile_bg        where sticker_id = p_sticker_id;
  update public.oshi_stickers set owner_id = p_to, acquired_at = now() where id = p_sticker_id;
  perform public._oshi_change_charm(v_s.owner_id, -v_charm, p_kind || '_out');
  perform public._oshi_change_charm(p_to, v_charm, p_kind || '_in');
  insert into public.oshi_dex_progress (user_id, type_id) values (p_to, v_s.type_id)
    on conflict do nothing;
  insert into public.oshi_item_events (item_kind, item_id, event, source, from_user, to_user)
    values ('sticker', p_sticker_id, p_kind, p_kind, v_s.owner_id, p_to);
end $$;

-- ギフト本体（還元抽選・移転・記録）。呼び出し側で所有・未開封・未ギフトを確認済みであること
create function public._oshi_do_gift(p_from uuid, p_sticker_id uuid, p_to uuid, p_message text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_type_id bigint; v_base bigint; v_table jsonb; v_total int; v_r numeric; v_acc int := 0;
  v_rate int := 0; v_reward bigint; v_row jsonb; v_transfer_id bigint;
begin
  if p_to = p_from then raise exception 'cannot_gift_self'; end if;
  if not exists (select 1 from public.oshi_profiles where user_id = p_to) then
    raise exception 'user_not_found';
  end if;
  if char_length(coalesce(p_message,'')) > public._oshi_setting_int('gift_message_max') then
    raise exception 'message_too_long';
  end if;

  select type_id into v_type_id from public.oshi_stickers where id = p_sticker_id;
  v_base := public._oshi_sticker_price(v_type_id);

  v_table := public._oshi_setting('gift_return_table');
  select sum((e->>'weight')::int) into v_total from jsonb_array_elements(v_table) e;
  v_r := random() * v_total;
  for v_row in select * from jsonb_array_elements(v_table) loop
    v_acc := v_acc + (v_row->>'weight')::int;
    if v_r < v_acc then v_rate := (v_row->>'rate')::int; exit; end if;
  end loop;
  v_reward := floor(v_base * v_rate / 100.0);

  update public.oshi_stickers set gifted = true where id = p_sticker_id;
  perform public._oshi_transfer_sticker(p_sticker_id, p_to, 'gift');
  insert into public.oshi_transfers (kind, sticker_id, from_user, to_user, message, base_price, rate_pct, reward)
    values ('gift', p_sticker_id, p_from, p_to, coalesce(p_message,''), v_base, v_rate, v_reward)
    returning id into v_transfer_id;
  perform public._oshi_change_points(p_to, v_reward, 'gift_return', 'transfer', v_transfer_id::text, false);

  return jsonb_build_object('transfer_id', v_transfer_id, 'sticker_id', p_sticker_id,
    'to', p_to, 'base_price', v_base, 'rate_pct', v_rate, 'reward', v_reward);
end $$;

-- 内部関数はクライアントから実行させない
do $$
declare r record;
begin
  for r in select p.oid::regprocedure as sig from pg_proc p
           join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like '\_oshi\_%' loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
  end loop;
end $$;
