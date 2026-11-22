"""
tools/blender/giantsloth_sculptor.py
Museum-grade paleontological & portrait-faithful Blender 5.2 builder for the
rebuilt Giant Ground Sloth (Megatherium americanum) GLB model
(assets/models/fighters/giantsloth.glb).

Anatomical & visual synthesis:
  - Paleontological silhouette & biomechanics of Megatherium americanum
    (Pleistocene South America, 4-tonne elephant-sized ground sloth):
      * Colossal pear-shaped pelvic basin & deep hanging barrel gut tapering
        upward into Herculean sloping shoulders & humped shaggy withers.
      * Continuous C1 heavily-muscled blunt-conical tripod tail (Bone_Tail0..2)
        sweeping cleanly down-and-back as the third pillar of the upright stance.
      * Short, immensely thick shaggy bull-neck & plush honey-tan chest ruff
        flowing seamlessly into a broad domed bear/sloth cranium with massive
        masseter cheeks and a deep, blunt foliage-browsing muzzle.
      * Herculean oversized grappling forelimbs (Bone_Arm0..1) sculpted with a
        continuous hanging shaggy forearm fur drapery, broad shaggy knuckle-bearing
        hands, dark espresso ungual sheaths, and 3 colossal recurved dark
        charcoal-obsidian sickle claws (Digit III longest).
      * Massive columnar pedolateral hindlimbs (Bone_Leg0..1) blending seamlessly
        into broad flat-soled plantigrade feet at world Z = 0.000 with 3 heavy
        curved dark-horn anchor claws (dominant central Digit III).
  - Portrait-faithful facial & pelt artistry matched directly to
    assets/portraits/giantsloth.png:
      * 1024x1024 coarse shaggy espresso-umber & warm chestnut pelt PBR maps
        with pale raw-umber guard hairs and warm honey-tan shaggy chest/throat ruff.
      * Iconic broad pebbled dark charcoal-slate leathery rhinarium nose pad with
        deep curved comma-shaped nostrils and central philtrum cleft.
      * Expressive soulful burnt-amber mammalian eyes (round pupil, chestnut-amber
        radial iris, specular catchlight) framed by dark wrinkled fleshy eyelids.
      * Small thick rounded cup-shaped mammalian ears with recessed dark pinna.
      * Healed diagonal cheek battle scar, weathered snout scratches, and fine 3D
        tactile muzzle whiskers.
      * Closed stoic mammalian lips at rest + full articulated Bone_Jaw oral
        cavity (wet dusky-rose gums, muscular prehensile sloth tongue, and rows
        of authentic blunt rectangular hypsodont herbivore cheek teeth).

Canonical Extinction Kombat 3D rig contract (preserved 100%):
  Bone_Root -> Bone_Hips (Z=1.85)
    -> Bone_Torso
      -> Bone_Neck -> Bone_Head -> Bone_Jaw
      -> Bone_Arm0 (Right Arm, -Y, Three.js +Z)
      -> Bone_Arm1 (Left Arm,  +Y, Three.js -Z)
      -> Bone_Tail0 -> Bone_Tail1 -> Bone_Tail2
    -> Bone_Leg0 (Right Hindleg, -Y, planted at Z=0)
    -> Bone_Leg1 (Left Hindleg,  +Y, planted at Z=0)
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
)
from gorgonopsia_sculptor import (
    make_pbr_normal_mat,
    _build_grid_bmesh_seamless,
    _build_sparse_3d_hairs,
)


def _tex(name):
    p = os.path.join(TEX_DIR, name)
    return p if os.path.exists(p) else None


def _sstep(e0, e1, x):
    s = max(0.0, min(1.0, (x - e0) / max(1e-6, e1 - e0)))
    return s * s * (3.0 - 2.0 * s)


# ------------------------------------------------------------------------------
# 1. CONTINUOUS C1 MASTER SPINE SURFACE & SEAMLESS JOINT-MATCHED LOFTING
# ------------------------------------------------------------------------------

def _eval_sloth_spine_surface(master_spline, t, theta, cap_scale=1.0):
    """
    Evaluates the colossal pear-shaped Megatherium americanum spine cross-section
    at t in [0, 1] (0 = tripod tail tip, 1 = internal skull occiput cap) and
    circumferential angle theta (0 = dorsal spine, +/-pi/2 = lateral flanks, pi = belly/chest).
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

    torso_w = _sstep(0.28, 0.38, t) * (1.0 - _sstep(0.72, 0.82, t))
    neck_w  = _sstep(0.70, 0.80, t) * (1.0 - _sstep(0.95, 1.00, t))

    lat_exp = 0.94 - 0.06 * torso_w - 0.02 * neck_w
    y_lat = sign_s * (abs_sin ** lat_exp) * ry

    if cos_t >= 0.0:
        z_vert = (cos_t ** 0.90) * rz
    else:
        v_exp = 0.90 - 0.08 * torso_w
        z_vert = -((-cos_t) ** v_exp) * rz

    # 1. Signature Megatherium colossal pear-shaped pelvic iliac flare & heavy hanging gut
    pelvis_env = math.exp(-(((t - 0.47) / 0.115) ** 2))
    if -0.45 < cos_t < 0.55 and abs_sin > 0.35:
        flank_arch = math.sin(((cos_t + 0.45) / 1.00) * math.pi)
        y_lat += sign_s * 0.130 * ry * pelvis_env * flank_arch * cap_scale
    if cos_t < -0.15:
        belly_drop = ((-cos_t - 0.15) / 0.85) ** 1.15
        z_vert -= 0.120 * rz * pelvis_env * belly_drop * cap_scale

    # 2. Broad humped muscular scapular withers & plush shaggy chest ruff
    scap_env = math.exp(-(((t - 0.71) / 0.120) ** 2))
    if cos_t > 0.05:
        cape_fold = 1.0 + 0.026 * math.sin(t * math.pi * 22.0) * math.cos(theta * 5.0)
        z_vert += 0.135 * rz * scap_env * (cos_t ** 1.10) * cape_fold * cap_scale
    if -0.25 < cos_t < 0.55 and abs_sin > 0.36:
        sh_arch = math.sin(((cos_t + 0.25) / 0.80) * math.pi)
        y_lat += sign_s * 0.110 * ry * scap_env * sh_arch * cap_scale
    if cos_t < -0.18:
        ruff_arch = ((-cos_t - 0.18) / 0.82) ** 1.05
        ruff_tuft = 1.0 + 0.036 * math.sin(t * math.pi * 24.0 + math.cos(theta * 4.0) * 0.6) + 0.024 * math.cos(theta * 10.0)
        z_vert -= 0.135 * rz * scap_env * ruff_arch * ruff_tuft * cap_scale

    # 3. Thick shaggy bull-neck with dorsal mane crest & plush hanging throat ruff (portrait!)
    if neck_w > 0.001:
        if cos_t > 0.30:
            mane_wave = 1.0 + 0.032 * math.cos(t * math.pi * 26.0)
            z_vert += 0.095 * rz * ((cos_t - 0.30) / 0.70) * neck_w * mane_wave * cap_scale
        if -0.50 < cos_t < 0.35 and abs_sin > 0.38:
            y_lat += sign_s * 0.105 * ry * neck_w * cap_scale
        if cos_t < -0.20:
            throat_wave = 1.0 + 0.040 * math.sin(t * math.pi * 22.0)
            z_vert -= 0.140 * rz * ((-cos_t - 0.20) / 0.80) * neck_w * throat_wave * cap_scale

    # 4. Subtle continuous coarse shaggy-pelt silhouette undulation (breaks sterile tube curves naturally!)
    shag_env = _sstep(0.05, 0.18, t) * (1.0 - _sstep(0.93, 0.99, t)) * cap_scale
    fur_wave = (
        0.020 * math.sin(theta * 10.0 + t * 20.0)
        + 0.013 * math.cos(theta * 16.0 - t * 32.0)
        + 0.008 * math.sin(t * 44.0 + theta * 5.0)
    ) * shag_env
    y_lat *= (1.0 + fur_wave)
    z_vert *= (1.0 + fur_wave * 0.95)

    return c_world + lat_axis * y_lat + up_axis * z_vert


