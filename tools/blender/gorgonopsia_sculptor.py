"""
tools/blender/gorgonopsia_sculptor.py
Museum-grade paleontological & portrait-faithful Blender 5.2 builder for the
Gorgonopsia (Inostrancevia alexandri) GLB model (assets/models/fighters/gorgonopsia.glb),
AND shared high-definition quadrupedal saber-tooth predator sculpting foundation
reused by smilodon_sculptor.py.

Anatomical & visual synthesis:
  - Silhouette, semi-erect powerful forequarters, deep muscular ribcage, athletic
    tucked predator waist, long tapering reptilian-therapsid tail, and heavy squared
    box-like cranium with huge temporal arches guided by Inostrancevia alexandri
    paleontological reconstructions.
  - Hairless pebbled dark volcanic-charcoal & burnt-crimson/rust mottled hide,
    dusty sandstone-ochre folded gular throat pleats, knobby supraorbital brow
    ridges, fiery golden-amber vertical-slit eyes, and colossal curved upper saber
    canines + prominent interlocking lower canines & premaxillary incisors matched
    to assets/portraits/gorgonopsia.png.

Canonical Smilodon-compatible Extinction Kombat 3D rig contract:
  Bone_Root -> Bone_Hips (Z=1.55) -> Bone_Torso -> Bone_Neck -> Bone_Head -> Bone_Jaw
                                                -> Bone_Tail0 -> Bone_Tail1 -> Bone_Tail2 -> Bone_Tail3
                                  -> Bone_Leg0 (Front Left,  +Y, planted at Z=0)
                                  -> Bone_Leg1 (Front Right, -Y, planted at Z=0)
                                  -> Bone_Leg2 (Rear Left,   +Y, planted at Z=0)
                                  -> Bone_Leg3 (Rear Right,  -Y, planted at Z=0)
"""

import math
import os
import sys
import bpy
import bmesh
from mathutils import Vector, Euler

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from blender_rig_utils import (
    clear_scene,
    make_pbr_material,
    create_bone_node,
    attach_mesh_obj,
    export_fighter_glb,
    TEX_DIR,
    OUT_DIR,
)
from trex_sculptor import (
    CatmullRomSpline3D,
    _build_grid_bmesh,
    _build_muscular_limb_segment,
    _catmull_rom_vec,
)


def _tex(name):
    p = os.path.join(TEX_DIR, name)
    return p if os.path.exists(p) else None


def make_pbr_normal_mat(
    name,
    base_color=(1.0, 1.0, 1.0, 1.0),
    roughness=0.68,
    metallic=0.02,
    albedo_path=None,
    normal_path=None,
    normal_strength=0.65,
    emissive=None,
    emissive_strength=0.0,
    alpha=1.0,
):
    """
    Creates a Blender 5.2 Principled BSDF material wired with an albedo texture
    and a true OpenGL/glTF tangent-space ShaderNodeNormalMap (cleanly exported to GLB).
    """
    mat = make_pbr_material(
        name,
        base_color=base_color,
        roughness=roughness,
        metallic=metallic,
        emissive=emissive,
        emissive_strength=emissive_strength,
        albedo_path=albedo_path,
        bump_path=None,
        alpha=alpha,
    )
    if normal_path and os.path.exists(normal_path) and mat and mat.use_nodes:
        nt = mat.node_tree
        bsdf = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None)
        tex_coord = next((n for n in nt.nodes if n.type == "TEX_COORD"), None)
        if bsdf and tex_coord:
            n_img = bpy.data.images.load(normal_path, check_existing=True)
            n_img.reload()
            try:
                n_img.colorspace_settings.name = "Non-Color"
            except Exception:
                pass
            tex_n = nt.nodes.new("ShaderNodeTexImage")
            tex_n.image = n_img
            tex_n.location = (-340, -180)
            nt.links.new(tex_coord.outputs["UV"], tex_n.inputs["Vector"])

            nmap = nt.nodes.new("ShaderNodeNormalMap")
            nmap.location = (-80, -180)
            nmap.inputs["Strength"].default_value = normal_strength
            nt.links.new(tex_n.outputs["Color"], nmap.inputs["Color"])
            nt.links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


# ==============================================================================
# SHARED HIGH-DEFINITION QUADRUPED PREDATOR SCULPTING PRIMITIVES
# (Reused by both gorgonopsia_sculptor.py and smilodon_sculptor.py)
# ==============================================================================

def _build_grid_bmesh_seamless(rings_verts, rings_uvs, close_u=True, cap_start=False, cap_end=False, wrap_uv_seam=True, u_wrap_axis=0):
    """
    Like _build_grid_bmesh, but when wrap_uv_seam=False (used for mirrored/banded limb UVs),
    the closing quad connects directly back to uv0[0] without jumping to 1.0 across the texture!
    """
    if wrap_uv_seam:
        return _build_grid_bmesh(rings_verts, rings_uvs, close_u=close_u, cap_start=cap_start, cap_end=cap_end, u_wrap_axis=u_wrap_axis)
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")
    n_v = len(rings_verts)
    n_u = len(rings_verts[0])
    bm_rings = [[bm.verts.new(co) for co in rings_verts[iv]] for iv in range(n_v)]
    u_limit = n_u if close_u else (n_u - 1)
    for iv in range(n_v - 1):
        r0, r1 = bm_rings[iv], bm_rings[iv + 1]
        uv0, uv1 = rings_uvs[iv], rings_uvs[iv + 1]
        for iu in range(u_limit):
            iu_next = (iu + 1) % n_u
            v00, v01, v11, v10 = r0[iu], r0[iu_next], r1[iu_next], r1[iu]
            if (v00.co - v01.co).length < 1e-6 and (v10.co - v11.co).length < 1e-6:
                continue
            try:
                f = bm.faces.new((v00, v01, v11, v10))
                for loop, uv in zip(f.loops, (uv0[iu], uv0[iu_next], uv1[iu_next], uv1[iu])):
                    loop[uv_layer].uv = uv
            except ValueError:
                pass
    if cap_start:
        try:
            bm.faces.new(bm_rings[0][::-1])
        except ValueError:
            pass
    if cap_end:
        try:
            bm.faces.new(bm_rings[-1])
        except ValueError:
            pass
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def build_quadruped_spine_segment(
    name,
    master_spline,
    eval_surface_fn,
    t_start,
    t_end,
    t_joint_back,
    t_joint_front,
    bone_world_pos,
    parent_bone,
    mat,
    segs_u=44,
    segs_v=28,
):
    """
    Lofts a C1-continuous slice [t_start, t_end] of a quadruped predator spine in
    parent_bone local space using eval_surface_fn(master_spline, t, theta, cap_scale).
    Internal spherical ball-joint caps overlap across bone pivots so animations never tear.
    """
    rings_verts = []
    rings_uvs = []
    origin = Vector(bone_world_pos)

    for iv in range(segs_v + 1):
        frac = iv / segs_v
        t = t_start + frac * (t_end - t_start)

        cap_scale = 1.0
        if t_joint_back is not None and t < t_joint_back:
            span = max(1e-5, t_joint_back - t_start)
            s = min(1.0, (t_joint_back - t) / span)
            cap_scale = max(0.004, math.cos(s * math.pi * 0.5))
        elif t_joint_front is not None and t > t_joint_front:
            span = max(1e-5, t_end - t_joint_front)
            s = min(1.0, (t - t_joint_front) / span)
            cap_scale = max(0.004, math.cos(s * math.pi * 0.5))

        row_v = []
        row_uv = []
        for iu in range(segs_u):
            u = iu / segs_u
            theta = u * math.pi * 2.0
            world_pt = eval_surface_fn(master_spline, t, theta, cap_scale)
            row_v.append(world_pt - origin)
            row_uv.append((u, t))
        rings_verts.append(row_v)
        rings_uvs.append(row_uv)

    bm = _build_grid_bmesh(rings_verts, rings_uvs, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    return attach_mesh_obj(bm, name, mat=mat, parent=parent_bone, local_pos=(0.0, 0.0, 0.0), subdiv=0)


def build_quadruped_limb_tube(
    name,
    ctrl_tuples,
    mat,
    parent,
    radial_segs=28,
    height_segs=42,
    v_uv_range=(0.40, 0.86),
    muscle_fn=None,
    taper_start=True,
    taper_end=True,
    dorsal_uv_band=(0.04, 0.34),
):
    """
    Lofts a continuous multi-joint muscular quadruped limb (shoulder/hip -> elbow/knee
    -> forearm/calf -> wrist/ankle -> paw bridge) along a Catmull-Rom spline with
    parallel-transport framing and optional anatomical cross-section modulation.
    ctrl_tuples: list of (x, y, z, ry_lateral, rz_sagittal, sag_offset)
    """
    spline = CatmullRomSpline3D(ctrl_tuples)
    rings_verts = []
    rings_uvs = []
    prev_tangent = None
    lat_axis = None

    for iy in range(height_segs + 1):
        v = iy / height_segs
        cap_scale = 1.0
        if taper_start and v < 0.09:
            cap_scale = max(0.015, math.sin((v / 0.09) * (math.pi * 0.5)))
        elif taper_end and v > 0.91:
            cap_scale = max(0.015, math.sin(((1.0 - v) / 0.09) * (math.pi * 0.5)))

        c_pt, vals = spline.eval_at(v)
        ry = max(0.002, vals[0] * cap_scale)
        rz = max(0.002, vals[1] * cap_scale)
        sag_off = vals[2] * cap_scale if len(vals) > 2 else 0.0

        tangent = spline.tangent_at(v)
        if prev_tangent is None:
            init_lat = Vector((0.0, 1.0, 0.0))
            if abs(tangent.dot(init_lat)) > 0.94:
                init_lat = Vector((1.0, 0.0, 0.0))
            lat_axis = (init_lat - tangent * init_lat.dot(tangent)).normalized()
        else:
            q_rot = prev_tangent.rotation_difference(tangent)
            lat_axis = (q_rot @ lat_axis)
            lat_axis = (lat_axis - tangent * lat_axis.dot(tangent))
            if lat_axis.length < 1e-6:
                lat_axis = Vector((0.0, 1.0, 0.0))
            lat_axis.normalize()
        sag_axis = tangent.cross(lat_axis).normalized()
        prev_tangent = tangent.copy()

        v_uv = v_uv_range[0] + v * (v_uv_range[1] - v_uv_range[0])
        row_v = []
        row_uv = []
        u_lo, u_hi = dorsal_uv_band
        for ix in range(radial_segs):
            u = ix / radial_segs
            ang = u * math.pi * 2.0
            sin_a = math.sin(ang)
            cos_a = math.cos(ang)
            mod_lat = 1.0
            mod_sag = 1.0
            if muscle_fn is not None:
                mod_lat, mod_sag = muscle_fn(v, ang, sin_a, cos_a)
            pt = c_pt + lat_axis * (sin_a * ry * mod_lat) + sag_axis * (cos_a * rz * mod_sag + sag_off)
            row_v.append(pt)
            # Keep limb UVs cleanly inside the dorsal/flank hide band (never exposing belly strip on outer limbs)
            u_tex = u_lo + (u_hi - u_lo) * (0.5 - 0.5 * cos_a)
            row_uv.append((u_tex, v_uv))
        rings_verts.append(row_v)
        rings_uvs.append(row_uv)

    bm = _build_grid_bmesh_seamless(rings_verts, rings_uvs, close_u=True, cap_start=True, cap_end=True, wrap_uv_seam=False)
    return attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=(0.0, 0.0, 0.0), subdiv=0)


