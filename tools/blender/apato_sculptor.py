"""
tools/blender/apato_sculptor.py
Museum-grade paleontological & portrait-faithful Blender 5.2 builder for the
Apatosaurus ajax / louisae GLB model (assets/models/fighters/apato.glb).

Anatomical & visual synthesis:
  - Silhouette & proportions inspired by the Carnegie Museum Apatosaurus louisae
    holotype, Scott Hartman's robust diplodocid skeletal restoration, and Mark
    Witton / Prehistoric Planet sauropod life reconstructions:
      * Massive deep barrel ribcage & heavy hanging gut with high-arched sacral
        pelvis gently sloping forward to broad muscular shoulders.
      * Unmistakable hyper-robust Apatosaurus "combat neck" with subtriangular
        ventral cross-section (bulging cervical rib / longus colli musculature),
        heavy flexion skin folds, and proud ~32-degree forward-upward S-curve.
      * Huge M. caudofemoralis tail base held high off the ground, tapering
        gracefully across 5 articulated segments into a supersonic whip lash.
      * Heavy columnar limbs with thick elbow/knee/wrist flexion creases and
        semi-plantigrade fleshy-padded feet: horseshoe manus bearing the iconic
        single large medial pollex (thumb) claw, and broad pes bearing the
        authentic asymmetric 3 inner claws (Digits I-III).
  - Head, dermal armor & hide palette harmonized directly with assets/portraits/apato.png
    and Czerkas Howe Quarry diplodocid skin fossils:
      * Morrison Stone Grey / weathered basalt-charcoal cobblestone hide with
        subtle dark dorsal saddle mottling & warm limestone-ash ventral countershading.
      * Elongated, sloping, square-muzzled diplodocid skull with elevated anterior
        nostrils, prominent sculpted polygonal brow boss ridges, double-ring wrinkled
        eyelids around fiery molten amber-orange eyes, articulated jaw, grooved tongue,
        and anterior foliage-stripping diplodocid peg teeth.
      * Median row of sculpted triangular keratinous dorsal dermal spines from occiput
        to mid-tail flanked by paravertebral rows of oval armored neck bosses.

Canonical Extinction Kombat 3D rig contract (preserved 100%):
  Bone_Root -> Bone_Hips (Z=2.10)
    -> Bone_Torso
      -> Bone_Neck -> Special_NeckSeg0 -> Special_NeckSeg1 -> Special_NeckSeg2
                   -> Special_NeckSeg3 -> Special_NeckSeg4 -> Bone_Head -> Bone_Jaw
      -> Bone_Tail0 -> Bone_Tail1 -> Bone_Tail2 -> Bone_Tail3 -> Bone_Tail4
    -> Bone_Leg0 (Front Left +Y), Bone_Leg1 (Front Right -Y)
    -> Bone_Leg2 (Rear Left +Y),  Bone_Leg3 (Rear Right -Y)
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
    _build_conical_horn,
)


def _tex(name):
    p = os.path.join(TEX_DIR, name)
    return p if os.path.exists(p) else None


# ---------------------------------------------------------------------------
# 1. CONTINUOUS MASTER SPINE SURFACE EVALUATOR (TAIL -> TORSO -> COMBAT NECK)
# ---------------------------------------------------------------------------

def _eval_spine_surface(master_spline, t, theta, cap_scale=1.0):
    """
    Evaluates the sculpted Apatosaurus body cross-section at spline parameter t in [0, 1]
    (0 = supersonic whip-tail tip, 1 = internal skull occiput cap) and circumferential
    angle theta (0 = dorsal spine crest, +/-pi/2 = lateral flank, pi = ventral belly/throat).
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

    t_tail_end = 6.0 / 16.0    # 0.375 (Bone_Tail0)
    t_neck_start = 10.0 / 16.0  # 0.625 (Bone_Neck)

    is_tail = t <= t_tail_end
    is_torso = t_tail_end < t < t_neck_start
    is_neck = t >= t_neck_start

    # Base anatomical cross-section profile per region
    if is_torso:
        torso_u = (t - t_tail_end) / (t_neck_start - t_tail_end)
        torso_env = math.sin(torso_u * math.pi)
        # Massive deep sauropod barrel gut + subtly rounded dorsal spine arch
        belly_flare = 1.0 + 0.10 * max(0.0, -cos_t) * torso_env
        dorsal_pinch = 1.0 - 0.14 * (max(0.0, cos_t) ** 1.8)
        y_lat = sign_s * (abs_sin ** 0.88) * ry * belly_flare * dorsal_pinch
    elif is_neck:
        # SIGNATURE APATOSAURUS TRAIT: Subtriangular hyper-robust "combat neck"!
        # Narrower muscular nuchal crest on top, flaring broad and thick along the lower
        # lateral & ventral sides housing massive elongated cervical ribs & longus colli.
        neck_u = min(1.0, (t - t_neck_start) / (1.0 - t_neck_start))
        neck_env = math.sin(min(1.0, neck_u * 1.08) * math.pi)
        dorsal_taper = 1.0 - 0.22 * (max(0.0, cos_t) ** 1.5) * (0.55 + 0.45 * neck_env)
        ventral_broad = 1.0 + 0.20 * math.exp(-(((cos_t + 0.38) / 0.42) ** 2)) * (0.45 + 0.55 * neck_env)
        y_lat = sign_s * (abs_sin ** 0.86) * ry * dorsal_taper * ventral_broad
    else:
        # Laterally compressed proximal tail tapering smoothly to a round supersonic whip tip
        y_lat = sign_s * (abs_sin ** 0.92) * ry

    if cos_t >= 0.0:
        z_vert = (cos_t ** 0.92) * rz
    else:
        v_exp = 0.84 if is_torso else (0.86 if is_neck else 0.94)
        z_vert = -((-cos_t) ** v_exp) * rz

    # 1. Sculpted dorsal neural spine & nuchal ligament ridge (anchors the dermal spine row!)
    if 0.16 < t < 0.955 and cos_t > 0.54 and abs_sin < 0.36:
        ridge_env = math.sin(((t - 0.16) / 0.795) * math.pi)
        arch = (1.0 - abs_sin / 0.36) ** 1.45
        z_vert += arch * 0.068 * rz * ridge_env * cap_scale

    # 2. Torso musculature: subtle rib undulations, broad pelvic iliac shelf, scapular shoulders & brisket
    if is_torso:
        torso_u = (t - t_tail_end) / (t_neck_start - t_tail_end)
        torso_env = math.sin(torso_u * math.pi)
        # Subtle ribcage contours on mid-upper flank
        if -0.25 < cos_t < 0.48 and abs_sin > 0.55:
            rib_wave = 0.5 + 0.5 * math.cos(t * math.pi * 48.0)
            y_lat += sign_s * 0.015 * ry * rib_wave * torso_env
        # Powerful pelvic iliac crest & gluteal shelf over hindlimbs (t ~ 0.435)
        hip_env = math.exp(-(((t - 0.435) / 0.055) ** 2))
        if -0.15 < cos_t < 0.72 and abs_sin > 0.36:
            y_lat += sign_s * 0.105 * ry * hip_env * math.sin(((cos_t + 0.15) / 0.87) * math.pi)
        # Muscular scapular shoulder swell over forelimbs (t ~ 0.562)
        sh_env = math.exp(-(((t - 0.562) / 0.052) ** 2))
        if -0.25 < cos_t < 0.65 and abs_sin > 0.38:
            y_lat += sign_s * 0.090 * ry * sh_env * math.sin(((cos_t + 0.25) / 0.90) * math.pi)
        # Heavy deep anterior brisket / pectoral chest keel
        chest_env = math.exp(-(((t - 0.585) / 0.055) ** 2))
        if cos_t < -0.25:
            z_vert -= 0.085 * rz * chest_env * ((-cos_t - 0.25) / 0.75)

    # 3. Apatosaurus ventral cervical-rib muscle columns & fine natural neck flexion folds
    #    (smooth, sweeping, powerful combat-neck contour — zero lumpy sausage lobes!)
    if 0.59 < t < 0.965:
        neck_u = (t - 0.59) / 0.375
        neck_env = math.sin(neck_u * math.pi)
        # Smooth continuous paired ventral cervical-rib / longus colli muscular ridges
        if -0.80 < cos_t < -0.16 and 0.30 < abs_sin < 0.88:
            cord = (
                math.sin(((abs_sin - 0.30) / 0.58) * math.pi)
                * math.sin(((-cos_t - 0.16) / 0.64) * math.pi)
            )
            y_lat += sign_s * 0.082 * ry * cord * neck_env
            z_vert -= 0.052 * rz * cord * neck_env
        # Crisp, subtle fine throat & neck-chest flexion folds (never lumpy!)
        if cos_t < -0.40:
            chest_crease = 0.022 * math.exp(-(((t - 0.635) / 0.032) ** 2))
            fine_pleat = 0.011 * math.sin(t * math.pi * 68.0) * neck_env
            z_vert *= (1.0 + fine_pleat - chest_crease * math.sin(t * math.pi * 24.0))
        # Subtle lateral muscular neck striations
        if -0.45 < cos_t < 0.35 and abs_sin > 0.65:
            pleat = 0.012 * math.sin(t * math.pi * 58.0) * neck_env
            y_lat += sign_s * ry * pleat

    # 4. Massive M. caudofemoralis locomotor muscle swell at proximal tail base
    if 0.20 < t < 0.43 and -0.58 < cos_t < 0.32 and abs_sin > 0.46:
        cf_env = math.sin(((t - 0.20) / 0.23) * math.pi)
        y_lat += sign_s * 0.105 * ry * cf_env

    return c_world + lat_axis * y_lat + up_axis * z_vert