def _build_seamless_spine_segment(
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
    segs_v_mid=24,
    cap_rings=6,
):
    """
    Lofts a C1-continuous slice [t_start, t_end] of the master spine with EXACT ring
    placement at t_joint_back and t_joint_front plus smooth tangent-matched internal
    ball-joint caps (s^1.5 cosine roll-off). Guarantees ZERO shading crease across
    Torso/Neck and Torso/Tail junctions!
    """
    t_samples = []
    if t_joint_back is not None and t_joint_back > t_start:
        for i in range(cap_rings):
            frac = i / cap_rings
            t_samples.append(t_start + frac * (t_joint_back - t_start))
        t_mid_a = t_joint_back
    else:
        t_mid_a = t_start

    t_mid_b = t_joint_front if (t_joint_front is not None and t_joint_front < t_end) else t_end

    for i in range(segs_v_mid + 1):
        frac = i / segs_v_mid
        t_samples.append(t_mid_a + frac * (t_mid_b - t_mid_a))

    if t_joint_front is not None and t_end > t_joint_front:
        for i in range(1, cap_rings + 1):
            frac = i / cap_rings
            t_samples.append(t_joint_front + frac * (t_end - t_joint_front))

    origin = Vector(bone_world_pos)
    rings_verts = []
    rings_uvs = []

    for t in t_samples:
        cap_scale = 1.0
        if t_joint_back is not None and t < t_joint_back:
            span = max(1e-5, t_joint_back - t_start)
            s = min(1.0, (t_joint_back - t) / span)
            # Tangent-matched roll-off tucked cleanly inside neighboring segment
            cap_scale = max(0.004, 0.996 * math.cos((s ** 1.45) * math.pi * 0.5))
        elif t_joint_front is not None and t > t_joint_front:
            span = max(1e-5, t_end - t_joint_front)
            s = min(1.0, (t - t_joint_front) / span)
            cap_scale = max(0.004, 0.996 * math.cos((s ** 1.45) * math.pi * 0.5))

        row_v = []
        row_uv = []
        for iu in range(segs_u):
            u = iu / segs_u
            theta = u * math.pi * 2.0
            world_pt = _eval_sloth_spine_surface(master_spline, t, theta, cap_scale)
            row_v.append(world_pt - origin)
            row_uv.append((u, t))
        rings_verts.append(row_v)
        rings_uvs.append(row_uv)

    bm = _build_grid_bmesh(rings_verts, rings_uvs, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    return attach_mesh_obj(bm, name, mat=mat, parent=parent_bone, local_pos=(0.0, 0.0, 0.0), subdiv=0)


# ------------------------------------------------------------------------------
# 2. PORTRAIT-FAITHFUL MEGATHERIUM SKULL, RHINARIUM, EYES, EARS & JAW
# ------------------------------------------------------------------------------

def _build_curved_eyelid_arc(name, radius_x, radius_z, y_out, thickness, is_upper, side, mat, parent, uv_u=0.45, uv_v=0.80):
    """Sculpts a tight fleshy wrinkled curved mammalian eyelid wrapping closely around the eyeball."""
    segs_v = 16
    segs_u = 10
    rings_v = []
    rings_uv = []
    sign_z = 1.0 if is_upper else -1.0

    for iv in range(segs_v + 1):
        frac = iv / segs_v
        ang = (frac - 0.5) * math.pi * 0.98
        lx = math.sin(ang) * radius_x
        arch_z = sign_z * (math.cos(ang) ** 0.78) * radius_z
        ly = side * (y_out * (0.42 + 0.58 * math.cos(ang)))
        r_th = thickness * (0.38 + 0.62 * math.sin(frac * math.pi))

        row_v = []
        row_uv = []
        for iu in range(segs_u):
            u = iu / segs_u
            a = u * math.pi * 2.0
            px = lx + math.cos(a) * r_th * 0.55
            py = ly + side * math.sin(a) * r_th * 0.95
            pz = arch_z + math.cos(a) * r_th * 0.85
            row_v.append(Vector((px, py, pz)))
            row_uv.append((uv_u + (frac - 0.5) * 0.08, (uv_v + (u - 0.5) * 0.06) % 1.0))
        rings_v.append(row_v)
        rings_uv.append(row_uv)

    bm = _build_grid_bmesh_seamless(rings_v, rings_uv, close_u=True, cap_start=True, cap_end=True, wrap_uv_seam=False)
    return attach_mesh_obj(bm, name, mat=mat, parent=parent)


def _build_sloth_ear(name, side, mat_outer, mat_inner, parent, local_pos):
    """
    Sculpts the small, thick, rounded cup-shaped mammalian ear seen in
    assets/portraits/giantsloth.png: furred semicircular outer pinna + neatly tucked dark inner cup.
    """
    ear_grp = create_bone_node(name + "_Pivot", local_pos, parent=parent)
    ear_grp.rotation_euler = (-side * 0.46, -0.20, -side * 0.36)

    segs_u = 18
    segs_v = 12
    rings_v = []
    rings_uv = []
    for iv in range(segs_v + 1):
        v = iv / segs_v
        h = v * 0.165
        width = 0.114 * math.sin(max(0.10, (1.0 - v * 0.68)) * math.pi * 0.55)
        thick = 0.056 * (1.0 - 0.42 * v)
        if iv == segs_v:
            width = 0.012
            thick = 0.008
        row_v = []
        row_uv = []
        for iu in range(segs_u):
            u = iu / segs_u
            ang = u * math.pi * 2.0
            ca, sa = math.cos(ang), math.sin(ang)
            cup = -0.024 * (sa * sa) * math.sin(v * math.pi)
            lx = ca * thick + cup
            ly = sa * width
            lz = h
            row_v.append(Vector((lx, ly, lz)))
            row_uv.append((0.14 + 0.16 * v, 0.12 + 0.14 * (0.5 + 0.5 * ca)))
        rings_v.append(row_v)
        rings_uv.append(row_uv)

    bm = _build_grid_bmesh_seamless(rings_v, rings_uv, close_u=True, cap_start=True, cap_end=True, wrap_uv_seam=False)
    attach_mesh_obj(bm, name, mat=mat_outer, parent=ear_grp)

    # Dark fleshy recessed inner ear concha cup neatly seated on front face (ZERO rear poke-through!)
    bm_in = bmesh.new()
    bmesh.ops.create_uvsphere(bm_in, u_segments=14, v_segments=10, radius=0.044)
    in_obj = attach_mesh_obj(bm_in, name + "_InnerCup", mat=mat_inner, parent=ear_grp, local_pos=(0.032, 0.0, 0.068))
    in_obj.scale = (0.30, 0.86, 1.02)
    return ear_grp


def _build_sloth_rhinarium(head_bone, pitch_q, mats):
    """
    Sculpts the iconic broad, pebbled, dark charcoal-slate leathery rhinarium nose pad
    from assets/portraits/giantsloth.png:
      - Broad shield-shaped dome seated cleanly across the blunt muzzle front
      - Flared nostril wings with deep dark comma-shaped nostrils
      - Crisp vertical central philtrum cleft
    """
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")
    bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=22, radius=0.148)

    for vtx in bm.verts:
        x, y, z = vtx.co.x, vtx.co.y, vtx.co.z
        y_scale = 1.24 - 0.40 * max(0.0, -z / 0.148)
        z_scale = 0.88 if z >= 0.0 else 0.72
        x_scale = 0.74
        x *= x_scale
        y *= y_scale
        z *= z_scale

        if x > 0.03:
            x = 0.03 + (x - 0.03) * 0.76

        if x > 0.0 and z < 0.02:
            cleft = math.exp(-((y / 0.026) ** 2)) * _sstep(0.02, -0.075, z)
            x -= 0.020 * cleft

        for sy in (-1.0, 1.0):
            ny = (y - sy * 0.080) / 0.046
            nz = (z - 0.008 + 0.015 * math.sin(max(-1.0, min(1.0, ny)) * 1.4)) / 0.038
            nd = math.sqrt(ny * ny + nz * nz)
            if nd < 1.0 and x > -0.01:
                dep = (1.0 - nd) ** 1.30
                x -= 0.024 * dep
            elif 1.0 <= nd < 1.55 and x > -0.01:
                rim = math.sin(((nd - 1.0) / 0.55) * math.pi)
                x += 0.015 * rim
                y += sy * 0.012 * rim

        vtx.co = Vector((x, y, z))

    for f in bm.faces:
        for lp in f.loops:
            co = lp.vert.co
            lp[uv_layer].uv = (0.5 + co.y * 2.8, 0.5 + (co.z + co.x * 0.45) * 2.8)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    nose_pos = pitch_q @ Vector((0.830, 0.0, 0.088))
    nose_obj = attach_mesh_obj(bm, "Sloth_Rhinarium", mat=mats["nose"], parent=head_bone, local_pos=nose_pos)
    nose_obj.rotation_euler = (0.0, 0.14, 0.0)

    # Matte deep-black comma-shaped nostril cavities seated cleanly inside the sculpted bowls
    for side in (-1, 1):
        bm_n = bmesh.new()
        bmesh.ops.create_uvsphere(bm_n, u_segments=14, v_segments=10, radius=0.036)
        n_obj = attach_mesh_obj(
            bm_n, f"Sloth_Nostril_{side}", mat=mats["pupil"], parent=head_bone,
            local_pos=pitch_q @ Vector((0.886, side * 0.080, 0.088)),
        )
        n_obj.scale = (0.46, 1.04, 0.84)
        n_obj.rotation_euler = (side * 0.25, 0.18, -side * 0.36)