def build_saber_tooth_mesh(
    name,
    rx_fore_aft,
    ry_lateral,
    length,
    curve_back=0.18,
    is_upper=True,
    serrated=True,
    mat=None,
    parent=None,
    local_pos=(0.0, 0.0, 0.0),
    local_rot=(0.0, 0.0, 0.0),
    radial_segs=18,
    height_segs=18,
):
    """
    Sculpts a museum-grade laterally-flattened, backward-curving saber canine
    (lenticular blade cross-section with sharp anterior/posterior carinae, subtle
    vertical enamel flutes, and UV v=0 root -> v=1 razor tip).
    """
    sign_z = -1.0 if is_upper else 1.0
    ctrl_pts = [
        (0.0, 0.0, 0.0),
        (length * 0.02, 0.0, sign_z * length * 0.32),
        (-length * curve_back * 0.48, 0.0, sign_z * length * 0.68),
        (-length * curve_back, 0.0, sign_z * length),
    ]
    p0, p1, p2, p3 = [Vector(p) for p in ctrl_pts]
    p_ext = [p0 + (p0 - p1), p0, p1, p2, p3, p3 + (p3 - p2)]

    rings_v = []
    rings_uv = []
    for iy in range(height_segs + 1):
        v = iy / height_segs
        u_span = v * 3.0
        idx = min(2, int(u_span))
        lt = u_span - idx
        pt = _catmull_rom_vec(p_ext[idx], p_ext[idx + 1], p_ext[idx + 2], p_ext[idx + 3], lt)

        # Hold blade width nicely down the first 45% then taper cleanly to a piercing dagger point
        taper = 0.0012 if iy == height_segs else max(0.015, (1.0 - (v ** 1.55)))
        cx = rx_fore_aft * taper
        cy = ry_lateral * (taper ** 1.08)

        row_v = []
        row_uv = []
        for ix in range(radial_segs):
            u = ix / radial_segs
            ang = u * math.pi * 2.0
            ca = math.cos(ang)
            sa = math.sin(ang)
            # Lenticular blade pinching along front/rear cutting edges (ca = +/-1)
            blade_pinch = 1.0 + (0.14 * (abs(ca) ** 4.0) if serrated else 0.08 * (abs(ca) ** 4.0))
            flute = 1.0 - 0.07 * (abs(sa) ** 1.6) * math.sin(v * math.pi)
            lx = ca * cx * blade_pinch
            ly = sa * cy * flute
            row_v.append(Vector((pt.x + lx, pt.y + ly, pt.z)))
            row_uv.append((u, v))
        rings_v.append(row_v)
        rings_uv.append(row_uv)

    bm = _build_grid_bmesh(rings_v, rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    obj = attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=local_pos, subdiv=0)
    obj.rotation_euler = local_rot
    return obj


def build_predator_eye_assembly(
    prefix,
    side,
    eye_center,
    eye_rot,
    radius,
    mats,
    parent,
    slit_pupil=True,
):
    """Sculpts a recessed anatomical predator eye with orbit shadow, UV iris, pupil, catchlight, and eyelids."""
    eye_grp = create_bone_node(f"{prefix}_EyeSocket_{side}", eye_center, parent=parent)
    eye_grp.rotation_euler = eye_rot

    bm_sh = bmesh.new()
    bmesh.ops.create_uvsphere(bm_sh, u_segments=14, v_segments=12, radius=radius * 1.24)
    sh_obj = attach_mesh_obj(
        bm_sh, f"{prefix}_OrbitShadow_{side}", mat=mats["pupil"], parent=eye_grp,
        local_pos=(0.0, -side * radius * 0.22, 0.0),
    )
    sh_obj.scale = (1.14, 0.60, 0.94)

    bm_ir = bmesh.new()
    uv_ir = bm_ir.loops.layers.uv.new("UVMap")
    bmesh.ops.create_uvsphere(bm_ir, u_segments=22, v_segments=16, radius=radius)
    for f in bm_ir.faces:
        for loop in f.loops:
            co = loop.vert.co / max(1e-5, radius)
            loop[uv_ir].uv = (0.5 + co.x * 0.46, 0.5 + co.z * 0.46)
    bmesh.ops.recalc_face_normals(bm_ir, faces=bm_ir.faces)
    attach_mesh_obj(
        bm_ir, f"{prefix}_Eye_{side}", mat=mats["iris"], parent=eye_grp,
        local_pos=(0.0, side * radius * 0.16, 0.0),
    )

    bm_pu = bmesh.new()
    bmesh.ops.create_uvsphere(bm_pu, u_segments=16, v_segments=12, radius=radius * 0.56)
    pu_obj = attach_mesh_obj(
        bm_pu, f"{prefix}_Eye_{side}_Pupil", mat=mats["pupil"], parent=eye_grp,
        local_pos=(0.0, side * radius * 0.96, 0.0),
    )
    if slit_pupil:
        pu_obj.scale = (0.36, 0.48, 1.38)
    else:
        pu_obj.scale = (0.76, 0.46, 0.84)

    bm_cl = bmesh.new()
    bmesh.ops.create_uvsphere(bm_cl, u_segments=8, v_segments=8, radius=radius * 0.14)
    cl_obj = attach_mesh_obj(
        bm_cl, f"{prefix}_EyeCatchlight_{side}", mat=mats["catchlight"], parent=eye_grp,
        local_pos=(radius * 0.22, side * radius * 1.11, radius * 0.22),
    )
    cl_obj.scale = (0.95, 0.28, 0.95)

    eyelid_mat = mats.get("eyelid", mats["secondary"])
    _build_muscular_limb_segment(
        f"{prefix}_UpperEyelid_{side}",
        (-radius * 1.12, side * radius * 0.28, radius * 0.56),
        (radius * 1.14, side * radius * 0.28, radius * 0.36),
        lambda t, ang, r=radius: (
            r * 0.46 * math.sin(t * math.pi + 0.2),
            r * 0.42,
            0.0,
            r * 0.14 * math.sin(t * math.pi),
        ),
        eyelid_mat,
        eye_grp,
        prox_overlap=0.10, dist_overlap=0.10, radial_segs=12, height_segs=10,
    )
    _build_muscular_limb_segment(
        f"{prefix}_LowerEyelid_{side}",
        (-radius * 1.00, side * radius * 0.24, -radius * 0.54),
        (radius * 1.02, side * radius * 0.24, -radius * 0.44),
        lambda t, ang, r=radius: (
            r * 0.38 * math.sin(t * math.pi + 0.2),
            r * 0.34,
            0.0,
            -r * 0.12 * math.sin(t * math.pi),
        ),
        eyelid_mat,
        eye_grp,
        prox_overlap=0.10, dist_overlap=0.10, radial_segs=12, height_segs=10,
    )
    return eye_grp


