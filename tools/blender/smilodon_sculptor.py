"""
tools/blender/smilodon_sculptor.py
Museum-grade paleontological & portrait-faithful Blender 5.2 builder for the
rebuilt Smilodon fatalis GLB model (assets/models/fighters/smilodon.glb),
built directly on top of the high-definition quadrupedal predator sculptor
architecture in tools/blender/gorgonopsia_sculptor.py!

Anatomical & visual adaptation from Gorgonopsia -> Smilodon fatalis:
  - Shares the continuous Catmull-Rom spine, high-res parametric skull/jaw/oral
    cavity, recessed predator eye rig, seamless multi-joint muscular limbs, and
    canonical Bone_Hips (Z=1.55) quadruped animation contract from gorgonopsia_sculptor.py.
  - Tailored specifically to Smilodon fatalis (matched to assets/portraits/smilodon.png):
      * Bear-like machairodont silhouette: massive elevated scapular shoulder hump,
        deep barrel chest with fluffy snowy-cream chest ruff, compact sloping
        hindquarters, and short muscular 3-segment feline bobtail (Bone_Tail0..2).
      * Shorter, broader domed feline skull with sweeping zygomatic cheekbones,
        fleshy whisker muzzle pads, dark-pink feline rhinarium nose pad, rounded
        low-set furred feline ears, and mandibular chin flanges.
      * Iconic ultra-long, sleek, laterally compressed, backward-curving scimitar
        upper saber canines (clearly longer & sleeker than Gorgonopsia's thicker
        therapsid daggers!) + 6 compact upper incisors & lower canines.
      * Herculean oversized feline forelimbs + spring-loaded digitigrade hindlimbs
        with broad padded 4-toed feline paws & curved ivory claws grounded on Z = 0.
      * 1024x1024 layered directional tawny-ochre & snowy-white tiger-striped PBR fur.

Canonical Extinction Kombat 3D rig contract:
  Bone_Root -> Bone_Hips (Z=1.55) -> Bone_Torso -> Bone_Neck -> Bone_Head -> Bone_Jaw
                                                -> Bone_Tail0 -> Bone_Tail1 -> Bone_Tail2
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
)
from gorgonopsia_sculptor import (
    make_pbr_normal_mat,
    build_quadruped_spine_segment,
    build_quadruped_limb_tube,
    build_saber_tooth_mesh,
    build_predator_eye_assembly,
    build_oral_cavity_and_tongue,
    build_clawed_paw,
    _build_sparse_3d_hairs,
    render_quadruped_verification_views,
)


def _tex(name):
    p = os.path.join(TEX_DIR, name)
    return p if os.path.exists(p) else None


def _eval_smilodon_spine_surface(master_spline, t, theta, cap_scale=1.0):
    """
    Evaluates the muscular bear-like Smilodon fatalis body cross-section at t in [0, 1]
    (0 = bobtail tip, 1 = skull occiput) with smooth C1 envelopes (zero shoulder seam!).
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

    torso_w = _sstep(0.20, 0.30, t) * (1.0 - _sstep(0.70, 0.80, t))
    neck_w  = _sstep(0.70, 0.80, t) * (1.0 - _sstep(0.95, 1.00, t))

    lat_exp = 0.95 - 0.05 * torso_w - 0.03 * neck_w
    y_lat = sign_s * (abs_sin ** lat_exp) * ry

    if cos_t >= 0.0:
        z_vert = (cos_t ** 0.92) * rz
    else:
        v_exp = 0.92 - 0.06 * torso_w
        z_vert = -((-cos_t) ** v_exp) * rz

    # 1. Signature Smilodon Herculean scapular hump & broad furry chest ruff
    scap_env = math.exp(-(((t - 0.65) / 0.115) ** 2))
    if cos_t > 0.05:
        z_vert += 0.120 * rz * scap_env * (cos_t ** 1.15) * cap_scale
    if -0.25 < cos_t < 0.55 and abs_sin > 0.40:
        y_lat += sign_s * 0.100 * ry * scap_env * math.sin(((cos_t + 0.25) / 0.80) * math.pi) * cap_scale
    if cos_t < -0.28:
        ruff_tuft = 1.0 + 0.045 * math.sin(t * math.pi * 30.0)
        z_vert -= 0.115 * rz * scap_env * ((-cos_t - 0.28) / 0.72) * ruff_tuft * cap_scale

    hip_env = math.exp(-(((t - 0.35) / 0.085) ** 2))
    if -0.10 < cos_t < 0.65 and abs_sin > 0.42:
        y_lat += sign_s * 0.075 * ry * hip_env * cap_scale

    # 2. Thick shaggy machairodont neck & cheek/throat ruff (portrait mane!)
    if neck_w > 0.001:
        if cos_t > 0.45:
            mane_wave = 0.65 + 0.35 * math.cos(t * math.pi * 32.0)
            z_vert += 0.085 * rz * ((cos_t - 0.45) / 0.55) * neck_w * mane_wave * cap_scale
        if -0.55 < cos_t < 0.20 and abs_sin > 0.45:
            y_lat += sign_s * 0.095 * ry * neck_w * cap_scale
        if cos_t < -0.30:
            ruff_wave = 1.0 + 0.055 * math.sin(t * math.pi * 26.0) * neck_w
            z_vert *= (1.12 * ruff_wave)

    return c_world + lat_axis * y_lat + up_axis * z_vert


