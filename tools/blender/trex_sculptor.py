"""
tools/blender/trex_sculptor.py
Museum-grade paleontological & portrait-faithful Blender 5.2 builder for the
Tyrannosaurus rex GLB model (assets/models/fighters/trex.glb).
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


def _tex(name):
    p = os.path.join(TEX_DIR, name)
    return p if os.path.exists(p) else None


def _catmull_rom_vec(p0, p1, p2, p3, t):
    t2 = t * t
    t3 = t2 * t
    return 0.5 * (
        (2.0 * p1)
        + (-p0 + p2) * t
        + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t2
        + (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t3
    )


def _catmull_rom_scalar(v0, v1, v2, v3, t):
    t2 = t * t
    t3 = t2 * t
    return 0.5 * (
        (2.0 * v1)
        + (-v0 + v2) * t
        + (2.0 * v0 - 5.0 * v1 + 4.0 * v2 - v3) * t2
        + (-v0 + 3.0 * v1 - 3.0 * v2 + v3) * t3
    )


class CatmullRomSpline3D:
    """Evaluates a 3D Catmull-Rom curve and associated scalar channels over t in [0, 1]."""
    def __init__(self, ctrl_tuples):
        self.pts = [Vector((c[0], c[1], c[2])) for c in ctrl_tuples]
        self.n_channels = len(ctrl_tuples[0]) - 3
        self.channels = [
            [c[3 + ch] for c in ctrl_tuples]
            for ch in range(self.n_channels)
        ]
        self.p_ext = [self.pts[0] + (self.pts[0] - self.pts[1])] + self.pts + [self.pts[-1] + (self.pts[-1] - self.pts[-2])]
        self.ch_ext = [
            [ch[0]] + ch + [ch[-1]]
            for ch in self.channels
        ]
        self.n_seg = len(self.pts) - 1

    def eval_at(self, t):
        t = max(0.0, min(1.0, t))
        u_span = t * self.n_seg
        idx = min(self.n_seg - 1, int(u_span))
        lt = u_span - idx
        pos = _catmull_rom_vec(self.p_ext[idx], self.p_ext[idx + 1], self.p_ext[idx + 2], self.p_ext[idx + 3], lt)
        vals = [
            _catmull_rom_scalar(ch[idx], ch[idx + 1], ch[idx + 2], ch[idx + 3], lt)
            for ch in self.ch_ext
        ]
        return pos, vals

    def tangent_at(self, t):
        p_next, _ = self.eval_at(min(1.0, t + 0.004))
        p_prev, _ = self.eval_at(max(0.0, t - 0.004))
        tan = p_next - p_prev
        if tan.length < 1e-6:
            return Vector((1.0, 0.0, 0.0))
        return tan.normalized()


def _build_grid_bmesh(rings_verts, rings_uvs, close_u=True, cap_start=False, cap_end=False, u_wrap_axis=0):
    """
    Builds a smooth BMesh from a 2D grid of vertex coordinates [iv][iu] and UVs [iv][iu].
    When close_u=True, the closing quad (iu = n_u - 1 -> 0) sets the wrapped UV coordinate
    to 1.0 along u_wrap_axis so the texture never interpolates backwards across 0.5!
    """
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")
    n_v = len(rings_verts)
    n_u = len(rings_verts[0])

    bm_rings = []
    for iv in range(n_v):
        row = [bm.verts.new(co) for co in rings_verts[iv]]
        bm_rings.append(row)

    u_limit = n_u if close_u else (n_u - 1)
    for iv in range(n_v - 1):
        r0 = bm_rings[iv]
        r1 = bm_rings[iv + 1]
        uv0 = rings_uvs[iv]
        uv1 = rings_uvs[iv + 1]
        for iu in range(u_limit):
            iu_next = (iu + 1) % n_u
            v00, v01, v11, v10 = r0[iu], r0[iu_next], r1[iu_next], r1[iu]
            if (v00.co - v01.co).length < 1e-6 and (v10.co - v11.co).length < 1e-6:
                continue
            try:
                f = bm.faces.new((v00, v01, v11, v10))
                uv00 = uv0[iu]
                uv10 = uv1[iu]
                if close_u and iu == n_u - 1:
                    if u_wrap_axis == 0:
                        uv01 = (1.0, uv0[0][1])
                        uv11 = (1.0, uv1[0][1])
                    else:
                        uv01 = (uv0[0][0], 1.0)
                        uv11 = (uv1[0][0], 1.0)
                else:
                    uv01 = uv0[iu_next]
                    uv11 = uv1[iu_next]
                for loop, uv in zip(f.loops, (uv00, uv01, uv11, uv10)):
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
    segs_v=28,
):
    """
    Lofts a slice [t_start, t_end] of the master Tyrannosaurus body spline in the local
    space of parent_bone with C1-continuous outer profile and internal spherical ball-joints.
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

        spine_envelope = math.sin(t * math.pi) * cap_scale
        scute_wave = 0.5 + 0.5 * math.cos(t * math.pi * 46.0)

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

            # 1. Triple row of armored dorsal/nuchal osteoderms (median + paravertebral ridges)
            if cos_t > 0.52:
                if abs_sin < 0.22:
                    med_arch = 1.0 - abs_sin / 0.22
                    z_vert += med_arch * (0.052 + 0.045 * scute_wave) * rz * spine_envelope
                elif 0.26 < abs_sin < 0.64:
                    lat_arch = math.sin(((abs_sin - 0.26) / 0.38) * math.pi)
                    z_vert += lat_arch * (0.034 + 0.030 * scute_wave) * rz * spine_envelope
                    y_lat += math.copysign(1.0, sin_t) * lat_arch * 0.025 * scute_wave * ry * spine_envelope

            # 2. M. caudofemoralis lateral muscle swell at tail base & flanks
            if 0.24 < t < 0.68 and abs_sin > 0.55:
                y_lat *= 1.06

            # 3. Deep ventral gular throat folds & gastral basket
            if 0.68 < t < 0.96 and cos_t < -0.25:
                throat_folds = 1.0 + 0.065 * math.sin(t * math.pi * 34.0)
                z_vert *= 1.12 * throat_folds
            elif 0.44 < t < 0.68 and cos_t < -0.52:
                z_vert *= 1.08

            world_pt = c_world + lat_axis * y_lat + up_axis * z_vert
            row_verts.append(world_pt - origin)
            row_uvs.append((u, t))

        rings_verts.append(row_verts)
        rings_uvs.append(row_uvs)

    bm = _build_grid_bmesh(rings_verts, rings_uvs, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    return attach_mesh_obj(bm, name, mat=mat, parent=parent_bone, local_pos=(0.0, 0.0, 0.0), subdiv=0)


def _build_curved_tooth_mesh(name, radius, length, is_upper, mat, parent, local_pos, local_rot=(0.0, 0.0, 0.0)):
    """
    Sculpts a ziphodont curved Tyrannosaurus tooth (D-shaped cross-section,
    blood-stained gingival root v=0 -> gleaming ivory tip v=1).
    """
    sign_z = -1.0 if is_upper else 1.0
    ctrl_pts = [
        (0.0, 0.0, 0.0),
        (-length * 0.05, 0.0, sign_z * length * 0.42),
        (-length * 0.14, 0.0, sign_z * length * 0.82),
        (-length * 0.22, 0.0, sign_z * length),
    ]
    p0, p1, p2, p3 = [Vector(p) for p in ctrl_pts]
    p_ext = [p0 + (p0 - p1), p0, p1, p2, p3, p3 + (p3 - p2)]

    radial_segs = 10
    height_segs = 10
    rings_verts = []
    rings_uvs = []

    for iy in range(height_segs + 1):
        v = iy / height_segs
        u_span = v * 3.0
        idx = min(2, int(u_span))
        lt = u_span - idx
        pt = _catmull_rom_vec(p_ext[idx], p_ext[idx + 1], p_ext[idx + 2], p_ext[idx + 3], lt)
        r = 0.0008 if iy == height_segs else radius * (1.0 - (v ** 1.32))

        row_v = []
        row_uv = []
        for ix in range(radial_segs):
            u = ix / radial_segs
            ang = u * math.pi * 2.0
            ly = math.sin(ang) * r * 0.76
            lx = math.cos(ang) * r * 1.15
            row_v.append(Vector((pt.x + lx, pt.y + ly, pt.z)))
            row_uv.append((u, v))
        rings_verts.append(row_v)
        rings_uvs.append(row_uv)

    bm = _build_grid_bmesh(rings_verts, rings_uvs, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    obj = attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=local_pos, subdiv=0)
    obj.rotation_euler = local_rot
    return obj


def _build_muscular_limb_segment(
    name,
    p_start,
    p_end,
    profile_fn,
    mat,
    parent,
    prox_overlap=0.14,
    dist_overlap=0.14,
    radial_segs=24,
    height_segs=20,
    v_uv_range=(0.0, 1.0),
):
    """Sculpts a closed anatomical muscle segment between 3D local points p_start and p_end."""
    p0 = Vector(p_start)
    p1 = Vector(p_end)
    axis_vec = p1 - p0
    length = max(1e-4, axis_vec.length)
    tangent = axis_vec / length

    ref_lat = Vector((0.0, 1.0, 0.0))
    if abs(tangent.dot(ref_lat)) > 0.92:
        ref_lat = Vector((0.0, 0.0, 1.0))
    lat_axis = (ref_lat - tangent * ref_lat.dot(tangent)).normalized()
    sag_axis = tangent.cross(lat_axis).normalized()
    if sag_axis.x < 0.0:
        sag_axis = -sag_axis

    start_s = -length * prox_overlap
    end_s = length * (1.0 + dist_overlap)
    total_span = end_s - start_s

    rings_verts = []
    rings_uvs = []
    for iy in range(height_segs + 1):
        v = iy / height_segs
        s_pos = start_s + v * total_span
        t_clamped = max(0.0, min(1.0, s_pos / length))

        cap_factor = 1.0
        if v < 0.16:
            cap_factor = max(0.01, math.sin((v / 0.16) * (math.pi * 0.5)))
        elif v > 0.84:
            cap_factor = max(0.01, math.sin(((1.0 - v) / 0.16) * (math.pi * 0.5)))

        off_weight = math.sin(t_clamped * math.pi) * cap_factor
        c_pt = p0 + tangent * s_pos
        v_uv = v_uv_range[0] + v * (v_uv_range[1] - v_uv_range[0])

        row_v = []
        row_uv = []
        for ix in range(radial_segs):
            u = ix / radial_segs
            angle = u * math.pi * 2.0
            rx, rz, off_lat, off_sag = profile_fn(t_clamped, angle)
            cur_rx = rx * cap_factor
            cur_rz = rz * cap_factor

            ly = math.sin(angle) * cur_rx + off_lat * off_weight
            lx = math.cos(angle) * cur_rz + off_sag * off_weight
            pt = c_pt + lat_axis * ly + sag_axis * lx
            row_v.append(pt)
            row_uv.append((u, v_uv))
        rings_verts.append(row_v)
        rings_uvs.append(row_uv)

    bm = _build_grid_bmesh(rings_verts, rings_uvs, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    return attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=(0.0, 0.0, 0.0), subdiv=0)


def _build_curved_limb_tube(
    name,
    ctrl_tuples,
    mat,
    parent,
    radial_segs=26,
    height_segs=32,
    v_uv_range=(0.50, 0.82),
    taper_start=True,
    taper_end=True,
):
    """
    Lofts a continuous multi-joint muscular limb (e.g., Hip -> Thigh -> Knee -> Calf)
    along a Catmull-Rom spline with parallel-transport framing so there is zero crease
    at intermediate joints.
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
        if taper_start and v < 0.10:
            cap_scale = max(0.02, math.sin((v / 0.10) * (math.pi * 0.5)))
        elif taper_end and v > 0.90:
            cap_scale = max(0.02, math.sin(((1.0 - v) / 0.10) * (math.pi * 0.5)))

        c_pt, vals = spline.eval_at(v)
        ry = max(0.002, vals[0] * cap_scale)
        rz = max(0.002, vals[1] * cap_scale)
        sag_off = vals[2] * cap_scale if len(vals) > 2 else 0.0

        tangent = spline.tangent_at(v)
        if prev_tangent is None:
            init_lat = Vector((0.0, 1.0, 0.0))
            if abs(tangent.dot(init_lat)) > 0.94:
                init_lat = Vector((1.0, 0.0, 0.0))
            lat_axis = (init_lat - tangent * init_lat.dot(init_lat)).normalized()
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
        for ix in range(radial_segs):
            u = ix / radial_segs
            ang = u * math.pi * 2.0
            sin_a = math.sin(ang)
            cos_a = math.cos(ang)
            # Subtle muscular flattening on medial/lateral thigh & gastrocnemius crest
            pt = c_pt + lat_axis * (sin_a * ry) + sag_axis * (cos_a * rz + sag_off)
            row_v.append(pt)
            row_uv.append((u, v_uv))
        rings_verts.append(row_v)
        rings_uvs.append(row_uv)

    bm = _build_grid_bmesh(rings_verts, rings_uvs, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    return attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=(0.0, 0.0, 0.0), subdiv=0)


def _build_sculpted_skull_and_jaw(head_bone, jaw_bone, mats):
    """
    Sculpts the high-resolution parametric skull (60x76), brow & nasal osteoderms,
    gums, dentition, recessed predator eyes, mandible (40x48), grooved tongue,
    jaw adductors, and saliva strands under Bone_Head and Bone_Jaw.
    """
    pitch_q = Euler((0.0, 0.04, 0.0), 'XYZ').to_matrix().to_4x4()

    slices = [
        (-0.16, 0.16, -0.10, 0.002),  # Closed occipital cap inside neck
        (-0.04, 0.39, -0.20, 0.38),   # Broad occiput & temples
        (0.10,  0.42, -0.22, 0.46),   # Deep quadratojugal closing jaw commissure
        (0.28,  0.43, -0.17, 0.44),   # Postorbital / supraorbital region
        (0.46,  0.40, -0.11, 0.34),   # Pre-orbital lacrimal constriction (stereovision)
        (0.68,  0.41, -0.14, 0.33),   # Scarred maxillary swell & nasal vault
        (0.90,  0.39, -0.12, 0.29),   # Deep mid-snout
        (1.08,  0.34, -0.09, 0.25),   # Broad narial region
        (1.22,  0.23, -0.06, 0.18),   # Massive blunt U-shaped premaxilla
        (1.30,  0.05,  0.03, 0.002),  # Closed rostral tip
    ]
    top_spline = CatmullRomSpline3D([(s[0], s[3], s[1]) for s in slices])
    bot_spline = CatmullRomSpline3D([(s[0], s[3], s[2]) for s in slices])

    def get_lip_festoon(v):
        return (
            -0.036 * math.exp(-(((v - 0.56) / 0.14) ** 2))
            + 0.026 * math.exp(-(((v - 0.38) / 0.07) ** 2))
        )

    radial_steps = 60
    length_steps = 76
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

        brow_profile = math.exp(-(((v - 0.34) / 0.10) ** 2))
        orbit_profile = math.exp(-(((v - 0.35) / 0.058) ** 2))
        jugal_profile = math.exp(-(((v - 0.23) / 0.09) ** 2))
        max_swell = math.exp(-(((v - 0.55) / 0.12) ** 2))
        nasal_profile = math.sin(((v - 0.36) / 0.48) * math.pi) if (0.36 < v < 0.84) else 0.0

        row_v = []
        row_uv = []
        for ix in range(radial_steps):
            u = ix / radial_steps
            angle = u * math.pi * 2.0
            s = math.sin(angle)
            c = math.cos(angle)
            abs_s = abs(s)
            sign_s = 1.0 if s >= 0.0 else -1.0

            ly = sign_s * (abs_s ** 0.68) * half_w
            if c >= 0.0:
                lz = bot_z + (top_z - bot_z) * (c ** 0.64)

                # Double supraorbital/lacrimal brow crests overhanging the orbit
                if brow_profile > 0.01 and 0.26 < c < 0.90:
                    brow_arch = math.sin(((c - 0.26) / 0.64) * math.pi)
                    scute_boss = 0.74 + 0.26 * math.cos(v * math.pi * 26.0)
                    lz += brow_profile * brow_arch * 0.145 * scute_boss
                    ly += sign_s * brow_profile * brow_arch * 0.118 * scute_boss

                # Median cranial trough between brow crests
                if brow_profile > 0.01 and c >= 0.85:
                    trough = ((c - 0.85) / 0.15) ** 1.5
                    lz -= brow_profile * trough * 0.048

                # Tightly bossed nasal osteoderm rugosity ridge along snout bridge
                if nasal_profile > 0.0 and c > 0.72:
                    nasal_bumps = 0.70 + 0.30 * math.cos(v * math.pi * 30.0)
                    lz += (((c - 0.72) / 0.28) ** 1.35) * 0.048 * nasal_profile * nasal_bumps
            else:
                rim_factor = abs_s ** 1.65
                lz = bot_z * rim_factor + (bot_z + 0.048 * (1.0 - (v - 0.5) ** 2)) * (1.0 - rim_factor)

            crease = math.exp(-(((v - 0.43) / 0.035) ** 2)) * math.exp(-(((c - 0.08) / 0.28) ** 2))
            ly *= (1.0 - 0.22 * crease)

            if max_swell > 0.01 and -0.32 < c < 0.46:
                m_arch = math.sin(((c + 0.32) / 0.78) * math.pi)
                ly += sign_s * max_swell * m_arch * 0.092
                lz += max_swell * m_arch * 0.020

            if orbit_profile > 0.01 and 0.04 < c < 0.46:
                orb_depth = math.sin(((c - 0.04) / 0.42) * math.pi)
                ly *= (1.0 - 0.34 * orbit_profile * orb_depth)

            if orbit_profile > 0.01 and -0.18 < c <= 0.06:
                wrinkle = 0.5 + 0.5 * math.cos(((c + 0.18) / 0.24) * math.pi * 4.0)
                ly += sign_s * orbit_profile * (0.018 + 0.016 * wrinkle)

            naris_u = (v - 0.80) / 0.052
            naris_v = (c - (0.36 - (v - 0.80) * 1.8)) / 0.14
            naris_d2 = naris_u * naris_u + naris_v * naris_v
            if naris_d2 < 1.0:
                n_depth = (1.0 - naris_d2) ** 1.5
                ly *= (1.0 - 0.42 * n_depth)
            elif 1.0 <= naris_d2 < 2.2 and naris_v > 0.0:
                hood = math.sin(((naris_d2 - 1.0) / 1.2) * math.pi)
                ly += sign_s * 0.024 * hood
                lz += 0.018 * hood

            if jugal_profile > 0.01 and -0.88 < c < -0.02:
                j_arch = math.sin(((abs(c) - 0.02) / 0.86) * math.pi)
                cobble = 0.78 + 0.22 * math.cos(v * math.pi * 24.0) * math.sin(angle * 16.0)
                ly += sign_s * jugal_profile * j_arch * 0.090 * cobble
                lz -= jugal_profile * j_arch * 0.038 * cobble

            pt = pitch_q @ Vector((fx, ly, lz))
            row_v.append(pt)
            row_uv.append((v, u))

        skull_rings_v.append(row_v)
        skull_rings_uv.append(row_uv)

    bm_skull = _build_grid_bmesh(skull_rings_v, skull_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=1)
    attach_mesh_obj(bm_skull, "Trex_UpperCranium", mat=mats["cranium"], parent=head_bone)

    # 2. Wet Scalloped Upper Gingiva & Palate Vault
    gum_r_steps = 20
    gum_l_steps = 30
    gum_rings_v = []
    gum_rings_uv = []
    for iy in range(gum_l_steps + 1):
        v = iy / gum_l_steps
        tv = 0.42 + v * 0.53
        p_top, _ = top_spline.eval_at(tv)
        p_bot, _ = bot_spline.eval_at(tv)
        bz = p_bot.z + get_lip_festoon(tv)
        hw = p_top.y * 0.76
        scallop = 0.008 * abs(math.sin(v * math.pi * 10.0))

        row_v = []
        row_uv = []
        for ix in range(gum_r_steps):
            u = ix / gum_r_steps
            ang = u * math.pi * 2.0
            gy = math.sin(ang) * hw
            gz = bz + 0.018 + math.cos(ang) * (0.026 + scallop)
            row_v.append(pitch_q @ Vector((p_top.x, gy, gz)))
            row_uv.append((u, v))
        gum_rings_v.append(row_v)
        gum_rings_uv.append(row_uv)

    bm_ugum = _build_grid_bmesh(gum_rings_v, gum_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_ugum, "Trex_UpperGum", mat=mats["gingiva"], parent=head_bone)

    # 3. Upper Dentition: 4 Premaxillary Incisors + 10 Pairs of Curved Maxillary Fangs
    for p in range(4):
        py = (p - 1.5) * 0.040
        pos = pitch_q @ Vector((1.22, py, -0.038))
        _build_curved_tooth_mesh(
            f"Trex_PremaxTooth_{p}", 0.014, 0.078, True, mats["tooth"], head_bone,
            local_pos=pos, local_rot=(0.0, 0.10, 0.0),
        )

    max_teeth_spec = [
        (0.45, 0.082, 0.016),
        (0.50, 0.125, 0.022),
        (0.55, 0.162, 0.029),
        (0.60, 0.182, 0.033),  # Colossal bone-crushing maxillary fangs under maxillary swell
        (0.66, 0.165, 0.030),
        (0.72, 0.140, 0.026),
        (0.77, 0.118, 0.022),
        (0.82, 0.100, 0.019),
        (0.88, 0.086, 0.017),
        (0.93, 0.072, 0.015),
    ]
    for ti, (tv, t_len, t_rad) in enumerate(max_teeth_spec):
        p_top, _ = top_spline.eval_at(tv)
        p_bot, _ = bot_spline.eval_at(tv)
        y_off = p_top.y * 0.74
        z_root = p_bot.z + get_lip_festoon(tv) + 0.020
        x_pos = p_top.x
        for side in (-1, 1):
            pos = pitch_q @ Vector((x_pos, side * y_off, z_root))
            _build_curved_tooth_mesh(
                f"Trex_UpperTooth_{side}_{ti}", t_rad, t_len, True, mats["tooth"], head_bone,
                local_pos=pos, local_rot=(-side * 0.03, 0.06, 0.0),
            )

    # 4. Recessed Predator Eyes under Supraorbital Brow Overhang
    for side in (-1, 1):
        eye_center = pitch_q @ Vector((0.33, side * 0.312, 0.210))
        eye_grp = create_bone_node(f"Trex_EyeSocket_{side}", eye_center, parent=head_bone)
        eye_grp.rotation_euler = (-0.06, 0.04, side * 0.48)

        bm_sh = bmesh.new()
        bmesh.ops.create_uvsphere(bm_sh, u_segments=14, v_segments=12, radius=0.056)
        sh_obj = attach_mesh_obj(bm_sh, f"Trex_OrbitShadow_{side}", mat=mats["pupil"], parent=eye_grp, local_pos=(0.0, -side * 0.010, 0.0))
        sh_obj.scale = (1.12, 0.62, 0.92)

        bm_ir = bmesh.new()
        uv_ir = bm_ir.loops.layers.uv.new("UVMap")
        bmesh.ops.create_uvsphere(bm_ir, u_segments=20, v_segments=16, radius=0.045)
        for f in bm_ir.faces:
            for loop in f.loops:
                co = loop.vert.co / 0.045
                loop[uv_ir].uv = (0.5 + co.x * 0.46, 0.5 + co.z * 0.46)
        bmesh.ops.recalc_face_normals(bm_ir, faces=bm_ir.faces)
        attach_mesh_obj(bm_ir, f"Trex_Eye_{side}", mat=mats["iris"], parent=eye_grp, local_pos=(0.0, side * 0.008, 0.0))

        bm_pu = bmesh.new()
        bmesh.ops.create_uvsphere(bm_pu, u_segments=14, v_segments=12, radius=0.025)
        pu_obj = attach_mesh_obj(bm_pu, f"Trex_Eye_{side}_Pupil", mat=mats["pupil"], parent=eye_grp, local_pos=(0.0, side * 0.036, 0.0))
        pu_obj.scale = (0.35, 0.55, 1.34)

        bm_cl = bmesh.new()
        bmesh.ops.create_uvsphere(bm_cl, u_segments=8, v_segments=8, radius=0.009)
        attach_mesh_obj(bm_cl, f"Trex_EyeCatchlight_{side}", mat=mats["catchlight"], parent=eye_grp, local_pos=(0.012, side * 0.049, 0.014))

        _build_muscular_limb_segment(
            f"Trex_UpperEyelid_{side}",
            (-0.046, side * 0.012, 0.028),
            (0.048, side * 0.012, 0.022),
            lambda t, ang: (0.020 * math.sin(t * math.pi + 0.2), 0.016, 0.0, 0.008 * math.sin(t * math.pi)),
            mats["horn"],
            eye_grp,
            prox_overlap=0.1, dist_overlap=0.1, radial_segs=12, height_segs=10,
        )
        _build_muscular_limb_segment(
            f"Trex_LowerEyelid_{side}",
            (-0.042, side * 0.010, -0.026),
            (0.044, side * 0.010, -0.022),
            lambda t, ang: (0.016 * math.sin(t * math.pi + 0.2), 0.013, 0.0, -0.006 * math.sin(t * math.pi)),
            mats["horn"],
            eye_grp,
            prox_overlap=0.1, dist_overlap=0.1, radial_segs=12, height_segs=10,
        )

    # 5. Sculpted Mandible, Lower Gingiva, Dentary Teeth & Grooved Tongue (under Bone_Jaw)
    # Menacing parted predatory snarl in rest pose (0.30 rad downward pitch relative to Bone_Jaw)
    jaw_q = Euler((0.0, 0.30, 0.0), 'XYZ').to_matrix().to_4x4()

    m_slices = [
        (-0.10,  0.04, -0.08, 0.002),
        (-0.02,  0.10, -0.22, 0.36),   # Coronoid / surangular hinge
        (0.16,   0.08, -0.28, 0.38),
        (0.38,   0.02, -0.23, 0.28),
        (0.62,   0.01, -0.20, 0.23),
        (0.88,   0.02, -0.22, 0.20),   # Deep upturned dentary chin symphysis
        (1.06,   0.04, -0.19, 0.15),
        (1.16,   0.03, -0.11, 0.09),
        (1.21,  -0.01, -0.03, 0.002),
    ]
    m_bot_spline = CatmullRomSpline3D([(s[0], s[3], s[2]) for s in m_slices])
    m_top_spline = CatmullRomSpline3D([(s[0], s[3], s[1]) for s in m_slices])

    m_r_steps = 40
    m_l_steps = 48
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

            ly = sign_s * (abs_s ** 0.72) * half_w
            if c <= 0.0:
                chin_rug = 1.0 + (0.06 * math.cos(v * math.pi * 22.0) if v > 0.60 else 0.0)
                lz = bot_z * (abs(c) ** 0.66) * chin_rug
            else:
                rim = abs_s ** 1.4
                lz = top_z * rim + (top_z - 0.05 * math.sin(v * math.pi)) * (1.0 - rim)

            row_v.append(jaw_q @ Vector((fx, ly, lz)))
            row_uv.append((v, u))
        mand_rings_v.append(row_v)
        mand_rings_uv.append(row_uv)

    bm_mand = _build_grid_bmesh(mand_rings_v, mand_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=1)
    attach_mesh_obj(bm_mand, "Trex_Mandible", mat=mats["cranium"], parent=jaw_bone)

    # Lower scalloped gingiva
    lg_r_steps = 18
    lg_l_steps = 26
    lg_rings_v = []
    lg_rings_uv = []
    for iy in range(lg_l_steps + 1):
        v = iy / lg_l_steps
        tv = 0.40 + v * 0.50
        pt_top, _ = m_top_spline.eval_at(tv)
        hw = pt_top.y * 0.74
        scallop = 0.008 * abs(math.sin(v * math.pi * 9.0))
        row_v = []
        row_uv = []
        for ix in range(lg_r_steps):
            u = ix / lg_r_steps
            ang = u * math.pi * 2.0
            gy = math.sin(ang) * hw
            gz = pt_top.z - 0.002 + math.cos(ang) * (0.025 + scallop)
            row_v.append(jaw_q @ Vector((pt_top.x, gy, gz)))
            row_uv.append((u, v))
        lg_rings_v.append(row_v)
        lg_rings_uv.append(row_uv)

    bm_lgum = _build_grid_bmesh(lg_rings_v, lg_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_lgum, "Trex_LowerGum", mat=mats["gingiva"], parent=jaw_bone)

    # 9 pairs of lateral dentary teeth + 1 pair of anterior symphyseal fangs
    for t in range(9):
        tv = 0.42 + (t / 8.0) * 0.48
        pt_top, _ = m_top_spline.eval_at(tv)
        ty = pt_top.y * 0.70
        tz = pt_top.z - 0.006
        tx = pt_top.x
        t_len = 0.105 if (1 <= t <= 4) else 0.078
        t_rad = 0.019 if (1 <= t <= 4) else 0.014
        for side in (-1, 1):
            pos = jaw_q @ Vector((tx, side * ty, tz))
            _build_curved_tooth_mesh(
                f"Trex_LowerTooth_{side}_{t}", t_rad, t_len, False, mats["tooth"], jaw_bone,
                local_pos=pos, local_rot=(side * 0.03, 0.28, 0.0),
            )

    for side in (-1, 1):
        pos = jaw_q @ Vector((1.08, side * 0.038, 0.026))
        _build_curved_tooth_mesh(
            f"Trex_FrontLowerTooth_{side}", 0.014, 0.074, False, mats["tooth"], jaw_bone,
            local_pos=pos, local_rot=(side * 0.02, 0.26, 0.0),
        )

    # Fleshy grooved tongue with median sulcus (26x28)
    t_r_steps = 26
    t_l_steps = 28
    t_rings_v = []
    t_rings_uv = []
    for iy in range(t_l_steps + 1):
        v = iy / t_l_steps
        tx = 0.18 + v * 0.78
        arch_z = (
            0.03
            + math.sin(v * math.pi * 0.85) * 0.072
            - (max(0.0, (v - 0.65) / 0.35) ** 1.6) * 0.032
        )
        tip_round = ((1.0 - (v ** 3.5)) ** 0.42) if iy < t_l_steps else 0.002
        base_cap = 0.002 if iy == 0 else 1.0
        w = 0.146 * tip_round * base_cap * (0.75 + 0.25 * math.sin(v * math.pi))
        h = 0.046 * tip_round * base_cap * math.sin(min(1.0, v * 1.15) * math.pi * 0.88)

        row_v = []
        row_uv = []
        for ix in range(t_r_steps):
            u = ix / t_r_steps
            ang = u * math.pi * 2.0
            s = math.sin(ang)
            c = math.cos(ang)
            ly = s * w
            sulcus = -0.025 * math.exp(-((s / 0.26) ** 2)) * max(0.0, c) * math.sin(v * math.pi)
            lz = arch_z + c * h + sulcus
            row_v.append(jaw_q @ Vector((tx, ly, lz)))
            row_uv.append((u, v))
        t_rings_v.append(row_v)
        t_rings_uv.append(row_uv)

    bm_tongue = _build_grid_bmesh(t_rings_v, t_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_tongue, "Trex_Tongue", mat=mats["mucosa"], parent=jaw_bone)

    # Mandibular adductor muscles (M. pterygoideus) bridging rear mouth commissures
    for side in (-1, 1):
        p_lo = jaw_q @ Vector((0.22, side * 0.20, -0.04))
        p_hi = Vector((0.18, side * 0.22, 0.10))
        _build_muscular_limb_segment(
            f"Trex_JawAdductor_{side}",
            p_lo,
            p_hi,
            lambda t, ang: (0.040 * (0.85 + 0.25 * math.sin(t * math.pi)), 0.092 * (0.85 + 0.25 * math.sin(t * math.pi)), 0.0, 0.0),
            mats["mucosa"],
            jaw_bone,
            prox_overlap=0.22, dist_overlap=0.22, radial_segs=14, height_segs=12,
        )

    # Glistening Saliva Strands & Fang Drips (portrait signature)
    saliva_specs = [
        (0, Vector((0.48, -0.19, 0.02)), jaw_q @ Vector((0.44, -0.15, 0.03)), 0.0028),
        (1, Vector((0.64, -0.17, 0.00)), jaw_q @ Vector((0.58, -0.13, 0.03)), 0.0025),
        (2, Vector((0.82, -0.14, 0.01)), jaw_q @ Vector((0.76, -0.10, 0.04)), 0.0022),
        (3, Vector((0.54,  0.19, 0.01)), jaw_q @ Vector((0.48,  0.15, 0.03)), 0.0028),
        (4, Vector((0.76,  0.15, 0.01)), jaw_q @ Vector((0.70,  0.11, 0.04)), 0.0024),
    ]
    for s_idx, p_up, p_dn, s_rad in saliva_specs:
        _build_muscular_limb_segment(
            f"Trex_SalivaStrand_{s_idx}",
            p_dn,
            p_up,
            lambda t, ang, r=s_rad: (r * (1.0 - 0.45 * math.sin(t * math.pi)), r * (1.0 - 0.45 * math.sin(t * math.pi)), 0.0, 0.0),
            mats["saliva"],
            jaw_bone,
            prox_overlap=0.05, dist_overlap=0.05, radial_segs=8, height_segs=8,
        )


def _build_forelimb(arm_bone, side, mats):
    """
    Sculpts a continuous muscular didactyl Tyrannosaurus forelimb (humerus + elbow +
    forearm spline, scaly palm, and 2 clawed digits) under Bone_Arm0/1.
    """
    # Continuous Humerus -> Elbow -> Forearm spline (zero elbow crease)
    arm_ctrl = [
        (0.02,  -side * 0.04,  0.06, 0.110, 0.132,  0.010),  # Shoulder socket inside chest
        (-0.03, -side * 0.01, -0.16, 0.096, 0.118,  0.022),  # Deltopectoral crest
        (-0.05, -side * 0.02, -0.34, 0.074, 0.088,  0.005),  # Elbow joint
        (0.11,  -side * 0.04, -0.45, 0.072, 0.086,  0.012),  # Forearm flexor belly
        (0.26,  -side * 0.06, -0.54, 0.050, 0.060,  0.000),  # Wrist
    ]
    _build_curved_limb_tube(
        f"Trex_ArmColumn_{side}",
        arm_ctrl,
        mats["hide"],
        arm_bone,
        radial_segs=18,
        height_segs=22,
        v_uv_range=(0.72, 0.88),
        taper_start=True,
        taper_end=True,
    )

    p_wrist = Vector((0.25, -side * 0.06, -0.53))
    p_palm_end = Vector((0.36, -side * 0.08, -0.58))
    _build_muscular_limb_segment(
        f"Trex_Palm_{side}",
        p_wrist,
        p_palm_end,
        lambda t, ang: (
            (0.052 * (1.0 - t) + 0.044 * t) * 0.72,
            (0.052 * (1.0 - t) + 0.044 * t) * 1.15,
            0.0,
            0.0,
        ),
        mats["scute"],
        arm_bone,
        prox_overlap=0.20, dist_overlap=0.16, radial_segs=14, height_segs=10,
    )

    digit_specs = [
        (0, Vector((0.35, -side * 0.095, -0.56)), Vector((0.46, -side * 0.12, -0.60)), 0.024, 0.15, 0.024),
        (1, Vector((0.35, -side * 0.065, -0.59)), Vector((0.48, -side * 0.09, -0.66)), 0.021, 0.13, 0.021),
    ]
    for d_idx, d_start, d_end, f_rad, c_len, c_rad in digit_specs:
        _build_muscular_limb_segment(
            f"Trex_Finger_{side}_{d_idx}",
            d_start,
            d_end,
            lambda t, ang, fr=f_rad: (fr * (1.0 - 0.18 * t) * 0.92, fr * (1.0 - 0.18 * t), 0.0, 0.0),
            mats["scute"],
            arm_bone,
            prox_overlap=0.18, dist_overlap=0.06, radial_segs=12, height_segs=10,
        )
        _build_curved_tooth_mesh(
            f"Trex_HandClaw_{side}_{d_idx}",
            c_rad,
            c_len,
            True,
            mats["claw"],
            arm_bone,
            local_pos=d_end,
            local_rot=(0.0, -0.95, -side * 0.18),
        )


def _build_hindlimb(leg_bone, side, mats):
    """
    Sculpts a colossal continuous 4-segment digitigrade Tyrannosaurus hindlimb under Bone_Leg0/1:
      1..3. Continuous Femur -> Knee -> Gastrocnemius Calf -> Ankle Hock -> Arctometatarsus -> Pes Pad
            spline tube (zero knee crease and zero ankle step!)
      4. Medial Hallux dewclaw + Grounded 3-toed Pes (Digits II, III, IV with phalangeal pads & dark talons)
    """
    leg_ctrl = [
        (-0.04, -side * 0.08,  0.16, 0.30, 0.42,  0.00),  # 0: Broad hip socket inside pelvis
        (0.16,   0.00,        -0.24, 0.31, 0.44,  0.03),  # 1: Massive thigh belly (quad/hamstring)
        (0.36,   side * 0.02, -0.64, 0.21, 0.26,  0.02),  # 2: Rounded knee patella & cnemial crest
        (0.18,   side * 0.03, -0.96, 0.22, 0.29, -0.04),  # 3: Bulging M. gastrocnemius calf muscle
        (-0.04,  side * 0.03, -1.26, 0.14, 0.17, -0.01),  # 4: Achilles tendon taper
        (-0.14,  side * 0.04, -1.50, 0.12, 0.14,  0.00),  # 5: Ankle malleolus / calcaneum hock
        (-0.01,  side * 0.04, -1.77, 0.11, 0.12,  0.01),  # 6: Scaly arctometatarsus shaft
        (0.14,   side * 0.04, -2.02, 0.14, 0.11,  0.02),  # 7: Distal metatarsal pes pad spread into toes
    ]
    _build_curved_limb_tube(
        f"Trex_UpperLeg_{side}",
        leg_ctrl,
        mats["hide"],
        leg_bone,
        radial_segs=28,
        height_segs=48,
        v_uv_range=(0.45, 0.88),
        taper_start=True,
        taper_end=True,
    )

    p_ankle = Vector((-0.14, side * 0.04, -1.50))
    p_foot = Vector((0.08, side * 0.04, -1.99))

    hallux_pos = p_ankle.lerp(p_foot, 0.58) + Vector((-0.05, -side * 0.082, 0.0))
    _build_curved_tooth_mesh(
        f"Trex_HalluxClaw_{side}",
        0.022,
        0.11,
        True,
        mats["claw"],
        leg_bone,
        local_pos=hallux_pos,
        local_rot=(0.0, 0.65, -side * 0.45),
    )

    # 4. Grounded 3-Toed Digitigrade Pes (Digits II, III, IV) resting on local Z = -2.06 (world Z = 0)
    toe_specs = [
        (0,  0.28,  0.062, 0.34, 0.046, 0.16, 0.038),  # Inner Toe II
        (1,  0.00,  0.000, 0.44, 0.056, 0.20, 0.046),  # Central Toe III (longest)
        (2, -0.28, -0.062, 0.33, 0.045, 0.15, 0.036),  # Outer Toe IV
    ]
    for t_idx, ang_yaw, y_off, t_len, t_rad, c_len, c_rad in toe_specs:
        t_start = Vector((p_foot.x - 0.02, p_foot.y + y_off * 0.85, -1.99))
        dx = math.cos(ang_yaw) * t_len
        dy = math.sin(ang_yaw) * t_len
        t_end = Vector((t_start.x + dx, t_start.y + dy, -2.025))

        _build_muscular_limb_segment(
            f"Trex_Toe_{side}_{t_idx}",
            t_start,
            t_end,
            lambda t, ang, tr=t_rad: (tr * (1.0 - 0.20 * t) * 1.08, tr * (1.0 - 0.20 * t) * 0.76, 0.0, 0.0),
            mats["scute"],
            leg_bone,
            prox_overlap=0.26, dist_overlap=0.05, radial_segs=14, height_segs=12,
        )
        _build_curved_tooth_mesh(
            f"Trex_ToeClaw_{side}_{t_idx}",
            c_rad,
            c_len,
            True,
            mats["claw"],
            leg_bone,
            local_pos=t_end + Vector((0.0, 0.0, 0.012)),
            local_rot=(0.0, -1.32, ang_yaw),
        )


def _make_trex_pbr_mat(name, **kwargs):
    bump_strength = kwargs.get("bump_strength", 0.25)
    mat = make_pbr_material(name, **kwargs)
    if kwargs.get("bump_path") and mat and mat.use_nodes:
        nt = mat.node_tree
        bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        bump_node = next((n for n in nt.nodes if n.type == 'BUMP'), None)
        tex_bump = None
        if bump_node:
            for lnk in bump_node.inputs['Height'].links:
                tex_bump = lnk.from_node
            nt.nodes.remove(bump_node)
        if bsdf and tex_bump:
            nmap = nt.nodes.new('ShaderNodeNormalMap')
            nmap.location = (-80, -180)
            nmap.inputs['Strength'].default_value = bump_strength
            nt.links.new(tex_bump.outputs['Color'], nmap.inputs['Color'])
            nt.links.new(nmap.outputs['Normal'], bsdf.inputs['Normal'])
    return mat


def build_trex_high_definition():
    clear_scene()

    mats = {
        "hide": _make_trex_pbr_mat(
            "Mat_BodyPrimary",
            base_color=(0.30, 0.34, 0.25, 1.0),
            roughness=0.76,
            metallic=0.01,
            albedo_path=_tex("trex_albedo.png"),
            bump_path=_tex("trex_bump.png"),
            bump_strength=0.35,
        ),
        "cranium": _make_trex_pbr_mat(
            "Mat_BodyPrimary_Skull",
            base_color=(0.30, 0.34, 0.25, 1.0),
            roughness=0.56,
            metallic=0.02,
            albedo_path=_tex("trex_cranium_albedo.png"),
            bump_path=_tex("trex_cranium_bump.png"),
            bump_strength=0.40,
        ),
        "horn": _make_trex_pbr_mat(
            "Mat_Secondary",
            base_color=(0.18, 0.20, 0.15, 1.0),
            roughness=0.46,
            metallic=0.02,
            bump_path=_tex("trex_cranium_bump.png"),
            bump_strength=0.32,
        ),
        "scute": _make_trex_pbr_mat(
            "Mat_Secondary_Scute",
            base_color=(0.20, 0.24, 0.17, 1.0),
            roughness=0.58,
            metallic=0.03,
            albedo_path=_tex("trex_scute_albedo.png"),
            bump_path=_tex("trex_scute_bump.png"),
            bump_strength=0.32,
        ),
        "tooth": _make_trex_pbr_mat(
            "Mat_Accent",
            base_color=(0.95, 0.90, 0.78, 1.0),
            roughness=0.16,
            metallic=0.02,
            albedo_path=_tex("trex_tooth_albedo.png"),
            bump_path=_tex("trex_tooth_bump.png"),
            bump_strength=0.16,
        ),
        "gingiva": _make_trex_pbr_mat(
            "Mat_JawMembrane",
            base_color=(0.48, 0.12, 0.15, 1.0),
            roughness=0.16,
            metallic=0.02,
            albedo_path=_tex("trex_mucosa_albedo.png"),
            bump_path=_tex("trex_mucosa_bump.png"),
            bump_strength=0.22,
        ),
        "mucosa": _make_trex_pbr_mat(
            "Mat_OralMucosa",
            base_color=(0.56, 0.17, 0.20, 1.0),
            roughness=0.20,
            metallic=0.02,
            albedo_path=_tex("trex_mucosa_albedo.png"),
            bump_path=_tex("trex_mucosa_bump.png"),
            bump_strength=0.26,
        ),
        "saliva": make_pbr_material(
            "Mat_Saliva",
            base_color=(0.92, 0.96, 0.98, 1.0),
            roughness=0.03,
            metallic=0.0,
            alpha=0.52,
        ),
        "claw": make_pbr_material(
            "Mat_Claw",
            base_color=(0.05, 0.045, 0.04, 1.0),
            roughness=0.55,
            metallic=0.02,
        ),
        "iris": make_pbr_material(
            "Mat_Eye",
            base_color=(0.98, 0.62, 0.08, 1.0),
            roughness=0.10,
            emissive=(0.48, 0.34, 0.08, 1.0),
            emissive_strength=0.22,
            albedo_path=_tex("trex_iris_albedo.png"),
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
    hips = create_bone_node("Bone_Hips", (0.0, 0.0, 2.10), parent=root)
    torso = create_bone_node("Bone_Torso", (0.36, 0.0, 0.06), parent=hips)
    neck = create_bone_node("Bone_Neck", (0.98, 0.0, 0.22), parent=torso)
    head = create_bone_node("Bone_Head", (0.76, 0.0, 0.36), parent=neck)
    jaw = create_bone_node("Bone_Jaw", (0.10, 0.0, -0.10), parent=head)

    tail0 = create_bone_node("Bone_Tail0", (-0.56, 0.0, 0.06), parent=hips)
    tail1 = create_bone_node("Bone_Tail1", (-0.82, 0.0, -0.01), parent=tail0)
    tail2 = create_bone_node("Bone_Tail2", (-0.82, 0.0, -0.02), parent=tail1)
    tail3 = create_bone_node("Bone_Tail3", (-0.78, 0.0, -0.02), parent=tail2)

    # Unified Master Spine Spline (smoothly enters the occiput of Trex_UpperCranium at Z = 3.12)
    spine_ctrl = [
        (-3.76, 0.0, 2.09, 0.003, 0.003),  # 0: Tail Tip
        (-3.36, 0.0, 2.10, 0.085, 0.100),  # 1: Distal Caudal
        (-2.98, 0.0, 2.11, 0.150, 0.175),  # 2: Bone_Tail3
        (-2.20, 0.0, 2.13, 0.250, 0.290),  # 3: Bone_Tail2
        (-1.38, 0.0, 2.16, 0.355, 0.415),  # 4: Bone_Tail1 (M. caudofemoralis swell)
        (-0.62, 0.0, 2.19, 0.440, 0.515),  # 5: Pelvis Rear / Sacrum
        (-0.18, 0.0, 2.21, 0.505, 0.610),  # 6: Hips / Acetabulum & Pubic Boot
        (0.28,  0.0, 2.15, 0.575, 0.675),  # 7: Lumbar Flanks
        (0.74,  0.0, 2.15, 0.585, 0.665),  # 8: Barrel Ribcage & Gastralia
        (1.16,  0.0, 2.26, 0.455, 0.495),  # 9: Pectoral Girdle
        (1.42,  0.0, 2.39, 0.405, 0.455),  # 10: Cervical Base (S-curve bottom)
        (1.74,  0.0, 2.60, 0.375, 0.420),  # 11: Mid-Neck S-Curve (gular folds)
        (2.04,  0.0, 2.77, 0.355, 0.380),  # 12: Upper Neck / Atlas (flush with occiput!)
        (2.22,  0.0, 2.80, 0.310, 0.330),  # 13: Skull Occiput Socket
        (2.38,  0.0, 2.81, 0.003, 0.003),  # 14: Internal Skull Cap
    ]
    master_spine = CatmullRomSpline3D(spine_ctrl)

    t_j_tail3 = 2.0 / 14.0
    t_j_tail2 = 3.0 / 14.0
    t_j_tail1 = 4.0 / 14.0
    t_j_tail0 = 5.1 / 14.0
    t_j_torso = 6.8 / 14.0
    t_j_neck = 9.7 / 14.0
    overlap = 0.042

    _build_continuous_spine_segment(
        "Trex_TailSeg3", master_spine,
        0.0, t_j_tail3 + overlap, None, t_j_tail3,
        (-2.98, 0.0, 2.11), tail3, mats["hide"], segs_u=32, segs_v=22,
    )
    _build_continuous_spine_segment(
        "Trex_TailSeg2", master_spine,
        t_j_tail3 - overlap, t_j_tail2 + overlap, t_j_tail3, t_j_tail2,
        (-2.20, 0.0, 2.13), tail2, mats["hide"], segs_u=34, segs_v=20,
    )
    _build_continuous_spine_segment(
        "Trex_TailSeg1", master_spine,
        t_j_tail2 - overlap, t_j_tail1 + overlap, t_j_tail2, t_j_tail1,
        (-1.38, 0.0, 2.15), tail1, mats["hide"], segs_u=36, segs_v=20,
    )
    _build_continuous_spine_segment(
        "Trex_TailSeg0", master_spine,
        t_j_tail1 - overlap, t_j_tail0 + overlap, t_j_tail1, t_j_tail0,
        (-0.56, 0.0, 2.16), tail0, mats["hide"], segs_u=38, segs_v=20,
    )
    _build_continuous_spine_segment(
        "Trex_Pelvis", master_spine,
        t_j_tail0 - overlap, t_j_torso + overlap, t_j_tail0, t_j_torso,
        (0.0, 0.0, 2.10), hips, mats["hide"], segs_u=40, segs_v=24,
    )
    _build_continuous_spine_segment(
        "Trex_Torso", master_spine,
        t_j_torso - overlap, t_j_neck + overlap, t_j_torso, t_j_neck,
        (0.36, 0.0, 2.16), torso, mats["hide"], segs_u=42, segs_v=28,
    )
    _build_continuous_spine_segment(
        "Trex_Neck", master_spine,
        t_j_neck - overlap, 1.0, t_j_neck, None,
        (1.34, 0.0, 2.38), neck, mats["hide"], segs_u=38, segs_v=26,
    )

    _build_sculpted_skull_and_jaw(head, jaw, mats)

    for idx, side in enumerate((1, -1)):
        arm = create_bone_node(f"Bone_Arm{idx}", (0.86, side * 0.36, -0.10), parent=torso)
        _build_forelimb(arm, side, mats)

    for idx, side in enumerate((1, -1)):
        leg = create_bone_node(f"Bone_Leg{idx}", (-0.18, side * 0.30, -0.04), parent=hips)
        _build_hindlimb(leg, side, mats)

    out_path = os.path.join(OUT_DIR, "trex.glb")
    export_fighter_glb(out_path)
    return out_path
