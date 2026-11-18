"""
tools/blender/generate_stegosaurus_pbr_textures.py
Generates high-resolution 1024x1024 / 512x512 / 256x256 PBR textures for the
Stegosaurus stenops GLB model in assets/textures/fighters/, harmonizing:
  - Game portrait palette & details (assets/portraits/stegosaurus.png):
    olive-moss cobblestone reptilian scales, warm sandstone-ochre ventral belly/throat,
    vascularized terracotta/burnt-sienna dorsal plates with carved arterial sulci,
    dark charcoal-umber keratinous beak, and fierce golden-amber reptile iris.
  - Paleontological life reconstruction ("Sophie" Stegosaurus stenops):
    organic transverse dark olive-slate flank mottling, weathered dark plate apex wear,
    and bone-ivory dark-tipped fluted thagomizer spikes.

Pure numpy + stdlib zlib PNG writer so it runs seamlessly inside Blender's bundled
Python (no external PIL dependency) as well as standalone Python.
"""

import math
import os
import struct
import zlib
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
TEX_DIR = os.path.join(ROOT, "assets", "textures", "fighters")
os.makedirs(TEX_DIR, exist_ok=True)


def _save_png_rgb(filepath, rgb_top_down):
    """Write an (H, W, 3) uint8 RGB array (row 0 = top / UV v=1.0) using PNG Sub filter for compact lossless size."""
    arr = np.ascontiguousarray(rgb_top_down, dtype=np.uint8)
    h, w, c = arr.shape
    assert c == 3
    # PNG Filter type 1 (Sub): store pixel - left_pixel (mod 256) per channel for ~2x better compression
    sub = np.empty_like(arr)
    sub[:, 0, :] = arr[:, 0, :]
    sub[:, 1:, :] = (arr[:, 1:, :].astype(np.int16) - arr[:, :-1, :].astype(np.int16)) & 0xFF
    raw = np.empty((h, w * 3 + 1), dtype=np.uint8)
    raw[:, 0] = 1  # Filter type 1 (Sub)
    raw[:, 1:] = sub.reshape(h, w * 3)
    compressed = zlib.compress(raw.tobytes(), level=9)

    def _chunk(tag, data):
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)

    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n" + _chunk(b"IHDR", ihdr) + _chunk(b"IDAT", compressed) + _chunk(b"IEND", b"")
    with open(filepath, "wb") as f:
        f.write(png)


def _hex_to_rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)], dtype=np.float32)


def _gradient_1d(coords, stops):
    """Evaluate multi-stop RGB gradient at coords in [0, 1]; returns (..., 3) float32 in [0, 255]."""
    pos = np.array([s[0] for s in stops], dtype=np.float32)
    cols = np.stack([_hex_to_rgb(s[1]) for s in stops], axis=0)
    out = np.empty(coords.shape + (3,), dtype=np.float32)
    for ch in range(3):
        out[..., ch] = np.interp(coords, pos, cols[:, ch])
    return out


def _tileable_value_noise(size, freq, seed=42):
    """Smooth tileable 2D value noise in [0, 1] at resolution size x size."""
    rng = np.random.default_rng(seed)
    grid = rng.random((freq, freq), dtype=np.float32)
    ys = np.linspace(0.0, freq, size, endpoint=False, dtype=np.float32)
    xs = np.linspace(0.0, freq, size, endpoint=False, dtype=np.float32)
    iy = np.floor(ys).astype(np.int32)
    ix = np.floor(xs).astype(np.int32)
    fy = ys - iy
    fx = xs - ix
    # Quintic smoothstep
    sy = fy * fy * fy * (fy * (fy * 6.0 - 15.0) + 10.0)
    sx = fx * fx * fx * (fx * (fx * 6.0 - 15.0) + 10.0)
    iy1 = (iy + 1) % freq
    ix1 = (ix + 1) % freq
    c00 = grid[iy[:, None], ix[None, :]]
    c10 = grid[iy[:, None], ix1[None, :]]
    c01 = grid[iy1[:, None], ix[None, :]]
    c11 = grid[iy1[:, None], ix1[None, :]]
    top = c00 + (c10 - c00) * sx[None, :]
    bot = c01 + (c11 - c01) * sx[None, :]
    return top + (bot - top) * sy[:, None]


def _tileable_fbm(size, base_freq=4, octaves=4, seed=101):
    """Multi-octave tileable fBm noise normalized to [0, 1]."""
    acc = np.zeros((size, size), dtype=np.float32)
    amp = 1.0
    total = 0.0
    freq = base_freq
    for oct_i in range(octaves):
        acc += amp * _tileable_value_noise(size, freq, seed=seed + oct_i * 73)
        total += amp
        amp *= 0.5
        freq *= 2
    return acc / total


