import os
from PIL import Image, ImageFilter, ImageOps, ImageDraw, ImageEnhance

def make_perfect_slabs():
    # 1. NORMAL SLAB
    # Start with btn_7_exit (244x49) and btn_2_versus (244x49)
    b_exit = Image.open('assets/ui/btn_7_exit.png').convert('RGBA')
    b_versus = Image.open('assets/ui/btn_2_versus.png').convert('RGBA')
    w, h = b_exit.size # 244, 49

    # Double resolution for crispness: 488 x 98
    W = w * 2
    H = h * 2
    b_exit_hd = b_exit.resize((W, H), Image.Resampling.LANCZOS)
    b_versus_hd = b_versus.resize((W, H), Image.Resampling.LANCZOS)

    # In b_exit_hd, left bone knuckle and stone edge is x: 0..160
    # Right bone knuckle and stone edge is x: W-160..W
    # Let's take the middle stone texture from non-text regions and synthesize the center
    slab_normal = b_exit_hd.copy()
    
    # Clean texture patches from x: 80..160 and x: W-160..W-80
    patch1 = b_exit_hd.crop((70, 16, 160, H - 16))
    patch2 = b_exit_hd.crop((W - 160, 16, W - 70, H - 16))
    
    mid_w = (W - 140) - 140
    p1_s = patch1.resize((mid_w, H - 32), Image.Resampling.LANCZOS)
    p2_s = patch2.resize((mid_w, H - 32), Image.Resampling.LANCZOS)
    blended_mid = Image.blend(p1_s, p2_s, 0.5)
    
    # Also blend with versus rock texture for natural stone grain
    v_patch = b_versus_hd.crop((70, 16, 160, H - 16)).resize((mid_w, H - 32), Image.Resampling.LANCZOS)
    blended_mid = Image.blend(blended_mid, v_patch, 0.4)
    
    slab_normal.paste(blended_mid, (140, 16))
    
    # Now create an alpha mask for the slab (knuckles on left & right, stone slab body in middle)
    alpha_norm = Image.new('L', (W, H), 0)
    draw_n = ImageDraw.Draw(alpha_norm)
    
    # Center slab rectangle
    draw_n.rounded_rectangle([20, 8, W - 20, H - 8], radius=12, fill=255)
    # Left knuckle lobes
    draw_n.ellipse([4, 6, 32, 42], fill=255)
    draw_n.ellipse([4, H - 42, 32, H - 6], fill=255)
    draw_n.rectangle([14, 16, 32, H - 16], fill=255)
    # Right knuckle lobes
    draw_n.ellipse([W - 32, 6, W - 4, 42], fill=255)
    draw_n.ellipse([W - 32, H - 42, W - 4, H - 6], fill=255)
    draw_n.rectangle([W - 32, 16, W - 14, H - 16], fill=255)
    
    # Soft feather
    alpha_norm = alpha_norm.filter(ImageFilter.GaussianBlur(radius=2.0))
    slab_normal.putalpha(alpha_norm)
    slab_normal.save('assets/ui/stone_slab_normal.png')
    print('Saved assets/ui/stone_slab_normal.png (488x98)')

    # 2. ACTIVE SLAB
    b_act = Image.open('assets/ui/btn_1_campaign.png').convert('RGBA')
    w_a, h_a = b_act.size # 252, 56
    WA = w_a * 2
    HA = h_a * 2
    b_act_hd = b_act.resize((WA, HA), Image.Resampling.LANCZOS)
    
    slab_active = b_act_hd.copy()
    
    # In b_act_hd, glowing left knuckle & lava edge: x: 0..120
    # glowing right knuckle & lava edge: x: WA-120..WA
    # Middle text area is x: 120..WA-120
    patch_l = b_act_hd.crop((40, 16, 120, HA - 16))
    patch_r = b_act_hd.crop((WA - 120, 16, WA - 40, HA - 16))
    
    mid_wa = (WA - 110) - 110
    pl_s = patch_l.resize((mid_wa, HA - 32), Image.Resampling.LANCZOS)
    pr_s = patch_r.resize((mid_wa, HA - 32), Image.Resampling.LANCZOS)
    blended_lava = Image.blend(pl_s, pr_s, 0.5)
    
    # Add fiery saturation & glow to center
    enh = ImageEnhance.Color(blended_lava)
    blended_lava = enh.enhance(1.25)
    
    slab_active.paste(blended_lava, (110, 16))
    
    # Top and bottom glowing crust rims
    rim_top = b_act_hd.crop((110, 10, WA - 110, 22))
    rim_bot = b_act_hd.crop((110, HA - 22, WA - 110, HA - 10))
    slab_active.paste(rim_top, (110, 10))
    slab_active.paste(rim_bot, (110, HA - 22))
    
    # Alpha mask for active slab
    alpha_act = Image.new('L', (WA, HA), 0)
    draw_a = ImageDraw.Draw(alpha_act)
    draw_a.rounded_rectangle([20, 8, WA - 20, HA - 8], radius=14, fill=255)
    draw_a.ellipse([4, 6, 36, 46], fill=255)
    draw_a.ellipse([4, HA - 46, 36, HA - 6], fill=255)
    draw_a.rectangle([14, 18, 36, HA - 18], fill=255)
    draw_a.ellipse([WA - 36, 6, WA - 4, 46], fill=255)
    draw_a.ellipse([WA - 36, HA - 46, WA - 4, HA - 6], fill=255)
    draw_a.rectangle([WA - 36, 18, WA - 14, HA - 18], fill=255)
    
    alpha_act = alpha_act.filter(ImageFilter.GaussianBlur(radius=2.5))
    slab_active.putalpha(alpha_act)
    slab_active.save('assets/ui/stone_slab_active.png')
    print('Saved assets/ui/stone_slab_active.png (504x112)')

make_perfect_slabs()
