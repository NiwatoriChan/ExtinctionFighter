#!/usr/bin/env python3
"""
tools/generate_species_svgs.py
Generates paleontological anatomical SVG blueprints (side & dorsal silhouettes),
high-detail vector skin/scale/feather/chitin SVG textures, vector bump SVGs,
and crisp roster SVG emblems for all 13 remaining Extinction Kombat 3D fighters,
then rasterizes the texture SVGs into 1024x1024 PBR PNG maps for Blender & GLB.
"""

import math
import os
import random
import resvg_py
from PIL import Image
import io

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SVG_SPECIES_DIR = os.path.join(ROOT, "assets", "svg", "species")
SVG_TEX_DIR = os.path.join(ROOT, "assets", "svg", "textures")
SVG_EMBLEM_DIR = os.path.join(ROOT, "assets", "svg", "emblems")
TEX_PNG_DIR = os.path.join(ROOT, "assets", "textures", "fighters")

for d in (SVG_SPECIES_DIR, SVG_TEX_DIR, SVG_EMBLEM_DIR, TEX_PNG_DIR):
    os.makedirs(d, exist_ok=True)


# Species metadata aligned with js/fighters/*.js
SPECIES_SPECS = {
    "ankylo": {
        "sci": "Ankylosaurus magniventris",
        "primary": "#149c8d",
        "secondary": "#185d56",
        "dark": "#0d4a44",
        "belly": "#7ef0de",
        "accent": "#f59e0b",
        "pattern": "osteoderm_scutes",
        "side_body": "M 160,340 C 190,220 330,175 500,178 C 660,180 760,225 795,295 C 805,345 770,385 690,395 L 280,398 C 200,395 155,375 160,340 Z",
        "side_head": "M 785,295 C 815,260 885,255 935,290 C 958,310 955,345 925,358 L 800,362 Z",
        "side_tail": "M 168,332 L 70,326 L 35,305 C 18,300 12,332 28,354 C 46,368 72,356 85,346 L 175,355 Z",
        "top_body": "M 170,500 C 210,360 360,315 515,318 C 675,322 765,375 795,500 C 765,625 675,678 515,682 C 360,685 210,640 170,500 Z",
        "extras": [
            "M 795,270 L 760,225 L 818,255 Z",
            "M 792,352 L 758,388 L 815,365 Z",
            "M 230,220 L 210,185 L 255,212 Z",
            "M 340,188 L 325,152 L 368,182 Z",
            "M 465,178 L 455,140 L 495,176 Z",
            "M 595,184 L 590,146 L 625,188 Z",
            "M 705,210 L 705,174 L 734,218 Z",
        ],
    },
    "stegosaurus": {
        "sci": "Stegosaurus stenops",
        "primary": "#22b357",
        "secondary": "#1a6838",
        "dark": "#114b29",
        "belly": "#9cf4bc",
        "accent": "#ff5400",
        "pattern": "tubercles_stripes",
        "side_body": "M 270,340 C 310,190 470,135 615,175 C 725,205 780,275 825,295 C 855,310 855,355 815,375 C 715,405 445,420 295,380 Z",
        "side_head": "M 820,295 C 865,280 925,295 955,320 C 962,334 948,348 915,350 L 825,342 Z",
        "side_tail": "M 275,335 C 205,325 135,295 62,285 L 55,315 C 128,332 200,362 285,375 Z",
        "top_body": "M 265,500 C 325,385 480,355 625,385 C 735,412 795,455 820,500 C 795,545 735,588 625,615 C 480,645 325,615 265,500 Z",
        "extras": [
            # Alternating diamond dermal plates
            "M 340,245 L 325,145 L 385,120 L 415,215 Z",
            "M 425,205 L 415,75 L 488,52 L 512,185 Z",
            "M 520,185 L 522,50 L 598,42 L 608,185 Z",
            "M 615,192 L 635,78 L 702,88 L 692,215 Z",
            "M 702,225 L 732,145 L 778,162 L 758,248 Z",
            # Thagomizer spikes
            "M 85,290 L 22,225 L 112,285 Z",
            "M 118,302 L 62,235 L 146,298 Z",
        ],
    },
    "spinosaurus": {
        "sci": "Spinosaurus aegyptiacus",
        "primary": "#2678b8",
        "secondary": "#164d75",
        "dark": "#143d59",
        "belly": "#9ae2fa",
        "accent": "#12c9df",
        "pattern": "aquatic_stripes",
        "side_body": "M 290,340 C 365,245 545,235 685,275 C 745,295 795,285 835,275 L 820,365 C 725,405 465,415 305,375 Z",
        "side_head": "M 815,272 C 865,255 935,262 978,282 C 988,295 982,314 955,318 L 835,326 Z",
        "side_tail": "M 295,335 C 215,310 135,265 45,270 C 20,295 25,355 55,380 C 140,390 220,378 302,372 Z",
        "top_body": "M 295,500 C 375,405 545,390 695,425 C 770,445 815,475 835,500 C 815,525 770,555 695,575 C 545,610 375,595 295,500 Z",
        "extras": [
            # Giant rounded-top dorsal sail
            "M 345,285 C 365,120 445,75 545,78 C 635,82 690,145 710,278 Z",
            # Nasal crest
            "M 865,264 L 885,238 L 912,262 Z",
        ],
    },
    "therizino": {
        "sci": "Therizinosaurus cheloniformis",
        "primary": "#6e4c36",
        "secondary": "#473024",
        "dark": "#33221a",
        "belly": "#d2b494",
        "accent": "#10b981",
        "pattern": "plumage_barbs",
        "side_body": "M 280,390 C 295,255 415,195 545,205 C 635,215 685,295 675,395 C 625,455 375,465 280,390 Z",
        "side_head": "M 645,145 C 685,112 755,112 795,142 C 805,158 790,175 752,178 L 665,175 Z",
        "side_tail": "M 285,365 L 125,385 L 95,412 L 295,418 Z",
        "top_body": "M 285,500 C 315,375 435,345 555,365 C 645,385 685,445 685,500 C 685,555 645,615 555,635 C 435,655 315,625 285,500 Z",
        "extras": [
            # Long S-neck
            "M 595,235 C 615,175 630,135 665,142 L 685,172 C 660,185 650,225 642,265 Z",
            # Giant curved scythe claws
            "M 645,335 C 735,340 825,385 885,465 C 835,435 760,392 650,368 Z",
            "M 645,355 C 725,372 805,425 855,495 C 805,458 742,412 645,382 Z",
            "M 645,372 C 712,398 778,452 820,515 C 775,478 722,428 640,396 Z",
        ],
    },
    "maiasaura": {
        "sci": "Maiasaura peeblesorum",
        "primary": "#26b37d",
        "secondary": "#12684d",
        "dark": "#0d4c38",
        "belly": "#b8f7dc",
        "accent": "#f97316",
        "pattern": "hadrosaur_bands",
        "side_body": "M 275,335 C 335,215 495,195 645,235 C 725,258 765,315 760,370 C 680,415 415,420 285,375 Z",
        "side_head": "M 755,220 C 795,192 875,205 928,238 C 942,252 932,272 895,274 L 772,268 Z",
        "side_tail": "M 280,330 L 65,305 L 48,328 L 285,372 Z",
        "top_body": "M 275,500 C 345,390 505,370 655,405 C 730,425 765,465 765,500 C 765,535 730,575 655,595 C 505,630 345,610 275,500 Z",
        "extras": [
            # Preorbital solid crest bump
            "M 805,202 L 828,176 L 855,205 Z",
        ],
    },
    "apato": {
        "sci": "Apatosaurus ajax",
        "primary": "#58569c",
        "secondary": "#3b386b",
        "dark": "#2b2852",
        "belly": "#ced5f5",
        "accent": "#a78bfa",
        "pattern": "sauropod_spots",
        "side_body": "M 280,335 C 330,190 485,155 615,195 C 690,220 725,285 715,365 C 635,415 395,420 295,380 Z",
        "side_head": "M 865,125 C 898,114 942,126 955,148 C 958,162 935,172 902,168 L 868,158 Z",
        "side_tail": "M 285,330 C 195,315 110,330 22,290 C 12,295 16,308 32,315 C 115,355 200,362 292,372 Z",
        "top_body": "M 280,500 C 345,360 495,335 625,375 C 695,400 725,455 725,500 C 725,545 695,600 625,625 C 495,665 345,640 280,500 Z",
        "extras": [
            # Thick muscular sauropod neck
            "M 665,235 C 735,195 805,150 875,132 L 882,165 C 815,195 755,255 705,315 Z",
        ],
    },
    "postosuchus": {
        "sci": "Postosuchus kirkpatricki",
        "primary": "#c74432",
        "secondary": "#6b2b20",
        "dark": "#471e17",
        "belly": "#f5cbb8",
        "accent": "#f59e0b",
        "pattern": "croc_osteoderms",
        "side_body": "M 275,335 C 345,250 515,245 665,272 C 735,288 765,335 745,375 C 660,405 395,405 285,372 Z",
        "side_head": "M 745,262 C 805,238 895,248 948,278 C 958,298 942,322 895,326 L 758,318 Z",
        "side_tail": "M 280,332 L 45,325 L 40,348 L 285,368 Z",
        "top_body": "M 275,500 C 350,415 515,405 665,435 C 730,452 758,478 758,500 C 758,522 730,548 665,565 C 515,595 350,585 275,500 Z",
        "extras": [
            "M 325,262 L 340,242 L 358,260 Z",
            "M 415,252 L 430,232 L 448,250 Z",
            "M 505,250 L 520,230 L 538,248 Z",
            "M 595,256 L 610,236 L 628,255 Z",
        ],
    },
    "terabird": {
        "sci": "Phorusrhacos longissimus",
        "primary": "#e26a22",
        "secondary": "#6e3920",
        "dark": "#422416",
        "belly": "#feddb8",
        "accent": "#facc15",
        "pattern": "raptor_feathers",
        "side_body": "M 320,335 C 345,235 465,195 575,215 C 645,230 675,295 655,355 C 595,405 395,405 320,335 Z",
        "side_head": "M 645,112 C 705,86 815,92 878,128 C 895,148 888,188 865,202 C 845,172 805,168 745,170 L 655,162 Z",
        "side_tail": "M 325,315 L 175,275 L 155,312 L 315,345 Z",
        "top_body": "M 315,500 C 355,400 475,380 585,405 C 645,425 675,465 675,500 C 675,535 645,575 585,595 C 475,620 355,600 315,500 Z",
        "extras": [
            # Muscular avian neck & swept crest
            "M 595,230 C 618,175 632,128 655,115 L 685,155 C 668,185 658,225 642,268 Z",
            "M 648,108 L 588,75 L 635,126 Z",
        ],
    },
    "smilodon": {
        "sci": "Smilodon fatalis",
        "primary": "#e69635",
        "secondary": "#b86420",
        "dark": "#703a12",
        "belly": "#faf0dc",
        "accent": "#f5c26b",
        "pattern": "feline_rosettes",
        "side_body": "M 265,320 C 325,245 495,215 645,232 C 715,242 745,295 735,352 C 665,388 375,385 275,355 Z",
        "side_head": "M 735,218 C 778,188 848,195 888,232 C 898,255 888,288 848,292 L 745,282 Z",
        "side_tail": "M 268,318 C 215,310 185,325 162,348 L 178,364 C 205,345 232,338 272,345 Z",
        "top_body": "M 265,500 C 335,405 505,380 655,405 C 718,422 748,462 748,500 C 748,538 718,578 655,595 C 505,620 335,595 265,500 Z",
        "extras": [
            # Iconic 7-inch curved upper saber canines
            "M 848,278 C 858,325 848,378 825,412 C 818,372 824,322 828,278 Z",
            "M 862,276 C 872,322 862,372 840,404 C 834,366 840,318 844,276 Z",
        ],
    },
    "giantsloth": {
        "sci": "Megatherium americanum",
        "primary": "#a35e2c",
        "secondary": "#6b3b1a",
        "dark": "#47250e",
        "belly": "#ebd09d",
        "accent": "#fbbf24",
        "pattern": "shaggy_fur",
        "side_body": "M 265,375 C 285,225 415,155 555,175 C 655,195 705,275 685,375 C 625,445 355,455 265,375 Z",
        "side_head": "M 675,185 C 718,155 795,165 835,205 C 845,228 828,255 785,258 L 685,248 Z",
        "side_tail": "M 272,355 L 118,415 L 142,445 L 302,405 Z",
        "top_body": "M 265,500 C 305,355 435,325 565,350 C 655,375 695,440 695,500 C 695,560 655,625 565,650 C 435,675 305,645 265,500 Z",
        "extras": [
            # Massive curved sickle claws
            "M 665,335 C 725,355 775,395 805,455 C 762,430 715,392 655,365 Z",
            "M 665,358 C 718,382 762,422 788,478 C 748,452 708,415 652,388 Z",
        ],
    },
    "pulmonoscorpius": {
        "sci": "Pulmonoscorpius kirktonensis",
        "primary": "#9b4de0",
        "secondary": "#5c278a",
        "dark": "#411a66",
        "belly": "#eeddff",
        "accent": "#f43f5e",
        "pattern": "arachnid_chitin",
        "side_body": "M 325,340 C 385,285 535,282 675,295 C 745,305 785,335 765,372 C 675,395 415,395 325,340 Z",
        "side_head": "M 745,298 C 785,285 835,295 855,325 C 858,342 835,360 785,362 L 745,355 Z",
        "side_tail": "M 332,332 C 255,315 195,245 215,155 C 235,85 325,52 405,78 C 435,92 455,125 435,148 C 405,132 348,125 305,145 C 265,168 258,235 288,285 L 345,315 Z",
        "top_body": "M 320,500 C 385,395 545,385 685,412 C 755,432 795,468 795,500 C 795,532 755,568 685,588 C 545,615 385,605 320,500 Z",
        "extras": [
            # Enlarged pedipalp pincer
            "M 765,315 C 835,275 915,245 965,255 C 935,282 885,295 835,315 C 885,325 935,335 958,358 C 905,365 825,345 765,338 Z",
            # Venomous aculeus stinger tip
            "M 432,128 C 465,125 495,148 485,185 C 465,162 442,150 422,145 Z",
        ],
    },
    "anomalocaris": {
        "sci": "Anomalocaris canadensis",
        "primary": "#26a9be",
        "secondary": "#167a8e",
        "dark": "#1d5e6e",
        "belly": "#cbeff7",
        "accent": "#f59e0b",
        "pattern": "cambrian_chitin",
        "side_body": "M 215,325 C 315,278 525,275 715,295 C 775,305 815,332 795,362 C 715,388 385,392 215,348 Z",
        "side_head": "M 765,295 C 815,275 885,285 915,318 C 918,338 892,358 845,362 L 775,355 Z",
        "side_tail": "M 218,325 L 95,255 L 75,285 L 185,345 L 88,368 L 105,392 L 222,348 Z",
        "top_body": "M 215,500 C 325,330 535,315 715,385 C 795,418 845,462 845,500 C 845,538 795,582 715,615 C 535,685 325,670 215,500 Z",
        "extras": [
            # Frontal segmented raptorial appendages with spiny endites
            "M 865,335 C 915,338 955,368 965,415 C 942,402 925,382 905,372 L 885,405 L 875,368 L 855,395 Z",
            # Stalked compound eye
            "M 815,282 C 825,245 848,225 872,225 C 885,228 892,248 878,262 C 862,272 842,272 828,288 Z",
        ],
    },
    "dragon": {
        "sci": "Drak'Zul (Dracorex + Varanus + Patagium)",
        "primary": "#4f4857",
        "secondary": "#63525b",
        "dark": "#2e2833",
        "belly": "#a62424",
        "accent": "#ff5e14",
        "pattern": "magma_scales",
        "side_body": "M 265,335 C 335,235 495,215 645,245 C 715,262 745,315 735,368 C 655,405 385,408 275,375 Z",
        "side_head": "M 755,155 C 805,125 895,135 948,175 C 958,195 942,222 895,225 L 772,215 Z",
        "side_tail": "M 272,332 C 175,312 95,338 22,295 L 38,332 C 105,368 188,362 282,372 Z",
        "top_body": "M 265,500 C 335,395 505,375 655,405 C 720,425 748,465 748,500 C 748,535 720,575 655,595 C 505,625 335,605 265,500 Z",
        "extras": [
            # Muscular neck
            "M 665,255 C 705,215 735,175 765,158 L 785,198 C 755,225 732,265 705,305 Z",
            # Dracorex cranial horns
            "M 778,148 L 705,88 L 795,138 Z",
            "M 798,142 L 738,75 L 818,136 Z",
            # Folded bat-wing patagium silhouette
            "M 615,242 L 455,65 L 325,135 L 385,225 L 485,245 Z",
        ],
    },
}