def _voronoi_scales(size, nx, ny, seed=7, jitter=0.68, warp_u=None, warp_v=None):
    """
    Tileable cellular Voronoi generator for true snug-fitting reptilian cobblestone scales.
    Returns:
      edge_dist: distance to nearest Voronoi cell border (in cell units, 0 at mortar seam)
      d1: distance to nearest cell center (in cell units)
      cell_val: deterministic [0, 1] random value per scale cell
    """
    rng = np.random.default_rng(seed)
    # Seed offsets per grid cell in [0.5 - jitter/2, 0.5 + jitter/2]
    off_x = 0.5 + (rng.random((ny, nx)).astype(np.float32) - 0.5) * jitter
    off_y = 0.5 + (rng.random((ny, nx)).astype(np.float32) - 0.5) * jitter
    cell_hash = rng.random((ny, nx)).astype(np.float32)

    u = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)[None, :]
    v = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)[:, None]
    if warp_u is not None:
        u = (u + warp_u) % 1.0
    if warp_v is not None:
        v = (v + warp_v) % 1.0

    gx = u * nx
    gy = v * ny
    ix = np.floor(gx).astype(np.int32) % nx
    iy = np.floor(gy).astype(np.int32) % ny
    fx = gx - np.floor(gx)
    fy = gy - np.floor(gy)

    d1 = np.full((size, size), 1e6, dtype=np.float32)
    d2 = np.full((size, size), 1e6, dtype=np.float32)
    cval = np.zeros((size, size), dtype=np.float32)

    for dy in (-1, 0, 1):
        ny_idx = (iy + dy) % ny
        for dx in (-1, 0, 1):
            nx_idx = (ix + dx) % nx
            rx = (dx + off_x[ny_idx, nx_idx]) - fx
            ry = (dy + off_y[ny_idx, nx_idx]) - fy
            dist = np.sqrt(rx * rx + ry * ry)

            closer1 = dist < d1
            d2 = np.where(closer1, d1, np.minimum(d2, dist))
            d1 = np.where(closer1, dist, d1)
            cval = np.where(closer1, cell_hash[ny_idx, nx_idx], cval)

    edge_dist = d2 - d1
    return edge_dist, d1, cval


def _height_to_normal_top_down(height_01, strength=3.4):
    """
    Convert a top-down [0, 1] heightmap (row 0 = top / UV v=1.0) to OpenGL/glTF 2.0
    tangent-space RGB normal map matching generate_trex_pbr_textures.py.
    """
    # Sobel-weighted finite differences for crisp yet smooth normals
    h = height_01.astype(np.float32)
    dz_dx = (
        (np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)) * 0.50
        + (np.roll(np.roll(h, -1, axis=1), -1, axis=0) - np.roll(np.roll(h, 1, axis=1), -1, axis=0)) * 0.25
        + (np.roll(np.roll(h, -1, axis=1), 1, axis=0) - np.roll(np.roll(h, 1, axis=1), 1, axis=0)) * 0.25
    ) * strength
    dz_dy = (
        (np.roll(h, 1, axis=0) - np.roll(h, -1, axis=0)) * 0.50
        + (np.roll(np.roll(h, 1, axis=0), -1, axis=1) - np.roll(np.roll(h, -1, axis=0), -1, axis=1)) * 0.25
        + (np.roll(np.roll(h, 1, axis=0), 1, axis=1) - np.roll(np.roll(h, -1, axis=0), 1, axis=1)) * 0.25
    ) * strength

    nx = -dz_dx
    ny = -dz_dy
    nz = np.ones_like(h)
    inv_len = 1.0 / np.sqrt(nx * nx + ny * ny + nz * nz)
    nx *= inv_len
    ny *= inv_len
    nz *= inv_len

    rgb = np.empty(h.shape + (3,), dtype=np.uint8)
    rgb[..., 0] = np.clip((nx * 0.5 + 0.5) * 255.0, 0.0, 255.0).astype(np.uint8)
    rgb[..., 1] = np.clip((ny * 0.5 + 0.5) * 255.0, 0.0, 255.0).astype(np.uint8)
    rgb[..., 2] = np.clip((nz * 0.5 + 0.5) * 255.0, 0.0, 255.0).astype(np.uint8)
    return rgb


