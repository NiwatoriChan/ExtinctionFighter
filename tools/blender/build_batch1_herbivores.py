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
    from ankylo_sculptor import build_ankylo_high_definition
    return build_ankylo_high_definition()


def build_stegosaurus():
    from stegosaurus_sculptor import build_stegosaurus_high_definition
    return build_stegosaurus_high_definition()


def build_maiasaura():
    clear_scene()
    albedo, bump = tex_paths("maiasaura")
    mat_body = make_pbr_material("Mat_BodyPrimary", (0.16, 0.18, 0.11, 1), roughness=0.74, metallic=0.02, albedo_path=albedo, bump_path=bump, bump_strength=0.26)
    mat_crest = make_pbr_material("Mat_Accent", (0.36, 0.18, 0.07, 1), roughness=0.54, metallic=0.02)
    mat_beak = make_pbr_material("Mat_Secondary", (0.10, 0.11, 0.07, 1), roughness=0.68, metallic=0.02)
    mat_iris = make_pbr_material("Mat_Eye", (0.62, 0.42, 0.10, 1), roughness=0.12, emissive=(0.35, 0.22, 0.03, 1), emissive_strength=0.15)
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
    from apato_sculptor import build_apato_high_definition
    return build_apato_high_definition()


def run_all():
    build_ankylo()
    build_stegosaurus()
    build_maiasaura()
    build_apato()


if __name__ == "__main__":
    run_all()
