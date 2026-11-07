import math
import os
from PIL import Image, ImageDraw, ImageFilter

OUTPUT_PATH = 'assets/portraits/anomalocaris.png'
SIZE = 1024

img = Image.new('RGBA', (SIZE, SIZE), (8, 20, 32, 255))
draw = ImageDraw.Draw(img)

# 1. Background: Deep abyssal oceanic depths with caustics and radial glow
bg_glow = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
bg_draw = ImageDraw.Draw(bg_glow)
for r in range(500, 50, -25):
    alpha = int(90 * (1.0 - r / 500.0))
    bg_draw.ellipse([512 - r, 460 - r, 512 + r, 460 + r], fill=(14, 116, 144, alpha))
bg_glow = bg_glow.filter(ImageFilter.GaussianBlur(radius=40))
img.paste(bg_glow, (0, 0), bg_glow)

# Oceanic godrays / caustics
godrays = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
gr_draw = ImageDraw.Draw(godrays)
for i in range(12):
    angle = -0.4 + i * 0.12
    x0 = 512 + int(math.sin(angle) * 700)
    y0 = 0
    x1 = x0 + 120
    x2 = x0 - 350
    y2 = 1024
    gr_draw.polygon([(x0, y0), (x1, y0), (x2 + 200, y2), (x2, y2)], fill=(34, 211, 238, 18))
godrays = godrays.filter(ImageFilter.GaussianBlur(radius=25))
img.paste(godrays, (0, 0), godrays)