def generate_body_hide_maps():
    """
    1024x1024 Stegosaurus stenops hide albedo, grayscale bump, and tangent normal map.
    UV u=0/1 -> dorsal midline (deep olive-moss), u=0.5 -> ventral belly/throat (warm sandstone-ochre).
    Combines snug Voronoi cobblestone scales, Sophie's organic dark dorsal-flank mottling,
    transverse skin folds, and raised dermal rosette nodules.
    """
    size = 1024
    u_row = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)
    v_col = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)  # row 0 = v=1.0
    uu, vv = np.meshgrid(u_row, v_col)

    # 1. Base dorsal-to-ventral color gradient matching assets/portraits/stegosaurus.png
    stops = [
        (0.00, "#3e4625"),  # Dorsal deep olive-moss spine
        (0.14, "#545d32"),  # Upper back warm olive
        (0.27, "#6c6f3d"),  # Mid-flank mossy ochre-olive
        (0.38, "#8c7f4d"),  # Lower flank golden-khaki transition
        (0.45, "#ad9261"),  # Sub-ventral warm ochre-tan
        (0.50, "#c2a573"),  # Ventral belly & throat sandstone-tan
        (0.55, "#ad9261"),
        (0.62, "#8c7f4d"),
        (0.73, "#6c6f3d"),
        (0.86, "#545d32"),
        (1.00, "#3e4625"),
    ]
    base_rgb = _gradient_1d(uu, stops)

    # 2. Organic dark olive-slate flank mottling & soft saddle bars (inspired by Sophie!)
    fbm_macro = _tileable_fbm(size, base_freq=4, octaves=4, seed=211)
    fbm_mid = _tileable_fbm(size, base_freq=8, octaves=3, seed=313)
    dorsal_mask = np.where(np.abs(uu - 0.5) < 0.13, 0.0, np.clip((np.abs(uu - 0.5) - 0.13) / 0.22, 0.0, 1.0))

    # Irregular mottled saddle bands along V with rich organic fBm distortion (Sophie camouflage)
    band_phase = np.sin((vv * 7.5 + fbm_macro * 3.2) * math.pi * 2.0)
    saddle_mask = np.clip((band_phase + 0.14) * 0.85 + (fbm_mid - 0.46) * 0.90, 0.0, 1.0) * dorsal_mask
    dark_mottle_col = np.array([30.0, 35.0, 19.0], dtype=np.float32)
    warm_ochre_col = np.array([162.0, 134.0, 76.0], dtype=np.float32)

    col = base_rgb * (1.0 - 0.50 * saddle_mask[..., None]) + dark_mottle_col * (0.50 * saddle_mask[..., None])
    warm_fleck = np.clip((fbm_mid - 0.50) * 2.4, 0.0, 1.0) * (1.0 - saddle_mask * 0.60) * dorsal_mask
    col = col * (1.0 - 0.30 * warm_fleck[..., None]) + warm_ochre_col * (0.30 * warm_fleck[..., None])

    # 3. Dual-scale tileable Voronoi cobblestone scales (snug polygonal reptilian hide!)
    warp_u = (fbm_mid - 0.5) * 0.018
    warp_v = (_tileable_fbm(size, base_freq=8, octaves=3, seed=409) - 0.5) * 0.018
    edge_big, d1_big, cv_big = _voronoi_scales(size, 64, 64, seed=1019, jitter=0.72, warp_u=warp_u, warp_v=warp_v)
    edge_med, d1_med, cv_med = _voronoi_scales(size, 112, 112, seed=2027, jitter=0.70, warp_u=warp_u * 0.7, warp_v=warp_v * 0.7)

    # Larger cobblestone scutes on back & upper flanks, tighter neat pebble scales on belly/throat
    ventral_blend = np.exp(-((uu - 0.5) / 0.15) ** 2)
    dome_big = np.clip(edge_big / 0.16, 0.0, 1.0) ** 0.52 * (1.0 - 0.22 * np.clip(d1_big, 0.0, 1.0) ** 2)
    dome_med = np.clip(edge_med / 0.18, 0.0, 1.0) ** 0.55 * (1.0 - 0.20 * np.clip(d1_med, 0.0, 1.0) ** 2)

    scale_height = dome_big * (1.0 - 0.62 * ventral_blend) + dome_med * (0.38 + 0.62 * ventral_blend)
    mortar_big = 1.0 - np.clip(edge_big / 0.095, 0.0, 1.0)
    mortar_med = 1.0 - np.clip(edge_med / 0.105, 0.0, 1.0)
    mortar = mortar_big * (1.0 - 0.55 * ventral_blend) + mortar_med * (0.45 + 0.55 * ventral_blend)
    cell_var = cv_big * (1.0 - ventral_blend) + cv_med * ventral_blend

    # 4. Raised dermal rosette osteoderm bosses scattered along upper flanks & shoulders
    edge_ros, d1_ros, cv_ros = _voronoi_scales(size, 22, 22, seed=5503, jitter=0.80)
    ros_active = (cv_ros > 0.74).astype(np.float32) * dorsal_mask
    ros_bump = np.clip(1.0 - d1_ros / 0.26, 0.0, 1.0) ** 1.4 * ros_active

    # 5. Subtle organic non-uniform leather skin creases (softened & broken up by fBm)
    fold_wave = 0.5 + 0.5 * np.cos((vv * 16.0 + fbm_macro * 3.4 + np.abs(uu - 0.5) * 1.2) * math.pi * 2.0)
    fold_groove = (np.clip((0.24 - fold_wave) / 0.24, 0.0, 1.0) ** 1.8) * (0.35 + 0.65 * fbm_mid)

    # Combine albedo shading: per-scale tonal richness + dark mortar crevices + subtle highlight crowns
    scale_tint = (cell_var - 0.5) * 28.0
    col = col + scale_tint[..., None] * np.array([1.0, 0.95, 0.62], dtype=np.float32)
    # Darken scale mortar seams (AO crevices between scales — crucial for portrait-grade realism!)
    mortar_col = np.array([20.0, 22.0, 12.0], dtype=np.float32)
    col = col * (1.0 - 0.56 * mortar[..., None]) + mortar_col * (0.56 * mortar[..., None])
    # Warm sunlit mineral highlight on raised cobblestone crowns & dermal rosettes
    crown_hi = np.clip((scale_height - 0.62) / 0.38, 0.0, 1.0) * 0.22 + ros_bump * 0.28
    hi_col = np.array([186.0, 168.0, 108.0], dtype=np.float32)
    col = col * (1.0 - crown_hi[..., None]) + hi_col * crown_hi[..., None]
    # Subtle leather skin fold shading
    col = col * (1.0 - 0.14 * fold_groove[..., None])

    # Assemble [0, 1] heightmap
    height = (
        0.38
        + 0.44 * scale_height
        - 0.22 * mortar
        + 0.26 * ros_bump
        - 0.14 * fold_groove
        + (fbm_mid - 0.5) * 0.08
    )
    height = np.clip(height, 0.0, 1.0)

    albedo_u8 = np.clip(col, 0.0, 255.0).astype(np.uint8)
    bump_gray = np.clip(height * 255.0, 0.0, 255.0).astype(np.uint8)
    bump_rgb = np.stack([bump_gray, bump_gray, bump_gray], axis=-1)
    normal_rgb = _height_to_normal_top_down(height, strength=4.2)

    _save_png_rgb(os.path.join(TEX_DIR, "stegosaurus_albedo.png"), albedo_u8)
    _save_png_rgb(os.path.join(TEX_DIR, "stegosaurus_bump.png"), bump_rgb)
    _save_png_rgb(os.path.join(TEX_DIR, "stegosaurus_normal.png"), normal_rgb)
    print("[TEX OK] stegosaurus_albedo/bump/normal.png")


