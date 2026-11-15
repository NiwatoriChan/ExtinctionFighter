"""
tools/blender/generate_trex_pbr_textures.py
Generates high-resolution 1024x1024 / 512x512 / 256x256 PBR textures for the
Tyrannosaurus rex GLB model in assets/textures/fighters/, matching the reference
portrait (assets/portraits/trex.png) and procedural PBR specification in js/fighters/trex.js.
"""

import math
import os
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
TEX_DIR = os.path.join(ROOT, "assets", "textures", "fighters")
os.makedirs(TEX_DIR, exist_ok=True)


class FastRNG:
    """Deterministic LCG matching js/fighters/trex.js."""
    def __init__(self, seed=1337):
        self.seed = seed

    def rand(self):
        self.seed = (self.seed * 16807) % 2147483647
        return (self.seed - 1) / 2147483646.0


def _hex_to_rgb(h):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def _make_horizontal_gradient(size, stops):
    xs = np.linspace(0.0, 1.0, size, dtype=np.float32)
    positions = [s[0] for s in stops]
    colors = [_hex_to_rgb(s[1]) for s in stops]
    r = np.interp(xs, positions, [c[0] for c in colors])
    g = np.interp(xs, positions, [c[1] for c in colors])
    b = np.interp(xs, positions, [c[2] for c in colors])
    row = np.stack([r, g, b], axis=-1).astype(np.uint8)
    return np.broadcast_to(row[None, :, :], (size, size, 3)).copy()


def _make_vertical_gradient(size, stops):
    ys = np.linspace(0.0, 1.0, size, dtype=np.float32)
    positions = [s[0] for s in stops]
    colors = [_hex_to_rgb(s[1]) for s in stops]
    r = np.interp(ys, positions, [c[0] for c in colors])
    g = np.interp(ys, positions, [c[1] for c in colors])
    b = np.interp(ys, positions, [c[2] for c in colors])
    col = np.stack([r, g, b], axis=-1).astype(np.uint8)
    return np.broadcast_to(col[:, None, :], (size, size, 3)).copy()


def _quad_bezier_pts(p0, p1, p2, steps=24):
    pts = []
    for i in range(steps + 1):
        t = i / steps
        mt = 1.0 - t
        x = mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0]
        y = mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1]
        pts.append((x, y))
    return pts