def _eval_spine_point_and_normal(master_spline, t, theta):
    """Returns (world_pos, outward_unit_normal) on the continuous Apatosaurus body surface."""
    p = _eval_spine_surface(master_spline, t, theta)
    p_t1 = _eval_spine_surface(master_spline, min(0.995, t + 0.006), theta)
    p_t0 = _eval_spine_surface(master_spline, max(0.005, t - 0.006), theta)
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
    segs_v=24,
    v_uv_scale=3.6,
):
    """Lofts a C1-continuous slice [t_start, t_end] of the Apatosaurus master spine with internal ball-joints."""
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


# ---------------------------------------------------------------------------
# 2. SCULPTED DORSAL DERMAL SPINES, NECK OSTEODERMS & BROW BOSSES
# ---------------------------------------------------------------------------

def _build_apato_dermal_spine(
    name,
    length,
    height,
    thickness,
    mat_spine,
    mat_hide,
    parent,
    local_pos,
    rot=(0.0, 0.0, 0.0),
    sweep_back=0.22,
):
    """
    Sculpts a Czerkas Howe Quarry / portrait-faithful swept triangular keratinous
    diplodocid dermal spine with fluted beveled walls, thick basal root embedded
    cleanly into the dorsal ridge, and a tight flush scaly dermal collar welt.
    """
    segs_v = 12
    segs_u = 16
    rings_v = []
    rings_uv = []

    for iv in range(segs_v + 1):
        v = iv / segs_v
        lz = -height * 0.22 + v * (height * 1.22)
        # Swept back-leaning triangular chevron silhouette (broad base -> sharp swept crest)
        taper_x = (1.0 - v ** 1.15) if iv < segs_v else 0.02
        taper_y = (1.0 - v ** 0.92) if iv < segs_v else 0.02
        x_front = length * 0.46 * taper_x - sweep_back * length * (v ** 1.3)
        x_back = -length * 0.54 * taper_x - sweep_back * length * (v ** 1.3)
        x_mid = 0.5 * (x_front + x_back)
        rx = max(0.003, 0.5 * (x_front - x_back))
        ry = max(0.002, thickness * 0.5 * taper_y)

        row_v = []
        row_uv = []
        for iu in range(segs_u):
            u = iu / segs_u
            a = u * math.pi * 2.0
            ca = math.cos(a)
            sa = math.sin(a)
            # Crisp keeled leading & trailing edges (diamond-teardrop cross-section)
            flute = 1.0 + 0.07 * math.cos(a * 6.0) * math.sin(v * math.pi)
            lx = x_mid + ca * rx
            ly = math.copysign(1.0, sa) * (abs(sa) ** 0.78) * ry * flute
            row_v.append(Vector((lx, ly, lz)))
            row_uv.append((u, max(0.01, min(0.99, v))))

        rings_v.append(row_v)
        rings_uv.append(row_uv)

    bm = _build_grid_bmesh(rings_v, rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    sp_obj = attach_mesh_obj(bm, name, mat=mat_spine, parent=parent, local_pos=local_pos, subdiv=0)
    sp_obj.rotation_euler = rot

    # Subtle flush scaly skin root cuff hugging the spine base
    c_u, c_v = 14, 4
    crv, cruv = [], []
    rx_b = length * 0.48
    ry_b = max(thickness * 0.72, length * 0.14)
    ch = min(height * 0.22, 0.028)
    for iv in range(c_v + 1):
        fv = iv / c_v
        zc = -ch * 1.1 + fv * ch * 1.65
        taper = math.cos(fv * math.pi * 0.46)
        rv, ruv = [], []
        for iu in range(c_u):
            a = (iu / c_u) * math.pi * 2.0
            rv.append(Vector((math.cos(a) * rx_b * (0.76 + 0.24 * taper), math.sin(a) * ry_b * (0.72 + 0.28 * taper), zc)))
            ruv.append((0.06 + 0.06 * abs(math.sin(a)), 0.20 + 0.12 * math.cos(a) + fv * 0.04))
        crv.append(rv)
        cruv.append(ruv)
    bm_c = _build_grid_bmesh(crv, cruv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_c, f"{name}_Cuff", mat=mat_hide, parent=sp_obj, local_pos=(0.0, 0.0, 0.0), subdiv=0)
    return sp_obj


def _build_armored_boss(name, rx, ry, height, mat, parent, local_pos, rot=(0.0, 0.0, 0.0), uv_u=0.14):
    """Sculpts a chunky faceted/rounded polygonal dermal osteoderm boss (brow & neck armor)."""
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")
    segs = 12
    tiers = [
        (1.04, -height * 0.35),
        (0.98,  height * 0.14),
        (0.82,  height * 0.58),
        (0.52,  height * 0.88),
    ]
    rings = []
    for rad_s, zh in tiers:
        row = []
        for i in range(segs):
            a = (i / segs) * math.pi * 2.0
            poly = 1.0 + 0.055 * math.cos(a * 5.0)
            row.append(bm.verts.new((math.cos(a) * rx * rad_s * poly, math.sin(a) * ry * rad_s * poly, zh)))
        rings.append(row)
    apex = bm.verts.new((0.0, 0.0, height))
    base = bm.verts.new((0.0, 0.0, -height * 0.45))

    for ti in range(len(rings) - 1):
        r0, r1 = rings[ti], rings[ti + 1]
        for i in range(segs):
            j = (i + 1) % segs
            f = bm.faces.new((r0[i], r0[j], r1[j], r1[i]))
            for lp in f.loops:
                lp[uv_layer].uv = (uv_u + lp.vert.co.x * 1.1, 0.48 + lp.vert.co.y * 1.1)
    for i in range(segs):
        j = (i + 1) % segs
        ft = bm.faces.new((rings[-1][i], rings[-1][j], apex))
        for lp in ft.loops:
            lp[uv_layer].uv = (uv_u + 0.04, 0.50)
        fb = bm.faces.new((rings[0][j], rings[0][i], base))
        for lp in fb.loops:
            lp[uv_layer].uv = (uv_u - 0.04, 0.50)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    obj = attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=local_pos, subdiv=0)
    obj.rotation_euler = rot
    return obj


def _add_dorsal_spines_and_neck_bosses(master_spine, bone_map, mats):
    """
    Mounts a continuous single median row of swept triangular keratinous dermal spines
    from behind the occiput down the colossal neck, across the mighty back & sacral arch,
    and tapering down the tail — plus paravertebral rows of oval dermal osteoderm bosses
    along both sides of the neck (assets/portraits/apato.png + Howe Quarry fossils!).
    Every element is parented to the exact underlying moving bone!
    """
    def _owner_for_t(t_val):
        for t_lo, t_hi, b_obj, b_world in bone_map:
            if t_lo <= t_val <= t_hi:
                return b_obj, Vector(b_world)
        return bone_map[0][2], Vector(bone_map[0][3])

    # 44 Cohesive, closely-spaced swept triangular keratinous dermal spines spanning
    # from right behind the occiput (t=0.935) down to the mid-distal whip tail (t=0.175)
    n_spines = 44
    t_max, t_min = 0.935, 0.175
    for idx in range(n_spines):
        frac = idx / (n_spines - 1)
        t_sp = t_max - frac * (t_max - t_min)

        # Cohesive rhythmic silhouette matching assets/portraits/apato.png & Howe Quarry fossils:
        # Tight chevron ridge behind occiput -> broad sweeping low-triangular crest over shoulders,
        # back & sacral arch -> sleek continuous tapering dorsal ridge along the balancing tail.
        if t_sp > 0.625:
            # Neck (0.935 -> 0.625)
            u_n = (0.935 - t_sp) / (0.935 - 0.625)
            sp_h = 0.048 + 0.088 * (u_n ** 0.88)
            sp_l = 0.115 + 0.130 * (u_n ** 0.80)
            sp_th = 0.038 + 0.032 * u_n
        elif t_sp > 0.375:
            # Torso / shoulders / sacral crest (0.625 -> 0.375): continuous serrated dorsal crest!
            u_t = (t_sp - 0.375) / (0.625 - 0.375)
            arch = math.sin(u_t * math.pi)
            sp_h = 0.132 + 0.048 * arch
            sp_l = 0.245 + 0.060 * arch
            sp_th = 0.070 + 0.018 * arch
        else:
            # Tail (0.375 -> 0.175): sleek tapering dermal ridge
            u_c = max(0.0, (t_sp - 0.175) / (0.375 - 0.175))
            sp_h = 0.024 + 0.104 * (u_c ** 1.15)
            sp_l = 0.085 + 0.145 * (u_c ** 1.05)
            sp_th = 0.022 + 0.044 * u_c

        wp, wn = _eval_spine_point_and_normal(master_spine, t_sp, 0.0)
        owner_bone, owner_world = _owner_for_t(t_sp)

        tan = master_spine.tangent_at(t_sp)
        pitch = -math.atan2(tan.z, max(1e-4, abs(tan.x))) * 0.80
        local_p = wp - owner_world - wn * 0.024

        _build_apato_dermal_spine(
            f"Apato_DorsalSpine_{idx:02d}",
            length=sp_l,
            height=sp_h,
            thickness=sp_th,
            mat_spine=mats["spine"],
            mat_hide=mats["hide"],
            parent=owner_bone,
            local_pos=local_p,
            rot=(0.0, pitch, 0.0),
            sweep_back=0.36,
        )

    # Portrait signature: paired paravertebral rows of rugged oval osteoderm bosses running
    # down both flanks of the muscular neck and onto the upper shoulders!
    for side in (-1, 1):
        s_tag = "L" if side > 0 else "R"
        # Upper paravertebral row (closely flanking dorsal ridge, matching apato.png!)
        for ni in range(11):
            nt = 0.922 - ni * 0.030  # 0.922 down to 0.622
            wp, wn = _eval_spine_point_and_normal(master_spine, nt, side * 0.44)
            owner_bone, owner_world = _owner_for_t(nt)
            q = Vector((0.0, 0.0, 1.0)).rotation_difference(wn)
            sz = 0.030 + 0.0028 * ni
            _build_armored_boss(
                f"Apato_NeckBossUpper_{s_tag}_{ni:02d}",
                rx=sz * 1.38,
                ry=sz * 0.85,
                height=sz * 0.56,
                mat=mats["hide"],
                parent=owner_bone,
                local_pos=wp - owner_world - wn * 0.006,
                rot=q.to_euler("XYZ"),
                uv_u=0.10,
            )
        # Mid-lateral neck & shoulder osteoderm accent domes
        for mi, (mt, mth, msz) in enumerate((
            (0.885, 0.88, 0.028),
            (0.835, 0.92, 0.032),
            (0.785, 0.94, 0.036),
            (0.735, 0.96, 0.040),
            (0.680, 0.96, 0.044),
            (0.620, 0.94, 0.048),
            (0.560, 0.90, 0.050),
            (0.495, 0.88, 0.048),
            (0.435, 0.92, 0.046),
        )):
            wp, wn = _eval_spine_point_and_normal(master_spine, mt, side * mth)
            owner_bone, owner_world = _owner_for_t(mt)
            q = Vector((0.0, 0.0, 1.0)).rotation_difference(wn)
            _build_armored_boss(
                f"Apato_FlankBoss_{s_tag}_{mi:02d}",
                rx=msz * 1.25,
                ry=msz * 0.92,
                height=msz * 0.46,
                mat=mats["hide"],
                parent=owner_bone,
                local_pos=wp - owner_world - wn * 0.008,
                rot=q.to_euler("XYZ"),
                uv_u=0.18,
            )


