"""
tools/blender/stegosaurus_sculptor.py
Museum-grade paleontological & portrait-faithful Blender 5.2 builder for the
Stegosaurus stenops GLB model (assets/models/fighters/stegosaurus.glb).

Anatomical & visual synthesis:
  - Silhouette, posture, high-arched pelvic back, steep shoulder slope, graceful
    S-curved neck, 17 staggered alternating asymmetric pentagonal/kite plates, tall
    columnar hindlimbs vs stout bowed forelimbs, and sweeping 4-spike thagomizer
    guided by the NHM "Sophie" Stegosaurus stenops scientific life reconstruction.
  - Head sculpt, sleek dark charcoal-umber keratinous beak, vertical-slit golden-amber
    eyes, cobblestone olive-moss & sandstone hide, lateral neck/shoulder osteoderms,
    and deeply vascularized terracotta-sienna plates matched to assets/portraits/stegosaurus.png.

Canonical Extinction Kombat 3D rig contract:
  Bone_Root -> Bone_Hips (Z=1.65) -> Bone_Torso -> Bone_Neck -> Bone_Head -> Bone_Jaw
                                                -> Special_Plates (dorsal plates)
                                                -> Bone_Tail0 -> Bone_Tail1 -> Bone_Tail2 -> Bone_Tail3 -> Special_Thagomizer
                                  -> Bone_Arm0, Bone_Arm1 (front legs, planted at Z=0)
                                  -> Bone_Leg0, Bone_Leg1 (hind legs, planted at Z=0)
"""

import math
import os
import bpy
import bmesh
from mathutils import Vector, Euler

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
    _make_trex_pbr_mat,
)
from pachyrhino_sculptor import (
    _build_horn_along_spline,
    _build_conical_horn,
)


def _tex(name):
    p = os.path.join(TEX_DIR, name)
    return p if os.path.exists(p) else None


