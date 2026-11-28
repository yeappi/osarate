"""ポップ（週末のゲームセンター・駄菓子屋）：リソグラフ印刷 × 太線カートゥーン × 網点 × 版ズレ"""
import os
from stk import *

PINK, YEL, BLUE, TEAL, INK, PAPER = "#FF48B0", "#FFE800", "#3255A4", "#00A095", "#22202A", "#FFF7E8"

DEFS = f"""
<filter id="pgrain" x="0" y="0" width="100" height="100" filterUnits="userSpaceOnUse">
  <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="11"/>
  <feColorMatrix type="matrix" values="0 0 0 0 .55  0 0 0 0 .45  0 0 0 0 .3  0 0 0 .7 -.3"/>
</filter>
<filter id="riso" x="0" y="0" width="100" height="100" filterUnits="userSpaceOnUse">
  <feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="2" seed="5" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -6 4.6" result="m"/>
  <feComposite in="SourceGraphic" in2="m" operator="in"/>
</filter>
""" + "".join(
    f'<pattern id="ht_{n}" width="2.2" height="2.2" patternUnits="userSpaceOnUse" patternTransform="rotate(20)">'
    f'<circle cx="1.1" cy="1.1" r="{r}" fill="{c}"/></pattern>'
    for n, c, r in [("pink", PINK, .75), ("yel", "#F2C200", .8), ("blue", BLUE, .65), ("ink", INK, .5), ("teal", TEAL, .7)])

B = Book(os.path.join(os.path.dirname(__file__), "out3", "pop"), DEFS)
OFF = 'transform="translate(1.6 1.3)"'


def card(d, inner, border=7):
    c = B.uid("pc")
    return (f'<clipPath id="{c}"><path d="{d}"/></clipPath>'
            f'<path d="{d}" fill="#000" stroke="#000" stroke-width="{border}" stroke-linejoin="round" opacity=".14" transform="translate(1.2 2.4)"/>'
            f'<path d="{d}" fill="#fff" stroke="#fff" stroke-width="{border}" stroke-linejoin="round"/>'
            f'<path d="{d}" fill="{PAPER}"/>'
            f'<g clip-path="url(#{c})"><rect width="100" height="100" filter="url(#pgrain)"/>{inner}</g>')


def ink(d, fill, w=2.4, ht=None):
    """版ズレ：色面を少しずらし、網点を重ね、太い墨線"""
    s = f'<g filter="url(#riso)"><path d="{d}" fill="{fill}" opacity=".92" {OFF}/>'
    if ht:
        s += f'<path d="{d}" fill="url(#ht_{ht})" {OFF}/>'
    return s + f'</g><path d="{d}" fill="none" stroke="{INK}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"/>'


def rt(x, y, s, size, color, family="Archivo Black", extra=""):
    """リソの文字：色版をずらして墨版と重ねる"""
    return (f'<g filter="url(#riso)">{t(x+1.1, y+1, s, size, family, extra, fill=color)}</g>'
            f'{t(x, y, s, size, family, extra, fill=INK)}')


G = "ポップ"
# 1 ゲームメダル
B.add("pop_medal", "ゲームメダル", G, 36, 36, 3, card(circle_d(50, 50, 40),
    ink(circle_d(50, 50, 34), YEL, ht="pink")
    + f'<circle cx="50" cy="50" r="26" fill="none" stroke="{INK}" stroke-width="1.4" stroke-dasharray="2.6 2"/>'
    + rt(50, 49, "GAME", 13, PINK) + t(50, 62, "TOKEN · 1", 5.4, "Poppins", 'font-weight="600" letter-spacing="1"', fill=INK)))
# 2 あたり棒
stick = "M44 50h12v36a6 6 0 0 1-12 0z"
pop = rrect_d(28, 8, 44, 50, 22)
B.add("pop_atari", "あたり棒", G, 26, 48, 4, card("M28 30a22 22 0 0 1 44 0v6a22 22 0 0 1-16 21v29a6 6 0 0 1-12 0V57a22 22 0 0 1-16-21z",
    ink(stick, "#F3D7A2") + ink(pop, BLUE, ht="ink")
    + f'<path d="M36 18q4-6 10-6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>'
    + t(50, 78, "あたり", 6.6, "Noto Sans CJK JP", 'font-weight="900" transform="rotate(-90 50 76)"', fill=PINK)))
# 3 ガチャのカプセル
top = "M18 50a32 32 0 0 1 64 0z"
bot = "M18 50h64a32 32 0 0 1-64 0z"
B.add("pop_capsule", "ガチャのカプセル", G, 38, 38, 3, card(circle_d(50, 50, 38),
    ink(top, PINK, ht="pink") + ink(bot, "#FFFFFF")
    + f'<rect x="16" y="47" width="68" height="6" rx="3" fill="{YEL}" stroke="{INK}" stroke-width="2"/>'
    + '<path d="M30 32q8-10 20-10" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>'
    + rt(50, 74, "?", 14, BLUE)))
