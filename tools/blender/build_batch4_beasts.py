"""
Batch 4 Blender Procedural Overhaul: Pleistocene Beasts & Boss Dragon
Species:
  - smilodon: Smilodon fatalis (Siberian/Pleistocene Saber-Toothed Cat)
  - giantsloth: Megatherium americanum (Giant Ground Sloth w/ sickle claws & tripod tail)
  - dragon: Drak'Zul (Dracorex skull + Varanus Komodo body + bat patagium wings + magma veins)

All geometry is built in Blender right-handed Z-up coordinates (+X forward, +Z up, +/-Y sides).
glTF export (export_yup=True) maps Blender (X, Y, Z) -> Three.js (X, Z, -Y).
"""

import os
import sys
import math
import bpy
import bmesh
from mathutils import Vector

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from blender_rig_utils import (
    clear_scene,
    make_pbr_material,
    create_bone_node,
    build_organic_tube,
    build_curved_claw_or_horn,
    build_osteoderm_plate,
    build_anatomical_eye,
    export_fighter_glb,
    TEX_DIR,
    OUT_DIR,
)


def _tex(fid, kind):
    p = os.path.join(TEX_DIR, f"{fid}_{kind}.png")
    return p if os.path.exists(p) else None


def _build_wing_membrane(name, pts_list, mat, parent, thickness=0.022):
    """Creates a thin curved double-sided patagium wing membrane between 3D local points."""
    bm = bmesh.new()
    verts = [bm.verts.new(Vector(p)) for p in pts_list]
    if len(verts) == 3:
        bm.faces.new(verts)
    elif len(verts) >= 4:
        # Fan / quad triangulation for clean manifold export
        for i in range(1, len(verts) - 1):
            bm.faces.new([verts[0], verts[i], verts[i + 1]])

    bmesh.ops.subdivide_edges(bm, edges=list(bm.edges), cuts=2, use_grid_fill=True)
    bm.normal_update()

    mesh = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    if mat:
        obj.data.materials.append(mat)
    sol = obj.modifiers.new(name="MembraneThickness", type="SOLIDIFY")
    sol.thickness = thickness
    sol.offset = 0.0
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj


