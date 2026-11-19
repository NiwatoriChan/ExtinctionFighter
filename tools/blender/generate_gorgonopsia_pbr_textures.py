"""
tools/blender/generate_gorgonopsia_pbr_textures.py
Generates high-resolution 1024x1024 / 512x512 / 256x256 PBR textures for the
Gorgonopsia (Inostrancevia latifrons) GLB model in assets/textures/fighters/:
  - Thick, smooth-leathery hippopotamus-like mammalian/synapsid hide (NO reptile scales!)
  - Fine dermal pores, subtle weathered scuffs, and deep anatomical skin creases
    around the heavy nape, neck, jowls, flanks, shoulders, and limb flexures
  - Sparse short coarse bristle hairs / guard hairs painted in both albedo & normal map
  - Earthy dark volcanic-umber / weathered charcoal-slate & warm russet-terracotta
    hippo hide tones with dusty tan-ochre throat/belly folds
  - Velvety dark wet mammalian rhinarium nose pad
  - Gleaming fluted bone-ivory saber canines, wet dark-crimson oral mucosa & tongue,
    and fierce golden-amber mammalian predator iris

Pure numpy + stdlib zlib PNG writer (runs natively inside Blender 5.2 Python).
"""

import os
import struct
import zlib
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
TEX_DIR = os.path.join(ROOT, "assets", "textures", "fighters")
os.makedirs(TEX_DIR, exist_ok=True)


def _save_png_rgb(filepath, rgb_top_down):
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


def _hex_rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)], dtype=np.float32)


def _smoothstep(edge0, edge1, x):
    denom = edge1 - edge0
    if abs(denom) < 1e-6:
        return np.where(x >= edge0, 1.0, 0.0).astype(np.float32)
    t = np.clip((x - edge0) / denom, 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def _tileable_value_noise_rect(h, w, fy_freq, fx_freq, seed=42):
    rng = np.random.default_rng(seed)
    grid = rng.random((fy_freq, fx_freq), dtype=np.float32)
    ys = np.linspace(0.0, fy_freq, h, endpoint=False, dtype=np.float32)
    xs = np.linspace(0.0, fx_freq, w, endpoint=False, dtype=np.float32)
    iy = np.floor(ys).astype(np.int32)
    ix = np.floor(xs).astype(np.int32)
    fy = ys - iy
    fx = xs - ix
    sy = fy * fy * fy * (fy * (fy * 6.0 - 15.0) + 10.0)
    sx = fx * fx * fx * (fx * (fx * 6.0 - 15.0) + 10.0)
    iy1 = (iy + 1) % fy_freq
    ix1 = (ix + 1) % fx_freq
    c00 = grid[iy[:, None], ix[None, :]]
    c10 = grid[iy[:, None], ix1[None, :]]
    c01 = grid[iy1[:, None], ix[None, :]]
    c11 = grid[iy1[:, None], ix1[None, :]]
    top = c00 + (c10 - c00) * sx[None, :]
    bot = c01 + (c11 - c01) * sx[None, :]
    return top + (bot - top) * sy[:, None]


def _tileable_fbm(size, base_freq=4, octaves=4, seed=101):
    acc = np.zeros((size, size), dtype=np.float32)
    amp = 1.0
    total = 0.0
    freq = base_freq
    for oct_i in range(octaves):
        acc += amp * _tileable_value_noise_rect(size, size, freq, freq, seed=seed + oct_i * 79)
        total += amp
        amp *= 0.5
        freq *= 2
    return acc / total


def _generate_sparse_bristle_hairs(size, count=4200, length_px=(6, 15), along_v=True, seed=911):
    """
    Renders crisp short coarse mammalian bristle hairs (like hippo/boar/rhino guard hairs)
    plus fine hair follicle pores into float32 masks in [0, 1].
    """
    rng = np.random.default_rng(seed)
    hairs = np.zeros((size, size), dtype=np.float32)
    follicles = np.zeros((size, size), dtype=np.float32)

    xs0 = rng.integers(0, size, size=count)
    ys0 = rng.integers(0, size, size=count)
    lens = rng.integers(length_px[0], length_px[1] + 1, size=count)
    angles = rng.normal(0.0, 0.28, size=count)
    strengths = rng.uniform(0.45, 0.95, size=count)

    max_len = length_px[1]
    for step in range(max_len):
        active = step < lens
        if not np.any(active):
            break
        frac = step / np.maximum(1.0, lens.astype(np.float32))
        taper = (1.0 - frac * 0.78) * strengths
        if along_v:
            dy = np.round(step * np.cos(angles)).astype(np.int32)
            dx = np.round(step * np.sin(angles) * 0.55).astype(np.int32)
        else:
            dx = np.round(-step * np.cos(angles)).astype(np.int32)
            dy = np.round(step * np.sin(angles) * 0.55).astype(np.int32)
        px = (xs0[active] + dx[active]) % size
        py = (ys0[active] + dy[active]) % size
        val = taper[active]
        np.maximum.at(hairs, (py, px), val)
        if step == 0:
            np.maximum.at(follicles, (py, px), 0.70)

    return hairs, follicles


def _reticulated_hippo_crackle(size, freq=18, seed=313):
    """
    Generates soft organic reticulated leather crackle / fine hippo hide creases
    using warped ridge-noise (NO regular zebra bands, NO hexagonal reptile scales!).
    """
    n1 = _tileable_fbm(size, base_freq=freq, octaves=3, seed=seed)
    n2 = _tileable_fbm(size, base_freq=freq, octaves=3, seed=seed + 53)
    ridge1 = 1.0 - np.abs(n1 * 2.0 - 1.0)
    ridge2 = 1.0 - np.abs(n2 * 2.0 - 1.0)
    cracks = np.maximum(ridge1 ** 5.0, ridge2 ** 5.0)
    return np.clip(cracks, 0.0, 1.0)


def _height_to_normal_rgb(height, strength=2.6):
    gx = (np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)) * 0.5 * strength
    gy = (np.roll(height, 1, axis=0) - np.roll(height, -1, axis=0)) * 0.5 * strength
    nx = -gx
    ny = -gy
    nz = np.ones_like(height)
    inv_len = 1.0 / np.sqrt(nx * nx + ny * ny + nz * nz + 1e-8)
    nx *= inv_len
    ny *= inv_len
    nz *= inv_len
    rgb = np.stack([nx * 0.5 + 0.5, ny * 0.5 + 0.5, nz * 0.5 + 0.5], axis=-1)
    return np.clip(rgb * 255.0, 0, 255).astype(np.uint8)