def _build_feline_ear(name, side, mat_outer, mat_inner, parent, local_pos):
    """Sculpts a broad, rounded, fur-textured big-cat tiger ear with tucked pale inner tuft."""
    ear_grp = create_bone_node(name + "_Pivot", local_pos, parent=parent)
    ear_grp.rotation_euler = (-side * 0.44, -0.18, -side * 0.30)

    segs_u = 18
    segs_v = 12
    rings_v = []
    rings_uv = []
    for iv in range(segs_v + 1):
        v = iv / segs_v
        h = v * 0.185
        # Broad semicircular big-cat ear profile (matches smilodon.png portrait!)
        width = 0.120 * math.sin(max(0.08, (1.0 - v * 0.72)) * math.pi * 0.54)
        thick = 0.056 * (1.0 - 0.56 * v)
        if iv == segs_v:
            width = 0.010
            thick = 0.006
        row_v = []
        row_uv = []
        for iu in range(segs_u):
            u = iu / segs_u
            ang = u * math.pi * 2.0
            ca = math.cos(ang)
            sa = math.sin(ang)
            lx = ca * thick - 0.024 * (sa * sa) * math.sin(v * math.pi)
            ly = sa * width
            lz = h
            row_v.append(Vector((lx, ly, lz)))
            # Map outer ear into dark striped dorsal tawny fur band (u in [0.04, 0.22])
            row_uv.append((0.04 + 0.18 * (0.5 + 0.5 * ca), 0.72 + 0.22 * v))
        rings_v.append(row_v)
        rings_uv.append(row_uv)

    bm = _build_grid_bmesh(rings_v, rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm, name, mat=mat_outer, parent=ear_grp)

    # Soft snowy-cream inner ear fur tuft neatly recessed inside the front pinna cup
    bm_in = bmesh.new()
    bmesh.ops.create_uvsphere(bm_in, u_segments=12, v_segments=8, radius=0.048)
    in_obj = attach_mesh_obj(bm_in, name + "_InnerTuft", mat=mat_inner, parent=ear_grp, local_pos=(0.016, 0.0, 0.075))
    in_obj.scale = (0.32, 0.96, 1.12)
    return ear_grp


