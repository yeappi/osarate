import csv, os, shutil, zipfile
from PIL import Image, ImageDraw, ImageFont
styles = [("pop","ポップ"),("fresh","爽やか"),("dream","ゆめかわダーク"),("dark","ダーク")]
F = "/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf"
font, hfont = ImageFont.truetype(F, 15), ImageFont.truetype(F, 22)
os.makedirs("pack/png", exist_ok=True); os.makedirs("pack/svg", exist_ok=True)
theme, base, man = [], [], []
BASE_P = {"まるドット": 5, "キラッ": 5, "マステ": 10, "ラインストーン": 15, "パール": 15}
PREMIUM_MAT = {"刺繍": 5, "木製": 5, "アクリル": 5}
TOP = {"pop_score", "fr_surf", "dd_tarot", "dk_emblem"}
MID = {"pop_capsule", "fr_bus", "dd_label", "dk_ticket"}
LOW = {"pop_dpad", "pop_start", "fr_wave", "fr_drop", "dd_sign", "dd_wax", "dk_plate", "dk_banner"}
def theme_price(sid):
    return 150 if sid in TOP else 80 if sid in MID else 30 if sid in LOW else 50
LONG_BASE = {"まるドット": 24, "キラッ": 32, "ラインストーン": 30, "パール": 26, "マステ": 72}
LONG_THEME = {30: 72, 50: 92, 80: 112, 150: 140}
def tight(path):
    """余白を削って画像の縦横比を実物に合わせる"""
    im = Image.open(path).convert("RGBA"); im = im.crop(im.getbbox())
    m = max(4, round(max(im.size) * .03))
    cv = Image.new("RGBA", (im.width + m*2, im.height + m*2), (0, 0, 0, 0)); cv.paste(im, (m, m))
    long = max(cv.size)
    if long > 512:
        cv = cv.resize((round(cv.width*512/long), round(cv.height*512/long)), Image.LANCZOS)
    cv.save(path); return cv.size
def size_for(path, long_side):
    iw, ih = tight(path)
    k = long_side / max(iw, ih)
    return max(8, round(iw * k)), max(8, round(ih * k))
def entry(file, name, w, h, price, group, theme_label, series):
    w, h = size_for(f"pack/png/{file}", LONG_BASE[series] if group == "基礎素材" else LONG_THEME[price])
    return {"file": file, "name": name, "dex": "main", "width": w, "height": h, "charm": price // 10, "price": price,
            "rarity": "rare" if price >= 150 else "uncommon" if price >= 80 else "common", "kind": "basic", "visibility": "always",
            "purchasable": "true", "group": group, "theme": theme_label, "series": series}
for key, label in styles:
    tr, br = [], []
    for r in csv.DictReader(open(f"out3/{key}/meta.csv")):
        sid = r["file"][3:-4]; new = f"{key}_{sid}"
        shutil.copy(f"out3/{key}/png/{r['file']}", f"pack/png/{new}.png")
        shutil.copy(f"out3/{key}/svg/{r['file'][:-4]}.svg", f"pack/svg/{new}.svg")
        isb = sid.startswith("b_")
        (br if isb else tr).append((f"pack/png/{new}.png", r["name"]))
        ser = r["name"].split("（")[0]
        p = BASE_P[ser] if isb else theme_price(sid)
        man.append(entry(f"{new}.png", r["name"], r["width"], r["height"], p, "基礎素材" if isb else "テーマ", label, ser if isb else label))
    theme.append((label, tr)); base.append((label, br))
mats = {}
for r in csv.DictReader(open("out3/mat/meta.csv")):
    sid = r["file"][3:-4]; new = f"mat_{sid[2:]}"
    shutil.copy(f"out3/mat/png/{r['file']}", f"pack/png/{new}.png")
    shutil.copy(f"out3/mat/svg/{r['file'][:-4]}.svg", f"pack/svg/{new}.svg")
    label = r["group"][5:-1]
    mats.setdefault(label, []).append((f"pack/png/{new}.png", r["name"]))
    ser = r["name"].split("（")[0]
    man.append(entry(f"{new}.png", r["name"], r["width"], r["height"], BASE_P[ser] + PREMIUM_MAT.get(label, 0), "基礎素材", label, ser))
base += list(mats.items())
with open("pack/manifest.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(man[0].keys())); w.writeheader(); w.writerows(man)
def sheet(groups, path, cols):
    cell, pad, head = 170, 12, 38
    H = sum(head + (cell+24)*((len(r)+cols-1)//cols) for _, r in groups)
    sh = Image.new("RGB", (cell*cols, H), "#FFFDF8"); dr = ImageDraw.Draw(sh); y0 = 0
    for title, rows in groups:
        dr.text((14, y0+10), title, fill="#23201C", font=hfont); y0 += head
        for k, (p, name) in enumerate(rows):
            x, y = (k%cols)*cell, y0+(k//cols)*(cell+24)
            im = Image.open(p); im.thumbnail((cell-pad*2, cell-pad*2), Image.LANCZOS); sh.paste(im, (x+(cell-im.width)//2, y+pad+(cell-pad*2-im.height)//2), im)
            tw = dr.textlength(name, font=font); dr.text((x+(cell-tw)/2, y+cell-4), name, fill="#7A7268", font=font)
        y0 += (cell+24)*((len(rows)+cols-1)//cols)
    sh.save(path)
sheet(theme, "pack/sheet_themes.png", 8)
sheet(base, "pack/sheet_base.png", 5)
with zipfile.ZipFile("stickers_82.zip", "w", zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk("pack"):
        for fn in files: z.write(os.path.join(root, fn), os.path.relpath(os.path.join(root, fn), "pack"))
print(len(man))

# 実寸プレビュー：360×480 のページに並べる（2倍で書き出し）
import random
random.seed(3)
S = 2
for key, label in [("dark","ダーク"),("pop","ポップ")]:
    page = Image.new("RGB", (360*S, 480*S), "#FFFDF8")
    items = [r for r in man if r["theme"] == label]
    x, y, rowh = 10, 10, 0
    for r in sorted(items, key=lambda r: -int(r["width"])*int(r["height"])):
        w, h = int(r["width"])*S, int(r["height"])*S
        if x + w > 350*S: x, y, rowh = 10, y + rowh + 6, 0
        im = Image.open(f"pack/png/{r['file']}").resize((w, h), Image.LANCZOS)
        page.paste(im, (x, y), im); x += w + 6; rowh = max(rowh, h)
    page.save(f"pack/preview_page_{key}.png")