def _eval_spine_surface(master_spline, t, theta, cap_scale=1.0):
    """
    Evaluates the sculpted Stegosaurus body cross-section at spline parameter t in [0, 1]
    (0 = tail tip, 1 = skull occiput) and circumferential angle theta (0 = dorsal crest,
    +/-pi/2 = lateral flank, pi = ventral belly/throat).
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

    is_torso = 0.36 < t < 0.72
    is_tail = t <= 0.36
    is_neck = t >= 0.72

    if is_torso:
        # Authentic laterally compressed deep herbivore barrel & softly hanging gut
        belly_flare = 1.0 + 0.09 * max(0.0, -cos_t) * math.sin(((t - 0.36) / 0.36) * math.pi)
        dorsal_pinch = 1.0 - 0.16 * (max(0.0, cos_t) ** 1.7)
        y_lat = sign_s * (abs_sin ** 0.88) * ry * belly_flare * dorsal_pinch
    elif is_tail:
        y_lat = sign_s * (abs_sin ** 0.92) * ry
    else:
        y_lat = sign_s * (abs_sin ** 0.90) * ry

    if cos_t >= 0.0:
        z_vert = (cos_t ** 0.92) * rz
    else:
        v_exp = 0.86 if is_torso else 0.94
        z_vert = -((-cos_t) ** v_exp) * rz

    # 1. Muscular dorsal neural spine ridge anchoring the alternating rows of plates
    if 0.10 < t < 0.94 and cos_t > 0.56 and abs_sin < 0.34:
        ridge_env = math.sin(((t - 0.10) / 0.84) * math.pi)
        arch = (1.0 - abs_sin / 0.34) ** 1.4
        z_vert += arch * 0.052 * rz * ridge_env * cap_scale

    # 2. Ribcage muscle undulation, broad pelvic iliac crest & anterior brisket
    if is_torso:
        torso_env = math.sin(((t - 0.36) / 0.36) * math.pi)
        if -0.25 < cos_t < 0.50 and abs_sin > 0.55:
            rib_wave = 0.5 + 0.5 * math.cos(t * math.pi * 42.0)
            y_lat += sign_s * 0.016 * ry * rib_wave * torso_env
        hip_env = math.exp(-(((t - 0.45) / 0.070) ** 2))
        if -0.10 < cos_t < 0.72 and abs_sin > 0.38:
            y_lat += sign_s * 0.095 * ry * hip_env * math.sin(((cos_t + 0.10) / 0.82) * math.pi)
        chest_env = math.exp(-(((t - 0.68) / 0.065) ** 2))
        if cos_t < -0.20:
            z_vert -= 0.07 * rz * chest_env * ((-cos_t - 0.20) / 0.80)

    # 3. Sculpted sternomastoid lateral neck bands & gular throat pleats (portrait detail!)
    if is_neck and t < 0.96:
        neck_env = math.sin(((t - 0.72) / 0.24) * math.pi)
        if -0.78 < cos_t < -0.15 and 0.35 < abs_sin < 0.88:
            cord = math.sin(((abs_sin - 0.35) / 0.53) * math.pi) * math.sin(((-cos_t - 0.15) / 0.63) * math.pi)
            y_lat += sign_s * 0.075 * ry * cord * neck_env
            z_vert -= 0.055 * rz * cord * neck_env
        if cos_t < -0.55:
            gular_fold = 1.0 + 0.042 * math.sin(t * math.pi * 36.0) * neck_env
            z_vert *= gular_fold

    # 4. Muscular M. caudofemoralis tail base swell seamlessly meeting the rear thighs
    if 0.22 < t < 0.44 and -0.55 < cos_t < 0.35 and abs_sin > 0.48:
        cf_env = math.sin(((t - 0.22) / 0.22) * math.pi)
        y_lat += sign_s * 0.075 * ry * cf_env

    return c_world + lat_axis * y_lat + up_axis * z_vert


def _eval_spine_point_and_normal(master_spline, t, theta):
    """Returns (world_pos, outward_unit_normal) on the continuous Stegosaurus body surface."""
    p = _eval_spine_surface(master_spline, t, theta)
    p_t1 = _eval_spine_surface(master_spline, min(0.995, t + 0.007), theta)
    p_t0 = _eval_spine_surface(master_spline, max(0.005, t - 0.007), theta)
    p_u1 = _eval_spine_surface(master_spline, t, theta + 0.03)
    p_u0 = _eval_spine_surface(master_spline, t, theta - 0.03)

    tan_v = p_t1 - p_t0
    tan_u = p_u1 - p_u0
    nrm = tan_u.cross(tan_v)
    if nrm.length < 1e-6:
        nrm = Vector((0.0, 0.0, 1.0))
    else:
        nrm.normalize()
    c_world, _ = master_spline.eval_at(t)
    if (p - c_world).dot(nrm) < 0.0:
        nrm = -nrm
    return p, nrm


def _build_continuous_spine_segment(
    name,
    master_spline,
    t_start,
    t_end,
    t_joint_back,
    t_joint_front,
    bone_world_pos,
    parent_bone,
    mat,
    segs_u=44,
    segs_v=28,
    v_uv_scale=2.5,
):
    """Lofts a C1-continuous slice [t_start, t_end] of the Stegosaurus master spine."""
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

        row_verts = []
        row_uvs = []
        for iu in range(segs_u):
            u = iu / segs_u
            theta = u * math.pi * 2.0
            world_pt = _eval_spine_surface(master_spline, t, theta, cap_scale=cap_scale)
            row_verts.append(world_pt - origin)
            row_uvs.append((u, t * v_uv_scale))

        rings_verts.append(row_verts)
        rings_uvs.append(row_uvs)

    bm = _build_grid_bmesh(rings_verts, rings_uvs, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    return attach_mesh_obj(bm, name, mat=mat, parent=parent_bone, local_pos=(0.0, 0.0, 0.0), subdiv=0)


def _plate_profile_x(v, width, style="dorsal"):
    """
    Returns (x_front, x_back) in local plate coordinates (+X = anterior, -X = posterior)
    for normalized height v in [0, 1], recreating the iconic asymmetric pentagonal/kite
    silhouette of Stegosaurus stenops ("Sophie") osteoderm plates:
      - Leading (+X) edge rises steeply & slightly convexly to a proud forward-biased apex.
      - Upper-posterior edge slopes broadly back to a distinct angular posterior corner,
        then descends cleanly to the embedded root.
    """
    if style == "cervical":
        # Compact slightly back-swept rounded-leaf cervical plates (Sophie & portrait)
        pts_f = [
            (0.00,  0.30),
            (0.32,  0.42),
            (0.68,  0.34),
            (0.92,  0.14),
            (1.00,  0.02),
        ]
        pts_b = [
            (0.00, -0.32),
            (0.35, -0.44),
            (0.72, -0.32),
            (0.92, -0.12),
            (1.00,  0.02),
        ]
    elif style == "caudal":
        # Asymmetric swept pentagonal-diamond caudal plates (Sophie tail plates!)
        pts_f = [
            (0.00,  0.30),
            (0.30,  0.42),
            (0.65,  0.34),
            (0.90,  0.14),
            (1.00,  0.04),
        ]
        pts_b = [
            (0.00, -0.32),
            (0.38, -0.56),
            (0.64, -0.46),
            (0.88, -0.18),
            (1.00,  0.04),
        ]
    else:
        # Iconic broad architectural Stegosaurus stenops pentagonal kite dorsal plate!
        # Notice anterior (+X) apex bias & prominent broad posterior corner (matches Sophie!)
        pts_f = [
            (0.00,  0.30),
            (0.28,  0.44),
            (0.60,  0.40),
            (0.86,  0.26),
            (1.00,  0.12),
        ]
        pts_b = [
            (0.00, -0.32),
            (0.30, -0.52),
            (0.56, -0.56),  # Distinct broad posterior pentagonal corner!
            (0.80, -0.28),
            (1.00,  0.12),
        ]

    # Smooth piecewise interpolation with subtle rounding at corners
    def _interp(pts, val):
        if val <= pts[0][0]:
            return pts[0][1]
        for i in range(len(pts) - 1):
            v0, x0 = pts[i]
            v1, x1 = pts[i + 1]
            if val <= v1:
                t = (val - v0) / max(1e-5, v1 - v0)
                # Blend linear (70%) + cosine smooth (30%) for crisp yet organic pentagonal angles
                ts = 0.70 * t + 0.30 * (0.5 * (1.0 - math.cos(t * math.pi)))
                return x0 + (x1 - x0) * ts
        return pts[-1][1]

    return _interp(pts_f, v) * width, _interp(pts_b, v) * width


def _build_stegosaurus_plate(
    name,
    width,
    height,
    thickness,
    mat_plate,
    mat_hide,
    parent,
    local_pos,
    rot,
    side_sign=1.0,
    style="dorsal",
    seed_phase=0.0,
):
    """
    Sculpts a high-resolution, organically curved, beveled asymmetric pentagonal
    Stegosaurus osteoderm plate with thickened basal pedestal, sculpted 3D radiating
    vascular relief, crisp keratin rim bevel, planar side UVs matching
    stegosaurus_plate_albedo/normal.png, and a tight flush dermal skin cuff at the root.
    """
    segs_v = 20
    segs_u_half = 14  # 28 perimeter verts per tier for crisp pentagonal silhouette
    segs_u = segs_u_half * 2

    rings_v = []
    rings_uv = []

    for iv in range(segs_v + 1):
        v = iv / segs_v
        # Deeply embedded root (-0.14*h) so plate emerges organically out of back musculature
        lz = -height * 0.14 + v * (height * 1.14)

        xf, xb = _plate_profile_x(v, width, style=style)
        if v > 0.96:
            tip_scale = max(0.06, (1.0 - v) / 0.04) ** 0.55
            xm = 0.5 * (xf + xb)
            xf = xm + (xf - xm) * tip_scale
            xb = xm + (xb - xm) * tip_scale

        # Subtle natural outward camber / organic bow
        camber_y = side_sign * 0.026 * height * math.sin(v * math.pi)
        v_thick = thickness * (1.0 - 0.74 * (v ** 1.15))
        if v > 0.92:
            v_thick *= max(0.20, math.cos(((v - 0.92) / 0.08) * math.pi * 0.45))

        row_v = []
        row_uv = []
        for iu in range(segs_u):
            if iu <= segs_u_half:
                face_s = iu / segs_u_half
                face_sign = 1.0
            else:
                face_s = 1.0 - (iu - segs_u_half) / segs_u_half
                face_sign = -1.0

            s_smooth = 0.5 * (1.0 - math.cos(face_s * math.pi))
            lx = xf + (xb - xf) * s_smooth

            edge_env = math.sin(s_smooth * math.pi)
            keel = 1.0 + 0.30 * ((edge_env ** 3.0) * (1.0 - 0.65 * v))
            rad_ang = math.atan2(s_smooth - 0.5, v + 0.12)
            vasc_relief = 1.0 + 0.11 * math.sin(rad_ang * 13.0 + seed_phase) * math.sin(v * math.pi) * edge_env

            half_y = max(0.002, v_thick * 0.5 * (edge_env ** 0.55) * keel * vasc_relief)
            rim_bevel = 0.0035 * width * (1.0 - 0.5 * v)
            if iu == 0 or iu == segs_u_half:
                ly = camber_y
            else:
                ly = camber_y + face_sign * (half_y + rim_bevel * (1.0 - edge_env))

            row_v.append(Vector((lx, ly, lz)))
            row_uv.append((0.04 + 0.92 * s_smooth, max(0.01, min(0.99, v))))

        rings_v.append(row_v)
        rings_uv.append(row_uv)

    bm = _build_grid_bmesh(rings_v, rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    plate_obj = attach_mesh_obj(bm, name, mat=mat_plate, parent=parent, local_pos=local_pos, subdiv=0)
    plate_obj.rotation_euler = rot

    # Subtle flush dermal olive-skin root welt hugging only the immediate basal junction
    # Seated slightly lower (-0.015) so steep sloping anterior back plates emerge with zero ledge!
    c_u, c_v = 20, 6
    c_rings_v, c_rings_uv = [], []
    rx_base = width * 0.27
    ry_base = max(thickness * 0.60, width * 0.068)
    collar_h = min(height * 0.055, 0.038)
    for iv in range(c_v + 1):
        fv = iv / c_v
        z_c = -collar_h * 1.25 + fv * collar_h * 1.75
        taper = math.cos(fv * math.pi * 0.48)
        flare = 1.0 + 0.20 * (1.0 - fv) ** 1.5
        r_v, r_uv = [], []
        for iu in range(c_u):
            fu = iu / c_u
            a = fu * math.pi * 2.0
            cx = math.cos(a) * rx_base * flare * (0.78 + 0.22 * taper)
            cy = math.sin(a) * ry_base * flare * (0.72 + 0.28 * taper)
            r_v.append(Vector((cx, cy, z_c)))
            r_uv.append((0.12 + 0.08 * math.sin(a), 0.15 + 0.16 * math.cos(a) + fv * 0.06))
        c_rings_v.append(r_v)
        c_rings_uv.append(r_uv)

    bm_col = _build_grid_bmesh(c_rings_v, c_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_col, f"{name}_Collar", mat=mat_hide, parent=plate_obj, local_pos=(0.0, 0.0, 0.0), subdiv=0)
    return plate_obj


def _build_dermal_tubercle(name, radius_x, radius_y, height, mat, parent, local_pos, rot=(0.0, 0.0, 0.0)):
    """Sculpts a smooth convex rounded oval dermal osteoderm nodule (matching portrait)."""
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")
    segs = 12
    tiers = [
        (1.00, -height * 0.30),
        (0.96,  height * 0.12),
        (0.80,  height * 0.56),
        (0.50,  height * 0.88),
    ]
    rings = []
    for rad_s, zh in tiers:
        row = []
        for i in range(segs):
            a = (i / segs) * math.pi * 2.0
            row.append(bm.verts.new((math.cos(a) * radius_x * rad_s, math.sin(a) * radius_y * rad_s, zh)))
        rings.append(row)
    apex = bm.verts.new((0.0, 0.0, height))
    base = bm.verts.new((0.0, 0.0, -height * 0.40))

    for t_i in range(len(rings) - 1):
        r0, r1 = rings[t_i], rings[t_i + 1]
        for i in range(segs):
            j = (i + 1) % segs
            f = bm.faces.new((r0[i], r0[j], r1[j], r1[i]))
            for lp in f.loops:
                lp[uv_layer].uv = (0.16 + lp.vert.co.x * 1.4, 0.50 + lp.vert.co.y * 1.4)
    for i in range(segs):
        j = (i + 1) % segs
        ft = bm.faces.new((rings[-1][i], rings[-1][j], apex))
        for lp in ft.loops:
            lp[uv_layer].uv = (0.20, 0.50)
        fb = bm.faces.new((rings[0][j], rings[0][i], base))
        for lp in fb.loops:
            lp[uv_layer].uv = (0.10, 0.50)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    obj = attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=local_pos, subdiv=0)
    obj.rotation_euler = rot
    return obj


def _build_curved_eyelid_arc(name, radius_x, radius_z, y_out, thickness, is_upper, side, mat, parent):
    """Builds a smooth continuous almond-shaped scaly eyelid arc wrapping both eye corners."""
    n_v = 16
    n_u = 10
    rings_v, rings_uv = [], []
    z_sign = 1.0 if is_upper else -1.0

    for iv in range(n_v + 1):
        t = iv / n_v
        ang_arc = (t - 0.5) * math.pi * 1.06  # Slightly past +/-90 deg to meet at eye canthi
        cx = math.sin(ang_arc) * radius_x
        cz = z_sign * (0.004 + math.cos(ang_arc) * radius_z)
        cy = side * (y_out * (0.55 + 0.45 * math.cos(ang_arc)))
        # Taper smoothly into the orbital skin at anterior & posterior corners
        env = max(0.22, math.sin(t * math.pi) ** 0.55)
        r_tube = thickness * env

        # Tangent along arc
        tx = math.cos(ang_arc) * radius_x
        tz = -z_sign * math.sin(ang_arc) * radius_z
        tan = Vector((tx, 0.0, tz)).normalized()
        out_y = Vector((0.0, side, 0.0))
        rad_dir = tan.cross(out_y).normalized()

        rv, ruv = [], []
        for iu in range(n_u):
            u = iu / n_u
            a = u * math.pi * 2.0
            pt = Vector((cx, cy, cz)) + out_y * (math.sin(a) * r_tube * 0.85) + rad_dir * (math.cos(a) * r_tube)
            rv.append(pt)
            ruv.append((0.18 + u * 0.16, 0.35 + t * 0.25))
        rings_v.append(rv)
        rings_uv.append(ruv)

    bm = _build_grid_bmesh(rings_v, rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    return attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=(0.0, 0.0, 0.0), subdiv=0)


def _build_sculpted_skull_and_jaw(head_bone, jaw_bone, mats):
    """
    Sculpts the portrait-faithful, paleontologically accurate Stegosaurus stenops skull:
      - Narrow, elongated ornithischian cranium (52x60) with expressive brow ridge,
        deep orbital cavities, dark recessed nostrils, buccal cheek pouch, and
        cobblestone cranial scales.
      - Sleek, flush-fitting dark charcoal-umber keratinous cropping beak (matching portrait!).
      - Fierce golden-amber reptile eyes with sharp vertical slit pupils & continuous eyelids.
      - Articulated lower mandible (Bone_Jaw), tucked lower predentary beak, and tongue.
    """
    pitch_q = Euler((0.0, 0.15, 0.0), "XYZ").to_matrix().to_4x4()

    # (x, top_z, bot_z, half_width)
    slices = [
        (-0.14,  0.105, -0.080, 0.003),  # Closed occipital cap tucked smoothly inside neck
        (-0.02,  0.178, -0.112, 0.154),  # Occiput & quadrate back of head
        ( 0.12,  0.192, -0.122, 0.166),  # Temporal / jugal widest skull vault
        ( 0.26,  0.184, -0.112, 0.150),  # Supraorbital brow / orbital region
        ( 0.42,  0.156, -0.098, 0.122),  # Elongated narrow mid-snout & buccal cheek
        ( 0.56,  0.122, -0.088, 0.096),  # Anterior snout & narial fossa
        ( 0.66,  0.084, -0.084, 0.072),  # Smooth premaxilla taper into keratin beak collar
        ( 0.72,  0.036, -0.080, 0.036),  # Rostral bone core tucked safely inside beak sheath
        ( 0.75,  0.004, -0.072, 0.003),  # Closed internal core cap
    ]
    top_sp = CatmullRomSpline3D([(s[0], s[3], s[1]) for s in slices])
    bot_sp = CatmullRomSpline3D([(s[0], s[3], s[2]) for s in slices])

    radial_steps = 52
    length_steps = 60
    skull_v, skull_uv = [], []

    for iy in range(length_steps + 1):
        v = iy / length_steps
        p_t, _ = top_sp.eval_at(v)
        p_b, _ = bot_sp.eval_at(v)
        fx = p_t.x
        half_w = max(0.001, p_t.y)
        top_z = p_t.z
        bot_z = p_b.z

        lip_curve = -0.009 * math.sin(v * math.pi * 1.4) if (0.35 < v < 0.86) else 0.0
        bot_z += lip_curve

        brow_prof = math.exp(-(((v - 0.41) / 0.12) ** 2))
        orbit_prof = math.exp(-(((v - 0.42) / 0.085) ** 2))
        cheek_prof = math.exp(-(((v - 0.58) / 0.13) ** 2))
        nasal_ridge = math.sin(((v - 0.22) / 0.64) * math.pi) if (0.22 < v < 0.86) else 0.0

        row_v, row_uv = [], []
        for ix in range(radial_steps):
            u = ix / radial_steps
            ang = u * math.pi * 2.0
            s = math.sin(ang)
            c = math.cos(ang)
            abs_s = abs(s)
            sign_s = 1.0 if s >= 0.0 else -1.0

            ly = sign_s * (abs_s ** 0.78) * half_w
            mid_z = 0.5 * (top_z + bot_z)
            half_h = max(0.005, 0.5 * (top_z - bot_z))

            if c >= 0.0:
                lz = mid_z + half_h * (c ** 0.72)
                if nasal_ridge > 0.0 and c > 0.56:
                    cobble = 0.5 + 0.5 * math.cos(v * math.pi * 24.0) * math.cos(abs_s * math.pi * 6.0)
                    lz += nasal_ridge * cobble * 0.010 * ((c - 0.56) / 0.44)
                if brow_prof > 0.01 and 0.16 < c < 0.84:
                    arch = math.sin(((c - 0.16) / 0.68) * math.pi)
                    lz += brow_prof * arch * 0.032
                    ly += sign_s * brow_prof * arch * 0.026
            else:
                lz = mid_z - half_h * ((-c) ** 0.82)

            # Deep recessed bony orbital socket
            if orbit_prof > 0.01 and -0.22 < c < 0.34:
                orb_d = math.sin(((c + 0.22) / 0.56) * math.pi)
                ly *= (1.0 - 0.32 * orbit_prof * orb_d)

            if orbit_prof > 0.01 and -0.52 < c <= -0.18:
                ly += sign_s * orbit_prof * 0.014 * math.sin(((-c - 0.18) / 0.34) * math.pi)
            if cheek_prof > 0.01 and -0.58 < c < 0.10:
                ch_arch = math.sin(((c + 0.58) / 0.68) * math.pi)
                ly += sign_s * cheek_prof * ch_arch * 0.012

            # Deep sculpted oval external naris (nostril) cleanly in front of cheek & behind beak (v=0.67 -> x~0.585)
            naris_u = (v - 0.67) / 0.036
            naris_v = (c - 0.28) / 0.17
            naris_d2 = naris_u * naris_u + naris_v * naris_v
            if naris_d2 < 1.0:
                n_dep = (1.0 - naris_d2) ** 1.3
                ly *= (1.0 - 0.45 * n_dep)
            elif 1.0 <= naris_d2 < 2.1:
                hood = math.sin(((naris_d2 - 1.0) / 1.1) * math.pi)
                ly += sign_s * 0.011 * hood
                lz += 0.005 * hood * (1.0 if naris_v > 0 else -0.3)

            row_v.append(pitch_q @ Vector((fx, ly, lz)))
            row_uv.append((u, v * 1.5))

        skull_v.append(row_v)
        skull_uv.append(row_uv)

    bm_skull = _build_grid_bmesh(skull_v, skull_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_skull, "Stego_UpperCranium", mat=mats["cranium"], parent=head_bone)

    # Dark recessed oval nostril openings cleanly seated inside the narial fossa (portrait detail!)
    for side in (-1, 1):
        s_tag = "L" if side > 0 else "R"
        bm_n = bmesh.new()
        bmesh.ops.create_uvsphere(bm_n, u_segments=12, v_segments=10, radius=0.014)
        n_obj = attach_mesh_obj(
            bm_n, f"Stego_Nostril_{s_tag}", mat=mats["pupil"], parent=head_bone,
            local_pos=pitch_q @ Vector((0.586, side * 0.068, 0.050)),
        )
        n_obj.scale = (1.50, 0.48, 0.72)
        n_obj.rotation_euler = (0.0, 0.22, -side * 0.26)

    # 2. Compact, rounded turtle-like dark keratinous UPPER BEAK (faithful to assets/portraits/stegosaurus.png!)
    beak_slices = [
        (0.638,  0.074, -0.072, 0.062),  # Tucked cleanly inside snout premaxilla border
        (0.676,  0.078, -0.082, 0.073),  # Flush emerging rostral sheath collar
        (0.724,  0.052, -0.086, 0.064),  # Compact rounded keratin front wall
        (0.762,  0.010, -0.090, 0.044),  # Gently curved blunt herbivore cropping rim
        (0.778, -0.032, -0.090, 0.022),  # Rounded blunt tip (not pointy eagle hook!)
        (0.772, -0.068, -0.076, 0.001),  # Solid closed convex cropping tomium
    ]
    b_top = CatmullRomSpline3D([(b[0], b[3], b[1]) for b in beak_slices])
    b_bot = CatmullRomSpline3D([(b[0], b[3], b[2]) for b in beak_slices])
    bu, bv = 26, 22
    br_v, br_uv = [], []
    for iv in range(bv + 1):
        v = iv / bv
        pt, _ = b_top.eval_at(v)
        pb, _ = b_bot.eval_at(v)
        bx = pt.x
        bhw = max(0.002, pt.y)
        bmz = 0.5 * (pt.z + pb.z)
        bhh = max(0.002, 0.5 * (pt.z - pb.z))
        rv, ruv = [], []
        for iu in range(bu):
            u = iu / bu
            a = u * math.pi * 2.0
            sa, ca = math.sin(a), math.cos(a)
            ly = math.copysign(1.0, sa) * (abs(sa) ** 0.84) * bhw
            lz = bmz + (bhh * (ca ** 0.72) if ca >= 0.0 else -bhh * ((-ca) ** 0.80))
            if ca > 0.55 and abs(sa) < 0.35:
                lz += 0.005 * (1.0 - abs(sa) / 0.35) * math.sin(v * math.pi)
            rv.append(pitch_q @ Vector((bx, ly, lz)))
            ruv.append((u, v * 0.94))
        br_v.append(rv)
        br_uv.append(ruv)
    bm_beak = _build_grid_bmesh(br_v, br_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_beak, "Stego_UpperBeak", mat=mats["beak"], parent=head_bone)

    # 3. Fierce golden-amber reptile eyes with sharp vertical slit pupils & continuous eyelids
    for side in (-1, 1):
        s_tag = "L" if side > 0 else "R"
        eye_center = pitch_q @ Vector((0.252, side * 0.118, 0.056))
        eye_grp = create_bone_node(f"Stego_EyeSocket_{s_tag}", eye_center, parent=head_bone)
        eye_grp.rotation_euler = (-0.04, 0.06, -side * 0.24)

        bm_sh = bmesh.new()
        bmesh.ops.create_uvsphere(bm_sh, u_segments=14, v_segments=12, radius=0.036)
        sh_obj = attach_mesh_obj(
            bm_sh, f"Stego_OrbitShadow_{s_tag}", mat=mats["pupil"], parent=eye_grp,
            local_pos=(0.0, -side * 0.014, 0.0),
        )
        sh_obj.scale = (0.94, 0.60, 0.90)

        bm_ir = bmesh.new()
        uv_ir = bm_ir.loops.layers.uv.new("UVMap")
        bmesh.ops.create_uvsphere(bm_ir, u_segments=20, v_segments=16, radius=0.034)
        for f in bm_ir.faces:
            for lp in f.loops:
                co = lp.vert.co / 0.034
                lp[uv_ir].uv = (0.5 + co.x * 0.46, 0.5 + co.z * 0.46)
        bmesh.ops.recalc_face_normals(bm_ir, faces=bm_ir.faces)
        ir_obj = attach_mesh_obj(
            bm_ir, f"Stego_Eye_{s_tag}", mat=mats["iris"], parent=eye_grp,
            local_pos=(0.0, side * 0.007, 0.0),
        )
        ir_obj.scale = (1.02, 0.88, 1.0)

        # Portrait-faithful sharp vertical reptilian slit pupil
        bm_pu = bmesh.new()
        bmesh.ops.create_uvsphere(bm_pu, u_segments=14, v_segments=12, radius=0.021)
        pu_obj = attach_mesh_obj(
            bm_pu, f"Stego_Eye_{s_tag}_Pupil", mat=mats["pupil"], parent=eye_grp,
            local_pos=(0.002, side * 0.031, 0.0),
        )
        pu_obj.scale = (0.28, 0.46, 0.94)

        bm_cl = bmesh.new()
        bmesh.ops.create_uvsphere(bm_cl, u_segments=8, v_segments=8, radius=0.0048)
        attach_mesh_obj(
            bm_cl, f"Stego_EyeCatchlight_{s_tag}", mat=mats["catchlight"], parent=eye_grp,
            local_pos=(0.008, side * 0.037, 0.010),
        )

        # Continuous almond-shaped scaly eyelids joining smoothly at anterior & posterior canthi!
        _build_curved_eyelid_arc(
            f"Stego_UpperEyelid_{s_tag}",
            radius_x=0.044, radius_z=0.025, y_out=0.024, thickness=0.011,
            is_upper=True, side=side, mat=mats["cranium"], parent=eye_grp,
        )
        _build_curved_eyelid_arc(
            f"Stego_LowerEyelid_{s_tag}",
            radius_x=0.042, radius_z=0.022, y_out=0.022, thickness=0.0095,
            is_upper=False, side=side, mat=mats["cranium"], parent=eye_grp,
        )

    # 4. Articulated Lower Mandible, Neatly Tucked Lower Keratin Beak, & Tongue (Bone_Jaw)
    jaw_q = Euler((0.0, 0.14, 0.0), "XYZ").to_matrix().to_4x4()
    m_slices = [
        (-0.08,  0.020, -0.045, 0.002),
        ( 0.00,  0.050, -0.100, 0.130),  # Broad jaw ramus & pebbled cheek jowl
        ( 0.16,  0.044, -0.106, 0.122),  # Muscular chin/cheek region
        ( 0.34,  0.028, -0.090, 0.092),  # Slender tapering dentary
        ( 0.48,  0.022, -0.066, 0.064),  # Pre-beak symphysis
        ( 0.56,  0.020, -0.042, 0.040),  # Core inside lower beak
        ( 0.60,  0.014, -0.018, 0.002),
    ]
    m_bot = CatmullRomSpline3D([(s[0], s[3], s[2]) for s in m_slices])
    m_top = CatmullRomSpline3D([(s[0], s[3], s[1]) for s in m_slices])
    mr_u, mr_v = 34, 36
    m_rv, m_ruv = [], []
    for iy in range(mr_v + 1):
        v = iy / mr_v
        pb, _ = m_bot.eval_at(v)
        pt, _ = m_top.eval_at(v)
        hw = max(0.001, pb.y)
        rv, ruv = [], []
        for ix in range(mr_u):
            u = ix / mr_u
            a = u * math.pi * 2.0
            sa, ca = math.sin(a), math.cos(a)
            ly = math.copysign(1.0, sa) * (abs(sa) ** 0.78) * hw
            if ca <= 0.0:
                lz = pb.z * (abs(ca) ** 0.72)
            else:
                rim = abs(sa) ** 1.35
                lz = pt.z * rim + (pt.z - 0.028 * math.sin(v * math.pi)) * (1.0 - rim)
            rv.append(jaw_q @ Vector((pb.x, ly, lz)))
            ruv.append((u, v * 1.2))
        m_rv.append(rv)
        m_ruv.append(ruv)
    bm_mand = _build_grid_bmesh(m_rv, m_ruv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_mand, "Stego_Mandible", mat=mats["cranium"], parent=jaw_bone)

    # Compact dark keratinous predentary lower beak nested cleanly inside the upper beak!
    lb_pts = [
        jaw_q @ Vector((0.49, 0.0, -0.036)),
        jaw_q @ Vector((0.55, 0.0, -0.024)),
        jaw_q @ Vector((0.59, 0.0, -0.008)),
        jaw_q @ Vector((0.612, 0.0, 0.008)),
    ]
    _build_horn_along_spline(
        "Stego_LowerBeak", lb_pts, base_rx=0.046, base_rz=0.026, mat=mats["beak"], parent=jaw_bone,
        segs_u=16, segs_v=14, tip_taper=1.22,
    )

    # Fleshy tongue nestled inside lower jaw
    t_u, t_v = 16, 18
    t_rv, t_ruv = [], []
    for iy in range(t_v + 1):
        v = iy / t_v
        tx = 0.08 + v * 0.38
        tz = -0.01 + math.sin(v * math.pi * 0.85) * 0.020
        tw = 0.052 * math.sin(v * math.pi) ** 0.65
        th = 0.020 * math.sin(v * math.pi) ** 0.65
        rv, ruv = [], []
        for ix in range(t_u):
            u = ix / t_u
            a = u * math.pi * 2.0
            rv.append(jaw_q @ Vector((tx, math.sin(a) * tw, tz + math.cos(a) * th)))
            ruv.append((u, v))
        t_rv.append(rv)
        t_ruv.append(ruv)
    bm_tng = _build_grid_bmesh(t_rv, t_ruv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_tng, "Stego_Tongue", mat=mats["mucosa"], parent=jaw_bone)


def _build_stegosaurus_limb_tube(
    name,
    ctrl_tuples,
    side,
    mat,
    parent,
    radial_segs=30,
    height_segs=42,
    v_uv_range=(0.20, 1.35),
    taper_start=True,
    taper_end=False,
):
    """
    Lofts a muscular Stegosaurus columnar limb with anatomically countershaded UV mapping:
      - Outer lateral, anterior, and posterior faces sample the rich olive-moss flank zone
        (u in [0.10, 0.32]), blending seamlessly with the torso hide!
      - Only the inner medial face (facing the belly) warms subtly toward sandstone-ochre
        (u -> 0.44), eliminating the harsh light-tan thigh seam!
      - Smooth ankle/wrist transition without distal pinching into the elephantine footpad.
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
            cap_scale = max(0.02, math.sin((v / 0.09) * (math.pi * 0.5)))
        elif taper_end and v > 0.94:
            cap_scale = max(0.02, math.sin(((1.0 - v) / 0.06) * (math.pi * 0.5)))

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
            lat_axis = q_rot @ lat_axis
            lat_axis = lat_axis - tangent * lat_axis.dot(tangent)
            if lat_axis.length < 1e-6:
                lat_axis = Vector((0.0, 1.0, 0.0))
            lat_axis.normalize()
        sag_axis = tangent.cross(lat_axis).normalized()
        prev_tangent = tangent.copy()

        # Subtle skin fold wrinkles near knee/elbow & wrist/ankle!
        fold_mod = 1.0
        if 0.36 < v < 0.54:
            fold_mod += 0.020 * math.sin((v - 0.36) * math.pi * 22.0) * math.sin(((v - 0.36) / 0.18) * math.pi)
        elif 0.78 < v < 0.94:
            fold_mod += 0.022 * math.sin((v - 0.78) * math.pi * 26.0) * math.sin(((v - 0.78) / 0.16) * math.pi)

        v_uv = v_uv_range[0] + v * (v_uv_range[1] - v_uv_range[0])
        row_v = []
        row_uv = []
        for ix in range(radial_segs):
            u = ix / radial_segs
            ang = u * math.pi * 2.0
            sin_a = math.sin(ang)
            cos_a = math.cos(ang)

            pt = c_pt + lat_axis * (sin_a * ry * fold_mod) + sag_axis * (cos_a * rz * fold_mod + sag_off)
            row_v.append(pt)

            # Seamless continuous periodic UV mapping (zero closing-quad jump / zero stripe!):
            # Outer lateral face (sin_a * side = +1) -> u = 0.08 (rich dorsal/mid olive-moss)
            # Anterior / posterior faces (sin_a = 0) -> u = 0.24 (mid olive-moss flanks)
            # Inner medial face (sin_a * side = -1)  -> u = 0.40 (warm inner countershading)
            medial_fac = 0.5 - 0.5 * (sin_a * side)
            u_shade = 0.08 + 0.32 * medial_fac
            row_uv.append((u_shade, v_uv))

        rings_verts.append(row_v)
        rings_uvs.append(row_uv)

    # Build closed periodic mesh directly so closing quad connects u[n-1] -> u[0] seamlessly
    # (never forcing u=1.0 across the closing strip!)
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")
    n_v = len(rings_verts)
    n_u = len(rings_verts[0])
    bm_rings = [[bm.verts.new(co) for co in rings_verts[iv]] for iv in range(n_v)]

    for iv in range(n_v - 1):
        r0, r1 = bm_rings[iv], bm_rings[iv + 1]
        uv0, uv1 = rings_uvs[iv], rings_uvs[iv + 1]
        for iu in range(n_u):
            iu_next = (iu + 1) % n_u
            v00, v01, v11, v10 = r0[iu], r0[iu_next], r1[iu_next], r1[iu]
            if (v00.co - v01.co).length < 1e-6 and (v10.co - v11.co).length < 1e-6:
                continue
            try:
                f = bm.faces.new((v00, v01, v11, v10))
                for lp, uvc in zip(f.loops, (uv0[iu], uv0[iu_next], uv1[iu_next], uv1[iu])):
                    lp[uv_layer].uv = uvc
            except ValueError:
                pass

    try:
        bm.faces.new(bm_rings[0][::-1])
    except ValueError:
        pass
    try:
        bm.faces.new(bm_rings[-1])
    except ValueError:
        pass

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=(0.0, 0.0, 0.0), subdiv=0)