# ==============================================================================
# 1. SMILODON (Smilodon fatalis)
# ==============================================================================
def build_smilodon():
    clear_scene()
    fid = "smilodon"
    skin_mat = make_pbr_material(
        "Mat_BodyPrimary", base_color=(0.46, 0.28, 0.12, 1.0), roughness=0.74, metallic=0.01,
        albedo_path=_tex(fid, "albedo"), bump_path=_tex(fid, "bump"), bump_strength=0.24
    )
    belly_mat = make_pbr_material("Mat_Secondary", base_color=(0.62, 0.52, 0.38, 1.0), roughness=0.78, metallic=0.01)
    dark_fur_mat = make_pbr_material("SmilodonDarkFurMat", base_color=(0.07, 0.04, 0.02, 1.0), roughness=0.82, metallic=0.01)
    saber_mat = make_pbr_material("Mat_Accent", base_color=(0.78, 0.72, 0.58, 1.0), roughness=0.22, metallic=0.02)
    nose_mat = make_pbr_material("SmilodonNoseMat", base_color=(0.14, 0.06, 0.05, 1.0), roughness=0.42, metallic=0.02)
    iris_mat = make_pbr_material("Mat_Eye", base_color=(0.70, 0.42, 0.08, 1.0), roughness=0.14, emissive=(0.55, 0.28, 0.04), emissive_strength=0.12)
    pupil_mat = make_pbr_material("Mat_Pupil", base_color=(0.02, 0.02, 0.02, 1.0), roughness=0.10)

    # Smilodon animBaseHipsY = 1.55
    hips = create_bone_node("Bone_Hips", (0.0, 0.0, 1.55))
    torso = create_bone_node("Bone_Torso", (0.0, 0.0, 0.0), hips)

    # Massive muscular scapular hump sloping into compact hindquarters (Smilodon hallmark)
    build_organic_tube("Smilodon_Torso", [
        (-1.12, 0.0, -0.02, 0.24, 0.28),
        (-0.62, 0.0, 0.04, 0.43, 0.46),
        (0.05, 0.0, 0.14, 0.50, 0.56),
        (0.66, 0.0, 0.26, 0.57, 0.68),
        (1.16, 0.0, 0.34, 0.30, 0.36),
    ], segs_u=26, segs_v=24, mat=skin_mat, parent=torso, dorsal_keel=0.06, belly_flat=0.05, taper_start=True, taper_end=True, subdiv=1)

    # Cream chest ruff / throat mane blended deep into sternum
    build_organic_tube("Smilodon_ChestRuff", [
        (0.56, 0.0, -0.18, 0.30, 0.24),
        (0.92, 0.0, 0.06, 0.32, 0.28),
        (1.16, 0.0, 0.28, 0.22, 0.20),
    ], segs_u=14, segs_v=18, mat=belly_mat, parent=torso, subdiv=1)

    # Muscular thick feline neck (seamless overlap collar)
    neck = create_bone_node("Bone_Neck", (0.98, 0.0, 0.34), torso)
    build_organic_tube("Smilodon_Neck", [
        (-0.26, 0.0, -0.12, 0.38, 0.42),
        (0.14, 0.0, 0.10, 0.33, 0.36),
        (0.50, 0.0, 0.26, 0.26, 0.29),
    ], segs_u=16, segs_v=20, mat=skin_mat, parent=neck, dorsal_keel=0.04, taper_start=True, taper_end=True, subdiv=1)

    # Broad machairodont skull with heavy zygomatic cheekbones and short truncated muzzle
    head = create_bone_node("Bone_Head", (0.42, 0.0, 0.24), neck)
    build_organic_tube("Smilodon_Skull", [
        (-0.24, 0.0, 0.0, 0.25, 0.26),
        (0.12, 0.0, 0.09, 0.37, 0.35),
        (0.38, 0.0, 0.02, 0.26, 0.25),
        (0.64, 0.0, -0.05, 0.21, 0.19),
        (0.76, 0.0, -0.07, 0.13, 0.11),
    ], segs_u=18, segs_v=20, mat=skin_mat, parent=head, belly_flat=0.06, taper_start=True, subdiv=1)

    # Upper lip flews & dark rhinarium nose pad
    build_organic_tube("Smilodon_NosePad", [
        (0.68, 0.0, -0.02, 0.08, 0.07),
        (0.77, 0.0, -0.04, 0.06, 0.05),
    ], segs_u=8, segs_v=12, mat=nose_mat, parent=head, subdiv=0)

    # Rounded low-set feline ears + forward-facing predator eyes + backward-swept scimitar saber canines
    for side in (-1, 1):
        build_organic_tube(f"Smilodon_Ear_{side}", [
            (-0.02, side * 0.24, 0.22, 0.055, 0.11),
            (-0.08, side * 0.29, 0.36, 0.032, 0.075),
        ], segs_u=8, segs_v=12, mat=dark_fur_mat, parent=head, subdiv=0)
        build_anatomical_eye(f"Smilodon_Eye_{side}", 0.056, iris_mat, pupil_mat, head, (0.34, -side * 0.23, 0.12))

        # Signature laterally-flattened backward-curving scimitar saber canines
        saber_obj = build_curved_claw_or_horn(
            f"Smilodon_Saber_{side}", length=0.72, base_r=0.058, curve_bend=0.22,
            direction=(0.14, 0.0, -1.0), mat=saber_mat, parent=head,
            local_pos=(0.56, side * 0.16, -0.07), segs_u=14, segs_v=12
        )
        saber_obj.scale = (1.35, 0.40, 1.0)

    # Articulated lower jaw (jaw.rotation.z < 0 opens mouth up to 120 degrees!)
    jaw = create_bone_node("Bone_Jaw", (0.14, 0.0, -0.14), head)
    build_organic_tube("Smilodon_Mandible", [
        (-0.04, 0.0, 0.0, 0.17, 0.12),
        (0.24, 0.0, -0.03, 0.16, 0.11),
        (0.48, 0.0, -0.04, 0.13, 0.08),
    ], segs_u=12, segs_v=16, mat=belly_mat, parent=jaw, belly_flat=0.08, subdiv=1)
    for side in (-1, 1):
        # Mandibular flanges + lower canines
        build_curved_claw_or_horn(
            f"Smilodon_LowerCanine_{side}", length=0.11, base_r=0.024, curve_bend=0.02,
            direction=(0.15, 0.0, 1.0), mat=saber_mat, parent=jaw,
            local_pos=(0.40, side * 0.11, 0.03), segs_u=8, segs_v=8
        )

    # 3-segment short bobcat-like muscular tail
    t_parent = torso
    for s in range(3):
        tbone = create_bone_node(
            f"Bone_Tail{s}",
            (-1.02, 0.0, 0.08) if s == 0 else (-0.28, 0.0, -0.03),
            t_parent
        )
        r0 = 0.16 - s * 0.03
        r1 = max(0.05, r0 - 0.035)
        build_organic_tube(f"Smilodon_TailSeg{s}", [
            (0.02, 0.0, 0.0, r0, r0),
            (-0.15, 0.0, -0.02, (r0 + r1) * 0.5, (r0 + r1) * 0.5),
            (-0.30, 0.0, -0.04, r1, r1),
        ], segs_u=8, segs_v=12, mat=dark_fur_mat if s == 2 else skin_mat, parent=tbone, subdiv=0)
        t_parent = tbone

    # 4 heavy feline legs (exact order: FL, FR, RL, RR -> legs[0..3]; feet at Z = -1.55 relative to hips)
    leg_specs = [
        (0.68, 0.44, True),   # BL y = +0.44 -> Three.js z = -0.44 (Front Left)
        (0.68, -0.44, True),  # BL y = -0.44 -> Three.js z = +0.44 (Front Right)
        (-0.68, 0.42, False), # Rear Left
        (-0.68, -0.42, False) # Rear Right
    ]
    for idx, (lx, ly, is_front) in enumerate(leg_specs):
        lbone = create_bone_node(f"Bone_Leg{idx}", (lx, ly, 0.02), hips)
        if is_front:
            build_organic_tube(f"Smilodon_LegMesh{idx}", [
                (0.0, 0.0, 0.14, 0.30, 0.38),
                (-0.08, 0.0, -0.52, 0.22, 0.24),
                (0.02, 0.0, -1.06, 0.16, 0.17),
                (0.10, 0.0, -1.44, 0.15, 0.14),
            ], segs_u=16, segs_v=16, mat=skin_mat, parent=lbone, subdiv=1)
        else:
            build_organic_tube(f"Smilodon_LegMesh{idx}", [
                (0.0, 0.0, 0.08, 0.28, 0.36),
                (0.16, 0.0, -0.58, 0.20, 0.22),
                (-0.12, 0.0, -1.10, 0.14, 0.15),
                (0.10, 0.0, -1.44, 0.14, 0.13),
            ], segs_u=16, segs_v=16, mat=skin_mat, parent=lbone, subdiv=1)
        # Broad padded feline paw touching floor Z = -1.55
        build_organic_tube(f"Smilodon_Paw{idx}", [
            (-0.04, 0.0, -1.49, 0.16, 0.09),
            (0.24, 0.0, -1.51, 0.16, 0.075),
        ], segs_u=10, segs_v=14, mat=skin_mat, parent=lbone, belly_flat=0.22, subdiv=1)
        for dy in (-0.09, -0.03, 0.03, 0.09):
            build_curved_claw_or_horn(
                f"Smilodon_Claw_{idx}_{dy:.2f}", length=0.14, base_r=0.024, curve_bend=-0.03,
                direction=(1.0, 0.0, -0.20), mat=saber_mat, parent=lbone,
                local_pos=(0.30, dy, -1.50), segs_u=6, segs_v=8
            )

    return export_fighter_glb(os.path.join(OUT_DIR, f"{fid}.glb"))


