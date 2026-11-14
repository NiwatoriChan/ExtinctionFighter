"""
tools/blender/build_batch1_herbivores.py
Batch 1 Blender sculpts & GLB exports:
1. ankylo (Ankylosaurus magniventris)
2. stegosaurus (Stegosaurus stenops)
3. maiasaura (Maiasaura peeblesorum)
4. apato (Apatosaurus ajax)
"""

import os
import sys
import math
import bpy
import bmesh

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
    attach_mesh_obj,
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


def build_quadruped_leg(name, hip_pos, knee_offset, ankle_offset, foot_offset, r_thigh, r_shin, mat_body, mat_claw, parent):
    """Creates a Bone_LegN pivot at hip_pos with sculpted thigh, shin, ankle, grounded footpad & embedded claws."""
    leg_node = create_bone_node(name, hip_pos, parent=parent)
    p0 = (0.0, 0.0, 0.0)
    p1 = knee_offset
    p2 = ankle_offset
    p3 = foot_offset

    # Smooth continuous limb from rounded shoulder/hip socket tucked seamlessly into torso
    build_organic_tube(
        f"{name}_Limb",
        [
            (p0[0], p0[1], p0[2] + 0.14, r_thigh * 0.82, r_thigh * 0.88),
            (p0[0] + (p1[0] - p0[0]) * 0.45, p0[1] + (p1[1] - p0[1]) * 0.45, p0[2] + (p1[2] - p0[2]) * 0.45, r_thigh * 0.96, r_thigh * 1.02),
            (p1[0], p1[1], p1[2], r_shin * 1.10, r_shin * 1.10),
            (p1[0] + (p2[0] - p1[0]) * 0.5, p1[1] + (p2[1] - p1[1]) * 0.5, p1[2] + (p2[2] - p1[2]) * 0.5, r_shin * 0.94, r_shin * 0.94),
            (p2[0], p2[1], p2[2], r_shin * 0.88, r_shin * 0.88),
            (p3[0], p3[1], p3[2] + 0.04, r_shin * 0.92, r_shin * 0.85),
        ],
        segs_u=16,
        segs_v=22,
        mat=mat_body,
        parent=leg_node,
        taper_start=True,
        taper_end=False,
        subdiv=1,
    )

    # Planted footpad overlapping ankle cleanly on floor
    build_organic_tube(
        f"{name}_FootPad",
        [
            (p3[0] - r_shin * 0.35, p3[1], p3[2] + 0.06, r_shin * 0.98, r_shin * 0.55),
            (p3[0] + r_shin * 0.30, p3[1], p3[2] + 0.04, r_shin * 1.12, r_shin * 0.48),
            (p3[0] + r_shin * 0.85, p3[1], p3[2] + 0.02, r_shin * 0.92, r_shin * 0.34),
        ],
        segs_u=14,
        segs_v=10,
        mat=mat_body,
        parent=leg_node,
        belly_flat=0.28,
        subdiv=1,
    )

    for c_idx, dy in enumerate((-r_shin * 0.58, 0.0, r_shin * 0.58)):
        build_curved_claw_or_horn(
            f"{name}_Claw{c_idx}",
            length=r_shin * 0.72,
            base_r=r_shin * 0.22,
            curve_bend=0.10,
            direction=(1.0, 0.0, -0.18),
            mat=mat_claw,
            parent=leg_node,
            local_pos=(p3[0] + r_shin * 0.62, p3[1] + dy, p3[2] + 0.04),
        )
    return leg_node


