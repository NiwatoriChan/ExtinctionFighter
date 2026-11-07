import os
from PIL import Image, ImageFilter, ImageEnhance

def finalize_clean_bg():
    bg = Image.open('assets/mockups/main_menu_clean_bg.jpg').convert('RGB')
    
    # Resize to 1920x1080 Full HD
    bg_hd = bg.resize((1920, 1080), Image.Resampling.LANCZOS)
    
    # Slight unsharp mask to bring out details in scales, smoke, and jungle
    bg_sharp = bg_hd.filter(ImageFilter.UnsharpMask(radius=1.5, percent=120, threshold=3))
    
    # Enhance contrast and volcanic warm vibrance
    contrast = ImageEnhance.Contrast(bg_sharp)
    bg_graded = contrast.enhance(1.08)
    
    color = ImageEnhance.Color(bg_graded)
    bg_final = color.enhance(1.12)
    
    bg_final.save('assets/mockups/main_menu_clean_bg.jpg', quality=95)
    print('Finalized clean background: assets/mockups/main_menu_clean_bg.jpg (1920x1080)')

finalize_clean_bg()