def _build_smilodon_skull_and_jaw(head_bone, jaw_bone, mats):
    """
    Sculpts the unmistakable Smilodon fatalis machairodont feline skull (64x76)
    adapted from the Gorgonopsia parametric cranium pipeline:
      - Broader domed feline cranium, wide zygomatic cheekbones, shorter blunt cat muzzle
      - Fleshy rounded whisker pads & broad velvety feline rhinarium nose pad at snout tip
      - Broad rounded furred big-cat ears
      - Large fierce forward-facing glowing amber feline eyes under furrowed cat brow
      - Iconic ULTRA-LONG backward-curving scimitar upper saber canines (0.64m!)
        clearing cleanly outside the compact flanged feline mandible
      - 6 compact sharp upper incisors, wet crimson gums, grooved feline tongue & whiskers
    """
    pitch_q = Euler((0.0, 0.06, 0.0), "XYZ").to_matrix().to_4x4()

    # (x, top_z, bot_z, half_w) — broad seamless occiput -> wide domed cat cranium -> blunt big-cat muzzle
    slices = [
        (-0.32, 0.16, -0.10, 0.003),  # 0: Deep closed occipital cap inside shaggy neck
        (-0.10, 0.34, -0.15, 0.350),  # 1: Seamless broad occiput blending into cheek ruff
        ( 0.12, 0.36, -0.13, 0.380),  # 2: Broad domed feline cranium & wide cheeks
        ( 0.30, 0.34, -0.12, 0.355),  # 3: Broad zygomatic arches & forward-facing orbits
        ( 0.46, 0.28, -0.11, 0.275),  # 4: Feline nasal bridge drop (classic big-cat stop!)
        ( 0.62, 0.24, -0.12, 0.252),  # 5: Muscular upper muzzle & whisker pad swell
        ( 0.76, 0.19, -0.10, 0.220),  # 6: Broad feline flews & saber socket
        ( 0.84, 0.13, -0.05, 0.160),  # 7: Blunt feline nose tip / rhinarium socket
        ( 0.87, 0.05,  0.00, 0.003),  # 8: Closed rostral tip flush behind rhinarium
    ]
    top_spline = CatmullRomSpline3D([(s[0], s[3], s[1]) for s in slices])
    bot_spline = CatmullRomSpline3D([(s[0], s[3], s[2]) for s in slices])

    def get_lip_festoon(v):
        # Feline upper lip arch lifting cleanly at the front philtrum & curving over saber sockets
        return (
            -0.026 * math.exp(-(((v - 0.72) / 0.13) ** 2))
            + 0.018 * math.exp(-(((v - 0.92) / 0.08) ** 2))
        )

    radial_steps = 64
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

        brow_profile    = math.exp(-(((v - 0.38) / 0.095) ** 2))
        orbit_profile   = math.exp(-(((v - 0.42) / 0.062) ** 2))
        cheek_profile   = math.exp(-(((v - 0.28) / 0.11) ** 2))
        whisker_profile = math.exp(-(((v - 0.78) / 0.11) ** 2))
        snarl_wrinkle   = math.sin(((v - 0.50) / 0.36) * math.pi) if (0.50 < v < 0.86) else 0.0

        row_v = []
        row_uv = []
        for ix in range(radial_steps):
            u = ix / radial_steps
            angle = u * math.pi * 2.0
            s = math.sin(angle)
            c = math.cos(angle)
            abs_s = abs(s)
            sign_s = 1.0 if s >= 0.0 else -1.0

            # Smooth organic feline rounded cranium & plush whisker-pad muzzle (rounder than Gorgonopsia!)
            snout_t = max(0.0, min(1.0, (v - 0.18) / 0.24))
            ly = sign_s * (abs_s ** 0.86) * half_w
            mid_z = 0.5 * (top_z + bot_z)
            half_h = 0.5 * (top_z - bot_z)
            oval_z = mid_z + c * half_h
            if c >= 0.0:
                snout_z = bot_z + (top_z - bot_z) * (c ** 0.76)
                lz = oval_z * (1.0 - snout_t) + snout_z * snout_t

                # Furrowed fierce feline brow ridges (smoother than Gorgonopsia's bony knobs)
                if brow_profile > 0.01 and 0.28 < c < 0.88:
                    brow_arch = math.sin(((c - 0.28) / 0.60) * math.pi)
                    lz += brow_profile * brow_arch * 0.072
                    ly += sign_s * brow_profile * brow_arch * 0.056

                # Snarling nose-bridge skin wrinkles (exact portrait snarl!)
                if snarl_wrinkle > 0.0 and c > 0.68:
                    wrink = 0.5 + 0.5 * math.cos(v * math.pi * 34.0)
                    lz += (((c - 0.68) / 0.32) ** 1.3) * 0.020 * snarl_wrinkle * wrink
            else:
                rim = abs_s ** 1.60
                palate_z = bot_z * rim + (bot_z + 0.046 * (1.0 - (v - 0.5) ** 2)) * (1.0 - rim)
                lz = oval_z * (1.0 - snout_t) + palate_z * snout_t

            # Wide feline zygomatic cheek ruff & jaw muscle fullness
            if cheek_profile > 0.01 and -0.30 < c < 0.30:
                c_arch = math.sin(((c + 0.30) / 0.60) * math.pi)
                ly += sign_s * cheek_profile * c_arch * 0.042 * snout_t

            # Plush rounded feline whisker / muzzle pads
            if whisker_profile > 0.01 and -0.32 < c < 0.42:
                w_arch = math.sin(((c + 0.32) / 0.74) * math.pi)
                ly += sign_s * whisker_profile * w_arch * 0.068
                lz += whisker_profile * w_arch * 0.012

            # Deep binocular forward-facing feline eye sockets
            if orbit_profile > 0.01 and 0.05 < c < 0.52:
                orb_depth = math.sin(((c - 0.05) / 0.47) * math.pi)
                ly *= (1.0 - 0.32 * orbit_profile * orb_depth)

            pt = pitch_q @ Vector((fx, ly, lz))
            row_v.append(pt)
            row_uv.append((v, u))

        skull_rings_v.append(row_v)
        skull_rings_uv.append(row_uv)

    bm_skull = _build_grid_bmesh(skull_rings_v, skull_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=1)
    attach_mesh_obj(bm_skull, "Smilodon_UpperCranium", mat=mats["cranium"], parent=head_bone)

    # 2. Velvety Feline Rhinarium Nose Pad seated right on blunt snout front with dark nostrils!
    bm_nose = bmesh.new()
    bmesh.ops.create_uvsphere(bm_nose, u_segments=20, v_segments=14, radius=0.072)
    for vtx in bm_nose.verts:
        if vtx.co.z < 0.0:
            vtx.co.y *= (0.54 + 0.46 * (1.0 + vtx.co.z / 0.072))
        if abs(vtx.co.y) < 0.020 and vtx.co.x > 0.0:
            vtx.co.x -= 0.018 * (1.0 - abs(vtx.co.y) / 0.020)
        for s_y in (-1.0, 1.0):
            nd = math.sqrt(((vtx.co.y - s_y * 0.038) / 0.020) ** 2 + ((vtx.co.z - 0.002) / 0.018) ** 2)
            if nd < 1.0 and vtx.co.x > -0.01:
                vtx.co.x -= 0.032 * ((1.0 - nd) ** 1.4)
    bmesh.ops.recalc_face_normals(bm_nose, faces=bm_nose.faces)
    nose_obj = attach_mesh_obj(bm_nose, "Smilodon_Rhinarium", mat=mats["nose"], parent=head_bone, local_pos=pitch_q @ Vector((0.838, 0.0, 0.068)))
    nose_obj.scale = (0.76, 1.38, 0.90)
    # Recessed matte dark feline nostrils (seated flush inside sculpted nose pits)
    for side in (-1, 1):
        bm_sn = bmesh.new()
        bmesh.ops.create_uvsphere(bm_sn, u_segments=10, v_segments=8, radius=0.017)
        sn_obj = attach_mesh_obj(
            bm_sn, f"Smilodon_Nostril_{side}", mat=mats["dark_fur"], parent=head_bone,
            local_pos=pitch_q @ Vector((0.868, side * 0.048, 0.064)),
        )
        sn_obj.scale = (0.38, 0.82, 0.68)

    # 2B. Sleek White Feline Whiskers emerging cleanly from plush whisker pads (portrait signature!)
    whiskers = []
    for side in (-1, 1):
        for wx, wy, wz, wlen in (
            (0.76, 0.215, 0.010, 0.24), (0.74, 0.228, -0.015, 0.28),
            (0.71, 0.236, -0.035, 0.26), (0.78, 0.205, 0.030, 0.21),
            (0.70, 0.235, 0.015, 0.25), (0.67, 0.238, -0.012, 0.24),
        ):
            p = pitch_q @ Vector((wx, side * (wy - 0.015), wz))
            d = Vector((-0.30, side * 0.94, -0.08 + wz * 2.0))
            whiskers.append((p, d, wlen))
    _build_sparse_3d_hairs("Smilodon_Whiskers", whiskers, mats["cream_fur"], head_bone, radius=0.0022)

    # 3. Broad Rounded Furred Big-Cat Ears (portrait signature!)
    for side in (-1, 1):
        _build_feline_ear(
            f"Smilodon_Ear_{side}", side, mats["hide"], mats["cream_fur"],
            head_bone, pitch_q @ Vector((0.06, side * 0.275, 0.242)),
        )

    # 4. Fierce Hooded Golden-Amber Feline Eyes (seated cleanly in deep furrowed orbits!)
    for side in (-1, 1):
        eye_center = pitch_q @ Vector((0.36, side * 0.246, 0.172))
        build_predator_eye_assembly(
            "Smilodon", side, eye_center, (-0.05, 0.05, -side * 0.42),
            radius=0.047, mats=mats, parent=head_bone, slit_pupil=False,
        )

    # 5. Wet Scalloped Upper Gingiva
    gum_rings_v, gum_rings_uv = [], []
    for iy in range(25):
        v = iy / 24.0
        tv = 0.42 + v * 0.46
        p_top, _ = top_spline.eval_at(tv)
        p_bot, _ = bot_spline.eval_at(tv)
        bz = p_bot.z + get_lip_festoon(tv)
        hw = p_top.y * 0.68
        row_v, row_uv = [], []
        for ix in range(18):
            u = ix / 18.0
            ang = u * math.pi * 2.0
            gy = math.sin(ang) * hw
            gz = bz + 0.028 + math.cos(ang) * 0.020
            row_v.append(pitch_q @ Vector((p_top.x, gy, gz)))
            row_uv.append((u, v))
        gum_rings_v.append(row_v)
        gum_rings_uv.append(row_uv)
    bm_ugum = _build_grid_bmesh(gum_rings_v, gum_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_ugum, "Smilodon_UpperGum", mat=mats["gingiva"], parent=head_bone)

    # 6. Upper Dentition:
    #    - 6 sharp compact feline incisors across the upper arc
    for p in range(6):
        py = (p - 2.5) * 0.036
        px = 0.82 - abs(p - 2.5) * 0.012
        build_saber_tooth_mesh(
            f"Smilodon_UpperIncisor_{p}", rx_fore_aft=0.013, ry_lateral=0.011,
            length=0.075, curve_back=0.10, is_upper=True, serrated=False,
            mat=mats["tooth"], parent=head_bone,
            local_pos=pitch_q @ Vector((px, py, -0.068)),
            local_rot=(0.0, 0.08, 0.0), radial_segs=8, height_segs=8,
        )

    #    - ICONIC ULTRA-LONG SCIMITAR UPPER SABER CANINES (0.64m sleek curved blades!)
    for side in (-1, 1):
        saber_pos = pitch_q @ Vector((0.67, side * 0.178, -0.095))
        build_saber_tooth_mesh(
            f"Smilodon_UpperSaber_{side}", rx_fore_aft=0.056, ry_lateral=0.021,
            length=0.64, curve_back=0.25, is_upper=True, serrated=True,
            mat=mats["tooth"], parent=head_bone,
            local_pos=saber_pos, local_rot=(-side * 0.06, 0.07, 0.0),
            radial_segs=18, height_segs=20,
        )
        # Carnassial shearing cheek teeth
        for ti, (tv, t_len, t_rad) in enumerate((
            (0.62, 0.074, 0.016),
            (0.54, 0.068, 0.015),
            (0.47, 0.056, 0.013),
        )):
            p_top, _ = top_spline.eval_at(tv)
            p_bot, _ = bot_spline.eval_at(tv)
            build_saber_tooth_mesh(
                f"Smilodon_UpperCarnassial_{side}_{ti}", rx_fore_aft=t_rad * 1.25, ry_lateral=t_rad * 0.65,
                length=t_len, curve_back=0.08, is_upper=True, serrated=False,
                mat=mats["tooth"], parent=head_bone,
                local_pos=pitch_q @ Vector((p_top.x, side * p_top.y * 0.66, p_bot.z + 0.026)),
                local_rot=(-side * 0.03, 0.05, 0.0), radial_segs=10, height_segs=8,
            )

    # 7. Compact Articulated Feline Mandible with Chin Flanges (parted 0.36 rad roaring snarl!)
    jaw_q = Euler((0.0, 0.36, 0.0), "XYZ").to_matrix().to_4x4()

    # Narrowed cleanly inside the massive scimitar sabers; rear tucked deep inside throat!
    m_slices = [
        (-0.22,  0.04, -0.08, 0.003),
        (-0.06,  0.10, -0.16, 0.25),
        ( 0.14,  0.07, -0.17, 0.23),
        ( 0.32,  0.02, -0.14, 0.18),
        ( 0.50,  0.01, -0.14, 0.140),  # Narrow feline ramus clearing sabers cleanly
        ( 0.66,  0.02, -0.18, 0.132),  # Machairodont mandibular chin flange!
        ( 0.76,  0.02, -0.14, 0.115),
        ( 0.82, -0.01, -0.04, 0.003),
    ]
    m_bot_spline = CatmullRomSpline3D([(s[0], s[3], s[2]) for s in m_slices])
    m_top_spline = CatmullRomSpline3D([(s[0], s[3], s[1]) for s in m_slices])

    mand_rings_v, mand_rings_uv = [], []
    for iy in range(45):
        v = iy / 44.0
        pt_bot, _ = m_bot_spline.eval_at(v)
        pt_top, _ = m_top_spline.eval_at(v)
        half_w = max(0.001, pt_bot.y)
        row_v, row_uv = [], []
        for ix in range(40):
            u = ix / 40.0
            ang = u * math.pi * 2.0
            s, c = math.sin(ang), math.cos(ang)
            sign_s = 1.0 if s >= 0.0 else -1.0
            ly = sign_s * (abs(s) ** 0.78) * half_w
            if c <= 0.0:
                lz = pt_bot.z * (abs(c) ** 0.70)
            else:
                rim = abs(s) ** 1.45
                lz = pt_top.z * rim + (pt_top.z - 0.040 * math.sin(v * math.pi)) * (1.0 - rim)
            row_v.append(jaw_q @ Vector((pt_bot.x, ly, lz)))
            row_uv.append((v, u))
        mand_rings_v.append(row_v)
        mand_rings_uv.append(row_uv)

    bm_mand = _build_grid_bmesh(mand_rings_v, mand_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=1)
    attach_mesh_obj(bm_mand, "Smilodon_Mandible", mat=mats["cranium"], parent=jaw_bone)

    # Lower gums
    lg_rings_v, lg_rings_uv = [], []
    for iy in range(21):
        v = iy / 20.0
        tv = 0.36 + v * 0.48
        pt_top, _ = m_top_spline.eval_at(tv)
        hw = pt_top.y * 0.62
        row_v, row_uv = [], []
        for ix in range(16):
            u = ix / 16.0
            ang = u * math.pi * 2.0
            row_v.append(jaw_q @ Vector((pt_top.x, math.sin(ang) * hw, pt_top.z - 0.014 + math.cos(ang) * 0.016)))
            row_uv.append((u, v))
        lg_rings_v.append(row_v)
        lg_rings_uv.append(row_uv)
    bm_lgum = _build_grid_bmesh(lg_rings_v, lg_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_lgum, "Smilodon_LowerGum", mat=mats["gingiva"], parent=jaw_bone)

    # Lower canines & incisors
    for side in (-1, 1):
        build_saber_tooth_mesh(
            f"Smilodon_LowerCanine_{side}", rx_fore_aft=0.024, ry_lateral=0.016,
            length=0.145, curve_back=0.12, is_upper=False, serrated=False,
            mat=mats["tooth"], parent=jaw_bone,
            local_pos=jaw_q @ Vector((0.63, side * 0.095, 0.002)),
            local_rot=(side * 0.06, 0.32, 0.0), radial_segs=12, height_segs=12,
        )
        for ti, (tv, t_len, t_rad) in enumerate(((0.56, 0.058, 0.013), (0.48, 0.052, 0.012))):
            pt_top, _ = m_top_spline.eval_at(tv)
            build_saber_tooth_mesh(
                f"Smilodon_LowerCheekTooth_{side}_{ti}", rx_fore_aft=t_rad * 1.1, ry_lateral=t_rad * 0.65,
                length=t_len, curve_back=0.08, is_upper=False, serrated=False,
                mat=mats["tooth"], parent=jaw_bone,
                local_pos=jaw_q @ Vector((pt_top.x, side * pt_top.y * 0.62, pt_top.z - 0.010)),
                local_rot=(side * 0.03, 0.28, 0.0), radial_segs=8, height_segs=8,
            )
    for p in range(4):
        py = (p - 1.5) * 0.034
        build_saber_tooth_mesh(
            f"Smilodon_LowerIncisor_{p}", rx_fore_aft=0.011, ry_lateral=0.010,
            length=0.062, curve_back=0.08, is_upper=False, serrated=False,
            mat=mats["tooth"], parent=jaw_bone,
            local_pos=jaw_q @ Vector((0.72 - abs(p - 1.5) * 0.012, py, 0.004)),
            local_rot=(0.0, 0.36, 0.0), radial_segs=8, height_segs=8,
        )

    # Feline tongue & jaw adductors (clean roaring mouth — shared from gorgonopsia_sculptor!)
    build_oral_cavity_and_tongue(
        "Smilodon", jaw_bone, jaw_q, mats,
        tongue_x_range=(0.10, 0.64), tongue_width=0.105, tongue_height=0.038,
        adductor_lo=(0.14, 0.165, -0.01), adductor_hi=(0.12, 0.175, 0.11),
        saliva_specs=None,
    )