def generate_cranium_maps():
    """
    512x512 sculpted cranial scale hide matching assets/portraits/stegosaurus.png:
    large armored polygonal scales along brow & nasal bridge, fine snug pebble scales
    on cheeks & chin, warm golden-tan jowl/throat underside.
    """
    size = 512
    u_row = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)
    v_col = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)
    uu, vv = np.meshgrid(u_row, v_col)

    stops = [
        (0.00, "#4c542b"),  # Crown / nasal bridge rich moss-olive
        (0.18, "#676c3a"),  # Upper cheek & brow ridge olive-ochre
        (0.34, "#8b814c"),  # Mid-cheek warm olive-khaki
        (0.46, "#b29964"),  # Lower jaw warm golden-sandstone
        (0.50, "#c8aa74"),  # Throat / chin warm pale tan
        (0.54, "#b29964"),
        (0.66, "#8b814c"),
        (0.82, "#676c3a"),
        (1.00, "#4c542b"),
    ]
    col = _gradient_1d(uu, stops)
    fbm = _tileable_fbm(size, base_freq=6, octaves=4, seed=6143)

    warp_u = (fbm - 0.5) * 0.015
    warp_v = (_tileable_fbm(size, base_freq=6, octaves=3, seed=6217) - 0.5) * 0.015
    edge_crown, d1_crown, cv_crown = _voronoi_scales(size, 40, 44, seed=7109, jitter=0.68, warp_u=warp_u, warp_v=warp_v)
    edge_cheek, d1_cheek, cv_cheek = _voronoi_scales(size, 84, 88, seed=7331, jitter=0.66, warp_u=warp_u * 0.6, warp_v=warp_v * 0.6)

    # Larger cranial boss scales on top (u near 0/1), finer pebbled cheek/jaw scales near u=0.5
    crown_mask = np.clip((np.abs(uu - 0.5) - 0.16) / 0.24, 0.0, 1.0)
    dome_c = np.clip(edge_crown / 0.17, 0.0, 1.0) ** 0.48 * (1.0 - 0.20 * np.clip(d1_crown, 0.0, 1.0) ** 2)
    dome_k = np.clip(edge_cheek / 0.19, 0.0, 1.0) ** 0.52 * (1.0 - 0.18 * np.clip(d1_cheek, 0.0, 1.0) ** 2)

    scale_h = dome_c * crown_mask + dome_k * (1.0 - crown_mask)
    mortar_c = 1.0 - np.clip(edge_crown / 0.10, 0.0, 1.0)
    mortar_k = 1.0 - np.clip(edge_cheek / 0.11, 0.0, 1.0)
    mortar = mortar_c * crown_mask + mortar_k * (1.0 - crown_mask)
    cval = cv_crown * crown_mask + cv_cheek * (1.0 - crown_mask)

    col = col + ((cval - 0.5) * 28.0)[..., None] * np.array([1.0, 0.94, 0.64], dtype=np.float32)
    mortar_col = np.array([20.0, 22.0, 12.0], dtype=np.float32)
    col = col * (1.0 - 0.60 * mortar[..., None]) + mortar_col * (0.60 * mortar[..., None])
    crown_hi = np.clip((scale_h - 0.60) / 0.40, 0.0, 1.0) * 0.24
    col = col * (1.0 - crown_hi[..., None]) + np.array([196.0, 178.0, 118.0], dtype=np.float32) * crown_hi[..., None]

    height = np.clip(0.36 + 0.52 * scale_h - 0.24 * mortar + (fbm - 0.5) * 0.06, 0.0, 1.0)

    _save_png_rgb(os.path.join(TEX_DIR, "stegosaurus_cranium_albedo.png"), np.clip(col, 0.0, 255.0).astype(np.uint8))
    _save_png_rgb(os.path.join(TEX_DIR, "stegosaurus_cranium_normal.png"), _height_to_normal_top_down(height, strength=4.4))
    print("[TEX OK] stegosaurus_cranium_albedo/normal.png")


