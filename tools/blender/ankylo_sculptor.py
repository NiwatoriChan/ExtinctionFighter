"""
tools/blender/ankylo_sculptor.py
Museum-grade paleontological & portrait-faithful Blender 5.2 builder for the
Ankylosaurus magniventris GLB model (assets/models/fighters/ankylo.glb).

Anatomical & visual synthesis:
  - Low-slung armored fortress silhouette with broad domed carapace, overhanging
    lateral armor skirt, deep muscular chest/brisket, thick armored neck with
    2 cleanly spaced cervical half-rings, interlocking transverse rows of
    swept-back ridge-keeled osteoderm shields, sculpted triangular marginal
    flange spikes, heavy bowed columnar limbs with clustered cobblestone
    shoulder armor & seamless flaring elephantine feet (5 front / 4 rear hooves),
    and a stiffened ossified-tendon tail terminating in a monumental fused
    bilobed boulder tail club.
  - Head sculpt matched directly to assets/portraits/ankylo.png:
    broad chunky domed skull densely armored with mosaic caputegulae & deep
    sutures, 3 sculpted brow boss osteoderms crowning each eye, continuous
    wrinkled almond eyelids around deep golden-amber eyes, clean recessed
    anterior nostrils, compact rounded turtle-like dark charcoal-umber upper &
    lower beaks, subtle beak-corner cheek boss, warm sandstone-buff pebbled
    mandible/jowl/throat, and 4 sturdy faceted pyramidal honey-ochre cranial
    horns (squamosal & jugal).

Canonical Extinction Kombat 3D rig contract (preserved 100%):
  Bone_Root -> Bone_Hips (Z=1.35) -> Bone_Torso -> Bone_Neck -> Bone_Head -> Bone_Jaw
                                                -> Bone_Tail0 -> Bone_Tail1 -> Bone_Tail2 -> Special_TailClub
                                  -> Bone_Leg0, Bone_Leg1 (front legs, planted at Z=0)
                                  -> Bone_Leg2, Bone_Leg3 (hind legs, planted at Z=0)
"""

import math
import os
import sys
import bpy
import bmesh
from mathutils import Vector, Euler

THIS_DIR = os.path.dirname(os.path.abspath(__file__))
if THIS_DIR not in sys.path:
    sys.path.insert(0, THIS_DIR)

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


def _rot_from_z_normal(nrm):
    """Returns XYZ Euler aligning local +Z with outward surface normal while keeping +X forward."""
    q = Vector((0.0, 0.0, 1.0)).rotation_difference(nrm.normalized())
    return q.to_euler("XYZ")


def _build_keeled_osteoderm(
    name,
    length,
    width,
    height,
    mat,
    parent,
    local_pos=(0.0, 0.0, 0.0),
    rot=(0.0, 0.0, 0.0),
    keel_bias=-0.20,
    ridge_ratio=0.46,
    segs_u=14,
    subdiv=0,
):
    """
    Sculpts an authentic Ankylosaurus ridge-keeled osteoderm armor shield:
      - Broad polygonal/oval basal dermal collar embedded cleanly into the carapace.
      - Concave fluted lateral walls converging to an elongated longitudinal crest keel
        swept back toward keel_bias (NOT a blunt cartoon gumdrop/cone!).
      - Seamless periodic UVs mapping v=0 (embedded dark olive root) -> v=1 (sunlit
        worn mineral-taupe ridge crest), completely eliminating unilateral dark smudges!
    """
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    hl = length * 0.5
    hw = width * 0.5
    # (rx_scale, ry_scale, z_frac, v_uv)
    rings_def = [
        (1.04, 1.04, -0.24, 0.02),  # Deep embedded basal skirt
        (0.98, 0.98,  0.10, 0.18),  # Raised polygonal dermal collar rim
        (0.84, 0.66,  0.42, 0.48),  # Concave fluted lower slope
        (0.66, 0.30,  0.74, 0.78),  # Narrowing swept keel shoulder
        (ridge_ratio, 0.07, 0.94, 0.94),  # Crisp longitudinal keel ridge lip
    ]

    bm_rings = []
    ring_uvs = []
    for r_l, r_w, z_frac, v_uv in rings_def:
        row = []
        uv_row = []
        # Keel rises higher at posterior end (-X) when keel_bias < 0
        shift_x = keel_bias * length * (1.0 - r_w)
        for iu in range(segs_u):
            u = iu / segs_u
            ang = u * math.pi * 2.0
            ca = math.cos(ang)
            sa = math.sin(ang)
            # Subtle organic hexagonal bevel on the basal footprint
            poly_mod = 1.0 + 0.055 * math.cos(ang * 6.0) * (1.0 - max(0.0, z_frac) * 0.65)
            lx = ca * hl * r_l * poly_mod + shift_x
            ly = sa * hw * r_w * poly_mod
            # Slope crest higher toward the swept-back end
            crest_tilt = -0.14 * ca * max(0.0, z_frac) * (1.0 if keel_bias < 0 else 0.0)
            lz = height * (z_frac + crest_tilt)
            row.append(bm.verts.new((lx, ly, lz)))
            uv_row.append((u, v_uv))
        bm_rings.append(row)
        ring_uvs.append(uv_row)

    for ir in range(len(bm_rings) - 1):
        r0, r1 = bm_rings[ir], bm_rings[ir + 1]
        uv0, uv1 = ring_uvs[ir], ring_uvs[ir + 1]
        for iu in range(segs_u):
            iun = (iu + 1) % segs_u
            f = bm.faces.new((r0[iu], r0[iun], r1[iun], r1[iu]))
            u00, v00 = uv0[iu]
            u10, v10 = uv1[iu]
            if iu == segs_u - 1:
                u01, v01 = 1.0, uv0[0][1]
                u11, v11 = 1.0, uv1[0][1]
            else:
                u01, v01 = uv0[iun]
                u11, v11 = uv1[iun]
            for lp, uvc in zip(f.loops, ((u00, v00), (u01, v01), (u11, v11), (u10, v10))):
                lp[uv_layer].uv = uvc

    # Cap top ridge smoothly with a center apex vertex shifted along keel_bias
    apex_v = bm.verts.new((keel_bias * length * 1.05, 0.0, height * 1.02))
    base_v = bm.verts.new((0.0, 0.0, -height * 0.30))
    top_r = bm_rings[-1]
    top_uv = ring_uvs[-1]
    bot_r = bm_rings[0]
    bot_uv = ring_uvs[0]
    for iu in range(segs_u):
        iun = (iu + 1) % segs_u
        u0, v0 = top_uv[iu]
        u1 = 1.0 if iu == segs_u - 1 else top_uv[iun][0]
        ft = bm.faces.new((top_r[iu], top_r[iun], apex_v))
        for lp, uvc in zip(ft.loops, ((u0, v0), (u1, top_uv[iun][1]), (0.5 * (u0 + u1), 0.99))):
            lp[uv_layer].uv = uvc
        fb = bm.faces.new((bot_r[iun], bot_r[iu], base_v))
        for lp, uvc in zip(fb.loops, ((u1, 0.02), (u0, 0.02), (0.5 * (u0 + u1), 0.01))):
            lp[uv_layer].uv = uvc

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    obj = attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=local_pos, subdiv=subdiv)
    obj.rotation_euler = rot
    return obj


def _build_cobble_plate(
    name,
    length,
    width,
    height,
    mat,
    parent,
    local_pos=(0.0, 0.0, 0.0),
    rot=(0.0, 0.0, 0.0),
    segs_u=10,
    uv_center=(0.14, 0.50),
    uv_scale=0.12,
):
    """
    Sculpts a low-profile, chunky beveled polygonal cobblestone armor plate
    (for cranial caputegulae, interstitial carapace tiles, and shoulder mosaics)
    whose UVs stay inside the dark olive/stone crown region of the assigned map.
    """
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")
    hl = length * 0.5
    hw = width * 0.5
    tiers = [
        (1.04, -height * 0.35),
        (0.98,  height * 0.25),
        (0.84,  height * 0.72),
        (0.56,  height * 0.96),
    ]
    rings = []
    for r_s, zh in tiers:
        row = []
        for iu in range(segs_u):
            ang = (iu / segs_u) * math.pi * 2.0
            poly = 1.0 + 0.07 * math.cos(ang * 5.0 + 0.4)
            row.append(bm.verts.new((math.cos(ang) * hl * r_s * poly, math.sin(ang) * hw * r_s * poly, zh)))
        rings.append(row)

    apex = bm.verts.new((0.0, 0.0, height))
    base = bm.verts.new((0.0, 0.0, -height * 0.45))

    def _uv(co):
        return (
            uv_center[0] + (co.y / max(1e-4, hw)) * uv_scale,
            uv_center[1] + (co.x / max(1e-4, hl)) * uv_scale,
        )

    for ir in range(len(rings) - 1):
        r0, r1 = rings[ir], rings[ir + 1]
        for iu in range(segs_u):
            iun = (iu + 1) % segs_u
            f = bm.faces.new((r0[iu], r0[iun], r1[iun], r1[iu]))
            for lp in f.loops:
                lp[uv_layer].uv = _uv(lp.vert.co)
    for iu in range(segs_u):
        iun = (iu + 1) % segs_u
        ft = bm.faces.new((rings[-1][iu], rings[-1][iun], apex))
        for lp in ft.loops:
            lp[uv_layer].uv = _uv(lp.vert.co)
        fb = bm.faces.new((rings[0][iun], rings[0][iu], base))
        for lp in fb.loops:
            lp[uv_layer].uv = _uv(lp.vert.co)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    obj = attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=local_pos, subdiv=0)
    obj.rotation_euler = rot
    return obj