def build_species_blueprint_svg(fid, spec):
    extras_paths = "\n    ".join(
        f'<path d="{d}" fill="{spec["accent"]}" fill-opacity="0.82" stroke="{spec["dark"]}" stroke-width="3"/>'
        for d in spec["extras"]
    )
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 768" width="1024" height="768">
  <defs>
    <linearGradient id="bodyGrad_{fid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{spec["dark"]}"/>
      <stop offset="45%" stop-color="{spec["primary"]}"/>
      <stop offset="100%" stop-color="{spec["belly"]}"/>
    </linearGradient>
    <linearGradient id="accentGrad_{fid}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="{spec["accent"]}"/>
      <stop offset="100%" stop-color="{spec["secondary"]}"/>
    </linearGradient>
  </defs>
  <!-- Anatomical Reference Sheet: {spec["sci"]} -->
  <g id="layer-body-side">
    <path d="{spec["side_body"]}" fill="url(#bodyGrad_{fid})" stroke="{spec["dark"]}" stroke-width="4"/>
  </g>
  <g id="layer-head-profile">
    <path d="{spec["side_head"]}" fill="{spec["primary"]}" stroke="{spec["dark"]}" stroke-width="4"/>
  </g>
  <g id="layer-tail-profile">
    <path d="{spec["side_tail"]}" fill="{spec["secondary"]}" stroke="{spec["dark"]}" stroke-width="4"/>
  </g>
  <g id="layer-appendages">
    {extras_paths}
  </g>
  <g id="layer-body-top" transform="translate(0, 120) scale(1, 0.72)">
    <path d="{spec["top_body"]}" fill="{spec["primary"]}" fill-opacity="0.28" stroke="{spec["accent"]}" stroke-width="2" stroke-dasharray="8 6"/>
  </g>
