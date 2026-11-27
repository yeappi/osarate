-- =====================================================================
-- 推されーと：遊び場（パチ屋ミニゲーム）
-- 本体との接点は「玉残高(oshi_profiles.balls)」と「ポイント増減」のみ
-- =====================================================================

create table public.oshi_pachi_machines (
  id   smallint primary key,
  name text not null,
  sort int not null default 0
);

-- 本日の公開統計（見極め材料）
create table public.oshi_pachi_daily (
  machine_id smallint not null references public.oshi_pachi_machines(id),
  day        date not null,
  spins      int not null default 0,
  hits       int not null default 0,
  big_hits   int not null default 0,
  max_payout int not null default 0,
  primary key (machine_id, day)
);

-- 非公開の設定（クライアントから読めない）
create table public.oshi_pachi_secret (
  machine_id smallint not null references public.oshi_pachi_machines(id),
  day        date not null,
  setting    smallint not null check (setting between 1 and 6),
  primary key (machine_id, day)
);

alter table public.oshi_pachi_machines enable row level security;
alter table public.oshi_pachi_daily    enable row level security;
alter table public.oshi_pachi_secret   enable row level security;
revoke all on public.oshi_pachi_machines, public.oshi_pachi_daily, public.oshi_pachi_secret from anon, authenticated;
grant select on public.oshi_pachi_machines, public.oshi_pachi_daily to anon, authenticated;
create policy oshi_pachi_machines_read on public.oshi_pachi_machines for select using (true);
create policy oshi_pachi_daily_read    on public.oshi_pachi_daily    for select using (true);

insert into public.oshi_pachi_machines (id, name, sort) values
  (1,'1番台',1),(2,'2番台',2),(3,'3番台',3),(4,'4番台',4),(5,'5番台',5),(6,'6番台',6);

-- 設定値。1回転 = pachi_spin_cost 玉。tiers は上から順に判定（p は1回転あたりの確率）
-- 期待払い出し/投入 ≒ 設定1:90% 2:95% 3:100% 4:105% 5:110% 6:115%
insert into public.oshi_settings (key, value, note) values
  ('pachi_ball_rate_in',  '1',  '1pt で借りられる玉数'),
  ('pachi_ball_rate_out', '1',  '1玉を精算したときのpt'),
  ('pachi_spin_cost',     '10', '1回転に使う玉'),
  ('pachi_max_spins_per_request', '10', '1回の操作での最大回転数'),
  ('pachi_setting_weights', '[30,25,20,13,8,4]', '設定1〜6の出現の重み（毎日0時に台ごとに抽選）'),
  ('pachi_settings_table', '{
    "1":[{"p":0.2333,"pay":30,"tier":"hit"},{"p":0.002,"pay":500,"tier":"big"},{"p":0.0002,"pay":5000,"tier":"jackpot"}],
    "2":[{"p":0.2500,"pay":30,"tier":"hit"},{"p":0.002,"pay":500,"tier":"big"},{"p":0.0002,"pay":5000,"tier":"jackpot"}],
    "3":[{"p":0.2667,"pay":30,"tier":"hit"},{"p":0.002,"pay":500,"tier":"big"},{"p":0.0002,"pay":5000,"tier":"jackpot"}],
    "4":[{"p":0.2833,"pay":30,"tier":"hit"},{"p":0.002,"pay":500,"tier":"big"},{"p":0.0002,"pay":5000,"tier":"jackpot"}],
    "5":[{"p":0.3000,"pay":30,"tier":"hit"},{"p":0.002,"pay":500,"tier":"big"},{"p":0.0002,"pay":5000,"tier":"jackpot"}],
    "6":[{"p":0.3167,"pay":30,"tier":"hit"},{"p":0.002,"pay":500,"tier":"big"},{"p":0.0002,"pay":5000,"tier":"jackpot"}]
  }', '設定ごとの当選表');

-- 本日の設定（未抽選なら抽選して保存）
create function public._oshi_pachi_setting(p_machine smallint, p_day date) returns smallint
language plpgsql security definer set search_path = '' as $$
declare v_setting smallint; v_w jsonb; v_total int; v_r numeric; v_acc int := 0;
begin
  select setting into v_setting from public.oshi_pachi_secret where machine_id = p_machine and day = p_day;
  if found then return v_setting; end if;
  v_w := public._oshi_setting('pachi_setting_weights');
  select sum(x::int) into v_total from jsonb_array_elements_text(v_w) x;
  v_r := random() * v_total;
  for i in 0..jsonb_array_length(v_w) - 1 loop
    v_acc := v_acc + (v_w->>i)::int;
    if v_r < v_acc then v_setting := i + 1; exit; end if;
  end loop;
  insert into public.oshi_pachi_secret (machine_id, day, setting) values (p_machine, p_day, v_setting)
    on conflict do nothing;
  select setting into v_setting from public.oshi_pachi_secret where machine_id = p_machine and day = p_day;
  return v_setting;