def _build_smilodon_forelimb(leg_bone, side, local_ground_z, mats, idx):
    """Herculean oversized machairodont feline forelimb resting cleanly at Z = 0."""
    leg_ctrl = [
        ( 0.02, -side * 0.20,  0.20, 0.26, 0.33,  0.00),  # 0: Massive shoulder socket deep inside thorax
        (-0.08,  side * 0.02, -0.18, 0.26, 0.31, -0.02),  # 1: Huge deltoid & triceps belly
        (-0.14,  side * 0.06, -0.60, 0.20, 0.23, -0.02),  # 2: Deep upright feline elbow
        (-0.02,  side * 0.05, -1.04, 0.18, 0.20,  0.02),  # 3: Overbuilt grappling forearm
        ( 0.05,  side * 0.04, -1.36, 0.145, 0.150, 0.01), # 4: Broad feline wrist
        ( 0.12,  side * 0.04, local_ground_z + 0.050, 0.155, 0.140, 0.00),  # 5: Seamless plush paw bridge
    ]
    build_quadruped_limb_tube(
        f"Smilodon_Foreleg_{idx}", leg_ctrl, mats["hide"], leg_bone,
        radial_segs=28, height_segs=38, v_uv_range=(0.50, 0.88),
        taper_start=True, taper_end=False, dorsal_uv_band=(0.04, 0.28),
    )
    # Broad plush 4-toed feline front paw with curved ivory retractable claws
    toe_specs = [
        ( 0.36,  0.092, 0.19, 0.044, 0.115, 0.022),
        ( 0.12,  0.032, 0.22, 0.048, 0.130, 0.025),
        (-0.12, -0.032, 0.22, 0.048, 0.130, 0.025),
        (-0.36, -0.092, 0.19, 0.044, 0.115, 0.022),
    ]
    build_clawed_paw(
        f"Smilodon_ForePaw_{idx}", leg_bone, (0.17, side * 0.04), local_ground_z,
        toe_specs, paw_rx=0.19, paw_ry=0.18, paw_h=0.115,
        paw_mat=mats["hide"], claw_mat=mats["tooth"], pad_mat=mats["hide"],
        dorsal_uv_band=(0.04, 0.24),
    )