def build_oral_cavity_and_tongue(
    prefix,
    jaw_bone,
    jaw_q,
    mats,
    tongue_x_range=(0.14, 0.78),
    tongue_width=0.125,
    tongue_height=0.042,
    adductor_lo=(0.18, 0.19, -0.02),
    adductor_hi=(0.14, 0.20, 0.12),
    saliva_specs=None,
):
    """Builds a fleshy grooved tongue, jaw adductor cheek curtains, and translucent saliva strands."""
    t_r_steps = 24
    t_l_steps = 26
    t_rings_v = []
    t_rings_uv = []
    x0, x1 = tongue_x_range
    span_x = x1 - x0
    for iy in range(t_l_steps + 1):
        v = iy / t_l_steps
        tx = x0 + v * span_x
        arch_z = (
            0.025
            + math.sin(v * math.pi * 0.86) * 0.064
            - (max(0.0, (v - 0.65) / 0.35) ** 1.6) * 0.026
        )
        tip_round = ((1.0 - (v ** 3.4)) ** 0.44) if iy < t_l_steps else 0.002
        base_cap = 0.002 if iy == 0 else 1.0
        w = tongue_width * tip_round * base_cap * (0.76 + 0.24 * math.sin(v * math.pi))
        h = tongue_height * tip_round * base_cap * math.sin(min(1.0, v * 1.15) * math.pi * 0.88)

        row_v = []
        row_uv = []
        for ix in range(t_r_steps):
            u = ix / t_r_steps
            ang = u * math.pi * 2.0
            s = math.sin(ang)
            c = math.cos(ang)
            ly = s * w
            sulcus = -0.020 * math.exp(-((s / 0.28) ** 2)) * max(0.0, c) * math.sin(v * math.pi)
            lz = arch_z + c * h + sulcus
            row_v.append(jaw_q @ Vector((tx, ly, lz)))
            row_uv.append((u, v))
        t_rings_v.append(row_v)
        t_rings_uv.append(row_uv)

    bm_tongue = _build_grid_bmesh(t_rings_v, t_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_tongue, f"{prefix}_Tongue", mat=mats["mucosa"], parent=jaw_bone)

    for side in (-1, 1):
        p_lo = jaw_q @ Vector((adductor_lo[0], side * adductor_lo[1], adductor_lo[2]))
        p_hi = Vector((adductor_hi[0], side * adductor_hi[1], adductor_hi[2]))
        _build_muscular_limb_segment(
            f"{prefix}_JawAdductor_{side}",
            p_lo,
            p_hi,
            lambda t, ang: (
                0.036 * (0.85 + 0.22 * math.sin(t * math.pi)),
                0.082 * (0.85 + 0.22 * math.sin(t * math.pi)),
                0.0,
                0.0,
            ),
            mats["mucosa"],
            jaw_bone,
            prox_overlap=0.22, dist_overlap=0.22, radial_segs=14, height_segs=12,
        )

    if saliva_specs:
        for s_idx, p_up, p_dn, s_rad in saliva_specs:
            _build_muscular_limb_segment(
                f"{prefix}_Saliva_{s_idx}",
                jaw_q @ Vector(p_dn),
                Vector(p_up),
                lambda t, ang, r=s_rad: (
                    r * (1.0 - 0.42 * math.sin(t * math.pi)),
                    r * (1.0 - 0.42 * math.sin(t * math.pi)),
                    0.0,
                    0.0,
                ),
                mats["saliva"],
                jaw_bone,
                prox_overlap=0.04, dist_overlap=0.04, radial_segs=8, height_segs=8,
            )


def build_clawed_paw(
    prefix,
    leg_bone,
    paw_center_xy,
    local_ground_z,
    toe_specs,
    paw_rx=0.175,
    paw_ry=0.165,
    paw_h=0.105,
    paw_mat=None,
    claw_mat=None,
    pad_mat=None,
    dorsal_uv_band=(0.05, 0.28),
):
    """
    Sculpts a grounded muscular quadrupedal paw resting flat on local_ground_z
    with splayed articulated toes and curved grappling claws.
    toe_specs: list of (yaw_angle, y_offset, toe_len, toe_rad, claw_len, claw_rad)
    """
    px, py = paw_center_xy
    segs_u = 22
    segs_v = 14
    rings_v = []
    rings_uv = []
    u_lo, u_hi = dorsal_uv_band
    for iv in range(segs_v + 1):
        v = iv / segs_v
        phi = (v - 0.5) * math.pi
        c_phi = math.cos(phi)
        s_phi = math.sin(phi)
        row_v = []
        row_uv = []
        for iu in range(segs_u):
            u = iu / segs_u
            ang = u * math.pi * 2.0
            lx = px + math.cos(ang) * paw_rx * c_phi
            ly = py + math.sin(ang) * paw_ry * c_phi
            if s_phi >= 0.0:
                lz = local_ground_z + paw_h * 0.28 + (s_phi ** 0.80) * (paw_h * 0.92)
            else:
                lz = local_ground_z + paw_h * 0.28 * (1.0 + s_phi * 0.98)
            row_v.append(Vector((lx, ly, lz)))
            u_tex = u_lo + (u_hi - u_lo) * (0.5 + 0.5 * math.cos(ang))
            row_uv.append((u_tex, 0.58 + 0.26 * v))
        rings_v.append(row_v)
        rings_uv.append(row_uv)

    bm_paw = _build_grid_bmesh_seamless(rings_v, rings_uv, close_u=True, cap_start=True, cap_end=True, wrap_uv_seam=False)
    attach_mesh_obj(bm_paw, f"{prefix}_PawPad", mat=pad_mat or paw_mat, parent=leg_bone)

    for ti, (ang_yaw, y_off, t_len, t_rad, c_len, c_rad) in enumerate(toe_specs):
        t_start = Vector((px + paw_rx * 0.42, py + y_off, local_ground_z + t_rad * 1.15))
        dx = math.cos(ang_yaw) * t_len
        dy = math.sin(ang_yaw) * t_len
        t_end = Vector((t_start.x + dx, t_start.y + dy, local_ground_z + t_rad * 0.92))

        _build_muscular_limb_segment(
            f"{prefix}_Toe_{ti}",
            t_start,
            t_end,
            lambda t, ang, tr=t_rad: (
                tr * (1.0 - 0.16 * t) * 1.06,
                tr * (1.0 - 0.16 * t) * 0.86,
                0.0,
                0.0,
            ),
            paw_mat,
            leg_bone,
            prox_overlap=0.35, dist_overlap=0.08, radial_segs=12, height_segs=10,
            v_uv_range=(0.64, 0.78),
        )
        # Keep claw tips flush at local_ground_z (never dipping below floor!)
        build_saber_tooth_mesh(
            f"{prefix}_Claw_{ti}",
            rx_fore_aft=c_rad * 1.15,
            ry_lateral=c_rad * 0.65,
            length=c_len,
            curve_back=0.22,
            is_upper=True,
            serrated=False,
            mat=claw_mat,
            parent=leg_bone,
            local_pos=t_end + Vector((0.0, 0.0, t_rad * 0.25)),
            local_rot=(0.0, -1.36, ang_yaw),
            radial_segs=10,
            height_segs=10,
        )


