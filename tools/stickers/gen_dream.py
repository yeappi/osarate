"""ゆめかわダーク（夜にだけ開く魔女の雑貨屋）：ホログラム × パステル × ゴシックの飾り線 × ラメ"""
import os
from stk import *

PAPER, PAPER2, LAV, MINT, ROSE, CREAM = "#2A2140", "#3A2D57", "#C9B6F2", "#A8F0DC", "#F7B4D2", "#FFE9A8"

DEFS = f"""
<linearGradient id="holo" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#C9B6F2"/><stop offset=".2" stop-color="#A8F0DC"/><stop offset=".38" stop-color="#FFF6C9"/>
  <stop offset=".55" stop-color="#F7B4D2"/><stop offset=".75" stop-color="#B6D8F7"/><stop offset="1" stop-color="#C9B6F2"/>
</linearGradient>
<linearGradient id="holo2" x1="1" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#F7B4D2"/><stop offset=".3" stop-color="#C9B6F2"/><stop offset=".6" stop-color="#A8F0DC"/><stop offset="1" stop-color="#FFE9A8"/>
</linearGradient>
<filter id="glit" x="0" y="0" width="100" height="100" filterUnits="userSpaceOnUse">
  <feTurbulence type="fractalNoise" baseFrequency="2.6" numOctaves="1" seed="9"/>
  <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 9 -7.2"/>
</filter>
<filter id="dgrain" x="0" y="0" width="100" height="100" filterUnits="userSpaceOnUse">
  <feTurbulence type="fractalNoise" baseFrequency="2" numOctaves="1" seed="2"/>
  <feColorMatrix type="matrix" values="0 0 0 0 .8  0 0 0 0 .7  0 0 0 0 1  0 0 0 .4 -.16"/>
</filter>
"""
B = Book(os.path.join(os.path.dirname(__file__), "out3", "dream"), DEFS)


def card(d, inner, border=6, paper=PAPER):
    c = B.uid("dc")
    return (f'<clipPath id="{c}"><path d="{d}"/></clipPath>'
            f'<path d="{d}" fill="#000" stroke="#000" stroke-width="{border}" stroke-linejoin="round" opacity=".16" transform="translate(1 2)"/>'
            f'<path d="{d}" fill="#fff" stroke="#fff" stroke-width="{border}" stroke-linejoin="round"/>'
            f'<path d="{d}" fill="{paper}"/>'
            f'<g clip-path="url(#{c})"><rect width="100" height="100" filter="url(#dgrain)"/>{inner}</g>')


def holo(content, grad="holo"):
    """ホログラム箔＋ラメ"""
    c = B.uid("hg")
    return (f'<g fill="url(#{grad})" stroke="url(#{grad})">{content}</g>'
            f'<mask id="{c}"><g fill="#fff" stroke="#fff">{content}</g></mask>'
            f'<rect width="100" height="100" filter="url(#glit)" mask="url(#{c})"/>')


def orn(cx, cy, w, flip=False):
    """ゴシックの飾り罫（左右対称のくるくる）"""
    s = -1 if flip else 1
    h = w / 2
    return (f'<path d="M{cx-h} {cy}q{h*.25} {-4*s} {h*.5} 0t{h*.5} 0M{cx+h} {cy}q{-h*.25} {-4*s} {-h*.5} 0t{-h*.5} 0" fill="none" stroke-width=".7"/>'
            f'<path d="{star_d(4, 2.6, .8, cx, cy)}" stroke="none"/>'
            f'<circle cx="{cx-h}" cy="{cy}" r=".9" stroke="none"/><circle cx="{cx+h}" cy="{cy}" r=".9" stroke="none"/>')


G = "ゆめかわダーク"
# 1 ポーションのラベル
lab = "M20 18h60a8 8 0 0 0 8 8v48a8 8 0 0 0-8 8H20a8 8 0 0 0-8-8V26a8 8 0 0 0 8-8z"
B.add("dd_label", "ポーションのラベル", G, 40, 40, 4, card(lab,
    holo('<path d="M22 22h56a6 6 0 0 0 6 6v44a6 6 0 0 0-6 6H22a6 6 0 0 0-6-6V28a6 6 0 0 0 6-6z" fill="none" stroke-width=".8"/>'
         + orn(50, 32, 30) + orn(50, 70, 30, True)
         + t(50, 48, "Potion", 13, "TeX Gyre Chorus", 'font-weight="700"') + t(50, 60, "NO. 7  ·  SWEET DREAMS", 3.6, "Cardo", 'letter-spacing=".6"'))))