# ---------------------------------------------------------------------------
# 3. SCULPTED APATOSAURUS SKULL, ARMORED BROW, FIERY EYES, JAW & PEG TEETH
# ---------------------------------------------------------------------------

def _build_curved_eyelid_arc(name, radius_x, radius_z, y_out, thickness, is_upper, side, mat, parent, uv_u=0.22):
    """Builds a smooth continuous almond-shaped wrinkled scaly eyelid arc wrapping both eye corners."""
    n_v = 16
    n_u = 10
    rings_v, rings_uv = [], []
    z_sign = 1.0 if is_upper else -1.0

    for iv in range(n_v + 1):
        t = iv / n_v
        ang_arc = (t - 0.5) * math.pi * 1.06
        cx = math.sin(ang_arc) * radius_x
        cz = z_sign * (0.004 + math.cos(ang_arc) * radius_z)
        cy = side * (y_out * (0.52 + 0.48 * math.cos(ang_arc)))
        env = max(0.24, math.sin(t * math.pi) ** 0.55)
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


def _build_diplodocid_peg_tooth(name, radius, length, is_upper, mat, parent, local_pos, local_rot=(0.0, 0.0, 0.0)):
    """
    Sculpts an authentic Apatosaurus / diplodocid slender pencil/peg-like foliage-stripping tooth
    (slightly procumbent cylindrical shaft tapering subtly to a blunt chisel/peg crown).
    """
    sign_z = -1.0 if is_upper else 1.0
    n_v = 8
    n_u = 10
    rings_v, rings_uv = [], []
    for iv in range(n_v + 1):
        v = iv / n_v
        # Gentle forward-outward curve of diplodocid raking peg teeth
        lx = length * 0.14 * (v ** 1.4)
        lz = sign_z * length * v
        r_scale = 0.28 if iv == n_v else (1.0 - 0.32 * (v ** 1.5))
        rv, ruv = [], []
        for iu in range(n_u):
            u = iu / n_u
            a = u * math.pi * 2.0
            rv.append(Vector((lx + math.cos(a) * radius * 0.88 * r_scale, math.sin(a) * radius * r_scale, lz)))
            ruv.append((u, v))
        rings_v.append(rv)
        rings_uv.append(ruv)
    bm = _build_grid_bmesh(rings_v, rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    obj = attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=local_pos, subdiv=0)
    obj.rotation_euler = local_rot
    return obj