def _build_stegosaurus_foot(leg_bone, foot_center, foot_r, side, is_front, mats, prefix):
    """
    Sculpts a broad, elephantine columnar Stegosaurus foot blending seamlessly with the
    ankle (zero pinch!) and resting flush at world Z=0:
      - Front manus: 5 short blunt hoofed toes arranged in a semicircular columnar pad.
      - Rear pes: 3 broad heavy blunt hoof-like toes on a stout fleshy heel pad.
    """
    fx, fy, fz = foot_center
    pad_rz = 0.105 if not is_front else 0.092
    pad_z = fz + pad_rz

    _build_muscular_limb_segment(
        f"{prefix}_FootPad",
        (fx - foot_r * 0.62, fy, pad_z),
        (fx + foot_r * 0.72, fy, pad_z),
        lambda t, ang: (
            foot_r * (0.96 + 0.14 * math.sin(t * math.pi)),
            pad_rz * (1.0 - 0.14 * max(0.0, math.cos(ang)) * t),
            0.0,
            0.0,
        ),
        mats["hide"],
        leg_bone,
        prox_overlap=0.14, dist_overlap=0.14, radial_segs=20, height_segs=12,
        v_uv_range=(0.15, 0.45),
    )

    if is_front:
        toe_specs = [
            (-0.80, 0.10, 0.044, 0.075),
            (-0.36, 0.13, 0.050, 0.090),
            ( 0.02, 0.14, 0.052, 0.095),
            ( 0.40, 0.12, 0.048, 0.085),
            ( 0.80, 0.09, 0.042, 0.070),
        ]
    else:
        toe_specs = [
            (-0.44, 0.16, 0.064, 0.118),
            ( 0.00, 0.18, 0.070, 0.130),
            ( 0.44, 0.15, 0.062, 0.112),
        ]

    for ti, (yaw, t_len, t_rad, hoof_len) in enumerate(toe_specs):
        ang = yaw + side * 0.05
        dx = math.cos(ang)
        dy = math.sin(ang)
        t_start = Vector((fx + dx * (foot_r * 0.34), fy + dy * (foot_r * 0.42), fz + 0.070))
        t_end = Vector((fx + dx * (foot_r * 0.34 + t_len), fy + dy * (foot_r * 0.42 + t_len * 0.86), fz + 0.052))
        _build_muscular_limb_segment(
            f"{prefix}_Toe{ti}",
            t_start,
            t_end,
            lambda t, a, r=t_rad: (r * (1.0 - 0.16 * t), r * 0.84 * (1.0 - 0.14 * t), 0.0, 0.0),
            mats["hide"],
            leg_bone,
            prox_overlap=0.22, dist_overlap=0.06, radial_segs=12, height_segs=8,
            v_uv_range=(0.14, 0.28),
        )
        _build_conical_horn(
            f"{prefix}_Hoof{ti}",
            length=hoof_len,
            base_r=t_rad * 0.78,
            direction=(dx * 0.88, dy * 0.88, -0.46),
            curve_offset=(0.006 * dx, 0.006 * dy, -0.005),
            mat=mats["spike"],
            parent=leg_bone,
            local_pos=t_end + Vector((0.0, 0.0, 0.006)),
            segs_u=12,
            segs_v=8,
            flat_y=1.20,
            flute_amp=0.03,
        )