def generate_body_hide_maps(size=1024):
    """
    Body UV layout (matching gorgonopsia_sculptor.py):
      u in [0, 1]: 0.0 & 1.0 = dorsal spine, 0.25 & 0.75 = lateral flanks, 0.5 = ventral belly/throat
      v in [0, 1]: 0.0 = tail tip -> 1.0 = skull occiput
    Authentic hippopotamus-like thick leathery mammalian hide:
      - Mottled weathered dark slate-charcoal & warm earthy brown-grey (NO zebra stripes!)
      - Warm dusty pinkish-terracotta/ochre hippo skin blush in lower flanks, throat & folds
      - Fine reticulated leather creases, deep localized neck/shoulder folds, dermal pores,
        healed battle scuffs, and dense subtle short mammalian bristle hairs!
    """
    u = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)[None, :]
    v = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)[:, None]

    ventral = 1.0 - np.abs(2.0 * u - 1.0)  # 0 = dorsal spine, 1 = ventral belly/throat

    # Organic hippo hide blotches, reticulated leather grain & micro dermal pores
    macro = _tileable_fbm(size, base_freq=4, octaves=4, seed=131)
    mottle = _tileable_fbm(size, base_freq=8, octaves=4, seed=241)
    micro_leather = _tileable_fbm(size, base_freq=32, octaves=3, seed=353)
    crackle_lg = _reticulated_hippo_crackle(size, freq=12, seed=389)
    crackle_sm = _reticulated_hippo_crackle(size, freq=28, seed=419)
    pores = _tileable_value_noise_rect(size, size, 192, 192, seed=467)
    pore_pits = _smoothstep(0.80, 0.95, pores)

    # Localized thick hippo anatomical neck & shoulder folds ONLY (broken up organically, NOT body-wide stripes!)
    fold_warp = (macro - 0.5) * 1.4 + (mottle - 0.5) * 0.9
    neck_fold_env = _smoothstep(0.68, 0.94, v) * (0.35 + 0.65 * _smoothstep(0.08, 0.65, ventral))
    shoulder_fold_env = np.exp(-(((v - 0.63) / 0.07) ** 2)) * _smoothstep(0.18, 0.72, ventral)
    groin_fold_env = np.exp(-(((v - 0.36) / 0.06) ** 2)) * _smoothstep(0.22, 0.75, ventral)

    neck_wave = 1.0 - _smoothstep(-0.62, 0.15, np.sin((v * 18.0 + fold_warp) * np.pi * 2.0))
    aux_wave = 1.0 - _smoothstep(-0.55, 0.18, np.sin((v * 28.0 + fold_warp * 1.6) * np.pi * 2.0))
    crease_depth = (
        neck_fold_env * neck_wave * 0.36
        + (shoulder_fold_env + groin_fold_env) * aux_wave * 0.24
        + crackle_lg * 0.15
        + crackle_sm * 0.10
    )

    # Subtle weathered scars/scuffs across hippo flanks & shoulders
    scuff_n = _tileable_value_noise_rect(size, size, 10, 42, seed=577)
    scuffs = _smoothstep(0.86, 0.97, scuff_n) * _smoothstep(0.65, 0.12, ventral) * 0.32

    # Sparse short coarse mammalian bristle hairs across body, denser along nape, shoulders & spine!
    hairs, follicles = _generate_sparse_bristle_hairs(size, count=7200, length_px=(6, 15), along_v=True, seed=709)
    mane_hairs, _ = _generate_sparse_bristle_hairs(size, count=4800, length_px=(10, 22), along_v=True, seed=733)
    dorsal_zone = _smoothstep(0.38, 0.0, ventral)
    hair_mask = np.clip(hairs * (0.48 + 0.52 * _smoothstep(0.88, 0.18, ventral)) + mane_hairs * dorsal_zone * 0.85, 0.0, 1.0)

    # Authentic hippopotamus-meets-Permian palette (matches gorgonopsia.png portrait!)
    col_hippo_dk   = _hex_rgb("#352e2d")  # Deep weathered charcoal-slate hippo back
    col_hippo_mid  = _hex_rgb("#544641")  # Thick brownish-grey leathery hippo hide
    col_hippo_warm = _hex_rgb("#74473b")  # Subtle warm dusty terracotta-brown hippo flank blush
    col_hippo_blot = _hex_rgb("#26201f")  # Soft organic dark dermal mottling (NOT stripes!)
    col_belly      = _hex_rgb("#9a7965")  # Warm dusty pinkish-tan hippo underbelly & throat
    col_belly_lo   = _hex_rgb("#684d3f")  # Shadowed throat/belly fold crease
    col_hair_dk    = _hex_rgb("#171210")  # Coarse dark bristle hairs
    col_hair_hi    = _hex_rgb("#8e725c")  # Sun-bleached dusty guard hair tips
    col_scuff      = _hex_rgb("#8a7468")  # Pale healed hippo hide scuffs

    # Base thick mottled hippo hide
    rgb = col_hippo_dk[None, None, :] * (1.0 - macro[..., None]) + col_hippo_mid[None, None, :] * macro[..., None]

    # Subtle warm brownish-terracotta hippo blush on shoulders, flanks & folds
    warm_mask = _smoothstep(0.36, 0.74, mottle) * _smoothstep(0.78, 0.18, ventral) * 0.52
    rgb = rgb * (1.0 - warm_mask[..., None]) + col_hippo_warm[None, None, :] * warm_mask[..., None]

    # Organic cloudy hippo mottling (soft patches, NEVER vertical zebra stripes)
    blotch_n = _tileable_fbm(size, base_freq=7, octaves=3, seed=613)
    blotch_mask = _smoothstep(0.56, 0.80, blotch_n) * _smoothstep(0.60, 0.08, ventral) * 0.42
    rgb = rgb * (1.0 - blotch_mask[..., None]) + col_hippo_blot[None, None, :] * blotch_mask[..., None]

    # Dusty pinkish-tan hippo belly & throat countershading
    belly_blend = _smoothstep(0.52, 0.88, ventral + (macro - 0.5) * 0.16)
    belly_col = col_belly_lo[None, None, :] * np.clip(crease_depth * 2.0, 0.0, 1.0)[..., None] + col_belly[None, None, :] * (1.0 - np.clip(crease_depth * 2.0, 0.0, 1.0)[..., None])
    rgb = rgb * (1.0 - belly_blend[..., None]) + belly_col * belly_blend[..., None]

    # Micro leather grain, dermal pores & pale healed hippo scuffs
    rgb = rgb * (0.92 + 0.13 * micro_leather[..., None] - 0.14 * pore_pits[..., None])
    rgb = rgb * (1.0 - scuffs[..., None]) + col_scuff[None, None, :] * scuffs[..., None]

    # Darken reticulated leather cracks & localized hippo folds
    rgb = rgb * (1.0 - np.clip(crease_depth, 0.0, 0.65)[..., None] * 0.78)

    # Paint fine short coarse hairs across hide
    hair_col = col_hair_dk[None, None, :] * (1.0 - 0.35 * micro_leather[..., None]) + col_hair_hi[None, None, :] * (0.35 * micro_leather[..., None])
    rgb = rgb * (1.0 - hair_mask[..., None] * 0.68) + hair_col * (hair_mask[..., None] * 0.68)

    albedo = np.clip(rgb, 0, 255).astype(np.uint8)

    # Authentic hippo heightmap: soft broad leather + reticulated micro-crackle + pores + fine raised short hairs!
    height = np.clip(
        0.58
        - crease_depth * 0.58
        + (micro_leather - 0.5) * 0.14
        - pore_pits * 0.14
        - follicles * 0.08
        + hair_mask * 0.22,
        0.0,
        1.0,
    )
    bump_gray = np.clip(height * 255.0, 0, 255).astype(np.uint8)
    bump_rgb = np.stack([bump_gray, bump_gray, bump_gray], axis=-1)
    normal_rgb = _height_to_normal_rgb(height, strength=3.0)

    _save_png_rgb(os.path.join(TEX_DIR, "gorgonopsia_albedo.png"), albedo)
    _save_png_rgb(os.path.join(TEX_DIR, "gorgonopsia_bump.png"), bump_rgb)
    _save_png_rgb(os.path.join(TEX_DIR, "gorgonopsia_normal.png"), normal_rgb)
    print(f"[TEX OK] gorgonopsia hippo-skin + small hairs body maps ({size}x{size})")