def _build_sculpted_skull_and_jaw(head_bone, jaw_bone, mats):
    """
    Sculpts a rugged, museum-grade Apatosaurus ajax skull uniting:
      - Authentic diplodocid skull architecture: elongated sloping nasal bridge,
        broad squared-off front cropping muzzle, elevated dorsal-rostral nostrils,
        and strictly anterior peg-like raking teeth.
      - Portrait-faithful fierce sculptural detail (assets/portraits/apato.png):
        chunky armored supraorbital brow ridges crowned with polygonal boss scales,
        deep recessed orbital sockets, fiery molten amber-orange reptile eyes with
        double concentric wrinkled scaly eyelids, strong muscular cheek jowls,
        articulated pebbled lower mandible (Bone_Jaw), and grooved tongue.
    """
    # Natural dignified sauropod head poise tilted subtly forward-downward
    pitch_q = Euler((0.0, 0.22, 0.0), "XYZ").to_matrix().to_4x4()

    # (x, top_z, bot_z, half_width)
    # Regal, bold Apatosaurus diplodocid skull (~0.92m long): proud domed parietal/occipital
    # vault & muscular cheek jowls descending smoothly into a broad squared-off cropping muzzle!
    slices = [
        (-0.22,  0.155, -0.120, 0.004),  # Closed occipital cap embedded deep inside upper neck
        (-0.04,  0.258, -0.178, 0.225),  # Broad occipital & temporal adductor jaw vault (flush with neck!)
        ( 0.14,  0.278, -0.184, 0.238),  # Proud parietal/postorbital crown & heavy cheek muscle
        ( 0.29,  0.264, -0.162, 0.215),  # Prominent armored supraorbital brow & orbital zone
        ( 0.46,  0.205, -0.142, 0.182),  # Sloping elongated diplodocid mid-snout & maxilla
        ( 0.62,  0.156, -0.132, 0.168),  # Elevated anterior narial fossa & broad premaxilla
        ( 0.75,  0.112, -0.128, 0.160),  # Broad squared-off diplodocid cropping snout wall!
        ( 0.84,  0.052, -0.118, 0.130),  # Blunt rounded-square front muzzle lip
        ( 0.88, -0.025, -0.075, 0.004),  # Closed solid front muzzle cap
    ]
    top_sp = CatmullRomSpline3D([(s[0], s[3], s[1]) for s in slices])
    bot_sp = CatmullRomSpline3D([(s[0], s[3], s[2]) for s in slices])

    radial_steps = 54
    length_steps = 62
    skull_v, skull_uv = [], []

    for iy in range(length_steps + 1):
        v = iy / length_steps
        p_t, _ = top_sp.eval_at(v)
        p_b, _ = bot_sp.eval_at(v)
        fx = p_t.x
        half_w = max(0.001, p_t.y)
        top_z = p_t.z
        bot_z = p_b.z

        # Subtle upward-curving muscular mouth corner matching assets/portraits/apato.png!
        lip_curve = -0.018 * math.sin(((v - 0.34) / 0.58) * math.pi) if (0.34 < v < 0.92) else 0.0
        bot_z += lip_curve

        brow_prof = math.exp(-(((v - 0.42) / 0.115) ** 2))
        orbit_prof = math.exp(-(((v - 0.43) / 0.082) ** 2))
        cheek_prof = math.exp(-(((v - 0.54) / 0.14) ** 2))
        sq_fac = max(0.0, min(1.0, (v - 0.60) / 0.30))  # Squarer cross-section near front muzzle!
        nasal_ridge = math.sin(((v - 0.24) / 0.64) * math.pi) if (0.24 < v < 0.88) else 0.0

        row_v_raw = []
        for ix in range(radial_steps):
            u = ix / radial_steps
            ang = u * math.pi * 2.0
            s = math.sin(ang)
            c = math.cos(ang)
            abs_s = abs(s)
            sign_s = 1.0 if s >= 0.0 else -1.0

            lat_exp = 0.78 - 0.14 * sq_fac
            ly = sign_s * (abs_s ** lat_exp) * half_w
            mid_z = 0.5 * (top_z + bot_z)
            half_h = max(0.005, 0.5 * (top_z - bot_z))

            if c >= 0.0:
                top_exp = 0.72 - 0.12 * sq_fac
                lz = mid_z + half_h * (c ** top_exp)
                if nasal_ridge > 0.0 and c > 0.54:
                    cobble = 0.5 + 0.5 * math.cos(v * math.pi * 24.0) * math.cos(abs_s * math.pi * 6.0)
                    lz += nasal_ridge * cobble * 0.012 * ((c - 0.54) / 0.46)
                # Bold overhanging armored supraorbital brow ridge (apato.png!)
                if brow_prof > 0.01 and 0.14 < c < 0.86:
                    arch = math.sin(((c - 0.14) / 0.72) * math.pi)
                    lz += brow_prof * arch * 0.048
                    ly += sign_s * brow_prof * arch * 0.040
            else:
                lz = mid_z - half_h * ((-c) ** 0.78)
                if 0.34 < v < 0.94 and -0.45 < c < 0.0 and abs_s > 0.62:
                    lip_welt = math.sin(((-c) / 0.45) * math.pi) * math.sin(((v - 0.34) / 0.60) * math.pi)
                    ly += sign_s * 0.014 * lip_welt

            # Deep recessed bony orbital socket beneath the heavy brow
            if orbit_prof > 0.01 and -0.22 < c < 0.34:
                orb_d = math.sin(((c + 0.22) / 0.56) * math.pi)
                ly *= (1.0 - 0.35 * orbit_prof * orb_d)

            # Suborbital jugal cheekbone shelf & robust maxillary bulge (apato.png!)
            if orbit_prof > 0.01 and -0.58 < c <= -0.18:
                ly += sign_s * orbit_prof * 0.024 * math.sin(((-c - 0.18) / 0.40) * math.pi)
            if cheek_prof > 0.01 and -0.60 < c < 0.14:
                ch_arch = math.sin(((c + 0.60) / 0.74) * math.pi)
                ly += sign_s * cheek_prof * ch_arch * 0.020

            # Sculpted high-set external narial fossae & crisp raised rim hood (apato.png!)
            naris_u = (v - 0.74) / 0.048
            naris_v = (c - 0.46) / 0.22
            naris_d2 = naris_u * naris_u + naris_v * naris_v
            if naris_d2 < 1.0:
                n_dep = (1.0 - naris_d2) ** 1.25
                ly *= (1.0 - 0.38 * n_dep)
                lz -= 0.020 * n_dep
            elif 1.0 <= naris_d2 < 2.25:
                hood = math.sin(((naris_d2 - 1.0) / 1.25) * math.pi)
                ly += sign_s * 0.017 * hood
                lz += 0.014 * hood * (1.0 if naris_v > 0 else -0.15)

            row_v_raw.append(Vector((fx, ly, lz)))

        # Compute arc-length-normalized U around this ring so cranial scales are 100% isotropic
        # across the brow, cheeks, lips, and muzzle (zero cheek-scale stretching!)
        cum_arc = [0.0]
        for ix in range(radial_steps):
            p0 = row_v_raw[ix]
            p1 = row_v_raw[(ix + 1) % radial_steps]
            cum_arc.append(cum_arc[-1] + (p1 - p0).length)
        total_arc = max(1e-5, cum_arc[-1])

        row_v = [pitch_q @ pt for pt in row_v_raw]
        row_uv = [(cum_arc[ix] / total_arc, v * 1.15) for ix in range(radial_steps)]
        skull_v.append(row_v)
        skull_uv.append(row_uv)

    bm_skull = _build_grid_bmesh(skull_v, skull_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_skull, "Apato_UpperCranium", mat=mats["cranium"], parent=head_bone)

    # 2. Chunky Armored Polygonal Brow Bosses & Recessed High-Set Nostrils (matching apato.png!)
    for side in (-1, 1):
        s_tag = "L" if side > 0 else "R"

        # 4 sculpted chunky polygonal brow-ridge osteoderm bosses arching smoothly over each orbit
        brow_boss_specs = [
            (0.16, 0.186, 0.222, 0.048, 0.040, 0.026, (side * 0.45, -0.10, 0.0)),
            (0.24, 0.200, 0.232, 0.052, 0.044, 0.030, (side * 0.52,  0.02, 0.0)),
            (0.33, 0.194, 0.218, 0.050, 0.042, 0.028, (side * 0.56,  0.14, 0.0)),
            (0.41, 0.175, 0.192, 0.042, 0.036, 0.022, (side * 0.52,  0.24, 0.0)),
        ]
        for bi, (bx, by, bz, brx, bry, bh, brot) in enumerate(brow_boss_specs):
            _build_armored_boss(
                f"Apato_BrowBoss_{s_tag}_{bi}",
                rx=brx, ry=bry, height=bh,
                mat=mats["cranium"], parent=head_bone,
                local_pos=pitch_q @ Vector((bx, side * by, bz)),
                rot=(brot[0], brot[1] + 0.22, brot[2]),
                uv_u=0.10,
            )

        # Recessed dark oval nostrils cleanly seated inside the elevated anterior narial fossae
        bm_n = bmesh.new()
        bmesh.ops.create_uvsphere(bm_n, u_segments=14, v_segments=10, radius=0.026)
        n_obj = attach_mesh_obj(
            bm_n, f"Apato_Nostril_{s_tag}", mat=mats["pupil"], parent=head_bone,
            local_pos=pitch_q @ Vector((0.680, side * 0.100, 0.082)),
        )
        n_obj.scale = (1.58, 0.52, 0.80)
        n_obj.rotation_euler = (side * 0.35, 0.46, -side * 0.22)

        # 3. Fierce Molten Amber-Orange Reptile Eyes + Double Wrinkled Scaly Eyelids (apato.png!)
        eye_center = pitch_q @ Vector((0.270, side * 0.164, 0.078))
        eye_grp = create_bone_node(f"Apato_EyeSocket_{s_tag}", eye_center, parent=head_bone)
        eye_grp.rotation_euler = (-0.04, 0.16, -side * 0.24)

        # Deep dark orbital backing shadow
        bm_sh = bmesh.new()
        bmesh.ops.create_uvsphere(bm_sh, u_segments=14, v_segments=12, radius=0.048)
        sh_obj = attach_mesh_obj(
            bm_sh, f"Apato_OrbitShadow_{s_tag}", mat=mats["pupil"], parent=eye_grp,
            local_pos=(0.0, -side * 0.016, 0.0),
        )
        sh_obj.scale = (0.94, 0.62, 0.90)

        # Glowing fiery amber-orange iris eyeball
        bm_ir = bmesh.new()
        uv_ir = bm_ir.loops.layers.uv.new("UVMap")
        bmesh.ops.create_uvsphere(bm_ir, u_segments=22, v_segments=16, radius=0.044)
        for f in bm_ir.faces:
            for lp in f.loops:
                co = lp.vert.co / 0.044
                lp[uv_ir].uv = (0.5 + co.x * 0.46, 0.5 + co.z * 0.46)
        bmesh.ops.recalc_face_normals(bm_ir, faces=bm_ir.faces)
        ir_obj = attach_mesh_obj(
            bm_ir, f"Apato_Eye_{s_tag}", mat=mats["iris"], parent=eye_grp,
            local_pos=(0.0, side * 0.008, 0.0),
        )
        ir_obj.scale = (1.02, 0.88, 1.0)

        # Intense round-oval dark pupil (matching apato.png!)
        bm_pu = bmesh.new()
        bmesh.ops.create_uvsphere(bm_pu, u_segments=16, v_segments=12, radius=0.022)
        pu_obj = attach_mesh_obj(
            bm_pu, f"Apato_Eye_{s_tag}_Pupil", mat=mats["pupil"], parent=eye_grp,
            local_pos=(0.002, side * 0.039, 0.0),
        )
        pu_obj.scale = (0.76, 0.45, 0.86)

        # Crisp white eye catchlight
        bm_cl = bmesh.new()
        bmesh.ops.create_uvsphere(bm_cl, u_segments=8, v_segments=8, radius=0.0052)
        attach_mesh_obj(
            bm_cl, f"Apato_EyeCatchlight_{s_tag}", mat=mats["catchlight"], parent=eye_grp,
            local_pos=(0.011, side * 0.046, 0.011),
        )

        # Inner continuous almond eyelids meeting tightly at both canthi
        _build_curved_eyelid_arc(
            f"Apato_UpperEyelid_{s_tag}",
            radius_x=0.054, radius_z=0.029, y_out=0.030, thickness=0.0135,
            is_upper=True, side=side, mat=mats["cranium"], parent=eye_grp, uv_u=0.16,
        )
        _build_curved_eyelid_arc(
            f"Apato_LowerEyelid_{s_tag}",
            radius_x=0.052, radius_z=0.027, y_out=0.029, thickness=0.0125,
            is_upper=False, side=side, mat=mats["cranium"], parent=eye_grp, uv_u=0.22,
        )
        # Outer concentric wrinkled orbital skin folds framing the eye (portrait detail!)
        _build_curved_eyelid_arc(
            f"Apato_OuterOrbitFoldTop_{s_tag}",
            radius_x=0.068, radius_z=0.042, y_out=0.021, thickness=0.012,
            is_upper=True, side=side, mat=mats["cranium"], parent=eye_grp, uv_u=0.14,
        )
        _build_curved_eyelid_arc(
            f"Apato_OuterOrbitFoldBot_{s_tag}",
            radius_x=0.066, radius_z=0.038, y_out=0.021, thickness=0.0115,
            is_upper=False, side=side, mat=mats["cranium"], parent=eye_grp, uv_u=0.26,
        )

    # 4. Upper Anterior Diplodocid Peg-Like Raking Teeth (tucked neatly behind closed upper lip!)
    for ti in range(10):
        frac = (ti / 9.0) * 2.0 - 1.0
        ang_m = frac * 1.10
        tx = 0.69 + math.cos(ang_m) * 0.105
        ty = math.sin(ang_m) * 0.094
        tz = -0.095
        _build_diplodocid_peg_tooth(
            f"Apato_UpperTooth_{ti:02d}",
            radius=0.0080,
            length=0.036,
            is_upper=True,
            mat=mats["tooth"],
            parent=head_bone,
            local_pos=pitch_q @ Vector((tx, ty, tz)),
            local_rot=(0.0, 0.22 - 0.10, ang_m * 0.32),
        )

    # 5. Articulated Robust Lower Mandible, Pebbled Chin, Tongue & Lower Peg Teeth (Bone_Jaw)
    jaw_q = Euler((0.0, 0.22, 0.0), "XYZ").to_matrix().to_4x4()
    # Broad muscular pebbled chin & cheek jowl seamlessly tucked beneath upper cranium!
    m_slices = [
        (-0.18,  0.035, -0.080, 0.003),  # Closed posterior ramus inside throat
        (-0.04,  0.095, -0.140, 0.205),  # Broad muscular cheek jowl blending smoothly into occiput
        ( 0.16,  0.072, -0.138, 0.186),  # Robust mid-mandible ramus
        ( 0.36,  0.040, -0.122, 0.156),  # Elongated diplodocid dentary
        ( 0.54,  0.026, -0.106, 0.138),  # Broad squared-off anterior lower chin
        ( 0.64,  0.020, -0.092, 0.116),  # Rounded blunt lower lip margin
        ( 0.69,  0.004, -0.046, 0.003),  # Closed solid front chin cap
    ]
    m_bot = CatmullRomSpline3D([(s[0], s[3], s[2]) for s in m_slices])
    m_top = CatmullRomSpline3D([(s[0], s[3], s[1]) for s in m_slices])

    mr_u, mr_v = 36, 38
    m_rv, m_ruv = [], []
    for iy in range(mr_v + 1):
        v = iy / mr_v
        pb, _ = m_bot.eval_at(v)
        pt, _ = m_top.eval_at(v)
        hw = max(0.001, pb.y)
        sq_m = max(0.0, min(1.0, (v - 0.60) / 0.30))
        row_raw = []
        for ix in range(mr_u):
            u = ix / mr_u
            a = u * math.pi * 2.0
            sa, ca = math.sin(a), math.cos(a)
            ly = math.copysign(1.0, sa) * (abs(sa) ** (0.78 - 0.12 * sq_m)) * hw
            if ca <= 0.0:
                lz = pb.z * (abs(ca) ** 0.72)
            else:
                rim = abs(sa) ** 1.35
                lz = pt.z * rim + (pt.z - 0.032 * math.sin(v * math.pi)) * (1.0 - rim)
            row_raw.append(Vector((pb.x, ly, lz)))

        # Arc-length-normalized U around full circumference (u=0/1 top, u=0.5 chin bottom -> crisp isotropic scales!)
        cum_arc = [0.0]
        for ix in range(mr_u):
            p0 = row_raw[ix]
            p1 = row_raw[(ix + 1) % mr_u]
            cum_arc.append(cum_arc[-1] + (p1 - p0).length)
        total_arc = max(1e-5, cum_arc[-1])

        rv = [jaw_q @ pt_v for pt_v in row_raw]
        ruv = [(cum_arc[ix] / total_arc, v * 0.92) for ix in range(mr_u)]
        m_rv.append(rv)
        m_ruv.append(ruv)

    bm_mand = _build_grid_bmesh(m_rv, m_ruv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_mand, "Apato_Mandible", mat=mats["cranium"], parent=jaw_bone)

    # Lower anterior diplodocid peg teeth nested inside upper teeth (cleanly hidden when closed!)
    for ti in range(8):
        frac = (ti / 7.0) * 2.0 - 1.0
        ang_m = frac * 1.02
        tx = 0.51 + math.cos(ang_m) * 0.088
        ty = math.sin(ang_m) * 0.080
        tz = 0.002
        _build_diplodocid_peg_tooth(
            f"Apato_LowerTooth_{ti:02d}",
            radius=0.0074,
            length=0.032,
            is_upper=False,
            mat=mats["tooth"],
            parent=jaw_bone,
            local_pos=jaw_q @ Vector((tx, ty, tz)),
            local_rot=(0.0, 0.22 + 0.12, ang_m * 0.28),
        )

    # Fleshy grooved tongue inside lower mandible
    t_u, t_v = 16, 18
    t_rv, t_ruv = [], []
    for iy in range(t_v + 1):
        v = iy / t_v
        tx = 0.06 + v * 0.48
        tz = -0.012 + math.sin(v * math.pi * 0.85) * 0.024
        tw = 0.072 * (math.sin(v * math.pi) ** 0.62)
        th = 0.024 * (math.sin(v * math.pi) ** 0.62)
        rv, ruv = [], []
        for ix in range(t_u):
            u = ix / t_u
            a = u * math.pi * 2.0
            sulcus = -0.008 * math.exp(-((math.sin(a) / 0.30) ** 2)) * max(0.0, math.cos(a)) * math.sin(v * math.pi)
            rv.append(jaw_q @ Vector((tx, math.sin(a) * tw, tz + math.cos(a) * th + sulcus)))
            ruv.append((u, v))
        t_rv.append(rv)
        t_ruv.append(ruv)
    bm_tng = _build_grid_bmesh(t_rv, t_ruv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_tng, "Apato_Tongue", mat=mats["mucosa"], parent=jaw_bone)


