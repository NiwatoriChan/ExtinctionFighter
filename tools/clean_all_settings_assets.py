import os
from PIL import Image, ImageFilter, ImageOps, ImageDraw, ImageEnhance

def clean_all_assets():
    src = Image.open('assets/mockups/settings_bg.jpg').convert('RGBA')
    w, h = src.size # 1024, 572
    norm_img = Image.open('assets/ui/stone_slab_normal.png').convert('RGBA')
    # Pure clean stone sample from stone_slab_normal (208 x 58)
    pure_stone = norm_img.crop((140, 20, norm_img.width - 140, norm_img.height - 20))

    # =========================================================================
    # 1. CLEAN STONE LABEL SLAB (NO TEXT) - 408 x 80
    # =========================================================================
    label_crop = src.crop((114, 168, 318, 208)) # 204 x 40
    LW = 408
    LH = 80
    label_hd = label_crop.resize((LW, LH), Image.Resampling.LANCZOS)

    # Inpaint center: left notched border is x: 0..52, right is x: LW-52..LW
    mid_w = (LW - 50) - 50
    mid_h = (LH - 16) - 16
    stone_fill = pure_stone.resize((mid_w, mid_h), Image.Resampling.LANCZOS)
    # Match label slab slate dark tone
    enh_b = ImageEnhance.Brightness(stone_fill)
    stone_fill = enh_b.enhance(0.78)

    label_clean = label_hd.copy()
    label_clean.paste(stone_fill, (50, 16))

    # Soft mask
    mask_label = Image.new('L', (LW, LH), 0)
    draw_l = ImageDraw.Draw(mask_label)
    draw_l.rounded_rectangle([6, 4, LW - 6, LH - 4], radius=14, fill=255)
    mask_label = mask_label.filter(ImageFilter.GaussianBlur(radius=2.0))
    label_clean.putalpha(mask_label)
    label_clean.save('assets/ui/stone_label_slab.png')
    print('1. Saved clean assets/ui/stone_label_slab.png (408x80) without text')

    # =========================================================================
    # 2. CLEAN ACTIVE TAB (NO TEXT) - 304 x 114
    # =========================================================================
    tab_act_crop = src.crop((393, 98, 545, 155)) # 152 x 57
    AW = 304
    AH = 114
    tab_act_hd = tab_act_crop.resize((AW, AH), Image.Resampling.LANCZOS)

    # Center text area is x: 55..AW-55, y: 22..AH-22
    in_tw = (AW - 55) - 55
    in_th = (AH - 22) - 22
    act_stone = pure_stone.resize((in_tw, in_th), Image.Resampling.LANCZOS)
    enh_at = ImageEnhance.Brightness(act_stone)
    act_stone = enh_at.enhance(0.68)

    tab_act_clean = tab_act_hd.copy()
    tab_act_clean.paste(act_stone, (55, 22))

    mask_tab_act = Image.new('L', (AW, AH), 0)
    draw_ta = ImageDraw.Draw(mask_tab_act)
    draw_ta.rounded_rectangle([10, 8, AW - 10, AH - 10], radius=18, fill=255)
    mask_tab_act = mask_tab_act.filter(ImageFilter.GaussianBlur(radius=2.5))
    tab_act_clean.putalpha(mask_tab_act)

    enh_ta = ImageEnhance.Color(tab_act_clean)
    tab_act_clean = enh_ta.enhance(1.25)
    tab_act_clean.save('assets/ui/settings_tab_active.png')
    print('2. Saved clean assets/ui/settings_tab_active.png (304x114) without text')

    # =========================================================================
    # 3. CLEAN INACTIVE TAB (NO TEXT) - 280 x 88
    # =========================================================================
    tab_norm_crop = src.crop((105, 106, 245, 150))
    NW = 280
    NH = 88
    tab_norm_hd = tab_norm_crop.resize((NW, NH), Image.Resampling.LANCZOS)

    in_nw = (NW - 45) - 45
    in_nh = (NH - 16) - 16
    norm_stone = pure_stone.resize((in_nw, in_nh), Image.Resampling.LANCZOS)
    enh_nt = ImageEnhance.Brightness(norm_stone)
    norm_stone = enh_nt.enhance(0.72)

    tab_norm_clean = tab_norm_hd.copy()
    tab_norm_clean.paste(norm_stone, (45, 16))

    mask_tab_norm = Image.new('L', (NW, NH), 0)
    draw_tn = ImageDraw.Draw(mask_tab_norm)
    draw_tn.rounded_rectangle([8, 6, NW - 8, NH - 6], radius=16, fill=255)
    mask_tab_norm = mask_tab_norm.filter(ImageFilter.GaussianBlur(radius=2.2))
    tab_norm_clean.putalpha(mask_tab_norm)
    tab_norm_clean.save('assets/ui/settings_tab_normal.png')
    print('3. Saved clean assets/ui/settings_tab_normal.png (280x88) without text')

    # =========================================================================
    # 4. CLEAN BONE SLIDER TRACK (PURE BONE & GROOVE, NO THUMB) - 568 x 76
    # =========================================================================
    BW = 568
    BH = 76
    track_r1 = src.crop((340, 172, 624, 210)).resize((BW, BH), Image.Resampling.LANCZOS)
    track_r2 = src.crop((340, 227, 624, 265)).resize((BW, BH), Image.Resampling.LANCZOS)
    track_r6 = src.crop((340, 442, 624, 480)).resize((BW, BH), Image.Resampling.LANCZOS)

    # In r1: left knuckle and track is clean up to x: 380 (rel 190 in 1x)
    # In r2: right knuckle is clean from x: 440..568
    # In r6: groove is clean in middle
    bone_clean = track_r1.copy()
    bone_clean.paste(track_r2.crop((BW - 160, 0, BW, BH)), (BW - 160, 0))
    # Fill middle groove from r6 (where no thumb sits)
    groove_patch = track_r6.crop((120, 14, 280, BH - 14)).resize((200, BH - 28), Image.Resampling.LANCZOS)
    bone_clean.paste(groove_patch, (310, 14))

    mask_bone = Image.new('L', (BW, BH), 0)
    draw_b = ImageDraw.Draw(mask_bone)
    draw_b.rounded_rectangle([24, 18, BW - 24, BH - 18], radius=16, fill=255)
    draw_b.ellipse([6, 8, 46, BH // 2 + 6], fill=255)
    draw_b.ellipse([6, BH // 2 - 6, 46, BH - 8], fill=255)
    draw_b.ellipse([BW - 46, 8, BW - 6, BH // 2 + 6], fill=255)
    draw_b.ellipse([BW - 46, BH // 2 - 6, BW - 6, BH - 8], fill=255)
    mask_bone = mask_bone.filter(ImageFilter.GaussianBlur(radius=2.2))
    bone_clean.putalpha(mask_bone)
    bone_clean.save('assets/ui/bone_slider_track.png')
    print('4. Saved clean assets/ui/bone_slider_track.png (568x76)')

    # =========================================================================
    # 5. CLEAN DISPLAY MODE TOGGLE BAR (WOOD/STONE BAR WITH SLIDER KNOB) - 656 x 80
    # =========================================================================
    MW = 656
    MH = 80
    mode_crop = src.crop((340, 275, 668, 315)).resize((MW, MH), Image.Resampling.LANCZOS)

    # The knob in the center is at x: 280..380
    # Inpaint left text 'FULLSCREEN' (x: 20..270) with wood/stone texture from margins
    # Inpaint right text 'WINDOWED' (x: 390..635) with wood/stone texture
    wood_sample = mode_crop.crop((10, 10, 45, MH - 10))
    fill_l = wood_sample.resize((245, MH - 20), Image.Resampling.LANCZOS)
    fill_r = wood_sample.resize((245, MH - 20), Image.Resampling.LANCZOS)

    mode_clean = mode_crop.copy()
    mode_clean.paste(fill_l, (20, 10))
    mode_clean.paste(fill_r, (390, 10))

    mask_mode = Image.new('L', (MW, MH), 0)
    draw_m = ImageDraw.Draw(mask_mode)
    draw_m.rounded_rectangle([8, 6, MW - 8, MH - 6], radius=14, fill=255)
    mask_mode = mask_mode.filter(ImageFilter.GaussianBlur(radius=2.5))
    mode_clean.putalpha(mask_mode)
    mode_clean.save('assets/ui/toggle_display_mode_bar.png')
    print('5. Saved clean assets/ui/toggle_display_mode_bar.png (656x80)')

    # =========================================================================
    # 6. CLEAN ON / OFF BUTTONS (EMBOSSED LIT & RECESSED DARK) - 174 x 68
    # =========================================================================
    onoff_crop = src.crop((412, 322, 598, 366)) # 186 x 44
    OW = 372
    OH = 88
    onoff_hd = onoff_crop.resize((OW, OH), Image.Resampling.LANCZOS)

    # 6a. Active button (fiery orange gradient)
    btn_on = onoff_hd.crop((12, 10, OW // 2, OH - 10)) # 174 x 68
    # Smooth center of button
    on_margin = btn_on.crop((6, 6, 25, btn_on.height - 6))
    fill_on = on_margin.resize((btn_on.width - 40, btn_on.height - 12), Image.Resampling.LANCZOS)
    btn_on_clean = btn_on.copy()
    btn_on_clean.paste(fill_on, (20, 6))
    enh_on = ImageEnhance.Color(btn_on_clean)
    btn_on_clean = enh_on.enhance(1.3)
    btn_on_clean.save('assets/ui/toggle_btn_active.png')
    print('6a. Saved clean assets/ui/toggle_btn_active.png (174x68)')

    # 6b. Inactive button (dark recessed stone)
    btn_off = onoff_hd.crop((OW // 2, 10, OW - 12, OH - 10))
    off_margin = btn_off.crop((btn_off.width - 25, 6, btn_off.width - 6, btn_off.height - 6))
    fill_off = off_margin.resize((btn_off.width - 40, btn_off.height - 12), Image.Resampling.LANCZOS)
    btn_off_clean = btn_off.copy()
    btn_off_clean.paste(fill_off, (20, 6))
    btn_off_clean.save('assets/ui/toggle_btn_inactive.png')
    print('6b. Saved clean assets/ui/toggle_btn_inactive.png (174x68)')

if __name__ == '__main__':
    clean_all_assets()
