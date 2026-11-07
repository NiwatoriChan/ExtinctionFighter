import os
import math
from PIL import Image, ImageFilter, ImageOps, ImageDraw, ImageEnhance

def create_all_ui_assets():
    os.makedirs('assets/ui', exist_ok=True)
    src = Image.open('assets/mockups/character_select_bg.jpg').convert('RGBA')
    w, h = src.size # 1024, 572

    # =========================================================================
    # 1. 'SELECT YOUR BEAST' TITLE PLAQUE (HD 2x)
    # =========================================================================
    # In source: x: 308..718, y: 18..76 (410 x 58)
    title_raw = src.crop((308, 18, 718, 76))
    TW = title_raw.width * 2 # 820
    TH = title_raw.height * 2 # 116
    title_hd = title_raw.resize((TW, TH), Image.Resampling.LANCZOS)

    # Pixel-accurate alpha mask for the title:
    # Letters are bright magma (yellow/orange/red) and stone highlights.
    # Ceiling background is dark (R < 48, G < 42, B < 38).
    alpha_title = Image.new('L', (TW, TH), 0)
    for y in range(TH):
        for x in range(TW):
            r, g, b, _ = title_hd.getpixel((x, y))
            brightness = max(r, g, b)
            is_lava = (r > 68 and r - b > 20)
            is_stone = (brightness > 52)
            
            # Keep underline stone rod at y > TH * 0.7
            if is_lava or is_stone:
                val = int((brightness - 32) * (255.0 / 40.0))
                val = max(0, min(255, val))
                alpha_title.putpixel((x, y), val)

    alpha_title = alpha_title.filter(ImageFilter.GaussianBlur(radius=1.0))
    title_hd.putalpha(alpha_title)
    
    # Boost vibrancy of molten lava
    enh_col = ImageEnhance.Color(title_hd)
    title_hd = enh_col.enhance(1.25)
    enh_con = ImageEnhance.Contrast(title_hd)
    title_hd = enh_con.enhance(1.15)
    
    title_hd.save('assets/ui/select_your_beast_title.png')
    print('1. Saved assets/ui/select_your_beast_title.png (820x116)')

    # =========================================================================
    # 2. BEAST ROSTER GRID STONE & VINE FRAME (HD 2x)
    # =========================================================================
    # In source: x: 296..728, y: 88..510 (432 x 422)
    frame_raw = src.crop((296, 88, 728, 510))
    FW = frame_raw.width * 2 # 864
    FH = frame_raw.height * 2 # 844
    frame_hd = frame_raw.resize((FW, FH), Image.Resampling.LANCZOS)

    # Frame mask:
    # Outer margin is transparent. Inner grid area is transparent.
    # Border rim (width ~ 32px on each side) contains stone and vines.
    border_px = 36
    mask_frame = Image.new('L', (FW, FH), 0)
    draw_f = ImageDraw.Draw(mask_frame)
    
    # Outer frame rounded rectangle
    draw_f.rounded_rectangle([6, 6, FW - 6, FH - 6], radius=24, fill=255)
    # Inner punch out
    draw_f.rounded_rectangle([border_px, border_px, FW - border_px, FH - border_px], radius=14, fill=0)
    
    mask_frame = mask_frame.filter(ImageFilter.GaussianBlur(radius=2.5))
    frame_hd.putalpha(mask_frame)
    
    enh_f_col = ImageEnhance.Color(frame_hd)
    frame_hd = enh_f_col.enhance(1.2)
    frame_hd.save('assets/ui/beast_grid_frame.png')
    print('2. Saved assets/ui/beast_grid_frame.png (864x844)')

    # =========================================================================
    # 3. PROCEDURAL BASALT STAT PLAQUE (HD)
    # =========================================================================
    PW, PH = 480, 220
    plaque = Image.new('RGBA', (PW, PH), (0, 0, 0, 0))
    draw_p = ImageDraw.Draw(plaque)

    # Outer dark stone glow / shadow
    shadow = Image.new('RGBA', (PW, PH), (0, 0, 0, 0))
    draw_s = ImageDraw.Draw(shadow)
    draw_s.rounded_rectangle([10, 10, PW - 10, PH - 10], radius=16, fill=(0, 0, 0, 180))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=8))
    plaque.paste(shadow, (0, 0), shadow)

    # Outer carved border (basalt rock)
    draw_p.rounded_rectangle([12, 12, PW - 12, PH - 12], radius=14, fill=(38, 34, 30, 245), outline=(78, 71, 64, 255), width=3)
    # Inner beveled rim
    draw_p.rounded_rectangle([16, 16, PW - 16, PH - 16], radius=10, fill=(22, 19, 17, 250), outline=(48, 43, 38, 255), width=2)
    # Inner stone panel fill
    draw_p.rounded_rectangle([20, 20, PW - 20, PH - 20], radius=8, fill=(18, 16, 14, 255))

    # Corner carved decorative rivets / studs
    studs = [(24, 24), (PW - 24, 24), (24, PH - 24), (PW - 24, PH - 24)]
    for sx, sy in studs:
        draw_p.ellipse([sx - 4, sy - 4, sx + 4, sy + 4], fill=(120, 110, 95, 255), outline=(40, 36, 32, 255), width=1)
        draw_p.point([sx - 1, sy - 1], fill=(220, 210, 190, 255))

    plaque.save('assets/ui/stat_plaque_frame.png')
    print('3. Saved assets/ui/stat_plaque_frame.png (480x220)')

    # =========================================================================
    # 4. LOCKED CHARACTER SLOT PADLOCK BADGE
    # =========================================================================
    LW, LH = 120, 120
    locked_img = Image.new('RGBA', (LW, LH), (0, 0, 0, 0))
    draw_l = ImageDraw.Draw(locked_img)
    
    # Glowing ambient lock
    glow_l = Image.new('RGBA', (LW, LH), (0, 0, 0, 0))
    draw_gl = ImageDraw.Draw(glow_l)
    draw_gl.ellipse([20, 20, 100, 100], fill=(245, 158, 11, 40))
    glow_l = glow_l.filter(ImageFilter.GaussianBlur(radius=8))
    locked_img.paste(glow_l, (0, 0), glow_l)

    # Shackle (curved arch)
    draw_l.arc([42, 24, 78, 62], start=180, end=0, fill=(180, 170, 155, 255), width=7)
    # Lock body (beveled stone rectangle)
    draw_l.rounded_rectangle([34, 46, 86, 92], radius=8, fill=(42, 38, 34, 250), outline=(120, 110, 95, 255), width=2)
    # Keyhole
    draw_l.ellipse([56, 58, 64, 66], fill=(12, 10, 8, 255))
    draw_l.polygon([(58, 64), (62, 64), (64, 78), (56, 78)], fill=(12, 10, 8, 255))

    locked_img.save('assets/ui/locked_slot_padlock.png')
    print('4. Saved assets/ui/locked_slot_padlock.png (120x120)')

    print('All UI assets generated successfully in assets/ui/')

if __name__ == '__main__':
    create_all_ui_assets()
