"""
tools/blender/generate_ankylo_pbr_textures.py
Generates high-resolution 1024x1024 / 512x512 / 256x256 PBR textures for the
Ankylosaurus magniventris GLB model in assets/textures/fighters/, matching the
reference portrait (assets/portraits/ankylo.png) and js/fighters/ankylosaurus.js.
"""

import math
import os
import numpy as np
from PIL import Image, ImageDraw

from generate_trex_pbr_textures import (
    FastRNG,
    _make_horizontal_gradient,
    _make_vertical_gradient,
    _quad_bezier_pts,
    _composite_layer,
    _height_to_normal_rgb,
    _hex_to_rgb,
)

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
TEX_DIR = os.path.join(ROOT, "assets", "textures", "fighters")
os.makedirs(TEX_DIR, exist_ok=True)


def _draw_polygonal_scutes(color_img, b_draw, size, grid_cols, grid_rows, rng, palette_fn, is_cranium=False):
    """Draw irregular cobblestone polygonal scutes onto albedo and heightmap."""
    cw, ch = size / grid_cols, size / grid_rows
    buckets = {}

    for gy in range(grid_rows):
        for gx in range(grid_cols):
            cx = (gx + 0.18 + rng.rand() * 0.64) * cw
            cy = (gy + 0.18 + rng.rand() * 0.64) * ch
            u = cx / size
            is_ventral = (not is_cranium) and (0.36 < u < 0.64)
            scale_mult = 0.66 if is_ventral else (1.06 if (u < 0.22 or u > 0.78) else 0.92)
            rx = cw * (0.40 + rng.rand() * 0.24) * scale_mult
            ry = ch * (0.40 + rng.rand() * 0.24) * scale_mult
            sides = 5 + int(rng.rand() * 3)
            rot = rng.rand() * math.pi * 2.0
            pts = [
                (
                    cx + math.cos(rot + (k / sides) * math.pi * 2.0) * rx * (0.82 + rng.rand() * 0.30),
                    cy + math.sin(rot + (k / sides) * math.pi * 2.0) * ry * (0.82 + rng.rand() * 0.30),
                )
                for k in range(sides)
            ]
            key, fill_rgba = palette_fn(rng, u)
            buckets.setdefault(key, (fill_rgba, []))[1].append(pts)
            b_lum = int((154 if is_cranium else 142) + rng.rand() * 68)
            b_draw.polygon(pts, fill=b_lum, outline=24 if is_cranium else 38)

    outline_col = (20, 22, 18, 138) if is_cranium else (24, 26, 20, 112)

    def _paint(d):
        for fill_rgba, polys in buckets.values():
            for pts in polys:
                d.polygon(pts, fill=fill_rgba, outline=outline_col)

    return _composite_layer(color_img, _paint)