def _build_forelimb(arm_bone, side, local_ground_z, mats, idx):
    """
    Sculpts a stout, muscular Stegosaurus forelimb (Bone_Arm0/1):
    broad shoulder seamlessly nestled into low chest, gentle reptilian elbow bow,
    columnar forearm flaring smoothly into the 5-toed elephantine manus at Z=0.
    """
    ctrl = [
        ( 0.00, -side * 0.30,  0.34, 0.27, 0.35,  0.00),  # Shoulder deeply nestled into thorax
        (-0.02, -side * 0.06, -0.02, 0.24, 0.29,  0.00),  # Muscular deltoid/triceps mass
        (-0.08,  side * 0.08, -0.44, 0.19, 0.22, -0.01),  # Gently bowed reptilian elbow
        (-0.01,  side * 0.07, -0.78, 0.17, 0.185, 0.01),  # Stout muscular forearm
        ( 0.05,  side * 0.06, local_ground_z + 0.24, 0.165, 0.165, 0.01),  # Columnar wrist
        ( 0.07,  side * 0.06, local_ground_z + 0.05, 0.185, 0.185, 0.00),  # Seamless flare into pad
    ]
    _build_stegosaurus_limb_tube(
        f"Stego_Forelimb_{idx}",
        ctrl,
        side,
        mats["hide"],
        arm_bone,
        radial_segs=28,
        height_segs=38,
        v_uv_range=(0.15, 0.72),
        taper_start=True,
        taper_end=False,
    )
    _build_stegosaurus_foot(
        arm_bone,
        (0.09, side * 0.06, local_ground_z),
        foot_r=0.195,
        side=side,
        is_front=True,
        mats=mats,
        prefix=f"Bone_Arm{idx}",
    )


