"""
tools/blender/generate_quetzal_pbr_textures.py
Generates high-resolution 1024x1024 / 512x512 / 256x256 PBR textures for the
Quetzalcoatlus northropi GLB model in assets/textures/fighters/, matching the
reference portrait (assets/portraits/quetzal.png) and roster specification.
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
            scale_mult = 0.68 if is_ventral else (1.04 if (u < 0.22 or u > 0.78) else 0.92)
            rx = cw * (0.38 + rng.rand() * 0.22) * scale_mult
            ry = ch * (0.38 + rng.rand() * 0.22) * scale_mult
            sides = 5 + int(rng.rand() * 3)
            rot = rng.rand() * math.pi * 2.0
            pts = [
                (
                    cx + math.cos(rot + (k / sides) * math.pi * 2.0) * rx * (0.82 + rng.rand() * 0.28),
                    cy + math.sin(rot + (k / sides) * math.pi * 2.0) * ry * (0.82 + rng.rand() * 0.28),
                )
                for k in range(sides)
            ]
            key, fill_rgba = palette_fn(rng, u)
            buckets.setdefault(key, (fill_rgba, []))[1].append(pts)
            b_lum = int((148 if is_cranium else 138) + rng.rand() * 64)
            b_draw.polygon(pts, fill=b_lum, outline=30 if is_cranium else 44)

    def _paint(d):
        outline_col = (42, 32, 24, 108 if is_cranium else 34)
        for fill_rgba, polys in buckets.values():
            for pts in polys:
                d.polygon(pts, fill=fill_rgba, outline=outline_col)

    return _composite_layer(color_img, _paint)


def generate_body_hide_maps():
    """Generate 1024x1024 earthy russet-umber & cream pycnofiber albedo, bump, and normal maps."""
    size = 1024
    rng = FastRNG(3107)

    stops = [
        (0.00, "#3d281a"),  # Dorsal ridge deep russet-umber pycnofiber coat
        (0.16, "#5e412c"),  # Upper flanks warm sepia-brown
        (0.32, "#7a593e"),  # Mid flanks earthy tan-brown
        (0.42, "#b5a68e"),  # Lower flank transition into warm buff
        (0.50, "#dfd8c8"),  # Pale cream / off-white ventral neck & chest
        (0.58, "#b5a68e"),
        (0.68, "#7a593e"),
        (0.84, "#5e412c"),
        (1.00, "#3d281a"),
    ]
    col_arr = _make_horizontal_gradient(size, stops)
    color_img = Image.fromarray(col_arr, mode="RGB").convert("RGBA")
    bump_img = Image.new("L", (size, size), 120)
    b_draw = ImageDraw.Draw(bump_img, "L")

    # 1. Fine underlying dermal scales (72x72)
    def body_palette(r, u):
        s = r.rand()
        is_ventral = 0.38 < u < 0.62
        if is_ventral:
            if s > 0.62:
                return ("v_light", (236, 230, 214, 38))
            return ("v_mid", (196, 184, 162, 32))
        if s > 0.68:
            return ("light", (142, 108, 76, 36))
        if s < 0.30:
            return ("dark", (42, 26, 16, 48))
        return ("mid", (96, 68, 44, 34))

    color_img = _draw_polygonal_scutes(color_img, b_draw, size, 72, 72, rng, body_palette, is_cranium=False)

    # 2. Subtle transverse ventral throat folds & cervical skin creases
    throat_folds = []
    tendon_creases = []
    for y in range(0, size, 13):
        jitter = (rng.rand() - 0.5) * 4.0
        pts = _quad_bezier_pts(
            (size * 0.26, y + jitter),
            (size * 0.50, y + 8.0 + jitter),
            (size * 0.74, y - jitter),
            steps=16,
        )
        throat_folds.append(pts)
        b_draw.line(pts, fill=76, width=2)

    for idx in range(0, size, 22):
        for side in (0, 1):
            x0 = size * (0.14 if side == 0 else 0.86)
            x1 = size * (0.34 if side == 0 else 0.66)
            xm = (x0 + x1) * 0.5
            pts = _quad_bezier_pts(
                (x0, idx),
                (xm, idx + 12.0),
                (x1, idx + 24.0),
                steps=10,
            )
            tendon_creases.append(pts)
            b_draw.line(pts, fill=82, width=2)

    color_img = _composite_layer(
        color_img,
        lambda d: (
            [d.line(pts, fill=(92, 78, 64, 42), width=2) for pts in throat_folds]
            + [d.line(pts, fill=(46, 30, 20, 44), width=2) for pts in tendon_creases]
        ),
    )

    # 3. 40,000 dense shaggy directional pycnofiber filaments
    dark_fibers = []
    warm_fibers = []
    cream_fibers = []
    for i in range(40000):
        x = rng.rand() * size
        y = rng.rand() * size
        u = x / size
        length = 7.0 + rng.rand() * 16.0
        ang = math.pi * 0.5 + (rng.rand() - 0.5) * 0.38
        ex = x + math.cos(ang) * length
        ey = y + math.sin(ang) * length
        is_ventral = 0.36 < u < 0.64
        b_lum = int(128 + rng.rand() * 58) if (i % 2 == 0) else int(82 + rng.rand() * 34)
        b_draw.line([(x, y), (ex, ey)], fill=b_lum, width=1)
        if is_ventral:
            cream_fibers.append([(x, y), (ex, ey)])
        elif i % 3 == 0:
            warm_fibers.append([(x, y), (ex, ey)])
        else:
            dark_fibers.append([(x, y), (ex, ey)])

    def draw_fibers(d):
        for seg in dark_fibers:
            d.line(seg, fill=(44, 28, 18, 48), width=1)
        for seg in warm_fibers:
            d.line(seg, fill=(148, 114, 78, 38), width=1)
        for seg in cream_fibers:
            d.line(seg, fill=(238, 232, 216, 40), width=1)

    color_img = _composite_layer(color_img, draw_fibers)

    color_out = os.path.join(TEX_DIR, "quetzal_albedo.png")
    bump_out = os.path.join(TEX_DIR, "quetzal_bump.png")
    normal_out = os.path.join(TEX_DIR, "quetzal_normal.png")
    color_img.convert("RGB").save(color_out, "PNG", optimize=True)
    # Keep quetzal_bump.png as grayscale heightmap for build_minions_glb.py ShaderNodeBump
    bump_img.convert("RGB").save(bump_out, "PNG", optimize=True)
    _height_to_normal_rgb(bump_img, strength=3.0).save(normal_out, "PNG", optimize=True)
    print(f"[TEX OK] {color_out}, {bump_out}, {normal_out}")


def generate_cranium_armor_maps():
    """Generate 1024x1024 earthy umber-slate cranial skin with warm ochre orbital accents."""
    size = 1024
    rng = FastRNG(6217)

    stops = [
        (0.00, "#3b3028"),  # Dorsal brow umber-slate
        (0.24, "#544537"),  # Upper cheek & temporal plates
        (0.50, "#9c8b6e"),  # Warm buff cheek & throat base
        (0.76, "#544537"),
        (1.00, "#3b3028"),
    ]
    col_arr = _make_horizontal_gradient(size, stops)
    color_img = Image.fromarray(col_arr, mode="RGB").convert("RGBA")
    bump_img = Image.new("L", (size, size), 116)
    b_draw = ImageDraw.Draw(bump_img, "L")

    # 1. Tight 54x54 leathery polygonal facial scutes
    def cranium_palette(r, u):
        s = r.rand()
        if s > 0.72:
            return ("ochre_hint", (184, 154, 92, 42))
        if s < 0.30:
            return ("umber_dark", (38, 30, 24, 62))
        return ("umber_mid", (78, 64, 52, 48))

    color_img = _draw_polygonal_scutes(color_img, b_draw, size, 54, 54, rng, cranium_palette, is_cranium=True)

    # 2. Warm golden-ochre preorbital / nasoantorbital skin highlight zone (anterior top y < 0.35)
    ochre_flecks = []
    dark_grooves = []
    for _ in range(2200):
        x = rng.rand() * size
        y = rng.rand() * size
        length = 10 + rng.rand() * 30
        ang = (rng.rand() - 0.5) * 0.65
        ex = x + math.cos(ang) * length
        ey = y + math.sin(ang) * length
        w = max(1, int(1.0 + rng.rand() * 1.4))
        if y > size * 0.62 and rng.rand() > 0.35:
            ochre_flecks.append(((x, y), (ex, ey), w + 1))
        else:
            dark_grooves.append(((x, y), (ex, ey), w))
            b_draw.line([(x, y), (ex, ey)], fill=54, width=w)

    color_img = _composite_layer(
        color_img,
        lambda d: (
            [d.line([p0, p1], fill=(24, 18, 14, 64), width=w) for p0, p1, w in dark_grooves]
            + [d.line([p0, p1], fill=(212, 180, 72, 56), width=w) for p0, p1, w in ochre_flecks]
        ),
    )

    color_out = os.path.join(TEX_DIR, "quetzal_cranium_albedo.png")
    normal_out = os.path.join(TEX_DIR, "quetzal_cranium_normal.png")
    color_img.convert("RGB").save(color_out, "PNG", optimize=True)
    _height_to_normal_rgb(bump_img, strength=3.0).save(normal_out, "PNG", optimize=True)
    print(f"[TEX OK] {color_out}, {normal_out}")


def generate_beak_keratin_maps():
    """Generate 1024x1024 pale horn-ivory beak with golden nasoantorbital boss and dark umber tip."""
    size = 1024
    rng = FastRNG(8841)

    # PIL y=0 maps to Blender UV v=1.0 (spear tip), y=size maps to v=0.0 (cranial root)
    stops = [
        (0.00, "#2a221c"),  # Dark umber-slate spear apex (v=1.0)
        (0.12, "#4a3e30"),  # Darkened keratin tip transition
        (0.28, "#baa36e"),  # Distal ochre spear blade
        (0.56, "#d6c596"),  # Pale horn-ivory / warm bone mid-beak
        (0.76, "#dfc148"),  # Golden-yellow nasoantorbital fenestra boss (v=0.14..0.28)
        (0.90, "#b89b44"),  # Preorbital keratin collar
        (1.00, "#4a3d30"),  # Earthy umber cranial root (v=0.0)
    ]
    col_arr = _make_vertical_gradient(size, stops)
    color_img = Image.fromarray(col_arr, mode="RGB").convert("RGBA")
    bump_img = Image.new("L", (size, size), 128)
    b_draw = ImageDraw.Draw(bump_img, "L")

    # 1. Longitudinal keratin fiber sulci along the spear beak
    flutes = []
    for x in range(0, size, 3):
        w = 1 if rng.rand() > 0.25 else 2
        is_dark = rng.rand() > 0.48
        pts = [
            (x + (rng.rand() - 0.5) * 2.8, y)
            for y in range(0, size + 64, 64)
        ]
        b_draw.line(pts, fill=92 if is_dark else 164, width=w)
        flutes.append((pts, w, is_dark))

    # 2. Subtle organic keratin flecking & worn tomial grain
    mottles = []
    for _ in range(380):
        mx = rng.rand() * size
        my = size * (0.08 + rng.rand() * 0.82)
        mw = 6.0 + rng.rand() * 24.0
        mh = 2.0 + rng.rand() * 5.0
        dark = rng.rand() > 0.5
        mottles.append(((mx - mw, my - mh, mx + mw, my + mh), dark, int(14 + rng.rand() * 22)))
        b_draw.ellipse([mx - mw * 0.6, my - mh * 0.5, mx + mw * 0.6, my + mh * 0.5], fill=116 if dark else 140)

    # 3. Delicate diagonal wear scratches along horn blade
    scars = []
    for _ in range(32):
        sx = rng.rand() * size
        sy = size * (0.14 + rng.rand() * 0.58)
        ang = (0.35 + rng.rand() * 0.80) * (1.0 if rng.rand() > 0.5 else -1.0)
        length = 28 + rng.rand() * 80
        ex = sx + math.cos(ang) * length
        ey = sy + math.sin(ang) * length
        w = 2 if rng.rand() > 0.5 else 1
        scars.append(((sx, sy), (ex, ey), w))
        b_draw.line([(sx, sy), (ex, ey)], fill=52, width=w + 1)

    color_img = _composite_layer(
        color_img,
        lambda d: (
            [
                d.line(
                    pts,
                    fill=(42, 34, 24, 34) if is_dark else (246, 236, 206, 26),
                    width=w,
                )
                for pts, w, is_dark in flutes
            ]
            + [
                d.ellipse(
                    box,
                    fill=(58, 46, 30, a) if dark else (238, 224, 182, a),
                )
                for box, dark, a in mottles
            ]
            + [d.line([p0, p1], fill=(238, 226, 192, 52), width=w + 1) for p0, p1, w in scars]
            + [d.line([p0, p1], fill=(48, 38, 28, 108), width=w) for p0, p1, w in scars]
        ),
    )

    color_out = os.path.join(TEX_DIR, "quetzal_beak_albedo.png")
    normal_out = os.path.join(TEX_DIR, "quetzal_beak_normal.png")
    color_img.convert("RGB").save(color_out, "PNG", optimize=True)
    _height_to_normal_rgb(bump_img, strength=2.4).save(normal_out, "PNG", optimize=True)
    print(f"[TEX OK] {color_out}, {normal_out}")


def generate_crest_maps():
    """Generate 512x512 vivid cerulean / kingfisher-teal sagittal crest albedo + normal map."""
    size = 512
    rng = FastRNG(4919)

    stops = [
        (0.00, "#073d50"),  # Crest apex deep cerulean-teal (v=1.0)
        (0.38, "#11647a"),  # Mid-crest kingfisher teal-blue
        (0.70, "#2188a0"),  # Lower crest cerulean sheen
        (0.85, "#326976"),  # Transition band
        (1.00, "#3d3126"),  # Warm umber basal cranial transition (v=0.0)
    ]
    col_arr = _make_vertical_gradient(size, stops)
    color_img = Image.fromarray(col_arr, mode="RGB").convert("RGBA")
    bump_img = Image.new("L", (size, size), 124)
    b_draw = ImageDraw.Draw(bump_img, "L")

    # 1. Dark vertical fluted horn ridges & striations fanning upward along crest blade
    ridge_lines = []
    for i in range(84):
        x0 = (i / 84.0) * size
        xm = x0 + (rng.rand() - 0.5) * 10.0
        x1 = x0 + (rng.rand() - 0.5) * 14.0
        pts = _quad_bezier_pts((x0, float(size)), (xm, size * 0.48), (x1, 0.0), steps=14)
        is_major = (i % 3 == 0)
        b_draw.line(pts, fill=70 if is_major else 166, width=2 if is_major else 1)
        ridge_lines.append((pts, is_major))

    # 2. Subtle organic cerulean & deep indigo stippling
    specks = []
    for _ in range(340):
        sx = rng.rand() * size
        sy = rng.rand() * size * 0.85
        sr = 1.2 + rng.rand() * 3.0
        dark = rng.rand() > 0.5
        specks.append(((sx - sr, sy - sr, sx + sr, sy + sr), dark))

    def draw_crest_patterns(d):
        for pts, is_major in ridge_lines:
            col = (6, 28, 38, 68) if is_major else (92, 210, 232, 28)
            d.line(pts, fill=col, width=2 if is_major else 1, joint="curve")
        for box, dark in specks:
            col = (5, 42, 56, 52) if dark else (68, 198, 224, 38)
            d.ellipse(box, fill=col)

    color_img = _composite_layer(color_img, draw_crest_patterns)

    color_out = os.path.join(TEX_DIR, "quetzal_crest_albedo.png")
    normal_out = os.path.join(TEX_DIR, "quetzal_crest_normal.png")
    color_img.convert("RGB").save(color_out, "PNG", optimize=True)
    _height_to_normal_rgb(bump_img, strength=3.2).save(normal_out, "PNG", optimize=True)
    print(f"[TEX OK] {color_out}, {normal_out}")


def generate_wing_patagium_maps():
    """Generate 1024x1024 sandy-parchment & russet-tipped patagium with barred leading spar edge."""
    size = 1024
    rng = FastRNG(2749)

    # PIL y=0 -> UV v=1.0 (leading edge), y=size -> UV v=0.0 (trailing edge)
    stops = [
        (0.00, "#83694c"),  # Warm weathered buff-brown leading spar base
        (0.11, "#9a8161"),  # Edge of textured limb spar zone (v=0.88..1.00)
        (0.16, "#5c2c18"),  # Rich russet-mahogany anterior muscle/patagium shading
        (0.42, "#9c8252"),  # Warm ochre-brown transition
        (0.66, "#bca470"),  # Buff-ochre mid patagium
        (0.88, "#d2be8c"),  # Warm sandy-parchment translucent membrane
        (1.00, "#9c8252"),  # Reinforced warm umber trailing margin
    ]
    col_arr = _make_vertical_gradient(size, stops)
    color_img = Image.fromarray(col_arr, mode="RGB").convert("RGBA")
    bump_img = Image.new("L", (size, size), 124)
    b_draw = ImageDraw.Draw(bump_img, "L")

    # 1. Russet-mahogany wash blending distally onto upper wingtip (high u = x/size > 0.58)
    arr = np.array(color_img, dtype=np.float32)
    xx = np.linspace(0.0, 1.0, size, dtype=np.float32)[None, :]
    yy = np.linspace(0.0, 1.0, size, dtype=np.float32)[:, None]
    tip_mask = np.clip((xx - 0.52) / 0.48, 0.0, 1.0) * np.clip((0.72 - yy) / 0.60, 0.0, 1.0)
    tip_mask *= np.clip((yy - 0.11) / 0.05, 0.0, 1.0)
    russet = np.array([92.0, 44.0, 24.0, 255.0], dtype=np.float32)
    w = (tip_mask ** 1.2) * 0.78
    arr = arr * (1.0 - w[:, :, None]) + russet[None, None, :] * w[:, :, None]
    color_img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode="RGBA")

    # 2. Dense parallel structural actinofibrils spanning the wing chord
    fibrils = []
    for x in range(0, size, 4):
        wave = math.sin(x * 0.035) * 14.0
        pts = _quad_bezier_pts((float(x), size * 0.12), (x + wave, size * 0.56), (x - wave * 0.5, float(size)), steps=14)
        is_ridge = (x % 8 == 0)
        b_draw.line(pts, fill=162 if is_ridge else 92, width=2 if is_ridge else 1)
        fibrils.append((pts, is_ridge))

    # 3. Soft weathered dappled scute mottling along leading spar zone (v=0.88..1.00 -> y=0..0.12*size)
    leading_bars = []
    bar_h = int(size * 0.122)
    leading_specks = []
    for _ in range(360):
        sx = rng.rand() * size
        sy = rng.rand() * (bar_h * 0.96)
        rx = 6.0 + rng.rand() * 14.0
        ry = 3.0 + rng.rand() * 6.0
        leading_specks.append(((sx - rx, sy - ry, sx + rx, sy + ry), rng.rand() > 0.42))
        b_draw.ellipse((sx - rx, sy - ry, sx + rx, sy + ry), fill=136)

    # 4. Branching arterial/venous vessel network across the parchment membrane
    vessels = []

    def trace_vessel(x, y, ang, width, depth):
        if depth <= 0 or width < 0.6 or y > size or x < 0 or x > size:
            return
        length = 54.0 + rng.rand() * 82.0
        nx = x + math.cos(ang) * length
        ny = y + math.sin(ang) * length
        w_int = max(1, int(round(width)))
        vessels.append(([(x, y), (nx, ny)], w_int, int(36 + width * 20)))
        b_draw.line([(x, y), (nx, ny)], fill=174, width=w_int)
        trace_vessel(nx, ny, ang + (rng.rand() - 0.5) * 0.42, width * 0.78, depth - 1)
        if rng.rand() > 0.34:
            trace_vessel(nx, ny, ang + (0.46 if rng.rand() > 0.5 else -0.46), width * 0.64, depth - 1)

    for _ in range(26):
        trace_vessel(rng.rand() * size, size * 0.14, math.pi * 0.5 + (rng.rand() - 0.5) * 0.4, 3.0, 6)

    color_img = _composite_layer(
        color_img,
        lambda d: (
            [
                d.line(
                    pts,
                    fill=(64, 42, 24, 42) if not is_ridge else (232, 218, 176, 30),
                    width=1,
                )
                for pts, is_ridge in fibrils
            ]
            + [d.line(seg, fill=(78, 36, 22, alpha), width=w) for seg, w, alpha in vessels]
            + [d.ellipse(box, fill=(84, 56, 36, 52) if dark else (188, 166, 130, 48)) for box, dark in leading_specks]
        ),
    )

    color_out = os.path.join(TEX_DIR, "quetzal_wing_albedo.png")
    normal_out = os.path.join(TEX_DIR, "quetzal_wing_normal.png")
    color_img.convert("RGB").save(color_out, "PNG", optimize=True)
    _height_to_normal_rgb(bump_img, strength=2.8).save(normal_out, "PNG", optimize=True)
    print(f"[TEX OK] {color_out}, {normal_out}")


def generate_eye_iris_map():
    """Generate 256x256 fierce amber-gold radial predator iris texture."""
    size = 256
    cx = cy = size * 0.5
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    r_norm = np.clip((dist - size * 0.08) / (size * 0.42), 0.0, 1.0)

    stops = [
        (0.00, "#fef9c3"),
        (0.22, "#facc15"),
        (0.50, "#f59e0b"),
        (0.76, "#dc2626"),
        (0.90, "#5c1406"),
        (1.00, "#120604"),
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
            col = (254, 240, 138, 82) if (i % 2 == 0) else (69, 10, 10, 92)
            p0 = (cx + math.cos(a) * size * 0.10, cy + math.sin(a) * size * 0.10)
            p1 = (cx + math.cos(a) * size * 0.46, cy + math.sin(a) * size * 0.46)
            d.line([p0, p1], fill=col, width=2)

    img = _composite_layer(img, draw_fibers)
    out = os.path.join(TEX_DIR, "quetzal_iris_albedo.png")
    img.convert("RGB").save(out, "PNG", optimize=True)
    print(f"[TEX OK] {out}")


def main():
    generate_body_hide_maps()
    generate_cranium_armor_maps()
    generate_beak_keratin_maps()
    generate_crest_maps()
    generate_wing_patagium_maps()
    generate_eye_iris_map()


if __name__ == "__main__":
    main()