# ==============================================================================
# 2. GIANT SLOTH (Megatherium americanum)
# ==============================================================================
def build_giantsloth():
    clear_scene()
    fid = "giantsloth"
    fur_mat = make_pbr_material(
        "Mat_BodyPrimary", base_color=(0.20, 0.12, 0.07, 1.0), roughness=0.84, metallic=0.0,
        albedo_path=_tex(fid, "albedo"), bump_path=_tex(fid, "bump"), bump_strength=0.30
    )
    light_fur_mat = make_pbr_material("Mat_Secondary", base_color=(0.32, 0.22, 0.14, 1.0), roughness=0.82, metallic=0.0)
    dark_fur_mat = make_pbr_material("SlothDarkFurMat", base_color=(0.06, 0.04, 0.02, 1.0), roughness=0.86, metallic=0.0)
    snout_mat = make_pbr_material("SlothSnoutMat", base_color=(0.12, 0.09, 0.07, 1.0), roughness=0.56, metallic=0.01)
    claw_mat = make_pbr_material("Mat_Accent", base_color=(0.62, 0.55, 0.40, 1.0), roughness=0.34, metallic=0.02)
    iris_mat = make_pbr_material("Mat_Eye", base_color=(0.60, 0.36, 0.10, 1.0), roughness=0.18, emissive=(0.35, 0.18, 0.04), emissive_strength=0.10)
    pupil_mat = make_pbr_material("Mat_Pupil", base_color=(0.02, 0.02, 0.02, 1.0), roughness=0.12)

    # Megatherium animBaseHipsY = 1.85
    hips = create_bone_node("Bone_Hips", (0.0, 0.0, 1.85))
    torso = create_bone_node("Bone_Torso", (0.0, 0.0, 0.0), hips)

    # Enormous pear-shaped pelvic basin tapering smoothly into broad semi-bipedal torso & shoulder
    build_organic_tube("Sloth_Torso", [
        (-1.18, 0.0, -0.22, 0.56, 0.50),
        (-0.56, 0.0, -0.06, 0.92, 0.94),
        (0.18, 0.0, 0.26, 0.80, 0.86),
        (0.76, 0.0, 0.56, 0.65, 0.66),
        (1.16, 0.0, 0.86, 0.30, 0.30),
    ], segs_u=26, segs_v=24, mat=fur_mat, parent=torso, belly_flat=0.04, taper_start=True, taper_end=True, subdiv=1)

    # Shaggy furry shoulder cape
    build_organic_tube("Sloth_ShoulderCape", [
        (0.08, 0.0, 0.56, 0.62, 0.36),
        (0.68, 0.0, 0.74, 0.56, 0.36),
        (1.04, 0.0, 0.84, 0.40, 0.28),
    ], segs_u=16, segs_v=18, mat=fur_mat, parent=torso, dorsal_keel=0.06, subdiv=1)

    # Short thick sloth neck blended deep into thorax
    neck = create_bone_node("Bone_Neck", (0.98, 0.0, 0.84), torso)
    build_organic_tube("Sloth_Neck", [
        (-0.26, 0.0, -0.16, 0.42, 0.40),
        (0.24, 0.0, 0.14, 0.34, 0.34),
        (0.54, 0.0, 0.34, 0.27, 0.27),
    ], segs_u=14, segs_v=18, mat=fur_mat, parent=neck, taper_start=True, taper_end=True, subdiv=1)

    # Boxy domed shaggy sloth skull blended cleanly from neck
    head = create_bone_node("Bone_Head", (0.48, 0.0, 0.32), neck)
    build_organic_tube("Sloth_Skull", [
        (-0.22, 0.0, 0.02, 0.28, 0.29),
        (0.22, 0.0, 0.10, 0.34, 0.34),
        (0.54, 0.0, 0.04, 0.26, 0.25),
        (0.78, 0.0, -0.02, 0.20, 0.18),
    ], segs_u=16, segs_v=20, mat=fur_mat, parent=head, belly_flat=0.05, taper_start=True, subdiv=1)

    # Blunt leathery snout pad
    build_organic_tube("Sloth_SnoutPad", [
        (0.70, 0.0, -0.01, 0.18, 0.16),
        (0.86, 0.0, -0.03, 0.13, 0.12),
    ], segs_u=8, segs_v=14, mat=snout_mat, parent=head, subdiv=0)

    for side in (-1, 1):
        # Dark fur eye mask & small rounded ears
        build_organic_tube(f"Sloth_Ear_{side}", [
            (0.06, side * 0.32, 0.22, 0.06, 0.09),
            (0.04, side * 0.37, 0.30, 0.04, 0.06),
        ], segs_u=6, segs_v=10, mat=dark_fur_mat, parent=head, subdiv=0)
        build_organic_tube(f"Sloth_EyeMask_{side}", [
            (0.30, -side * 0.22, 0.12, 0.10, 0.09),
            (0.50, -side * 0.21, 0.11, 0.08, 0.08),
        ], segs_u=8, segs_v=8, mat=dark_fur_mat, parent=head, subdiv=0)
        build_anatomical_eye(f"Sloth_Eye_{side}", 0.050, iris_mat, pupil_mat, head, (0.42, -side * 0.28, 0.12))

    # Articulated mandible
    jaw = create_bone_node("Bone_Jaw", (0.20, 0.0, -0.15), head)
    build_organic_tube("Sloth_Mandible", [
        (-0.02, 0.0, 0.0, 0.20, 0.13),
        (0.32, 0.0, -0.02, 0.19, 0.13),
        (0.56, 0.0, -0.01, 0.14, 0.10),
    ], segs_u=10, segs_v=14, mat=dark_fur_mat, parent=jaw, belly_flat=0.08, subdiv=1)

    # 2 Herculean arms with 3 huge sickle ivory claws (Bone_Arm0..1)
    for idx, side in enumerate((-1, 1)):
        arm = create_bone_node(f"Bone_Arm{idx}", (0.70, side * 0.70, 0.56), torso)
        build_organic_tube(f"Sloth_ArmMesh{idx}", [
            (0.0, 0.0, 0.08, 0.30, 0.34),
            (0.20, side * 0.08, -0.64, 0.26, 0.26),
            (0.68, side * 0.04, -1.20, 0.21, 0.20),
            (0.84, side * 0.04, -1.24, 0.18, 0.16),
        ], segs_u=18, segs_v=16, mat=fur_mat, parent=arm, subdiv=1)
        # Hanging shaggy fur fringe along forearm
        build_organic_tube(f"Sloth_ArmFringe{idx}", [
            (0.18, side * 0.08, -0.72, 0.20, 0.14),
            (0.64, side * 0.04, -1.22, 0.15, 0.12),
        ], segs_u=10, segs_v=12, mat=light_fur_mat, parent=arm, subdiv=0)
        # 3 immense recurved digging/slashing sickle claws
        for c_idx, dy in enumerate((-0.12, 0.0, 0.12)):
            c_len = 0.54 if c_idx == 1 else 0.45
            build_curved_claw_or_horn(
                f"Sloth_ArmClaw_{idx}_{c_idx}", length=c_len, base_r=0.055, curve_bend=-0.16,
                direction=(0.75, 0.0, -0.80), mat=claw_mat, parent=arm,
                local_pos=(0.86, side * 0.04 + dy, -1.24), segs_u=12, segs_v=10
            )

    # Heavy 3-segment tripod tail (anchors Megatherium upright!)
    t_parent = torso
    t_lens = [0.65, 0.60, 0.58]
    t_rads = [0.52, 0.38, 0.25, 0.10]
    for s in range(3):
        tbone = create_bone_node(
            f"Bone_Tail{s}",
            (-1.06, 0.0, -0.14) if s == 0 else (-t_lens[s - 1], 0.0, -0.15),
            t_parent
        )
        l = t_lens[s]
        r0, r1 = t_rads[s], t_rads[s + 1]
        build_organic_tube(f"Sloth_TailSeg{s}", [
            (0.04, 0.0, 0.02, r0, r0),
            (-l * 0.5, 0.0, -0.07, (r0 + r1) * 0.52, (r0 + r1) * 0.52),
            (-l, 0.0, -0.15, r1, r1),
        ], segs_u=10, segs_v=14, mat=dark_fur_mat if s == 2 else fur_mat, parent=tbone, subdiv=1)
        t_parent = tbone

    # 2 Columnar pedolateral hind legs (Bone_Leg0..1, soles at Z = -1.85)
    for idx, side in enumerate((-1, 1)):
        leg = create_bone_node(f"Bone_Leg{idx}", (-0.32, side * 0.60, 0.0), hips)
        build_organic_tube(f"Sloth_LegMesh{idx}", [
            (0.0, 0.0, 0.14, 0.42, 0.50),
            (0.18, side * 0.04, -0.84, 0.30, 0.32),
            (0.08, side * 0.04, -1.70, 0.24, 0.25),
        ], segs_u=16, segs_v=18, mat=fur_mat, parent=leg, subdiv=1)
        # Wide flat plantigrade foot touching Z = -1.85
        build_organic_tube(f"Sloth_Foot{idx}", [
            (-0.10, side * 0.04, -1.75, 0.25, 0.14),
            (0.46, side * 0.04, -1.77, 0.25, 0.12),
        ], segs_u=10, segs_v=14, mat=dark_fur_mat, parent=leg, belly_flat=0.22, subdiv=0)
        for dy in (-0.10, 0.0, 0.10):
            build_curved_claw_or_horn(
                f"Sloth_FootClaw_{idx}_{dy:.2f}", length=0.26, base_r=0.045, curve_bend=-0.04,
                direction=(1.0, 0.0, -0.25), mat=claw_mat, parent=leg,
                local_pos=(0.48, side * 0.04 + dy, -1.76), segs_u=8, segs_v=8
            )

    return export_fighter_glb(os.path.join(OUT_DIR, f"{fid}.glb"))


