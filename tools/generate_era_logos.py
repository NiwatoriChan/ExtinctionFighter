import math
import os
from PIL import Image, ImageDraw, ImageFilter

OUTPUT_DIR = 'assets/ui/era_logos'
os.makedirs(OUTPUT_DIR, exist_ok=True)

SIZE = 512
CENTER = SIZE // 2
RADIUS = 220

def create_circular_badge(primary_glow, secondary_glow, dark_bg, rim_color, detail_color, symbol_func, filename, era_name, sub_text):
    # Create 512x512 RGBA image
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Outer ambient glow
    glow_img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)
    for r in range(RADIUS + 25, RADIUS - 10, -4):
        alpha = int(45 * (1.0 - (r - RADIUS) / 35.0)) if r > RADIUS else 45
        alpha = max(0, min(120, alpha))
        glow_draw.ellipse([CENTER - r, CENTER - r, CENTER + r, CENTER + r], fill=(primary_glow[0], primary_glow[1], primary_glow[2], alpha))
    glow_img = glow_img.filter(ImageFilter.GaussianBlur(radius=12))
    img.paste(glow_img, (0, 0), glow_img)

    # 2. Main circular stone disc
    disc_img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    disc_draw = ImageDraw.Draw(disc_img)
    disc_draw.ellipse([CENTER - RADIUS, CENTER - RADIUS, CENTER + RADIUS, CENTER + RADIUS], fill=dark_bg)
    
    # Concentric inner shading
    for i in range(1, 40):
        r_inner = RADIUS - i * 3
        if r_inner <= 0: break
        factor = i / 40.0
        r_c = int(dark_bg[0] + (secondary_glow[0] * 0.15 - dark_bg[0]) * factor)
        g_c = int(dark_bg[1] + (secondary_glow[1] * 0.15 - dark_bg[1]) * factor)
        b_c = int(dark_bg[2] + (secondary_glow[2] * 0.15 - dark_bg[2]) * factor)
        disc_draw.ellipse([CENTER - r_inner, CENTER - r_inner, CENTER + r_inner, CENTER + r_inner], outline=(r_c, g_c, b_c, 80), width=3)
    
    img = Image.alpha_composite(img, disc_img)
    draw = ImageDraw.Draw(img)

    # 3. Outer Runic Ring & Spikes / Rivets
    rim_w = 12
    draw.ellipse([CENTER - RADIUS, CENTER - RADIUS, CENTER + RADIUS, CENTER + RADIUS], outline=rim_color, width=rim_w)
    inner_rim_r = RADIUS - 22
    draw.ellipse([CENTER - inner_rim_r, CENTER - inner_rim_r, CENTER + inner_rim_r, CENTER + inner_rim_r], outline=(rim_color[0], rim_color[1], rim_color[2], 180), width=4)

    # Cardinal & ordinal rivets / ancient gems
    num_teeth = 16
    for t in range(num_teeth):
        angle = (t / float(num_teeth)) * 2 * math.pi
        px = CENTER + (RADIUS - 11) * math.cos(angle)
        py = CENTER + (RADIUS - 11) * math.sin(angle)
        gem_size = 6 if t % 4 == 0 else 4
        gem_col = primary_glow if t % 4 == 0 else rim_color
        draw.ellipse([px - gem_size, py - gem_size, px + gem_size, py + gem_size], fill=gem_col, outline=(255, 255, 255, 200))

    # 4. Draw Custom Prehistoric Symbol (passed as callable)
    symbol_func(draw, CENTER, CENTER, primary_glow, secondary_glow, detail_color)

    # 5. Top and bottom banners / ribbons
    # Ribbon arc or bottom banner for ERA title
    banner_y = CENTER + 125
    b_w = 170
    b_h = 32
    # Shadow
    draw.rounded_rectangle([CENTER - b_w, banner_y - 2, CENTER + b_w, banner_y + b_h + 4], radius=8, fill=(10, 10, 15, 220))
    # Plate
    draw.rounded_rectangle([CENTER - b_w + 4, banner_y, CENTER + b_w - 4, banner_y + b_h], radius=6, fill=(25, 20, 22, 240), outline=rim_color, width=2)
    
    # Era name in banner
    # Draw simple crisp text representation
    try:
        from PIL import ImageFont
        # Use default font or truetype
        font = ImageFont.load_default()
    except Exception:
        font = None

    # Text drawing with slight scale
    draw.text((CENTER, banner_y + 8), era_name, fill=rim_color, anchor="mm", font=font)
    draw.text((CENTER, banner_y + 22), sub_text, fill=detail_color, anchor="mm", font=font)

    # 6. Save image
    out_path = os.path.join(OUTPUT_DIR, filename)
    img.save(out_path, 'PNG')
    print(f"Generated: {out_path}")


# ---------------- SYMBOL GENERATORS -----------------