def _composite_layer(base_rgba, draw_fn):
    layer = Image.new("RGBA", base_rgba.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")
    draw_fn(draw)
    return Image.alpha_composite(base_rgba, layer)


def _height_to_normal_rgb(bump_img, strength=3.0):
    """
    Converts a grayscale heightmap (0..255) into a standard OpenGL/glTF 2.0
    tangent-space RGB normal map where flat neutral normal is (128, 128, 255).
    """
    arr = np.asarray(bump_img, dtype=np.float32) / 255.0
    dz_dx = (np.roll(arr, -1, axis=1) - np.roll(arr, 1, axis=1)) * 0.5 * strength
    dz_dy = (np.roll(arr, 1, axis=0) - np.roll(arr, -1, axis=0)) * 0.5 * strength
    nx = -dz_dx
    ny = -dz_dy
    nz = np.ones_like(arr)
    norm = np.sqrt(nx * nx + ny * ny + nz * nz)
    nx /= norm
    ny /= norm
    nz /= norm
    rgb = np.zeros((arr.shape[0], arr.shape[1], 3), dtype=np.uint8)
    rgb[..., 0] = np.clip((nx * 0.5 + 0.5) * 255.0, 0, 255).astype(np.uint8)
    rgb[..., 1] = np.clip((ny * 0.5 + 0.5) * 255.0, 0, 255).astype(np.uint8)
    rgb[..., 2] = np.clip((nz * 0.5 + 0.5) * 255.0, 0, 255).astype(np.uint8)
    return Image.fromarray(rgb, mode="RGB")


def generate_body_hide_maps():
    size = 1024
    rng = FastRNG(1337)

    stops = [
        (0.00, "#1c211a"),  # Dorsal charcoal-olive crest
        (0.16, "#2e3628"),  # Upper flanks dark moss
        (0.32, "#48523d"),  # Mid-flanks forest olive
        (0.42, "#6c6e58"),  # Lateral transition sage-taupe
        (0.47, "#89846e"),  # Ventral transition grey-sand
        (0.50, "#9e9780"),  # Throat / belly dull parchment
        (0.53, "#89846e"),
        (0.58, "#6c6e58"),
        (0.68, "#48523d"),
        (0.84, "#2e3628"),
        (1.00, "#1c211a"),
    ]
    col_arr = _make_horizontal_gradient(size, stops)
    color_img = Image.fromarray(col_arr, mode="RGB").convert("RGBA")
    bump_img = Image.new("L", (size, size), 120)
    b_draw = ImageDraw.Draw(bump_img, "L")

    # 1. Organic tapered dorsal-to-flank tiger saddle bars (swept & natural, not rigid stripes)
    stripe_polys = []
    hi_lines = []
    num_stripes = 26
    for s in range(num_stripes):
        v_center = (s + 0.5) / num_stripes
        y_center = v_center * size
        base_half_w = 9.0 + rng.rand() * 8.0

        for side in (0, 1):
            start_x = 0.0 if side == 0 else float(size)
            span_u = 0.24 + rng.rand() * 0.11
            end_x = size * span_u if side == 0 else size * (1.0 - span_u)
            mid_x = (start_x + end_x) * 0.5
            wave_y = y_center + (rng.rand() - 0.5) * 28.0
            end_y = y_center - 14.0 + (rng.rand() - 0.5) * 18.0

            center_pts = _quad_bezier_pts((start_x, y_center), (mid_x, wave_y), (end_x, end_y), steps=16)
            upper_edge = []
            lower_edge = []
            for idx_p, (px, py) in enumerate(center_pts):
                t_p = idx_p / (len(center_pts) - 1)
                # Taper from full width at dorsal spine to a pointed tip on flank
                w_here = base_half_w * ((1.0 - t_p ** 1.35))
                upper_edge.append((px, py - w_here))
                lower_edge.append((px, py + w_here))
            poly = upper_edge + lower_edge[::-1]
            stripe_polys.append(poly)
            hi_lines.append(lower_edge[:12])
            b_draw.polygon(poly, fill=146)

    color_img = _composite_layer(
        color_img,
        lambda d: [d.polygon(p, fill=(18, 20, 14, 92)) for p in stripe_polys],
    )
    color_img = _composite_layer(
        color_img,
        lambda d: [d.line(l, fill=(155, 152, 126, 44), width=3) for l in hi_lines],
    )

    # 2. Multi-scale polygonal cobblestone reptilian scales across hide (60x60 grid)
    grid_cols, grid_rows = 60, 60
    cw, ch = size / grid_cols, size / grid_rows
    ochre_s, dark_s, olive_s = [], [], []
    for gy in range(grid_rows):
        for gx in range(grid_cols):
            cx = (gx + 0.2 + rng.rand() * 0.6) * cw
            cy = (gy + 0.2 + rng.rand() * 0.6) * ch
            u = cx / size
            is_ventral = 0.40 < u < 0.60
            scale_mult = 0.72 if is_ventral else 1.0
            rx = cw * (0.38 + rng.rand() * 0.22) * scale_mult
            ry = ch * (0.38 + rng.rand() * 0.22) * scale_mult
            sides = 5 + int(rng.rand() * 3)
            rot = rng.rand() * math.pi * 2.0
            pts = [
                (
                    cx + math.cos(rot + (k / sides) * math.pi * 2.0) * rx * (0.85 + rng.rand() * 0.25),
                    cy + math.sin(rot + (k / sides) * math.pi * 2.0) * ry * (0.85 + rng.rand() * 0.25),
                )
                for k in range(sides)
            ]
            sh = rng.rand()
            if sh > 0.66:
                ochre_s.append(pts)
            elif sh < 0.34:
                dark_s.append(pts)
            else:
                olive_s.append(pts)
            b_lum = int(142 + rng.rand() * 64)
            b_draw.polygon(pts, fill=b_lum, outline=54)

    def draw_body_cobble(d):
        for pts in ochre_s:
            d.polygon(pts, fill=(132, 126, 94, 38), outline=(16, 18, 12, 96))
        for pts in dark_s:
            d.polygon(pts, fill=(20, 22, 16, 48), outline=(16, 18, 12, 96))
        for pts in olive_s:
            d.polygon(pts, fill=(68, 78, 56, 38), outline=(16, 18, 12, 96))

    color_img = _composite_layer(color_img, draw_body_cobble)

    # 3. Deep gular & gastral skin creases across ventral throat/belly (u = 0.33..0.67)
    crease_pts_list = []
    for y in range(0, size, 8):
        jitter = (rng.rand() - 0.5) * 3.0
        pts = _quad_bezier_pts(
            (size * 0.33, y + jitter),
            (size * 0.50, y + 7.0 + jitter),
            (size * 0.67, y - jitter),
            steps=16,
        )
        crease_pts_list.append(pts)
        b_draw.line(pts, fill=72, width=3)

    color_img = _composite_layer(
        color_img,
        lambda d: [d.line(pts, fill=(18, 15, 11, 78), width=2) for pts in crease_pts_list],
    )

    # 4. Fine dermal tubercles & 1,800 large armored osteoderm bosses along dorsal spine
    light_pebbles, dark_pebbles = [], []
    for i in range(28000):
        x = rng.rand() * size
        y = rng.rand() * size
        u = x / size
        is_dorsal = u < 0.24 or u > 0.76
        scale_r = (2.0 + rng.rand() * 3.2) if is_dorsal else (1.2 + rng.rand() * 2.0)
        lum = int(118 + rng.rand() * 72)
        bbox = (x - scale_r, y - scale_r, x + scale_r, y + scale_r)
        b_draw.ellipse(bbox, fill=lum)
        if i % 2 == 0:
            if rng.rand() > 0.48:
                light_pebbles.append(bbox)
            else:
                dark_pebbles.append(bbox)

    color_img = _composite_layer(
        color_img,
        lambda d: [d.ellipse(b, fill=(128, 128, 98, 32), outline=(16, 18, 12, 64)) for b in light_pebbles],
    )
    color_img = _composite_layer(
        color_img,
        lambda d: [d.ellipse(b, fill=(22, 24, 18, 44), outline=(16, 18, 12, 64)) for b in dark_pebbles],
    )

    bosses = []
    for i in range(1800):
        side = (rng.rand() * 0.16) if (i % 2 == 0) else (1.0 - rng.rand() * 0.16)
        x = side * size
        y = rng.rand() * size
        r = 3.8 + rng.rand() * 5.4
        bbox = (x - r, y - r, x + r, y + r)
        b_draw.ellipse(bbox, fill=238)
        bosses.append(bbox)

    color_img = _composite_layer(
        color_img,
        lambda d: [d.ellipse(b, fill=(26, 28, 22, 118), outline=(130, 128, 104, 70)) for b in bosses],
    )

    color_out = os.path.join(TEX_DIR, "trex_albedo.png")
    bump_out = os.path.join(TEX_DIR, "trex_bump.png")
    color_img.convert("RGB").save(color_out, "PNG", optimize=True)
    _height_to_normal_rgb(bump_img, strength=3.2).save(bump_out, "PNG", optimize=True)
    print(f"[TEX OK] {color_out}, {bump_out}")


def generate_cranium_keratin_maps():
    size = 1024
    rng = FastRNG(1337)

    stops = [
        (0.00, "#20241b"),
        (0.28, "#3a4232"),
        (0.55, "#525b44"),
        (0.78, "#686b52"),
        (1.00, "#1b1e16"),
    ]
    col_arr = _make_horizontal_gradient(size, stops).astype(np.float32)

    ys = np.linspace(0.0, 1.0, size, dtype=np.float32)[:, None, None]
    dorsal_mask = np.clip(1.0 - 0.26 * (np.exp(-((ys - 0.0) / 0.18) ** 2) + np.exp(-((ys - 1.0) / 0.18) ** 2)), 0.72, 1.0)
    col_arr = np.clip(col_arr * dorsal_mask, 0, 255).astype(np.uint8)

    color_img = Image.fromarray(col_arr, mode="RGB").convert("RGBA")
    bump_img = Image.new("L", (size, size), 116)
    b_draw = ImageDraw.Draw(bump_img, "L")

    # 1. Dense 44x44 polygonal cobblestone scutes
    grid_cols = 44
    grid_rows = 44
    cell_w = size / grid_cols
    cell_h = size / grid_rows

    ochre_polys, dark_polys, olive_polys = [], [], []
    for gy in range(grid_rows):
        for gx in range(grid_cols):
            cx = (gx + 0.2 + rng.rand() * 0.6) * cell_w
            cy = (gy + 0.2 + rng.rand() * 0.6) * cell_h
            rx = cell_w * (0.38 + rng.rand() * 0.24)
            ry = cell_h * (0.36 + rng.rand() * 0.24)
            sides = 5 + int(rng.rand() * 3)
            rot = rng.rand() * math.pi * 2.0

            pts = []
            for s in range(sides):
                a = rot + (s / sides) * math.pi * 2.0
                r_mod = 0.82 + rng.rand() * 0.32
                px = cx + math.cos(a) * rx * r_mod
                py = cy + math.sin(a) * ry * r_mod
                pts.append((px, py))

            shade = rng.rand()
            if shade > 0.68:
                ochre_polys.append(pts)
            elif shade < 0.30:
                dark_polys.append(pts)
            else:
                olive_polys.append(pts)

            b_lum = int(155 + rng.rand() * 65)
            b_draw.polygon(pts, fill=b_lum, outline=38)

    def draw_cobble_fills(d):
        for pts in ochre_polys:
            d.polygon(pts, fill=(136, 128, 92, 56))
        for pts in dark_polys:
            d.polygon(pts, fill=(20, 22, 16, 76))
        for pts in olive_polys:
            d.polygon(pts, fill=(72, 82, 61, 56))

    def draw_cobble_outlines(d):
        for pts in ochre_polys + dark_polys + olive_polys:
            d.line(pts + [pts[0]], fill=(16, 18, 12, 162), width=2)

    color_img = _composite_layer(color_img, draw_cobble_fills)
    color_img = _composite_layer(color_img, draw_cobble_outlines)

    # 2. 3,600 neurovascular facial keratin grooves
    dark_grooves, light_grooves = [], []
    for _ in range(3600):
        x = rng.rand() * size
        y = rng.rand() * size
        length = 10 + rng.rand() * 38
        ang = (rng.rand() - 0.5) * 0.55
        ex = x + math.cos(ang) * length
        ey = y + math.sin(ang) * length
        w = max(1, int(1.0 + rng.rand() * 1.8))
        if rng.rand() > 0.45:
            dark_grooves.append(((x, y), (ex, ey), w))
        else:
            light_grooves.append(((x, y), (ex, ey), w))

    color_img = _composite_layer(
        color_img,
        lambda d: [d.line([p0, p1], fill=(12, 16, 10, 64), width=w) for p0, p1, w in dark_grooves],
    )
    color_img = _composite_layer(
        color_img,
        lambda d: [d.line([p0, p1], fill=(165, 178, 122, 36), width=w) for p0, p1, w in light_grooves],
    )

    # 3. Crimson-terracotta battle scars across maxillary swell & snout
    scar_clusters = [
        (0.56, 0.28, 1.12, 135, 5),
        (0.68, 0.34, -0.95, 150, 5),
        (0.76, 0.24, 0.85, 120, 4),
        (0.52, 0.72, -1.08, 135, 5),
        (0.66, 0.68, 0.92, 145, 5),
        (0.78, 0.76, -0.82, 115, 4),
        (0.42, 0.22, 0.45, 95, 4),
        (0.42, 0.78, -0.45, 95, 4),
    ]
    scar_lines = []
    for sx_n, sy_n, ang, length, w in scar_clusters:
        for t in (-1, 0, 1):
            sx = sx_n * size + t * 14
            sy = sy_n * size + t * 6
            ex = sx + math.cos(ang) * length
            ey = sy + math.sin(ang) * length
            scar_lines.append(((sx, sy), (ex, ey), w))
            b_draw.line([(sx, sy), (ex, ey)], fill=24, width=int(w * 1.5))

    color_img = _composite_layer(
        color_img,
        lambda d: [d.line([p0, p1], fill=(132, 114, 96, 112), width=int(w * 1.9)) for p0, p1, w in scar_lines],
    )
    color_img = _composite_layer(
        color_img,
        lambda d: [d.line([p0, p1], fill=(68, 42, 34, 184), width=w) for p0, p1, w in scar_lines],
    )

    color_out = os.path.join(TEX_DIR, "trex_cranium_albedo.png")
    bump_out = os.path.join(TEX_DIR, "trex_cranium_bump.png")
    color_img.convert("RGB").save(color_out, "PNG", optimize=True)
    _height_to_normal_rgb(bump_img, strength=3.5).save(bump_out, "PNG", optimize=True)
    print(f"[TEX OK] {color_out}, {bump_out}")


def generate_tooth_enamel_maps():
    size = 256
    stops = [
        (0.00, "#faf5e6"),  # Gleaming ivory tip (v=1.0)
        (0.25, "#dfd4b6"),  # Ivory enamel
        (0.58, "#9e845c"),  # Amber dentine
        (0.82, "#5c3820"),  # Ochre-brown neck
        (1.00, "#2b0f0c"),  # Blood/tannin-stained gingival root (v=0.0)
    ]
    col_arr = _make_vertical_gradient(size, stops)
    color_img = Image.fromarray(col_arr, mode="RGB").convert("RGBA")
    bump_img = Image.new("L", (size, size), 128)
    b_draw = ImageDraw.Draw(bump_img, "L")

    def draw_flutes(d):
        for x in range(0, size, 4):
            c_col = (45, 28, 16, 42) if (x % 8 == 0) else (255, 250, 235, 36)
            b_col = 100 if (x % 8 == 0) else 156
            d.line([(x, 0), (x, size)], fill=c_col, width=2)
            b_draw.line([(x, 0), (x, size)], fill=b_col, width=2)

    color_img = _composite_layer(color_img, draw_flutes)

    color_out = os.path.join(TEX_DIR, "trex_tooth_albedo.png")
    bump_out = os.path.join(TEX_DIR, "trex_tooth_bump.png")
    color_img.convert("RGB").save(color_out, "PNG", optimize=True)
    _height_to_normal_rgb(bump_img, strength=2.0).save(bump_out, "PNG", optimize=True)
    print(f"[TEX OK] {color_out}, {bump_out}")


def generate_eye_iris_map():
    size = 256
    cx = cy = size * 0.5
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    r_norm = np.clip((dist - size * 0.08) / (size * 0.42), 0.0, 1.0)

    stops = [
        (0.00, "#fef08a"),
        (0.32, "#f59e0b"),
        (0.68, "#ea580c"),
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
        for i in range(140):
            a = (i / 140.0) * math.pi * 2.0
            col = (254, 240, 138, 72) if (i % 2 == 0) else (69, 10, 10, 82)
            p0 = (cx + math.cos(a) * size * 0.10, cy + math.sin(a) * size * 0.10)
            p1 = (cx + math.cos(a) * size * 0.46, cy + math.sin(a) * size * 0.46)
            d.line([p0, p1], fill=col, width=2)

    img = _composite_layer(img, draw_fibers)
    out = os.path.join(TEX_DIR, "trex_iris_albedo.png")
    img.convert("RGB").save(out, "PNG", optimize=True)
    print(f"[TEX OK] {out}")


def generate_oral_mucosa_maps():
    size = 512
    rng = FastRNG(7777)
    stops = [
        (0.00, "#4f1419"),
        (0.50, "#7d242c"),
        (1.00, "#59161c"),
    ]
    col_arr = _make_vertical_gradient(size, stops)
    color_img = Image.fromarray(col_arr, mode="RGB").convert("RGBA")
    bump_img = Image.new("L", (size, size), 128)
    b_draw = ImageDraw.Draw(bump_img, "L")

    light_pap, dark_pap = [], []
    for i in range(9000):
        x = rng.rand() * size
        y = rng.rand() * size
        r = 1.0 + rng.rand() * 2.2
        lum = int(110 + rng.rand() * 60)
        b_draw.ellipse((x - r, y - r, x + r, y + r), fill=lum)
        if i % 4 == 0:
            r2 = r * 1.2
            box = (x - r2, y - r2, x + r2, y + r2)
            if rng.rand() > 0.5:
                light_pap.append(box)
            else:
                dark_pap.append(box)

    color_img = _composite_layer(
        color_img,
        lambda d: [d.ellipse(b, fill=(210, 105, 115, 32)) for b in light_pap],
    )
    color_img = _composite_layer(
        color_img,
        lambda d: [d.ellipse(b, fill=(42, 8, 12, 42)) for b in dark_pap],
    )

    color_out = os.path.join(TEX_DIR, "trex_mucosa_albedo.png")
    bump_out = os.path.join(TEX_DIR, "trex_mucosa_bump.png")
    color_img.convert("RGB").save(color_out, "PNG", optimize=True)
    _height_to_normal_rgb(bump_img, strength=2.4).save(bump_out, "PNG", optimize=True)
    print(f"[TEX OK] {color_out}, {bump_out}")


def generate_scute_pad_maps():
    size = 512
    color_img = Image.new("RGBA", (size, size), (29, 36, 25, 255))
    bump_img = Image.new("L", (size, size), 110)
    b_draw = ImageDraw.Draw(bump_img, "L")

    def draw_scutes(d):
        for y in range(0, size, 16):
            row_idx = y // 16
            off_x = (row_idx % 2) * 14
            for x in range(-14, size + 14, 28):
                box = (x + off_x, y + 2, x + off_x + 24, y + 14)
                d.rounded_rectangle(box, radius=4, fill=(56, 68, 46, 136), outline=(16, 20, 14, 180))
                b_draw.rounded_rectangle(box, radius=4, fill=198, outline=52)

    color_img = _composite_layer(color_img, draw_scutes)
    color_out = os.path.join(TEX_DIR, "trex_scute_albedo.png")
    bump_out = os.path.join(TEX_DIR, "trex_scute_bump.png")
    color_img.convert("RGB").save(color_out, "PNG", optimize=True)
    _height_to_normal_rgb(bump_img, strength=2.8).save(bump_out, "PNG", optimize=True)
    print(f"[TEX OK] {color_out}, {bump_out}")


def main():
    generate_body_hide_maps()
    generate_cranium_keratin_maps()
    generate_tooth_enamel_maps()
    generate_eye_iris_map()
    generate_oral_mucosa_maps()
    generate_scute_pad_maps()


if __name__ == "__main__":
    main()
