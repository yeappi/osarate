"""基礎素材：素材の画風6種 × 5マーク ＝ 30枚
ぷっくり / 刺繍ワッペン / フェルト / 木製 / アクリル / 紙の切り抜き
"""
import os
from stk import *

DEFS = """
<filter id="fuzz" x="-5" y="-5" width="110" height="110" filterUnits="userSpaceOnUse">
  <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="4" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<filter id="rough" x="-5" y="-5" width="110" height="110" filterUnits="userSpaceOnUse">
  <feTurbulence type="fractalNoise" baseFrequency=".35" numOctaves="3" seed="8" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="1.1" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<filter id="felttex" x="0" y="0" width="100" height="100" filterUnits="userSpaceOnUse">
  <feTurbulence type="fractalNoise" baseFrequency="1.8" numOctaves="3" seed="6"/>
  <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.1 -.55"/>
</filter>
<filter id="feltdark" x="0" y="0" width="100" height="100" filterUnits="userSpaceOnUse">
  <feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="2" seed="13"/>
  <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 -.55"/>
</filter>
<filter id="paperf" x="0" y="0" width="100" height="100" filterUnits="userSpaceOnUse">
  <feTurbulence type="fractalNoise" baseFrequency="3 .6" numOctaves="2" seed="21"/>
  <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .6 -.25"/>
</filter>
<filter id="woodf" x="0" y="0" width="100" height="100" filterUnits="userSpaceOnUse">
  <feTurbulence type="fractalNoise" baseFrequency=".018 .32" numOctaves="3" seed="4"/>
  <feColorMatrix type="matrix" values=".55 0 0 0 .52  .4 0 0 0 .33  .25 0 0 0 .17  0 0 0 0 1"/>
</filter>
<linearGradient id="acrylEdge" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".5" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#fff" stop-opacity=".7"/>
</linearGradient>
"""
B = Book(os.path.join(os.path.dirname(__file__), "out3", "mat"), DEFS)

TAPE = "M8 37l3 2.6-3 2.6 3 2.6-3 2.6 3 2.6-3 2.6 3 2.6-3 2.6 3 2.6h84l-3-2.6 3-2.6-3-2.6 3-2.6-3-2.6 3-2.6-3-2.6 3-2.6-3-2.6z"
O, I = octa(50, 50, 34), octa(50, 50, 16)
SHAPES = {
    "dot": circle_d(50, 50, 34),
    "sparkle": star_d(4, 42, 11),
    "stone": poly_d(O),
    "pearl": circle_d(50, 50, 32),
    "tape": TAPE,
}
NAMES = {"dot": "まるドット", "sparkle": "キラッ", "stone": "ラインストーン", "pearl": "パール", "tape": "マステ"}
SIZE = {"dot": (18, 18), "sparkle": (22, 22), "stone": (22, 22), "pearl": (20, 20), "tape": (40, 16)}
FACETS = "".join(f"M{O[k][0]:.1f} {O[k][1]:.1f}L{I[k][0]:.1f} {I[k][1]:.1f}" for k in range(8)) + poly_d(I)


def rot(body, mark):
    return f'<g transform="rotate(-8 50 50)">{body}</g>' if mark == "tape" else body


def shade(hexc, f):
    h = hexc.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    if f < 1:
        r, g, b = (int(v * f) for v in (r, g, b))
    else:
        r, g, b = (int(v + (255 - v) * (f - 1)) for v in (r, g, b))
    return f"#{r:02X}{g:02X}{b:02X}"


