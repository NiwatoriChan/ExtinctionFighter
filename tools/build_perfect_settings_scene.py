import os
from PIL import Image, ImageFilter, ImageOps, ImageDraw, ImageEnhance

def build_perfect_scene():
    src = Image.open('assets/mockups/settings_bg.jpg').convert('RGBA')
    w, h = src.size # 1024, 572
    os.makedirs('assets/ui', exist_ok=True)
    os.makedirs('assets/mockups', exist_ok=True)

    # =========================================================================
    # 1. GENERATE IMMACULATE JUNGLE BACKGROUND FOR SETTINGS (1920x1080)
    # =========================================================================
    # On the right (x: 695..1024): Dimetrodon, Ankylosaur, volcano, torch, shoreline
    # On the left (x: 0..705): Deep lush prehistoric jungle foliage & volcanic mist
    bg_clean = src.convert('RGB')

    jungle_w = 705 - 60 # 645
    jungle_h = 515 - 65 # 450

    # Sample deep jungle from left side (x: 10..85) and mist from right (x: 690..745)
    jungle_left = src.crop((12, 50, 85, 515)).convert('RGB')
    smoke_right = src.crop((690, 50, 745, 515)).convert('RGB')
    canopy_top = src.crop((12, 12, 700, 80)).convert('RGB')
    ground_bot = src.crop((12, 510, 700, 568)).convert('RGB')

    jl_s = jungle_left.resize((jungle_w, jungle_h), Image.Resampling.LANCZOS)
    sr_s = smoke_right.resize((jungle_w, jungle_h), Image.Resampling.LANCZOS)

    # Horizontal blend from deep jungle on left to smoky mist near Dimetrodon
    blended_j = Image.new('RGB', (jungle_w, jungle_h))
    for y in range(jungle_h):
        for x in range(jungle_w):
            alpha = x / float(jungle_w)
            p_l = jl_s.getpixel((x, y))
            p_r = sr_s.getpixel((x, y))
            r = int(p_l[0] * (1 - alpha * 0.7) + p_r[0] * (alpha * 0.7))
            g = int(p_l[1] * (1 - alpha * 0.7) + p_r[1] * (alpha * 0.7))
            b = int(p_l[2] * (1 - alpha * 0.7) + p_r[2] * (alpha * 0.7))
            blended_j.putpixel((x, y), (r, g, b))

    # Blend top canopy
    canopy_s = canopy_top.resize((jungle_w, int(jungle_h * 0.4)), Image.Resampling.LANCZOS)
    for y in range(int(jungle_h * 0.4)):
        factor = 1.0 - (y / float(jungle_h * 0.4))
        for x in range(jungle_w):
            base = blended_j.getpixel((x, y))
            top_p = canopy_s.getpixel((x, y))
            r = int(base[0] * (1 - factor * 0.7) + top_p[0] * (factor * 0.7))
            g = int(base[1] * (1 - factor * 0.7) + top_p[1] * (factor * 0.7))
            b = int(base[2] * (1 - factor * 0.7) + top_p[2] * (factor * 0.7))
            blended_j.putpixel((x, y), (r, g, b))

    # Blend volcanic ground
    ground_s = ground_bot.resize((jungle_w, int(jungle_h * 0.3)), Image.Resampling.LANCZOS)
    for y in range(int(jungle_h * 0.3)):
        factor = (y / float(jungle_h * 0.3))
        for x in range(jungle_w):
            target_y = jungle_h - int(jungle_h * 0.3) + y
            base = blended_j.getpixel((x, target_y))
            bot_p = ground_s.getpixel((x, y))
            r = int(base[0] * (1 - factor * 0.7) + bot_p[0] * (factor * 0.7))
            g = int(base[1] * (1 - factor * 0.7) + bot_p[1] * (factor * 0.7))
            b = int(base[2] * (1 - factor * 0.7) + bot_p[2] * (factor * 0.7))
            blended_j.putpixel((x, target_y), (r, g, b))

    blended_j = blended_j.filter(ImageFilter.GaussianBlur(radius=2.0))
    bg_clean.paste(blended_j, (60, 65))

    # Clean top title area completely: sample sky from x: 220..340 and x: 670..790
    sky_l = src.crop((220, 8, 340, 82)).convert('RGB')
    sky_r = src.crop((670, 8, 790, 82)).convert('RGB')
    sky_fill = Image.blend(
        sky_l.resize((330, 74), Image.Resampling.LANCZOS),
        sky_r.resize((330, 74), Image.Resampling.LANCZOS),
        0.5
    )
    bg_clean.paste(sky_fill, (340, 8))
    top_soft = bg_clean.crop((320, 5, 690, 86)).filter(ImageFilter.GaussianBlur(radius=2.2))
    bg_clean.paste(top_soft, (320, 5))

    # Clean bottom footer area completely: floor rock from x: 60..220 and x: 770..930
    gnd_l = src.crop((60, 520, 220, 568)).convert('RGB')
    gnd_r = src.crop((770, 520, 930, 568)).convert('RGB')
    gnd_fill = Image.blend(
        gnd_l.resize((550, 48), Image.Resampling.LANCZOS),
        gnd_r.resize((550, 48), Image.Resampling.LANCZOS),
        0.5
    )
    bg_clean.paste(gnd_fill, (220, 520))

    # Clean v1.04 at bottom right
    gnd_br = src.crop((880, 548, 940, 570)).convert('RGB').resize((70, 22), Image.Resampling.LANCZOS)
    bg_clean.paste(gnd_br, (945, 548))

    # Resize background to 1920x1080 Full HD
    bg_hd = bg_clean.resize((1920, 1080), Image.Resampling.LANCZOS)
    bg_sharp = bg_hd.filter(ImageFilter.UnsharpMask(radius=1.5, percent=120, threshold=3))
    contrast = ImageEnhance.Contrast(bg_sharp)
    bg_graded = contrast.enhance(1.08)
    color = ImageEnhance.Color(bg_graded)
    bg_final = color.enhance(1.12)
    bg_final.save('assets/mockups/settings_clean_bg.jpg', quality=96)
    print('1. Finalized clean jungle background: assets/mockups/settings_clean_bg.jpg (1920x1080)')

    # =========================================================================
    # 2. CREATE FLAWLESS MONOLITH STONE SLAB (1212 x 708 HD)
    # =========================================================================
    slab_crop = src.crop((92, 138, 698, 492)) # 606 x 354
    SW = slab_crop.width * 2  # 1212
    SH = slab_crop.height * 2 # 708
    slab_hd = slab_crop.resize((SW, SH), Image.Resampling.LANCZOS)

    # Use clean stone texture from stone_slab_normal.png
    norm_img = Image.open('assets/ui/stone_slab_normal.png').convert('RGBA')
    # Clean middle rock texture from normal slab
    norm_rock = norm_img.crop((140, 20, norm_img.width - 140, norm_img.height - 20)) # 208 x 58

    in_x1 = 64
    in_x2 = SW - 64
    in_y1 = 36
    in_y2 = SH - 36
    in_w = in_x2 - in_x1
    in_h = in_y2 - in_y1

    # Tile rock texture smoothly
    rock_tile = norm_rock.resize((in_w, in_h), Image.Resampling.LANCZOS)
    # Match dark prehistoric slate tone (dark charcoal slate)
    enh_b = ImageEnhance.Brightness(rock_tile)
    rock_tile = enh_b.enhance(0.72)
    enh_c = ImageEnhance.Contrast(rock_tile)
    rock_tile = enh_c.enhance(1.15)

    # Subtle horizontal blur for slate bedding planes
    rock_tile = rock_tile.filter(ImageFilter.GaussianBlur(radius=1.2))

    clean_slab = slab_hd.copy()
    clean_slab.paste(rock_tile, (in_x1, in_y1))

    # Mask for slab preserving chipped edges, vine rims, and rounded corners
    mask_slab = Image.new('L', (SW, SH), 0)
    draw_s = ImageDraw.Draw(mask_slab)
    draw_s.rounded_rectangle([12, 10, SW - 12, SH - 10], radius=24, fill=255)
    mask_slab = mask_slab.filter(ImageFilter.GaussianBlur(radius=2.5))
    clean_slab.putalpha(mask_slab)
    clean_slab.save('assets/ui/settings_main_slab.png')
    print('2. Finalized flawless clean slab container: assets/ui/settings_main_slab.png (1212x708)')

if __name__ == '__main__':
    build_perfect_scene()