# ---------------------------------------------------------------------------
# 4. MASSIVE COLUMNAR SAUROPOD LIMBS & SCIENTIFICALLY ACCURATE FEET
# ---------------------------------------------------------------------------

def _build_apato_limb_tube(
    name,
    ctrl_tuples,
    side,
    mat,
    parent,
    radial_segs=34,
    height_segs=56,
    v_uv_range=(0.12, 1.02),
    taper_start=True,
    ground_z=None,
):
    """
    Lofts a single continuous, seamless, watertight Apatosaurus columnar limb from
    deep inside the shoulder/pelvis all the way down into the flared semi-plantigrade
    footpad resting flat on world Z=0 (ZERO boot-cuff seam, ZERO UV stretch, ZERO mirror line!):
      - Monotonic full-circle tileable UV starting at outer lateral flank (u=0/1 -> dark basalt,
        u=0.25/0.75 -> Morrison stone anterior/posterior, u=0.5 -> lighter warm ash inner medial!).
      - Subtle anatomical elbow/knee & wrist/ankle flexion skin creases.
      - Flat-bottomed grounded sole flush at ground_z.
    """
    spline = CatmullRomSpline3D(ctrl_tuples)
    rings_verts = []
    rings_uvs = []
    prev_tangent = None
    lat_axis = None

    # Starting angle on outer lateral flank so u=0/1 aligns with dark outer leg hide
    # and u=0.5 aligns with warm ash inner medial thigh/arm!
    outer_ang = math.pi * 0.5 if side > 0 else -math.pi * 0.5

    for iy in range(height_segs + 1):
        v = iy / height_segs
        cap_scale = 1.0
        if taper_start and v < 0.16:
            cap_scale = max(0.02, math.sin((v / 0.16) * (math.pi * 0.5)) ** 0.85)
        elif iy == height_segs:
            cap_scale = 0.88  # Clean grounded sole edge (zero bottom pinch!)

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

        # Subtle authentic sauropod flexion creases around knee/elbow & wrist/ankle
        fold_mod = 1.0
        if 0.36 < v < 0.54:
            fold_mod += 0.020 * math.sin((v - 0.36) * math.pi * 20.0) * math.sin(((v - 0.36) / 0.18) * math.pi)
        elif 0.74 < v < 0.88:
            fold_mod += 0.022 * math.sin((v - 0.74) * math.pi * 22.0) * math.sin(((v - 0.74) / 0.14) * math.pi)

        v_uv = v_uv_range[0] + v * (v_uv_range[1] - v_uv_range[0])
        row_v = []
        row_uv = []
        for ix in range(radial_segs):
            u = ix / radial_segs
            ang = outer_ang + u * math.pi * 2.0
            sin_a = math.sin(ang)
            cos_a = math.cos(ang)

            pt = c_pt + lat_axis * (sin_a * ry * fold_mod) + sag_axis * (cos_a * rz * fold_mod + sag_off)
            if ground_z is not None and pt.z < ground_z:
                pt.z = ground_z
            row_v.append(pt)
            row_uv.append((u, v_uv))

        rings_verts.append(row_v)
        rings_uvs.append(row_uv)

    bm = _build_grid_bmesh(rings_verts, rings_uvs, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    return attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=(0.0, 0.0, 0.0), subdiv=0)


def _build_blunt_hoof_nail(name, width, height, depth, mat, parent, local_pos, yaw=0.0):
    """Sculpts a broad, flat, low-profile rounded elephantine/sauropod keratin hoof-nail cap."""
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")
    segs_u = 14
    segs_v = 6
    rings = []
    for iv in range(segs_v + 1):
        v = iv / segs_v
        lz = height * (0.04 + 0.96 * (1.0 - v))
        rx = depth * (0.45 + 0.55 * math.sin(v * math.pi * 0.85))
        ry = width * 0.5 * (0.72 + 0.28 * math.sin(v * math.pi * 0.80))
        row = []
        for iu in range(segs_u):
            a = (iu / segs_u) * math.pi * 2.0
            row.append(bm.verts.new((math.cos(a) * rx, math.sin(a) * ry, lz)))
        rings.append(row)
    for iv in range(segs_v):
        r0, r1 = rings[iv], rings[iv + 1]
        v0, v1 = iv / segs_v, (iv + 1) / segs_v
        for iu in range(segs_u):
            iun = (iu + 1) % segs_u
            f = bm.faces.new((r0[iu], r0[iun], r1[iun], r1[iu]))
            for lp, uvc in zip(f.loops, ((iu / segs_u, v0), ((iu + 1) / segs_u, v0), ((iu + 1) / segs_u, v1), (iu / segs_u, v1))):
                lp[uv_layer].uv = uvc
    try:
        bm.faces.new(rings[0][::-1])
        bm.faces.new(rings[-1])
    except ValueError:
        pass
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    obj = attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=local_pos, subdiv=0)
    obj.rotation_euler = (0.0, 0.16, yaw)
    return obj