def generate_body_hide_maps():
    """Generate 1024x1024 armored carapace hide albedo, grayscale bump, and tangent normal map."""
    size = 1024
    rng = FastRNG(2041)

    stops = [
        (0.00, "#252a22"),  # Dorsal deep charcoal-moss ridge
        (0.14, "#3b4335"),  # Upper back weathered slate-olive armor
        (0.28, "#58614f"),  # Mid flanks slate-moss with warm taupe undertones
        (0.40, "#7d7766"),  # Lower flank stone-taupe transition
        (0.50, "#a69e8b"),  # Ventral warm pale stone-buff pebble hide
        (0.60, "#7d7766"),
        (0.72, "#58614f"),
        (0.86, "#3b4335"),
        (1.00, "#252a22"),
    ]
    col_arr = _make_horizontal_gradient(size, stops)
    color_img = Image.fromarray(col_arr, mode="RGB").convert("RGBA")
    bump_img = Image.new("L", (size, size), 114)
    b_draw = ImageDraw.Draw(bump_img, "L")

    # 1. Transverse inter-band armor folds & gular/pectoral skin creases
    fold_lines = []
    for y in range(0, size, 14):
        jitter = (rng.rand() - 0.5) * 5.0
        pts = _quad_bezier_pts(
            (size * 0.14, y + jitter),
            (size * 0.50, y + 10.0 + jitter),
            (size * 0.86, y - jitter),
            steps=18,
        )
        fold_lines.append(pts)
        b_draw.line(pts, fill=62, width=3)

    color_img = _composite_layer(
        color_img,
        lambda d: [d.line(pts, fill=(22, 24, 18, 68), width=2) for pts in fold_lines],
    )

    # 2. 80x80 multi-scale polygonal cobblestone scales & pebbled ventral ossicles
    def body_palette(r, u):
        s = r.rand()
        is_ventral = 0.36 < u < 0.64
        if is_ventral:
            if s > 0.64:
                return ("v_light", (184, 176, 156, 52))
            if s < 0.28:
                return ("v_dark", (94, 88, 74, 54))
            return ("v_mid", (152, 144, 126, 46))
        if s > 0.68:
            return ("d_light", (134, 130, 108, 48))
        if s < 0.30:
            return ("d_dark", (28, 32, 24, 62))
        return ("d_mid", (84, 92, 74, 46))

    color_img = _draw_polygonal_scutes(color_img, b_draw, size, 108, 108, rng, body_palette, is_cranium=False)

    # 3. 1,600 polygonal dermal osteoderm rosettes & raised mineral-taupe tubercles on dorsum/flanks
    rosettes = []
    for i in range(1600):
        side = rng.rand() * 0.36 if (i % 2 == 0) else (1.0 - rng.rand() * 0.36)
        x = side * size
        y = rng.rand() * size
        is_dorsal = side < 0.16 or side > 0.84
        r = (2.8 + rng.rand() * 1.8) if is_dorsal else (2.2 + rng.rand() * 1.5)
        sides = 6 + (1 if rng.rand() > 0.5 else 0)
        rot = rng.rand() * math.pi * 2.0
        pts = [
            (
                x + math.cos(rot + (k / sides) * math.pi * 2.0) * r * (0.78 + rng.rand() * 0.36),
                y + math.sin(rot + (k / sides) * math.pi * 2.0) * r * (0.78 + rng.rand() * 0.36),
            )
            for k in range(sides)
        ]
        b_draw.polygon(pts, fill=234 if is_dorsal else 208, outline=32)
        rosettes.append((pts, is_dorsal))

    def draw_rosettes(d):
        for pts, is_dorsal in rosettes:
            fill_col = (146, 138, 114, 74) if is_dorsal else (118, 114, 94, 60)
            d.polygon(pts, fill=fill_col, outline=(22, 24, 18, 132))

    color_img = _composite_layer(color_img, draw_rosettes)

    # 4. Subtle weathered mineral-moss highlight flecks in dorsal scute centers
    moss_flecks = []
    for i in range(1800):
        d = (rng.rand() ** 1.4) * 0.28
        u = d if (i % 2 == 0) else (1.0 - d)
        fx = u * size
        fy = rng.rand() * size
        fr = 1.0 + rng.rand() * 2.2
        moss_flecks.append((fx - fr, fy - fr, fx + fr, fy + fr, int(24 + rng.rand() * 34)))

    color_img = _composite_layer(
        color_img,
        lambda d: [d.ellipse((x0, y0, x1, y1), fill=(138, 134, 108, a)) for x0, y0, x1, y1, a in moss_flecks],
    )

    color_out = os.path.join(TEX_DIR, "ankylo_albedo.png")
    bump_out = os.path.join(TEX_DIR, "ankylo_bump.png")
    normal_out = os.path.join(TEX_DIR, "ankylo_normal.png")
    color_img.convert("RGB").save(color_out, "PNG", optimize=True)
    # Preserve grayscale heightmap for build_minions_glb.py & build_campaign_bosses_glb.py
    bump_img.convert("RGB").save(bump_out, "PNG", optimize=True)
    _height_to_normal_rgb(bump_img, strength=3.5).save(normal_out, "PNG", optimize=True)
    print(f"[TEX OK] {color_out}, {bump_out}, {normal_out}")


