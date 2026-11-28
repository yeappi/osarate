-- はじめてのクエスト・初期アイテムの選択・シール帳のプレゼント・高額シール
-- 既存アプリには触れない。oshi_ の表・関数の追加と、oshi_settings の値の更新のみ

-- =====================================================================
-- 表
-- =====================================================================
create table public.oshi_quests (
  code      text primary key,
  title     text not null,
  points    int  not null check (points >= 0),
  sort      int  not null default 0,
  is_active boolean not null default true
);

create table public.oshi_quest_claims (
  user_id    uuid not null references public.oshi_profiles(user_id) on delete cascade,
  code       text not null references public.oshi_quests(code),
  claimed_at timestamptz not null default now(),
  primary key (user_id, code)
);

-- 初期アイテムの選択（1アカウント1回）
create table public.oshi_starter_choices (
  user_id         uuid primary key references public.oshi_profiles(user_id) on delete cascade,
  sticker_type_id bigint not null references public.oshi_sticker_types(id),
  book_type_id    bigint not null references public.oshi_book_types(id),
  created_at      timestamptz not null default now()
);

alter table public.oshi_quests          enable row level security;
alter table public.oshi_quest_claims    enable row level security;
alter table public.oshi_starter_choices enable row level security;
revoke all on public.oshi_quests, public.oshi_quest_claims, public.oshi_starter_choices from anon, authenticated;
-- 読み書きは RPC のみ（ポリシーなし）

-- =====================================================================
-- データ
-- =====================================================================
insert into public.oshi_quests (code, title, points, sort) values
  ('starter',     '初期アイテムを選ぶ',               300, 1),
  ('login_bonus', 'ログインボーナスを受け取る',       300, 2),
  ('bio',         '自己紹介を書く',                   200, 3),
  ('open',        'シールを開封する',                 300, 4),
  ('place',       'シール帳にシールを貼る',           400, 5),
  ('top3',        'TOP3を設定する',                   300, 6),
  ('buy',         '図鑑でシールを買う',               300, 7),
  ('follow',      'だれかをフォローする',             300, 8),
  ('give',        'だれかにプレゼントかギフトを贈る', 600, 9);

-- 初期シール（図鑑には所持するまで出ない・買えない）。画像は後から差し替える
insert into public.oshi_sticker_types
  (dex_id, name, image_path, width, height, charm, price_override, kind, rarity, dex_visibility, dex_purchasable, sort)
values
  ('main', 'はじまりの鍵',   null, 92, 92, 30, 300, 'special', 'rare', 'owned', false, 10),
  ('main', 'はじまりの羽根', null, 92, 92, 30, 300, 'special', 'rare', 'owned', false, 11),
  ('main', 'はじまりの灯り', null, 92, 92, 30, 300, 'special', 'rare', 'owned', false, 12);

-- 初期シール帳（SHOP に出さないので買えない）
insert into public.oshi_book_types (name, page_count, theme, charm) values
  ('クラフトのシール帳',     6, 'kraft',    0),
  ('ミッドナイトのシール帳', 6, 'midnight', 0),
  ('ローズのシール帳',       6, 'rose',     0);

-- 高額シール（図鑑で購入可）。画像は後から差し替える
insert into public.oshi_sticker_types
  (dex_id, name, image_path, width, height, charm, price_override, kind, rarity, dex_visibility, dex_purchasable, sort)
values
  ('main', 'アンティークの香水瓶',     null, 150, 150,  100,   1000, 'basic', 'legend', 'always', true, 2001),
  ('main', '七宝の小鳥ブローチ',       null, 160, 160,  300,   3000, 'basic', 'legend', 'always', true, 2002),
  ('main', '金盤のレコード',           null, 170, 170,  500,   5000, 'basic', 'legend', 'always', true, 2003),
  ('main', '真鍮の天球儀',             null, 180, 180,  800,   8000, 'basic', 'legend', 'always', true, 2004),
  ('main', 'ステンドグラスの月',       null, 190, 190, 1000,  10000, 'basic', 'legend', 'always', true, 2005),
  ('main', '封蝋と黄金の鍵',           null, 200, 200, 3000,  30000, 'basic', 'legend', 'always', true, 2006),
  ('main', 'クリスタルのシャンデリア', null, 210, 210, 5000,  50000, 'basic', 'legend', 'always', true, 2007),
  ('main', '宝石の王冠',               null, 220, 220, 7000,  70000, 'basic', 'legend', 'always', true, 2008),
  ('main', '黄金の孔雀',               null, 230, 230, 10000, 100000, 'basic', 'legend', 'always', true, 2009),
  ('main', '星を閉じ込めた宝珠',       null, 240, 240, 15000, 150000, 'basic', 'legend', 'always', true, 2010);

