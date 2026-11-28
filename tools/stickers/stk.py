"""シール生成の共通部品"""
import math, os, subprocess
from PIL import Image, ImageDraw, ImageFont

M = math


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


def poly_d(pts):
    return "M" + "L".join(f"{x:.2f} {y:.2f}" for x, y in pts) + "z"


def octa(cx, cy, r):
    return [(cx + r * M.cos(M.radians(22.5 + 45 * i)), cy + r * M.sin(M.radians(22.5 + 45 * i))) for i in range(8)]


def t(x, y, s, size, family="Anton", extra="", anchor="middle", fill=None):
    f = f'fill="{fill}"' if fill else ""
    return f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{family}" font-size="{size}" stroke="none" {f} {extra}>{s}</text>'


def arc_text(s, cx, cy, r, size, start, step, family="Anton", bottom=False, fill=None, extra=""):
    out = ""
    f = f'fill="{fill}"' if fill else ""
    for i, ch in enumerate(s):
        a = start + i * step
        x, y = cx + r * M.cos(M.radians(a)), cy + r * M.sin(M.radians(a))
        rot = a + 90 if not bottom else a - 90
        out += (f'<text x="{x:.2f}" y="{y:.2f}" text-anchor="middle" dominant-baseline="central" font-family="{family}" '
                f'font-size="{size}" stroke="none" {f} {extra} transform="rotate({rot:.1f} {x:.2f} {y:.2f})">{ch}</text>')
    return out


class Book:
    def __init__(self, out, defs):
        self.out, self.defs, self.items, self._n = out, defs, [], 0
        os.makedirs(f"{out}/svg", exist_ok=True)
        os.makedirs(f"{out}/png", exist_ok=True)

    def uid(self, p="u"):
        self._n += 1
        return f"{p}{self._n}"

    def add(self, sid, name, group, w, h, charm, body):
        self.items.append((sid, name, group, w, h, charm, body))

    def render(self, sheet_name, cols=4):
        rows = []
        for i, (sid, name, group, w, h, charm, body) in enumerate(self.items, 1):
            svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="512" height="512">'
                   f'<defs>{self.defs}</defs>{body}\n</svg>\n')
            fn = f"{i:02d}_{sid}"
            open(f"{self.out}/svg/{fn}.svg", "w").write(svg)
            png = f"{self.out}/png/{fn}.png"
            subprocess.run(["rsvg-convert", "-w", "512", "-h", "512", "-o", png, f"{self.out}/svg/{fn}.svg"], check=True)
            im = Image.open(png).convert("RGBA")
            im = im.crop(im.getbbox())
            side = max(im.size) + 16
            cv = Image.new("RGBA", (side, side), (0, 0, 0, 0))
            cv.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
            cv.resize((512, 512), Image.LANCZOS).save(png)
            rows.append(dict(file=f"{fn}.png", name=name, group=group, width=w, height=h, charm=charm))
        import csv
        with open(f"{self.out}/meta.csv", "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
        cell, pad = 220, 14
        n = len(rows)
        sh = Image.new("RGB", (cell * cols, (cell + 26) * ((n + cols - 1) // cols)), "#FFFDF8")
        dr = ImageDraw.Draw(sh)
        font = ImageFont.truetype("/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf", 15)
        for k, r in enumerate(rows):
            x, y = (k % cols) * cell, (k // cols) * (cell + 26)
            im = Image.open(f"{self.out}/png/{r['file']}").resize((cell - pad * 2, cell - pad * 2), Image.LANCZOS)
            sh.paste(im, (x + pad, y + pad), im)
            tw = dr.textlength(r["name"], font=font)
            dr.text((x + (cell - tw) / 2, y + cell - 4), r["name"], fill="#7A7268", font=font)
        sh.save(f"{self.out}/{sheet_name}")
        return rows
