import os
from PIL import Image, ImageFilter, ImageOps, ImageDraw, ImageEnhance

def make_char_select_ui():
    src = Image.open('assets/mockups/character_select_bg.jpg').convert('RGBA')
    w, h = src.size # 1024, 572
    
    # -----------------------------------------------------------------
    # 1. EXTRACT 'SELECT YOUR BEAST' TITLE
    # -----------------------------------------------------------------
    # In original: x: 310..715, y: 20..75
    title_crop = src.crop((310, 20, 715, 78)) # 405 x 58
    # Scale 2x for HD: 810 x 116
    TW = title_crop.width * 2
    TH = title_crop.height * 2
    title_hd = title_crop.resize((TW, TH), Image.Resampling.LANCZOS)
    
    # Create mask for title:
    # Outer background is dark cavern ceiling (RGB ~ 15..35)
    # The letters and underline rod are bright fiery stone (RGB ~ 180..255)
    mask_title = Image.new('L', (TW, TH), 0)
    draw_t = ImageDraw.Draw(mask_title)
    
    # Draw contour enclosing letters and underline rod
    draw_t.rounded_rectangle([15, 6, TW - 15, TH - 8], radius=16, fill=255)
    mask_title = mask_title.filter(ImageFilter.GaussianBlur(radius=3.0))
    title_hd.putalpha(mask_title)
    
    # Boost fire saturation
    enh_t = ImageEnhance.Color(title_hd)
    title_hd = enh_t.enhance(1.2)
    title_hd.save('assets/ui/select_your_beast_title.png')
    print('Saved assets/ui/select_your_beast_title.png')

    # -----------------------------------------------------------------
    # 2. EXTRACT BEAST GRID STONE VINE FRAME
    # -----------------------------------------------------------------
    # The grid frame in original: x: 300..720, y: 95..505 (420 x 410)
    grid_crop = src.crop((300, 95, 720, 505))
    GW = grid_crop.width * 2 # 840
    GH = grid_crop.height * 2 # 820
    grid_hd = grid_crop.resize((GW, GH), Image.Resampling.LANCZOS)
    
    # Frame thickness: outer ~40px in 2x scale
    mask_frame = Image.new('L', (GW, GH), 255)
    draw_f = ImageDraw.Draw(mask_frame)
    # Punch out inner grid area so the HTML roster shows through cleanly:
    draw_f.rounded_rectangle([38, 38, GW - 38, GH - 38], radius=12, fill=0)
    mask_frame = mask_frame.filter(ImageFilter.GaussianBlur(radius=3.5))
    
    grid_hd.putalpha(mask_frame)
    grid_hd.save('assets/ui/beast_grid_frame.png')
    print('Saved assets/ui/beast_grid_frame.png')

    # -----------------------------------------------------------------
    # 3. EXTRACT STAT PLAQUE FRAME
    # -----------------------------------------------------------------
    # In original: x: 30..240, y: 360..460 (210 x 100)
    plaque_crop = src.crop((30, 360, 240, 460))
    PW = plaque_crop.width * 2 # 420
    PH = plaque_crop.height * 2 # 200
    plaque_hd = plaque_crop.resize((PW, PH), Image.Resampling.LANCZOS)
    
    # We want the stone beveled tablet outline:
    mask_plaque = Image.new('L', (PW, PH), 0)
    draw_p = ImageDraw.Draw(mask_plaque)
    draw_p.rounded_rectangle([10, 8, PW - 10, PH - 8], radius=14, fill=255)
    mask_plaque = mask_plaque.filter(ImageFilter.GaussianBlur(radius=2.5))
    plaque_hd.putalpha(mask_plaque)
    plaque_hd.save('assets/ui/stat_plaque_frame.png')
    print('Saved assets/ui/stat_plaque_frame.png')

make_char_select_ui()
