"""
Batch 5 Blender Procedural Overhaul: Remaining 3 Apex & Signature Fighters
Species:
  - trex: Tyrannosaurus rex (Heavy skull, brow horns, serrated teeth, muscular tail, didactyl arms)
  - pachyrhino: Pachyrhinosaurus canadensis (Nasal pachyostotic boss, ornate ocellated frill, quadruped)
  - quetzal: Quetzalcoatlus northropi (Giant Azhdarchid pterosaur w/ spear beak, cranial crest, articulated wings)

All geometry is built in Blender right-handed Z-up coordinates (+X forward, +Z up, +Y left / -Y right).
glTF export (export_yup=True) maps Blender (X, Y, Z) -> Three.js (X, Z, -Y).
Note on UV seam alignment: build_organic_tube computes Frenet frames from the tangent vector.
Passing X-aligned tube control points in monotonically increasing X (-X -> +X) ensures UV u=0 (dorsal)
stays on top (+Z) consistently across tail, pelvis, torso, neck, and skull.
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


def _build_disc(name, radius, thickness, mat, parent, local_pos=(0, 0, 0), rot=(0, 0, 0)):
    """Builds a smooth beveled circular disc/ocellus plate."""
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=radius, depth=thickness, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = name
    obj.parent = parent
    obj.location = local_pos
    obj.rotation_euler = rot
    if mat:
        obj.data.materials.append(mat)
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj


def _build_stout_leg(name_prefix, hip_pos, hip_bone, knee_off, ankle_off, foot_off, ground_z, radii, hide_mat, claw_mat, toe_angles=(-0.38, 0.0, 0.38)):
    """Helper to build a muscular quadrupedal hind/fore limb touching world ground_z."""
    leg = create_bone_node(name_prefix, hip_pos, parent=hip_bone)
    r_hip, r_knee, r_ankle, r_foot = radii
    build_organic_tube(
        f"{name_prefix}_Column",
        [
            (0.0, 0.0, 0.14, r_hip[0], r_hip[1]),
            (knee_off[0], knee_off[1], knee_off[2], r_knee[0], r_knee[1]),
            (ankle_off[0], ankle_off[1], ankle_off[2], r_ankle[0], r_ankle[1]),
            (foot_off[0], foot_off[1], ground_z + 0.08, r_foot[0], r_foot[1]),
        ],
        segs_u=18,
        segs_v=14,
        mat=hide_mat,
        parent=leg,
        taper_start=True,
        taper_end=False,
        subdiv=1,
    )
    build_organic_tube(
        f"{name_prefix}_Pad",
        [
            (foot_off[0] - 0.15, foot_off[1], ground_z + r_foot[1] * 0.45, r_foot[0] * 1.05, r_foot[1] * 0.45),
            (foot_off[0] + 0.18, foot_off[1], ground_z + r_foot[1] * 0.42, r_foot[0] * 1.15, r_foot[1] * 0.42),
        ],
        segs_u=10,
        segs_v=12,
        mat=hide_mat,
        parent=leg,
        belly_flat=0.35,
        subdiv=1,
    )
    for ti, ang in enumerate(toe_angles):
        dx = math.cos(ang)
        dy = math.sin(ang)
        build_curved_claw_or_horn(
            f"{name_prefix}_Toe{ti}",
            length=0.22,
            base_r=0.055,
            curve_bend=-0.06,
            direction=(dx * 0.92, dy * 0.92, -0.35),
            mat=claw_mat,
            parent=leg,
            local_pos=(foot_off[0] + 0.14 + dx * 0.06, foot_off[1] + dy * 0.11, ground_z + 0.075),
            segs_u=8,
            segs_v=8,
        )
    return leg


# ==============================================================================
# 1. T-REX (Tyrannosaurus rex)
# ==============================================================================
def build_trex():
    from trex_sculptor import build_trex_high_definition
    return build_trex_high_definition()


# ==============================================================================
# 2. PACHYRHINOSAURUS (Pachyrhinosaurus canadensis)
# ==============================================================================
def build_pachyrhino():
    from pachyrhino_sculptor import build_pachyrhino_high_definition
    return build_pachyrhino_high_definition()


# ==============================================================================
# 3. QUETZALCOATLUS (Quetzalcoatlus northropi)
# ==============================================================================
def build_quetzal():
    clear_scene()
    fid = "quetzal"
    fur_mat = make_pbr_material(
        "Mat_BodyPrimary", base_color=(0.34, 0.35, 0.38, 1.0), roughness=0.72, metallic=0.01,
        albedo_path=_tex(fid, "albedo"), bump_path=_tex(fid, "bump"), bump_strength=0.22,
    )
    beak_mat = make_pbr_material("Mat_Secondary", (0.64, 0.54, 0.36, 1.0), roughness=0.44, metallic=0.02)
    crest_mat = make_pbr_material("Mat_Accent", (0.62, 0.44, 0.30, 1.0), roughness=0.48, metallic=0.02)
    wing_mat = make_pbr_material("Mat_Membrane", (0.50, 0.42, 0.34, 1.0), roughness=0.64, metallic=0.0)
    iris_mat = make_pbr_material("Mat_Eye", (0.96, 0.70, 0.14, 1.0), roughness=0.08, emissive=(0.45, 0.25, 0.04, 1.0), emissive_strength=0.18)
    pupil_mat = make_pbr_material("Mat_Pupil", (0.02, 0.02, 0.02, 1.0), roughness=0.06)

    root = create_bone_node("Bone_Root")
    hips = create_bone_node("Bone_Hips", (0.0, 0.0, 1.98), root)
    torso = create_bone_node("Bone_Torso", (0.0, 0.0, 0.0), hips)

    # Compact aerodynamic azhdarchid torso extending smoothly into neck base
    build_organic_tube(
        "Quetzal_Torso",
        [
            (-0.34, 0.0, 0.0, 0.20, 0.18),
            (0.06, 0.0, 0.12, 0.34, 0.30),
            (0.50, 0.0, 0.28, 0.38, 0.32),
            (0.84, 0.0, 0.40, 0.24, 0.22),
        ],
        segs_u=20, segs_v=18, mat=fur_mat, parent=torso, dorsal_keel=0.05, belly_flat=0.12,
        taper_start=True, taper_end=False, subdiv=1,
    )
    build_osteoderm_plate(
        "Quetzal_SternumKeel", width=0.22, height=0.52, thickness=0.10,
        mat=fur_mat, parent=torso, local_pos=(0.48, 0.0, 0.04), rot=(0.0, 0.35, 0.0), shape="diamond",
    )

    # Elongated stiffened Azhdarchid giraffe-like neck
    neck = create_bone_node("Bone_Neck", (0.76, 0.0, 0.38), torso)
    build_organic_tube(
        "Quetzal_Neck",
        [
            (-0.16, 0.0, -0.08, 0.24, 0.22),
            (0.24, 0.0, 0.44, 0.17, 0.16),
            (0.58, 0.0, 0.96, 0.15, 0.14),
            (0.84, 0.0, 1.40, 0.14, 0.14),
        ],
        segs_u=18, segs_v=14, mat=fur_mat, parent=neck, dorsal_keel=0.04,
        taper_start=False, taper_end=False, subdiv=1,
    )

    # Azhdarchid spear skull + giant toothless keratin beak + tall cranial sagittal crest
    head = create_bone_node("Bone_Head", (0.82, 0.0, 1.40), neck)
    build_organic_tube(
        "Quetzal_Skull",
        [
            (-0.24, 0.0, 0.02, 0.16, 0.16),
            (0.14, 0.0, 0.05, 0.18, 0.18),
            (0.52, 0.0, 0.01, 0.12, 0.15),
        ],
        segs_u=14, segs_v=14, mat=fur_mat, parent=head, belly_flat=0.12, subdiv=1,
    )
    build_organic_tube(
        "Quetzal_UpperBeak",
        [
            (0.38, 0.0, 0.02, 0.11, 0.15),
            (0.96, 0.0, -0.02, 0.065, 0.11),
            (1.52, 0.0, -0.06, 0.032, 0.058),
            (1.96, 0.0, -0.09, 0.012, 0.018),
        ],
        segs_u=20, segs_v=12, mat=beak_mat, parent=head, dorsal_keel=0.05, belly_flat=0.35, taper_start=False, subdiv=1,
    )
    _build_wing_membrane(
        "Quetzal_CranialCrest",
        [
            (-0.18, 0.0, 0.08),
            (-0.84, 0.0, 0.38),
            (-0.26, 0.0, 0.52),
            (0.38, 0.0, 0.18),
        ],
        crest_mat, head, thickness=0.046,
    )
    for s in (-1, 1):
        build_anatomical_eye(f"Quetzal_Eye_{s}", 0.052, iris_mat, pupil_mat, head, (0.16, s * 0.17, 0.08))

    jaw = create_bone_node("Bone_Jaw", (0.18, 0.0, -0.06), head)
    build_organic_tube(
        "Quetzal_LowerBeak",
        [
            (0.0, 0.0, 0.0, 0.11, 0.07),
            (0.68, 0.0, -0.02, 0.06, 0.06),
            (1.28, 0.0, -0.04, 0.028, 0.038),
            (1.72, 0.0, -0.05, 0.010, 0.014),
        ],
        segs_u=18, segs_v=10, mat=beak_mat, parent=jaw, belly_flat=0.25, subdiv=1,
    )

    # Broad swept Azhdarchid Wings with lush visible patagium sail chord
    for idx, (wing_name, s) in enumerate((("Special_LeftWing", 1), ("Special_RightWing", -1))):
        wing = create_bone_node(wing_name, (0.58, s * 0.28, 0.32), torso)
        S = (0.0, 0.0, 0.0)
        E = (-0.28, s * 0.72, 0.06)
        W = (0.10, s * 1.62, 0.18)

        build_organic_tube(
            f"{wing_name}_InnerArm",
            [(*S, 0.14, 0.13), (*E, 0.11, 0.10), (*W, 0.085, 0.085)],
            segs_u=16, segs_v=12, mat=fur_mat, parent=wing, subdiv=1,
        )
        for di, dx in enumerate((-0.05, 0.03, 0.11)):
            build_curved_claw_or_horn(
                f"{wing_name}_ManusClaw_{di}", length=0.18, base_r=0.024, curve_bend=-0.06,
                direction=(0.65, s * 0.25, -0.72), mat=beak_mat, parent=wing,
                local_pos=(W[0] + dx, W[1], W[2] - 0.02), segs_u=8, segs_v=8,
            )

        # Broad inner wing brachiopatagium reaching back to hip flank!
        Flank = (-0.95, s * -0.05, -0.24)
        InnerTrailing = (-0.75, s * 0.80, -0.06)
        _build_wing_membrane(f"{wing_name}_Propatagium", [S, W, E], wing_mat, wing)
        _build_wing_membrane(f"{wing_name}_InnerPatagium", [S, W, InnerTrailing, Flank], wing_mat, wing)

        # Outer wing finger spar pivoted at Wrist (Bone_Arm0 / Bone_Arm1)
        arm = create_bone_node(f"Bone_Arm{idx}", W, wing)
        W_loc = (0.0, 0.0, 0.0)
        F_mid = (-0.26, s * 1.15, 0.12)
        F_tip = (-0.68, s * 2.25, -0.02)
        Trail_mid = (-0.92, s * 0.60, -0.22)
        Trail_in = (InnerTrailing[0] - W[0], InnerTrailing[1] - W[1], InnerTrailing[2] - W[2])

        build_organic_tube(
            f"{wing_name}_WingFinger",
            [(*W_loc, 0.075, 0.075), (*F_mid, 0.048, 0.048), (*F_tip, 0.016, 0.016)],
            segs_u=18, segs_v=10, mat=crest_mat, parent=arm, subdiv=1,
        )
        _build_wing_membrane(
            f"{wing_name}_OuterPatagium",
            [W_loc, F_mid, F_tip, Trail_mid, Trail_in],
            wing_mat, arm,
        )

    # Crisp angular Azhdarchid stilt hindlegs reaching ground Z = -1.98 (world Z = 0)
    for idx, s in enumerate((1, -1)):
        leg = create_bone_node(f"Bone_Leg{idx}", (0.0, s * 0.24, 0.0), hips)
        build_organic_tube(
            f"Quetzal_Hindlimb_{idx}",
            [
                (0.0, 0.0, 0.04, 0.15, 0.16),
                (0.14, 0.0, -0.72, 0.10, 0.10),
                (-0.08, 0.0, -1.36, 0.068, 0.068),
                (0.02, 0.0, -1.92, 0.050, 0.046),
            ],
            segs_u=18, segs_v=12, mat=fur_mat, parent=leg, subdiv=1,
        )
        build_organic_tube(
            f"Quetzal_FootPad_{idx}",
            [(-0.02, 0.0, -1.94, 0.075, 0.032), (0.20, 0.0, -1.94, 0.085, 0.030)],
            segs_u=8, segs_v=10, mat=beak_mat, parent=leg, belly_flat=0.35, subdiv=1,
        )
        for ti, ang in enumerate((-0.34, 0.0, 0.34)):
            build_curved_claw_or_horn(
                f"Quetzal_FootToe_{idx}_{ti}", length=0.14, base_r=0.022, curve_bend=-0.04,
                direction=(math.cos(ang) * 0.94, math.sin(ang) * 0.94, -0.28), mat=beak_mat, parent=leg,
                local_pos=(0.18, math.sin(ang) * 0.06, -1.94), segs_u=8, segs_v=8,
            )

    # Short pterosaur stub tail (-X -> +X for dorsal UV stripe)
    tail0 = create_bone_node("Bone_Tail0", (-0.30, 0.0, 0.02), hips)
    build_organic_tube(
        "Quetzal_Tail",
        [(-0.42, 0.0, -0.04, 0.04, 0.035), (0.06, 0.0, 0.0, 0.14, 0.12)],
        segs_u=10, segs_v=10, mat=fur_mat, parent=tail0, taper_start=True, taper_end=False, subdiv=1,
    )

    out_path = os.path.join(OUT_DIR, "quetzal.glb")
    export_fighter_glb(out_path)
    return out_path


def build_all():
    paths = [build_trex(), build_pachyrhino(), build_quetzal()]
    print("[Batch 5 APEX EXPORTED]", paths)
    return paths


if __name__ == "__main__":
    build_all()
