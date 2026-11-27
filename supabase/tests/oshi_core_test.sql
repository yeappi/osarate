-- =====================================================================
-- 推されーと：DB関数のテスト
-- 前提：migrations 適用済みの DB（または同一トランザクション内で適用直後）
-- 実行：psql -v ON_ERROR_STOP=1 -f supabase/tests/oshi_core_test.sql
-- 全体を BEGIN … ROLLBACK で包むので、データは残らない
-- 失敗時は 'FAIL: …' の例外で止まる
-- =====================================================================
begin;

-- ---------- テスト用ヘルパー ----------
create function pg_temp.ok(p_cond boolean, p_msg text) returns void language plpgsql as $$
begin
  if not coalesce(p_cond, false) then raise exception 'FAIL: %', p_msg; end if;
end $$;

create function pg_temp.fails(p_sql text, p_expected text) returns void language plpgsql as $$
declare v_err text;
begin
  begin execute p_sql; exception when others then v_err := sqlerrm; end;
  if v_err is null then raise exception 'FAIL (エラーにならなかった): %', p_sql; end if;
  if v_err not like '%' || p_expected || '%' then
    raise exception 'FAIL (想定外のエラー "%"): %', v_err, p_sql;
  end if;
end $$;

create function pg_temp.login(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
end $$;

create function pg_temp.login_anon(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated', 'is_anonymous', true)::text, true);
end $$;

-- テストユーザー A / B / C ＋ 匿名ログインユーザー D
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000000d', null, 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000a', 'oshi-test-a@example.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000b', 'oshi-test-b@example.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000c', 'oshi-test-c@example.invalid', 'authenticated', 'authenticated');

create temp table ctx (k text primary key, v text);
grant all on ctx to authenticated;

set local role authenticated;

-- ---------- 1. プロフィール作成・初期付与 ----------
do $$ begin
  perform pg_temp.login('00000000-0000-0000-0000-00000000000a');
  perform pg_temp.fails($q$ select public.oshi_claim_login_bonus() $q$, 'profile_required');
  perform public.oshi_create_profile('tester_a', 'テストA');
  perform pg_temp.ok((public.oshi_my_wallet()->>'points')::int = 3000, '初期ポイント3000');
  perform pg_temp.ok((select count(*) from public.oshi_books
                      where owner_id = '00000000-0000-0000-0000-00000000000a') = 1, '初期シール帳1冊');
  perform pg_temp.fails($q$ select public.oshi_create_profile('tester_a2','x') $q$, 'profile_exists');

  perform pg_temp.login('00000000-0000-0000-0000-00000000000b');
  perform pg_temp.fails($q$ select public.oshi_create_profile('TESTER_A','B') $q$, 'handle_taken');
  perform pg_temp.fails($q$ select public.oshi_create_profile('b!','B') $q$, 'invalid_handle');
  perform public.oshi_create_profile('tester_b', 'テストB');

  perform pg_temp.login('00000000-0000-0000-0000-00000000000c');
  perform public.oshi_create_profile('tester_c', 'テストC');

  -- 匿名ログインはプロフィール作成も更新系操作もできない
  perform pg_temp.login_anon('00000000-0000-0000-0000-00000000000d');
  perform pg_temp.fails($q$ select public.oshi_create_profile('tester_d', 'テストD') $q$, 'anonymous_not_allowed');
  perform pg_temp.fails($q$ select public.oshi_claim_login_bonus() $q$, 'anonymous_not_allowed');
  perform pg_temp.ok(exists (select 1 from public.oshi_dex_view(auth.uid(), 'main')), '匿名でも図鑑は見られる');
  -- 正規ユーザーのIDでも匿名トークンなら拒否
  perform pg_temp.login_anon('00000000-0000-0000-0000-00000000000a');
  perform pg_temp.fails($q$ select public.oshi_claim_login_bonus() $q$, 'anonymous_not_allowed');
end $$;

-- ---------- 2. 直接書き換え・秘匿列・内部関数の禁止 ----------
do $$ begin
  perform pg_temp.login('00000000-0000-0000-0000-00000000000a');
  perform pg_temp.fails($q$ update public.oshi_profiles set points = 999999 $q$, 'permission denied');
  perform pg_temp.fails($q$ select points from public.oshi_profiles $q$, 'permission denied');
  perform pg_temp.fails($q$ insert into public.oshi_stickers (type_id, owner_id, serial_no) values (1, auth.uid(), 999) $q$, 'permission denied');
  perform pg_temp.fails($q$ select public._oshi_change_points(auth.uid(), 100000, 'hack') $q$, 'permission denied');
  perform pg_temp.fails($q$ select * from public.oshi_pachi_secret $q$, 'permission denied');
  perform pg_temp.fails($q$ select public.oshi_admin_grant(gen_random_uuid(), auth.uid(), 'points', null, 1, 'sealed', 1000) $q$, 'forbidden');
  -- 公開列は読める
  perform pg_temp.ok((select count(*) from public.oshi_profiles where handle like 'tester_%') = 3, '公開プロフィールが読める');
end $$;

-- ---------- 3. ログインボーナス ----------
do $$ declare r jsonb; begin
  perform pg_temp.login('00000000-0000-0000-0000-00000000000a');
  r := public.oshi_claim_login_bonus();
  perform pg_temp.ok((r->>'claimed')::boolean and (r->>'amount')::int = 50, '初日50pt');
  r := public.oshi_claim_login_bonus();
  perform pg_temp.ok(not (r->>'claimed')::boolean, '同日2回目は付与なし');
  perform pg_temp.ok((public.oshi_my_wallet()->>'points')::int = 3050, 'ログボ後3050');
end $$;

-- ---------- 4. 図鑑購入と冪等性 ----------
do $$ declare r1 jsonb; r2 jsonb; v_req uuid := gen_random_uuid(); v_ribbon bigint; begin
  perform pg_temp.login('00000000-0000-0000-0000-00000000000a');
  select id into v_ribbon from public.oshi_sticker_types where name = 'リボン';
  r1 := public.oshi_buy_sticker(v_req, v_ribbon, 1, false);
  r2 := public.oshi_buy_sticker(v_req, v_ribbon, 1, false);  -- 同じリクエストIDで再送
  perform pg_temp.ok(r1 = r2, '再送は同じ結果を返す');
  perform pg_temp.ok((public.oshi_my_wallet()->>'points')::int = 3050 - 1500, 'リボン1500ptを1回だけ消費');
  perform pg_temp.ok((select count(*) from public.oshi_stickers s join public.oshi_sticker_types t on t.id = s.type_id
                      where s.owner_id = auth.uid() and t.name = 'リボン') = 1, 'リボンは1枚だけ');
  insert into ctx values ('ribbon', r1->'sticker_ids'->>0);

  perform pg_temp.fails(format($q$ select public.oshi_buy_sticker(gen_random_uuid(), %s, 1) $q$,
    (select id from public.oshi_sticker_types where name = 'おおきな花')), 'insufficient_points');
  perform pg_temp.fails(format($q$ select public.oshi_buy_sticker(gen_random_uuid(), %s, 1) $q$,
    (select id from public.oshi_sticker_types where name = 'ひみつの鍵')), 'not_purchasable');
  perform pg_temp.fails(format($q$ select public.oshi_pachi_lend(%L, 1) $q$, v_req), 'request_id_reused');
end $$;

-- ---------- 5. 開封・貼付・移動・剥がし ----------
do $$ declare v_s uuid := (select v::uuid from ctx where k = 'ribbon'); v_book uuid; begin
  perform pg_temp.login('00000000-0000-0000-0000-00000000000a');
  select id into v_book from public.oshi_books where owner_id = auth.uid() limit 1;
  insert into ctx values ('book_a', v_book);
  perform pg_temp.fails(format($q$ select public.oshi_place_sticker(%L, %L, 1, 0, 0) $q$, v_s, v_book), 'place_requires_opened');
  perform public.oshi_open_sticker(v_s);
  perform public.oshi_place_sticker(v_s, v_book, 1, 0, 0);
  perform public.oshi_place_sticker(v_s, v_book, 2, 10, 10);   -- 移動
  perform pg_temp.ok((select count(*) from public.oshi_placements where sticker_id = v_s) = 1, '貼付は常に1か所');
  perform pg_temp.ok((select page from public.oshi_placements where sticker_id = v_s) = 2, '移動が反映');
  perform pg_temp.fails(format($q$ select public.oshi_place_sticker(%L, %L, 1, 350, 0) $q$, v_s, v_book), 'out_of_page');
  perform pg_temp.fails(format($q$ select public.oshi_place_sticker(%L, %L, 99, 0, 0) $q$, v_s, v_book), 'invalid_page');

  perform pg_temp.login('00000000-0000-0000-0000-00000000000b');
  perform pg_temp.fails(format($q$ select public.oshi_remove_sticker(%L) $q$, v_s), 'not_owner');
  perform pg_temp.fails(format($q$ select public.oshi_place_sticker(%L, %L, 1, 0, 0) $q$, v_s, v_book), 'not_owner');
end $$;

-- ---------- 6. ギフト（還元は1回だけ・再ギフト不可） ----------
do $$
declare v_star bigint; r jsonb; g jsonb; g2 jsonb; v_req uuid := gen_random_uuid(); v_s uuid; v_b_before int; v_b_after int;
begin
  perform pg_temp.login('00000000-0000-0000-0000-00000000000a');
  select id into v_star from public.oshi_sticker_types where name = 'ちいさな星';
  r := public.oshi_buy_sticker(gen_random_uuid(), v_star, 2, false);
  v_s := (r->'sticker_ids'->>0)::uuid;
  insert into ctx values ('star_gifted', v_s), ('star_kept', r->'sticker_ids'->>1);

  perform pg_temp.fails(format($q$ select public.oshi_send_gift(gen_random_uuid(), %L, auth.uid()) $q$, v_s), 'cannot_gift_self');

  perform pg_temp.login('00000000-0000-0000-0000-00000000000b');
  v_b_before := (public.oshi_my_wallet()->>'points')::int;

  perform pg_temp.login('00000000-0000-0000-0000-00000000000a');
  g  := public.oshi_send_gift(v_req, v_s, '00000000-0000-0000-0000-00000000000b', 'どうぞ');
  g2 := public.oshi_send_gift(v_req, v_s, '00000000-0000-0000-0000-00000000000b', 'どうぞ');
  perform pg_temp.ok(g = g2, 'ギフト再送は同じ結果');
  perform pg_temp.ok((g->>'base_price')::int = 10, '還元基準は基本売値10pt');
  perform pg_temp.ok((g->>'rate_pct')::int in (0,10,30,100,200,500), '還元率は表の値');
  perform pg_temp.ok((g->>'reward')::int = floor(10 * (g->>'rate_pct')::int / 100.0), '還元額=切り捨て');

  perform pg_temp.login('00000000-0000-0000-0000-00000000000b');
  v_b_after := (public.oshi_my_wallet()->>'points')::int;
  perform pg_temp.ok(v_b_after - v_b_before = (g->>'reward')::int, '受け手に還元が1回だけ入る');
  perform pg_temp.ok((select owner_id from public.oshi_stickers where id = v_s) = auth.uid(), '所有者が受け手に');
  perform pg_temp.fails(format($q$ select public.oshi_send_gift(gen_random_uuid(), %L, '00000000-0000-0000-0000-00000000000c') $q$, v_s), 'already_gifted');
  -- 受け取ったギフトは開封・プレゼントはできる
  perform public.oshi_open_sticker(v_s);
  perform pg_temp.ok((select count(*) from public.oshi_transfers where sticker_id = v_s and kind = 'gift') = 1, 'ギフト記録は1件');

  -- 開封済みはギフト不可
  perform pg_temp.login('00000000-0000-0000-0000-00000000000a');
  perform public.oshi_open_sticker((select v::uuid from ctx where k = 'star_kept'));
  perform pg_temp.fails(format($q$ select public.oshi_send_gift(gen_random_uuid(), %L, '00000000-0000-0000-0000-00000000000b') $q$,
    (select v from ctx where k = 'star_kept')), 'gift_requires_sealed');
end $$;

-- ---------- 7. 図鑑購入＋ギフト（相手の図鑑から贈る導線） ----------
do $$ declare g jsonb; begin
  perform pg_temp.login('00000000-0000-0000-0000-00000000000a');
  g := public.oshi_buy_sticker(gen_random_uuid(), (select id from public.oshi_sticker_types where name = 'ちいさなハート'),
         1, false, '00000000-0000-0000-0000-00000000000c', 'はい');
  perform pg_temp.ok((g->'gift'->>'to')::uuid = '00000000-0000-0000-0000-00000000000c', '購入と同時にギフト');
  perform pg_temp.fails(format($q$ select public.oshi_buy_sticker(gen_random_uuid(), %s, 2, false, '00000000-0000-0000-0000-00000000000c') $q$,
    (select id from public.oshi_sticker_types where name = 'ちいさなハート')), 'invalid_qty');
end $$;

-- ---------- 8. プレゼント（貼付中は自動で剥がれる・魅力値が移る） ----------
do $$ declare v_s uuid := (select v::uuid from ctx where k = 'ribbon'); v_a_before bigint; v_c_before bigint; begin
  perform pg_temp.login('00000000-0000-0000-0000-00000000000a');
  perform public.oshi_set_favorites(array[v_s]);
  v_a_before := (select charm_total from public.oshi_profiles where handle = 'tester_a');
  v_c_before := (select charm_total from public.oshi_profiles where handle = 'tester_c');
  perform public.oshi_send_present(gen_random_uuid(), v_s, '00000000-0000-0000-0000-00000000000c');
  perform pg_temp.ok(not exists (select 1 from public.oshi_placements where sticker_id = v_s), '貼付が外れる');
  perform pg_temp.ok(not exists (select 1 from public.oshi_profile_favorites where sticker_id = v_s), 'TOP3から外れる');
  perform pg_temp.ok((select charm_total from public.oshi_profiles where handle = 'tester_a') = v_a_before - 150, '送り手の魅力値-150');
  perform pg_temp.ok((select charm_total from public.oshi_profiles where handle = 'tester_c') = v_c_before + 150, '受け手の魅力値+150');
  perform pg_temp.fails(format($q$ select public.oshi_set_favorites(array[%L]::uuid[]) $q$, v_s), 'not_owner');

  perform pg_temp.login('00000000-0000-0000-0000-00000000000c');
  perform public.oshi_set_favorites(array[v_s]);
  perform public.oshi_set_profile_bg(jsonb_build_array(jsonb_build_object('sticker_id', v_s, 'x', 0, 'y', 0)));
  perform pg_temp.fails(format($q$ select public.oshi_set_profile_bg('[{"sticker_id":"%s","x":330,"y":0}]') $q$, v_s), 'out_of_page');
end $$;

-- ---------- 9. フォロー・ランキング・図鑑 ----------
do $$ begin
  perform pg_temp.login('00000000-0000-0000-0000-00000000000a');
  perform public.oshi_follow('00000000-0000-0000-0000-00000000000b');
  perform public.oshi_follow('00000000-0000-0000-0000-00000000000b');  -- 二重フォローは無害
  perform pg_temp.fails($q$ select public.oshi_follow(auth.uid()) $q$, 'cannot_follow_self');
  perform pg_temp.ok(exists (select 1 from public.oshi_ranking('support','all', auth.uid()) r where r.user_id = auth.uid()), '応援力ランキングに載る');
  perform pg_temp.ok(exists (select 1 from public.oshi_ranking('charm','day') r where r.handle = 'tester_c'), '日間魅力値ランキング');
  perform pg_temp.ok(not exists (select 1 from public.oshi_dex_view(auth.uid(), 'main') d where d.name = 'ひみつの鍵'), '未所持の非表示シールは出ない');
  perform pg_temp.ok((select owned from public.oshi_dex_view(auth.uid(), 'main') d where d.name = 'リボン'), '手放しても図鑑は埋まったまま');
end $$;

-- ---------- 10. パチ屋 ----------
do $$ declare r jsonb; v_before_support bigint; begin
  perform pg_temp.login('00000000-0000-0000-0000-00000000000a');
  v_before_support := (select support_total from public.oshi_profiles where handle = 'tester_a');
  r := public.oshi_pachi_lend(gen_random_uuid(), 100);
  perform pg_temp.ok((r->>'balls')::int = 100, '100pt→100玉');
  perform pg_temp.ok((select support_total from public.oshi_profiles where handle = 'tester_a') = v_before_support + 100, '玉貸しは応援力に加算');
  r := public.oshi_pachi_spin(gen_random_uuid(), 1::smallint, 10);
  perform pg_temp.ok((r->>'balls')::int = (r->>'payout')::int, '10回転で100玉消費＋払い出し');
  perform pg_temp.ok(jsonb_array_length(r->'results') = 10, '結果10件');
  perform pg_temp.fails($q$ select public.oshi_pachi_spin(gen_random_uuid(), 1::smallint, 11) $q$, 'invalid_qty');
  if (r->>'balls')::int < 100 then
    perform pg_temp.fails($q$ select public.oshi_pachi_spin(gen_random_uuid(), 1::smallint, 10) $q$, 'insufficient_balls');
  end if;
  if (r->>'balls')::int > 0 then
    r := public.oshi_pachi_cashout(gen_random_uuid(), (r->>'balls')::int);
    perform pg_temp.ok((r->>'balls')::int = 0, '精算で玉0');
  end if;
  perform pg_temp.fails($q$ select public.oshi_pachi_exchange(gen_random_uuid(),
    (select id from public.oshi_shop_listings where venue = 'prize' limit 1)) $q$, 'insufficient_balls');
end $$;

-- ---------- 11. 整合性（postgres として全体を検査） ----------
reset role;
do $$ begin
  perform pg_temp.ok((select sum(spins) from public.oshi_pachi_daily where machine_id = 1) >= 10, '台の統計に反映');
  -- 残高 = ポイント履歴の合計
  perform pg_temp.ok(not exists (
    select 1 from public.oshi_profiles p
     where p.handle like 'tester_%'
       and p.points <> coalesce((select sum(delta) from public.oshi_point_ledger l where l.user_id = p.user_id), 0)
  ), '残高とポイント履歴が一致');
  -- 魅力値 = 所持シール＋シール帳の魅力値合計
  perform pg_temp.ok(not exists (
    select 1 from public.oshi_profiles p
     where p.handle like 'tester_%'
       and p.charm_total <>
         coalesce((select sum(t.charm) from public.oshi_stickers s join public.oshi_sticker_types t on t.id = s.type_id where s.owner_id = p.user_id), 0)
       + coalesce((select sum(t.charm) from public.oshi_books b join public.oshi_book_types t on t.id = b.type_id where b.owner_id = p.user_id), 0)
  ), '魅力値と所持品が一致');
  -- 応援力 = 応援対象の消費の合計
  perform pg_temp.ok(not exists (
    select 1 from public.oshi_profiles p
     where p.handle like 'tester_%'
       and p.support_total <> coalesce((select sum(-delta) from public.oshi_point_ledger l where l.user_id = p.user_id and l.is_support), 0)
  ), '応援力と消費履歴が一致');
  -- 玉 = 玉履歴の合計
  perform pg_temp.ok(not exists (
    select 1 from public.oshi_profiles p
     where p.handle like 'tester_%'
       and p.balls <> coalesce((select sum(delta) from public.oshi_ball_ledger l where l.user_id = p.user_id), 0)
  ), '玉と玉履歴が一致');
  raise notice 'ALL OSHI TESTS PASSED';
end $$;

rollback;
