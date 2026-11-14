"""
tools/blender/build_batch2_aquatic.py
Batch 2 Blender sculpts & GLB exports:
1. anomalocaris (Anomalocaris canadensis)
2. pulmonoscorpius (Pulmonoscorpius kirktonensis)
3. spinosaurus (Spinosaurus aegyptiacus - 2020 paddle-tail reconstruction)
"""

import os
import sys
import math
import bpy
import bmesh

THIS_DIR = os.path.dirname(os.path.abspath(__file__))
if THIS_DIR not in sys.path:
    sys.path.insert(0, THIS_DIR)

from blender_rig_utils import (
    clear_scene,
    make_pbr_material,
    create_bone_node,
    build_organic_tube,
    build_curved_claw_or_horn,
    build_osteoderm_plate,
    build_anatomical_eye,
    attach_mesh_obj,
    export_fighter_glb,
)

ROOT = os.path.abspath(os.path.join(THIS_DIR, "..", ".."))
TEX_DIR = os.path.join(ROOT, "assets", "textures", "fighters")
OUT_DIR = os.path.join(ROOT, "assets", "models", "fighters")


def tex_paths(fid):
    return (
        os.path.join(TEX_DIR, f"{fid}_albedo.png"),
        os.path.join(TEX_DIR, f"{fid}_bump.png"),
    )


def _add_leaf_flap_mesh(name, length_y, chord_x, sweep_x, thickness, side, mat, parent, loc=(0, 0, 0), rot_euler=(0, 0, 0)):
    """Builds a sculpted cambered manta-style leaf swimming flap with beveled wingtip and venetian shingle tilt."""
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")
    nu = 10  # spanwise stations along Y*side
    nv = 12  # cross-section chordwise loop
    rings = []
    for iu in range(nu + 1):
        t = iu / nu
        # Tear-drop / elliptical planform widest at t=0.42, tapering to rounded leaf tip
        width_env = math.sin(math.pi * (t ** 0.72)) * (0.55 + 0.55 * (1.0 - t))
        if t < 0.08:
            width_env = max(width_env, 0.52)
        c = chord_x * max(0.06, width_env)
        th = thickness * (1.0 - 0.72 * t)
        y = side * (t * length_y)
        x_off = -sweep_x * (t ** 1.35)
        # Subtle hydrodynamic arch/droop along span
        z_off = math.sin(t * math.pi * 0.85) * 0.04 - 0.08 * (t ** 1.6)
        ring = []
        for iv in range(nv):
            ang = (iv / nv) * 2.0 * math.pi
            # Airfoil-like section: fuller leading edge (+X), sharper trailing edge (-X)
            cx = math.cos(ang)
            cz = math.sin(ang)
            lx = (cx * 0.5 + 0.08 * (1.0 - cx * cx)) * c
            # Taper trailing edge thinner than leading edge
            edge_taper = 0.55 + 0.45 * cx
            lz = cz * th * max(0.18, edge_taper)
            ring.append(bm.verts.new((x_off + lx, y, z_off + lz)))
        rings.append(ring)

    for iu in range(nu):
        r0, r1 = rings[iu], rings[iu + 1]
        v0, v1 = iu / nu, (iu + 1) / nu
        for iv in range(nv):
            iv2 = (iv + 1) % nv
            f = bm.faces.new((r0[iv], r0[iv2], r1[iv2], r1[iv]))
            u0, u1 = iv / nv, (iv + 1) / nv
            f.loops[0][uv_layer].uv = (u0, v0)
            f.loops[1][uv_layer].uv = (u1, v0)
            f.loops[2][uv_layer].uv = (u1, v1)
            f.loops[3][uv_layer].uv = (u0, v1)
    for cap in (rings[0], rings[-1]):
        try:
            f = bm.faces.new(cap)
            for l in f.loops:
                l[uv_layer].uv = (0.5, 0.5)
        except ValueError:
            pass
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    obj = attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=loc, subdiv=1)
    obj.rotation_euler = rot_euler
    return obj


def _add_tail_blade_mesh(name, length, width, thickness, pitch_z, yaw_y, roll_x, mat, parent, loc=(0, 0, 0)):
    """Builds a crisp lanceolate radiodont caudal furca blade fanning upward/outward."""
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")
    nu = 8
    nv = 8
    rings = []
    for iu in range(nu + 1):
        t = iu / nu
        # Narrow peduncle flaring into broad feather vane at t=0.55, pointing sharply at tip
        w = width * (0.22 + 1.05 * math.sin(math.pi * (t ** 0.75))) * (1.0 - 0.55 * (t ** 2.5))
        th = thickness * (1.0 - 0.75 * t)
        cx = -t * length
        ring = []
        for iv in range(nv):
            ang = (iv / nv) * 2.0 * math.pi
            ly = math.cos(ang) * max(0.012, w * 0.5)
            lz = math.sin(ang) * max(0.008, th * 0.5)
            ring.append(bm.verts.new((cx, ly, lz)))
        rings.append(ring)
    for iu in range(nu):
        r0, r1 = rings[iu], rings[iu + 1]
        v0, v1 = iu / nu, (iu + 1) / nu
        for iv in range(nv):
            iv2 = (iv + 1) % nv
            f = bm.faces.new((r0[iv], r0[iv2], r1[iv2], r1[iv]))
            u0, u1 = iv / nv, (iv + 1) / nv
            f.loops[0][uv_layer].uv = (u0, v0)
            f.loops[1][uv_layer].uv = (u1, v0)
            f.loops[2][uv_layer].uv = (u1, v1)
            f.loops[3][uv_layer].uv = (u0, v1)
    for cap in (rings[0], rings[-1]):
        try:
            f = bm.faces.new(cap)
            for l in f.loops:
                l[uv_layer].uv = (0.5, 0.5)
        except ValueError:
            pass
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    obj = attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=loc, subdiv=1)
    obj.rotation_euler = (roll_x, pitch_z, yaw_y)
    return obj