def draw_paleozoic_symbol(draw, cx, cy, pri, sec, det):
    # Ancient sea scorpion / trilobite silhouette with glowing segmented plates & claws
    cy = cy - 25
    # Segmented carapace
    for i in range(7):
        w = 40 - i * 4.5
        h = 10
        y = cy - 20 + i * 16
        draw.ellipse([cx - w, y - h, cx + w, y + h], fill=pri, outline=det, width=2)
    # Head / eyes
    draw.polygon([(cx - 45, cy - 25), (cx + 45, cy - 25), (cx + 25, cy - 65), (cx - 25, cy - 65)], fill=pri, outline=(255, 255, 255, 230), width=2)
    # Glowing eyes
    draw.ellipse([cx - 18, cy - 50, cx - 8, cy - 40], fill=(255, 255, 255, 255))
    draw.ellipse([cx + 8, cy - 50, cx + 18, cy - 40], fill=(255, 255, 255, 255))
    # Giant raptorial claws
    # Left claw
    draw.line([(cx - 35, cy - 45), (cx - 75, cy - 70), (cx - 65, cy - 105), (cx - 45, cy - 85)], fill=det, width=7)
    draw.line([(cx - 75, cy - 70), (cx - 95, cy - 60)], fill=det, width=5)
    # Right claw
    draw.line([(cx + 35, cy - 45), (cx + 75, cy - 70), (cx + 65, cy - 105), (cx + 45, cy - 85)], fill=det, width=7)
    draw.line([(cx + 75, cy - 70), (cx + 95, cy - 60)], fill=det, width=5)
    # Tail stinger
    draw.arc([cx - 30, cy + 65, cx + 30, cy + 125], start=40, end=210, fill=det, width=6)
    draw.polygon([(cx - 15, cy + 115), (cx - 28, cy + 135), (cx - 5, cy + 130)], fill=(255, 255, 255, 255))


def draw_triassic_symbol(draw, cx, cy, pri, sec, det):
    # Postosuchus / Archosaur snarling skull with jagged lightning bolts
    cy = cy - 25
    # Lightning bolts behind skull
    draw.line([(cx - 85, cy - 100), (cx - 30, cy - 30), (cx - 45, cy - 20), (cx - 10, cy + 60)], fill=pri, width=6)
    draw.line([(cx + 85, cy - 100), (cx + 30, cy - 30), (cx + 45, cy - 20), (cx + 10, cy + 60)], fill=pri, width=6)
    # Archosaur skull profile / front
    skull_pts = [
        (cx, cy - 75), (cx + 35, cy - 55), (cx + 45, cy - 20), (cx + 30, cy + 25),
        (cx + 40, cy + 50), (cx + 20, cy + 70), (cx, cy + 75),
        (cx - 20, cy + 70), (cx - 40, cy + 50), (cx - 30, cy + 25),
        (cx - 45, cy - 20), (cx - 35, cy - 55)
    ]
    draw.polygon(skull_pts, fill=sec, outline=det, width=3)
    # Eye sockets
    draw.ellipse([cx - 30, cy - 35, cx - 12, cy - 15], fill=(15, 10, 10, 255), outline=pri, width=2)
    draw.ellipse([cx + 12, cy - 35, cx + 30, cy - 15], fill=(15, 10, 10, 255), outline=pri, width=2)
    # Nasal fenestra
    draw.ellipse([cx - 12, cy + 15, cx + 12, cy + 35], fill=(15, 10, 10, 255))
    # Razor fangs
    for fx in range(-25, 30, 10):
        draw.polygon([(cx + fx - 3, cy + 50), (cx + fx + 3, cy + 50), (cx + fx, cy + 66)], fill=(255, 255, 230, 255))


def draw_jurassic_symbol(draw, cx, cy, pri, sec, det):
    # Giant Sauropod long neck silhouette + Stegosaurus plates + Fern branch
    cy = cy - 20
    # Fern fronds on the sides
    for side in [-1, 1]:
        for i in range(5):
            fy = cy - 60 + i * 25
            fx = cx + side * (55 + i * 6)
            draw.line([(cx + side * 30, fy + 10), (fx, fy)], fill=pri, width=4)
            draw.ellipse([fx - 4, fy - 4, fx + 4, fy + 4], fill=det)
    # Stego diamond plates on back
    for i in range(4):
        px = cx - 35 + i * 22
        py = cy - 15 - (i % 2) * 15
        draw.polygon([(px, py - 35), (px + 14, py - 5), (px, py + 15), (px - 14, py - 5)], fill=det, outline=(255, 240, 180, 255), width=2)
    # Sauropod silhouette
    sauro_pts = [
        (cx - 40, cy + 65), (cx - 20, cy + 45), (cx - 15, cy - 20), (cx - 10, cy - 75),
        (cx, cy - 90), (cx + 15, cy - 85), (cx + 10, cy - 70), (cx + 5, cy - 20),
        (cx + 25, cy + 45), (cx + 45, cy + 65), (cx, cy + 70)
    ]
    draw.polygon(sauro_pts, fill=sec, outline=det, width=3)
    # Glowing eye
    draw.ellipse([cx - 2, cy - 87, cx + 4, cy - 81], fill=(255, 255, 255, 255))


