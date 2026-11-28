-- つながりと安全：ギフトの既読・ブロック・通報・シール帳のいいね・図鑑の分類
-- oshi_ の表・関数の追加と変更のみ。既存アプリには触れない

-- =====================================================================
-- ギフト・プレゼントの既読
-- =====================================================================
alter table public.oshi_transfers add column seen_at timestamptz;
update public.oshi_transfers set seen_at = now();   -- 既存分は既読にする
create index oshi_transfers_unseen_idx on public.oshi_transfers (to_user) where seen_at is null;

create function public.oshi_mark_gifts_seen() returns int
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._oshi_require_profile(); v_n int;
begin
  update public.oshi_transfers set seen_at = now() where to_user = v_uid and seen_at is null;
  get diagnostics v_n = row_count;
  return v_n;
end $$;

-- =====================================================================
-- ブロック
-- =====================================================================
create table public.oshi_blocks (
  blocker_id uuid not null references public.oshi_profiles(user_id) on delete cascade,
  blocked_id uuid not null references public.oshi_profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.oshi_blocks enable row level security;
revoke all on public.oshi_blocks from anon, authenticated;
grant select on public.oshi_blocks to authenticated;
create policy oshi_blocks_self on public.oshi_blocks for select to authenticated using (blocker_id = auth.uid());

create function public._oshi_is_blocked(p_receiver uuid, p_sender uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.oshi_blocks where blocker_id = p_receiver and blocked_id = p_sender)
$$;

create function public.oshi_block(p_target uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._oshi_require_profile();
begin
  if p_target = v_uid then raise exception 'cannot_block_self'; end if;
  if not exists (select 1 from public.oshi_profiles where user_id = p_target) then raise exception 'user_not_found'; end if;
  insert into public.oshi_blocks (blocker_id, blocked_id) values (v_uid, p_target) on conflict do nothing;
  delete from public.oshi_follows
   where (follower_id = v_uid and followee_id = p_target) or (follower_id = p_target and followee_id = v_uid);
end $$;

create function public.oshi_unblock(p_target uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._oshi_require_profile();
begin
  delete from public.oshi_blocks where blocker_id = v_uid and blocked_id = p_target;
end $$;

-- ブロックされている相手には、ギフト・プレゼントを贈れない（共通の移転処理で止める）
create or replace function public._oshi_transfer_sticker(p_sticker_id uuid, p_to uuid, p_kind text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_s public.oshi_stickers; v_charm int;
begin
  select * into v_s from public.oshi_stickers where id = p_sticker_id for update;
  if public._oshi_is_blocked(p_to, v_s.owner_id) then raise exception 'blocked'; end if;
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

create or replace function public.oshi_present_book(p_request_id uuid, p_book_id uuid, p_to uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._oshi_require_profile(); v_prev jsonb; v_b public.oshi_books; v_charm int;
begin
  v_prev := public._oshi_idem_start(v_uid, p_request_id, 'present_book');
  if v_prev is not null then return v_prev; end if;
  select * into v_b from public.oshi_books where id = p_book_id for update;
  if not found or v_b.owner_id <> v_uid then raise exception 'not_owner'; end if;
  if p_to = v_uid then raise exception 'cannot_gift_self'; end if;
  if not exists (select 1 from public.oshi_profiles where user_id = p_to) then raise exception 'user_not_found'; end if;
  if public._oshi_is_blocked(p_to, v_uid) then raise exception 'blocked'; end if;
  if exists (select 1 from public.oshi_placements where book_id = p_book_id) then raise exception 'book_not_empty'; end if;
  select charm into v_charm from public.oshi_book_types where id = v_b.type_id;
  delete from public.oshi_profile_fav_books where book_id = p_book_id;
  delete from public.oshi_book_likes where book_id = p_book_id;
  update public.oshi_books set owner_id = p_to, acquired_at = now() where id = p_book_id;
  perform public._oshi_change_charm(v_uid, -v_charm, 'present_out');
  perform public._oshi_change_charm(p_to, v_charm, 'present_in');
  insert into public.oshi_item_events (item_kind, item_id, event, source, from_user, to_user)
    values ('book', p_book_id, 'present', 'present', v_uid, p_to);
  return public._oshi_idem_finish(v_uid, p_request_id, jsonb_build_object('book_id', p_book_id, 'to', p_to));
end $$;

-- ブロックしている相手・されている相手はフォローできない
create or replace function public.oshi_follow(p_target uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._oshi_require_profile();
begin
  if p_target = v_uid then raise exception 'cannot_follow_self'; end if;
  if not exists (select 1 from public.oshi_profiles where user_id = p_target) then raise exception 'user_not_found'; end if;
  if public._oshi_is_blocked(p_target, v_uid) or public._oshi_is_blocked(v_uid, p_target) then raise exception 'blocked'; end if;
  insert into public.oshi_follows (follower_id, followee_id) values (v_uid, p_target) on conflict do nothing;
end $$;

-- =====================================================================
-- 通報
-- =====================================================================
create table public.oshi_reports (
  id          bigint generated always as identity primary key,
  reporter_id uuid not null references public.oshi_profiles(user_id) on delete cascade,
  target_id   uuid not null references public.oshi_profiles(user_id) on delete cascade,
  transfer_id bigint references public.oshi_transfers(id) on delete set null,
  reason      text not null default '' check (char_length(reason) <= 300),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);
alter table public.oshi_reports enable row level security;
revoke all on public.oshi_reports from anon, authenticated;

create function public.oshi_report(p_target uuid, p_transfer_id bigint, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._oshi_require_profile();
begin
  if p_target = v_uid then raise exception 'cannot_report_self'; end if;
  if not exists (select 1 from public.oshi_profiles where user_id = p_target) then raise exception 'user_not_found'; end if;
  -- 通報できるのは、自分が受け取ったギフトのみ（ギフト指定がある場合）
  if p_transfer_id is not null and not exists (
    select 1 from public.oshi_transfers where id = p_transfer_id and to_user = v_uid and from_user = p_target) then
    raise exception 'not_found';
  end if;
  if (select count(*) from public.oshi_reports where reporter_id = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception 'too_many_reports';
  end if;
  insert into public.oshi_reports (reporter_id, target_id, transfer_id, reason)
    values (v_uid, p_target, p_transfer_id, left(coalesce(p_reason, ''), 300));
end $$;

create function public.oshi_admin_reports()
returns table (id bigint, created_at timestamptz, reason text, transfer_id bigint, message text,
               reporter_handle text, target_handle text, target_id uuid)
language sql stable security definer set search_path = '' as $$
  select r.id, r.created_at, r.reason, r.transfer_id, t.message, rp.handle, tg.handle, r.target_id
    from public.oshi_reports r
    join public.oshi_profiles rp on rp.user_id = r.reporter_id
    join public.oshi_profiles tg on tg.user_id = r.target_id
    left join public.oshi_transfers t on t.id = r.transfer_id
   where public._oshi_require_admin() is not null and r.resolved_at is null
   order by r.created_at desc
   limit 200
$$;

create function public.oshi_admin_resolve_report(p_id bigint, p_clear_message boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare v_t bigint;
begin
  perform public._oshi_require_admin();
  update public.oshi_reports set resolved_at = now() where id = p_id and resolved_at is null returning transfer_id into v_t;
  if p_clear_message and v_t is not null then
    update public.oshi_transfers set message = '' where id = v_t;
  end if;
end $$;

-- =====================================================================
-- シール帳のいいね（だれでも数を見られる。付け外しは RPC のみ）
-- =====================================================================
create table public.oshi_book_likes (
  user_id    uuid not null references public.oshi_profiles(user_id) on delete cascade,
  book_id    uuid not null references public.oshi_books(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, book_id)
);
create index oshi_book_likes_book_idx on public.oshi_book_likes (book_id);
alter table public.oshi_book_likes enable row level security;
revoke all on public.oshi_book_likes from anon, authenticated;
grant select on public.oshi_book_likes to anon, authenticated;
create policy oshi_book_likes_read on public.oshi_book_likes for select using (true);

create function public.oshi_toggle_book_like(p_book_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._oshi_require_profile(); v_owner uuid; v_liked boolean;
begin
  select owner_id into v_owner from public.oshi_books where id = p_book_id;
  if v_owner is null then raise exception 'not_found'; end if;
  if v_owner = v_uid then raise exception 'cannot_like_own'; end if;
  delete from public.oshi_book_likes where user_id = v_uid and book_id = p_book_id;
  if found then v_liked := false;
  else
    insert into public.oshi_book_likes (user_id, book_id) values (v_uid, p_book_id);
    v_liked := true;
  end if;
  return jsonb_build_object('liked', v_liked,
    'count', (select count(*) from public.oshi_book_likes where book_id = p_book_id));
end $$;

-- =====================================================================
-- 図鑑の分類（category: theme / base / legend / starter、series: テーマ名・画風名）
-- =====================================================================
alter table public.oshi_sticker_types add column category text not null default 'other';
alter table public.oshi_sticker_types add column series text not null default '';

update public.oshi_sticker_types t set category = v.category, series = v.series
  from (values
    ('/stickers/pop\_pop\_%',     'theme', 'ポップ'),
    ('/stickers/fresh\_fr\_%',    'theme', '爽やか'),
    ('/stickers/dream\_dd\_%',    'theme', 'ゆめかわダーク'),
    ('/stickers/dark\_dk\_%',     'theme', 'ダーク'),
    ('/stickers/pop\_b\_%',       'base',  'ポップ'),
    ('/stickers/fresh\_b\_%',     'base',  '爽やか'),
    ('/stickers/dream\_b\_%',     'base',  'ゆめかわダーク'),
    ('/stickers/dark\_b\_%',      'base',  'ダーク'),
    ('/stickers/mat\_puffy\_%',   'base',  'ぷっくり'),
    ('/stickers/mat\_emb\_%',     'base',  '刺繍'),
    ('/stickers/mat\_felt\_%',    'base',  'フェルト'),
    ('/stickers/mat\_wood\_%',    'base',  '木製'),
    ('/stickers/mat\_acryl\_%',   'base',  'アクリル'),
    ('/stickers/mat\_paper\_%',   'base',  '紙の切り抜き'),
    ('/stickers/legend\_%',       'legend', ''),
    ('/stickers/starter\_%',      'starter', '')
  ) as v(pattern, category, series)
 where t.image_path like v.pattern;

-- 図鑑の取得に分類を足す（戻り値が変わるため作り直す）
drop function public.oshi_dex_view(uuid, text);
create function public.oshi_dex_view(p_user uuid, p_dex text)
returns table (type_id bigint, name text, image_path text, width int, height int, charm int,
               price bigint, kind text, rarity text, dex_purchasable boolean, owned boolean,
               category text, series text)
language sql stable security definer set search_path = '' as $$
  select t.id, t.name, t.image_path, t.width, t.height, t.charm,
         public._oshi_sticker_price(t.id), t.kind, t.rarity,
         t.dex_purchasable and t.is_active,
         (dp.user_id is not null),
         t.category, t.series
    from public.oshi_sticker_types t
    left join public.oshi_dex_progress dp on dp.type_id = t.id and dp.user_id = p_user
   where t.dex_id = p_dex
     and (t.dex_visibility = 'always' or dp.user_id is not null)
   order by t.sort, t.id
$$;

-- =====================================================================
-- 実行権限
-- =====================================================================
revoke all on function public._oshi_is_blocked(uuid, uuid) from public, anon, authenticated;
revoke all on function public._oshi_transfer_sticker(uuid, uuid, text) from public, anon, authenticated;
do $$
declare f text;
begin
  foreach f in array array[
    'public.oshi_mark_gifts_seen()',
    'public.oshi_block(uuid)',
    'public.oshi_unblock(uuid)',
    'public.oshi_report(uuid, bigint, text)',
    'public.oshi_admin_reports()',
    'public.oshi_admin_resolve_report(bigint, boolean)',
    'public.oshi_toggle_book_like(uuid)',
    'public.oshi_present_book(uuid, uuid, uuid)',
    'public.oshi_follow(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
-- 図鑑はログインしていない人も見られる（作り直す前と同じ）
grant execute on function public.oshi_dex_view(uuid, text) to anon, authenticated;