def _build_hindlimb(leg_bone, side, local_ground_z, mats, idx):
    """
    Sculpts a tall, dignified, pillar-like Stegosaurus hindlimb (Bone_Leg0/1) matching
    Sophie's towering columnar hindquarters:
    massive thigh flowing smoothly out of the high hip/pelvis, gentle natural knee,
    strong calf, columnar ankle flaring cleanly into the 3-toed blunt-hoofed pes at Z=0.
    """
    ctrl = [
        ( 0.02, -side * 0.32,  0.40, 0.34, 0.48,  0.00),  # High iliac socket deep in pelvis
        ( 0.03, -side * 0.06, -0.06, 0.31, 0.42,  0.02),  # Broad muscular thigh & buttock
        ( 0.08,  side * 0.04, -0.58, 0.23, 0.28,  0.02),  # Subtle natural anatomical knee
        (-0.01,  side * 0.05, -1.04, 0.20, 0.23, -0.01),  # Muscular gastrocnemius calf
        ( 0.00,  side * 0.05, local_ground_z + 0.26, 0.180, 0.185, 0.00),  # Columnar hock/ankle
        ( 0.03,  side * 0.05, local_ground_z + 0.05, 0.205, 0.205, 0.00),  # Seamless flare into pad
    ]
    _build_stegosaurus_limb_tube(
        f"Stego_Hindlimb_{idx}",
        ctrl,
        side,
        mats["hide"],
        leg_bone,
        radial_segs=30,
        height_segs=42,
        v_uv_range=(0.15, 0.80),
        taper_start=True,
        taper_end=False,
    )
    _build_stegosaurus_foot(
        leg_bone,
        (0.06, side * 0.05, local_ground_z),
        foot_r=0.215,
        side=side,
        is_front=False,
        mats=mats,
        prefix=f"Bone_Leg{idx}",
    )


