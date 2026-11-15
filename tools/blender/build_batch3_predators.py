"""
tools/blender/build_batch3_predators.py
Batch 3 Blender sculpts & GLB exports:
1. therizino (Therizinosaurus cheloniformis)
2. postosuchus (Postosuchus kirkpatricki)
3. terabird (Phorusrhacos longissimus)
"""

import os
import sys
import math
import bpy

THIS_DIR = os.path.dirname(os.path.abspath(__file__))
if THIS_DIR not in sys.path:
    sys.path.insert(0, THIS_DIR)

from blender_rig_utils import (
    clear_scene,
    make_pbr_material,
    create_bone_node,
    build_organic_tube,
    build_curved_claw_or_horn,
    build_osteoderm_plate,
    build_anatomical_eye,
    export_fighter_glb,
)

ROOT = os.path.abspath(os.path.join(THIS_DIR, "..", ".."))
TEX_DIR = os.path.join(ROOT, "assets", "textures", "fighters")
OUT_DIR = os.path.join(ROOT, "assets", "models", "fighters")


def tex_paths(fid):
    return (
        os.path.join(TEX_DIR, f"{fid}_albedo.png"),
        os.path.join(TEX_DIR, f"{fid}_bump.png"),
    )


def build_therizino():
    clear_scene()
    albedo, bump = tex_paths("therizino")
    mat_body = make_pbr_material("Mat_BodyPrimary", (0.10, 0.08, 0.06, 1), roughness=0.80, metallic=0.01, albedo_path=albedo, bump_path=bump, bump_strength=0.30)
    mat_accent = make_pbr_material("Mat_Accent", (0.50, 0.44, 0.30, 1), roughness=0.42, metallic=0.02)
    mat_beak = make_pbr_material("Mat_Secondary", (0.06, 0.05, 0.04, 1), roughness=0.62, metallic=0.02, bump_path=bump, bump_strength=0.20)
    mat_iris = make_pbr_material("Mat_Eye", (0.58, 0.32, 0.05, 1), roughness=0.12, emissive=(0.45, 0.22, 0.03, 1), emissive_strength=0.18)
    mat_pupil = make_pbr_material("Mat_Pupil", (0.02, 0.02, 0.02, 1), roughness=0.1)

    root = create_bone_node("Bone_Root")
    hips = create_bone_node("Bone_Hips", (0.0, 0.0, 2.15), parent=root)
    torso = create_bone_node("Bone_Torso", (0.0, 0.0, 0.0), parent=hips)

    # Pot-bellied high-browsing feathered torso flowing seamlessly into pelvis & neck
    build_organic_tube(
        "Therizino_Torso",
        [
            (-1.12, 0.0, -0.06, 0.24, 0.28),
            (-0.62, 0.0, -0.01, 0.52, 0.58),
            (-0.08, 0.0, 0.14, 0.68, 0.80),
            (0.55, 0.0, 0.38, 0.54, 0.60),
            (1.10, 0.0, 0.78, 0.22, 0.26),
        ],
        segs_u=24,
        segs_v=24,
        mat=mat_body,
        parent=torso,
        dorsal_keel=0.06,
        taper_start=True,
        taper_end=True,
        subdiv=1,
    )

    # Long S-curved feathered neck blended seamlessly inside thorax & head
    neck = create_bone_node("Bone_Neck", (0.86, 0.0, 0.60), parent=torso)
    build_organic_tube(
        "Therizino_Neck",
        [(-0.26, 0.0, -0.20, 0.34, 0.37), (0.04, 0.0, 0.14, 0.26, 0.28), (0.24, 0.0, 0.58, 0.19, 0.21), (0.38, 0.0, 1.06, 0.14, 0.15)],
        18,
        18,
        mat_body,
        neck,
        taper_start=True,
        taper_end=True,
        subdiv=1,
    )
    head = create_bone_node("Bone_Head", (0.34, 0.0, 1.00), parent=neck)
    build_organic_tube("Therizino_Cranium", [(-0.14, 0.0, 0.0, 0.16, 0.16), (0.22, 0.0, -0.02, 0.13, 0.13), (0.50, 0.0, -0.08, 0.06, 0.055)], 16, 14, mat_body, head, taper_start=True, subdiv=1)
    # Sleek feathered occipital plumage tuft anchored cleanly into crown
    for ci, dy in enumerate((-0.05, 0.0, 0.05)):
        build_curved_claw_or_horn(f"Therizino_FeatherTuft_{ci}", 0.38, 0.045, 0.14, (-0.90, dy * 3.0, 0.34), mat_body, head, (0.04, dy, 0.10))
    for s in (-1, 1):
        build_anatomical_eye(f"Therizino_Eye_{s}", 0.046, mat_iris, mat_pupil, head, (0.16, s * 0.13, 0.06))
    jaw = create_bone_node("Bone_Jaw", (0.10, 0.0, -0.09), parent=head)
    build_organic_tube("Therizino_Jaw", [(0.0, 0.0, 0.0, 0.10, 0.055), (0.36, 0.0, -0.03, 0.05, 0.035)], 12, 8, mat_beak, jaw, subdiv=1)

    # Massive feathered arms with sculpted hands & 3 giant curved scythe claws (Bone_Arm0..1)
    for idx, ly in enumerate((0.56, -0.56)):
        side = 1.0 if ly > 0 else -1.0
        arm = create_bone_node(f"Bone_Arm{idx}", (0.72, ly, 0.36), parent=torso)
        build_organic_tube(
            f"Therizino_Arm{idx}",
            [
                (-0.12, -side * 0.06, 0.08, 0.18, 0.20),
                (0.28, side * 0.08, -0.38, 0.15, 0.16),
                (0.64, side * 0.04, -0.68, 0.12, 0.11),
                (0.75, side * 0.04, -0.74, 0.10, 0.09),
            ],
            16, 16, mat_body, arm, taper_start=True, subdiv=1,
        )
        # Sleek folded feathered wing fan trailing cleanly along the forearm
        for fi in range(6):
            t_f = fi / 5.0
            build_curved_claw_or_horn(
                f"Therizino_ArmPlumage_{idx}_{fi}", length=0.48 + fi * 0.02, base_r=0.056, curve_bend=0.08,
                direction=(-0.96, side * 0.05, -0.14), mat=mat_beak if fi % 2 == 0 else mat_body, parent=arm,
                local_pos=(0.18 + t_f * 0.44, side * 0.04, -0.26 - t_f * 0.38),
            )
        # Iconic splayed triple 1-meter curved metallic-bone scythe claws anchored in manus
        for ci, (dy, yaw) in enumerate(((-0.065, -0.06), (0.0, 0.0), (0.065, 0.06))):
            build_curved_claw_or_horn(
                f"Therizino_Scythe{idx}_{ci}",
                length=1.18 if ci == 1 else 1.06,
                base_r=0.046,
                curve_bend=0.34,
                direction=(0.90, -side * 0.06 + yaw, -0.26 - ci * 0.04),
                mat=mat_accent,
                parent=arm,
                local_pos=(0.68, side * 0.04 + dy, -0.72),
            )

    # Digitigrade pillar theropod hind legs (Bone_Leg0..1) + grounded tridactyl footpads
    for idx, ly in enumerate((0.46, -0.46)):
        side = 1.0 if ly > 0 else -1.0
        leg = create_bone_node(f"Bone_Leg{idx}", (-0.18, ly, -0.05), parent=hips)
        build_organic_tube(
            f"Therizino_Leg{idx}",
            [
                (0.0, 0.0, 0.08, 0.34, 0.38),
                (0.22, side * 0.03, -0.84, 0.22, 0.24),
                (-0.18, side * 0.02, -1.52, 0.15, 0.16),
                (0.12, side * 0.02, -2.02, 0.15, 0.12),
            ],
            16, 20, mat_body, leg, taper_end=False, subdiv=1,
        )
        build_organic_tube(
            f"Therizino_FootPad{idx}",
            [(-0.04, side * 0.02, -2.04, 0.18, 0.08), (0.28, side * 0.02, -2.06, 0.19, 0.06)],
            12, 10, mat_body, leg, belly_flat=0.28, subdiv=1
        )
        for ci, dy in enumerate((-0.09, 0.0, 0.09)):
            build_curved_claw_or_horn(f"Therizino_FootClaw{idx}_{ci}", 0.22, 0.036, 0.12, (1.0, 0.0, -0.18), mat_accent, leg, (0.26, side * 0.02 + dy, -2.05))

    # Continuous overlapping feathered tail (Bone_Tail0..2) + terminal rectrix plume fan
    t_lens = (0.58, 0.52, 0.45)
    t_rads = (0.32, 0.20, 0.12, 0.055)
    p_tail = torso
    for i, tlen in enumerate(t_lens):
        seg = create_bone_node(f"Bone_Tail{i}", (-0.82 if i == 0 else -t_lens[i - 1], 0.0, -0.04 if i == 0 else 0.0), parent=p_tail)
        build_organic_tube(f"Therizino_TailSeg{i}", [(0.22, 0.0, 0.0, t_rads[i], t_rads[i]), (-tlen - 0.06, 0.0, 0.0, t_rads[i + 1], t_rads[i + 1])], 14, 12, mat_body, seg, taper_start=True, taper_end=(i == len(t_lens) - 1), subdiv=1)
        p_tail = seg
    for fi, ang in enumerate((-0.30, -0.10, 0.10, 0.30)):
        build_curved_claw_or_horn(
            f"Therizino_TailFan_{fi}", length=0.44, base_r=0.048, curve_bend=-0.06,
            direction=(-0.94, math.sin(ang) * 0.42, 0.16), mat=mat_beak if fi % 2 == 0 else mat_body,
            parent=p_tail, local_pos=(-0.36, math.sin(ang) * 0.05, 0.0),
        )

    out = os.path.join(OUT_DIR, "therizino.glb")
    sz = export_fighter_glb(out)
    print(f"[GLB OK] therizino -> {out} ({sz} bytes)")