def _build_herbivore_peg_tooth(name, rx, ry, length, is_upper, mat, parent, local_pos, local_rot=(0.0, 0.0, 0.0)):
    """Sculpts an authentic blunt rectangular/oval hypsodont Megatherium herbivore cheek tooth."""
    sign_z = -1.0 if is_upper else 1.0
    segs_u = 10
    segs_v = 6
    rings_v, rings_uv = [], []
    for iv in range(segs_v + 1):
        v = iv / segs_v
        lz = sign_z * length * v
        taper = 0.78 if iv == segs_v else (1.0 - 0.14 * v)
        row_v, row_uv = [], []
        for iu in range(segs_u):
            u = iu / segs_u
            a = u * math.pi * 2.0
            ca, sa = math.cos(a), math.sin(a)
            lx = math.copysign(1.0, ca) * (abs(ca) ** 0.72) * rx * taper
            ly = math.copysign(1.0, sa) * (abs(sa) ** 0.72) * ry * taper
            row_v.append(Vector((lx, ly, lz)))
            row_uv.append((u, v))
        rings_v.append(row_v)
        rings_uv.append(row_uv)
    bm = _build_grid_bmesh(rings_v, rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    obj = attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=local_pos, subdiv=0)
    obj.rotation_euler = local_rot
    return obj