def _add_all_plates_and_osteoderms(master_spine, bone_info, plates_group, neck_bone, torso_bone, mats):
    """
    Mounts 17 authentic staggered alternating asymmetric pentagonal Stegosaurus stenops
    dermal plates from behind the skull down to the distal tail, rooted precisely on the
    evaluated dorsal spine surface and parented to the exact moving bone beneath each plate!
    Also adds portrait-faithful smooth rounded dermal osteoderm nodules on neck & flanks.
    """
    # (t_spline, width, height, thickness, style, pitch_bias, roll_bias)
    # 17 Staggered alternating plates calibrated directly to the NHM "Sophie" reconstruction!
    plate_specs = [
        # 4 Compact rounded cervical plates along the graceful S-curved neck
        (0.910, 0.15, 0.20, 0.040, "cervical",  0.14, 0.09),
        (0.870, 0.20, 0.27, 0.046, "cervical",  0.12, 0.11),
        (0.828, 0.26, 0.35, 0.054, "cervical",  0.10, 0.12),
        (0.782, 0.35, 0.46, 0.062, "cervical",  0.08, 0.13),

        # 8 Monumental broad asymmetric pentagonal dorsal, lumbar & sacral plates!
        (0.728, 0.48, 0.60, 0.072, "dorsal",    0.04, 0.13),
        (0.674, 0.62, 0.76, 0.082, "dorsal",    0.01, 0.13),
        (0.618, 0.76, 0.90, 0.090, "dorsal",   -0.02, 0.12),
        (0.562, 0.88, 1.02, 0.096, "dorsal",   -0.04, 0.11),
        (0.506, 0.94, 1.08, 0.102, "dorsal",   -0.06, 0.10),  # Monumental peak pelvic plate!
        (0.452, 0.90, 1.02, 0.098, "dorsal",   -0.09, 0.10),  # Second giant hip plate!
        (0.398, 0.76, 0.88, 0.088, "dorsal",   -0.12, 0.11),  # Sacral plate
        (0.346, 0.62, 0.74, 0.078, "caudal",   -0.16, 0.12),  # Tail-root plate

        # 5 Swept-back tapering caudal plates running gracefully down the balancing tail!
        (0.298, 0.50, 0.60, 0.068, "caudal",   -0.18, 0.12),
        (0.252, 0.40, 0.48, 0.058, "caudal",   -0.20, 0.12),
        (0.208, 0.32, 0.38, 0.050, "caudal",   -0.22, 0.11),
        (0.168, 0.24, 0.29, 0.042, "caudal",   -0.24, 0.10),
        (0.130, 0.18, 0.21, 0.036, "caudal",   -0.26, 0.09),
    ]

    for idx, (t_sp, pw, ph, pth, pstyle, pitch_bias, roll_bias) in enumerate(plate_specs):
        side = 1.0 if (idx % 2 == 0) else -1.0
        lat_theta = side * (0.17 if pstyle == "dorsal" else 0.14)
        world_p, world_nrm = _eval_spine_point_and_normal(master_spine, t_sp, lat_theta)

        owner_bone, owner_world = plates_group, bone_info["torso"][1]
        if t_sp >= bone_info["t_j_neck"]:
            owner_bone, owner_world = neck_bone, bone_info["neck"][1]
        elif t_sp >= bone_info["t_j_tail0"]:
            owner_bone, owner_world = plates_group, bone_info["torso"][1]
        elif t_sp >= bone_info["t_j_tail1"]:
            owner_bone, owner_world = bone_info["tail0"]
        elif t_sp >= bone_info["t_j_tail2"]:
            owner_bone, owner_world = bone_info["tail1"]
        elif t_sp >= bone_info["t_j_tail3"]:
            owner_bone, owner_world = bone_info["tail2"]
        else:
            owner_bone, owner_world = bone_info["tail3"]

        # Seat deeply into the dorsal musculature so root integrates cleanly
        local_p = world_p - Vector(owner_world) - world_nrm * 0.040

        tan = master_spine.tangent_at(t_sp)
        slope_pitch = -math.atan2(tan.z, max(1e-4, abs(tan.x))) * 0.36
        rot = (side * roll_bias, slope_pitch + pitch_bias, side * 0.03)

        _build_stegosaurus_plate(
            f"Stego_Plate_{idx}",
            width=pw,
            height=ph,
            thickness=pth,
            mat_plate=mats["plate"],
            mat_hide=mats["hide"],
            parent=owner_bone,
            local_pos=local_p,
            rot=rot,
            side_sign=side,
            style=pstyle,
            seed_phase=idx * 1.17,
        )

    # Portrait signature: smooth rounded rows of small olive-ochre dermal osteoderm domes
    # running along both sides of the neck, shoulders, and upper flanks!
    neck_world = Vector(bone_info["neck"][1])
    torso_world = Vector(bone_info["torso"][1])
    for side in (-1, 1):
        s_tag = "L" if side > 0 else "R"
        for ni, nt in enumerate((0.918, 0.888, 0.858, 0.828, 0.798, 0.768, 0.738)):
            wp, wn = _eval_spine_point_and_normal(master_spine, nt, side * 0.78)
            owner = neck_bone if nt >= bone_info["t_j_neck"] else torso_bone
            orig = neck_world if nt >= bone_info["t_j_neck"] else torso_world
            q = Vector((0.0, 0.0, 1.0)).rotation_difference(wn)
            _build_dermal_tubercle(
                f"Stego_NeckTubercle_{s_tag}_{ni}",
                radius_x=0.032 + 0.003 * ni,
                radius_y=0.022 + 0.002 * ni,
                height=0.017 + 0.0015 * ni,
                mat=mats["hide"],
                parent=owner,
                local_pos=wp - orig - wn * 0.005,
                rot=q.to_euler("XYZ"),
            )

        for fi, (ft, fth, fr) in enumerate((
            (0.68, 0.92, 0.036),
            (0.62, 0.86, 0.040),
            (0.56, 0.82, 0.042),
            (0.50, 0.88, 0.045),
            (0.45, 0.98, 0.044),
            (0.42, 1.18, 0.040),
            (0.48, 1.24, 0.038),
            (0.39, 1.06, 0.036),
        )):
            wp, wn = _eval_spine_point_and_normal(master_spine, ft, side * fth)
            q = Vector((0.0, 0.0, 1.0)).rotation_difference(wn)
            _build_dermal_tubercle(
                f"Stego_FlankTubercle_{s_tag}_{fi}",
                radius_x=fr,
                radius_y=fr * 0.85,
                height=fr * 0.42,
                mat=mats["hide"],
                parent=torso_bone,
                local_pos=wp - torso_world - wn * 0.006,
                rot=q.to_euler("XYZ"),
            )