def generate_cranium_armor_maps():
    """Generate 1024x1024 fused cranial caputegulae & pebbled jowl albedo + tangent normal map."""
    size = 1024
    rng = FastRNG(6391)

    stops = [
        (0.00, "#2a3026"),  # Dorsal fused caputegulae crown
        (0.20, "#495241"),  # Upper supraorbital & temporal mosaic
        (0.34, "#686452"),  # Cheek armor transition
        (0.50, "#9e9582"),  # Warm pale stone-buff pebbled jowl & chin ossicles
        (0.66, "#686452"),
        (0.80, "#495241"),
        (1.00, "#2a3026"),
    ]
    col_arr = _make_horizontal_gradient(size, stops)
    color_img = Image.fromarray(col_arr, mode="RGB").convert("RGBA")
    bump_img = Image.new("L", (size, size), 112)
    b_draw = ImageDraw.Draw(bump_img, "L")

    def cranium_palette(r, u):
        s = r.rand()
        is_jowl = 0.36 < u < 0.64
        if is_jowl:
            if s > 0.64:
                return ("j_light", (184, 174, 152, 66))
            if s < 0.28:
                return ("j_dark", (82, 76, 64, 62))
            return ("j_mid", (146, 136, 118, 56))
        if s > 0.66:
            return ("c_light", (138, 134, 112, 64))
        if s < 0.30:
            return ("c_dark", (30, 34, 26, 78))
        return ("c_mid", (82, 88, 70, 56))

    color_img = _draw_polygonal_scutes(color_img, b_draw, size, 64, 64, rng, cranium_palette, is_cranium=True)

    # 2,600 neurovascular grooves and combat scratches across cranial mosaic plates
    dark_grooves, light_scratches = [], []
    for _ in range(2600):
        x = rng.rand() * size
        y = rng.rand() * size
        length = 10 + rng.rand() * 34
        ang = (rng.rand() - 0.5) * 0.75
        ex = x + math.cos(ang) * length
        ey = y + math.sin(ang) * length
        w = max(1, int(1.0 + rng.rand() * 1.5))
        if rng.rand() > 0.42:
            dark_grooves.append(((x, y), (ex, ey), w))
            b_draw.line([(x, y), (ex, ey)], fill=48, width=w)
        else:
            light_scratches.append(((x, y), (ex, ey), w))

    color_img = _composite_layer(
        color_img,
        lambda d: [d.line([p0, p1], fill=(18, 20, 15, 76), width=w) for p0, p1, w in dark_grooves],
    )
    color_img = _composite_layer(
        color_img,
        lambda d: [d.line([p0, p1], fill=(168, 160, 140, 44), width=w) for p0, p1, w in light_scratches],
    )

    color_out = os.path.join(TEX_DIR, "ankylo_cranium_albedo.png")
    normal_out = os.path.join(TEX_DIR, "ankylo_cranium_normal.png")
    color_img.convert("RGB").save(color_out, "PNG", optimize=True)
    _height_to_normal_rgb(bump_img, strength=3.6).save(normal_out, "PNG", optimize=True)
    print(f"[TEX OK] {color_out}, {normal_out}")


def generate_scute_club_maps():
    """Generate 512x512 osteoderm keel & tail-club boulder albedo + normal map."""
    size = 512
    rng = FastRNG(7741)

    stops = [
        (0.00, "#2c3227"),  # Dark weathered slate-moss collar
        (0.28, "#5a614e"),  # Olive-slate scute slope
        (0.50, "#8a7e66"),  # Raised mineral-taupe apex keel highlight
        (0.72, "#5a614e"),
        (1.00, "#2c3227"),
    ]
    col_arr = _make_horizontal_gradient(size, stops)
    color_img = Image.fromarray(col_arr, mode="RGB").convert("RGBA")
    bump_img = Image.new("L", (size, size), 118)
    b_draw = ImageDraw.Draw(bump_img, "L")

    # 1. Coarse 28x28 osteoderm bone lobules
    def scute_palette(r, _u):
        s = r.rand()
        if s > 0.62:
            return ("pale", (162, 150, 124, 68))
        if s < 0.32:
            return ("deep", (34, 38, 28, 80))
        return ("stone", (102, 106, 86, 58))

    color_img = _draw_polygonal_scutes(color_img, b_draw, size, 28, 28, rng, scute_palette, is_cranium=True)

    # 2. 3,800 fine vascular pits & ossified bone nodules
    pits, nodules = [], []
    for _ in range(3800):
        x = rng.rand() * size
        y = rng.rand() * size
        r = 1.2 + rng.rand() * 3.0
        bbox = (x - r, y - r, x + r, y + r)
        if rng.rand() < 0.38:
            b_draw.ellipse(bbox, fill=24)
            pits.append(bbox)
        else:
            b_draw.ellipse(bbox, fill=int(182 + rng.rand() * 64), outline=48)
            nodules.append(bbox)

    color_img = _composite_layer(
        color_img,
        lambda d: (
            [d.ellipse(b, fill=(22, 24, 18, 122)) for b in pits]
            + [d.ellipse(b, fill=(156, 146, 122, 54), outline=(28, 30, 22, 88)) for b in nodules]
        ),
    )

    # 3. Battle gouges & mineral wear across armored plates
    scars = []
    for _ in range(32):
        sx = rng.rand() * size
        sy = rng.rand() * size
        ang = (rng.rand() - 0.5) * 1.4
        length = 26 + rng.rand() * 68
        ex = sx + math.cos(ang) * length
        ey = sy + math.sin(ang) * length
        scars.append((sx, sy, ex, ey))
        b_draw.line([(sx, sy), (ex, ey)], fill=20, width=3)

    color_img = _composite_layer(
        color_img,
        lambda d: [d.line([(sx, sy), (ex, ey)], fill=(32, 30, 24, 132), width=2) for sx, sy, ex, ey in scars],
    )

    color_out = os.path.join(TEX_DIR, "ankylo_scute_albedo.png")
    normal_out = os.path.join(TEX_DIR, "ankylo_scute_normal.png")
    color_img.convert("RGB").save(color_out, "PNG", optimize=True)
    _height_to_normal_rgb(bump_img, strength=3.8).save(normal_out, "PNG", optimize=True)
    print(f"[TEX OK] {color_out}, {normal_out}")


