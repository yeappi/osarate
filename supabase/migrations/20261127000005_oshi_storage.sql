-- 推されーと：シール画像用のストレージバケット
-- 読み取りは公開、書き込みは運営画面から Service Role でのみ行う（storage.objects にポリシーは追加しない）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('oshi-stickers', 'oshi-stickers', true, 2097152, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do nothing;
