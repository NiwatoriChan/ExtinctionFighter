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
    from quetzal_sculptor import build_quetzal_high_definition
    return build_quetzal_high_definition()


def build_all():
    paths = [build_trex(), build_pachyrhino(), build_quetzal()]
    print("[Batch 5 APEX EXPORTED]", paths)
    return paths


if __name__ == "__main__":
    build_all()
