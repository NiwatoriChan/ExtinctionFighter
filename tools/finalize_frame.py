import os
from PIL import Image, ImageFilter

def finalize_frame():
    fr = Image.open('assets/ui/prehistoric_frame.png').convert('RGBA')
    fr_hd = fr.resize((1920, 1080), Image.Resampling.LANCZOS)
    fr_hd.save('assets/ui/prehistoric_frame.png')
    print('Finalized prehistoric frame: assets/ui/prehistoric_frame.png (1920x1080)')

finalize_frame()