def build_ankylo():
    clear_scene()
    albedo, bump = tex_paths("ankylo")
    mat_body = make_pbr_material("Mat_BodyPrimary", (0.14, 0.72, 0.66, 1), roughness=0.50, metallic=0.06, albedo_path=albedo, bump_path=bump, bump_strength=0.30)
    mat_horn = make_pbr_material("Mat_Accent", (0.96, 0.64, 0.08, 1), roughness=0.32, metallic=0.16)
    mat_beak = make_pbr_material("Mat_Secondary", (0.16, 0.44, 0.42, 1), roughness=0.45)
    mat_iris = make_pbr_material("Mat_Eye", (0.20, 0.85, 0.60, 1), roughness=0.12, emissive=(0.15, 0.75, 0.5, 1), emissive_strength=0.4)
    mat_pupil = make_pbr_material("Mat_Pupil", (0.02, 0.02, 0.03, 1), roughness=0.1)

    root = create_bone_node("Bone_Root")
    hips = create_bone_node("Bone_Hips", (0.0, 0.0, 1.35), parent=root)
    torso = create_bone_node("Bone_Torso", (0.0, 0.0, 0.0), parent=hips)

    # Broad low-slung tank carapace (wider laterally, flat heavily-armored underside)
    build_organic_tube(
        "Ankylo_Carapace",
        [
            (-1.44, 0.0, 0.14, 0.36, 0.28),
            (-0.85, 0.0, 0.20, 1.02, 0.52),
            (0.0, 0.0, 0.26, 1.24, 0.62),
            (0.84, 0.0, 0.22, 1.04, 0.54),
            (1.38, 0.0, 0.10, 0.46, 0.34),
        ],
        segs_u=26,
        segs_v=24,
        mat=mat_body,
        parent=torso,
        dorsal_keel=0.06,
        belly_flat=0.36,
        subdiv=1,
    )

    # Prominent raised dorsal osteoderm scute rows & lateral armor spikes
    for rx in (-1.02, -0.68, -0.34, 0.0, 0.34, 0.68, 1.02):
        t = max(0.0, 1.0 - (rx / 1.28) ** 2)
        arch_z = 0.24 + t * 0.54
        half_w = 0.52 + t * 0.64
        for frac in (0.0, 0.34, 0.68):
            sides = [0] if frac == 0.0 else [-1, 1]
            for s in sides:
                oy = s * half_w * frac
                oz = arch_z - (frac ** 2) * 0.26 + 0.04
                build_osteoderm_plate(
                    f"Ankylo_Scute_{rx:.2f}_{s}_{frac:.2f}",
                    width=0.26,
                    height=0.22,
                    thickness=0.14 if frac == 0.0 else 0.10,
                    mat=mat_horn if frac == 0.0 else mat_beak,
                    parent=torso,
                    local_pos=(rx, oy, oz),
                    rot=(s * frac * 0.52, 0.0, 0.0),
                    shape='hex',
                )
        for s in (-1, 1):
            build_curved_claw_or_horn(
                f"Ankylo_LatSpike_{rx:.2f}_{s}",
                length=0.42 + t * 0.20,
                base_r=0.11,
                curve_bend=0.12,
                direction=(-0.42, s * 0.90, 0.10),
                mat=mat_horn,
                parent=torso,
                local_pos=(rx, s * (half_w + 0.02), 0.12 + t * 0.10),
            )

    # Armored neck with cervical half-ring spikes & broad triangular skull
    neck = create_bone_node("Bone_Neck", (1.26, 0.0, 0.08), parent=torso)
    build_organic_tube(
        "Ankylo_Neck",
        [(-0.28, 0.0, 0.02, 0.44, 0.35), (0.38, 0.0, -0.04, 0.36, 0.27)],
        segs_u=16,
        segs_v=14,
        mat=mat_body,
        parent=neck,
        taper_start=True,
        taper_end=True,
        subdiv=1,
    )
    for s in (-1, 1):
        build_curved_claw_or_horn(f"Ankylo_CervicalSpike_{s}", 0.32, 0.08, 0.08, (-0.35, s * 0.85, 0.40), mat_horn, neck, (0.10, s * 0.32, 0.18))

    head = create_bone_node("Bone_Head", (0.30, 0.0, -0.04), parent=neck)
    build_organic_tube(
        "Ankylo_Cranium",
        [
            (-0.04, 0.0, 0.04, 0.42, 0.26),
            (0.28, 0.0, 0.06, 0.44, 0.30),
            (0.58, 0.0, -0.02, 0.30, 0.22),
            (0.84, 0.0, -0.10, 0.16, 0.14),
        ],
        segs_u=18,
        segs_v=14,
        mat=mat_body,
        parent=head,
        belly_flat=0.25,
        subdiv=1,
    )
    # Caputegulae crown armor + rostral beak
    build_osteoderm_plate("Ankylo_Caputegulae", width=0.52, height=0.42, thickness=0.12, mat=mat_horn, parent=head, local_pos=(0.30, 0.0, 0.24), shape='hex')
    build_organic_tube(
        "Ankylo_Beak",
        [(0.74, 0.0, -0.10, 0.16, 0.13), (0.94, 0.0, -0.16, 0.11, 0.08)],
        segs_u=14,
        segs_v=8,
        mat=mat_beak,
        parent=head,
        subdiv=1,
    )

    for s in (-1, 1):
        # Squamosal (upper rear) & Jugal (lower cheek) horns
        build_curved_claw_or_horn(f"Ankylo_HornSq_{s}", 0.42, 0.12, 0.10, (-0.7, s * 0.6, 0.45), mat_horn, head, (0.08, s * 0.34, 0.24))
        build_curved_claw_or_horn(f"Ankylo_HornJg_{s}", 0.36, 0.11, 0.08, (-0.5, s * 0.85, -0.20), mat_horn, head, (0.16, s * 0.38, -0.06))
        build_anatomical_eye(f"Ankylo_Eye_{s}", 0.058, mat_iris, mat_pupil, head, (0.44, s * 0.33, 0.06))

    jaw = create_bone_node("Bone_Jaw", (0.18, 0.0, -0.16), parent=head)
    build_organic_tube(
        "Ankylo_Jaw",
        [(0.0, 0.0, 0.0, 0.25, 0.11), (0.48, 0.0, -0.03, 0.16, 0.08)],
        segs_u=14,
        segs_v=10,
        mat=mat_body,
        parent=jaw,
        subdiv=1,
    )

    # Continuous overlapping stiffened tail handle + fused oval armored tail club
    t_lens = (0.70, 0.70, 0.74)
    t_rads = (0.36, 0.26, 0.18, 0.14)
    p_tail = torso
    for i, tlen in enumerate(t_lens):
        seg = create_bone_node(f"Bone_Tail{i}", (-1.30 if i == 0 else -t_lens[i - 1], 0.0, 0.14 if i == 0 else 0.0), parent=p_tail)
        build_organic_tube(
            f"Ankylo_TailSeg{i}",
            [(0.12, 0.0, 0.0, t_rads[i] * 1.04, t_rads[i] * 0.92), (-tlen - 0.08, 0.0, 0.0, t_rads[i + 1], t_rads[i + 1] * 0.92)],
            segs_u=14,
            segs_v=12,
            mat=mat_body,
            parent=seg,
            taper_start=False,
            taper_end=False,
            subdiv=1,
        )
        if i < 2:
            for s in (-1, 1):
                build_curved_claw_or_horn(f"Ankylo_TailSpike{i}_{s}", 0.28, 0.075, 0.06, (-0.35, s * 0.9, 0.1), mat_horn, seg, (-tlen * 0.48, s * (t_rads[i] * 0.80), 0.02))
        p_tail = seg

    # Authentic fused Ankylosaurus oval boulder club with midline keel & lateral osteoderm domes
    club = create_bone_node("Special_TailClub", (-0.74, 0.0, 0.0), parent=p_tail)
    build_organic_tube(
        "Ankylo_ClubBoulder",
        [
            (0.14, 0.0, 0.0, 0.22, 0.18),
            (-0.08, 0.0, 0.02, 0.46, 0.30),
            (-0.34, 0.0, 0.02, 0.44, 0.28),
            (-0.56, 0.0, 0.0, 0.22, 0.16),
        ],
        segs_u=20,
        segs_v=16,
        mat=mat_horn,
        parent=club,
        dorsal_keel=0.14,
        belly_flat=0.18,
        subdiv=1,
    )
    for s in (-1, 1):
        build_osteoderm_plate(f"Ankylo_ClubKeel_{s}", width=0.46, height=0.34, thickness=0.12, mat=mat_beak, parent=club, local_pos=(-0.22, s * 0.28, 0.04), rot=(s * 1.15, 0.0, 0.0), shape='hex')

    # 4 Columnar armored legs (feet resting on Z = -1.35 -> world Z = 0.0)
    # Note: In Blender +Y is left, -Y is right (Three.js +Z is -Blender Y)
    for idx, (lx, ly, is_front) in enumerate(((0.80, 0.72, True), (0.80, -0.72, True), (-0.80, 0.72, False), (-0.80, -0.72, False))):
        side = 1.0 if ly > 0 else -1.0
        build_quadruped_leg(
            f"Bone_Leg{idx}",
            (lx, ly, -0.05),
            (-0.10 if is_front else 0.14, side * 0.05, -0.62),
            (0.04, side * 0.03, -1.16),
            (0.10, side * 0.03, -1.30),
            0.28,
            0.18,
            mat_body,
            mat_horn,
            hips,
        )

    out = os.path.join(OUT_DIR, "ankylo.glb")
    sz = export_fighter_glb(out)
    print(f"[GLB OK] ankylo -> {out} ({sz} bytes)")