def _build_smilodon_hindlimb(leg_bone, side, local_ground_z, mats, idx):
    """Spring-loaded muscular feline hindlimb (seamless digitigrade hock & 4-toed paw on Z = 0)."""
    leg_ctrl = [
        (-0.04, -side * 0.18,  0.14, 0.24, 0.31,  0.00),  # 0: Hip socket deep inside pelvis
        ( 0.12,  side * 0.03, -0.20, 0.24, 0.30,  0.03),  # 1: Powerful feline quadriceps/hamstrings
        ( 0.22,  side * 0.06, -0.56, 0.175, 0.21, 0.02),  # 2: Stifle / knee
        ( 0.02,  side * 0.06, -0.88, 0.165, 0.20, -0.03), # 3: Gastrocnemius calf
        (-0.12,  side * 0.06, -1.16, 0.12, 0.14, -0.01),  # 4: High feline calcaneal hock
        (-0.02,  side * 0.05, -1.39, 0.12, 0.13,  0.00),  # 5: Smooth diagonal metatarsus
        ( 0.06,  side * 0.05, local_ground_z + 0.048, 0.142, 0.130, 0.00),  # 6: Seamless plush hind paw bridge
    ]
    build_quadruped_limb_tube(
        f"Smilodon_Hindleg_{idx}", leg_ctrl, mats["hide"], leg_bone,
        radial_segs=26, height_segs=40, v_uv_range=(0.34, 0.74),
        taper_start=True, taper_end=False, dorsal_uv_band=(0.04, 0.28),
    )
    toe_specs = [
        ( 0.34,  0.082, 0.18, 0.040, 0.105, 0.020),
        ( 0.11,  0.028, 0.21, 0.044, 0.120, 0.023),
        (-0.11, -0.028, 0.21, 0.044, 0.120, 0.023),
        (-0.34, -0.082, 0.18, 0.040, 0.105, 0.020),
    ]
    build_clawed_paw(
        f"Smilodon_HindPaw_{idx}", leg_bone, (0.14, side * 0.05), local_ground_z,
        toe_specs, paw_rx=0.175, paw_ry=0.165, paw_h=0.110,
        paw_mat=mats["hide"], claw_mat=mats["tooth"], pad_mat=mats["hide"],
        dorsal_uv_band=(0.04, 0.24),
    )