def _build_giantsloth_skull_and_jaw(head_bone, jaw_bone, mats):
    """
    Sculpts the noble, weathered, bear-like Megatherium americanum head (64x78)
    matched directly to assets/portraits/giantsloth.png:
      - Rounder, taller-domed bear/sloth cranium with full furry cheeks (ZERO cheek poke-through!)
      - Broad pebbled dark charcoal rhinarium nose pad with deep dark comma nostrils
      - Expressive soulful burnt-amber mammalian eyes under shaggy brow arches with dark wrinkled eyelids
      - Small thick rounded cup-shaped mammalian ears
      - Fine subtle warm-brown 3D tactile muzzle whiskers
      - Tightly closed stoic mammalian lips at rest + full articulated Bone_Jaw with grooved prehensile
        sloth tongue, wet gums, cheek adductors, and blunt rectangular herbivore cheek teeth
    """
    pitch_q = Euler((0.0, 0.12, 0.0), "XYZ").to_matrix().to_4x4()

    slices = [
        (-0.38,  0.18, -0.14, 0.003),  # 0: Deep closed cap inside shaggy neck
        (-0.14,  0.39, -0.19, 0.405),  # 1: Broad shaggy occiput seamlessly blending into neck collar
        ( 0.10,  0.43, -0.17, 0.415),  # 2: Tall domed bear/sloth cranium & full muscular cheeks
        ( 0.30,  0.40, -0.15, 0.365),  # 3: Shaggy brow arches & forward-angled mammalian orbits
        ( 0.50,  0.33, -0.13, 0.295),  # 4: Gently sloping broad Megatherium nasal bridge
        ( 0.67,  0.26, -0.11, 0.256),  # 5: Deep muscular blunt upper muzzle & fleshy lips
        ( 0.78,  0.20, -0.06, 0.208),  # 6: Broad snout front seating the rhinarium
        ( 0.84,  0.11, -0.02, 0.124),  # 7: Tucked cap cleanly behind nose pad
        ( 0.86,  0.04,  0.01, 0.003),  # 8: Closed rostral cap
    ]
    top_spline = CatmullRomSpline3D([(s[0], s[3], s[1]) for s in slices])
    bot_spline = CatmullRomSpline3D([(s[0], s[3], s[2]) for s in slices])

    def get_lip_curve(v):
        # Smooth rounded stoic Megatherium upper lip line tucking neatly beneath rhinarium
        return (
            0.014 * math.exp(-(((v - 0.36) / 0.12) ** 2))
            - 0.012 * math.exp(-(((v - 0.72) / 0.14) ** 2))
            + 0.006 * math.exp(-(((v - 0.94) / 0.08) ** 2))
        )

    radial_steps = 64
    length_steps = 78
    skull_v, skull_uv = [], []

    for iy in range(length_steps + 1):
        v = iy / length_steps
        p_top, _ = top_spline.eval_at(v)
        p_bot, _ = bot_spline.eval_at(v)
        fx = p_top.x
        half_w = max(0.001, p_top.y)
        top_z = p_top.z
        bot_z = p_bot.z + get_lip_curve(v)

        brow_prof   = math.exp(-(((v - 0.43) / 0.092) ** 2))
        orbit_prof  = math.exp(-(((v - 0.46) / 0.052) ** 2))
        cheek_prof  = math.exp(-(((v - 0.30) / 0.140) ** 2))
        muzzle_prof = math.exp(-(((v - 0.75) / 0.125) ** 2))

        row_v, row_uv = [], []
        for ix in range(radial_steps):
            u = ix / radial_steps
            ang = u * math.pi * 2.0
            s, c = math.sin(ang), math.cos(ang)
            abs_s = abs(s)
            sign_s = 1.0 if s >= 0.0 else -1.0

            snout_t = _sstep(0.18, 0.44, v)
            ly = sign_s * (abs_s ** (0.93 - 0.07 * snout_t)) * half_w
            mid_z = 0.5 * (top_z + bot_z)
            half_h = 0.5 * (top_z - bot_z)
            oval_z = mid_z + c * half_h

            if c >= 0.0:
                snout_z = bot_z + (top_z - bot_z) * (c ** 0.82)
                lz = oval_z * (1.0 - snout_t) + snout_z * snout_t

                # Shaggy arched mammalian brow ridge curving cleanly OVER the eye (c in [0.44, 0.92])
                if brow_prof > 0.01 and 0.44 < c < 0.92:
                    brow_arch = math.sin(((c - 0.44) / 0.48) * math.pi)
                    lz += brow_prof * brow_arch * 0.052
                    ly += sign_s * brow_prof * brow_arch * 0.036
            else:
                # Plush rounded mammalian upper lip roll (zero sharp paper-thin edge!)
                rim = abs_s ** 1.10
                palate_z = bot_z * rim + (bot_z + 0.032 * (1.0 - (v - 0.5) ** 2)) * (1.0 - rim)
                lz = oval_z * (1.0 - snout_t) + palate_z * snout_t

            # Full plush furry Megatherium cheekbone & masseter jowl (keeps cheek full below the eye!)
            if cheek_prof > 0.01 and -0.50 < c < 0.22:
                c_arch = math.sin(((c + 0.50) / 0.72) * math.pi)
                ly += sign_s * cheek_prof * c_arch * 0.068 * snout_t
                lz -= cheek_prof * c_arch * 0.016 * snout_t

            # Fleshy rounded upper muzzle cushion
            if muzzle_prof > 0.01 and -0.40 < c < 0.34:
                m_arch = math.sin(((c + 0.40) / 0.74) * math.pi)
                ly += sign_s * muzzle_prof * m_arch * 0.034

            # Cleanly localized eye socket pit strictly around eye height (0.08 < c < 0.50 -> full cheek stays plush!)
            if orbit_prof > 0.01 and 0.08 < c < 0.50:
                orb_d = math.sin(((c - 0.08) / 0.42) * math.pi)
                ly *= (1.0 - 0.28 * orbit_prof * orb_d)

            # Subtle shaggy fur fullness around back of crown & cheeks
            rear_shag = _sstep(0.42, 0.12, v) * _sstep(0.02, 0.12, v)
            if rear_shag > 0.01:
                shag = 0.018 * math.sin(ang * 10.0 + v * 18.0) * rear_shag
                ly *= (1.0 + shag)
                lz += shag * 0.08

            row_v.append(pitch_q @ Vector((fx, ly, lz)))
            row_uv.append((v, u))

        skull_v.append(row_v)
        skull_uv.append(row_uv)

    bm_skull = _build_grid_bmesh(skull_v, skull_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=1)
    attach_mesh_obj(bm_skull, "Sloth_UpperCranium", mat=mats["cranium"], parent=head_bone)

    # 2. Broad Pebbled Dark Leathery Rhinarium Nose Pad & Clean Deep Comma Nostrils
    _build_sloth_rhinarium(head_bone, pitch_q, mats)

    # 3. Expressive Soulful Burnt-Amber Mammalian Eyes + Dark Wrinkled Fleshy Eyelids!
    for side in (-1, 1):
        s_tag = "L" if side > 0 else "R"
        eye_center = pitch_q @ Vector((0.378, side * 0.286, 0.184))
        eye_grp = create_bone_node(f"Sloth_EyeSocket_{s_tag}", eye_center, parent=head_bone)
        eye_grp.rotation_euler = (-side * 0.04, 0.08, -side * 0.28)

        eye_r = 0.052
        # Deep dark orbital backing shadow
        bm_sh = bmesh.new()
        bmesh.ops.create_uvsphere(bm_sh, u_segments=14, v_segments=12, radius=eye_r * 1.18)
        sh_obj = attach_mesh_obj(bm_sh, f"Sloth_OrbitShadow_{s_tag}", mat=mats["pupil"], parent=eye_grp, local_pos=(0.0, -side * 0.016, 0.0))
        sh_obj.scale = (1.08, 0.62, 0.94)

        # Deep soulful chestnut-amber mammalian iris eyeball
        bm_ir = bmesh.new()
        uv_ir = bm_ir.loops.layers.uv.new("UVMap")
        bmesh.ops.create_uvsphere(bm_ir, u_segments=24, v_segments=18, radius=eye_r)
        for f in bm_ir.faces:
            for lp in f.loops:
                co = lp.vert.co / eye_r
                lp[uv_ir].uv = (0.5 + co.x * 0.46, 0.5 + co.z * 0.46)
        bmesh.ops.recalc_face_normals(bm_ir, faces=bm_ir.faces)
        ir_obj = attach_mesh_obj(bm_ir, f"Sloth_Eye_{s_tag}", mat=mats["iris"], parent=eye_grp, local_pos=(0.0, side * 0.008, 0.0))
        ir_obj.scale = (1.02, 0.86, 1.00)

        # Round dark mammalian pupil
        bm_pu = bmesh.new()
        bmesh.ops.create_uvsphere(bm_pu, u_segments=16, v_segments=12, radius=eye_r * 0.48)
        pu_obj = attach_mesh_obj(bm_pu, f"Sloth_Eye_{s_tag}_Pupil", mat=mats["pupil"], parent=eye_grp, local_pos=(0.003, side * eye_r * 0.90, 0.0))
        pu_obj.scale = (0.84, 0.44, 0.86)

        # Crisp specular catchlight
        bm_cl = bmesh.new()
        bmesh.ops.create_uvsphere(bm_cl, u_segments=8, v_segments=8, radius=eye_r * 0.14)
        attach_mesh_obj(bm_cl, f"Sloth_EyeCatchlight_{s_tag}", mat=mats["catchlight"], parent=eye_grp, local_pos=(0.014, side * eye_r * 1.02, 0.014))

        # Tight dark espresso fleshy almond eyelids + outer furry orbital fold (exact portrait match!)
        uv_v_eye = 0.20 if side > 0 else 0.80
        _build_curved_eyelid_arc(f"Sloth_UpperEyelid_{s_tag}", 0.066, 0.032, 0.039, 0.016, True,  side, mats["eyelid"], eye_grp, 0.45, uv_v_eye)
        _build_curved_eyelid_arc(f"Sloth_LowerEyelid_{s_tag}", 0.063, 0.031, 0.038, 0.014, False, side, mats["eyelid"], eye_grp, 0.45, uv_v_eye)
        _build_curved_eyelid_arc(f"Sloth_OuterFoldTop_{s_tag}", 0.086, 0.050, 0.028, 0.016, True,  side, mats["cranium"], eye_grp, 0.45, uv_v_eye)
        _build_curved_eyelid_arc(f"Sloth_OuterFoldBot_{s_tag}", 0.082, 0.048, 0.028, 0.014, False, side, mats["cranium"], eye_grp, 0.45, uv_v_eye)

    # 4. Small Thick Rounded Cup-Shaped Mammalian Ears (exact portrait placement, ZERO inner poke-through!)
    for side in (-1, 1):
        _build_sloth_ear(
            f"Sloth_Ear_{side}", side, mats["cranium"], mats["ear_inner"],
            head_bone, pitch_q @ Vector((-0.02, side * 0.340, 0.268)),
        )

    # 5. Subtle Fine Warm-Brown 3D Tactile Muzzle Whiskers (portrait backlit detail!)
    whiskers = []
    for side in (-1, 1):
        for wx, wy, wz, wlen in (
            (0.74, 0.200, -0.024, 0.13), (0.71, 0.215, -0.042, 0.15),
            (0.67, 0.228, -0.056, 0.14), (0.76, 0.185, -0.006, 0.11),
            (0.65, 0.230, -0.034, 0.13),
        ):
            p = pitch_q @ Vector((wx, side * (wy - 0.014), wz))
            d = Vector((-0.34, side * 0.90, -0.22))
            whiskers.append((p, d, wlen))
    _build_sparse_3d_hairs("Sloth_MuzzleWhiskers", whiskers, mats["whisker"], head_bone, radius=0.0014)

    # 6. Wet Upper Gum Cushion & Hypsodont Herbivore Cheek Teeth (cleanly tucked inside lips at rest!)
    for side in (-1, 1):
        _build_muscular_limb_segment(
            f"Sloth_UpperGum_{side}",
            pitch_q @ Vector((0.34, side * 0.126, -0.056)),
            pitch_q @ Vector((0.64, side * 0.108, -0.054)),
            lambda t, ang: (0.026, 0.022, 0.0, 0.0),
            mats["mucosa"], head_bone,
            prox_overlap=0.12, dist_overlap=0.12, radial_segs=10, height_segs=8,
        )
        for ti, (tx, ty) in enumerate(((0.38, 0.128), (0.45, 0.124), (0.52, 0.118), (0.59, 0.108))):
            _build_herbivore_peg_tooth(
                f"Sloth_UpperTooth_{side}_{ti}", rx=0.020, ry=0.015, length=0.038,
                is_upper=True, mat=mats["tooth"], parent=head_bone,
                local_pos=pitch_q @ Vector((tx, side * ty, -0.062)),
                local_rot=(0.0, 0.12, 0.0),
            )

    # 7. Articulated Heavy Megatherium Lower Mandible (snugly closed stoic mouth, tucked cleanly inside cheeks!)
    jaw_q = Euler((0.0, 0.10, 0.0), "XYZ").to_matrix().to_4x4()
    m_slices = [
        (-0.28,  0.06, -0.10, 0.003),  # Closed deep posterior ramus inside shaggy throat
        (-0.08,  0.12, -0.18, 0.285),  # Broad shaggy mandibular angle tucked cleanly inside cheeks!
        ( 0.12,  0.10, -0.19, 0.255),  # Deep heavy Megatherium jaw body (never pokes through lower orbit!)
        ( 0.32,  0.08, -0.17, 0.222),  # Thick chin musculature
        ( 0.50,  0.07, -0.13, 0.194),  # Rounded thick lower lip meeting upper lip cleanly
        ( 0.66,  0.06, -0.09, 0.156),  # Full blunt anterior lower lip margin flush under snout tip!
        ( 0.72,  0.02, -0.04, 0.003),  # Closed solid front chin cap
    ]
    m_bot = CatmullRomSpline3D([(s[0], s[3], s[2]) for s in m_slices])
    m_top = CatmullRomSpline3D([(s[0], s[3], s[1]) for s in m_slices])

    m_rv, m_ruv = [], []
    for iy in range(41):
        v = iy / 40.0
        pb, _ = m_bot.eval_at(v)
        pt, _ = m_top.eval_at(v)
        hw = max(0.001, pb.y)
        row_v, row_uv = [], []
        for ix in range(38):
            u = ix / 38.0
            a = u * math.pi * 2.0
            s, c = math.sin(a), math.cos(a)
            sign_s = 1.0 if s >= 0.0 else -1.0
            ly = sign_s * (abs(s) ** 0.84) * hw
            if c <= 0.0:
                lz = pb.z * (abs(c) ** 0.76)
            else:
                rim = abs(s) ** 1.40
                lz = pt.z * rim + (pt.z - 0.042 * math.sin(v * math.pi)) * (1.0 - rim)
            row_v.append(jaw_q @ Vector((pb.x, ly, lz)))
            row_uv.append((0.18 + v * 0.78, (u + 0.5) % 1.0))
        m_rv.append(row_v)
        m_ruv.append(row_uv)

    bm_mand = _build_grid_bmesh(m_rv, m_ruv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=1)
    attach_mesh_obj(bm_mand, "Sloth_Mandible", mat=mats["cranium"], parent=jaw_bone)

    # Lower cheek teeth, wet gums & muscular grooved prehensile sloth tongue (revealed when Bone_Jaw opens!)
    for side in (-1, 1):
        for ti, (tx, ty) in enumerate(((0.24, 0.130), (0.32, 0.126), (0.40, 0.120), (0.48, 0.110))):
            _build_herbivore_peg_tooth(
                f"Sloth_LowerTooth_{side}_{ti}", rx=0.020, ry=0.015, length=0.038,
                is_upper=False, mat=mats["tooth"], parent=jaw_bone,
                local_pos=jaw_q @ Vector((tx, side * ty, 0.015)),
                local_rot=(0.0, 0.12, 0.0),
            )

    t_rv, t_ruv = [], []
    for iy in range(21):
        v = iy / 20.0
        tx = 0.04 + v * 0.50
        tz = 0.002 + math.sin(v * math.pi * 0.88) * 0.026
        tw = 0.086 * (math.sin(v * math.pi) ** 0.58)
        th = 0.026 * (math.sin(v * math.pi) ** 0.58)
        rv, ruv = [], []
        for ix in range(18):
            u = ix / 18.0
            a = u * math.pi * 2.0
            sulcus = -0.010 * math.exp(-((math.sin(a) / 0.30) ** 2)) * max(0.0, math.cos(a)) * math.sin(v * math.pi)
            rv.append(jaw_q @ Vector((tx, math.sin(a) * tw, tz + math.cos(a) * th + sulcus)))
            ruv.append((u, v))
        t_rv.append(rv)
        t_ruv.append(ruv)
    bm_tng = _build_grid_bmesh(t_rv, t_ruv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_tng, "Sloth_Tongue", mat=mats["mucosa"], parent=jaw_bone)

    for side in (-1, 1):
        p_lo = jaw_q @ Vector((0.12, side * 0.165, -0.01))
        p_hi = Vector((0.10, side * 0.175, 0.10))
        _build_muscular_limb_segment(
            f"Sloth_JawAdductor_{side}", p_lo, p_hi,
            lambda t, ang: (0.028, 0.068, 0.0, 0.0),
            mats["mucosa"], jaw_bone,
            prox_overlap=0.18, dist_overlap=0.18, radial_segs=12, height_segs=10,
        )


