"""Builds the Prayer Odyssey logo (variation D: praying hands over an open journal).

Geometry is defined once in a 512x512 design space, boolean-combined with shapely
(so thumb/cuff details are real cut-outs, not painted strokes), and written out as
plain filled SVG paths that work on any background and in flutter_svg.

Usage: python3 build_logo.py <out_dir>   (needs: pip install shapely)
"""
import sys
from pathlib import Path

from shapely import affinity
from shapely.geometry import LineString, Polygon
from shapely.ops import unary_union

OLIVE, LINEN, TERRACOTTA = "#4E5D3A", "#F7F4EC", "#C0763E"


def cubic(p0, p1, p2, p3, n=24):
    pts = []
    for i in range(n + 1):
        t = i / n
        mt = 1 - t
        pts.append((
            mt**3 * p0[0] + 3 * mt**2 * t * p1[0] + 3 * mt * t**2 * p2[0] + t**3 * p3[0],
            mt**3 * p0[1] + 3 * mt**2 * t * p1[1] + 3 * mt * t**2 * p2[1] + t**3 * p3[1],
        ))
    return pts


def chain(start, segments):
    """segments: ('C', c1, c2, end) or ('L', end)."""
    pts, cur = [start], start
    for seg in segments:
        if seg[0] == "C":
            pts += cubic(cur, seg[1], seg[2], seg[3])[1:]
            cur = seg[3]
        else:
            pts.append(seg[1])
            cur = seg[1]
    return pts


# Left hand, palm edge on x=250 (the right hand is its mirror around x=256).
LEFT_HAND = Polygon(chain((250, 112), [
    ("C", (238, 112), (226, 124), (218, 144)),
    ("C", (206, 174), (198, 210), (195, 242)),
    ("C", (193, 258), (191, 266), (190, 274)),
    ("L", (136, 328)),
    ("C", (124, 340), (128, 362), (146, 370)),
    ("C", (156, 374), (166, 372), (174, 366)),
    ("L", (226, 324)),
    ("C", (236, 318), (244, 316), (250, 316)),
]))
THUMB = LineString(cubic((249, 214), (236, 222), (224, 242), (216, 272)))
CUFF = LineString([(166, 298), (204, 340)])
GAPS = unary_union([THUMB.buffer(4.5, cap_style="round"), CUFF.buffer(4.5, cap_style="round")])

left = LEFT_HAND.difference(GAPS)
right = affinity.scale(left, xfact=-1, origin=(256, 0))
hands = unary_union([left, right])
# Same placement as the approved canvas concept.
hands = affinity.translate(affinity.scale(affinity.translate(hands, -256, -238), 0.66, 0.66, origin=(0, 0)), 256, 212)

left_page = Polygon(chain((250, 372), [
    ("C", (210, 350), (156, 344), (100, 352)),
    ("L", (100, 418)),
    ("C", (156, 410), (210, 416), (250, 438)),
]))
right_page = affinity.scale(left_page, xfact=-1, origin=(256, 0))
pages = unary_union([left_page, right_page])
ribbon = LineString([(256, 378), (256, 446)]).buffer(5, cap_style="round")

body = unary_union([hands, pages])

# Centre the whole mark (hands + book + ribbon) on (256, 256).
minx, miny, maxx, maxy = unary_union([body, ribbon]).bounds
dx, dy = 256 - (minx + maxx) / 2, 256 - (miny + maxy) / 2
body = affinity.translate(body, dx, dy)
ribbon = affinity.translate(ribbon, dx, dy)
MARK_W, MARK_H = maxx - minx, maxy - miny


def to_path(geom, scale=1.0, cx=256, cy=256):
    g = affinity.scale(geom, scale, scale, origin=(cx, cy))
    polys = [g] if g.geom_type == "Polygon" else list(g.geoms)
    d = []
    for p in polys:
        for ring in [p.exterior, *p.interiors]:
            c = list(ring.coords)
            d.append("M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in c[:-1]) + " Z")
    return " ".join(d)


def mark(fill, ribbon_fill, scale=1.0):
    out = f'<path fill="{fill}" fill-rule="evenodd" d="{to_path(body, scale)}"/>'
    if ribbon_fill:
        out += f'<path fill="{ribbon_fill}" d="{to_path(ribbon, scale)}"/>'
    return out


def svg(content, vb="0 0 512 512"):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{content}</svg>\n'


def tight_vb(scale=1.0, pad=8):
    w, h = MARK_W * scale, MARK_H * scale
    return f"{256 - w / 2 - pad:.1f} {256 - h / 2 - pad:.1f} {w + 2 * pad:.1f} {h + 2 * pad:.1f}"


out = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
out.mkdir(parents=True, exist_ok=True)
files = {
    # Transparent marks (tight viewBox) for in-app use and splash screens.
    "logo-mark-olive.svg": svg(mark(OLIVE, TERRACOTTA), tight_vb()),
    "logo-mark-linen.svg": svg(mark(LINEN, TERRACOTTA), tight_vb()),
    # Icons. Mark is ~61% of the tile width; maskable keeps it inside the 80% safe zone.
    "app-icon.svg": svg(f'<rect width="512" height="512" rx="112" fill="{OLIVE}"/>' + mark(LINEN, TERRACOTTA, 1.0)),
    "app-icon-circle.svg": svg(f'<circle cx="256" cy="256" r="256" fill="{OLIVE}"/>' + mark(LINEN, TERRACOTTA, 0.92)),
    "app-icon-maskable.svg": svg(f'<rect width="512" height="512" fill="{OLIVE}"/>' + mark(LINEN, TERRACOTTA, 0.82)),
    # Monochrome (alpha-only) badge for web push; ribbon omitted, gutter stays open.
    "badge-mono.svg": svg(mark("#FFFFFF", None, 1.12)),
}
for name, content in files.items():
    (out / name).write_text(content)
print(f"mark size {MARK_W:.0f}x{MARK_H:.0f}; wrote {', '.join(files)}")