</svg>
'''


def build_emblem_svg(fid, spec):
    extras_paths = "\n    ".join(
        f'<path d="{d}" fill="{spec["accent"]}"/>'
        for d in spec["extras"]
    )
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 512" width="512" height="256">
  <defs>
    <linearGradient id="emblem_{fid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{spec["accent"]}"/>
      <stop offset="55%" stop-color="{spec["primary"]}"/>
      <stop offset="100%" stop-color="{spec["secondary"]}"/>
    </linearGradient>
  </defs>
  <g transform="translate(0, -15)">
    <path d="{spec["side_tail"]}" fill="{spec["secondary"]}"/>
    <path d="{spec["side_body"]}" fill="url(#emblem_{fid})"/>
    <path d="{spec["side_head"]}" fill="{spec["primary"]}"/>
    {extras_paths}
  </g>
</svg>
'''


def hex_to_rgba(hex_str, alpha=1.0):
    h = hex_str.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return f"rgba({r},{g},{b},{alpha:.3f})"


def build_skin_texture_svgs(fid, spec):
    """Generates both an Albedo vector SVG and a Bump/Height vector SVG (1024x1024)."""
    rng = random.Random(sum(ord(c) for c in fid) * 97 + 1337)
    size = 1024
    pat = spec["pattern"]

    # Countershaded gradient across U (0/1 = dorsal dark ridge, 0.5 = ventral belly)
    albedo_elems = [
        f'''<defs>
  <linearGradient id="cs_{fid}" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%" stop-color="{spec["dark"]}"/>
    <stop offset="18%" stop-color="{spec["secondary"]}"/>
    <stop offset="36%" stop-color="{spec["primary"]}"/>
    <stop offset="47%" stop-color="{spec["belly"]}"/>
    <stop offset="53%" stop-color="{spec["belly"]}"/>
    <stop offset="64%" stop-color="{spec["primary"]}"/>
    <stop offset="82%" stop-color="{spec["secondary"]}"/>
    <stop offset="100%" stop-color="{spec["dark"]}"/>
  </linearGradient>
</defs>
<rect width="1024" height="1024" fill="url(#cs_{fid})"/>'''
    ]

    bump_elems = [
        '<rect width="1024" height="1024" fill="#7c7c7c"/>'
    ]

    if pat in ("osteoderm_scutes", "croc_osteoderms", "magma_scales"):
        cols, rows = (28, 28) if pat == "osteoderm_scutes" else (32, 32)
        cw, ch = size / cols, size / rows
        for gy in range(rows):
            for gx in range(cols):
                cx = (gx + 0.2 + rng.random() * 0.6) * cw
                cy = (gy + 0.2 + rng.random() * 0.6) * ch
                rx = cw * (0.38 + rng.random() * 0.16)
                ry = ch * (0.36 + rng.random() * 0.16)
                sides = 5 + rng.randint(0, 2)
                rot = rng.random() * math.pi * 2
                pts = []
                for s in range(sides):
                    a = rot + (s / sides) * math.pi * 2
                    rm = 0.84 + rng.random() * 0.28
                    pts.append(f"{cx + math.cos(a)*rx*rm:.1f},{cy + math.sin(a)*ry*rm:.1f}")
                poly = " ".join(pts)
                u = cx / size
                is_dorsal = u < 0.26 or u > 0.74
                fill_col = spec["accent"] if (is_dorsal and rng.random() > 0.68) else (spec["dark"] if rng.random() > 0.45 else spec["primary"])
                alpha = 0.34 if pat != "magma_scales" else (0.55 if is_dorsal else 0.32)
                stroke_col = spec["accent"] if (pat == "magma_scales" and is_dorsal and rng.random() > 0.7) else spec["dark"]
                albedo_elems.append(
                    f'<polygon points="{poly}" fill="{hex_to_rgba(fill_col, alpha)}" stroke="{hex_to_rgba(stroke_col, 0.65)}" stroke-width="2.0"/>'
                )
                b_lum = rng.randint(155, 228) if is_dorsal else rng.randint(110, 175)
                bump_elems.append(
                    f'<polygon points="{poly}" fill="rgb({b_lum},{b_lum},{b_lum})" stroke="#2a2a2a" stroke-width="2.4"/>'
                )

    elif pat in ("aquatic_stripes", "hadrosaur_bands", "tubercles_stripes"):
        # Soft organic mottled flank patches & dappled natural skin markings (avoids rigid pinstripe rings)
        for s in range(18):
            yc = (s + 0.35 + rng.random() * 0.3) * (size / 18.0)
            rx_band = 95 + rng.random() * 145
            ry_band = 18 + rng.random() * 26
            for side in (0, 1):
                cx = size * (0.14 + rng.random() * 0.14) if side == 0 else size * (0.86 - rng.random() * 0.14)
                ang = (rng.random() - 0.5) * 24
                albedo_elems.append(
                    f'<ellipse cx="{cx:.1f}" cy="{yc:.1f}" rx="{rx_band:.1f}" ry="{ry_band:.1f}" transform="rotate({ang:.1f} {cx:.1f} {yc:.1f})" fill="{hex_to_rgba(spec["dark"], 0.28)}"/>'
                )
                albedo_elems.append(
                    f'<ellipse cx="{cx + (40 if side == 0 else -40):.1f}" cy="{yc + 8:.1f}" rx="{rx_band*0.55:.1f}" ry="{ry_band*0.5:.1f}" transform="rotate({ang:.1f} {cx:.1f} {yc:.1f})" fill="{hex_to_rgba(spec["accent"], 0.20)}"/>'
                )
        for _ in range(2600):
            x = rng.random() * size
            y = rng.random() * size
            r = 2.0 + rng.random() * 5.0
            b_lum = rng.randint(115, 205)
            bump_elems.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="rgb({b_lum},{b_lum},{b_lum})" stroke="#404040" stroke-width="0.7"/>')
            if rng.random() > 0.48:
                col = spec["accent"] if rng.random() > 0.72 else spec["dark"]
                albedo_elems.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{hex_to_rgba(col, 0.16)}"/>')

    elif pat in ("plumage_barbs", "raptor_feathers", "shaggy_fur"):
        # Overlapping layered natural feather vanes / shaggy fur locks (warm streaks, never neon spots)
        count = 2200 if pat != "shaggy_fur" else 2600
        for _ in range(count):
            x = rng.random() * size
            y = rng.random() * size
            w = 7 + rng.random() * 10
            h = 30 + rng.random() * 38
            ang = (rng.random() - 0.5) * 14
            roll = rng.random()
            if roll > 0.84:
                col = spec["belly"]
                alpha = 0.16
            elif roll > 0.42:
                col = spec["secondary"]
                alpha = 0.34
            else:
                col = spec["primary"]
                alpha = 0.32
            albedo_elems.append(
                f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{w*0.5:.1f}" ry="{h*0.5:.1f}" transform="rotate({ang:.1f} {x:.1f} {y:.1f})" fill="{hex_to_rgba(col, alpha)}" stroke="{hex_to_rgba(spec["dark"], 0.28)}" stroke-width="0.9"/>'
            )
            b_lum = rng.randint(120, 215)
            bump_elems.append(
                f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{w*0.45:.1f}" ry="{h*0.45:.1f}" transform="rotate({ang:.1f} {x:.1f} {y:.1f})" fill="rgb({b_lum},{b_lum},{b_lum})" stroke="#383838" stroke-width="0.9"/>'
            )

    elif pat == "feline_rosettes":
        # Natural irregular broken jaguar/Pleistocene cat rosettes + fine fur strokes
        for _ in range(260):
            u = rng.random()
            if 0.38 < u < 0.62:
                continue
            cx = u * size
            cy = rng.random() * size
            rx = 11 + rng.random() * 18
            ry = rx * (0.78 + rng.random() * 0.44)
            rot_r = rng.random() * math.pi * 2
            # Warm dark-ochre rosette core
            albedo_elems.append(
                f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{rx*0.72:.1f}" ry="{ry*0.72:.1f}" transform="rotate({math.degrees(rot_r):.1f} {cx:.1f} {cy:.1f})" fill="{hex_to_rgba(spec["accent"], 0.36)}"/>'
            )
            # 3-5 irregular dark kidney-shaped outer petals
            n_petals = rng.randint(3, 5)
            for p_idx in range(n_petals):
                a0 = rot_r + (p_idx / n_petals) * math.pi * 2 + (rng.random() - 0.5) * 0.35
                px = cx + math.cos(a0) * rx
                py = cy + math.sin(a0) * ry
                pw = rx * (0.34 + rng.random() * 0.22)
                ph = ry * (0.16 + rng.random() * 0.12)
                pang = math.degrees(a0) + 90
                albedo_elems.append(
                    f'<ellipse cx="{px:.1f}" cy="{py:.1f}" rx="{pw:.1f}" ry="{ph:.1f}" transform="rotate({pang:.1f} {px:.1f} {py:.1f})" fill="{hex_to_rgba(spec["dark"], 0.72)}"/>'
                )
            if rng.random() > 0.45:
                # 1-2 tiny interior dots like Panthera onca
                dx = cx + (rng.random() - 0.5) * rx * 0.45
                dy = cy + (rng.random() - 0.5) * ry * 0.45
                albedo_elems.append(f'<circle cx="{dx:.1f}" cy="{dy:.1f}" r="{1.8 + rng.random()*2.0:.1f}" fill="{hex_to_rgba(spec["dark"], 0.68)}"/>')
        for _ in range(2000):
            x = rng.random() * size
            y = rng.random() * size
            l = 9 + rng.random() * 14
            b_lum = rng.randint(110, 185)
            bump_elems.append(f'<line x1="{x:.1f}" y1="{y:.1f}" x2="{x+1.5:.1f}" y2="{y+l:.1f}" stroke="rgb({b_lum},{b_lum},{b_lum})" stroke-width="1.5"/>')

    elif pat == "sauropod_spots":
        # Reticulated elephantine hide polygons + subtle mottled dorsal pebbles (natural, non-neon)
        for _ in range(1800):
            x = rng.random() * size
            y = rng.random() * size
            r = 4 + rng.random() * 11
            b_lum = rng.randint(105, 195)
            bump_elems.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="rgb({b_lum},{b_lum},{b_lum})" stroke="#353535" stroke-width="1.2"/>')
        for _ in range(260):
            u = rng.random()
            if 0.34 < u < 0.66:
                continue
            cx, cy = u * size, rng.random() * size
            r = 7 + rng.random() * 16
            col = spec["accent"] if rng.random() > 0.6 else spec["dark"]
            albedo_elems.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="{hex_to_rgba(col, 0.22)}" stroke="{hex_to_rgba(spec["dark"], 0.28)}" stroke-width="1.5"/>')

    elif pat == "cambrian_chitin":
        # Luminous Burgess-Shale chitin plates with transverse gill-blade striations & dappled amber-teal spots
        for y in range(0, size, 64):
            albedo_elems.append(f'<rect x="0" y="{y}" width="1024" height="5" fill="{hex_to_rgba("#0c3b47", 0.50)}"/>')
            albedo_elems.append(f'<rect x="0" y="{y+5}" width="1024" height="5" fill="{hex_to_rgba("#67e8f9", 0.48)}"/>')
            albedo_elems.append(f'<rect x="0" y="{y+10}" width="1024" height="3" fill="{hex_to_rgba(spec["accent"], 0.42)}"/>')
            bump_elems.append(f'<rect x="0" y="{y}" width="1024" height="6" fill="#323232"/>')
            bump_elems.append(f'<rect x="0" y="{y+6}" width="1024" height="6" fill="#e4e4e4"/>')
        # Fine parallel gill-lamellae striations along each tergite band
        for x in range(0, size, 14):
            albedo_elems.append(f'<line x1="{x}" y1="0" x2="{x}" y2="1024" stroke="{hex_to_rgba("#99f6e4", 0.16)}" stroke-width="2.0"/>')
            bump_elems.append(f'<line x1="{x}" y1="0" x2="{x}" y2="1024" stroke="#b8b8b8" stroke-width="1.8"/>')
        # Dappled museum-style carapace spots (golden-amber + dark slate-teal)
        for _ in range(950):
            x = rng.random() * size
            y = rng.random() * size
            r = 3.0 + rng.random() * 10.5
            is_amber = rng.random() > 0.46
            col = "#fbbf24" if is_amber else "#0f4858"
            alpha = 0.44 if is_amber else 0.34
            albedo_elems.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{hex_to_rgba(col, alpha)}" stroke="{hex_to_rgba("#22d3ee", 0.25)}" stroke-width="0.9"/>')
            b_lum = rng.randint(145, 232)
            bump_elems.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="rgb({b_lum},{b_lum},{b_lum})"/>')

    elif pat == "arachnid_chitin":
        # Segmented chitin plates, iridescent striations & tuberculate ridges
        for y in range(0, size, 64):
            albedo_elems.append(f'<rect x="0" y="{y}" width="1024" height="8" fill="{hex_to_rgba(spec["dark"], 0.55)}"/>')
            albedo_elems.append(f'<rect x="0" y="{y+8}" width="1024" height="4" fill="{hex_to_rgba(spec["accent"], 0.48)}"/>')
            bump_elems.append(f'<rect x="0" y="{y}" width="1024" height="8" fill="#3a3a3a"/>')
            bump_elems.append(f'<rect x="0" y="{y+8}" width="1024" height="6" fill="#d8d8d8"/>')
        for _ in range(900):
            x = rng.random() * size
            y = rng.random() * size
            r = 2.5 + rng.random() * 7.5
            col = spec["accent"] if rng.random() > 0.6 else spec["secondary"]
            albedo_elems.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{hex_to_rgba(col, 0.35)}" stroke="{hex_to_rgba(spec["accent"], 0.3)}" stroke-width="0.8"/>')
            b_lum = rng.randint(135, 225)
            bump_elems.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="rgb({b_lum},{b_lum},{b_lum})"/>')

    albedo_svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">\n'
        + "\n".join(albedo_elems)
        + "\n</svg>\n"
    )
    bump_svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">\n'
        + "\n".join(bump_elems)
        + "\n</svg>\n"
    )
    return albedo_svg, bump_svg