def _build_thagomizer(thago_bone, mats):
    """
    Sculpts the iconic lethal 4-spike Stegosaurus thagomizer at the distal tail tip
    matching Sophie's dramatic horizontal-V diverging sweep:
      - Anterior pair: longer, heavier, sweeping outward-backward & subtly upward.
      - Posterior pair: sleeker, sweeping sharply back-and-outward in a deadly fan.
    """
    spike_specs = [
        ("Ant_L",  ( 0.14,  0.055,  0.025), 0.98, 0.078, (-0.54,  0.76,  0.34), (-0.09,  0.04,  0.10)),
        ("Ant_R",  ( 0.14, -0.055,  0.025), 0.98, 0.078, (-0.54, -0.76,  0.34), (-0.09, -0.04,  0.10)),
        ("Post_L", (-0.16,  0.044, -0.015), 0.84, 0.068, (-0.82,  0.56,  0.08), (-0.09,  0.02,  0.05)),
        ("Post_R", (-0.16, -0.044, -0.015), 0.84, 0.068, (-0.82, -0.56,  0.08), (-0.09, -0.02,  0.05)),
    ]

    for tag, lpos, slen, srad, sdir, scurve in spike_specs:
        d_vec = Vector(sdir).normalized()
        base_v = Vector(lpos)

        q = Vector((0.0, 0.0, 1.0)).rotation_difference(d_vec)
        _build_dermal_tubercle(
            f"Stego_ThagoCollar_{tag}",
            radius_x=srad * 1.28,
            radius_y=srad * 1.24,
            height=srad * 1.35,
            mat=mats["hide"],
            parent=thago_bone,
            local_pos=base_v - d_vec * 0.032,
            rot=q.to_euler("XYZ"),
        )

        _build_conical_horn(
            f"Stego_ThagoSpike_{tag}",
            length=slen,
            base_r=srad,
            direction=sdir,
            curve_offset=scurve,
            mat=mats["spike"],
            parent=thago_bone,
            local_pos=base_v,
            segs_u=18,
            segs_v=20,
            flat_y=0.90,
            flute_amp=0.045,
        )