def generate_cranium_maps(size=1024):
    """
    Mammalian Gorgonopsian head UV layout:
      u in [0, 1]: 0 = occiput rear -> 1 = rounded mammalian snout tip & wet rhinarium
      v in [0, 1]: circumferential angle (0/1 = top bridge, 0.25/0.75 = cheeks, 0.5 = chin/lips)
    Thick mottled hippo-like leathery mammalian facial hide matching the portrait:
      - Weathered charcoal-slate brow & bridge, warm terracotta-brown cheek/orbit flush
      - Seamless dark velvety wet mammalian rhinarium integrated into snout tip (u > 0.84)
      - Reticulated hippo leather grain, deep jowl creases, muzzle whisker pores, and short facial hairs!
    """
    u = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)[None, :]
    v = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)[:, None]

    ventral = 1.0 - np.abs(2.0 * v - 1.0)
    cheek_band = np.exp(-(((ventral - 0.44) / 0.24) ** 2))

    macro = _tileable_fbm(size, base_freq=5, octaves=4, seed=601)
    mottle = _tileable_fbm(size, base_freq=10, octaves=4, seed=631)
    micro = _tileable_fbm(size, base_freq=32, octaves=3, seed=661)
    crackle = _reticulated_hippo_crackle(size, freq=22, seed=677)
    pores = _smoothstep(0.78, 0.95, _tileable_value_noise_rect(size, size, 196, 196, seed=691))

    # Organic mammalian jowl/cheek creases behind mouth corner & soft brow wrinkles
    jowl_zone = _smoothstep(0.48, 0.12, u) * _smoothstep(0.18, 0.72, ventral)
    jowl_folds = (1.0 - _smoothstep(-0.55, 0.22, np.sin((u * 20.0 + macro * 1.6) * np.pi * 2.0))) * jowl_zone * 0.30
    snout_grain = crackle * (0.14 + 0.10 * _smoothstep(0.40, 0.85, u)) * _smoothstep(0.95, 0.78, u)

    # Fine short facial bristle hairs (along cheeks, brow, nape, chin & muzzle!)
    face_hairs, follicles = _generate_sparse_bristle_hairs(size, count=5200, length_px=(5, 13), along_v=False, seed=751)
    face_hairs = face_hairs * _smoothstep(0.90, 0.62, u)  # Hairless velvety wet nose tip

    col_dk      = _hex_rgb("#322b2a")  # Dark weathered charcoal-brown hippo cranium
    col_mid     = _hex_rgb("#544640")  # Thick brownish-slate hippo facial leather
    col_russet  = _hex_rgb("#7c4738")  # Warm terracotta-brown cheek/under-eye blush (matches portrait!)
    col_tan     = _hex_rgb("#8e725e")  # Warm dusty tan chin & lower jaw folds
    col_nose_dk = _hex_rgb("#1c1716")  # Dark wet mammalian rhinarium & lip margin
    col_hair    = _hex_rgb("#15110f")

    rgb = col_dk[None, None, :] * (1.0 - macro[..., None]) + col_mid[None, None, :] * macro[..., None]

    # Warm terracotta-brown flush around eyes, cheeks & snout bridge (matching portrait)
    cheek_warm = cheek_band * _smoothstep(0.12, 0.34, u) * _smoothstep(0.84, 0.56, u) * (0.40 + 0.60 * mottle)
    rgb = rgb * (1.0 - cheek_warm[..., None] * 0.60) + col_russet[None, None, :] * (cheek_warm[..., None] * 0.60)

    # Dusty warm tan lower jaw & chin folds
    chin_tan = _smoothstep(0.58, 0.88, ventral + (macro - 0.5) * 0.14) * _smoothstep(0.86, 0.55, u)
    rgb = rgb * (1.0 - chin_tan[..., None] * 0.52) + col_tan[None, None, :] * (chin_tan[..., None] * 0.52)

    # Seamless dark velvety mammalian rhinarium nose pad at snout tip (u > 0.82) & dark lip margin
    rhinarium_mask = _smoothstep(0.80, 0.93, u) * _smoothstep(0.68, 0.18, ventral)
    lip_dark = _smoothstep(0.74, 0.96, ventral) * _smoothstep(0.32, 0.72, u)
    snout_dark = np.clip(rhinarium_mask + lip_dark * 0.58, 0.0, 1.0)
    rgb = rgb * (1.0 - snout_dark[..., None] * 0.78) + col_nose_dk[None, None, :] * (snout_dark[..., None] * 0.78)

    # Micro leather pores, reticulated creases & sparse short facial hairs
    rgb = rgb * (0.92 + 0.12 * micro[..., None] - 0.14 * pores[..., None])
    rgb = rgb * (1.0 - np.clip(jowl_folds + snout_grain, 0.0, 0.65)[..., None] * 0.78)
    rgb = rgb * (1.0 - face_hairs[..., None] * 0.65) + col_hair[None, None, :] * (face_hairs[..., None] * 0.65)

    albedo = np.clip(rgb, 0, 255).astype(np.uint8)
    height = np.clip(
        0.58
        - (jowl_folds + snout_grain) * 0.58
        + (micro - 0.5) * 0.14
        - pores * 0.14
        - follicles * 0.08
        + face_hairs * 0.20,
        0.0,
        1.0,
    )
    normal_rgb = _height_to_normal_rgb(height, strength=2.9)

    _save_png_rgb(os.path.join(TEX_DIR, "gorgonopsia_cranium_albedo.png"), albedo)
    _save_png_rgb(os.path.join(TEX_DIR, "gorgonopsia_cranium_normal.png"), normal_rgb)
    print(f"[TEX OK] gorgonopsia mammalian hippo cranium maps ({size}x{size})")