def _build_pyramidal_horn(
    name,
    ctrl_points,
    base_rx,
    base_rz,
    mat,
    parent,
    local_pos=(0.0, 0.0, 0.0),
    segs_u=18,
    segs_v=18,
    tip_taper=1.10,
    facet_power=0.14,
    flute_amp=0.04,
    v_uv_range=(0.0, 1.0),
):
    """
    Sculpts a sturdy, organically faceted pyramidal-triangular Ankylosaurus cranial horn
    or thick triangular carapace marginal flange spike along a 3D spline.
    UV v runs across v_uv_range from base to slightly blunted weathered tip.
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

        # Sturdy slightly blunted battle-worn tip (not needle-thin!)
        if iv == segs_v:
            scale_r = 0.012
        elif v > 0.92:
            s_tip = (1.0 - v) / 0.08
            scale_r = max(0.018, (1.0 - (0.92 ** tip_taper)) * (s_tip ** 0.55))
        else:
            scale_r = max(0.03, 1.0 - (v ** tip_taper))

        # Flared bony base root collar
        root_flare = 1.0 + 0.14 * ((1.0 - min(1.0, v / 0.22)) ** 1.6)
        ry = base_rx * scale_r * root_flare
        rz = base_rz * scale_r * root_flare
        v_uv = v_uv_range[0] + v * (v_uv_range[1] - v_uv_range[0])

        row_v = []
        row_uv = []
        for iu in range(segs_u):
            u = iu / segs_u
            ang = u * math.pi * 2.0
            sin_a = math.sin(ang)
            cos_a = math.cos(ang)
            # Subtle 3-ridge triangular-pyramidal faceting characteristic of Ankylosaurus horns!
            tri_facet = 1.0 + facet_power * math.cos(ang * 3.0) * (0.4 + 0.6 * math.sin(v * math.pi))
            flute = 1.0 + flute_amp * math.cos(ang * 8.0) * math.sin(v * math.pi)
            pt = c_pt + lat_axis * (sin_a * ry * tri_facet * flute) + up_axis * (cos_a * rz * tri_facet * flute)
            row_v.append(pt)
            row_uv.append((u, v_uv))
        rings_v.append(row_v)
        rings_uv.append(row_uv)

    bm = _build_grid_bmesh(rings_v, rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    return attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=local_pos, subdiv=0)


def _build_marginal_flange_spike(
    name,
    length,
    base_width,
    base_thick,
    direction,
    curve_offset,
    mat,
    parent,
    local_pos=(0.0, 0.0, 0.0),
):
    """
    Sculpts a heavy, dorsoventrally beveled triangular ankylosaur lateral carapace flange spike
    (broad rugged osteoderm root tapering cleanly to a stout backward-swept armored edge).
    """
    d = Vector(direction).normalized()
    c_off = Vector(curve_offset)
    pts = [
        -d * 0.08,  # Deeply embedded inside lateral carapace shelf for zero seam!
        d * (length * 0.30) + c_off * 0.22,
        d * (length * 0.68) + c_off * 0.62,
        d * length + c_off,
    ]
    return _build_pyramidal_horn(
        name,
        pts,
        base_rx=base_width,
        base_rz=base_thick,
        mat=mat,
        parent=parent,
        local_pos=local_pos,
        segs_u=14,
        segs_v=14,
        tip_taper=1.06,
        facet_power=0.10,
        flute_amp=0.04,
        v_uv_range=(0.24, 0.96),
    )


def _build_curved_eyelid_arc(name, radius_x, radius_z, y_out, thickness, is_upper, side, mat, parent, uv_u=0.22):
    """Builds a smooth continuous almond-shaped scaly eyelid arc wrapping both eye corners."""
    n_v = 16
    n_u = 10
    rings_v, rings_uv = [], []
    z_sign = 1.0 if is_upper else -1.0

    for iv in range(n_v + 1):
        t = iv / n_v
        ang_arc = (t - 0.5) * math.pi * 1.08
        cx = math.sin(ang_arc) * radius_x
        cz = z_sign * (0.004 + math.cos(ang_arc) * radius_z)
        cy = side * (y_out * (0.54 + 0.46 * math.cos(ang_arc)))
        env = max(0.24, math.sin(t * math.pi) ** 0.52)
        r_tube = thickness * env

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
            ruv.append((uv_u + u * 0.14, 0.35 + t * 0.25))
        rings_v.append(rv)
        rings_uv.append(ruv)

    bm = _build_grid_bmesh(rings_v, rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    return attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=(0.0, 0.0, 0.0), subdiv=0)


def _eval_spine_surface(master_spline, t, theta, cap_scale=1.0):
    """
    Evaluates the sculpted low-slung Ankylosaurus living-fortress body cross-section at
    spline parameter t in [0, 1] and circumferential angle theta (0 = dorsal crest,
    +/-pi/2 = lateral overhanging shelf, pi = ventral belly/chest/throat).
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

    is_carapace = 0.32 < t < 0.78
    is_neck = t >= 0.74
    is_tail = t <= 0.34

    w_exp = 0.74 if is_carapace else 0.88
    y_lat = sign_s * (abs_sin ** w_exp) * ry

    if cos_t >= 0.0:
        z_vert = (cos_t ** (0.84 if is_carapace else 0.92)) * rz
    else:
        # Deeper grounded belly & chest brisket so the tank sits low & heavy!
        belly_depth = 0.86 if is_carapace else 0.92
        z_vert = -((-cos_t) ** 0.84) * rz * belly_depth

    # 1. Overhanging lateral armored carapace shelf flange & sculpted transverse band swells
    if is_carapace:
        carapace_env = math.sin(((t - 0.32) / 0.46) * math.pi)
        band_wave = 0.5 + 0.5 * math.cos(t * math.pi * 28.0)

        # Prominent overhanging lateral armor rim where carapace shields the softer flanks
        if -0.22 < cos_t < 0.28:
            flange = math.sin(((cos_t + 0.22) / 0.50) * math.pi)
            y_lat += sign_s * flange * 0.085 * ry * carapace_env
            z_vert -= flange * 0.025 * rz * carapace_env

        # Soft inward tuck right beneath the overhanging carapace skirt
        if -0.58 < cos_t <= -0.22:
            tuck = math.sin(((cos_t + 0.58) / 0.36) * math.pi)
            y_lat *= (1.0 - 0.065 * tuck * carapace_env)

        # Broad dorsal armored dome ribs & transverse armor rolls
        if cos_t > 0.18:
            ridge_wave = 0.5 + 0.5 * math.cos(abs_sin * math.pi * 4.0)
            z_vert += (0.028 + 0.022 * band_wave * ridge_wave) * rz * carapace_env

    # 2. Deep muscular chest brisket & layered gular throat folds (portrait signature!)
    if 0.62 < t < 0.96 and cos_t < -0.18:
        chest_env = math.sin(((t - 0.62) / 0.34) * math.pi)
        throat_folds = 1.0 + 0.052 * math.sin(t * math.pi * 24.0) * chest_env
        z_vert *= (1.0 + 0.16 * chest_env) * throat_folds
        if 0.64 < t < 0.82 and abs_sin > 0.35:
            y_lat *= (1.0 + 0.06 * chest_env)

    # 3. Muscular M. caudofemoralis tail base transition behind rear hips
    if 0.22 < t < 0.40 and -0.45 < cos_t < 0.45 and abs_sin > 0.45:
        cf_env = math.sin(((t - 0.22) / 0.18) * math.pi)
        y_lat += sign_s * 0.06 * ry * cf_env

    # 4. Ossified longitudinal tendon ridges along stiffened distal tail handle
    if is_tail and 0.04 < t < 0.32:
        tendon_env = math.sin(((t - 0.04) / 0.28) * math.pi)
        if abs_sin > 0.65 and abs(cos_t) < 0.45:
            y_lat += sign_s * 0.065 * ry * tendon_env * (1.0 - abs(cos_t) / 0.45)
        if cos_t > 0.60 and abs_sin < 0.28:
            caudal_wave = 0.5 + 0.5 * math.cos(t * math.pi * 32.0)
            z_vert += (1.0 - abs_sin / 0.28) * (0.035 + 0.030 * caudal_wave) * rz * tendon_env

    return c_world + lat_axis * y_lat + up_axis * z_vert


def _eval_carapace_point_and_normal(master_spline, t, theta, origin_world):
    """Computes local position relative to origin_world and outward unit surface normal at (t, theta)."""
    p = _eval_spine_surface(master_spline, t, theta)
    p_t = _eval_spine_surface(master_spline, min(0.995, t + 0.007), theta)
    p_b = _eval_spine_surface(master_spline, max(0.005, t - 0.007), theta)
    p_u1 = _eval_spine_surface(master_spline, t, theta + 0.03)
    p_u0 = _eval_spine_surface(master_spline, t, theta - 0.03)

    tan_v = p_t - p_b
    tan_u = p_u1 - p_u0
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
    segs_u=48,
    segs_v=32,
    v_uv_scale=2.2,
):
    """Lofts a C1-continuous slice [t_start, t_end] of the Ankylosaurus master spine."""
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