# ---------- 5 ぷっくり（樹脂コーティング） ----------
def puffy(mark, c):
    d = SHAPES[mark]
    gid = B.uid("pg")
    g = (f'<radialGradient id="{gid}" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="{shade(c, 1.45)}"/>'
         f'<stop offset=".7" stop-color="{c}"/><stop offset="1" stop-color="{shade(c, .82)}"/></radialGradient>')
    extra = ""
    if mark == "stone":
        extra = f'<path d="{FACETS}" fill="none" stroke="#fff" stroke-width="1.2" opacity=".55"/>'
    if mark == "tape":
        extra = "".join(f'<circle cx="{x}" cy="50" r="2.6" fill="#fff" opacity=".8"/>' for x in range(16, 92, 10))
    hl = {"tape": '<path d="M16 41h60" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>',
          "sparkle": '<ellipse cx="45" cy="30" rx="2.4" ry="7" fill="#fff" opacity=".85" transform="rotate(12 45 30)"/>'}.get(
        mark, '<ellipse cx="38" cy="34" rx="10" ry="5" fill="#fff" opacity=".85" transform="rotate(-35 38 34)"/><circle cx="64" cy="66" r="2.4" fill="#fff" opacity=".6"/>')
    return rot(f'<defs>{g}</defs><path d="{d}" fill="#000" stroke="#000" stroke-width="9" stroke-linejoin="round" opacity=".13" transform="translate(1.5 3)"/>'
               f'<path d="{d}" fill="#fff" stroke="#fff" stroke-width="9" stroke-linejoin="round"/>'
               f'<path d="{d}" fill="{shade(c, .8)}"/><path d="{d}" fill="url(#{gid})" transform="translate(50 48.6) scale(.94) translate(-50 -50)"/>'
               f'{extra}{hl}', mark)


# ---------- 6 刺繍ワッペン ----------
def embroidery(mark, c):
    d = SHAPES[mark]
    pid, cid = B.uid("sat"), B.uid("ec")
    angle = {"dot": 30, "sparkle": 90, "stone": 0, "pearl": -30, "tape": 90}[mark]
    pat = (f'<pattern id="{pid}" width="1.3" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate({angle})">'
           f'<rect width="1.3" height="6" fill="{c}"/><rect width=".35" height="6" fill="{shade(c, .78)}"/>'
           f'<rect x=".65" width=".25" height="6" fill="{shade(c, 1.3)}" opacity=".7"/></pattern>')
    inner = ""
    if mark == "stone":
        inner = f'<path d="{FACETS}" fill="none" stroke="{shade(c, 1.5)}" stroke-width="1.1" stroke-dasharray="1.6 .6"/>'
    if mark == "pearl":
        inner = f'<path d="M34 40a18 18 0 0 1 12-10" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="1.4 .5" stroke-linecap="round"/>'
    if mark == "sparkle":
        inner = f'<path d="{star_d(4, 14, 4)}" fill="none" stroke="{shade(c, 1.5)}" stroke-width="1" stroke-dasharray="1.4 .5"/>'
    if mark == "tape":
        inner = "".join(f'<path d="M{x} 44v12" stroke="#fff" stroke-width="2.2" stroke-dasharray="1.4 .5"/>' for x in range(18, 88, 12))
    edge = shade(c, .6)
    return rot(f'<defs>{pat}<clipPath id="{cid}"><path d="{d}"/></clipPath></defs>'
               f'<path d="{d}" fill="#000" stroke="#000" stroke-width="7" stroke-linejoin="round" opacity=".18" transform="translate(1.2 2.4)"/>'
               f'<path d="{d}" fill="url(#{pid})" stroke="{edge}" stroke-width="5" stroke-linejoin="round"/>'
               f'<path d="{d}" fill="none" stroke="{shade(c, 1.15)}" stroke-width="5" stroke-dasharray=".45 .55" stroke-linejoin="round"/>'
               f'<g clip-path="url(#{cid})">{inner}</g>', mark)