-- 設定：初期アイテムの候補。登録時のpt・シール帳の配布はやめ、クエストと初期選択に置き換える
insert into public.oshi_settings (key, value, note)
select 'starter_sticker_type_ids', jsonb_agg(id order by sort), '初期選択できるシール種別ID'
  from public.oshi_sticker_types
 where kind = 'special' and name in ('はじまりの鍵','はじまりの羽根','はじまりの灯り');
insert into public.oshi_settings (key, value, note)
select 'starter_book_type_ids', jsonb_agg(id order by id), '初期選択できるシール帳種別ID'
  from public.oshi_book_types
 where name in ('クラフトのシール帳','ミッドナイトのシール帳','ローズのシール帳');
update public.oshi_settings set value = '0'::jsonb,    updated_at = now() where key = 'signup_points';
update public.oshi_settings set value = 'null'::jsonb, updated_at = now() where key = 'signup_book_type_id';

-- =====================================================================
-- 関数
-- =====================================================================
-- クエストの達成判定（DB の状態から判定する。画面からの申告は使わない）
create function public._oshi_quest_done(p_uid uuid, p_code text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
begin
  return case p_code
    when 'starter'     then exists (select 1 from public.oshi_starter_choices where user_id = p_uid)
    when 'login_bonus' then exists (select 1 from public.oshi_point_ledger where user_id = p_uid and reason = 'login_bonus')
    when 'bio'         then exists (select 1 from public.oshi_profiles where user_id = p_uid and char_length(trim(bio)) > 0)
    when 'open'        then exists (select 1 from public.oshi_item_events where from_user = p_uid and item_kind = 'sticker' and event = 'open')
    when 'place'       then exists (select 1 from public.oshi_placements p join public.oshi_stickers s on s.id = p.sticker_id where s.owner_id = p_uid)
    when 'top3'        then exists (select 1 from public.oshi_profile_favorites where user_id = p_uid)
    when 'buy'         then exists (select 1 from public.oshi_point_ledger where user_id = p_uid and reason in ('buy_sticker','buy_listing'))
    when 'follow'      then exists (select 1 from public.oshi_follows where follower_id = p_uid)
    when 'give'        then exists (select 1 from public.oshi_transfers where from_user = p_uid)
                         or exists (select 1 from public.oshi_item_events where from_user = p_uid and item_kind = 'book' and event = 'present')
    else false
  end;
end $$;

create function public.oshi_quest_list()
returns table (code text, title text, points int, done boolean, claimed boolean)
language sql stable security definer set search_path = '' as $$
  select q.code, q.title, q.points,
         public._oshi_quest_done(public._oshi_require_profile(), q.code),
         exists (select 1 from public.oshi_quest_claims c where c.user_id = auth.uid() and c.code = q.code)
    from public.oshi_quests q
   where q.is_active
   order by q.sort
$$;

create function public.oshi_claim_quest(p_request_id uuid, p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._oshi_require_profile(); v_prev jsonb; v_q public.oshi_quests; v_balance bigint;
begin
  v_prev := public._oshi_idem_start(v_uid, p_request_id, 'claim_quest');
  if v_prev is not null then return v_prev; end if;
  select * into v_q from public.oshi_quests where code = p_code and is_active;
  if not found then raise exception 'quest_not_found'; end if;
  if not public._oshi_quest_done(v_uid, p_code) then raise exception 'quest_not_done'; end if;
  insert into public.oshi_quest_claims (user_id, code) values (v_uid, p_code) on conflict do nothing;
  if not found then raise exception 'quest_already_claimed'; end if;
  v_balance := public._oshi_change_points(v_uid, v_q.points, 'quest', 'quest', p_code);
  return public._oshi_idem_finish(v_uid, p_request_id,
    jsonb_build_object('code', p_code, 'points', v_q.points, 'balance', v_balance));
end $$;

-- 初期アイテムの候補と、選択済みかどうか
create function public.oshi_starter_options() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'chosen', exists (select 1 from public.oshi_starter_choices where user_id = public._oshi_require_profile()),
    'stickers', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'image_path', t.image_path,
                                   'width', t.width, 'height', t.height) order by t.sort)
                            from public.oshi_sticker_types t
                           where t.id in (select (jsonb_array_elements_text(public._oshi_setting('starter_sticker_type_ids')))::bigint)), '[]'::jsonb),
    'books', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'name', b.name, 'theme', b.theme, 'page_count', b.page_count) order by b.id)
                         from public.oshi_book_types b
                        where b.id in (select (jsonb_array_elements_text(public._oshi_setting('starter_book_type_ids')))::bigint)), '[]'::jsonb)
  )