def _add_carapace_and_cervical_armor(master_spline, torso_bone, torso_world, neck_bone, neck_world, mats):
    """
    Populates the carapace with:
      1. 6 transverse bands of authentic paired ridge-keeled osteoderm shields
         (broad oval/hexagonal shields with swept-back longitudinal keels).
      2. Interlocking low-profile secondary cobblestone osteoderm tiles filling
         the spaces between bands so the entire carapace reads as cohesive armor.
      3. 7 pairs of heavy beveled triangular marginal flange spikes along the
         overhanging lateral rim (weathered olive-stone scute material, zero overlap!).
      4. 2 cleanly separated armored cervical half-rings on Bone_Neck.
    """
    # 1. Six transverse bands of broad paired ridge-keeled osteoderm shields across Bone_Torso
    band_ts = (0.402, 0.464, 0.526, 0.588, 0.650, 0.712)
    for bi, bt in enumerate(band_ts):
        env = math.sin(((bt - 0.35) / 0.41) * math.pi)
        # Authentic Ankylosaurus bilateral paired files (paramedian, dorsolateral, supramarginal)
        thetas = (-1.04, -0.64, -0.25, 0.25, 0.64, 1.04)
        for ti, th in enumerate(thetas):
            pos, nrm = _eval_carapace_point_and_normal(master_spline, bt, th, torso_world)
            abs_th = abs(th)
            is_paramed = abs_th < 0.35
            is_outer = abs_th > 0.90
            sc_len = (0.34 if is_paramed else (0.37 if not is_outer else 0.31)) * (0.84 + 0.20 * env)
            sc_wid = (0.28 if is_paramed else (0.30 if not is_outer else 0.24)) * (0.84 + 0.20 * env)
            sc_h = (0.145 if is_paramed else (0.165 if not is_outer else 0.145)) * (0.82 + 0.22 * env)

            _build_keeled_osteoderm(
                f"Ankylo_CarapaceScute_{bi}_{ti}",
                length=sc_len,
                width=sc_wid,
                height=sc_h,
                mat=mats["scute"],
                parent=torso_bone,
                local_pos=pos - nrm * 0.022,
                rot=_rot_from_z_normal(nrm),
                keel_bias=-0.22,
                ridge_ratio=0.46,
                segs_u=14,
                subdiv=0,
            )

    # 2. Interlocking secondary low-profile osteoderm mosaic tiles between bands + midline seam
    mid_ts = (0.433, 0.495, 0.557, 0.619, 0.681)
    for mi, mt in enumerate(mid_ts):
        env = math.sin(((mt - 0.35) / 0.41) * math.pi)
        for si, th in enumerate((0.0, -0.44, 0.44, -0.84, 0.84, -1.20, 1.20)):
            pos, nrm = _eval_carapace_point_and_normal(master_spline, mt, th, torso_world)
            is_mid = abs(th) < 0.05
            tile_l = (0.22 if is_mid else 0.20) * (0.85 + 0.18 * env)
            tile_w = (0.20 if is_mid else 0.18) * (0.85 + 0.18 * env)
            tile_h = (0.072 if is_mid else 0.082) * (0.84 + 0.18 * env)
            _build_keeled_osteoderm(
                f"Ankylo_InterTile_{mi}_{si}",
                length=tile_l,
                width=tile_w,
                height=tile_h,
                mat=mats["scute"],
                parent=torso_bone,
                local_pos=pos - nrm * 0.014,
                rot=_rot_from_z_normal(nrm),
                keel_bias=-0.14,
                ridge_ratio=0.52,
                segs_u=10,
                subdiv=0,
            )

    # 3. Seven pairs of heavy beveled triangular marginal flange spikes along overhanging carapace skirt
    lat_ts = (0.392, 0.448, 0.504, 0.560, 0.616, 0.672, 0.722)
    for li, lt in enumerate(lat_ts):
        env = math.sin(((lt - 0.34) / 0.43) * math.pi)
        # Graduated silhouette: bold broad defensive blades mid-body, compacting cleanly at hips/shoulders
        sp_len = 0.25 + 0.16 * env
        sp_w = 0.120 + 0.032 * env
        sp_th = 0.068 + 0.020 * env
        for side in (-1, 1):
            s_tag = "L" if side > 0 else "R"
            th = side * 1.44
            pos, nrm = _eval_carapace_point_and_normal(master_spline, lt, th, torso_world)
            anchor = pos - nrm * 0.038

            _build_marginal_flange_spike(
                f"Ankylo_LatFlange_{s_tag}_{li}",
                length=sp_len,
                base_width=sp_w,
                base_thick=sp_th,
                direction=(-0.54, side * 0.84, 0.05),
                curve_offset=(-0.09, side * 0.01, 0.02),
                mat=mats["scute"],
                parent=torso_bone,
                local_pos=anchor,
            )

    # 4. Two cleanly spaced armored cervical half-rings on Bone_Neck (zero collision with skull horns!)
    # t=0.778 (posterior cervical ring near shoulders) & t=0.842 (anterior cervical ring)
    for ri, (nt, scale_r) in enumerate(((0.778, 1.00), (0.842, 0.84))):
        # Four paired dorsal-lateral keeled cervical shields per half-ring
        for ci, th in enumerate((-0.78, -0.28, 0.28, 0.78)):
            pos, nrm = _eval_carapace_point_and_normal(master_spline, nt, th, neck_world)
            _build_keeled_osteoderm(
                f"Ankylo_CervicalScute_{ri}_{ci}",
                length=0.22 * scale_r,
                width=0.19 * scale_r,
                height=0.105 * scale_r,
                mat=mats["scute"],
                parent=neck_bone,
                local_pos=pos - nrm * 0.018,
                rot=_rot_from_z_normal(nrm),
                keel_bias=-0.18,
                ridge_ratio=0.45,
                segs_u=12,
                subdiv=0,
            )
        # Compact lateral cervical half-ring triangular flange plates (kept clearly behind skull horns!)
        for side in (-1, 1):
            s_tag = "L" if side > 0 else "R"
            pos, nrm = _eval_carapace_point_and_normal(master_spline, nt, side * 1.24, neck_world)
            _build_marginal_flange_spike(
                f"Ankylo_CervicalFlange_{s_tag}_{ri}",
                length=0.17 * scale_r,
                base_width=0.078 * scale_r,
                base_thick=0.050 * scale_r,
                direction=(-0.56, side * 0.82, 0.12),
                curve_offset=(-0.04, side * 0.01, 0.01),
                mat=mats["scute"],
                parent=neck_bone,
                local_pos=pos - nrm * 0.025,
            )


