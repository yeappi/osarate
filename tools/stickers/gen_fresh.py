"""爽やか（夏の海辺・スポーツクラブ）：透明シール × 細い線 × 白インク × 余白"""
import os
from stk import *

NV, SKY, SKYL, CORAL, FILM_EDGE = "#1E3A6E", "#5FA8DC", "#CFE6F6", "#F27A5E", "#B9D6EA"

DEFS = """
<linearGradient id="gloss" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/>
  <stop offset=".47" stop-color="#fff" stop-opacity=".75"/><stop offset=".53" stop-color="#fff" stop-opacity=".15"/>
  <stop offset=".58" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
</linearGradient>
<linearGradient id="film" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#EAF4FC" stop-opacity=".75"/><stop offset="1" stop-color="#DCECF8" stop-opacity=".55"/>
</linearGradient>
"""
B = Book(os.path.join(os.path.dirname(__file__), "out3", "fresh"), DEFS)


def clear(d, inner):
    """透明フィルム：うっすら青い膜＋縁の反射＋斜めのつや"""
    c = B.uid("fc")
    return (f'<clipPath id="{c}"><path d="{d}"/></clipPath>'
            f'<path d="{d}" fill="#000" opacity=".05" transform="translate(.8 1.6)"/>'
            f'<path d="{d}" fill="url(#film)"/>'
            f'<g clip-path="url(#{c})">{inner}<rect width="100" height="100" fill="url(#gloss)"/></g>'
            f'<path d="{d}" fill="none" stroke="{FILM_EDGE}" stroke-width=".9"/>'
            f'<path d="{d}" fill="none" stroke="#fff" stroke-width=".5" transform="translate(-.4 -.4)"/>')


def white_ink(content):
    """白インク：細い紺の影で白を読ませる"""
    return (f'<g fill="{NV}" stroke="{NV}" opacity=".35" transform="translate(.35 .35)">{content}</g>'
            f'<g fill="#fff" stroke="#fff">{content}</g>')


G = "爽やか"
# 1 SURF CLUB のバッジ
B.add("fr_surf", "サーフクラブ", G, 40, 40, 3, clear(circle_d(50, 50, 40),
    f'<g fill="none" stroke="{NV}" stroke-width=".7"><circle cx="50" cy="50" r="36"/><circle cx="50" cy="50" r="24"/></g>'
    + arc_text("SEASIDE SURF CLUB", 50, 50, 30, 5.2, -176, 10.9, "Montserrat", fill=NV, extra='font-weight="600"')
    + "".join(f'<path d="M30 {y}c4-3 8-3 12 0s8 3 12 0 8-3 12 0" fill="none" stroke="{SKY}" stroke-width="1.4" stroke-linecap="round"/>' for y in (48, 54, 60))
    + f'<path d="M36 44a14 14 0 0 1 28 0z" fill="{CORAL}"/>'
    + t(50, 76, "EST. 1987", 3.6, "Montserrat", 'font-weight="600" letter-spacing="1"', fill=NV)))
# 2 線の波
wave = "".join(f'<path d="M{8+k*1.5} {40+k*7}c8-8 16-8 22 0s14 8 22 0 14-8 22 0 12 8 18 0" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round"/>'
               for k, (c, w) in enumerate([(NV, 1.1), (SKY, 1.8), (SKY, 1.1), (NV, .7)]))
B.add("fr_wave", "細い波", G, 52, 28, 2, clear(rrect_d(4, 28, 92, 46, 23), wave))
# 3 テニスクラブのペナント
pen = "M10 26L90 50 10 74z"
B.add("fr_pennant", "テニスクラブの旗", G, 52, 32, 3, clear(pen,
    f'<path d="M10 26L90 50 10 74z" fill="{NV}" opacity=".9" transform="translate(10 50) scale(.86 .82) translate(-10 -50)"/>'
    + white_ink(t(46, 52.6, "TENNIS CLUB", 6, "Montserrat", 'font-weight="700" letter-spacing=".6"'))
    + f'<path d="M16 34v32" stroke="{CORAL}" stroke-width="2"/>'))
# 4 水温のラベル
B.add("fr_temp", "水温28℃", G, 40, 32, 2, clear(rrect_d(10, 20, 80, 60, 8),
    f'<rect x="16" y="26" width="68" height="48" rx="4" fill="none" stroke="{NV}" stroke-width=".6"/>'
    + t(50, 38, "WATER TEMP.", 4.4, "Montserrat", 'font-weight="600" letter-spacing="1.4"', fill=NV)
    + t(48, 64, "28", 24, "Montserrat", 'font-weight="300"', fill=SKY) + t(68, 52, "°C", 7, "Montserrat", 'font-weight="500"', fill=SKY)
    + f'<path d="M24 70h52" stroke="{CORAL}" stroke-width="1.2"/>'))
