import os
from PIL import Image, ImageFilter, ImageOps, ImageDraw, ImageEnhance

def make_settings_assets():
    src = Image.open('assets/mockups/settings_bg.jpg').convert('RGBA')
    w, h = src.size # 1024, 572
    os.makedirs('assets/ui', exist_ok=True)
    os.makedirs('assets/mockups', exist_ok=True)

    # =========================================================================
    # 1. EXTRACT 'OPTIONS' TITLE PLAQUE (HD 2x)
    # =========================================================================
    title_crop = src.crop((365, 6, 655, 78)) # 290 x 72
    TW = title_crop.width * 2 # 580
    TH = title_crop.height * 2 # 144
    title_hd = title_crop.resize((TW, TH), Image.Resampling.LANCZOS)

    # Mask for title plaque (pegs, vines, carved plaque)
    mask_title = Image.new('L', (TW, TH), 0)
    draw_t = ImageDraw.Draw(mask_title)
    
    # Plaque rounded body
    draw_t.rounded_rectangle([20, 18, TW - 20, TH - 14], radius=24, fill=255)
    # Top wooden pegs/horns
    draw_t.rectangle([34, 4, 64, 40], fill=255)
    draw_t.rectangle([TW - 64, 4, TW - 34, 40], fill=255)
    # Side vine tendrils
    draw_t.ellipse([10, 24, 40, TH - 20], fill=255)
    draw_t.ellipse([TW - 40, 24, TW - 10, TH - 20], fill=255)

    mask_title = mask_title.filter(ImageFilter.GaussianBlur(radius=3.0))
    title_hd.putalpha(mask_title)
    
    # Boost fire & ember contrast slightly
    enh_t = ImageEnhance.Color(title_hd)
    title_hd = enh_t.enhance(1.22)
    enh_c = ImageEnhance.Contrast(title_hd)
    title_hd = enh_c.enhance(1.1)
    title_hd.save('assets/ui/options_title_plaque.png')
    print('1. Saved assets/ui/options_title_plaque.png (580x144)')

    # =========================================================================
    # 2. EXTRACT ACTIVE TAB (GAMEPLAY - glowing fiery border + vines) (HD 2x)
    # =========================================================================
    tab_act_crop = src.crop((393, 98, 545, 155)) # 152 x 57
    AW = tab_act_crop.width * 2 # 304
    AH = tab_act_crop.height * 2 # 114
    tab_act_hd = tab_act_crop.resize((AW, AH), Image.Resampling.LANCZOS)

    # Inpaint center text 'GAMEPLAY' so it becomes a reusable glowing tab base
    # Left edge & glow: x: 0..70
    # Right edge & glow: x: AW-70..AW
    patch_al = tab_act_hd.crop((30, 22, 75, AH - 22))
    patch_ar = tab_act_hd.crop((AW - 75, 22, AW - 30, AH - 22))
    mid_aw = (AW - 70) - 70
    pal_s = patch_al.resize((mid_aw, AH - 44), Image.Resampling.LANCZOS)
    par_s = patch_ar.resize((mid_aw, AH - 44), Image.Resampling.LANCZOS)
    blended_atab = Image.blend(pal_s, par_s, 0.5)

    tab_act_clean = tab_act_hd.copy()
    tab_act_clean.paste(blended_atab, (70, 22))

    # Alpha mask for active tab
    mask_tab_act = Image.new('L', (AW, AH), 0)
    draw_ta = ImageDraw.Draw(mask_tab_act)
    draw_ta.rounded_rectangle([10, 8, AW - 10, AH - 10], radius=18, fill=255)
    mask_tab_act = mask_tab_act.filter(ImageFilter.GaussianBlur(radius=2.5))
    tab_act_clean.putalpha(mask_tab_act)
    
    # Save active tab background
    enh_ta = ImageEnhance.Color(tab_act_clean)
    tab_act_clean = enh_ta.enhance(1.25)
    tab_act_clean.save('assets/ui/settings_tab_active.png')
    print('2. Saved assets/ui/settings_tab_active.png (304x114)')

    # =========================================================================
    # 3. EXTRACT INACTIVE TAB (AUDIO / VIDEO - chiseled stone) (HD 2x)
    # =========================================================================
    tab_norm_crop = src.crop((105, 106, 245, 150)) # 140 x 44
    NW = tab_norm_crop.width * 2 # 280
    NH = tab_norm_crop.height * 2 # 88
    tab_norm_hd = tab_norm_crop.resize((NW, NH), Image.Resampling.LANCZOS)

    # Inpaint text 'AUDIO' from margins
    patch_nl = tab_norm_hd.crop((20, 14, 60, NH - 14))
    patch_nr = tab_norm_hd.crop((NW - 60, 14, NW - 20, NH - 14))
    mid_nw = (NW - 50) - 50
    pnl_s = patch_nl.resize((mid_nw, NH - 28), Image.Resampling.LANCZOS)
    pnr_s = patch_nr.resize((mid_nw, NH - 28), Image.Resampling.LANCZOS)
    blended_ntab = Image.blend(pnl_s, pnr_s, 0.5)

    tab_norm_clean = tab_norm_hd.copy()
    tab_norm_clean.paste(blended_ntab, (50, 14))

    mask_tab_norm = Image.new('L', (NW, NH), 0)
    draw_tn = ImageDraw.Draw(mask_tab_norm)
    draw_tn.rounded_rectangle([8, 6, NW - 8, NH - 8], radius=16, fill=255)
    mask_tab_norm = mask_tab_norm.filter(ImageFilter.GaussianBlur(radius=2.2))
    tab_norm_clean.putalpha(mask_tab_norm)
    tab_norm_clean.save('assets/ui/settings_tab_normal.png')
    print('3. Saved assets/ui/settings_tab_normal.png (280x88)')

    # =========================================================================
    # 4. EXTRACT STONE LABEL SLAB (Row buttons) (HD 2x)
    # =========================================================================
    label_crop = src.crop((114, 168, 318, 208)) # 204 x 40
    LW = label_crop.width * 2 # 408
    LH = label_crop.height * 2 # 80
    label_hd = label_crop.resize((LW, LH), Image.Resampling.LANCZOS)

    # Inpaint 'MASTER VOLUME' using stone texture from left & right chipped notches
    p_ll = label_hd.crop((16, 12, 60, LH - 12))
    p_lr = label_hd.crop((LW - 60, 12, LW - 16, LH - 12))
    mid_lw = (LW - 50) - 50
    pll_s = p_ll.resize((mid_lw, LH - 24), Image.Resampling.LANCZOS)
    plr_s = p_lr.resize((mid_lw, LH - 24), Image.Resampling.LANCZOS)
    blended_label = Image.blend(pll_s, plr_s, 0.5)

    label_clean = label_hd.copy()
    label_clean.paste(blended_label, (50, 12))

    # Mask for label slab (stone notched bevel)
    mask_label = Image.new('L', (LW, LH), 0)
    draw_l = ImageDraw.Draw(mask_label)
    draw_l.rounded_rectangle([8, 6, LW - 8, LH - 6], radius=14, fill=255)
    mask_label = mask_label.filter(ImageFilter.GaussianBlur(radius=2.0))
    label_clean.putalpha(mask_label)
    label_clean.save('assets/ui/stone_label_slab.png')
    print('4. Saved assets/ui/stone_label_slab.png (408x80)')

    # =========================================================================
    # 5. EXTRACT BONE SLIDER TRACK (HD 2x)
    # =========================================================================
    # Slider row 1 has clean left knuckle and track up to x: 530 (rel 190 in 284)
    # Slider row 2 has clean right knuckle from x: 550 (rel 210 in 284)
    # Slider row 6 has clean groove in middle
    track_r1 = src.crop((340, 172, 624, 210)) # 284 x 38
    track_r2 = src.crop((340, 227, 624, 265))
    track_r6 = src.crop((340, 442, 624, 480))

    BW = 284 * 2 # 568
    BH = 38 * 2  # 76
    tr1_hd = track_r1.resize((BW, BH), Image.Resampling.LANCZOS)
    tr2_hd = track_r2.resize((BW, BH), Image.Resampling.LANCZOS)
    tr6_hd = track_r6.resize((BW, BH), Image.Resampling.LANCZOS)

    # Synthesize clean bone track:
    # Left knuckle: x: 0..120 from tr1_hd
    # Right knuckle: x: BW-120..BW from tr2_hd
    # Center bone groove: x: 120..BW-120 from tr6_hd blended with tr1
    bone_clean = tr1_hd.copy()
    # Right end from tr2
    bone_clean.paste(tr2_hd.crop((BW - 150, 0, BW, BH)), (BW - 150, 0))
    # Center section where skull was (x: 340..460 in 2x) inpainted with clean bone groove from tr6
    clean_groove = tr6_hd.crop((120, 14, 260, BH - 14)).resize((180, BH - 28), Image.Resampling.LANCZOS)
    bone_clean.paste(clean_groove, (330, 14))

    # Bone track mask: bone head lobes on left, long bone shaft with rounded ends
    mask_bone = Image.new('L', (BW, BH), 0)
    draw_b = ImageDraw.Draw(mask_bone)
    # Bone shaft
    draw_b.rounded_rectangle([24, 18, BW - 24, BH - 18], radius=16, fill=255)
    # Left knuckle lobes
    draw_b.ellipse([6, 8, 46, BH // 2 + 6], fill=255)
    draw_b.ellipse([6, BH // 2 - 6, 46, BH - 8], fill=255)
    # Right knuckle lobes
    draw_b.ellipse([BW - 46, 8, BW - 6, BH // 2 + 6], fill=255)
    draw_b.ellipse([BW - 46, BH // 2 - 6, BW - 6, BH - 8], fill=255)

    mask_bone = mask_bone.filter(ImageFilter.GaussianBlur(radius=2.2))
    bone_clean.putalpha(mask_bone)
    bone_clean.save('assets/ui/bone_slider_track.png')
    print('5. Saved assets/ui/bone_slider_track.png (568x76)')

    # =========================================================================
    # 6. EXTRACT GLOWING SKULL / CLAW SLIDER THUMB (HD 2x)
    # =========================================================================
    thumb_crop = src.crop((536, 163, 572, 215)) # 36 x 52
    CW = thumb_crop.width * 2 # 72
    CH = thumb_crop.height * 2 # 104
    thumb_hd = thumb_crop.resize((CW, CH), Image.Resampling.LANCZOS)

    # Alpha mask for glowing skull claw
    mask_claw = Image.new('L', (CW, CH), 0)
    draw_c = ImageDraw.Draw(mask_claw)
    # Skull crown & glowing aura
    draw_c.ellipse([10, 6, CW - 10, CH - 22], fill=255)
    # Fang / claw taper downward
    draw_c.polygon([(CW // 2 - 14, CH - 34), (CW // 2 + 14, CH - 34), (CW // 2 + 4, CH - 6), (CW // 2 - 4, CH - 6)], fill=255)
    
    mask_claw = mask_claw.filter(ImageFilter.GaussianBlur(radius=3.0))
    thumb_hd.putalpha(mask_claw)

    # Fiery warm glow boost
    enh_cw = ImageEnhance.Color(thumb_hd)
    thumb_hd = enh_cw.enhance(1.3)
    thumb_hd.save('assets/ui/slider_thumb_claw.png')
    print('6. Saved assets/ui/slider_thumb_claw.png (72x104)')

    # =========================================================================
    # 7. EXTRACT BONE KNUCKLE THUMB (HD 2x)
    # =========================================================================
    bone_th_crop = src.crop((480, 440, 516, 480)) # 36 x 40
    BW_TH = bone_th_crop.width * 2 # 72
    BH_TH = bone_th_crop.height * 2 # 80
    bone_th_hd = bone_th_crop.resize((BW_TH, BH_TH), Image.Resampling.LANCZOS)

    mask_bth = Image.new('L', (BW_TH, BH_TH), 0)
    draw_bth = ImageDraw.Draw(mask_bth)
    draw_bth.ellipse([8, 8, BW_TH - 8, BH_TH - 8], fill=255)
    mask_bth = mask_bth.filter(ImageFilter.GaussianBlur(radius=2.5))
    bone_th_hd.putalpha(mask_bth)
    bone_th_hd.save('assets/ui/slider_thumb_bone.png')
    print('7. Saved assets/ui/slider_thumb_bone.png (72x80)')

    # =========================================================================
    # 8. EXTRACT ON / OFF CAPSULE & BUTTONS (HD 2x)
    # =========================================================================
    onoff_crop = src.crop((412, 322, 598, 366)) # 186 x 44
    OW = onoff_crop.width * 2 # 372
    OH = onoff_crop.height * 2 # 88
    onoff_hd = onoff_crop.resize((OW, OH), Image.Resampling.LANCZOS)

    # 8a. Full capsule
    mask_oo = Image.new('L', (OW, OH), 0)
    draw_oo = ImageDraw.Draw(mask_oo)
    draw_oo.rounded_rectangle([8, 6, OW - 8, OH - 6], radius=16, fill=255)
    mask_oo = mask_oo.filter(ImageFilter.GaussianBlur(radius=2.5))
    onoff_hd.putalpha(mask_oo)
    onoff_hd.save('assets/ui/toggle_container.png')
    print('8a. Saved assets/ui/toggle_container.png (372x88)')

    # 8b. Active 'ON' button (fiery embossed)
    btn_on_crop = onoff_hd.crop((12, 10, OW // 2, OH - 10))
    btn_on_crop.save('assets/ui/toggle_btn_active.png')
    print('8b. Saved assets/ui/toggle_btn_active.png')

    # 8c. Inactive 'OFF' button (dark stone recessed)
    btn_off_crop = onoff_hd.crop((OW // 2, 10, OW - 12, OH - 10))
    btn_off_crop.save('assets/ui/toggle_btn_inactive.png')
    print('8c. Saved assets/ui/toggle_btn_inactive.png')

    # =========================================================================
    # 9. EXTRACT DISPLAY MODE TOGGLE BAR (HD 2x)
    # =========================================================================
    mode_crop = src.crop((340, 275, 668, 315)) # 328 x 40
    MW = mode_crop.width * 2 # 656
    MH = mode_crop.height * 2 # 80
    mode_hd = mode_crop.resize((MW, MH), Image.Resampling.LANCZOS)

    mask_mode = Image.new('L', (MW, MH), 0)
    draw_m = ImageDraw.Draw(mask_mode)
    draw_m.rounded_rectangle([8, 6, MW - 8, MH - 6], radius=14, fill=255)
    mask_mode = mask_mode.filter(ImageFilter.GaussianBlur(radius=2.5))
    mode_hd.putalpha(mask_mode)
    mode_hd.save('assets/ui/toggle_display_mode_bar.png')
    print('9. Saved assets/ui/toggle_display_mode_bar.png (656x80)')

    # =========================================================================
    # 10. EXTRACT STONE MAIN SLAB CONTAINER (HD 2x)
    # =========================================================================
    # Main stone slab sits at x: 92..698, y: 138..492 (606 x 354)
    slab_crop = src.crop((92, 138, 698, 492))
    SW = slab_crop.width * 2 # 1212
    SH = slab_crop.height * 2 # 708
    slab_hd = slab_crop.resize((SW, SH), Image.Resampling.LANCZOS)

    # Clean the interior of the slab:
    # Notice that surrounding margins inside slab (x: 50..80, x: SW-80..SW-50, y: 30..60, y: SH-60..SH-30)
    # have pure dark slate rock texture
    patch_s1 = slab_hd.crop((40, 24, 100, SH - 24))
    patch_s2 = slab_hd.crop((SW - 100, 24, SW - 40, SH - 24))
    patch_stop = slab_hd.crop((120, 20, SW - 120, 60))
    patch_sbot = slab_hd.crop((120, SH - 60, SW - 120, SH - 20))

    clean_slab = slab_hd.copy()
    # Inpaint interior with slate stone texture
    inner_w = (SW - 90) - 90
    inner_h = (SH - 50) - 50
    slate_mid = patch_s1.resize((inner_w, inner_h), Image.Resampling.LANCZOS)
    slate_mid_r = patch_s2.resize((inner_w, inner_h), Image.Resampling.LANCZOS)
    blended_slate = Image.blend(slate_mid, slate_mid_r, 0.5)

    # Preserve natural cracks and subtle stone variation
    enh_sl = ImageEnhance.Brightness(blended_slate)
    blended_slate = enh_sl.enhance(0.95)
    clean_slab.paste(blended_slate, (90, 50))

    # Mask for main stone slab with beveled edges and vine rim
    mask_slab = Image.new('L', (SW, SH), 0)
    draw_s = ImageDraw.Draw(mask_slab)
    draw_s.rounded_rectangle([12, 10, SW - 12, SH - 10], radius=26, fill=255)
    mask_slab = mask_slab.filter(ImageFilter.GaussianBlur(radius=3.0))
    clean_slab.putalpha(mask_slab)
    clean_slab.save('assets/ui/settings_main_slab.png')
    print('10. Saved assets/ui/settings_main_slab.png (1212x708)')

    # =========================================================================
    # 11. SYNTHESIZE CLEAN 1920x1080 BACKGROUND (assets/mockups/settings_clean_bg.jpg)
    # =========================================================================
    # Start with base image
    bg_clean = src.convert('RGB')

    # 11a. Inpaint OPTIONS title at top (x: 360..660, y: 5..80)
    # Sample sky/volcano smoke & trees from x: 260..360 and x: 660..760
    sky_l = bg_clean.crop((230, 8, 360, 80))
    sky_r = bg_clean.crop((660, 8, 790, 80))
    sky_fill_l = sky_l.resize((150, 72), Image.Resampling.LANCZOS)
    sky_fill_r = sky_r.resize((150, 72), Image.Resampling.LANCZOS)
    bg_clean.paste(sky_fill_l, (360, 8))
    bg_clean.paste(sky_fill_r, (510, 8))

    # Smooth sky blend
    sky_patch = bg_clean.crop((350, 5, 670, 85)).filter(ImageFilter.GaussianBlur(radius=2.5))
    bg_clean.paste(sky_patch, (350, 5))

    # 11b. Inpaint footer bar (x: 260..740, y: 525..568)
    # Sample dark volcanic ground from x: 100..260 and x: 740..900, y: 525..568
    gnd_l = bg_clean.crop((100, 525, 260, 568))
    gnd_r = bg_clean.crop((740, 525, 900, 568))
    gnd_fill = Image.blend(
        gnd_l.resize((480, 43), Image.Resampling.LANCZOS),
        gnd_r.resize((480, 43), Image.Resampling.LANCZOS),
        0.5
    )
    bg_clean.paste(gnd_fill, (260, 525))

    # Inpaint v1.04 in bottom right (x: 950..1015, y: 550..570)
    gnd_br = bg_clean.crop((900, 550, 950, 570)).resize((65, 20), Image.Resampling.LANCZOS)
    bg_clean.paste(gnd_br, (950, 550))

    # 11c. Inpaint interior of stone slab in background
    # (x: 105..685, y: 155..485) so background has pure clean monolith stone slab
    slab_inner_w = 685 - 105 # 580
    slab_inner_h = 485 - 155 # 330
    
    # Sample stone texture
    st_sample_l = bg_clean.crop((95, 155, 120, 485)).resize((slab_inner_w // 2, slab_inner_h), Image.Resampling.LANCZOS)
    st_sample_r = bg_clean.crop((670, 155, 695, 485)).resize((slab_inner_w // 2, slab_inner_h), Image.Resampling.LANCZOS)
    
    bg_clean.paste(st_sample_l, (105, 155))
    bg_clean.paste(st_sample_r, (105 + slab_inner_w // 2, 155))
    
    # Soft feather for stone texture blend
    st_blend = bg_clean.crop((105, 155, 685, 485)).filter(ImageFilter.GaussianBlur(radius=1.8))
    bg_clean.paste(st_blend, (105, 155))

    # 11d. Resize to 1920x1080 Full HD
    bg_hd = bg_clean.resize((1920, 1080), Image.Resampling.LANCZOS)

    # Sharpness & cinematic volcanic grading
    bg_sharp = bg_hd.filter(ImageFilter.UnsharpMask(radius=1.6, percent=125, threshold=3))
    contrast = ImageEnhance.Contrast(bg_sharp)
    bg_graded = contrast.enhance(1.08)
    color = ImageEnhance.Color(bg_graded)
    bg_final = color.enhance(1.12)

    bg_final.save('assets/mockups/settings_clean_bg.jpg', quality=95)
    print('11. Finalized clean background: assets/mockups/settings_clean_bg.jpg (1920x1080)')

if __name__ == '__main__':
    make_settings_assets()