end $$;

-- 玉貸し（ポイント→玉）。消費額は応援力に加算
create function public.oshi_pachi_lend(p_request_id uuid, p_points int) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._oshi_require_profile(); v_prev jsonb; v_balls bigint;
begin
  v_prev := public._oshi_idem_start(v_uid, p_request_id, 'pachi_lend');
  if v_prev is not null then return v_prev; end if;
  if p_points is null or p_points <= 0 then raise exception 'invalid_amount'; end if;
  perform public._oshi_change_points(v_uid, -p_points, 'pachi_lend', 'pachi', null, true);
  v_balls := public._oshi_change_balls(v_uid, p_points * public._oshi_setting_int('pachi_ball_rate_in'), 'lend');
  return public._oshi_idem_finish(v_uid, p_request_id, jsonb_build_object(
    'balls', v_balls, 'points', (select points from public.oshi_profiles where user_id = v_uid)));
end $$;

-- 精算（玉→ポイント）
create function public.oshi_pachi_cashout(p_request_id uuid, p_balls int) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._oshi_require_profile(); v_prev jsonb; v_pts bigint; v_balls bigint;
begin
  v_prev := public._oshi_idem_start(v_uid, p_request_id, 'pachi_cashout');
  if v_prev is not null then return v_prev; end if;
  if p_balls is null or p_balls <= 0 then raise exception 'invalid_amount'; end if;
  v_balls := public._oshi_change_balls(v_uid, -p_balls, 'cashout');
  v_pts := floor(p_balls * public._oshi_setting_int('pachi_ball_rate_out'));
  perform public._oshi_change_points(v_uid, v_pts, 'pachi_cashout', 'pachi', null, false);
  return public._oshi_idem_finish(v_uid, p_request_id, jsonb_build_object(
    'balls', v_balls, 'gained', v_pts, 'points', (select points from public.oshi_profiles where user_id = v_uid)));
end $$;

-- 回転
create function public.oshi_pachi_spin(p_request_id uuid, p_machine smallint, p_spins int) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public._oshi_require_profile(); v_prev jsonb;
  v_day date := public._oshi_today(); v_setting smallint; v_tiers jsonb; v_cost int;
  v_r numeric; v_acc numeric; v_t jsonb; v_pay int; v_tier text;
  v_results jsonb := '[]'; v_total_pay bigint := 0; v_hits int := 0; v_big int := 0; v_max int := 0;
  v_balls bigint;
begin
  v_prev := public._oshi_idem_start(v_uid, p_request_id, 'pachi_spin');
  if v_prev is not null then return v_prev; end if;
  if not exists (select 1 from public.oshi_pachi_machines where id = p_machine) then raise exception 'machine_not_found'; end if;
  if p_spins is null or p_spins < 1 or p_spins > public._oshi_setting_int('pachi_max_spins_per_request') then
    raise exception 'invalid_qty';
  end if;

  v_cost := public._oshi_setting_int('pachi_spin_cost');
  perform public._oshi_change_balls(v_uid, -(v_cost * p_spins), 'spin', p_machine::text);
  v_setting := public._oshi_pachi_setting(p_machine, v_day);
  v_tiers := public._oshi_setting('pachi_settings_table') -> v_setting::text;

  for i in 1..p_spins loop
    v_r := random(); v_acc := 0; v_pay := 0; v_tier := 'miss';
    for v_t in select * from jsonb_array_elements(v_tiers) loop
      v_acc := v_acc + (v_t->>'p')::numeric;
      if v_r < v_acc then v_pay := (v_t->>'pay')::int; v_tier := v_t->>'tier'; exit; end if;
    end loop;
    v_results := v_results || jsonb_build_object('tier', v_tier, 'pay', v_pay);
    v_total_pay := v_total_pay + v_pay;
    if v_pay > 0 then v_hits := v_hits + 1; end if;
    if v_tier in ('big','jackpot') then v_big := v_big + 1; end if;
    v_max := greatest(v_max, v_pay);
  end loop;

  v_balls := public._oshi_change_balls(v_uid, v_total_pay, 'payout', p_machine::text);
  insert into public.oshi_pachi_daily (machine_id, day, spins, hits, big_hits, max_payout)
    values (p_machine, v_day, p_spins, v_hits, v_big, v_max)
  on conflict (machine_id, day) do update set
    spins = public.oshi_pachi_daily.spins + excluded.spins,
    hits = public.oshi_pachi_daily.hits + excluded.hits,
    big_hits = public.oshi_pachi_daily.big_hits + excluded.big_hits,
    max_payout = greatest(public.oshi_pachi_daily.max_payout, excluded.max_payout);

  return public._oshi_idem_finish(v_uid, p_request_id, jsonb_build_object(
    'results', v_results, 'payout', v_total_pay, 'balls', v_balls));
