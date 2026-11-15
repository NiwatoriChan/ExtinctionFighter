"""
tools/blender/ankylo_sculptor.py
Museum-grade paleontological & portrait-faithful Blender 5.2 builder for the
Ankylosaurus magniventris GLB model (assets/models/fighters/ankylo.glb).
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
    _build_curved_limb_tube,
    _make_trex_pbr_mat,
)
from pachyrhino_sculptor import (
    _build_horn_along_spline,
    _build_conical_horn,
)


def _tex(name):
    p = os.path.join(TEX_DIR, name)
    return p if os.path.exists(p) else None


def _build_keeled_osteoderm(
    name,
    length,
    width,
    height,
    mat,
    parent,
    local_pos=(0.0, 0.0, 0.0),
    rot=(0.0, 0.0, 0.0),
    keel_bias=-0.16,
    segs_u=14,
    subdiv=1,
):
    """
    Sculpts a 3D beveled, keeled ankylosaurid osteoderm scute with a broad polygonal/oval
    basal collar, concave side slopes, and a sharp longitudinal crest keel.
    UV u maps laterally across the scute (0.5 = bright mineral keel, 0/1 = dark collar).
    """
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    hl = length * 0.5
    hw = width * 0.5
    rings_def = [
        (1.00, 1.00, -height * 0.14),  # Embedded basal skirt
        (0.96, 0.96,  height * 0.14),  # Raised beveled rim
        (0.76, 0.58,  height * 0.48),  # Concave lateral slope
        (0.46, 0.20,  height * 0.82),  # Narrowing keel shoulder
    ]

    bm_rings = []
    ring_uvs = []
    for r_l, r_w, z_h in rings_def:
        row = []
        uv_row = []
        for iu in range(segs_u):
            ang = (iu / segs_u) * math.pi * 2.0
            ca = math.cos(ang)
            sa = math.sin(ang)
            # Subtle polygonal/hexagonal squaring of base footprint
            poly_mod = 1.0 + 0.06 * math.cos(ang * 6.0)
            lx = ca * hl * r_l * poly_mod + keel_bias * length * (1.0 - r_l)
            ly = sa * hw * r_w * poly_mod
            row.append(bm.verts.new((lx, ly, z_h)))
            u_coord = max(0.02, min(0.98, 0.5 + sa * r_w * 0.45))
            v_coord = max(0.02, min(0.98, 0.5 + ca * r_l * 0.45))
            uv_row.append((u_coord, v_coord))
        bm_rings.append(row)
        ring_uvs.append(uv_row)

    for ir in range(len(bm_rings) - 1):
        r0, r1 = bm_rings[ir], bm_rings[ir + 1]
        uv0, uv1 = ring_uvs[ir], ring_uvs[ir + 1]
        for iu in range(segs_u):
            iun = (iu + 1) % segs_u
            f = bm.faces.new((r0[iu], r0[iun], r1[iun], r1[iu]))
            for loop, uv in zip(f.loops, (uv0[iu], uv0[iun], uv1[iun], uv1[iu])):
                loop[uv_layer].uv = uv

    apex_v = bm.verts.new((keel_bias * length, 0.0, height))
    base_v = bm.verts.new((0.0, 0.0, -height * 0.22))
    top_r = bm_rings[-1]
    top_uv = ring_uvs[-1]
    bot_r = bm_rings[0]
    bot_uv = ring_uvs[0]
    for iu in range(segs_u):
        iun = (iu + 1) % segs_u
        ft = bm.faces.new((top_r[iu], top_r[iun], apex_v))
        for loop, uv in zip(ft.loops, (top_uv[iu], top_uv[iun], (0.5, 0.5))):
            loop[uv_layer].uv = uv
        fb = bm.faces.new((bot_r[iun], bot_r[iu], base_v))
        for loop, uv in zip(fb.loops, (bot_uv[iun], bot_uv[iu], (0.05, 0.5))):
            loop[uv_layer].uv = uv

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    obj = attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=local_pos, subdiv=subdiv)
    obj.rotation_euler = rot
    return obj


def _eval_spine_surface(master_spline, t, theta, cap_scale=1.0):
    """
    Evaluates the sculpted Ankylosaurus carapace/body cross-section at spline parameter t
    and circumferential angle theta (0 = dorsal crest, +/-pi/2 = lateral shelf, pi = belly).
    Returns world_pos along the continuous body profile.
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

    # Broad tank carapace barrel cross-section on torso (0.34 < t < 0.80)
    is_carapace = 0.34 < t < 0.80
    w_exp = 0.76 if is_carapace else 0.92
    y_lat = sign_s * (abs_sin ** w_exp) * ry

    if cos_t >= 0.0:
        z_vert = (cos_t ** (0.86 if is_carapace else 0.94)) * rz
    else:
        # Broad flattened armored belly underneath
        belly_flat = 0.66 if is_carapace else 0.86
        z_vert = -((-cos_t) ** 0.88) * rz * belly_flat

    # Overhanging lateral carapace shelf rim & subtle scalloped segment bands
    if is_carapace:
        carapace_env = math.sin(((t - 0.34) / 0.46) * math.pi)
        band_wave = 0.5 + 0.5 * math.cos(t * math.pi * 28.0)

        # Overhanging lateral flange where dorsal carapace meets softer lower flank
        if -0.26 < cos_t < 0.24:
            flange = math.sin(((cos_t + 0.26) / 0.50) * math.pi)
            y_lat += sign_s * flange * 0.065 * ry * carapace_env

        # 5 subtle longitudinal dorsal armor ridges + transverse band swells
        if cos_t > 0.22:
            ridge_wave = 0.5 + 0.5 * math.cos(abs_sin * math.pi * 4.0)
            z_vert += (0.024 + 0.022 * band_wave * ridge_wave) * rz * carapace_env

    # Wrinkled gular throat & brisket folds beneath neck/chest
    if 0.68 < t < 0.94 and cos_t < -0.25:
        dewlap_env = math.sin(((t - 0.68) / 0.26) * math.pi)
        throat_folds = 1.0 + 0.055 * math.sin(t * math.pi * 26.0)
        z_vert *= (1.0 + 0.12 * dewlap_env) * throat_folds

    # Dorsal midline caudal ridges along stiffened tail handle
    if 0.08 < t < 0.34 and cos_t > 0.55 and abs_sin < 0.24:
        caudal_wave = 0.5 + 0.5 * math.cos(t * math.pi * 34.0)
        z_vert += (1.0 - abs_sin / 0.24) * (0.04 + 0.04 * caudal_wave) * rz

    return c_world + lat_axis * y_lat + up_axis * z_vert


def _eval_carapace_point_and_normal(master_spline, t, theta, origin_world):
    """Computes local position on Bone_Torso and outward unit surface normal at (t, theta)."""
    p = _eval_spine_surface(master_spline, t, theta)
    p_t = _eval_spine_surface(master_spline, min(0.995, t + 0.008), theta)
    p_b = _eval_spine_surface(master_spline, max(0.005, t - 0.008), theta)
    p_u1 = _eval_spine_surface(master_spline, t, theta + 0.03)
    p_u0 = _eval_spine_surface(master_spline, t, theta - 0.03)

    tan_v = (p_t - p_b)
    tan_u = (p_u1 - p_u0)
    # Cross order chosen so dorsal (+Z at theta=0) yields outward normal +Z
    nrm = tan_u.cross(tan_v)
    if nrm.length < 1e-6:
        nrm = Vector((0.0, 0.0, 1.0))
    else:
        nrm.normalize()
    if (p - master_spline.eval_at(t)[0]).dot(nrm) < 0.0:
        nrm = -nrm
    return p - Vector(origin_world), nrm


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
    segs_v=30,
    v_uv_scale=2.4,
):
    """Lofts a slice [t_start, t_end] of the Ankylosaurus master spine in parent_bone space."""
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


