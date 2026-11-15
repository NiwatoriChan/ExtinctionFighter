"""
tools/blender/generate_pachyrhino_pbr_textures.py
Generates high-resolution 1024x1024 / 512x512 / 256x256 PBR textures for the
Pachyrhinosaurus canadensis GLB model in assets/textures/fighters/, matching the
reference portrait (assets/portraits/pachyrhino.png) and roster specification.
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
            is_ventral = (not is_cranium) and (0.38 < u < 0.62)
            scale_mult = 0.68 if is_ventral else (1.05 if (u < 0.22 or u > 0.78) else 0.94)
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
            b_lum = int((152 if is_cranium else 142) + rng.rand() * 68)
            b_draw.polygon(pts, fill=b_lum, outline=28 if is_cranium else 40)

    def _paint(d):
        for fill_rgba, polys in buckets.values():
            for pts in polys:
                d.polygon(pts, fill=fill_rgba, outline=(22, 16, 12, 138 if is_cranium else 108))

    return _composite_layer(color_img, _paint)


def _draw_frost_dusting(color_img, rng, size, u_band=0.14, count=3600, max_alpha=64):
    """Add irregular organic frost/snow crystal clusters along dorsal edges (u < u_band or u > 1 - u_band)."""
    frost_polys = []
    for i in range(count):
        # Bias toward 0.0 and 1.0 (dorsal crest) with quadratic falloff
        d = (rng.rand() ** 1.6) * u_band
        u = d if (i % 2 == 0) else (1.0 - d)
        cx = u * size
        cy = rng.rand() * size
        rx = 1.2 + rng.rand() * 3.0
        ry = 1.0 + rng.rand() * 2.4
        sides = 5
        rot = rng.rand() * math.pi * 2.0
        pts = [
            (
                cx + math.cos(rot + k * 2.0 * math.pi / sides) * rx * (0.6 + rng.rand() * 0.7),
                cy + math.sin(rot + k * 2.0 * math.pi / sides) * ry * (0.6 + rng.rand() * 0.7),
            )
            for k in range(sides)
        ]
        falloff = 1.0 - (d / u_band)
        alpha = int((18 + rng.rand() * max_alpha) * (0.35 + 0.65 * falloff))
        frost_polys.append((pts, alpha))

    return _composite_layer(
        color_img,
        lambda d: [d.polygon(pts, fill=(226, 234, 242, a)) for pts, a in frost_polys],
    )


def generate_body_hide_maps():
    """Generate 1024x1024 body hide albedo, grayscale heightmap bump, and tangent normal map."""
    size = 1024
    rng = FastRNG(4211)

    stops = [
        (0.00, "#211a16"),  # Dorsal dark charcoal-umber ridge
        (0.14, "#33271f"),  # Upper back weathered umber
        (0.27, "#4b392d"),  # Upper flanks slate-taupe umber
        (0.38, "#634c3c"),  # Mid flanks earthy umber-terracotta
        (0.45, "#7c634f"),  # Lower flank transition
        (0.50, "#917962"),  # Pale ochre-buff belly
        (0.55, "#7c634f"),
        (0.62, "#634c3c"),
        (0.73, "#4b392d"),
        (0.86, "#33271f"),
        (1.00, "#211a16"),
    ]
    col_arr = _make_horizontal_gradient(size, stops)
    color_img = Image.fromarray(col_arr, mode="RGB").convert("RGBA")
    bump_img = Image.new("L", (size, size), 112)
    b_draw = ImageDraw.Draw(bump_img, "L")

    # 1. Vertical neck/shoulder skin folds and ventral gular creases
    fold_lines = []
    for y in range(0, size, 12):
        jitter = (rng.rand() - 0.5) * 5.0
        pts = _quad_bezier_pts(
            (size * 0.16, y + jitter),
            (size * 0.50, y + 9.0 + jitter),
            (size * 0.84, y - jitter),
            steps=18,
        )
        fold_lines.append(pts)
        b_draw.line(pts, fill=64, width=3)

    color_img = _composite_layer(
        color_img,
        lambda d: [d.line(pts, fill=(24, 17, 13, 66), width=2) for pts in fold_lines],
    )

    # 2. 84x84 tight multi-scale polygonal cobblestone reptilian scales
    def body_palette(r, _u):
        s = r.rand()
        if s > 0.68:
            return ("light", (142, 122, 98, 44))
        if s < 0.30:
            return ("dark", (28, 20, 15, 58))
        return ("mid", (92, 68, 52, 42))

    color_img = _draw_polygonal_scutes(color_img, b_draw, size, 84, 84, rng, body_palette, is_cranium=False)

    # 3. 1,400 multi-faceted polygonal dermal osteoderm rosettes & dorsal tubercles (no round polka-dots)
    rosettes = []
    for i in range(1400):
        # Concentrate larger tubercles on upper flanks and dorsum (u < 0.36 or u > 0.64)
        side = rng.rand() * 0.36 if (i % 2 == 0) else (1.0 - rng.rand() * 0.36)
        x = side * size
        y = rng.rand() * size
        is_dorsal = side < 0.16 or side > 0.84
        r = (2.8 + rng.rand() * 1.6) if is_dorsal else (2.2 + rng.rand() * 1.5)
        sides = 6 + (1 if rng.rand() > 0.5 else 0)
        rot = rng.rand() * math.pi * 2.0
        pts = [
            (
                x + math.cos(rot + (k / sides) * math.pi * 2.0) * r * (0.78 + rng.rand() * 0.36),
                y + math.sin(rot + (k / sides) * math.pi * 2.0) * r * (0.78 + rng.rand() * 0.36),
            )
            for k in range(sides)
        ]
        b_draw.polygon(pts, fill=232 if is_dorsal else 206, outline=34)
        rosettes.append((pts, is_dorsal))

    def draw_rosettes(d):
        for pts, is_dorsal in rosettes:
            fill_col = (146, 126, 104, 72) if is_dorsal else (118, 94, 74, 58)
            d.polygon(pts, fill=fill_col, outline=(22, 16, 12, 132))

    color_img = _composite_layer(color_img, draw_rosettes)

    # 4. Subtle boreal snow/frost accumulation in dorsal crevices (u < 0.14 or u > 0.86)
    color_img = _draw_frost_dusting(color_img, rng, size, u_band=0.14, count=3800, max_alpha=58)

    color_out = os.path.join(TEX_DIR, "pachyrhino_albedo.png")
    bump_out = os.path.join(TEX_DIR, "pachyrhino_bump.png")
    normal_out = os.path.join(TEX_DIR, "pachyrhino_normal.png")
    color_img.convert("RGB").save(color_out, "PNG", optimize=True)
    # Keep pachyrhino_bump.png as high-contrast grayscale heightmap for build_minions_glb.py ShaderNodeBump
    bump_img.convert("RGB").save(bump_out, "PNG", optimize=True)
    _height_to_normal_rgb(bump_img, strength=3.4).save(normal_out, "PNG", optimize=True)
    print(f"[TEX OK] {color_out}, {bump_out}, {normal_out}")


def generate_cranium_armor_maps():
    """Generate 1024x1024 cranial & frill polygonal armor albedo + tangent normal map."""
    size = 1024
    rng = FastRNG(7331)

    stops = [
        (0.00, "#241b16"),  # Dorsal crest dark charcoal-umber
        (0.24, "#4b362a"),  # Upper cheek & frill margin
        (0.50, "#83583c"),  # Mid-frill warm terracotta-sienna dermal pigment
        (0.76, "#4b362a"),
        (1.00, "#241b16"),
    ]
    col_arr = _make_horizontal_gradient(size, stops)
    color_img = Image.fromarray(col_arr, mode="RGB").convert("RGBA")
    bump_img = Image.new("L", (size, size), 110)
    b_draw = ImageDraw.Draw(bump_img, "L")

    # 1. Tight 52x52 armored skull & frill polygonal scutes (prevents stretched cheek scales)
    def cranium_palette(r, u):
        s = r.rand()
        in_ocellus = 0.34 < u < 0.66
        if s > 0.66:
            return ("tan_oc" if in_ocellus else "tan", (166, 124, 90, 62) if in_ocellus else (146, 122, 98, 58))
        if s < 0.30:
            return ("umber", (30, 21, 16, 72))
        return ("terra_oc" if in_ocellus else "terra", (152, 86, 52, 66) if in_ocellus else (118, 74, 50, 52))

    color_img = _draw_polygonal_scutes(color_img, b_draw, size, 52, 52, rng, cranium_palette, is_cranium=True)

    # 2. 2,800 neurovascular facial grooves and battle scratches
    dark_grooves, light_scratches = [], []
    for _ in range(2800):
        x = rng.rand() * size
        y = rng.rand() * size
        length = 10 + rng.rand() * 36
        ang = (rng.rand() - 0.5) * 0.7
        ex = x + math.cos(ang) * length
        ey = y + math.sin(ang) * length
        w = max(1, int(1.0 + rng.rand() * 1.6))
        if rng.rand() > 0.42:
            dark_grooves.append(((x, y), (ex, ey), w))
            b_draw.line([(x, y), (ex, ey)], fill=52, width=w)
        else:
            light_scratches.append(((x, y), (ex, ey), w))

    color_img = _composite_layer(
        color_img,
        lambda d: [d.line([p0, p1], fill=(20, 14, 10, 74), width=w) for p0, p1, w in dark_grooves],
    )
    color_img = _composite_layer(
        color_img,
        lambda d: [d.line([p0, p1], fill=(176, 158, 136, 44), width=w) for p0, p1, w in light_scratches],
    )

    # 3. Frost dusting along dorsal frill/cranial crest edges
    color_img = _draw_frost_dusting(color_img, rng, size, u_band=0.16, count=2800, max_alpha=64)

    color_out = os.path.join(TEX_DIR, "pachyrhino_cranium_albedo.png")
    normal_out = os.path.join(TEX_DIR, "pachyrhino_cranium_normal.png")
    color_img.convert("RGB").save(color_out, "PNG", optimize=True)
    _height_to_normal_rgb(bump_img, strength=3.6).save(normal_out, "PNG", optimize=True)
    print(f"[TEX OK] {color_out}, {normal_out}")


def generate_boss_maps():
    """Generate 512x512 pitted cauliflower pachyostotic boss albedo + normal map."""
    size = 512
    rng = FastRNG(9103)

    stops = [
        (0.00, "#3d2f25"),
        (0.28, "#6e5847"),
        (0.50, "#947d66"),
        (0.72, "#6e5847"),
        (1.00, "#3d2f25"),
    ]
    col_arr = _make_horizontal_gradient(size, stops)
    color_img = Image.fromarray(col_arr, mode="RGB").convert("RGBA")
    bump_img = Image.new("L", (size, size), 118)
    b_draw = ImageDraw.Draw(bump_img, "L")

    # 1. Coarse 24x24 cauliflower pachyostotic lobules
    def boss_palette(r, _u):
        s = r.rand()
        if s > 0.62:
            return ("pale", (174, 156, 134, 72))
        if s < 0.32:
            return ("deep", (42, 30, 22, 84))
        return ("stone", (118, 96, 76, 62))

    color_img = _draw_polygonal_scutes(color_img, b_draw, size, 24, 24, rng, boss_palette, is_cranium=True)

    # 2. 4,200 fine keratinous tubercles and deep vascular pits
    pits = []
    nodules = []
    for _ in range(4200):
        x = rng.rand() * size
        y = rng.rand() * size
        r = 1.4 + rng.rand() * 3.4
        bbox = (x - r, y - r, x + r, y + r)
        if rng.rand() < 0.36:
            b_draw.ellipse(bbox, fill=24)
            pits.append(bbox)
        else:
            b_draw.ellipse(bbox, fill=int(180 + rng.rand() * 68), outline=50)
            nodules.append(bbox)

    color_img = _composite_layer(
        color_img,
        lambda d: (
            [d.ellipse(b, fill=(24, 16, 12, 128)) for b in pits]
            + [d.ellipse(b, fill=(168, 150, 128, 56), outline=(28, 20, 15, 92)) for b in nodules]
        ),
    )

    # 3. Combat gouges & dorsal snow-frost dusting
    scars = []
    for _ in range(28):
        sx = rng.rand() * size
        sy = rng.rand() * size
        ang = (rng.rand() - 0.5) * 1.4
        length = 28 + rng.rand() * 65
        ex = sx + math.cos(ang) * length
        ey = sy + math.sin(ang) * length
        scars.append((sx, sy, ex, ey))
        b_draw.line([(sx, sy), (ex, ey)], fill=20, width=3)

    color_img = _composite_layer(
        color_img,
        lambda d: [d.line([(sx, sy), (ex, ey)], fill=(38, 26, 20, 130), width=2) for sx, sy, ex, ey in scars],
    )

    color_img = _draw_frost_dusting(color_img, rng, size, u_band=0.20, count=1400, max_alpha=62)

    color_out = os.path.join(TEX_DIR, "pachyrhino_boss_albedo.png")
    normal_out = os.path.join(TEX_DIR, "pachyrhino_boss_normal.png")
    color_img.convert("RGB").save(color_out, "PNG", optimize=True)
    _height_to_normal_rgb(bump_img, strength=3.8).save(normal_out, "PNG", optimize=True)
    print(f"[TEX OK] {color_out}, {normal_out}")


def generate_horn_beak_maps():
    """Generate 512x512 striated keratin horn, beak, and claw albedo + normal map."""
    size = 512
    rng = FastRNG(5521)

    # Note: PIL y=0 maps to Blender UV v=1.0 (tip), y=size maps to v=0.0 (base)
    stops = [
        (0.00, "#1e1712"),  # Dark keratin apex tip (v=1.0)
        (0.16, "#46372b"),  # Transitional dark horn
        (0.42, "#a89882"),  # Weathered bone-taupe mid-shaft
        (0.76, "#7d6b56"),  # Warm striated horn lower shaft
        (0.93, "#453528"),  # Root collar
        (1.00, "#241b15"),  # Dark charcoal-umber base (v=0.0)
    ]
    col_arr = _make_vertical_gradient(size, stops)
    color_img = Image.fromarray(col_arr, mode="RGB").convert("RGBA")
    bump_img = Image.new("L", (size, size), 128)
    b_draw = ImageDraw.Draw(bump_img, "L")

    # Deep longitudinal keratin sulci flutes with organic jitter
    flutes = []
    for x in range(0, size, 3):
        w = 1 if rng.rand() > 0.28 else 2
        is_dark = rng.rand() > 0.44
        pts = [
            (x + (rng.rand() - 0.5) * 1.8, y)
            for y in range(0, size + 32, 32)
        ]
        b_draw.line(pts, fill=68 if is_dark else 184, width=w)
        flutes.append((pts, w, is_dark))

    # Irregular wavy transverse keratin growth bands (stronger near base y > 0.55*size)
    rings = []
    y_cur = 52.0
    while y_cur < size - 10:
        step = 9.0 + rng.rand() * 16.0
        pts = [
            (x, y_cur + math.sin(x * 0.04 + y_cur) * 2.5 + (rng.rand() - 0.5) * 2.0)
            for x in range(0, size + 32, 32)
        ]
        strength = 0.4 + 0.6 * (y_cur / size)
        b_draw.line(pts, fill=int(128 - 36 * strength), width=2)
        rings.append((pts, int(34 + 42 * strength)))
        y_cur += step

    # Subtle frost dusting in basal keratin grooves (y > 0.62*size)
    basal_frost = []
    for _ in range(420):
        fx = rng.rand() * size
        fy = size * (0.62 + rng.rand() * 0.36)
        frx = 1.2 + rng.rand() * 2.4
        fry = 1.0 + rng.rand() * 2.0
        basal_frost.append(([
            (fx - frx, fy),
            (fx, fy - fry),
            (fx + frx, fy + 0.3 * fry),
            (fx - 0.4 * frx, fy + fry),
        ], int(22 + rng.rand() * 34)))

    color_img = _composite_layer(
        color_img,
        lambda d: (
            [
                d.line(
                    pts,
                    fill=(22, 16, 12, 78) if is_dark else (218, 206, 186, 40),
                    width=w,
                )
                for pts, w, is_dark in flutes
            ]
            + [d.line(pts, fill=(30, 22, 16, alpha), width=2) for pts, alpha in rings]
            + [d.polygon(pts, fill=(224, 232, 240, a)) for pts, a in basal_frost]
        ),
    )

    color_out = os.path.join(TEX_DIR, "pachyrhino_horn_albedo.png")
    normal_out = os.path.join(TEX_DIR, "pachyrhino_horn_normal.png")
    color_img.convert("RGB").save(color_out, "PNG", optimize=True)
    _height_to_normal_rgb(bump_img, strength=3.1).save(normal_out, "PNG", optimize=True)
    print(f"[TEX OK] {color_out}, {normal_out}")


def generate_ocellus_maps():
    """Generate 512x512 radial terracotta-ochre armored parietal ocellus albedo + normal map."""
    size = 512
    rng = FastRNG(8821)
    cx = cy = size * 0.5
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    r_norm = np.clip(dist / (size * 0.48), 0.0, 1.0)

    stops = [
        (0.00, "#b85a2a"),  # Warm burnt terracotta center
        (0.42, "#9c4720"),  # Deep terracotta-ochre mid-plate
        (0.74, "#68331c"),  # Dark umber-sienna transitional ring
        (1.00, "#2d2018"),  # Charcoal-umber frill basin edge
    ]
    positions = [s[0] for s in stops]
    colors = [_hex_to_rgb(s[1]) for s in stops]
    r = np.interp(r_norm, positions, [c[0] for c in colors])
    g = np.interp(r_norm, positions, [c[1] for c in colors])
    b = np.interp(r_norm, positions, [c[2] for c in colors])
    arr = np.stack([r, g, b], axis=-1).astype(np.uint8)
    color_img = Image.fromarray(arr, mode="RGB").convert("RGBA")
    bump_img = Image.new("L", (size, size), 116)
    b_draw = ImageDraw.Draw(bump_img, "L")

    def ocellus_palette(rng_inst, u):
        s = rng_inst.rand()
        if s > 0.66:
            return ("ochre", (212, 132, 74, 58))
        if s < 0.30:
            return ("umber", (36, 20, 12, 76))
        return ("sienna", (164, 78, 38, 56))

    color_img = _draw_polygonal_scutes(color_img, b_draw, size, 28, 28, rng, ocellus_palette, is_cranium=True)

    cracks = []
    for _ in range(900):
        x = rng.rand() * size
        y = rng.rand() * size
        length = 8 + rng.rand() * 24
        ang = rng.rand() * math.pi * 2.0
        p0 = (x, y)
        p1 = (x + math.cos(ang) * length, y + math.sin(ang) * length)
        cracks.append((p0, p1))
        b_draw.line([p0, p1], fill=46, width=2)

    color_img = _composite_layer(
        color_img,
        lambda d: [d.line([p0, p1], fill=(24, 14, 10, 82), width=1) for p0, p1 in cracks],
    )

    color_out = os.path.join(TEX_DIR, "pachyrhino_ocellus_albedo.png")
    normal_out = os.path.join(TEX_DIR, "pachyrhino_ocellus_normal.png")
    color_img.convert("RGB").save(color_out, "PNG", optimize=True)
    _height_to_normal_rgb(bump_img, strength=3.4).save(normal_out, "PNG", optimize=True)
    print(f"[TEX OK] {color_out}, {normal_out}")


def generate_eye_iris_map():
    """Generate 256x256 fierce amber-orange radial iris texture."""
    size = 256
    cx = cy = size * 0.5
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    r_norm = np.clip((dist - size * 0.08) / (size * 0.42), 0.0, 1.0)

    stops = [
        (0.00, "#fef08a"),
        (0.30, "#f59e0b"),
        (0.65, "#ea580c"),
        (0.88, "#7c2d12"),
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
            col = (254, 240, 138, 76) if (i % 2 == 0) else (69, 10, 10, 86)
            p0 = (cx + math.cos(a) * size * 0.10, cy + math.sin(a) * size * 0.10)
            p1 = (cx + math.cos(a) * size * 0.46, cy + math.sin(a) * size * 0.46)
            d.line([p0, p1], fill=col, width=2)

    img = _composite_layer(img, draw_fibers)
    out = os.path.join(TEX_DIR, "pachyrhino_iris_albedo.png")
    img.convert("RGB").save(out, "PNG", optimize=True)
    print(f"[TEX OK] {out}")


def main():
    generate_body_hide_maps()
    generate_cranium_armor_maps()
    generate_boss_maps()
    generate_ocellus_maps()
    generate_horn_beak_maps()
    generate_eye_iris_map()


if __name__ == "__main__":
    main()