end $$;

-- 景品交換（玉→シール／シール帳）
create function public.oshi_pachi_exchange(p_request_id uuid, p_listing_id bigint) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._oshi_require_profile(); v_prev jsonb; v_l public.oshi_shop_listings; v_item uuid;
begin
  v_prev := public._oshi_idem_start(v_uid, p_request_id, 'pachi_exchange');
  if v_prev is not null then return v_prev; end if;
  select * into v_l from public.oshi_shop_listings where id = p_listing_id for update;
  if not found or v_l.venue <> 'prize' or not v_l.is_active
     or (v_l.starts_at is not null and now() < v_l.starts_at)
     or (v_l.ends_at   is not null and now() >= v_l.ends_at) then
    raise exception 'not_on_sale';
  end if;
  if v_l.stock is not null and v_l.sold_count >= v_l.stock then raise exception 'sold_out'; end if;
  perform public._oshi_change_balls(v_uid, -v_l.price, 'exchange', p_listing_id::text);
  update public.oshi_shop_listings set sold_count = sold_count + 1 where id = p_listing_id;
  if v_l.book_type_id is not null then
    v_item := public._oshi_grant_book(v_uid, v_l.book_type_id, 'prize');
  else
    v_item := public._oshi_grant_sticker(v_uid, v_l.sticker_type_id, 'sealed', 'prize');
  end if;
  return public._oshi_idem_finish(v_uid, p_request_id, jsonb_build_object(
    'item_id', v_item, 'item_kind', case when v_l.book_type_id is null then 'sticker' else 'book' end,
    'balls', (select balls from public.oshi_profiles where user_id = v_uid)));
end $$;

-- 権限
revoke all on function public._oshi_pachi_setting(smallint, date) from public, anon, authenticated;
do $$
declare r record;
begin
  for r in select p.oid::regprocedure as sig from pg_proc p
           join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'oshi\_pachi\_%' loop
    execute format('revoke all on function %s from public, anon', r.sig);
    execute format('grant execute on function %s to authenticated', r.sig);
  end loop;
end $$;

-- =====================================================================
-- 初期マスタ（図鑑・初期シール帳・サンプルのシール）
-- サンプルは検証用。本番前に差し替える
-- =====================================================================
insert into public.oshi_dexes (id, name, sort) values ('main','メイン',1), ('elite','精鋭',2);

do $$
declare v_book bigint;
begin
  insert into public.oshi_book_types (name, page_count, charm, theme)
    values ('はじめてのシール帳', 4, 0, 'plain') returning id into v_book;
  update public.oshi_settings set value = to_jsonb(v_book) where key = 'signup_book_type_id';

  insert into public.oshi_book_types (name, page_count, charm, theme) values
    ('ふつうのシール帳', 8, 100, 'plain'),
    ('おおきいシール帳', 12, 500, 'deluxe');

  insert into public.oshi_sticker_types (dex_id, name, width, height, charm, kind, rarity, dex_visibility, dex_purchasable, sort) values
    ('main', 'ちいさな星',   24,  24,    1, 'basic',   'common', 'always', true,  1),
    ('main', 'ちいさなハート', 24, 24,    1, 'basic',   'common', 'always', true,  2),
    ('main', 'リボン',       60,  40,  150, 'basic',   'common', 'always', true,  3),
    ('main', 'おおきな花',   140, 140, 1000, 'basic',  'rare',   'always', true,  4),
    ('main', 'ひみつの鍵',   80,  80,  3000, 'special','epic',   'owned',  false, 5),
    ('main', 'きらきら王冠', 200, 160, 15000, 'special','legend','always', false, 6),
    ('elite','精鋭バッジ',   100, 100, 2000, 'special','rare',   'always', false, 1);
end $$;

-- サンプル出品：SHOP（王冠・おおきいシール帳）、景品（ひみつの鍵・ふつうのシール帳）
insert into public.oshi_shop_listings (venue, sticker_type_id, book_type_id, price, stock, sort)
select 'shop', id, null, 150000, 10, 1 from public.oshi_sticker_types where name = 'きらきら王冠'
union all
select 'shop', null, id, 5000, null, 2 from public.oshi_book_types where name = 'おおきいシール帳'
union all
select 'prize', id, null, 20000, null, 1 from public.oshi_sticker_types where name = 'ひみつの鍵'
union all
select 'prize', null, id, 3000, null, 2 from public.oshi_book_types where name = 'ふつうのシール帳';