def draw_cretaceous_symbol(draw, cx, cy, pri, sec, det):
    # Flaming T-Rex / Spino skull & volcanic meteor flames
    cy = cy - 25
    # Magma flame aura
    flame_pts = [
        (cx, cy - 105), (cx + 35, cy - 65), (cx + 75, cy - 50), (cx + 55, cy - 10),
        (cx + 80, cy + 30), (cx + 45, cy + 65), (cx, cy + 85),
        (cx - 45, cy + 65), (cx - 80, cy + 30), (cx - 55, cy - 10),
        (cx - 75, cy - 50), (cx - 35, cy - 65)
    ]
    draw.polygon(flame_pts, fill=(pri[0], pri[1], pri[2], 120), outline=pri, width=4)
    # Fierce T-Rex Skull
    rex_pts = [
        (cx - 25, cy - 60), (cx + 40, cy - 50), (cx + 65, cy - 10), (cx + 60, cy + 25),
        (cx + 15, cy + 35), (cx - 10, cy + 60), (cx - 40, cy + 40), (cx - 50, cy - 20)
    ]
    draw.polygon(rex_pts, fill=sec, outline=det, width=3)
    # Large glowing orbital eye cavity
    draw.polygon([(cx - 10, cy - 35), (cx + 15, cy - 30), (cx + 5, cy - 10), (cx - 18, cy - 15)], fill=(10, 5, 5, 255), outline=pri, width=3)
    # Menacing glowing pupil
    draw.ellipse([cx - 2, cy - 26, cx + 6, cy - 18], fill=(255, 255, 120, 255))
    # Massive predatory teeth
    for tx in [0, 15, 30, 45]:
        draw.polygon([(cx + tx, cy + 25), (cx + tx + 8, cy + 25), (cx + tx + 4, cy + 44)], fill=(255, 245, 220, 255))


def draw_cenozoic_symbol(draw, cx, cy, pri, sec, det):
    # Smilodon Saber-Tooth skull & giant curved Mammoth tusks + ice shards
    cy = cy - 25
    # Giant sweeping Mammoth tusks encircling
    draw.arc([cx - 95, cy - 80, cx + 95, cy + 80], start=30, end=150, fill=det, width=8)
    draw.polygon([(cx - 90, cy - 15), (cx - 80, cy - 45), (cx - 65, cy - 20)], fill=(255, 255, 255, 255))
    draw.polygon([(cx + 90, cy - 15), (cx + 80, cy - 45), (cx + 65, cy - 20)], fill=(255, 255, 255, 255))
    # Ice crystal spikes
    for ang in [-60, -30, 0, 30, 60]:
        rad = math.radians(ang - 90)
        ex = cx + 80 * math.cos(rad)
        ey = cy + 80 * math.sin(rad)
        draw.line([(cx, cy - 20), (ex, ey)], fill=pri, width=3)
        draw.ellipse([ex - 4, ey - 4, ex + 4, ey + 4], fill=(255, 255, 255, 255))
    # Feline Sabertooth Skull
    feline_pts = [
        (cx - 30, cy - 50), (cx, cy - 65), (cx + 30, cy - 50),
        (cx + 42, cy - 15), (cx + 25, cy + 20), (cx, cy + 30),
        (cx - 25, cy + 20), (cx - 42, cy - 15)
    ]
    draw.polygon(feline_pts, fill=sec, outline=det, width=3)
    # Cold glowing eyes
    draw.ellipse([cx - 22, cy - 25, cx - 8, cy - 12], fill=(10, 20, 35, 255), outline=pri, width=2)
    draw.ellipse([cx + 8, cy - 25, cx + 22, cy - 12], fill=(10, 20, 35, 255), outline=pri, width=2)
    draw.ellipse([cx - 17, cy - 20, cx - 13, cy - 16], fill=(180, 245, 255, 255))
    draw.ellipse([cx + 13, cy - 20, cx + 17, cy - 16], fill=(180, 245, 255, 255))
    # Iconic Colossal Saber Canines
    draw.polygon([(cx - 24, cy + 15), (cx - 15, cy + 15), (cx - 18, cy + 75), (cx - 23, cy + 70)], fill=(255, 255, 255, 255), outline=det, width=2)
    draw.polygon([(cx + 15, cy + 15), (cx + 24, cy + 15), (cx + 23, cy + 70), (cx + 18, cy + 75)], fill=(255, 255, 255, 255), outline=det, width=2)


