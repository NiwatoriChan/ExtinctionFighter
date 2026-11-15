"""
tools/blender/pachyrhino_sculptor.py
Museum-grade paleontological & portrait-faithful Blender 5.2 builder for the
Pachyrhinosaurus canadensis GLB model (assets/models/fighters/pachyrhino.glb).
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
    build_osteoderm_plate,
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


def _tex(name):
    p = os.path.join(TEX_DIR, name)
    return p if os.path.exists(p) else None


def _build_horn_along_spline(
    name,
    ctrl_points,
    base_rx,
    base_rz,
    mat,
    parent,
    local_pos=(0.0, 0.0, 0.0),
    segs_u=16,
    segs_v=20,
    tip_taper=1.18,
    flute_amp=0.04,
):
    """
    Lofts a smooth C1-continuous tapered horn or beak along a 3D spline of control
    points [(x, y, z), ...] with UV v=0 at base -> v=1 at tip for keratin striation maps.
    """
    spline = CatmullRomSpline3D([(p[0], p[1], p[2]) for p in ctrl_points])
    rings_v = []
    rings_uv = []
    prev_tangent = None
    lat_axis = None

    for iv in range(segs_v + 1):
        v = iv / segs_v
        c_pt, _ = spline.eval_at(v)
        tangent = spline.tangent_at(v)
        if prev_tangent is None:
            init_lat = Vector((0.0, 1.0, 0.0))
            if abs(tangent.dot(init_lat)) > 0.92:
                init_lat = Vector((1.0, 0.0, 0.0))
            lat_axis = (init_lat - tangent * init_lat.dot(tangent)).normalized()
        else:
            q_rot = prev_tangent.rotation_difference(tangent)
            lat_axis = q_rot @ lat_axis
            lat_axis = lat_axis - tangent * lat_axis.dot(tangent)
            if lat_axis.length < 1e-6:
                lat_axis = Vector((0.0, 1.0, 0.0))
            lat_axis.normalize()
        up_axis = tangent.cross(lat_axis).normalized()
        prev_tangent = tangent.copy()

        scale_r = 0.003 if iv == segs_v else max(0.015, (1.0 - (v ** tip_taper)))
        collar = 1.0 + 0.08 * math.sin(min(1.0, v * 5.0) * math.pi) if v < 0.2 else 1.0
        ry = base_rx * scale_r * collar
        rz = base_rz * scale_r * collar

        row_v = []
        row_uv = []
        for iu in range(segs_u):
            u = iu / segs_u
            ang = u * math.pi * 2.0
            sin_a = math.sin(ang)
            cos_a = math.cos(ang)
            flute = 1.0 + flute_amp * math.cos(ang * 7.0) * math.sin(v * math.pi)
            keel = 1.0 + 0.14 * max(0.0, cos_a) ** 3
            pt = c_pt + lat_axis * (sin_a * ry * flute) + up_axis * (cos_a * rz * flute * keel)
            row_v.append(pt)
            row_uv.append((u, v))
        rings_v.append(row_v)
        rings_uv.append(row_uv)

    bm = _build_grid_bmesh(rings_v, rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    return attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=local_pos, subdiv=0)


def _build_conical_horn(
    name,
    length,
    base_r,
    direction,
    curve_offset,
    mat,
    parent,
    local_pos=(0.0, 0.0, 0.0),
    segs_u=14,
    segs_v=14,
    flat_y=0.86,
    flute_amp=0.04,
):
    """Convenience wrapper building a curved conical horn/spike from base to tip."""
    d = Vector(direction).normalized()
    c_off = Vector(curve_offset)
    pts = [
        Vector((0.0, 0.0, 0.0)),
        d * (length * 0.34) + c_off * 0.22,
        d * (length * 0.70) + c_off * 0.62,
        d * length + c_off,
    ]
    return _build_horn_along_spline(
        name, pts, base_r * flat_y, base_r * 1.08, mat, parent,
        local_pos=local_pos, segs_u=segs_u, segs_v=segs_v, flute_amp=flute_amp,
    )


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
    segs_u=40,
    segs_v=26,
):
    """
    Lofts a slice [t_start, t_end] of the Pachyrhinosaurus master spine spline in
    the local space of parent_bone with C1-continuous outer hide & internal ball-joints.
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

        c_world, vals = master_spline.eval_at(t)
        ry, rz = vals[0] * cap_scale, vals[1] * cap_scale
        tangent = master_spline.tangent_at(t)

        lat_axis = Vector((0.0, 1.0, 0.0))
        up_axis = tangent.cross(lat_axis).normalized()
        lat_axis = up_axis.cross(tangent).normalized()

        spine_env = math.sin(t * math.pi) * cap_scale
        scute_wave = 0.5 + 0.5 * math.cos(t * math.pi * 38.0)

        row_verts = []
        row_uvs = []
        for iu in range(segs_u):
            u = iu / segs_u
            theta = u * math.pi * 2.0
            cos_t = math.cos(theta)
            sin_t = math.sin(theta)
            abs_sin = abs(sin_t)

            y_lat = sin_t * ry
            z_vert = cos_t * rz

            # 1. Armored dorsal ridge & paravertebral dermal tubercles along spine
            if cos_t > 0.54:
                if abs_sin < 0.20:
                    med_arch = 1.0 - abs_sin / 0.20
                    z_vert += med_arch * (0.048 + 0.042 * scute_wave) * rz * spine_env
                elif 0.25 < abs_sin < 0.62:
                    lat_arch = math.sin(((abs_sin - 0.25) / 0.37) * math.pi)
                    z_vert += lat_arch * (0.028 + 0.024 * scute_wave) * rz * spine_env

            # 2. Broad ceratopsian barrel ribcage, shoulders & pelvic iliac swell
            if 0.38 < t < 0.78 and abs_sin > 0.45:
                y_lat *= 1.06
            if 0.60 < t < 0.78 and cos_t > 0.20:
                z_vert *= 1.05  # Muscular shoulder/withers hump

            # 3. Heavy wrinkled gular dewlap & brisket folds under neck/chest
            if 0.72 < t < 0.94 and cos_t < -0.25:
                dewlap_env = math.sin(((t - 0.72) / 0.22) * math.pi)
                throat_folds = 1.0 + 0.075 * math.sin(t * math.pi * 30.0)
                z_vert *= (1.0 + 0.16 * dewlap_env) * throat_folds
            elif 0.42 < t < 0.72 and cos_t < -0.55:
                z_vert *= 1.05

            world_pt = c_world + lat_axis * y_lat + up_axis * z_vert
            row_verts.append(world_pt - origin)
            row_uvs.append((u, t * 2.2))

        rings_verts.append(row_verts)
        rings_uvs.append(row_uvs)

    bm = _build_grid_bmesh(rings_verts, rings_uvs, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    return attach_mesh_obj(bm, name, mat=mat, parent=parent_bone, local_pos=(0.0, 0.0, 0.0), subdiv=0)


def _build_sculpted_skull(head_bone, mats):
    """
    Sculpts the high-resolution Pachyrhinosaurus cranium (56x68), hooked keratinous
    rostral parrot beak, deeply pitted cauliflower nasal boss + 26 relief nodules,
    supraorbital bosses, postorbital horns, jugal cheek spikes, and recessed amber eyes.
    """
    pitch_q = Euler((0.0, 0.06, 0.0), "XYZ").to_matrix().to_4x4()

    slices = [
        (-0.18, 0.14, -0.10, 0.002),  # Closed occipital cap inside neck
        (-0.04, 0.34, -0.22, 0.42),   # Broad occiput & cheek jowls
        (0.14,  0.38, -0.24, 0.46),   # Wide flaring jugal cheekbone arch
        (0.32,  0.38, -0.20, 0.40),   # Orbital / supraorbital region
        (0.50,  0.35, -0.16, 0.35),   # Broad mid-snout under nasal boss
        (0.72,  0.26, -0.15, 0.28),   # Deep narial fossa region
        (0.90,  0.10, -0.18, 0.17),   # Narrow compressed rostral core
        (0.98, -0.07, -0.21, 0.065),  # Rostral core tucked inside keratin beak sheath
        (1.02, -0.13, -0.18, 0.002),  # Closed rostral cap safely inside beak
    ]
    top_spline = CatmullRomSpline3D([(s[0], s[3], s[1]) for s in slices])
    bot_spline = CatmullRomSpline3D([(s[0], s[3], s[2]) for s in slices])

    radial_steps = 56
    length_steps = 68
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

        brow_prof = math.exp(-(((v - 0.38) / 0.10) ** 2))
        orbit_prof = math.exp(-(((v - 0.40) / 0.065) ** 2))
        jugal_prof = math.exp(-(((v - 0.24) / 0.09) ** 2))
        cheek_prof = math.exp(-(((v - 0.58) / 0.15) ** 2))

        row_v = []
        row_uv = []
        for ix in range(radial_steps):
            u = ix / radial_steps
            angle = u * math.pi * 2.0
            s = math.sin(angle)
            c = math.cos(angle)
            abs_s = abs(s)
            sign_s = 1.0 if s >= 0.0 else -1.0

            ly = sign_s * (abs_s ** 0.78) * half_w
            mid_z = 0.5 * (top_z + bot_z)
            half_h = max(0.01, 0.5 * (top_z - bot_z))
            if c >= 0.0:
                lz = mid_z + half_h * (c ** 0.72)
                # Heavy supraorbital brow overhang above eye
                if brow_prof > 0.01 and 0.20 < c < 0.88:
                    arch = math.sin(((c - 0.20) / 0.68) * math.pi)
                    cobble = 0.78 + 0.22 * math.cos(v * math.pi * 24.0)
                    lz += brow_prof * arch * 0.085 * cobble
                    ly += sign_s * brow_prof * arch * 0.075 * cobble
            else:
                lz = mid_z - half_h * ((-c) ** 0.78)

            # Deep recessed bony orbital cavity
            if orbit_prof > 0.01 and -0.22 < c < 0.35:
                orb_d = math.sin(((c + 0.22) / 0.57) * math.pi)
                ly *= (1.0 - 0.26 * orbit_prof * orb_d)

            # Subtle concentric eyelid/cheek skin wrinkles below eye
            if orbit_prof > 0.01 and -0.42 < c <= -0.18:
                wrinkle = 0.5 + 0.5 * math.cos(((c + 0.42) / 0.24) * math.pi * 3.0)
                ly += sign_s * orbit_prof * (0.010 + 0.010 * wrinkle)

            # Smoothly contoured flaring jugal cheekbone arch
            if jugal_prof > 0.01 and -0.68 < c < 0.05:
                j_arch = math.sin(((c + 0.68) / 0.73) * math.pi)
                cobble = 0.84 + 0.16 * math.cos(v * math.pi * 18.0)
                ly += sign_s * jugal_prof * j_arch * 0.075 * cobble
                lz -= jugal_prof * j_arch * 0.018 * cobble

            # Muscular maxillary cheek pouch
            if cheek_prof > 0.01 and -0.65 < c < 0.05:
                c_arch = math.sin(((c + 0.65) / 0.70) * math.pi)
                ly += sign_s * cheek_prof * c_arch * 0.042

            # Deep lateral narial fossa (nostril) with rolled rim
            naris_u = (v - 0.77) / 0.068
            naris_v = (c + 0.10) / 0.22
            naris_d2 = naris_u * naris_u + naris_v * naris_v
            if naris_d2 < 1.0:
                n_depth = (1.0 - naris_d2) ** 1.4
                ly *= (1.0 - 0.42 * n_depth)
            elif 1.0 <= naris_d2 < 2.2:
                hood = math.sin(((naris_d2 - 1.0) / 1.2) * math.pi)
                ly += sign_s * 0.028 * hood
                lz += 0.010 * hood * (1.0 if naris_v > 0 else -0.4)

            pt = pitch_q @ Vector((fx, ly, lz))
            row_v.append(pt)
            row_uv.append((u, v * 1.35))

        skull_rings_v.append(row_v)
        skull_rings_uv.append(row_uv)

    bm_skull = _build_grid_bmesh(skull_rings_v, skull_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_skull, "Pachy_UpperCranium", mat=mats["cranium"], parent=head_bone)

    # Compact, vertically deep, laterally pinched hooked rostral parrot beak wrapping snout tip
    beak_slices = [
        (0.80,  0.14, -0.17, 0.185),  # Posterior sheath collar overlapping premaxilla
        (0.90,  0.11, -0.18, 0.155),  # Mid-sheath vertical wall
        (0.99,  0.04, -0.19, 0.115),  # Forward rostral arch
        (1.05, -0.07, -0.22, 0.072),  # Narrow anterior keel curving down
        (1.07, -0.18, -0.25, 0.032),  # Tapering hook tip
        (1.05, -0.27, -0.27, 0.004),  # Razor-sharp hooked apex
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
            # Sharpened dorsal/anterior parrot keel & thin tomium cutting rim
            w_exp = 1.15 if v > 0.45 else 0.85
            ly = math.copysign(1.0, sa) * (abs_s ** w_exp) * b_hw
            lz = b_mid_z + (b_hh * (ca ** 0.72) if ca >= 0.0 else -b_hh * ((-ca) ** 0.80))
            if ca > 0.6 and abs_s < 0.35:
                lz += 0.012 * (1.0 - abs_s / 0.35) * math.sin(v * math.pi)
            row_v.append(pitch_q @ Vector((bx, ly, lz)))
            row_uv.append((u, v * 0.90))
        b_rings_v.append(row_v)
        b_rings_uv.append(row_uv)
    bm_beak = _build_grid_bmesh(b_rings_v, b_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_beak, "Pachy_UpperBeak", mat=mats["horn"], parent=head_bone)

    # Colossal gnarled cauliflower pachyostotic nasal boss
    boss_slices = [
        (0.14, 0.14, 0.002),
        (0.24, 0.30, 0.22),
        (0.38, 0.35, 0.38),
        (0.54, 0.34, 0.40),
        (0.70, 0.27, 0.34),
        (0.80, 0.18, 0.21),
        (0.86, 0.13, 0.002),
    ]
    boss_spline = CatmullRomSpline3D([(b[0], b[2], b[1]) for b in boss_slices])
    nb_u, nb_v = 48, 44
    nb_rings_v, nb_rings_uv = [], []
    for iv in range(nb_v + 1):
        v = iv / nb_v
        bp, _ = boss_spline.eval_at(v)
        hw = max(0.001, bp.y)
        cz = bp.z
        hz = 0.01 if (iv == 0 or iv == nb_v) else (0.14 + 0.07 * math.sin(v * math.pi))
        row_v, row_uv = [], []
        for iu in range(nb_u):
            u = iu / nb_u
            ang = u * math.pi * 2.0
            sa, ca = math.sin(ang), math.cos(ang)
            abs_s = abs(sa)

            # Multi-frequency cauliflower pachyostotic lobes & transverse boss furrows
            cauli = (
                1.0
                + 0.095 * math.sin(v * math.pi * 11.0 + abs_s * 6.0)
                + 0.065 * math.cos(ang * 9.0 + v * 14.0)
                + 0.045 * math.sin(v * math.pi * 21.0)
            )
            ly = math.copysign(1.0, sa) * (abs_s ** 0.72) * hw * cauli
            lz = cz + (math.copysign(1.0, ca) * (abs(ca) ** 0.74)) * hz * cauli
            # Deep median longitudinal boss furrow along top midline
            if ca > 0.35 and abs_s < 0.28:
                cleft = math.cos((abs_s / 0.28) * math.pi * 0.5)
                lz -= cleft * 0.045 * math.sin(v * math.pi)
            # Flattened/battering-ram dorsal table with raised peripheral rim
            if ca > 0.55 and 0.28 <= abs_s < 0.72:
                lz += 0.025 * math.sin(v * math.pi)
            row_v.append(pitch_q @ Vector((bp.x, ly, lz)))
            row_uv.append((u, v))
        nb_rings_v.append(row_v)
        nb_rings_uv.append(row_uv)
    bm_boss = _build_grid_bmesh(nb_rings_v, nb_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_boss, "Pachy_NasalBoss", mat=mats["boss"], parent=head_bone)

    # 26 Sculpted High-Relief Cauliflower Osteoderm Nodules across the nasal boss
    nodule_specs = [
        # Central ridge & bilateral twin rows along dorsal boss
        (0.26,  0.12, 0.38, 0.075, (0.0, 0.1, 0.0)),
        (0.26, -0.12, 0.38, 0.075, (0.0, 0.1, 0.0)),
        (0.36,  0.18, 0.44, 0.090, (0.2, 0.15, 0.1)),
        (0.36, -0.18, 0.44, 0.090, (-0.2, 0.15, -0.1)),
        (0.46,  0.16, 0.45, 0.095, (0.15, 0.2, 0.0)),
        (0.46, -0.16, 0.45, 0.095, (-0.15, 0.2, 0.0)),
        (0.56,  0.14, 0.42, 0.088, (0.15, 0.28, 0.0)),
        (0.56, -0.14, 0.42, 0.088, (-0.15, 0.28, 0.0)),
        (0.68,  0.11, 0.35, 0.082, (0.1, 0.42, 0.0)),
        (0.68, -0.11, 0.35, 0.082, (-0.1, 0.42, 0.0)),
        (0.78,  0.07, 0.26, 0.072, (0.1, 0.65, 0.0)),
        (0.78, -0.07, 0.26, 0.072, (-0.1, 0.65, 0.0)),
        (0.84,  0.00, 0.18, 0.068, (0.0, 0.85, 0.0)),
        # Lateral cauliflower clusters overhanging sides of snout
        (0.34,  0.30, 0.34, 0.082, (0.65, 0.1, 0.0)),
        (0.34, -0.30, 0.34, 0.082, (-0.65, 0.1, 0.0)),
        (0.46,  0.34, 0.33, 0.088, (0.72, 0.2, 0.0)),
        (0.46, -0.34, 0.33, 0.088, (-0.72, 0.2, 0.0)),
        (0.58,  0.31, 0.30, 0.082, (0.70, 0.25, 0.0)),
        (0.58, -0.31, 0.30, 0.082, (-0.70, 0.25, 0.0)),
        (0.70,  0.24, 0.24, 0.072, (0.65, 0.35, 0.0)),
        (0.70, -0.24, 0.24, 0.072, (-0.65, 0.35, 0.0)),
        # Bridge transition nodules between eyes & anterior boss cliff cap
        (0.20,  0.00, 0.36, 0.080, (0.0, -0.1, 0.0)),
        (0.30,  0.00, 0.40, 0.076, (0.0, 0.05, 0.0)),
        (0.42,  0.00, 0.41, 0.074, (0.0, 0.15, 0.0)),
        (0.60,  0.00, 0.38, 0.070, (0.0, 0.35, 0.0)),
        (0.74,  0.00, 0.28, 0.072, (0.0, 0.60, 0.0)),
        (0.81,  0.00, 0.20, 0.112, (0.0, 0.95, 0.0)),
    ]
    for idx, (nx, ny, nz, nrad, nrot) in enumerate(nodule_specs):
        pos = pitch_q @ Vector((nx, ny, nz))
        build_osteoderm_plate(
            f"Pachy_BossNodule_{idx}",
            width=nrad * 1.9,
            height=nrad * 1.8,
            thickness=nrad * 1.15,
            mat=mats["boss"],
            parent=head_bone,
            local_pos=pos,
            rot=nrot,
            shape="hex",
        )

    # Supraorbital bosses, postorbital horns, jugal spikes & recessed eyes (Left +1 / Right -1)
    for side in (-1, 1):
        s_tag = "L" if side > 0 else "R"

        # Supraorbital brow boss shield
        build_osteoderm_plate(
            f"Pachy_BrowBoss_{s_tag}",
            width=0.28,
            height=0.28,
            thickness=0.14,
            mat=mats["boss"],
            parent=head_bone,
            local_pos=pitch_q @ Vector((0.28, side * 0.32, 0.26)),
            rot=(side * 0.48, 0.14, 0.0),
            shape="hex",
        )

        # Backward-swept postorbital & frontal horns with basal osteoderm collars
        po_base = pitch_q @ Vector((0.12, side * 0.24, 0.34))
        build_osteoderm_plate(
            f"Pachy_PostorbitalCollar_{s_tag}",
            width=0.22,
            height=0.22,
            thickness=0.10,
            mat=mats["boss"],
            parent=head_bone,
            local_pos=po_base,
            rot=(side * 0.42, -0.35, 0.0),
            shape="hex",
        )
        _build_conical_horn(
            f"Pachy_PostorbitalHorn_{s_tag}",
            length=0.32,
            base_r=0.082,
            direction=(-0.36, side * 0.38, 0.85),
            curve_offset=(-0.06, side * 0.02, 0.02),
            mat=mats["horn"],
            parent=head_bone,
            local_pos=po_base,
            segs_u=14,
            segs_v=14,
            flute_amp=0.05,
        )
        mf_base = pitch_q @ Vector((-0.10, side * 0.14, 0.52))
        build_osteoderm_plate(
            f"Pachy_MedialFrillCollar_{s_tag}",
            width=0.18,
            height=0.18,
            thickness=0.08,
            mat=mats["boss"],
            parent=head_bone,
            local_pos=mf_base,
            rot=(side * 0.26, -0.45, 0.0),
            shape="hex",
        )
        _build_conical_horn(
            f"Pachy_MedialFrillHorn_{s_tag}",
            length=0.26,
            base_r=0.068,
            direction=(-0.48, side * 0.24, 0.84),
            curve_offset=(-0.05, -side * 0.02, 0.02),
            mat=mats["horn"],
            parent=head_bone,
            local_pos=mf_base,
            segs_u=12,
            segs_v=12,
            flute_amp=0.05,
        )

        # Heavy jugal cheek boss & sharp forward-outward-downward cheek spike
        build_osteoderm_plate(
            f"Pachy_JugalBoss_{s_tag}",
            width=0.24,
            height=0.24,
            thickness=0.12,
            mat=mats["boss"],
            parent=head_bone,
            local_pos=pitch_q @ Vector((0.10, side * 0.42, -0.06)),
            rot=(side * 1.15, 0.08, 0.0),
            shape="hex",
        )
        _build_conical_horn(
            f"Pachy_JugalSpike_{s_tag}",
            length=0.30,
            base_r=0.076,
            direction=(0.40, side * 0.85, -0.34),
            curve_offset=(0.04, side * 0.02, -0.02),
            mat=mats["horn"],
            parent=head_bone,
            local_pos=pitch_q @ Vector((0.11, side * 0.43, -0.07)),
            segs_u=12,
            segs_v=12,
            flute_amp=0.05,
        )

        # Recessed eye socket oriented laterally & slightly forward with layered iris/pupil/catchlight
        eye_center = pitch_q @ Vector((0.32, side * 0.325, 0.095))
        eye_grp = create_bone_node(f"Pachy_EyeSocket_{s_tag}", eye_center, parent=head_bone)
        eye_grp.rotation_euler = (-0.04, 0.04, -side * 0.28)

        bm_sh = bmesh.new()
        bmesh.ops.create_uvsphere(bm_sh, u_segments=14, v_segments=12, radius=0.052)
        sh_obj = attach_mesh_obj(
            bm_sh, f"Pachy_OrbitShadow_{s_tag}", mat=mats["pupil"], parent=eye_grp,
            local_pos=(0.0, -side * 0.024, 0.0),
        )
        sh_obj.scale = (0.88, 0.65, 0.88)

        bm_ir = bmesh.new()
        uv_ir = bm_ir.loops.layers.uv.new("UVMap")
        bmesh.ops.create_uvsphere(bm_ir, u_segments=20, v_segments=16, radius=0.054)
        for f in bm_ir.faces:
            for loop in f.loops:
                co = loop.vert.co / 0.054
                loop[uv_ir].uv = (0.5 + co.x * 0.46, 0.5 + co.z * 0.46)
        bmesh.ops.recalc_face_normals(bm_ir, faces=bm_ir.faces)
        ir_obj = attach_mesh_obj(
            bm_ir, f"Pachy_Eye_{s_tag}", mat=mats["iris"], parent=eye_grp,
            local_pos=(0.0, side * 0.008, 0.0),
        )
        ir_obj.scale = (1.0, 0.92, 1.0)

        bm_pu = bmesh.new()
        bmesh.ops.create_uvsphere(bm_pu, u_segments=14, v_segments=12, radius=0.025)
        pu_obj = attach_mesh_obj(
            bm_pu, f"Pachy_Eye_{s_tag}_Pupil", mat=mats["pupil"], parent=eye_grp,
            local_pos=(0.0, side * 0.046, 0.0),
        )
        pu_obj.scale = (0.56, 0.56, 0.88)

        bm_cl = bmesh.new()
        bmesh.ops.create_uvsphere(bm_cl, u_segments=8, v_segments=8, radius=0.008)
        attach_mesh_obj(
            bm_cl, f"Pachy_EyeCatchlight_{s_tag}", mat=mats["catchlight"], parent=eye_grp,
            local_pos=(0.012, side * 0.054, 0.014),
        )

        _build_muscular_limb_segment(
            f"Pachy_UpperEyelid_{s_tag}",
            (-0.054, side * 0.022, 0.030),
            (0.056, side * 0.022, 0.024),
            lambda t, ang: (0.024 * math.sin(t * math.pi + 0.2), 0.020, 0.0, 0.008 * math.sin(t * math.pi)),
            mats["cranium"],
            eye_grp,
            prox_overlap=0.1, dist_overlap=0.1, radial_segs=12, height_segs=10,
        )
        _build_muscular_limb_segment(
            f"Pachy_LowerEyelid_{s_tag}",
            (-0.050, side * 0.020, -0.028),
            (0.052, side * 0.020, -0.024),
            lambda t, ang: (0.020 * math.sin(t * math.pi + 0.2), 0.016, 0.0, -0.006 * math.sin(t * math.pi)),
            mats["cranium"],
            eye_grp,
            prox_overlap=0.1, dist_overlap=0.1, radial_segs=12, height_segs=10,
        )


def _build_sculpted_frill(head_bone, mats):
    """
    Sculpts the sweeping heart-shaped parietosquamosal frill shield with concave
    bilateral parietal ocellus basins, thickened scalloped rim, median bar scutes,
    giant sweeping P3 bull horns, P2 medial horns, and 6 epoccipital spikes per side.
    """
    frill_spine = CatmullRomSpline3D([
        (0.14,  0.0, -0.02, 0.46, 0.15),   # Base squamosal root blending into cranium
        (0.00,  0.0,  0.22, 0.70, 0.13),   # Lower lateral flare
        (-0.18, 0.0,  0.52, 0.90, 0.115),  # Mid-parietal shield
        (-0.36, 0.0,  0.82, 0.98, 0.105),  # Broad upper-mid shield
        (-0.50, 0.0,  1.06, 0.92, 0.095),  # Upper corner flare
        (-0.58, 0.0,  1.20, 0.68, 0.080),  # Broad dorsal crest
        (-0.62, 0.0,  1.24, 0.01, 0.004),  # Smooth closed crest cap
    ])

    f_u, f_v = 56, 48
    f_rings_v, f_rings_uv = [], []
    for iv in range(f_v + 1):
        v = iv / f_v
        pt, vals = frill_spine.eval_at(v)
        half_w = max(0.002, vals[0])
        half_th = max(0.002, vals[1])
        tan = frill_spine.tangent_at(v)
        # Normal perpendicular to width (+Y) and frill spine tangent (faces forward/+X and slightly up)
        nrm = tan.cross(Vector((0.0, 1.0, 0.0))).normalized()
        if nrm.x < 0.0:
            nrm = -nrm

        row_v, row_uv = [], []
        for iu in range(f_u):
            u = iu / f_u
            ang = u * math.pi * 2.0
            sa = math.sin(ang)  # -1..+1 across lateral Y width
            ca = math.cos(ang)  # +1 = anterior face, -1 = posterior face
            abs_s = abs(sa)

            y_lat = math.copysign(1.0, sa) * (abs_s ** 0.84) * half_w
            # Scalloped lateral margins for 6 epoccipital sockets
            scallop = 1.0 + 0.055 * math.sin(v * math.pi * 11.0) * (abs_s ** 2)
            y_lat *= scallop

            # Heart-shaped central dorsal V-notch at the top midline
            z_notch = 0.0
            if 0.66 < v < 0.96 and abs_s < 0.38:
                notch_w = math.sin(((v - 0.66) / 0.30) * math.pi)
                notch_c = math.cos((abs_s / 0.38) * math.pi * 0.5)
                z_notch = -0.15 * notch_w * notch_c

            # Thickness modulation: thick rolled perimeter rim + central parietal bar + concave fenestrae
            th_mod = 1.0
            if abs_s > 0.66:
                th_mod += 0.45 * ((abs_s - 0.66) / 0.34)
            if abs_s < 0.16:
                th_mod += 0.48 * (1.0 - abs_s / 0.16)

            # Bilateral parietal fenestrae / ocellus basins (recessed anterior & slightly posterior)
            basin_r2 = ((abs_s - 0.45) / 0.26) ** 2 + ((v - 0.58) / 0.24) ** 2
            basin_dip = 0.0
            if basin_r2 < 1.0 and iv < f_v - 2:
                basin_dip = -0.068 * ((1.0 - basin_r2) ** 1.25) * (1.0 if ca > 0 else 0.45)

            thick_off = math.copysign(1.0, ca) * (abs(ca) ** 0.65) * half_th * th_mod + (
                basin_dip if ca > 0 else -basin_dip
            )
            world_pt = Vector((pt.x, y_lat, pt.z + z_notch)) + nrm * thick_off
            row_v.append(world_pt)
            row_uv.append((u, v * 1.4))
        f_rings_v.append(row_v)
        f_rings_uv.append(row_uv)

    bm_frill = _build_grid_bmesh(f_rings_v, f_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_frill, "Pachy_FrillShield", mat=mats["cranium"], parent=head_bone)

    # Median parietal ridge osteoderms climbing between the fenestrae
    for mi, (mx, mz, mr) in enumerate((
        (-0.08, 0.48, 0.105),
        (-0.22, 0.70, 0.115),
        (-0.36, 0.94, 0.105),
    )):
        build_osteoderm_plate(
            f"Pachy_FrillMidScute_{mi}",
            width=mr * 1.9,
            height=mr * 2.1,
            thickness=mr * 1.15,
            mat=mats["boss"],
            parent=head_bone,
            local_pos=(mx, 0.0, mz),
            rot=(0.0, 0.48, 0.0),
            shape="hex",
        )

    # Bilateral ocelli basin plates, giant P3 sweeping bull horns, P2 medial horns & 6 epoccipitals
    for side in (-1, 1):
        s_tag = "L" if side > 0 else "R"

        # Warm terracotta-ochre contoured ocellus plate seated cleanly inside each concave parietal basin
        bm_oc = bmesh.new()
        uv_oc = bm_oc.loops.layers.uv.new("UVMap")
        bmesh.ops.create_uvsphere(bm_oc, u_segments=26, v_segments=18, radius=0.215)
        for v in bm_oc.verts:
            v.co.x *= 0.16
            v.co.y *= 0.92
            v.co.z *= 1.06
        for f in bm_oc.faces:
            for loop in f.loops:
                co = loop.vert.co
                loop[uv_oc].uv = (0.5 + co.y * 2.1, 0.5 + co.z * 1.9)
        bmesh.ops.recalc_face_normals(bm_oc, faces=bm_oc.faces)
        oc_obj = attach_mesh_obj(
            bm_oc, f"Pachy_FrillOcellus_{s_tag}", mat=mats["ocellus"], parent=head_bone,
            local_pos=(-0.27, side * 0.42, 0.71),
        )
        oc_obj.rotation_euler = Euler((side * 0.08, -0.50, side * -0.14), "XYZ")

        # 4 sculpted rim tubercles framing each parietal ocellus basin
        for ri, (rx, ry, rz) in enumerate((
            (-0.18, side * 0.24, 0.62),
            (-0.16, side * 0.56, 0.58),
            (-0.38, side * 0.28, 0.88),
            (-0.36, side * 0.58, 0.86),
        )):
            build_osteoderm_plate(
                f"Pachy_OcellusRim_{s_tag}_{ri}",
                width=0.11,
                height=0.11,
                thickness=0.055,
                mat=mats["boss"],
                parent=head_bone,
                local_pos=(rx, ry, rz),
                rot=(side * 0.2, 0.48, 0.0),
                shape="hex",
            )

        # Giant P3 sweeping lateral bull horns (signature portrait crown arcing outward, back, & upward)
        p3_base = (-0.44, side * 0.56, 1.00)
        build_osteoderm_plate(
            f"Pachy_P3Collar_{s_tag}",
            width=0.30,
            height=0.30,
            thickness=0.14,
            mat=mats["boss"],
            parent=head_bone,
            local_pos=p3_base,
            rot=(side * 0.45, 0.52, 0.0),
            shape="hex",
        )
        p3_pts = [
            p3_base,
            (-0.56, side * 0.86, 1.16),
            (-0.68, side * 1.05, 1.32),
            (-0.75, side * 1.06, 1.46),
            (-0.76, side * 0.94, 1.54),
        ]
        _build_horn_along_spline(
            f"Pachy_OccipitalHorn_{s_tag}",
            p3_pts,
            base_rx=0.14,
            base_rz=0.15,
            mat=mats["horn"],
            parent=head_bone,
            segs_u=18,
            segs_v=22,
            tip_taper=1.15,
            flute_amp=0.07,
        )

        # Medial apex curving horns (P2) flanking top central V-notch and sweeping back-inward
        p2_pts = [
            (-0.52, side * 0.24, 1.12),
            (-0.58, side * 0.20, 1.24),
            (-0.66, side * 0.12, 1.34),
            (-0.72, side * 0.06, 1.40),
        ]
        _build_horn_along_spline(
            f"Pachy_InnerFrillHorn_{s_tag}",
            p2_pts,
            base_rx=0.082,
            base_rz=0.088,
            mat=mats["horn"],
            parent=head_bone,
            segs_u=14,
            segs_v=16,
            tip_taper=1.18,
            flute_amp=0.06,
        )

        # 6 Symmetrical thick recurved marginal epoccipital spikes with basal scute collars
        ep_specs = [
            (0.01,  side * 0.59, 0.18, (-0.08, side * 0.86, -0.18), 0.22, 0.072),
            (-0.09, side * 0.75, 0.36, (-0.22, side * 0.90, -0.02), 0.26, 0.078),
            (-0.20, side * 0.87, 0.56, (-0.34, side * 0.88,  0.14), 0.29, 0.084),
            (-0.32, side * 0.92, 0.76, (-0.42, side * 0.84,  0.30), 0.31, 0.088),
            (-0.43, side * 0.89, 0.94, (-0.50, side * 0.76,  0.46), 0.31, 0.086),
            (-0.51, side * 0.75, 1.08, (-0.58, side * 0.64,  0.62), 0.28, 0.078),
        ]
        for ei, (ex, ey, ez, edir, elen, erad) in enumerate(ep_specs):
            build_osteoderm_plate(
                f"Pachy_EpoccipitalCollar_{s_tag}_{ei}",
                width=erad * 2.2,
                height=erad * 2.2,
                thickness=erad * 1.1,
                mat=mats["boss"],
                parent=head_bone,
                local_pos=(ex, ey, ez),
                rot=(side * 0.7, 0.45, 0.0),
                shape="hex",
            )
            _build_conical_horn(
                f"Pachy_Epoccipital_{s_tag}_{ei}",
                length=elen,
                base_r=erad,
                direction=edir,
                curve_offset=(-0.06, -side * 0.02, 0.05),
                mat=mats["horn"],
                parent=head_bone,
                local_pos=(ex, ey, ez),
                segs_u=12,
                segs_v=12,
                flat_y=0.74,
                flute_amp=0.06,
            )


def _build_sculpted_jaw(jaw_bone, mats):
    """Sculpts the heavy mandible, up-curved predentary lower beak, and grooved tongue."""
    jaw_q = Euler((0.0, 0.12, 0.0), "XYZ").to_matrix().to_4x4()

    m_slices = [
        (-0.10,  0.04, -0.08, 0.002),
        ( 0.00,  0.10, -0.20, 0.32),
        ( 0.20,  0.08, -0.22, 0.31),
        ( 0.44,  0.04, -0.18, 0.24),
        ( 0.68,  0.02, -0.14, 0.16),
        ( 0.84,  0.05, -0.08, 0.09),
        ( 0.91,  0.07, -0.02, 0.002),
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
                lz = pt.z * rim + (pt.z - 0.045 * math.sin(v * math.pi)) * (1.0 - rim)
            row_v.append(jaw_q @ Vector((pb.x, ly, lz)))
            row_uv.append((u, v))
        m_rings_v.append(row_v)
        m_rings_uv.append(row_uv)

    bm_mand = _build_grid_bmesh(m_rings_v, m_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_mand, "Pachy_Mandible", mat=mats["cranium"], parent=jaw_bone)

    # Up-curved keratinous predentary lower beak opposing the upper parrot beak
    lb_pts = [
        jaw_q @ Vector((0.68, 0.0, -0.12)),
        jaw_q @ Vector((0.80, 0.0, -0.09)),
        jaw_q @ Vector((0.89, 0.0, -0.02)),
        jaw_q @ Vector((0.92, 0.0,  0.05)),
    ]
    _build_horn_along_spline(
        "Pachy_LowerBeak", lb_pts, base_rx=0.085, base_rz=0.075, mat=mats["horn"], parent=jaw_bone,
        segs_u=16, segs_v=14, tip_taper=1.1,
    )

    # Fleshy grooved tongue inside lower jaw
    t_u, t_v = 22, 24
    t_rings_v, t_rings_uv = [], []
    for iy in range(t_v + 1):
        v = iy / t_v
        tx = 0.14 + v * 0.58
        arch_z = 0.02 + math.sin(v * math.pi * 0.85) * 0.045
        tip_r = ((1.0 - (v ** 3.2)) ** 0.42) if iy < t_v else 0.002
        base_c = 0.002 if iy == 0 else 1.0
        w = 0.11 * tip_r * base_c * (0.75 + 0.25 * math.sin(v * math.pi))
        h = 0.038 * tip_r * base_c * math.sin(min(1.0, v * 1.15) * math.pi * 0.88)
        row_v, row_uv = [], []
        for ix in range(t_u):
            u = ix / t_u
            ang = u * math.pi * 2.0
            sa, ca = math.sin(ang), math.cos(ang)
            sulcus = -0.018 * math.exp(-((sa / 0.28) ** 2)) * max(0.0, ca) * math.sin(v * math.pi)
            row_v.append(jaw_q @ Vector((tx, sa * w, arch_z + ca * h + sulcus)))
            row_uv.append((u, v))
        t_rings_v.append(row_v)
        t_rings_uv.append(row_uv)
    bm_tongue = _build_grid_bmesh(t_rings_v, t_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_tongue, "Pachy_Tongue", mat=mats["mucosa"], parent=jaw_bone)


def _build_quadruped_foot(leg_bone, foot_center, foot_r, side, is_front, mats, prefix):
    """Build broad padded ceratopsian manus/pes with 4-5 hoofed toes grounded at world Z=0."""
    fx, fy, fz = foot_center
    # Tall sloped heel-to-toe cushion pad swallowing the distal ankle/wrist (bottom at local fz -> world Z = 0)
    pad_rz = 0.11
    pad_z = fz + pad_rz
    _build_muscular_limb_segment(
        f"{prefix}_FootPad",
        (fx - 0.14, fy, pad_z),
        (fx + 0.19, fy, pad_z),
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

    toe_angles = (-0.58, -0.20, 0.20, 0.58) if is_front else (-0.48, -0.16, 0.16, 0.48)
    for ti, yaw in enumerate(toe_angles):
        ang = yaw + side * 0.06
        dx = math.cos(ang)
        dy = math.sin(ang)
        t_start = Vector((fx + 0.08 + dx * 0.04, fy + dy * 0.09, fz + 0.072))
        t_end = Vector((fx + 0.08 + dx * 0.23, fy + dy * 0.24, fz + 0.050))
        _build_muscular_limb_segment(
            f"{prefix}_Toe{ti}",
            t_start,
            t_end,
            lambda t, a: (0.064 * (1.0 - 0.22 * t), 0.052 * (1.0 - 0.20 * t), 0.0, 0.0),
            mats["boss"],
            leg_bone,
            prox_overlap=0.22, dist_overlap=0.06, radial_segs=12, height_segs=10,
        )
        _build_conical_horn(
            f"{prefix}_Hoof{ti}",
            length=0.12,
            base_r=0.048,
            direction=(dx * 0.92, dy * 0.92, -0.38),
            curve_offset=(0.01 * dx, 0.01 * dy, -0.01),
            mat=mats["horn"],
            parent=leg_bone,
            local_pos=t_end + Vector((0.0, 0.0, 0.008)),
            segs_u=10,
            segs_v=8,
            flat_y=1.05,
        )


def _build_forelimb(leg_bone, side, local_ground_z, mats, idx):
    """Sculpts a muscular ceratopsian forelimb with forearm osteoderm armor and grounded manus."""
    ctrl = [
        (0.00,  -side * 0.16,  0.24, 0.30, 0.34,  0.00),  # Shoulder socket merged deep inside torso
        (-0.04,  side * 0.03, -0.24, 0.28, 0.31, -0.02),  # Deltoid/triceps mass
        (-0.08,  side * 0.14, -0.66, 0.22, 0.24, -0.02),  # Lateral elbow bend
        (0.03,   side * 0.11, -1.08, 0.20, 0.21,  0.02),  # Muscular forearm
        (0.09,   side * 0.09, local_ground_z + 0.24, 0.19, 0.19, 0.01),  # Flared carpus
        (0.11,   side * 0.09, local_ground_z + 0.14, 0.17, 0.17, 0.00),  # Vertical ankle seated inside FootPad (min Z >= 0)
    ]
    _build_curved_limb_tube(
        f"Pachy_Forelimb_{idx}",
        ctrl,
        mats["hide"],
        leg_bone,
        radial_segs=26,
        height_segs=38,
        v_uv_range=(0.25, 1.35),
        taper_start=True,
        taper_end=True,
    )

    # Row of 5 bold forearm osteoderm armor plates along lateral-anterior forearm surface (portrait detail)
    for si, (sx, sy_off, sz, sw) in enumerate((
        (0.02, side * 0.33, -0.58, 0.17),
        (0.07, side * 0.31, -0.76, 0.16),
        (0.11, side * 0.29, -0.94, 0.15),
        (0.14, side * 0.27, -1.12, 0.14),
        (0.15, side * 0.25, -1.29, 0.13),
    )):
        build_osteoderm_plate(
            f"Pachy_ForearmScute_{idx}_{si}",
            width=sw,
            height=sw * 1.15,
            thickness=0.072,
            mat=mats["boss"],
            parent=leg_bone,
            local_pos=(sx, sy_off, sz),
            rot=(side * 0.55, 0.15, -side * 0.20),
            shape="hex",
        )

    _build_quadruped_foot(
        leg_bone,
        (0.14, side * 0.09, local_ground_z),
        foot_r=0.20,
        side=side,
        is_front=True,
        mats=mats,
        prefix=f"Bone_Leg{idx}",
    )


def _build_hindlimb(leg_bone, side, local_ground_z, mats, idx):
    """Sculpts a massive ceratopsian hindlimb with muscular thigh/calf and grounded pes."""
    ctrl = [
        (0.00,  -side * 0.16,  0.24, 0.34, 0.42,  0.00),  # Pelvic hip socket merged into pelvis
        (0.08,   side * 0.02, -0.26, 0.32, 0.38,  0.03),  # Quadriceps & hamstring belly
        (0.14,   side * 0.07, -0.68, 0.23, 0.25,  0.02),  # Knee
        (-0.06,  side * 0.06, -1.06, 0.21, 0.23, -0.02),  # Gastrocnemius calf
        (-0.02,  side * 0.06, local_ground_z + 0.26, 0.19, 0.19, 0.00),  # Flared hock/tarsus
        (0.01,   side * 0.06, local_ground_z + 0.14, 0.17, 0.17, 0.00),  # Vertical ankle seated inside FootPad (min Z >= 0)
    ]
    _build_curved_limb_tube(
        f"Pachy_Hindlimb_{idx}",
        ctrl,
        mats["hide"],
        leg_bone,
        radial_segs=26,
        height_segs=38,
        v_uv_range=(0.25, 1.35),
        taper_start=True,
        taper_end=True,
    )
    _build_quadruped_foot(
        leg_bone,
        (0.04, side * 0.06, local_ground_z),
        foot_r=0.21,
        side=side,
        is_front=False,
        mats=mats,
        prefix=f"Bone_Leg{idx}",
    )


def _add_body_osteoderms(torso_bone, hips_bone, mats):
    """Adds sculpted dorsal armor plates and upper-flank tubercle studs (portrait detail)."""
    # Median dorsal armor studs riding along the arched back & pelvic ridge
    dorsal_specs = [
        (hips_bone, -0.45, 0.0, 0.80, 0.20),
        (hips_bone, -0.15, 0.0, 0.88, 0.22),
        (torso_bone, -0.05, 0.0, 0.90, 0.24),
        (torso_bone, 0.26, 0.0, 0.92, 0.24),
        (torso_bone, 0.56, 0.0, 0.88, 0.22),
        (torso_bone, 0.84, 0.0, 0.78, 0.20),
    ]
    for idx, (parent_b, ox, oy, oz, sz) in enumerate(dorsal_specs):
        build_osteoderm_plate(
            f"Pachy_DorsalPlate_{idx}",
            width=sz,
            height=sz * 1.25,
            thickness=sz * 0.52,
            mat=mats["boss"],
            parent=parent_b,
            local_pos=(ox, oy, oz),
            rot=(0.0, 0.0, 0.0),
            shape="hex",
        )

    # Staggered upper-flank dermal tubercle rows visible on shoulders & ribcage
    flank_specs = [
        (0.62, 0.58, 0.56, 0.14),
        (0.36, 0.66, 0.60, 0.15),
        (0.10, 0.68, 0.58, 0.15),
        (-0.18, 0.62, 0.52, 0.14),
        (0.50, 0.68, 0.34, 0.13),
        (0.22, 0.75, 0.36, 0.14),
        (-0.08, 0.72, 0.32, 0.13),
    ]
    for fi, (fx, fy, fz, fsz) in enumerate(flank_specs):
        for side in (-1, 1):
            build_osteoderm_plate(
                f"Pachy_FlankTubercle_{side}_{fi}",
                width=fsz,
                height=fsz * 1.15,
                thickness=fsz * 0.55,
                mat=mats["boss"],
                parent=torso_bone,
                local_pos=(fx, side * fy, fz),
                rot=(side * 0.78, 0.0, 0.0),
                shape="hex",
            )


def build_pachyrhino_high_definition():
    clear_scene()

    mats = {
        "hide": _make_trex_pbr_mat(
            "Mat_BodyPrimary",
            base_color=(0.45, 0.32, 0.24, 1.0),
            roughness=0.78,
            metallic=0.01,
            albedo_path=_tex("pachyrhino_albedo.png"),
            bump_path=_tex("pachyrhino_normal.png"),
            bump_strength=0.38,
        ),
        "cranium": _make_trex_pbr_mat(
            "Mat_BodyPrimary_Skull",
            base_color=(0.44, 0.31, 0.23, 1.0),
            roughness=0.66,
            metallic=0.02,
            albedo_path=_tex("pachyrhino_cranium_albedo.png"),
            bump_path=_tex("pachyrhino_cranium_normal.png"),
            bump_strength=0.42,
        ),
        "boss": _make_trex_pbr_mat(
            "Mat_Secondary",
            base_color=(0.35, 0.26, 0.20, 1.0),
            roughness=0.62,
            metallic=0.02,
            albedo_path=_tex("pachyrhino_boss_albedo.png"),
            bump_path=_tex("pachyrhino_boss_normal.png"),
            bump_strength=0.45,
        ),
        "horn": _make_trex_pbr_mat(
            "Mat_Accent",
            base_color=(0.74, 0.66, 0.56, 1.0),
            roughness=0.38,
            metallic=0.02,
            albedo_path=_tex("pachyrhino_horn_albedo.png"),
            bump_path=_tex("pachyrhino_horn_normal.png"),
            bump_strength=0.28,
        ),
        "ocellus": _make_trex_pbr_mat(
            "Mat_Ocellus",
            base_color=(0.76, 0.38, 0.18, 1.0),
            roughness=0.56,
            metallic=0.01,
            albedo_path=_tex("pachyrhino_ocellus_albedo.png"),
            bump_path=_tex("pachyrhino_ocellus_normal.png"),
            bump_strength=0.42,
        ),
        "mucosa": _make_trex_pbr_mat(
            "Mat_OralMucosa",
            base_color=(0.52, 0.16, 0.19, 1.0),
            roughness=0.22,
            metallic=0.02,
            albedo_path=_tex("trex_mucosa_albedo.png"),
            bump_path=_tex("trex_mucosa_bump.png"),
            bump_strength=0.22,
        ),
        "iris": make_pbr_material(
            "Mat_Eye",
            base_color=(0.98, 0.60, 0.10, 1.0),
            roughness=0.08,
            emissive=(0.45, 0.22, 0.04, 1.0),
            emissive_strength=0.22,
            albedo_path=_tex("pachyrhino_iris_albedo.png"),
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

    root = create_bone_node("Bone_Root", (0.0, 0.0, 0.0))
    hips = create_bone_node("Bone_Hips", (0.0, 0.0, 1.65), parent=root)
    torso = create_bone_node("Bone_Torso", (0.24, 0.0, 0.04), parent=hips)
    neck = create_bone_node("Bone_Neck", (1.04, 0.0, 0.06), parent=torso)
    head = create_bone_node("Bone_Head", (0.36, 0.0, 0.08), parent=neck)
    jaw = create_bone_node("Bone_Jaw", (0.14, 0.0, -0.16), parent=head)

    tail0 = create_bone_node("Bone_Tail0", (-0.88, 0.0, 0.06), parent=hips)
    tail1 = create_bone_node("Bone_Tail1", (-0.60, 0.0, -0.11), parent=tail0)
    tail2 = create_bone_node("Bone_Tail2", (-0.58, 0.0, -0.14), parent=tail1)

    spine_ctrl = [
        (-3.05, 0.0, 1.25, 0.003, 0.003),  # 0: Tail tip
        (-2.62, 0.0, 1.35, 0.075, 0.085),  # 1: Distal tail
        (-2.10, 0.0, 1.45, 0.145, 0.170),  # 2: Bone_Tail2
        (-1.48, 0.0, 1.60, 0.245, 0.285),  # 3: Bone_Tail1
        (-0.88, 0.0, 1.71, 0.375, 0.435),  # 4: Bone_Tail0
        (-0.34, 0.0, 1.78, 0.620, 0.680),  # 5: Pelvis / croup
        (0.24,  0.0, 1.82, 0.785, 0.815),  # 6: Barrel ribcage
        (0.82,  0.0, 1.80, 0.720, 0.765),  # 7: Broad shoulders & brisket
        (1.26,  0.0, 1.76, 0.545, 0.585),  # 8: Cervical base
        (1.54,  0.0, 1.80, 0.475, 0.520),  # 9: Muscular bull neck + dewlap
        (1.72,  0.0, 1.82, 0.390, 0.410),  # 10: Skull occiput socket
        (1.88,  0.0, 1.82, 0.003, 0.003),  # 11: Internal skull cap
    ]
    master_spine = CatmullRomSpline3D(spine_ctrl)

    t_j_tail2 = 2.0 / 11.0
    t_j_tail1 = 3.0 / 11.0
    t_j_tail0 = 4.0 / 11.0
    t_j_torso = 5.6 / 11.0
    t_j_neck = 8.0 / 11.0
    overlap = 0.045

    _build_continuous_spine_segment(
        "Pachy_TailSeg2", master_spine,
        0.0, t_j_tail2 + overlap, None, t_j_tail2,
        (-2.06, 0.0, 1.46), tail2, mats["hide"], segs_u=28, segs_v=18,
    )
    _build_continuous_spine_segment(
        "Pachy_TailSeg1", master_spine,
        t_j_tail2 - overlap, t_j_tail1 + overlap, t_j_tail2, t_j_tail1,
        (-1.48, 0.0, 1.60), tail1, mats["hide"], segs_u=30, segs_v=18,
    )
    _build_continuous_spine_segment(
        "Pachy_TailSeg0", master_spine,
        t_j_tail1 - overlap, t_j_tail0 + overlap, t_j_tail1, t_j_tail0,
        (-0.88, 0.0, 1.71), tail0, mats["hide"], segs_u=32, segs_v=18,
    )
    _build_continuous_spine_segment(
        "Pachy_Pelvis", master_spine,
        t_j_tail0 - overlap, t_j_torso + overlap, t_j_tail0, t_j_torso,
        (0.0, 0.0, 1.65), hips, mats["hide"], segs_u=38, segs_v=22,
    )
    _build_continuous_spine_segment(
        "Pachy_Torso", master_spine,
        t_j_torso - overlap, t_j_neck + overlap, t_j_torso, t_j_neck,
        (0.24, 0.0, 1.69), torso, mats["hide"], segs_u=42, segs_v=26,
    )
    _build_continuous_spine_segment(
        "Pachy_Neck", master_spine,
        t_j_neck - overlap, 1.0, t_j_neck, None,
        (1.28, 0.0, 1.75), neck, mats["hide"], segs_u=36, segs_v=22,
    )

    _add_body_osteoderms(torso, hips, mats)
    _build_sculpted_skull(head, mats)
    _build_sculpted_frill(head, mats)
    _build_sculpted_jaw(jaw, mats)

    # 4 Stout quadruped limbs: Leg0/1 = Front Left/Right, Leg2/3 = Rear Left/Right
    leg_specs = (
        (0, (1.02,  0.50, -0.02),  1.0, True),
        (1, (1.02, -0.50, -0.02), -1.0, True),
        (2, (-0.68,  0.52,  0.00),  1.0, False),
        (3, (-0.68, -0.52,  0.00), -1.0, False),
    )
    for idx, hip_pos, side, is_front in leg_specs:
        leg = create_bone_node(f"Bone_Leg{idx}", hip_pos, parent=hips)
        local_ground_z = -(1.65 + hip_pos[2])
        if is_front:
            _build_forelimb(leg, side, local_ground_z, mats, idx)
        else:
            _build_hindlimb(leg, side, local_ground_z, mats, idx)

    out_path = os.path.join(OUT_DIR, "pachyrhino.glb")
    export_fighter_glb(out_path)
    return out_path
