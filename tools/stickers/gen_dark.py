"""ダーク（地下のライブハウス・バイク）：黒い紙 × 箔押し × 版画線 × かすれ
テーマ8枚 ＋ 基礎素材をこの画風で描いた5枚（試作）
"""
import math, os, subprocess
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(__file__), "out3", "dark")
os.makedirs(f"{OUT}/svg", exist_ok=True)
os.makedirs(f"{OUT}/png", exist_ok=True)
M = math

PAPER = "#141417"
DEFS = """
<linearGradient id="silver" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#8E949D"/><stop offset=".22" stop-color="#F4F6F8"/>
  <stop offset=".45" stop-color="#9BA1AA"/><stop offset=".7" stop-color="#E9ECEF"/><stop offset="1" stop-color="#7A808A"/>
</linearGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#9C6F25"/><stop offset=".25" stop-color="#F7E3A1"/>
  <stop offset=".5" stop-color="#B98A35"/><stop offset=".75" stop-color="#F3D98B"/><stop offset="1" stop-color="#8C6220"/>
</linearGradient>
<filter id="worn" x="0" y="0" width="100" height="100" filterUnits="userSpaceOnUse">
  <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -11 7.6" result="m"/>
  <feComposite in="SourceGraphic" in2="m" operator="in"/>
</filter>
<filter id="grain" x="0" y="0" width="100" height="100" filterUnits="userSpaceOnUse">
  <feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="1" seed="3"/>
  <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .5 -.18"/>
</filter>
<pattern id="hatch" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
  <rect width=".45" height="1.6" fill="#D5D9DE"/>
</pattern>
<pattern id="hatchx" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
  <rect width=".45" height="1.6" fill="#D5D9DE"/>
</pattern>
"""


def circle_d(cx, cy, r):
    return f"M{cx-r} {cy}a{r} {r} 0 1 0 {2*r} 0a{r} {r} 0 1 0 {-2*r} 0z"


def rrect_d(x, y, w, h, r):
    return (f"M{x+r} {y}h{w-2*r}a{r} {r} 0 0 1 {r} {r}v{h-2*r}a{r} {r} 0 0 1 {-r} {r}"
            f"h{-(w-2*r)}a{r} {r} 0 0 1 {-r} {-r}v{-(h-2*r)}a{r} {r} 0 0 1 {r} {-r}z")


def star_d(n, ro, ri, cx=50, cy=50, rot=-90):
    d = ""
    for i in range(n * 2):
        r = ro if i % 2 == 0 else ri
        a = M.radians(rot + 180 * i / n)
        d += ("M" if i == 0 else "L") + f"{cx + r*M.cos(a):.2f} {cy + r*M.sin(a):.2f}"
    return d + "z"


_cid = [0]


def card(d, inner, border=5):
    """黒い紙のダイカット：影 → 細い白フチ → 黒紙 → 紙の粒子 → 中身（クリップ）"""
    _cid[0] += 1
    c = f"c{_cid[0]}"
    return (f'<clipPath id="{c}"><path d="{d}"/></clipPath>'
            f'<path d="{d}" fill="#000" stroke="#000" stroke-width="{border}" stroke-linejoin="round" opacity=".18" transform="translate(1 2)"/>'
            f'<path d="{d}" fill="#fff" stroke="#fff" stroke-width="{border}" stroke-linejoin="round"/>'
            f'<path d="{d}" fill="{PAPER}"/>'
            f'<g clip-path="url(#{c})"><rect width="100" height="100" filter="url(#grain)"/>{inner}</g>')


def foil(content, metal="silver"):
    """箔押し：金属グラデ＋かすれ"""
    return f'<g filter="url(#worn)" fill="url(#{metal})" stroke="url(#{metal})">{content}</g>'


def t(x, y, s, size, family="Anton", extra="", anchor="middle"):
    return f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{family}" font-size="{size}" stroke="none" {extra}>{s}</text>'


def arc_text(s, cx, cy, r, size, start, step, family="Anton", bottom=False):
    """円周に1文字ずつ置く（librsvg は textPath 非対応のため）"""
    out = ""
    for i, ch in enumerate(s):
        a = start + i * step
        rad = M.radians(a)
        x, y = cx + r * M.cos(rad), cy + r * M.sin(rad)
        rot = a + 90 if not bottom else a - 90
        out += f'<text x="{x:.2f}" y="{y:.2f}" text-anchor="middle" dominant-baseline="central" font-family="{family}" font-size="{size}" stroke="none" transform="rotate({rot:.1f} {x:.2f} {y:.2f})">{ch}</text>'
    return out