def _rot_from_z_normal(nrm):
    """Returns XYZ Euler aligning local +Z with outward surface normal while keeping +X forward."""
    q = Vector((0.0, 0.0, 1.0)).rotation_difference(nrm.normalized())
    return q.to_euler("XYZ")


def _add_carapace_and_cervical_armor(master_spline, torso_bone, torso_world, neck_bone, mats):
    """
    Populates the carapace with 6 transverse bands of keeled osteoderms anchored to the
    exact carapace surface, 8 pairs of lateral marginal spikes with basal collars,
    and 2 cervical half-rings on the neck.
    """
    # 1. Six transverse bands of keeled dorsal osteoderms across Bone_Torso
    band_ts = (0.415, 0.480, 0.545, 0.610, 0.675, 0.740)
    for bi, bt in enumerate(band_ts):
        # Alternate slightly staggered vs aligned medial/lateral rows for organic armor mosaic
        thetas = (0.0, -0.34, 0.34, -0.70, 0.70, -1.06, 1.06)
        env = math.sin(((bt - 0.36) / 0.42) * math.pi)
        for ti, th in enumerate(thetas):
            pos, nrm = _eval_carapace_point_and_normal(master_spline, bt, th, torso_world)
            is_medial = abs(th) < 0.1
            is_outer = abs(th) > 0.9
            sc_len = (0.28 if is_medial else (0.31 if not is_outer else 0.27)) * (0.85 + 0.18 * env)
            sc_wid = (0.24 if is_medial else (0.25 if not is_outer else 0.21)) * (0.85 + 0.18 * env)
            sc_h = (0.14 if is_medial else (0.17 if not is_outer else 0.15)) * (0.82 + 0.20 * env)

            _build_keeled_osteoderm(
                f"Ankylo_CarapaceScute_{bi}_{ti}",
                length=sc_len,
                width=sc_wid,
                height=sc_h,
                mat=mats["scute"],
                parent=torso_bone,
                local_pos=pos - nrm * 0.025,
                rot=_rot_from_z_normal(nrm),
                keel_bias=-0.18,
                segs_u=12,
                subdiv=1,
            )

    # Interstitial smaller pebble osteoderms between the main transverse bands
    mid_ts = (0.448, 0.512, 0.578, 0.642, 0.708)
    for mi, mt in enumerate(mid_ts):
        for si, th in enumerate((-0.18, 0.18, -0.52, 0.52, -0.88, 0.88)):
            pos, nrm = _eval_carapace_point_and_normal(master_spline, mt, th, torso_world)
            _build_keeled_osteoderm(
                f"Ankylo_PebbleScute_{mi}_{si}",
                length=0.15,
                width=0.14,
                height=0.068,
                mat=mats["scute"],
                parent=torso_bone,
                local_pos=pos - nrm * 0.015,
                rot=_rot_from_z_normal(nrm),
                keel_bias=-0.10,
                segs_u=10,
                subdiv=0,
            )

    # 2. Sawtooth fringe of 8 pairs of lateral marginal carapace spikes along overhanging rim
    lat_ts = (0.385, 0.438, 0.492, 0.545, 0.598, 0.652, 0.705, 0.755)
    for li, lt in enumerate(lat_ts):
        env = math.sin(((lt - 0.35) / 0.44) * math.pi)
        sp_len = 0.24 + 0.15 * env
        sp_rad = 0.095 + 0.032 * env
        for side in (-1, 1):
            s_tag = "L" if side > 0 else "R"
            th = side * 1.44
            pos, nrm = _eval_carapace_point_and_normal(master_spline, lt, th, torso_world)
            anchor = pos - nrm * 0.035
            _build_keeled_osteoderm(
                f"Ankylo_LatCollar_{s_tag}_{li}",
                length=sp_rad * 2.5,
                width=sp_rad * 2.2,
                height=sp_rad * 1.0,
                mat=mats["scute"],
                parent=torso_bone,
                local_pos=anchor,
                rot=_rot_from_z_normal(nrm),
                segs_u=10,
                subdiv=0,
            )
            _build_conical_horn(
                f"Ankylo_LatSpike_{s_tag}_{li}",
                length=sp_len,
                base_r=sp_rad,
                direction=(-0.56, side * 0.82, 0.06),
                curve_offset=(-0.11, side * 0.01, 0.03),
                mat=mats["horn"],
                parent=torso_bone,
                local_pos=anchor + nrm * 0.015,
                segs_u=14,
                segs_v=14,
                flat_y=0.72,
                flute_amp=0.05,
            )

    # 3. Two armored cervical half-rings on Bone_Neck (world origin (1.22, 0.0, 1.41))
    neck_world = (1.22, 0.0, 1.41)
    for ri, nt in enumerate((0.775, 0.835)):
        # Dorsal/upper-lateral cervical keeled scutes
        for ci, th in enumerate((-0.78, -0.34, 0.0, 0.34, 0.78)):
            pos, nrm = _eval_carapace_point_and_normal(master_spline, nt, th, neck_world)
            _build_keeled_osteoderm(
                f"Ankylo_CervicalScute_{ri}_{ci}",
                length=0.20,
                width=0.18,
                height=0.115,
                mat=mats["scute"],
                parent=neck_bone,
                local_pos=pos - nrm * 0.02,
                rot=_rot_from_z_normal(nrm),
                keel_bias=-0.16,
                segs_u=12,
                subdiv=1,
            )
        # Paired outward-backward lateral cervical half-ring spikes
        for side in (-1, 1):
            s_tag = "L" if side > 0 else "R"
            pos, nrm = _eval_carapace_point_and_normal(master_spline, nt, side * 1.18, neck_world)
            _build_conical_horn(
                f"Ankylo_CervicalSpike_{s_tag}_{ri}",
                length=0.22 - ri * 0.04,
                base_r=0.072 - ri * 0.010,
                direction=(-0.48, side * 0.80, 0.36),
                curve_offset=(-0.04, side * 0.01, 0.02),
                mat=mats["horn"],
                parent=neck_bone,
                local_pos=pos - nrm * 0.02,
                segs_u=12,
                segs_v=12,
                flat_y=0.78,
                flute_amp=0.05,
            )