# 2 タロット「THE MOON」
tar = rrect_d(24, 6, 52, 88, 5)
moon = "M56 30a16 16 0 1 0 12 26a13 13 0 1 1-12-26z"
B.add("dd_tarot", "タロット・月", G, 32, 48, 4, card(tar,
    holo('<rect x="27.5" y="9.5" width="45" height="81" rx="3" fill="none" stroke-width=".7"/>'
         + '<path d="M32 74V40a18 18 0 0 1 36 0v34z" fill="none" stroke-width=".6"/>'
         + f'<path d="{moon}" stroke="none"/>'
         + "".join(f'<path d="{star_d(4, r, r*.25, x, y)}" stroke="none"/>' for x, y, r in [(38, 34, 2.4), (62, 66, 1.8), (40, 62, 1.4)])
         + t(50, 18, "XVIII", 4.4, "Cardo") + t(50, 84, "THE MOON", 5, "Cardo", 'letter-spacing="1.2"'))))
# 3 アンティークの鍵
key = ("M24 50a12 12 0 1 1 22 6h34l6 6-6 6-4-4-4 4-4-4-4 4-4-4H46a12 12 0 0 1-22-14z")
B.add("dd_key", "まじょの鍵", G, 52, 28, 3, card(key,
    holo(f'<path d="{key}" stroke="none" transform="translate(50 52) scale(.86) translate(-50 -52)"/>', "holo2")
    + f'<circle cx="34" cy="52" r="5" fill="{PAPER}"/><path d="{star_d(4, 3.4, 1, 34, 52)}" fill="{CREAM}"/>'))
# 4 魔法陣
B.add("dd_circle", "まほうじん", G, 40, 40, 3, card(circle_d(50, 50, 40),
    holo('<circle cx="50" cy="50" r="35" fill="none" stroke-width=".8"/><circle cx="50" cy="50" r="27" fill="none" stroke-width=".5"/>'
         + f'<path d="{star_d(8, 26, 12)}" fill="none" stroke-width=".7"/><path d="{star_d(8, 20, 9, rot=-67.5)}" fill="none" stroke-width=".4"/>'
         + arc_text("✦ LUNA ✦ STELLA ✦ NOX ✦ AMOR", 50, 50, 31, 3.4, -90, 12.4, "Cardo")
         + '<circle cx="50" cy="50" r="5" stroke="none"/>')))
# 5 お店の値札
tag = "M30 20h52a6 6 0 0 1 6 6v48a6 6 0 0 1-6 6H30L12 50z"
B.add("dd_tag", "まじょの値札", G, 44, 34, 3, card(tag,
    holo('<path d="M31 24h49a4 4 0 0 1 4 4v44a4 4 0 0 1-4 4H31L17 50z" fill="none" stroke-width=".7"/>'
         + t(54, 44, "Witch's", 10, "TeX Gyre Chorus", 'font-weight="700"') + t(54, 56, "CURIO SHOP", 4.6, "Cardo", 'letter-spacing="1.4"')
         + t(54, 67, "open 0:00 — 3:00", 3.8, "Cardo", 'font-style="italic"'))
    + f'<circle cx="25" cy="50" r="3.6" fill="#fff"/><circle cx="25" cy="50" r="3.6" fill="none" stroke="{LAV}" stroke-width=".8"/>'))
# 6 OPEN AT MIDNIGHT の札
sign = "M14 34h72a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V38a4 4 0 0 1 4-4z"
B.add("dd_sign", "まよなかだけ開店", G, 52, 34, 3,
    f'<path d="M30 34L50 14 70 34" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><path d="M30 34L50 14 70 34" fill="none" stroke="{LAV}" stroke-width="1.2"/>'
    + f'<circle cx="50" cy="14" r="3" fill="{CREAM}" stroke="#fff" stroke-width="1.5"/>'
    + card(sign, holo(t(50, 51, "OPEN", 13, "Cardo", 'letter-spacing="3"') + t(50, 61, "at midnight", 6, "TeX Gyre Chorus", 'font-weight="700"')
                      + orn(50, 40, 22))))
# 7 蛾（ホログラムの翅）
moth_l = "M50 50C40 30 22 20 12 26c-4 10 4 22 18 26-12 4-16 14-12 20 10 2 22-6 32-22z"
moth_r = "M50 50C60 30 78 20 88 26c4 10-4 22-18 26 12 4 16 14 12 20-10 2-22-6-32-22z"
moth = moth_l + moth_r
B.add("dd_moth", "よるの蛾", G, 48, 36, 3, card(moth,
    holo(f'<path d="{moth}" stroke="none" transform="translate(50 48) scale(.86) translate(-50 -50)"/>', "holo2")
    + f'<g fill="none" stroke="{PAPER}" stroke-width=".8"><path d="M48 46C40 34 28 28 20 30M48 52C40 56 30 64 26 68M52 46C60 34 72 28 80 30M52 52C60 56 70 64 74 68"/></g>'
    + f'<circle cx="30" cy="38" r="4" fill="{PAPER}"/><circle cx="70" cy="38" r="4" fill="{PAPER}"/>'
    + f'<ellipse cx="50" cy="50" rx="2.6" ry="12" fill="{PAPER}"/>'))
