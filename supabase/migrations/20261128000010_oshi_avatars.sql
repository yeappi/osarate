-- 推されーと：アイコン画像の置き場
-- 本人が、自分のユーザーIDのフォルダ（<uid>/...）にだけ置ける。読み取りは公開。
-- ポリシーは bucket_id = 'oshi-avatars' に限定しているので、他アプリの画像には効かない
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('oshi-avatars', 'oshi-avatars', true, 1048576, array['image/webp','image/jpeg','image/png'])
on conflict (id) do nothing;

create policy oshi_avatars_select_own on storage.objects for select to authenticated
  using (bucket_id = 'oshi-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy oshi_avatars_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'oshi-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy oshi_avatars_update_own on storage.objects for update to authenticated
  using (bucket_id = 'oshi-avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'oshi-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy oshi_avatars_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'oshi-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- アイコンは自分の置き場の画像だけにする（外部の任意のURLを表示させない）
create or replace function public.oshi_update_profile(p_display_name text, p_bio text, p_avatar_url text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._oshi_require_profile(); v_avatar text := nullif(trim(coalesce(p_avatar_url,'')),'');
begin
  if char_length(trim(coalesce(p_display_name,''))) not between 1 and 30 then
    raise exception 'invalid_display_name';
  end if;
  if char_length(coalesce(p_bio,'')) > 200 then raise exception 'bio_too_long'; end if;
  if v_avatar is not null
     and v_avatar is distinct from (select avatar_url from public.oshi_profiles where user_id = v_uid)
     and v_avatar not like 'https://%/storage/v1/object/public/oshi-avatars/' || v_uid::text || '/%' then
    raise exception 'invalid_avatar';
  end if;
  update public.oshi_profiles
     set display_name = trim(p_display_name), bio = coalesce(p_bio,''), avatar_url = v_avatar
   where user_id = v_uid;
end $$;