def _build_vascular_tree_segments():
    """
    Constructs an organic branching vascular/arterial tree in UV space (u in [0,1], v in [0,1])
    radiating upward from the plate root (v=0) toward the dorsal crest (v=1).
    Returns list of (p0, p1, p2, w0, w1, depth_weight) quadratic Bezier vein segments.
    """
    segs = []

    def add_branch(p0, angle, length, bend, w0, w1, depth, rng_seed):
        rng = np.random.default_rng(rng_seed)
        dx = math.sin(angle) * length
        dy = math.cos(angle) * length
        p2 = (p0[0] + dx, p0[1] + dy)
        nx = math.cos(angle)
        ny = -math.sin(angle)
        p1 = (
            0.5 * (p0[0] + p2[0]) + nx * bend * length,
            0.5 * (p0[1] + p2[1]) + ny * bend * length,
        )
        segs.append((p0, p1, p2, w0, w1, 1.0 if depth == 0 else (0.82 if depth == 1 else 0.58)))
        if depth >= 3 or p2[1] > 0.94 or p2[0] < 0.06 or p2[0] > 0.94:
            return
        # Spawn 2 organic forks from tip + 1 lateral sprout from mid-segment
        for bi, side in enumerate((-1.0, 1.0)):
            ang_child = angle + side * (0.24 + rng.random() * 0.26)
            # Keep branches gently fanning upward rather than drooping downward
            ang_child = max(-1.12, min(1.12, ang_child))
            len_child = length * (0.58 + rng.random() * 0.20)
            bend_child = (rng.random() - 0.5) * 0.24
            add_branch(p2, ang_child, len_child, bend_child, w1 * 0.95, w1 * 0.56, depth + 1, rng_seed * 31 + bi * 17 + 7)
        if depth <= 1:
            t_mid = 0.52
            mt = 1.0 - t_mid
            pm = (
                mt * mt * p0[0] + 2 * mt * t_mid * p1[0] + t_mid * t_mid * p2[0],
                mt * mt * p0[1] + 2 * mt * t_mid * p1[1] + t_mid * t_mid * p2[1],
            )
            side = 1.0 if (rng_seed % 2 == 0) else -1.0
            ang_lat = max(-1.18, min(1.18, angle + side * (0.42 + rng.random() * 0.22)))
            add_branch(pm, ang_lat, length * 0.56, side * 0.12, w0 * 0.58, w1 * 0.42, depth + 1, rng_seed * 19 + 113)

    # 5 Primary basal arterial trunks fanning all the way up toward the apex (v -> 0.95)
    roots = [
        ((0.44, 0.01), -0.32, 0.35, -0.10, 0.0140, 0.0092, 101),
        ((0.50, 0.01), -0.05, 0.40,  0.08, 0.0160, 0.0102, 202),
        ((0.56, 0.01),  0.24, 0.37, -0.09, 0.0150, 0.0094, 303),
        ((0.34, 0.03), -0.58, 0.30,  0.11, 0.0115, 0.0072, 404),
        ((0.66, 0.03),  0.54, 0.31, -0.11, 0.0115, 0.0072, 505),
    ]
    for p0, ang, length, bend, w0, w1, sd in roots:
        add_branch(p0, ang, length, bend, w0, w1, 0, sd)
    return segs