def build_stegosaurus():
    clear_scene()
    albedo, bump = tex_paths("stegosaurus")
    mat_body = make_pbr_material("Mat_BodyPrimary", (0.18, 0.72, 0.36, 1), roughness=0.54, metallic=0.04, albedo_path=albedo, bump_path=bump, bump_strength=0.28)
    mat_plate = make_pbr_material("Mat_Accent", (0.98, 0.38, 0.06, 1), roughness=0.36, metallic=0.08, emissive=(0.45, 0.14, 0.0, 1), emissive_strength=0.14)
    mat_horn = make_pbr_material("Mat_Secondary", (0.96, 0.92, 0.78, 1), roughness=0.30)
    mat_iris = make_pbr_material("Mat_Eye", (0.98, 0.80, 0.20, 1), roughness=0.1, emissive=(0.6, 0.45, 0.05, 1), emissive_strength=0.35)
    mat_pupil = make_pbr_material("Mat_Pupil", (0.02, 0.02, 0.02, 1), roughness=0.1)

    root = create_bone_node("Bone_Root")
    hips = create_bone_node("Bone_Hips", (0.0, 0.0, 1.65), parent=root)
    torso = create_bone_node("Bone_Torso", (0.0, 0.0, 0.0), parent=hips)

    # High-arched back (characteristic stegosaur dorsal arch tallest over hips)
    build_organic_tube(
        "Stego_Torso",
        [
            (-1.25, 0.0, 0.10, 0.36, 0.44),
            (-0.55, 0.0, 0.34, 0.62, 0.78),
            (0.15, 0.0, 0.26, 0.66, 0.74),
            (0.85, 0.0, -0.02, 0.50, 0.52),
            (1.32, 0.0, -0.18, 0.32, 0.34),
        ],
        segs_u=22,
        segs_v=22,
        mat=mat_body,
        parent=torso,
        dorsal_keel=0.16,
        belly_flat=0.18,
        subdiv=1,
    )

    # Alternating staggered dual rows of 13 iconic pentagonal Stegosaurus dermal plates
    plates_group = create_bone_node("Special_Plates", (0.0, 0.0, 0.0), parent=torso)
    plate_specs = [
        (-1.42, 0.28, 0.32, 0.48, -0.26),
        (-1.16, 0.52, 0.42, 0.68, -0.20),
        (-0.88, 0.80, 0.52, 0.86, -0.12),
        (-0.62, 0.98, 0.62, 1.04, -0.06),
        (-0.34, 1.06, 0.66, 1.14, 0.00),
        (-0.08, 1.04, 0.64, 1.10, 0.06),
        (0.18, 0.96, 0.58, 0.98, 0.12),
        (0.42, 0.80, 0.50, 0.82, 0.18),
        (0.66, 0.60, 0.42, 0.66, 0.24),
        (0.90, 0.40, 0.34, 0.50, 0.28),
        (1.14, 0.18, 0.26, 0.36, 0.32),
        (1.36, 0.02, 0.20, 0.28, 0.36),
        (1.56, -0.08, 0.16, 0.22, 0.40),
    ]
    for idx, (px, pz, pw, ph, tilt) in enumerate(plate_specs):
        side = 0.11 if idx % 2 == 0 else -0.11
        build_osteoderm_plate(
            f"Stego_Plate_{idx}",
            width=pw,
            height=ph,
            thickness=0.042,
            mat=mat_plate,
            parent=plates_group,
            local_pos=(px, side, pz),
            rot=(side * 1.4, tilt, 0.0),
            shape='diamond',
        )

    # Smooth continuous low-slung neck & narrow tapering skull with beak
    neck = create_bone_node("Bone_Neck", (1.28, 0.0, -0.18), parent=torso)
    build_organic_tube(
        "Stego_Neck",
        [(-0.28, 0.0, 0.06, 0.34, 0.36), (0.35, 0.0, -0.08, 0.24, 0.26), (0.80, 0.0, -0.15, 0.17, 0.18)],
        segs_u=16,
        segs_v=14,
        mat=mat_body,
        parent=neck,
        taper_start=True,
        taper_end=True,
        subdiv=1,
    )
    head = create_bone_node("Bone_Head", (0.70, 0.0, -0.14), parent=neck)
    build_organic_tube(
        "Stego_Skull",
        [(-0.14, 0.0, 0.02, 0.17, 0.17), (0.32, 0.0, -0.02, 0.13, 0.13), (0.64, 0.0, -0.08, 0.065, 0.065)],
        segs_u=16,
        segs_v=12,
        mat=mat_body,
        parent=head,
        taper_start=True,
        subdiv=1,
    )
    for s in (-1, 1):
        build_anatomical_eye(f"Stego_Eye_{s}", 0.042, mat_iris, mat_pupil, head, (0.20, s * 0.14, 0.05))
    jaw = create_bone_node("Bone_Jaw", (0.14, 0.0, -0.11), parent=head)
    build_organic_tube("Stego_Jaw", [(0.0, 0.0, 0.0, 0.11, 0.07), (0.44, 0.0, -0.04, 0.06, 0.05)], segs_u=12, segs_v=10, mat=mat_body, parent=jaw, subdiv=1)

    # Continuous overlapping tail + 4-spike thagomizer
    t_lens = (0.68, 0.64, 0.58, 0.52)
    t_rads = (0.36, 0.25, 0.17, 0.11, 0.06)
    p_tail = torso
    for i, tlen in enumerate(t_lens):
        seg = create_bone_node(f"Bone_Tail{i}", (-1.22 if i == 0 else -t_lens[i - 1], 0.0, 0.12 if i == 0 else 0.02), parent=p_tail)
        build_organic_tube(
            f"Stego_TailSeg{i}",
            [(0.12, 0.0, 0.0, t_rads[i] * 1.05, t_rads[i] * 1.20), (-tlen - 0.06, 0.0, 0.02, t_rads[i + 1], t_rads[i + 1] * 1.15)],
            segs_u=14,
            segs_v=12,
            mat=mat_body,
            parent=seg,
            taper_start=False,
            taper_end=(i == len(t_lens) - 1),
            subdiv=1,
        )
        p_tail = seg

    thago = create_bone_node("Special_Thagomizer", (-0.42, 0.0, 0.02), parent=p_tail)
    for sp_x in (0.10, -0.14):
        for s in (-1, 1):
            build_curved_claw_or_horn(
                f"Stego_ThagoSpike_{sp_x:.2f}_{s}",
                length=0.72,
                base_r=0.075,
                curve_bend=0.08,
                direction=(-0.55, s * 0.78, 0.28),
                mat=mat_horn,
                parent=thago,
                local_pos=(sp_x, s * 0.05, 0.04),
            )

    # Note Stegosaurus contract: front legs -> Bone_Arm0..1, hind legs -> Bone_Leg0..1
    for idx, ly in enumerate((0.58, -0.58)):
        side = 1.0 if ly > 0 else -1.0
        build_quadruped_leg(
            f"Bone_Arm{idx}",
            (0.86, ly, -0.25),
            (-0.10, side * 0.04, -0.68),
            (0.06, side * 0.03, -1.22),
            (0.10, side * 0.03, -1.40),
            0.24,
            0.16,
            mat_body,
            mat_horn,
            hips,
        )
    for idx, ly in enumerate((0.64, -0.64)):
        side = 1.0 if ly > 0 else -1.0
        build_quadruped_leg(
            f"Bone_Leg{idx}",
            (-0.68, ly, -0.05),
            (0.18, side * 0.04, -0.78),
            (-0.08, side * 0.03, -1.34),
            (0.08, side * 0.03, -1.60),
            0.34,
            0.20,
            mat_body,
            mat_horn,
            hips,
        )

    out = os.path.join(OUT_DIR, "stegosaurus.glb")
    sz = export_fighter_glb(out)
    print(f"[GLB OK] stegosaurus -> {out} ({sz} bytes)")


