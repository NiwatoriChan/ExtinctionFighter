"""
tools/blender/generate_giantsloth_pbr_textures.py
Generates high-resolution 1024x1024 / 512x512 / 256x256 PBR textures for the
rebuilt Giant Ground Sloth (Megatherium americanum) GLB model in
assets/textures/fighters/, faithfully matched to assets/portraits/giantsloth.png:
  - Coarse, matted, multi-tiered Pleistocene shaggy fur coat (deep espresso-umber
    underfur, rich warm chestnut-brown body fur, raw-umber/taupe sun-bleached guard
    hair tips, and warm honey-tan / sandy-ochre shaggy chest & throat ruff)
  - Detailed facial short velvety brown-taupe snout fur, dark orbital eye-rings,
    weathered muzzle scratches, signature diagonal cheek battle scar, and dark
    leathery lip border
  - Pebbled dark charcoal-slate leathery rhinarium nose pad with moist micro-relief
  - Colossal weathered dark charcoal-obsidian keratin sickle claws with longitudinal
    growth flutes, transverse stress rings & warm pale-horn worn dorsal ridges
  - Wet dark dusky-rose mammalian gums & prehensile tongue mucosa
  - Weathered earthy-ivory herbivore hypsodont cheek teeth
  - Expressive warm burnt-amber / rich chestnut-gold mammalian eye iris

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


def _hex_rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)], dtype=np.float32)


def _smoothstep(edge0, edge1, x):
    denom = edge1 - edge0
    safe_denom = np.where(np.abs(denom) < 1e-6, 1.0, denom)
    t = np.clip((x - edge0) / safe_denom, 0.0, 1.0)
    res = t * t * (3.0 - 2.0 * t)
    return np.where(np.abs(denom) < 1e-6, np.where(x >= edge0, 1.0, 0.0), res).astype(np.float32)


def _tileable_value_noise_rect(h, w, fy_freq, fx_freq, seed=42):
    """Anisotropic tileable 2D value noise (quintic smoothstep interpolation)."""
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
        acc += amp * _tileable_value_noise_rect(size, size, freq, freq, seed=seed + oct_i * 73)
        total += amp
        amp *= 0.5
        freq *= 2
    return acc / total


def _sample_tileable_field(field, u_coords, v_coords):
    """Bilinearly samples a tileable (H, W) array at normalized UV coordinates (u in [0,1], v in [0,1])."""
    h, w = field.shape
    xs = (u_coords % 1.0) * w
    ys = ((1.0 - v_coords) % 1.0) * h
    ix0 = np.floor(xs).astype(np.int32) % w
    iy0 = np.floor(ys).astype(np.int32) % h
    ix1 = (ix0 + 1) % w
    iy1 = (iy0 + 1) % h
    fx = xs - np.floor(xs)
    fy = ys - np.floor(ys)
    c00 = field[iy0, ix0]
    c10 = field[iy0, ix1]
    c01 = field[iy1, ix0]
    c11 = field[iy1, ix1]
    top = c00 + (c10 - c00) * fx
    bot = c01 + (c11 - c01) * fx
    return top + (bot - top) * fy


def _shaggy_fur_field(size, seed=301, along_v=True):
    """
    Generates a photorealistic coarse, shaggy, wiry Pleistocene ground-sloth pelt field:
      returns (strand_val, height, guard_threads) in [0, 1].
    Combines multi-scale domain-warped anisotropic hair-strand fields with staggered
    elongated fur-lock clumps (zero continuous horizontal ring artifacts!) plus crisp
    individual coarse guard-hair threads catching highlight light.
    """
    u = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)[None, :]
    v = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)[:, None]

    # Gentle organic waviness so hair locks curve naturally without looking mechanical
    wave1 = _tileable_fbm(size, base_freq=5, octaves=3, seed=seed + 5) - 0.5
    wave2 = _tileable_fbm(size, base_freq=13, octaves=2, seed=seed + 19) - 0.5

    if along_v:
        # Hairs flow longitudinally along v (back/shoulders -> flanks/tail, shoulder -> wrist)
        u_w = u + wave1 * 0.024 + wave2 * 0.009
        v_w = v + wave1 * 0.010
        # Second slightly cross-angled pass for messy coarse shaggy sloth guard hairs!
        u_w2 = u + wave1 * 0.018 - wave2 * 0.012 + v * 0.04
        v_w2 = v - wave1 * 0.010

        clumps_raw = _tileable_value_noise_rect(size, size, 10, 44, seed=seed + 31)
        locks_raw  = _tileable_value_noise_rect(size, size, 22, 112, seed=seed + 67)
        strands_raw = _tileable_value_noise_rect(size, size, 52, 268, seed=seed + 109)
        wisp_raw   = _tileable_value_noise_rect(size, size, 96, 440, seed=seed + 157)
        guard_raw  = _tileable_value_noise_rect(size, size, 40, 320, seed=seed + 211)

        clumps  = _sample_tileable_field(clumps_raw,  u_w, v_w)
        locks   = _sample_tileable_field(locks_raw,   u_w, v_w)
        strands = _sample_tileable_field(strands_raw, u_w, v_w)
        wisp    = _sample_tileable_field(wisp_raw,    u_w, v_w)
        guard   = _sample_tileable_field(guard_raw,   u_w2, v_w2)
    else:
        # Hairs sweep smoothly along u (snout -> brow -> cheeks -> occiput)
        u_w = u + wave1 * 0.010
        v_w = v + wave1 * 0.024 + wave2 * 0.009
        u_w2 = u - wave1 * 0.010
        v_w2 = v + wave1 * 0.016 - wave2 * 0.011 + u * 0.035

        clumps_raw = _tileable_value_noise_rect(size, size, 44, 12, seed=seed + 31)
        locks_raw  = _tileable_value_noise_rect(size, size, 112, 26, seed=seed + 67)
        strands_raw = _tileable_value_noise_rect(size, size, 268, 56, seed=seed + 109)
        wisp_raw   = _tileable_value_noise_rect(size, size, 440, 104, seed=seed + 157)
        guard_raw  = _tileable_value_noise_rect(size, size, 320, 44, seed=seed + 211)

        clumps  = _sample_tileable_field(clumps_raw,  u_w, v_w)
        locks   = _sample_tileable_field(locks_raw,   u_w, v_w)
        strands = _sample_tileable_field(strands_raw, u_w, v_w)
        wisp    = _sample_tileable_field(wisp_raw,    u_w, v_w)
        guard   = _sample_tileable_field(guard_raw,   u_w2, v_w2)

    # Shaggy lock depth (deep dark gaps between tufted locks + high-frequency hair threads)
    lock_ridge = np.power(np.clip(0.50 * clumps + 0.50 * locks, 0.0, 1.0), 1.15)
    strand_val = np.clip(0.22 * clumps + 0.28 * locks + 0.30 * strands + 0.20 * wisp, 0.0, 1.0)
    guard_threads = _smoothstep(0.62, 0.94, guard * 0.65 + wisp * 0.35)
    height = np.clip(0.38 * lock_ridge + 0.32 * strands + 0.18 * wisp + 0.12 * guard_threads, 0.0, 1.0)
    return strand_val, height, guard_threads


def _height_to_normal_rgb(height, strength=3.4):
    """Converts tileable height field [0, 1] into OpenGL/glTF tangent-space RGB normal map."""
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


def _voronoi_pebbles(size, nx, ny, seed=77, jitter=0.72):
    """Tileable Voronoi cellular distance for pebbled leathery nose pad texture."""
    rng = np.random.default_rng(seed)
    off_x = 0.5 + (rng.random((ny, nx)).astype(np.float32) - 0.5) * jitter
    off_y = 0.5 + (rng.random((ny, nx)).astype(np.float32) - 0.5) * jitter
    cell_hash = rng.random((ny, nx)).astype(np.float32)

    xs = np.linspace(0.0, nx, size, endpoint=False, dtype=np.float32)[None, :]
    ys = np.linspace(0.0, ny, size, endpoint=False, dtype=np.float32)[:, None]
    ix = np.floor(xs).astype(np.int32)
    iy = np.floor(ys).astype(np.int32)

    d1 = np.full((size, size), 1e9, dtype=np.float32)
    d2 = np.full((size, size), 1e9, dtype=np.float32)
    cval = np.zeros((size, size), dtype=np.float32)

    for dy in (-1, 0, 1):
        ny_i = (iy + dy) % ny
        for dx in (-1, 0, 1):
            nx_i = (ix + dx) % nx
            px = (ix + dx) + off_x[ny_i, nx_i]
            py = (iy + dy) + off_y[ny_i, nx_i]
            dist = np.sqrt((xs - px) ** 2 + (ys - py) ** 2)
            closer1 = dist < d1
            d2 = np.where(closer1, d1, np.minimum(d2, dist))
            d1 = np.where(closer1, dist, d1)
            cval = np.where(closer1, cell_hash[ny_i, nx_i], cval)

    edge_dist = np.clip(d2 - d1, 0.0, 1.0)
    return edge_dist, d1, cval


def generate_giantsloth_body_maps(size=1024):
    """
    Body & Limb UV layout (matching giantsloth_sculptor.py):
      u in [0, 1]: 0.0 & 1.0 = dorsal spine / outer limb flank,
                   0.25 & 0.75 = lateral flanks,
                   0.5 = ventral shaggy chest ruff & belly (and inner limb!)
      v in [0, 1]: 0.0 = tripod tail tip -> 0.55 = pear-shaped torso -> 0.85 = shoulders -> 1.0 = occiput
    Faithfully matched to assets/portraits/giantsloth.png:
      - Rich dark espresso-umber & warm chestnut coarse shaggy pelt
      - Weathered earthy raw-umber & dusty taupe guard hair highlights along back/shoulders
      - Warm honey-ochre / golden-tan shaggy chest & throat ruff (clearly visible in portrait!)
      - Darker weathered charcoal-umber lower legs, hands, feet & tail tip
    """
    u = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)[None, :]
    v = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)[:, None]

    # 0 at dorsal spine (u=0/1), 1 at ventral chest/belly (u=0.5)
    ventral = 1.0 - np.abs(2.0 * u - 1.0)

    strand, fur_h, guard_threads = _shaggy_fur_field(size, seed=211, along_v=True)
    macro = _tileable_fbm(size, base_freq=5, octaves=4, seed=317)
    mottle = _tileable_fbm(size, base_freq=11, octaves=4, seed=421)
    dust = _tileable_fbm(size, base_freq=20, octaves=3, seed=523)

    # Palette sampled directly from assets/portraits/giantsloth.png
    col_under    = _hex_rgb("#1c120a")   # Deep espresso shadow between matted fur clumps
    col_espresso = _hex_rgb("#352214")   # Rich dark Pleistocene umber coat
    col_chestnut = _hex_rgb("#624127")   # Warm shaggy chestnut-brown main coat
    col_guard    = _hex_rgb("#8e6c48")   # Sun-bleached raw-umber / taupe guard hairs
    col_frost    = _hex_rgb("#b89972")   # Pale weathered earth-tan guard hair tips
    col_ruff_dk  = _hex_rgb("#6b4c2d")   # Warm ochre shadow inside chest ruff
    col_ruff_hi  = _hex_rgb("#c7a679")   # Signature warm honey-tan shaggy chest/throat ruff!
    col_dark_ext = _hex_rgb("#24170f")   # Dark espresso-umber tail tip & lower extremities

    # 1. Base coarse shaggy chestnut-to-espresso pelt with strong clump AO
    coat_t = np.clip(0.28 * macro + 0.72 * strand, 0.0, 1.0)
    rgb = col_espresso[None, None, :] * (1.0 - coat_t[..., None]) + col_chestnut[None, None, :] * coat_t[..., None]

    # Deep dark matted fur crevices between coarse locks (strictly strand-aligned, zero rings!)
    crevice = _smoothstep(0.42, 0.12, fur_h) * (1.0 - 0.50 * guard_threads)
    rgb = rgb * (1.0 - crevice[..., None] * 0.70) + col_under[None, None, :] * (crevice[..., None] * 0.70)

    # Coarse sun-bleached guard hair highlights (stronger over dorsal hump, shoulders & flanks!)
    dorsal_sun = _smoothstep(0.75, 0.12, ventral) * (0.65 + 0.35 * _smoothstep(0.35, 0.88, v))
    guard_mask = _smoothstep(0.50, 0.86, strand) * (0.55 + 0.45 * dorsal_sun) * (0.65 + 0.35 * mottle)
    rgb = rgb * (1.0 - guard_mask[..., None] * 0.64) + col_guard[None, None, :] * (guard_mask[..., None] * 0.64)

    # Crisp pale coarse wiry individual guard threads catching rim light (signature shaggy realism!)
    tip_mask = np.clip(guard_threads * (0.55 + 0.45 * dust), 0.0, 1.0)
    rgb = rgb * (1.0 - tip_mask[..., None] * 0.56) + col_frost[None, None, :] * (tip_mask[..., None] * 0.56)

    # 2. Subtle dark dorsal saddle / shoulder mantle richness (adds strong torso depth)
    mantle_dark = _smoothstep(0.32, 0.02, ventral) * _smoothstep(0.28, 0.72, v) * (0.40 + 0.60 * _smoothstep(0.35, 0.75, macro))
    rgb = rgb * (1.0 - mantle_dark[..., None] * 0.22) + col_espresso[None, None, :] * (mantle_dark[..., None] * 0.22)

    # 3. Signature Warm Honey-Tan Shaggy Chest, Throat & Belly Ruff (strongest along chest v in [0.55, 0.96])
    chest_boost = _smoothstep(0.42, 0.76, v) * 0.22
    ruff_edge = ventral + (strand - 0.5) * 0.16 + (macro - 0.5) * 0.12
    ruff_mask = _smoothstep(0.54 - chest_boost, 0.84 - chest_boost * 0.5, ruff_edge) * _smoothstep(0.14, 0.34, v)
    ruff_mix = np.clip(0.65 * fur_h + 0.35 * guard_threads, 0.0, 1.0)
    ruff_col = col_ruff_dk[None, None, :] * (1.0 - ruff_mix[..., None]) + col_ruff_hi[None, None, :] * ruff_mix[..., None]
    rgb = rgb * (1.0 - ruff_mask[..., None] * 0.88) + ruff_col * (ruff_mask[..., None] * 0.88)

    # 4. Dark weathered espresso tail tip (v < 0.16)
    tail_dark = _smoothstep(0.18, 0.02, v) * (0.72 + 0.28 * (1.0 - strand))
    rgb = rgb * (1.0 - tail_dark[..., None] * 0.60) + col_dark_ext[None, None, :] * (tail_dark[..., None] * 0.60)

    # Micro-clump ambient occlusion
    ao = 0.74 + 0.26 * np.clip(0.75 * fur_h + 0.25 * guard_threads, 0.0, 1.0)
    rgb = rgb * ao[..., None]

    albedo = np.clip(rgb, 0, 255).astype(np.uint8)
    height = np.clip(0.74 * fur_h + 0.16 * guard_threads + 0.10 * macro, 0.0, 1.0)
    bump_gray = np.clip(height * 255.0, 0, 255).astype(np.uint8)
    bump_rgb = np.stack([bump_gray, bump_gray, bump_gray], axis=-1)
    normal_rgb = _height_to_normal_rgb(height, strength=4.5)

    _save_png_rgb(os.path.join(TEX_DIR, "giantsloth_albedo.png"), albedo)
    _save_png_rgb(os.path.join(TEX_DIR, "giantsloth_bump.png"), bump_rgb)
    _save_png_rgb(os.path.join(TEX_DIR, "giantsloth_normal.png"), normal_rgb)
    print(f"[TEX OK] giantsloth body shaggy fur maps ({size}x{size})")


def generate_giantsloth_cranium_maps(size=1024):
    """
    Skull & Mandible UV layout (matching giantsloth_sculptor.py):
      u in [0, 1]: 0.0 = occiput rear -> 1.0 = blunt snout tip
      v in [0, 1]: circumferential angle (0/1 = forehead/bridge, 0.25/0.75 = eyes/cheeks, 0.5 = chin/lips)
    Matched directly to assets/portraits/giantsloth.png:
      - Short velvety warm brown-taupe snout & brow fur transitioning to coarser dark espresso crown & jowls
      - Dark smoky orbital rings framing the warm amber eyes
      - Signature healed diagonal cheek battle scar behind the orbit + subtle snout scratches
      - Dark leathery charcoal-brown lip border & warm honey-tan shaggy chin/throat highlights
    """
    u = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)[None, :]
    v = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)[:, None]

    # 0 top forehead/bridge, 1 bottom chin/lip; lateral cheek peak around v=0.25 & 0.75
    ventral = 1.0 - np.abs(2.0 * v - 1.0)
    side_v = np.minimum(np.abs(v - 0.25), np.abs(v - 0.75))  # 0 right at lateral cheek/eye line

    strand, fur_h, guard_threads = _shaggy_fur_field(size, seed=607, along_v=False)
    fbm_m = _tileable_fbm(size, base_freq=7, octaves=4, seed=641)
    fbm_f = _tileable_fbm(size, base_freq=22, octaves=3, seed=677)
    pores = _tileable_fbm(size, base_freq=48, octaves=2, seed=709)

    col_espresso  = _hex_rgb("#2b1b10")   # Dark shaggy occiput & cheek beard
    col_brown     = _hex_rgb("#543a24")   # Rich medium sloth coat
    col_muzzle    = _hex_rgb("#7c6248")   # Short dense velvety warm brown-taupe forehead & snout (portrait!)
    col_muzzle_hi = _hex_rgb("#9e8364")   # Pale weathered muzzle & brow highlight
    col_orbit_dk  = _hex_rgb("#1c120c")   # Subtle dark shadowed eye ring
    col_chin_tan  = _hex_rgb("#9c7b54")   # Warm honey-tan lower chin/throat beard
    col_lip       = _hex_rgb("#261d19")   # Dark leathery charcoal-brown lip margin
    col_scar_mid  = _hex_rgb("#7c493b")   # Healed weathered pinkish-brown cheek scar (portrait!)
    col_scar_cleft = _hex_rgb("#2c1712")  # Deep dark scar seam

    # 1. Rear shaggy dark brown fur blending smoothly into shorter warm taupe-brown face/snout fur
    snout_zone = _smoothstep(0.28, 0.78, u + (fbm_m - 0.5) * 0.14)
    shaggy_col = col_espresso[None, None, :] * (1.0 - strand[..., None]) + col_brown[None, None, :] * strand[..., None]
    velvet_col = col_brown[None, None, :] * (1.0 - (0.55 * strand + 0.45 * fbm_f)[..., None]) + col_muzzle[None, None, :] * (0.55 * strand + 0.45 * fbm_f)[..., None]

    rgb = shaggy_col * (1.0 - snout_zone[..., None] * 0.85) + velvet_col * (snout_zone[..., None] * 0.85)

    # Lighter weathered taupe-tan crown, brow bridge & upper muzzle sheen (exact portrait lighting read!)
    bridge_hi = _smoothstep(0.42, 0.04, ventral) * _smoothstep(0.22, 0.74, u) * _smoothstep(0.95, 0.78, u)
    bridge_hi *= (0.45 + 0.55 * strand)
    rgb = rgb * (1.0 - bridge_hi[..., None] * 0.45) + col_muzzle_hi[None, None, :] * (bridge_hi[..., None] * 0.45)

    # Warm honey-tan shaggy throat/chin underfur transitioning into neck ruff
    chin_mask = _smoothstep(0.62, 0.90, ventral) * _smoothstep(0.68, 0.16, u)
    rgb = rgb * (1.0 - chin_mask[..., None] * 0.52) + col_chin_tan[None, None, :] * (chin_mask[..., None] * 0.52)

    # Subtle dark smoky shadow right around both eye orbits (u ~ 0.44, v ~ 0.21 & 0.79)
    orbit_d_l = np.sqrt(((u - 0.45) / 0.10) ** 2 + ((v - 0.20) / 0.085) ** 2)
    orbit_d_r = np.sqrt(((u - 0.45) / 0.10) ** 2 + ((v - 0.80) / 0.085) ** 2)
    orbit_dark = np.maximum(_smoothstep(1.0, 0.22, orbit_d_l), _smoothstep(1.0, 0.22, orbit_d_r))
    rgb = rgb * (1.0 - orbit_dark[..., None] * 0.55) + col_orbit_dk[None, None, :] * (orbit_dark[..., None] * 0.55)

    # Signature portrait battle scar: organically jagged healed diagonal scar behind camera-facing right eye (-Y, v in [0.65, 0.84])!
    # Right eye sits at u=0.45, v=0.80; scar sweeps from upper temple (u=0.35, v=0.83) down across cheek (u=0.27, v=0.66).
    scar_t = (0.84 - v) / 0.19
    scar_jitter = (fbm_f - 0.5) * 0.018 + (fbm_m - 0.5) * 0.012
    scar_u_center = 0.35 - 0.075 * scar_t + 0.014 * np.sin(scar_t * np.pi) + scar_jitter
    scar_dist = np.abs(u - scar_u_center)
    scar_span = _smoothstep(-0.02, 0.14, scar_t) * _smoothstep(1.02, 0.82, scar_t)
    # Tapered width (widest near mid-cheek, feathering organically into fur at both ends)
    scar_w = 0.45 + 0.55 * np.sin(np.clip(scar_t, 0.0, 1.0) * np.pi)
    scar_break = 0.55 + 0.45 * fbm_f
    scar_core = _smoothstep(0.0085 * scar_w, 0.0015 * scar_w, scar_dist) * scar_span * scar_break
    scar_halo = _smoothstep(0.018 * scar_w, 0.004 * scar_w, scar_dist) * scar_span * scar_break
    rgb = rgb * (1.0 - scar_halo[..., None] * 0.48) + col_scar_mid[None, None, :] * (scar_halo[..., None] * 0.48)
    rgb = rgb * (1.0 - scar_core[..., None] * 0.65) + col_scar_cleft[None, None, :] * (scar_core[..., None] * 0.65)

    # Subtle weathered scratch marks on snout bridge (camera-facing right & left sides, matching portrait!)
    scr1 = _smoothstep(0.006, 0.001, np.abs((u - 0.64) * 0.9 - (0.78 - v) * 0.6 + scar_jitter * 0.4)) * _smoothstep(0.07, 0.0, np.abs(v - 0.78))
    scr2 = _smoothstep(0.005, 0.001, np.abs((u - 0.68) * 0.8 + (0.82 - v) * 0.5 - scar_jitter * 0.4)) * _smoothstep(0.06, 0.0, np.abs(v - 0.82))
    scr3 = _smoothstep(0.005, 0.001, np.abs((u - 0.65) * 0.9 - (v - 0.22) * 0.6 + scar_jitter * 0.4)) * _smoothstep(0.06, 0.0, np.abs(v - 0.22))
    snout_scratches = np.clip(scr1 + scr2 + scr3 * 0.7, 0.0, 1.0) * 0.65
    rgb = rgb * (1.0 - snout_scratches[..., None] * 0.35) + col_scar_mid[None, None, :] * (snout_scratches[..., None] * 0.35)

    # Dark leathery muzzle tip border & charcoal-brown lip margin along ventral mouth line
    lip_mask = _smoothstep(0.76, 0.96, ventral) * _smoothstep(0.34, 0.58, u)
    nose_rim = _smoothstep(0.84, 0.96, u)
    leather_mask = np.clip(np.maximum(lip_mask * 0.88, nose_rim * 0.78), 0.0, 1.0)
    rgb = rgb * (1.0 - leather_mask[..., None]) + col_lip[None, None, :] * leather_mask[..., None]

    # Finer height near snout, coarser shaggy height toward cheeks/crown + indented scar
    ao = 0.80 + 0.20 * (fur_h * (1.0 - 0.45 * snout_zone) + pores * 0.45 * snout_zone)
    rgb = rgb * ao[..., None]

    height = (
        (1.0 - snout_zone * 0.55) * (0.66 * fur_h + 0.20 * guard_threads + 0.14 * fbm_f)
        + (snout_zone * 0.55) * (0.45 * fur_h + 0.35 * pores + 0.20 * fbm_f)
    )
    height = np.clip(height - scar_core * 0.40 + (scar_halo - scar_core) * 0.14 - snout_scratches * 0.16, 0.0, 1.0)

    albedo = np.clip(rgb, 0, 255).astype(np.uint8)
    normal_rgb = _height_to_normal_rgb(height, strength=3.6)

    _save_png_rgb(os.path.join(TEX_DIR, "giantsloth_cranium_albedo.png"), albedo)
    _save_png_rgb(os.path.join(TEX_DIR, "giantsloth_cranium_normal.png"), normal_rgb)
    print(f"[TEX OK] giantsloth cranium face maps ({size}x{size})")


def generate_giantsloth_nose_maps(size=512):
    """
    Pebbled dark charcoal-slate leathery rhinarium nose pad matching assets/portraits/giantsloth.png!
    Voronoi micro-cobblestone nose leather with deep crevice darkening and subtle weathered highlight.
    """
    edge1, d1, cval = _voronoi_pebbles(size, 42, 42, seed=811, jitter=0.74)
    edge2, _, _ = _voronoi_pebbles(size, 84, 84, seed=839, jitter=0.70)
    macro = _tileable_fbm(size, base_freq=6, octaves=3, seed=863)

    pebble_dome = _smoothstep(0.0, 0.26, edge1) * (1.0 - 0.28 * np.clip(d1, 0.0, 1.0))
    micro_pebble = _smoothstep(0.0, 0.24, edge2)
    height = np.clip(0.68 * pebble_dome + 0.22 * micro_pebble + 0.10 * macro, 0.0, 1.0)

    col_seam  = _hex_rgb("#0f0d0c")  # Deep charcoal-black leather crevices
    col_base  = _hex_rgb("#262220")  # Rich slate-charcoal rhinarium
    col_crown = _hex_rgb("#433c37")  # Subtle dusty satin highlight on pebble tops

    rgb = col_seam[None, None, :] * (1.0 - pebble_dome[..., None]) + col_base[None, None, :] * pebble_dome[..., None]
    crown = _smoothstep(0.58, 0.94, height) * (0.65 + 0.35 * cval)
    rgb = rgb * (1.0 - crown[..., None] * 0.55) + col_crown[None, None, :] * (crown[..., None] * 0.55)

    albedo = np.clip(rgb, 0, 255).astype(np.uint8)
    normal_rgb = _height_to_normal_rgb(height, strength=4.0)

    _save_png_rgb(os.path.join(TEX_DIR, "giantsloth_nose_albedo.png"), albedo)
    _save_png_rgb(os.path.join(TEX_DIR, "giantsloth_nose_normal.png"), normal_rgb)
    print(f"[TEX OK] giantsloth pebbled rhinarium nose maps ({size}x{size})")


def generate_giantsloth_claw_maps(size=512):
    """
    Colossal curved dark horn-charcoal sickle claws matching assets/portraits/giantsloth.png:
      u in [0, 1]: circumferential angle (u=0/1 dorsal ridge, u=0.5 ventral cutting concavity)
      v in [0, 1]: 0.0 = ungual sheath root -> 1.0 = razor curved obsidian tip
    Rich dark obsidian-horn body with subtle warm weathered bone-tan dorsal keel striations,
    deep longitudinal keratin growth grooves, and subtle transverse growth bands.
    """
    u = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)[None, :]
    v = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)[:, None]

    # Longitudinal keratin flutes running root->tip (along v) + transverse growth bands
    flutes_c = _tileable_value_noise_rect(size, size, 6, 42, seed=907)
    flutes_f = _tileable_value_noise_rect(size, size, 12, 96, seed=929)
    bands    = _tileable_value_noise_rect(size, size, 28, 6, seed=953)
    grit     = _tileable_fbm(size, base_freq=10, octaves=3, seed=977)

    # Dorsal outer edge (u near 0 or 1) catches worn pale keratin highlight (exact portrait detail!)
    dorsal = np.abs(2.0 * u - 1.0)  # 1 at u=0/1 (dorsal outer arc), 0 at u=0.5 (inner curve)

    col_root   = _hex_rgb("#4c3a2b")  # Weathered horn-brown cuticle base
    col_body   = _hex_rgb("#26211e")  # Dark charcoal-obsidian claw body (portrait!)
    col_tip    = _hex_rgb("#13100f")  # Gleaming razor-dark obsidian tip
    col_ridge  = _hex_rgb("#8e7e69")  # Worn pale warm-horn dorsal keratin highlight
    col_streak = _hex_rgb("#655748")  # Subtle pale keratin longitudinal striations

    # Root -> body -> glossy obsidian tip gradient
    root_w = _smoothstep(0.28, 0.0, v)
    tip_w  = _smoothstep(0.60, 0.96, v)
    rgb = np.broadcast_to(col_body[None, None, :], (size, size, 3)).copy()
    rgb = rgb * (1.0 - root_w[..., None] * 0.78) + col_root[None, None, :] * (root_w[..., None] * 0.78)
    rgb = rgb * (1.0 - tip_w[..., None] * 0.65) + col_tip[None, None, :] * (tip_w[..., None] * 0.65)

    # Subtle weathered horn longitudinal streaks & worn outer dorsal highlight
    streak_m = _smoothstep(0.45, 0.85, flutes_c * 0.65 + flutes_f * 0.35) * (1.0 - 0.55 * tip_w)
    rgb = rgb * (1.0 - streak_m[..., None] * 0.45) + col_streak[None, None, :] * (streak_m[..., None] * 0.45)

    dorsal_wear = _smoothstep(0.56, 0.94, dorsal) * _smoothstep(0.06, 0.26, v) * _smoothstep(0.95, 0.68, v)
    dorsal_wear *= (0.55 + 0.45 * flutes_c)
    rgb = rgb * (1.0 - dorsal_wear[..., None] * 0.58) + col_ridge[None, None, :] * (dorsal_wear[..., None] * 0.58)

    # Subtle transverse keratin growth rings
    ring_wave = 0.5 + 0.5 * np.sin((v * 18.0 + (grit - 0.5) * 1.4) * np.pi * 2.0)
    height = np.clip(0.46 * flutes_c + 0.26 * flutes_f + 0.16 * bands + 0.12 * ring_wave, 0.0, 1.0)
    rgb = rgb * (0.84 + 0.16 * height[..., None])

    albedo = np.clip(rgb, 0, 255).astype(np.uint8)
    normal_rgb = _height_to_normal_rgb(height, strength=2.6)

    _save_png_rgb(os.path.join(TEX_DIR, "giantsloth_claw_albedo.png"), albedo)
    _save_png_rgb(os.path.join(TEX_DIR, "giantsloth_claw_normal.png"), normal_rgb)
    print(f"[TEX OK] giantsloth sickle claw keratin maps ({size}x{size})")


def generate_giantsloth_oral_and_eye_maps():
    """Generates mammalian mucosa, weathered herbivore peg-tooth, and warm amber-chestnut iris maps."""
    # 1. Oral mucosa & prehensile tongue (256x256)
    msz = 256
    fbm_m = _tileable_fbm(msz, base_freq=8, octaves=4, seed=1013)
    papilla = _tileable_fbm(msz, base_freq=32, octaves=2, seed=1031)
    c_gum_dk = _hex_rgb("#48181b")
    c_gum_lt = _hex_rgb("#8c383b")
    rgb_m = c_gum_dk[None, None, :] * (1.0 - fbm_m[..., None]) + c_gum_lt[None, None, :] * fbm_m[..., None]
    rgb_m *= (0.86 + 0.14 * papilla[..., None])
    _save_png_rgb(os.path.join(TEX_DIR, "giantsloth_mucosa_albedo.png"), np.clip(rgb_m, 0, 255).astype(np.uint8))
    _save_png_rgb(os.path.join(TEX_DIR, "giantsloth_mucosa_normal.png"), _height_to_normal_rgb(0.6 * fbm_m + 0.4 * papilla, strength=2.2))

    # 2. Herbivore hypsodont peg teeth (256x256, v=0 stained root -> v=1 worn ochre-ivory crown)
    tsz = 256
    v = np.linspace(1.0, 0.0, tsz, endpoint=False, dtype=np.float32)[:, None]
    enamel = _tileable_value_noise_rect(tsz, tsz, 8, 40, seed=1061)
    c_troot = _hex_rgb("#5e4730")
    c_tbody = _hex_rgb("#cbb892")
    c_tcrown = _hex_rgb("#e2d6bc")
    t_rgb = c_troot[None, None, :] * _smoothstep(0.32, 0.0, v)[..., None] + c_tbody[None, None, :] * (1.0 - _smoothstep(0.32, 0.0, v))[..., None]
    t_rgb = t_rgb * (1.0 - _smoothstep(0.55, 0.95, v)[..., None] * 0.55) + c_tcrown[None, None, :] * (_smoothstep(0.55, 0.95, v)[..., None] * 0.55)
    t_rgb = t_rgb * (0.88 + 0.12 * enamel[..., None])
    _save_png_rgb(os.path.join(TEX_DIR, "giantsloth_tooth_albedo.png"), np.clip(t_rgb, 0, 255).astype(np.uint8))
    _save_png_rgb(os.path.join(TEX_DIR, "giantsloth_tooth_normal.png"), _height_to_normal_rgb(enamel, strength=1.4))

    # 3. Warm Expressive Burnt-Amber / Chestnut Mammalian Iris (256x256, matched to giantsloth.png!)
    isz = 256
    xs = np.linspace(-1.0, 1.0, isz, dtype=np.float32)[None, :]
    ys = np.linspace(-1.0, 1.0, isz, dtype=np.float32)[:, None]
    r = np.sqrt(xs * xs + ys * ys)
    ang = np.arctan2(ys, xs)
    # Fine radial mammalian iris crypt fibers
    fibers = (
        0.5
        + 0.25 * np.sin(ang * 28.0 + r * 8.0)
        + 0.15 * np.sin(ang * 56.0 - r * 14.0)
        + 0.10 * np.cos(ang * 14.0 + r * 4.0)
    )
    c_sclera = _hex_rgb("#1c120d")   # Dark brown mammalian sclera edge
    c_limbal = _hex_rgb("#140904")   # Crisp dark limbal ring
    c_amber  = _hex_rgb("#8f4212")   # Deep rich soulful chestnut-amber iris (portrait!)
    c_gold   = _hex_rgb("#d47b24")   # Warm glowing burnt-amber inner iris ring
    c_pupil  = _hex_rgb("#060403")

    iris_col = c_amber[None, None, :] * (1.0 - fibers[..., None] * 0.55) + c_gold[None, None, :] * (fibers[..., None] * 0.55)
    inner_glow = _smoothstep(0.62, 0.30, r)
    iris_col = iris_col * (1.0 - inner_glow[..., None] * 0.35) + c_gold[None, None, :] * (inner_glow[..., None] * 0.35)
    limbal = _smoothstep(0.64, 0.84, r)
    iris_col = iris_col * (1.0 - limbal[..., None] * 0.80) + c_limbal[None, None, :] * (limbal[..., None] * 0.80)
    outer = _smoothstep(0.84, 0.96, r)
    iris_col = iris_col * (1.0 - outer[..., None]) + c_sclera[None, None, :] * outer[..., None]
    pup_m = _smoothstep(0.32, 0.24, r)
    iris_col = iris_col * (1.0 - pup_m[..., None]) + c_pupil[None, None, :] * pup_m[..., None]

    _save_png_rgb(os.path.join(TEX_DIR, "giantsloth_iris_albedo.png"), np.clip(iris_col, 0, 255).astype(np.uint8))
    print("[TEX OK] giantsloth oral mucosa, teeth & warm amber iris maps")


def generate_all():
    generate_giantsloth_body_maps(1024)
    generate_giantsloth_cranium_maps(1024)
    generate_giantsloth_nose_maps(512)
    generate_giantsloth_claw_maps(512)
    generate_giantsloth_oral_and_eye_maps()
    print("[ALL GIANTSLOTH PBR TEXTURES GENERATED]")


if __name__ == "__main__":
    generate_all()