def _build_sculpted_skull_and_jaw(head_bone, jaw_bone, mats):
    """
    Sculpts the portrait-faithful Ankylosaurus armored skull (56x64), mosaic caputegulae,
    3 supraorbital brow scutes per side, squamosal & jugal horns, maxillary cheek spike,
    hooked dark keratinous beak, recessed golden-amber eyes, and armored mandible.
    """
    pitch_q = Euler((0.0, 0.05, 0.0), "XYZ").to_matrix().to_4x4()

    slices = [
        (-0.14, 0.14, -0.08, 0.002),  # Closed occipital cap inside neck
        (0.00,  0.26, -0.18, 0.42),   # Broad occiput & squamosal table
        (0.14,  0.29, -0.20, 0.45),   # Widest jugal/temporal cranial shelf
        (0.32,  0.28, -0.18, 0.41),   # Orbital / supraorbital brow vault
        (0.50,  0.25, -0.15, 0.34),   # Broad mid-snout nasal bridge
        (0.68,  0.19, -0.13, 0.25),   # Deep narial fossa region
        (0.80,  0.09, -0.14, 0.15),   # Anterior rostral core tucked inside beak
        (0.87, -0.02, -0.12, 0.002),  # Closed rostral core cap
    ]
    top_spline = CatmullRomSpline3D([(s[0], s[3], s[1]) for s in slices])
    bot_spline = CatmullRomSpline3D([(s[0], s[3], s[2]) for s in slices])

    radial_steps = 56
    length_steps = 64
    skull_rings_v = []
    skull_rings_uv = []

    for iy in range(length_steps + 1):
        v = iy / length_steps
        p_top, _ = top_spline.eval_at(v)
        p_bot, _ = bot_spline.eval_at(v)
        fx = p_top.x
        half_w = max(0.001, p_top.y)
        top_z = p_top.z
        bot_z = p_bot.z

        brow_prof = math.exp(-(((v - 0.44) / 0.13) ** 2))
        orbit_prof = math.exp(-(((v - 0.45) / 0.085) ** 2))
        jugal_prof = math.exp(-(((v - 0.24) / 0.09) ** 2))
        snout_ridge = math.sin(((v - 0.18) / 0.68) * math.pi) if (0.18 < v < 0.86) else 0.0

        row_v = []
        row_uv = []
        for ix in range(radial_steps):
            u = ix / radial_steps
            angle = u * math.pi * 2.0
            s = math.sin(angle)
            c = math.cos(angle)
            abs_s = abs(s)
            sign_s = 1.0 if s >= 0.0 else -1.0

            ly = sign_s * (abs_s ** 0.72) * half_w
            mid_z = 0.5 * (top_z + bot_z)
            half_h = max(0.01, 0.5 * (top_z - bot_z))

            if c >= 0.0:
                lz = mid_z + half_h * (c ** 0.66)
                # Sculpted mosaic caputegulae crown relief across top of skull
                if snout_ridge > 0.0 and c > 0.45:
                    tile = 0.5 + 0.5 * math.cos(v * math.pi * 20.0) * math.cos(abs_s * math.pi * 8.0)
                    lz += snout_ridge * tile * 0.022 * ((c - 0.45) / 0.55)
                # Heavy overhanging supraorbital brow ridge shielding the eye
                if brow_prof > 0.01 and 0.16 < c < 0.86:
                    arch = math.sin(((c - 0.16) / 0.70) * math.pi)
                    lz += brow_prof * arch * 0.068
                    ly += sign_s * brow_prof * arch * 0.065
            else:
                lz = mid_z - half_h * ((-c) ** 0.80)

            # Deep recessed bony orbital cavity
            if orbit_prof > 0.01 and -0.26 < c < 0.30:
                orb_d = math.sin(((c + 0.26) / 0.56) * math.pi)
                ly *= (1.0 - 0.28 * orbit_prof * orb_d)

            # Subtle subocular cheek rim below eye
            if orbit_prof > 0.01 and -0.48 < c <= -0.22:
                wrinkle = 0.5 + 0.5 * math.cos(((c + 0.48) / 0.26) * math.pi * 3.0)
                ly += sign_s * orbit_prof * (0.012 + 0.010 * wrinkle)

            # Broad flaring jugal cheek shelf
            if jugal_prof > 0.01 and -0.68 < c < 0.08:
                j_arch = math.sin(((c + 0.68) / 0.76) * math.pi)
                ly += sign_s * jugal_prof * j_arch * 0.058
                lz -= jugal_prof * j_arch * 0.016

            # Deep oval anterior narial fossa (nostril) with rolled rim
            naris_u = (v - 0.78) / 0.044
            naris_v = (c - 0.02) / 0.16
            naris_d2 = naris_u * naris_u + naris_v * naris_v
            if naris_d2 < 1.0:
                n_depth = (1.0 - naris_d2) ** 1.4
                ly *= (1.0 - 0.38 * n_depth)
            elif 1.0 <= naris_d2 < 2.2:
                hood = math.sin(((naris_d2 - 1.0) / 1.2) * math.pi)
                ly += sign_s * 0.024 * hood
                lz += 0.008 * hood * (1.0 if naris_v > 0 else -0.4)

            pt = pitch_q @ Vector((fx, ly, lz))
            row_v.append(pt)
            row_uv.append((u, v * 1.8))

        skull_rings_v.append(row_v)
        skull_rings_uv.append(row_uv)

    bm_skull = _build_grid_bmesh(skull_rings_v, skull_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_skull, "Ankylo_UpperCranium", mat=mats["cranium"], parent=head_bone)

    # 2. Hooked dark charcoal-slate keratinous rostral beak wrapping snout tip
    beak_slices = [
        (0.66,  0.14, -0.14, 0.210),  # Posterior sheath overlapping premaxilla
        (0.76,  0.11, -0.15, 0.175),  # Mid-sheath rounded wall
        (0.85,  0.05, -0.16, 0.130),  # Forward rostral arch
        (0.92, -0.04, -0.18, 0.082),  # Downward curving beak wall
        (0.94, -0.14, -0.21, 0.036),  # Hooked tip
        (0.91, -0.22, -0.23, 0.004),  # Hooked tomium apex
    ]
    b_top_sp = CatmullRomSpline3D([(b[0], b[3], b[1]) for b in beak_slices])
    b_bot_sp = CatmullRomSpline3D([(b[0], b[3], b[2]) for b in beak_slices])
    b_segs_u, b_segs_v = 24, 24
    b_rings_v, b_rings_uv = [], []
    for iv in range(b_segs_v + 1):
        v = iv / b_segs_v
        pt_t, _ = b_top_sp.eval_at(v)
        pt_b, _ = b_bot_sp.eval_at(v)
        bx = pt_t.x
        b_hw = max(0.002, pt_t.y)
        b_mid_z = 0.5 * (pt_t.z + pt_b.z)
        b_hh = max(0.002, 0.5 * (pt_t.z - pt_b.z))
        row_v, row_uv = [], []
        for iu in range(b_segs_u):
            u = iu / b_segs_u
            ang = u * math.pi * 2.0
            sa, ca = math.sin(ang), math.cos(ang)
            abs_s = abs(sa)
            w_exp = 0.92 if v > 0.45 else 0.78
            ly = math.copysign(1.0, sa) * (abs_s ** w_exp) * b_hw
            lz = b_mid_z + (b_hh * (ca ** 0.70) if ca >= 0.0 else -b_hh * ((-ca) ** 0.80))
            if ca > 0.55 and abs_s < 0.35:
                lz += 0.010 * (1.0 - abs_s / 0.35) * math.sin(v * math.pi)
            row_v.append(pitch_q @ Vector((bx, ly, lz)))
            row_uv.append((u, v * 0.92))
        b_rings_v.append(row_v)
        b_rings_uv.append(row_uv)
    bm_beak = _build_grid_bmesh(b_rings_v, b_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_beak, "Ankylo_UpperBeak", mat=mats["beak"], parent=head_bone)

    # 3. 26 Fitted Mosaic Caputegulae Armor Plates across the cranial dome & snout bridge
    cap_specs = [
        # Median cranial plates (nuchal -> frontal -> internasal)
        (0.02,  0.00, 0.25,  0.16, 0.18, 0.060, (0.0, -0.04, 0.0)),
        (0.18,  0.00, 0.28,  0.17, 0.18, 0.065, (0.0,  0.02, 0.0)),
        (0.34,  0.00, 0.27,  0.16, 0.16, 0.062, (0.0,  0.10, 0.0)),
        (0.50,  0.00, 0.245, 0.14, 0.14, 0.066, (0.0,  0.22, 0.0)),
        (0.64,  0.00, 0.195, 0.12, 0.12, 0.072, (0.0,  0.38, 0.0)),
        (0.75,  0.00, 0.122, 0.10, 0.10, 0.064, (0.0,  0.58, 0.0)),
    ]
    for idx, (cx, cy, cz, cl, cw, ch, crot) in enumerate(cap_specs):
        _build_keeled_osteoderm(
            f"Ankylo_CapMid_{idx}",
            length=cl, width=cw, height=ch,
            mat=mats["scute"], parent=head_bone,
            local_pos=pitch_q @ Vector((cx, cy, cz)), rot=crot,
            keel_bias=0.0, segs_u=8, subdiv=0,
        )

    # Bilateral frontal/nasal caputegulae mosaic rows (10 per side -> 20 bilateral + 6 mid = 26)
    lat_cap_specs = [
        (0.04, 0.18, 0.24,  0.15, 0.15, 0.055, (0.28, -0.04, 0.0)),
        (0.18, 0.19, 0.26,  0.16, 0.15, 0.058, (0.30,  0.04, 0.0)),
        (0.33, 0.18, 0.25,  0.15, 0.14, 0.056, (0.32,  0.12, 0.0)),
        (0.48, 0.15, 0.235, 0.13, 0.13, 0.064, (0.34,  0.22, 0.0)),
        (0.62, 0.11, 0.182, 0.11, 0.11, 0.066, (0.36,  0.36, 0.0)),
        (0.14, 0.32, 0.19,  0.13, 0.13, 0.052, (0.64,  0.04, 0.0)),
        (0.28, 0.30, 0.20,  0.13, 0.12, 0.054, (0.66,  0.10, 0.0)),
        (0.54, 0.23, 0.155, 0.11, 0.11, 0.060, (0.70,  0.24, 0.0)),
        (0.66, 0.18, 0.098, 0.10, 0.10, 0.056, (0.72,  0.36, 0.0)),
        (0.20, 0.37, 0.08,  0.11, 0.10, 0.042, (1.05,  0.08, 0.0)),
    ]
    for side in (-1, 1):
        s_tag = "L" if side > 0 else "R"
        for li, (cx, cy, cz, cl, cw, ch, (rx, ry, rz)) in enumerate(lat_cap_specs):
            _build_keeled_osteoderm(
                f"Ankylo_CapLat_{s_tag}_{li}",
                length=cl, width=cw, height=ch,
                mat=mats["scute"], parent=head_bone,
                local_pos=pitch_q @ Vector((cx, side * cy, cz)),
                rot=(side * rx, ry, side * rz),
                keel_bias=-0.10, segs_u=8, subdiv=0,
            )

    # 4. Bilateral brow scutes, squamosal & jugal horns, cheek spikes, and recessed amber eyes
    for side in (-1, 1):
        s_tag = "L" if side > 0 else "R"

        # 3 Pointed supraorbital/loreal brow osteoderm crests crowning the eye (portrait signature!)
        for bi, (bx, by, bz, bh, b_rx, b_ry) in enumerate((
            (0.26, 0.30, 0.235, 0.095, 0.78, -0.18),
            (0.36, 0.31, 0.225, 0.108, 0.82,  0.02),
            (0.45, 0.29, 0.195, 0.090, 0.84,  0.18),
        )):
            _build_keeled_osteoderm(
                f"Ankylo_BrowScute_{s_tag}_{bi}",
                length=0.12, width=0.10, height=bh,
                mat=mats["scute"], parent=head_bone,
                local_pos=pitch_q @ Vector((bx, side * by, bz)),
                rot=(side * b_rx, b_ry, 0.0),
                keel_bias=-0.20, segs_u=10, subdiv=1,
            )

        # Signature Upper Squamosal Horn sweeping backward, outward & upward
        sq_base = pitch_q @ Vector((-0.01, side * 0.31, 0.21))
        _build_keeled_osteoderm(
            f"Ankylo_SqCollar_{s_tag}",
            length=0.26, width=0.24, height=0.10,
            mat=mats["scute"], parent=head_bone,
            local_pos=sq_base, rot=(side * 0.58, -0.52, 0.0),
            segs_u=10, subdiv=0,
        )
        sq_pts = [
            sq_base,
            pitch_q @ Vector((-0.18, side * 0.42, 0.33)),
            pitch_q @ Vector((-0.34, side * 0.51, 0.44)),
            pitch_q @ Vector((-0.49, side * 0.55, 0.53)),
        ]
        _build_horn_along_spline(
            f"Ankylo_HornSq_{s_tag}",
            sq_pts,
            base_rx=0.125,
            base_rz=0.135,
            mat=mats["horn"],
            parent=head_bone,
            segs_u=16,
            segs_v=18,
            tip_taper=1.18,
            flute_amp=0.06,
        )

        # Signature Lower Jugal / Quadratojugal Cheek Horn sweeping outward, back & down
        jg_base = pitch_q @ Vector((0.08, side * 0.36, -0.05))
        _build_keeled_osteoderm(
            f"Ankylo_JgCollar_{s_tag}",
            length=0.24, width=0.22, height=0.09,
            mat=mats["scute"], parent=head_bone,
            local_pos=jg_base, rot=(side * 1.45, -0.35, 0.0),
            segs_u=10, subdiv=0,
        )
        jg_pts = [
            jg_base,
            pitch_q @ Vector((-0.08, side * 0.48, -0.11)),
            pitch_q @ Vector((-0.22, side * 0.56, -0.17)),
            pitch_q @ Vector((-0.36, side * 0.62, -0.22)),
        ]
        _build_horn_along_spline(
            f"Ankylo_HornJg_{s_tag}",
            jg_pts,
            base_rx=0.115,
            base_rz=0.105,
            mat=mats["horn"],
            parent=head_bone,
            segs_u=14,
            segs_v=16,
            tip_taper=1.18,
            flute_amp=0.05,
        )

        # Sharp maxillary cheek spike just behind the beak corner (portrait detail!)
        _build_conical_horn(
            f"Ankylo_CheekSpike_{s_tag}",
            length=0.12,
            base_r=0.034,
            direction=(-0.22, side * 0.42, -0.88),
            curve_offset=(-0.02, 0.0, -0.01),
            mat=mats["horn"],
            parent=head_bone,
            local_pos=pitch_q @ Vector((0.56, side * 0.24, -0.09)),
            segs_u=10,
            segs_v=10,
            flute_amp=0.04,
        )

        # Recessed golden-amber eye with eyelids & 5 subocular pebble osteoderms
        eye_center = pitch_q @ Vector((0.36, side * 0.295, 0.055))
        eye_grp = create_bone_node(f"Ankylo_EyeSocket_{s_tag}", eye_center, parent=head_bone)
        eye_grp.rotation_euler = (-0.05, 0.04, -side * 0.34)

        bm_sh = bmesh.new()
        bmesh.ops.create_uvsphere(bm_sh, u_segments=14, v_segments=12, radius=0.048)
        sh_obj = attach_mesh_obj(
            bm_sh, f"Ankylo_OrbitShadow_{s_tag}", mat=mats["pupil"], parent=eye_grp,
            local_pos=(0.0, -side * 0.022, 0.0),
        )
        sh_obj.scale = (0.90, 0.65, 0.88)

        bm_ir = bmesh.new()
        uv_ir = bm_ir.loops.layers.uv.new("UVMap")
        bmesh.ops.create_uvsphere(bm_ir, u_segments=20, v_segments=16, radius=0.048)
        for f in bm_ir.faces:
            for loop in f.loops:
                co = loop.vert.co / 0.048
                loop[uv_ir].uv = (0.5 + co.x * 0.46, 0.5 + co.z * 0.46)
        bmesh.ops.recalc_face_normals(bm_ir, faces=bm_ir.faces)
        ir_obj = attach_mesh_obj(
            bm_ir, f"Ankylo_Eye_{s_tag}", mat=mats["iris"], parent=eye_grp,
            local_pos=(0.0, side * 0.008, 0.0),
        )
        ir_obj.scale = (1.0, 0.90, 1.0)

        bm_pu = bmesh.new()
        bmesh.ops.create_uvsphere(bm_pu, u_segments=14, v_segments=12, radius=0.025)
        pu_obj = attach_mesh_obj(
            bm_pu, f"Ankylo_Eye_{s_tag}_Pupil", mat=mats["pupil"], parent=eye_grp,
            local_pos=(0.0, side * 0.042, 0.0),
        )
        pu_obj.scale = (0.62, 0.54, 0.82)

        bm_cl = bmesh.new()
        bmesh.ops.create_uvsphere(bm_cl, u_segments=8, v_segments=8, radius=0.007)
        attach_mesh_obj(
            bm_cl, f"Ankylo_EyeCatchlight_{s_tag}", mat=mats["catchlight"], parent=eye_grp,
            local_pos=(0.011, side * 0.049, 0.012),
        )

        _build_muscular_limb_segment(
            f"Ankylo_UpperEyelid_{s_tag}",
            (-0.048, side * 0.020, 0.026),
            (0.050, side * 0.020, 0.022),
            lambda t, ang: (0.022 * math.sin(t * math.pi + 0.2), 0.018, 0.0, 0.007 * math.sin(t * math.pi)),
            mats["cranium"],
            eye_grp,
            prox_overlap=0.1, dist_overlap=0.1, radial_segs=12, height_segs=10,
        )
        _build_muscular_limb_segment(
            f"Ankylo_LowerEyelid_{s_tag}",
            (-0.046, side * 0.018, -0.024),
            (0.048, side * 0.018, -0.020),
            lambda t, ang: (0.018 * math.sin(t * math.pi + 0.2), 0.015, 0.0, -0.006 * math.sin(t * math.pi)),
            mats["cranium"],
            eye_grp,
            prox_overlap=0.1, dist_overlap=0.1, radial_segs=12, height_segs=10,
        )

        # Ventral arc of 5 subocular pebble osteoderms under each eye
        for oi, (ox_off, oz_off) in enumerate(((-0.055, -0.036), (-0.028, -0.044), (0.0, -0.046), (0.028, -0.043), (0.055, -0.034))):
            _build_keeled_osteoderm(
                f"Ankylo_Subocular_{s_tag}_{oi}",
                length=0.046, width=0.042, height=0.026,
                mat=mats["scute"], parent=eye_grp,
                local_pos=(ox_off, side * 0.026, oz_off),
                rot=(side * 1.15, 0.0, 0.0),
                keel_bias=0.0, segs_u=8, subdiv=0,
            )

    # 5. Armored Lower Mandible, Lower Keratin Beak, Mandibular Scutes & Tongue (Bone_Jaw)
    jaw_q = Euler((0.0, 0.04, 0.0), "XYZ").to_matrix().to_4x4()
    m_slices = [
        (-0.08,  0.03, -0.07, 0.002),
        ( 0.02,  0.07, -0.17, 0.30),
        ( 0.22,  0.06, -0.18, 0.28),
        ( 0.42,  0.03, -0.15, 0.21),
        ( 0.58,  0.02, -0.11, 0.13),
        ( 0.69,  0.03, -0.06, 0.07),
        ( 0.75,  0.03, -0.01, 0.002),
    ]
    m_bot = CatmullRomSpline3D([(s[0], s[3], s[2]) for s in m_slices])
    m_top = CatmullRomSpline3D([(s[0], s[3], s[1]) for s in m_slices])

    mr_u, mr_v = 36, 40
    m_rings_v, m_rings_uv = [], []
    for iy in range(mr_v + 1):
        v = iy / mr_v
        pb, _ = m_bot.eval_at(v)
        pt, _ = m_top.eval_at(v)
        hw = max(0.001, pb.y)
        row_v, row_uv = [], []
        for ix in range(mr_u):
            u = ix / mr_u
            ang = u * math.pi * 2.0
            sa, ca = math.sin(ang), math.cos(ang)
            abs_s = abs(sa)
            ly = math.copysign(1.0, sa) * (abs_s ** 0.74) * hw
            if ca <= 0.0:
                chin_rug = 1.0 + (0.06 * math.cos(v * math.pi * 18.0) if v > 0.55 else 0.0)
                lz = pb.z * (abs(ca) ** 0.68) * chin_rug
            else:
                rim = abs_s ** 1.4
                lz = pt.z * rim + (pt.z - 0.04 * math.sin(v * math.pi)) * (1.0 - rim)
            row_v.append(jaw_q @ Vector((pb.x, ly, lz)))
            row_uv.append((u, v))
        m_rings_v.append(row_v)
        m_rings_uv.append(row_uv)

    bm_mand = _build_grid_bmesh(m_rings_v, m_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_mand, "Ankylo_Mandible", mat=mats["cranium"], parent=jaw_bone)

    # 4 Mandibular keel plates per side along lower jaw margin
    for side in (-1, 1):
        s_tag = "L" if side > 0 else "R"
        for mi, (mx, my, mz, ml) in enumerate((
            (0.08, 0.27, -0.10, 0.14),
            (0.22, 0.25, -0.11, 0.13),
            (0.36, 0.21, -0.10, 0.12),
            (0.49, 0.16, -0.08, 0.10),
        )):
            _build_keeled_osteoderm(
                f"Ankylo_MandibleScute_{s_tag}_{mi}",
                length=ml, width=ml * 0.80, height=ml * 0.42,
                mat=mats["scute"], parent=jaw_bone,
                local_pos=jaw_q @ Vector((mx, side * my, mz)),
                rot=(side * 1.25, 0.0, -side * 0.22),
                keel_bias=-0.12, segs_u=10, subdiv=0,
            )

    # Up-curved dark keratinous predentary lower beak opposing the upper beak
    lb_pts = [
        jaw_q @ Vector((0.54, 0.0, -0.09)),
        jaw_q @ Vector((0.64, 0.0, -0.06)),
        jaw_q @ Vector((0.72, 0.0, -0.01)),
        jaw_q @ Vector((0.75, 0.0,  0.04)),
    ]
    _build_horn_along_spline(
        "Ankylo_LowerBeak", lb_pts, base_rx=0.105, base_rz=0.068, mat=mats["beak"], parent=jaw_bone,
        segs_u=16, segs_v=14, tip_taper=1.15,
    )

    # Fleshy grooved tongue inside lower jaw
    t_u, t_v = 20, 22
    t_rings_v, t_rings_uv = [], []
    for iy in range(t_v + 1):
        v = iy / t_v
        tx = 0.12 + v * 0.48
        arch_z = 0.00 + math.sin(v * math.pi * 0.85) * 0.032
        tip_r = ((1.0 - (v ** 3.2)) ** 0.42) if iy < t_v else 0.002
        base_c = 0.002 if iy == 0 else 1.0
        w = 0.095 * tip_r * base_c * (0.75 + 0.25 * math.sin(v * math.pi))
        h = 0.030 * tip_r * base_c * math.sin(min(1.0, v * 1.15) * math.pi * 0.88)
        row_v, row_uv = [], []
        for ix in range(t_u):
            u = ix / t_u
            ang = u * math.pi * 2.0
            sa, ca = math.sin(ang), math.cos(ang)
            sulcus = -0.012 * math.exp(-((sa / 0.28) ** 2)) * max(0.0, ca) * math.sin(v * math.pi)
            row_v.append(jaw_q @ Vector((tx, sa * w, arch_z + ca * h + sulcus)))
            row_uv.append((u, v))
        t_rings_v.append(row_v)
        t_rings_uv.append(row_uv)
    bm_tongue = _build_grid_bmesh(t_rings_v, t_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_tongue, "Ankylo_Tongue", mat=mats["mucosa"], parent=jaw_bone)