def _build_sculpted_skull_and_jaw(head_bone, jaw_bone, mats):
    """
    Sculpts the portrait-faithful Ankylosaurus magniventris armored skull matching
    assets/portraits/ankylo.png:
      - Broad, chunky, powerfully arched triangular-trapezoidal skull (56x64).
      - Tightly interlocking beveled polygonal caputegulae mosaic across forehead & nasal bridge.
      - 3 bold sculpted supraorbital brow boss osteoderms crowning each eye + subocular bosses.
      - Compact, smoothly rounded dark charcoal-umber turtle-like upper & lower keratinous beaks.
      - Clean sculpted oval anterior-lateral nostrils with dark recessed cavities (zero pinch!).
      - Fierce recessed golden-amber eyes with continuous concentric wrinkled almond eyelids.
      - 4 iconic sturdy faceted pyramidal honey-ochre cranial horns (squamosal & jugal)
        seated cleanly in flush scaly cranial cuffs (zero dark glossy collars!).
      - Broad warm sandstone-buff pebbled mandible/jowl & subtle portrait beak-corner boss.
    """
    pitch_q = Euler((0.0, 0.06, 0.0), "XYZ").to_matrix().to_4x4()

    # Chunkier, broader, more arched & compact skull matching assets/portraits/ankylo.png!
    # (x, top_z, bot_z, half_width)
    slices = [
        (-0.16,  0.14, -0.10, 0.003),  # Closed occipital cap inside thick neck
        (-0.02,  0.29, -0.20, 0.43),   # Broad occiput & squamosal cranial table
        ( 0.14,  0.32, -0.21, 0.46),   # Widest jugal/temporal cranial shelf
        ( 0.30,  0.31, -0.19, 0.42),   # Domed supraorbital brow vault
        ( 0.46,  0.27, -0.16, 0.35),   # Arched broad nasal bridge
        ( 0.60,  0.20, -0.14, 0.25),   # Anterior snout & clean narial fossa
        ( 0.69,  0.10, -0.125, 0.145), # Premaxilla collar meeting compact turtle beak flush
        ( 0.725, 0.02, -0.105, 0.060), # Rostral bone core tucked safely INSIDE beak
        ( 0.735,-0.02, -0.085, 0.003), # Closed internal core cap (zero poke-through!)
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

        # Subtle natural maxillary lip curve
        if 0.36 < v < 0.84:
            bot_z -= 0.012 * math.sin(((v - 0.36) / 0.48) * math.pi)

        brow_prof = math.exp(-(((v - 0.44) / 0.125) ** 2))
        orbit_prof = math.exp(-(((v - 0.45) / 0.082) ** 2))
        jugal_prof = math.exp(-(((v - 0.24) / 0.095) ** 2))
        snout_arch = math.sin(((v - 0.14) / 0.70) * math.pi) if (0.14 < v < 0.84) else 0.0

        row_v = []
        row_uv = []
        for ix in range(radial_steps):
            u = ix / radial_steps
            angle = u * math.pi * 2.0
            s = math.sin(angle)
            c = math.cos(angle)
            abs_s = abs(s)
            sign_s = 1.0 if s >= 0.0 else -1.0

            ly = sign_s * (abs_s ** 0.74) * half_w
            mid_z = 0.5 * (top_z + bot_z)
            half_h = max(0.008, 0.5 * (top_z - bot_z))

            if c >= 0.0:
                lz = mid_z + half_h * (c ** 0.68)
                # Subtle organic caputegulae crown boss relief across skull roof & snout bridge
                if snout_arch > 0.0 and c > 0.42:
                    tile = 0.5 + 0.5 * math.cos(v * math.pi * 18.0) * math.cos(abs_s * math.pi * 7.0)
                    lz += snout_arch * tile * 0.018 * ((c - 0.42) / 0.58)
                # Fierce overhanging supraorbital brow ridge shielding the eye
                if brow_prof > 0.01 and 0.14 < c < 0.84:
                    arch = math.sin(((c - 0.14) / 0.70) * math.pi)
                    lz += brow_prof * arch * 0.062
                    ly += sign_s * brow_prof * arch * 0.056
            else:
                lz = mid_z - half_h * ((-c) ** 0.82)

            # Deep smooth bony orbital socket
            if orbit_prof > 0.01 and -0.24 < c < 0.30:
                orb_d = math.sin(((c + 0.24) / 0.54) * math.pi)
                ly *= (1.0 - 0.30 * orbit_prof * orb_d)

            # Subtle subocular cheek rim below eye
            if orbit_prof > 0.01 and -0.50 < c <= -0.20:
                rim_a = math.sin(((c + 0.50) / 0.30) * math.pi)
                ly += sign_s * orbit_prof * 0.022 * rim_a

            # Broad flaring jugal cheek shelf anchoring lower cranial horns
            if jugal_prof > 0.01 and -0.66 < c < 0.08:
                j_arch = math.sin(((c + 0.66) / 0.74) * math.pi)
                ly += sign_s * jugal_prof * j_arch * 0.054
                lz -= jugal_prof * j_arch * 0.014

            # Clean smooth anterior-lateral narial fossa (positioned cleanly behind compact beak!)
            naris_u = (v - 0.76) / 0.048
            naris_v = (c - 0.10) / 0.19
            naris_d2 = naris_u * naris_u + naris_v * naris_v
            if naris_d2 < 1.0:
                n_dep = (1.0 - naris_d2) ** 1.3
                ly *= (1.0 - 0.34 * n_dep)
            elif 1.0 <= naris_d2 < 2.1:
                hood = math.sin(((naris_d2 - 1.0) / 1.1) * math.pi)
                ly += sign_s * 0.018 * hood
                lz += 0.008 * hood * (1.0 if naris_v > 0 else -0.3)

            row_v.append(pitch_q @ Vector((fx, ly, lz)))
            row_uv.append((u, v * 1.55))

        skull_rings_v.append(row_v)
        skull_rings_uv.append(row_uv)

    bm_skull = _build_grid_bmesh(skull_rings_v, skull_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_skull, "Ankylo_UpperCranium", mat=mats["cranium"], parent=head_bone)

    # Dark recessed oval nostril openings seated cleanly inside each sculpted narial fossa!
    for side in (-1, 1):
        s_tag = "L" if side > 0 else "R"
        bm_n = bmesh.new()
        bmesh.ops.create_uvsphere(bm_n, u_segments=14, v_segments=10, radius=0.032)
        n_obj = attach_mesh_obj(
            bm_n, f"Ankylo_Nostril_{s_tag}", mat=mats["pupil"], parent=head_bone,
            local_pos=pitch_q @ Vector((0.608, side * 0.220, 0.044)),
        )
        n_obj.scale = (1.35, 0.52, 0.78)
        n_obj.rotation_euler = (0.0, 0.24, -side * 0.48)

    # 2. Sleek, flush-fitting dark charcoal-umber turtle-like UPPER BEAK (faithful to portrait!)
    beak_slices = [
        (0.635,  0.104, -0.118, 0.148),  # Tucked smoothly INSIDE snout premaxilla border
        (0.688,  0.104, -0.130, 0.155),  # Flush emerging dark keratin collar
        (0.738,  0.070, -0.140, 0.132),  # Sleek rounded convex keratin front wall
        (0.776,  0.012, -0.146, 0.092),  # Gently curved blunt herbivore cropping rim
        (0.792, -0.052, -0.146, 0.048),  # Compact rounded turtle cropping apex
        (0.788, -0.108, -0.126, 0.002),  # Clean solid closed cropping tomium (zero fin!)
    ]
    b_top_sp = CatmullRomSpline3D([(b[0], b[3], b[1]) for b in beak_slices])
    b_bot_sp = CatmullRomSpline3D([(b[0], b[3], b[2]) for b in beak_slices])
    b_segs_u, b_segs_v = 28, 24
    b_rings_v, b_rings_uv = [], []
    for iv in range(b_segs_v + 1):
        v = iv / b_segs_v
        pt_t, _ = b_top_sp.eval_at(v)
        pt_b, _ = b_bot_sp.eval_at(v)
        bx = pt_t.x
        b_hw = max(0.001, pt_t.y)
        b_mid_z = 0.5 * (pt_t.z + pt_b.z)
        b_hh = max(0.001, 0.5 * (pt_t.z - pt_b.z))
        row_v, row_uv = [], []
        for iu in range(b_segs_u):
            u = iu / b_segs_u
            ang = u * math.pi * 2.0
            sa, ca = math.sin(ang), math.cos(ang)
            abs_s = abs(sa)
            ly = math.copysign(1.0, sa) * (abs_s ** 0.84) * b_hw
            lz = b_mid_z + (b_hh * (ca ** 0.72) if ca >= 0.0 else -b_hh * ((-ca) ** 0.82))
            if ca > 0.55 and abs_s < 0.35:
                lz += 0.006 * (1.0 - abs_s / 0.35) * math.sin(v * math.pi)
            row_v.append(pitch_q @ Vector((bx, ly, lz)))
            row_uv.append((u, v * 0.94))
        b_rings_v.append(row_v)
        b_rings_uv.append(row_uv)
    bm_beak = _build_grid_bmesh(b_rings_v, b_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_beak, "Ankylo_UpperBeak", mat=mats["beak"], parent=head_bone)

    # 3. Tightly Interlocking Broad Low-Profile Caputegulae Armor Slabs across Crown & Nasal Bridge
    mid_caps = [
        (0.02, 0.00, 0.282, 0.18, 0.22, 0.028, (0.0, -0.06, 0.0)),
        (0.17, 0.00, 0.308, 0.19, 0.23, 0.030, (0.0,  0.02, 0.0)),
        (0.32, 0.00, 0.300, 0.18, 0.22, 0.030, (0.0,  0.10, 0.0)),
        (0.46, 0.00, 0.264, 0.17, 0.20, 0.028, (0.0,  0.22, 0.0)),
        (0.58, 0.00, 0.204, 0.15, 0.17, 0.026, (0.0,  0.38, 0.0)),
        (0.66, 0.00, 0.132, 0.12, 0.14, 0.022, (0.0,  0.54, 0.0)),
    ]
    for idx, (cx, cy, cz, cl, cw, ch, crot) in enumerate(mid_caps):
        _build_cobble_plate(
            f"Ankylo_CapMid_{idx}",
            length=cl, width=cw, height=ch,
            mat=mats["cranium"], parent=head_bone,
            local_pos=pitch_q @ Vector((cx, cy, cz)), rot=crot,
            segs_u=8, uv_center=(0.06, 0.45 + idx * 0.06), uv_scale=0.06,
        )

    lat_caps = [
        (0.03, 0.18, 0.266, 0.18, 0.18, 0.026, (0.28, -0.04, 0.0)),
        (0.18, 0.19, 0.288, 0.19, 0.18, 0.028, (0.30,  0.04, 0.0)),
        (0.32, 0.18, 0.278, 0.18, 0.18, 0.028, (0.32,  0.12, 0.0)),
        (0.45, 0.16, 0.244, 0.16, 0.16, 0.026, (0.35,  0.22, 0.0)),
        (0.56, 0.12, 0.184, 0.14, 0.14, 0.024, (0.38,  0.38, 0.0)),
        (0.10, 0.33, 0.212, 0.17, 0.16, 0.026, (0.62,  0.00, 0.0)),
        (0.24, 0.33, 0.222, 0.17, 0.16, 0.026, (0.65,  0.08, 0.0)),
        (0.49, 0.24, 0.162, 0.15, 0.14, 0.024, (0.68,  0.24, 0.0)),
        (0.59, 0.18, 0.102, 0.12, 0.11, 0.020, (0.72,  0.38, 0.0)),
    ]
    for side in (-1, 1):
        s_tag = "L" if side > 0 else "R"
        for li, (cx, cy, cz, cl, cw, ch, (rx, ry, rz)) in enumerate(lat_caps):
            _build_cobble_plate(
                f"Ankylo_CapLat_{s_tag}_{li}",
                length=cl, width=cw, height=ch,
                mat=mats["cranium"], parent=head_bone,
                local_pos=pitch_q @ Vector((cx, side * cy, cz)),
                rot=(side * rx, ry, side * rz),
                segs_u=8, uv_center=(0.12, 0.30 + li * 0.05), uv_scale=0.06,
            )

    # 4. Bilateral brow boss crests, 4 pyramidal cranial horns, cheek bosses & fierce recessed eyes
    for side in (-1, 1):
        s_tag = "L" if side > 0 else "R"

        # 3 Bold triangular supraorbital brow osteoderm crests crowning the eye (portrait signature!)
        for bi, (bx, by, bz, bl, bw, bh, b_rx, b_ry) in enumerate((
            (0.21, 0.345, 0.245, 0.14, 0.11, 0.088, 0.64, -0.18),
            (0.32, 0.358, 0.236, 0.14, 0.11, 0.092, 0.68,  0.04),
            (0.42, 0.332, 0.205, 0.12, 0.10, 0.076, 0.72,  0.20),
        )):
            _build_keeled_osteoderm(
                f"Ankylo_BrowScute_{s_tag}_{bi}",
                length=bl, width=bw, height=bh,
                mat=mats["scute"], parent=head_bone,
                local_pos=pitch_q @ Vector((bx, side * by, bz)),
                rot=(side * b_rx, b_ry, 0.0),
                keel_bias=-0.16, ridge_ratio=0.40, segs_u=10, subdiv=0,
            )

        # 2 Visible subocular cheek boss osteoderms along the outer lower zygomatic rim (portrait!)
        for ci, (cx, cy, cz, cl, ch) in enumerate((
            (0.21, 0.415, -0.035, 0.092, 0.036),
            (0.31, 0.388, -0.048, 0.084, 0.032),
        )):
            _build_cobble_plate(
                f"Ankylo_CheekBoss_{s_tag}_{ci}",
                length=cl, width=cl * 0.82, height=ch,
                mat=mats["cranium"], parent=head_bone,
                local_pos=pitch_q @ Vector((cx, side * cy, cz)),
                rot=(side * 1.48, 0.0, -side * 0.14),
                segs_u=8, uv_center=(0.24, 0.48 + ci * 0.06), uv_scale=0.05,
            )

        # Signature Upper Squamosal Pyramidal Horn (honey-ochre keratin!) + flush cobblestone cuff
        sq_base = pitch_q @ Vector((-0.02, side * 0.32, 0.22))
        _build_cobble_plate(
            f"Ankylo_SqCuff_{s_tag}",
            length=0.25, width=0.24, height=0.075,
            mat=mats["cranium"], parent=head_bone,
            local_pos=sq_base, rot=(side * 0.60, -0.52, 0.0),
            segs_u=12, uv_center=(0.14, 0.45), uv_scale=0.07,
        )
        sq_pts = [
            pitch_q @ Vector(( 0.01, side * 0.29, 0.20)),  # Embedded safely inside skull table
            pitch_q @ Vector((-0.14, side * 0.41, 0.31)),
            pitch_q @ Vector((-0.29, side * 0.51, 0.42)),
            pitch_q @ Vector((-0.43, side * 0.57, 0.52)),
        ]
        _build_pyramidal_horn(
            f"Ankylo_HornSq_{s_tag}",
            sq_pts,
            base_rx=0.125,
            base_rz=0.132,
            mat=mats["horn"],
            parent=head_bone,
            segs_u=18,
            segs_v=18,
            tip_taper=1.12,
            facet_power=0.14,
            flute_amp=0.045,
        )

        # Signature Lower Jugal / Quadratojugal Pyramidal Cheek Horn + flush cobblestone cuff
        jg_base = pitch_q @ Vector((0.06, side * 0.37, -0.055))
        _build_cobble_plate(
            f"Ankylo_JgCuff_{s_tag}",
            length=0.23, width=0.22, height=0.068,
            mat=mats["cranium"], parent=head_bone,
            local_pos=jg_base, rot=(side * 1.46, -0.32, 0.0),
            segs_u=12, uv_center=(0.18, 0.52), uv_scale=0.07,
        )
        jg_pts = [
            pitch_q @ Vector(( 0.09, side * 0.33, -0.045)),  # Embedded safely inside jugal shelf
            pitch_q @ Vector((-0.05, side * 0.47, -0.100)),
            pitch_q @ Vector((-0.19, side * 0.57, -0.158)),
            pitch_q @ Vector((-0.32, side * 0.64, -0.208)),
        ]
        _build_pyramidal_horn(
            f"Ankylo_HornJg_{s_tag}",
            jg_pts,
            base_rx=0.114,
            base_rz=0.104,
            mat=mats["horn"],
            parent=head_bone,
            segs_u=16,
            segs_v=16,
            tip_taper=1.12,
            facet_power=0.13,
            flute_amp=0.04,
        )

        # Subtle portrait-faithful keratinous beak-corner boss nestled right behind upper beak!
        _build_conical_horn(
            f"Ankylo_CheekSpike_{s_tag}",
            length=0.084,
            base_r=0.025,
            direction=(-0.38, side * 0.24, -0.89),
            curve_offset=(-0.014, 0.0, -0.008),
            mat=mats["horn"],
            parent=head_bone,
            local_pos=pitch_q @ Vector((0.610, side * 0.185, -0.095)),
            segs_u=12,
            segs_v=10,
            flat_y=0.90,
            flute_amp=0.03,
        )

        # Fierce deeply-set golden-amber eye with continuous concentric wrinkled almond eyelids!
        eye_center = pitch_q @ Vector((0.332, side * 0.292, 0.068))
        eye_grp = create_bone_node(f"Ankylo_EyeSocket_{s_tag}", eye_center, parent=head_bone)
        eye_grp.rotation_euler = (-0.04, 0.05, -side * 0.32)

        bm_sh = bmesh.new()
        bmesh.ops.create_uvsphere(bm_sh, u_segments=14, v_segments=12, radius=0.050)
        sh_obj = attach_mesh_obj(
            bm_sh, f"Ankylo_OrbitShadow_{s_tag}", mat=mats["pupil"], parent=eye_grp,
            local_pos=(0.0, -side * 0.018, 0.0),
        )
        sh_obj.scale = (0.94, 0.62, 0.90)

        bm_ir = bmesh.new()
        uv_ir = bm_ir.loops.layers.uv.new("UVMap")
        bmesh.ops.create_uvsphere(bm_ir, u_segments=22, v_segments=16, radius=0.046)
        for f in bm_ir.faces:
            for loop in f.loops:
                co = loop.vert.co / 0.046
                loop[uv_ir].uv = (0.5 + co.x * 0.46, 0.5 + co.z * 0.46)
        bmesh.ops.recalc_face_normals(bm_ir, faces=bm_ir.faces)
        ir_obj = attach_mesh_obj(
            bm_ir, f"Ankylo_Eye_{s_tag}", mat=mats["iris"], parent=eye_grp,
            local_pos=(0.0, side * 0.008, 0.0),
        )
        ir_obj.scale = (1.02, 0.88, 1.0)

        # Portrait-faithful crisp dark round-oval reptile pupil centered cleanly
        bm_pu = bmesh.new()
        bmesh.ops.create_uvsphere(bm_pu, u_segments=16, v_segments=12, radius=0.024)
        pu_obj = attach_mesh_obj(
            bm_pu, f"Ankylo_Eye_{s_tag}_Pupil", mat=mats["pupil"], parent=eye_grp,
            local_pos=(0.001, side * 0.039, 0.0),
        )
        pu_obj.scale = (0.72, 0.46, 0.84)

        bm_cl = bmesh.new()
        bmesh.ops.create_uvsphere(bm_cl, u_segments=8, v_segments=8, radius=0.0052)
        attach_mesh_obj(
            bm_cl, f"Ankylo_EyeCatchlight_{s_tag}", mat=mats["catchlight"], parent=eye_grp,
            local_pos=(0.011, side * 0.047, 0.011),
        )

        # Inner continuous almond eyelids meeting tightly at both eye corners!
        _build_curved_eyelid_arc(
            f"Ankylo_UpperEyelid_{s_tag}",
            radius_x=0.056, radius_z=0.030, y_out=0.032, thickness=0.014,
            is_upper=True, side=side, mat=mats["cranium"], parent=eye_grp, uv_u=0.20,
        )
        _build_curved_eyelid_arc(
            f"Ankylo_LowerEyelid_{s_tag}",
            radius_x=0.054, radius_z=0.028, y_out=0.030, thickness=0.013,
            is_upper=False, side=side, mat=mats["cranium"], parent=eye_grp, uv_u=0.24,
        )
        # Outer concentric wrinkled orbital skin fold framing the eye (portrait detail!)
        _build_curved_eyelid_arc(
            f"Ankylo_OuterOrbitFoldTop_{s_tag}",
            radius_x=0.072, radius_z=0.044, y_out=0.022, thickness=0.013,
            is_upper=True, side=side, mat=mats["cranium"], parent=eye_grp, uv_u=0.16,
        )
        _build_curved_eyelid_arc(
            f"Ankylo_OuterOrbitFoldBot_{s_tag}",
            radius_x=0.070, radius_z=0.040, y_out=0.022, thickness=0.012,
            is_upper=False, side=side, mat=mats["cranium"], parent=eye_grp, uv_u=0.28,
        )

    # 5. Broad Heavily Pebbled Lower Mandible, Compact Lower Beak & Tongue (Bone_Jaw)
    # Bone_Jaw sits at (0.14, 0, -0.14) in Bone_Head space, so x=0.56 -> head x=0.70 (safely inside beak!)
    jaw_q = Euler((0.0, 0.05, 0.0), "XYZ").to_matrix().to_4x4()
    m_slices = [
        (-0.14,  0.030, -0.095, 0.003),  # Closed posterior cap inside throat/neck
        (-0.02,  0.074, -0.192, 0.335),  # Broad muscular pebbled cheek/jowl ramus
        ( 0.17,  0.066, -0.200, 0.310),  # Heavy rounded sandstone-pebbled jowl (portrait!)
        ( 0.35,  0.040, -0.168, 0.232),  # Stout tapering dentary
        ( 0.48,  0.026, -0.120, 0.148),  # Symphysis meeting lower beak collar flush
        ( 0.55,  0.018, -0.072, 0.082),  # Core tucked safely INSIDE lower keratin beak
        ( 0.58,  0.010, -0.032, 0.003),  # Closed cap (zero poke-through!)
    ]
    m_bot = CatmullRomSpline3D([(s[0], s[3], s[2]) for s in m_slices])
    m_top = CatmullRomSpline3D([(s[0], s[3], s[1]) for s in m_slices])

    mr_u, mr_v = 38, 40
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
            ly = math.copysign(1.0, sa) * (abs_s ** 0.76) * hw
            if ca <= 0.0:
                chin_rug = 1.0 + (0.035 * math.cos(v * math.pi * 16.0) if v > 0.45 else 0.0)
                lz = pb.z * (abs(ca) ** 0.68) * chin_rug
            else:
                rim = abs_s ** 1.35
                lz = pt.z * rim + (pt.z - 0.04 * math.sin(v * math.pi)) * (1.0 - rim)
            row_v.append(jaw_q @ Vector((pb.x, ly, lz)))
            # Isotropic 1:1 rounded sandstone cobblestone pebbles matching portrait!
            u_jowl = 0.34 + 0.16 * (0.5 - 0.5 * ca)
            row_uv.append((u_jowl, v * 0.52))
        m_rings_v.append(row_v)
        m_rings_uv.append(row_uv)

    # Use periodic seam-free bmesh directly because u_jowl is symmetric around 0.5
    bm_mand = bmesh.new()
    uv_m = bm_mand.loops.layers.uv.new("UVMap")
    bm_mr = [[bm_mand.verts.new(co) for co in m_rings_v[iv]] for iv in range(len(m_rings_v))]
    for iv in range(len(bm_mr) - 1):
        r0, r1 = bm_mr[iv], bm_mr[iv + 1]
        uv0, uv1 = m_rings_uv[iv], m_rings_uv[iv + 1]
        for iu in range(mr_u):
            iun = (iu + 1) % mr_u
            try:
                f = bm_mand.faces.new((r0[iu], r0[iun], r1[iun], r1[iu]))
                for lp, uvc in zip(f.loops, (uv0[iu], uv0[iun], uv1[iun], uv1[iu])):
                    lp[uv_m].uv = uvc
            except ValueError:
                pass
    try:
        bm_mand.faces.new(bm_mr[0][::-1])
        bm_mand.faces.new(bm_mr[-1])
    except ValueError:
        pass
    bmesh.ops.recalc_face_normals(bm_mand, faces=bm_mand.faces)
    attach_mesh_obj(bm_mand, "Ankylo_Mandible", mat=mats["cranium"], parent=jaw_bone)

    # Compact rounded dark keratinous lower predentary beak fitting snugly beneath upper beak!
    # Head-space x spans 0.62 -> 0.778 (cleanly nested right underneath upper beak lip at 0.792!)
    lb_slices = [
        (0.47,  0.018, -0.118, 0.140),
        (0.54,  0.024, -0.106, 0.122),
        (0.59,  0.022, -0.078, 0.088),
        (0.628, 0.012, -0.042, 0.046),
        (0.638,-0.002, -0.020, 0.003),
    ]
    lb_top = CatmullRomSpline3D([(s[0], s[3], s[1]) for s in lb_slices])
    lb_bot = CatmullRomSpline3D([(s[0], s[3], s[2]) for s in lb_slices])
    lbu, lbv = 20, 16
    lb_rv, lb_ruv = [], []
    for iv in range(lbv + 1):
        v = iv / lbv
        pt, _ = lb_top.eval_at(v)
        pb, _ = lb_bot.eval_at(v)
        hw = max(0.002, pt.y)
        mz = 0.5 * (pt.z + pb.z)
        hh = max(0.002, 0.5 * (pt.z - pb.z))
        rv, ruv = [], []
        for iu in range(lbu):
            u = iu / lbu
            a = u * math.pi * 2.0
            sa, ca = math.sin(a), math.cos(a)
            rv.append(jaw_q @ Vector((pt.x, math.copysign(1.0, sa) * (abs(sa) ** 0.85) * hw, mz + ca * hh)))
            ruv.append((u, v * 0.92))
        lb_rv.append(rv)
        lb_ruv.append(ruv)
    bm_lb = _build_grid_bmesh(lb_rv, lb_ruv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_lb, "Ankylo_LowerBeak", mat=mats["beak"], parent=jaw_bone)

    # Fleshy grooved tongue inside lower jaw
    t_u, t_v = 18, 20
    t_rings_v, t_rings_uv = [], []
    for iy in range(t_v + 1):
        v = iy / t_v
        tx = 0.10 + v * 0.44
        arch_z = -0.01 + math.sin(v * math.pi * 0.85) * 0.030
        tip_r = ((1.0 - (v ** 3.2)) ** 0.42) if iy < t_v else 0.002
        base_c = 0.002 if iy == 0 else 1.0
        w = 0.092 * tip_r * base_c * (0.75 + 0.25 * math.sin(v * math.pi))
        h = 0.028 * tip_r * base_c * math.sin(min(1.0, v * 1.15) * math.pi * 0.88)
        row_v, row_uv = [], []
        for ix in range(t_u):
            u = ix / t_u
            ang = u * math.pi * 2.0
            sa, ca = math.sin(ang), math.cos(ang)
            sulcus = -0.010 * math.exp(-((sa / 0.28) ** 2)) * max(0.0, ca) * math.sin(v * math.pi)
            row_v.append(jaw_q @ Vector((tx, sa * w, arch_z + ca * h + sulcus)))
            row_uv.append((u, v))
        t_rings_v.append(row_v)
        t_rings_uv.append(row_uv)
    bm_tongue = _build_grid_bmesh(t_rings_v, t_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_tongue, "Ankylo_Tongue", mat=mats["mucosa"], parent=jaw_bone)


def _build_club_lobe_mesh(name, x_center, length, y_offset, width, height, side, mat, parent):
    """
    Sculpts one of the massive asymmetrical lateral osteoderm boulders of the Ankylosaurus
    tail club with a beveled lateral impact keel ridge, broad faceted osteoderm dome,
    and flattened armored underside. Uses dedicated ankylo_club albedo/normal maps!
    """
    segs_u = 32
    segs_v = 30
    rings_v, rings_uv = [], []
    for iv in range(segs_v + 1):
        v = iv / segs_v
        x = x_center + (0.5 - v) * length
        # Asymmetric heavy oval: broader & heavier toward posterior impact hemisphere
        env = max(0.004, (math.sin(v * math.pi) ** 0.68) * (0.90 + 0.20 * math.sin(v * math.pi * 0.85)))
        ly_span = width * env
        lz_span = height * env
        row_v, row_uv = [], []
        for iu in range(segs_u):
            u = iu / segs_u
            ang = u * math.pi * 2.0
            ca = math.cos(ang)
            sa = math.sin(ang)
            in_out = sa * side
            y_ext = ly_span * (1.16 if in_out > 0.0 else 0.52)
            # Bold beveled outer lateral impact smashing ridge!
            if in_out > 0.35:
                y_ext *= 1.0 + 0.22 * (((in_out - 0.35) / 0.65) ** 1.8)
            y = y_offset + sa * y_ext
            z = ca * lz_span * (1.08 if ca > 0.0 else 0.72)
            # Organic ossified boulder faceting & heavy osteoderm relief
            facet = 1.0 + 0.042 * math.sin(v * math.pi * 6.0 + side * 0.6) * math.cos(ang * 4.0)
            row_v.append(Vector((x, y * facet, z * facet)))
            row_uv.append((u, v))
        rings_v.append(row_v)
        rings_uv.append(row_uv)

    bm = _build_grid_bmesh(rings_v, rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    return attach_mesh_obj(bm, name, mat=mat, parent=parent, subdiv=0)


def _build_tail_armor_and_club(tail_bones, tail_club_bone, mats):
    """
    Adds cohesive armored caudal ring scutes & sculpted lateral caudal flanges along
    Bone_Tail0..2, and sculpts the monumental battle-scarred fused bilobed boulder
    tail club under Special_TailClub.
    """
    # (bone, x_positions, r_lat, r_top, scute_len, flange_len)
    tail_specs = [
        (tail_bones[0], (-0.18, -0.50), 0.38, 0.30, 0.25, 0.24),
        (tail_bones[1], (-0.18, -0.52), 0.24, 0.21, 0.21, 0.19),
        (tail_bones[2], (-0.22, -0.54), 0.16, 0.15, 0.18, 0.00),
    ]
    for bi, (t_bone, x_offs, r_lat, r_top, sc_len, fl_len) in enumerate(tail_specs):
        for si, tx in enumerate(x_offs):
            taper = 1.0 - si * 0.12
            if bi < 2:
                # Paired dorsolateral keeled caudal armor plates hugging the tail profile!
                for side in (-1, 1):
                    s_tag = "L" if side > 0 else "R"
                    _build_keeled_osteoderm(
                        f"Ankylo_TailScute_{bi}_{si}_{s_tag}",
                        length=sc_len * taper,
                        width=sc_len * 0.78 * taper,
                        height=sc_len * 0.38 * taper,
                        mat=mats["scute"],
                        parent=t_bone,
                        local_pos=(tx, side * r_lat * 0.42 * taper, r_top * 0.78 * taper),
                        rot=(side * 0.48, 0.0, 0.0),
                        keel_bias=-0.20,
                        ridge_ratio=0.45,
                        segs_u=12,
                        subdiv=0,
                    )
                    # Sculpted weathered olive-stone lateral caudal flange blades
                    _build_marginal_flange_spike(
                        f"Ankylo_TailFlange_{bi}_{si}_{s_tag}",
                        length=fl_len * taper,
                        base_width=0.072 * taper,
                        base_thick=0.044 * taper,
                        direction=(-0.54, side * 0.84, 0.08),
                        curve_offset=(-0.04, side * 0.01, 0.01),
                        mat=mats["scute"],
                        parent=t_bone,
                        local_pos=(tx, side * r_lat * 0.84 * taper, 0.01),
                    )
            else:
                # Sleek low ossified dorsal handle keel scutes leading into the boulder club
                _build_keeled_osteoderm(
                    f"Ankylo_HandleScute_{si}",
                    length=sc_len * taper,
                    width=sc_len * 0.68 * taper,
                    height=sc_len * 0.28 * taper,
                    mat=mats["scute"],
                    parent=t_bone,
                    local_pos=(tx, 0.0, r_top * 0.82 * taper),
                    rot=(0.0, 0.0, 0.0),
                    keel_bias=-0.16,
                    ridge_ratio=0.52,
                    segs_u=10,
                    subdiv=0,
                )

    # Central ossified handle shaft welded cleanly INSIDE the twin boulder lobes (zero step notch!)
    _build_curved_limb_tube(
        "Ankylo_ClubCore",
        [
            ( 0.04, 0.0, 0.0, 0.130, 0.120, 0.0),
            (-0.10, 0.0, 0.0, 0.195, 0.165, 0.0),
            (-0.34, 0.0, 0.0, 0.230, 0.190, 0.0),
            (-0.68, 0.0, 0.0, 0.165, 0.140, 0.0),
            (-0.84, 0.0, 0.0, 0.025, 0.025, 0.0),
        ],
        mats["club"],
        tail_club_bone,
        radial_segs=20,
        height_segs=24,
        v_uv_range=(0.0, 0.7),
        taper_start=True,
        taper_end=True,
    )

    # 2 Monumental asymmetrical lateral osteoderm boulder lobes + 2 terminal impact lobes
    for side in (-1, 1):
        s_tag = "L" if side > 0 else "R"
        _build_club_lobe_mesh(
            f"Ankylo_ClubLobe_{s_tag}",
            x_center=-0.28,
            length=0.80,
            y_offset=side * 0.135,
            width=0.41,
            height=0.285,
            side=side,
            mat=mats["club"],
            parent=tail_club_bone,
        )
        _build_club_lobe_mesh(
            f"Ankylo_ClubApex_{s_tag}",
            x_center=-0.68,
            length=0.38,
            y_offset=side * 0.065,
            width=0.22,
            height=0.175,
            side=side,
            mat=mats["club"],
            parent=tail_club_bone,
        )

    # 3 Broad dorsal + 2 ventral interlocking locking keel plates welding the boulders together!
    for ki, (kx, kl, kw, kh) in enumerate((
        (-0.08, 0.28, 0.34, 0.095),
        (-0.34, 0.32, 0.38, 0.110),
        (-0.60, 0.28, 0.32, 0.090),
    )):
        _build_keeled_osteoderm(
            f"Ankylo_ClubMidScute_{ki}",
            length=kl, width=kw, height=kh,
            mat=mats["scute"], parent=tail_club_bone,
            local_pos=(kx, 0.0, 0.165),
            rot=(0.0, 0.0, 0.0),
            keel_bias=-0.12, ridge_ratio=0.50, segs_u=12, subdiv=0,
        )
    for vi, (vx, vl, vw, vh) in enumerate((
        (-0.20, 0.28, 0.34, 0.088),
        (-0.48, 0.28, 0.32, 0.084),
    )):
        _build_keeled_osteoderm(
            f"Ankylo_ClubVentralScute_{vi}",
            length=vl, width=vw, height=vh,
            mat=mats["scute"], parent=tail_club_bone,
            local_pos=(vx, 0.0, -0.145),
            rot=(math.pi, 0.0, 0.0),
            keel_bias=-0.12, ridge_ratio=0.50, segs_u=12, subdiv=0,
        )


def _build_ankylo_limb_tube(
    name,
    ctrl_tuples,
    side,
    mat,
    parent,
    radial_segs=30,
    height_segs=40,
    v_uv_range=(0.15, 0.85),
    taper_start=True,
    taper_end=False,
):
    """
    Lofts a stout, heavily muscled Ankylosaurus columnar limb with seamless periodic
    countershaded UV mapping (zero UV seam stripe, zero ankle pinch!):
      - Outer lateral & anterior faces sample rich olive-slate cobblestone armor (u=0.08..0.24).
      - Inner medial face facing the belly warms organically toward sandstone-buff pebbles (u=0.40).
      - Subtle sculpted joint skin folds around elbow/knee and wrist/ankle.
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

        # Organic thick leather joint folds at elbow/knee & wrist/ankle!
        fold_mod = 1.0
        if 0.36 < v < 0.56:
            fold_mod += 0.024 * math.sin((v - 0.36) * math.pi * 20.0) * math.sin(((v - 0.36) / 0.20) * math.pi)
        elif 0.78 < v < 0.94:
            fold_mod += 0.026 * math.sin((v - 0.78) * math.pi * 24.0) * math.sin(((v - 0.78) / 0.16) * math.pi)

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

            # Seamless periodic countershaded UV mapping (zero vertical seam!)
            medial_fac = 0.5 - 0.5 * (sin_a * side)
            u_shade = 0.08 + 0.34 * medial_fac
            row_uv.append((u_shade, v_uv))

        rings_verts.append(row_v)
        rings_uvs.append(row_uv)

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
        bm.faces.new(bm_rings[-1])
    except ValueError:
        pass

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=(0.0, 0.0, 0.0), subdiv=0)


def _build_quadruped_foot(leg_bone, foot_center, foot_r, side, is_front, mats, prefix):
    """
    Sculpts a massive broad elephantine Ankylosaurus manus (5 hooves) or pes (4 hooves)
    blending seamlessly with the flaring wrist/ankle and resting flush at world Z=0!
    """
    fx, fy, fz = foot_center
    pad_rz = 0.098 if is_front else 0.106
    pad_z = fz + pad_rz

    _build_muscular_limb_segment(
        f"{prefix}_FootPad",
        (fx - foot_r * 0.65, fy, pad_z),
        (fx + foot_r * 0.72, fy, pad_z),
        lambda t, ang: (
            foot_r * (0.98 + 0.15 * math.sin(t * math.pi)),
            pad_rz * (1.0 - 0.15 * max(0.0, math.cos(ang)) * t),
            0.0,
            0.0,
        ),
        mats["hide"],
        leg_bone,
        prox_overlap=0.14, dist_overlap=0.14, radial_segs=20, height_segs=12,
        v_uv_range=(0.14, 0.42),
    )

    if is_front:
        toe_specs = [
            (-0.78, 0.11, 0.050, 0.088),
            (-0.38, 0.14, 0.056, 0.102),
            ( 0.00, 0.15, 0.058, 0.106),
            ( 0.38, 0.14, 0.056, 0.100),
            ( 0.78, 0.11, 0.048, 0.084),
        ]
    else:
        toe_specs = [
            (-0.52, 0.14, 0.058, 0.108),
            (-0.17, 0.16, 0.064, 0.118),
            ( 0.17, 0.16, 0.064, 0.118),
            ( 0.52, 0.14, 0.056, 0.104),
        ]

    for ti, (yaw, t_len, t_rad, hoof_len) in enumerate(toe_specs):
        ang = yaw + side * 0.05
        dx = math.cos(ang)
        dy = math.sin(ang)
        t_start = Vector((fx + dx * (foot_r * 0.35), fy + dy * (foot_r * 0.44), fz + 0.068))
        t_end = Vector((fx + dx * (foot_r * 0.35 + t_len), fy + dy * (foot_r * 0.44 + t_len * 0.88), fz + 0.052))
        _build_muscular_limb_segment(
            f"{prefix}_Toe{ti}",
            t_start,
            t_end,
            lambda t, a, r=t_rad: (r * (1.0 - 0.18 * t), r * 0.84 * (1.0 - 0.16 * t), 0.0, 0.0),
            mats["hide"],
            leg_bone,
            prox_overlap=0.22, dist_overlap=0.06, radial_segs=12, height_segs=8,
            v_uv_range=(0.12, 0.28),
        )
        # Broad blunt armored hooves (weathered dark-tipped keratin, flush at floor!)
        _build_conical_horn(
            f"{prefix}_Hoof{ti}",
            length=hoof_len,
            base_r=t_rad * 0.80,
            direction=(dx * 0.86, dy * 0.86, -0.48),
            curve_offset=(0.006 * dx, 0.006 * dy, -0.005),
            mat=mats["beak"],
            parent=leg_bone,
            local_pos=t_end + Vector((0.0, 0.0, 0.006)),
            segs_u=12,
            segs_v=8,
            flat_y=1.22,
            flute_amp=0.03,
        )


def _build_forelimb(leg_bone, side, local_ground_z, mats, idx):
    """
    Sculpts a heavy, muscular, subtly bowed Ankylosaurus forelimb seamlessly emerging from
    broad armored shoulders, flaring cleanly into a 5-toed elephantine manus at Z=0,
    with organic clustered cobblestone shoulder & upper-forearm armor (portrait detail!).
    """
    ctrl = [
        (-0.02, -side * 0.28,  0.42, 0.34, 0.42,  0.00),  # Massive shoulder socket deep in thorax
        (-0.04, -side * 0.02,  0.04, 0.31, 0.36, -0.01),  # Heavy deltoid/triceps mass
        (-0.10,  side * 0.14, -0.34, 0.25, 0.27, -0.02),  # Stout bowed reptilian elbow
        ( 0.00,  side * 0.11, -0.68, 0.22, 0.23,  0.01),  # Thick muscular forearm
        ( 0.06,  side * 0.09, local_ground_z + 0.24, 0.205, 0.205, 0.01),  # Broad columnar wrist
        ( 0.08,  side * 0.09, local_ground_z + 0.05, 0.225, 0.225, 0.00),  # Seamless flare into pad
    ]
    _build_ankylo_limb_tube(
        f"Ankylo_Forelimb_{idx}",
        ctrl,
        side,
        mats["hide"],
        leg_bone,
        radial_segs=30,
        height_segs=40,
        v_uv_range=(0.14, 0.72),
        taper_start=True,
        taper_end=False,
    )

    # Organic staggered cluster of warm weathered olive-stone cobblestone shoulder & upper-foreleg armor
    # (faithful to assets/portraits/ankylo.png — flush textured polygonal plates, zero black smudges!)
    shoulder_plates = [
        # (x, y_lat, z, length, width, height, pitch_y, yaw_z)
        ( 0.06, 0.26,  0.04, 0.21, 0.18, 0.042,  0.10, -0.24),
        (-0.12, 0.28, -0.04, 0.22, 0.19, 0.044, -0.10,  0.18),
        ( 0.03, 0.31, -0.18, 0.20, 0.17, 0.042,  0.06, -0.14),
        (-0.14, 0.32, -0.24, 0.20, 0.17, 0.040, -0.08,  0.14),
        (-0.04, 0.34, -0.38, 0.18, 0.16, 0.036,  0.02, -0.06),
        ( 0.08, 0.29, -0.46, 0.16, 0.14, 0.034,  0.10, -0.28),
        (-0.02, 0.30, -0.58, 0.15, 0.13, 0.032,  0.04, -0.12),
        ( 0.06, 0.27, -0.74, 0.14, 0.12, 0.028,  0.08, -0.18),
    ]
    for si, (sx, sy, sz, sl, sw, sh, py, yz) in enumerate(shoulder_plates):
        _build_cobble_plate(
            f"Ankylo_ForeArmor_{idx}_{si}",
            length=sl, width=sw, height=sh,
            mat=mats["hide"], parent=leg_bone,
            local_pos=(sx, side * sy, sz),
            rot=(side * 1.44, py, side * yz),
            segs_u=10, uv_center=(0.20, 0.32 + si * 0.07), uv_scale=0.065,
        )

    _build_quadruped_foot(
        leg_bone,
        (0.10, side * 0.09, local_ground_z),
        foot_r=0.225,
        side=side,
        is_front=True,
        mats=mats,
        prefix=f"Bone_Leg{idx}",
    )


def _build_hindlimb(leg_bone, side, local_ground_z, mats, idx):
    """
    Sculpts a massive armored Ankylosaurus hindlimb emerging smoothly from the broad
    pelvic carapace, with muscular thigh/knee/calf, clustered outer thigh armor bosses,
    and seamless flaring ankle into a broad 4-toed pes at Z=0.
    """
    ctrl = [
        ( 0.02, -side * 0.30,  0.44, 0.38, 0.48,  0.00),  # Broad iliac hip socket deep in pelvis
        ( 0.06, -side * 0.02,  0.02, 0.35, 0.42,  0.02),  # Massive quadriceps & hamstring belly
        ( 0.14,  side * 0.08, -0.38, 0.26, 0.29,  0.02),  # Muscular knee
        (-0.04,  side * 0.07, -0.74, 0.23, 0.25, -0.02),  # Thick gastrocnemius calf
        ( 0.00,  side * 0.07, local_ground_z + 0.24, 0.210, 0.210, 0.00),  # Stout hock/ankle
        ( 0.03,  side * 0.07, local_ground_z + 0.05, 0.232, 0.232, 0.00),  # Seamless flare into pad
    ]
    _build_ankylo_limb_tube(
        f"Ankylo_Hindlimb_{idx}",
        ctrl,
        side,
        mats["hide"],
        leg_bone,
        radial_segs=30,
        height_segs=40,
        v_uv_range=(0.14, 0.78),
        taper_start=True,
        taper_end=False,
    )

    thigh_plates = [
        ( 0.14, 0.30, -0.04, 0.23, 0.19, 0.044,  0.10, -0.22),
        (-0.06, 0.31, -0.10, 0.23, 0.19, 0.044, -0.10,  0.16),
        ( 0.12, 0.33, -0.24, 0.21, 0.17, 0.040,  0.08, -0.16),
        (-0.04, 0.32, -0.32, 0.20, 0.17, 0.038, -0.08,  0.14),
        ( 0.10, 0.30, -0.46, 0.18, 0.15, 0.034,  0.06, -0.14),
        (-0.02, 0.28, -0.62, 0.16, 0.14, 0.030, -0.06,  0.10),
        ( 0.00, 0.26, -0.80, 0.15, 0.13, 0.026,  0.00,  0.00),
    ]
    for si, (sx, sy, sz, sl, sw, sh, py, yz) in enumerate(thigh_plates):
        _build_cobble_plate(
            f"Ankylo_HindArmor_{idx}_{si}",
            length=sl, width=sw, height=sh,
            mat=mats["hide"], parent=leg_bone,
            local_pos=(sx, side * sy, sz),
            rot=(side * 1.46, py, side * yz),
            segs_u=10, uv_center=(0.20, 0.25 + si * 0.08), uv_scale=0.065,
        )

    _build_quadruped_foot(
        leg_bone,
        (0.05, side * 0.07, local_ground_z),
        foot_r=0.235,
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
            roughness=0.76,
            metallic=0.01,
            albedo_path=_tex("ankylo_albedo.png"),
            bump_path=_tex("ankylo_normal.png"),
            bump_strength=0.46,
        ),
        "cranium": _make_trex_pbr_mat(
            "Mat_BodyPrimary_Skull",
            base_color=(0.36, 0.39, 0.32, 1.0),
            roughness=0.68,
            metallic=0.02,
            albedo_path=_tex("ankylo_cranium_albedo.png"),
            bump_path=_tex("ankylo_cranium_normal.png"),
            bump_strength=0.48,
        ),
        "scute": _make_trex_pbr_mat(
            "Mat_Secondary",
            base_color=(0.38, 0.39, 0.31, 1.0),
            roughness=0.62,
            metallic=0.02,
            albedo_path=_tex("ankylo_scute_albedo.png"),
            bump_path=_tex("ankylo_scute_normal.png"),
            bump_strength=0.50,
        ),
        "club": _make_trex_pbr_mat(
            "Mat_Secondary_Club",
            base_color=(0.40, 0.41, 0.33, 1.0),
            roughness=0.64,
            metallic=0.02,
            albedo_path=_tex("ankylo_club_albedo.png"),
            bump_path=_tex("ankylo_club_normal.png"),
            bump_strength=0.56,
        ),
        "horn": _make_trex_pbr_mat(
            "Mat_Accent",
            base_color=(0.68, 0.56, 0.38, 1.0),
            roughness=0.52,
            metallic=0.01,
            albedo_path=_tex("ankylo_horn_albedo.png"),
            bump_path=_tex("ankylo_horn_normal.png"),
            bump_strength=0.38,
        ),
        "beak": _make_trex_pbr_mat(
            "Mat_Beak",
            base_color=(0.18, 0.16, 0.14, 1.0),
            roughness=0.42,
            metallic=0.02,
            albedo_path=_tex("ankylo_beak_albedo.png"),
            bump_path=_tex("ankylo_beak_normal.png"),
            bump_strength=0.34,
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
            emissive=(0.42, 0.20, 0.03, 1.0),
            emissive_strength=0.20,
            albedo_path=_tex("ankylo_iris_albedo.png"),
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
            emissive_strength=0.88,
        ),
    }

    # Exact canonical bone hierarchy matching js/fighters/ankylosaurus.js & animations
    root = create_bone_node("Bone_Root", (0.0, 0.0, 0.0))
    hips = create_bone_node("Bone_Hips", (0.0, 0.0, 1.35), parent=root)
    torso = create_bone_node("Bone_Torso", (0.0, 0.0, 0.0), parent=hips)

    neck_world = (1.18, 0.0, 1.33)
    neck = create_bone_node("Bone_Neck", (neck_world[0], 0.0, neck_world[2] - 1.35), parent=torso)

    head_world = (1.66, 0.0, 1.31)
    head = create_bone_node(
        "Bone_Head",
        (head_world[0] - neck_world[0], 0.0, head_world[2] - neck_world[2]),
        parent=neck,
    )
    jaw = create_bone_node("Bone_Jaw", (0.14, 0.0, -0.14), parent=head)

    # 3-segment stiffened tail parented to Bone_Torso -> monumental Special_TailClub
    t0_w = (-1.26, 0.0, 1.37)
    t1_w = (-2.00, 0.0, 1.32)
    t2_w = (-2.78, 0.0, 1.28)

    tail0 = create_bone_node("Bone_Tail0", (t0_w[0], 0.0, t0_w[2] - 1.35), parent=torso)
    tail1 = create_bone_node("Bone_Tail1", (t1_w[0] - t0_w[0], 0.0, t1_w[2] - t0_w[2]), parent=tail0)
    tail2 = create_bone_node("Bone_Tail2", (t2_w[0] - t1_w[0], 0.0, t2_w[2] - t1_w[2]), parent=tail1)
    tail_club = create_bone_node("Special_TailClub", (-0.76, 0.0, -0.02), parent=tail2)

    spine_ctrl = [
        (-3.86, 0.0, 1.25, 0.004, 0.004),  # 0: Deep inside Special_TailClub boulder core (zero collar step!)
        (-3.56, 0.0, 1.26, 0.148, 0.134),  # 1: Full-thickness handle entering boulder club seamlessly
        (-2.78, 0.0, 1.28, 0.175, 0.160),  # 2: Bone_Tail2
        (-2.00, 0.0, 1.32, 0.275, 0.245),  # 3: Bone_Tail1
        (-1.26, 0.0, 1.37, 0.490, 0.390),  # 4: Bone_Tail0 / powerful caudal base
        (-0.78, 0.0, 1.44, 0.960, 0.560),  # 5: Broad pelvic carapace dome
        (-0.14, 0.0, 1.50, 1.220, 0.650),  # 6: Broadest & deepest central tank carapace
        ( 0.48, 0.0, 1.44, 1.120, 0.610),  # 7: Anterior thoracic dome
        ( 0.92, 0.0, 1.37, 0.840, 0.520),  # 8: Heavy pectoral shoulder collar & deep chest
        ( 1.18, 0.0, 1.33, 0.560, 0.440),  # 9: Bone_Neck thick muscular neck base
        ( 1.44, 0.0, 1.32, 0.460, 0.360),  # 10: Mid-neck cervical ring support
        ( 1.66, 0.0, 1.31, 0.390, 0.270),  # 11: Atlas / skull occiput socket
        ( 1.82, 0.0, 1.30, 0.004, 0.004),  # 12: Internal skull cap
    ]
    master_spine = CatmullRomSpline3D(spine_ctrl)

    t_j_tail2 = 2.0 / 12.0
    t_j_tail1 = 3.0 / 12.0
    t_j_tail0 = 4.0 / 12.0
    t_j_neck = 9.0 / 12.0
    overlap = 0.042

    _build_continuous_spine_segment(
        "Ankylo_TailSeg2", master_spine,
        0.0, t_j_tail2 + overlap, None, t_j_tail2,
        t2_w, tail2, mats["hide"], segs_u=30, segs_v=20, v_uv_scale=2.2,
    )
    _build_continuous_spine_segment(
        "Ankylo_TailSeg1", master_spine,
        t_j_tail2 - overlap, t_j_tail1 + overlap, t_j_tail2, t_j_tail1,
        t1_w, tail1, mats["hide"], segs_u=32, segs_v=18, v_uv_scale=2.2,
    )
    _build_continuous_spine_segment(
        "Ankylo_TailSeg0", master_spine,
        t_j_tail1 - overlap, t_j_tail0 + overlap, t_j_tail1, t_j_tail0,
        t0_w, tail0, mats["hide"], segs_u=34, segs_v=18, v_uv_scale=2.2,
    )
    _build_continuous_spine_segment(
        "Ankylo_Carapace", master_spine,
        t_j_tail0 - overlap, t_j_neck + overlap, t_j_tail0, t_j_neck,
        (0.0, 0.0, 1.35), torso, mats["hide"], segs_u=52, segs_v=38, v_uv_scale=1.85,
    )
    _build_continuous_spine_segment(
        "Ankylo_Neck", master_spine,
        t_j_neck - overlap, 1.0, t_j_neck, None,
        neck_world, neck, mats["hide"], segs_u=38, segs_v=24, v_uv_scale=2.2,
    )

    _add_carapace_and_cervical_armor(master_spine, torso, (0.0, 0.0, 1.35), neck, neck_world, mats)
    _build_sculpted_skull_and_jaw(head, jaw, mats)
    _build_tail_armor_and_club((tail0, tail1, tail2), tail_club, mats)

    # 4 Stout heavy quadruped limbs: Leg0/1 = Front Left/Right, Leg2/3 = Rear Left/Right
    leg_specs = (
        (0, ( 0.76,  0.66, -0.22),  1.0, True),
        (1, ( 0.76, -0.66, -0.22), -1.0, True),
        (2, (-0.74,  0.68, -0.14),  1.0, False),
        (3, (-0.74, -0.68, -0.14), -1.0, False),
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


def render_ankylo_verification_views(
    prefix="ankylo_v2",
    shot_dir="/home/niwatorichan/Projects/ExtinctionFighter/.tmp_screenshots",
):
    """
    Renders 6 full-framed studio verification views (hero_3q, side, rear_3q, head_closeup,
    head_front, top) plus an action_swing pose check to verify zero mesh tearing or gaps.
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
    print(
        f"[STATS] Polygons={total_polys}, "
        f"BBox min=({min_co.x:.3f}, {min_co.y:.3f}, {min_co.z:.3f}), "
        f"max=({max_co.x:.3f}, {max_co.y:.3f}, {max_co.z:.3f}), "
        f"size=({size.x:.2f} x {size.y:.2f} x {size.z:.2f})"
    )

    temp_objs = []
    world = bpy.context.scene.world
    if not world:
        world = bpy.data.worlds.new("AnkyloStudioWorld")
        bpy.context.scene.world = world
    if world.node_tree is None:
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

    add_sun("_StudioKey", center + Vector((5.5, -6.5, 6.8)), center, 3.6, (1.0, 0.95, 0.88))
    add_sun("_StudioFill", center + Vector((-4.5, 5.5, 3.8)), center, 1.5, (0.76, 0.88, 1.0))
    add_sun("_StudioRim", center + Vector((-5.5, -2.5, 5.2)), center, 2.2, (1.0, 0.86, 0.68))

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

    # 6 Full-margin rest-pose studio verification views
    views = [
        ("side",         Vector((-0.95, -10.4, 1.45)), Vector((-0.95, 0.0, 1.25)), 48.0),
        ("hero_3q",      Vector(( 5.4,   -7.6, 2.75)), Vector((-0.55, 0.0, 1.18)), 46.0),
        ("rear_3q",      Vector((-7.0,   -5.8, 2.65)), Vector((-1.45, 0.0, 1.20)), 46.0),
        ("head_closeup", Vector(( 3.20,  -1.85, 1.62)), Vector(( 1.72, 0.0, 1.26)), 54.0),
        ("head_front",   Vector(( 4.25,  -0.35, 1.55)), Vector(( 1.78, 0.0, 1.22)), 58.0),
        ("top",          Vector((-0.85,  -0.01, 10.6)), Vector((-0.85, 0.0, 1.20)), 46.0),
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

    # 7. Combat tail-club swing & head-turn pose check (non-destructive; restored afterwards)
    pose_targets = {
        "Bone_Tail0": (0.0, 0.0, 0.35),
        "Bone_Tail1": (0.0, 0.0, 0.38),
        "Bone_Tail2": (0.0, 0.0, 0.35),
        "Bone_Neck":  (0.0, -0.06, -0.18),
        "Bone_Head":  (0.0, 0.08, -0.22),
        "Bone_Jaw":   (0.0, 0.24, 0.0),
        "Bone_Leg0":  (0.0, 0.28, 0.0),
        "Bone_Leg1":  (0.0, -0.24, 0.0),
        "Bone_Leg2":  (0.0, -0.24, 0.0),
        "Bone_Leg3":  (0.0, 0.26, 0.0),
    }
    saved = {}
    for bname, rot in pose_targets.items():
        obj = bpy.data.objects.get(bname)
        if obj:
            saved[bname] = tuple(obj.rotation_euler)
            obj.rotation_euler = rot
    bpy.context.view_layer.update()

    cam_data.lens = 46.0
    cam_obj.location = Vector((-6.2, -7.2, 2.85))
    cam_obj.rotation_euler = (Vector((-1.10, 0.25, 1.18)) - cam_obj.location).to_track_quat("-Z", "Y").to_euler()
    out_pose = os.path.join(shot_dir, f"{prefix}_action_swing.png")
    scene.render.filepath = out_pose
    bpy.ops.render.render(write_still=True)
    paths.append(out_pose)

    for bname, rot in saved.items():
        obj = bpy.data.objects.get(bname)
        if obj:
            obj.rotation_euler = rot

    for o in temp_objs:
        bpy.data.objects.remove(o, do_unlink=True)
    return paths


if __name__ == "__main__":
    build_ankylo_high_definition()
    if os.environ.get("RENDER_ANKYLO_VIEWS", "0") == "1":
        render_ankylo_verification_views(prefix="ankylo_v2")