def draw_extinction_symbol(draw, cx, cy, pri, sec, det):
    # Apocalyptic Dragon Horns & Cosmic Meteor Eye
    cy = cy - 25
    # Cosmic dragon wings / astral horns
    # Left horn
    draw.polygon([(cx - 25, cy - 35), (cx - 75, cy - 85), (cx - 95, cy - 110), (cx - 65, cy - 60)], fill=det, outline=pri, width=3)
    # Right horn
    draw.polygon([(cx + 25, cy - 35), (cx + 75, cy - 85), (cx + 95, cy - 110), (cx + 65, cy - 60)], fill=det, outline=pri, width=3)
    # Void dragon crest
    drag_pts = [
        (cx, cy - 65), (cx + 35, cy - 35), (cx + 40, cy + 10), (cx + 20, cy + 55),
        (cx, cy + 75), (cx - 20, cy + 55), (cx - 40, cy + 10), (cx - 35, cy - 35)
    ]
    draw.polygon(drag_pts, fill=sec, outline=det, width=3)
    # Cosmic Core / Meteor Eye in forehead
    draw.ellipse([cx - 18, cy - 25, cx + 18, cy + 11], fill=(20, 5, 30, 255), outline=pri, width=3)
    # Blazing pupil
    draw.ellipse([cx - 7, cy - 14, cx + 7, cy], fill=(255, 200, 50, 255))
    # Dragon lower jaw fangs
    draw.polygon([(cx - 15, cy + 45), (cx - 7, cy + 45), (cx - 11, cy + 68)], fill=(255, 255, 240, 255))
    draw.polygon([(cx + 7, cy + 45), (cx + 15, cy + 45), (cx + 11, cy + 68)], fill=(255, 255, 240, 255))


# ---------------- BUILD ALL 6 LOGOS -----------------

print("Generating 6 custom Era Logos...")

# Era 1: Paleozoic
create_circular_badge(
    primary_glow=(20, 215, 185),       # Bioluminescent cyan
    secondary_glow=(15, 95, 120),
    dark_bg=(12, 24, 28),
    rim_color=(35, 205, 195),
    detail_color=(180, 250, 240),
    symbol_func=draw_paleozoic_symbol,
    filename='era_1_paleozoic.png',
    era_name='I. PALEOZOIC',
    sub_text='PRIMORDIAL ABYSS'
)

# Era 2: Triassic
create_circular_badge(
    primary_glow=(235, 150, 25),       # Lightning storm amber
    secondary_glow=(120, 65, 15),
    dark_bg=(28, 20, 15),
    rim_color=(245, 165, 35),
    detail_color=(255, 220, 130),
    symbol_func=draw_triassic_symbol,
    filename='era_2_triassic.png',
    era_name='II. TRIASSIC',
    sub_text='DAWN OF APEX'
)

# Era 3: Jurassic
create_circular_badge(
    primary_glow=(70, 210, 60),        # Lush Jurassic emerald
    secondary_glow=(35, 100, 30),
    dark_bg=(16, 26, 18),
    rim_color=(220, 190, 50),          # Golden fern gold
    detail_color=(240, 230, 140),
    symbol_func=draw_jurassic_symbol,
    filename='era_3_jurassic.png',
    era_name='III. JURASSIC',
    sub_text='ERA OF GIANTS'
)

# Era 4: Cretaceous
create_circular_badge(
    primary_glow=(245, 60, 20),        # Molten magma scarlet
    secondary_glow=(130, 25, 10),
    dark_bg=(32, 14, 12),
    rim_color=(255, 110, 30),
    detail_color=(255, 210, 90),
    symbol_func=draw_cretaceous_symbol,
    filename='era_4_cretaceous.png',
    era_name='IV. CRETACEOUS',
    sub_text='SAVAGE APEX'
)

# Era 5: Cenozoic
create_circular_badge(
    primary_glow=(70, 175, 255),       # Glacial diamond cyan
    secondary_glow=(25, 75, 140),
    dark_bg=(14, 22, 34),
    rim_color=(135, 215, 255),
    detail_color=(220, 245, 255),
    symbol_func=draw_cenozoic_symbol,
    filename='era_5_cenozoic.png',
    era_name='V. CENOZOIC',
    sub_text='ICE AGE TUNDRA'
)

# Era 6: Extinction
create_circular_badge(
    primary_glow=(195, 45, 240),       # Cosmic void purple
    secondary_glow=(80, 15, 110),
    dark_bg=(24, 12, 30),
    rim_color=(235, 175, 55),          # Imperial celestial gold
    detail_color=(255, 225, 140),
    symbol_func=draw_extinction_symbol,
    filename='era_6_extinction.png',
    era_name='VI. EXTINCTION',
    sub_text='COSMIC DRAGON'
)

print("All 6 Era Logos successfully created!")
