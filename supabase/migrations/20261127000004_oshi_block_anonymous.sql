-- =====================================================================
-- 推されーと：匿名ログイン（Supabase Anonymous Sign-ins）のユーザーを拒否する
-- 共有プロジェクトでは他アプリが匿名ログインを使っているため、
-- 推されーと側の関数で弾く（プロジェクト全体の認証設定は変更しない）
-- 読み取り専用の関数（図鑑・ランキング）は従来どおり誰でも呼べる
-- =====================================================================

create function public._oshi_is_anonymous() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'is_anonymous')::boolean, false)
$$;
revoke all on function public._oshi_is_anonymous() from public, anon, authenticated;

-- 更新系RPCはすべてこの関数を通るので、ここで弾けば全体に効く
create or replace function public._oshi_require_profile() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if public._oshi_is_anonymous() then raise exception 'anonymous_not_allowed'; end if;
  if not exists (select 1 from public.oshi_profiles where user_id = v_uid) then
    raise exception 'profile_required';
  end if;
  return v_uid;
end $$;

create or replace function public.oshi_create_profile(p_handle text, p_display_name text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_book_type bigint; v_points bigint;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if public._oshi_is_anonymous() then raise exception 'anonymous_not_allowed'; end if;
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