$$;

create function public.oshi_choose_starter(p_request_id uuid, p_sticker_type bigint, p_book_type bigint) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._oshi_require_profile(); v_prev jsonb; v_sid uuid; v_bid uuid;
begin
  v_prev := public._oshi_idem_start(v_uid, p_request_id, 'choose_starter');
  if v_prev is not null then return v_prev; end if;
  if not (public._oshi_setting('starter_sticker_type_ids') @> to_jsonb(p_sticker_type))
     or not (public._oshi_setting('starter_book_type_ids') @> to_jsonb(p_book_type)) then
    raise exception 'invalid_starter';
  end if;
  insert into public.oshi_starter_choices (user_id, sticker_type_id, book_type_id)
    values (v_uid, p_sticker_type, p_book_type) on conflict do nothing;
  if not found then raise exception 'starter_already_chosen'; end if;
  -- シールは未開封で渡す（開封・ギフトを自分で選べるように）
  v_sid := public._oshi_grant_sticker(v_uid, p_sticker_type, 'sealed', 'starter');
  v_bid := public._oshi_grant_book(v_uid, p_book_type, 'starter');
  return public._oshi_idem_finish(v_uid, p_request_id, jsonb_build_object('sticker_id', v_sid, 'book_id', v_bid));
end $$;

-- シール帳のプレゼント。貼ってあるシールがない帳面だけ（シールは持ち主のもののため）
create function public.oshi_present_book(p_request_id uuid, p_book_id uuid, p_to uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._oshi_require_profile(); v_prev jsonb; v_b public.oshi_books; v_charm int;
begin
  v_prev := public._oshi_idem_start(v_uid, p_request_id, 'present_book');
  if v_prev is not null then return v_prev; end if;
  select * into v_b from public.oshi_books where id = p_book_id for update;
  if not found or v_b.owner_id <> v_uid then raise exception 'not_owner'; end if;
  if p_to = v_uid then raise exception 'cannot_gift_self'; end if;
  if not exists (select 1 from public.oshi_profiles where user_id = p_to) then raise exception 'user_not_found'; end if;
  if exists (select 1 from public.oshi_placements where book_id = p_book_id) then raise exception 'book_not_empty'; end if;
  select charm into v_charm from public.oshi_book_types where id = v_b.type_id;
  delete from public.oshi_profile_fav_books where book_id = p_book_id;
  update public.oshi_books set owner_id = p_to, acquired_at = now() where id = p_book_id;
  perform public._oshi_change_charm(v_uid, -v_charm, 'present_out');
  perform public._oshi_change_charm(p_to, v_charm, 'present_in');
  insert into public.oshi_item_events (item_kind, item_id, event, source, from_user, to_user)
    values ('book', p_book_id, 'present', 'present', v_uid, p_to);
  return public._oshi_idem_finish(v_uid, p_request_id, jsonb_build_object('book_id', p_book_id, 'to', p_to));
end $$;

-- 実行権限：新しい公開RPCはログインユーザーのみ
revoke all on function public._oshi_quest_done(uuid, text) from public, anon, authenticated;
do $$
declare f text;
begin
  foreach f in array array[
    'public.oshi_quest_list()',
    'public.oshi_claim_quest(uuid, text)',
    'public.oshi_starter_options()',
    'public.oshi_choose_starter(uuid, bigint, bigint)',
    'public.oshi_present_book(uuid, uuid, uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