def build_maiasaura():
    clear_scene()
    albedo, bump = tex_paths("maiasaura")
    mat_body = make_pbr_material("Mat_BodyPrimary", (0.18, 0.78, 0.56, 1), roughness=0.52, metallic=0.04, albedo_path=albedo, bump_path=bump, bump_strength=0.26)
    mat_crest = make_pbr_material("Mat_Accent", (0.94, 0.52, 0.18, 1), roughness=0.34, emissive=(0.35, 0.14, 0.02, 1), emissive_strength=0.14)
    mat_beak = make_pbr_material("Mat_Secondary", (0.10, 0.42, 0.32, 1), roughness=0.45)
    mat_iris = make_pbr_material("Mat_Eye", (0.98, 0.85, 0.25, 1), roughness=0.1, emissive=(0.55, 0.45, 0.05, 1), emissive_strength=0.35)
    mat_pupil = make_pbr_material("Mat_Pupil", (0.02, 0.02, 0.02, 1), roughness=0.1)

    root = create_bone_node("Bone_Root")
    hips = create_bone_node("Bone_Hips", (0.0, 0.0, 1.95), parent=root)
    torso = create_bone_node("Bone_Torso", (0.0, 0.0, 0.0), parent=hips)

    # Hadrosaur balanced body blended cleanly into neck & hips
    build_organic_tube(
        "Maia_Torso",
        [
            (-1.22, 0.0, 0.08, 0.24, 0.28),
            (-0.75, 0.0, 0.12, 0.42, 0.48),
            (-0.20, 0.0, 0.16, 0.52, 0.62),
            (0.45, 0.0, 0.14, 0.50, 0.58),
            (1.14, 0.0, 0.28, 0.28, 0.32),
        ],
        segs_u=22,
        segs_v=22,
        mat=mat_body,
        parent=torso,
        dorsal_keel=0.12,
        belly_flat=0.12,
        subdiv=1,
    )

    neck = create_bone_node("Bone_Neck", (0.94, 0.0, 0.22), parent=torso)
    build_organic_tube(
        "Maia_Neck",
        [(-0.24, 0.0, -0.10, 0.34, 0.38), (0.04, 0.0, 0.06, 0.28, 0.32), (0.36, 0.0, 0.34, 0.22, 0.25), (0.66, 0.0, 0.66, 0.18, 0.20)],
        segs_u=16,
        segs_v=16,
        mat=mat_body,
        parent=neck,
        taper_start=True,
        taper_end=True,
        subdiv=1,
    )

    head = create_bone_node("Bone_Head", (0.60, 0.0, 0.64), parent=neck)
    # Duck-billed hadrosaur skull + broad flared duck bill
    build_organic_tube(
        "Maia_Skull",
        [
            (-0.14, 0.0, 0.02, 0.22, 0.22),
            (0.18, 0.0, 0.04, 0.23, 0.22),
            (0.42, 0.0, 0.0, 0.21, 0.18),
            (0.72, 0.0, -0.07, 0.27, 0.10),
            (0.96, 0.0, -0.11, 0.25, 0.06),
        ],
        segs_u=18,
        segs_v=16,
        mat=mat_body,
        parent=head,
        belly_flat=0.35,
        taper_start=True,
        subdiv=1,
    )
    build_organic_tube(
        "Maia_BillRim",
        [(0.62, 0.0, -0.08, 0.27, 0.07), (0.94, 0.0, -0.11, 0.25, 0.05)],
        segs_u=16,
        segs_v=8,
        mat=mat_beak,
        parent=head,
        subdiv=1,
    )

    # Sleek elongated hadrosaurian supraorbital crest ridge (Special_SonicCrest)
    crest = create_bone_node("Special_SonicCrest", (0.26, 0.0, 0.16), parent=head)
    build_osteoderm_plate("Maia_CrestPlate", width=0.44, height=0.14, thickness=0.055, mat=mat_crest, parent=crest, local_pos=(0.0, 0.0, -0.02), rot=(0.0, -0.30, 0.0), shape='diamond')

    for s in (-1, 1):
        build_anatomical_eye(f"Maia_Eye_{s}", 0.055, mat_iris, mat_pupil, head, (0.22, s * 0.21, 0.08))

    jaw = create_bone_node("Bone_Jaw", (0.14, 0.0, -0.12), parent=head)
    build_organic_tube("Maia_Jaw", [(0.0, 0.0, 0.0, 0.18, 0.08), (0.68, 0.0, -0.03, 0.19, 0.06)], segs_u=14, segs_v=10, mat=mat_body, parent=jaw, subdiv=1)

    # Forearms (Bone_Arm0..1)
    for idx, ly in enumerate((0.48, -0.48)):
        side = 1.0 if ly > 0 else -1.0
        arm = create_bone_node(f"Bone_Arm{idx}", (0.72, ly, -0.02), parent=torso)
        build_organic_tube(
            f"Maia_Arm{idx}",
            [(0.0, 0.0, 0.0, 0.12, 0.14), (0.18, side * 0.04, -0.45, 0.09, 0.10), (0.34, side * 0.02, -0.92, 0.11, 0.07)],
            segs_u=12,
            segs_v=12,
            mat=mat_body,
            parent=arm,
            subdiv=1,
        )

    # Hind legs (Bone_Leg0..1)
    for idx, ly in enumerate((0.46, -0.46)):
        side = 1.0 if ly > 0 else -1.0
        build_quadruped_leg(
            f"Bone_Leg{idx}",
            (-0.36, ly, -0.08),
            (0.24, side * 0.03, -0.82),
            (-0.18, side * 0.02, -1.42),
            (0.08, side * 0.02, -1.87),
            0.30,
            0.16,
            mat_body,
            mat_beak,
            hips,
        )

    # Continuous overlapping laterally-compressed balancing tail (4 segments matching maiasaura.js)
    t_lens = (0.84, 0.82, 0.78, 0.72)
    t_rads = (0.36, 0.27, 0.19, 0.12, 0.05)
    p_tail = torso
    for i, tlen in enumerate(t_lens):
        seg = create_bone_node(f"Bone_Tail{i}", (-1.00 if i == 0 else -t_lens[i - 1], 0.0, 0.08 if i == 0 else 0.0), parent=p_tail)
        build_organic_tube(
            f"Maia_TailSeg{i}",
            [(0.12, 0.0, 0.0, t_rads[i] * 0.76, t_rads[i] * 1.28), (-tlen - 0.06, 0.0, 0.0, t_rads[i + 1] * 0.76, t_rads[i + 1] * 1.28)],
            segs_u=14,
            segs_v=12,
            mat=mat_body,
            parent=seg,
            taper_start=False,
            taper_end=(i == len(t_lens) - 1),
            subdiv=1,
        )
        p_tail = seg

    out = os.path.join(OUT_DIR, "maiasaura.glb")
    sz = export_fighter_glb(out)
    print(f"[GLB OK] maiasaura -> {out} ({sz} bytes)")