# 5 海辺のバス乗車券
tk = rrect_d(6, 30, 88, 40, 4)
B.add("fr_bus", "海辺行きの乗車券", G, 56, 26, 3, clear(tk,
    f'<rect x="6" y="30" width="18" height="40" fill="{SKY}" opacity=".8"/>'
    + white_ink(t(15, 54, "No.7", 5.6, "Montserrat", 'font-weight="700" transform="rotate(-90 15 51)"'))
    + t(30, 42, "COAST LINE BUS", 4.6, "Montserrat", 'font-weight="700" letter-spacing="1"', anchor="start", fill=NV)
    + t(30, 56, "→ SHELL BEACH", 7, "Montserrat", 'font-weight="300"', anchor="start", fill=NV)
    + t(30, 64, "ONE WAY · ¥210", 3.8, "Montserrat", 'font-weight="600" letter-spacing="1"', anchor="start", fill=CORAL)))
# 6 線の太陽
rays = "".join(f'<path d="M{50+22*M.cos(M.radians(a)):.1f} {62-22*M.sin(M.radians(a)):.1f}L{50+32*M.cos(M.radians(a)):.1f} {62-32*M.sin(M.radians(a)):.1f}" stroke="{CORAL}" stroke-width="1.1" stroke-linecap="round"/>' for a in range(10, 180, 17))
B.add("fr_sun", "SUMMERの太陽", G, 48, 32, 3, clear("M10 70a40 40 0 0 1 80 0z" if False else rrect_d(8, 22, 84, 56, 10),
    rays + f'<path d="M34 62a16 16 0 0 1 32 0z" fill="{CORAL}" opacity=".9"/>'
    + f'<path d="M14 62h72" stroke="{NV}" stroke-width=".7"/>'
    + t(50, 72, "SUMMER", 7, "Montserrat", 'font-weight="300" letter-spacing="3.4"', fill=NV)))
# 7 背番号
B.add("fr_number", "背番号07", G, 36, 40, 3, clear("M30 12h40l14 10-6 12-6-3v57H28V31l-6 3-6-12z",
    f'<path d="M30 12q20 12 40 0" fill="none" stroke="{NV}" stroke-width=".8"/>'
    + f'<text x="50" y="72" text-anchor="middle" font-family="Anton" font-size="30" fill="none" stroke="{NV}" stroke-width=".9">07</text>'
    + t(50, 40, "MIZUNO-CHO", 3.6, "Montserrat", 'font-weight="700" letter-spacing="1"', fill=SKY)))
# 8 しずくのラベル
drop = "M50 10C62 30 78 46 78 62a28 28 0 0 1-56 0c0-16 16-32 28-52z"
B.add("fr_drop", "ひとしずく", G, 30, 40, 2, clear(drop,
    f'<path d="{drop}" fill="none" stroke="{SKY}" stroke-width="1" transform="translate(50 55) scale(.8) translate(-50 -55)"/>'
    + f'<path d="M36 62a14 14 0 0 0 10 14" fill="none" stroke="{SKY}" stroke-width="2" stroke-linecap="round"/>'
    + t(50, 62, "H₂O", 8, "Montserrat", 'font-weight="300"', fill=NV)))

# ---- 基礎素材（爽やか）----
G = "基礎素材（爽やか）"
B.add("b_dot", "まるドット（爽やか）", G, 18, 18, 1, clear(circle_d(50, 50, 36),
    f'<circle cx="50" cy="50" r="24" fill="{SKY}" opacity=".85"/>'))
B.add("b_sparkle", "キラッ（爽やか）", G, 22, 22, 1, clear(circle_d(50, 50, 40),
    f'<path d="{star_d(4, 30, 4)}" fill="none" stroke="{NV}" stroke-width=".9" stroke-linejoin="round"/><path d="{star_d(4, 10, 2, 74, 28)}" fill="{SKY}"/>'))
o, i_ = octa(50, 50, 34), octa(50, 50, 16)
lines = "".join(f'<path d="M{o[k][0]:.1f} {o[k][1]:.1f}L{i_[k][0]:.1f} {i_[k][1]:.1f}"/>' for k in range(8))
B.add("b_stone", "ラインストーン（爽やか）", G, 22, 22, 1, clear(poly_d(o),
    f'<g fill="none" stroke="{SKY}" stroke-width=".8">{lines}<path d="{poly_d(i_)}"/></g>'
    + f'<path d="{poly_d([o[5], o[6], i_[6], i_[5]])}" fill="#fff" opacity=".8"/>'))
B.add("b_pearl", "パール（爽やか）", G, 20, 20, 1, clear(circle_d(50, 50, 36),
    f'<circle cx="50" cy="50" r="30" fill="none" stroke="{SKYL}" stroke-width="3"/>'
    + '<ellipse cx="38" cy="36" rx="8" ry="4" fill="#fff" transform="rotate(-35 38 36)"/><circle cx="62" cy="66" r="3" fill="#fff"/>'))
tape = rrect_d(6, 38, 88, 24, 1)
B.add("b_tape", "マステ（爽やか）", G, 40, 14, 1,
    '<g transform="rotate(-6 50 50)">' + clear(tape,
        "".join(f'<rect x="{x}" y="38" width="3" height="24" fill="{NV if k % 2 else SKY}" opacity=".7"/>' for k, x in enumerate(range(10, 94, 8))))
    + '</g>')

B.render("sheet_fresh.png")
print("fresh done", len(B.items))