S = []


def add(sid, name, group, w, h, charm, body):
    S.append((sid, name, group, w, h, charm, body))


G = "ダーク"
# 1 ライブハウスの半券
tk = "M8 28h84v14a6 6 0 0 0 0 16v14H8V58a6 6 0 0 0 0-16z"
add("dk_ticket", "地下の半券", G, 60, 32, 4, card(tk,
    foil('<rect x="12" y="32" width="58" height="36" fill="none" stroke-width=".7"/>'
         + t(41, 47, "UNDERGROUND", 8.6, extra='letter-spacing=".6"')
         + t(41, 56, "ALL NIGHT · LIVE", 4.2, "DM Sans", 'font-weight="700" letter-spacing="1"')
         + t(41, 64, "B2F", 5, "Crimson Text", 'font-style="italic"')
         + '<path d="M74 31v38" fill="none" stroke-width=".8" stroke-dasharray="1.6 1.6"/>'
         + t(82, 52.4, "013", 6.4, extra='transform="rotate(-90 82 50)"'))))
# 2 ギターピック（版画線）
pick = "M50 90C34 74 14 48 16 30 18 14 34 10 50 10s32 4 34 20c2 18-18 44-34 60z"
add("dk_pick", "ギターピック", G, 34, 40, 3, card(pick,
    f'<path d="{pick}" fill="url(#hatch)" opacity=".55" transform="translate(50 48) scale(.84) translate(-50 -50)"/>'
    + foil(f'<path d="{pick}" fill="none" stroke-width="1.4" transform="translate(50 48) scale(.86) translate(-50 -50)"/>'
           + f'<path d="{star_d(5, 13, 5.2, 50, 40)}"/>' + t(50, 66, "LOUD", 9))))
# 3 バイクのエンブレム（翼＋円）
wing_l = "M38 46C28 38 14 36 4 40c6 2 10 4 12 7-5 0-9 1-11 3 6 1 10 3 12 5-3 1-5 2-6 4 10 1 20-1 27-6z"
wing_r = wing_l.replace("M38", "M62")
emb = circle_d(50, 50, 20)
def feathers(side):
    out = ""
    for i in range(4):
        y = 38 + i * 5.5
        L = 30 - i * 5
        if side < 0:
            out += f'<path d="M26 {y}L{26-L} {y-3}L{26-L+3} {y+2.6}z"/>'
        else:
            out += f'<path d="M74 {y}L{74+L} {y-3}L{74+L-3} {y+2.6}z"/>'
    return out
emblem_outline = "M50 22a28 28 0 0 1 24 13.5C84 32 94 32 99 35c-4 5-9 9-14 13-2 6-6 10-10 12a28 28 0 0 1-50 0c-4-2-8-6-10-12C10 44 5 40 1 35c5-3 15-3 24 .5A28 28 0 0 1 50 22z"
add("dk_emblem", "モータークラブ", G, 56, 34, 4, card(emblem_outline,
    foil(feathers(-1) + feathers(1)
         + '<circle cx="50" cy="50" r="25" fill="none" stroke-width="1.1"/><circle cx="50" cy="50" r="17" fill="none" stroke-width=".7"/>'
         + t(50, 57, "M", 17, "Crimson Text", 'font-style="italic" font-weight="600"')
         + arc_text("MOTOR CLUB", 50, 50, 21, 4.2, -144, 12)
         + arc_text("EST·13", 50, 50, 21, 3.6, 120, -12, bottom=True), "gold")))
# 4 円形スタンプ
add("dk_seal", "ALL NIGHTの刻印", G, 40, 40, 3, card(circle_d(50, 50, 40),
    foil('<circle cx="50" cy="50" r="35" fill="none" stroke-width="1"/><circle cx="50" cy="50" r="23" fill="none" stroke-width=".6"/>'
         + arc_text("NO SLEEP TILL DAWN ·", 50, 50, 29, 5.6, -90, 18)
         + t(50, 49, "ALL", 9) + t(50, 58, "NIGHT", 9)
         + f'<path d="{star_d(5, 3, 1.2, 50, 33.5)}"/><path d="{star_d(5, 3, 1.2, 50, 66.5)}"/>')))