# 8 星の封蝋
wax = "".join(f"{'M' if k == 0 else 'L'}{50+(38 if k%2==0 else 34)*M.cos(M.radians(k*15)):.1f} {50+(38 if k%2==0 else 34)*M.sin(M.radians(k*15)):.1f}" for k in range(24)) + "z"
B.add("dd_wax", "ほしの封蝋", G, 36, 36, 3, card(wax,
    f'<circle cx="50" cy="50" r="26" fill="none" stroke="#9C86D4" stroke-width="2"/>'
    + holo(f'<path d="{star_d(5, 18, 7.5)}" stroke="none"/>') + '<ellipse cx="34" cy="30" rx="8" ry="3" fill="#fff" opacity=".35" transform="rotate(-35 34 30)"/>', paper="#8E74C9"))

# ---- 基礎素材（ゆめかわダーク）----
G = "基礎素材（ゆめかわダーク）"
B.add("b_dot", "まるドット（ゆめかわ）", G, 18, 18, 1, card(circle_d(50, 50, 36), holo('<circle cx="50" cy="50" r="28" stroke="none"/>')))
B.add("b_sparkle", "キラッ（ゆめかわ）", G, 22, 22, 1, card(star_d(4, 44, 13), holo(f'<path d="{star_d(4, 36, 9)}" stroke="none"/>', "holo2")))
o, i_ = octa(50, 50, 30), octa(50, 50, 14)
fac = "".join(f'<path d="{poly_d([o[k], o[(k+1)%8], i_[(k+1)%8], i_[k]])}" fill="{c}" opacity=".9"/>' for k, c in enumerate([LAV, MINT, CREAM, ROSE] * 2))
B.add("b_stone", "ラインストーン（ゆめかわ）", G, 22, 22, 1, card(circle_d(50, 50, 38),
    holo('<circle cx="50" cy="50" r="33" stroke="none"/>') + f'<circle cx="50" cy="50" r="31" fill="{PAPER}"/>' + fac
    + f'<path d="{poly_d(i_)}" fill="url(#holo2)"/><rect width="100" height="100" filter="url(#glit)" opacity=".7" clip-path="url(#sc)"/>'
    + f'<clipPath id="sc"><circle cx="50" cy="50" r="30"/></clipPath><path d="{star_d(4, 7, 1.5, 40, 38)}" fill="#fff"/>'))
B.add("b_pearl", "パール（ゆめかわ）", G, 20, 20, 1,
    '<defs><radialGradient id="dp" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="#F3E8FF"/>'
    '<stop offset=".55" stop-color="#C9B6F2"/><stop offset=".78" stop-color="#A8E6DA"/><stop offset="1" stop-color="#7E68B8"/></radialGradient></defs>'
    '<circle cx="51" cy="52" r="38" fill="#000" opacity=".14"/><circle cx="50" cy="50" r="39" fill="#fff"/><circle cx="50" cy="50" r="35" fill="url(#dp)"/>'
    '<path d="M26 58a26 26 0 0 0 36 18" fill="none" stroke="#F7B4D2" stroke-width="3" opacity=".6" stroke-linecap="round"/>'
    '<ellipse cx="38" cy="34" rx="8" ry="4" fill="#fff" opacity=".9" transform="rotate(-35 38 34)"/>')
tape = "M8 37l3 2.6-3 2.6 3 2.6-3 2.6 3 2.6-3 2.6 3 2.6-3 2.6 3 2.6h84l-3-2.6 3-2.6-3-2.6 3-2.6-3-2.6 3-2.6-3-2.6 3-2.6-3-2.6z"
B.add("b_tape", "マステ（ゆめかわ）", G, 40, 16, 1,
    f'<g transform="rotate(-8 50 50)"><path d="{tape}" fill="#000" opacity=".14" transform="translate(1 2)"/><path d="{tape}" fill="{PAPER2}" opacity=".92"/>'
    f'<clipPath id="dtp"><path d="{tape}"/></clipPath><g clip-path="url(#dtp)">'
    + holo("".join(f'<path d="{star_d(4 if k % 2 else 5, 3.6 if k % 2 else 2.8, 1 if k % 2 else 1.2, x, 50 + (2 if k % 2 else -2))}" stroke="none"/>' for k, x in enumerate(range(14, 92, 9))))
    + '</g></g>')

B.render("sheet_dream.png")
print("dream done", len(B.items))