def generate_plate_maps():
    """
    768x768 iconic Stegosaurus dermal osteoderm plate albedo + tangent normal map.
    UV u in [0,1] across plate width (anterior -> posterior), v=0 root -> v=1 apex crest.
    Features deeply carved organic domain-warped branching arterial sulci (matching
    assets/portraits/stegosaurus.png), rich terracotta/burnt-sienna body, dark dermal base
    collar, raised bony vascular walls, porous keratin micro-grain, and subtle dark smoky
    tip mottling inspired by the Sophie life reconstruction.
    """
    size = 768
    u_row = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)
    v_col = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)  # row 0 = v=1.0
    uu, vv = np.meshgrid(u_row, v_col)

    # 1. Base vertical terracotta-copper-umber plate gradient (richer deeper museum palette!)
    stops = [
        (0.00, "#2f2416"),  # Embedded dark olive-umber dermal collar (v=0)
        (0.10, "#5e2f17"),  # Basal deep burnt-sienna
        (0.32, "#9a4521"),  # Rich mid-plate terracotta
        (0.62, "#bc6032"),  # Sunlit copper-sienna upper plate
        (0.84, "#ca7742"),  # Warm ochre-terracotta upper crest
        (0.94, "#8a512e"),  # Weathered keratin bevel rim
        (1.00, "#462b1b"),  # Worn darkened crest margin (v=1)
    ]
    col = _gradient_1d(vv, stops)

    fbm_large = _tileable_fbm(size, base_freq=4, octaves=4, seed=8111)
    fbm_mid = _tileable_fbm(size, base_freq=10, octaves=3, seed=8167)
    fbm_fine = _tileable_fbm(size, base_freq=24, octaves=4, seed=8221)
    fbm_micro = _tileable_fbm(size, base_freq=48, octaves=2, seed=8317)

    # Organic domain-warped UV coordinates so every arterial groove curves naturally
    uu_w = uu + (fbm_mid - 0.5) * 0.026 + (fbm_fine - 0.5) * 0.007
    vv_w = vv + (_tileable_fbm(size, base_freq=10, octaves=3, seed=8443) - 0.5) * 0.022

    # 2. Subtle organic radial fibrous bone grain fanning upward from (0.5, -0.08)
    ang = np.arctan2(uu_w - 0.5, vv_w + 0.08)
    fibers = 0.5 + 0.5 * np.sin(ang * 78.0 + fbm_fine * 5.2)
    fibers_fine = 0.5 + 0.5 * np.sin(ang * 190.0 + fbm_large * 7.5)

    # 3. Vectorized SDF branching vascular blood-vessel grooves (sulci) + raised rim walls!
    segs = _build_vascular_tree_segments()
    groove = np.zeros((size, size), dtype=np.float32)
    ridge = np.zeros((size, size), dtype=np.float32)

    # Smooth 12-subsegment continuous Bezier sampling (zero beading!)
    for p0, p1, p2, w0, w1, weight in segs:
        sub_pts = []
        n_sub = 12
        for k in range(n_sub + 1):
            t = k / n_sub
            mt = 1.0 - t
            px = mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0]
            py = mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1]
            pw = w0 + (w1 - w0) * t
            sub_pts.append((px, py, pw))

        # Compute bounding box for the whole curved segment once
        xs_s = [p[0] for p in sub_pts]
        ys_s = [p[1] for p in sub_pts]
        pad = max(w0, w1) * 3.8 + 0.024
        xmin = max(0, int((min(xs_s) - pad) * size))
        xmax = min(size, int((max(xs_s) + pad) * size) + 1)
        ymin = max(0, int((1.0 - (max(ys_s) + pad)) * size))
        ymax = min(size, int((1.0 - (min(ys_s) - pad)) * size) + 1)
        if xmin >= xmax or ymin >= ymax:
            continue

        su = uu_w[ymin:ymax, xmin:xmax]
        sv = vv_w[ymin:ymax, xmin:xmax]
        best_norm_d = np.full(su.shape, 1e6, dtype=np.float32)

        for k in range(n_sub):
            x0, y0, r0 = sub_pts[k]
            x1, y1, r1 = sub_pts[k + 1]
            dx = x1 - x0
            dy = y1 - y0
            len2 = dx * dx + dy * dy + 1e-10
            t_proj = np.clip(((su - x0) * dx + (sv - y0) * dy) / len2, 0.0, 1.0)
            cx = x0 + t_proj * dx
            cy = y0 + t_proj * dy
            dist = np.sqrt((su - cx) ** 2 + (sv - cy) ** 2)
            rad = r0 + (r1 - r0) * t_proj
            best_norm_d = np.minimum(best_norm_d, dist / rad)

        # Smooth continuous U-shaped vascular trough + raised bony shoulder walls
        g_val = np.clip(1.0 - best_norm_d ** 1.85, 0.0, 1.0) * weight
        r_val = np.exp(-(((best_norm_d - 1.48) / 0.62) ** 2)) * weight
        groove[ymin:ymax, xmin:xmax] = np.maximum(groove[ymin:ymax, xmin:xmax], g_val)
        ridge[ymin:ymax, xmin:xmax] = np.maximum(ridge[ymin:ymax, xmin:xmax], r_val)

    # 4. Organic dark smoky-umber weathered keratin mottling near upper edges & trailing rim (Sophie homage)
    edge_dist_u = np.minimum(uu, 1.0 - uu)
    edge_wear = np.clip((0.24 - edge_dist_u) / 0.24, 0.0, 1.0) * 0.58 + np.clip((vv - 0.56) / 0.44, 0.0, 1.0) * 0.78
    smoke_mask = np.clip((fbm_large - 0.36) * 2.2 + (fbm_mid - 0.5) * 0.7, 0.0, 1.0) * np.clip(edge_wear, 0.0, 1.0)
    smoke_col = np.array([38.0, 25.0, 17.0], dtype=np.float32)

    # Paint plate albedo
    col = col + ((fbm_large - 0.5) * 26.0 + (fibers - 0.5) * 14.0 + (fbm_micro - 0.5) * 12.0)[..., None] * np.array([1.0, 0.68, 0.42], dtype=np.float32)
    # Raised pale copper-ochre bony ridges bordering vascular sulci
    ridge_col = np.array([224.0, 148.0, 88.0], dtype=np.float32)
    col = col * (1.0 - 0.48 * ridge[..., None]) + ridge_col * (0.48 * ridge[..., None])
    # Dark crimson-umber recessed vascular channels
    sulcus_col = np.array([44.0, 16.0, 8.0], dtype=np.float32)
    col = col * (1.0 - 0.78 * groove[..., None]) + sulcus_col * (0.78 * groove[..., None])
    # Rich weathered dark keratin apex & margin mottling
    col = col * (1.0 - 0.56 * smoke_mask[..., None]) + smoke_col * (0.56 * smoke_mask[..., None])

    # Subtle basal scale integration where plate emerges from olive skin
    root_blend = np.clip((0.07 - vv) / 0.07, 0.0, 1.0)
    col = col * (1.0 - 0.58 * root_blend[..., None]) + np.array([56.0, 54.0, 30.0], dtype=np.float32) * (0.58 * root_blend[..., None])

    # Heightmap for deep dramatic vascular normal relief + bony porous micro-grain
    height = (
        0.52
        - 0.38 * groove
        + 0.17 * ridge
        + 0.06 * fibers
        + 0.03 * fibers_fine
        + (fbm_fine - 0.5) * 0.07
        + (fbm_micro - 0.5) * 0.05
    )
    height = np.clip(height, 0.0, 1.0)

    _save_png_rgb(os.path.join(TEX_DIR, "stegosaurus_plate_albedo.png"), np.clip(col, 0.0, 255.0).astype(np.uint8))
    _save_png_rgb(os.path.join(TEX_DIR, "stegosaurus_plate_normal.png"), _height_to_normal_top_down(height, strength=5.0))
    print("[TEX OK] stegosaurus_plate_albedo/normal.png")