def build_apato():
    clear_scene()
    albedo, bump = tex_paths("apato")
    mat_body = make_pbr_material("Mat_BodyPrimary", (0.72, 0.70, 0.92, 1), roughness=0.86, metallic=0.02, albedo_path=albedo, bump_path=bump, bump_strength=0.12)
    mat_accent = make_pbr_material("Mat_Accent", (0.78, 0.42, 0.92, 1), roughness=0.38, emissive=(0.24, 0.10, 0.36, 1), emissive_strength=0.14)
    mat_claw = make_pbr_material("Mat_Secondary", (0.34, 0.30, 0.52, 1), roughness=0.45)
    mat_iris = make_pbr_material("Mat_Eye", (0.95, 0.80, 0.35, 1), roughness=0.1, emissive=(0.5, 0.4, 0.1, 1), emissive_strength=0.3)
    mat_pupil = make_pbr_material("Mat_Pupil", (0.02, 0.02, 0.02, 1), roughness=0.1)

    root = create_bone_node("Bone_Root")
    hips = create_bone_node("Bone_Hips", (0.0, 0.0, 2.10), parent=root)
    torso = create_bone_node("Bone_Torso", (0.0, 0.0, 0.0), parent=hips)

    # Massive sauropod barrel torso tapering cleanly into pelvis & base of muscular neck
    build_organic_tube(
        "Apato_Torso",
        [
            (-1.58, 0.0, 0.08, 0.42, 0.46),
            (-0.65, 0.0, 0.22, 0.86, 0.96),
            (0.35, 0.0, 0.30, 0.92, 1.04),
            (1.38, 0.0, 0.44, 0.46, 0.52),
        ],
        segs_u=24,
        segs_v=24,
        mat=mat_body,
        parent=torso,
        dorsal_keel=0.10,
        belly_flat=0.14,
        subdiv=1,
    )

    # Fluid continuous muscular sauropod neck without joint pinching (open internal ends!)
    neck = create_bone_node("Bone_Neck", (1.20, 0.0, 0.36), parent=torso)
    n_lens = (0.72, 0.70, 0.66, 0.62, 0.56)
    n_rads = (0.54, 0.42, 0.34, 0.27, 0.21, 0.16)
    p_neck = neck
    for i, nlen in enumerate(n_lens):
        n_seg = create_bone_node(f"Special_NeckSeg{i}", (0.0 if i == 0 else n_lens[i - 1] * 0.86, 0.0, 0.0 if i == 0 else n_lens[i - 1] * 0.42), parent=p_neck)
        build_organic_tube(
            f"Apato_NeckSeg{i}",
            [(-0.28 if i == 0 else -0.18, 0.0, -0.12 if i == 0 else -0.07, n_rads[i] * 0.92, n_rads[i] * 1.16), (nlen * 1.02, 0.0, nlen * 0.48, n_rads[i + 1] * 0.92, n_rads[i + 1] * 1.16)],
            segs_u=18,
            segs_v=14,
            mat=mat_body,
            parent=n_seg,
            cap_ends=True,
            taper_start=True,
            taper_end=True,
            subdiv=1,
        )
        p_neck = n_seg

    head = create_bone_node("Bone_Head", (n_lens[-1] * 0.88, 0.0, n_lens[-1] * 0.42), parent=p_neck)
    # Diplodocoid low square-muzzled skull
    build_organic_tube(
        "Apato_Skull",
        [(-0.14, 0.0, 0.0, 0.17, 0.19), (0.28, 0.0, -0.02, 0.17, 0.17), (0.58, 0.0, -0.08, 0.15, 0.11)],
        segs_u=16,
        segs_v=12,
        mat=mat_body,
        parent=head,
        taper_start=True,
        subdiv=1,
    )
    for s in (-1, 1):
        build_anatomical_eye(f"Apato_Eye_{s}", 0.044, mat_iris, mat_pupil, head, (0.18, s * 0.16, 0.08))
    jaw = create_bone_node("Bone_Jaw", (0.12, 0.0, -0.10), parent=head)
    build_organic_tube("Apato_Jaw", [(0.0, 0.0, 0.0, 0.14, 0.07), (0.44, 0.0, -0.04, 0.12, 0.05)], segs_u=12, segs_v=8, mat=mat_body, parent=jaw, subdiv=1)

    # 5-segment continuous overlapping whip tail (uncapped internal joins -> silky smooth whip curve)
    t_lens = (0.85, 0.85, 0.82, 0.78, 0.75)
    t_rads = (0.48, 0.32, 0.21, 0.13, 0.07, 0.028)
    p_tail = torso
    for i, tlen in enumerate(t_lens):
        seg = create_bone_node(f"Bone_Tail{i}", (-1.40 if i == 0 else -t_lens[i - 1], 0.0, 0.08 if i == 0 else 0.0), parent=p_tail)
        build_organic_tube(
            f"Apato_TailSeg{i}",
            [(0.18 if i == 0 else 0.08, 0.0, 0.0, t_rads[i], t_rads[i]), (-tlen - 0.06, 0.0, 0.0, t_rads[i + 1], t_rads[i + 1])],
            segs_u=14,
            segs_v=12,
            mat=mat_body,
            parent=seg,
            cap_ends=(i == 0 or i == len(t_lens) - 1),
            taper_start=(i == 0),
            taper_end=(i == len(t_lens) - 1),
            subdiv=1,
        )
        p_tail = seg

    # 4 massive columnar pillar legs tucked cleanly into ribcage/pelvis (feet on Z = -2.10)
    for idx, (lx, ly, is_front) in enumerate(((1.00, 0.62, True), (1.00, -0.62, True), (-1.00, 0.62, False), (-1.00, -0.62, False))):
        side = 1.0 if ly > 0 else -1.0
        build_quadruped_leg(
            f"Bone_Leg{idx}",
            (lx, ly, 0.05),
            (-0.04 if is_front else 0.06, side * 0.02, -0.95),
            (0.02, side * 0.02, -1.85),
            (0.08, side * 0.02, -2.10),
            0.36,
            0.26,
            mat_body,
            mat_claw,
            hips,
        )

    out = os.path.join(OUT_DIR, "apato.glb")
    sz = export_fighter_glb(out)
    print(f"[GLB OK] apato -> {out} ({sz} bytes)")


def run_all():
    build_ankylo()
    build_stegosaurus()
    build_maiasaura()
    build_apato()


if __name__ == "__main__":
    run_all()
