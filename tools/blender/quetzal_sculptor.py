"""
tools/blender/quetzal_sculptor.py
Paleontologically authentic & specimen-faithful Blender 5.2 builder for the
Quetzalcoatlus northropi GLB model (assets/models/fighters/quetzal.glb).
Modeled on quadrupedal azhdarchid anatomy: sloping torso, elongated stork-like
hindlimbs, wing-walking metacarpal forelimbs with towering folded fourth-finger
wing sails, straight giraffe-like neck, toothless spear beak with large
nasoantorbital fenestra, and mid-cranial arched sagittal crest.
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
from pachyrhino_sculptor import (
    _build_horn_along_spline,
    _build_conical_horn,
)


def _tex(name):
    p = os.path.join(TEX_DIR, name)
    return p if os.path.exists(p) else None


def _build_airfoil_membrane(
    name,
    lead_ctrl,
    trail_ctrl,
    mat,
    parent,
    u_steps=26,
    chord_steps=16,
    camber_height=0.055,
    lead_half_thick=0.018,
    trail_half_thick=0.005,
    scallop_amp=-0.025,
    scallop_freq=2.0,
    fibril_amp=0.004,
    v_max=0.84,
    camber_axis=None,
):
    """
    Lofts a closed 3D aerodynamic patagium airfoil between Catmull-Rom leading and
    trailing edge splines, mapping UVs across (u, 0..v_max) so the sandy-parchment
    and russet membrane zone renders cleanly without leading-edge bone bars.
    """
    lead_spline = CatmullRomSpline3D([(p[0], p[1], p[2]) for p in lead_ctrl])
    trail_spline = CatmullRomSpline3D([(p[0], p[1], p[2]) for p in trail_ctrl])

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    n_ring = 2 * chord_steps
    rings = []
    rings_uv = []

    for iu in range(u_steps):
        u = iu / (u_steps - 1)
        p_lead, _ = lead_spline.eval_at(u)
        p_trail, _ = trail_spline.eval_at(u)

        chord_vec = p_trail - p_lead
        chord_len = chord_vec.length
        span_tan = lead_spline.tangent_at(u)
        if camber_axis is not None:
            up_nrm = Vector(camber_axis).normalized()
        elif chord_len < 1e-4:
            up_nrm = Vector((0.0, 1.0, 0.0))
        else:
            up_nrm = span_tan.cross(chord_vec)
            if up_nrm.length < 1e-5:
                up_nrm = Vector((0.0, 1.0, 0.0))
            else:
                up_nrm.normalize()

        span_env = math.sin(u * math.pi)
        scallop = chord_vec * (scallop_amp * abs(math.sin(u * math.pi * scallop_freq)) * span_env)
        p_trail_mod = p_trail + scallop

        taper = 0.25 + 0.75 * span_env
        ring_v = []
        ring_uv = []

        for j in range(n_ring):
            if j <= chord_steps:
                w = j / chord_steps
                is_top = True
            else:
                w = 1.0 - (j - chord_steps) / chord_steps
                is_top = False

            base_pt = p_lead.lerp(p_trail_mod, w)
            camber = camber_height * math.sin(w * math.pi) * taper
            thick = (
                lead_half_thick * ((1.0 - w) ** 1.4)
                + trail_half_thick * (w ** 0.7)
            ) * (0.40 + 0.60 * span_env)
            if j == 0 or j == chord_steps:
                thick = 0.0

            fibril = fibril_amp * math.sin(u * math.pi * 24.0) * math.sin(w * math.pi)
            z_off = camber + (thick if is_top else -thick) + fibril
            ring_v.append(bm.verts.new(base_pt + up_nrm * z_off))
            ring_uv.append((u, (1.0 - w) * v_max))

        rings.append(ring_v)
        rings_uv.append(ring_uv)

    for iu in range(u_steps - 1):
        r0, r1 = rings[iu], rings[iu + 1]
        uv0, uv1 = rings_uv[iu], rings_uv[iu + 1]
        for j in range(n_ring):
            jn = (j + 1) % n_ring
            v00, v01, v11, v10 = r0[j], r0[jn], r1[jn], r1[j]
            if (v00.co - v01.co).length < 1e-6 and (v10.co - v11.co).length < 1e-6:
                continue
            try:
                f = bm.faces.new((v00, v01, v11, v10))
                for loop, uv in zip(f.loops, (uv0[j], uv0[jn], uv1[jn], uv1[j])):
                    loop[uv_layer].uv = uv
            except ValueError:
                pass

    for cap_ring in (rings[0][::-1], rings[-1]):
        try:
            bm.faces.new(cap_ring)
        except ValueError:
            pass

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=(0.0, 0.0, 0.0), subdiv=0)


def _build_wing_spar_tube(
    name,
    ctrl_tuples,
    mat,
    parent,
    radial_segs=22,
    height_segs=32,
    uv_v_const=None,
    uv_u_scale=1.5,
):
    """
    Lofts a wing or forelimb tube along a spline. When uv_v_const is set (e.g. 0.94),
    maps (v * uv_u_scale, uv_v_const) to sample transverse barred markings along the strut.
    """
    spline = CatmullRomSpline3D(ctrl_tuples)
    rings_verts = []
    rings_uvs = []

    for iy in range(height_segs + 1):
        v = iy / height_segs
        cap_scale = 1.0
        if v < 0.06:
            cap_scale = max(0.02, math.sin((v / 0.06) * (math.pi * 0.5)))
        elif v > 0.94:
            cap_scale = max(0.02, math.sin(((1.0 - v) / 0.06) * (math.pi * 0.5)))

        c_pt, vals = spline.eval_at(v)
        rx_a = max(0.002, vals[0] * cap_scale)
        rz_b = max(0.002, vals[1] * cap_scale)
        tangent = spline.tangent_at(v)

        ref_up = Vector((1.0, 0.0, 0.0))
        if abs(tangent.dot(ref_up)) > 0.92:
            ref_up = Vector((0.0, 0.0, 1.0))
        up_axis = (ref_up - tangent * ref_up.dot(tangent)).normalized()
        lat_axis = tangent.cross(up_axis).normalized()

        row_v = []
        row_uv = []
        for ix in range(radial_segs):
            u = ix / radial_segs
            ang = u * math.pi * 2.0
            sin_a = math.sin(ang)
            cos_a = math.cos(ang)
            pt = c_pt + lat_axis * (sin_a * rx_a) + up_axis * (cos_a * rz_b)
            row_v.append(pt)
            if uv_v_const is not None:
                # Place transverse brown barring on the anterior half, cream/taupe behind
                v_band = uv_v_const if cos_a > -0.25 else 0.72
                row_uv.append((v * uv_u_scale, v_band))
            else:
                row_uv.append((u, v * 1.4))
        rings_verts.append(row_v)
        rings_uvs.append(row_uv)

    bm = _build_grid_bmesh(rings_verts, rings_uvs, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    return attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=(0.0, 0.0, 0.0), subdiv=0)


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
    Lofts a slice [t_start, t_end] of the Quetzalcoatlus master spine spline in
    the local space of parent_bone with compact pelvis, deep pectoral chest/carina,
    broad shoulder girdle, and rigid, straight stork-like cervical column.
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

            # Subtle dorsal notarium neural ridge across shoulder/back
            if cos_t > 0.65 and abs_sin < 0.22 and 0.24 < t < 0.62:
                ridge_arch = 1.0 - abs_sin / 0.22
                z_vert += ridge_arch * 0.06 * rz * spine_env

            # Deep muscular pectoral sternum keel & shaggy broad chest (t = 0.34..0.52)
            if 0.34 < t < 0.52 and cos_t < -0.20:
                keel_env = math.sin(((t - 0.34) / 0.18) * math.pi)
                keel_pinch = max(0.0, (-cos_t - 0.20) / 0.80) ** 1.35
                z_vert -= keel_pinch * 0.12 * keel_env * cap_scale
                y_lat *= (1.0 - 0.08 * keel_pinch * keel_env)
            if 0.44 < t < 0.58 and abs_sin > 0.46:
                sh_env = math.sin(((t - 0.44) / 0.14) * math.pi)
                y_lat *= (1.0 + 0.07 * sh_env)

            # C1-smooth quadratic inset of overlapping socket tongues inside adjacent cavity
            if t_joint_back is not None and t < t_joint_back:
                span = max(1e-5, t_joint_back - t_start)
                s = min(1.0, (t_joint_back - t) / span)
                inset_b = 1.0 - 0.035 * (s * s)
                y_lat *= inset_b
                z_vert *= inset_b
            elif t_joint_front is not None and t > t_joint_front:
                inset = min(1.0, (t - t_joint_front) / max(1e-5, t_end - t_joint_front))
                inset_f = 1.0 - 0.035 * (inset * inset)
                y_lat *= inset_f
                z_vert *= inset_f

            # Very gentle longitudinal sternocleidomastoid ridges & subtle throat rings on neck
            if 0.56 < t < 0.92:
                neck_env = math.sin(((t - 0.56) / 0.36) * math.pi) * cap_scale
                if cos_t < -0.25:
                    throat_rings = 0.028 * math.sin(t * math.pi * 40.0) * neck_env
                    z_vert *= (1.0 + throat_rings)
                if abs_sin > 0.52 and -0.40 < cos_t < 0.35:
                    tendon = math.sin(((abs_sin - 0.52) / 0.48) * math.pi * 0.5)
                    y_lat += math.copysign(1.0, sin_t) * 0.018 * tendon * neck_env

            world_pt = c_world + lat_axis * y_lat + up_axis * z_vert
            row_verts.append(world_pt - origin)
            row_uvs.append((u, t * 2.2))

        rings_verts.append(row_verts)
        rings_uvs.append(row_uvs)

    bm = _build_grid_bmesh(rings_verts, rings_uvs, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    return attach_mesh_obj(bm, name, mat=mat, parent=parent_bone, local_pos=(0.0, 0.0, 0.0), subdiv=0)


def _add_pycnofiber_mane_and_scutes(torso_bone, neck_bone, mats):
    """
    Adds soft shaggy chest pycnofiber tufts on the lower pectoral curve and low
    occipital nape tufts directly behind the cranium (zero stegosaur-like neck spikes).
    """
    # Soft shaggy ventral chest/throat ruff tuples matching Mark Witton's fluffy chest coat
    chest_ruffs = [
        ((0.46,  0.00, 0.02), (-0.06,  0.00, -0.11)),
        ((0.52,  0.10, 0.06), (-0.05,  0.03, -0.10)),
        ((0.52, -0.10, 0.06), (-0.05, -0.03, -0.10)),
        ((0.56,  0.00, 0.10), (-0.04,  0.00, -0.10)),
        ((0.60,  0.08, 0.16), (-0.03,  0.02, -0.09)),
        ((0.60, -0.08, 0.16), (-0.03, -0.02, -0.09)),
    ]
    for idx, (b_pos, tip_off) in enumerate(chest_ruffs):
        _build_horn_along_spline(
            f"Quetzal_ChestRuff_{idx}",
            [Vector((0, 0, 0)), Vector(tip_off) * 0.5, Vector(tip_off)],
            base_rx=0.028,
            base_rz=0.045,
            mat=mats["hide"],
            parent=torso_bone,
            local_pos=b_pos,
            segs_u=8,
            segs_v=6,
            tip_taper=1.1,
            flute_amp=0.04,
        )

    # Low soft shaggy occipital nape tufts closely hugging right behind skull (top 14% of neck)
    nape_ruffs = [
        ((0.53,  0.00, 1.48), (-0.11,  0.00,  0.04)),
        ((0.58,  0.04, 1.56), (-0.12,  0.02,  0.05)),
        ((0.58, -0.04, 1.56), (-0.12, -0.02,  0.05)),
        ((0.61,  0.00, 1.62), (-0.13,  0.00,  0.04)),
    ]
    for idx, (b_pos, tip_off) in enumerate(nape_ruffs):
        _build_horn_along_spline(
            f"Quetzal_NapeRuff_{idx}",
            [Vector((0, 0, 0)), Vector(tip_off) * 0.55, Vector(tip_off)],
            base_rx=0.022,
            base_rz=0.030,
            mat=mats["hide"],
            parent=neck_bone,
            local_pos=b_pos,
            segs_u=8,
            segs_v=6,
            tip_taper=1.1,
            flute_amp=0.03,
        )

    # Sculpted sternum carina keel plate (tucked softly into pectoral musculature)
    build_osteoderm_plate(
        "Quetzal_SternumKeel",
        width=0.18,
        height=0.40,
        thickness=0.06,
        mat=mats["hide"],
        parent=torso_bone,
        local_pos=(0.34, 0.0, -0.02),
        rot=(0.0, 0.48, 0.0),
        shape="diamond",
    )


def _build_sculpted_skull(head_bone, mats):
    """
    Sculpts an authentic toothless Azhdarchid skull:
      - Smooth occipital-orbital cranium (x = -0.18..0.44m)
      - Long razor-keeled toothless upper spear beak with huge triangular
        nasoantorbital fenestra & golden preorbital highlight (x = 0.16..2.38m)
      - Tall arched Kingfisher-Cerulean mid-cranial sagittal crest perched above
        the orbits & antorbital fenestra (x = -0.06..0.86m, z up to +0.50m)
      - Recessed low posterior eyes with vertical slit pupils
    """
    pitch_q = Euler((0.0, 0.02, 0.0), "XYZ").to_matrix().to_4x4()

    # 1. Smooth Azhdarchid Cranial Capsule & Low Posterior Orbits (x = -0.18..0.30)
    c_slices = [
        (-0.18, 0.085, -0.045, 0.002),  # Rounded occiput cap
        (-0.08, 0.148, -0.082, 0.142),  # Narrow muscular occipital region
        (0.06,  0.168, -0.086, 0.156),  # Orbit / squamosal region (low eyes)
        (0.16,  0.166, -0.072, 0.136),  # Clean preorbital junction before beak sheath
        (0.22,  0.146, -0.056, 0.096),  # Tucked squarely inside beak sheath
        (0.29,  0.090, -0.040, 0.002),  # Closed anterior cranium core inside beak root
    ]
    c_top_sp = CatmullRomSpline3D([(s[0], s[3], s[1]) for s in c_slices])
    c_bot_sp = CatmullRomSpline3D([(s[0], s[3], s[2]) for s in c_slices])

    cu, cv = 44, 40
    c_rings_v, c_rings_uv = [], []
    for iv in range(cv + 1):
        v = iv / cv
        pt_t, _ = c_top_sp.eval_at(v)
        pt_b, _ = c_bot_sp.eval_at(v)
        fx = pt_t.x
        hw = max(0.001, pt_t.y)
        top_z, bot_z = pt_t.z, pt_b.z

        brow_prof = math.exp(-(((v - 0.44) / 0.16) ** 2))
        orbit_prof = math.exp(-(((v - 0.46) / 0.11) ** 2))
        jugal_prof = math.exp(-(((v - 0.36) / 0.14) ** 2))

        row_v, row_uv = [], []
        for iu in range(cu):
            u = iu / cu
            ang = u * math.pi * 2.0
            sa, ca = math.sin(ang), math.cos(ang)
            abs_s = abs(sa)
            sign_s = 1.0 if sa >= 0.0 else -1.0

            ly = sign_s * (abs_s ** 0.88) * hw
            mid_z = 0.5 * (top_z + bot_z)
            hh = max(0.008, 0.5 * (top_z - bot_z))
            if ca >= 0.0:
                lz = mid_z + hh * (ca ** 0.78)
                if brow_prof > 0.01 and 0.16 < ca < 0.78:
                    arch = math.sin(((ca - 0.16) / 0.62) * math.pi)
                    lz += brow_prof * arch * 0.028
                    ly += sign_s * brow_prof * arch * 0.024
            else:
                lz = mid_z - hh * ((-ca) ** 0.82)

            if orbit_prof > 0.01 and -0.18 < ca < 0.36:
                orb_d = math.sin(((ca + 0.18) / 0.54) * math.pi)
                ly *= (1.0 - 0.24 * orbit_prof * orb_d)

            if jugal_prof > 0.01 and -0.60 < ca < 0.05:
                j_arch = math.sin(((ca + 0.60) / 0.65) * math.pi)
                ly += sign_s * jugal_prof * j_arch * 0.024

            row_v.append(pitch_q @ Vector((fx, ly, lz)))
            row_uv.append((u, v * 1.1))
        c_rings_v.append(row_v)
        c_rings_uv.append(row_uv)

    bm_cran = _build_grid_bmesh(c_rings_v, c_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_cran, "Quetzal_UpperCranium", mat=mats["cranium"], parent=head_bone)

    # 2. Toothless Stork-Spear Upper Beak & Giant Triangular Nasoantorbital Fenestra (x = 0.14..2.38)
    beak_slices = [
        (0.14,  0.132, -0.048, 0.002),  # Closed posterior sheath inside cranium
        (0.22,  0.168, -0.062, 0.122),  # Tall nasoantorbital cranial root enveloping c_slices cleanly
        (0.28,  0.168, -0.062, 0.118),  # Smooth anterior continuation
        (0.62,  0.156, -0.056, 0.094),  # Long triangular fenestra middle
        (1.06,  0.122, -0.052, 0.068),  # Anterior fenestra taper
        (1.52,  0.078, -0.050, 0.042),  # Long toothless stork spear mid-blade
        (1.98,  0.026, -0.048, 0.020),  # Slender spear taper
        (2.28, -0.016, -0.048, 0.007),  # Razor needle point
        (2.38, -0.040, -0.048, 0.002),  # Closed apex
    ]
    b_top_sp = CatmullRomSpline3D([(s[0], s[3], s[1]) for s in beak_slices])
    b_bot_sp = CatmullRomSpline3D([(s[0], s[3], s[2]) for s in beak_slices])

    bu, bv = 48, 56
    b_rings_v, b_rings_uv = [], []
    for iv in range(bv + 1):
        v = iv / bv
        pt_t, _ = b_top_sp.eval_at(v)
        pt_b, _ = b_bot_sp.eval_at(v)
        bx = pt_t.x
        hw = max(0.0015, pt_t.y)
        top_z, bot_z = pt_t.z, pt_b.z

        row_v, row_uv = [], []
        for iu in range(bu):
            u = iu / bu
            ang = u * math.pi * 2.0
            sa, ca = math.sin(ang), math.cos(ang)
            abs_s = abs(sa)
            sign_s = 1.0 if sa >= 0.0 else -1.0

            # Compressed laterally-flat Azhdarchid spear cross-section
            ly = sign_s * (abs_s ** 0.94) * hw
            if ca >= 0.0:
                lz = bot_z + (top_z - bot_z) * (ca ** 0.88)
                if ca > 0.65 and abs_s < 0.34:
                    lz += 0.014 * (1.0 - abs_s / 0.34) * (1.0 - v * 0.5)
            else:
                # Sharp toothless tomial cutting blade edge + slightly vaulted palate
                rim = abs_s ** 1.45
                lz = bot_z * rim + (bot_z + 0.018 * (1.0 - v)) * (1.0 - rim)

            # Large sculpted triangular nasoantorbital fenestra (cleanly ahead of cranium seam)
            fen_t = (v - 0.21) / 0.125
            fen_w = (ca - 0.24) / 0.34
            fen_d2 = fen_t * fen_t + fen_w * fen_w
            if fen_d2 < 1.0:
                f_depth = (1.0 - fen_d2) ** 1.25
                ly *= (1.0 - 0.30 * f_depth)
            elif 1.0 <= fen_d2 < 1.6 and fen_w > -0.3:
                hood = math.sin(((fen_d2 - 1.0) / 0.6) * math.pi)
                ly += sign_s * 0.005 * hood
                lz += 0.004 * hood * max(0.0, fen_w)

            row_v.append(pitch_q @ Vector((bx, ly, lz)))
            row_uv.append((u, v))
        b_rings_v.append(row_v)
        b_rings_uv.append(row_uv)

    bm_beak = _build_grid_bmesh(b_rings_v, b_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_beak, "Quetzal_UpperBeak", mat=mats["beak"], parent=head_bone)

    # 3. Iconic Mid-Cranial Arched Sagittal Crest ON TOP OF SKULL (x = -0.15..0.78, z up to +0.47m)
    crest_bottom = CatmullRomSpline3D([
        (-0.15, 0.0, 0.110, 0.002),
        (0.04,  0.0, 0.150, 0.028),
        (0.28,  0.0, 0.156, 0.034),
        (0.54,  0.0, 0.144, 0.022),
        (0.78,  0.0, 0.125, 0.002),
    ])
    crest_top = CatmullRomSpline3D([
        (-0.15, 0.0, 0.116, 0.002),  # Swept seamlessly into occiput
        (-0.06, 0.0, 0.305, 0.007),  # Graceful backward-swept posterior rim
        (0.12,  0.0, 0.470, 0.011),  # High arched apex over orbit/antorbital bar
        (0.34,  0.0, 0.435, 0.010),  # Smooth descending crown
        (0.58,  0.0, 0.260, 0.006),  # Sleek anterior slope
        (0.78,  0.0, 0.130, 0.002),  # Blends flush onto dorsal culmen
    ])
    cr_u, cr_v = 72, 42
    bm_crest = bmesh.new()
    uv_crest = bm_crest.loops.layers.uv.new("UVMap")
    cr_rings, cr_uvs = [], []

    for iv in range(cr_v + 1):
        v = iv / cr_v  # 0 = cranial base, 1 = upper arched cerulean rim
        pb, vb = crest_bottom.eval_at(v)
        pt_top, _ = crest_top.eval_at(v)
        half_th = max(0.002, (0.036 * (1.0 - v * 0.72)) * math.sin(max(0.03, v) * math.pi * 0.85))
        # Subtle fibrous micro-scallop along crest top edge (v -> 1)
        row_v, row_uv = [], []
        for iu in range(cr_u + 1):
            u = iu / cr_u
            ang = u * math.pi * 2.0
            t_len = 0.5 - 0.5 * math.cos(ang)  # 0 at posterior -> 1 at anterior -> 0 at posterior
            p_b_u, _ = crest_bottom.eval_at(t_len)
            p_t_u, _ = crest_top.eval_at(t_len)
            pt_mid = p_b_u.lerp(p_t_u, v)
            sa = math.sin(ang)
            flute = 1.0 + 0.07 * math.sin(t_len * math.pi * 9.0) * math.sin(v * math.pi)
            scallop_z = (v ** 1.6) * 0.004 * abs(math.sin(t_len * math.pi * 5.0))
            ly = math.copysign(1.0, sa) * (abs(sa) ** 0.78) * half_th * math.sin(max(0.03, t_len) * math.pi) * flute
            pt = pitch_q @ Vector((pt_mid.x, ly, pt_mid.z + scallop_z))
            row_v.append(bm_crest.verts.new(pt))
            row_uv.append((t_len, v))
        cr_rings.append(row_v)
        cr_uvs.append(row_uv)

    for iv in range(cr_v):
        r0, r1 = cr_rings[iv], cr_rings[iv + 1]
        uv0, uv1 = cr_uvs[iv], cr_uvs[iv + 1]
        for iu in range(cr_u):
            v00, v01, v11, v10 = r0[iu], r0[iu + 1], r1[iu + 1], r1[iu]
            if (v00.co - v01.co).length < 1e-6 and (v10.co - v11.co).length < 1e-6:
                continue
            try:
                f = bm_crest.faces.new((v00, v01, v11, v10))
                for loop, uv in zip(f.loops, (uv0[iu], uv0[iu + 1], uv1[iu + 1], uv1[iu])):
                    loop[uv_crest].uv = uv
            except ValueError:
                pass
    for cap_r in (cr_rings[0][::-1], cr_rings[-1]):
        try:
            bm_crest.faces.new(cap_r)
        except ValueError:
            pass
    bmesh.ops.recalc_face_normals(bm_crest, faces=bm_crest.faces)
    attach_mesh_obj(bm_crest, "Quetzal_CranialCrest", mat=mats["crest"], parent=head_bone)

    # 4. Toothless Upper Palate Mucosa recessed neatly inside Beak Tomial Edges
    ug_u, ug_v = 14, 22
    ug_rings_v, ug_rings_uv = [], []
    for iv in range(ug_v + 1):
        v = iv / ug_v
        tv = 0.04 + v * 0.56
        pt_t, _ = b_top_sp.eval_at(tv)
        pt_b, _ = b_bot_sp.eval_at(tv)
        hw = pt_t.y * 0.44
        row_v, row_uv = [], []
        for iu in range(ug_u):
            u = iu / ug_u
            ang = u * math.pi * 2.0
            row_v.append(pitch_q @ Vector((pt_t.x, math.sin(ang) * hw, pt_b.z + 0.022 + math.cos(ang) * 0.010)))
            row_uv.append((u, v))
        ug_rings_v.append(row_v)
        ug_rings_uv.append(row_uv)
    bm_ugum = _build_grid_bmesh(ug_rings_v, ug_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_ugum, "Quetzal_UpperGum", mat=mats["mucosa"], parent=head_bone)

    # 5. Low Posterior Predator Eyes with Vertical Slit Pupils & Leathery Eyelids
    for side, s_tag in ((1, "L"), (-1, "R")):
        eye_center = pitch_q @ Vector((0.08, side * 0.132, 0.056))
        eye_grp = create_bone_node(f"Quetzal_EyeSocket_{s_tag}", eye_center, parent=head_bone)
        eye_grp.rotation_euler = (-0.02, 0.02, -side * 0.24)

        bm_sh = bmesh.new()
        bmesh.ops.create_uvsphere(bm_sh, u_segments=12, v_segments=10, radius=0.036)
        sh_obj = attach_mesh_obj(
            bm_sh, f"Quetzal_OrbitShadow_{s_tag}", mat=mats["pupil"], parent=eye_grp,
            local_pos=(0.0, -side * 0.012, 0.0),
        )
        sh_obj.scale = (1.04, 0.62, 0.90)

        bm_ir = bmesh.new()
        uv_ir = bm_ir.loops.layers.uv.new("UVMap")
        bmesh.ops.create_uvsphere(bm_ir, u_segments=18, v_segments=14, radius=0.032)
        for f in bm_ir.faces:
            for loop in f.loops:
                co = loop.vert.co / 0.032
                loop[uv_ir].uv = (0.5 + co.x * 0.46, 0.5 + co.z * 0.46)
        bmesh.ops.recalc_face_normals(bm_ir, faces=bm_ir.faces)
        attach_mesh_obj(
            bm_ir, f"Quetzal_Eye_{s_tag}", mat=mats["iris"], parent=eye_grp,
            local_pos=(0.0, side * 0.006, 0.0),
        )

        bm_pu = bmesh.new()
        bmesh.ops.create_uvsphere(bm_pu, u_segments=12, v_segments=10, radius=0.018)
        pu_obj = attach_mesh_obj(
            bm_pu, f"Quetzal_Eye_{s_tag}_Pupil", mat=mats["pupil"], parent=eye_grp,
            local_pos=(0.0, side * 0.031, 0.0),
        )
        pu_obj.scale = (0.30, 0.58, 1.32)

        bm_cl = bmesh.new()
        bmesh.ops.create_uvsphere(bm_cl, u_segments=8, v_segments=8, radius=0.006)
        attach_mesh_obj(
            bm_cl, f"Quetzal_EyeCatchlight_{s_tag}", mat=mats["catchlight"], parent=eye_grp,
            local_pos=(0.008, side * 0.039, 0.010),
        )

        _build_muscular_limb_segment(
            f"Quetzal_UpperEyelid_{s_tag}",
            (-0.034, side * 0.012, 0.018),
            (0.036, side * 0.012, 0.014),
            lambda t, ang: (0.014 * math.sin(t * math.pi + 0.2), 0.012, 0.0, 0.005 * math.sin(t * math.pi)),
            mats["cranium"],
            eye_grp,
            prox_overlap=0.1, dist_overlap=0.1, radial_segs=10, height_segs=8,
        )
        _build_muscular_limb_segment(
            f"Quetzal_LowerEyelid_{s_tag}",
            (-0.032, side * 0.010, -0.018),
            (0.034, side * 0.010, -0.014),
            lambda t, ang: (0.012 * math.sin(t * math.pi + 0.2), 0.010, 0.0, -0.004 * math.sin(t * math.pi)),
            mats["cranium"],
            eye_grp,
            prox_overlap=0.1, dist_overlap=0.1, radial_segs=10, height_segs=8,
        )


def _build_sculpted_jaw(jaw_bone, mats):
    """
    Sculpts the articulated toothless Azhdarchid mandible ramus (32x28), slender
    lower spear beak (36x44), recessed gular throat fold, and pointed tongue.
    """
    jaw_q = Euler((0.0, 0.018, 0.0), "XYZ").to_matrix().to_4x4()

    # 1. Mandible Ramus Hinge (x = -0.08..0.26, tapering cleanly inside LowerBeak)
    mr_slices = [
        (-0.08, 0.014, -0.036, 0.002),
        (0.02,  0.020, -0.062, 0.110),
        (0.14,  0.018, -0.062, 0.094),
        (0.21,  0.013, -0.050, 0.056),
        (0.26,  0.008, -0.036, 0.002),
    ]
    mr_top_sp = CatmullRomSpline3D([(s[0], s[3], s[1]) for s in mr_slices])
    mr_bot_sp = CatmullRomSpline3D([(s[0], s[3], s[2]) for s in mr_slices])

    mru, mrv = 32, 28
    mr_rings_v, mr_rings_uv = [], []
    for iv in range(mrv + 1):
        v = iv / mrv
        pt_t, _ = mr_top_sp.eval_at(v)
        pt_b, _ = mr_bot_sp.eval_at(v)
        hw = max(0.001, pt_t.y)
        row_v, row_uv = [], []
        for iu in range(mru):
            u = iu / mru
            ang = u * math.pi * 2.0
            sa, ca = math.sin(ang), math.cos(ang)
            ly = math.copysign(1.0, sa) * (abs(sa) ** 0.80) * hw
            if ca <= 0.0:
                lz = pt_b.z * (abs(ca) ** 0.74)
            else:
                rim = abs(sa) ** 1.4
                lz = pt_t.z * rim + (pt_t.z - 0.020 * math.sin(v * math.pi)) * (1.0 - rim)
            row_v.append(jaw_q @ Vector((pt_t.x, ly, lz)))
            row_uv.append((u, v))
        mr_rings_v.append(row_v)
        mr_rings_uv.append(row_uv)
    bm_ramus = _build_grid_bmesh(mr_rings_v, mr_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_ramus, "Quetzal_MandibleRamus", mat=mats["cranium"], parent=jaw_bone)

    # 2. Toothless Keeled Lower Spear Beak (x = 0.10..2.22 -> world tip matches UpperBeak)
    lb_slices = [
        (0.10,  0.012, -0.044, 0.002),
        (0.18,  0.018, -0.062, 0.090),
        (0.28,  0.016, -0.062, 0.082),
        (0.68,  0.014, -0.060, 0.064),
        (1.22,  0.006, -0.048, 0.038),
        (1.74,  0.002, -0.030, 0.018),
        (2.12, -0.002, -0.016, 0.006),
        (2.22, -0.006, -0.010, 0.002),
    ]
    lb_top_sp = CatmullRomSpline3D([(s[0], s[3], s[1]) for s in lb_slices])
    lb_bot_sp = CatmullRomSpline3D([(s[0], s[3], s[2]) for s in lb_slices])

    lbu, lbv = 36, 44
    lb_rings_v, lb_rings_uv = [], []
    for iv in range(lbv + 1):
        v = iv / lbv
        pt_t, _ = lb_top_sp.eval_at(v)
        pt_b, _ = lb_bot_sp.eval_at(v)
        hw = max(0.001, pt_t.y)
        row_v, row_uv = [], []
        for iu in range(lbu):
            u = iu / lbu
            ang = u * math.pi * 2.0
            sa, ca = math.sin(ang), math.cos(ang)
            abs_s = abs(sa)
            ly = math.copysign(1.0, sa) * (abs_s ** 0.90) * hw
            if ca <= 0.0:
                lz = pt_b.z * (abs(ca) ** 0.84)
                if ca < -0.68 and abs_s < 0.35:
                    lz -= 0.012 * (1.0 - abs_s / 0.35) * (1.0 - v * 0.5)
            else:
                rim = abs_s ** 1.5
                lz = pt_t.z * rim + (pt_t.z - 0.012 * (1.0 - v)) * (1.0 - rim)
            row_v.append(jaw_q @ Vector((pt_t.x, ly, lz)))
            row_uv.append((u, v))
        lb_rings_v.append(row_v)
        lb_rings_uv.append(row_uv)
    bm_lbeak = _build_grid_bmesh(lb_rings_v, lb_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_lbeak, "Quetzal_LowerBeak", mat=mats["beak"], parent=jaw_bone)

    # 3. Distensible Gular Throat Sac under Mandible
    gp_slices = [
        (-0.08, 0.0, -0.04, 0.002),
        (0.06,  0.0, -0.09, 0.082),
        (0.28,  0.0, -0.09, 0.064),
        (0.52,  0.0, -0.06, 0.036),
        (0.68,  0.0, -0.03, 0.002),
    ]
    gp_sp = CatmullRomSpline3D([(s[0], s[3], s[2]) for s in gp_slices])
    gp_u, gp_v = 18, 18
    gp_rings_v, gp_rings_uv = [], []
    for iv in range(gp_v + 1):
        v = iv / gp_v
        pt, _ = gp_sp.eval_at(v)
        hw = max(0.001, pt.y)
        row_v, row_uv = [], []
        for iu in range(gp_u):
            u = iu / gp_u
            ang = u * math.pi * 2.0
            row_v.append(jaw_q @ Vector((pt.x, math.sin(ang) * hw * 0.85, pt.z * (0.5 - 0.5 * math.cos(ang)))))
            row_uv.append((u, v))
        gp_rings_v.append(row_v)
        gp_rings_uv.append(row_uv)
    bm_gular = _build_grid_bmesh(gp_rings_v, gp_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_gular, "Quetzal_GularPouch", mat=mats["hide"], parent=jaw_bone)

    # 4. Toothless Lower Gum Ridge & Pointed Crimson-Purple Tongue
    lg_u, lg_v = 14, 20
    lg_rings_v, lg_rings_uv = [], []
    for iv in range(lg_v + 1):
        v = iv / lg_v
        tv = 0.03 + v * 0.60
        pt_t, _ = lb_top_sp.eval_at(tv)
        hw = pt_t.y * 0.52
        row_v, row_uv = [], []
        for iu in range(lg_u):
            u = iu / lg_u
            ang = u * math.pi * 2.0
            row_v.append(jaw_q @ Vector((pt_t.x, math.sin(ang) * hw, pt_t.z - 0.008 + math.cos(ang) * 0.010)))
            row_uv.append((u, v))
        lg_rings_v.append(row_v)
        lg_rings_uv.append(row_uv)
    bm_lgum = _build_grid_bmesh(lg_rings_v, lg_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_lgum, "Quetzal_LowerGum", mat=mats["mucosa"], parent=jaw_bone)

    t_u, t_v = 20, 24
    t_rings_v, t_rings_uv = [], []
    for iv in range(t_v + 1):
        v = iv / t_v
        tx = 0.08 + v * 1.12
        arch_z = 0.002 + math.sin(v * math.pi * 0.85) * 0.026 - (max(0.0, v - 0.65) ** 1.4) * 0.022
        tip_r = ((1.0 - (v ** 2.6)) ** 0.45) if iv < t_v else 0.002
        base_c = 0.002 if iv == 0 else 1.0
        w = 0.044 * tip_r * base_c * (0.78 + 0.22 * math.sin(v * math.pi))
        h = 0.015 * tip_r * base_c * math.sin(min(1.0, v * 1.15) * math.pi * 0.88)

        row_v, row_uv = [], []
        for iu in range(t_u):
            u = iu / t_u
            ang = u * math.pi * 2.0
            sa, ca = math.sin(ang), math.cos(ang)
            sulcus = -0.008 * math.exp(-((sa / 0.26) ** 2)) * max(0.0, ca) * math.sin(v * math.pi)
            row_v.append(jaw_q @ Vector((tx, sa * w, arch_z + ca * h + sulcus)))
            row_uv.append((u, v))
        t_rings_v.append(row_v)
        t_rings_uv.append(row_uv)
    bm_tongue = _build_grid_bmesh(t_rings_v, t_rings_uv, close_u=True, cap_start=True, cap_end=True, u_wrap_axis=0)
    attach_mesh_obj(bm_tongue, "Quetzal_Tongue", mat=mats["mucosa"], parent=jaw_bone)

    for side, s_tag in ((1, "L"), (-1, "R")):
        p_lo = jaw_q @ Vector((0.06, side * 0.056, -0.012))
        p_hi = Vector((0.02, side * 0.062, 0.045))
        _build_muscular_limb_segment(
            f"Quetzal_JawAdductor_{s_tag}",
            p_lo,
            p_hi,
            lambda t, ang: (0.014 * (0.85 + 0.25 * math.sin(t * math.pi)), 0.024 * (0.85 + 0.25 * math.sin(t * math.pi)), 0.0, 0.0),
            mats["mucosa"],
            jaw_bone,
            prox_overlap=0.18, dist_overlap=0.18, radial_segs=10, height_segs=8,
        )


def _build_wing(torso_bone, idx, wing_name, side, mats):
    """
    Sculpts the quadrupedal wing-walking Azhdarchid forelimb:
      - Special_LeftWing / Special_RightWing (world shoulder (0.48, ±0.28, 2.20)):
        muscular russet upper humerus -> elbow -> barred forearm & elongated
        metacarpal IV column planted vertically on wrist knuckle W at world Z = 0.07,
        3 grounded clawed manus toes, and concave sandy-parchment inner patagium.
      - Bone_Arm0 / Bone_Arm1 (pivoted at grounded wrist W):
        colossal 4th wing finger swept steeply upward & backward to world Z ~ 3.0m
        supporting a towering folded russet-and-parchment wing sail.
    """
    s_tag = "L" if side > 0 else "R"
    wing = create_bone_node(wing_name, (0.48, side * 0.28, 0.22), parent=torso_bone)

    # Local coords inside wing (world origin at shoulder (0.48, ±0.28, 2.20)):
    # Ground plane is local Z = -2.20
    S = (-0.02, -side * 0.12, -0.04)
    E = (-0.16, side * 0.14, -0.58)
    FA = (-0.02, side * 0.20, -1.32)
    W = (0.14, side * 0.22, -2.13)  # World Z = 0.07 (planted walking knuckle)
    Pter = (0.06, side * 0.21, -1.68)

    # Shaggy russet upper humerus arm (Shoulder -> Elbow, tucking smoothly inside elbow cap)
    _build_wing_spar_tube(
        f"Quetzal_HumerusArm_{s_tag}",
        [
            (*S, 0.132, 0.122),
            (-0.08, side * 0.02, -0.28, 0.110, 0.102),
            (-0.14, side * 0.12, -0.54, 0.078, 0.074),
            (-0.14, side * 0.15, -0.62, 0.048, 0.046),
        ],
        mats["hide"],
        wing,
        radial_segs=20,
        height_segs=22,
    )

    # Warm buff & sepia mottled forearm + elongated metacarpal IV walking column (Elbow -> Wrist)
    _build_wing_spar_tube(
        f"Quetzal_InnerWingSpar_{s_tag}",
        [
            (-0.16, side * 0.13, -0.54, 0.068, 0.066),
            (*E, 0.090, 0.086),
            (-0.09, side * 0.18, -0.95, 0.078, 0.075),
            (*FA, 0.072, 0.070),
            (0.06, side * 0.21, -1.72, 0.065, 0.062),
            (*W, 0.068, 0.068),
        ],
        mats["wing"],
        wing,
        radial_segs=20,
        height_segs=30,
        uv_v_const=0.94,
        uv_u_scale=1.1,
    )

    # Pteroid strut supporting lower fore-wing membrane
    _build_horn_along_spline(
        f"Quetzal_PteroidBone_{s_tag}",
        [W, (0.10, side * 0.215, -1.90), Pter],
        base_rx=0.018,
        base_rz=0.018,
        mat=mats["cranium"],
        parent=wing,
        segs_u=8,
        segs_v=8,
        tip_taper=1.1,
        flute_amp=0.02,
    )

    # 3 Grounded Clawed Manus Digits radiating neatly forward-outward from Wrist Knuckle W
    for di, (yaw, toe_len) in enumerate(((-0.42, 0.14), (0.04, 0.16), (0.48, 0.14))):
        ang = yaw + side * 0.16
        dx, dy = math.cos(ang), math.sin(ang)
        f_start = Vector((W[0] + dx * 0.02, W[1] + dy * 0.02, W[2] - 0.01))
        f_end = Vector((f_start.x + dx * toe_len, f_start.y + dy * toe_len, -2.182))  # World Z = 0.018
        _build_muscular_limb_segment(
            f"Quetzal_ManusFinger_{s_tag}_{di}",
            f_start,
            f_end,
            lambda t, a: (0.020 * (1.0 - 0.20 * t), 0.018 * (1.0 - 0.20 * t), 0.0, 0.0),
            mats["cranium"],
            wing,
            prox_overlap=0.20, dist_overlap=0.06, radial_segs=10, height_segs=8,
        )
        _build_conical_horn(
            f"Quetzal_ManusClaw_{s_tag}_{di}",
            length=0.085,
            base_r=0.015,
            direction=(dx * 0.94, dy * 0.94, -0.22),
            curve_offset=(0.01 * dx, 0.01 * dy, -0.012),
            mat=mats["claw"],
            parent=wing,
            local_pos=f_end,
            segs_u=8,
            segs_v=6,
            flute_amp=0.02,
        )

    # Subtle vertical propatagium fill between upper humerus & forearm
    _build_airfoil_membrane(
        f"Quetzal_Propatagium_{s_tag}",
        lead_ctrl=[(-0.04, -side * 0.02, -0.10), (0.04, side * 0.16, -0.95), Pter, W],
        trail_ctrl=[S, E, FA, W],
        mat=mats["wing"],
        parent=wing,
        u_steps=16,
        chord_steps=10,
        camber_height=0.020,
        lead_half_thick=0.012,
        trail_half_thick=0.005,
        scallop_amp=0.0,
        fibril_amp=0.002,
        v_max=0.82,
        camber_axis=(0.0, side * 1.0, 0.0),
    )

    # Sweeping concave sandy-parchment Inner Brachiopatagium from forearm back to hip/thigh!
    # World hip/thigh attachment ~ (-0.40, ±0.18, 1.66) -> in wing local: (-0.88, -side*0.10, -0.54)
    Flank = (-0.88, -side * 0.10, -0.54)
    W_trail = (-0.12, side * 0.21, -2.06)
    _build_airfoil_membrane(
        f"Quetzal_InnerPatagium_{s_tag}",
        lead_ctrl=[S, E, FA, W],
        trail_ctrl=[
            Flank,
            (-0.66, side * 0.02, -1.04),
            (-0.42, side * 0.12, -1.56),
            W_trail,
        ],
        mat=mats["wing"],
        parent=wing,
        u_steps=26,
        chord_steps=16,
        camber_height=0.032,
        lead_half_thick=0.016,
        trail_half_thick=0.005,
        scallop_amp=-0.045,
        scallop_freq=2.0,
        fibril_amp=0.003,
        v_max=0.82,
        camber_axis=(0.0, side * 1.0, 0.0),
    )

    # Towering Folded 4th Wing Finger & Outer Wing Sail pivoted at grounded Wrist (Bone_Arm0 / Bone_Arm1)
    arm = create_bone_node(f"Bone_Arm{idx}", W, parent=wing)
    W_loc = (0.0, 0.0, 0.0)  # World Z = 0.07
    F_p1 = (-0.22, side * 0.03, 0.72)
    F_p2 = (-0.46, side * 0.06, 1.48)
    F_p3 = (-0.74, side * 0.08, 2.22)
    F_tip = (-1.08, side * 0.10, 2.94)  # Towers up to world (-0.46, ±0.60, 3.01)

    _build_wing_spar_tube(
        f"Quetzal_WingFinger_{s_tag}",
        [
            (*W_loc, 0.064, 0.066),
            (*F_p1, 0.050, 0.052),
            (*F_p2, 0.036, 0.038),
            (*F_p3, 0.022, 0.024),
            (*F_tip, 0.006, 0.006),
        ],
        mats["wing"],
        arm,
        radial_segs=20,
        height_segs=34,
        uv_v_const=0.94,
        uv_u_scale=1.3,
    )

    # Outer folded sail: trailing edge tucked behind wrist & aligned with InnerPatagium in both standing & flight
    Trail_root = (-0.22, side * 0.01, 0.08)  # Aligns seamlessly with W_trail when finger unfolds by (±pi, 0, 0.35)
    _build_airfoil_membrane(
        f"Quetzal_OuterPatagium_{s_tag}",
        lead_ctrl=[W_loc, F_p1, F_p2, F_p3, F_tip],
        trail_ctrl=[
            Trail_root,
            (-0.54, side * 0.01, 0.70),
            (-0.92, side * 0.02, 1.38),
            (-1.06, side * 0.06, 2.12),
            F_tip,
        ],
        mat=mats["wing"],
        parent=arm,
        u_steps=28,
        chord_steps=16,
        camber_height=0.020,
        lead_half_thick=0.016,
        trail_half_thick=0.005,
        scallop_amp=-0.025,
        scallop_freq=2.0,
        fibril_amp=0.003,
        v_max=0.84,
        camber_axis=(0.0, side * 1.0, 0.0),
    )


def _build_hindlimb(hips_bone, idx, side, local_ground_z, mats):
    """
    Sculpts a slender, stork-like Azhdarchid hindlimb attached to the compact
    posterior pelvis (-0.38, ±0.20, -0.26) in Bone_Hips, grounded at world Z = 0.0.
    """
    leg = create_bone_node(f"Bone_Leg{idx}", (-0.38, side * 0.20, -0.26), parent=hips_bone)

    ctrl = [
        (0.04, -side * 0.06,  0.08, 0.130, 0.148,  0.00),  # Hip socket merged cleanly in pelvis
        (0.10,  side * 0.00, -0.34, 0.104, 0.116,  0.02),  # Slender femur
        (0.14,  side * 0.01, -0.68, 0.072, 0.076,  0.01),  # Stork knee
        (0.02,  side * 0.01, -1.04, 0.064, 0.070, -0.01),  # Lean calf muscle
        (-0.05, side * 0.01, -1.42, 0.046, 0.048,  0.00),  # Long thin stork tibiotarsus
        (0.00,  side * 0.01, -1.64, 0.042, 0.044,  0.00),  # Ankle hock
        (0.03,  side * 0.01, local_ground_z + 0.035, 0.044, 0.044, 0.00),  # Ankle inside FootPad
    ]
    _build_curved_limb_tube(
        f"Quetzal_Hindlimb_{idx}",
        ctrl,
        mats["hide"],
        leg,
        radial_segs=22,
        height_segs=34,
        v_uv_range=(0.20, 1.30),
        taper_start=True,
        taper_end=True,
    )

    pad_rz = 0.032
    pad_z = local_ground_z + pad_rz
    _build_muscular_limb_segment(
        f"Quetzal_FootPad_{idx}",
        (-0.05, side * 0.01, pad_z),
        (0.14, side * 0.01, pad_z),
        lambda t, ang: (
            0.052 * (0.88 + 0.24 * math.sin(t * math.pi)),
            pad_rz * (1.0 - 0.18 * max(0.0, math.cos(ang)) * t),
            0.0,
            0.0,
        ),
        mats["cranium"],
        leg,
        prox_overlap=0.14, dist_overlap=0.14, radial_segs=14, height_segs=10,
    )

    for ti, yaw in enumerate((-0.44, -0.14, 0.14, 0.44)):
        ang = yaw + side * 0.04
        dx = math.cos(ang)
        dy = math.sin(ang)
        toe_len = 0.18 + (0.035 if ti in (1, 2) else 0.0)
        t_start = Vector((0.10 + dx * 0.02, side * 0.01 + dy * 0.036, local_ground_z + 0.022))
        t_end = Vector((t_start.x + dx * toe_len, t_start.y + dy * toe_len, local_ground_z + 0.018))
        _build_muscular_limb_segment(
            f"Quetzal_PesToe_{idx}_{ti}",
            t_start,
            t_end,
            lambda t, a: (0.020 * (1.0 - 0.22 * t), 0.017 * (1.0 - 0.20 * t), 0.0, 0.0),
            mats["cranium"],
            leg,
            prox_overlap=0.20, dist_overlap=0.06, radial_segs=10, height_segs=8,
        )
        _build_conical_horn(
            f"Quetzal_PesClaw_{idx}_{ti}",
            length=0.075,
            base_r=0.014,
            direction=(dx * 0.94, dy * 0.94, -0.22),
            curve_offset=(0.01 * dx, 0.01 * dy, -0.012),
            mat=mats["claw"],
            parent=leg,
            local_pos=t_end + Vector((0.0, 0.0, 0.004)),
            segs_u=8,
            segs_v=6,
            flute_amp=0.02,
        )


def build_quetzal_high_definition():
    clear_scene()

    mats = {
        "hide": _make_trex_pbr_mat(
            "Mat_BodyPrimary",
            base_color=(0.48, 0.36, 0.26, 1.0),
            roughness=0.80,
            metallic=0.01,
            albedo_path=_tex("quetzal_albedo.png"),
            bump_path=_tex("quetzal_normal.png"),
            bump_strength=0.34,
        ),
        "cranium": _make_trex_pbr_mat(
            "Mat_BodyPrimary_Skull",
            base_color=(0.36, 0.30, 0.24, 1.0),
            roughness=0.64,
            metallic=0.02,
            albedo_path=_tex("quetzal_cranium_albedo.png"),
            bump_path=_tex("quetzal_cranium_normal.png"),
            bump_strength=0.34,
        ),
        "beak": _make_trex_pbr_mat(
            "Mat_Secondary",
            base_color=(0.82, 0.74, 0.54, 1.0),
            roughness=0.40,
            metallic=0.02,
            albedo_path=_tex("quetzal_beak_albedo.png"),
            bump_path=_tex("quetzal_beak_normal.png"),
            bump_strength=0.28,
        ),
        "crest": _make_trex_pbr_mat(
            "Mat_Accent",
            base_color=(0.12, 0.56, 0.68, 1.0),
            roughness=0.36,
            metallic=0.03,
            albedo_path=_tex("quetzal_crest_albedo.png"),
            bump_path=_tex("quetzal_crest_normal.png"),
            bump_strength=0.34,
        ),
        "wing": _make_trex_pbr_mat(
            "Mat_Membrane",
            base_color=(0.76, 0.66, 0.46, 1.0),
            roughness=0.62,
            metallic=0.01,
            albedo_path=_tex("quetzal_wing_albedo.png"),
            bump_path=_tex("quetzal_wing_normal.png"),
            bump_strength=0.30,
        ),
        "mucosa": _make_trex_pbr_mat(
            "Mat_OralMucosa",
            base_color=(0.44, 0.16, 0.22, 1.0),
            roughness=0.22,
            metallic=0.02,
            albedo_path=_tex("trex_mucosa_albedo.png"),
            bump_path=_tex("trex_mucosa_bump.png"),
            bump_strength=0.22,
        ),
        "claw": make_pbr_material(
            "Mat_Claw",
            base_color=(0.08, 0.06, 0.05, 1.0),
            roughness=0.38,
            metallic=0.04,
        ),
        "iris": make_pbr_material(
            "Mat_Eye",
            base_color=(0.98, 0.68, 0.12, 1.0),
            roughness=0.08,
            emissive=(0.50, 0.28, 0.04, 1.0),
            emissive_strength=0.24,
            albedo_path=_tex("quetzal_iris_albedo.png"),
        ),
        "pupil": make_pbr_material(
            "Mat_Pupil",
            base_color=(0.02, 0.02, 0.02, 1.0),
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

    root = create_bone_node("Bone_Root", (0.0, 0.0, 0.0))
    hips = create_bone_node("Bone_Hips", (0.0, 0.0, 1.98), parent=root)
    torso = create_bone_node("Bone_Torso", (0.0, 0.0, 0.0), parent=hips)
    neck = create_bone_node("Bone_Neck", (0.58, 0.0, 0.24), parent=torso)
    head = create_bone_node("Bone_Head", (0.64, 0.0, 1.62), parent=neck)
    jaw = create_bone_node("Bone_Jaw", (0.14, 0.0, -0.05), parent=head)
    tail0 = create_bone_node("Bone_Tail0", (-0.48, 0.0, -0.34), parent=hips)

    # Sloping Azhdarchid Spine: stub tail -> compact low pelvis -> deep chest -> rigid giraffe neck
    spine_ctrl = [
        (-0.74, 0.0, 1.48, 0.003, 0.003),  # 0: Stub tail tip aligning with dorsal back slope
        (-0.60, 0.0, 1.55, 0.072, 0.068),  # 1: Mid stub tail
        (-0.48, 0.0, 1.63, 0.145, 0.135),  # 2: Bone_Tail0
        (-0.32, 0.0, 1.72, 0.230, 0.210),  # 3: Compact pelvis
        (0.00,  0.0, 1.88, 0.305, 0.280),  # 4: Bone_Hips / sloping abdomen
        (0.30,  0.0, 2.06, 0.350, 0.312),  # 5: Smooth deep pectoral chest & carina
        (0.56,  0.0, 2.22, 0.242, 0.224),  # 6: Shoulder girdle / Bone_Neck pivot
        (0.76,  0.0, 2.66, 0.168, 0.162),  # 7: Lower stiffened cervical pillar
        (0.96,  0.0, 3.16, 0.148, 0.146),  # 8: Mid straight giraffe neck
        (1.14,  0.0, 3.60, 0.136, 0.138),  # 9: Upper cervical
        (1.22,  0.0, 3.84, 0.132, 0.136),  # 10: Bone_Head occiput joint
        (1.34,  0.0, 3.86, 0.003, 0.003),  # 11: Internal cranial core
    ]
    master_spine = CatmullRomSpline3D(spine_ctrl)

    t_j_tail0 = 2.0 / 11.0
    t_j_torso = 4.0 / 11.0
    t_j_neck = 6.0 / 11.0
    overlap = 0.036

    _build_continuous_spine_segment(
        "Quetzal_Tail", master_spine,
        0.0, t_j_tail0 + overlap, None, t_j_tail0,
        (-0.48, 0.0, 1.64), tail0, mats["hide"], segs_u=24, segs_v=16,
    )
    _build_continuous_spine_segment(
        "Quetzal_Pelvis", master_spine,
        t_j_tail0 - overlap, t_j_torso + overlap, t_j_tail0, t_j_torso,
        (0.0, 0.0, 1.98), hips, mats["hide"], segs_u=32, segs_v=20,
    )
    _build_continuous_spine_segment(
        "Quetzal_Torso", master_spine,
        t_j_torso - overlap, t_j_neck + overlap, t_j_torso, t_j_neck,
        (0.0, 0.0, 1.98), torso, mats["hide"], segs_u=36, segs_v=26,
    )
    _build_continuous_spine_segment(
        "Quetzal_Neck", master_spine,
        t_j_neck - overlap, 1.0, t_j_neck, None,
        (0.58, 0.0, 2.22), neck, mats["hide"], segs_u=36, segs_v=30,
    )

    _add_pycnofiber_mane_and_scutes(torso, neck, mats)
    _build_sculpted_skull(head, mats)
    _build_sculpted_jaw(jaw, mats)

    for idx, (w_name, side) in enumerate((("Special_LeftWing", 1), ("Special_RightWing", -1))):
        _build_wing(torso, idx, w_name, side, mats)

    for idx, side in enumerate((1, -1)):
        _build_hindlimb(hips, idx, side, local_ground_z=-1.72, mats=mats)

    out_path = os.path.join(OUT_DIR, "quetzal.glb")
    export_fighter_glb(out_path)
    return out_path