# ---------- 7 フェルト ----------
def felt(mark, c):
    d = SHAPES[mark]
    cid = B.uid("fc")
    inner = ""
    if mark == "stone":
        inner = f'<path d="{poly_d(I)}" fill="{shade(c, 1.3)}" filter="url(#fuzz)"/>'
    if mark == "pearl":
        inner = f'<circle cx="40" cy="38" r="7" fill="{shade(c, 1.5)}" filter="url(#fuzz)"/>'
    if mark == "sparkle":
        inner = f'<circle cx="50" cy="50" r="4" fill="{shade(c, 1.5)}" filter="url(#fuzz)"/>'
    if mark == "tape":
        inner = "".join(f'<circle cx="{x}" cy="50" r="3" fill="{shade(c, 1.45)}" filter="url(#fuzz)"/>' for x in range(18, 88, 12))
    stitch_scale = ".82" if mark != "tape" else ".9 .7"
    return rot(f'<defs><clipPath id="{cid}"><path d="{d}"/></clipPath></defs>'
               f'<path d="{d}" fill="#000" opacity=".18" transform="translate(1.2 2.4)" filter="url(#fuzz)"/>'
               f'<g filter="url(#fuzz)"><path d="{d}" fill="{c}"/></g>'
               f'<g clip-path="url(#{cid})"><rect width="100" height="100" filter="url(#feltdark)" opacity=".35"/>'
               f'<rect width="100" height="100" filter="url(#felttex)" opacity=".5"/>{inner}</g>'
               f'<path d="{d}" fill="none" stroke="#fff" stroke-width="1.1" stroke-dasharray="2.4 1.8" stroke-linecap="round" opacity=".9" '
               f'transform="translate(50 50) scale({stitch_scale}) translate(-50 -50)"/>', mark)


# ---------- 8 木製 ----------
def wood(mark, c):
    d = SHAPES[mark]
    cid = B.uid("wc")
    burn = "#4A2A14"
    inner = ""
    if mark == "dot":
        inner = f'<circle cx="50" cy="50" r="24" fill="none" stroke="{burn}" stroke-width="1.2" opacity=".7"/><circle cx="44" cy="50" r="3" fill="{burn}"/><circle cx="56" cy="50" r="3" fill="{burn}"/>'
    if mark == "sparkle":
        inner = f'<path d="{star_d(4, 30, 7)}" fill="none" stroke="{burn}" stroke-width="1" opacity=".6"/>'
    if mark == "stone":
        inner = f'<path d="{FACETS}" fill="none" stroke="{burn}" stroke-width="1.2" opacity=".7"/><path d="{poly_d(I)}" fill="{c}" opacity=".45"/>'
    if mark == "pearl":
        inner = f'<circle cx="50" cy="50" r="32" fill="{c}" opacity=".35"/><ellipse cx="38" cy="36" rx="9" ry="4" fill="#fff" opacity=".35" transform="rotate(-35 38 36)"/>'
    if mark == "tape":
        inner = t(50, 53.5, "HANDMADE · WOOD", 6, "DM Sans", 'font-weight="700" letter-spacing="1"', fill=burn) + '<g opacity=".7"></g>'
    side = "#7A4E2A"
    return rot(f'<defs><clipPath id="{cid}"><path d="{d}"/></clipPath></defs>'
               f'<path d="{d}" fill="#000" opacity=".2" transform="translate(2 4)"/>'
               f'<path d="{d}" fill="{side}" transform="translate(0 2.4)"/>'
               f'<g clip-path="url(#{cid})"><rect width="100" height="100" filter="url(#woodf)"/>{inner}'
               f'<path d="{d}" fill="none" stroke="#fff" stroke-width="1.4" opacity=".25" transform="translate(-.6 -.6)"/></g>', mark)


# ---------- 9 アクリル ----------
def acrylic(mark, c):
    d = SHAPES[mark]
    cid = B.uid("ac")
    inner = ""
    if mark == "stone":
        inner = f'<path d="{FACETS}" fill="none" stroke="#fff" stroke-width="1" opacity=".8"/>'
    if mark == "tape":
        inner = "".join(f'<path d="{star_d(4, 3, .8, x, 50)}" fill="#fff" opacity=".9"/>' for x in range(16, 92, 12))
    if mark == "sparkle":
        inner = f'<path d="{star_d(4, 30, 6)}" fill="none" stroke="#fff" stroke-width=".8" opacity=".8"/>'
    if mark == "pearl":
        inner = f'<circle cx="50" cy="50" r="22" fill="none" stroke="#fff" stroke-width="1" opacity=".6"/>'
    return rot(f'<defs><clipPath id="{cid}"><path d="{d}"/></clipPath></defs>'
               f'<path d="{d}" fill="{c}" opacity=".22" transform="translate(2.4 4.5)"/>'
               f'<path d="{d}" fill="{shade(c, .8)}" opacity=".55" transform="translate(1.2 2.4)"/>'
               f'<path d="{d}" fill="{c}" opacity=".55"/>'
               f'<g clip-path="url(#{cid})">{inner}<path d="M-10 34L44 -10h10L-10 46z" fill="#fff" opacity=".7"/><path d="M-10 52L62 -10h4L-10 56z" fill="#fff" opacity=".5"/>'
               f'<path d="M50 110L110 50v8L58 110z" fill="#fff" opacity=".3"/></g>'
               f'<path d="{d}" fill="none" stroke="url(#acrylEdge)" stroke-width="2.4" stroke-linejoin="round"/>', mark)