def _add_tergite_arch(name, rx_len, width_y, height_z, thick, mat, parent, loc=(0, 0, 0), pitch=0.0):
    """Builds an overlapping armored exoskeleton dorsal tergite plate arched over the trunk."""
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")
    nu = 5
    nv = 14
    rings = []
    for iu in range(nu + 1):
        t = iu / nu
        x = (0.5 - t) * rx_len
        taper = 0.90 + 0.10 * math.sin(t * math.pi)
        flare_z = t * 0.015  # Subtle rear lift to imbricate smoothly over next tergite without scalloping
        ring = []
        for iv in range(nv + 1):
            ang = (iv / nv - 0.5) * math.pi * 1.16  # Wrap ~209 deg around dorsal & upper flanks
            y = math.sin(ang) * width_y * taper
            z = math.cos(ang) * height_z * taper + flare_z
            ring.append(bm.verts.new((x, y, z)))
        rings.append(ring)
    for iu in range(nu):
        r0, r1 = rings[iu], rings[iu + 1]
        v0, v1 = iu / nu, (iu + 1) / nu
        for iv in range(nv):
            f = bm.faces.new((r0[iv], r0[iv + 1], r1[iv + 1], r1[iv]))
            u0, u1 = iv / nv, (iv + 1) / nv
            f.loops[0][uv_layer].uv = (u0, v0)
            f.loops[1][uv_layer].uv = (u1, v0)
            f.loops[2][uv_layer].uv = (u1, v1)
            f.loops[3][uv_layer].uv = (u0, v1)
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=thick)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    obj = attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=loc, subdiv=1)
    obj.rotation_euler = (0.0, pitch, 0.0)
    return obj