# ------------------------------------------------------------------------------
# 3. COLOSSAL CURVED DARK-HORN SICKLE CLAWS (ICONIC MEGATHERIUM WEAPONS!)
# ------------------------------------------------------------------------------

def _build_sickle_claw(
    name,
    length,
    base_ry,
    base_rz,
    forward_dir,
    hook_dir,
    hook_strength,
    mat,
    parent,
    local_pos,
    segs_u=18,
    segs_v=18,
    min_z=None,
):
    """Sculpts a museum-grade, laterally-compressed, deeply curved Megatherium sickle claw."""
    fwd = Vector(forward_dir).normalized()
    hk = Vector(hook_dir)
    hk = (hk - fwd * hk.dot(fwd)).normalized()
    lat = fwd.cross(hk).normalized()

    pts = []
    n_ctrl = 7
    for i in range(n_ctrl):
        t = i / (n_ctrl - 1)
        ang = t * hook_strength
        step_f = length * (0.24 * t + 0.76 * (math.sin(ang) / max(1e-4, hook_strength)))
        step_h = length * (0.82 * ((1.0 - math.cos(ang)) / max(1e-4, hook_strength)))
        pts.append(fwd * step_f + hk * step_h)

    spline = CatmullRomSpline3D([(p.x, p.y, p.z) for p in pts])
    rings_v, rings_uv = [], []

    for iv in range(segs_v + 1):
        v = iv / segs_v
        c_pt, _ = spline.eval_at(v)
        tan = spline.tangent_at(v)
        dorsal_ax = (lat.cross(tan)).normalized()
        if dorsal_ax.dot(-hk) < 0.0:
            dorsal_ax = -dorsal_ax

        if iv == segs_v:
            ry = 0.0018
            rz = 0.0022
        else:
            taper_h = max(0.02, (1.0 - (v ** 1.48)))
            taper_w = max(0.015, (1.0 - (v ** 1.32)))
            root_flare = 1.0 + 0.14 * math.exp(-((v / 0.12) ** 2))
            ry = base_ry * taper_w * root_flare
            rz = base_rz * taper_h * root_flare

        row_v, row_uv = [], []
        for iu in range(segs_u):
            u = iu / segs_u
            a = u * math.pi * 2.0
            ca = math.cos(a)
            sa = math.sin(a)

            if ca >= 0.0:
                lat_mod = 1.0 - 0.15 * (ca ** 2)
                dors_mod = 1.0 + 0.12 * (ca ** 3)
            else:
                lat_mod = 1.0 - 0.58 * ((-ca) ** 1.4)
                dors_mod = 1.0 + 0.18 * ((-ca) ** 3)

            flute = 1.0 - 0.07 * (abs(sa) ** 1.8) * math.sin(v * math.pi)
            pt = c_pt + lat * (sa * ry * lat_mod * flute) + dorsal_ax * (ca * rz * dors_mod)
            if min_z is not None and (local_pos[2] + pt.z) < min_z:
                pt.z = min_z - local_pos[2]
            row_v.append(pt)
            row_uv.append((u, v))

        rings_v.append(row_v)
        rings_uv.append(row_uv)

    bm = _build_grid_bmesh(rings_v, rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    return attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=local_pos, subdiv=0)


# ------------------------------------------------------------------------------
# 4. SEAMLESS SHAGGY LIMB TUBE BUILDER (WITH INTEGRATED SOFT SHAGGY FUR DRAPE!)
# ------------------------------------------------------------------------------

def _build_sloth_limb_tube(
    name,
    ctrl_tuples,
    side,
    mat,
    parent,
    radial_segs=36,
    height_segs=52,
    v_uv_range=(0.24, 0.84),
    taper_start=True,
    taper_end=False,
    ground_z=None,
    shag_amp=0.022,
    posterior_fringe_amp=0.0,
):
    """Lofts a single continuous, seamless shaggy Megatherium limb along a Catmull-Rom spline."""
    spline = CatmullRomSpline3D(ctrl_tuples)
    rings_v, rings_uv = [], []
    prev_tangent = None
    lat_axis = None

    outer_ang = math.pi * 0.5 if side > 0 else -math.pi * 0.5

    for iy in range(height_segs + 1):
        v = iy / height_segs
        cap_scale = 1.0
        if taper_start and v < 0.20:
            cap_scale = max(0.02, math.sin((v / 0.20) * (math.pi * 0.5)) ** 0.85)
        elif taper_end and v > 0.90:
            cap_scale = max(0.02, math.sin(((1.0 - v) / 0.10) * (math.pi * 0.5)) ** 0.85)
        elif ground_z is not None and iy == height_segs:
            cap_scale = 0.88

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
        if sag_axis.x + sag_axis.z * 0.5 < 0.0:
            sag_axis = -sag_axis
        prev_tangent = tangent.copy()

        v_uv = v_uv_range[0] + v * (v_uv_range[1] - v_uv_range[0])
        shag_env = math.sin(v * math.pi) * cap_scale
        fringe_env = _sstep(0.24, 0.42, v) * (1.0 - _sstep(0.76, 0.90, v)) * cap_scale

        row_v, row_uv = [], []
        for ix in range(radial_segs):
            u = ix / radial_segs
            ang = outer_ang + u * math.pi * 2.0
            sin_a = math.sin(ang)
            cos_a = math.cos(ang)

            fur_ripple = 1.0 + shag_amp * shag_env * (
                0.65 * math.sin(ang * 9.0 + v * 16.0) + 0.35 * math.cos(ang * 14.0 - v * 26.0)
            )
            pt = c_pt + lat_axis * (sin_a * ry * fur_ripple) + sag_axis * (cos_a * rz * fur_ripple + sag_off)

            if posterior_fringe_amp > 0.0 and fringe_env > 0.001 and cos_a < -0.25:
                back_focus = ((-cos_a - 0.25) / 0.75) ** 1.45
                scallop = 0.78 + 0.22 * math.sin(v * math.pi * 16.0) * (0.7 + 0.3 * math.cos(ang * 6.0))
                drape = posterior_fringe_amp * fringe_env * back_focus * scallop
                pt += Vector((-drape * 0.42, side * drape * 0.14, -drape * 0.96))

            if ground_z is not None and pt.z < ground_z:
                pt.z = ground_z
            row_v.append(pt)
            # Non-mirrored continuous dark-coat UV: u=0/1 outer flank -> u=0.25 front (0.28) ->
            # u=0.50 hidden inner side (0.0/1.0) -> u=0.75 back (0.72) -> zero mirrored spots & zero ruff bleed!
            if u <= 0.5:
                u_tex = 0.28 * math.sin(u * math.pi * 2.0)
            else:
                u_tex = 1.0 - 0.28 * math.sin((u - 0.5) * math.pi * 2.0)
            row_uv.append((u_tex % 1.0, v_uv))

        rings_v.append(row_v)
        rings_uv.append(row_uv)

    bm = _build_grid_bmesh_seamless(rings_v, rings_uv, close_u=True, cap_start=True, cap_end=True, wrap_uv_seam=False)
    return attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=(0.0, 0.0, 0.0), subdiv=0)


# ------------------------------------------------------------------------------
# 5. HERCULEAN FORELIMB, BROAD SHAGGY HAND & 3 COLOSSAL SICKLE CLAWS
# ------------------------------------------------------------------------------