def build_stegosaurus_high_definition():
    clear_scene()

    mats = {
        "hide": _make_trex_pbr_mat(
            "Mat_BodyPrimary",
            base_color=(0.42, 0.43, 0.25, 1.0),
            roughness=0.72,
            metallic=0.01,
            albedo_path=_tex("stegosaurus_albedo.png"),
            bump_path=_tex("stegosaurus_normal.png"),
            bump_strength=0.44,
        ),
        "cranium": _make_trex_pbr_mat(
            "Mat_BodyPrimary_Skull",
            base_color=(0.44, 0.45, 0.26, 1.0),
            roughness=0.66,
            metallic=0.02,
            albedo_path=_tex("stegosaurus_cranium_albedo.png"),
            bump_path=_tex("stegosaurus_cranium_normal.png"),
            bump_strength=0.46,
        ),
        "plate": _make_trex_pbr_mat(
            "Mat_Accent",
            base_color=(0.68, 0.32, 0.16, 1.0),
            roughness=0.54,
            metallic=0.02,
            albedo_path=_tex("stegosaurus_plate_albedo.png"),
            bump_path=_tex("stegosaurus_plate_normal.png"),
            bump_strength=0.62,
        ),
        "spike": _make_trex_pbr_mat(
            "Mat_Secondary",
            base_color=(0.76, 0.68, 0.52, 1.0),
            roughness=0.36,
            metallic=0.02,
            albedo_path=_tex("stegosaurus_spike_albedo.png"),
            bump_path=_tex("stegosaurus_spike_normal.png"),
            bump_strength=0.38,
        ),
        "beak": _make_trex_pbr_mat(
            "Mat_Beak",
            base_color=(0.20, 0.16, 0.12, 1.0),
            roughness=0.40,
            metallic=0.02,
            albedo_path=_tex("stegosaurus_beak_albedo.png"),
            bump_path=_tex("stegosaurus_beak_normal.png"),
            bump_strength=0.35,
        ),
        "mucosa": _make_trex_pbr_mat(
            "Mat_OralMucosa",
            base_color=(0.54, 0.18, 0.20, 1.0),
            roughness=0.22,
            metallic=0.02,
            albedo_path=_tex("trex_mucosa_albedo.png"),
            bump_path=_tex("trex_mucosa_bump.png"),
            bump_strength=0.22,
        ),
        "iris": make_pbr_material(
            "Mat_Eye",
            base_color=(0.98, 0.64, 0.10, 1.0),
            roughness=0.08,
            emissive=(0.45, 0.24, 0.04, 1.0),
            emissive_strength=0.22,
            albedo_path=_tex("stegosaurus_iris_albedo.png"),
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

    # Exact canonical Stegosaurus bone hierarchy matching js/fighters/stegosaurus.js,
    # js/animations/stegosaurus/*.js, and tools/test_glb_models.js
    root = create_bone_node("Bone_Root", (0.0, 0.0, 0.0))
    hips = create_bone_node("Bone_Hips", (0.0, 0.0, 1.65), parent=root)
    torso = create_bone_node("Bone_Torso", (0.0, 0.0, 0.0), parent=hips)
    plates_group = create_bone_node("Special_Plates", (0.0, 0.0, 0.0), parent=torso)

    neck_world = (1.12, 0.0, 1.44)
    neck = create_bone_node("Bone_Neck", (neck_world[0], 0.0, neck_world[2] - 1.65), parent=torso)

    head_world = (2.04, 0.0, 1.66)
    head = create_bone_node(
        "Bone_Head",
        (head_world[0] - neck_world[0], 0.0, head_world[2] - neck_world[2]),
        parent=neck,
    )
    jaw = create_bone_node("Bone_Jaw", (0.11, 0.0, -0.072), parent=head)

    # 4-segment articulated balancing tail parented to Bone_Torso
    t0_w = (-1.08, 0.0, 1.88)
    t1_w = (-1.74, 0.0, 1.78)
    t2_w = (-2.42, 0.0, 1.70)
    t3_w = (-3.08, 0.0, 1.58)

    tail0 = create_bone_node("Bone_Tail0", (t0_w[0], 0.0, t0_w[2] - 1.65), parent=torso)
    tail1 = create_bone_node("Bone_Tail1", (t1_w[0] - t0_w[0], 0.0, t1_w[2] - t0_w[2]), parent=tail0)
    tail2 = create_bone_node("Bone_Tail2", (t2_w[0] - t1_w[0], 0.0, t2_w[2] - t1_w[2]), parent=tail1)
    tail3 = create_bone_node("Bone_Tail3", (t3_w[0] - t2_w[0], 0.0, t3_w[2] - t2_w[2]), parent=tail2)
    thago = create_bone_node("Special_Thagomizer", (-0.42, 0.0, -0.10), parent=tail3)

    # Unified Master Spine Spline matching Sophie's iconic high-arched Stegosaurus silhouette!
    spine_ctrl = [
        (-3.98, 0.0, 1.32, 0.004, 0.004),  # 0: Tapered fleshy tail tip behind thagomizer
        (-3.55, 0.0, 1.46, 0.092, 0.112),  # 1: Distal thagomizer mounting shaft
        (-3.08, 0.0, 1.58, 0.142, 0.178),  # 2: Bone_Tail3
        (-2.42, 0.0, 1.70, 0.218, 0.275),  # 3: Bone_Tail2
        (-1.74, 0.0, 1.78, 0.308, 0.390),  # 4: Bone_Tail1
        (-1.08, 0.0, 1.88, 0.425, 0.525),  # 5: Bone_Tail0 (muscular caudofemoralis base)
        (-0.56, 0.0, 2.00, 0.555, 0.680),  # 6: Tallest sacral/pelvic arch over hind legs
        ( 0.04, 0.0, 1.88, 0.630, 0.765),  # 7: Deep herbivore barrel ribcage & belly
        ( 0.64, 0.0, 1.62, 0.545, 0.625),  # 8: Steeply sloping anterior thorax / shoulders
        ( 1.12, 0.0, 1.44, 0.375, 0.425),  # 9: Bone_Neck / low pectoral collar
        ( 1.48, 0.0, 1.42, 0.260, 0.298),  # 10: Lower-mid graceful neck sweep
        ( 1.82, 0.0, 1.56, 0.190, 0.220),  # 11: Upper-mid graceful neck lift
        ( 2.08, 0.0, 1.66, 0.145, 0.162),  # 12: Atlas / occiput entering skull smoothly
        ( 2.22, 0.0, 1.67, 0.004, 0.004),  # 13: Internal skull cap
    ]
    master_spine = CatmullRomSpline3D(spine_ctrl)

    n_seg = float(len(spine_ctrl) - 1)  # 13.0
    t_j_tail3 = 2.0 / n_seg
    t_j_tail2 = 3.0 / n_seg
    t_j_tail1 = 4.0 / n_seg
    t_j_tail0 = 5.0 / n_seg
    t_j_neck = 9.0 / n_seg
    overlap = 0.036

    _build_continuous_spine_segment(
        "Stego_TailSeg3", master_spine,
        0.0, t_j_tail3 + overlap, None, t_j_tail3,
        t3_w, tail3, mats["hide"], segs_u=30, segs_v=20,
    )
    _build_continuous_spine_segment(
        "Stego_TailSeg2", master_spine,
        t_j_tail3 - overlap, t_j_tail2 + overlap, t_j_tail3, t_j_tail2,
        t2_w, tail2, mats["hide"], segs_u=32, segs_v=18,
    )
    _build_continuous_spine_segment(
        "Stego_TailSeg1", master_spine,
        t_j_tail2 - overlap, t_j_tail1 + overlap, t_j_tail2, t_j_tail1,
        t1_w, tail1, mats["hide"], segs_u=34, segs_v=18,
    )
    _build_continuous_spine_segment(
        "Stego_TailSeg0", master_spine,
        t_j_tail1 - overlap, t_j_tail0 + overlap, t_j_tail1, t_j_tail0,
        t0_w, tail0, mats["hide"], segs_u=36, segs_v=18,
    )
    _build_continuous_spine_segment(
        "Stego_Torso", master_spine,
        t_j_tail0 - overlap, t_j_neck + overlap, t_j_tail0, t_j_neck,
        (0.0, 0.0, 1.65), torso, mats["hide"], segs_u=48, segs_v=36, v_uv_scale=2.2,
    )
    _build_continuous_spine_segment(
        "Stego_Neck", master_spine,
        t_j_neck - overlap, 1.0, t_j_neck, None,
        neck_world, neck, mats["hide"], segs_u=36, segs_v=24, v_uv_scale=2.4,
    )

    bone_info = {
        "torso": (torso, (0.0, 0.0, 1.65)),
        "neck": (neck, neck_world),
        "tail0": (tail0, t0_w),
        "tail1": (tail1, t1_w),
        "tail2": (tail2, t2_w),
        "tail3": (tail3, t3_w),
        "t_j_neck": t_j_neck,
        "t_j_tail0": t_j_tail0,
        "t_j_tail1": t_j_tail1,
        "t_j_tail2": t_j_tail2,
        "t_j_tail3": t_j_tail3,
    }

    _add_all_plates_and_osteoderms(master_spine, bone_info, plates_group, neck, torso, mats)
    _build_sculpted_skull_and_jaw(head, jaw, mats)
    _build_thagomizer(thago, mats)

    # Stegosaurus limb contract: Front legs -> Bone_Arm0..1, Hind legs -> Bone_Leg0..1
    for idx, ly in enumerate((0.46, -0.46)):
        side = 1.0 if ly > 0 else -1.0
        hip_pos = (0.76, ly, -0.32)
        arm = create_bone_node(f"Bone_Arm{idx}", hip_pos, parent=hips)
        local_ground_z = -(1.65 + hip_pos[2])
        _build_forelimb(arm, side, local_ground_z, mats, idx)

    for idx, ly in enumerate((0.48, -0.48)):
        side = 1.0 if ly > 0 else -1.0
        hip_pos = (-0.56, ly, 0.08)
        leg = create_bone_node(f"Bone_Leg{idx}", hip_pos, parent=hips)
        local_ground_z = -(1.65 + hip_pos[2])
        _build_hindlimb(leg, side, local_ground_z, mats, idx)

    out_path = os.path.join(OUT_DIR, "stegosaurus.glb")
    export_fighter_glb(out_path)
    return out_path


def render_stegosaurus_verification_views(
    prefix="stego_v2",
    shot_dir="/home/niwatorichan/Projects/ExtinctionFighter/.tmp_screenshots",
):
    """
    Renders 6 full-framed studio verification views of the current Blender scene
    (side profile matching Sophie, 3/4 hero, head/neck portrait close-up,
    rear 3/4 thagomizer & plates, front 3/4, top) for visual beauty verification.
    """
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

    center = (min_co + max_co) * 0.5
    size = max_co - min_co
    print(f"[STATS] Polygons={total_polys}, BBox min=({min_co.x:.3f}, {min_co.y:.3f}, {min_co.z:.3f}), max=({max_co.x:.3f}, {max_co.y:.3f}, {max_co.z:.3f}), size=({size.x:.2f} x {size.y:.2f} x {size.z:.2f})")

    temp_objs = []
    world = bpy.context.scene.world
    if not world:
        world = bpy.data.worlds.new("StegoStudioWorld")
        bpy.context.scene.world = world
    world.use_nodes = True
    bg = next((n for n in world.node_tree.nodes if n.type == "BACKGROUND"), None)
    if bg:
        bg.inputs[0].default_value = (0.14, 0.17, 0.21, 1.0)
        bg.inputs[1].default_value = 1.15

    def add_sun(name, loc, target, energy, color=(1.0, 0.98, 0.94)):
        ldata = bpy.data.lights.new(name=name, type="SUN")
        ldata.energy = energy
        ldata.color = color
        lobj = bpy.data.objects.new(name, ldata)
        bpy.context.collection.objects.link(lobj)
        lobj.location = Vector(loc)
        lobj.rotation_euler = (Vector(target) - lobj.location).to_track_quat("-Z", "Y").to_euler()
        temp_objs.append(lobj)

    add_sun("_StudioKey", center + Vector((5.0, -6.5, 6.5)), center, 3.6, (1.0, 0.95, 0.88))
    add_sun("_StudioFill", center + Vector((-4.5, 5.5, 3.5)), center, 1.5, (0.76, 0.88, 1.0))
    add_sun("_StudioRim", center + Vector((-5.5, -2.5, 5.0)), center, 2.2, (1.0, 0.86, 0.68))

    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=12.0, depth=0.05, location=(center.x, 0.0, -0.025))
    ground = bpy.context.active_object
    ground.name = "_StudioGround"
    gmat = make_pbr_material("_StudioGroundMat", base_color=(0.20, 0.22, 0.24, 1.0), roughness=0.88, metallic=0.02)
    ground.data.materials.append(gmat)
    temp_objs.append(ground)

    cam_data = bpy.data.cameras.new("_StudioCam")
    cam_data.lens = 50.0
    cam_obj = bpy.data.objects.new("_StudioCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    temp_objs.append(cam_obj)

    scene = bpy.context.scene
    scene.camera = cam_obj
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 960
    scene.render.resolution_y = 640
    scene.render.image_settings.file_format = "PNG"

    # Full-margin framing so snout, thagomizer tips, feet, and tallest plates all fit cleanly!
    views = [
        ("side",         Vector((-0.80, -11.4, 1.95)), Vector((-0.80, 0.0, 1.80)), 48.0),
        ("hero_3q",      Vector(( 5.8,  -8.6,  3.15)), Vector((-0.65, 0.0, 1.72)), 46.0),
        ("rear_3q",      Vector((-7.4,  -6.8,  2.85)), Vector((-1.10, 0.0, 1.72)), 46.0),
        ("head_closeup", Vector(( 3.60, -1.85, 1.88)), Vector(( 2.26, 0.0, 1.66)), 58.0),
        ("front_3q",     Vector(( 6.6,  -3.6,  2.35)), Vector(( 0.20, 0.0, 1.65)), 46.0),
        ("top",          Vector((-0.80, -0.01, 11.4)), Vector((-0.80, 0.0, 1.50)), 46.0),
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


if __name__ == "__main__":
    build_stegosaurus_high_definition()