def _build_apato_foot_claws(leg_bone, foot_center, foot_r, side, is_front, mats, prefix):
    """
    Mounts scientifically accurate Apatosaurus sauropod claws & blunt hoof-nails onto the
    seamless continuous columnar footpad (with ALL claw tips strictly >= Z=0.010):
      - Front Manus (is_front=True):
          * Iconic single large curved medial Pollex (Digit I thumb) defensive claw
            projecting forward-medially & gently downward.
          * 3 broad cushioned semicircular anterior keratinous hoof-nail shields (Digits II-IV).
      - Hind Pes (is_front=False):
          * Authentic asymmetric 3 heavy curved dark-keratin claws on inner Digits I-III
            (Digit I largest -> Digit III medium).
          * 2 sturdy blunt cushioned outer toe pads (Digits IV-V) with no sharp claws.
    """
    fx, fy, fz = foot_center

    if is_front:
        # 1. ICONIC APATOSAURUS INNER THUMB (POLLEX / DIGIT I) CLAW!
        medial_sign = -side
        pollex_base = Vector((fx + foot_r * 0.44, fy + medial_sign * foot_r * 0.72, fz + 0.135))
        _build_muscular_limb_segment(
            f"{prefix}_PollexToe",
            Vector((fx + foot_r * 0.14, fy + medial_sign * foot_r * 0.40, fz + 0.145)),
            pollex_base,
            lambda t, a: (0.082 * (1.0 - 0.15 * t), 0.078 * (1.0 - 0.15 * t), 0.0, 0.0),
            mats["hide"],
            leg_bone,
            prox_overlap=0.22, dist_overlap=0.06, radial_segs=14, height_segs=8,
            v_uv_range=(0.15, 0.25),
        )
        _build_conical_horn(
            f"{prefix}_PollexClaw",
            length=0.25,
            base_r=0.064,
            direction=(0.70, medial_sign * 0.64, -0.32),
            curve_offset=(0.020, medial_sign * 0.015, -0.028),
            mat=mats["claw"],
            parent=leg_bone,
            local_pos=pollex_base,
            segs_u=16,
            segs_v=14,
            flat_y=0.78,
            flute_amp=0.045,
        )

        # 2. Flush broad rounded keratinous hoof-nail shields along anterior horseshoe rim (Digits II-IV)
        manus_toes = [
            ( 0.16, 0.098),
            (-0.24, 0.095),
            (-0.66, 0.084),
        ]
        for ti, (yaw_base, nail_w) in enumerate(manus_toes):
            ang = yaw_base * (-side)
            dx, dy = math.cos(ang), math.sin(ang)
            nail_pos = Vector((fx + dx * foot_r * 0.96, fy + dy * foot_r * 0.94, fz + 0.016))
            _build_blunt_hoof_nail(
                f"{prefix}_ManusNail{ti}",
                width=nail_w,
                height=0.096,
                depth=0.044,
                mat=mats["claw"],
                parent=leg_bone,
                local_pos=nail_pos,
                yaw=ang,
            )
    else:
        # HIND PES: Asymmetric 3 massive curved inner claws (Digits I, II, III) + 2 blunt outer toes!
        pes_specs = [
            # (medial_angle, toe_len, toe_rad, claw_len, claw_r)
            ( 0.44, 0.11, 0.086, 0.240, 0.064),  # Digit I (innermost — largest anchor claw!)
            ( 0.10, 0.13, 0.082, 0.205, 0.056),  # Digit II (large heavy claw)
            (-0.24, 0.12, 0.076, 0.162, 0.047),  # Digit III (sturdy third claw)
            (-0.62, 0.09, 0.072, 0.000, 0.000),  # Digit IV (blunt outer cushion pad)
            (-0.94, 0.07, 0.064, 0.000, 0.000),  # Digit V (stout lateral cushion pad)
        ]
        for ti, (med_ang, t_len, t_rad, c_len, c_rad) in enumerate(pes_specs):
            ang = med_ang * (-side)
            dx, dy = math.cos(ang), math.sin(ang)
            ts = Vector((fx + dx * foot_r * 0.56, fy + dy * foot_r * 0.56, fz + 0.108))
            te = Vector((fx + dx * (foot_r * 0.56 + t_len), fy + dy * (foot_r * 0.56 + t_len * 0.90), fz + 0.098))
            _build_muscular_limb_segment(
                f"{prefix}_PesToe{ti}",
                ts, te,
                lambda t, a, r=t_rad: (r * (1.0 - 0.14 * t), r * 0.84 * (1.0 - 0.14 * t), 0.0, 0.0),
                mats["hide"],
                leg_bone,
                prox_overlap=0.22, dist_overlap=0.06, radial_segs=14, height_segs=8,
                v_uv_range=(0.14, 0.24),
            )
            if c_len > 0.0:
                splay_y = side * 0.18
                _build_conical_horn(
                    f"{prefix}_PesClaw{ti}",
                    length=c_len,
                    base_r=c_rad,
                    direction=(dx * 0.92, dy * 0.92 + splay_y, -0.32),
                    curve_offset=(0.014 * dx, 0.014 * dy + side * 0.016, -0.022),
                    mat=mats["claw"],
                    parent=leg_bone,
                    local_pos=te + Vector((0.0, 0.0, 0.012)),
                    segs_u=14,
                    segs_v=12,
                    flat_y=0.84,
                    flute_amp=0.04,
                )


def _build_forelimb(leg_bone, side, local_ground_z, mats, idx):
    """
    Sculpts a single continuous, seamless columnar Apatosaurus forelimb (Bone_Leg0/1)
    blending smoothly from deep inside the shoulder down into the grounded semi-plantigrade
    horseshoe manus pad at Z=0 with zero ankle cuff seam!
    """
    ctrl = [
        (-0.04, -side * 0.56,  0.64, 0.30, 0.36,  0.00),  # Deep gradual scapular blend inside thorax
        ( 0.00, -side * 0.22,  0.22, 0.38, 0.45,  0.00),  # Smooth muscular deltoid swell
        (-0.04, -side * 0.02, -0.26, 0.35, 0.40,  0.00),  # Heavy triceps upper arm
        (-0.08,  side * 0.05, -0.76, 0.30, 0.34, -0.01),  # Subtle reptilian elbow contour
        (-0.02,  side * 0.04, -1.32, 0.27, 0.285, 0.01),  # Heavy columnar radius/ulna forearm
        ( 0.04,  side * 0.04, local_ground_z + 0.38, 0.260, 0.266, 0.00),  # Thick wrist column
        ( 0.09,  side * 0.04, local_ground_z + 0.19, 0.312, 0.326, 0.00),  # Smooth semi-plantigrade footpad flare!
        ( 0.10,  side * 0.04, local_ground_z + 0.06, 0.318, 0.334, 0.00),  # Cushioned outer sole wall
        ( 0.10,  side * 0.04, local_ground_z,        0.295, 0.310, 0.00),  # Flat sole flush at Z=0 (zero overshoot!)
    ]
    _build_apato_limb_tube(
        f"Apato_Forelimb_{idx}",
        ctrl,
        side,
        mats["hide"],
        leg_bone,
        radial_segs=34,
        height_segs=56,
        v_uv_range=(0.12, 0.96),
        taper_start=True,
        ground_z=local_ground_z,
    )
    _build_apato_foot_claws(
        leg_bone,
        (0.11, side * 0.04, local_ground_z),
        foot_r=0.318,
        side=side,
        is_front=True,
        mats=mats,
        prefix=f"Bone_Leg{idx}",
    )


def _build_hindlimb(leg_bone, side, local_ground_z, mats, idx):
    """
    Sculpts a single continuous, towering pillar-like Apatosaurus hindlimb (Bone_Leg2/3)
    blending seamlessly from deep inside the high pelvis down into the grounded 3-clawed
    semi-plantigrade pes at Z=0 with zero ankle cuff seam!
    """
    ctrl = [
        ( 0.04, -side * 0.58,  0.72, 0.36, 0.48,  0.00),  # Deep gradual iliac blend inside pelvis
        ( 0.04, -side * 0.22,  0.24, 0.45, 0.58,  0.01),  # Enormous gluteal/quadriceps thigh swell
        ( 0.07, -side * 0.02, -0.28, 0.40, 0.49,  0.02),  # Muscular mid-thigh & hamstrings
        ( 0.11,  side * 0.04, -0.82, 0.33, 0.39,  0.02),  # Subtle powerful columnar knee
        ( 0.00,  side * 0.05, -1.42, 0.29, 0.33, -0.01),  # Thick gastrocnemius calf pillar
        ( 0.03,  side * 0.05, local_ground_z + 0.40, 0.280, 0.292, 0.00),  # Stout hock/ankle
        ( 0.10,  side * 0.05, local_ground_z + 0.20, 0.344, 0.372, 0.00),  # Broad semi-plantigrade pes flare!
        ( 0.11,  side * 0.05, local_ground_z + 0.06, 0.348, 0.378, 0.00),  # Cushioned outer sole wall
        ( 0.11,  side * 0.05, local_ground_z,        0.322, 0.352, 0.00),  # Flat sole flush at Z=0 (zero overshoot!)
    ]
    _build_apato_limb_tube(
        f"Apato_Hindlimb_{idx}",
        ctrl,
        side,
        mats["hide"],
        leg_bone,
        radial_segs=34,
        height_segs=58,
        v_uv_range=(0.12, 1.02),
        taper_start=True,
        ground_z=local_ground_z,
    )
    _build_apato_foot_claws(
        leg_bone,
        (0.12, side * 0.05, local_ground_z),
        foot_r=0.356,
        side=side,
        is_front=False,
        mats=mats,
        prefix=f"Bone_Leg{idx}",
    )


