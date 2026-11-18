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
    clear_scene()
    albedo, bump = tex_paths("apato")
    mat_body = make_pbr_material("Mat_BodyPrimary", (0.14, 0.13, 0.12, 1), roughness=0.84, metallic=0.0, albedo_path=albedo, bump_path=bump, bump_strength=0.16)
    mat_accent = make_pbr_material("Mat_Accent", (0.20, 0.18, 0.15, 1), roughness=0.70, metallic=0.0)
    mat_claw = make_pbr_material("Mat_Secondary", (0.12, 0.10, 0.09, 1), roughness=0.48, metallic=0.02)
    mat_iris = make_pbr_material("Mat_Eye", (0.58, 0.40, 0.12, 1), roughness=0.12, emissive=(0.30, 0.20, 0.04, 1), emissive_strength=0.12)
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