# ==============================================================================
# 3. DRAGON (Drak'Zul — Dracorex + Varanus + Magma Patagium)
# ==============================================================================
def build_dragon():
    clear_scene()
    fid = "dragon"
    obsidian_mat = make_pbr_material(
        "Mat_BodyPrimary", base_color=(0.82, 0.78, 0.86, 1.0), roughness=0.64, metallic=0.08,
        albedo_path=_tex(fid, "albedo"), bump_path=_tex(fid, "bump"), bump_strength=0.22
    )
    horn_mat = make_pbr_material("Mat_Secondary", base_color=(0.36, 0.30, 0.32, 1.0), roughness=0.44, metallic=0.14)
    magma_mat = make_pbr_material(
        "Mat_Accent", base_color=(0.98, 0.26, 0.04, 1.0), roughness=0.28, metallic=0.05,
        emissive=(1.0, 0.28, 0.02), emissive_strength=1.40
    )
    wing_mat = make_pbr_material("DragonWingMat", base_color=(0.56, 0.10, 0.06, 1.0), roughness=0.42, metallic=0.06, emissive=(0.58, 0.10, 0.02), emissive_strength=0.28)
    fang_mat = make_pbr_material("DragonFangMat", base_color=(0.94, 0.88, 0.78, 1.0), roughness=0.20, metallic=0.05)
    iris_mat = make_pbr_material("Mat_Eye", base_color=(1.0, 0.42, 0.02, 1.0), roughness=0.12, emissive=(1.0, 0.45, 0.04), emissive_strength=1.2)
    pupil_mat = make_pbr_material("Mat_Pupil", base_color=(0.01, 0.01, 0.01, 1.0), roughness=0.10)

    # Drak'Zul animBaseHipsY = 2.10
    hips = create_bone_node("Bone_Hips", (0.0, 0.0, 2.10))
    torso = create_bone_node("Bone_Torso", (0.0, 0.0, 0.0), hips)

    # Armored volcanic Varanus-draconic torso flowing seamlessly into pelvis & neck
    build_organic_tube("Dragon_Torso", [
        (-1.32, 0.0, 0.08, 0.34, 0.36),
        (-0.56, 0.0, 0.16, 0.62, 0.68),
        (0.12, 0.0, 0.26, 0.68, 0.78),
        (0.78, 0.0, 0.36, 0.72, 0.74),
        (1.30, 0.0, 0.56, 0.34, 0.34),
    ], segs_u=26, segs_v=24, mat=obsidian_mat, parent=torso, dorsal_keel=0.09, belly_flat=0.06, taper_start=True, taper_end=True, subdiv=1)

    # Segmented incandescent magma sternum/belly plates
    for v in range(6):
        vx = -0.58 + v * 0.28
        vz = -0.24 + v * 0.06
        w = 0.46 - abs(v - 2.5) * 0.04
        build_organic_tube(f"Dragon_MagmaPlastron_{v}", [
            (vx - 0.11, 0.0, vz - 0.02, w, 0.12),
            (vx + 0.11, 0.0, vz + 0.02, w * 0.96, 0.12),
        ], segs_u=6, segs_v=12, mat=magma_mat, parent=torso, belly_flat=0.15, subdiv=0)

    # Sharp backward-swept basalt dorsal spine spikes (anchored firmly into dorsal ridge)
    for i in range(8):
        sx = -1.04 + i * 0.29
        sz = 0.64 + math.sin(i * 0.4) * 0.14
        build_curved_claw_or_horn(
            f"Dragon_DorsalSpine_{i}", length=0.42, base_r=0.068, curve_bend=0.16,
            direction=(-0.52, 0.0, 0.86), mat=horn_mat, parent=torso,
            local_pos=(sx, 0.0, sz), segs_u=8, segs_v=8
        )

    # Huge Bat-Patagium Wings: Special_LeftWing & Special_RightWing (exact pivots from dragon.js)
    # In dragon.js: leftWing side = +1 (Three.js z = +0.54 -> Blender y = -0.54); rightWing side = -1 (Three.js z = -0.54 -> Blender y = +0.54)
    for wing_name, side_tj in (("Special_LeftWing", 1), ("Special_RightWing", -1)):
        # Blender y = -side_tj * ...
        sy = -side_tj * 0.54
        wing = create_bone_node(wing_name, (0.46, sy, 0.60), torso)

        # Wing bone coordinates matching dragon.js mapped to Blender (x, -z_tj, y_tj)
        S = (0.0, 0.0, 0.0)
        E = (-0.30, -side_tj * 0.46, 0.58)
        W = (0.68, -side_tj * 0.70, 1.52)

        build_organic_tube(f"{wing_name}_Arm", [
            (*S, 0.16, 0.16),
            (*E, 0.13, 0.13),
            (*W, 0.10, 0.10),
        ], segs_u=14, segs_v=12, mat=horn_mat, parent=wing, subdiv=1)

        # Wrist alula thumb claw
        build_curved_claw_or_horn(
            f"{wing_name}_Alula", length=0.34, base_r=0.045, curve_bend=-0.10,
            direction=(0.90, 0.0, -0.45), mat=horn_mat, parent=wing, local_pos=W, segs_u=8, segs_v=8
        )

        # 4 elongated phalanges fanning out
        F1 = (-1.50, -side_tj * 0.98, 0.94)
        F2 = (-1.68, -side_tj * 0.90, 0.14)
        F3 = (-1.32, -side_tj * 0.74, -0.60)
        F4 = (-0.75, -side_tj * 0.50, -0.84)
        Flank = (-0.98, 0.0, -0.44)

        for fi, ftip in enumerate((F1, F2, F3, F4)):
            build_organic_tube(f"{wing_name}_Finger{fi}", [
                (*W, 0.055, 0.055),
                ((W[0] + ftip[0]) * 0.5, (W[1] + ftip[1]) * 0.5, (W[2] + ftip[2]) * 0.5, 0.036, 0.036),
                (*ftip, 0.015, 0.015),
            ], segs_u=8, segs_v=8, mat=horn_mat, parent=wing, subdiv=0)

        # Wing patagium membranes
        _build_wing_membrane(f"{wing_name}_Membrane1", [W, F1, F2], wing_mat, wing)
        _build_wing_membrane(f"{wing_name}_Membrane2", [W, F2, F3], wing_mat, wing)
        _build_wing_membrane(f"{wing_name}_Membrane3", [W, F3, F4, E], wing_mat, wing)
        _build_wing_membrane(f"{wing_name}_Membrane4", [E, F4, Flank, S], wing_mat, wing)
        _build_wing_membrane(f"{wing_name}_Propatagium", [S, W, E], wing_mat, wing)

    # Powerful S-curved draconic neck with magma throat glow + cervical spikes (blended smoothly)
    neck = create_bone_node("Bone_Neck", (1.06, 0.0, 0.56), torso)
    build_organic_tube("Dragon_Neck", [
        (-0.26, 0.0, -0.18, 0.46, 0.48),
        (0.28, 0.0, 0.34, 0.35, 0.37),
        (0.62, 0.0, 0.82, 0.27, 0.30),
    ], segs_u=16, segs_v=20, mat=obsidian_mat, parent=neck, dorsal_keel=0.06, taper_start=True, taper_end=True, subdiv=1)

    for k in range(4):
        t = k / 3.0
        build_organic_tube(f"Dragon_ThroatMagma_{k}", [
            (0.08 + t * 0.42, 0.0, 0.02 + t * 0.56, 0.22 - t * 0.04, 0.14),
            (0.18 + t * 0.42, 0.0, 0.14 + t * 0.56, 0.20 - t * 0.04, 0.12),
        ], segs_u=6, segs_v=10, mat=magma_mat, parent=neck, subdiv=0)
        build_osteoderm_plate(
            f"Dragon_NeckSpike_{k}", width=0.11, height=0.28, thickness=0.06,
            mat=horn_mat, parent=neck, local_pos=(t * 0.44, 0.0, 0.30 + t * 0.62), rot=(0.0, -0.45, 0.0), shape="diamond"
        )

    # Dracorex-inspired horned draconic skull
    head = create_bone_node("Bone_Head", (0.58, 0.0, 0.80), neck)
    build_organic_tube("Dragon_Skull", [
        (-0.22, 0.0, 0.0, 0.28, 0.28),
        (0.22, 0.0, 0.08, 0.34, 0.30),
        (0.64, 0.0, 0.04, 0.25, 0.23),
        (1.02, 0.0, 0.01, 0.18, 0.17),
        (1.16, 0.0, -0.02, 0.10, 0.10),
    ], segs_u=20, segs_v=20, mat=obsidian_mat, parent=head, dorsal_keel=0.08, belly_flat=0.08, taper_start=True, subdiv=1)

    for side in (-1, 1):
        # Swept occipital crown horns + temporal jugal horns (Dracorex crown)
        build_curved_claw_or_horn(
            f"Dragon_MainHorn_{side}", length=1.08, base_r=0.095, curve_bend=0.14,
            direction=(-0.92, side * 0.18, 0.34), mat=horn_mat, parent=head,
            local_pos=(0.02, side * 0.20, 0.24), segs_u=14, segs_v=12
        )
        build_curved_claw_or_horn(
            f"Dragon_JugalHorn_{side}", length=0.58, base_r=0.062, curve_bend=0.08,
            direction=(-0.88, side * 0.32, 0.16), mat=horn_mat, parent=head,
            local_pos=(0.08, side * 0.27, 0.12), segs_u=10, segs_v=10
        )
        # Nasal ridge hornlets
        build_curved_claw_or_horn(
            f"Dragon_NasalSpike_{side}", length=0.22, base_r=0.036, curve_bend=-0.04,
            direction=(-0.35, side * 0.20, 0.90), mat=horn_mat, parent=head,
            local_pos=(0.76, side * 0.12, 0.14), segs_u=8, segs_v=8
        )
        build_anatomical_eye(f"Dragon_Eye_{side}", 0.060, iris_mat, pupil_mat, head, (0.37, -side * 0.26, 0.10))

        for t_idx in range(6):
            tx = 0.34 + t_idx * 0.13
            build_curved_claw_or_horn(
                f"Dragon_UpperFang_{side}_{t_idx}", length=0.14, base_r=0.024, curve_bend=-0.02,
                direction=(0.15, 0.0, -1.0), mat=fang_mat, parent=head,
                local_pos=(tx, side * (0.19 - t_idx * 0.01), -0.07), segs_u=6, segs_v=8
            )

    # Articulated lower jaw with glowing magma gullet & fangs
    jaw = create_bone_node("Bone_Jaw", (0.12, 0.0, -0.12), head)
    build_organic_tube("Dragon_Mandible", [
        (-0.02, 0.0, 0.0, 0.20, 0.15),
        (0.42, 0.0, -0.02, 0.18, 0.13),
        (0.86, 0.0, -0.02, 0.13, 0.10),
    ], segs_u=14, segs_v=16, mat=horn_mat, parent=jaw, belly_flat=0.10, subdiv=1)
    build_organic_tube("Dragon_MouthMagma", [
        (0.14, 0.0, 0.04, 0.13, 0.05),
        (0.68, 0.0, 0.02, 0.10, 0.04),
    ], segs_u=8, segs_v=10, mat=magma_mat, parent=jaw, subdiv=0)
    for t_idx in range(5):
        tx = 0.28 + t_idx * 0.13
        for side in (-1, 1):
            build_curved_claw_or_horn(
                f"Dragon_LowerFang_{side}_{t_idx}", length=0.11, base_r=0.020, curve_bend=0.02,
                direction=(0.12, 0.0, 1.0), mat=fang_mat, parent=jaw,
                local_pos=(tx, side * 0.14, 0.04), segs_u=6, segs_v=8
            )

    # Forelimbs (Bone_Arm0..1) and Digitigrade Hindlimbs (Bone_Leg0..1) reaching Z = -2.10
    for idx, side in enumerate((-1, 1)):
        # Front arm on torso
        arm = create_bone_node(f"Bone_Arm{idx}", (0.80, side * 0.56, 0.02), torso)
        build_organic_tube(f"Dragon_ArmMesh{idx}", [
            (0.0, 0.0, 0.08, 0.28, 0.30),
            (-0.14, side * 0.06, -0.80, 0.19, 0.19),
            (0.18, side * 0.04, -1.70, 0.14, 0.14),
            (0.28, side * 0.04, -1.96, 0.14, 0.11),
        ], segs_u=16, segs_v=16, mat=obsidian_mat, parent=arm, subdiv=1)
        for dy in (-0.10, 0.0, 0.10):
            build_curved_claw_or_horn(
                f"Dragon_ArmClaw_{idx}_{dy:.2f}", length=0.34, base_r=0.042, curve_bend=-0.06,
                direction=(0.85, 0.0, -0.45), mat=horn_mat, parent=arm,
                local_pos=(0.24, side * 0.04 + dy, -1.96), segs_u=8, segs_v=8
            )

        # Rear leg on hips (touches ground Z = -2.10)
        leg = create_bone_node(f"Bone_Leg{idx}", (-0.35, side * 0.58, 0.04), hips)
        build_organic_tube(f"Dragon_LegMesh{idx}", [
            (0.0, 0.0, 0.12, 0.36, 0.44),
            (0.25, side * 0.04, -0.80, 0.23, 0.24),
            (-0.22, side * 0.04, -1.54, 0.15, 0.16),
            (0.14, side * 0.04, -2.04, 0.14, 0.13),
        ], segs_u=18, segs_v=16, mat=obsidian_mat, parent=leg, subdiv=1)
        build_organic_tube(f"Dragon_Foot{idx}", [
            (0.04, side * 0.04, -2.06, 0.16, 0.08),
            (0.46, side * 0.04, -2.08, 0.15, 0.06),
        ], segs_u=8, segs_v=12, mat=horn_mat, parent=leg, belly_flat=0.22, subdiv=0)
        for dy in (-0.11, 0.0, 0.11):
            build_curved_claw_or_horn(
                f"Dragon_FootClaw_{idx}_{dy:.2f}", length=0.28, base_r=0.044, curve_bend=-0.05,
                direction=(1.0, 0.0, -0.18), mat=horn_mat, parent=leg,
                local_pos=(0.44, side * 0.04 + dy, -2.06), segs_u=8, segs_v=8
            )

    # Continuous overlapping sinuous dragon tail with rooted dorsal spikes & razor halberd blade
    t_parent = torso
    t_lens = [0.95, 0.95, 0.92, 0.98]
    t_rads = [0.48, 0.36, 0.24, 0.14, 0.06]
    for s in range(4):
        tbone = create_bone_node(
            f"Bone_Tail{s}",
            (-1.18, 0.0, 0.12) if s == 0 else (-t_lens[s - 1], 0.0, 0.02),
            t_parent
        )
        l = t_lens[s]
        r0, r1 = t_rads[s], t_rads[s + 1]
        build_organic_tube(f"Dragon_TailSeg{s}", [
            (0.32 if s == 0 else 0.18, 0.0, 0.02 if s == 0 else 0.0, r0 * 1.04, r0 * 1.04),
            (-l * 0.5, 0.0, 0.01, (r0 + r1) * 0.5, (r0 + r1) * 0.5),
            (-l - 0.12, 0.0, 0.02, r1, r1),
        ], segs_u=14, segs_v=14, mat=obsidian_mat, parent=tbone, dorsal_keel=0.08, taper_start=True, taper_end=True, subdiv=1)
        # Sharp curved basalt dorsal tail spikes sunk cleanly into tail skin
        r_mid = (r0 + r1) * 0.5
        build_curved_claw_or_horn(
            f"Dragon_TailSpine_{s}", length=0.34 - s * 0.05, base_r=0.055 - s * 0.008, curve_bend=0.14,
            direction=(-0.58, 0.0, 0.82), mat=horn_mat, parent=tbone,
            local_pos=(-l * 0.5, 0.0, r_mid * 0.65), segs_u=8, segs_v=8
        )
        if s == 3:
            # Glowing magma twin-barbed halberd spear tip
            build_curved_claw_or_horn(
                "Dragon_TailHalberd_Top", length=0.62, base_r=0.075, curve_bend=0.12,
                direction=(-0.82, 0.0, 0.58), mat=magma_mat, parent=tbone,
                local_pos=(-l * 0.82, 0.0, 0.02), segs_u=10, segs_v=8
            )
            build_curved_claw_or_horn(
                "Dragon_TailHalberd_Bot", length=0.48, base_r=0.062, curve_bend=-0.10,
                direction=(-0.88, 0.0, -0.46), mat=magma_mat, parent=tbone,
                local_pos=(-l * 0.82, 0.0, 0.0), segs_u=10, segs_v=8
            )
        t_parent = tbone

    return export_fighter_glb(os.path.join(OUT_DIR, f"{fid}.glb"))


BUILDERS = {
    "smilodon": build_smilodon,
    "giantsloth": build_giantsloth,
    "dragon": build_dragon,
}


if __name__ == "__main__":
    results = {}
    for fid, fn in BUILDERS.items():
        results[fid] = fn()
    print("BATCH4_DONE:", results)