def build_postosuchus():
    clear_scene()
    albedo, bump = tex_paths("postosuchus")
    mat_body = make_pbr_material("Mat_BodyPrimary", (0.16, 0.06, 0.04, 1), roughness=0.72, metallic=0.02, albedo_path=albedo, bump_path=bump, bump_strength=0.30)
    mat_dark = make_pbr_material("Mat_Secondary", (0.08, 0.03, 0.02, 1), roughness=0.74, metallic=0.02, bump_path=bump, bump_strength=0.22)
    mat_accent = make_pbr_material("Mat_Accent", (0.30, 0.14, 0.05, 1), roughness=0.60, metallic=0.02)
    mat_tooth = make_pbr_material("Mat_Tooth", (0.74, 0.68, 0.54, 1), roughness=0.24, metallic=0.0)
    mat_iris = make_pbr_material("Mat_Eye", (0.62, 0.36, 0.06, 1), roughness=0.12, emissive=(0.40, 0.20, 0.02, 1), emissive_strength=0.15)
    mat_pupil = make_pbr_material("Mat_Pupil", (0.02, 0.02, 0.02, 1), roughness=0.1)

    root = create_bone_node("Bone_Root")
    hips = create_bone_node("Bone_Hips", (0.0, 0.0, 1.48), parent=root)
    torso = create_bone_node("Bone_Torso", (0.0, 0.0, 0.0), parent=hips)

    # Armored rauisuchian torso flowing cleanly into hips & neck + flat armored dorsal osteoderm plates
    build_organic_tube(
        "Posto_Torso",
        [
            (-1.32, 0.0, 0.04, 0.24, 0.26),
            (-0.85, 0.0, 0.06, 0.40, 0.42),
            (-0.25, 0.0, 0.10, 0.50, 0.52),
            (0.45, 0.0, 0.12, 0.48, 0.50),
            (1.24, 0.0, 0.08, 0.24, 0.26),
        ],
        22,
        22,
        mat_body,
        torso,
        dorsal_keel=0.14,
        belly_flat=0.22,
        taper_start=True,
        taper_end=True,
        subdiv=1,
    )
    for ox in (-0.92, -0.68, -0.44, -0.20, 0.04, 0.28, 0.52, 0.76, 0.96):
        for s in (-1, 1):
            sc = build_osteoderm_plate(
                f"Posto_Osteo_{ox:.2f}_{s}", width=0.22, height=0.22, thickness=0.042,
                mat=mat_dark, parent=torso, local_pos=(ox, s * 0.11, 0.54 - abs(ox) * 0.12),
                rot=(s * 0.24, 0.0, 0.0), shape='hex',
            )
            sc.scale = (1.15, 0.75, 0.65)

    neck = create_bone_node("Bone_Neck", (1.02, 0.0, 0.10), parent=torso)
    build_organic_tube("Posto_Neck", [(-0.28, 0.0, -0.02, 0.34, 0.36), (0.14, 0.0, 0.04, 0.27, 0.29), (0.56, 0.0, 0.09, 0.22, 0.24)], 16, 14, mat_body, neck, dorsal_keel=0.12, taper_start=True, taper_end=True, subdiv=1)

    head = create_bone_node("Bone_Head", (0.42, 0.0, 0.08), parent=neck)
    # Deep blocky rauisuchian skull blended cleanly from neck
    build_organic_tube(
        "Posto_Skull",
        [(-0.20, 0.0, 0.0, 0.22, 0.24), (0.04, 0.0, 0.03, 0.25, 0.28), (0.38, 0.0, 0.02, 0.22, 0.26), (0.76, 0.0, -0.05, 0.15, 0.19), (1.02, 0.0, -0.09, 0.10, 0.12)],
        18, 16, mat_body, head, dorsal_keel=0.16, belly_flat=0.22, taper_start=True, subdiv=1,
    )
    for s in (-1, 1):
        build_anatomical_eye(f"Posto_Eye_{s}", 0.052, mat_iris, mat_pupil, head, (0.28, s * 0.20, 0.10))
        for ti in range(5):
            build_curved_claw_or_horn(f"Posto_UpTooth_{s}_{ti}", 0.11, 0.022, 0.06, (-0.1, 0.0, -1.0), mat_tooth, head, (0.42 + ti * 0.11, s * 0.11, -0.12))

    jaw = create_bone_node("Bone_Jaw", (0.14, 0.0, -0.14), parent=head)
    build_organic_tube("Posto_Jaw", [(0.0, 0.0, 0.0, 0.18, 0.09), (0.76, 0.0, -0.02, 0.09, 0.06)], 14, 10, mat_body, jaw, subdiv=1)

    # Continuous overlapping Armored Tail (Bone_Tail0..3) with keeled osteoderm scute rows
    t_lens = (0.78, 0.74, 0.68, 0.62)
    t_rads = (0.32, 0.22, 0.14, 0.08, 0.035)
    p_tail = torso
    for i, tlen in enumerate(t_lens):
        seg = create_bone_node(f"Bone_Tail{i}", (-1.08 if i == 0 else -t_lens[i - 1], 0.0, 0.05 if i == 0 else 0.0), parent=p_tail)
        build_organic_tube(f"Posto_TailSeg{i}", [(0.24, 0.0, 0.0, t_rads[i], t_rads[i]), (-tlen - 0.08, 0.0, 0.0, t_rads[i + 1], t_rads[i + 1])], 14, 12, mat_body, seg, dorsal_keel=0.10, taper_start=True, taper_end=(i == len(t_lens) - 1), subdiv=1)
        for sub_x in (-tlen * 0.28, -tlen * 0.72):
            tsc = build_osteoderm_plate(
                f"Posto_TailScute_{i}_{sub_x:.2f}", width=0.16 - i * 0.025, height=0.16 - i * 0.025, thickness=0.032,
                mat=mat_dark, parent=seg, local_pos=(sub_x, 0.0, (t_rads[i] + t_rads[i + 1]) * 0.44),
                rot=(0.0, -0.06, 0.0), shape='hex',
            )
            tsc.scale = (1.2, 0.65, 0.75)
        p_tail = seg

    # 4 Semi-erect pillar archosaur legs (Bone_Leg0..3) with grounded clawed feet at Z = -1.48
    for idx, (lx, ly, is_front) in enumerate(((0.80, 0.48, True), (0.80, -0.48, True), (-0.75, 0.50, False), (-0.75, -0.50, False))):
        side = 1.0 if ly > 0 else -1.0
        leg = create_bone_node(f"Bone_Leg{idx}", (lx, ly, -0.05), parent=hips)
        build_organic_tube(
            f"Posto_Leg{idx}",
            [
                (0.0, 0.0, 0.06, 0.23 if is_front else 0.31, 0.25 if is_front else 0.33),
                ((-0.08 if is_front else 0.16), side * 0.03, -0.68, 0.14 if is_front else 0.18, 0.15 if is_front else 0.19),
                ((0.06 if is_front else -0.08), side * 0.02, -1.18, 0.11, 0.11),
                (0.10, side * 0.02, -1.36, 0.11, 0.09),
            ],
            14, 18, mat_body, leg, taper_end=False, subdiv=1,
        )
        build_organic_tube(
            f"Posto_FootPad{idx}",
            [(0.0, side * 0.02, -1.38, 0.13, 0.06), (0.24, side * 0.02, -1.40, 0.14, 0.05)],
            10, 8, mat_body, leg, belly_flat=0.25, subdiv=1
        )
        for ci, dy in enumerate((-0.07, 0.0, 0.07)):
            build_curved_claw_or_horn(f"Posto_Claw{idx}_{ci}", 0.14, 0.026, 0.12, (1.0, 0.0, -0.18), mat_dark, leg, (0.22, side * 0.02 + dy, -1.39))

    out = os.path.join(OUT_DIR, "postosuchus.glb")
    sz = export_fighter_glb(out)
    print(f"[GLB OK] postosuchus -> {out} ({sz} bytes)")