def generate_horn_spike_maps():
    """Generate 512x512 striated golden-amber keratin horn, spike & hoof albedo + normal map."""
    size = 512
    rng = FastRNG(5583)

    # PIL y=0 maps to Blender UV v=1.0 (tip), y=size maps to v=0.0 (base)
    stops = [
        (0.00, "#221b15"),  # Dark weathered keratin tip (v=1.0)
        (0.14, "#4a3c2e"),  # Transitional dark horn
        (0.42, "#c8ad84"),  # Warm golden-amber / bone-ivory mid-shaft
        (0.76, "#9e825c"),  # Striated warm amber lower shaft
        (0.92, "#4f4232"),  # Basal horn collar
        (1.00, "#2d261e"),  # Dark charcoal-moss root (v=0.0)
    ]
    col_arr = _make_vertical_gradient(size, stops)
    color_img = Image.fromarray(col_arr, mode="RGB").convert("RGBA")
    bump_img = Image.new("L", (size, size), 128)
    b_draw = ImageDraw.Draw(bump_img, "L")

    # Deep longitudinal keratin sulci flutes
    flutes = []
    for x in range(0, size, 3):
        w = 1 if rng.rand() > 0.28 else 2
        is_dark = rng.rand() > 0.44
        pts = [
            (x + (rng.rand() - 0.5) * 1.8, y)
            for y in range(0, size + 32, 32)
        ]
        b_draw.line(pts, fill=66 if is_dark else 186, width=w)
        flutes.append((pts, w, is_dark))

    # Wavy transverse keratin growth rings (stronger near base y > 0.50*size)
    rings = []
    y_cur = 48.0
    while y_cur < size - 10:
        step = 9.0 + rng.rand() * 16.0
        pts = [
            (x, y_cur + math.sin(x * 0.04 + y_cur) * 2.5 + (rng.rand() - 0.5) * 2.0)
            for x in range(0, size + 32, 32)
        ]
        strength = 0.4 + 0.6 * (y_cur / size)
        b_draw.line(pts, fill=int(128 - 36 * strength), width=2)
        rings.append((pts, int(36 + 44 * strength)))
        y_cur += step

    color_img = _composite_layer(
        color_img,
        lambda d: (
            [
                d.line(
                    pts,
                    fill=(26, 20, 14, 78) if is_dark else (228, 212, 184, 42),
                    width=w,
                )
                for pts, w, is_dark in flutes
            ]
            + [d.line(pts, fill=(32, 24, 16, alpha), width=2) for pts, alpha in rings]
        ),
    )

    color_out = os.path.join(TEX_DIR, "ankylo_horn_albedo.png")
    normal_out = os.path.join(TEX_DIR, "ankylo_horn_normal.png")
    color_img.convert("RGB").save(color_out, "PNG", optimize=True)
    _height_to_normal_rgb(bump_img, strength=3.2).save(normal_out, "PNG", optimize=True)
    print(f"[TEX OK] {color_out}, {normal_out}")