def render_quadruped_verification_views(
    prefix,
    shot_dir="/home/niwatorichan/Projects/ExtinctionFighter/.tmp_screenshots",
    head_target=(2.05, 0.0, 1.88),
    head_cam=(3.55, -1.75, 1.98),
    center_x=-0.10,
    center_z=1.35,
):
    """Renders 6 full-frame studio EEVEE views + prints polygon/bbox telemetry."""
    os.makedirs(shot_dir, exist_ok=True)
    bpy.context.view_layer.update()

    min_co = Vector((1e9, 1e9, 1e9))
    max_co = Vector((-1e9, -1e9, -1e9))
    total_polys = 0
    for obj in bpy.data.objects:
        if obj.type == "MESH":
            total_polys += len(obj.data.polygons)
            for corner in obj.bound_box:
                wc = obj.matrix_world @ Vector(corner)
                min_co.x = min(min_co.x, wc.x)
                min_co.y = min(min_co.y, wc.y)
                min_co.z = min(min_co.z, wc.z)
                max_co.x = max(max_co.x, wc.x)
                max_co.y = max(max_co.y, wc.y)
                max_co.z = max(max_co.z, wc.z)

    size = max_co - min_co
    print(
        f"[STATS:{prefix}] Polygons={total_polys}, "
        f"BBox min=({min_co.x:.3f}, {min_co.y:.3f}, {min_co.z:.3f}), "
        f"max=({max_co.x:.3f}, {max_co.y:.3f}, {max_co.z:.3f}), "
        f"size=({size.x:.2f} x {size.y:.2f} x {size.z:.2f})"
    )

    temp_objs = []
    world = bpy.context.scene.world
    if not world:
        world = bpy.data.worlds.new("PredatorStudioWorld")
        bpy.context.scene.world = world
    world.use_nodes = True
    bg = next((n for n in world.node_tree.nodes if n.type == "BACKGROUND"), None)
    if bg:
        bg.inputs[0].default_value = (0.14, 0.16, 0.20, 1.0)
        bg.inputs[1].default_value = 1.15

    center = Vector((center_x, 0.0, center_z))

    def add_sun(name, loc, target, energy, color=(1.0, 0.98, 0.94)):
        ldata = bpy.data.lights.new(name=name, type="SUN")
        ldata.energy = energy
        ldata.color = color
        lobj = bpy.data.objects.new(name, ldata)
        bpy.context.collection.objects.link(lobj)
        lobj.location = Vector(loc)
        lobj.rotation_euler = (Vector(target) - lobj.location).to_track_quat("-Z", "Y").to_euler()
        temp_objs.append(lobj)

    add_sun("_StudioKey", center + Vector((5.0, -6.0, 6.0)), center, 3.6, (1.0, 0.95, 0.88))
    add_sun("_StudioFill", center + Vector((-4.5, 5.5, 3.5)), center, 1.6, (0.76, 0.88, 1.0))
    add_sun("_StudioRim", center + Vector((-5.5, -2.5, 4.8)), center, 2.3, (1.0, 0.86, 0.68))

    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=10.0, depth=0.05, location=(center_x, 0.0, -0.025))
    ground = bpy.context.active_object
    ground.name = "_StudioGround"
    gmat = make_pbr_material("_StudioGroundMat", base_color=(0.20, 0.21, 0.23, 1.0), roughness=0.88, metallic=0.02)
    ground.data.materials.append(gmat)
    temp_objs.append(ground)

    cam_data = bpy.data.cameras.new("_StudioCam")
    cam_obj = bpy.data.objects.new("_StudioCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    temp_objs.append(cam_obj)

    scene = bpy.context.scene
    scene.camera = cam_obj
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 960
    scene.render.resolution_y = 640
    scene.render.image_settings.file_format = "PNG"

    views = [
        ("side",         Vector((center_x, -8.8, center_z + 0.15)), Vector((center_x, 0.0, center_z)), 48.0),
        ("hero_3q",      Vector((center_x + 4.8, -6.5, center_z + 1.10)), Vector((center_x + 0.15, 0.0, center_z)), 46.0),
        ("rear_3q",      Vector((center_x - 5.4, -5.6, center_z + 1.05)), Vector((center_x - 0.15, 0.0, center_z)), 46.0),
        ("head_closeup", Vector(head_cam), Vector(head_target), 56.0),
        ("front_3q",     Vector((center_x + 5.8, -2.6, center_z + 0.55)), Vector((center_x + 0.55, 0.0, center_z + 0.08)), 46.0),
        ("top",          Vector((center_x, -0.01, 9.2)), Vector((center_x, 0.0, center_z)), 46.0),
    ]

    paths = []
    for tag, cloc, target, lens in views:
        cam_data.lens = lens
        cam_obj.location = cloc
        cam_obj.rotation_euler = (target - cloc).to_track_quat("-Z", "Y").to_euler()
        out_png = os.path.join(shot_dir, f"{prefix}_{tag}.png")
        scene.render.filepath = out_png
        bpy.ops.render.render(write_still=True)
        paths.append(out_png)

    for o in temp_objs:
        bpy.data.objects.remove(o, do_unlink=True)
    return paths


# ==============================================================================
# GORGONOPSIA (Inostrancevia latifrons) MAMMALIAN / HIPPO-HIDE SCULPTOR
# ==============================================================================

def _build_sparse_3d_hairs(name, anchors, hair_mat, parent, radius=0.0042):
    """
    Creates a single lightweight batched mesh of sparse short 3D mammalian bristle hairs /
    vibrissae (matching hippo/boar/stem-mammal short hairs catching rim light in 3D!).
    anchors: list of (pos_vec3, dir_vec3, length)
    """
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")
    segs = 4
    for pos, dvec, length in anchors:
        p0 = Vector(pos)
        d = Vector(dvec).normalized()
        up = Vector((0.0, 0.0, 1.0)) if abs(d.z) < 0.9 else Vector((1.0, 0.0, 0.0))
        side_a = d.cross(up).normalized()
        side_b = d.cross(side_a).normalized()
        # 3 rings: root -> mid (gently drooping) -> sharp tip
        p1 = p0 + d * (length * 0.52) + Vector((0.0, 0.0, -length * 0.08))
        p2 = p0 + d * length + Vector((0.0, 0.0, -length * 0.22))
        r0_verts = []
        r1_verts = []
        for i in range(segs):
            ang = (i / segs) * math.pi * 2.0
            off = side_a * math.cos(ang) + side_b * math.sin(ang)
            r0_verts.append(bm.verts.new(p0 + off * radius))
            r1_verts.append(bm.verts.new(p1 + off * (radius * 0.52)))
        tip_v = bm.verts.new(p2)
        for i in range(segs):
            j = (i + 1) % segs
            try:
                f1 = bm.faces.new((r0_verts[i], r0_verts[j], r1_verts[j], r1_verts[i]))
                for lp in f1.loops:
                    lp[uv_layer].uv = (0.5, 0.2)
                f2 = bm.faces.new((r1_verts[i], r1_verts[j], tip_v))
                for lp in f2.loops:
                    lp[uv_layer].uv = (0.5, 0.9)
            except ValueError:
                pass
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return attach_mesh_obj(bm, name, mat=hair_mat, parent=parent, local_pos=(0.0, 0.0, 0.0), subdiv=0)


def _eval_gorgonopsia_spine_surface(master_spline, t, theta, cap_scale=1.0):
    """
    Evaluates the heavy, thick-skinned hippo/bear-like Inostrancevia latifrons body
    cross-section at t in [0, 1] (0 = downward-curved tail tip, 1 = occiput).
    Uses smooth C1 envelopes across tail/torso/neck so there are ZERO step seams!
    """
    c_world, vals = master_spline.eval_at(t)
    ry, rz = vals[0] * cap_scale, vals[1] * cap_scale
    tangent = master_spline.tangent_at(t)

    lat_axis = Vector((0.0, 1.0, 0.0))
    up_axis = tangent.cross(lat_axis).normalized()
    lat_axis = up_axis.cross(tangent).normalized()

    cos_t = math.cos(theta)
    sin_t = math.sin(theta)
    abs_sin = abs(sin_t)
    sign_s = 1.0 if sin_t >= 0.0 else -1.0

    def _sstep(e0, e1, x):
        s = max(0.0, min(1.0, (x - e0) / max(1e-6, e1 - e0)))
        return s * s * (3.0 - 2.0 * s)

    torso_w = _sstep(0.26, 0.36, t) * (1.0 - _sstep(0.68, 0.78, t))
    neck_w  = _sstep(0.70, 0.80, t) * (1.0 - _sstep(0.95, 1.00, t))

    lat_exp = 0.94 - 0.04 * torso_w - 0.02 * neck_w
    y_lat = sign_s * (abs_sin ** lat_exp) * ry

    if cos_t >= 0.0:
        z_vert = (cos_t ** 0.88) * rz
    else:
        v_exp = 0.90 - 0.06 * torso_w
        z_vert = -((-cos_t) ** v_exp) * rz

    # 1. Heavy muscular shoulders, deep hippo-like chest & smooth muscular hindquarters
    scap_env = math.exp(-(((t - 0.65) / 0.12) ** 2))
    if cos_t > 0.15:
        z_vert += 0.042 * rz * scap_env * (cos_t ** 1.2) * cap_scale
    if -0.25 < cos_t < 0.55 and abs_sin > 0.42:
        y_lat += sign_s * 0.080 * ry * scap_env * math.sin(((cos_t + 0.25) / 0.80) * math.pi) * cap_scale
    if cos_t < -0.30:
        z_vert -= 0.068 * rz * scap_env * ((-cos_t - 0.30) / 0.70) * cap_scale

    hip_env = math.exp(-(((t - 0.39) / 0.10) ** 2))
    if -0.15 < cos_t < 0.70 and abs_sin > 0.38:
        y_lat += sign_s * 0.080 * ry * hip_env * cap_scale

    # 2. Thick, heavy, smoothly wrinkled mammalian nape & gular dewlap folds
    if neck_w > 0.001:
        if cos_t > 0.35:
            z_vert += 0.055 * rz * ((cos_t - 0.35) / 0.65) * neck_w * cap_scale
        if cos_t < 0.20:
            fold_wave = 1.0 + 0.048 * math.sin(t * math.pi * 24.0) * neck_w
            z_vert *= (1.05 * fold_wave) if cos_t < -0.25 else 1.0
            y_lat *= (1.0 + 0.040 * math.sin(t * math.pi * 24.0) * neck_w)

    return c_world + lat_axis * y_lat + up_axis * z_vert


def _build_gorgonopsia_skull_and_jaw(head_bone, jaw_bone, mats):
    """
    Sculpts a true mammalian / stem-mammal Inostrancevia latifrons head (64x82)
    matching both the uploaded Inostrancevia latifrons reference and our refined
    mammalian hippo-skinned portrait (ZERO T-Rex look, ZERO separate nose ball!):
      - Seamless thick occiput flowing continuously out of the heavy muscular nape
      - Soft fleshy rounded mammalian brow arches & muscular zygomatic cheeks
      - Subtle gentle nasal bridge taper widening into a broad fleshy hippo/bear muzzle
      - Integrated sculpted dark mammalian rhinarium nose pad with deep recessed nostrils
        & central philtrum cleft directly in the snout geometry
      - Tiny subtle hippo-like mammalian ear folds tucked high on the temple
      - Fierce round-pupil amber mammalian predator eyes with fleshy eyelids
      - Heavy mammalian jowls, curved upper saber canines clearing outside the squared chin,
        wet sculpted gums, grooved tongue, and fine rooted 3D facial bristle hairs / vibrissae!
    """
    pitch_q = Euler((0.0, 0.08, 0.0), "XYZ").to_matrix().to_4x4()

    # (x, top_z, bot_z, half_w) — broad muscular occiput -> brow -> gently contoured bridge -> fleshy hippo/bear muzzle
    slices = [
        (-0.34, 0.16, -0.10, 0.003),  # 0: Deep closed cap inside thick nape
        (-0.12, 0.36, -0.16, 0.350),  # 1: Seamless thick mammalian occiput matching neck
        ( 0.10, 0.36, -0.14, 0.375),  # 2: Broad muscular mammalian temporal cheeks & jowls
        ( 0.32, 0.33, -0.12, 0.345),  # 3: Soft fleshy brow & recessed mammalian orbits
        ( 0.52, 0.27, -0.11, 0.278),  # 4: Slightly narrower contoured mammalian snout bridge
        ( 0.74, 0.25, -0.12, 0.282),  # 5: Broad muscular fleshy muzzle / whisker pad over saber roots
        ( 0.90, 0.23, -0.10, 0.255),  # 6: Rounded blunt hippo/bear nose pad shoulders
        ( 1.02, 0.18, -0.07, 0.205),  # 7: Rounded mammalian snout front & rhinarium
        ( 1.09, 0.11, -0.03, 0.130),  # 8: Soft blunt rhinarium front face
        ( 1.13, 0.04,  0.01, 0.003),  # 9: Closed rostral nose tip
    ]
    top_spline = CatmullRomSpline3D([(s[0], s[3], s[1]) for s in slices])
    bot_spline = CatmullRomSpline3D([(s[0], s[3], s[2]) for s in slices])

    def get_lip_festoon(v):
        # Smooth organic mammalian upper lip line curving gently down over saber pocket & up at mouth corner
        return (
            -0.026 * math.exp(-(((v - 0.73) / 0.13) ** 2))
            + 0.034 * math.exp(-(((v - 0.34) / 0.12) ** 2))
            + 0.014 * math.exp(-(((v - 0.94) / 0.07) ** 2))
        )

    radial_steps = 64
    length_steps = 82
    skull_rings_v = []
    skull_rings_uv = []

    for iy in range(length_steps + 1):
        v = iy / length_steps
        p_top, _ = top_spline.eval_at(v)
        p_bot, _ = bot_spline.eval_at(v)
        fx = p_top.x
        half_w = max(0.001, p_top.y)
        top_z = p_top.z
        bot_z = p_bot.z + get_lip_festoon(v)

        brow_profile   = math.exp(-(((v - 0.36) / 0.095) ** 2))
        orbit_profile  = math.exp(-(((v - 0.39) / 0.052) ** 2))
        jowl_profile   = math.exp(-(((v - 0.24) / 0.11) ** 2))
        muzzle_profile = math.exp(-(((v - 0.74) / 0.13) ** 2))
        nose_profile   = math.exp(-(((v - 0.91) / 0.075) ** 2))

        row_v = []
        row_uv = []
        for ix in range(radial_steps):
            u = ix / radial_steps
            angle = u * math.pi * 2.0
            s = math.sin(angle)
            c = math.cos(angle)
            abs_s = abs(s)
            sign_s = 1.0 if s >= 0.0 else -1.0

            # Smooth organic rounded mammalian head/snout with fleshy cheek & muzzle contours
            snout_t = max(0.0, min(1.0, (v - 0.16) / 0.28))
            ly = sign_s * (abs_s ** (0.94 - snout_t * 0.10)) * half_w
            mid_z = 0.5 * (top_z + bot_z)
            half_h = 0.5 * (top_z - bot_z)
            oval_z = mid_z + c * half_h
            if c >= 0.0:
                snout_z = bot_z + (top_z - bot_z) * (c ** 0.80)
                lz = oval_z * (1.0 - snout_t) + snout_z * snout_t

                # Soft muscular rounded mammalian brow cushion above eye (matches portrait!)
                if brow_profile > 0.01 and 0.22 < c < 0.86:
                    brow_arch = math.sin(((c - 0.22) / 0.64) * math.pi)
                    lz += brow_profile * brow_arch * 0.044
                    ly += sign_s * brow_profile * brow_arch * 0.036

                # Subtle central forehead furrow between mammalian brows
                if brow_profile > 0.01 and abs_s < 0.24 and c > 0.75:
                    furrow = math.cos((abs_s / 0.24) * math.pi * 0.5)
                    lz -= brow_profile * furrow * 0.014
            else:
                rim = abs_s ** 1.48
                palate_z = bot_z * rim + (bot_z + 0.050 * (1.0 - (v - 0.5) ** 2)) * (1.0 - rim)
                lz = oval_z * (1.0 - snout_t) + palate_z * snout_t

            # Full fleshy mammalian muzzle/whisker cushion over upper saber roots
            if muzzle_profile > 0.01 and -0.45 < c < 0.45:
                m_arch = math.sin(((c + 0.45) / 0.90) * math.pi)
                ly += sign_s * muzzle_profile * m_arch * 0.056
                lz -= muzzle_profile * max(0.0, -c) * 0.016

            # Recessed mammalian eye socket framed beneath the fleshy brow
            if orbit_profile > 0.01 and 0.02 < c < 0.44:
                orb_depth = math.sin(((c - 0.02) / 0.42) * math.pi)
                ly *= (1.0 - 0.22 * orbit_profile * orb_depth)

            # Heavy rounded mammalian cheek/zygomatic jowl flowing smoothly into neck
            if jowl_profile > 0.01 and -0.45 < c < 0.30:
                j_arch = math.sin(((c + 0.45) / 0.75) * math.pi)
                ly += sign_s * jowl_profile * j_arch * 0.048 * snout_t

            # Integrated sculpted fleshy mammalian rhinarium (broad blunt nose tip + deep nostrils + philtrum cleft!)
            l_fx = fx
            if nose_profile > 0.02:
                # Subtle velvety nose pad fullness on upper front snout
                if c > 0.08:
                    l_fx += nose_profile * (c ** 0.7) * 0.018
                    lz += nose_profile * max(0.0, c - 0.15) * 0.016
                # Central vertical mammalian philtrum cleft running down the front lip
                if abs_s < 0.18 and c < 0.65:
                    ph_k = math.cos((abs_s / 0.18) * math.pi * 0.5)
                    l_fx -= nose_profile * ph_k * 0.022
                    if c < 0.0:
                        lz += nose_profile * ph_k * 0.014
            # Deep paired curved mammalian nostril pits directly sculpted on upper-front snout corners!
            n_dist = math.sqrt(((abs_s - 0.54) / 0.24) ** 2 + ((c - 0.50) / 0.28) ** 2 + ((v - 0.81) / 0.065) ** 2)
            if n_dist < 1.0:
                pit = (1.0 - n_dist) ** 1.35
                l_fx -= pit * 0.052
                ly *= (1.0 - pit * 0.28)
                lz -= pit * 0.016

            pt = pitch_q @ Vector((l_fx, ly, lz))
            row_v.append(pt)
            row_uv.append((v, u))

        skull_rings_v.append(row_v)
        skull_rings_uv.append(row_uv)

    bm_skull = _build_grid_bmesh(skull_rings_v, skull_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=1)
    attach_mesh_obj(bm_skull, "Gorgo_UpperCranium", mat=mats["cranium"], parent=head_bone)

    # 1B. Deep Matte-Dark Recessed Mammalian Nostril Openings seated cleanly in the sculpted snout pits
    for side in (-1, 1):
        bm_np = bmesh.new()
        bmesh.ops.create_uvsphere(bm_np, u_segments=14, v_segments=10, radius=0.028)
        np_obj = attach_mesh_obj(
            bm_np, f"Gorgo_NostrilPit_{side}", mat=mats["nose"], parent=head_bone,
            local_pos=pitch_q @ Vector((1.028, side * 0.104, 0.126)),
        )
        np_obj.rotation_euler = (side * 0.18, 0.34, -side * 0.44)
        np_obj.scale = (0.42, 0.82, 1.18)

    # 1C. Tiny Subtle Hippo-Like Mammalian Ear Folds tucked high on posterior temple (matches portrait!)
    for side in (-1, 1):
        bm_ear = bmesh.new()
        uv_ear = bm_ear.loops.layers.uv.new("UVMap")
        bmesh.ops.create_uvsphere(bm_ear, u_segments=14, v_segments=12, radius=0.052)
        for vtx in bm_ear.verts:
            # Cupped little rounded hippo ear pinna with recessed forward auditory hollow
            vtx.co.x *= 0.62
            vtx.co.y *= 0.78
            vtx.co.z *= 1.16
            if vtx.co.x > 0.0 and vtx.co.z > -0.02:
                hollow = math.exp(-(((vtx.co.z - 0.01) / 0.040) ** 2 + ((vtx.co.y - side * 0.01) / 0.030) ** 2))
                vtx.co.x -= hollow * 0.044
        for f in bm_ear.faces:
            for lp in f.loops:
                # Shade the inner ear hollow slightly darker via dark rhinarium/crown UV region
                lp[uv_ear].uv = (0.88, 0.12) if lp.vert.co.x > 0.002 else (0.14, 0.22)
        bmesh.ops.recalc_face_normals(bm_ear, faces=bm_ear.faces)
        ear_obj = attach_mesh_obj(
            bm_ear, f"Gorgo_EarPinna_{side}", mat=mats["cranium"], parent=head_bone,
            local_pos=pitch_q @ Vector((0.02, side * 0.312, 0.256)),
        )
        ear_obj.rotation_euler = (side * 0.24, -0.18, -side * 0.32)

    # 1D. Fine Rooted 3D Short Bristle Hairs & Muzzle Vibrissae (strictly seated INSIDE skull surface!)
    head_hairs = []
    for side in (-1, 1):
        for hx, hy_off, hz, hlen in (
            (0.95, 0.205, 0.01, 0.064), (0.91, 0.222, -0.02, 0.072), (0.86, 0.238, 0.01, 0.070),
            (0.81, 0.250, -0.03, 0.068), (0.88, 0.230, 0.05, 0.058), (0.76, 0.252, 0.02, 0.062),
            (0.84, 0.244, -0.05, 0.060), (0.72, 0.252, -0.02, 0.056),
            (0.38, 0.275, 0.26, 0.046), (0.31, 0.285, 0.28, 0.050), (0.24, 0.295, 0.28, 0.048),
            (0.14, 0.305, 0.28, 0.048), (0.04, 0.310, 0.28, 0.050),
        ):
            p = pitch_q @ Vector((hx, side * (hy_off - 0.014), hz))
            d = Vector((-0.38, side * 0.88, 0.22 if hz > 0.15 else -0.16))
            head_hairs.append((p, d, hlen))
    # Subtle short dorsal nape/crown bristles evaluated EXACTLY on top_spline so ZERO hairs ever float!
    for k in range(20):
        tv = 0.09 + (k / 19.0) * 0.42  # Occiput across forehead to mid-brow only
        pt_top, _ = top_spline.eval_at(tv)
        hy = ((k % 5) - 2) * 0.028
        p = pitch_q @ Vector((pt_top.x, hy, pt_top.z - 0.018))
        head_hairs.append((p, Vector((-0.78, hy * 2.0, 0.62)), 0.046 + (k % 3) * 0.007))
    _build_sparse_3d_hairs("Gorgo_HeadBristles", head_hairs, mats["hair"], head_bone, radius=0.0019)

    # 2. Wet Scalloped Upper Gingiva & Palate Vault (tucked cleanly inside lip margins!)
    gum_r_steps = 20
    gum_l_steps = 26
    gum_rings_v = []
    gum_rings_uv = []
    for iy in range(gum_l_steps + 1):
        v = iy / gum_l_steps
        tv = 0.38 + v * 0.48
        p_top, _ = top_spline.eval_at(tv)
        p_bot, _ = bot_spline.eval_at(tv)
        bz = p_bot.z + get_lip_festoon(tv)
        hw = p_top.y * 0.62
        scallop = 0.005 * abs(math.sin(v * math.pi * 8.0))
        row_v = []
        row_uv = []
        for ix in range(gum_r_steps):
            u = ix / gum_r_steps
            ang = u * math.pi * 2.0
            gy = math.sin(ang) * hw
            gz = bz + 0.032 + math.cos(ang) * (0.016 + scallop)
            row_v.append(pitch_q @ Vector((p_top.x, gy, gz)))
            row_uv.append((u, v))
        gum_rings_v.append(row_v)
        gum_rings_uv.append(row_uv)

    bm_ugum = _build_grid_bmesh(gum_rings_v, gum_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_ugum, "Gorgo_UpperGum", mat=mats["gingiva"], parent=head_bone)

    # 3. Upper Dentition:
    #    - 5 formidable conical premaxillary incisors across the rounded snout front
    for p in range(5):
        py = (p - 2.0) * 0.044
        px = 0.99 - abs(p - 2.0) * 0.015
        pos = pitch_q @ Vector((px, py, -0.050))
        build_saber_tooth_mesh(
            f"Gorgo_UpperIncisor_{p}", rx_fore_aft=0.015, ry_lateral=0.012,
            length=0.100 - abs(p - 2.0) * 0.007, curve_back=0.10, is_upper=True,
            serrated=False, mat=mats["tooth"], parent=head_bone,
            local_pos=pos, local_rot=(0.0, 0.06, 0.0), radial_segs=10, height_segs=10,
        )

    #    - COLOSSAL Gorgonopsian upper saber canines (glide cleanly OUTSIDE the narrowed lower chin!)
    for side in (-1, 1):
        saber_pos = pitch_q @ Vector((0.80, side * 0.204, -0.092))
        build_saber_tooth_mesh(
            f"Gorgo_UpperSaber_{side}", rx_fore_aft=0.052, ry_lateral=0.024,
            length=0.42, curve_back=0.17, is_upper=True, serrated=True,
            mat=mats["tooth"], parent=head_bone,
            local_pos=saber_pos, local_rot=(-side * 0.05, 0.04, 0.0),
            radial_segs=18, height_segs=18,
        )

        # 4 pairs of sharp postcanine cheek teeth behind the diastema
        for ti, (tv, t_len, t_rad) in enumerate((
            (0.62, 0.082, 0.015),
            (0.56, 0.076, 0.014),
            (0.50, 0.068, 0.013),
            (0.45, 0.060, 0.012),
        )):
            p_top, _ = top_spline.eval_at(tv)
            p_bot, _ = bot_spline.eval_at(tv)
            y_off = p_top.y * 0.62
            z_root = p_bot.z + get_lip_festoon(tv) + 0.026
            build_saber_tooth_mesh(
                f"Gorgo_UpperPostcanine_{side}_{ti}", rx_fore_aft=t_rad * 1.1, ry_lateral=t_rad * 0.75,
                length=t_len, curve_back=0.12, is_upper=True, serrated=False,
                mat=mats["tooth"], parent=head_bone,
                local_pos=pitch_q @ Vector((p_top.x, side * y_off, z_root)),
                local_rot=(-side * 0.03, 0.06, 0.0), radial_segs=10, height_segs=8,
            )

    # 4. Fierce Mammalian Predator Eyes (crisp visible dark round pupil, glowing amber iris, fleshy lids!)
    for side in (-1, 1):
        eye_center = pitch_q @ Vector((0.36, side * 0.278, 0.178))
        build_predator_eye_assembly(
            "Gorgo", side, eye_center, (-0.04, 0.04, -side * 0.30),
            radius=0.044, mats=mats, parent=head_bone, slit_pupil=False,
        )

    # 5. Sculpted Mammalian Mandible with Rounded-Square Chin Flange (parted 0.30 rad snarl)
    jaw_q = Euler((0.0, 0.30, 0.0), "XYZ").to_matrix().to_4x4()

    # (x, top_z, bot_z, half_w) — rear extends seamlessly inside neck/throat; narrowed inside upper sabers
    m_slices = [
        (-0.24,  0.04, -0.08, 0.003),  # 0: Seated deep inside throat/neck (no vertical step!)
        (-0.08,  0.11, -0.17, 0.285),  # 1: Seamless fleshy jaw hinge & masseter cheek
        ( 0.14,  0.08, -0.20, 0.275),
        ( 0.38,  0.03, -0.18, 0.215),
        ( 0.58,  0.02, -0.18, 0.162),  # Narrowed below upper saber diastema
        ( 0.76,  0.03, -0.23, 0.150),  # Deep rounded-square Gorgonopsian chin flange!
        ( 0.89,  0.04, -0.21, 0.142),
        ( 0.97,  0.03, -0.13, 0.108),
        ( 1.01, -0.01, -0.04, 0.003),
    ]
    m_bot_spline = CatmullRomSpline3D([(s[0], s[3], s[2]) for s in m_slices])
    m_top_spline = CatmullRomSpline3D([(s[0], s[3], s[1]) for s in m_slices])

    m_r_steps = 42
    m_l_steps = 50
    mand_rings_v = []
    mand_rings_uv = []
    for iy in range(m_l_steps + 1):
        v = iy / m_l_steps
        pt_bot, _ = m_bot_spline.eval_at(v)
        pt_top, _ = m_top_spline.eval_at(v)
        fx = pt_bot.x
        half_w = max(0.001, pt_bot.y)
        bot_z = pt_bot.z
        top_z = pt_top.z

        row_v = []
        row_uv = []
        for ix in range(m_r_steps):
            u = ix / m_r_steps
            angle = u * math.pi * 2.0
            s = math.sin(angle)
            c = math.cos(angle)
            abs_s = abs(s)
            sign_s = 1.0 if s >= 0.0 else -1.0

            ly = sign_s * (abs_s ** 0.78) * half_w
            if c <= 0.0:
                lz = bot_z * (abs(c) ** 0.72)
            else:
                rim = abs_s ** 1.40
                lz = top_z * rim + (top_z - 0.052 * math.sin(v * math.pi)) * (1.0 - rim)

            row_v.append(jaw_q @ Vector((fx, ly, lz)))
            row_uv.append((v, u))
        mand_rings_v.append(row_v)
        mand_rings_uv.append(row_uv)

    bm_mand = _build_grid_bmesh(mand_rings_v, mand_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=1)
    attach_mesh_obj(bm_mand, "Gorgo_Mandible", mat=mats["cranium"], parent=jaw_bone)

    # Fine rooted short chin bristle hairs (matching portrait!)
    chin_hairs = []
    for side in (-1, 1):
        for cx, cy, cz in (
            (0.72, 0.09, -0.20), (0.78, 0.08, -0.21), (0.85, 0.07, -0.19),
            (0.91, 0.05, -0.16), (0.64, 0.11, -0.17), (0.82, 0.03, -0.21),
        ):
            chin_hairs.append((jaw_q @ Vector((cx, side * cy, cz + 0.012)), Vector((-0.15, side * 0.30, -0.92)), 0.048))
    _build_sparse_3d_hairs("Gorgo_ChinBristles", chin_hairs, mats["hair"], jaw_bone, radius=0.0019)

    # Lower scalloped gingiva (tucked cleanly inside dentary lip margin — no protruding red slab!)
    lg_r_steps = 18
    lg_l_steps = 24
    lg_rings_v = []
    lg_rings_uv = []
    for iy in range(lg_l_steps + 1):
        v = iy / lg_l_steps
        tv = 0.34 + v * 0.44
        pt_top, _ = m_top_spline.eval_at(tv)
        hw = pt_top.y * 0.56
        scallop = 0.004 * abs(math.sin(v * math.pi * 8.0))
        row_v = []
        row_uv = []
        for ix in range(lg_r_steps):
            u = ix / lg_r_steps
            ang = u * math.pi * 2.0
            gy = math.sin(ang) * hw
            gz = pt_top.z - 0.028 + math.cos(ang) * (0.014 + scallop)
            row_v.append(jaw_q @ Vector((pt_top.x, gy, gz)))
            row_uv.append((u, v))
        lg_rings_v.append(row_v)
        lg_rings_uv.append(row_uv)

    bm_lgum = _build_grid_bmesh(lg_rings_v, lg_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_lgum, "Gorgo_LowerGum", mat=mats["gingiva"], parent=jaw_bone)

    # Prominent interlocking lower canines + 4 lower incisors + 4 postcanines
    for side in (-1, 1):
        lc_pos = jaw_q @ Vector((0.77, side * 0.106, 0.008))
        build_saber_tooth_mesh(
            f"Gorgo_LowerCanine_{side}", rx_fore_aft=0.030, ry_lateral=0.019,
            length=0.185, curve_back=0.14, is_upper=False, serrated=True,
            mat=mats["tooth"], parent=jaw_bone,
            local_pos=lc_pos, local_rot=(side * 0.06, 0.28, 0.0),
            radial_segs=14, height_segs=14,
        )
        for ti, (tv, t_len, t_rad) in enumerate((
            (0.62, 0.070, 0.014),
            (0.55, 0.064, 0.013),
            (0.49, 0.058, 0.012),
            (0.43, 0.052, 0.011),
        )):
            pt_top, _ = m_top_spline.eval_at(tv)
            build_saber_tooth_mesh(
                f"Gorgo_LowerPostcanine_{side}_{ti}", rx_fore_aft=t_rad * 1.05, ry_lateral=t_rad * 0.72,
                length=t_len, curve_back=0.10, is_upper=False, serrated=False,
                mat=mats["tooth"], parent=jaw_bone,
                local_pos=jaw_q @ Vector((pt_top.x, side * pt_top.y * 0.62, pt_top.z - 0.016)),
                local_rot=(side * 0.03, 0.26, 0.0), radial_segs=10, height_segs=8,
            )

    for p in range(4):
        py = (p - 1.5) * 0.038
        px = 0.88 - abs(p - 1.5) * 0.015
        build_saber_tooth_mesh(
            f"Gorgo_LowerIncisor_{p}", rx_fore_aft=0.013, ry_lateral=0.011,
            length=0.084, curve_back=0.08, is_upper=False, serrated=False,
            mat=mats["tooth"], parent=jaw_bone,
            local_pos=jaw_q @ Vector((px, py, 0.010)),
            local_rot=(0.0, 0.30, 0.0), radial_segs=8, height_segs=8,
        )

    # Grooved tongue and fleshy jaw adductors (clean opening during roar animations)
    build_oral_cavity_and_tongue(
        "Gorgo", jaw_bone, jaw_q, mats,
        tongue_x_range=(0.14, 0.76), tongue_width=0.115, tongue_height=0.040,
        adductor_lo=(0.18, 0.185, -0.02), adductor_hi=(0.14, 0.195, 0.12),
        saliva_specs=None,
    )


def _build_gorgonopsia_forelimb(leg_bone, side, local_ground_z, mats, idx):
    """
    Sculpts a sturdy muscular hippo/therapsid Gorgonopsian forelimb (Bone_Leg0/1) resting on Z = 0:
      - Heavy deltoid & triceps shoulder seamlessly seated deep inside chest
      - Muscular forearm tapering smoothly down into wrist & broad 5-toed clawed paw
    """
    leg_ctrl = [
        ( 0.02, -side * 0.22,  0.16, 0.23, 0.29,  0.00),  # 0: Shoulder seated deep inside ribcage
        (-0.06,  side * 0.03, -0.20, 0.23, 0.28, -0.02),  # 1: Deltoid & triceps belly
        (-0.14,  side * 0.13, -0.60, 0.18, 0.21, -0.03),  # 2: Semi-erect outward-bowed elbow
        (-0.04,  side * 0.11, -1.04, 0.16, 0.18,  0.02),  # 3: Forearm flexor muscle
        ( 0.04,  side * 0.09, -1.36, 0.135, 0.140, 0.01), # 4: Sturdy wrist
        ( 0.11,  side * 0.08, local_ground_z + 0.044, 0.142, 0.130, 0.00),  # 5: Seamless paw bridge
    ]
    build_quadruped_limb_tube(
        f"Gorgo_Foreleg_{idx}", leg_ctrl, mats["hide"], leg_bone,
        radial_segs=26, height_segs=38, v_uv_range=(0.56, 0.88),
        taper_start=True, taper_end=False, dorsal_uv_band=(0.04, 0.26),
    )
    toe_specs = [
        ( 0.50,  0.105, 0.18, 0.034, 0.115, 0.024),
        ( 0.24,  0.054, 0.22, 0.038, 0.140, 0.027),
        ( 0.00,  0.000, 0.24, 0.040, 0.150, 0.029),
        (-0.24, -0.054, 0.22, 0.038, 0.135, 0.026),
        (-0.48, -0.102, 0.17, 0.033, 0.105, 0.022),
    ]
    build_clawed_paw(
        f"Gorgo_ForePaw_{idx}", leg_bone, (0.17, side * 0.08), local_ground_z,
        toe_specs, paw_rx=0.18, paw_ry=0.17, paw_h=0.105,
        paw_mat=mats["hide"], claw_mat=mats["claw"], pad_mat=mats["hide"],
        dorsal_uv_band=(0.04, 0.24),
    )


def _build_gorgonopsia_hindlimb(leg_bone, side, local_ground_z, mats, idx):
    """
    Sculpts a powerful, sturdy mammalian/therapsid Gorgonopsian hindlimb (Bone_Leg2/3)
    resting on Z = 0, matching the Inostrancevia latifrons reference with a smooth
    seamless ankle-to-heel flow (zero cuff step!).
    """
    leg_ctrl = [
        (-0.04, -side * 0.20,  0.12, 0.23, 0.30,  0.00),  # 0: Hip socket deep inside pelvis
        ( 0.08,  side * 0.03, -0.24, 0.24, 0.30,  0.02),  # 1: Heavy muscular thigh belly
        ( 0.18,  side * 0.075,-0.60, 0.175, 0.205, 0.02), # 2: Forward knee patella
        ( 0.01,  side * 0.075,-0.94, 0.160, 0.190,-0.02), # 3: Heavy gastrocnemius calf
        (-0.10,  side * 0.075,-1.22, 0.125, 0.140,-0.01), # 4: Sturdy calcaneal ankle
        (-0.03,  side * 0.072,-1.40, 0.120, 0.125, 0.00), # 5: Smooth diagonal instep
        ( 0.04,  side * 0.070, local_ground_z + 0.042, 0.135, 0.124, 0.00),  # 6: Seamless heel-to-pes bridge
    ]
    build_quadruped_limb_tube(
        f"Gorgo_Hindleg_{idx}", leg_ctrl, mats["hide"], leg_bone,
        radial_segs=26, height_segs=40, v_uv_range=(0.42, 0.80),
        taper_start=True, taper_end=False, dorsal_uv_band=(0.04, 0.26),
    )
    toe_specs = [
        ( 0.42,  0.098, 0.20, 0.033, 0.115, 0.022),
        ( 0.20,  0.050, 0.24, 0.037, 0.142, 0.026),
        ( 0.00,  0.000, 0.26, 0.039, 0.152, 0.028),
        (-0.20, -0.050, 0.24, 0.037, 0.138, 0.025),
        (-0.42, -0.096, 0.19, 0.032, 0.105, 0.021),
    ]
    build_clawed_paw(
        f"Gorgo_HindPaw_{idx}", leg_bone, (0.14, side * 0.070), local_ground_z,
        toe_specs, paw_rx=0.22, paw_ry=0.165, paw_h=0.104,
        paw_mat=mats["hide"], claw_mat=mats["claw"], pad_mat=mats["hide"],
        dorsal_uv_band=(0.04, 0.24),
    )


def build_gorgonopsia_high_definition():
    clear_scene()

    mats = {
        "hide": make_pbr_normal_mat(
            "Mat_BodyPrimary",
            base_color=(1.0, 1.0, 1.0, 1.0),
            roughness=0.58,
            metallic=0.01,
            albedo_path=_tex("gorgonopsia_albedo.png"),
            normal_path=_tex("gorgonopsia_normal.png"),
            normal_strength=0.66,
        ),
        "cranium": make_pbr_normal_mat(
            "Mat_BodyPrimary_Skull",
            base_color=(1.0, 1.0, 1.0, 1.0),
            roughness=0.54,
            metallic=0.01,
            albedo_path=_tex("gorgonopsia_cranium_albedo.png"),
            normal_path=_tex("gorgonopsia_cranium_normal.png"),
            normal_strength=0.68,
        ),
        "nose": make_pbr_material(
            "Mat_NostrilInterior",
            base_color=(0.012, 0.010, 0.010, 1.0),
            roughness=0.95,
            metallic=0.0,
        ),
        "hair": make_pbr_material(
            "Mat_BristleHair",
            base_color=(0.055, 0.042, 0.036, 1.0),
            roughness=0.88,
            metallic=0.0,
        ),
        "secondary": make_pbr_normal_mat(
            "Mat_Secondary",
            base_color=(0.14, 0.11, 0.10, 1.0),
            roughness=0.56,
            metallic=0.02,
            normal_path=_tex("gorgonopsia_cranium_normal.png"),
            normal_strength=0.42,
        ),
        "tooth": make_pbr_normal_mat(
            "Mat_Accent",
            base_color=(1.0, 1.0, 1.0, 1.0),
            roughness=0.18,
            metallic=0.02,
            albedo_path=_tex("gorgonopsia_tooth_albedo.png"),
            normal_path=_tex("gorgonopsia_tooth_normal.png"),
            normal_strength=0.25,
        ),
        "gingiva": make_pbr_normal_mat(
            "Mat_JawMembrane",
            base_color=(1.0, 1.0, 1.0, 1.0),
            roughness=0.16,
            metallic=0.02,
            albedo_path=_tex("gorgonopsia_mucosa_albedo.png"),
            normal_path=_tex("gorgonopsia_mucosa_normal.png"),
            normal_strength=0.28,
        ),
        "mucosa": make_pbr_normal_mat(
            "Mat_OralMucosa",
            base_color=(1.0, 1.0, 1.0, 1.0),
            roughness=0.20,
            metallic=0.02,
            albedo_path=_tex("gorgonopsia_mucosa_albedo.png"),
            normal_path=_tex("gorgonopsia_mucosa_normal.png"),
            normal_strength=0.32,
        ),
        "saliva": make_pbr_material(
            "Mat_Saliva",
            base_color=(0.94, 0.97, 0.99, 1.0),
            roughness=0.03,
            metallic=0.0,
            alpha=0.50,
        ),
        "claw": make_pbr_material(
            "Mat_Claw",
            base_color=(0.06, 0.05, 0.045, 1.0),
            roughness=0.45,
            metallic=0.03,
        ),
        "iris": make_pbr_material(
            "Mat_Eye",
            base_color=(1.0, 0.85, 0.65, 1.0),
            roughness=0.08,
            emissive=(0.82, 0.44, 0.06, 1.0),
            emissive_strength=0.28,
            albedo_path=_tex("gorgonopsia_iris_albedo.png"),
        ),
        "pupil": make_pbr_material(
            "Mat_Pupil",
            base_color=(0.015, 0.015, 0.015, 1.0),
            roughness=0.05,
        ),
        "catchlight": make_pbr_material(
            "Mat_Catchlight",
            base_color=(1.0, 1.0, 1.0, 1.0),
            roughness=0.02,
            emissive=(1.0, 1.0, 1.0, 1.0),
            emissive_strength=0.90,
        ),
    }

    # Canonical Smilodon-compatible Bone Hierarchy (Bone_Hips at Z = 1.55)
    root  = create_bone_node("Bone_Root",  (0.0, 0.0, 0.0))
    hips  = create_bone_node("Bone_Hips",  (0.0, 0.0, 1.55), parent=root)
    torso = create_bone_node("Bone_Torso", (0.0, 0.0, 0.00), parent=hips)
    neck  = create_bone_node("Bone_Neck",  (0.98, 0.0, 0.16), parent=torso)
    head  = create_bone_node("Bone_Head",  (0.54, 0.0, 0.05), parent=neck)
    jaw   = create_bone_node("Bone_Jaw",   (0.12, 0.0, -0.14), parent=head)

    # Shorter, heavy downward-curving Inostrancevia latifrons tail
    tail0 = create_bone_node("Bone_Tail0", (-0.90, 0.0, -0.05), parent=torso)
    tail1 = create_bone_node("Bone_Tail1", (-0.38, 0.0, -0.22), parent=tail0)
    tail2 = create_bone_node("Bone_Tail2", (-0.34, 0.0, -0.34), parent=tail1)
    tail3 = create_bone_node("Bone_Tail3", (-0.30, 0.0, -0.36), parent=tail2)

    # Unified Master Spine Spline matching Inostrancevia latifrons silhouette:
    # Graceful downward-sweeping tail -> muscular rump -> deep hippo/bear barrel torso ->
    # heavy level shoulders & thick nape flowing seamlessly into the mammalian skull!
    spine_ctrl = [
        (-2.14, 0.0, 0.34, 0.004, 0.004),  # 0: Downward-curved tail tip
        (-1.92, 0.0, 0.58, 0.058, 0.064),  # 1: Bone_Tail3
        (-1.62, 0.0, 0.94, 0.112, 0.122),  # 2: Bone_Tail2
        (-1.28, 0.0, 1.28, 0.195, 0.215),  # 3: Bone_Tail1
        (-0.90, 0.0, 1.50, 0.295, 0.320),  # 4: Bone_Tail0 (heavy tail base)
        (-0.50, 0.0, 1.57, 0.395, 0.425),  # 5: Rounded hippo/bear hindquarters
        (-0.04, 0.0, 1.58, 0.415, 0.445),  # 6: Deep muscular barrel mid-torso
        ( 0.44, 0.0, 1.61, 0.475, 0.500),  # 7: Heavy deep ribcage
        ( 0.86, 0.0, 1.65, 0.500, 0.520),  # 8: Broad pectoral girdle & shoulder crest
        ( 1.14, 0.0, 1.78, 0.420, 0.410),  # 9: Thick muscular neck base
        ( 1.36, 0.0, 1.83, 0.365, 0.340),  # 10: Heavy wrinkled mammalian nape & throat
        ( 1.54, 0.0, 1.85, 0.335, 0.275),  # 11: Occiput seamlessly aligned with skull!
        ( 1.72, 0.0, 1.83, 0.004, 0.004),  # 12: Internal skull cap
    ]
    master_spine = CatmullRomSpline3D(spine_ctrl)

    t_j_tail3 = 1.0 / 12.0
    t_j_tail2 = 2.0 / 12.0
    t_j_tail1 = 3.0 / 12.0
    t_j_tail0 = 4.1 / 12.0
    t_j_neck  = 8.5 / 12.0
    overlap = 0.044

    build_quadruped_spine_segment(
        "Gorgo_TailSeg3", master_spine, _eval_gorgonopsia_spine_surface,
        0.0, t_j_tail3 + overlap, None, t_j_tail3,
        (-1.92, 0.0, 0.58), tail3, mats["hide"], segs_u=30, segs_v=18,
    )
    build_quadruped_spine_segment(
        "Gorgo_TailSeg2", master_spine, _eval_gorgonopsia_spine_surface,
        t_j_tail3 - overlap, t_j_tail2 + overlap, t_j_tail3, t_j_tail2,
        (-1.62, 0.0, 0.94), tail2, mats["hide"], segs_u=32, segs_v=18,
    )
    build_quadruped_spine_segment(
        "Gorgo_TailSeg1", master_spine, _eval_gorgonopsia_spine_surface,
        t_j_tail2 - overlap, t_j_tail1 + overlap, t_j_tail2, t_j_tail1,
        (-1.28, 0.0, 1.28), tail1, mats["hide"], segs_u=34, segs_v=18,
    )
    build_quadruped_spine_segment(
        "Gorgo_TailSeg0", master_spine, _eval_gorgonopsia_spine_surface,
        t_j_tail1 - overlap, t_j_tail0 + overlap, t_j_tail1, t_j_tail0,
        (-0.90, 0.0, 1.50), tail0, mats["hide"], segs_u=36, segs_v=20,
    )
    build_quadruped_spine_segment(
        "Gorgo_Torso", master_spine, _eval_gorgonopsia_spine_surface,
        t_j_tail0 - overlap, t_j_neck + overlap, t_j_tail0, t_j_neck,
        (0.0, 0.0, 1.55), torso, mats["hide"], segs_u=46, segs_v=36,
    )
    build_quadruped_spine_segment(
        "Gorgo_Neck", master_spine, _eval_gorgonopsia_spine_surface,
        t_j_neck - overlap, 1.0, t_j_neck, None,
        (0.98, 0.0, 1.71), neck, mats["hide"], segs_u=42, segs_v=26,
    )

    # Fine rooted sparse 3D small hairs along nape crest, shoulders & upper back (matches portrait!)
    neck_bristles = []
    neck_origin = Vector((0.98, 0.0, 1.71))
    for k in range(56):
        tk = 0.72 + (k / 55.0) * 0.24
        theta = ((k % 7) - 3) * 0.14
        pt_w = _eval_gorgonopsia_spine_surface(master_spine, tk, theta, cap_scale=0.962)
        dvec = Vector((-0.76, math.sin(theta) * 0.24, 0.62))
        neck_bristles.append((pt_w - neck_origin, dvec, 0.048 + (k % 4) * 0.008))
    _build_sparse_3d_hairs("Gorgo_NapeBristles", neck_bristles, mats["hair"], neck, radius=0.0021)

    back_bristles = []
    torso_origin = Vector((0.0, 0.0, 1.55))
    for k in range(64):
        tk = 0.36 + (k / 63.0) * 0.35
        theta = ((k % 9) - 4) * 0.16
        pt_w = _eval_gorgonopsia_spine_surface(master_spine, tk, theta, cap_scale=0.962)
        dvec = Vector((-0.80, math.sin(theta) * 0.26, 0.54))
        back_bristles.append((pt_w - torso_origin, dvec, 0.042 + (k % 3) * 0.007))
    _build_sparse_3d_hairs("Gorgo_BackBristles", back_bristles, mats["hair"], torso, radius=0.0019)

    _build_gorgonopsia_skull_and_jaw(head, jaw, mats)

    # 4 Sturdy Mammalian Quadrupedal Limbs (exact Smilodon order: 0=FL, 1=FR, 2=RL, 3=RR)
    leg_specs = [
        (0, ( 0.78,  0.33, 0.02),  1.0, True),   # Front Left  (Blender +Y)
        (1, ( 0.78, -0.33, 0.02), -1.0, True),   # Front Right (Blender -Y)
        (2, (-0.54,  0.29, 0.01),  1.0, False),  # Rear Left   (Blender +Y)
        (3, (-0.54, -0.29, 0.01), -1.0, False),  # Rear Right  (Blender -Y)
    ]
    for idx, pos, side, is_front in leg_specs:
        lbone = create_bone_node(f"Bone_Leg{idx}", pos, parent=hips)
        local_ground_z = -(1.55 + pos[2])
        if is_front:
            _build_gorgonopsia_forelimb(lbone, side, local_ground_z, mats, idx)
        else:
            _build_gorgonopsia_hindlimb(lbone, side, local_ground_z, mats, idx)

    out_path = os.path.join(OUT_DIR, "gorgonopsia.glb")
    export_fighter_glb(out_path)
    return out_path


if __name__ == "__main__":
    build_gorgonopsia_high_definition()