def build_smilodon_high_definition():
    clear_scene()

    mats = {
        "hide": make_pbr_normal_mat(
            "Mat_BodyPrimary",
            base_color=(1.0, 1.0, 1.0, 1.0),
            roughness=0.80,
            metallic=0.01,
            albedo_path=_tex("smilodon_albedo.png"),
            normal_path=_tex("smilodon_normal.png"),
            normal_strength=0.68,
        ),
        "cranium": make_pbr_normal_mat(
            "Mat_BodyPrimary_Skull",
            base_color=(1.0, 1.0, 1.0, 1.0),
            roughness=0.76,
            metallic=0.01,
            albedo_path=_tex("smilodon_cranium_albedo.png"),
            normal_path=_tex("smilodon_cranium_normal.png"),
            normal_strength=0.64,
        ),
        "secondary": make_pbr_material(
            "Mat_Secondary",
            base_color=(0.14, 0.10, 0.08, 1.0),
            roughness=0.78,
            metallic=0.01,
        ),
        "dark_fur": make_pbr_material(
            "SmilodonDarkFurMat",
            base_color=(0.12, 0.09, 0.07, 1.0),
            roughness=0.84,
            metallic=0.01,
        ),
        "cream_fur": make_pbr_material(
            "SmilodonCreamFurMat",
            base_color=(0.86, 0.81, 0.72, 1.0),
            roughness=0.82,
            metallic=0.01,
        ),
        "nose": make_pbr_material(
            "SmilodonNoseMat",
            base_color=(0.34, 0.16, 0.16, 1.0),
            roughness=0.38,
            metallic=0.02,
        ),
        "tooth": make_pbr_normal_mat(
            "Mat_Accent",
            base_color=(1.0, 1.0, 1.0, 1.0),
            roughness=0.16,
            metallic=0.02,
            albedo_path=_tex("smilodon_tooth_albedo.png"),
            normal_path=_tex("smilodon_tooth_normal.png"),
            normal_strength=0.22,
        ),
        "gingiva": make_pbr_normal_mat(
            "Mat_JawMembrane",
            base_color=(1.0, 1.0, 1.0, 1.0),
            roughness=0.18,
            metallic=0.02,
            albedo_path=_tex("smilodon_mucosa_albedo.png"),
            normal_path=_tex("smilodon_mucosa_normal.png"),
            normal_strength=0.24,
        ),
        "mucosa": make_pbr_normal_mat(
            "Mat_OralMucosa",
            base_color=(1.0, 1.0, 1.0, 1.0),
            roughness=0.22,
            metallic=0.02,
            albedo_path=_tex("smilodon_mucosa_albedo.png"),
            normal_path=_tex("smilodon_mucosa_normal.png"),
            normal_strength=0.28,
        ),
        "saliva": make_pbr_material(
            "Mat_Saliva",
            base_color=(0.94, 0.97, 0.99, 1.0),
            roughness=0.03,
            metallic=0.0,
            alpha=0.50,
        ),
        "iris": make_pbr_material(
            "Mat_Eye",
            base_color=(1.0, 0.88, 0.68, 1.0),
            roughness=0.08,
            emissive=(0.88, 0.50, 0.06, 1.0),
            emissive_strength=0.32,
            albedo_path=_tex("smilodon_iris_albedo.png"),
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

    # Exact Canonical Smilodon Rig (Bone_Hips at Z = 1.55, 3-segment bobtail, 4 feline legs)
    root  = create_bone_node("Bone_Root",  (0.0, 0.0, 0.0))
    hips  = create_bone_node("Bone_Hips",  (0.0, 0.0, 1.55), parent=root)
    torso = create_bone_node("Bone_Torso", (0.0, 0.0, 0.00), parent=hips)
    neck  = create_bone_node("Bone_Neck",  (0.96, 0.0, 0.28), parent=torso)
    head  = create_bone_node("Bone_Head",  (0.46, 0.0, 0.22), parent=neck)
    jaw   = create_bone_node("Bone_Jaw",   (0.10, 0.0, -0.14), parent=head)

    tail0 = create_bone_node("Bone_Tail0", (-0.96, 0.0, 0.04), parent=torso)
    tail1 = create_bone_node("Bone_Tail1", (-0.30, 0.0, -0.04), parent=tail0)
    tail2 = create_bone_node("Bone_Tail2", (-0.28, 0.0, -0.06), parent=tail1)

    # Bear-like Machairodont Spine Spline (Short bobtail -> compact hips -> massive shoulder hump -> thick shaggy neck -> occiput)
    spine_ctrl = [
        (-1.76, 0.0, 1.44, 0.004, 0.004),  # 0: Bobtail Tip
        (-1.54, 0.0, 1.49, 0.095, 0.098),  # 1: Bone_Tail2
        (-1.26, 0.0, 1.55, 0.135, 0.140),  # 2: Bone_Tail1
        (-0.96, 0.0, 1.59, 0.185, 0.195),  # 3: Bone_Tail0
        (-0.56, 0.0, 1.60, 0.375, 0.405),  # 4: Compact sloping feline hindquarters
        (-0.08, 0.0, 1.62, 0.385, 0.425),  # 5: Muscular feline waist
        ( 0.42, 0.0, 1.70, 0.495, 0.555),  # 6: Deep barrel ribcage
        ( 0.84, 0.0, 1.79, 0.545, 0.605),  # 7: Herculean Smilodon scapular hump!
        ( 1.12, 0.0, 1.88, 0.425, 0.465),  # 8: Thick shaggy feline neck base
        ( 1.36, 0.0, 1.99, 0.370, 0.405),  # 9: Mid-neck with cheek ruff
        ( 1.54, 0.0, 2.05, 0.320, 0.345),  # 10: Skull occiput socket
        ( 1.68, 0.0, 2.05, 0.004, 0.004),  # 11: Internal skull cap
    ]
    master_spine = CatmullRomSpline3D(spine_ctrl)

    t_j_tail2 = 1.0 / 11.0
    t_j_tail1 = 2.0 / 11.0
    t_j_tail0 = 3.1 / 11.0
    t_j_neck  = 7.5 / 11.0
    overlap = 0.048

    build_quadruped_spine_segment(
        "Smilodon_TailSeg2", master_spine, _eval_smilodon_spine_surface,
        0.0, t_j_tail2 + overlap, None, t_j_tail2,
        (-1.54, 0.0, 1.49), tail2, mats["hide"], segs_u=28, segs_v=16,
    )
    build_quadruped_spine_segment(
        "Smilodon_TailSeg1", master_spine, _eval_smilodon_spine_surface,
        t_j_tail2 - overlap, t_j_tail1 + overlap, t_j_tail2, t_j_tail1,
        (-1.26, 0.0, 1.55), tail1, mats["hide"], segs_u=30, segs_v=16,
    )
    build_quadruped_spine_segment(
        "Smilodon_TailSeg0", master_spine, _eval_smilodon_spine_surface,
        t_j_tail1 - overlap, t_j_tail0 + overlap, t_j_tail1, t_j_tail0,
        (-0.96, 0.0, 1.59), tail0, mats["hide"], segs_u=32, segs_v=18,
    )
    build_quadruped_spine_segment(
        "Smilodon_Torso", master_spine, _eval_smilodon_spine_surface,
        t_j_tail0 - overlap, t_j_neck + overlap, t_j_tail0, t_j_neck,
        (0.0, 0.0, 1.55), torso, mats["hide"], segs_u=46, segs_v=36,
    )
    build_quadruped_spine_segment(
        "Smilodon_Neck", master_spine, _eval_smilodon_spine_surface,
        t_j_neck - overlap, 1.0, t_j_neck, None,
        (0.96, 0.0, 1.83), neck, mats["hide"], segs_u=42, segs_v=26,
    )

    _build_smilodon_skull_and_jaw(head, jaw, mats)

    # 4 Muscular Feline Limbs (exact order: 0=FL, 1=FR, 2=RL, 3=RR)
    leg_specs = [
        (0, ( 0.72,  0.34, 0.02),  1.0, True),   # Front Left
        (1, ( 0.72, -0.34, 0.02), -1.0, True),   # Front Right
        (2, (-0.56,  0.29, 0.01),  1.0, False),  # Rear Left
        (3, (-0.56, -0.29, 0.01), -1.0, False),  # Rear Right
    ]
    for idx, pos, side, is_front in leg_specs:
        lbone = create_bone_node(f"Bone_Leg{idx}", pos, parent=hips)
        local_ground_z = -(1.55 + pos[2])
        if is_front:
            _build_smilodon_forelimb(lbone, side, local_ground_z, mats, idx)
        else:
            _build_smilodon_hindlimb(lbone, side, local_ground_z, mats, idx)

    out_path = os.path.join(OUT_DIR, "smilodon.glb")
    export_fighter_glb(out_path)
    return out_path


if __name__ == "__main__":
    build_smilodon_high_definition()
