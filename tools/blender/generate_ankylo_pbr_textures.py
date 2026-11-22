"""
tools/blender/generate_ankylo_pbr_textures.py
Generates high-resolution 1024x1024 / 512x512 / 256x256 PBR textures for the
Ankylosaurus magniventris GLB model in assets/textures/fighters/, harmonizing:
  - Game portrait palette & details (assets/portraits/ankylo.png):
    deep charcoal-olive & moss-slate armored cobblestone hide, warm pale
    sandstone-taupe pebbled throat/jowl/belly scales, heavily cobbled cranial
    caputegulae with dark mortar crevices, weathered honey-ochre fluted cranial
    horns, compact dark charcoal-umber turtle-like keratinous beak, weathered
    olive-stone keeled osteoderm scutes, and fierce golden-amber reptile iris.
  - Paleontological life reconstruction of Ankylosaurus magniventris:
    interlocking polygonal armored hide, transverse dark olive-slate carapace
    banding, weathered mineral-taupe osteoderm ridges, and a heavily pitted,
    battle-scarred ossified boulder tail club.

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
    """Write an (H, W, 3) uint8 RGB array (row 0 = top / UV v=1.0) using PNG Sub filter."""
    arr = np.ascontiguousarray(rgb_top_down, dtype=np.uint8)
    h, w, c = arr.shape
    assert c == 3
    sub = np.empty_like(arr)
    sub[:, 0, :] = arr[:, 0, :]
    sub[:, 1:, :] = (arr[:, 1:, :].astype(np.int16) - arr[:, :-1, :].astype(np.int16)) & 0xFF
    raw = np.empty((h, w * 3 + 1), dtype=np.uint8)
    raw[:, 0] = 1
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
    Returns (edge_dist, d1, cell_val).
    """
    rng = np.random.default_rng(seed)
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


