import os
from PIL import Image, ImageFilter, ImageOps, ImageDraw, ImageEnhance

def make_perfect_logo():
    src = Image.open('assets/ui/test_logo.png').convert('RGBA')
    w, h = src.size # 465, 275
    
    # Scale 2x for sharp rendering on 1080p/4K
    W = w * 2 # 930
    H = h * 2 # 550
    logo_hd = src.resize((W, H), Image.Resampling.LANCZOS)
    
    # Logo polygon points scaled by 2:
    # Outer contour enclosing the bone posts, PRIMAL stone, CLASH magma, BEASTS OF PREY banner
    logo_poly = [
        (85, 58), (465, 40), (845, 58),
        (895, 90), (925, 130), (925, 435), (895, 475),
        (790, 520), (465, 528), (140, 520),
        (35, 475), (5, 435), (5, 130), (35, 90)
    ]
    
    mask = Image.new('L', (W, H), 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon(logo_poly, fill=255)
    
    # Let's add slight erosion and feathering so the edges cleanly cut against any background
    mask = mask.filter(ImageFilter.GaussianBlur(radius=3.5))
    
    logo_hd.putalpha(mask)
    
    # Also boost the fiery magma colors in CLASH
    enh_c = ImageEnhance.Color(logo_hd)
    logo_hd = enh_c.enhance(1.15)
    
    logo_hd.save('assets/ui/primal_clash_logo.png')
    print('Saved assets/ui/primal_clash_logo.png (930x550)')

make_perfect_logo()