def build_anomalocaris():
    """
    Ground-up paleontological rebuild of Anomalocaris canadensis compared directly
    against Burgess Shale & MUSE museum reconstructions:
    - 12 imbricated dorsal tergite armor plates & striated gill lamellae bands
    - Oval H-sclerite cephalic shield, cheek P-sclerites & tilted Peytoia oral cone
    - Short armored eye stalks with golden-rimmed almond compound eyes
    - 14-podomere articulated frontal appendages with alternating dual barbed spines
    - 11 pairs of broad shingle-overlapped leaf-shaped swimming flaps with leading ribs
    - Dramatic upward-flaring 3-pair + central telson caudal tail fan
    """
    clear_scene()
    albedo, bump = tex_paths("anomalocaris")
    mat_body = make_pbr_material(
        "Mat_BodyPrimary",
        (0.18, 0.72, 0.82, 1.0),
        roughness=0.38,
        metallic=0.10,
        albedo_path=albedo,
        bump_path=bump,
        bump_strength=0.30,
    )
    mat_tergite = make_pbr_material(
        "Mat_Tergite",
        (0.14, 0.56, 0.68, 1.0),
        roughness=0.32,
        metallic=0.14,
        albedo_path=albedo,
        bump_path=bump,
        bump_strength=0.38,
    )
    mat_dark = make_pbr_material(
        "Mat_Secondary",
        (0.08, 0.34, 0.44, 1.0),
        roughness=0.30,
        metallic=0.22,
        bump_path=bump,
        bump_strength=0.25,
    )
    mat_flap = make_pbr_material(
        "Mat_Flap",
        (0.20, 0.68, 0.80, 1.0),
        roughness=0.34,
        metallic=0.08,
        albedo_path=albedo,
        bump_path=bump,
        bump_strength=0.22,
    )
    mat_cyan = make_pbr_material(
        "Mat_Accent",
        (0.20, 0.90, 0.96, 1.0),
        roughness=0.22,
        metallic=0.12,
        emissive=(0.14, 0.78, 0.90, 1.0),
        emissive_strength=0.52,
    )
    mat_amber = make_pbr_material(
        "Mat_Amber",
        (0.96, 0.66, 0.14, 1.0),
        roughness=0.25,
        metallic=0.15,
        emissive=(0.65, 0.36, 0.03, 1.0),
        emissive_strength=0.18,
    )
    mat_eye = make_pbr_material(
        "Mat_Eye",
        (0.14, 0.55, 0.45, 1.0),
        roughness=0.08,
        metallic=0.20,
        emissive=(0.06, 0.35, 0.28, 1.0),
        emissive_strength=0.30,
    )
    mat_pupil = make_pbr_material("Mat_Pupil", (0.04, 0.10, 0.12, 1.0), roughness=0.06, metallic=0.15)

    root = create_bone_node("Bone_Root")
    hips = create_bone_node("Bone_Hips", (0.0, 0.0, 1.25), parent=root)
    torso = create_bone_node("Bone_Torso", (0.0, 0.0, 0.0), parent=hips)

    # 1. Inner muscular core trunk (dorsoventrally streamlined fusiform profile)
    build_organic_tube(
        "Anom_TrunkCore",
        [
            (-1.82, 0.0, 0.04, 0.18, 0.11),
            (-1.25, 0.0, 0.08, 0.34, 0.19),
            (-0.45, 0.0, 0.11, 0.52, 0.26),
            (0.35, 0.0, 0.12, 0.56, 0.27),
            (0.98, 0.0, 0.12, 0.45, 0.23),
            (1.22, 0.0, 0.11, 0.36, 0.19),
        ],
        segs_u=24,
        segs_v=24,
        mat=mat_body,
        parent=torso,
        dorsal_keel=0.14,
        belly_flat=0.35,
        subdiv=1,
    )

    # 2. Twelve overlapping articulated dorsal exoskeleton tergite plates + gill-lamellae trim
    tergite_cfg = [
        (0.94, 0.26, 0.48, 0.25),
        (0.72, 0.27, 0.55, 0.27),
        (0.49, 0.28, 0.59, 0.29),
        (0.25, 0.29, 0.60, 0.29),
        (0.01, 0.29, 0.58, 0.28),
        (-0.23, 0.28, 0.54, 0.27),
        (-0.47, 0.27, 0.49, 0.25),
        (-0.70, 0.26, 0.44, 0.23),
        (-0.92, 0.25, 0.38, 0.20),
        (-1.14, 0.24, 0.33, 0.18),
        (-1.35, 0.23, 0.28, 0.15),
        (-1.55, 0.22, 0.23, 0.13),
    ]
    for ti, (tx, tlen, wy, hz) in enumerate(tergite_cfg):
        z_arch = 0.08 + math.sin((1.0 - ti / 12.0) * math.pi * 0.65) * 0.05
        _add_tergite_arch(
            f"Anom_Tergite_{ti}",
            tlen,
            wy,
            hz,
            thick=0.032,
            mat=mat_tergite if ti % 2 == 0 else mat_body,
            parent=torso,
            loc=(tx, 0.0, z_arch),
            pitch=-0.09,
        )
        # Striated dorsal gill-lamellae crest along each tergite border
        for s in (-1, 1):
            build_organic_tube(
                f"Anom_GillBar_{ti}_{s}",
                [
                    (tx + tlen * 0.38, s * wy * 0.55, z_arch + hz * 0.78, 0.028, 0.022),
                    (tx + tlen * 0.15, s * wy * 0.96, z_arch + hz * 0.22, 0.022, 0.018),
                ],
                8, 6, mat_cyan, torso, taper_start=False, subdiv=0,
            )

    neck = create_bone_node("Bone_Neck", (1.14, 0.0, 0.11), parent=torso)
    head = create_bone_node("Bone_Head", (0.14, 0.0, 0.02), parent=neck)

    # 3. Broad sculpted Cephalic Carapace (Oval Dorsal H-Sclerite + Cheek P-Elements)
    build_organic_tube(
        "Anom_HeadCapsule",
        [
            (-0.18, 0.0, 0.04, 0.44, 0.22),
            (0.24, 0.0, 0.06, 0.54, 0.26),
            (0.68, 0.0, 0.03, 0.42, 0.20),
            (0.98, 0.0, -0.02, 0.24, 0.13),
        ],
        segs_u=22,
        segs_v=16,
        mat=mat_body,
        parent=head,
        dorsal_keel=0.14,
        belly_flat=0.40,
        subdiv=1,
    )
    # Oval H-sclerite shield crowning the head
    h_plate = build_osteoderm_plate(
        "Anom_HSclerite",
        width=0.68,
        height=0.58,
        thickness=0.11,
        mat=mat_dark,
        parent=head,
        local_pos=(0.38, 0.0, 0.21),
        rot=(0.0, 0.08, 0.0),
        shape="hex",
    )
    h_plate.scale = (1.18, 0.88, 1.0)
    h_trim = build_osteoderm_plate(
        "Anom_HScleriteTrim",
        width=0.52,
        height=0.42,
        thickness=0.05,
        mat=mat_amber,
        parent=head,
        local_pos=(0.38, 0.0, 0.25),
        rot=(0.0, 0.08, 0.0),
        shape="hex",
    )
    h_trim.scale = (1.18, 0.88, 1.0)
    # Swept lateral cheek P-sclerites cradling the eye bases
    for s in (-1, 1):
        build_osteoderm_plate(
            f"Anom_PElement_{s}",
            width=0.52,
            height=0.22,
            thickness=0.07,
            mat=mat_dark,
            parent=head,
            local_pos=(0.32, s * 0.44, 0.02),
            rot=(s * 0.42, 0.05, -s * 0.18),
            shape="diamond",
        )

    # 4. Short Muscular Eye Stalks with Golden-Rimmed Compound Eyes (Special_EyeStalk0..1)
    for idx, s in enumerate((1, -1)):
        stalk = create_bone_node(f"Special_EyeStalk{idx}", (0.34, s * 0.38, 0.13), parent=head)
        build_organic_tube(
            f"Anom_EyeStalkTube{idx}",
            [(-0.02, 0.0, -0.02, 0.075, 0.068), (0.08, s * 0.20, 0.08, 0.068, 0.062)],
            14, 10, mat_tergite, stalk, taper_start=False, subdiv=1,
        )
        # Sleek golden-amber rim collar + almond faceted arthropod compound cornea
        build_organic_tube(
            f"Anom_EyeBezel{idx}",
            [
                (0.06, s * 0.17, 0.07, 0.095, 0.082),
                (0.11, s * 0.24, 0.09, 0.105, 0.090),
                (0.16, s * 0.29, 0.10, 0.082, 0.072),
            ],
            18, 10, mat_amber, stalk, subdiv=1,
        )
        bm_eye = bmesh.new()
        bmesh.ops.create_uvsphere(bm_eye, u_segments=18, v_segments=12, radius=0.096)
        eye_obj = attach_mesh_obj(bm_eye, f"Anom_CompoundEye{idx}", mat=mat_eye, parent=stalk, local_pos=(0.13, s * 0.27, 0.095), subdiv=1)
        eye_obj.scale = (1.35, 0.92, 0.90)
        eye_obj.rotation_euler = (0.0, 0.0, s * 0.22)

    # 5. Tilted Ventral Triradial Peytoia Oral Cone (Special_Mouth + Bone_Jaw)
    mouth = create_bone_node("Special_Mouth", (0.58, 0.0, -0.14), parent=head)
    mouth.rotation_euler = (0.0, 0.42, 0.0)
    jaw = create_bone_node("Bone_Jaw", (0.58, 0.0, -0.16), parent=head)
    # Oral cone collar & inner ring
    build_organic_tube(
        "Anom_MouthRing",
        [
            (0.0, -0.22, 0.0, 0.085, 0.075),
            (0.22, 0.0, 0.0, 0.085, 0.075),
            (0.0, 0.22, 0.0, 0.085, 0.075),
            (-0.22, 0.0, 0.0, 0.085, 0.075),
            (0.0, -0.22, 0.0, 0.085, 0.075),
        ],
        12, 18, mat_amber, mouth, cap_ends=False, subdiv=1,
    )
    for t in range(24):
        ang = (t / 24.0) * math.pi * 2.0
        # Alternating large triradial & smaller intercalary Peytoia teeth pointing inward
        is_major = (t % 8 == 0)
        tooth_len = 0.18 if is_major else (0.14 if t % 2 == 0 else 0.10)
        build_curved_claw_or_horn(
            f"Anom_OralTooth_{t}",
            tooth_len,
            0.032 if is_major else 0.022,
            0.05,
            (-math.cos(ang), -math.sin(ang), -0.35),
            mat_amber if t % 2 == 0 else mat_dark,
            mouth,
            (math.cos(ang) * 0.21, math.sin(ang) * 0.21, -0.02),
        )

    # 6. Two Forward-Sweeping 14-Podomere Articulated Raptorial Appendages (Bone_Arm0..1 + Special_Claw0..1)
    def _claw_curve(t):
        # Sweeps cleanly forward (+X) then hooks downward & gracefully curls inward
        x = 0.0 + 1.38 * math.sin(t * 1.48) - 0.28 * (t ** 3.2)
        z = -0.02 - 0.92 * (t ** 1.65)
        y_curl = -0.14 * (t ** 1.9)
        return x, y_curl, z

    for idx, s in enumerate((1, -1)):
        arm = create_bone_node(f"Bone_Arm{idx}", (0.86, s * 0.24, -0.04), parent=head)
        claw = create_bone_node(f"Special_Claw{idx}", (0.0, 0.0, 0.0), parent=arm)

        # Continuous inner chitin core along appendage curve
        core_pts = []
        for k in range(15):
            t = k / 14.0
            cx, cy, cz = _claw_curve(t)
            rad = 0.125 * (1.0 - 0.68 * (t ** 1.25))
            core_pts.append((cx, s * (cy + 0.04), cz, rad, rad * 1.15))
        build_organic_tube(f"Anom_AppendageCore_{idx}", core_pts, 14, 18, mat_tergite, claw, subdiv=1)

        # 13 discrete sculpted overlapping exoskeleton podomere cuffs + dual barbed endite spines
        for seg_i in range(13):
            t0 = seg_i / 14.0
            t1 = (seg_i + 0.85) / 14.0
            x0, y0, z0 = _claw_curve(t0)
            x1, y1, z1 = _claw_curve(t1)
            seg_rad = 0.132 * (1.0 - 0.66 * (t0 ** 1.25))
            build_organic_tube(
                f"Anom_Podomere_{idx}_{seg_i}",
                [
                    (x0, s * (y0 + 0.04), z0, seg_rad * 1.08, seg_rad * 1.24),
                    (x1, s * (y1 + 0.04), z1, seg_rad * 0.94, seg_rad * 1.08),
                ],
                12, 6,
                mat_dark if seg_i % 2 == 0 else mat_body,
                claw,
                taper_start=False,
                taper_end=False,
                subdiv=0,
            )
            # Ventral paired barbed endite spines (long curving saber + lateral auxiliary spinelet)
            if 1 <= seg_i <= 11:
                xm, ym, zm = _claw_curve((t0 + t1) * 0.5)
                tx_d, _, tz_d = (x1 - x0, 0.0, z1 - z0)
                t_len = math.hypot(tx_d, tz_d) + 1e-6
                # Ventral normal points downward & slightly forward-inward
                nx, nz = tz_d / t_len, -tx_d / t_len
                if nz > 0:
                    nx, nz = -nx, -nz
                sp_len = (0.34 if seg_i % 2 == 1 else 0.24) * (1.0 - 0.45 * (t0 ** 1.2))
                for lat in (-1, 1):
                    build_curved_claw_or_horn(
                        f"Anom_Endite_{idx}_{seg_i}_{lat}",
                        sp_len,
                        0.036 * (1.0 - 0.45 * t0),
                        0.18,
                        (nx * 0.85 - 0.35, -s * 0.15 + lat * 0.18, nz - 0.25),
                        mat_amber,
                        claw,
                        (xm, s * (ym + 0.04 + lat * seg_rad * 0.42), zm - seg_rad * 0.85),
                    )

    # 7. Eleven Pairs of Broad Imbricated Manta-Like Swimming Flaps (Special_Flap0..21)
    flap_idx = 0
    for i in range(11):
        # Envelope rises cleanly from shoulder (i=0) to broad mid-body wings (i=3..6), tapering back
        u = i / 10.0
        span_env = 0.52 + 0.62 * math.sin(math.pi * (u ** 0.72))
        chord_env = 0.34 + 0.16 * math.sin(math.pi * (u ** 0.75))
        fx = 0.86 - i * 0.235
        fy_attach = 0.28 + 0.16 * math.sin(math.pi * (u ** 0.75))
        fz_attach = 0.03 + 0.02 * math.sin(u * math.pi)
        for s in (1, -1):
            flap_node = create_bone_node(f"Special_Flap{flap_idx}", (fx, s * fy_attach, fz_attach), parent=torso)
            # Gentle downward-arched dihedral + venetian-shingle sweep so broad flaps silhouette crisply
            _add_leaf_flap_mesh(
                f"Anom_FlapBlade{flap_idx}",
                length_y=0.98 * span_env,
                chord_x=chord_env * 1.08,
                sweep_x=0.28 * span_env,
                thickness=0.036,
                side=s,
                mat=mat_flap,
                parent=flap_node,
                loc=(0.0, -s * 0.06, 0.0),
                rot_euler=(-s * 0.18, 0.16, -s * 0.14),
            )
            # Luminous cyan leading-edge fin ray vein
            build_organic_tube(
                f"Anom_FlapVein{flap_idx}",
                [
                    (chord_env * 0.26, 0.0, 0.015, 0.026, 0.018),
                    (chord_env * 0.14 - 0.10 * span_env, s * 0.48 * span_env, -0.05, 0.019, 0.014),
                    (-0.22 * span_env, s * 0.88 * span_env, -0.14, 0.012, 0.008),
                ],
                segs_u=10,
                segs_v=8,
                mat=mat_cyan,
                parent=flap_node,
                taper_start=False,
                subdiv=0,
            )
            flap_idx += 1

    # 8. Articulated Tapered Tail Peduncle (Bone_Tail0..3) + Terraced Caudal Tergites
    t_lens = (0.34, 0.30, 0.26, 0.22)
    t_rads = (0.21, 0.16, 0.12, 0.085, 0.055)
    p_tail = torso
    for i, tlen in enumerate(t_lens):
        seg = create_bone_node(
            f"Bone_Tail{i}",
            (-1.72 if i == 0 else -t_lens[i - 1], 0.0, 0.05 if i == 0 else 0.01),
            parent=p_tail,
        )
        build_organic_tube(
            f"Anom_TailSeg{i}",
            [(0.06, 0.0, 0.0, t_rads[i], t_rads[i] * 0.68), (-tlen - 0.04, 0.0, 0.0, t_rads[i + 1], t_rads[i + 1] * 0.68)],
            14, 10, mat_body, seg, taper_start=False, taper_end=(i == len(t_lens) - 1), subdiv=1,
        )
        _add_tergite_arch(
            f"Anom_TailTergite{i}",
            tlen * 0.95,
            t_rads[i] * 1.05,
            t_rads[i] * 0.72,
            thick=0.022,
            mat=mat_tergite,
            parent=seg,
            loc=(-tlen * 0.42, 0.0, 0.01),
            pitch=-0.03,
        )
        p_tail = seg

    # 9. Dramatic Multi-Tiered Upward-Flaring Caudal Tail Fan (3 pairs + central telson blade)
    from mathutils import Euler, Vector
    tail_fan = create_bone_node("Special_TailFan", (-0.20, 0.0, 0.02), parent=p_tail)
    # Central median tail fin blade
    _add_tail_blade_mesh(
        "Anom_TailMedianBlade",
        length=0.92,
        width=0.22,
        thickness=0.028,
        pitch_z=0.34,
        yaw_y=0.0,
        roll_x=0.0,
        mat=mat_flap,
        parent=tail_fan,
        loc=(0.04, 0.0, 0.02),
    )
    med_end = Euler((0.0, 0.34, 0.0), 'XYZ').to_matrix() @ Vector((-0.84, 0.0, 0.0))
    build_organic_tube(
        "Anom_TailMedianQuill",
        [(0.04, 0.0, 0.02, 0.030, 0.022), (0.04 + med_end.x, med_end.y, 0.02 + med_end.z, 0.010, 0.008)],
        8, 8, mat_amber, tail_fan, taper_start=False, subdiv=0,
    )
    # 3 stepped upward-swept pairs of broad peacock-shrimp caudal blades
    fan_blades = [
        (0.95, 0.32, 0.56, 0.24, 0.18),
        (1.06, 0.34, 0.80, 0.40, 0.30),
        (0.90, 0.28, 1.04, 0.54, 0.42),
    ]
    for b_idx, (blen, bwid, bpitch, byaw, broll) in enumerate(fan_blades):
        for s in (1, -1):
            base_loc = (0.04 + b_idx * 0.04, s * 0.04, 0.02 + b_idx * 0.02)
            _add_tail_blade_mesh(
                f"Anom_TailBlade_{b_idx}_{s}",
                length=blen,
                width=bwid,
                thickness=0.026,
                pitch_z=bpitch,
                yaw_y=-s * byaw,
                roll_x=s * broll,
                mat=mat_flap if b_idx % 2 == 0 else mat_tergite,
                parent=tail_fan,
                loc=base_loc,
            )
            q_end = Euler((s * broll, bpitch, -s * byaw), 'XYZ').to_matrix() @ Vector((-blen * 0.90, 0.0, 0.0))
            build_organic_tube(
                f"Anom_TailQuill_{b_idx}_{s}",
                [(base_loc[0], base_loc[1], base_loc[2], 0.026, 0.020), (base_loc[0] + q_end.x, base_loc[1] + q_end.y, base_loc[2] + q_end.z, 0.009, 0.008)],
                8, 6, mat_cyan, tail_fan, taper_start=False, subdiv=0,
            )

    out = os.path.join(OUT_DIR, "anomalocaris.glb")
    sz = export_fighter_glb(out)
    print(f"[GLB OK] anomalocaris -> {out} ({sz} bytes)")