def _build_sloth_forelimb(arm_bone, side, mats, idx):
    """
    Sculpts Megatherium's Herculean grappling forelimb (Bone_Arm0 right, Bone_Arm1 left):
      - Smooth gradual scapular/deltoid blend deep inside thorax
      - Massive upper arm & heavy forearm with continuous organic shaggy fur drapery
      - Wide, muscular shaggy Megatherium manus (hand arch) seamlessly hosting 3 chunky
        hairy fingers, dark espresso ungual cuticle collars, and 3 colossal curved
        dark charcoal-obsidian sickle claws (matching assets/portraits/giantsloth.png!)
    """
    arm_ctrl = [
        (-0.22, -side * 0.58,  0.52, 0.25, 0.33,  0.00),  # 0: Deep gradual scapular blend inside thorax
        (-0.06, -side * 0.20,  0.16, 0.35, 0.41,  0.00),  # 1: Broad shaggy deltoid shoulder swell
        ( 0.05,  side * 0.07, -0.28, 0.31, 0.35, -0.01),  # 2: Massive biceps/triceps upper arm
        ( 0.15,  side * 0.13, -0.66, 0.28, 0.30, -0.02),  # 3: Heavy muscular Megatherium elbow
        ( 0.46,  side * 0.09, -0.95, 0.27, 0.28,  0.01),  # 4: Gigantic forearm flexor belly
        ( 0.74,  side * 0.03, -1.14, 0.25, 0.22,  0.01),  # 5: Broad thick shaggy wrist
        ( 0.96, -side * 0.01, -1.23, 0.29, 0.18,  0.00),  # 6: Broad wide shaggy arched manus/hand!
        ( 1.07, -side * 0.02, -1.32, 0.18, 0.12,  0.00),  # 7: Terminal knuckle core tucked cleanly inside fingers!
    ]
    _build_sloth_limb_tube(
        f"Sloth_Arm_{idx}", arm_ctrl, side, mats["hide"], arm_bone,
        radial_segs=36, height_segs=52, v_uv_range=(0.24, 0.84),
        taper_start=True, taper_end=True, shag_amp=0.026,
        posterior_fringe_amp=0.145,
    )

    # Broad dark weathered leathery palm / pedolateral knuckle heel pad on underside of hand
    bm_palm = bmesh.new()
    bmesh.ops.create_uvsphere(bm_palm, u_segments=18, v_segments=12, radius=0.160)
    palm_obj = attach_mesh_obj(bm_palm, f"Sloth_PalmPad_{idx}", mat=mats["leather"], parent=arm_bone, local_pos=(0.91, -side * 0.03, -1.31))
    palm_obj.scale = (1.16, 1.32, 0.44)
    palm_obj.rotation_euler = (side * 0.22, 0.36, -side * 0.15)

    # 3 Broadly Spaced Chunky Hairy Fingers + Dark Espresso Cuticle Collars + 3 COLOSSAL Sickle Claws!
    finger_specs = [
        ("Inner",  -side * 0.145,  0.00,  0.00, 0.21, 0.094, 0.49, 0.036, 0.066, 1.18, -side * 0.20),  # Digit II
        ("Center", -side * 0.008,  0.04,  0.01, 0.23, 0.106, 0.59, 0.042, 0.078, 1.24, -side * 0.14),  # Digit III (HUGE!)
        ("Outer",   side * 0.132, -0.02,  0.00, 0.19, 0.086, 0.42, 0.032, 0.058, 1.12, -side * 0.06),  # Digit IV
    ]
    hand_base = Vector((0.89, -side * 0.02, -1.21))
    for tag, dy, dx, dz, f_len, f_rad, c_len, c_ry, c_rz, hook_rad, in_yaw in finger_specs:
        f_start = hand_base + Vector((dx - 0.05, dy * 0.78, dz + 0.02))
        f_dir = Vector((0.76, in_yaw * 0.48, -0.64)).normalized()
        f_end = f_start + f_dir * f_len

        _build_muscular_limb_segment(
            f"Sloth_Finger_{idx}_{tag}", f_start, f_end,
            lambda t, a, r=f_rad: (r * (1.0 - 0.26 * t) * 1.02, r * (1.0 - 0.26 * t) * 1.10, 0.0, 0.0),
            mats["hide"], arm_bone,
            prox_overlap=0.56, dist_overlap=0.14, radial_segs=16, height_segs=10,
            v_uv_range=(0.18, 0.34),
        )

        # Dark charcoal-espresso ungual cuticle collar hugging the claw root seamlessly!
        sheath_start = f_end - f_dir * 0.022
        sheath_end = f_end + f_dir * 0.032
        _build_muscular_limb_segment(
            f"Sloth_ClawSheath_{idx}_{tag}", sheath_start, sheath_end,
            lambda t, a, r=f_rad * 0.74: (r * (1.0 - 0.24 * t), r * 1.12 * (1.0 - 0.24 * t), 0.0, 0.0),
            mats["claw_sheath"], arm_bone,
            prox_overlap=0.22, dist_overlap=0.08, radial_segs=14, height_segs=8,
        )

        claw_fwd = Vector((0.68, in_yaw * 0.70, -0.72)).normalized()
        claw_hook = Vector((-0.66, -side * 0.38, -0.64)).normalized()
        _build_sickle_claw(
            f"Sloth_ArmClaw_{idx}_{tag}",
            length=c_len,
            base_ry=c_ry,
            base_rz=c_rz,
            forward_dir=claw_fwd,
            hook_dir=claw_hook,
            hook_strength=hook_rad,
            mat=mats["claw"],
            parent=arm_bone,
            local_pos=f_end + f_dir * 0.010,
            segs_u=18,
            segs_v=18,
        )


# ------------------------------------------------------------------------------
# 6. MASSIVE COLUMNAR PEDOLATERAL HINDLIMB & GROUNDED 3-CLAWED FOOT (Z = 0.000)
# ------------------------------------------------------------------------------

def _build_sloth_hindlimb(leg_bone, side, local_ground_z, mats, idx):
    """Sculpts Megatherium's towering columnar pedolateral hindlimb resting flat at Z = 0.000."""
    leg_ctrl = [
        ( 0.02, -side * 0.60,  0.64, 0.30, 0.44,  0.00),  # 0: Deep gradual iliac blend inside pear pelvis
        ( 0.06, -side * 0.16,  0.10, 0.42, 0.52,  0.02),  # 1: Colossal gluteal/quadriceps thigh swell
        ( 0.21,  side * 0.03, -0.64, 0.32, 0.37,  0.02),  # 2: Broad powerful flexed Megatherium knee
        ( 0.09,  side * 0.05, -1.24, 0.28, 0.31, -0.01),  # 3: Heavy pillar-like calf
        ( 0.06,  side * 0.05, local_ground_z + 0.32, 0.27, 0.29, 0.00),  # 4: Thick sturdy pedolateral ankle
        ( 0.10,  side * 0.05, local_ground_z + 0.14, 0.30, 0.33, 0.00),  # 5: Flared plantigrade heel cushion
        ( 0.10,  side * 0.05, local_ground_z,        0.28, 0.31, 0.00),  # 6: Flat grounded sole at Z = 0.000!
    ]
    _build_sloth_limb_tube(
        f"Sloth_Hindleg_{idx}", leg_ctrl, side, mats["hide"], leg_bone,
        radial_segs=34, height_segs=52, v_uv_range=(0.14, 0.72),
        taper_start=True, taper_end=False, ground_z=local_ground_z, shag_amp=0.022,
        posterior_fringe_amp=0.048,
    )

    foot_px = 0.25
    foot_py = side * 0.05
    f_rx, f_ry, f_h = 0.32, 0.27, 0.205
    f_rv, f_ruv = [], []
    for iv in range(15):
        v = iv / 14.0
        phi = (v - 0.5) * math.pi
        c_phi, s_phi = math.cos(phi), math.sin(phi)
        rv, ruv = [], []
        for iu in range(24):
            u = iu / 24.0
            a = u * math.pi * 2.0
            lx = foot_px + math.cos(a) * f_rx * c_phi
            ly = foot_py + math.sin(a) * f_ry * c_phi
            if s_phi >= 0.0:
                lz = local_ground_z + f_h * 0.22 + (s_phi ** 0.78) * (f_h * 0.88)
            else:
                lz = local_ground_z + f_h * 0.22 * (1.0 + s_phi * 0.99)
            if lz < local_ground_z:
                lz = local_ground_z
            rv.append(Vector((lx, ly, lz)))
            u_tex = 0.04 + 0.22 * (0.5 + 0.5 * math.cos(a))
            ruv.append((u_tex, 0.10 + 0.24 * v))
        f_rv.append(rv)
        f_ruv.append(ruv)
    bm_foot = _build_grid_bmesh_seamless(f_rv, f_ruv, close_u=True, cap_start=True, cap_end=True, wrap_uv_seam=False)
    attach_mesh_obj(bm_foot, f"Sloth_FootArch_{idx}", mat=mats["hide"], parent=leg_bone)

    bm_sole = bmesh.new()
    bmesh.ops.create_uvsphere(bm_sole, u_segments=20, v_segments=10, radius=1.0)
    for vtx in bm_sole.verts:
        vtx.co.x = foot_px - 0.04 + vtx.co.x * 0.34
        vtx.co.y = foot_py + vtx.co.y * 0.262
        vtx.co.z = max(local_ground_z, local_ground_z + 0.036 + vtx.co.z * 0.038)
    bmesh.ops.recalc_face_normals(bm_sole, faces=bm_sole.faces)
    attach_mesh_obj(bm_sole, f"Sloth_FootSole_{idx}", mat=mats["leather"], parent=leg_bone)

    toe_specs = [
        ("Inner",  -side * 0.24, -side * 0.132, 0.14, 0.072, 0.25, 0.034, 0.052, 0.62),
        ("Center",  0.00,         0.000,        0.17, 0.084, 0.33, 0.042, 0.064, 0.68),
        ("Outer",   side * 0.26,  side * 0.132, 0.13, 0.066, 0.22, 0.030, 0.046, 0.56),
    ]
    for tag, yaw, y_off, t_len, t_rad, c_len, c_ry, c_rz, hook_rad in toe_specs:
        t_start = Vector((foot_px + 0.14, foot_py + y_off * 0.85, local_ground_z + t_rad * 1.12))
        t_dir = Vector((math.cos(yaw), math.sin(yaw), -0.06)).normalized()
        t_end = t_start + t_dir * t_len
        _build_muscular_limb_segment(
            f"Sloth_HindToe_{idx}_{tag}", t_start, t_end,
            lambda t, a, r=t_rad: (r * (1.0 - 0.14 * t) * 1.04, r * (1.0 - 0.14 * t) * 0.88, 0.0, 0.0),
            mats["hide"], leg_bone,
            prox_overlap=0.38, dist_overlap=0.10, radial_segs=14, height_segs=8,
            v_uv_range=(0.12, 0.26),
        )
        c_fwd = Vector((math.cos(yaw) * 0.96, math.sin(yaw) * 0.96, -0.18)).normalized()
        c_hk  = Vector((0.0, 0.0, -1.0))
        _build_sickle_claw(
            f"Sloth_FootClaw_{idx}_{tag}",
            length=c_len,
            base_ry=c_ry,
            base_rz=c_rz,
            forward_dir=c_fwd,
            hook_dir=c_hk,
            hook_strength=hook_rad,
            mat=mats["claw"],
            parent=leg_bone,
            local_pos=t_end + Vector((0.0, 0.0, 0.014)),
            segs_u=14,
            segs_v=14,
            min_z=local_ground_z + 0.008,
        )


