import os
from PIL import Image, ImageFilter, ImageDraw

def extract_frame():
    src = Image.open('assets/mockups/main_menu_bg.jpg').convert('RGBA')
    w, h = src.size # 1024, 572
    
    # Create frame with transparent center:
    frame = src.copy()
    
    # We want center to be transparent, keeping:
    # Top border: y: 0..48 (creeping vines, leaves, center skull)
    # Left border: x: 0..42
    # Right border: x: w-42..w
    # Bottom corners & bottom border: y: h-55..h
    
    mask = Image.new('L', (w, h), 255)
    
    # Center cutout: from x=45 to x=w-45, y=48 to y=h-55
    # With smooth feathering
    draw = ImageDraw.Draw(mask)
    draw.rectangle([45, 48, w - 45, h - 55], fill=0)
    
    # Blur mask to feather the transition
    mask_feathered = mask.filter(ImageFilter.GaussianBlur(radius=3.0))
    
    frame.putalpha(mask_feathered)
    frame.save('assets/ui/prehistoric_frame.png')
    print('Created assets/ui/prehistoric_frame.png')

extract_frame()