def generate_beak_maps():
    """Generate 512x512 dark charcoal-slate keratinous beak albedo + normal map."""
    size = 512
    rng = FastRNG(3917)

    # PIL y=0 maps to UV v=1.0 (hooked cutting tip), y=size maps to v=0.0 (nasal collar)
    stops = [
        (0.00, "#181916"),  # Dark slate-black worn cutting tip (v=1.0)
        (0.32, "#35362f"),  # Charcoal-horn mid sheath
        (0.75, "#524f44"),  # Weathered mineral-taupe basal sheath
        (1.00, "#3b3c33"),  # Rostral collar (v=0.0)
    ]
    col_arr = _make_vertical_gradient(size, stops)
    color_img = Image.fromarray(col_arr, mode="RGB").convert("RGBA")
    bump_img = Image.new("L", (size, size), 128)
    b_draw = ImageDraw.Draw(bump_img, "L")

    flutes = []
    for x in range(0, size, 3):
        w = 1 if rng.rand() > 0.32 else 2
        is_dark = rng.rand() > 0.45
        pts = [(x + (rng.rand() - 0.5) * 1.5, y) for y in range(0, size + 32, 32)]
        b_draw.line(pts, fill=74 if is_dark else 178, width=w)
        flutes.append((pts, w, is_dark))

    wear_marks = []
    for _ in range(180):
        wx = rng.rand() * size
        wy = rng.rand() * size * 0.55
        ang = (rng.rand() - 0.5) * 0.8
        length = 12 + rng.rand() * 28
        p0 = (wx, wy)
        p1 = (wx + math.sin(ang) * length, wy + math.cos(ang) * length)
        wear_marks.append((p0, p1))
        b_draw.line([p0, p1], fill=168, width=1)

    color_img = _composite_layer(
        color_img,
        lambda d: (
            [
                d.line(
                    pts,
                    fill=(14, 15, 12, 82) if is_dark else (112, 108, 96, 44),
                    width=w,
                )
                for pts, w, is_dark in flutes
            ]
            + [d.line([p0, p1], fill=(138, 132, 114, 48), width=1) for p0, p1 in wear_marks]
        ),
    )

    color_out = os.path.join(TEX_DIR, "ankylo_beak_albedo.png")
    normal_out = os.path.join(TEX_DIR, "ankylo_beak_normal.png")
    color_img.convert("RGB").save(color_out, "PNG", optimize=True)
    _height_to_normal_rgb(bump_img, strength=3.0).save(normal_out, "PNG", optimize=True)
    print(f"[TEX OK] {color_out}, {normal_out}")


def generate_eye_iris_map():
    """Generate 256x256 fierce golden-amber reptile iris texture."""
    size = 256
    cx = cy = size * 0.5
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    r_norm = np.clip((dist - size * 0.08) / (size * 0.42), 0.0, 1.0)

    stops = [
        (0.00, "#fef08a"),
        (0.28, "#f59e0b"),
        (0.62, "#d97706"),
        (0.86, "#78350f"),
        (1.00, "#1c0a05"),
    ]
    positions = [s[0] for s in stops]
    colors = [_hex_to_rgb(s[1]) for s in stops]
    r = np.interp(r_norm, positions, [c[0] for c in colors])
    g = np.interp(r_norm, positions, [c[1] for c in colors])
    b = np.interp(r_norm, positions, [c[2] for c in colors])
    arr = np.stack([r, g, b], axis=-1).astype(np.uint8)
    img = Image.fromarray(arr, mode="RGB").convert("RGBA")

    def draw_fibers(d):
        for i in range(160):
            a = (i / 160.0) * math.pi * 2.0
            col = (254, 240, 138, 76) if (i % 2 == 0) else (69, 18, 10, 86)
            p0 = (cx + math.cos(a) * size * 0.10, cy + math.sin(a) * size * 0.10)
            p1 = (cx + math.cos(a) * size * 0.46, cy + math.sin(a) * size * 0.46)
            d.line([p0, p1], fill=col, width=2)

    img = _composite_layer(img, draw_fibers)
    out = os.path.join(TEX_DIR, "ankylo_iris_albedo.png")
    img.convert("RGB").save(out, "PNG", optimize=True)
    print(f"[TEX OK] {out}")


def main():
    generate_body_hide_maps()
    generate_cranium_armor_maps()
    generate_scute_club_maps()
    generate_horn_spike_maps()
    generate_beak_maps()
    generate_eye_iris_map()


if __name__ == "__main__":
    main()