def build_pulmonoscorpius():
    clear_scene()
    albedo, bump = tex_paths("pulmonoscorpius")
    mat_body = make_pbr_material("Mat_BodyPrimary", (0.76, 0.42, 0.98, 1), roughness=0.28, metallic=0.12, albedo_path=albedo, bump_path=bump, bump_strength=0.30)
    mat_dark = make_pbr_material("Mat_Secondary", (0.32, 0.14, 0.52, 1), roughness=0.30, metallic=0.14, bump_path=bump, bump_strength=0.24)
    mat_stinger = make_pbr_material("Mat_Accent", (0.76, 0.08, 0.22, 1), roughness=0.18, metallic=0.12, emissive=(0.55, 0.04, 0.14, 1), emissive_strength=0.30)
    mat_eye = make_pbr_material("Mat_Eye", (0.98, 0.88, 0.35, 1), roughness=0.10, emissive=(0.8, 0.55, 0.1, 1), emissive_strength=0.55)

    root = create_bone_node("Bone_Root")
    hips = create_bone_node("Bone_Hips", (0.0, 0.0, 0.95), parent=root)
    torso = create_bone_node("Bone_Torso", (0.0, 0.0, 0.0), parent=hips)

    # Armored prosoma & 7 mesosomal tergite plates (broad flat arachnid abdomen)
    build_organic_tube(
        "Scorp_Mesosoma",
        [
            (-1.05, 0.0, 0.05, 0.26, 0.15),
            (-0.45, 0.0, 0.08, 0.68, 0.27),
            (0.35, 0.0, 0.08, 0.72, 0.29),
            (1.00, 0.0, 0.04, 0.54, 0.24),
        ],
        segs_u=22,
        segs_v=20,
        mat=mat_body,
        parent=torso,
        dorsal_keel=0.05,
        belly_flat=0.40,
        subdiv=1,
    )
    for i in range(7):
        t = i / 6.0
        tx = -0.82 + t * 1.62
        wid = 0.72 + 0.52 * math.sin(math.pi * (0.15 + 0.75 * t))
        terg = build_osteoderm_plate(f"Scorp_Tergite_{i}", 0.28, 0.22, 0.055, mat_dark if i % 2 == 0 else mat_body, torso, (tx, 0.0, 0.27), (0.0, -0.05, 0.0), 'hex')
        terg.scale = (1.0, wid / 0.28, 1.0)

    neck = create_bone_node("Bone_Neck", (0.96, 0.0, 0.05), parent=torso)
    head = create_bone_node("Bone_Head", (0.14, 0.0, 0.02), parent=neck)
    build_organic_tube("Scorp_Prosoma", [(-0.1, 0.0, 0.0, 0.52, 0.22), (0.38, 0.0, -0.02, 0.44, 0.17)], 18, 12, mat_dark, head, belly_flat=0.45, subdiv=1)
    # Forward-set median eye tubercle + lateral eye clusters (Pulmonoscorpius hallmark!)
    for s in (-1, 1):
        build_anatomical_eye(f"Scorp_MedianEye_{s}", 0.052, mat_eye, mat_dark, head, (0.28, s * 0.08, 0.18))
        build_anatomical_eye(f"Scorp_Eye_{s}", 0.042, mat_eye, mat_dark, head, (0.36, s * 0.28, 0.10))
    jaw = create_bone_node("Bone_Jaw", (0.34, 0.0, -0.04), parent=head)
    for s in (-1, 1):
        build_curved_claw_or_horn(f"Scorp_Chelicera_{s}", 0.28, 0.06, 0.12, (0.95, -s * 0.2, -0.1), mat_stinger, jaw, (0.04, s * 0.10, 0.0))

    # Huge sleek chelate pedipalp pincers (Bone_Arm0..1)
    for idx, s in enumerate((1, -1)):
        arm = create_bone_node(f"Bone_Arm{idx}", (0.85, s * 0.48, 0.04), parent=torso)
        build_organic_tube(
            f"Scorp_Pedipalp_{idx}",
            [
                (0.0, 0.0, 0.0, 0.13, 0.11),
                (0.42, s * 0.32, 0.08, 0.16, 0.13),
                (0.92, s * 0.20, 0.06, 0.24, 0.17),
                (1.22, s * 0.08, 0.04, 0.21, 0.15),
            ],
            16,
            16,
            mat_body,
            arm,
            subdiv=1,
        )
        # Upper & lower chela claw fingers
        build_curved_claw_or_horn(f"Scorp_PincerUpper_{idx}", 0.66, 0.10, 0.22, (0.92, -s * 0.28, 0.12), mat_stinger, arm, (1.15, s * 0.08, 0.06))
        build_curved_claw_or_horn(f"Scorp_PincerLower_{idx}", 0.60, 0.085, 0.20, (0.92, -s * 0.22, -0.18), mat_dark, arm, (1.15, s * 0.08, -0.02))

    # 8 segmented walking legs (Bone_Leg0..7) reaching down to Z = -0.95 with arachnid X-splay
    leg_idx = 0
    leg_fan_x = (0.36, 0.12, -0.14, -0.42)
    for row_i, row_x in enumerate((0.55, 0.15, -0.25, -0.65)):
        fx = leg_fan_x[row_i]
        for s in (1, -1):
            leg = create_bone_node(f"Bone_Leg{leg_idx}", (row_x, s * 0.56, -0.05), parent=hips)
            build_organic_tube(
                f"Scorp_LegMesh{leg_idx}",
                [
                    (0.0, 0.0, 0.0, 0.085, 0.080),
                    (fx * 0.45 + 0.06, s * 0.44, 0.22, 0.072, 0.068),
                    (fx * 0.85 + 0.02, s * 0.72, -0.34, 0.055, 0.055),
                    (fx * 1.05, s * 0.82, -0.88, 0.028, 0.028),
                ],
                12,
                14,
                mat_dark if leg_idx % 2 == 0 else mat_body,
                leg,
                subdiv=1,
            )
            leg_idx += 1

    # 5-segment curving metasoma (Bone_Tail0..4) + bulbous venomous telson & curved aculeus (Special_Stinger)
    tail_offsets = [
        (-1.02, 0.0, 0.10, -0.45, 0.10, 0.35),
        (-0.42, 0.0, 0.32, -0.30, 0.0, 0.42),
        (-0.28, 0.0, 0.40, 0.08, 0.0, 0.45),
        (-0.02, 0.0, 0.44, 0.42, 0.0, 0.34),
        (0.38, 0.0, 0.30, 0.48, 0.0, 0.05),
    ]
    p_tail = torso
    for i, (px, py, pz, dx, dy, dz) in enumerate(tail_offsets):
        seg = create_bone_node(f"Bone_Tail{i}", (px if i == 0 else tail_offsets[i - 1][3], 0.0, pz if i == 0 else tail_offsets[i - 1][5]), parent=p_tail)
        r = 0.21 - i * 0.018
        build_organic_tube(f"Scorp_TailSeg{i}", [(-dx * 0.10, -dy * 0.10, -dz * 0.10, r * 1.02, r * 0.92), (dx * 0.50, dy * 0.50, dz * 0.50, r * 1.08, r * 0.98), (dx * 1.06, dy * 1.06, dz * 1.06, r * 0.85, r * 0.82)], 14, 14, mat_body if i % 2 == 0 else mat_dark, seg, dorsal_keel=0.16, taper_start=False, taper_end=False, subdiv=1)
        p_tail = seg

    stinger = create_bone_node("Special_Stinger", (0.48, 0.0, 0.05), parent=p_tail)
    build_organic_tube("Scorp_TelsonBulb", [(0.0, 0.0, 0.0, 0.12, 0.12), (0.24, 0.0, -0.04, 0.20, 0.18), (0.42, 0.0, -0.10, 0.09, 0.09)], 16, 12, mat_stinger, stinger, subdiv=1)
    build_curved_claw_or_horn("Scorp_Aculeus", 0.48, 0.06, 0.28, (0.85, 0.0, -0.55), mat_stinger, stinger, (0.38, 0.0, -0.10))

    out = os.path.join(OUT_DIR, "pulmonoscorpius.glb")
    sz = export_fighter_glb(out)
    print(f"[GLB OK] pulmonoscorpius -> {out} ({sz} bytes)")