# 5 版画の月
moon = "M58 16a34 34 0 1 0 26 56a28 28 0 1 1-26-56z"
add("dk_moon", "版画の月", G, 40, 40, 3, card(circle_d(50, 50, 40),
    '<g transform="translate(50 50) scale(.86) translate(-50 -50)">' + f'<path d="{moon}" fill="url(#hatch)" opacity=".75"/><path d="{moon}" fill="url(#hatchx)" opacity=".35" clip-path="url(#mh)"/>'
    + '<clipPath id="mh"><circle cx="40" cy="60" r="22"/></clipPath>'
    + foil(f'<path d="{moon}" fill="none" stroke-width="1.1"/>'
           + "".join(f'<path d="{star_d(4, r, r*.22, x, y)}"/>' for x, y, r in [(72, 26, 4), (80, 44, 2.2), (66, 74, 2.6), (24, 30, 1.8)])) + '</g>'))
# 6 バイクのナンバープレート
plate = rrect_d(8, 26, 84, 48, 7)
add("dk_plate", "ナンバープレート", G, 52, 30, 3, card(plate,
    foil('<rect x="12" y="30" width="76" height="40" rx="4" fill="none" stroke-width="1"/>'
         + '<circle cx="18" cy="36" r="1.8"/><circle cx="82" cy="36" r="1.8"/>'
         + t(50, 42, "UNDERGROUND · B2F", 4.6, "DM Sans", 'font-weight="700" letter-spacing="1"')
         + t(50, 66, "13-13", 22, extra='letter-spacing="1"'))))
# 7 スペードのエース
sp = "M50 22C40 36 28 42 28 52a10 10 0 0 0 18 6l-4 12h16l-4-12a10 10 0 0 0 18-6c0-10-12-16-22-30z"
add("dk_ace", "スペードのA", G, 34, 46, 4, card(rrect_d(22, 6, 56, 88, 6),
    foil('<rect x="25.5" y="9.5" width="49" height="81" rx="3" fill="none" stroke-width=".6"/>'
         + t(31, 21, "A", 9, "Crimson Text", 'font-weight="600"') + t(69, 84, "A", 9, "Crimson Text", 'font-weight="600" transform="rotate(180 69 81)"')
         + f'<path d="{sp}" fill="none" stroke-width="1.2"/>')
    + f'<path d="{sp}" fill="url(#hatch)" opacity=".7" transform="translate(50 48) scale(.86) translate(-50 -48)"/>'))
# 8 リボンの帯
ban = "M4 44l10-6v4h72v-4l10 6-10 6v14l10 6-10 6v-4H14v4L4 70l10-6V50z"
ban = "M6 40h14v-6h60v6h14l-8 12 8 12H80v6H20v-6H6l8-12z"
add("dk_banner", "STAY LOUDの帯", G, 56, 30, 3, card(ban,
    foil('<path d="M22 37h56v30H22z" fill="none" stroke-width=".6"/><path d="M22 37l-2-3M78 37l2-3M22 67l-2 3M78 67l2 3" stroke-width=".6"/>'
         + t(50, 58, "STAY LOUD", 12, extra='letter-spacing="1"'))))

# ---- 基礎素材をダークの画風で ----
B = "基礎素材（ダーク）"
add("b_dot", "まるドット（ダーク）", B, 18, 18, 1, card(circle_d(50, 50, 36),
    foil('<circle cx="50" cy="50" r="27"/>')))
add("b_sparkle", "キラッ（ダーク）", B, 22, 22, 1, card(star_d(4, 44, 12),
    f'<path d="{star_d(4, 44, 12)}" fill="url(#hatch)" opacity=".6"/>' + foil(f'<path d="{star_d(4, 36, 7)}" fill="none" stroke-width="1.2"/><path d="{star_d(4, 9, 2.5)}"/>')))
facets = ""
pts = [(50 + 26 * M.cos(M.radians(22.5 + 45 * i)), 50 + 26 * M.sin(M.radians(22.5 + 45 * i))) for i in range(8)]
inn = [(50 + 12 * M.cos(M.radians(22.5 + 45 * i)), 50 + 12 * M.sin(M.radians(22.5 + 45 * i))) for i in range(8)]
for i in range(8):
    a, b, c, e = pts[i], pts[(i + 1) % 8], inn[(i + 1) % 8], inn[i]
    sh = ["#3A3D44", "#1C1D22", "#2A2C32", "#0E0E11"][i % 4]
    facets += f'<path d="M{a[0]:.1f} {a[1]:.1f}L{b[0]:.1f} {b[1]:.1f}L{c[0]:.1f} {c[1]:.1f}L{e[0]:.1f} {e[1]:.1f}z" fill="{sh}" stroke="#55595F" stroke-width=".4"/>'