# ---------------------------------------------------------------------------
# 5. MAIN BUILDER & GLB EXPORTER
# ---------------------------------------------------------------------------

def build_apato_high_definition():
    clear_scene()

    mats = {
        "hide": _make_trex_pbr_mat(
            "Mat_BodyPrimary",
            base_color=(0.38, 0.37, 0.36, 1.0),
            roughness=0.76,
            metallic=0.01,
            albedo_path=_tex("apato_albedo.png"),
            bump_path=_tex("apato_normal.png"),
            bump_strength=0.46,
        ),
        "cranium": _make_trex_pbr_mat(
            "Mat_BodyPrimary_Skull",
            base_color=(0.38, 0.37, 0.35, 1.0),
            roughness=0.66,
            metallic=0.02,
            albedo_path=_tex("apato_cranium_albedo.png"),
            bump_path=_tex("apato_cranium_normal.png"),
            bump_strength=0.52,
        ),
        "spine": _make_trex_pbr_mat(
            "Mat_Accent",
            base_color=(0.45, 0.42, 0.38, 1.0),
            roughness=0.58,
            metallic=0.02,
            albedo_path=_tex("apato_spine_albedo.png"),
            bump_path=_tex("apato_spine_normal.png"),
            bump_strength=0.54,
        ),
        "claw": _make_trex_pbr_mat(
            "Mat_Secondary",
            base_color=(0.24, 0.21, 0.18, 1.0),
            roughness=0.38,
            metallic=0.02,
            albedo_path=_tex("apato_claw_albedo.png"),
            bump_path=_tex("apato_claw_normal.png"),
            bump_strength=0.42,
        ),
        "tooth": _make_trex_pbr_mat(
            "Mat_Tooth",
            base_color=(0.86, 0.81, 0.70, 1.0),
            roughness=0.22,
            metallic=0.02,
            albedo_path=_tex("apato_tooth_albedo.png"),
            bump_path=_tex("apato_tooth_normal.png"),
            bump_strength=0.22,
        ),
        "mucosa": _make_trex_pbr_mat(
            "Mat_OralMucosa",
            base_color=(0.52, 0.18, 0.20, 1.0),
            roughness=0.24,
            metallic=0.02,
            albedo_path=_tex("trex_mucosa_albedo.png"),
            bump_path=_tex("trex_mucosa_bump.png"),
            bump_strength=0.22,
        ),
        "iris": make_pbr_material(
            "Mat_Eye",
            base_color=(0.98, 0.48, 0.08, 1.0),
            roughness=0.08,
            emissive=(0.62, 0.24, 0.03, 1.0),
            emissive_strength=0.28,
            albedo_path=_tex("apato_iris_albedo.png"),
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
            emissive_strength=0.92,
        ),
    }

    # Exact canonical Apatosaurus bone hierarchy matching js/fighters/apatosaurus.js,
    # js/animations/apatosaurus/*.js, js/core/model-loader.js, and tools/test_glb_models.js
    hips_z = 2.10
    root = create_bone_node("Bone_Root", (0.0, 0.0, 0.0))
    hips = create_bone_node("Bone_Hips", (0.0, 0.0, hips_z), parent=root)
    torso = create_bone_node("Bone_Torso", (0.0, 0.0, 0.0), parent=hips)

    # 17-point Unified Master Spine Spline (Scott Hartman / Carnegie Apatosaurus louisae!)
    # Sweeping supersonic whip tail, high-arched sacral back, deep barrel gut, and smooth
    # continuous hyper-muscular Apatosaurus combat neck rising gracefully to the head.
    spine_ctrl = [
        (-6.55, 0.0, 1.62, 0.004, 0.004),  # 0: Supersonic whip-lash distal tip (slight proud whip upturn)
        (-5.78, 0.0, 1.48, 0.036, 0.042),  # 1: Mid-distal flexible lash
        (-4.95, 0.0, 1.42, 0.072, 0.088),  # 2: Bone_Tail4
        (-4.04, 0.0, 1.47, 0.134, 0.168),  # 3: Bone_Tail3
        (-3.10, 0.0, 1.62, 0.220, 0.280),  # 4: Bone_Tail2
        (-2.18, 0.0, 1.85, 0.342, 0.442),  # 5: Bone_Tail1
        (-1.34, 0.0, 2.09, 0.495, 0.630),  # 6: Bone_Tail0 (huge M. caudofemoralis base)
        (-0.78, 0.0, 2.34, 0.765, 0.875),  # 7: Towering sacral / pelvic arch
        ( 0.06, 0.0, 2.26, 0.915, 1.045),  # 8: Monumental deep herbivore barrel ribcage
        ( 0.88, 0.0, 2.18, 0.775, 0.885),  # 9: Broad heavily-muscled anterior thorax/shoulders
        ( 1.46, 0.0, 2.26, 0.560, 0.665),  # 10: Bone_Neck / Special_NeckSeg0 (colossal smooth neck base)
        ( 2.08, 0.0, 2.50, 0.445, 0.545),  # 11: Special_NeckSeg1 (sweeping lower-mid combat neck)
        ( 2.68, 0.0, 2.86, 0.352, 0.432),  # 12: Special_NeckSeg2 (graceful rising mid-neck)
        ( 3.24, 0.0, 3.24, 0.275, 0.335),  # 13: Special_NeckSeg3 (upper-mid muscular neck)
        ( 3.74, 0.0, 3.56, 0.218, 0.262),  # 14: Special_NeckSeg4 (regal upper neck crest)
        ( 4.18, 0.0, 3.68, 0.188, 0.218),  # 15: Bone_Head atlas-occiput junction
        ( 4.38, 0.0, 3.66, 0.004, 0.004),  # 16: Internal skull occiput cap
    ]
    master_spine = CatmullRomSpline3D(spine_ctrl)
    n_seg = float(len(spine_ctrl) - 1)  # 16.0

    # Tail bone chain (Bone_Tail0..4 parented from Bone_Torso)
    tail_worlds = [
        (-1.34, 0.0, 2.09),  # Tail0
        (-2.18, 0.0, 1.85),  # Tail1
        (-3.10, 0.0, 1.62),  # Tail2
        (-4.04, 0.0, 1.47),  # Tail3
        (-4.95, 0.0, 1.42),  # Tail4
    ]
    tail_bones = []
    prev_t_bone = torso
    prev_t_w = (0.0, 0.0, hips_z)
    for i, tw in enumerate(tail_worlds):
        rel = (tw[0] - prev_t_w[0], tw[1] - prev_t_w[1], tw[2] - prev_t_w[2])
        tb = create_bone_node(f"Bone_Tail{i}", rel, parent=prev_t_bone)
        tail_bones.append(tb)
        prev_t_bone = tb
        prev_t_w = tw

    # Neck bone chain (Bone_Neck -> Special_NeckSeg0..4 -> Bone_Head -> Bone_Jaw)
    neck_worlds = [
        (1.46, 0.0, 2.26),  # Neck / Special_NeckSeg0
        (2.08, 0.0, 2.50),  # Special_NeckSeg1
        (2.68, 0.0, 2.86),  # Special_NeckSeg2
        (3.24, 0.0, 3.24),  # Special_NeckSeg3
        (3.74, 0.0, 3.56),  # Special_NeckSeg4
    ]
    neck_root = create_bone_node(
        "Bone_Neck",
        (neck_worlds[0][0], 0.0, neck_worlds[0][2] - hips_z),
        parent=torso,
    )
    neck_segs = []
    prev_n_bone = neck_root
    prev_n_w = neck_worlds[0]
    for i, nw in enumerate(neck_worlds):
        rel = (nw[0] - prev_n_w[0], nw[1] - prev_n_w[1], nw[2] - prev_n_w[2])
        nb = create_bone_node(f"Special_NeckSeg{i}", rel, parent=prev_n_bone)
        neck_segs.append(nb)
        prev_n_bone = nb
        prev_n_w = nw

    head_world = (4.18, 0.0, 3.68)
    head = create_bone_node(
        "Bone_Head",
        (head_world[0] - neck_worlds[-1][0], 0.0, head_world[2] - neck_worlds[-1][2]),
        parent=neck_segs[-1],
    )
    jaw = create_bone_node("Bone_Jaw", (0.14, 0.0, -0.125), parent=head)

    # Slice the Unified Master Spine into seamless overlapping C1-continuous articulated segments!
    overlap_tail = 0.024
    overlap_torso = 0.030
    overlap_neck = 0.026

    # Tail4..Tail0 (unified v_uv_scale=4.0 across entire master spine for 100% seamless joint texturing!)
    tail_t_joints = [6.0 / n_seg, 5.0 / n_seg, 4.0 / n_seg, 3.0 / n_seg, 2.0 / n_seg]
    _build_continuous_spine_segment(
        "Apato_TailSeg4", master_spine,
        0.0, tail_t_joints[4] + overlap_tail, None, tail_t_joints[4],
        tail_worlds[4], tail_bones[4], mats["hide"], segs_u=24, segs_v=22, v_uv_scale=4.0,
    )
    _build_continuous_spine_segment(
        "Apato_TailSeg3", master_spine,
        tail_t_joints[4] - overlap_tail, tail_t_joints[3] + overlap_tail, tail_t_joints[4], tail_t_joints[3],
        tail_worlds[3], tail_bones[3], mats["hide"], segs_u=28, segs_v=18, v_uv_scale=4.0,
    )
    _build_continuous_spine_segment(
        "Apato_TailSeg2", master_spine,
        tail_t_joints[3] - overlap_tail, tail_t_joints[2] + overlap_tail, tail_t_joints[3], tail_t_joints[2],
        tail_worlds[2], tail_bones[2], mats["hide"], segs_u=32, segs_v=18, v_uv_scale=4.0,
    )
    _build_continuous_spine_segment(
        "Apato_TailSeg1", master_spine,
        tail_t_joints[2] - overlap_tail, tail_t_joints[1] + overlap_tail, tail_t_joints[2], tail_t_joints[1],
        tail_worlds[1], tail_bones[1], mats["hide"], segs_u=36, segs_v=18, v_uv_scale=4.0,
    )
    _build_continuous_spine_segment(
        "Apato_TailSeg0", master_spine,
        tail_t_joints[1] - overlap_tail, tail_t_joints[0] + overlap_torso, tail_t_joints[1], tail_t_joints[0],
        tail_worlds[0], tail_bones[0], mats["hide"], segs_u=44, segs_v=18, v_uv_scale=4.0,
    )

    # Colossal Torso barrel [t(6) .. t(10)]
    t_j_tail0 = 6.0 / n_seg
    t_j_neck0 = 10.0 / n_seg
    _build_continuous_spine_segment(
        "Apato_Torso", master_spine,
        t_j_tail0 - overlap_torso, t_j_neck0 + overlap_torso, t_j_tail0, t_j_neck0,
        (0.0, 0.0, hips_z), torso, mats["hide"], segs_u=48, segs_v=36, v_uv_scale=4.0,
    )

    # 5 Articulated Muscular Neck Segments (Special_NeckSeg0..4)
    neck_t_joints = [10.0 / n_seg, 11.0 / n_seg, 12.0 / n_seg, 13.0 / n_seg, 14.0 / n_seg]
    for i in range(5):
        t_lo = neck_t_joints[i]
        t_hi = neck_t_joints[i + 1] if i < 4 else 1.0
        t_start = t_lo - (overlap_torso if i == 0 else overlap_neck)
        t_end = (t_hi + overlap_neck) if i < 4 else 1.0
        t_jb = t_lo
        t_jf = t_hi if i < 4 else None
        _build_continuous_spine_segment(
            f"Apato_NeckSeg{i}", master_spine,
            t_start, t_end, t_jb, t_jf,
            neck_worlds[i], neck_segs[i], mats["hide"],
            segs_u=44 - i * 2, segs_v=18 if i < 4 else 22, v_uv_scale=4.0,
        )

    # Map t-intervals to their owning bones so every dorsal spine & neck boss moves cleanly!
    bone_map = [
        (0.0,              tail_t_joints[4], tail_bones[4], tail_worlds[4]),
        (tail_t_joints[4], tail_t_joints[3], tail_bones[3], tail_worlds[3]),
        (tail_t_joints[3], tail_t_joints[2], tail_bones[2], tail_worlds[2]),
        (tail_t_joints[2], tail_t_joints[1], tail_bones[1], tail_worlds[1]),
        (tail_t_joints[1], tail_t_joints[0], tail_bones[0], tail_worlds[0]),
        (tail_t_joints[0], neck_t_joints[0], torso,         (0.0, 0.0, hips_z)),
        (neck_t_joints[0], neck_t_joints[1], neck_segs[0],  neck_worlds[0]),
        (neck_t_joints[1], neck_t_joints[2], neck_segs[1],  neck_worlds[1]),
        (neck_t_joints[2], neck_t_joints[3], neck_segs[2],  neck_worlds[2]),
        (neck_t_joints[3], neck_t_joints[4], neck_segs[3],  neck_worlds[3]),
        (neck_t_joints[4], 1.0,              neck_segs[4],  neck_worlds[4]),
    ]

    _add_dorsal_spines_and_neck_bosses(master_spine, bone_map, mats)
    _build_sculpted_skull_and_jaw(head, jaw, mats)

    # Canonical Apatosaurus 4-leg contract:
    #   Bone_Leg0 = Front Left (+Y),  Bone_Leg1 = Front Right (-Y)
    #   Bone_Leg2 = Rear Left (+Y),   Bone_Leg3 = Rear Right (-Y)
    leg_specs = [
        (0,  0.94,  0.64, -0.02, True),   # Front Left
        (1,  0.94, -0.64, -0.02, True),   # Front Right
        (2, -0.88,  0.64,  0.10, False),  # Rear Left
        (3, -0.88, -0.64,  0.10, False),  # Rear Right
    ]
    for idx, lx, ly, lz, is_front in leg_specs:
        side = 1.0 if ly > 0 else -1.0
        leg_bone = create_bone_node(f"Bone_Leg{idx}", (lx, ly, lz), parent=hips)
        local_ground_z = -(hips_z + lz)
        if is_front:
            _build_forelimb(leg_bone, side, local_ground_z, mats, idx)
        else:
            _build_hindlimb(leg_bone, side, local_ground_z, mats, idx)

    out_path = os.path.join(OUT_DIR, "apato.glb")
    export_fighter_glb(out_path)
    return out_path