def build_spinosaurus():
    clear_scene()
    albedo, bump = tex_paths("spinosaurus")
    mat_body = make_pbr_material("Mat_BodyPrimary", (0.24, 0.62, 0.88, 1), roughness=0.44, metallic=0.06, albedo_path=albedo, bump_path=bump, bump_strength=0.28)
    mat_sail = make_pbr_material("Mat_Accent", (0.14, 0.80, 0.88, 1), roughness=0.40, metallic=0.06, albedo_path=albedo, bump_path=bump, bump_strength=0.22, emissive=(0.04, 0.36, 0.48, 1), emissive_strength=0.14)
    mat_dark = make_pbr_material("Mat_Secondary", (0.16, 0.36, 0.52, 1), roughness=0.46, metallic=0.08, albedo_path=albedo, bump_path=bump, bump_strength=0.22)
    mat_tooth = make_pbr_material("Mat_Tooth", (0.98, 0.96, 0.88, 1), roughness=0.18)
    mat_iris = make_pbr_material("Mat_Eye", (0.98, 0.75, 0.15, 1), roughness=0.1, emissive=(0.65, 0.45, 0.05, 1), emissive_strength=0.45)
    mat_pupil = make_pbr_material("Mat_Pupil", (0.02, 0.02, 0.02, 1), roughness=0.1)

    root = create_bone_node("Bone_Root")
    hips = create_bone_node("Bone_Hips", (0.0, 0.0, 1.85), parent=root)
    torso = create_bone_node("Bone_Torso", (0.0, 0.0, 0.0), parent=hips)

    # Sleek predatory semi-aquatic theropod torso (muscular hips -> ribcage -> tapered shoulder girdle)
    build_organic_tube(
        "Spino_Torso",
        [
            (-1.38, 0.0, 0.14, 0.24, 0.27),
            (-0.92, 0.0, 0.14, 0.36, 0.42),
            (-0.22, 0.0, 0.14, 0.48, 0.55),
            (0.46, 0.0, 0.16, 0.50, 0.58),
            (1.04, 0.0, 0.22, 0.36, 0.42),
            (1.32, 0.0, 0.28, 0.26, 0.30),
        ],
        segs_u=24,
        segs_v=24,
        mat=mat_body,
        parent=torso,
        dorsal_keel=0.18,
        belly_flat=0.12,
        taper_start=True,
        taper_end=True,
        subdiv=1,
    )

    # Iconic Neural-Spine Sail (Special_Sail)
    sail = create_bone_node("Special_Sail", (0.0, 0.0, 0.48), parent=torso)
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")
    n_ribs = 17
    top_l, top_r, bot_l, bot_r = [], [], [], []
    for i in range(n_ribs):
        t = i / (n_ribs - 1)
        x = -1.12 + t * 2.18
        arch = math.sin(t * math.pi) ** 0.58
        saddle = 1.0 - 0.10 * math.exp(-((t - 0.56) / 0.14) ** 2)
        h = 0.18 + 1.44 * arch * saddle
        w = 0.048
        bot_l.append(bm.verts.new((x, w, -0.06)))
        bot_r.append(bm.verts.new((x, -w, -0.06)))
        top_l.append(bm.verts.new((x, w * 0.38, h)))
        top_r.append(bm.verts.new((x, -w * 0.38, h)))
    for i in range(n_ribs - 1):
        u0, u1 = i / (n_ribs - 1), (i + 1) / (n_ribs - 1)
        f1 = bm.faces.new((bot_l[i], bot_l[i + 1], top_l[i + 1], top_l[i]))
        f2 = bm.faces.new((top_r[i], top_r[i + 1], bot_r[i + 1], bot_r[i]))
        f3 = bm.faces.new((top_l[i], top_l[i + 1], top_r[i + 1], top_r[i]))
        for idx_l, uv in enumerate([(u0, 0.22), (u1, 0.22), (u1, 0.05), (u0, 0.05)]):
            f1.loops[idx_l][uv_layer].uv = uv
        for idx_l, uv in enumerate([(u0, 0.05), (u1, 0.05), (u1, 0.22), (u0, 0.22)]):
            f2.loops[idx_l][uv_layer].uv = uv
        for idx_l, uv in enumerate([(u0, 0.04), (u1, 0.04), (u1, 0.04), (u0, 0.04)]):
            f3.loops[idx_l][uv_layer].uv = uv
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    attach_mesh_obj(bm, "Spino_SailMembrane", mat=mat_sail, parent=sail, subdiv=1)

    for i in range(n_ribs):
        t = i / (n_ribs - 1)
        x = -1.12 + t * 2.18
        arch = math.sin(t * math.pi) ** 0.58
        saddle = 1.0 - 0.10 * math.exp(-((t - 0.56) / 0.14) ** 2)
        h = 0.18 + 1.44 * arch * saddle
        build_organic_tube(f"Spino_NeuralSpine_{i}", [(x, 0.0, -0.06, 0.046, 0.044), (x, 0.0, h * 0.96, 0.022, 0.022)], 8, 6, mat_dark, sail, subdiv=0)

    # Flowing S-curved muscular neck & crocodile-snouted skull blended deep into chest
    neck = create_bone_node("Bone_Neck", (1.06, 0.0, 0.22), parent=torso)
    build_organic_tube(
        "Spino_Neck",
        [
            (-0.22, 0.0, -0.08, 0.34, 0.40),
            (0.08, 0.0, 0.08, 0.28, 0.33),
            (0.46, 0.0, 0.36, 0.22, 0.26),
            (0.84, 0.0, 0.64, 0.19, 0.23),
        ],
        18,
        18,
        mat_body,
        neck,
        dorsal_keel=0.10,
        taper_start=False,
        taper_end=False,
        subdiv=1,
    )

    head = create_bone_node("Bone_Head", (0.82, 0.0, 0.64), parent=neck)
    head.rotation_euler = (0.0, 0.14, 0.0)
    # Elongated gharial-like snout with distinct notched terminal premaxillary rosette
    build_organic_tube(
        "Spino_Cranium",
        [
            (-0.08, 0.0, 0.02, 0.23, 0.24),
            (0.32, 0.0, 0.03, 0.18, 0.19),
            (0.82, 0.0, -0.03, 0.12, 0.13),
            (1.10, 0.0, -0.05, 0.11, 0.11),
            (1.30, 0.0, -0.06, 0.15, 0.13),
            (1.46, 0.0, -0.07, 0.10, 0.09),
        ],
        20,
        20,
        mat_body,
        head,
        dorsal_keel=0.14,
        belly_flat=0.28,
        subdiv=1,
    )
    # Elongated narrow sculpted nasal/lacrimal crest embedded cleanly on snout bridge
    build_organic_tube(
        "Spino_HeadCrest",
        [(0.18, 0.0, 0.15, 0.035, 0.08), (0.36, 0.0, 0.18, 0.030, 0.11), (0.58, 0.0, 0.11, 0.022, 0.06)],
        12, 10, mat_sail, head, dorsal_keel=0.22, subdiv=1
    )
    for s in (-1, 1):
        build_anatomical_eye(f"Spino_Eye_{s}", 0.052, mat_iris, mat_pupil, head, (0.24, s * 0.21, 0.12))
        for ti in range(7):
            tx = 0.45 + ti * 0.12
            build_curved_claw_or_horn(f"Spino_UpperTooth_{s}_{ti}", 0.11 if ti != 5 else 0.15, 0.022, 0.04, (0.05, 0.0, -1.0), mat_tooth, head, (tx, s * 0.11, -0.10))

    jaw = create_bone_node("Bone_Jaw", (0.14, 0.0, -0.12), parent=head)
    build_organic_tube("Spino_Jaw", [(0.0, 0.0, 0.0, 0.17, 0.08), (0.98, 0.0, -0.02, 0.11, 0.06)], 16, 12, mat_body, jaw, subdiv=1)
    for s in (-1, 1):
        for ti in range(6):
            tx = 0.32 + ti * 0.12
            build_curved_claw_or_horn(f"Spino_LowerTooth_{s}_{ti}", 0.09, 0.018, 0.04, (0.05, 0.0, 1.0), mat_tooth, jaw, (tx, s * 0.09, 0.05))

    # Muscular slashing forelimbs (Bone_Arm0..1)
    for idx, ly in enumerate((0.48, -0.48)):
        side = 1.0 if ly > 0 else -1.0
        arm = create_bone_node(f"Bone_Arm{idx}", (0.85, ly, -0.06), parent=torso)
        build_organic_tube(
            f"Spino_Arm{idx}",
            [(0.0, 0.0, 0.0, 0.13, 0.15), (0.12, side * 0.04, -0.34, 0.10, 0.11), (0.36, 0.0, -0.60, 0.08, 0.08)],
            14,
            12,
            mat_body,
            arm,
            subdiv=1,
        )
        for ci, dy in enumerate((-0.05, 0.0, 0.05)):
            build_curved_claw_or_horn(f"Spino_ArmClaw{idx}_{ci}", 0.24, 0.032, 0.22, (0.85, 0.0, -0.55), mat_dark, arm, (0.36, dy, -0.60))

    # Hind legs (Bone_Leg0..1) resting cleanly on Z = -1.85 with grounded 3-toed footpads
    for idx, ly in enumerate((0.46, -0.46)):
        side = 1.0 if ly > 0 else -1.0
        leg = create_bone_node(f"Bone_Leg{idx}", (-0.36, ly, -0.06), parent=hips)
        build_organic_tube(
            f"Spino_Leg{idx}",
            [
                (0.0, 0.0, 0.08, 0.32, 0.36),
                (0.24, side * 0.03, -0.74, 0.21, 0.22),
                (-0.14, side * 0.02, -1.32, 0.14, 0.15),
                (0.10, side * 0.02, -1.75, 0.14, 0.12),
            ],
            16, 20, mat_body, leg, taper_end=False, subdiv=1,
        )
        build_organic_tube(
            f"Spino_FootPad{idx}",
            [(-0.04, side * 0.02, -1.75, 0.16, 0.08), (0.28, side * 0.02, -1.77, 0.18, 0.06)],
            12, 10, mat_body, leg, belly_flat=0.28, subdiv=1
        )
        for ci, dy in enumerate((-0.09, 0.0, 0.09)):
            build_curved_claw_or_horn(f"Spino_FootClaw{idx}_{ci}", 0.18, 0.035, 0.12, (1.0, 0.0, -0.18), mat_dark, leg, (0.26, side * 0.02 + dy, -1.76))

    # 2020 Aquatic Paddle Tail (Bone_Tail0..3): long muscular tail core + sleek sculpted paddle fin
    t_lens = (0.86, 0.84, 0.80, 0.78)
    t_rads_y = (0.30, 0.20, 0.12, 0.065, 0.025)
    t_rads_z = (0.32, 0.21, 0.13, 0.075, 0.035)
    fin_hz = (0.18, 0.40, 0.44, 0.32, 0.05)
    p_tail = torso
    for i, tlen in enumerate(t_lens):
        seg = create_bone_node(f"Bone_Tail{i}", (-0.98 if i == 0 else -t_lens[i - 1], 0.0, 0.12 if i == 0 else 0.02), parent=p_tail)
        # Muscular tail core overlapping cleanly into pelvis
        build_organic_tube(
            f"Spino_TailSeg{i}",
            [(0.22, 0.0, 0.0, t_rads_y[i], t_rads_z[i]), (-tlen * 0.5, 0.0, 0.0, (t_rads_y[i] + t_rads_y[i + 1]) * 0.52, (t_rads_z[i] + t_rads_z[i + 1]) * 0.52), (-tlen - 0.10, 0.0, 0.0, t_rads_y[i + 1], t_rads_z[i + 1])],
            16, 14, mat_body, seg, taper_start=False, taper_end=(i == len(t_lens) - 1), subdiv=1,
        )
        # Sleek laterally-compressed aquatic paddle blade with seamless taper
        build_organic_tube(
            f"Spino_TailFin{i}",
            [
                (0.14, 0.0, 0.05, 0.036, fin_hz[i]),
                (-tlen * 0.5, 0.0, 0.06, 0.032, (fin_hz[i] + fin_hz[i + 1]) * 0.52),
                (-tlen - 0.08, 0.0, 0.05, 0.026, fin_hz[i + 1]),
            ],
            12, 14, mat_sail, seg, dorsal_keel=0.16, cap_ends=(i == len(t_lens) - 1), taper_start=False, taper_end=(i == len(t_lens) - 1), subdiv=1,
        )
        p_tail = seg

    out = os.path.join(OUT_DIR, "spinosaurus.glb")
    sz = export_fighter_glb(out)
    print(f"[GLB OK] spinosaurus -> {out} ({sz} bytes)")


def run_all():
    build_anomalocaris()
    build_pulmonoscorpius()
    build_spinosaurus()


if __name__ == "__main__":
    run_all()