def generate_spike_maps():
    """
    384x384 striated bone-ivory & dark-tipped keratin thagomizer spikes and blunt hooves.
    UV v=0 (bottom) = embedded root collar -> v=1 (top) = sharp dark weathered spike tip.
    """
    size = 384
    u_row = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)
    v_col = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)
    uu, vv = np.meshgrid(u_row, v_col)

    stops = [
        (0.00, "#2f281f"),  # Dark dermal-keratin basal root (v=0)
        (0.14, "#584a36"),  # Weathered umber root collar
        (0.36, "#b49c74"),  # Warm amber-bone lower shaft
        (0.66, "#d8c7a3"),  # Gleaming pale bone-ivory mid/upper shaft
        (0.84, "#7a664b"),  # Darkened battle-worn upper taper
        (0.95, "#2d241c"),  # Dark charcoal-keratin tip
        (1.00, "#1c1611"),  # Sharp obsidian-brown apex (v=1)
    ]
    col = _gradient_1d(vv, stops)
    fbm = _tileable_fbm(size, base_freq=8, octaves=4, seed=9011)

    # Organic uneven longitudinal keratin flutes running along V
    fbm_u = _tileable_fbm(size, base_freq=12, octaves=3, seed=9049)
    flute_a = 0.5 + 0.5 * np.sin((uu * 34.0 + (fbm - 0.5) * 1.4) * math.pi * 2.0) * (0.55 + 0.45 * fbm_u)
    flute_b = 0.5 + 0.5 * np.sin((uu * 88.0 + (fbm_u - 0.5) * 1.8) * math.pi * 2.0)
    # Transverse basal growth rings (strongest near base v < 0.55)
    ring_env = np.clip(1.0 - vv / 0.62, 0.0, 1.0)
    rings = (0.5 + 0.5 * np.sin((vv * 20.0 + fbm * 2.2 + np.sin(uu * math.pi * 6.0) * 0.20) * math.pi * 2.0)) * ring_env

    col = col + ((flute_a - 0.5) * 28.0 + (flute_b - 0.5) * 12.0 - rings * 24.0)[..., None] * np.array([1.0, 0.92, 0.78], dtype=np.float32)
    height = np.clip(0.50 + (flute_a - 0.5) * 0.28 + (flute_b - 0.5) * 0.12 - rings * 0.22 + (fbm - 0.5) * 0.08, 0.0, 1.0)

    _save_png_rgb(os.path.join(TEX_DIR, "stegosaurus_spike_albedo.png"), np.clip(col, 0.0, 255.0).astype(np.uint8))
    _save_png_rgb(os.path.join(TEX_DIR, "stegosaurus_spike_normal.png"), _height_to_normal_top_down(height, strength=3.6))
    print("[TEX OK] stegosaurus_spike_albedo/normal.png")