# ------------------------------------------------------------------------------
# 7. MAIN BUILDER, STUDIO VERIFICATION RENDERER & GLB EXPORTER
# ------------------------------------------------------------------------------

def build_giantsloth_high_definition():
    clear_scene()

    # NOTE: Blender Principled BSDF base_color expects LINEAR RGB (not sRGB!)
    mats = {
        "hide": make_pbr_normal_mat(
            "Mat_BodyPrimary",
            base_color=(1.0, 1.0, 1.0, 1.0),
            roughness=0.88,
            metallic=0.0,
            albedo_path=_tex("giantsloth_albedo.png"),
            normal_path=_tex("giantsloth_normal.png"),
            normal_strength=0.92,
        ),
        "cranium": make_pbr_normal_mat(
            "Mat_BodyPrimary_Skull",
            base_color=(1.0, 1.0, 1.0, 1.0),
            roughness=0.84,
            metallic=0.0,
            albedo_path=_tex("giantsloth_cranium_albedo.png"),
            normal_path=_tex("giantsloth_cranium_normal.png"),
            normal_strength=0.86,
        ),
        "nose": make_pbr_normal_mat(
            "SlothRhinariumMat",
            base_color=(1.0, 1.0, 1.0, 1.0),
            roughness=0.38,
            metallic=0.01,
            albedo_path=_tex("giantsloth_nose_albedo.png"),
            normal_path=_tex("giantsloth_nose_normal.png"),
            normal_strength=0.85,
        ),
        "leather": make_pbr_normal_mat(
            "Mat_Secondary",
            base_color=(0.032, 0.022, 0.017, 1.0),
            roughness=0.64,
            metallic=0.01,
            albedo_path=_tex("giantsloth_nose_albedo.png"),
            normal_path=_tex("giantsloth_nose_normal.png"),
            normal_strength=0.52,
        ),
        "claw_sheath": make_pbr_normal_mat(
            "SlothClawSheathMat",
            base_color=(0.026, 0.017, 0.012, 1.0),  # Linear dark charcoal-espresso cuticle!
            roughness=0.62,
            metallic=0.01,
            normal_path=_tex("giantsloth_nose_normal.png"),
            normal_strength=0.38,
        ),
        "eyelid": make_pbr_normal_mat(
            "SlothEyelidMat",
            base_color=(0.030, 0.017, 0.010, 1.0),  # Linear dark espresso fleshy eyelid!
            roughness=0.58,
            metallic=0.0,
            normal_path=_tex("giantsloth_cranium_normal.png"),
            normal_strength=0.45,
        ),
        "ear_inner": make_pbr_material(
            "SlothEarInnerMat",
            base_color=(0.024, 0.013, 0.010, 1.0),  # Linear dark inner pinna!
            roughness=0.68,
            metallic=0.0,
        ),
        "whisker": make_pbr_material(
            "SlothWhiskerMat",
            base_color=(0.24, 0.16, 0.10, 1.0),     # Subtle warm taupe-brown tactile whiskers!
            roughness=0.58,
            metallic=0.0,
        ),
        "claw": make_pbr_normal_mat(
            "Mat_Accent",
            base_color=(1.0, 1.0, 1.0, 1.0),
            roughness=0.28,
            metallic=0.03,
            albedo_path=_tex("giantsloth_claw_albedo.png"),
            normal_path=_tex("giantsloth_claw_normal.png"),
            normal_strength=0.55,
        ),
        "tooth": make_pbr_normal_mat(
            "Mat_Tooth",
            base_color=(1.0, 1.0, 1.0, 1.0),
            roughness=0.28,
            metallic=0.02,
            albedo_path=_tex("giantsloth_tooth_albedo.png"),
            normal_path=_tex("giantsloth_tooth_normal.png"),
            normal_strength=0.22,
        ),
        "mucosa": make_pbr_normal_mat(
            "Mat_OralMucosa",
            base_color=(1.0, 1.0, 1.0, 1.0),
            roughness=0.20,
            metallic=0.02,
            albedo_path=_tex("giantsloth_mucosa_albedo.png"),
            normal_path=_tex("giantsloth_mucosa_normal.png"),
            normal_strength=0.28,
        ),
        "iris": make_pbr_material(
            "Mat_Eye",
            base_color=(1.0, 0.86, 0.68, 1.0),
            roughness=0.08,
            emissive=(0.76, 0.34, 0.05, 1.0),
            emissive_strength=0.22,
            albedo_path=_tex("giantsloth_iris_albedo.png"),
        ),
        "pupil": make_pbr_material(
            "Mat_Pupil",
            base_color=(0.012, 0.010, 0.010, 1.0),
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

    # Exact Canonical Megatherium Rig (Bone_Hips at Z = 1.85, matching megatherium.js animBaseHipsY)
    root  = create_bone_node("Bone_Root",  (0.0, 0.0, 0.0))
    hips  = create_bone_node("Bone_Hips",  (0.0, 0.0, 1.85), parent=root)
    torso = create_bone_node("Bone_Torso", (0.0, 0.0, 0.00), parent=hips)
    neck  = create_bone_node("Bone_Neck",  (0.86, 0.0, 0.88), parent=torso)
    head  = create_bone_node("Bone_Head",  (0.42, 0.0, 0.28), parent=neck)
    jaw   = create_bone_node("Bone_Jaw",   (0.12, 0.0, -0.14), parent=head)

    # Heavy 3-segment blunt-conical tripod tail anchoring upright posture (safely clears ground when rearing!)
    tail0 = create_bone_node("Bone_Tail0", (-0.98, 0.0, -0.20), parent=torso)
    tail1 = create_bone_node("Bone_Tail1", (-0.56, 0.0, -0.38), parent=tail0)
    tail2 = create_bone_node("Bone_Tail2", (-0.52, 0.0, -0.38), parent=tail1)

    # Unified Master Spine Spline (Blunt Tripod Tail Tip -> Colossal Pear Pelvis -> Humped Withers -> Bull Neck)
    spine_ctrl = [
        (-2.54, 0.0, 0.46, 0.004, 0.004),  # 0: Rounded blunt tripod tail tip (clears ground even when rearing back!)
        (-2.40, 0.0, 0.56, 0.148, 0.146),  # 1: Thick blunt distal tripod tail pad
        (-2.06, 0.0, 0.89, 0.264, 0.260),  # 2: Bone_Tail2
        (-1.54, 0.0, 1.27, 0.408, 0.402),  # 3: Bone_Tail1 (heavy tripod beam)
        (-0.98, 0.0, 1.65, 0.580, 0.560),  # 4: Bone_Tail0 (colossal conical tail base)
        (-0.48, 0.0, 1.84, 0.858, 0.862),  # 5: Massive pear-shaped pelvic basin!
        ( 0.04, 0.0, 2.04, 0.842, 0.882),  # 6: Deep heavy barrel gut & lower ribcage
        ( 0.54, 0.0, 2.38, 0.748, 0.788),  # 7: Broad Herculean chest & humped shoulders
        ( 0.86, 0.0, 2.73, 0.562, 0.588),  # 8: Bone_Neck / thick shaggy shoulder mantle & chest ruff
        ( 1.08, 0.0, 2.91, 0.472, 0.468),  # 9: Thick shaggy bull-neck collar
        ( 1.28, 0.0, 3.01, 0.405, 0.390),  # 10: Bone_Head occiput seamlessly joining broad bear-like skull!
        ( 1.46, 0.0, 3.04, 0.004, 0.004),  # 11: Internal skull cap
    ]
    master_spine = CatmullRomSpline3D(spine_ctrl)

    t_j_tail2 = 2.0 / 11.0
    t_j_tail1 = 3.0 / 11.0
    t_j_tail0 = 4.1 / 11.0
    t_j_neck  = 8.0 / 11.0
    overlap   = 0.046

    # Seamless exact-ring-matched spine segments (ZERO shading seam across Tail/Torso/Neck!)
    _build_seamless_spine_segment(
        "Sloth_TailSeg2", master_spine,
        0.0, t_j_tail2 + overlap, None, t_j_tail2,
        (-2.06, 0.0, 0.89), tail2, mats["hide"], segs_u=48, segs_v_mid=16,
    )
    _build_seamless_spine_segment(
        "Sloth_TailSeg1", master_spine,
        t_j_tail2 - overlap, t_j_tail1 + overlap, t_j_tail2, t_j_tail1,
        (-1.54, 0.0, 1.27), tail1, mats["hide"], segs_u=48, segs_v_mid=14,
    )
    _build_seamless_spine_segment(
        "Sloth_TailSeg0", master_spine,
        t_j_tail1 - overlap, t_j_tail0 + overlap, t_j_tail1, t_j_tail0,
        (-0.98, 0.0, 1.65), tail0, mats["hide"], segs_u=48, segs_v_mid=16,
    )
    _build_seamless_spine_segment(
        "Sloth_Torso", master_spine,
        t_j_tail0 - overlap, t_j_neck + overlap, t_j_tail0, t_j_neck,
        (0.0, 0.0, 1.85), torso, mats["hide"], segs_u=48, segs_v_mid=36,
    )
    _build_seamless_spine_segment(
        "Sloth_Neck", master_spine,
        t_j_neck - overlap, 1.0, t_j_neck, None,
        (0.86, 0.0, 2.73), neck, mats["hide"], segs_u=48, segs_v_mid=22,
    )

    # Portrait-faithful Megatherium skull, rhinarium, soulful amber eyes, ears, jaw & whiskers
    _build_giantsloth_skull_and_jaw(head, jaw, mats)

    # 2 Herculean Forelimbs (EXACT side order matching megatherium_*.js: Bone_Arm0 side=-1, Bone_Arm1 side=+1!)
    for idx, side in enumerate((-1, 1)):
        arm_bone = create_bone_node(f"Bone_Arm{idx}", (0.64, side * 0.64, 0.56), parent=torso)
        _build_sloth_forelimb(arm_bone, side, mats, idx)

    # 2 Columnar Pedolateral Hindlimbs grounded cleanly at Z = 0.000 (Bone_Leg0 side=-1, Bone_Leg1 side=+1!)
    for idx, side in enumerate((-1, 1)):
        leg_bone = create_bone_node(f"Bone_Leg{idx}", (-0.28, side * 0.54, 0.00), parent=hips)
        _build_sloth_hindlimb(leg_bone, side, local_ground_z=-1.85, mats=mats, idx=idx)

    out_path = os.path.join(OUT_DIR, "giantsloth.glb")
    export_fighter_glb(out_path)
    return out_path


def render_giantsloth_verification_views(
    prefix="sloth_final",
    shot_dir="/home/niwatorichan/Projects/ExtinctionFighter/.tmp_screenshots",
):
    """Renders 7 studio EEVEE views + 1 dynamic action/roar pose verification view."""
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
        world = bpy.data.worlds.new("SlothStudioWorld")
        bpy.context.scene.world = world
    world.use_nodes = True
    bg = next((n for n in world.node_tree.nodes if n.type == "BACKGROUND"), None)
    if bg:
        bg.inputs[0].default_value = (0.14, 0.16, 0.20, 1.0)
        bg.inputs[1].default_value = 1.18

    center = Vector((-0.10, 0.0, 1.72))

    def add_sun(name, loc, target, energy, color=(1.0, 0.98, 0.94)):
        ldata = bpy.data.lights.new(name=name, type="SUN")
        ldata.energy = energy
        ldata.color = color
        lobj = bpy.data.objects.new(name, ldata)
        bpy.context.collection.objects.link(lobj)
        lobj.location = Vector(loc)
        lobj.rotation_euler = (Vector(target) - lobj.location).to_track_quat("-Z", "Y").to_euler()
        temp_objs.append(lobj)

    add_sun("_StudioKey", center + Vector((5.0, -6.0, 6.2)), center, 3.8, (1.0, 0.95, 0.88))
    add_sun("_StudioFill", center + Vector((-4.5, 5.5, 3.8)), center, 1.7, (0.78, 0.89, 1.0))
    add_sun("_StudioRim", center + Vector((-5.5, -2.5, 5.0)), center, 2.4, (1.0, 0.86, 0.68))

    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=10.0, depth=0.05, location=(-0.10, 0.0, -0.025))
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
        ("side",         Vector((-0.10, -8.2, 1.80)), Vector((-0.10, 0.0, 1.72)), 48.0),
        ("hero_3q",      Vector((4.6,   -6.2, 2.55)), Vector((0.05,  0.0, 1.76)), 46.0),
        ("front_3q",     Vector((5.4,   -2.4, 2.45)), Vector((0.45,  0.0, 1.85)), 46.0),
        ("rear_3q",      Vector((-5.0,  -5.4, 2.50)), Vector((-0.25, 0.0, 1.65)), 46.0),
        ("head_closeup", Vector((3.20,  -1.45, 3.16)), Vector((1.62, 0.0, 3.04)), 58.0),
        ("hand_closeup", Vector((3.05,  -1.95, 1.25)), Vector((1.60, -0.60, 0.98)), 56.0),
        ("top",          Vector((-0.10, -0.01, 9.2)), Vector((-0.10, 0.0, 1.70)), 46.0),
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

    # Also test dynamic Roar / Claw-Slash action pose (verifies jaw oral cavity, arm swing & zero seam tears!)
    jaw = bpy.data.objects.get("Bone_Jaw")
    arm0 = bpy.data.objects.get("Bone_Arm0")
    arm1 = bpy.data.objects.get("Bone_Arm1")
    torso = bpy.data.objects.get("Bone_Torso")
    if jaw and arm0 and arm1 and torso:
        # In Blender Z-up: +Y rotation pitches +X downward (jaw open = +0.42 rad; arm raise = -0.85 rad!)
        jaw.rotation_euler = (0.0, 0.42, 0.0)
        arm0.rotation_euler = (0.0, -0.85, 0.45)
        arm1.rotation_euler = (0.0, 0.25, -0.40)
        torso.rotation_euler = (0.0, -0.18, 0.22)
        bpy.context.view_layer.update()

        cam_data.lens = 46.0
        cloc = Vector((4.8, -6.2, 2.75))
        target = Vector((0.25, 0.0, 1.95))
        cam_obj.location = cloc
        cam_obj.rotation_euler = (target - cloc).to_track_quat("-Z", "Y").to_euler()
        out_png = os.path.join(shot_dir, f"{prefix}_action_roar.png")
        scene.render.filepath = out_png
        bpy.ops.render.render(write_still=True)
        paths.append(out_png)

        # Restore rest pose!
        jaw.rotation_euler = (0.0, 0.0, 0.0)
        arm0.rotation_euler = (0.0, 0.0, 0.0)
        arm1.rotation_euler = (0.0, 0.0, 0.0)
        torso.rotation_euler = (0.0, 0.0, 0.0)
        bpy.context.view_layer.update()

    for o in temp_objs:
        bpy.data.objects.remove(o, do_unlink=True)
    return paths


if __name__ == "__main__":
    build_giantsloth_high_definition()