# Floating bubbles / marine snow in background
for bx, by, br in [
    (180, 240, 8), (260, 180, 14), (780, 290, 12), (850, 200, 9),
    (140, 680, 11), (220, 820, 16), (790, 740, 15), (880, 620, 10),
    (400, 120, 10), (620, 140, 12), (320, 910, 13), (690, 870, 14)
]:
    draw.ellipse([bx - br, by - br, bx + br, by + br], fill=(34, 211, 238, 90), outline=(165, 243, 252, 180), width=2)
    draw.ellipse([bx - br//2, by - br//2, bx, by], fill=(255, 255, 255, 160))

# 2. Main Anomalocaris Anatomy:
# Swimming flaps in background (lateral lobes)
flaps_layer = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
fl_draw = ImageDraw.Draw(flaps_layer)

for side in [-1, 1]:
    for i in range(7):
        fy = 520 + i * 55
        span = int(140 + (1.0 - abs(i - 3) * 0.22) * 160)
        fx_tip = 512 + side * (160 + span)
        fy_tip = fy - 25 - i * 8
        fx_base = 512 + side * 140
        fl_draw.polygon([
            (fx_base, fy - 20),
            (fx_tip, fy_tip),
            (fx_tip + side * 15, fy_tip + 25),
            (fx_base, fy + 35)
        ], fill=(14, 116, 144, 210), outline=(34, 211, 238, 240))
flaps_layer = flaps_layer.filter(ImageFilter.GaussianBlur(radius=2))
img.paste(flaps_layer, (0, 0), flaps_layer)

# Tail Fan (Furca caudal) in distant back
for fan_rot in [-0.35, 0, 0.35]:
    tx = 512 + int(math.sin(fan_rot) * 220)
    ty = 920 + int(math.cos(fan_rot) * 80)
    draw.polygon([(512, 860), (tx - 35, ty), (tx + 35, ty)], fill=(8, 51, 68, 230), outline=(34, 211, 238, 200), width=3)

# Segmented Trunk / Body
body_layer = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
b_draw = ImageDraw.Draw(body_layer)
for i in range(8):
    by = 460 + i * 52
    bw = int(170 - i * 14)
    bh = 38
    b_draw.ellipse([512 - bw, by - bh, 512 + bw, by + bh], fill=(14, 116, 144, 255), outline=(8, 51, 68, 255), width=4)
    # Dorsal ridge cyan glow
    b_draw.line([(512, by - bh + 4), (512, by + bh - 4)], fill=(34, 211, 238, 220), width=6)
img.paste(body_layer, (0, 0), body_layer)

# 3. Cephalon (Head Carapace): massive armored shield
ceph_layer = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
c_draw = ImageDraw.Draw(ceph_layer)
c_points = [
    (512, 260), (660, 310), (700, 420), (670, 490),
    (512, 530),
    (354, 490), (324, 420), (364, 310)
]
c_draw.polygon(c_points, fill=(8, 51, 68, 255), outline=(34, 211, 238, 255), width=7)
# Inner plate shading
c_inner = [
    (512, 285), (635, 325), (665, 415), (640, 470),
    (512, 505),
    (384, 470), (359, 415), (389, 325)
]
c_draw.polygon(c_inner, fill=(14, 116, 144, 255), outline=(6, 182, 212, 255), width=4)
img.paste(ceph_layer, (0, 0), ceph_layer)

# 4. Large Stalked Compound Eyes (Bulbing sideways with cyan facets)
for side in [-1, 1]:
    sx = 512 + side * 140
    sy = 360
    ex = 512 + side * 285
    ey = 330
    # Stalk
    draw.line([(sx, sy), (ex, ey)], fill=(8, 51, 68, 255), width=28)
    draw.line([(sx, sy), (ex, ey)], fill=(14, 116, 144, 255), width=20)
    # Bulb
    draw.ellipse([ex - 52, ey - 48, ex + 52, ey + 48], fill=(6, 182, 212, 255), outline=(165, 243, 252, 255), width=6)
    # Facets / highlights
    draw.ellipse([ex - 36, ey - 34, ex + 36, ey + 34], fill=(34, 211, 238, 255))
    draw.ellipse([ex - 18, ey - 22, ex + 14, ey + 10], fill=(255, 255, 255, 220))

# 5. Peytoia Oral Cone (circular ring of 16 sharp radials)
mouth_layer = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
m_draw = ImageDraw.Draw(mouth_layer)
mx, my = 512, 535
m_draw.ellipse([mx - 68, my - 68, mx + 68, my + 68], fill=(3, 7, 18, 255), outline=(21, 94, 117, 255), width=10)
for t in range(16):
    ang = (t / 16.0) * math.pi * 2
    tx0 = mx + int(math.cos(ang) * 58)
    ty0 = my + int(math.sin(ang) * 58)
    tx1 = mx + int(math.cos(ang) * 28)
    ty1 = my + int(math.sin(ang) * 28)
    m_draw.line([(tx0, ty0), (tx1, ty1)], fill=(245, 158, 11, 255), width=6)
# Center abyssal void
m_draw.ellipse([mx - 22, my - 22, mx + 22, my + 22], fill=(2, 6, 23, 255), outline=(34, 211, 238, 200), width=2)
img.paste(mouth_layer, (0, 0), mouth_layer)

# 6. Frontal Raptorial Appendages (the iconic grasping spiny claws)
claw_layer = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
cl_draw = ImageDraw.Draw(claw_layer)

for side in [-1, 1]:
    cur_x = 512 + side * 75
    cur_y = 510
    segments = [
        (cur_x, cur_y),
        (cur_x + side * 65, cur_y - 85),
        (cur_x + side * 140, cur_y - 180),
        (cur_x + side * 190, cur_y - 280),
        (cur_x + side * 170, cur_y - 370),
        (cur_x + side * 95, cur_y - 410),
        (cur_x + side * 25, cur_y - 390)
    ]
    for seg_idx in range(len(segments) - 1):
        pA = segments[seg_idx]
        pB = segments[seg_idx + 1]
        cl_draw.line([pA, pB], fill=(8, 51, 68, 255), width=34 - seg_idx * 3)
        cl_draw.line([pA, pB], fill=(14, 116, 144, 255), width=24 - seg_idx * 3)
        cl_draw.line([pA, pB], fill=(34, 211, 238, 220), width=6)

        # Endites / sharp spines pointing inwards
        mid_x = (pA[0] + pB[0]) // 2
        mid_y = (pA[1] + pB[1]) // 2
        dx = pB[0] - pA[0]
        dy = pB[1] - pA[1]
        length = math.hypot(dx, dy)
        if length > 0:
            nx = -dy / length * side
            ny = dx / length * side
            spine_len = 50 + seg_idx * 8
            sp_tip_x = int(mid_x + nx * spine_len)
            sp_tip_y = int(mid_y + ny * spine_len)
            cl_draw.polygon([
                (mid_x - int(dx * 0.15), mid_y - int(dy * 0.15)),
                (sp_tip_x, sp_tip_y),
                (mid_x + int(dx * 0.15), mid_y + int(dy * 0.15))
            ], fill=(245, 158, 11, 255), outline=(251, 191, 36, 255))
            cl_draw.line([(mid_x, mid_y), (sp_tip_x, sp_tip_y)], fill=(254, 240, 138, 255), width=3)

img.paste(claw_layer, (0, 0), claw_layer)

# 7. Foreground Atmospheric Vignette and Bioluminescent Rim
vignette = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
v_draw = ImageDraw.Draw(vignette)
for r in range(460, 520, 4):
    alpha = int(220 * ((r - 460) / 60.0))
    v_draw.rectangle([0, 0, SIZE, SIZE], outline=(2, 6, 12, alpha), width=SIZE//2 - r)
img.paste(vignette, (0, 0), vignette)

# Save image
img.save(OUTPUT_PATH, 'PNG')
print(f"Generated Anomalocaris portrait at {OUTPUT_PATH} ({SIZE}x{SIZE})")