def generate_tooth_and_mucosa_maps(size=512):
    u = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)[None, :]
    v = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)[:, None]

    fbm_t = _tileable_fbm(size, base_freq=8, octaves=3, seed=811)
    fluting = 0.5 + 0.5 * np.sin((u * 14.0 + fbm_t * 0.3) * np.pi * 2.0)
    growth_rings = 0.5 + 0.5 * np.sin((v * 26.0 + fbm_t * 0.5) * np.pi * 2.0)

    col_root = _hex_rgb("#785738")
    col_mid  = _hex_rgb("#dfd0b2")
    col_tip  = _hex_rgb("#f8f3e8")

    t_mid = _smoothstep(0.0, 0.40, v)
    t_tip = _smoothstep(0.38, 0.90, v)
    tooth_rgb = col_root[None, None, :] * (1.0 - t_mid[..., None]) + col_mid[None, None, :] * t_mid[..., None]
    tooth_rgb = tooth_rgb * (1.0 - t_tip[..., None]) + col_tip[None, None, :] * t_tip[..., None]
    tooth_rgb = tooth_rgb * (0.93 + 0.07 * fluting[..., None]) * (0.96 + 0.04 * growth_rings[..., None])
    gum_stain = _smoothstep(0.14, 0.0, v)
    tooth_rgb = tooth_rgb * (1.0 - gum_stain[..., None] * 0.42) + _hex_rgb("#5e1c1e")[None, None, :] * (gum_stain[..., None] * 0.42)

    tooth_h = np.clip(0.55 * fluting + 0.25 * growth_rings + 0.20 * fbm_t, 0.0, 1.0)
    _save_png_rgb(os.path.join(TEX_DIR, "gorgonopsia_tooth_albedo.png"), np.clip(tooth_rgb, 0, 255).astype(np.uint8))
    _save_png_rgb(os.path.join(TEX_DIR, "gorgonopsia_tooth_normal.png"), _height_to_normal_rgb(tooth_h, strength=1.6))

    fbm_m1 = _tileable_fbm(size, base_freq=6, octaves=4, seed=907)
    fbm_m2 = _tileable_fbm(size, base_freq=22, octaves=3, seed=929)
    muc_rgb = _hex_rgb("#4d171c")[None, None, :] * (1.0 - fbm_m1[..., None]) + _hex_rgb("#822c32")[None, None, :] * fbm_m1[..., None]
    muc_rgb = muc_rgb * (1.0 - 0.32 * fbm_m2[..., None]) + _hex_rgb("#a8454a")[None, None, :] * (0.32 * fbm_m2[..., None])
    muc_h = np.clip(0.50 * fbm_m1 + 0.50 * fbm_m2, 0.0, 1.0)

    _save_png_rgb(os.path.join(TEX_DIR, "gorgonopsia_mucosa_albedo.png"), np.clip(muc_rgb, 0, 255).astype(np.uint8))
    _save_png_rgb(os.path.join(TEX_DIR, "gorgonopsia_mucosa_normal.png"), _height_to_normal_rgb(muc_h, strength=2.4))
    print(f"[TEX OK] gorgonopsia tooth & mucosa maps ({size}x{size})")


