-- AI生成画像の差し替え（高額シール10種・初期シール3種）。画像は public/stickers に同梱
update public.oshi_sticker_types set image_path = '/stickers/legend_perfume.webp', width = 95, height = 150 where name = 'アンティークの香水瓶' and image_path is null;
update public.oshi_sticker_types set image_path = '/stickers/legend_brooch.webp', width = 160, height = 160 where name = '七宝の小鳥ブローチ' and image_path is null;
update public.oshi_sticker_types set image_path = '/stickers/legend_record.webp', width = 167, height = 170 where name = '金盤のレコード' and image_path is null;
update public.oshi_sticker_types set image_path = '/stickers/legend_armillary.webp', width = 126, height = 180 where name = '真鍮の天球儀' and image_path is null;
update public.oshi_sticker_types set image_path = '/stickers/legend_moon.webp', width = 176, height = 190 where name = 'ステンドグラスの月' and image_path is null;
update public.oshi_sticker_types set image_path = '/stickers/legend_waxkey.webp', width = 183, height = 200 where name = '封蝋と黄金の鍵' and image_path is null;
update public.oshi_sticker_types set image_path = '/stickers/legend_chandelier.webp', width = 204, height = 210 where name = 'クリスタルのシャンデリア' and image_path is null;
update public.oshi_sticker_types set image_path = '/stickers/legend_crown.webp', width = 220, height = 220 where name = '宝石の王冠' and image_path is null;
update public.oshi_sticker_types set image_path = '/stickers/legend_peacock.webp', width = 230, height = 230 where name = '黄金の孔雀' and image_path is null;
update public.oshi_sticker_types set image_path = '/stickers/legend_orb.webp', width = 170, height = 240 where name = '星を閉じ込めた宝珠' and image_path is null;
update public.oshi_sticker_types set image_path = '/stickers/starter_key.webp', width = 65, height = 92 where name = 'はじまりの鍵' and image_path is null;
update public.oshi_sticker_types set image_path = '/stickers/starter_feather.webp', width = 78, height = 92 where name = 'はじまりの羽根' and image_path is null;
update public.oshi_sticker_types set image_path = '/stickers/starter_lantern.webp', width = 60, height = 92 where name = 'はじまりの灯り' and image_path is null;
