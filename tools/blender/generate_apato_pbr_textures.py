"""
tools/blender/generate_apato_pbr_textures.py
Generates high-resolution 1024x1024 / 512x512 / 384x384 / 256x256 PBR textures
for the Apatosaurus ajax / louisae GLB model in assets/textures/fighters/, uniting:
  - Game portrait palette & sculptural surface details (assets/portraits/apato.png):
    weathered Morrison stone-grey & basalt-charcoal cobblestone sauropod scales,
    deep obsidian mortar crevices, dusty warm limestone scale-crown highlights,
    heavy transverse throat/neck/shoulder flexion creases, subtle ancient battle scars,
    and fierce molten amber-orange reptile eyes.
  - Paleontological & paleoart inspiration (Czerkas Howe Quarry diplodocid skin
    impressions, Mark Witton / Prehistoric Planet sauropod reconstructions):
    non-overlapping polygonal granular scales with scattered larger dermal rosettes,
    naturalistic subtle dorsal-to-flank slate countershading & weathered vertical
    brindle bands, warm stone-ash ventral underbelly, dark fluted keratinous dorsal
    dermal spines, heavy striated dark-horn pollex & pes claws, and weathered ivory
    diplodocid peg teeth.

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


def _voronoi_scales(size, nx, ny, seed=7, jitter=0.70, warp_u=None, warp_v=None):
    """
    Tileable cellular Voronoi generator for true non-overlapping sauropod polygonal scales.
    Returns:
      edge_dist: distance to nearest Voronoi cell border (in cell units, 0 at mortar seam)
      d1: distance to nearest cell center (in cell units)
      cell_val: deterministic [0, 1] random value per scale cell
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
    """Convert top-down [0, 1] heightmap (row 0 = UV v=1.0) to OpenGL/glTF tangent normal map."""
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
    1024x1024 Apatosaurus ajax hide albedo, grayscale bump, and tangent normal map.
    UV u=0/1 -> dorsal midline (deep weathered basalt-slate charcoal),
    u=0.25/0.75 -> muscular flanks (Morrison stone grey with subtle dark brindle saddles
                   and warm dusty limestone highlights),
    u=0.5 -> ventral belly & lower neck/throat (lighter warm ash-limestone countershading).
    """
    size = 1024
    u_row = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)
    v_col = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)  # row 0 = v=1.0
    uu, vv = np.meshgrid(u_row, v_col)

    # 1. Base dorsal-to-ventral Morrison Stone Grey palette matched to apato.png & apatosaurus.js
    #    Deep weathered basalt-charcoal crest -> Morrison stone flanks -> warm limestone-ash underbelly
    stops = [
        (0.00, "#242322"),  # Dorsal spine deep basalt-obsidian charcoal
        (0.11, "#393735"),  # Upper back dark Morrison basalt
        (0.23, "#55524d"),  # Mid-upper flank classic Morrison stone grey
        (0.35, "#726c62"),  # Lower flank weathered warm taupe-stone
        (0.44, "#968e80"),  # Sub-ventral warm ash-limestone transition
        (0.50, "#b5ac9c"),  # Ventral belly & throat pale sunlit limestone-ash
        (0.56, "#968e80"),
        (0.65, "#726c62"),
        (0.77, "#55524d"),
        (0.89, "#393735"),
        (1.00, "#242322"),
    ]
    base_rgb = _gradient_1d(uu, stops)

    # 2. Naturalistic prehistoric camouflage mottling: subtle dark basalt-slate saddle bars
    #    & warm dusty ochre-stone mineral weathering (Mark Witton / Prehistoric Planet inspired!)
    fbm_macro = _tileable_fbm(size, base_freq=4, octaves=4, seed=307)
    fbm_mid = _tileable_fbm(size, base_freq=8, octaves=3, seed=521)
    fbm_fine = _tileable_fbm(size, base_freq=20, octaves=3, seed=769)

    dorsal_mask = np.where(np.abs(uu - 0.5) < 0.14, 0.0, np.clip((np.abs(uu - 0.5) - 0.14) / 0.22, 0.0, 1.0))

    # Organic broken transverse dark basalt-slate stripes fading naturally down the flanks
    stripe_phase = np.sin((vv * 8.0 + fbm_macro * 2.9) * math.pi * 2.0)
    saddle_mask = np.clip((stripe_phase + 0.12) * 0.85 + (fbm_mid - 0.46) * 0.90, 0.0, 1.0) * dorsal_mask
    # Subtle cool slate-charcoal shadow tone on dorsal bands for painterly depth
    dark_slate_col = np.array([24.0, 26.0, 29.0], dtype=np.float32)
    warm_dust_col = np.array([154.0, 142.0, 122.0], dtype=np.float32)

    col = base_rgb * (1.0 - 0.54 * saddle_mask[..., None]) + dark_slate_col * (0.54 * saddle_mask[..., None])
    dust_fleck = np.clip((fbm_mid - 0.48) * 2.2, 0.0, 1.0) * (1.0 - saddle_mask * 0.55) * (0.45 + 0.55 * dorsal_mask)
    col = col * (1.0 - 0.28 * dust_fleck[..., None]) + warm_dust_col * (0.28 * dust_fleck[..., None])

    # 3. Dual-scale tileable Voronoi cobblestone sauropod scales (Howe Quarry & apato.png!)
    warp_u = (fbm_mid - 0.5) * 0.016
    warp_v = (_tileable_fbm(size, base_freq=8, octaves=3, seed=911) - 0.5) * 0.016
    edge_big, d1_big, cv_big = _voronoi_scales(size, 62, 62, seed=1301, jitter=0.72, warp_u=warp_u, warp_v=warp_v)
    edge_med, d1_med, cv_med = _voronoi_scales(size, 118, 118, seed=2411, jitter=0.70, warp_u=warp_u * 0.65, warp_v=warp_v * 0.65)

    # Larger armored polygonal cobblestone scales on back/neck/upper flanks, finer pebble scales on belly
    ventral_blend = np.exp(-((uu - 0.5) / 0.16) ** 2)
    dome_big = np.clip(edge_big / 0.17, 0.0, 1.0) ** 0.50 * (1.0 - 0.24 * np.clip(d1_big, 0.0, 1.0) ** 2)
    dome_med = np.clip(edge_med / 0.19, 0.0, 1.0) ** 0.54 * (1.0 - 0.20 * np.clip(d1_med, 0.0, 1.0) ** 2)

    scale_height = dome_big * (1.0 - 0.64 * ventral_blend) + dome_med * (0.36 + 0.64 * ventral_blend)
    mortar_big = 1.0 - np.clip(edge_big / 0.098, 0.0, 1.0)
    mortar_med = 1.0 - np.clip(edge_med / 0.105, 0.0, 1.0)
    mortar = mortar_big * (1.0 - 0.58 * ventral_blend) + mortar_med * (0.42 + 0.58 * ventral_blend)
    cell_var = cv_big * (1.0 - ventral_blend) + cv_med * ventral_blend

    # 4. Raised armored dermal rosette osteoderm bosses along upper back, neck flanks & shoulders
    edge_ros, d1_ros, cv_ros = _voronoi_scales(size, 20, 20, seed=5717, jitter=0.80)
    ros_active = (cv_ros > 0.72).astype(np.float32) * dorsal_mask
    ros_bump = (np.clip(1.0 - d1_ros / 0.27, 0.0, 1.0) ** 1.35) * ros_active

    # 5. Deep organic sauropod flexion creases / leathery transverse folds (strongest on flanks & neck, softer across belly)
    fold_wave = 0.5 + 0.5 * np.cos((vv * 16.0 + fbm_macro * 3.4 + np.abs(uu - 0.5) * 1.6) * math.pi * 2.0)
    fold_groove = (np.clip((0.24 - fold_wave) / 0.24, 0.0, 1.0) ** 1.85) * (0.30 + 0.70 * fbm_mid) * (0.35 + 0.65 * dorsal_mask)

    # 6. Combine albedo shading: per-scale mineral tonal variation + deep obsidian crevices + dusty highlights
    scale_tint = (cell_var - 0.5) * 32.0
    col = col + scale_tint[..., None] * np.array([1.0, 0.96, 0.90], dtype=np.float32)

    # Deep obsidian-charcoal scale mortar crevices (essential for crisp portrait-grade scale relief!)
    mortar_col = np.array([18.0, 17.0, 16.0], dtype=np.float32)
    col = col * (1.0 - 0.62 * mortar[..., None]) + mortar_col * (0.62 * mortar[..., None])

    # Sunlit dusty limestone/ash specular highlight on raised cobblestone crowns & dermal rosettes
    crown_hi = np.clip((scale_height - 0.58) / 0.42, 0.0, 1.0) * 0.25 + ros_bump * 0.34
    hi_col = np.array([176.0, 169.0, 158.0], dtype=np.float32)
    col = col * (1.0 - crown_hi[..., None]) + hi_col * crown_hi[..., None]

    # Deepen transverse skin crease shadows
    col = col * (1.0 - 0.22 * fold_groove[..., None])

    # Assemble [0, 1] heightmap
    height = (
        0.38
        + 0.44 * scale_height
        - 0.24 * mortar
        + 0.28 * ros_bump
        - 0.16 * fold_groove
        + (fbm_fine - 0.5) * 0.07
    )
    height = np.clip(height, 0.0, 1.0)

    albedo_u8 = np.clip(col, 0.0, 255.0).astype(np.uint8)
    bump_gray = np.clip(height * 255.0, 0.0, 255.0).astype(np.uint8)
    bump_rgb = np.stack([bump_gray, bump_gray, bump_gray], axis=-1)
    normal_rgb = _height_to_normal_top_down(height, strength=4.4)

    _save_png_rgb(os.path.join(TEX_DIR, "apato_albedo.png"), albedo_u8)
    _save_png_rgb(os.path.join(TEX_DIR, "apato_bump.png"), bump_rgb)
    _save_png_rgb(os.path.join(TEX_DIR, "apato_normal.png"), normal_rgb)
    print("[TEX OK] apato_albedo/bump/normal.png")


def generate_cranium_maps():
    """
    512x512 rugged armored cranial scale hide matched directly to assets/portraits/apato.png:
    large chunky polygonal scales along brow ridge & nasal bridge, deep obsidian crevices,
    snug pebble scales along cheeks/lips/chin, warm weathered ash highlights, and subtle
    ancient battle scars on the cheek and snout.
    """
    size = 512
    u_row = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)
    v_col = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)
    uu, vv = np.meshgrid(u_row, v_col)

    stops = [
        (0.00, "#272625"),  # Crown & dorsal nasal bridge deep basalt charcoal (apato.png!)
        (0.16, "#3e3c39"),  # Supraorbital brow & upper snout weathered slate-stone
        (0.32, "#58544e"),  # Mid-cheek & maxilla rugged stone grey
        (0.44, "#777066"),  # Lower jaw / lip rim dusty warm stone
        (0.50, "#91897c"),  # Chin & underside of throat lighter warm stone-ash
        (0.56, "#777066"),
        (0.68, "#58544e"),
        (0.84, "#3e3c39"),
        (1.00, "#272625"),
    ]
    col = _gradient_1d(uu, stops)
    fbm = _tileable_fbm(size, base_freq=6, octaves=4, seed=6421)

    warp_u = (fbm - 0.5) * 0.014
    warp_v = (_tileable_fbm(size, base_freq=6, octaves=3, seed=6553) - 0.5) * 0.014
    edge_crown, d1_crown, cv_crown = _voronoi_scales(size, 34, 38, seed=7219, jitter=0.68, warp_u=warp_u, warp_v=warp_v)
    edge_cheek, d1_cheek, cv_cheek = _voronoi_scales(size, 76, 82, seed=7451, jitter=0.66, warp_u=warp_u * 0.6, warp_v=warp_v * 0.6)

    crown_mask = np.clip((np.abs(uu - 0.5) - 0.16) / 0.22, 0.0, 1.0)
    dome_c = np.clip(edge_crown / 0.18, 0.0, 1.0) ** 0.46 * (1.0 - 0.22 * np.clip(d1_crown, 0.0, 1.0) ** 2)
    dome_k = np.clip(edge_cheek / 0.20, 0.0, 1.0) ** 0.50 * (1.0 - 0.18 * np.clip(d1_cheek, 0.0, 1.0) ** 2)

    scale_h = dome_c * crown_mask + dome_k * (1.0 - crown_mask)
    mortar_c = 1.0 - np.clip(edge_crown / 0.105, 0.0, 1.0)
    mortar_k = 1.0 - np.clip(edge_cheek / 0.115, 0.0, 1.0)
    mortar = mortar_c * crown_mask + mortar_k * (1.0 - crown_mask)
    cval = cv_crown * crown_mask + cv_cheek * (1.0 - crown_mask)

    # Subtle diagonal healed battle scars on mid-snout/cheek (signature detail from apato.png!)
    scars = np.zeros((size, size), dtype=np.float32)
    scar_specs = [
        (0.24, 0.58, 0.31, 0.47, 0.0045),
        (0.27, 0.56, 0.33, 0.49, 0.0038),
        (0.76, 0.58, 0.69, 0.47, 0.0045),
        (0.73, 0.56, 0.67, 0.49, 0.0038),
    ]
    for x0, y0, x1, y1, rad in scar_specs:
        dx, dy = x1 - x0, y1 - y0
        l2 = dx * dx + dy * dy + 1e-8
        t = np.clip(((uu - x0) * dx + (vv - y0) * dy) / l2, 0.0, 1.0)
        dist = np.sqrt((uu - (x0 + t * dx)) ** 2 + (vv - (y0 + t * dy)) ** 2)
        env = np.clip(np.sin(t * math.pi), 0.0, 1.0) ** 0.6
        scars = np.maximum(scars, np.clip(1.0 - dist / rad, 0.0, 1.0) * env)

    col = col + ((cval - 0.5) * 32.0)[..., None] * np.array([1.0, 0.96, 0.90], dtype=np.float32)
    mortar_col = np.array([16.0, 15.0, 14.0], dtype=np.float32)
    col = col * (1.0 - 0.66 * mortar[..., None]) + mortar_col * (0.66 * mortar[..., None])

    # Crisp sunlit mineral stone highlights on big armored cranial bosses
    crown_hi = np.clip((scale_h - 0.56) / 0.44, 0.0, 1.0) * 0.28
    col = col * (1.0 - crown_hi[..., None]) + np.array([196.0, 188.0, 174.0], dtype=np.float32) * crown_hi[..., None]

    # Pale weathered scar flesh/edge tint
    col = col * (1.0 - 0.36 * scars[..., None]) + np.array([154.0, 134.0, 122.0], dtype=np.float32) * (0.36 * scars[..., None])

    height = np.clip(0.36 + 0.54 * scale_h - 0.26 * mortar - 0.18 * scars + (fbm - 0.5) * 0.06, 0.0, 1.0)

    _save_png_rgb(os.path.join(TEX_DIR, "apato_cranium_albedo.png"), np.clip(col, 0.0, 255.0).astype(np.uint8))
    _save_png_rgb(os.path.join(TEX_DIR, "apato_cranium_normal.png"), _height_to_normal_top_down(height, strength=4.6))
    print("[TEX OK] apato_cranium_albedo/normal.png")


def generate_spine_maps():
    """
    512x512 keratinous dorsal dermal spine & neck osteoderm boss texture.
    UV v=0 (base embedded in dorsal skin) -> v=1 (weathered striated stone-horn apex).
    Inspired by Czerkas Howe Quarry diplodocid spines & assets/portraits/apato.png.
    """
    size = 512
    u_row = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)
    v_col = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)
    uu, vv = np.meshgrid(u_row, v_col)

    stops = [
        (0.00, "#1d1c1b"),  # Dark dermal root socket (v=0)
        (0.20, "#2f2d2b"),  # Deep weathered basalt base
        (0.54, "#4b4742"),  # Rugged dark slate-horn mid ridge
        (0.82, "#645f57"),  # Sunlit weathered stone-horn upper spine
        (0.94, "#3a3733"),  # Worn dark keratin edge
        (1.00, "#22201d"),  # Dark charcoal tip (v=1)
    ]
    col = _gradient_1d(vv, stops)
    fbm = _tileable_fbm(size, base_freq=8, octaves=4, seed=8513)
    fbm_fine = _tileable_fbm(size, base_freq=20, octaves=3, seed=8627)

    # Longitudinal fibrous keratin flutes + subtle basal growth ridges
    flutes = 0.5 + 0.5 * np.sin((uu * 42.0 + (fbm - 0.5) * 1.6) * math.pi * 2.0)
    fine_flutes = 0.5 + 0.5 * np.sin((uu * 96.0 + (fbm_fine - 0.5) * 1.8) * math.pi * 2.0)
    growth = (0.5 + 0.5 * np.sin((vv * 16.0 + fbm * 2.0) * math.pi * 2.0)) * np.clip(1.0 - vv / 0.65, 0.0, 1.0)

    col = col + ((flutes - 0.5) * 28.0 + (fine_flutes - 0.5) * 12.0 - growth * 18.0)[..., None] * np.array([1.0, 0.96, 0.88], dtype=np.float32)
    height = np.clip(0.50 + (flutes - 0.5) * 0.30 + (fine_flutes - 0.5) * 0.14 - growth * 0.18 + (fbm_fine - 0.5) * 0.08, 0.0, 1.0)

    _save_png_rgb(os.path.join(TEX_DIR, "apato_spine_albedo.png"), np.clip(col, 0.0, 255.0).astype(np.uint8))
    _save_png_rgb(os.path.join(TEX_DIR, "apato_spine_normal.png"), _height_to_normal_top_down(height, strength=4.2))
    print("[TEX OK] apato_spine_albedo/normal.png")


def generate_claw_maps():
    """
    384x384 heavy striated dark keratin & weathered bone-slate pollex thumb claws,
    asymmetric pes claws, and blunt keratin nail caps.
    UV v=0 (base root) -> v=1 (sharp worn dark obsidian-horn tip).
    """
    size = 384
    u_row = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)
    v_col = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)
    uu, vv = np.meshgrid(u_row, v_col)

    stops = [
        (0.00, "#292623"),  # Embedded dermal root collar
        (0.16, "#4d463c"),  # Weathered umber-slate base
        (0.46, "#837867"),  # Warm weathered horn-ivory mid shaft
        (0.74, "#574e43"),  # Darkened battle-worn taper
        (0.90, "#2a241f"),  # Deep charcoal-horn distal blade
        (1.00, "#171411"),  # Sharp obsidian-brown apex
    ]
    col = _gradient_1d(vv, stops)
    fbm = _tileable_fbm(size, base_freq=8, octaves=4, seed=9127)
    fbm_u = _tileable_fbm(size, base_freq=14, octaves=3, seed=9203)

    flute_a = 0.5 + 0.5 * np.sin((uu * 36.0 + (fbm - 0.5) * 1.4) * math.pi * 2.0) * (0.55 + 0.45 * fbm_u)
    flute_b = 0.5 + 0.5 * np.sin((uu * 88.0 + (fbm_u - 0.5) * 1.8) * math.pi * 2.0)
    ring_env = np.clip(1.0 - vv / 0.60, 0.0, 1.0)
    rings = (0.5 + 0.5 * np.sin((vv * 22.0 + fbm * 2.0) * math.pi * 2.0)) * ring_env

    col = col + ((flute_a - 0.5) * 26.0 + (flute_b - 0.5) * 12.0 - rings * 22.0)[..., None] * np.array([1.0, 0.94, 0.84], dtype=np.float32)
    height = np.clip(0.50 + (flute_a - 0.5) * 0.28 + (flute_b - 0.5) * 0.12 - rings * 0.20 + (fbm - 0.5) * 0.08, 0.0, 1.0)

    _save_png_rgb(os.path.join(TEX_DIR, "apato_claw_albedo.png"), np.clip(col, 0.0, 255.0).astype(np.uint8))
    _save_png_rgb(os.path.join(TEX_DIR, "apato_claw_normal.png"), _height_to_normal_top_down(height, strength=3.8))
    print("[TEX OK] apato_claw_albedo/normal.png")


def generate_tooth_maps():
    """
    256x256 diplodocid peg-like pencil teeth (foliage-stripping anterior raking teeth).
    UV v=0 (gingival root) -> v=1 (worn ivory-enamel crown tip).
    """
    size = 256
    u_row = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)
    v_col = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)
    uu, vv = np.meshgrid(u_row, v_col)

    stops = [
        (0.00, "#4e392d"),  # Stained gingival root
        (0.22, "#a38d6e"),  # Weathered enamel neck
        (0.58, "#dfd3b8"),  # Pale herbivore ivory shaft
        (0.90, "#ede4cf"),  # Gleaming worn crown
        (1.00, "#c8b99c"),  # Slightly worn foliage-stripping tip
    ]
    col = _gradient_1d(vv, stops)
    fbm = _tileable_fbm(size, base_freq=8, octaves=3, seed=9613)
    stri = 0.5 + 0.5 * np.sin((uu * 28.0 + fbm * 0.8) * math.pi * 2.0)

    col = col + ((stri - 0.5) * 14.0)[..., None] * np.array([1.0, 0.96, 0.88], dtype=np.float32)
    height = np.clip(0.50 + (stri - 0.5) * 0.22 + (fbm - 0.5) * 0.08, 0.0, 1.0)

    _save_png_rgb(os.path.join(TEX_DIR, "apato_tooth_albedo.png"), np.clip(col, 0.0, 255.0).astype(np.uint8))
    _save_png_rgb(os.path.join(TEX_DIR, "apato_tooth_normal.png"), _height_to_normal_top_down(height, strength=2.2))
    print("[TEX OK] apato_tooth_albedo/normal.png")


def generate_eye_iris_map():
    """
    256x256 fiery molten amber-orange reptile iris matched directly to assets/portraits/apato.png!
    """
    size = 256
    coords = np.linspace(-1.0, 1.0, size, dtype=np.float32)
    xx, yy = np.meshgrid(coords, coords)
    r = np.sqrt(xx * xx + yy * yy)
    ang = np.arctan2(yy, xx)
    r_norm = np.clip((r - 0.14) / 0.82, 0.0, 1.0)

    stops = [
        (0.00, "#fef08a"),  # Blazing molten gold inner pupil halo
        (0.24, "#fb923c"),  # Luminous fiery orange-amber
        (0.54, "#ea580c"),  # Rich vivid molten orange
        (0.78, "#9a3412"),  # Deep fiery rust-sienna
        (0.92, "#431407"),  # Dark umber limbal ring
        (1.00, "#160703"),  # Outer sclera shadow
    ]
    col = _gradient_1d(r_norm, stops)

    fibers = 0.5 + 0.5 * np.sin(ang * 46.0 + np.sin(r * 16.0) * 1.1)
    fibers2 = 0.5 + 0.5 * np.cos(ang * 92.0 - r * 10.0)
    fiber_mask = np.clip(1.0 - np.abs(r_norm - 0.44) * 1.85, 0.0, 1.0)
    col = col + ((fibers - 0.5) * 48.0 + (fibers2 - 0.5) * 22.0)[..., None] * fiber_mask[..., None] * np.array([1.0, 0.72, 0.25], dtype=np.float32)

    _save_png_rgb(os.path.join(TEX_DIR, "apato_iris_albedo.png"), np.clip(col, 0.0, 255.0).astype(np.uint8))
    print("[TEX OK] apato_iris_albedo.png")


def main():
    generate_body_hide_maps()
    generate_cranium_maps()
    generate_spine_maps()
    generate_claw_maps()
    generate_tooth_maps()
    generate_eye_iris_map()


if __name__ == "__main__":
    main()