def generate_beak_maps():
    """
    384x384 dark charcoal-umber striated keratinous rhamphotheca beak
    matching assets/portraits/stegosaurus.png.
    UV v=0 (bottom) = nasal base -> v=1 (top) = dark worn cropping tip.
    """
    size = 384
    u_row = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)
    v_col = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)
    uu, vv = np.meshgrid(u_row, v_col)

    stops = [
        (0.00, "#49412e"),  # Olive-umber rostral base sheath (v=0)
        (0.25, "#3d3124"),  # Weathered dark walnut horn
        (0.62, "#2b2219"),  # Deep charcoal-umber mid beak
        (0.88, "#1f1812"),  # Worn cutting edge
        (1.00, "#15110d"),  # Darkest keratin beak tip (v=1)
    ]
    col = _gradient_1d(vv, stops)
    fbm = _tileable_fbm(size, base_freq=8, octaves=3, seed=9413)

    flutes = 0.5 + 0.5 * np.sin((uu * 68.0 + (fbm - 0.5) * 0.8) * math.pi * 2.0)
    fine_lines = 0.5 + 0.5 * np.sin((uu * 150.0 + fbm * 2.0) * math.pi * 2.0)
    wear = np.clip((fbm - 0.58) * 2.5, 0.0, 1.0) * np.clip(vv * 1.4, 0.0, 1.0)

    col = col + ((flutes - 0.5) * 22.0 + (fine_lines - 0.5) * 10.0)[..., None] * np.array([1.0, 0.90, 0.78], dtype=np.float32)
    col = col + wear[..., None] * np.array([34.0, 28.0, 20.0], dtype=np.float32)
    height = np.clip(0.50 + (flutes - 0.5) * 0.26 + (fine_lines - 0.5) * 0.12 + (fbm - 0.5) * 0.08, 0.0, 1.0)

    _save_png_rgb(os.path.join(TEX_DIR, "stegosaurus_beak_albedo.png"), np.clip(col, 0.0, 255.0).astype(np.uint8))
    _save_png_rgb(os.path.join(TEX_DIR, "stegosaurus_beak_normal.png"), _height_to_normal_top_down(height, strength=3.4))
    print("[TEX OK] stegosaurus_beak_albedo/normal.png")


def generate_eye_iris_map():
    """256x256 fierce golden-amber reptile iris texture matching assets/portraits/stegosaurus.png."""
    size = 256
    coords = np.linspace(-1.0, 1.0, size, dtype=np.float32)
    xx, yy = np.meshgrid(coords, coords)
    r = np.sqrt(xx * xx + yy * yy)
    ang = np.arctan2(yy, xx)
    r_norm = np.clip((r - 0.14) / 0.82, 0.0, 1.0)

    stops = [
        (0.00, "#fde68a"),  # Luminous golden-amber inner pupil halo
        (0.28, "#f59e0b"),  # Rich vivid amber-gold
        (0.62, "#d97706"),  # Deep burnt amber
        (0.86, "#78350f"),  # Dark umber limbal ring
        (1.00, "#1c0a04"),  # Outer sclera shadow
    ]
    col = _gradient_1d(r_norm, stops)

    # Radial iris stroma fibers
    fibers = 0.5 + 0.5 * np.sin(ang * 44.0 + np.sin(r * 18.0) * 1.2)
    fibers2 = 0.5 + 0.5 * np.cos(ang * 88.0 - r * 12.0)
    fiber_mask = np.clip(1.0 - np.abs(r_norm - 0.45) * 1.9, 0.0, 1.0)
    col = col + ((fibers - 0.5) * 44.0 + (fibers2 - 0.5) * 20.0)[..., None] * fiber_mask[..., None] * np.array([1.0, 0.78, 0.35], dtype=np.float32)

    _save_png_rgb(os.path.join(TEX_DIR, "stegosaurus_iris_albedo.png"), np.clip(col, 0.0, 255.0).astype(np.uint8))
    print("[TEX OK] stegosaurus_iris_albedo.png")


def main():
    generate_body_hide_maps()
    generate_cranium_maps()
    generate_plate_maps()
    generate_spike_maps()
    generate_beak_maps()
    generate_eye_iris_map()


if __name__ == "__main__":
    main()
