-- 公式シール 82種（テーマ4種×8＋基礎シール5マーク×10画風）
-- 画像はアプリ同梱（public/stickers）。image_path が "/" で始まるものはアプリ内の画像として表示する
-- 既存テーブルへの追加・更新のみ（構造の変更なし）

insert into public.oshi_sticker_types
  (dex_id, name, image_path, width, height, charm, price_override, kind, rarity, dex_visibility, dex_purchasable, sort)
select 'main', v.name, v.image_path, v.width, v.height, v.charm, v.price, 'basic', v.rarity, 'always', true, v.sort
  from (values
  ('ゲームメダル', '/stickers/pop_pop_medal.png', 91, 92, 5, 50, 'common', 101),
  ('あたり棒', '/stickers/pop_pop_atari.png', 54, 92, 5, 50, 'common', 102),
  ('ガチャのカプセル', '/stickers/pop_pop_capsule.png', 111, 112, 8, 80, 'rare', 103),
  ('LUCKY!', '/stickers/pop_pop_lucky.png', 92, 79, 5, 50, 'common', 104),
  ('ハイスコア', '/stickers/pop_pop_score.png', 140, 74, 15, 150, 'epic', 105),
  ('十字キー', '/stickers/pop_pop_dpad.png', 71, 72, 3, 30, 'common', 106),
  ('10円の値札', '/stickers/pop_pop_price.png', 89, 92, 5, 50, 'common', 107),
  ('PRESS START', '/stickers/pop_pop_start.png', 72, 35, 3, 30, 'common', 108),
  ('まるドット（ポップ）', '/stickers/pop_b_dot.png', 24, 24, 0, 5, 'common', 1000),
  ('キラッ（ポップ）', '/stickers/pop_b_sparkle.png', 32, 32, 0, 5, 'common', 1020),
  ('ラインストーン（ポップ）', '/stickers/pop_b_stone.png', 30, 30, 1, 15, 'common', 1040),
  ('パール（ポップ）', '/stickers/pop_b_pearl.png', 26, 26, 1, 15, 'common', 1060),
  ('マステ（ポップ）', '/stickers/pop_b_tape.png', 72, 37, 1, 10, 'common', 1080),
  ('サーフクラブ', '/stickers/fresh_fr_surf.png', 139, 140, 15, 150, 'epic', 111),
  ('細い波', '/stickers/fresh_fr_wave.png', 72, 39, 3, 30, 'common', 112),
  ('テニスクラブの旗', '/stickers/fresh_fr_pennant.png', 92, 58, 5, 50, 'common', 113),
  ('水温28℃', '/stickers/fresh_fr_temp.png', 92, 72, 5, 50, 'common', 114),
  ('海辺行きの乗車券', '/stickers/fresh_fr_bus.png', 112, 56, 8, 80, 'rare', 115),
  ('SUMMERの太陽', '/stickers/fresh_fr_sun.png', 92, 65, 5, 50, 'common', 116),
  ('背番号07', '/stickers/fresh_fr_number.png', 82, 92, 5, 50, 'common', 117),
  ('ひとしずく', '/stickers/fresh_fr_drop.png', 52, 72, 3, 30, 'common', 118),
  ('まるドット（爽やか）', '/stickers/fresh_b_dot.png', 24, 24, 0, 5, 'common', 1001),
  ('キラッ（爽やか）', '/stickers/fresh_b_sparkle.png', 32, 32, 0, 5, 'common', 1021),
  ('ラインストーン（爽やか）', '/stickers/fresh_b_stone.png', 30, 30, 1, 15, 'common', 1041),
  ('パール（爽やか）', '/stickers/fresh_b_pearl.png', 26, 26, 1, 15, 'common', 1061),
  ('マステ（爽やか）', '/stickers/fresh_b_tape.png', 72, 30, 1, 10, 'common', 1081),
  ('ポーションのラベル', '/stickers/dream_dd_label.png', 112, 99, 8, 80, 'rare', 121),
  ('タロット・月', '/stickers/dream_dd_tarot.png', 90, 140, 15, 150, 'epic', 122),
  ('まじょの鍵', '/stickers/dream_dd_key.png', 92, 56, 5, 50, 'common', 123),
  ('まほうじん', '/stickers/dream_dd_circle.png', 91, 92, 5, 50, 'common', 124),
  ('まじょの値札', '/stickers/dream_dd_tag.png', 92, 77, 5, 50, 'common', 125),
  ('まよなかだけ開店', '/stickers/dream_dd_sign.png', 72, 55, 3, 30, 'common', 126),
  ('よるの蛾', '/stickers/dream_dd_moth.png', 92, 63, 5, 50, 'common', 127),
  ('ほしの封蝋', '/stickers/dream_dd_wax.png', 71, 72, 3, 30, 'common', 128),
  ('まるドット（ゆめかわ）', '/stickers/dream_b_dot.png', 24, 24, 0, 5, 'common', 1002),
  ('キラッ（ゆめかわ）', '/stickers/dream_b_sparkle.png', 32, 32, 0, 5, 'common', 1022),
  ('ラインストーン（ゆめかわ）', '/stickers/dream_b_stone.png', 30, 30, 1, 15, 'common', 1042),
  ('パール（ゆめかわ）', '/stickers/dream_b_pearl.png', 26, 26, 1, 15, 'common', 1062),
  ('マステ（ゆめかわ）', '/stickers/dream_b_tape.png', 72, 32, 1, 10, 'common', 1082),
  ('地下の半券', '/stickers/dark_dk_ticket.png', 112, 66, 8, 80, 'rare', 131),
  ('ギターピック', '/stickers/dark_dk_pick.png', 79, 92, 5, 50, 'common', 132),
  ('モータークラブ', '/stickers/dark_dk_emblem.png', 140, 88, 15, 150, 'epic', 133),
  ('ALL NIGHTの刻印', '/stickers/dark_dk_seal.png', 91, 92, 5, 50, 'common', 134),
  ('版画の月', '/stickers/dark_dk_moon.png', 91, 92, 5, 50, 'common', 135),
  ('ナンバープレート', '/stickers/dark_dk_plate.png', 72, 46, 3, 30, 'common', 136),
  ('スペードのA', '/stickers/dark_dk_ace.png', 62, 92, 5, 50, 'common', 137),
  ('STAY LOUDの帯', '/stickers/dark_dk_banner.png', 72, 36, 3, 30, 'common', 138),
  ('まるドット（ダーク）', '/stickers/dark_b_dot.png', 24, 24, 0, 5, 'common', 1003),
  ('キラッ（ダーク）', '/stickers/dark_b_sparkle.png', 32, 32, 0, 5, 'common', 1023),
  ('ラインストーン（ダーク）', '/stickers/dark_b_stone.png', 30, 30, 1, 15, 'common', 1043),
  ('パール（ダーク）', '/stickers/dark_b_pearl.png', 26, 26, 1, 15, 'common', 1063),
  ('マステ（ダーク）', '/stickers/dark_b_tape.png', 72, 36, 1, 10, 'common', 1083),
  ('まるドット（ぷっくり）', '/stickers/mat_puffy_dot.png', 23, 24, 0, 5, 'common', 1004),
  ('キラッ（ぷっくり）', '/stickers/mat_puffy_sparkle.png', 32, 32, 0, 5, 'common', 1024),
  ('ラインストーン（ぷっくり）', '/stickers/mat_puffy_stone.png', 29, 30, 1, 15, 'common', 1044),
  ('パール（ぷっくり）', '/stickers/mat_puffy_pearl.png', 25, 26, 1, 15, 'common', 1064),
  ('マステ（ぷっくり）', '/stickers/mat_puffy_tape.png', 72, 37, 1, 10, 'common', 1084),
  ('まるドット（刺繍）', '/stickers/mat_emb_dot.png', 24, 24, 1, 10, 'common', 1005),
  ('キラッ（刺繍）', '/stickers/mat_emb_sparkle.png', 32, 32, 1, 10, 'common', 1025),
  ('ラインストーン（刺繍）', '/stickers/mat_emb_stone.png', 30, 30, 2, 20, 'common', 1045),
  ('パール（刺繍）', '/stickers/mat_emb_pearl.png', 26, 26, 2, 20, 'common', 1065),
  ('マステ（刺繍）', '/stickers/mat_emb_tape.png', 72, 35, 1, 15, 'common', 1085),
  ('まるドット（フェルト）', '/stickers/mat_felt_dot.png', 24, 24, 0, 5, 'common', 1006),
  ('キラッ（フェルト）', '/stickers/mat_felt_sparkle.png', 31, 32, 0, 5, 'common', 1026),
  ('ラインストーン（フェルト）', '/stickers/mat_felt_stone.png', 29, 30, 1, 15, 'common', 1046),
  ('パール（フェルト）', '/stickers/mat_felt_pearl.png', 25, 26, 1, 15, 'common', 1066),
  ('マステ（フェルト）', '/stickers/mat_felt_tape.png', 72, 32, 1, 10, 'common', 1086),
  ('まるドット（木製）', '/stickers/mat_wood_dot.png', 23, 24, 1, 10, 'common', 1007),
  ('キラッ（木製）', '/stickers/mat_wood_sparkle.png', 31, 32, 1, 10, 'common', 1027),
  ('ラインストーン（木製）', '/stickers/mat_wood_stone.png', 29, 30, 2, 20, 'common', 1047),
  ('パール（木製）', '/stickers/mat_wood_pearl.png', 25, 26, 2, 20, 'common', 1067),
  ('マステ（木製）', '/stickers/mat_wood_tape.png', 72, 33, 1, 15, 'common', 1087),
  ('まるドット（アクリル）', '/stickers/mat_acryl_dot.png', 23, 24, 1, 10, 'common', 1008),
  ('キラッ（アクリル）', '/stickers/mat_acryl_sparkle.png', 31, 32, 1, 10, 'common', 1028),
  ('ラインストーン（アクリル）', '/stickers/mat_acryl_stone.png', 29, 30, 2, 20, 'common', 1048),
  ('パール（アクリル）', '/stickers/mat_acryl_pearl.png', 25, 26, 2, 20, 'common', 1068),
  ('マステ（アクリル）', '/stickers/mat_acryl_tape.png', 72, 33, 1, 15, 'common', 1088),
  ('まるドット（紙の切り抜き）', '/stickers/mat_paper_dot.png', 24, 24, 0, 5, 'common', 1009),
  ('キラッ（紙の切り抜き）', '/stickers/mat_paper_sparkle.png', 32, 32, 0, 5, 'common', 1029),
  ('ラインストーン（紙の切り抜き）', '/stickers/mat_paper_stone.png', 30, 30, 1, 15, 'common', 1049),
  ('パール（紙の切り抜き）', '/stickers/mat_paper_pearl.png', 26, 26, 1, 15, 'common', 1069),
  ('マステ（紙の切り抜き）', '/stickers/mat_paper_tape.png', 72, 32, 1, 10, 'common', 1089)
  ) as v(name, image_path, width, height, charm, price, rarity, sort)
 where not exists (select 1 from public.oshi_sticker_types t where t.image_path = v.image_path);

-- 仮のサンプル7種を図鑑・販売から外す（削除はしない。持っている人の分は残り、本人の図鑑には出る）
update public.oshi_sticker_types
   set is_active = false, dex_purchasable = false, dex_visibility = 'owned'
 where image_path is null
   and name in ('ちいさな星','ちいさなハート','リボン','おおきな花','ひみつの鍵','きらきら王冠','精鋭バッジ');

update public.oshi_shop_listings l
   set is_active = false
  from public.oshi_sticker_types t
 where l.sticker_type_id = t.id
   and t.image_path is null
   and t.name in ('ひみつの鍵','きらきら王冠');