def generate_iris_map(size=256):
    """Fierce golden-amber mammalian predator iris (wolf/bear/synapsid amber)."""
    xs = np.linspace(-1.0, 1.0, size, dtype=np.float32)[None, :]
    ys = np.linspace(1.0, -1.0, size, dtype=np.float32)[:, None]
    r = np.sqrt(xs * xs + ys * ys + 1e-8)
    ang = np.arctan2(ys, xs)

    fibers = 0.5 + 0.5 * np.sin(ang * 26.0 + np.sin(ang * 6.0) * 1.2 + r * 5.0)
    t1 = _smoothstep(0.18, 0.56, r)
    t2 = _smoothstep(0.54, 0.84, r)
    t3 = _smoothstep(0.80, 0.98, r)

    rgb = _hex_rgb("#f5c249")[None, None, :] * (1.0 - t1[..., None]) + _hex_rgb("#c76912")[None, None, :] * t1[..., None]
    rgb = rgb * (1.0 - t2[..., None]) + _hex_rgb("#5e2208")[None, None, :] * t2[..., None]
    rgb = rgb * (0.84 + 0.24 * fibers[..., None])
    rgb = rgb * (1.0 - t3[..., None]) + _hex_rgb("#140905")[None, None, :] * t3[..., None]

    _save_png_rgb(os.path.join(TEX_DIR, "gorgonopsia_iris_albedo.png"), np.clip(rgb, 0, 255).astype(np.uint8))
    print(f"[TEX OK] gorgonopsia mammalian iris map ({size}x{size})")


def generate_all_gorgonopsia_textures():
    generate_body_hide_maps(1024)
    generate_cranium_maps(1024)
    generate_tooth_and_mucosa_maps(512)
    generate_iris_map(256)
    print("ALL GORGONOPSIA HIPPO-SKIN PBR TEXTURES GENERATED!")


if __name__ == "__main__":
    generate_all_gorgonopsia_textures()