def rasterize_svg_to_png(svg_str, out_png_path):
    png_bytes = resvg_py.svg_to_bytes(svg_string=svg_str, width=1024, height=1024)
    img = Image.open(io.BytesIO(png_bytes)).convert("RGB")
    img.save(out_png_path, format="PNG", optimize=True)


def main():
    for fid, spec in SPECIES_SPECS.items():
        blueprint_svg = build_species_blueprint_svg(fid, spec)
        with open(os.path.join(SVG_SPECIES_DIR, f"{fid}.svg"), "w", encoding="utf-8") as f:
            f.write(blueprint_svg)

        emblem_svg = build_emblem_svg(fid, spec)
        with open(os.path.join(SVG_EMBLEM_DIR, f"{fid}.svg"), "w", encoding="utf-8") as f:
            f.write(emblem_svg)

        albedo_svg, bump_svg = build_skin_texture_svgs(fid, spec)
        with open(os.path.join(SVG_TEX_DIR, f"{fid}_skin.svg"), "w", encoding="utf-8") as f:
            f.write(albedo_svg)
        with open(os.path.join(SVG_TEX_DIR, f"{fid}_bump.svg"), "w", encoding="utf-8") as f:
            f.write(bump_svg)

        rasterize_svg_to_png(albedo_svg, os.path.join(TEX_PNG_DIR, f"{fid}_albedo.png"))
        rasterize_svg_to_png(bump_svg, os.path.join(TEX_PNG_DIR, f"{fid}_bump.png"))
        print(f"[SVG+PBR OK] {fid} ({spec['sci']})")


if __name__ == "__main__":
    main()
