# 公式シールの生成

`python3 gen_pop.py` などで各画風の SVG/PNG を `out3/` に作り、`python3 pack.py` で `pack/`（png・svg・manifest.csv・一覧画像）にまとめる。
必要なもの：Python3 + Pillow、rsvg-convert。

- 画風：ポップ / 爽やか / ゆめかわダーク / ダーク（テーマ各8枚＋基礎5枚）、素材6種（基礎5枚ずつ）
- `manifest.csv`：名前・サイズ（論理座標、ページ 360×480 基準）・価格・魅力値（価格÷10）・レア度
- アプリへの反映：画像を `public/stickers/` に置き、`supabase/migrations` に登録用マイグレーションを追加する
