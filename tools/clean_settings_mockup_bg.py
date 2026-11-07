import os
from PIL import Image, ImageFilter, ImageOps, ImageDraw, ImageEnhance

def make_perfect_clean_slab_and_bg():
    src = Image.open('assets/mockups/settings_bg.jpg').convert('RGBA')
    w, h = src.size # 1024, 572

    # 1. SLAB EXTRACTION (606 x 354 -> 1212 x 708)
    slab_crop = src.crop((92, 138, 698, 492))
    SW = slab_crop.width * 2  # 1212
    SH = slab_crop.height * 2 # 708
    slab_hd = slab_crop.resize((SW, SH), Image.Resampling.LANCZOS)

    # Clean dark stone strips from unoccluded margins:
    # Left margin: x: 30..88, y: 30..SH-30
    # Right margin: x: SW-95..SW-30, y: 30..SH-30
    strip_l = slab_hd.crop((36, 36, 84, SH - 36))
    strip_r = slab_hd.crop((SW - 84, 36, SW - 36, SH - 36))

    inner_x1 = 80
    inner_x2 = SW - 80
    inner_y1 = 36
    inner_y2 = SH - 36
    inner_w = inner_x2 - inner_x1
    inner_h = inner_y2 - inner_y1

    # Synthesize immaculate stone texture
    s_l = strip_l.resize((inner_w // 2, inner_h), Image.Resampling.LANCZOS)
    s_r = strip_r.resize((inner_w // 2, inner_h), Image.Resampling.LANCZOS)

    clean_inner = Image.new('RGBA', (inner_w, inner_h))
    clean_inner.paste(s_l, (0, 0))
    clean_inner.paste(s_r, (inner_w // 2, 0))
    # Soft horizontal blend for natural stone clefts
    clean_inner = clean_inner.filter(ImageFilter.GaussianBlur(radius=1.5))

    # Add gentle stone texture variation
    enh = ImageEnhance.Brightness(clean_inner)
    clean_inner = enh.enhance(0.96)

    clean_slab = slab_hd.copy()
    clean_slab.paste(clean_inner, (inner_x1, inner_y1))

    # Alpha mask for slab with chipped stone bevels
    mask_slab = Image.new('L', (SW, SH), 0)
    draw_s = ImageDraw.Draw(mask_slab)
    draw_s.rounded_rectangle([12, 10, SW - 12, SH - 10], radius=24, fill=255)
    mask_slab = mask_slab.filter(ImageFilter.GaussianBlur(radius=2.5))
    clean_slab.putalpha(mask_slab)
    clean_slab.save('assets/ui/settings_main_slab.png')
    print('1. Saved spotless assets/ui/settings_main_slab.png (1212x708)')

    # 2. CLEAN BACKGROUND (1024x572 -> 1920x1080)
    bg = src.convert('RGB')

    # Paste the clean slab onto bg at (92, 138)
    slab_1x = clean_slab.resize((606, 354), Image.Resampling.LANCZOS)
    # Mask for smooth blend
    mask_1x = mask_slab.resize((606, 354), Image.Resampling.LANCZOS)
    bg.paste(slab_1x.convert('RGB'), (92, 138), mask_1x)

    # Clean top title (x: 350..665, y: 5..82)
    sky_l = src.crop((230, 8, 350, 82)).convert('RGB')
    sky_r = src.crop((665, 8, 785, 82)).convert('RGB')
    sky_blend = Image.blend(
        sky_l.resize((315, 74), Image.Resampling.LANCZOS),
        sky_r.resize((315, 74), Image.Resampling.LANCZOS),
        0.5
    )
    bg.paste(sky_blend, (350, 8))
    top_patch = bg.crop((340, 5, 675, 86)).filter(ImageFilter.GaussianBlur(radius=2.0))
    bg.paste(top_patch, (340, 5))

    # Clean tabs area above the slab (x: 95..700, y: 90..148)
    # Background behind tabs is jungle foliage and volcanic smoke
    bg_above = src.crop((95, 55, 700, 95)).convert('RGB').resize((605, 58), Image.Resampling.LANCZOS)
    bg.paste(bg_above, (95, 90))
    tab_blend = bg.crop((92, 85, 705, 150)).filter(ImageFilter.GaussianBlur(radius=2.0))
    bg.paste(tab_blend, (92, 85))

    # Clean bottom footer (x: 230..770, y: 520..568)
    gnd_l = src.crop((70, 520, 230, 568)).convert('RGB')
    gnd_r = src.crop((770, 520, 930, 568)).convert('RGB')
    gnd_fill = Image.blend(
        gnd_l.resize((540, 48), Image.Resampling.LANCZOS),
        gnd_r.resize((540, 48), Image.Resampling.LANCZOS),
        0.5
    )
    bg.paste(gnd_fill, (230, 520))

    # Clean v1.04 at bottom right
    gnd_br = src.crop((890, 548, 950, 570)).convert('RGB').resize((65, 22), Image.Resampling.LANCZOS)
    bg.paste(gnd_br, (950, 548))

    # Resize to 1920x1080 Full HD
    bg_hd = bg.resize((1920, 1080), Image.Resampling.LANCZOS)
    bg_sharp = bg_hd.filter(ImageFilter.UnsharpMask(radius=1.5, percent=120, threshold=3))
    contrast = ImageEnhance.Contrast(bg_sharp)
    bg_graded = contrast.enhance(1.08)
    color = ImageEnhance.Color(bg_graded)
    bg_final = color.enhance(1.12)
    bg_final.save('assets/mockups/settings_clean_bg.jpg', quality=96)
    print('2. Saved spotless assets/mockups/settings_clean_bg.jpg (1920x1080)')

if __name__ == '__main__':
    make_perfect_clean_slab_and_bg()
