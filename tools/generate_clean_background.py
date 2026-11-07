import os
from PIL import Image, ImageFilter, ImageOps, ImageDraw

def generate_clean_bg():
    src = Image.open('assets/mockups/main_menu_bg.jpg').convert('RGB')
    w, h = src.size # 1024, 572
    clean = src.copy()
    
    # -------------------------------------------------------------
    # 1. CLEAN THE BOTTOM BAR (y: 500..572)
    # -------------------------------------------------------------
    # The terrain from y: 460..500 is dark volcanic rock, smoke, embers.
    # We take vertical slices / patches from y: 450..500 and blend them down
    ground_strip = src.crop((20, 455, w - 20, 505)) # height 50
    # Stretch or repeat downward with soft blur & noise
    ground_fill = ground_strip.resize((w - 40, h - 505), Image.Resampling.LANCZOS)
    # Mirror vertically for natural continuity
    ground_fill_flipped = ground_fill.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    clean.paste(ground_fill_flipped, (20, 505))
    
    # Soft feather blend at y=505
    mask_ground = Image.new('L', (w - 40, h - 505))
    for y in range(h - 505):
        val = min(255, int((y / 15.0) * 255))
        for x in range(w - 40):
            mask_ground.putpixel((x, y), val)
    clean.paste(ground_fill_flipped, (20, 505), mask_ground)

    # -------------------------------------------------------------
    # 2. CLEAN THE LEFT BUTTONS AREA (x: 60..340, y: 80..480)
    # -------------------------------------------------------------
    # Surrounding textures:
    # Upper jungle: x: 20..380, y: 25..85
    # Left jungle column: x: 20..75, y: 70..480
    # Right jungle/smoke: x: 330..420, y: 80..480
    
    # We sample lush jungle texture patches:
    jungle_top = src.crop((30, 25, 360, 85)) # 330 x 60
    jungle_side = src.crop((20, 90, 75, 480)) # 55 x 390
    jungle_right = src.crop((330, 90, 410, 480)) # 80 x 390
    
    # Synthesize background for the buttons column:
    # We tile & blend jungle textures with atmospheric volcanic smoke
    btn_w = 340 - 60
    btn_h = 480 - 80
    
    # Fill with blended gradient of side jungle and right smoke
    jungle_stretched = jungle_side.resize((btn_w, btn_h), Image.Resampling.LANCZOS)
    right_stretched = jungle_right.resize((btn_w, btn_h), Image.Resampling.LANCZOS)
    
    # Horizontal blend from deep jungle (left) to misty jungle/smoke (right)
    blended_jungle = Image.new('RGB', (btn_w, btn_h))
    for y in range(btn_h):
        for x in range(btn_w):
            alpha = x / float(btn_w)
            p_l = jungle_stretched.getpixel((x, y))
            p_r = right_stretched.getpixel((x, y))
            r = int(p_l[0] * (1 - alpha) + p_r[0] * alpha)
            g = int(p_l[1] * (1 - alpha) + p_r[1] * alpha)
            b = int(p_l[2] * (1 - alpha) + p_r[2] * alpha)
            blended_jungle.putpixel((x, y), (r, g, b))
            
    # Add top foliage canopy texture downwards
    canopy_stretched = jungle_top.resize((btn_w, int(btn_h * 0.4)), Image.Resampling.LANCZOS)
    # Blend top canopy
    for y in range(int(btn_h * 0.4)):
        factor = 1.0 - (y / float(btn_h * 0.4))
        for x in range(btn_w):
            base = blended_jungle.getpixel((x, y))
            top_p = canopy_stretched.getpixel((x, y))
            r = int(base[0] * (1 - factor * 0.7) + top_p[0] * (factor * 0.7))
            g = int(base[1] * (1 - factor * 0.7) + top_p[1] * (factor * 0.7))
            b = int(base[2] * (1 - factor * 0.7) + top_p[2] * (factor * 0.7))
            blended_jungle.putpixel((x, y), (r, g, b))
            
    # Soft atmospheric vignette
    blended_jungle = blended_jungle.filter(ImageFilter.GaussianBlur(radius=1.8))
    
    # Feather blend the edges of the box
    mask_box = Image.new('L', (btn_w, btn_h), 255)
    for y in range(btn_h):
        for x in range(btn_w):
            d_left = x
            d_right = btn_w - 1 - x
            d_top = y
            d_bot = btn_h - 1 - y
            min_d = min(d_left, d_right, d_top, d_bot)
            if min_d < 18:
                mask_box.putpixel((x, y), int((min_d / 18.0) * 255))
                
    clean.paste(blended_jungle, (60, 80), mask_box)

    # -------------------------------------------------------------
    # 3. CLEAN THE LOGO AREA (x: 440..890, y: 190..465)
    # -------------------------------------------------------------
    # Triceratops anatomy:
    # Above logo: frill, head, snout, horn, back (y: 130..220, x: 640..890)
    # Right of logo: flank, hips, hind leg (x: 870..950, y: 220..460)
    # Left of logo: smoke, T-Rex feet, foreground rocks (x: 390..450, y: 220..460)
    # Below logo: ground, rocks, volcanic smoke (y: 460..500)
    
    logo_w = 890 - 440
    logo_h = 465 - 190
    
    # We sample the Triceratops body texture from the right (flank/ribs)
    # and the volcanic terrain from the bottom, and smoke from the left
    tri_body = src.crop((850, 180, 930, 460)) # flank texture
    tri_body_stretched = tri_body.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
    
    ground_sample = src.crop((440, 465, 890, 505))
    ground_sample_stretched = ground_sample.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
    
    smoke_sample = src.crop((380, 220, 440, 460))
    smoke_sample_stretched = smoke_sample.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
    
    logo_fill = Image.new('RGB', (logo_w, logo_h))
    for y in range(logo_h):
        y_norm = y / float(logo_h)
        for x in range(logo_w):
            x_norm = x / float(logo_w)
            
            # Left side is more smoke, right side is more Triceratops body, bottom is more ground
            p_tri = tri_body_stretched.getpixel((x, y))
            p_smoke = smoke_sample_stretched.getpixel((x, y))
            p_ground = ground_sample_stretched.getpixel((x, y))
            
            # Triceratops weight increases towards top-right
            w_tri = (x_norm * 0.7 + (1.0 - y_norm) * 0.3)
            # Ground weight increases towards bottom
            w_ground = (y_norm ** 1.8) * 0.8
            # Smoke weight increases towards left/middle
            w_smoke = (1.0 - x_norm) * 0.7
            
            total = w_tri + w_ground + w_smoke + 0.001
            w_tri /= total
            w_ground /= total
            w_smoke /= total
            
            r = int(p_tri[0] * w_tri + p_ground[0] * w_ground + p_smoke[0] * w_smoke)
            g = int(p_tri[1] * w_tri + p_ground[1] * w_ground + p_smoke[1] * w_smoke)
            b = int(p_tri[2] * w_tri + p_ground[2] * w_ground + p_smoke[2] * w_smoke)
            logo_fill.putpixel((x, y), (r, g, b))
            
    # Apply soft blur for natural distance/smoke
    logo_fill = logo_fill.filter(ImageFilter.GaussianBlur(radius=2.5))
    
    # Feather blend
    mask_logo = Image.new('L', (logo_w, logo_h), 255)
    for y in range(logo_h):
        for x in range(logo_w):
            d_left = x
            d_right = logo_w - 1 - x
            d_top = y
            d_bot = logo_h - 1 - y
            min_d = min(d_left, d_right, d_top, d_bot)
            if min_d < 24:
                mask_logo.putpixel((x, y), int((min_d / 24.0) * 255))
                
    clean.paste(logo_fill, (440, 190), mask_logo)

    # -------------------------------------------------------------
    # 4. ENHANCE BACKGROUND ATMOSPHERE (Volcanic embers & smoke)
    # -------------------------------------------------------------
    clean.save('assets/mockups/main_menu_clean_bg.jpg', quality=95)
    print('Generated clean background: assets/mockups/main_menu_clean_bg.jpg')

generate_clean_bg()