def _height_to_normal_top_down(height_01, strength=3.8):
    """
    Convert a top-down [0, 1] heightmap (row 0 = top / UV v=1.0) to OpenGL/glTF 2.0
    tangent-space RGB normal map.
    """
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
    1024x1024 Ankylosaurus magniventris armored carapace hide albedo, grayscale bump
    (preserved for build_minions_glb.py / build_campaign_bosses_glb.py), and tangent normal.
    UV u=0/1 -> dorsal carapace (deep weathered charcoal-olive & slate-moss),
    u=0.25/0.75 -> armored flanks (weathered olive-stone & warm taupe),
    u=0.50 -> ventral throat/chest/belly (warm pale sandstone-buff pebble scales).
    """
    size = 1024
    u_row = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)
    v_col = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)
    uu, vv = np.meshgrid(u_row, v_col)

    # 1. Portrait-faithful dorsal-to-ventral gradient matching assets/portraits/ankylo.png
    # Broad warm sandstone-taupe throat/chest/belly zone (u=0.32..0.68) so pebbled jowl flows seamlessly into neck!
    stops = [
        (0.00, "#2f3628"),  # Deep dorsal weathered charcoal-olive carapace
        (0.14, "#444c3a"),  # Upper carapace weathered slate-moss
        (0.25, "#5d624c"),  # Mid-flank olive-stone with warm mineral undertones
        (0.34, "#7f7960"),  # Lower flank & side-neck stone-taupe transition
        (0.42, "#9c9176"),  # Sub-ventral warm weathered sandstone-taupe
        (0.50, "#aea286"),  # Ventral chest, throat & belly warm stone-buff pebbles
        (0.58, "#9c9176"),
        (0.66, "#7f7960"),
        (0.75, "#5d624c"),
        (0.86, "#444c3a"),
        (1.00, "#2f3628"),
    ]
    base_rgb = _gradient_1d(uu, stops)

    # 2. Organic weathered armor mottling & subtle dark transverse carapace bands
    fbm_macro = _tileable_fbm(size, base_freq=4, octaves=4, seed=2041)
    fbm_mid = _tileable_fbm(size, base_freq=8, octaves=4, seed=2089)
    fbm_fine = _tileable_fbm(size, base_freq=24, octaves=3, seed=2153)

    dorsal_mask = np.clip((np.abs(uu - 0.5) - 0.12) / 0.24, 0.0, 1.0)
    band_wave = np.sin((vv * 8.0 + fbm_macro * 2.4) * math.pi * 2.0)
    dark_band = np.clip((band_wave + 0.12) * 0.72 + (fbm_mid - 0.48) * 0.85, 0.0, 1.0) * dorsal_mask
    dark_col = np.array([24.0, 28.0, 20.0], dtype=np.float32)
    mineral_col = np.array([152.0, 142.0, 114.0], dtype=np.float32)

    col = base_rgb * (1.0 - 0.42 * dark_band[..., None]) + dark_col * (0.42 * dark_band[..., None])
    mineral_dust = np.clip((fbm_mid - 0.46) * 2.2, 0.0, 1.0) * (1.0 - dark_band * 0.55) * dorsal_mask
    col = col * (1.0 - 0.28 * mineral_dust[..., None]) + mineral_col * (0.28 * mineral_dust[..., None])

    # 3. Dual-scale snug Voronoi cobblestone osteoderm hide!
    # Bold armored mosaic scutes on back & shoulders, snug rounded pebbles on chest/belly/legs
    warp_u = (fbm_mid - 0.5) * 0.016
    warp_v = (_tileable_fbm(size, base_freq=8, octaves=3, seed=2213) - 0.5) * 0.016
    edge_armor, d1_armor, cv_armor = _voronoi_scales(size, 52, 52, seed=3109, jitter=0.72, warp_u=warp_u, warp_v=warp_v)
    edge_peb, d1_peb, cv_peb = _voronoi_scales(size, 98, 98, seed=3301, jitter=0.68, warp_u=warp_u * 0.7, warp_v=warp_v * 0.7)

    ventral_blend = np.exp(-((uu - 0.5) / 0.16) ** 2)
    # Chunkier, flatter-topped beveled polygonal armor tiles dorsally; rounder snug pebbles ventrally
    dome_armor = np.clip(edge_armor / 0.14, 0.0, 1.0) ** 0.44 * (1.0 - 0.18 * np.clip(d1_armor, 0.0, 1.0) ** 2)
    dome_peb = np.clip(edge_peb / 0.18, 0.0, 1.0) ** 0.54 * (1.0 - 0.22 * np.clip(d1_peb, 0.0, 1.0) ** 2)

    scale_height = dome_armor * (1.0 - 0.72 * ventral_blend) + dome_peb * (0.28 + 0.72 * ventral_blend)
    mortar_armor = 1.0 - np.clip(edge_armor / 0.095, 0.0, 1.0)
    mortar_peb = 1.0 - np.clip(edge_peb / 0.110, 0.0, 1.0)
    mortar = mortar_armor * (1.0 - 0.65 * ventral_blend) + mortar_peb * (0.35 + 0.65 * ventral_blend)
    cell_var = cv_armor * (1.0 - ventral_blend) + cv_peb * ventral_blend

    # 4. Scattered small raised ossified dermal rosettes embedded between carapace scutes
    _, d1_ros, cv_ros = _voronoi_scales(size, 20, 20, seed=4111, jitter=0.78)
    ros_active = (cv_ros > 0.70).astype(np.float32) * dorsal_mask
    ros_bump = np.clip(1.0 - d1_ros / 0.28, 0.0, 1.0) ** 1.35 * ros_active

    # 5. Subtle organic transverse dermal flex creases across neck/flanks
    fold_wave = 0.5 + 0.5 * np.cos((vv * 14.0 + fbm_macro * 2.6 + np.abs(uu - 0.5) * 0.9) * math.pi * 2.0)
    fold_groove = (np.clip((0.22 - fold_wave) / 0.22, 0.0, 1.0) ** 1.8) * (0.35 + 0.65 * fbm_mid)

    # Shade albedo with per-scale tonal diversity, crisp dark AO mortar seams & sunlit crowns
    scale_tint = (cell_var - 0.5) * 32.0
    col = col + scale_tint[..., None] * np.array([1.0, 0.96, 0.80], dtype=np.float32)

    mortar_col = np.array([15.0, 17.0, 12.0], dtype=np.float32)
    col = col * (1.0 - 0.66 * mortar[..., None]) + mortar_col * (0.66 * mortar[..., None])

    crown_hi = np.clip((scale_height - 0.60) / 0.40, 0.0, 1.0) * 0.24 + ros_bump * 0.30
    hi_col = np.array([178.0, 168.0, 138.0], dtype=np.float32)
    col = col * (1.0 - crown_hi[..., None]) + hi_col * crown_hi[..., None]

    # Micro stone-grain patina across each scale surface
    col = col + ((fbm_fine - 0.5) * 16.0)[..., None] * np.array([1.0, 0.96, 0.86], dtype=np.float32)
    col = col * (1.0 - 0.16 * fold_groove[..., None])

    height = np.clip(
        0.34
        + 0.46 * scale_height
        - 0.24 * mortar
        + 0.26 * ros_bump
        - 0.12 * fold_groove
        + (fbm_fine - 0.5) * 0.08,
        0.0,
        1.0,
    )

    albedo_u8 = np.clip(col, 0.0, 255.0).astype(np.uint8)
    bump_gray = np.clip(height * 255.0, 0.0, 255.0).astype(np.uint8)
    bump_rgb = np.stack([bump_gray, bump_gray, bump_gray], axis=-1)
    normal_rgb = _height_to_normal_top_down(height, strength=4.6)

    _save_png_rgb(os.path.join(TEX_DIR, "ankylo_albedo.png"), albedo_u8)
    _save_png_rgb(os.path.join(TEX_DIR, "ankylo_bump.png"), bump_rgb)
    _save_png_rgb(os.path.join(TEX_DIR, "ankylo_normal.png"), normal_rgb)
    print("[TEX OK] ankylo_albedo/bump/normal.png")


def _draw_sdf_scratches(size, uu, vv, n_scratches, seed, min_len=0.08, max_len=0.28, width_range=(0.0025, 0.0055), v_min=0.18):
    """Vectorized SDF battle-scar scratches (short linear/gently arched gouges, no contour loops)."""
    rng = np.random.default_rng(seed)
    mask = np.zeros((size, size), dtype=np.float32)
    for _ in range(n_scratches):
        x0 = rng.uniform(0.05, 0.95)
        y0 = rng.uniform(v_min, 0.94)
        length = rng.uniform(min_len, max_len)
        ang = rng.uniform(-math.pi, math.pi)
        x1 = x0 + math.cos(ang) * length
        y1 = y0 + math.sin(ang) * length
        w = rng.uniform(width_range[0], width_range[1])
        dx = x1 - x0
        dy = y1 - y0
        len2 = dx * dx + dy * dy + 1e-10
        # Periodic delta in U for seamless wrap
        du = ((uu - x0 + 0.5) % 1.0) - 0.5
        dv = vv - y0
        t = np.clip((du * dx + dv * dy) / len2, 0.0, 1.0)
        dist = np.sqrt((du - t * dx) ** 2 + (dv - t * dy) ** 2)
        taper = np.maximum(0.0, np.sin(t * math.pi)) ** 0.6
        w_eff = np.maximum(1e-4, w * taper)
        s_val = np.clip(1.0 - (dist / w_eff) ** 1.6, 0.0, 1.0) * taper
        mask = np.maximum(mask, s_val)
    return mask


def generate_cranium_armor_maps():
    """
    640x640 portrait-faithful fused cranial caputegulae & pebbled jowl albedo + normal.
    UV u=0/1 -> armored polygonal cranial mosaic tiles on crown/nasal bridge/brow,
    u=0.25/0.75 -> cheek/orbital scales,
    u=0.50 -> warm sandstone-taupe pebbled mandible/jowl/chin (matching portrait!).
    """
    size = 640
    u_row = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)
    v_col = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)
    uu, vv = np.meshgrid(u_row, v_col)

    stops = [
        (0.00, "#384032"),  # Dorsal fused caputegulae olive-slate crown
        (0.18, "#525845"),  # Supraorbital & temporal mosaic olive-taupe
        (0.32, "#6e6c56"),  # Cheek armor warm stone-olive transition
        (0.42, "#92886f"),  # Lower jaw warm weathered taupe pebbles
        (0.50, "#a89c80"),  # Chin & jowl warm sandstone-buff pebbles (harmonized with throat!)
        (0.58, "#92886f"),
        (0.68, "#6e6c56"),
        (0.82, "#525845"),
        (1.00, "#384032"),
    ]
    col = _gradient_1d(uu, stops)
    fbm_macro = _tileable_fbm(size, base_freq=6, octaves=4, seed=6391)
    fbm_fine = _tileable_fbm(size, base_freq=28, octaves=3, seed=6449)

    warp_u = (fbm_macro - 0.5) * 0.014
    warp_v = (_tileable_fbm(size, base_freq=6, octaves=3, seed=6521) - 0.5) * 0.014

    # Large bold armored polygonal caputegulae tiles on skull roof & snout bridge (matching portrait!)
    edge_cap, d1_cap, cv_cap = _voronoi_scales(size, 26, 28, seed=6607, jitter=0.66, warp_u=warp_u, warp_v=warp_v)
    # Tighter cobblestone cheek & jowl pebbles
    edge_chk, d1_chk, cv_chk = _voronoi_scales(size, 62, 64, seed=6719, jitter=0.68, warp_u=warp_u * 0.6, warp_v=warp_v * 0.6)
    # Fine micro-pebbles around lips/orbit
    edge_mic, d1_mic, cv_mic = _voronoi_scales(size, 112, 112, seed=6823, jitter=0.65)

    crown_mask = np.clip((np.abs(uu - 0.5) - 0.17) / 0.21, 0.0, 1.0)
    jowl_mask = np.exp(-((uu - 0.5) / 0.15) ** 2)

    dome_cap = np.clip(edge_cap / 0.13, 0.0, 1.0) ** 0.38 * (1.0 - 0.14 * np.clip(d1_cap, 0.0, 1.0) ** 2)
    dome_chk = np.clip(edge_chk / 0.16, 0.0, 1.0) ** 0.48 * (1.0 - 0.20 * np.clip(d1_chk, 0.0, 1.0) ** 2)
    dome_mic = np.clip(edge_mic / 0.20, 0.0, 1.0) ** 0.55

    scale_h = dome_cap * crown_mask + dome_chk * (1.0 - crown_mask) * (0.78 + 0.22 * jowl_mask) + dome_mic * 0.12 * (1.0 - crown_mask)

    mortar_cap = 1.0 - np.clip(edge_cap / 0.088, 0.0, 1.0)
    mortar_chk = 1.0 - np.clip(edge_chk / 0.105, 0.0, 1.0)
    mortar = mortar_cap * crown_mask + mortar_chk * (1.0 - crown_mask)
    cval = cv_cap * crown_mask + cv_chk * (1.0 - crown_mask)

    # Rich mineral-olive / warm stone variation per cranial plate
    col = col + ((cval - 0.5) * 34.0)[..., None] * np.array([1.0, 0.96, 0.80], dtype=np.float32)
    # Deep dark bony suture grooves between cranial caputegulae & cheek pebbles
    mortar_col = np.array([14.0, 16.0, 12.0], dtype=np.float32)
    col = col * (1.0 - 0.72 * mortar[..., None]) + mortar_col * (0.72 * mortar[..., None])

    # Warm sunlit mineral patina on raised caputegulae crowns (portrait signature!)
    crown_hi = np.clip((scale_h - 0.58) / 0.42, 0.0, 1.0) * (0.28 * crown_mask + 0.18 * (1.0 - crown_mask))
    col = col * (1.0 - crown_hi[..., None]) + np.array([186.0, 176.0, 146.0], dtype=np.float32) * crown_hi[..., None]

    # Subtle weathered neurovascular micro-pitting & bone grain
    pits = np.clip((0.24 - fbm_fine) / 0.24, 0.0, 1.0) * crown_mask
    col = col * (1.0 - 0.22 * pits[..., None]) + ((fbm_fine - 0.5) * 16.0)[..., None]

    height = np.clip(
        0.34 + 0.52 * scale_h - 0.28 * mortar - 0.10 * pits + (fbm_fine - 0.5) * 0.08,
        0.0,
        1.0,
    )

    _save_png_rgb(os.path.join(TEX_DIR, "ankylo_cranium_albedo.png"), np.clip(col, 0.0, 255.0).astype(np.uint8))
    _save_png_rgb(os.path.join(TEX_DIR, "ankylo_cranium_normal.png"), _height_to_normal_top_down(height, strength=4.8))
    print("[TEX OK] ankylo_cranium_albedo/normal.png")


def generate_scute_maps():
    """
    384x384 weathered osteoderm shield & marginal carapace flange spike albedo + normal.
    UV v=0 (bottom) = dark charcoal-olive dermal root collar seamlessly merging with hide,
    v=0.45..0.82 = striated weathered olive-stone & warm taupe osteoderm slope,
    v=0.90..1.00 = sunlit worn mineral-taupe keel crest & darkened weathered spike tip.
    Matches the earthy olive-stone back & flank armor of assets/portraits/ankylo.png!
    """
    size = 384
    u_row = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)
    v_col = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)
    uu, vv = np.meshgrid(u_row, v_col)

    stops = [
        (0.00, "#2f3529"),  # Weathered charcoal-moss dermal root collar (v=0)
        (0.14, "#4b513f"),  # Basal weathered slate-olive rim
        (0.42, "#6d6c55"),  # Mid-slope weathered olive-stone bone
        (0.74, "#94886c"),  # Warm weathered mineral-taupe upper keel slope
        (0.92, "#aba080"),  # Sunlit worn pale stone-bone crest highlight
        (1.00, "#85765a"),  # Slightly worn darkened apex tip (v=1)
    ]
    col = _gradient_1d(vv, stops)

    fbm_macro = _tileable_fbm(size, base_freq=6, octaves=4, seed=7741)
    fbm_mid = _tileable_fbm(size, base_freq=14, octaves=3, seed=7817)
    fbm_fine = _tileable_fbm(size, base_freq=32, octaves=3, seed=7901)

    # Organic radiating bony osteoderm striations running base -> keel (along V)
    flute_a = 0.5 + 0.5 * np.sin((uu * 24.0 + (fbm_macro - 0.5) * 1.8) * math.pi * 2.0) * (0.55 + 0.45 * fbm_mid)
    flute_b = 0.5 + 0.5 * np.sin((uu * 64.0 + (fbm_mid - 0.5) * 2.2) * math.pi * 2.0)

    # Subtle basal polygonal collar scales where skin meets osteoderm root (v < 0.25)
    edge_root, _, _ = _voronoi_scales(size, 36, 36, seed=7993, jitter=0.68)
    root_mask = np.clip((0.28 - vv) / 0.28, 0.0, 1.0)
    root_mortar = (1.0 - np.clip(edge_root / 0.14, 0.0, 1.0)) * root_mask

    # Fine vascular bone pitting & mineral wear across exposed osteoderm faces
    pits = np.clip((0.26 - fbm_fine) / 0.26, 0.0, 1.0) * (1.0 - root_mask * 0.7)
    wear = np.clip((fbm_macro - 0.52) * 2.4, 0.0, 1.0) * np.clip((vv - 0.35) / 0.65, 0.0, 1.0)

    # Authentic linear battle scratches across upper osteoderm face
    scratches = _draw_sdf_scratches(size, uu, vv, n_scratches=24, seed=7933, min_len=0.06, max_len=0.22, width_range=(0.003, 0.006), v_min=0.28)

    col = col + ((flute_a - 0.5) * 26.0 + (flute_b - 0.5) * 12.0 + (fbm_mid - 0.5) * 20.0)[..., None] * np.array([1.0, 0.95, 0.80], dtype=np.float32)
    col = col + wear[..., None] * np.array([34.0, 30.0, 20.0], dtype=np.float32)
    col = col * (1.0 - 0.42 * pits[..., None])
    col = col * (1.0 - 0.52 * root_mortar[..., None])
    col = col * (1.0 - 0.35 * scratches[..., None]) + np.array([172.0, 162.0, 134.0], dtype=np.float32) * (0.35 * scratches[..., None])

    height = np.clip(
        0.50
        + (flute_a - 0.5) * 0.24
        + (flute_b - 0.5) * 0.10
        - 0.20 * pits
        - 0.18 * root_mortar
        - 0.18 * scratches
        + (fbm_fine - 0.5) * 0.10,
        0.0,
        1.0,
    )

    _save_png_rgb(os.path.join(TEX_DIR, "ankylo_scute_albedo.png"), np.clip(col, 0.0, 255.0).astype(np.uint8))
    _save_png_rgb(os.path.join(TEX_DIR, "ankylo_scute_normal.png"), _height_to_normal_top_down(height, strength=4.2))
    print("[TEX OK] ankylo_scute_albedo/normal.png")


def generate_club_maps():
    """
    384x384 dedicated monumental ossified tail-club boulder albedo + normal.
    Weathered dark slate-olive & mineral-stone dermal bone with deep osteoderm sutures,
    dense vascular pitting, and pale battle-worn bone-taupe impact ridges along the
    outer smashing faces (u near 0.25 & 0.75) — zero blurry polka-dots!
    """
    size = 384
    u_row = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)
    v_col = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)
    uu, vv = np.meshgrid(u_row, v_col)

    # Impact-wear along outer lateral keel equator (u=0.25 and u=0.75) & heavy bone body
    lat_keel = np.abs(np.sin(uu * math.pi * 2.0)) ** 1.6
    stops = [
        (0.00, "#2b3126"),  # Deep charcoal-moss ossified crevice tone
        (0.35, "#4d5241"),  # Rugged weathered slate-olive boulder bone
        (0.72, "#7d765e"),  # Warm weathered mineral-taupe osteoderm dome
        (1.00, "#aba084"),  # Impact-worn pale stone-bone smashing keel
    ]
    col = _gradient_1d(lat_keel, stops)

    fbm_macro = _tileable_fbm(size, base_freq=5, octaves=4, seed=8209)
    fbm_mid = _tileable_fbm(size, base_freq=12, octaves=4, seed=8291)
    fbm_fine = _tileable_fbm(size, base_freq=32, octaves=3, seed=8387)

    # Tightly fused irregular bony osteoderm plates welded across the boulder club
    warp_u = (fbm_mid - 0.5) * 0.022
    warp_v = (_tileable_fbm(size, base_freq=10, octaves=3, seed=8461) - 0.5) * 0.022
    edge_b, d1_b, cv_b = _voronoi_scales(size, 18, 18, seed=8527, jitter=0.74, warp_u=warp_u, warp_v=warp_v)
    dome_b = np.clip(edge_b / 0.15, 0.0, 1.0) ** 0.45 * (1.0 - 0.16 * np.clip(d1_b, 0.0, 1.0) ** 2)
    suture_b = 1.0 - np.clip(edge_b / 0.085, 0.0, 1.0)

    # Longitudinal ossification striations & heavy bone pores
    fibers = 0.5 + 0.5 * np.sin((vv * 22.0 + fbm_macro * 4.5 + uu * 4.0) * math.pi * 2.0)
    pits = np.clip((0.28 - fbm_fine) / 0.28, 0.0, 1.0)

    # Authentic linear battle gouges & impact chip scars across smashing zones
    gouges = _draw_sdf_scratches(size, uu, vv, n_scratches=32, seed=8609, min_len=0.07, max_len=0.25, width_range=(0.003, 0.0075), v_min=0.08) * (0.40 + 0.60 * lat_keel)

    col = col + ((cv_b - 0.5) * 28.0 + (fbm_macro - 0.5) * 24.0 + (fibers - 0.5) * 14.0)[..., None] * np.array([1.0, 0.96, 0.84], dtype=np.float32)
    col = col * (1.0 - 0.62 * suture_b[..., None]) + np.array([16.0, 18.0, 13.0], dtype=np.float32) * (0.62 * suture_b[..., None])
    col = col * (1.0 - 0.34 * pits[..., None])
    # Dark incised groove with subtle pale scraped-bone rim highlight
    col = col * (1.0 - 0.42 * gouges[..., None]) + np.array([196.0, 186.0, 156.0], dtype=np.float32) * (0.42 * gouges[..., None])

    height = np.clip(
        0.42
        + 0.34 * dome_b
        - 0.24 * suture_b
        - 0.18 * pits
        - 0.24 * gouges
        + (fibers - 0.5) * 0.08
        + (fbm_fine - 0.5) * 0.10,
        0.0,
        1.0,
    )

    _save_png_rgb(os.path.join(TEX_DIR, "ankylo_club_albedo.png"), np.clip(col, 0.0, 255.0).astype(np.uint8))
    _save_png_rgb(os.path.join(TEX_DIR, "ankylo_club_normal.png"), _height_to_normal_top_down(height, strength=4.8))
    print("[TEX OK] ankylo_club_albedo/normal.png")


def generate_horn_spike_maps():
    """
    384x384 portrait-faithful warm honey-ochre / weathered golden-amber cranial horn
    (squamosal & jugal horns, cheek boss, and blunt hooves) albedo + normal.
    UV v=0 (bottom) = dark weathered olive-umber keratin root collar ->
       v=0.45..0.82 = rich warm honey-ochre / aged amber-bone mid-shaft ->
       v=1.00 (top) = worn weathered dark-amber keratin tip.
    """
    size = 384
    u_row = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)
    v_col = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)
    uu, vv = np.meshgrid(u_row, v_col)

    # Exact honey-ochre keratin gradient sampled from assets/portraits/ankylo.png!
    stops = [
        (0.00, "#2f2a1f"),  # Dark dermal-keratin root collar (v=0)
        (0.12, "#56432b"),  # Deep weathered umber horn base
        (0.32, "#927045"),  # Rich warm ochre-amber lower horn
        (0.62, "#ba9560"),  # Warm golden honey-ochre mid-shaft
        (0.84, "#c9a876"),  # Sunlit pale weathered bone-amber upper horn
        (0.94, "#8a6d49"),  # Weathered upper taper
        (1.00, "#4f3d29"),  # Worn dark-amber blunt tip (v=1)
    ]
    col = _gradient_1d(vv, stops)
    fbm_macro = _tileable_fbm(size, base_freq=6, octaves=4, seed=5583)
    fbm_mid = _tileable_fbm(size, base_freq=14, octaves=3, seed=5641)
    fbm_fine = _tileable_fbm(size, base_freq=32, octaves=3, seed=5717)

    # Natural organic longitudinal keratin sulci (broken by fBm — zero synthetic wood-stripe look!)
    flute_a = 0.5 + 0.5 * np.sin((uu * 28.0 + (fbm_macro - 0.5) * 1.6) * math.pi * 2.0) * (0.50 + 0.50 * fbm_mid)
    flute_b = 0.5 + 0.5 * np.sin((uu * 76.0 + (fbm_mid - 0.5) * 2.0) * math.pi * 2.0)

    # Organic wavy keratin growth rings near base (v < 0.45)
    ring_env = np.clip(1.0 - vv / 0.48, 0.0, 1.0) ** 1.3
    rings = (0.5 + 0.5 * np.sin((vv * 16.0 + fbm_macro * 2.0 + np.sin(uu * math.pi * 6.0) * 0.16) * math.pi * 2.0)) * ring_env

    # Subtle dark weathered fissures & pale scraped wear marks
    col = col + ((flute_a - 0.5) * 24.0 + (flute_b - 0.5) * 10.0 + (fbm_macro - 0.5) * 22.0 - rings * 20.0)[..., None] * np.array([1.0, 0.90, 0.72], dtype=np.float32)

    height = np.clip(
        0.50
        + (flute_a - 0.5) * 0.24
        + (flute_b - 0.5) * 0.10
        - rings * 0.20
        + (fbm_fine - 0.5) * 0.08,
        0.0,
        1.0,
    )

    _save_png_rgb(os.path.join(TEX_DIR, "ankylo_horn_albedo.png"), np.clip(col, 0.0, 255.0).astype(np.uint8))
    _save_png_rgb(os.path.join(TEX_DIR, "ankylo_horn_normal.png"), _height_to_normal_top_down(height, strength=3.4))
    print("[TEX OK] ankylo_horn_albedo/normal.png")


def generate_beak_maps():
    """
    384x384 dark charcoal-umber striated keratinous turtle-like cropping beak
    matching assets/portraits/ankylo.png.
    UV v=0 (bottom) = nasal base sheath -> v=1 (top) = dark worn cutting rim.
    """
    size = 384
    u_row = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)
    v_col = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)
    uu, vv = np.meshgrid(u_row, v_col)

    stops = [
        (0.00, "#4b4538"),  # Warm weathered olive-taupe rostral sheath border (v=0)
        (0.24, "#3b342b"),  # Weathered dark walnut-charcoal keratin
        (0.58, "#29241e"),  # Deep charcoal-umber mid beak
        (0.84, "#1d1915"),  # Worn cutting tomium
        (1.00, "#14110e"),  # Darkest slate-obsidian cropping tip (v=1)
    ]
    col = _gradient_1d(vv, stops)
    fbm = _tileable_fbm(size, base_freq=8, octaves=3, seed=3917)
    fbm_fine = _tileable_fbm(size, base_freq=28, octaves=3, seed=3989)

    flutes = 0.5 + 0.5 * np.sin((uu * 56.0 + (fbm - 0.5) * 1.1) * math.pi * 2.0)
    fine_lines = 0.5 + 0.5 * np.sin((uu * 136.0 + fbm * 2.0) * math.pi * 2.0)
    wear = np.clip((fbm - 0.56) * 2.4, 0.0, 1.0) * np.clip(vv * 1.4, 0.0, 1.0)

    col = col + ((flutes - 0.5) * 22.0 + (fine_lines - 0.5) * 10.0)[..., None] * np.array([1.0, 0.92, 0.80], dtype=np.float32)
    col = col + wear[..., None] * np.array([34.0, 28.0, 20.0], dtype=np.float32)
    height = np.clip(
        0.50 + (flutes - 0.5) * 0.26 + (fine_lines - 0.5) * 0.12 + (fbm_fine - 0.5) * 0.08,
        0.0,
        1.0,
    )

    _save_png_rgb(os.path.join(TEX_DIR, "ankylo_beak_albedo.png"), np.clip(col, 0.0, 255.0).astype(np.uint8))
    _save_png_rgb(os.path.join(TEX_DIR, "ankylo_beak_normal.png"), _height_to_normal_top_down(height, strength=3.4))
    print("[TEX OK] ankylo_beak_albedo/normal.png")


def generate_eye_iris_map():
    """256x256 fierce deep golden-amber reptile iris matching assets/portraits/ankylo.png."""
    size = 256
    coords = np.linspace(-1.0, 1.0, size, dtype=np.float32)
    xx, yy = np.meshgrid(coords, coords)
    r = np.sqrt(xx * xx + yy * yy)
    ang = np.arctan2(yy, xx)
    r_norm = np.clip((r - 0.18) / 0.78, 0.0, 1.0)

    stops = [
        (0.00, "#fde68a"),  # Luminous golden inner pupillary ring
        (0.24, "#ea8c16"),  # Rich vivid warm amber
        (0.58, "#b45309"),  # Deep burnt-honey amber iris body
        (0.84, "#5c2508"),  # Dark umber limbal ring
        (1.00, "#140803"),  # Deep orbital sclera shadow
    ]
    col = _gradient_1d(r_norm, stops)

    fibers = 0.5 + 0.5 * np.sin(ang * 40.0 + np.sin(r * 16.0) * 1.1)
    fibers2 = 0.5 + 0.5 * np.cos(ang * 84.0 - r * 10.0)
    fiber_mask = np.clip(1.0 - np.abs(r_norm - 0.44) * 1.85, 0.0, 1.0)
    col = col + ((fibers - 0.5) * 42.0 + (fibers2 - 0.5) * 20.0)[..., None] * fiber_mask[..., None] * np.array([1.0, 0.76, 0.34], dtype=np.float32)

    _save_png_rgb(os.path.join(TEX_DIR, "ankylo_iris_albedo.png"), np.clip(col, 0.0, 255.0).astype(np.uint8))
    print("[TEX OK] ankylo_iris_albedo.png")


def main():
    generate_body_hide_maps()
    generate_cranium_armor_maps()
    generate_scute_maps()
    generate_club_maps()
    generate_horn_spike_maps()
    generate_beak_maps()
    generate_eye_iris_map()


if __name__ == "__main__":
    main()