# ---------------------------------------------------------------------------
# 6. STUDIO VERIFICATION RENDERER
# ---------------------------------------------------------------------------

def render_apato_verification_views(
    prefix="apato_v1",
    shot_dir="/home/niwatorichan/Projects/ExtinctionFighter/.tmp_screenshots",
):
    """
    Renders 7 studio PBR verification views of the current Blender Apatosaurus scene
    (side profile, hero 3/4, head & neck portrait close-up, front 3/4, rear 3/4,
    top view, and forefoot/hindfoot claw close-up) for thorough visual inspection.
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
        world = bpy.data.worlds.new("ApatoStudioWorld")
        bpy.context.scene.world = world
    world.use_nodes = True
    bg = next((n for n in world.node_tree.nodes if n.type == "BACKGROUND"), None)
    if bg:
        bg.inputs[0].default_value = (0.14, 0.16, 0.20, 1.0)
        bg.inputs[1].default_value = 1.25

    def add_sun(name, loc, target, energy, color=(1.0, 0.98, 0.94)):
        ldata = bpy.data.lights.new(name=name, type="SUN")
        ldata.energy = energy
        ldata.color = color
        lobj = bpy.data.objects.new(name, ldata)
        bpy.context.collection.objects.link(lobj)
        lobj.location = Vector(loc)
        lobj.rotation_euler = (Vector(target) - lobj.location).to_track_quat("-Z", "Y").to_euler()
        temp_objs.append(lobj)

    add_sun("_StudioKey", center + Vector((6.0, -8.5, 8.5)), center, 3.8, (1.0, 0.95, 0.88))
    add_sun("_StudioFill", center + Vector((-5.5, 6.5, 4.5)), center, 1.6, (0.76, 0.88, 1.0))
    add_sun("_StudioRim", center + Vector((-6.5, -3.0, 6.5)), center, 2.4, (1.0, 0.86, 0.70))

    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=16.0, depth=0.05, location=(center.x, 0.0, -0.025))
    ground = bpy.context.active_object
    ground.name = "_StudioGround"
    gmat = make_pbr_material("_StudioGroundMat", base_color=(0.20, 0.21, 0.23, 1.0), roughness=0.88, metallic=0.02)
    ground.data.materials.append(gmat)
    temp_objs.append(ground)

    cam_data = bpy.data.cameras.new("_StudioCam")
    cam_data.lens = 48.0
    cam_obj = bpy.data.objects.new("_StudioCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    temp_objs.append(cam_obj)

    scene = bpy.context.scene
    scene.camera = cam_obj
    try:
        scene.render.engine = "BLENDER_EEVEE"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 960
    scene.render.resolution_y = 640
    scene.render.image_settings.file_format = "PNG"

    views = [
        ("side",         Vector((-0.60, -15.5, 2.35)), Vector((-0.60, 0.0, 2.05)), 46.0),
        ("hero_3q",      Vector(( 7.60, -11.4, 3.90)), Vector(( 0.20, 0.0, 2.15)), 44.0),
        ("rear_3q",      Vector((-9.60,  -9.2, 3.60)), Vector((-1.10, 0.0, 2.00)), 44.0),
        ("head_closeup", Vector(( 5.85,  -1.85, 3.85)), Vector(( 4.35, 0.0, 3.55)), 56.0),
        ("front_3q",     Vector(( 8.80,  -5.20, 3.10)), Vector(( 1.20, 0.0, 2.25)), 44.0),
        ("feet_closeup", Vector(( 2.40,  -3.60, 0.72)), Vector(( 0.10, -0.35, 0.35)), 50.0),
        ("top",          Vector((-0.50,  -0.01, 15.8)), Vector((-0.50, 0.0, 1.80)), 46.0),
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
    build_apato_high_definition()