def build_terabird():
    clear_scene()
    albedo, bump = tex_paths("terabird")
    mat_body = make_pbr_material("Mat_BodyPrimary", (0.12, 0.07, 0.05, 1), roughness=0.78, metallic=0.01, albedo_path=albedo, bump_path=bump, bump_strength=0.26)
    mat_dark = make_pbr_material("Mat_Secondary", (0.06, 0.04, 0.03, 1), roughness=0.72, metallic=0.01, bump_path=bump, bump_strength=0.18)
    mat_beak = make_pbr_material("Mat_Accent", (0.40, 0.24, 0.07, 1), roughness=0.42, metallic=0.02)
    mat_iris = make_pbr_material("Mat_Eye", (0.64, 0.46, 0.10, 1), roughness=0.12, emissive=(0.40, 0.28, 0.04, 1), emissive_strength=0.15)
    mat_pupil = make_pbr_material("Mat_Pupil", (0.02, 0.02, 0.02, 1), roughness=0.1)

    root = create_bone_node("Bone_Root")
    hips = create_bone_node("Bone_Hips", (0.0, 0.0, 2.25), parent=root)
    torso = create_bone_node("Bone_Torso", (0.0, 0.0, 0.0), parent=hips)

    # Athletic cursorial terror-bird body with seamless chest-to-neck transition
    build_organic_tube(
        "Tera_Torso",
        [(-0.82, 0.0, 0.02, 0.18, 0.22), (-0.32, 0.0, 0.12, 0.44, 0.50), (0.36, 0.0, 0.22, 0.45, 0.54), (0.86, 0.0, 0.52, 0.20, 0.24)],
        22,
        20,
        mat_body,
        torso,
        dorsal_keel=0.08,
        taper_start=True,
        taper_end=True,
        subdiv=1,
    )

    neck = create_bone_node("Bone_Neck", (0.68, 0.0, 0.42), parent=torso)
    build_organic_tube("Tera_Neck", [(-0.24, 0.0, -0.18, 0.30, 0.33), (0.04, 0.0, 0.18, 0.23, 0.25), (0.22, 0.0, 0.56, 0.18, 0.20), (0.30, 0.0, 0.96, 0.16, 0.18)], 18, 18, mat_body, neck, taper_start=True, taper_end=True, subdiv=1)

    head = create_bone_node("Bone_Head", (0.28, 0.0, 0.90), parent=neck)
    # Long predatory Kelenken/Phorusrhacos hatchet skull with tapered cere-to-hooked-beak blend
    build_organic_tube(
        "Tera_Cranium",
        [(-0.22, 0.0, -0.02, 0.19, 0.21), (0.06, 0.0, 0.05, 0.20, 0.23), (0.36, 0.0, 0.04, 0.14, 0.19), (0.48, 0.0, 0.02, 0.08, 0.12)],
        18, 16, mat_body, head, dorsal_keel=0.12, taper_start=True, taper_end=True, subdiv=1,
    )
    build_organic_tube(
        "Tera_BeakUpper",
        [(0.14, 0.0, 0.02, 0.11, 0.15), (0.38, 0.0, 0.04, 0.11, 0.18), (0.68, 0.0, 0.03, 0.075, 0.16), (0.94, 0.0, -0.04, 0.038, 0.11), (1.06, 0.0, -0.20, 0.015, 0.035)],
        16, 16, mat_beak, head, dorsal_keel=0.28, belly_flat=0.22, taper_start=True, subdiv=1,
    )
    # Swept fiery occipital crown feather plumes rooted in skull
    for ci, dz in enumerate((-0.06, -0.02, 0.02, 0.06)):
        build_curved_claw_or_horn(f"Tera_CrestFeather_{ci}", 0.46, 0.052, 0.14, (-0.92, dz * 2.2, 0.40), mat_dark if ci % 2 == 0 else mat_body, head, (0.04, dz, 0.18))
    for s in (-1, 1):
        build_anatomical_eye(f"Tera_Eye_{s}", 0.054, mat_iris, mat_pupil, head, (0.14, s * 0.18, 0.09))

    jaw = create_bone_node("Bone_Jaw", (0.14, 0.0, -0.10), parent=head)
    build_organic_tube("Tera_Jaw", [(0.0, 0.0, 0.0, 0.11, 0.065), (0.68, 0.0, 0.0, 0.04, 0.042)], 14, 10, mat_beak, jaw, subdiv=1)

    # Folded layered feathered vestigial wings (Bone_Arm0..1)
    for idx, ly in enumerate((0.44, -0.44)):
        side = 1.0 if ly > 0 else -1.0
        wing = create_bone_node(f"Bone_Arm{idx}", (0.35, ly, 0.24), parent=torso)
        for fi, pz in enumerate((0.04, -0.04, -0.12, -0.20)):
            build_curved_claw_or_horn(
                f"Tera_WingPlume_{idx}_{fi}", length=0.60 - fi * 0.06, base_r=0.072, curve_bend=0.14,
                direction=(-0.94, side * 0.12, -0.26 + fi * 0.05), mat=mat_dark if fi % 2 == 1 else mat_body,
                parent=wing, local_pos=(0.06, -side * 0.04, pz),
            )

    # Layered swept avian tail fan (Bone_Tail0) anchored cleanly into rump
    tail = create_bone_node("Bone_Tail0", (-0.64, 0.0, 0.06), parent=torso)
    for fi, ang in enumerate((-0.34, -0.16, 0.0, 0.16, 0.34)):
        build_curved_claw_or_horn(
            f"Tera_TailFeather_{fi}", length=0.76, base_r=0.068, curve_bend=-0.08,
            direction=(-0.92, math.sin(ang) * 0.45, 0.22), mat=mat_dark if fi % 2 == 1 else mat_body,
            parent=tail, local_pos=(0.14, math.sin(ang) * 0.08, 0.02),
        )

    # Muscular cursorial avian hind legs (Bone_Leg0..1) + grounded tridactyl talons at Z = -2.25
    for idx, ly in enumerate((0.36, -0.36)):
        side = 1.0 if ly > 0 else -1.0
        leg = create_bone_node(f"Bone_Leg{idx}", (-0.08, ly, -0.05), parent=hips)
        build_organic_tube(
            f"Tera_Leg{idx}",
            [
                (0.0, 0.0, 0.08, 0.28, 0.30),
                (0.18, side * 0.02, -0.78, 0.17, 0.18),
                (-0.14, side * 0.01, -1.52, 0.10, 0.11),
                (0.06, side * 0.01, -2.14, 0.10, 0.08),
            ],
            14, 20, mat_body, leg, taper_end=False, subdiv=1,
        )
        build_organic_tube(
            f"Tera_FootPad{idx}",
            [(-0.04, side * 0.01, -2.16, 0.12, 0.055), (0.20, side * 0.01, -2.18, 0.13, 0.045)],
            10, 8, mat_dark, leg, belly_flat=0.25, subdiv=1
        )
        for ci, dy in enumerate((-0.08, 0.0, 0.08)):
            build_curved_claw_or_horn(f"Tera_Talon{idx}_{ci}", 0.24, 0.032, 0.18, (1.0, 0.0, -0.22), mat_dark, leg, (0.18, side * 0.01 + dy, -2.17))

    out = os.path.join(OUT_DIR, "terabird.glb")
    sz = export_fighter_glb(out)
    print(f"[GLB OK] terabird -> {out} ({sz} bytes)")


def run_all():
    build_therizino()
    build_postosuchus()
    build_terabird()


if __name__ == "__main__":
    run_all()