def _build_club_lobe_mesh(name, x_center, length, y_offset, width, height, side, mat, parent):
    """
    Sculpts one of the massive asymmetrical lateral osteoderm boulders of the Ankylosaurus
    tail club with a sharp lateral keel ridge, pitted dome, and flattened underside.
    """
    segs_u = 28
    segs_v = 28
    rings_v, rings_uv = [], []
    hl = length * 0.5
    for iv in range(segs_v + 1):
        v = iv / segs_v
        x = x_center + (0.5 - v) * length
        # Smooth oval envelope tapering gently at front and rounding bluntly at back
        env = max(0.003, math.sin(v * math.pi) ** 0.72)
        ly_span = width * env
        lz_span = height * env
        row_v, row_uv = [], []
        for iu in range(segs_u):
            u = iu / segs_u
            ang = u * math.pi * 2.0
            ca = math.cos(ang)
            sa = math.sin(ang)
            # Push lateral lobe outward on its side, tucking slightly toward midline core
            in_out = sa * side
            y_ext = ly_span * (1.12 if in_out > 0.0 else 0.55)
            # Sharpened lateral keel along outer horizon
            if in_out > 0.45:
                y_ext *= 1.0 + 0.18 * ((in_out - 0.45) / 0.55) ** 2
            y = y_offset + sa * y_ext
            # Flatter bottom, high domed top
            z = ca * lz_span * (1.06 if ca > 0.0 else 0.76)
            # Subtle osteoderm surface undulation
            nodule = 1.0 + 0.045 * math.sin(v * math.pi * 7.0) * math.cos(ang * 5.0)
            row_v.append(Vector((x, y * nodule, z * nodule)))
            row_uv.append((u, v))
        rings_v.append(row_v)
        rings_uv.append(row_uv)

    bm = _build_grid_bmesh(rings_v, rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    return attach_mesh_obj(bm, name, mat=mat, parent=parent, subdiv=0)


def _build_tail_armor_and_club(tail_bones, tail_club_bone, mats):
    """
    Adds dorsal keeled scutes and lateral caudal spikes along Bone_Tail0..2,
    and sculpts the authentic 4-osteoderm fused boulder tail club under Special_TailClub.
    """
    tail_specs = [
        (tail_bones[0], (-0.18, -0.46), 0.30, 0.26, 0.25),
        (tail_bones[1], (-0.18, -0.48), 0.22, 0.20, 0.20),
        (tail_bones[2], (-0.22, -0.48), 0.16, 0.15, 0.15),
    ]
    for bi, (t_bone, x_offs, r_lat, sp_len, sp_rad) in enumerate(tail_specs):
        for si, tx in enumerate(x_offs):
            _build_keeled_osteoderm(
                f"Ankylo_TailMidScute_{bi}_{si}",
                length=0.22 - bi * 0.03,
                width=0.18 - bi * 0.025,
                height=0.095 - bi * 0.015,
                mat=mats["scute"],
                parent=t_bone,
                local_pos=(tx, 0.0, r_lat * 0.78),
                rot=(0.0, 0.0, 0.0),
                keel_bias=-0.16,
                segs_u=10,
                subdiv=0,
            )
            if bi < 2:
                for side in (-1, 1):
                    s_tag = "L" if side > 0 else "R"
                    _build_conical_horn(
                        f"Ankylo_TailSpike_{bi}_{si}_{s_tag}",
                        length=sp_len,
                        base_r=sp_rad * 0.34,
                        direction=(-0.48, side * 0.86, 0.12),
                        curve_offset=(-0.04, side * 0.01, 0.01),
                        mat=mats["horn"],
                        parent=t_bone,
                        local_pos=(tx, side * (r_lat * 0.86), 0.02),
                        segs_u=10,
                        segs_v=10,
                        flat_y=0.76,
                    )

    # Central ossified tendon shaft entering Special_TailClub
    _build_curved_limb_tube(
        "Ankylo_ClubCore",
        [
            (0.22,  0.0, 0.0, 0.155, 0.135, 0.0),
            (0.00,  0.0, 0.0, 0.185, 0.155, 0.0),
            (-0.28, 0.0, 0.0, 0.210, 0.175, 0.0),
            (-0.56, 0.0, 0.0, 0.145, 0.125, 0.0),
            (-0.68, 0.0, 0.0, 0.020, 0.020, 0.0),
        ],
        mats["scute"],
        tail_club_bone,
        radial_segs=18,
        height_segs=20,
        v_uv_range=(0.0, 0.6),
    )

    # 2 Major lateral boulder lobes + 2 terminal distal lobes
    for side in (-1, 1):
        s_tag = "L" if side > 0 else "R"
        _build_club_lobe_mesh(
            f"Ankylo_ClubLobe_{s_tag}",
            x_center=-0.22,
            length=0.66,
            y_offset=side * 0.13,
            width=0.35,
            height=0.25,
            side=side,
            mat=mats["scute"],
            parent=tail_club_bone,
        )
        _build_club_lobe_mesh(
            f"Ankylo_ClubApex_{s_tag}",
            x_center=-0.56,
            length=0.30,
            y_offset=side * 0.06,
            width=0.18,
            height=0.15,
            side=side,
            mat=mats["scute"],
            parent=tail_club_bone,
        )

    # 3 Midline dorsal + 2 ventral locking keel plates fusing the tail club
    for ki, (kx, kl, kw, kh) in enumerate((
        (-0.08, 0.24, 0.28, 0.085),
        (-0.30, 0.26, 0.30, 0.095),
        (-0.50, 0.22, 0.26, 0.080),
    )):
        _build_keeled_osteoderm(
            f"Ankylo_ClubMidScute_{ki}",
            length=kl, width=kw, height=kh,
            mat=mats["scute"], parent=tail_club_bone,
            local_pos=(kx, 0.0, 0.155),
            rot=(0.0, 0.0, 0.0),
            keel_bias=-0.12, segs_u=12, subdiv=1,
        )
    for vi, (vx, vl, vw, vh) in enumerate((
        (-0.18, 0.25, 0.28, 0.085),
        (-0.42, 0.24, 0.26, 0.080),
    )):
        _build_keeled_osteoderm(
            f"Ankylo_ClubVentralScute_{vi}",
            length=vl, width=vw, height=vh,
            mat=mats["scute"], parent=tail_club_bone,
            local_pos=(vx, 0.0, -0.145),
            rot=(math.pi, 0.0, 0.0),
            keel_bias=-0.12, segs_u=12, subdiv=1,
        )


def _build_quadruped_foot(leg_bone, foot_center, foot_r, side, is_front, mats, prefix):
    """Builds a broad padded ankylosaur manus/pes with 5 (front) or 4 (rear) hooves at world Z=0."""
    fx, fy, fz = foot_center
    pad_rz = 0.095
    pad_z = fz + pad_rz
    _build_muscular_limb_segment(
        f"{prefix}_FootPad",
        (fx - 0.13, fy, pad_z),
        (fx + 0.16, fy, pad_z),
        lambda t, ang: (
            foot_r * (0.96 + 0.16 * math.sin(t * math.pi)),
            pad_rz * (1.0 - 0.16 * max(0.0, math.cos(ang)) * t),
            0.0,
            0.0,
        ),
        mats["hide"],
        leg_bone,
        prox_overlap=0.14, dist_overlap=0.14, radial_segs=18, height_segs=12,
    )

    toe_angles = (-0.72, -0.36, 0.0, 0.36, 0.72) if is_front else (-0.50, -0.17, 0.17, 0.50)
    for ti, yaw in enumerate(toe_angles):
        ang = yaw + side * 0.06
        dx = math.cos(ang)
        dy = math.sin(ang)
        t_start = Vector((fx + 0.06 + dx * 0.03, fy + dy * 0.08, fz + 0.064))
        t_end = Vector((fx + 0.06 + dx * 0.19, fy + dy * 0.21, fz + 0.048))
        _build_muscular_limb_segment(
            f"{prefix}_Toe{ti}",
            t_start,
            t_end,
            lambda t, a: (0.054 * (1.0 - 0.22 * t), 0.044 * (1.0 - 0.20 * t), 0.0, 0.0),
            mats["cranium"],
            leg_bone,
            prox_overlap=0.22, dist_overlap=0.06, radial_segs=12, height_segs=10,
        )
        _build_conical_horn(
            f"{prefix}_Hoof{ti}",
            length=0.11,
            base_r=0.042,
            direction=(dx * 0.94, dy * 0.94, -0.34),
            curve_offset=(0.01 * dx, 0.01 * dy, -0.004),
            mat=mats["horn"],
            parent=leg_bone,
            local_pos=t_end + Vector((0.0, 0.0, 0.006)),
            segs_u=10,
            segs_v=8,
            flat_y=1.10,
        )


def _build_forelimb(leg_bone, side, local_ground_z, mats, idx):
    """Sculpts a muscular armored Ankylosaurus forelimb with heavy lateral osteoderm plates."""
    ctrl = [
        (0.00,  -side * 0.16,  0.22, 0.28, 0.32,  0.00),  # Shoulder socket deep in torso
        (-0.04,  side * 0.02, -0.18, 0.26, 0.29, -0.02),  # Deltoid/triceps mass
        (-0.08,  side * 0.12, -0.52, 0.21, 0.23, -0.02),  # Lateral elbow bend
        (0.02,   side * 0.09, -0.84, 0.19, 0.20,  0.01),  # Muscular forearm
        (0.07,   side * 0.07, local_ground_z + 0.21, 0.17, 0.17, 0.01),  # Wrist
        (0.09,   side * 0.07, local_ground_z + 0.12, 0.16, 0.16, 0.00),  # Ankle inside FootPad
    ]
    _build_curved_limb_tube(
        f"Ankylo_Forelimb_{idx}",
        ctrl,
        mats["hide"],
        leg_bone,
        radial_segs=26,
        height_segs=36,
        v_uv_range=(0.25, 1.35),
        taper_start=True,
        taper_end=True,
    )

    # 6 heavy mosaic armor scutes protecting outer/anterior shoulder and forearm (portrait detail)
    for si, (sx, sy_off, sz, sw) in enumerate((
        (0.00, side * 0.295, -0.14, 0.19),
        (-0.03, side * 0.325, -0.34, 0.18),
        (-0.01, side * 0.335, -0.52, 0.17),
        (0.05, side * 0.305, -0.70, 0.16),
        (0.09, side * 0.285, -0.88, 0.15),
        (0.11, side * 0.265, -1.04, 0.14),
    )):
        _build_keeled_osteoderm(
            f"Ankylo_ForearmScute_{idx}_{si}",
            length=sw * 1.15,
            width=sw,
            height=0.092,
            mat=mats["scute"],
            parent=leg_bone,
            local_pos=(sx, sy_off, sz),
            rot=(side * 1.28, 0.16, -side * 0.22),
            keel_bias=-0.10,
            segs_u=10,
            subdiv=0,
        )

    _build_quadruped_foot(
        leg_bone,
        (0.11, side * 0.07, local_ground_z),
        foot_r=0.19,
        side=side,
        is_front=True,
        mats=mats,
        prefix=f"Bone_Leg{idx}",
    )


def _build_hindlimb(leg_bone, side, local_ground_z, mats, idx):
    """Sculpts a massive armored Ankylosaurus hindlimb with lateral thigh/shin scutes."""
    ctrl = [
        (0.00,  -side * 0.16,  0.22, 0.32, 0.38,  0.00),  # Pelvic hip socket inside carapace
        (0.08,   side * 0.02, -0.22, 0.30, 0.34,  0.02),  # Quadriceps & hamstring belly
        (0.14,   side * 0.06, -0.56, 0.22, 0.24,  0.02),  # Knee
        (-0.05,  side * 0.05, -0.88, 0.20, 0.22, -0.02),  # Gastrocnemius calf
        (-0.01,  side * 0.05, local_ground_z + 0.22, 0.18, 0.18, 0.00),  # Hock
        (0.02,   side * 0.05, local_ground_z + 0.12, 0.16, 0.16, 0.00),  # Ankle inside FootPad
    ]
    _build_curved_limb_tube(
        f"Ankylo_Hindlimb_{idx}",
        ctrl,
        mats["hide"],
        leg_bone,
        radial_segs=26,
        height_segs=36,
        v_uv_range=(0.25, 1.35),
        taper_start=True,
        taper_end=True,
    )

    for si, (sx, sy_off, sz, sw) in enumerate((
        (0.05, side * 0.325, -0.16, 0.20),
        (0.11, side * 0.315, -0.38, 0.19),
        (0.14, side * 0.285, -0.58, 0.17),
        (0.02, side * 0.275, -0.78, 0.16),
        (-0.01, side * 0.255, -0.96, 0.15),
        (0.02, side * 0.245, -1.12, 0.14),
    )):
        _build_keeled_osteoderm(
            f"Ankylo_HindScute_{idx}_{si}",
            length=sw * 1.15,
            width=sw,
            height=0.092,
            mat=mats["scute"],
            parent=leg_bone,
            local_pos=(sx, sy_off, sz),
            rot=(side * 1.32, 0.14, -side * 0.18),
            keel_bias=-0.10,
            segs_u=10,
            subdiv=0,
        )

    _build_quadruped_foot(
        leg_bone,
        (0.04, side * 0.05, local_ground_z),
        foot_r=0.20,
        side=side,
        is_front=False,
        mats=mats,
        prefix=f"Bone_Leg{idx}",
    )


def build_ankylo_high_definition():
    clear_scene()

    mats = {
        "hide": _make_trex_pbr_mat(
            "Mat_BodyPrimary",
            base_color=(0.35, 0.39, 0.32, 1.0),
            roughness=0.74,
            metallic=0.01,
            albedo_path=_tex("ankylo_albedo.png"),
            bump_path=_tex("ankylo_normal.png"),
            bump_strength=0.38,
        ),
        "cranium": _make_trex_pbr_mat(
            "Mat_BodyPrimary_Skull",
            base_color=(0.36, 0.39, 0.32, 1.0),
            roughness=0.64,
            metallic=0.02,
            albedo_path=_tex("ankylo_cranium_albedo.png"),
            bump_path=_tex("ankylo_cranium_normal.png"),
            bump_strength=0.42,
        ),
        "scute": _make_trex_pbr_mat(
            "Mat_Secondary",
            base_color=(0.25, 0.27, 0.23, 1.0),
            roughness=0.58,
            metallic=0.02,
            albedo_path=_tex("ankylo_scute_albedo.png"),
            bump_path=_tex("ankylo_scute_normal.png"),
            bump_strength=0.45,
        ),
        "horn": _make_trex_pbr_mat(
            "Mat_Accent",
            base_color=(0.48, 0.43, 0.35, 1.0),
            roughness=0.38,
            metallic=0.02,
            albedo_path=_tex("ankylo_horn_albedo.png"),
            bump_path=_tex("ankylo_horn_normal.png"),
            bump_strength=0.30,
        ),
        "beak": _make_trex_pbr_mat(
            "Mat_Beak",
            base_color=(0.20, 0.21, 0.18, 1.0),
            roughness=0.44,
            metallic=0.02,
            albedo_path=_tex("ankylo_beak_albedo.png"),
            bump_path=_tex("ankylo_beak_normal.png"),
            bump_strength=0.28,
        ),
        "mucosa": _make_trex_pbr_mat(
            "Mat_OralMucosa",
            base_color=(0.52, 0.16, 0.19, 1.0),
            roughness=0.24,
            metallic=0.02,
            albedo_path=_tex("trex_mucosa_albedo.png"),
            bump_path=_tex("trex_mucosa_bump.png"),
            bump_strength=0.22,
        ),
        "iris": make_pbr_material(
            "Mat_Eye",
            base_color=(0.98, 0.62, 0.10, 1.0),
            roughness=0.08,
            emissive=(0.42, 0.22, 0.04, 1.0),
            emissive_strength=0.20,
            albedo_path=_tex("ankylo_iris_albedo.png"),
        ),
        "pupil": make_pbr_material(
            "Mat_Pupil",
            base_color=(0.02, 0.02, 0.02, 1.0),
            roughness=0.06,
        ),
        "catchlight": make_pbr_material(
            "Mat_Catchlight",
            base_color=(1.0, 1.0, 1.0, 1.0),
            roughness=0.02,
            emissive=(1.0, 1.0, 1.0, 1.0),
            emissive_strength=0.85,
        ),
    }

    # Exact canonical bone hierarchy matching js/fighters/ankylosaurus.js & animations
    root = create_bone_node("Bone_Root", (0.0, 0.0, 0.0))
    hips = create_bone_node("Bone_Hips", (0.0, 0.0, 1.35), parent=root)
    torso = create_bone_node("Bone_Torso", (0.0, 0.0, 0.0), parent=hips)
    neck = create_bone_node("Bone_Neck", (1.22, 0.0, 0.06), parent=torso)
    head = create_bone_node("Bone_Head", (0.34, 0.0, -0.02), parent=neck)
    jaw = create_bone_node("Bone_Jaw", (0.18, 0.0, -0.14), parent=head)

    # Keep Bone_Tail0 parented to Bone_Torso so torso spins/crouches carry the tail cleanly
    tail0 = create_bone_node("Bone_Tail0", (-1.26, 0.0, 0.06), parent=torso)
    tail1 = create_bone_node("Bone_Tail1", (-0.68, 0.0, -0.03), parent=tail0)
    tail2 = create_bone_node("Bone_Tail2", (-0.68, 0.0, -0.03), parent=tail1)
    tail_club = create_bone_node("Special_TailClub", (-0.72, 0.0, 0.0), parent=tail2)

    spine_ctrl = [
        (-3.44, 0.0, 1.35, 0.003, 0.003),  # 0: Inside Special_TailClub root
        (-3.00, 0.0, 1.35, 0.135, 0.125),  # 1: Distal stiffened tail handle
        (-2.62, 0.0, 1.35, 0.165, 0.150),  # 2: Bone_Tail2
        (-1.94, 0.0, 1.38, 0.245, 0.220),  # 3: Bone_Tail1
        (-1.26, 0.0, 1.41, 0.420, 0.340),  # 4: Bone_Tail0 / caudal base
        (-0.82, 0.0, 1.48, 0.920, 0.500),  # 5: Rear pelvic carapace arch
        (-0.20, 0.0, 1.56, 1.180, 0.600),  # 6: Broadest central tank carapace
        (0.42,  0.0, 1.55, 1.140, 0.580),  # 7: Anterior thoracic dome
        (0.92,  0.0, 1.48, 0.860, 0.460),  # 8: Broad pectoral shoulder collar
        (1.22,  0.0, 1.41, 0.480, 0.370),  # 9: Bone_Neck base
        (1.44,  0.0, 1.40, 0.430, 0.310),  # 10: Mid-neck cervical ring support
        (1.62,  0.0, 1.40, 0.340, 0.210),  # 11: Atlas / skull occiput socket
        (1.74,  0.0, 1.39, 0.003, 0.003),  # 12: Internal skull cap
    ]
    master_spine = CatmullRomSpline3D(spine_ctrl)

    t_j_tail2 = 2.0 / 12.0
    t_j_tail1 = 3.0 / 12.0
    t_j_tail0 = 4.0 / 12.0
    t_j_neck = 9.0 / 12.0
    overlap = 0.045

    _build_continuous_spine_segment(
        "Ankylo_TailSeg2", master_spine,
        0.0, t_j_tail2 + overlap, None, t_j_tail2,
        (-2.62, 0.0, 1.35), tail2, mats["hide"], segs_u=28, segs_v=18,
    )
    _build_continuous_spine_segment(
        "Ankylo_TailSeg1", master_spine,
        t_j_tail2 - overlap, t_j_tail1 + overlap, t_j_tail2, t_j_tail1,
        (-1.94, 0.0, 1.38), tail1, mats["hide"], segs_u=30, segs_v=18,
    )
    _build_continuous_spine_segment(
        "Ankylo_TailSeg0", master_spine,
        t_j_tail1 - overlap, t_j_tail0 + overlap, t_j_tail1, t_j_tail0,
        (-1.26, 0.0, 1.41), tail0, mats["hide"], segs_u=32, segs_v=18,
    )
    _build_continuous_spine_segment(
        "Ankylo_Carapace", master_spine,
        t_j_tail0 - overlap, t_j_neck + overlap, t_j_tail0, t_j_neck,
        (0.0, 0.0, 1.35), torso, mats["hide"], segs_u=48, segs_v=36, v_uv_scale=1.55,
    )
    _build_continuous_spine_segment(
        "Ankylo_Neck", master_spine,
        t_j_neck - overlap, 1.0, t_j_neck, None,
        (1.22, 0.0, 1.41), neck, mats["hide"], segs_u=36, segs_v=22,
    )

    _add_carapace_and_cervical_armor(master_spine, torso, (0.0, 0.0, 1.35), neck, mats)
    _build_sculpted_skull_and_jaw(head, jaw, mats)
    _build_tail_armor_and_club((tail0, tail1, tail2), tail_club, mats)

    # 4 Stout quadruped limbs: Leg0/1 = Front Left/Right, Leg2/3 = Rear Left/Right
    leg_specs = (
        (0, (0.82,  0.72, -0.05),  1.0, True),
        (1, (0.82, -0.72, -0.05), -1.0, True),
        (2, (-0.78,  0.74, -0.02),  1.0, False),
        (3, (-0.78, -0.74, -0.02), -1.0, False),
    )
    for idx, hip_pos, side, is_front in leg_specs:
        leg = create_bone_node(f"Bone_Leg{idx}", hip_pos, parent=hips)
        local_ground_z = -(1.35 + hip_pos[2])
        if is_front:
            _build_forelimb(leg, side, local_ground_z, mats, idx)
        else:
            _build_hindlimb(leg, side, local_ground_z, mats, idx)

    out_path = os.path.join(OUT_DIR, "ankylo.glb")
    export_fighter_glb(out_path)
    return out_path