# 4 LUCKY! ふきだし
bub = "M10 30c0-10 8-16 18-16h44c10 0 18 6 18 16v20c0 10-8 16-18 16H44l-16 14 3-14h-3c-10 0-18-6-18-16z"
B.add("pop_lucky", "LUCKY!", G, 46, 40, 3, card(bub, ink(bub, TEAL, ht="yel") + rt(50, 48, "LUCKY!", 15, YEL)))
# 5 ハイスコア
B.add("pop_score", "ハイスコア", G, 56, 26, 3, card(rrect_d(4, 30, 92, 40, 6),
    f'<rect x="4" y="30" width="92" height="40" fill="{INK}"/>'
    + f'<g filter="url(#riso)">{t(50.8, 45, "HI-SCORE", 7, "Archivo Black", "letter-spacing=\"2\"", fill=PINK)}</g>'
    + f'<g filter="url(#riso)">{t(51, 63, "999990", 15, "Anton", "letter-spacing=\"3\"", fill=YEL)}</g>'
    + t(50, 62.4, "999990", 15, "Anton", 'letter-spacing="3" opacity=".25"', fill="#fff")))
# 6 十字キー
dpad = "M38 14h24v24h24v24H62v24H38V62H14V38h24z"
B.add("pop_dpad", "十字キー", G, 36, 36, 2, card(dpad,
    ink(dpad, "#C9C6D6", ht="blue")
    + "".join(f'<path d="{p}" fill="{INK}"/>' for p in ("M50 20l-5 7h10z", "M50 80l-5-7h10z", "M20 50l7-5v10z", "M80 50l-7-5v10z"))
    + f'<circle cx="50" cy="50" r="6" fill="none" stroke="{INK}" stroke-width="1.6"/>'))
# 7 駄菓子の値札
burst = star_d(14, 44, 36)
B.add("pop_price", "10円の値札", G, 38, 38, 3, card(burst,
    ink(burst, PINK, ht="yel") + rt(50, 58, "10", 26, YEL) + t(72, 64, "円", 9, "Noto Sans CJK JP", 'font-weight="900"', fill=INK)))
# 8 PRESS START
B.add("pop_start", "PRESS START", G, 56, 24, 3, card(rrect_d(4, 32, 92, 36, 18),
    ink(rrect_d(8, 36, 84, 28, 14), YEL, ht="pink")
    + f'<path d="M15 45l6 5-6 5z" fill="{INK}"/>'
    + rt(56, 54.5, "PRESS START", 8, BLUE)))

# ---- 基礎素材（ポップ）----
G = "基礎素材（ポップ）"
B.add("b_dot", "まるドット（ポップ）", G, 18, 18, 1, card(circle_d(50, 50, 36), ink(circle_d(50, 50, 30), PINK, 3, ht="yel")))
spk = star_d(4, 40, 12)
B.add("b_sparkle", "キラッ（ポップ）", G, 22, 22, 1, card(star_d(4, 46, 16),
    ink(spk, YEL, 3) + f'<path d="M72 20l4 6M78 30l6 2M22 74l-4 6" stroke="{INK}" stroke-width="2.4" stroke-linecap="round"/>'))
o, i_ = octa(50, 50, 32), octa(50, 50, 15)
gem = poly_d(o)
fac = "".join(f'<path d="M{o[k][0]:.1f} {o[k][1]:.1f}L{i_[k][0]:.1f} {i_[k][1]:.1f}" stroke="{INK}" stroke-width="1.6"/>' for k in range(8))
B.add("b_stone", "ラインストーン（ポップ）", G, 22, 22, 1, card(circle_d(50, 50, 38),
    ink(gem, TEAL, 2.6, ht="blue") + fac + f'<path d="{poly_d(i_)}" fill="#fff" fill-opacity=".35" stroke="{INK}" stroke-width="1.6"/>'
    + '<path d="M36 30l6-2" stroke="#fff" stroke-width="3" stroke-linecap="round"/>'))
B.add("b_pearl", "パール（ポップ）", G, 20, 20, 1, card(circle_d(50, 50, 38),
    ink(circle_d(50, 50, 31), "#FFD6EC", 2.6, ht="pink")
    + '<path d="M34 38a18 18 0 0 1 14-14" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>'))
tape = "M8 36l3 3-3 3 3 3-3 3 3 3-3 3 3 3-3 3 3 3h84l-3-3 3-3-3-3 3-3-3-3 3-3-3-3 3-3-3-3 3-3z"
B.add("b_tape", "マステ（ポップ）", G, 40, 16, 1,
    f'<g transform="rotate(-8 50 50)"><path d="{tape}" fill="#000" opacity=".12" transform="translate(1 2)"/>'
    f'<path d="{tape}" fill="{YEL}" opacity=".85"/>'
    f'<clipPath id="ptp"><path d="{tape}"/></clipPath><g clip-path="url(#ptp)"><g filter="url(#riso)"><rect width="100" height="100" fill="url(#ht_pink)"/></g>'
    + "".join(f'<path d="{star_d(5, 3.4, 1.4, x, 51)}" fill="{BLUE}"/>' for x in range(16, 92, 14)) + '</g></g>')

B.render("sheet_pop.png")
print("pop done", len(B.items))