# ---------- 10 紙の切り抜き ----------
def paper(mark, c):
    d = SHAPES[mark]
    cid = B.uid("kc")
    back = {"dot": "#F1EDE4", "sparkle": "#264653", "stone": "#F4A261", "pearl": "#2A9D8F", "tape": "#F1EDE4"}[mark]
    inner = ""
    if mark == "stone":
        inner = f'<path d="{poly_d(I)}" fill="{back}" filter="url(#rough)" transform="rotate(4 50 50)"/>'
    if mark == "pearl":
        inner = f'<circle cx="40" cy="39" r="8" fill="#fff" opacity=".85" filter="url(#rough)"/>'
    if mark == "sparkle":
        inner = f'<path d="{star_d(4, 16, 5)}" fill="#F1EDE4" filter="url(#rough)" transform="rotate(8 50 50)"/>'
    if mark == "tape":
        inner = "".join(f'<rect x="{x}" y="36" width="5" height="30" fill="#F1EDE4" opacity=".9" filter="url(#rough)"/>' for x in range(14, 92, 12))
    layer = ""
    if mark in ("dot", "pearl", "stone"):
        layer = f'<g filter="url(#rough)"><path d="{d}" fill="{back}" transform="translate(50 50) scale(1.12) rotate(-6) translate(-50 -50)"/></g>'
    return rot(f'<defs><clipPath id="{cid}"><path d="{d}"/></clipPath></defs>'
               f'<path d="{d}" fill="#000" opacity=".14" transform="translate(1.4 2.6) scale(1)" filter="url(#rough)"/>'
               f'{layer}'
               f'<g filter="url(#rough)"><path d="{d}" fill="{c}"/></g>'
               f'<g clip-path="url(#{cid})"><rect width="100" height="100" filter="url(#paperf)"/>{inner}</g>'
               f'<path d="M30 90l6-8M34 92l4-6" stroke="#9A8F7E" stroke-width=".6" opacity="0"/>', mark)


STYLES = [
    ("puffy", "ぷっくり", puffy, ["#F4A3B5", "#FFD66B", "#7FC8E8", "#EDE7DD", "#9ED6B1"]),
    ("emb", "刺繍", embroidery, ["#D9534F", "#F2C14E", "#3E7CB1", "#F4F1EA", "#5BA67A"]),
    ("felt", "フェルト", felt, ["#E07A5F", "#F2CC8F", "#81B29A", "#ECE6D6", "#3D405B"]),
    ("wood", "木製", wood, ["#6B4226", "#6B4226", "#2F6B5A", "#C26A4A", "#6B4226"]),
    ("acryl", "アクリル", acrylic, ["#FF6FA0", "#FFB627", "#3FB6D9", "#9B8CF2", "#4CC9A4"]),
    ("paper", "紙の切り抜き", paper, ["#E76F51", "#F4C95D", "#2A9D8F", "#F2F0EA", "#264653"]),
]
MARKS = ["dot", "sparkle", "stone", "pearl", "tape"]

for key, label, fn, colors in STYLES:
    for mark, c in zip(MARKS, colors):
        w, h = SIZE[mark]
        B.add(f"b_{key}_{mark}", f"{NAMES[mark]}（{label}）", f"基礎素材（{label}）", w, h, 1, fn(mark, c))

B.render("sheet_mat.png", cols=5)
print("mat done", len(B.items))