add("b_stone", "ラインストーン（ダーク）", B, 22, 22, 1, card(circle_d(50, 50, 38),
    foil('<circle cx="50" cy="50" r="31"/>') + facets
    + '<path d="M' + " L".join(f"{x:.1f} {y:.1f}" for x, y in inn) + 'z" fill="#26282E" stroke="#6A6F77" stroke-width=".4"/>'
    + f'<path d="{star_d(4, 7, 1.4, 41, 40)}" fill="#fff" opacity=".9"/>'))
add("b_pearl", "パール（ダーク）", B, 20, 20, 1,
    '<defs><radialGradient id="bp" cx=".36" cy=".32" r=".8"><stop offset="0" stop-color="#C9C6D6"/><stop offset=".25" stop-color="#5E5A6E"/>'
    '<stop offset=".7" stop-color="#1D1B24"/><stop offset="1" stop-color="#0A090D"/></radialGradient></defs>'
    '<circle cx="51" cy="52" r="38" fill="#000" opacity=".18"/><circle cx="50" cy="50" r="39" fill="#fff"/>'
    '<circle cx="50" cy="50" r="35" fill="url(#bp)"/><path d="M28 60a24 24 0 0 0 30 14" fill="none" stroke="#8C7FB0" stroke-width="2.4" opacity=".55" stroke-linecap="round"/>'
    '<ellipse cx="38" cy="35" rx="7" ry="3.6" fill="#fff" opacity=".7" transform="rotate(-35 38 35)"/>')
tape = "M10 36l3 2-3 2 3 2-3 2 3 2-3 2 3 2-3 2 3 2-3 2 3 2-3 2h80l-3-2 3-2-3-2 3-2-3-2 3-2-3-2 3-2-3-2 3-2-3-2 3-2z"
add("b_tape", "マステ（ダーク）", B, 40, 16, 1,
    f'<g transform="rotate(-10 50 50)"><path d="{tape}" fill="#000" opacity=".15" transform="translate(1 2)"/>'
    f'<path d="{tape}" fill="{PAPER}" opacity=".92"/><clipPath id="tpc"><path d="{tape}"/></clipPath>'
    f'<g clip-path="url(#tpc)"><rect width="100" height="100" filter="url(#grain)"/>'
    + foil(t(50, 53, "— AFTER HOURS — AFTER HOURS —", 5.2, "DM Sans", 'font-weight="700" letter-spacing=".8"')) + '</g></g>')

# ---- 書き出し ----
META = []
rows = []
for i, (sid, name, group, w, h, charm, body) in enumerate(S, 1):
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="512" height="512"><defs>{DEFS}</defs>{body}\n</svg>\n'
    fn = f"{i:02d}_{sid}"
    open(f"{OUT}/svg/{fn}.svg", "w").write(svg)
    png = f"{OUT}/png/{fn}.png"
    subprocess.run(["rsvg-convert", "-w", "512", "-h", "512", "-o", png, f"{OUT}/svg/{fn}.svg"], check=True)
    im = Image.open(png).convert("RGBA")
    im = im.crop(im.getbbox())
    side = max(im.size) + 16
    cv = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    cv.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
    cv.resize((512, 512), Image.LANCZOS).save(png)
    rows.append((fn, name, group))
    META.append(dict(file=f"{fn}.png", name=name, group=group, width=w, height=h, charm=charm))

import csv
with open(f"{OUT}/meta.csv", "w", newline="") as f:
    wr = csv.DictWriter(f, fieldnames=list(META[0].keys())); wr.writeheader(); wr.writerows(META)
cell, pad, cols = 220, 14, 4
n = len(rows)
sh = Image.new("RGB", (cell * cols, (cell + 26) * ((n + cols - 1) // cols)), "#ffffff")
dr = ImageDraw.Draw(sh)
font = ImageFont.truetype("/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf", 15)
for k, (fn, name, _) in enumerate(rows):
    x, y = (k % cols) * cell, (k // cols) * (cell + 26)
    im = Image.open(f"{OUT}/png/{fn}.png").resize((cell - pad * 2, cell - pad * 2), Image.LANCZOS)
    sh.paste(im, (x + pad, y + pad), im)
    tw = dr.textlength(name, font=font)
    dr.text((x + (cell - tw) / 2, y + cell - 4), name, fill="#7A7268", font=font)
sh.save(f"{OUT}/sheet_dark.png")
print("done", n)
