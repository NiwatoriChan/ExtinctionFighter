import os
from PIL import Image, ImageFilter, ImageOps, ImageDraw, ImageEnhance

def generate_clean_char_select_bg():
    src = Image.open('assets/mockups/character_select_bg.jpg').convert('RGB')
    w, h = src.size # 1024, 572
    clean = src.copy()
    
    # =========================================================================
    # 1. CLEAN TOP CEILING & HEADERS (y: 0..85)
    # =========================================================================
    # We sample natural dark cavern ceiling patches
    ceiling_l = src.crop((160, 5, 290, 50))
    ceiling_r = src.crop((730, 5, 860, 50))
    
    # Inpaint 'PLAYER 1' (x: 10..180, y: 10..75)
    ceil_fill_l = ceiling_l.resize((170, 65), Image.Resampling.LANCZOS)
    clean.paste(ceil_fill_l, (10, 10))
    
    # Inpaint 'PLAYER 2' (x: 840..1010, y: 10..75)
    ceil_fill_r = ceiling_r.resize((170, 65), Image.Resampling.LANCZOS)
    clean.paste(ceil_fill_r, (840, 10))
    
    # Inpaint 'SELECT YOUR BEAST' (x: 290..730, y: 10..85)
    # We synthesize a natural cavern arch above the center
    arch_sample = src.crop((180, 5, 280, 55))
    arch_fill = arch_sample.resize((440, 75), Image.Resampling.LANCZOS)
    clean.paste(arch_fill, (290, 10))
    
    # Smooth top edge transitions
    top_arch = clean.crop((0, 0, w, 85)).filter(ImageFilter.GaussianBlur(radius=1.8))
    clean.paste(top_arch, (0, 0))

    # =========================================================================
    # 2. CLEAN BOTTOM FOOTER (y: 505..572)
    # =========================================================================
    # Natural stone flagstone floor from y: 470..510
    floor_sample = src.crop((15, 475, w - 15, 515)) # 994 x 40
    floor_fill = floor_sample.resize((w - 30, h - 505), Image.Resampling.LANCZOS)
    floor_fill = floor_fill.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    clean.paste(floor_fill, (15, 505))
    
    # Feather floor blend
    mask_floor = Image.new('L', (w - 30, h - 505))
    for y in range(h - 505):
        val = min(255, int((y / 14.0) * 255))
        for x in range(w - 30):
            mask_floor.putpixel((x, y), val)
    clean.paste(floor_fill, (15, 505), mask_floor)

    # =========================================================================
    # 3. CLEAN LEFT SIDE (Remove 2D T-Rex, 2D Pedestal, Stat Plaque, Class Text)
    # Area: x: 10..260, y: 70..510
    # =========================================================================
    # The left side should be:
    # - Left carved stone column at x: 0..75 (preserved!)
    # - Left torch pillar at x: 250..305 (preserved!)
    # - In between (x: 75..250):
    #   Upper wall (y: 70..340): Dark stone temple wall illuminated by left column & torch.
    #   Lower area (y: 340..510): Clean stone flagstone floor with torchlight & ground mist.
    
    # Upper left wall fill (x: 70..250, y: 70..340, size: 180 x 270)
    col_l = src.crop((10, 70, 75, 340)).resize((90, 270), Image.Resampling.LANCZOS)
    torch_wall_l = src.crop((250, 70, 290, 340)).resize((90, 270), Image.Resampling.LANCZOS)
    
    wall_left = Image.new('RGB', (180, 270))
    for y in range(270):
        for x in range(180):
            fac = x / 180.0
            p_col = col_l.getpixel((min(89, x // 2), y))
            p_trc = torch_wall_l.getpixel((min(89, (x - 90) // 2) if x >= 90 else 0, y))
            r = int(p_col[0] * (1 - fac) + p_trc[0] * fac)
            g = int(p_col[1] * (1 - fac) + p_trc[1] * fac)
            b = int(p_col[2] * (1 - fac) + p_trc[2] * fac)
            wall_left.putpixel((x, y), (r, g, b))
    wall_left = wall_left.filter(ImageFilter.GaussianBlur(radius=2.5))
    
    # Lower left floor fill (x: 10..260, y: 330..510, size: 250 x 180)
    # Sample clean floor from y: 470..515 near left edge
    floor_l = src.crop((15, 475, 265, 515)).resize((250, 180), Image.Resampling.LANCZOS)
    floor_l = floor_l.filter(ImageFilter.GaussianBlur(radius=2.0))
    
    # Feather blend left wall and floor
    clean.paste(wall_left, (75, 70))
    
    mask_floor_l = Image.new('L', (250, 180))
    for y in range(180):
        val = min(255, int((y / 25.0) * 255))
        for x in range(250):
            mask_floor_l.putpixel((x, y), val)
    clean.paste(floor_l, (10, 330), mask_floor_l)

    # =========================================================================
    # 4. CLEAN RIGHT SIDE (Remove 2D Triceratops, 2D Pedestal, Stat Plaque, Class Text)
    # Area: x: 740..980, y: 70..510
    # =========================================================================
    # Right column at x: 945..1024 (preserved!)
    # Right torch pillar at x: 715..765 (preserved!)
    # In between (x: 760..945, size: 185 x 270):
    col_r = src.crop((945, 70, 1010, 340)).resize((92, 270), Image.Resampling.LANCZOS)
    torch_wall_r = src.crop((715, 70, 755, 340)).resize((93, 270), Image.Resampling.LANCZOS)
    
    wall_right = Image.new('RGB', (185, 270))
    for y in range(270):
        for x in range(185):
            fac = x / 185.0
            p_trc = torch_wall_r.getpixel((min(92, x // 2), y))
            p_col = col_r.getpixel((min(91, (x - 93) // 2) if x >= 93 else 0, y))
            r = int(p_trc[0] * (1 - fac) + p_col[0] * fac)
            g = int(p_trc[1] * (1 - fac) + p_col[1] * fac)
            b = int(p_trc[2] * (1 - fac) + p_col[2] * fac)
            wall_right.putpixel((x, y), (r, g, b))
    wall_right = wall_right.filter(ImageFilter.GaussianBlur(radius=2.5))
    
    # Lower right floor fill (x: 740..980, y: 330..510, size: 240 x 180)
    floor_r = src.crop((745, 475, 985, 515)).resize((240, 180), Image.Resampling.LANCZOS)
    floor_r = floor_r.filter(ImageFilter.GaussianBlur(radius=2.0))
    
    clean.paste(wall_right, (760, 70))
    
    mask_floor_r = Image.new('L', (240, 180))
    for y in range(180):
        val = min(255, int((y / 25.0) * 255))
        for x in range(240):
            mask_floor_r.putpixel((x, y), val)
    clean.paste(floor_r, (740, 330), mask_floor_r)

    # =========================================================================
    # 5. CLEAN CENTER GRID AREA (x: 295..725, y: 80..505, size: 430 x 425)
    # =========================================================================
    # The center is the grand temple back wall:
    # Lit by torch on the left (x: 250..295) and torch on the right (x: 725..770)
    # Top arch at y: 65..95
    # Floor at y: 490..530
    grid_w = 430
    grid_h = 425
    
    tw_l = src.crop((250, 95, 295, 495)).resize((grid_w, grid_h), Image.Resampling.LANCZOS)
    tw_r = src.crop((725, 95, 770, 495)).resize((grid_w, grid_h), Image.Resampling.LANCZOS)
    
    wall_center = Image.new('RGB', (grid_w, grid_h))
    for y in range(grid_h):
        for x in range(grid_w):
            fac = x / float(grid_w)
            pl = tw_l.getpixel((x, y))
            pr = tw_r.getpixel((x, y))
            # subtle vignette in the deep center
            center_shade = 1.0 - 0.25 * (1.0 - abs(fac - 0.5) * 2.0)
            r = int((pl[0] * (1 - fac) + pr[0] * fac) * center_shade)
            g = int((pl[1] * (1 - fac) + pr[1] * fac) * center_shade)
            b = int((pl[2] * (1 - fac) + pr[2] * fac) * center_shade)
            wall_center.putpixel((x, y), (r, g, b))
            
    wall_center = wall_center.filter(ImageFilter.GaussianBlur(radius=2.8))
    
    mask_grid = Image.new('L', (grid_w, grid_h), 255)
    for y in range(grid_h):
        for x in range(grid_w):
            d = min(x, grid_w - 1 - x, y, grid_h - 1 - y)
            if d < 22:
                mask_grid.putpixel((x, y), int((d / 22.0) * 255))
                
    clean.paste(wall_center, (295, 80), mask_grid)

    # =========================================================================
    # 6. GLOBAL HARMONIZATION & UPSCALE TO FULL HD (1920x1080)
    # =========================================================================
    clean_hd = clean.resize((1920, 1080), Image.Resampling.LANCZOS)
    clean_hd = clean_hd.filter(ImageFilter.UnsharpMask(radius=1.8, percent=120, threshold=2))
    
    enh_c = ImageEnhance.Contrast(clean_hd)
    clean_hd = enh_c.enhance(1.08)
    
    enh_col = ImageEnhance.Color(clean_hd)
    clean_hd = enh_col.enhance(1.10)
    
    clean_hd.save('assets/mockups/character_select_clean_bg.jpg', quality=95)
    print('Successfully generated 100% clean background: assets/mockups/character_select_clean_bg.jpg (1920x1080)')

if __name__ == '__main__':
    generate_clean_char_select_bg()
