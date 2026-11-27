-- =====================================================================
-- 推されーと：業務RPC（クライアントから呼ぶ関数）
-- エラーは raise exception '<コード>' で返す。コードの日本語化は src/domain/errors.ts
-- 更新系で通信の再試行が起こりうるものは p_request_id（冪等キー）を取る
-- =====================================================================

-- ---------------------------------------------------------------------
-- プロフィール
-- ---------------------------------------------------------------------
create function public.oshi_create_profile(p_handle text, p_display_name text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_book_type bigint; v_points bigint;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if exists (select 1 from public.oshi_profiles where user_id = v_uid) then
    raise exception 'profile_exists';
  end if;
  if p_handle !~ '^[A-Za-z0-9_]{3,20}$' then raise exception 'invalid_handle'; end if;
  if exists (select 1 from public.oshi_profiles where lower(handle) = lower(p_handle)) then
    raise exception 'handle_taken';
  end if;
  if char_length(trim(coalesce(p_display_name,''))) not between 1 and 30 then
    raise exception 'invalid_display_name';
  end if;

  insert into public.oshi_profiles (user_id, handle, display_name)
    values (v_uid, p_handle, trim(p_display_name));

  v_points := public._oshi_change_points(v_uid, public._oshi_setting_int('signup_points'), 'signup');
  v_book_type := public._oshi_setting_int('signup_book_type_id');
  if v_book_type is not null then
    perform public._oshi_grant_book(v_uid, v_book_type, 'signup');
  end if;
  return jsonb_build_object('user_id', v_uid, 'points', v_points);
end $$;

create function public.oshi_update_profile(p_display_name text, p_bio text, p_avatar_url text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._oshi_require_profile();
begin
  if char_length(trim(coalesce(p_display_name,''))) not between 1 and 30 then
    raise exception 'invalid_display_name';
  end if;
  if char_length(coalesce(p_bio,'')) > 200 then raise exception 'bio_too_long'; end if;
  update public.oshi_profiles
     set display_name = trim(p_display_name), bio = coalesce(p_bio,''), avatar_url = nullif(p_avatar_url,'')
   where user_id = v_uid;
end $$;

-- 本人の残高など（列権限で隠している情報）
create function public.oshi_my_wallet() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'points', p.points, 'balls', p.balls, 'login_streak', p.login_streak,
    'last_login_date', p.last_login_date,
    'login_bonus_available', p.last_login_date is distinct from public._oshi_today(),
    'is_admin', exists (select 1 from public.oshi_admins a where a.user_id = p.user_id))
  from public.oshi_profiles p where p.user_id = auth.uid()
$$;

-- ---------------------------------------------------------------------
-- ログインボーナス（1日1回。日付で冪等）
-- ---------------------------------------------------------------------
create function public.oshi_claim_login_bonus() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public._oshi_require_profile();
  v_today date := public._oshi_today();
  v_p public.oshi_profiles; v_streak int; v_table jsonb; v_amount bigint; v_balance bigint;
begin
  select * into v_p from public.oshi_profiles where user_id = v_uid for update;
  if v_p.last_login_date = v_today then
    return jsonb_build_object('claimed', false, 'streak', v_p.login_streak, 'points', v_p.points);
  end if;
  v_streak := case when v_p.last_login_date = v_today - 1 then v_p.login_streak + 1 else 1 end;
  v_table := public._oshi_setting('login_bonus_by_streak');
  v_amount := (v_table ->> (least(v_streak, jsonb_array_length(v_table)) - 1))::bigint;
  update public.oshi_profiles set login_streak = v_streak, last_login_date = v_today where user_id = v_uid;
  v_balance := public._oshi_change_points(v_uid, v_amount, 'login_bonus', 'date', v_today::text);
  return jsonb_build_object('claimed', true, 'streak', v_streak, 'amount', v_amount, 'points', v_balance);
end $$;

-- ---------------------------------------------------------------------
-- 購入
-- ---------------------------------------------------------------------
-- 図鑑から購入。p_gift_to を指定するとギフトとして相手へ（枚数は1）
create function public.oshi_buy_sticker(
  p_request_id uuid, p_type_id bigint, p_qty int default 1, p_open boolean default false,
  p_gift_to uuid default null, p_message text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public._oshi_require_profile();
  v_prev jsonb; v_type public.oshi_sticker_types; v_price bigint; v_ids uuid[] := '{}';
  v_id uuid; v_gift jsonb; v_balance bigint;
begin
  v_prev := public._oshi_idem_start(v_uid, p_request_id, 'buy_sticker');
  if v_prev is not null then return v_prev; end if;

  select * into v_type from public.oshi_sticker_types where id = p_type_id;
  if not found or not v_type.is_active or not v_type.dex_purchasable then
    raise exception 'not_purchasable';
  end if;
  if p_qty is null or p_qty < 1 or p_qty > public._oshi_setting_int('dex_buy_max_qty') then
    raise exception 'invalid_qty';
  end if;
  if p_gift_to is not null and p_qty <> 1 then raise exception 'invalid_qty'; end if;

  v_price := public._oshi_sticker_price(p_type_id) * p_qty;
  v_balance := public._oshi_change_points(v_uid, -v_price, 'buy_sticker', 'sticker_type', p_type_id::text, true);

  for i in 1..p_qty loop
    v_id := public._oshi_grant_sticker(v_uid, p_type_id, 'sealed', 'dex');
    v_ids := v_ids || v_id;
  end loop;

  if p_gift_to is not null then
    v_gift := public._oshi_do_gift(v_uid, v_id, p_gift_to, p_message);
  elsif p_open then
    update public.oshi_stickers set state = 'opened' where id = any(v_ids);
    insert into public.oshi_item_events (item_kind, item_id, event, from_user)
      select 'sticker', unnest(v_ids), 'open', v_uid;
  end if;

  return public._oshi_idem_finish(v_uid, p_request_id, jsonb_build_object(
    'sticker_ids', to_jsonb(v_ids), 'spent', v_price,
    'points', (select points from public.oshi_profiles where user_id = v_uid), 'gift', v_gift));
end $$;

-- SHOP（限定品）で購入。シール帳はギフト不可
create function public.oshi_buy_listing(
  p_request_id uuid, p_listing_id bigint, p_open boolean default false,
  p_gift_to uuid default null, p_message text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public._oshi_require_profile();
  v_prev jsonb; v_l public.oshi_shop_listings; v_bought int; v_item uuid; v_gift jsonb;
begin
  v_prev := public._oshi_idem_start(v_uid, p_request_id, 'buy_listing');
  if v_prev is not null then return v_prev; end if;

  select * into v_l from public.oshi_shop_listings where id = p_listing_id for update;
  if not found or v_l.venue <> 'shop' or not v_l.is_active
     or (v_l.starts_at is not null and now() < v_l.starts_at)
     or (v_l.ends_at   is not null and now() >= v_l.ends_at) then
    raise exception 'not_on_sale';
  end if;
  if v_l.stock is not null and v_l.sold_count >= v_l.stock then raise exception 'sold_out'; end if;
  select coalesce(qty,0) into v_bought from public.oshi_listing_purchases
    where listing_id = p_listing_id and user_id = v_uid;
  if v_l.per_user_limit is not null and coalesce(v_bought,0) >= v_l.per_user_limit then
    raise exception 'purchase_limit';
  end if;
  if v_l.book_type_id is not null and p_gift_to is not null then raise exception 'book_not_giftable'; end if;

  perform public._oshi_change_points(v_uid, -v_l.price, 'buy_listing', 'listing', p_listing_id::text, true);
  update public.oshi_shop_listings set sold_count = sold_count + 1 where id = p_listing_id;
  insert into public.oshi_listing_purchases (listing_id, user_id, qty) values (p_listing_id, v_uid, 1)
    on conflict (listing_id, user_id) do update set qty = public.oshi_listing_purchases.qty + 1;

  if v_l.book_type_id is not null then
    v_item := public._oshi_grant_book(v_uid, v_l.book_type_id, 'shop');
  else
    v_item := public._oshi_grant_sticker(v_uid, v_l.sticker_type_id, 'sealed', 'shop');
    if p_gift_to is not null then
      v_gift := public._oshi_do_gift(v_uid, v_item, p_gift_to, p_message);
    elsif p_open then
      update public.oshi_stickers set state = 'opened' where id = v_item;
      insert into public.oshi_item_events (item_kind, item_id, event, from_user)
        values ('sticker', v_item, 'open', v_uid);
    end if;
  end if;

  return public._oshi_idem_finish(v_uid, p_request_id, jsonb_build_object(
    'item_id', v_item, 'item_kind', case when v_l.book_type_id is null then 'sticker' else 'book' end,
    'spent', v_l.price, 'points', (select points from public.oshi_profiles where user_id = v_uid),
    'gift', v_gift));
end $$;

-- ---------------------------------------------------------------------
-- 開封・ギフト・プレゼント
-- ---------------------------------------------------------------------
create function public.oshi_open_sticker(p_sticker_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._oshi_require_profile(); v_s public.oshi_stickers;
begin
  v_s := public._oshi_lock_own_sticker(v_uid, p_sticker_id);
  if v_s.state = 'sealed' then
    update public.oshi_stickers set state = 'opened' where id = p_sticker_id;
    insert into public.oshi_item_events (item_kind, item_id, event, from_user)
      values ('sticker', p_sticker_id, 'open', v_uid);
  end if;
  return jsonb_build_object('sticker_id', p_sticker_id, 'state', 'opened');
end $$;

create function public.oshi_send_gift(p_request_id uuid, p_sticker_id uuid, p_to uuid, p_message text default null)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._oshi_require_profile(); v_prev jsonb; v_s public.oshi_stickers;
begin
  v_prev := public._oshi_idem_start(v_uid, p_request_id, 'send_gift');
  if v_prev is not null then return v_prev; end if;
  v_s := public._oshi_lock_own_sticker(v_uid, p_sticker_id);
  if v_s.state <> 'sealed' then raise exception 'gift_requires_sealed'; end if;
  if v_s.gifted then raise exception 'already_gifted'; end if;
  return public._oshi_idem_finish(v_uid, p_request_id, public._oshi_do_gift(v_uid, p_sticker_id, p_to, p_message));
end $$;

create function public.oshi_send_present(p_request_id uuid, p_sticker_id uuid, p_to uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._oshi_require_profile(); v_prev jsonb; v_s public.oshi_stickers; v_tid bigint;
begin
  v_prev := public._oshi_idem_start(v_uid, p_request_id, 'send_present');
  if v_prev is not null then return v_prev; end if;
  v_s := public._oshi_lock_own_sticker(v_uid, p_sticker_id);
  if v_s.state <> 'opened' then raise exception 'present_requires_opened'; end if;
  if p_to = v_uid then raise exception 'cannot_gift_self'; end if;
  if not exists (select 1 from public.oshi_profiles where user_id = p_to) then raise exception 'user_not_found'; end if;
  perform public._oshi_transfer_sticker(p_sticker_id, p_to, 'present');
  insert into public.oshi_transfers (kind, sticker_id, from_user, to_user)
    values ('present', p_sticker_id, v_uid, p_to) returning id into v_tid;
  return public._oshi_idem_finish(v_uid, p_request_id,
    jsonb_build_object('transfer_id', v_tid, 'sticker_id', p_sticker_id, 'to', p_to));
end $$;

-- ---------------------------------------------------------------------
-- シール帳への貼付（貼る＝移動も兼ねる。座標はシール左上、ページ内に収まること）
-- ---------------------------------------------------------------------
create function public.oshi_place_sticker(p_sticker_id uuid, p_book_id uuid, p_page int, p_x int, p_y int)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public._oshi_require_profile(); v_s public.oshi_stickers;
  v_t public.oshi_sticker_types; v_bt public.oshi_book_types; v_owner uuid;
begin
  v_s := public._oshi_lock_own_sticker(v_uid, p_sticker_id);
  if v_s.state <> 'opened' then raise exception 'place_requires_opened'; end if;
  select owner_id into v_owner from public.oshi_books where id = p_book_id;
  if v_owner is distinct from v_uid then raise exception 'not_owner'; end if;
  select bt.* into v_bt from public.oshi_books b join public.oshi_book_types bt on bt.id = b.type_id
   where b.id = p_book_id;
  select * into v_t from public.oshi_sticker_types where id = v_s.type_id;
  if p_page < 1 or p_page > v_bt.page_count then raise exception 'invalid_page'; end if;
  if p_x < 0 or p_y < 0 or p_x + v_t.width > v_bt.page_w or p_y + v_t.height > v_bt.page_h then
    raise exception 'out_of_page';
  end if;
  insert into public.oshi_placements (sticker_id, book_id, page, x, y)
    values (p_sticker_id, p_book_id, p_page, p_x, p_y)
  on conflict (sticker_id) do update
    set book_id = excluded.book_id, page = excluded.page, x = excluded.x, y = excluded.y, placed_at = now();
end $$;

create function public.oshi_remove_sticker(p_sticker_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._oshi_require_profile();
begin
  perform public._oshi_lock_own_sticker(v_uid, p_sticker_id);
  delete from public.oshi_placements where sticker_id = p_sticker_id;
end $$;

-- ---------------------------------------------------------------------
-- 展示設定（いずれも全置き換え）
-- ---------------------------------------------------------------------
create function public.oshi_set_favorites(p_sticker_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._oshi_require_profile(); v_n int := coalesce(array_length(p_sticker_ids,1),0);
begin
  if v_n > public._oshi_setting_int('favorites_max') then raise exception 'too_many'; end if;
  if (select count(distinct x) from unnest(p_sticker_ids) x) <> v_n then raise exception 'duplicate_item'; end if;
  if exists (select 1 from unnest(p_sticker_ids) x
             where not exists (select 1 from public.oshi_stickers s
                               where s.id = x and s.owner_id = v_uid and s.state = 'opened')) then
    raise exception 'not_owner';
  end if;
  delete from public.oshi_profile_favorites where user_id = v_uid;
  insert into public.oshi_profile_favorites (user_id, slot, sticker_id)
    select v_uid, ord, x from unnest(p_sticker_ids) with ordinality as u(x, ord);
end $$;

create function public.oshi_set_fav_books(p_book_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._oshi_require_profile(); v_n int := coalesce(array_length(p_book_ids,1),0);
begin
  if v_n > public._oshi_setting_int('fav_books_max') then raise exception 'too_many'; end if;
  if (select count(distinct x) from unnest(p_book_ids) x) <> v_n then raise exception 'duplicate_item'; end if;
  if exists (select 1 from unnest(p_book_ids) x
             where not exists (select 1 from public.oshi_books b where b.id = x and b.owner_id = v_uid)) then
    raise exception 'not_owner';
  end if;
  delete from public.oshi_profile_fav_books where user_id = v_uid;
  insert into public.oshi_profile_fav_books (user_id, slot, book_id)
    select v_uid, ord, x from unnest(p_book_ids) with ordinality as u(x, ord);
end $$;

-- p_items: [{"sticker_id": "...", "x": 0, "y": 0}, ...]
create function public.oshi_set_profile_bg(p_items jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public._oshi_require_profile();
  v_canvas jsonb := public._oshi_setting('profile_bg_canvas');
  v_n int := jsonb_array_length(coalesce(p_items, '[]'::jsonb));
begin
  if v_n > public._oshi_setting_int('profile_bg_max') then raise exception 'too_many'; end if;
  create temp table _bg on commit drop as
    select (e->>'sticker_id')::uuid as sticker_id, (e->>'x')::int as x, (e->>'y')::int as y
      from jsonb_array_elements(coalesce(p_items,'[]'::jsonb)) e;
  if (select count(distinct sticker_id) from _bg) <> v_n then raise exception 'duplicate_item'; end if;
  if exists (select 1 from _bg b
             left join public.oshi_stickers s on s.id = b.sticker_id and s.owner_id = v_uid and s.state = 'opened'
             where s.id is null) then
    raise exception 'not_owner';
  end if;
  if exists (select 1 from _bg b
             join public.oshi_stickers s on s.id = b.sticker_id
             join public.oshi_sticker_types t on t.id = s.type_id
             where b.x < 0 or b.y < 0
                or b.x + t.width  > (v_canvas->>'w')::int
                or b.y + t.height > (v_canvas->>'h')::int) then
    raise exception 'out_of_page';
  end if;
  delete from public.oshi_profile_bg where user_id = v_uid;
  insert into public.oshi_profile_bg (user_id, sticker_id, x, y) select v_uid, sticker_id, x, y from _bg;
  drop table _bg;
end $$;

-- ---------------------------------------------------------------------
-- フォロー
-- ---------------------------------------------------------------------
create function public.oshi_follow(p_target uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._oshi_require_profile();
begin
  if p_target = v_uid then raise exception 'cannot_follow_self'; end if;
  if not exists (select 1 from public.oshi_profiles where user_id = p_target) then raise exception 'user_not_found'; end if;
  insert into public.oshi_follows (follower_id, followee_id) values (v_uid, p_target) on conflict do nothing;
end $$;

create function public.oshi_unfollow(p_target uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._oshi_require_profile();
begin
  delete from public.oshi_follows where follower_id = v_uid and followee_id = p_target;
end $$;

-- ---------------------------------------------------------------------
-- 読み取り用
-- ---------------------------------------------------------------------
-- 図鑑：p_user の収集状況。dex_visibility='owned' は p_user が所持歴を持つ場合のみ返す
create function public.oshi_dex_view(p_user uuid, p_dex text)
returns table (type_id bigint, name text, image_path text, width int, height int, charm int,
               price bigint, kind text, rarity text, dex_purchasable boolean, owned boolean)
language sql stable security definer set search_path = '' as $$
  select t.id, t.name, t.image_path, t.width, t.height, t.charm,
         public._oshi_sticker_price(t.id), t.kind, t.rarity,
         t.dex_purchasable and t.is_active,
         (dp.user_id is not null)
    from public.oshi_sticker_types t
    left join public.oshi_dex_progress dp on dp.type_id = t.id and dp.user_id = p_user
   where t.dex_id = p_dex
     and (t.dex_visibility = 'always' or dp.user_id is not null)
   order by t.sort, t.id
$$;

-- ランキング。p_metric: charm / support、p_period: day / week / month / all
-- 上位 ranking_limit 件 ＋ p_me の行を返す
create function public.oshi_ranking(p_metric text, p_period text, p_me uuid default null)
returns table (rnk bigint, user_id uuid, handle text, display_name text, avatar_url text, value bigint)
language plpgsql stable security definer set search_path = '' as $$
declare v_start timestamptz := public._oshi_period_start(p_period); v_limit int := public._oshi_setting_int('ranking_limit');
begin
  if v_start is null or p_metric not in ('charm','support') then raise exception 'invalid_ranking'; end if;
  return query
  with scores as (
    select p.user_id, p.handle, p.display_name, p.avatar_url,
      case
        when p_period = 'all' and p_metric = 'charm'   then p.charm_total
        when p_period = 'all' and p_metric = 'support' then p.support_total
        when p_metric = 'charm' then coalesce((select sum(c.delta) from public.oshi_charm_ledger c
                                    where c.user_id = p.user_id and c.created_at >= v_start), 0)::bigint
        else coalesce((select sum(-l.delta) from public.oshi_point_ledger l
                       where l.user_id = p.user_id and l.is_support and l.created_at >= v_start), 0)::bigint
      end as value
    from public.oshi_profiles p
  ), ranked as (
    select rank() over (order by s.value desc) as rnk, s.* from scores s where s.value > 0
  )
  select r.rnk, r.user_id, r.handle, r.display_name, r.avatar_url, r.value
    from ranked r where r.rnk <= v_limit or r.user_id = p_me
   order by r.rnk, r.handle;
end $$;

-- ---------------------------------------------------------------------
-- 運営
-- ---------------------------------------------------------------------
create function public.oshi_admin_create_sticker_type(
  p_dex_id text, p_name text, p_width int, p_height int, p_charm int,
  p_image_path text default null, p_price_override int default null, p_kind text default 'basic',
  p_rarity text default 'common', p_dex_visibility text default 'always',
  p_dex_purchasable boolean default true, p_max_supply int default null, p_sort int default 0
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_id bigint;
begin
  perform public._oshi_require_admin();
  insert into public.oshi_sticker_types (dex_id, name, image_path, width, height, charm, price_override,
    kind, rarity, dex_visibility, dex_purchasable, max_supply, sort)
  values (p_dex_id, p_name, p_image_path, p_width, p_height, p_charm, p_price_override,
    p_kind, p_rarity, p_dex_visibility, p_dex_purchasable, p_max_supply, p_sort)
  returning id into v_id;
  return v_id;
end $$;

create function public.oshi_admin_set_sticker_type_active(p_type_id bigint, p_active boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public._oshi_require_admin();
  update public.oshi_sticker_types set is_active = p_active where id = p_type_id;
end $$;

create function public.oshi_admin_create_book_type(
  p_name text, p_page_count int, p_charm int default 0, p_price_override int default null, p_theme text default 'plain'
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_id bigint;
begin
  perform public._oshi_require_admin();
  insert into public.oshi_book_types (name, page_count, charm, price_override, theme)
    values (p_name, p_page_count, p_charm, p_price_override, p_theme) returning id into v_id;
  return v_id;
end $$;

create function public.oshi_admin_create_listing(
  p_venue text, p_sticker_type_id bigint, p_book_type_id bigint, p_price int,
  p_stock int default null, p_per_user_limit int default null,
  p_starts_at timestamptz default null, p_ends_at timestamptz default null, p_sort int default 0
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_id bigint;
begin
  perform public._oshi_require_admin();
  insert into public.oshi_shop_listings (venue, sticker_type_id, book_type_id, price, stock, per_user_limit,
    starts_at, ends_at, sort)
  values (p_venue, p_sticker_type_id, p_book_type_id, p_price, p_stock, p_per_user_limit, p_starts_at, p_ends_at, p_sort)
  returning id into v_id;
  return v_id;
end $$;

create function public.oshi_admin_set_listing_active(p_listing_id bigint, p_active boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public._oshi_require_admin();
  update public.oshi_shop_listings set is_active = p_active where id = p_listing_id;
end $$;

-- 付与。p_kind: sticker / book / points
create function public.oshi_admin_grant(
  p_request_id uuid, p_user uuid, p_kind text, p_type_id bigint default null,
  p_qty int default 1, p_state text default 'sealed', p_points bigint default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_admin uuid := public._oshi_require_admin(); v_prev jsonb; v_ids uuid[] := '{}';
begin
  v_prev := public._oshi_idem_start(v_admin, p_request_id, 'admin_grant');
  if v_prev is not null then return v_prev; end if;
  if not exists (select 1 from public.oshi_profiles where user_id = p_user) then raise exception 'user_not_found'; end if;
  if p_qty < 1 or p_qty > 100 then raise exception 'invalid_qty'; end if;
  if p_kind = 'sticker' then
    for i in 1..p_qty loop v_ids := v_ids || public._oshi_grant_sticker(p_user, p_type_id, p_state, 'admin'); end loop;
  elsif p_kind = 'book' then
    for i in 1..p_qty loop v_ids := v_ids || public._oshi_grant_book(p_user, p_type_id, 'admin'); end loop;
  elsif p_kind = 'points' then
    if p_points is null or p_points <= 0 then raise exception 'invalid_amount'; end if;
    perform public._oshi_change_points(p_user, p_points, 'admin_grant', 'admin', v_admin::text, false);
  else
    raise exception 'invalid_kind';
  end if;
  return public._oshi_idem_finish(v_admin, p_request_id, jsonb_build_object('item_ids', to_jsonb(v_ids)));
end $$;

-- ---------------------------------------------------------------------
-- 実行権限：公開RPCはログインユーザーのみ（読み取り用は anon も可）
-- ---------------------------------------------------------------------
do $$
declare r record;
begin
  for r in select p.oid::regprocedure as sig, p.proname from pg_proc p
           join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'oshi\_%' loop
    execute format('revoke all on function %s from public, anon', r.sig);
    execute format('grant execute on function %s to authenticated', r.sig);
    if r.proname in ('oshi_dex_view','oshi_ranking') then
      execute format('grant execute on function %s to anon', r.sig);
    end if;
  end loop;
end $$;
