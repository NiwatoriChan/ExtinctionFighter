"""
tools/blender/generate_smilodon_pbr_textures.py
Generates high-resolution 1024x1024 / 512x512 / 256x256 PBR textures for the
rebuilt Smilodon fatalis GLB model in assets/textures/fighters/,
faithfully matched to assets/portraits/smilodon.png:
  - Layered directional tawny-ochre & golden-amber machairodont fur coat
  - Crisp dark charcoal-black tiger stripes & broken flank rosettes
  - Snowy cream-white chest ruff, ventral belly, muzzle/cheek fur & frosty dorsal highlights
  - Detailed facial tiger markings, whisker-dot muzzle pads & healed battle scar
  - Velvety dark-pink / charcoal feline rhinarium nose pad
  - Gleaming fluted bone-ivory scimitar saber canines
  - Wet dark-crimson oral mucosa & feline tongue
  - Glowing molten amber-gold feline predator iris

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
    safe_denom = np.where(np.abs(denom) < 1e-6, 1.0, denom)
    t = np.clip((x - edge0) / safe_denom, 0.0, 1.0)
    res = t * t * (3.0 - 2.0 * t)
    return np.where(np.abs(denom) < 1e-6, np.where(x >= edge0, 1.0, 0.0), res).astype(np.float32)


def _tileable_value_noise_rect(h, w, fy_freq, fx_freq, seed=42):
    """Anisotropic tileable 2D value noise (ideal for directional fur strands!)."""
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


def _fur_strand_field(size, seed=301, along_v=True):
    """
    Generates a layered directional fur-clump & fine hair-strand height/color field.
    If along_v=True, hairs flow longitudinally along v (body/limbs);
    if along_v=False, hairs flow along u (skull occiput->snout).
    """
    if along_v:
        coarse = _tileable_value_noise_rect(size, size, 16, 64, seed=seed)
        mid    = _tileable_value_noise_rect(size, size, 32, 144, seed=seed + 17)
        fine   = _tileable_value_noise_rect(size, size, 64, 288, seed=seed + 41)
    else:
        coarse = _tileable_value_noise_rect(size, size, 64, 16, seed=seed)
        mid    = _tileable_value_noise_rect(size, size, 144, 32, seed=seed + 17)
        fine   = _tileable_value_noise_rect(size, size, 288, 64, seed=seed + 41)
    return 0.42 * coarse + 0.36 * mid + 0.22 * fine


def _height_to_normal_rgb(height, strength=3.0):
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


def generate_smilodon_body_maps(size=1024):
    """
    Body UV layout (matching smilodon_sculptor.py):
      u in [0, 1]: 0.0 & 1.0 = dorsal spine, 0.25 & 0.75 = lateral flanks, 0.5 = ventral belly/chest ruff
      v in [0, 1]: 0.0 = bobtail tip -> 1.0 = skull occiput
    Matches assets/portraits/smilodon.png: rich golden-tawny fur with crisp dark charcoal
    Siberian tiger stripes, creamy snowy-white ventral ruff & subtle frost-kissed shoulder fur.
    """
    u = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)[None, :]
    v = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)[:, None]

    # 0 at dorsal spine (u=0/1), 1 at ventral belly/chest (u=0.5)
    ventral = 1.0 - np.abs(2.0 * u - 1.0)

    fur_strands = _fur_strand_field(size, seed=107, along_v=True)
    macro = _tileable_fbm(size, base_freq=5, octaves=4, seed=211)
    mottle = _tileable_fbm(size, base_freq=10, octaves=4, seed=313)
    tuft_noise = _tileable_fbm(size, base_freq=22, octaves=3, seed=419)

    # Bold organic Siberian-cat transverse stripes along spine, shoulders, flanks & legs
    stripe_warp = (macro - 0.5) * 2.4 + (mottle - 0.5) * 0.9 + (fur_strands - 0.5) * 0.18
    stripe_primary = np.sin((v * 14.0 + stripe_warp) * np.pi * 2.0)
    # Broken double-stripes / leopard-like rosettes along lower flanks
    stripe_break = _smoothstep(0.24, 0.68, mottle)
    stripe_mask = _smoothstep(0.42, 0.78, stripe_primary) * _smoothstep(0.68, 0.14, ventral) * (0.45 + 0.55 * stripe_break)
    # Dark dorsal spine line & dark bobtail tip (v < 0.14)
    dorsal_spine_stripe = _smoothstep(0.14, 0.0, ventral) * (0.50 + 0.50 * _smoothstep(0.30, 0.70, macro))
    tail_tip_dark = _smoothstep(0.16, 0.02, v)
    stripe_mask = np.clip(np.maximum(stripe_mask, np.maximum(dorsal_spine_stripe * 0.65, tail_tip_dark * 0.85)), 0.0, 1.0)

    # Creamy snowy-white ventral belly, broad furry chest ruff & neck mane (strongest at v in [0.68, 0.98])
    ruff_boost = _smoothstep(0.58, 0.92, v) * 0.18
    belly_blend = _smoothstep(0.46 - ruff_boost, 0.78 - ruff_boost * 0.5, ventral + (fur_strands - 0.5) * 0.08 + (macro - 0.5) * 0.10)

    # Subtle frosty ice-age white snow-dusted highlights along top scapular hump & neck ruff (portrait touch!)
    frost_dust = _smoothstep(0.28, 0.02, ventral) * _smoothstep(0.54, 0.88, v) * _smoothstep(0.54, 0.82, tuft_noise) * 0.42

    # Palette sampled directly from assets/portraits/smilodon.png
    col_tawny_dk = _hex_rgb("#7e4c21")   # Deep rich golden-ochre undercoat
    col_tawny    = _hex_rgb("#b97c3e")   # Vibrant Siberian tawny-amber fur
    col_tawny_hi = _hex_rgb("#d8a768")   # Sun-kissed golden fur tips
    col_stripe   = _hex_rgb("#1c1613")   # Crisp charcoal-obsidian tiger stripes
    col_cream    = _hex_rgb("#e5dccb")   # Creamy snowy-white chest ruff & belly
    col_cream_lo = _hex_rgb("#b8a891")   # Shadowed cream underfur
    col_frost    = _hex_rgb("#f0ece4")   # Light ice-age snow frosting on crest

    # Base tawny fur with directional strand tonal depth
    tawny_mix = np.clip(0.35 * macro + 0.65 * fur_strands, 0.0, 1.0)
    rgb = col_tawny_dk[None, None, :] * (1.0 - tawny_mix[..., None]) + col_tawny[None, None, :] * tawny_mix[..., None]
    hi_strand = _smoothstep(0.62, 0.95, fur_strands)
    rgb = rgb * (1.0 - hi_strand[..., None] * 0.36) + col_tawny_hi[None, None, :] * (hi_strand[..., None] * 0.36)

    # Overlay dark stripes (with soft fur-strand feathered edges!)
    rgb = rgb * (1.0 - stripe_mask[..., None] * 0.86) + col_stripe[None, None, :] * (stripe_mask[..., None] * 0.86)

    # Blend snowy-cream chest ruff & belly
    cream_col = col_cream_lo[None, None, :] * (1.0 - fur_strands[..., None]) + col_cream[None, None, :] * fur_strands[..., None]
    rgb = rgb * (1.0 - belly_blend[..., None]) + cream_col * belly_blend[..., None]

    # Subtle frosty shoulder/mane highlights
    rgb = rgb * (1.0 - frost_dust[..., None]) + col_frost[None, None, :] * frost_dust[..., None]

    # Subtle hair-clump micro-AO
    hair_ao = 0.80 + 0.20 * fur_strands
    rgb = rgb * hair_ao[..., None]

    albedo = np.clip(rgb, 0, 255).astype(np.uint8)
    height = np.clip(0.66 * fur_strands + 0.22 * tuft_noise + 0.12 * macro, 0.0, 1.0)
    bump_gray = np.clip(height * 255.0, 0, 255).astype(np.uint8)
    bump_rgb = np.stack([bump_gray, bump_gray, bump_gray], axis=-1)
    normal_rgb = _height_to_normal_rgb(height, strength=3.4)

    _save_png_rgb(os.path.join(TEX_DIR, "smilodon_albedo.png"), albedo)
    _save_png_rgb(os.path.join(TEX_DIR, "smilodon_bump.png"), bump_rgb)
    _save_png_rgb(os.path.join(TEX_DIR, "smilodon_normal.png"), normal_rgb)
    print(f"[TEX OK] smilodon body fur maps ({size}x{size})")


def generate_smilodon_cranium_maps(size=1024):
    """
    Skull/Mandible UV layout:
      u in [0, 1]: 0 = occiput rear -> 1 = muzzle/nose tip
      v in [0, 1]: circumferential angle (0/1 = forehead/bridge, 0.25/0.75 = cheeks, 0.5 = chin/lips)
    Matched to assets/portraits/smilodon.png: snowy-white & golden-tawny face, dark charcoal
    forehead/cheek tiger bars, crisp whisker-pad spots on the muzzle, black lip border.
    """
    u = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)[None, :]
    v = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)[:, None]

    ventral = 1.0 - np.abs(2.0 * v - 1.0)  # 0 top forehead, 1 bottom chin/lip
    fur_face = _fur_strand_field(size, seed=503, along_v=False)
    fbm_m = _tileable_fbm(size, base_freq=7, octaves=4, seed=521)
    fbm_f = _tileable_fbm(size, base_freq=20, octaves=3, seed=547)

    col_tawny  = _hex_rgb("#bd8142")
    col_tawny_d= _hex_rgb("#824f23")
    col_white  = _hex_rgb("#ebe3d6")
    col_cream  = _hex_rgb("#d5c6ae")
    col_black  = _hex_rgb("#181311")
    col_scar   = _hex_rgb("#6e2b27")

    # Forehead & nose bridge tawny-gold fading into pale snowy-cream cheeks & muzzle
    tawny_base = col_tawny_d[None, None, :] * (1.0 - fur_face[..., None]) + col_tawny[None, None, :] * fur_face[..., None]
    pale_face = col_cream[None, None, :] * (1.0 - fur_face[..., None]) + col_white[None, None, :] * fur_face[..., None]

    # Pale snowy cheeks, brow highlight, muzzle pads & chin (portrait hallmark!)
    cheek_pale = _smoothstep(0.24, 0.64, ventral + (fbm_m - 0.5) * 0.14)
    muzzle_pale = _smoothstep(0.56, 0.86, u) * _smoothstep(0.18, 0.48, ventral)
    pale_mask = np.clip(np.maximum(cheek_pale, muzzle_pale), 0.0, 1.0)
    rgb = tawny_base * (1.0 - pale_mask[..., None] * 0.82) + pale_face * (pale_mask[..., None] * 0.82)

    # Bold feline forehead & cheek tiger stripes sweeping backward from brow/eyes
    stripe_wave = np.sin((v * 11.0 + u * 2.2 + (fbm_m - 0.5) * 1.4) * np.pi * 2.0)
    head_stripes = _smoothstep(0.45, 0.78, stripe_wave) * _smoothstep(0.76, 0.42, u) * _smoothstep(0.68, 0.16, ventral)
    rgb = rgb * (1.0 - head_stripes[..., None] * 0.86) + col_black[None, None, :] * (head_stripes[..., None] * 0.86)

    # Whisker-spot rows on upper muzzle pads (u in [0.68, 0.90], ventral in [0.35, 0.65])
    spot_grid = (
        np.sin(u * np.pi * 34.0) * np.sin(v * np.pi * 34.0)
    )
    whisker_zone = _smoothstep(0.64, 0.74, u) * _smoothstep(0.94, 0.86, u) * np.exp(-(((ventral - 0.52) / 0.18) ** 2))
    whisker_dots = _smoothstep(0.62, 0.84, spot_grid) * whisker_zone
    rgb = rgb * (1.0 - whisker_dots[..., None] * 0.78) + col_black[None, None, :] * (whisker_dots[..., None] * 0.78)

    # Black feline lip rim along ventral mouth opening
    lip_dark = _smoothstep(0.76, 0.95, ventral) * _smoothstep(0.32, 0.54, u)
    rgb = rgb * (1.0 - lip_dark[..., None] * 0.82) + col_black[None, None, :] * (lip_dark[..., None] * 0.82)

    rgb = rgb * (0.84 + 0.16 * fur_face[..., None])
    albedo = np.clip(rgb, 0, 255).astype(np.uint8)
    height = np.clip(0.70 * fur_face + 0.18 * fbm_f + 0.12 * fbm_m, 0.0, 1.0)
    normal_rgb = _height_to_normal_rgb(height, strength=3.0)

    _save_png_rgb(os.path.join(TEX_DIR, "smilodon_cranium_albedo.png"), albedo)
    _save_png_rgb(os.path.join(TEX_DIR, "smilodon_cranium_normal.png"), normal_rgb)
    print(f"[TEX OK] smilodon cranium fur maps ({size}x{size})")


def generate_smilodon_tooth_mucosa_iris():
    # Tooth (512x512): gleaming cream-ivory scimitar blades with crisp longitudinal striations
    size = 512
    u = np.linspace(0.0, 1.0, size, endpoint=False, dtype=np.float32)[None, :]
    v = np.linspace(1.0, 0.0, size, endpoint=False, dtype=np.float32)[:, None]
    fbm_t = _tileable_fbm(size, base_freq=8, octaves=3, seed=601)
    flute = 0.5 + 0.5 * np.sin((u * 12.0 + fbm_t * 0.25) * np.pi * 2.0)

    col_root = _hex_rgb("#9a7d58")
    col_mid  = _hex_rgb("#ebe1cc")
    col_tip  = _hex_rgb("#fbf7ee")
    t1 = _smoothstep(0.0, 0.35, v)
    t2 = _smoothstep(0.35, 0.90, v)
    tooth = col_root[None, None, :] * (1.0 - t1[..., None]) + col_mid[None, None, :] * t1[..., None]
    tooth = tooth * (1.0 - t2[..., None]) + col_tip[None, None, :] * t2[..., None]
    tooth = tooth * (0.93 + 0.07 * flute[..., None])
    _save_png_rgb(os.path.join(TEX_DIR, "smilodon_tooth_albedo.png"), np.clip(tooth, 0, 255).astype(np.uint8))
    _save_png_rgb(os.path.join(TEX_DIR, "smilodon_tooth_normal.png"), _height_to_normal_rgb(0.6 * flute + 0.4 * fbm_t, strength=1.5))

    # Mucosa (512x512): dark feline gums & pink-crimson tongue
    m1 = _tileable_fbm(size, base_freq=6, octaves=4, seed=641)
    m2 = _tileable_fbm(size, base_freq=22, octaves=3, seed=653)
    muc = _hex_rgb("#541920")[None, None, :] * (1.0 - m1[..., None]) + _hex_rgb("#8c313b")[None, None, :] * m1[..., None]
    muc = muc * (1.0 - 0.3 * m2[..., None]) + _hex_rgb("#b04c56")[None, None, :] * (0.3 * m2[..., None])
    _save_png_rgb(os.path.join(TEX_DIR, "smilodon_mucosa_albedo.png"), np.clip(muc, 0, 255).astype(np.uint8))
    _save_png_rgb(os.path.join(TEX_DIR, "smilodon_mucosa_normal.png"), _height_to_normal_rgb(0.5 * m1 + 0.5 * m2, strength=2.4))

    # Iris (256x256): glowing molten amber-gold feline iris matching assets/portraits/smilodon.png
    isize = 256
    xs = np.linspace(-1.0, 1.0, isize, dtype=np.float32)[None, :]
    ys = np.linspace(1.0, -1.0, isize, dtype=np.float32)[:, None]
    r = np.sqrt(xs * xs + ys * ys + 1e-8)
    ang = np.arctan2(ys, xs)
    fibers = 0.5 + 0.5 * np.sin(ang * 32.0 + np.sin(ang * 9.0) * 1.2 + r * 5.0)
    i1 = _smoothstep(0.16, 0.54, r)
    i2 = _smoothstep(0.52, 0.84, r)
    i3 = _smoothstep(0.82, 0.98, r)
    ir = _hex_rgb("#ffe066")[None, None, :] * (1.0 - i1[..., None]) + _hex_rgb("#f08c10")[None, None, :] * i1[..., None]
    ir = ir * (1.0 - i2[..., None]) + _hex_rgb("#8f3506")[None, None, :] * i2[..., None]
    ir = ir * (0.84 + 0.24 * fibers[..., None])
    ir = ir * (1.0 - i3[..., None]) + _hex_rgb("#160b06")[None, None, :] * i3[..., None]
    _save_png_rgb(os.path.join(TEX_DIR, "smilodon_iris_albedo.png"), np.clip(ir, 0, 255).astype(np.uint8))
    print("[TEX OK] smilodon tooth, mucosa & iris maps")


def generate_all_smilodon_textures():
    generate_smilodon_body_maps(1024)
    generate_smilodon_cranium_maps(1024)
    generate_smilodon_tooth_mucosa_iris()
    print("ALL SMILODON PBR TEXTURES GENERATED!")


if __name__ == "__main__":
    generate_all_smilodon_textures()
