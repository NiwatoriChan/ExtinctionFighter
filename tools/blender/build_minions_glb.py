"""Procedural anatomical 3D builder for all 19 ExtinctionFighter campaign minions.

Run inside Blender 5.x (or via MCP execute_blender_code) to sculpt, rig, and
export all `assets/models/minions/<enemyType>.glb` assets.

Coordinate convention in Blender:
  +X = forward (facing direction)
  +Z = up (feet/ventral contact at Z = 0.0 for ground minions)
  +Y / -Y = left / right
glTF export uses `export_yup=True` so Three.js receives +X forward, +Y up, -Z/+Z left/right.
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
    ROOT,
    TEX_DIR,
    clear_scene,
    make_pbr_material,
    create_bone_node,
    attach_mesh_obj,
    build_organic_tube,
    build_curved_claw_or_horn,
    build_osteoderm_plate,
    build_anatomical_eye,
    export_fighter_glb,
)

MINION_OUT_DIR = os.path.join(ROOT, "assets", "models", "minions")

ALL_MINION_TYPES = [
    "cambrian_trilobite",
    "opabinia_radiodont_elite",
    "orthoceras",
    "eurypterid",
    "jawless_fish",
    "shark_placoderm",
    "bothriolepis",
    "meganeura",
    "arthropleura",
    "synapsid",
    "scutosaurus",
    "raptor",
    "triassic_hound",
    "dino_tank",
    "magma_ceratopsian",
    "mammal",
    "serpent",
    "bird_pterosaur",
    "glacier_panther",
]


def _tube(name, ctrl_points, **kwargs):
    """Normalize control points into flat (x, y, z, rx, rz) tuples for build_organic_tube."""
    flat = []
    for p in ctrl_points:
        if isinstance(p[0], (tuple, list, Vector)):
            xyz = p[0]
            rx = p[1]
            rz = p[2] if len(p) > 2 else p[1]
            flat.append((float(xyz[0]), float(xyz[1]), float(xyz[2]), float(rx), float(rz)))
        else:
            flat.append(p)
    return build_organic_tube(name, flat, **kwargs)


def _bump_tex(species):
    """Return existing bump texture path for a species, or None if missing."""
    if not species:
        return None
    path = os.path.join(TEX_DIR, f"{species}_bump.png")
    return path if os.path.exists(path) else None


def _minion_mats(
    bump_species,
    body_col,
    sec_col,
    acc_col,
    eye_col=(0.95, 0.72, 0.15, 1.0),
    roughness=0.52,
    metallic=0.06,
    acc_emissive=None,
    acc_emissive_strength=0.0,
    wing_col=None,
    wing_alpha=0.55,
):
    """Create standardized PBR material dictionary for a campaign minion."""
    b_path = _bump_tex(bump_species)
    mats = {
        "body": make_pbr_material(
            "Mat_BodyPrimary",
            base_color=body_col,
            roughness=roughness,
            metallic=metallic,
            bump_path=b_path,
            bump_strength=0.22,
        ),
        "sec": make_pbr_material(
            "Mat_Secondary",
            base_color=sec_col,
            roughness=min(0.85, roughness + 0.08),
            metallic=metallic * 0.5,
            bump_path=b_path,
            bump_strength=0.14,
        ),
        "acc": make_pbr_material(
            "Mat_Accent",
            base_color=acc_col,
            roughness=max(0.22, roughness - 0.15),
            metallic=min(0.45, metallic + 0.08),
            emissive=acc_emissive,
            emissive_strength=acc_emissive_strength,
        ),
        "eye": make_pbr_material(
            "Mat_Eye",
            base_color=eye_col,
            roughness=0.12,
            metallic=0.05,
            emissive=eye_col[:3] if eye_col else None,
            emissive_strength=0.35,
        ),
        "pupil": make_pbr_material(
            "Mat_Pupil",
            base_color=(0.02, 0.02, 0.03, 1.0),
            roughness=0.08,
            metallic=0.0,
        ),
        "tooth": make_pbr_material(
            "Mat_Tooth",
            base_color=(0.92, 0.88, 0.78, 1.0),
            roughness=0.24,
            metallic=0.04,
            bump_path=_bump_tex("trex_tooth"),
            bump_strength=0.08,
        ),
    }
    if wing_col is not None:
        mats["wing"] = make_pbr_material(
            "Mat_Wing",
            base_color=wing_col,
            roughness=0.28,
            metallic=0.12,
            alpha=wing_alpha,
        )
    return mats


def _build_curved_tergite(
    name,
    length_x=0.22,
    width_y=0.90,
    thickness=0.05,
    arch_z=0.10,
    mat=None,
    parent=None,
    local_pos=(0.0, 0.0, 0.0),
    sweep_x=-0.08,
):
    """Build an arched dorsal arthropod tergite/pleural shield plate spanning +/-Y."""
    bm = bmesh.new()
    u_segs = 8
    top_rings = []
    bot_rings = []
    for iu in range(u_segs + 1):
        t = (iu / u_segs) * 2.0 - 1.0  # -1..+1 across Y
        y = t * width_y * 0.5
        z_curve = arch_z * (1.0 - t * t)
        dx_sweep = sweep_x * (t * t)
        chord = length_x * (1.0 - 0.25 * t * t)
        pts_top = [
            Vector((dx_sweep + chord * 0.5, y, z_curve + thickness * 0.5)),
            Vector((dx_sweep - chord * 0.5, y, z_curve + thickness * 0.35)),
        ]
        pts_bot = [
            Vector((dx_sweep + chord * 0.5, y, z_curve - thickness * 0.4)),
            Vector((dx_sweep - chord * 0.5, y, z_curve - thickness * 0.45)),
        ]
        top_rings.append([bm.verts.new(p) for p in pts_top])
        bot_rings.append([bm.verts.new(p) for p in pts_bot])

    for iu in range(u_segs):
        t0, t1 = top_rings[iu], top_rings[iu + 1]
        b0, b1 = bot_rings[iu], bot_rings[iu + 1]
        bm.faces.new((t0[1], t0[0], t1[0], t1[1]))  # Top
        bm.faces.new((b0[0], b0[1], b1[1], b1[0]))  # Bottom
        bm.faces.new((b0[0], t0[0], t1[0], b1[0]))  # Leading
        bm.faces.new((t0[1], b0[1], b1[1], t1[1]))  # Trailing
    # End caps
    bm.faces.new((top_rings[0][0], top_rings[0][1], bot_rings[0][1], bot_rings[0][0]))
    bm.faces.new((top_rings[-1][1], top_rings[-1][0], bot_rings[-1][0], bot_rings[-1][1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=local_pos, subdiv=1)


def _build_tapered_fin(
    name,
    ctrl_pts,
    chord=0.45,
    thickness=0.04,
    mat=None,
    parent=None,
    local_pos=(0.0, 0.0, 0.0),
    rot=(0.0, 0.0, 0.0),
    subdiv=1,
):
    """Build an aerodynamic/hydrodynamic fin or lobe along ctrl_pts [(pos, scale), ...]."""
    bm = bmesh.new()
    rings = []
    segs_v = 10
    n_pts = len(ctrl_pts)
    for i, (pt, sc) in enumerate(ctrl_pts):
        t = i / max(1, n_pts - 1)
        p = Vector(pt)
        if i == 0:
            tangent = Vector(ctrl_pts[1][0]) - p
        elif i == n_pts - 1:
            tangent = p - Vector(ctrl_pts[i - 1][0])
        else:
            tangent = Vector(ctrl_pts[i + 1][0]) - Vector(ctrl_pts[i - 1][0])
        if tangent.length < 1e-5:
            tangent = Vector((0.0, 1.0, 0.0))
        else:
            tangent.normalize()
        c_half = chord * 0.5 * sc * (1.0 - 0.12 * t)
        th_half = thickness * 0.5 * sc * (1.0 - 0.55 * t)
        ring = []
        is_lateral = abs(tangent.y) >= 0.4
        for j in range(segs_v):
            ang = 2.0 * math.pi * j / segs_v
            ca = math.cos(ang)
            sa = math.sin(ang)
            foil_th = th_half * (0.55 + 0.45 * ca)
            if is_lateral:
                offset = Vector((ca * c_half, 0.0, sa * foil_th))
            else:
                offset = Vector((ca * c_half, sa * foil_th, 0.0))
            ring.append(bm.verts.new(p + offset))
        rings.append(ring)

    for i in range(len(rings) - 1):
        r0, r1 = rings[i], rings[i + 1]
        for j in range(segs_v):
            jn = (j + 1) % segs_v
            bm.faces.new((r0[j], r0[jn], r1[jn], r1[j]))
    bm.faces.new(reversed(rings[0]))
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    obj = attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=local_pos, subdiv=subdiv)
    obj.rotation_euler = Euler(rot, "XYZ")
    return obj


def _build_segmented_limb(
    bone_name,
    hip_pos,
    knee_offset,
    foot_offset,
    r_top,
    r_mid,
    r_bot,
    mat_limb,
    mat_claw,
    parent,
    claws=2,
    claw_len=0.14,
):
    """Create an articulated vertebrate limb Bone + anatomical 3-segment sculpted mesh + footpad."""
    bone = create_bone_node(bone_name, local_pos=hip_pos, parent=parent)
    p0 = Vector((0.0, 0.0, 0.0))
    p1 = Vector(knee_offset)
    p2 = Vector(foot_offset)
    # Introduce natural anatomical bend (elbow/hock mid-joint + planted foot pad)
    ankle = p1.lerp(p2, 0.72) + Vector((-0.07, 0.0, 0.04))
    heel = Vector((p2.x - 0.02, p2.y, p2.z + r_bot * 0.45))
    toe = Vector((p2.x + claw_len * 0.45, p2.y, p2.z + r_bot * 0.40))
    ctrl = [
        (tuple(p0 + Vector((0.0, 0.0, 0.04))), r_top * 1.18, r_top * 1.10),
        (tuple(p0.lerp(p1, 0.45)), r_top * 0.92, r_top * 0.88),
        (tuple(p1), r_mid, r_mid * 0.94),
        (tuple(ankle), r_bot * 1.04, r_bot * 0.98),
        (tuple(heel), r_bot * 1.08, r_bot * 0.65),
        (tuple(toe), r_bot * 1.15, r_bot * 0.55),
    ]
    _tube(
        f"{bone_name}_Limb",
        ctrl,
        segs_u=12,
        segs_v=14,
        mat=mat_limb,
        parent=bone,
        subdiv=1,
    )
    if claws > 0 and mat_claw is not None:
        spread = max(0.036, r_bot * 0.62)
        mid_idx = (claws - 1) * 0.5
        for c_idx in range(claws):
            dy = (c_idx - mid_idx) * spread
            build_curved_claw_or_horn(
                f"{bone_name}_Claw{c_idx}",
                length=claw_len,
                base_r=max(0.020, r_bot * 0.34),
                curve_bend=claw_len * 0.25,
                direction=(1.0, dy * 1.2, -0.30),
                mat=mat_claw,
                parent=bone,
                local_pos=(toe.x + 0.01, toe.y + dy, toe.z),
                segs_u=7,
                segs_v=8,
            )
    return bone


def _build_digitigrade_leg(
    bone_name,
    hip_pos,
    side,
    height=0.88,
    r_thigh=0.14,
    r_ankle=0.055,
    mat_limb=None,
    mat_claw=None,
    parent=None,
):
    """Create a sculpted theropod/avian digitigrade hind leg with Z-bent knee & hock."""
    bone = create_bone_node(bone_name, local_pos=hip_pos, parent=parent)
    sy = 1.0 if side >= 0 else -1.0
    knee = Vector((0.14, sy * 0.02, -height * 0.36))
    ankle = Vector((-0.12, sy * 0.01, -height * 0.72))
    foot = Vector((0.08, 0.0, -height + 0.03))
    toe_tip = Vector((0.20, 0.0, -height + 0.03))
    ctrl = [
        ((0.0, 0.0, 0.05), r_thigh * 1.15, r_thigh * 1.10),
        (tuple(Vector((0.06, sy * 0.01, -height * 0.16))), r_thigh * 0.96, r_thigh * 0.90),
        (tuple(knee), r_thigh * 0.65, r_thigh * 0.65),
        (tuple(ankle), r_ankle, r_ankle * 0.95),
        (tuple(foot), r_ankle * 0.95, r_ankle * 0.65),
        (tuple(toe_tip), r_ankle * 1.05, r_ankle * 0.50),
    ]
    _tube(f"{bone_name}_Limb", ctrl, segs_u=12, segs_v=16, mat=mat_limb, parent=bone, subdiv=1)
    if mat_claw is not None:
        for c_idx, dy in enumerate((-0.035, 0.0, 0.035)):
            build_curved_claw_or_horn(
                f"{bone_name}_Claw{c_idx}",
                length=0.11,
                base_r=0.020,
                curve_bend=0.03,
                direction=(1.0, dy * 1.5, -0.25),
                mat=mat_claw,
                parent=bone,
                local_pos=(toe_tip.x - 0.01, dy, toe_tip.z),
                segs_u=7,
                segs_v=8,
            )
    return bone


def _build_arthropod_leg(
    bone_name,
    coxa_pos,
    side,
    out_y=0.38,
    arch_z=0.14,
    ground_z=-0.22,
    forward_x=0.05,
    r_base=0.055,
    mat_leg=None,
    mat_tip=None,
    parent=None,
):
    """Create a multi-jointed arthropod leg curving outward (+/-Y) and down to ground."""
    bone = create_bone_node(bone_name, local_pos=coxa_pos, parent=parent)
    sy = 1.0 if side >= 0 else -1.0
    ctrl = [
        ((0.0, 0.0, 0.0), r_base, r_base * 0.85),
        ((forward_x * 0.35, sy * out_y * 0.50, arch_z), r_base * 0.85, r_base * 0.78),
        ((forward_x * 0.75, sy * out_y * 0.88, arch_z * 0.15), r_base * 0.65, r_base * 0.6),
        ((forward_x, sy * out_y, ground_z), r_base * 0.32, r_base * 0.32),
    ]
    _tube(
        f"{bone_name}_Mesh",
        ctrl,
        segs_u=10,
        segs_v=10,
        mat=mat_leg,
        parent=bone,
        subdiv=0,
    )
    if mat_tip is not None:
        build_curved_claw_or_horn(
            f"{bone_name}_Tarsus",
            length=0.12,
            base_r=r_base * 0.34,
            curve_bend=0.03,
            direction=(0.35, sy * 0.35, -0.9),
            mat=mat_tip,
            parent=bone,
            local_pos=(forward_x, sy * out_y, ground_z + 0.01),
            segs_u=6,
            segs_v=6,
        )
    return bone


def _build_membrane_wing(
    pivot_name,
    pivot_pos,
    side,
    span=1.6,
    chord=0.48,
    sweep_x=-0.35,
    dihedral_z=0.12,
    mat_frame=None,
    mat_wing=None,
    parent=None,
):
    """Build an insect or pterosaur wing with leading spar and cambered membrane."""
    sy = 1.0 if side >= 0 else -1.0
    pivot = create_bone_node(pivot_name, local_pos=pivot_pos, parent=parent)
    spar_pts = [
        ((0.0, 0.0, 0.0), 0.045, 0.035),
        ((sweep_x * 0.25, sy * span * 0.38, dihedral_z * 0.55), 0.032, 0.025),
        ((sweep_x * 0.72, sy * span * 0.78, dihedral_z * 0.9), 0.022, 0.018),
        ((sweep_x * 1.15, sy * span, dihedral_z), 0.012, 0.01),
    ]
    _tube(
        f"{pivot_name}_Spar",
        spar_pts,
        segs_u=12,
        segs_v=8,
        mat=mat_frame,
        parent=pivot,
        subdiv=0,
    )

    bm = bmesh.new()
    u_steps = 9
    v_steps = 4
    grid = []
    for iu in range(u_steps):
        t = iu / (u_steps - 1)
        x_lead = sweep_x * (t ** 1.25)
        y_pos = sy * span * t
        z_camber = dihedral_z * math.sin(t * math.pi * 0.75)
        c_local = chord * math.sin(max(0.08, t) * math.pi * 0.88 + 0.12)
        if t < 0.05:
            c_local = chord * 0.45
        row = []
        for iv in range(v_steps):
            v = iv / (v_steps - 1)
            x_pt = x_lead - v * c_local
            z_pt = z_camber - (v - 0.5) ** 2 * 0.04 + (1.0 - v) * 0.025
            row.append(bm.verts.new(Vector((x_pt, y_pos, z_pt))))
        grid.append(row)

    for iu in range(u_steps - 1):
        for iv in range(v_steps - 1):
            v00 = grid[iu][iv]
            v10 = grid[iu + 1][iv]
            v11 = grid[iu + 1][iv + 1]
            v01 = grid[iu][iv + 1]
            if sy > 0:
                bm.faces.new((v00, v10, v11, v01))
            else:
                bm.faces.new((v00, v01, v11, v10))
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=0.014)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    attach_mesh_obj(bm, f"{pivot_name}_Membrane", mat=mat_wing, parent=pivot, subdiv=1)
    return pivot


def _add_tooth_row(parent, start_x, step_x, count, y_offset, z_pos, tooth_len, tooth_r, up_dir, mat_tooth):
    """Attach a row of sharp conical teeth on left (+Y) and right (-Y)."""
    for idx in range(count):
        tx = start_x + idx * step_x
        scale = 1.0 - 0.32 * (idx / max(1, count - 1))
        for sy in (1.0, -1.0):
            build_curved_claw_or_horn(
                f"Tooth_{idx}_{'L' if sy > 0 else 'R'}_{int(up_dir)}",
                length=tooth_len * scale,
                base_r=tooth_r * scale,
                curve_bend=tooth_len * 0.14,
                direction=(-0.18, 0.0, up_dir),
                mat=mat_tooth,
                parent=parent,
                local_pos=(tx, sy * y_offset * (1.0 - 0.15 * idx / max(1, count)), z_pos),
                segs_u=6,
                segs_v=6,
            )


def _add_eyes(head, x, y, z, radius, mats):
    """Attach symmetrical anatomical eyes on left (+Y) and right (-Y)."""
    for side, s_name in ((1.0, "L"), (-1.0, "R")):
        build_anatomical_eye(
            f"Eye_{s_name}",
            radius,
            mats["eye"],
            mats["pupil"],
            head,
            (x, side * y, z),
        )


def _create_base_rig(root_name="Minion_Root", body_z=0.6):
    """Create standard Minion_Root and Body_Main hierarchy."""
    root = create_bone_node(root_name, (0.0, 0.0, 0.0))
    body = create_bone_node("Body_Main", (0.0, 0.0, body_z), parent=root)
    return root, body


# ==============================================================================
# ERA 1-4: PALEOZOIC MARINE & ARTHROPOD MINIONS
# ==============================================================================


def build_cambrian_trilobite():
    """Era 1: Armored Cambrian trilobite with raised axial lobe & genal spines."""
    mats = _minion_mats(
        "anomalocaris",
        body_col=(0.48, 0.34, 0.22, 1.0),
        sec_col=(0.28, 0.20, 0.14, 1.0),
        acc_col=(0.82, 0.56, 0.24, 1.0),
        eye_col=(0.95, 0.72, 0.20, 1.0),
        roughness=0.38,
        metallic=0.14,
    )
    root, body = _create_base_rig(body_z=0.22)

    _tube(
        "Trilo_AxialLobe",
        [
            ((-0.95, 0.0, 0.02), 0.08, 0.06),
            ((-0.55, 0.0, 0.12), 0.20, 0.18),
            ((0.0, 0.0, 0.18), 0.26, 0.23),
            ((0.55, 0.0, 0.20), 0.30, 0.24),
            ((0.88, 0.0, 0.12), 0.22, 0.14),
        ],
        segs_u=16,
        segs_v=16,
        mat=mats["body"],
        parent=body,
        dorsal_keel=0.05,
        belly_flat=0.65,
        subdiv=1,
    )

    for idx in range(7):
        x_pos = 0.38 - idx * 0.17
        w = 0.85 * (1.0 - idx * 0.075)
        _build_curved_tergite(
            f"PleuraPlate_{idx}",
            length_x=0.18,
            width_y=w * 1.45,
            thickness=0.055,
            arch_z=0.12,
            mat=mats["sec"] if idx % 2 else mats["body"],
            parent=body,
            local_pos=(x_pos, 0.0, 0.06),
            sweep_x=-0.08,
        )
        for sy in (1.0, -1.0):
            build_curved_claw_or_horn(
                f"PleuralSpine_{idx}_{'L' if sy > 0 else 'R'}",
                length=0.30 - idx * 0.015,
                base_r=0.036,
                curve_bend=0.06,
                direction=(-0.82, sy * 0.52, -0.06),
                mat=mats["acc"],
                parent=body,
                local_pos=(x_pos - 0.02, sy * w * 0.62, 0.06),
                segs_u=6,
                segs_v=6,
            )

    head = create_bone_node("Head_Pivot", (0.58, 0.0, 0.06), parent=body)
    _tube(
        "Cephalon_Shield",
        [
            ((-0.15, 0.0, 0.08), 0.72, 0.18),
            ((0.18, 0.0, 0.06), 0.68, 0.16),
            ((0.46, 0.0, 0.01), 0.50, 0.10),
            ((0.62, 0.0, -0.03), 0.18, 0.05),
        ],
        segs_u=12,
        segs_v=18,
        mat=mats["body"],
        parent=head,
        belly_flat=0.7,
        subdiv=1,
    )
    for sy in (1.0, -1.0):
        build_curved_claw_or_horn(
            f"GenalSpine_{'L' if sy > 0 else 'R'}",
            length=0.78,
            base_r=0.064,
            curve_bend=0.14,
            direction=(-0.95, sy * 0.35, -0.03),
            mat=mats["acc"],
            parent=head,
            local_pos=(-0.02, sy * 0.54, 0.04),
            segs_u=10,
            segs_v=8,
        )
    _add_eyes(head, 0.22, 0.34, 0.16, 0.075, mats)

    for i, sy in enumerate((1.0, -1.0)):
        ant = create_bone_node(f"Antennule{i}", (0.52, sy * 0.16, 0.02), parent=head)
        build_curved_claw_or_horn(
            f"AntennuleMesh_{i}",
            length=0.58,
            base_r=0.022,
            curve_bend=0.16,
            direction=(0.94, sy * 0.38, 0.12),
            mat=mats["acc"],
            parent=ant,
            segs_u=10,
            segs_v=6,
        )

    leg_idx = 0
    for r in range(3):
        lx = 0.25 - r * 0.32
        for sy in (1.0, -1.0):
            _build_arthropod_leg(
                f"Leg{leg_idx}",
                coxa_pos=(lx, sy * 0.28, -0.04),
                side=sy,
                out_y=0.40,
                arch_z=0.08,
                ground_z=-0.18,
                forward_x=0.04,
                r_base=0.042,
                mat_leg=mats["sec"],
                mat_tip=mats["acc"],
                parent=body,
            )
            leg_idx += 1

    tail = create_bone_node("TailFan", (-0.85, 0.0, 0.05), parent=body)
    _build_tapered_fin(
        "Pygidium",
        [((-0.02, 0.0, 0.0), 1.0), ((-0.26, 0.0, -0.02), 0.72), ((-0.44, 0.0, -0.04), 0.3)],
        chord=0.58,
        thickness=0.08,
        mat=mats["sec"],
        parent=tail,
    )
    return root


def build_opabinia_radiodont_elite():
    """Era 1 Elite: Five-eyed Opabinia regalis with frontal grasping proboscis & flaps."""
    mats = _minion_mats(
        "anomalocaris",
        body_col=(0.14, 0.56, 0.68, 1.0),
        sec_col=(0.08, 0.34, 0.45, 1.0),
        acc_col=(0.96, 0.62, 0.18, 1.0),
        eye_col=(0.98, 0.92, 0.28, 1.0),
        roughness=0.34,
        metallic=0.16,
        acc_emissive=(0.96, 0.52, 0.12),
        acc_emissive_strength=0.25,
    )
    root, body = _create_base_rig(body_z=0.88)

    _tube(
        "Opabinia_Trunk",
        [
            ((-1.05, 0.0, 0.04), 0.10, 0.08),
            ((-0.60, 0.0, 0.02), 0.22, 0.18),
            ((0.0, 0.0, 0.0), 0.30, 0.22),
            ((0.58, 0.0, 0.02), 0.28, 0.20),
            ((0.88, 0.0, 0.04), 0.20, 0.16),
        ],
        segs_u=18,
        segs_v=16,
        mat=mats["body"],
        parent=body,
        dorsal_keel=0.06,
        subdiv=1,
    )

    for idx in range(8):
        fx = 0.54 - idx * 0.18
        span_scale = math.sin(0.22 + (idx / 7.0) * math.pi * 0.72)
        flap_w = 0.46 * max(0.45, span_scale)
        for side_char, sy in (("L", 1.0), ("R", -1.0)):
            flap = create_bone_node(f"Flap{side_char}{idx}", (fx, sy * 0.20, -0.02), parent=body)
            _build_tapered_fin(
                f"FlapMesh_{side_char}{idx}",
                [((0.0, 0.0, 0.0), 1.0), ((-0.04, sy * flap_w * 0.6, -0.04), 0.9), ((-0.10, sy * flap_w, -0.06), 0.45)],
                chord=0.26,
                thickness=0.032,
                mat=mats["acc"] if idx % 2 == 0 else mats["sec"],
                parent=flap,
            )

    head = create_bone_node("Head_Pivot", (0.78, 0.0, 0.03), parent=body)
    _tube(
        "Opabinia_HeadDome",
        [((-0.10, 0.0, 0.0), 0.24, 0.18), ((0.18, 0.0, 0.02), 0.22, 0.16), ((0.34, 0.0, -0.01), 0.13, 0.11)],
        segs_u=8,
        segs_v=14,
        mat=mats["body"],
        parent=head,
        subdiv=1,
    )
    eye_offsets = [
        (0.18, 0.19, 0.19),
        (0.18, -0.19, 0.19),
        (0.05, 0.13, 0.24),
        (0.05, -0.13, 0.24),
        (0.26, 0.02, 0.22),
    ]
    for e_idx, (ex, ey, ez) in enumerate(eye_offsets):
        stalk = create_bone_node(f"EyeStalk{e_idx}", (ex * 0.65, ey * 0.55, 0.10), parent=head)
        _tube(
            f"StalkStem_{e_idx}",
            [((0.0, 0.0, 0.0), 0.024, 0.024), ((ex * 0.35, ey * 0.45, ez - 0.10), 0.032, 0.032)],
            segs_u=6,
            segs_v=8,
            mat=mats["sec"],
            parent=stalk,
        )
        build_anatomical_eye(f"CompoundEye_{e_idx}", 0.048, mats["eye"], mats["pupil"], stalk, (ex * 0.35, ey * 0.45, ez - 0.10))

    prob = create_bone_node("Proboscis", (0.30, 0.0, -0.04), parent=head)
    _tube(
        "Proboscis_Trunk",
        [
            ((0.0, 0.0, 0.0), 0.085, 0.075),
            ((0.26, 0.0, -0.12), 0.068, 0.06),
            ((0.55, 0.0, -0.04), 0.052, 0.048),
            ((0.80, 0.0, 0.06), 0.045, 0.042),
        ],
        segs_u=14,
        segs_v=10,
        mat=mats["sec"],
        parent=prob,
        subdiv=1,
    )
    for c_idx, sy in enumerate((1.0, -1.0)):
        claw = create_bone_node(f"ProbClaw{c_idx}", (0.80, sy * 0.04, 0.06), parent=prob)
        build_curved_claw_or_horn(
            f"ProbClawMesh_{c_idx}",
            length=0.28,
            base_r=0.034,
            curve_bend=0.08,
            direction=(0.9, -sy * 0.35, 0.15),
            mat=mats["acc"],
            parent=claw,
            segs_u=8,
            segs_v=8,
        )

    tail = create_bone_node("TailFan", (-0.98, 0.0, 0.04), parent=body)
    for blade_ang in (-0.42, 0.0, 0.42):
        _build_tapered_fin(
            f"TailBlade_{int(blade_ang * 100)}",
            [((0.0, 0.0, 0.0), 0.8), ((-0.28, math.sin(blade_ang) * 0.25, 0.14), 1.0), ((-0.52, math.sin(blade_ang) * 0.45, 0.22), 0.45)],
            chord=0.24,
            thickness=0.028,
            mat=mats["acc"],
            parent=tail,
        )
    return root


def build_orthoceras():
    """Era 2: Giant Ordovician straight-shelled nautiloid swimmer."""
    mats = _minion_mats(
        "spinosaurus",
        body_col=(0.76, 0.68, 0.54, 1.0),
        sec_col=(0.42, 0.28, 0.22, 1.0),
        acc_col=(0.78, 0.36, 0.24, 1.0),
        eye_col=(0.14, 0.88, 0.96, 1.0),
        roughness=0.38,
        metallic=0.10,
    )
    root, body = _create_base_rig(body_z=0.92)

    _tube(
        "Orthoceras_Shell",
        [
            ((-1.55, 0.0, 0.04), 0.035, 0.035),
            ((-1.05, 0.0, 0.02), 0.11, 0.11),
            ((-0.55, 0.0, 0.0), 0.20, 0.20),
            ((0.0, 0.0, 0.0), 0.29, 0.28),
            ((0.45, 0.0, 0.0), 0.34, 0.32),
        ],
        segs_u=22,
        segs_v=18,
        mat=mats["body"],
        parent=body,
        subdiv=1,
    )
    for r_idx in range(7):
        rx = 0.32 - r_idx * 0.22
        rr = 0.32 - r_idx * 0.038
        _tube(
            f"ShellBand_{r_idx}",
            [((rx - 0.03, 0.0, 0.0), rr * 1.03, rr * 1.03), ((rx + 0.03, 0.0, 0.0), rr * 1.03, rr * 1.03)],
            segs_u=4,
            segs_v=16,
            mat=mats["sec"],
            parent=body,
            cap_ends=False,
            taper_start=False,
            taper_end=False,
        )

    head = create_bone_node("Head_Pivot", (0.45, 0.0, -0.02), parent=body)
    _tube(
        "MantleHead",
        [((-0.05, 0.0, 0.0), 0.26, 0.24), ((0.22, 0.0, 0.0), 0.28, 0.26), ((0.44, 0.0, -0.02), 0.18, 0.16)],
        segs_u=10,
        segs_v=14,
        mat=mats["acc"],
        parent=head,
        subdiv=1,
    )
    _add_eyes(head, 0.18, 0.24, 0.10, 0.072, mats)

    for t_idx in range(8):
        ang = (2.0 * math.pi * t_idx) / 8.0
        sy = math.sin(ang)
        sz = math.cos(ang)
        arm = create_bone_node(f"Arm{t_idx}", (0.38, sy * 0.14, sz * 0.14 - 0.02), parent=head)
        build_curved_claw_or_horn(
            f"Tentacle_{t_idx}",
            length=0.74 if t_idx < 4 else 0.58,
            base_r=0.042,
            curve_bend=0.14,
            direction=(0.92, sy * 0.28, sz * 0.28 - 0.08),
            mat=mats["acc"] if t_idx % 2 == 0 else mats["sec"],
            parent=arm,
            segs_u=10,
            segs_v=8,
        )

    prob = create_bone_node("Proboscis", (0.18, 0.0, -0.22), parent=head)
    _tube(
        "JetSiphon",
        [((0.0, 0.0, 0.0), 0.08, 0.08), ((0.25, 0.0, -0.04), 0.055, 0.055)],
        segs_u=8,
        segs_v=10,
        mat=mats["sec"],
        parent=prob,
    )

    tail = create_bone_node("TailFan", (-1.18, 0.0, 0.02), parent=body)
    for sy in (1.0, -1.0):
        _build_tapered_fin(
            f"ApexFin_{'L' if sy > 0 else 'R'}",
            [((0.0, sy * 0.06, 0.0), 1.0), ((-0.15, sy * 0.34, 0.0), 0.75), ((-0.32, sy * 0.16, 0.0), 0.35)],
            chord=0.38,
            thickness=0.032,
            mat=mats["acc"],
            parent=tail,
        )
    return root


def build_eurypterid():
    """Era 3: Giant Silurian sea scorpion with broad paddles & spiked telson."""
    mats = _minion_mats(
        "pulmonoscorpius",
        body_col=(0.18, 0.42, 0.36, 1.0),
        sec_col=(0.11, 0.24, 0.22, 1.0),
        acc_col=(0.86, 0.68, 0.22, 1.0),
        eye_col=(0.95, 0.32, 0.12, 1.0),
        roughness=0.34,
        metallic=0.22,
    )
    root, body = _create_base_rig(body_z=0.58)

    _tube(
        "Eurypterid_Trunk",
        [
            ((-1.05, 0.0, 0.04), 0.10, 0.07),
            ((-0.65, 0.0, 0.02), 0.22, 0.12),
            ((-0.25, 0.0, 0.0), 0.36, 0.16),
            ((0.20, 0.0, 0.0), 0.44, 0.18),
            ((0.55, 0.0, 0.02), 0.40, 0.17),
        ],
        segs_u=18,
        segs_v=16,
        mat=mats["body"],
        parent=body,
        belly_flat=0.6,
        subdiv=1,
    )
    for t_idx in range(6):
        tx = 0.38 - t_idx * 0.20
        tw = 0.82 * (1.0 - t_idx * 0.10)
        _build_curved_tergite(
            f"Tergite_{t_idx}",
            length_x=0.17,
            width_y=tw,
            thickness=0.05,
            arch_z=0.10,
            mat=mats["sec"] if t_idx % 2 else mats["body"],
            parent=body,
            local_pos=(tx, 0.0, 0.09),
            sweep_x=-0.05,
        )

    head = create_bone_node("Head_Pivot", (0.55, 0.0, 0.02), parent=body)
    _tube(
        "Prosoma_Shield",
        [((-0.05, 0.0, 0.02), 0.42, 0.18), ((0.22, 0.0, 0.03), 0.38, 0.16), ((0.42, 0.0, 0.0), 0.22, 0.10)],
        segs_u=10,
        segs_v=16,
        mat=mats["body"],
        parent=head,
        belly_flat=0.65,
        subdiv=1,
    )
    _add_eyes(head, 0.22, 0.20, 0.14, 0.068, mats)

    for a_idx, sy in enumerate((1.0, -1.0)):
        arm = create_bone_node(f"Arm{a_idx}", (0.34, sy * 0.24, -0.02), parent=head)
        build_curved_claw_or_horn(
            f"Chelicera_{a_idx}",
            length=0.66,
            base_r=0.058,
            curve_bend=0.18,
            direction=(0.9, -sy * 0.22, 0.05),
            mat=mats["acc"],
            parent=arm,
            segs_u=10,
            segs_v=8,
        )

    leg_idx = 0
    for rx in (0.32, 0.08):
        for sy in (1.0, -1.0):
            _build_arthropod_leg(
                f"Leg{leg_idx}",
                coxa_pos=(rx, sy * 0.34, -0.06),
                side=sy,
                out_y=0.42,
                arch_z=0.10,
                ground_z=-0.42,
                forward_x=0.08,
                r_base=0.048,
                mat_leg=mats["sec"],
                mat_tip=mats["acc"],
                parent=body,
            )
            leg_idx += 1

    for side_char, sy in (("L", 1.0), ("R", -1.0)):
        flap = create_bone_node(f"Flap{side_char}0", (0.18, sy * 0.38, -0.02), parent=body)
        _build_tapered_fin(
            f"SwimPaddle_{side_char}",
            [((0.0, 0.0, 0.0), 0.7), ((-0.18, sy * 0.44, -0.04), 1.15), ((-0.38, sy * 0.68, -0.06), 0.65)],
            chord=0.36,
            thickness=0.036,
            mat=mats["acc"],
            parent=flap,
        )

    tail = create_bone_node("TailFan", (-0.98, 0.0, 0.04), parent=body)
    build_curved_claw_or_horn(
        "TelsonSpike",
        length=0.88,
        base_r=0.072,
        curve_bend=0.12,
        direction=(-0.98, 0.0, 0.14),
        mat=mats["acc"],
        parent=tail,
        segs_u=12,
        segs_v=10,
    )
    return root


def build_jawless_fish():
    """Era 3: Armored Devonian/Silurian ostracoderm swimmer (Cephalaspis/Astraspis)."""
    mats = _minion_mats(
        "spinosaurus",
        body_col=(0.56, 0.42, 0.26, 1.0),
        sec_col=(0.32, 0.24, 0.16, 1.0),
        acc_col=(0.88, 0.64, 0.26, 1.0),
        eye_col=(0.95, 0.85, 0.25, 1.0),
        roughness=0.40,
        metallic=0.14,
    )
    root, body = _create_base_rig(body_z=0.85)

    _tube(
        "Ostracoderm_Body",
        [
            ((-1.05, 0.0, 0.02), 0.06, 0.08),
            ((-0.60, 0.0, 0.01), 0.14, 0.18),
            ((-0.10, 0.0, 0.0), 0.24, 0.22),
            ((0.35, 0.0, 0.0), 0.30, 0.20),
        ],
        segs_u=16,
        segs_v=16,
        mat=mats["body"],
        parent=body,
        dorsal_keel=0.08,
        belly_flat=0.45,
        subdiv=1,
    )

    _build_tapered_fin(
        "DorsalCrest",
        [((0.10, 0.0, 0.16), 0.8), ((-0.15, 0.0, 0.36), 0.9), ((-0.42, 0.0, 0.22), 0.45)],
        chord=0.46,
        thickness=0.036,
        mat=mats["acc"],
        parent=body,
    )

    head = create_bone_node("Head_Pivot", (0.35, 0.0, 0.0), parent=body)
    _tube(
        "HeadShield",
        [
            ((-0.05, 0.0, 0.0), 0.56, 0.17),
            ((0.25, 0.0, 0.0), 0.54, 0.16),
            ((0.50, 0.0, -0.02), 0.38, 0.11),
            ((0.66, 0.0, -0.04), 0.14, 0.06),
        ],
        segs_u=12,
        segs_v=18,
        mat=mats["body"],
        parent=head,
        dorsal_keel=0.05,
        belly_flat=0.72,
        subdiv=1,
    )
    for sy in (1.0, -1.0):
        build_curved_claw_or_horn(
            f"CornualHorn_{'L' if sy > 0 else 'R'}",
            length=0.48,
            base_r=0.068,
            curve_bend=0.10,
            direction=(-0.92, sy * 0.36, -0.04),
            mat=mats["acc"],
            parent=head,
            local_pos=(-0.02, sy * 0.50, -0.01),
            segs_u=8,
            segs_v=8,
        )
    _add_eyes(head, 0.26, 0.14, 0.15, 0.058, mats)

    for side_char, sy in (("L", 1.0), ("R", -1.0)):
        flap = create_bone_node(f"Flap{side_char}0", (0.18, sy * 0.28, -0.06), parent=body)
        _build_tapered_fin(
            f"PecFin_{side_char}",
            [((0.0, 0.0, 0.0), 0.8), ((-0.12, sy * 0.32, -0.04), 0.9), ((-0.26, sy * 0.44, -0.06), 0.4)],
            chord=0.32,
            thickness=0.028,
            mat=mats["sec"],
            parent=flap,
        )

    tail = create_bone_node("TailFan", (-1.02, 0.0, 0.02), parent=body)
    _build_tapered_fin(
        "CaudalUpper",
        [((0.0, 0.0, 0.0), 0.85), ((-0.28, 0.0, 0.24), 1.0), ((-0.56, 0.0, 0.42), 0.45)],
        chord=0.34,
        thickness=0.032,
        mat=mats["acc"],
        parent=tail,
    )
    _build_tapered_fin(
        "CaudalLower",
        [((0.0, 0.0, -0.02), 0.7), ((-0.20, 0.0, -0.18), 0.75), ((-0.38, 0.0, -0.26), 0.35)],
        chord=0.26,
        thickness=0.028,
        mat=mats["sec"],
        parent=tail,
    )
    return root


def build_shark_placoderm():
    """Era 4: Armored Devonian placoderm/shark predator with self-sharpening jaw plates."""
    mats = _minion_mats(
        "spinosaurus",
        body_col=(0.24, 0.34, 0.42, 1.0),
        sec_col=(0.68, 0.74, 0.78, 1.0),
        acc_col=(0.86, 0.38, 0.20, 1.0),
        eye_col=(0.98, 0.76, 0.14, 1.0),
        roughness=0.34,
        metallic=0.18,
    )
    root, body = _create_base_rig(body_z=0.95)

    _tube(
        "Placoderm_Torso",
        [
            ((-1.15, 0.0, 0.02), 0.07, 0.09),
            ((-0.70, 0.0, 0.02), 0.16, 0.21),
            ((-0.18, 0.0, 0.0), 0.28, 0.32),
            ((0.35, 0.0, 0.0), 0.34, 0.36),
            ((0.60, 0.0, 0.0), 0.32, 0.34),
        ],
        segs_u=18,
        segs_v=18,
        mat=mats["body"],
        parent=body,
        dorsal_keel=0.09,
        belly_flat=0.25,
        subdiv=1,
    )

    _build_tapered_fin(
        "DorsalFin",
        [((0.05, 0.0, 0.28), 1.0), ((-0.14, 0.0, 0.64), 0.78), ((-0.32, 0.0, 0.84), 0.34)],
        chord=0.46,
        thickness=0.045,
        mat=mats["acc"],
        parent=body,
    )

    head = create_bone_node("Head_Pivot", (0.58, 0.0, 0.04), parent=body)
    _tube(
        "CranialArmor",
        [
            ((-0.06, 0.0, 0.04), 0.32, 0.28),
            ((0.26, 0.0, 0.04), 0.28, 0.22),
            ((0.52, 0.0, 0.0), 0.16, 0.12),
        ],
        segs_u=10,
        segs_v=16,
        mat=mats["body"],
        parent=head,
        dorsal_keel=0.06,
        belly_flat=0.65,
        subdiv=1,
    )
    jaw = create_bone_node("Jaw_Pivot", (0.04, 0.0, -0.06), parent=head)
    _tube(
        "ShearingJaw",
        [
            ((-0.02, 0.0, -0.04), 0.24, 0.12),
            ((0.26, 0.0, -0.06), 0.20, 0.10),
            ((0.46, 0.0, -0.03), 0.12, 0.07),
        ],
        segs_u=8,
        segs_v=12,
        mat=mats["sec"],
        parent=jaw,
        subdiv=1,
    )
    _add_tooth_row(head, 0.32, -0.10, 3, 0.15, -0.04, 0.11, 0.032, -1.0, mats["tooth"])
    _add_tooth_row(jaw, 0.30, -0.10, 3, 0.13, 0.01, 0.10, 0.028, 1.0, mats["tooth"])
    _add_eyes(head, 0.24, 0.25, 0.12, 0.068, mats)

    for side_char, sy in (("L", 1.0), ("R", -1.0)):
        flap = create_bone_node(f"Flap{side_char}0", (0.28, sy * 0.28, -0.14), parent=body)
        _build_tapered_fin(
            f"PectoralFin_{side_char}",
            [((0.0, 0.0, 0.0), 0.9), ((-0.16, sy * 0.44, -0.08), 0.72), ((-0.34, sy * 0.70, -0.12), 0.32)],
            chord=0.40,
            thickness=0.034,
            mat=mats["sec"],
            parent=flap,
        )

    tail = create_bone_node("TailFan", (-1.12, 0.0, 0.02), parent=body)
    _build_tapered_fin(
        "TailTopLobe",
        [((0.0, 0.0, 0.0), 0.8), ((-0.26, 0.0, 0.28), 0.9), ((-0.52, 0.0, 0.56), 0.35)],
        chord=0.34,
        thickness=0.036,
        mat=mats["acc"],
        parent=tail,
    )
    _build_tapered_fin(
        "TailBottomLobe",
        [((0.0, 0.0, -0.02), 0.7), ((-0.20, 0.0, -0.22), 0.7), ((-0.38, 0.0, -0.38), 0.3)],
        chord=0.28,
        thickness=0.03,
        mat=mats["sec"],
        parent=tail,
    )
    return root


def build_bothriolepis():
    """Era 4: Bottom-cruising Devonian antiarch placoderm with armored wing-arms."""
    mats = _minion_mats(
        "ankylo",
        body_col=(0.46, 0.36, 0.24, 1.0),
        sec_col=(0.30, 0.22, 0.16, 1.0),
        acc_col=(0.76, 0.52, 0.22, 1.0),
        eye_col=(0.94, 0.78, 0.22, 1.0),
        roughness=0.44,
        metallic=0.16,
    )
    root, body = _create_base_rig(body_z=0.36)

    _tube(
        "Antiarch_Carapace",
        [
            ((-0.45, 0.0, 0.02), 0.26, 0.18),
            ((-0.10, 0.0, 0.06), 0.42, 0.26),
            ((0.25, 0.0, 0.06), 0.40, 0.24),
            ((0.46, 0.0, 0.02), 0.30, 0.16),
        ],
        segs_u=14,
        segs_v=14,
        mat=mats["body"],
        parent=body,
        dorsal_keel=0.12,
        belly_flat=0.82,
        subdiv=1,
    )

    head = create_bone_node("Head_Pivot", (0.45, 0.0, 0.02), parent=body)
    _tube(
        "Antiarch_Head",
        [((-0.04, 0.0, 0.02), 0.30, 0.16), ((0.18, 0.0, 0.0), 0.24, 0.12), ((0.30, 0.0, -0.02), 0.14, 0.08)],
        segs_u=8,
        segs_v=14,
        mat=mats["sec"],
        parent=head,
        belly_flat=0.75,
        subdiv=1,
    )
    _add_eyes(head, 0.12, 0.08, 0.13, 0.048, mats)

    for a_idx, sy in enumerate((1.0, -1.0)):
        arm = create_bone_node(f"Arm{a_idx}", (0.28, sy * 0.34, -0.06), parent=body)
        build_curved_claw_or_horn(
            f"PecSpine_{a_idx}",
            length=0.78,
            base_r=0.065,
            curve_bend=0.18,
            direction=(-0.72, sy * 0.65, -0.10),
            mat=mats["acc"],
            parent=arm,
            segs_u=10,
            segs_v=8,
        )

    tail = create_bone_node("TailFan", (-0.42, 0.0, 0.02), parent=body)
    _tube(
        "WhipTail",
        [
            ((0.0, 0.0, 0.0), 0.18, 0.14),
            ((-0.38, 0.0, 0.04), 0.10, 0.10),
            ((-0.78, 0.0, 0.10), 0.05, 0.07),
            ((-1.15, 0.0, 0.18), 0.02, 0.03),
        ],
        segs_u=12,
        segs_v=10,
        mat=mats["sec"],
        parent=tail,
        dorsal_keel=0.04,
        subdiv=1,
    )
    return root


# ==============================================================================
# ERA 5-6: CARBONIFEROUS & PERMIAN MONSTERS
# ==============================================================================


def build_meganeura():
    """Era 5: Giant Carboniferous griffinfly with 4 veined wings & 6 raptorial legs."""
    mats = _minion_mats(
        "pulmonoscorpius",
        body_col=(0.16, 0.52, 0.42, 1.0),
        sec_col=(0.08, 0.24, 0.28, 1.0),
        acc_col=(0.28, 0.92, 0.56, 1.0),
        eye_col=(0.98, 0.28, 0.14, 1.0),
        roughness=0.28,
        metallic=0.35,
        wing_col=(0.76, 0.94, 0.96, 1.0),
        wing_alpha=0.52,
    )
    root, body = _create_base_rig(body_z=1.18)

    _tube(
        "Meganeura_Thorax",
        [
            ((-0.26, 0.0, -0.02), 0.16, 0.15),
            ((0.0, 0.0, 0.04), 0.26, 0.24),
            ((0.28, 0.0, 0.02), 0.22, 0.21),
        ],
        segs_u=12,
        segs_v=14,
        mat=mats["body"],
        parent=body,
        subdiv=1,
    )

    head = create_bone_node("Head_Pivot", (0.34, 0.0, 0.02), parent=body)
    _tube(
        "Dragonfly_Head",
        [((-0.04, 0.0, 0.0), 0.18, 0.18), ((0.16, 0.0, -0.02), 0.20, 0.18), ((0.26, 0.0, -0.05), 0.10, 0.08)],
        segs_u=8,
        segs_v=12,
        mat=mats["sec"],
        parent=head,
        subdiv=1,
    )
    _add_eyes(head, 0.12, 0.13, 0.08, 0.105, mats)
    for sy in (1.0, -1.0):
        build_curved_claw_or_horn(
            f"Mandible_{'L' if sy > 0 else 'R'}",
            length=0.16,
            base_r=0.032,
            curve_bend=0.05,
            direction=(0.7, -sy * 0.45, -0.5),
            mat=mats["acc"],
            parent=head,
            local_pos=(0.18, sy * 0.09, -0.10),
        )

    wing_specs = [
        ("WingPivot0", (0.14, 0.18, 0.18), 1.0, 1.55, 0.36, -0.20, 0.18),
        ("WingPivot1", (0.14, -0.18, 0.18), -1.0, 1.55, 0.36, -0.20, 0.18),
        ("WingPivot2", (-0.06, 0.16, 0.16), 1.0, 1.42, 0.40, -0.44, 0.12),
        ("WingPivot3", (-0.06, -0.16, 0.16), -1.0, 1.42, 0.40, -0.44, 0.12),
    ]
    for w_name, pos, sy, span, chord, sweep, dih in wing_specs:
        _build_membrane_wing(w_name, pos, sy, span=span, chord=chord, sweep_x=sweep, dihedral_z=dih, mat_frame=mats["sec"], mat_wing=mats["wing"], parent=body)

    leg_idx = 0
    for r_idx, rx in enumerate((0.18, 0.04, -0.10)):
        for sy in (1.0, -1.0):
            _build_arthropod_leg(
                f"Leg{leg_idx}",
                coxa_pos=(rx, sy * 0.14, -0.12),
                side=sy,
                out_y=0.28 + r_idx * 0.04,
                arch_z=-0.10,
                ground_z=-0.36,
                forward_x=0.34 - r_idx * 0.16,
                r_base=0.026,
                mat_leg=mats["sec"],
                mat_tip=mats["acc"],
                parent=body,
            )
            leg_idx += 1

    tail = create_bone_node("TailFan", (-0.24, 0.0, -0.02), parent=body)
    _tube(
        "Abdomen",
        [
            ((0.0, 0.0, 0.0), 0.13, 0.12),
            ((-0.42, 0.0, 0.02), 0.095, 0.09),
            ((-0.90, 0.0, 0.06), 0.088, 0.082),
            ((-1.38, 0.0, 0.10), 0.075, 0.07),
        ],
        segs_u=16,
        segs_v=12,
        mat=mats["body"],
        parent=tail,
        subdiv=1,
    )
    for b_idx in range(6):
        bx = -0.18 - b_idx * 0.21
        _tube(
            f"AbRing_{b_idx}",
            [((bx - 0.03, 0.0, b_idx * 0.015), 0.105, 0.10), ((bx + 0.03, 0.0, b_idx * 0.015), 0.105, 0.10)],
            segs_u=4,
            segs_v=12,
            mat=mats["acc"],
            parent=tail,
            cap_ends=False,
            taper_start=False,
            taper_end=False,
        )
    return root


def build_arthropleura():
    """Era 5: Giant Carboniferous multi-segmented armored millipede."""
    mats = _minion_mats(
        "pulmonoscorpius",
        body_col=(0.36, 0.22, 0.14, 1.0),
        sec_col=(0.18, 0.12, 0.09, 1.0),
        acc_col=(0.82, 0.44, 0.16, 1.0),
        eye_col=(0.98, 0.34, 0.10, 1.0),
        roughness=0.38,
        metallic=0.22,
    )
    root, body = _create_base_rig(body_z=0.22)

    head = create_bone_node("Head_Pivot", (0.78, 0.0, 0.04), parent=body)
    _tube(
        "Arthro_Head",
        [((-0.10, 0.0, 0.0), 0.36, 0.16), ((0.18, 0.0, -0.01), 0.32, 0.14), ((0.32, 0.0, -0.04), 0.18, 0.09)],
        segs_u=10,
        segs_v=14,
        mat=mats["sec"],
        parent=head,
        belly_flat=0.7,
        subdiv=1,
    )
    _add_eyes(head, 0.16, 0.24, 0.08, 0.055, mats)
    for i, sy in enumerate((1.0, -1.0)):
        ant = create_bone_node(f"Antennule{i}", (0.28, sy * 0.16, 0.01), parent=head)
        build_curved_claw_or_horn(
            f"AntennaMesh_{i}",
            length=0.52,
            base_r=0.025,
            curve_bend=0.14,
            direction=(0.92, sy * 0.42, 0.18),
            mat=mats["acc"],
            parent=ant,
            segs_u=10,
            segs_v=6,
        )

    leg_idx = 0
    for s_idx in range(6):
        sx = 0.50 - s_idx * 0.34
        scale_w = 1.0 - 0.055 * s_idx
        seg = create_bone_node(f"Seg{s_idx}", (sx, 0.0, 0.02), parent=body)
        _tube(
            f"TergiteBody_{s_idx}",
            [((-0.16, 0.0, 0.0), 0.38 * scale_w, 0.16), ((0.16, 0.0, 0.0), 0.38 * scale_w, 0.16)],
            segs_u=6,
            segs_v=14,
            mat=mats["body"] if s_idx % 2 == 0 else mats["sec"],
            parent=seg,
            belly_flat=0.65,
            subdiv=1,
        )
        _build_curved_tergite(
            f"TergitePlate_{s_idx}",
            length_x=0.30,
            width_y=0.94 * scale_w,
            thickness=0.06,
            arch_z=0.12,
            mat=mats["acc"] if s_idx % 2 == 0 else mats["body"],
            parent=seg,
            local_pos=(0.0, 0.0, 0.08),
            sweep_x=-0.05,
        )
        for sy in (1.0, -1.0):
            _build_arthropod_leg(
                f"Leg{leg_idx}",
                coxa_pos=(0.0, sy * 0.34 * scale_w, -0.04),
                side=sy,
                out_y=0.34,
                arch_z=0.08,
                ground_z=-0.20,
                forward_x=0.04,
                r_base=0.042,
                mat_leg=mats["sec"],
                mat_tip=mats["acc"],
                parent=seg,
            )
            leg_idx += 1

    tail = create_bone_node("TailFan", (-1.38, 0.0, 0.0), parent=body)
    _build_curved_tergite("TailTelson", length_x=0.28, width_y=0.44, thickness=0.05, arch_z=0.08, mat=mats["acc"], parent=tail)
    return root


def build_synapsid():
    """Era 6: Permian Gorgonopsid / Dimetrodon-like apex proto-mammal predator."""
    mats = _minion_mats(
        "postosuchus",
        body_col=(0.54, 0.24, 0.16, 1.0),
        sec_col=(0.30, 0.16, 0.12, 1.0),
        acc_col=(0.88, 0.48, 0.16, 1.0),
        eye_col=(0.98, 0.68, 0.14, 1.0),
        roughness=0.46,
        metallic=0.05,
    )
    root, body = _create_base_rig(body_z=0.62)

    _tube(
        "Synapsid_Torso",
        [
            ((-0.58, 0.0, 0.02), 0.22, 0.24),
            ((-0.18, 0.0, 0.04), 0.26, 0.28),
            ((0.25, 0.0, 0.06), 0.30, 0.32),
            ((0.56, 0.0, 0.08), 0.24, 0.25),
        ],
        segs_u=14,
        segs_v=14,
        mat=mats["body"],
        parent=body,
        dorsal_keel=0.08,
        subdiv=1,
    )

    # Dorsal vertebral neural-spine crest / low sail embedded along spine
    _build_tapered_fin(
        "DorsalSpineSail",
        [((0.35, 0.0, 0.20), 0.78), ((0.0, 0.0, 0.64), 1.0), ((-0.42, 0.0, 0.22), 0.62)],
        chord=0.86,
        thickness=0.044,
        mat=mats["acc"],
        parent=body,
    )

    head = create_bone_node("Head_Pivot", (0.58, 0.0, 0.16), parent=body)
    _tube(
        "Synapsid_Skull",
        [
            ((-0.05, 0.0, 0.04), 0.22, 0.24),
            ((0.26, 0.0, 0.06), 0.19, 0.22),
            ((0.52, 0.0, 0.03), 0.15, 0.17),
        ],
        segs_u=10,
        segs_v=14,
        mat=mats["body"],
        parent=head,
        dorsal_keel=0.05,
        subdiv=1,
    )
    jaw = create_bone_node("Jaw_Pivot", (0.04, 0.0, -0.06), parent=head)
    _tube(
        "Synapsid_Jaw",
        [((0.0, 0.0, -0.04), 0.17, 0.10), ((0.44, 0.0, -0.05), 0.12, 0.07)],
        segs_u=8,
        segs_v=12,
        mat=mats["sec"],
        parent=jaw,
        subdiv=1,
    )
    for sy in (1.0, -1.0):
        build_curved_claw_or_horn(
            f"SaberFang_{'L' if sy > 0 else 'R'}",
            length=0.22,
            base_r=0.036,
            curve_bend=0.05,
            direction=(-0.15, 0.0, -1.0),
            mat=mats["tooth"],
            parent=head,
            local_pos=(0.40, sy * 0.11, -0.05),
        )
    _add_tooth_row(head, 0.28, -0.09, 3, 0.12, -0.05, 0.08, 0.022, -1.0, mats["tooth"])
    _add_eyes(head, 0.20, 0.18, 0.14, 0.056, mats)

    legs_spec = [
        ("Leg0", (0.34, 0.26, 0.0), (0.06, 0.10, -0.32), (0.10, 0.06, -0.60)),
        ("Leg1", (0.34, -0.26, 0.0), (0.06, -0.10, -0.32), (0.10, -0.06, -0.60)),
        ("Leg2", (-0.42, 0.24, 0.0), (-0.08, 0.10, -0.30), (0.02, 0.06, -0.60)),
        ("Leg3", (-0.42, -0.24, 0.0), (-0.08, -0.10, -0.30), (0.02, -0.06, -0.60)),
    ]
    for l_name, hip, knee, foot in legs_spec:
        _build_segmented_limb(l_name, hip, knee, foot, 0.13, 0.09, 0.075, mats["sec"], mats["tooth"], body, claws=3, claw_len=0.11)

    tail = create_bone_node("TailFan", (-0.56, 0.0, 0.02), parent=body)
    _tube(
        "Synapsid_Tail",
        [
            ((0.0, 0.0, 0.0), 0.18, 0.18),
            ((-0.40, 0.0, -0.06), 0.11, 0.11),
            ((-0.86, 0.0, -0.12), 0.05, 0.05),
        ],
        segs_u=12,
        segs_v=10,
        mat=mats["sec"],
        parent=tail,
        subdiv=1,
    )
    return root


def build_scutosaurus():
    """Era 6: Heavy armored Permian pareiasaur herbivore studded with osteoderms."""
    mats = _minion_mats(
        "ankylo",
        body_col=(0.46, 0.42, 0.30, 1.0),
        sec_col=(0.28, 0.26, 0.20, 1.0),
        acc_col=(0.74, 0.62, 0.38, 1.0),
        eye_col=(0.94, 0.68, 0.20, 1.0),
        roughness=0.62,
        metallic=0.04,
    )
    root, body = _create_base_rig(body_z=0.66)

    _tube(
        "Scutosaurus_Barrel",
        [
            ((-0.62, 0.0, 0.0), 0.28, 0.26),
            ((-0.18, 0.0, 0.04), 0.46, 0.38),
            ((0.28, 0.0, 0.04), 0.48, 0.38),
            ((0.58, 0.0, 0.04), 0.32, 0.28),
        ],
        segs_u=14,
        segs_v=16,
        mat=mats["body"],
        parent=body,
        belly_flat=0.35,
        subdiv=1,
    )
    for rx in (-0.36, -0.08, 0.20, 0.44):
        for ry in (-0.22, 0.0, 0.22):
            build_osteoderm_plate(
                f"Scute_{int(rx * 100)}_{int(ry * 100)}",
                width=0.22,
                height=0.22,
                thickness=0.09,
                mat=mats["acc"],
                parent=body,
                local_pos=(rx, ry, 0.34 - abs(ry) * 0.25),
                rot=(ry * 1.1, 0.0, 0.0),
                shape="hexagon",
            )

    head = create_bone_node("Head_Pivot", (0.58, 0.0, 0.08), parent=body)
    _tube(
        "Scuto_Head",
        [((-0.05, 0.0, 0.0), 0.34, 0.24), ((0.22, 0.0, 0.0), 0.30, 0.20), ((0.42, 0.0, -0.03), 0.18, 0.14)],
        segs_u=10,
        segs_v=14,
        mat=mats["body"],
        parent=head,
        belly_flat=0.5,
        subdiv=1,
    )
    for sy in (1.0, -1.0):
        build_curved_claw_or_horn(
            f"CheekBoss_{'L' if sy > 0 else 'R'}",
            length=0.22,
            base_r=0.072,
            curve_bend=0.04,
            direction=(-0.4, sy * 0.85, -0.15),
            mat=mats["acc"],
            parent=head,
            local_pos=(0.04, sy * 0.28, -0.04),
        )
    _add_eyes(head, 0.20, 0.24, 0.11, 0.054, mats)

    legs_spec = [
        ("Leg0", (0.36, 0.36, -0.04), (0.04, 0.08, -0.32), (0.08, 0.04, -0.60)),
        ("Leg1", (0.36, -0.36, -0.04), (0.04, -0.08, -0.32), (0.08, -0.04, -0.60)),
        ("Leg2", (-0.42, 0.34, -0.04), (-0.04, 0.08, -0.32), (0.02, 0.04, -0.60)),
        ("Leg3", (-0.42, -0.34, -0.04), (-0.04, -0.08, -0.32), (0.02, -0.04, -0.60)),
    ]
    for l_name, hip, knee, foot in legs_spec:
        _build_segmented_limb(l_name, hip, knee, foot, 0.17, 0.14, 0.12, mats["sec"], mats["acc"], body, claws=3, claw_len=0.09)

    tail = create_bone_node("TailFan", (-0.58, 0.0, 0.0), parent=body)
    _tube(
        "Scuto_Tail",
        [((0.0, 0.0, 0.0), 0.20, 0.18), ((-0.35, 0.0, -0.08), 0.11, 0.10), ((-0.65, 0.0, -0.14), 0.04, 0.04)],
        segs_u=10,
        segs_v=10,
        mat=mats["sec"],
        parent=tail,
        subdiv=1,
    )
    return root


# ==============================================================================
# ERA 7-13: MESOZOIC DINOSAURS, VOLCANIC, ICE AGE & EXTINCTION MINIONS
# ==============================================================================


def build_raptor():
    """Era 7/8/13: Feathered Velociraptor / Deinonychus pack hunter with sickle claws."""
    mats = _minion_mats(
        "terabird",
        body_col=(0.68, 0.32, 0.16, 1.0),
        sec_col=(0.24, 0.16, 0.14, 1.0),
        acc_col=(0.94, 0.56, 0.18, 1.0),
        eye_col=(0.98, 0.78, 0.14, 1.0),
        roughness=0.44,
        metallic=0.06,
    )
    root, body = _create_base_rig(body_z=0.90)

    _tube(
        "Raptor_Torso",
        [
            ((-0.52, 0.0, 0.02), 0.13, 0.16),
            ((-0.16, 0.0, 0.02), 0.21, 0.25),
            ((0.20, 0.0, 0.06), 0.22, 0.25),
            ((0.42, 0.0, 0.12), 0.14, 0.16),
        ],
        segs_u=14,
        segs_v=16,
        mat=mats["body"],
        parent=body,
        dorsal_keel=0.08,
        taper_start=False,
        taper_end=False,
        subdiv=1,
    )

    head = create_bone_node("Head_Pivot", (0.34, 0.0, 0.10), parent=body)
    # Sleek S-curved neck
    _tube(
        "Raptor_Neck",
        [
            ((-0.06, 0.0, 0.0), 0.14, 0.15),
            ((0.08, 0.0, 0.16), 0.11, 0.12),
            ((0.22, 0.0, 0.34), 0.10, 0.11),
            ((0.30, 0.0, 0.42), 0.11, 0.11),
        ],
        segs_u=12,
        segs_v=12,
        mat=mats["body"],
        parent=head,
        taper_start=False,
        taper_end=False,
        subdiv=1,
    )
    # Upper cranium + elongated snout
    _tube(
        "Raptor_Cranium",
        [
            ((0.24, 0.0, 0.42), 0.13, 0.13),
            ((0.42, 0.0, 0.41), 0.10, 0.10),
            ((0.64, 0.0, 0.39), 0.065, 0.070),
            ((0.76, 0.0, 0.37), 0.035, 0.042),
        ],
        segs_u=12,
        segs_v=12,
        mat=mats["body"],
        parent=head,
        dorsal_keel=0.05,
        belly_flat=0.65,
        subdiv=1,
    )
    # Articulated lower mandible slightly agape showing serrated teeth
    jaw = create_bone_node("Jaw_Pivot", (0.28, 0.0, 0.34), parent=head)
    _tube(
        "Raptor_LowerJaw",
        [
            ((0.0, 0.0, 0.0), 0.095, 0.055),
            ((0.22, 0.0, -0.04), 0.065, 0.040),
            ((0.42, 0.0, -0.07), 0.032, 0.025),
        ],
        segs_u=10,
        segs_v=10,
        mat=mats["sec"],
        parent=jaw,
        subdiv=1,
    )
    for c_idx in range(4):
        build_curved_claw_or_horn(
            f"HeadPlume_{c_idx}",
            length=0.22 - c_idx * 0.03,
            base_r=0.022,
            curve_bend=0.04,
            direction=(-0.92, 0.0, 0.36 - c_idx * 0.08),
            mat=mats["acc"],
            parent=head,
            local_pos=(0.28 - c_idx * 0.03, 0.0, 0.50 - c_idx * 0.02),
        )
    _add_tooth_row(head, 0.70, -0.065, 5, 0.045, 0.35, 0.065, 0.013, -1.0, mats["tooth"])
    _add_tooth_row(jaw, 0.38, -0.06, 4, 0.038, -0.02, 0.055, 0.011, 1.0, mats["tooth"])
    _add_eyes(head, 0.38, 0.105, 0.45, 0.044, mats)

    # Feathered raptorial arms with primary wing plumes
    for a_idx, sy in enumerate((1.0, -1.0)):
        arm = create_bone_node(f"Arm{a_idx}", (0.22, sy * 0.17, 0.04), parent=body)
        _tube(
            f"ArmLimb_{a_idx}",
            [
                ((0.0, 0.0, 0.0), 0.055, 0.055),
                ((0.12, sy * 0.04, -0.14), 0.038, 0.042),
                ((0.30, sy * 0.01, -0.06), 0.028, 0.030),
            ],
            segs_u=10,
            segs_v=10,
            mat=mats["sec"],
            parent=arm,
            subdiv=1,
        )
        # Wing feathers trailing along forearm
        for f_idx in range(4):
            build_curved_claw_or_horn(
                f"ArmFeather_{a_idx}_{f_idx}",
                length=0.24 - f_idx * 0.02,
                base_r=0.020,
                curve_bend=0.03,
                direction=(-0.88, sy * 0.12, -0.45),
                mat=mats["acc"],
                parent=arm,
                local_pos=(0.14 + f_idx * 0.045, sy * 0.035, -0.12 + f_idx * 0.02),
            )
        for cl_idx in range(3):
            build_curved_claw_or_horn(
                f"HandClaw_{a_idx}_{cl_idx}",
                length=0.14,
                base_r=0.016,
                curve_bend=0.04,
                direction=(0.82, 0.0, -0.58),
                mat=mats["tooth"],
                parent=arm,
                local_pos=(0.30, sy * (cl_idx - 1) * 0.018, -0.06),
            )

    # Z-bent digitigrade legs with large curved sickle claws
    for l_idx, sy in enumerate((1.0, -1.0)):
        leg = _build_digitigrade_leg(
            f"Leg{l_idx}",
            hip_pos=(-0.18, sy * 0.16, -0.02),
            side=sy,
            height=0.88,
            r_thigh=0.13,
            r_ankle=0.052,
            mat_limb=mats["body"],
            mat_claw=mats["tooth"],
            parent=body,
        )
        build_curved_claw_or_horn(
            f"SickleClaw_{l_idx}",
            length=0.22,
            base_r=0.032,
            curve_bend=0.11,
            direction=(0.68, 0.0, 0.72),
            mat=mats["tooth"],
            parent=leg,
            local_pos=(0.14, -sy * 0.038, -0.78),
        )

    # Counterbalance stiff tail + wide horizontal feather tail fan
    tail = create_bone_node("TailFan", (-0.46, 0.0, 0.02), parent=body)
    _tube(
        "Raptor_TailRod",
        [((0.0, 0.0, 0.0), 0.13, 0.14), ((-0.62, 0.0, 0.04), 0.075, 0.08), ((-1.30, 0.0, 0.10), 0.032, 0.035)],
        segs_u=12,
        segs_v=12,
        mat=mats["sec"],
        parent=tail,
        taper_start=False,
        subdiv=1,
    )
    _build_curved_tergite(
        "TailPlumageFan",
        length_x=0.52,
        width_y=0.56,
        thickness=0.035,
        arch_z=0.02,
        mat=mats["acc"],
        parent=tail,
        local_pos=(-1.12, 0.0, 0.09),
        sweep_x=-0.16,
    )
    return root


def build_triassic_hound():
    """Era 7/12: Fast quadrupedal predatory archosaur/cynodont hound."""
    mats = _minion_mats(
        "postosuchus",
        body_col=(0.48, 0.30, 0.22, 1.0),
        sec_col=(0.24, 0.18, 0.16, 1.0),
        acc_col=(0.86, 0.42, 0.20, 1.0),
        eye_col=(0.98, 0.54, 0.12, 1.0),
        roughness=0.46,
        metallic=0.06,
    )
    root, body = _create_base_rig(body_z=0.78)

    _tube(
        "Hound_Torso",
        [
            ((-0.55, 0.0, 0.02), 0.16, 0.19),
            ((-0.12, 0.0, 0.04), 0.18, 0.22),
            ((0.32, 0.0, 0.06), 0.24, 0.27),
            ((0.56, 0.0, 0.10), 0.19, 0.20),
        ],
        segs_u=14,
        segs_v=14,
        mat=mats["body"],
        parent=body,
        dorsal_keel=0.09,
        subdiv=1,
    )
    for idx in range(5):
        build_osteoderm_plate(
            f"SpineRidge_{idx}",
            width=0.09,
            height=0.16,
            thickness=0.04,
            mat=mats["acc"],
            parent=body,
            local_pos=(0.35 - idx * 0.20, 0.0, 0.27 - idx * 0.015),
            rot=(0.0, -0.35, 0.0),
            shape="diamond",
        )

    head = create_bone_node("Head_Pivot", (0.56, 0.0, 0.18), parent=body)
    _tube(
        "Hound_Head",
        [((-0.02, 0.0, 0.0), 0.18, 0.18), ((0.24, 0.0, 0.02), 0.15, 0.16), ((0.52, 0.0, -0.02), 0.09, 0.09)],
        segs_u=10,
        segs_v=12,
        mat=mats["body"],
        parent=head,
        dorsal_keel=0.04,
        subdiv=1,
    )
    _add_tooth_row(head, 0.44, -0.08, 4, 0.07, -0.06, 0.075, 0.016, -1.0, mats["tooth"])
    _add_eyes(head, 0.20, 0.14, 0.10, 0.048, mats)

    legs_spec = [
        ("Leg0", (0.36, 0.20, 0.0), (0.04, 0.03, -0.38), (0.10, 0.02, -0.76)),
        ("Leg1", (0.36, -0.20, 0.0), (0.04, -0.03, -0.38), (0.10, -0.02, -0.76)),
        ("Leg2", (-0.42, 0.20, 0.0), (-0.12, 0.03, -0.36), (-0.04, 0.02, -0.76)),
        ("Leg3", (-0.42, -0.20, 0.0), (-0.12, -0.03, -0.36), (-0.04, -0.02, -0.76)),
    ]
    for l_name, hip, knee, foot in legs_spec:
        _build_segmented_limb(l_name, hip, knee, foot, 0.11, 0.07, 0.055, mats["sec"], mats["tooth"], body, claws=3, claw_len=0.09)

    tail = create_bone_node("TailFan", (-0.54, 0.0, 0.02), parent=body)
    _tube(
        "Hound_Tail",
        [((0.0, 0.0, 0.0), 0.12, 0.13), ((-0.45, 0.0, 0.05), 0.065, 0.07), ((-0.92, 0.0, 0.14), 0.028, 0.03)],
        segs_u=12,
        segs_v=10,
        mat=mats["sec"],
        parent=tail,
        subdiv=1,
    )
    return root


def build_dino_tank():
    """Era 8: Heavily armored ankylosaurid living tank with tail club & shoulder spikes."""
    mats = _minion_mats(
        "ankylo",
        body_col=(0.40, 0.44, 0.34, 1.0),
        sec_col=(0.24, 0.26, 0.22, 1.0),
        acc_col=(0.76, 0.64, 0.38, 1.0),
        eye_col=(0.95, 0.52, 0.14, 1.0),
        roughness=0.58,
        metallic=0.12,
    )
    root, body = _create_base_rig(body_z=0.62)

    _tube(
        "Tank_Carapace",
        [
            ((-0.62, 0.0, 0.02), 0.28, 0.22),
            ((-0.20, 0.0, 0.06), 0.56, 0.34),
            ((0.24, 0.0, 0.06), 0.58, 0.35),
            ((0.56, 0.0, 0.04), 0.34, 0.24),
        ],
        segs_u=14,
        segs_v=16,
        mat=mats["body"],
        parent=body,
        belly_flat=0.65,
        subdiv=1,
    )
    for sp_idx, sx in enumerate((0.40, 0.16, -0.08, -0.32)):
        for sy in (1.0, -1.0):
            build_curved_claw_or_horn(
                f"SideSpike_{sp_idx}_{'L' if sy > 0 else 'R'}",
                length=0.36 - sp_idx * 0.04,
                base_r=0.068,
                curve_bend=0.06,
                direction=(0.25, sy * 0.92, 0.14),
                mat=mats["acc"],
                parent=body,
                local_pos=(sx, sy * 0.50, 0.06),
            )
    for rx in (-0.34, -0.08, 0.18, 0.38):
        for ry in (-0.22, 0.0, 0.22):
            build_osteoderm_plate(
                f"TankPlate_{int(rx * 100)}_{int(ry * 100)}",
                width=0.22,
                height=0.22,
                thickness=0.09,
                mat=mats["sec"] if ry != 0.0 else mats["acc"],
                parent=body,
                local_pos=(rx, ry, 0.36 - abs(ry) * 0.35),
                rot=(ry * 1.2, 0.0, 0.0),
                shape="hexagon",
            )

    head = create_bone_node("Head_Pivot", (0.58, 0.0, 0.04), parent=body)
    _tube(
        "Tank_Head",
        [((-0.04, 0.0, 0.0), 0.28, 0.20), ((0.22, 0.0, -0.02), 0.24, 0.16), ((0.40, 0.0, -0.04), 0.14, 0.10)],
        segs_u=10,
        segs_v=14,
        mat=mats["sec"],
        parent=head,
        belly_flat=0.6,
        subdiv=1,
    )
    for sy in (1.0, -1.0):
        build_curved_claw_or_horn(
            f"HeadHorn_{'L' if sy > 0 else 'R'}",
            length=0.22,
            base_r=0.055,
            curve_bend=0.04,
            direction=(-0.7, sy * 0.65, 0.25),
            mat=mats["acc"],
            parent=head,
            local_pos=(0.04, sy * 0.22, 0.08),
        )
    _add_eyes(head, 0.20, 0.20, 0.06, 0.045, mats)

    legs_spec = [
        ("Leg0", (0.34, 0.38, -0.04), (0.04, 0.06, -0.30), (0.06, 0.04, -0.56)),
        ("Leg1", (0.34, -0.38, -0.04), (0.04, -0.06, -0.30), (0.06, -0.04, -0.56)),
        ("Leg2", (-0.40, 0.36, -0.04), (-0.04, 0.06, -0.30), (0.02, 0.04, -0.56)),
        ("Leg3", (-0.40, -0.36, -0.04), (-0.04, -0.06, -0.30), (0.02, -0.04, -0.56)),
    ]
    for l_name, hip, knee, foot in legs_spec:
        _build_segmented_limb(l_name, hip, knee, foot, 0.16, 0.13, 0.11, mats["sec"], mats["acc"], body, claws=3, claw_len=0.08)

    tail = create_bone_node("TailFan", (-0.60, 0.0, 0.02), parent=body)
    _tube(
        "TailHandle",
        [((0.0, 0.0, 0.0), 0.16, 0.14), ((-0.45, 0.0, 0.0), 0.09, 0.08), ((-0.88, 0.0, 0.02), 0.075, 0.07)],
        segs_u=10,
        segs_v=10,
        mat=mats["sec"],
        parent=tail,
        subdiv=1,
    )
    _tube(
        "TailClubKnob",
        [((-0.82, 0.0, 0.02), 0.16, 0.13), ((-0.98, 0.0, 0.03), 0.25, 0.18), ((-1.14, 0.0, 0.03), 0.18, 0.14)],
        segs_u=8,
        segs_v=12,
        mat=mats["acc"],
        parent=tail,
        subdiv=1,
    )
    return root


def build_magma_ceratopsian():
    """Era 9: Volcanic basalt-armored Styracosaurus with glowing magma horn seams."""
    mats = _minion_mats(
        "pachyrhino",
        body_col=(0.24, 0.18, 0.18, 1.0),
        sec_col=(0.14, 0.10, 0.11, 1.0),
        acc_col=(1.0, 0.36, 0.06, 1.0),
        eye_col=(1.0, 0.56, 0.08, 1.0),
        roughness=0.56,
        metallic=0.14,
        acc_emissive=(1.0, 0.32, 0.04),
        acc_emissive_strength=1.2,
    )
    root, body = _create_base_rig(body_z=0.76)

    _tube(
        "MagmaCera_Torso",
        [
            ((-0.58, 0.0, 0.02), 0.24, 0.26),
            ((-0.14, 0.0, 0.06), 0.38, 0.40),
            ((0.30, 0.0, 0.06), 0.36, 0.38),
            ((0.56, 0.0, 0.08), 0.28, 0.28),
        ],
        segs_u=14,
        segs_v=16,
        mat=mats["body"],
        parent=body,
        dorsal_keel=0.10,
        subdiv=1,
    )
    ridge_z = (0.35, 0.36, 0.33, 0.26)
    for idx in range(4):
        build_osteoderm_plate(
            f"MagmaPlate_{idx}",
            width=0.16,
            height=0.20,
            thickness=0.06,
            mat=mats["acc"],
            parent=body,
            local_pos=(0.24 - idx * 0.22, 0.0, ridge_z[idx]),
            rot=(0.0, -0.25, 0.0),
            shape="diamond",
        )

    head = create_bone_node("Head_Pivot", (0.54, 0.0, 0.12), parent=body)
    _tube(
        "Cera_Head",
        [((-0.06, 0.0, 0.0), 0.28, 0.28), ((0.26, 0.0, -0.02), 0.22, 0.24), ((0.56, 0.0, -0.10), 0.12, 0.15)],
        segs_u=10,
        segs_v=14,
        mat=mats["body"],
        parent=head,
        dorsal_keel=0.08,
        subdiv=1,
    )
    # Upright sculpted hexagonal shield frill leaning up-and-back (+Y rot = +1.15 sends -X upward-back)
    frill_obj = build_osteoderm_plate(
        "Ceratopsian_Frill",
        width=1.12,
        height=0.80,
        thickness=0.12,
        mat=mats["sec"],
        parent=head,
        local_pos=(-0.04, 0.0, 0.26),
        rot=(0.0, 1.12, 0.0),
        shape="hexagon",
    )
    # Radiating glowing styracosaur frill spikes parented directly in frill local space so roots embed cleanly
    for s_idx, ang in enumerate((-0.82, -0.41, 0.0, 0.41, 0.82)):
        ca = math.cos(ang)
        sa = math.sin(ang)
        build_curved_claw_or_horn(
            f"FrillSpike_{s_idx}",
            length=0.44 - abs(ang) * 0.08,
            base_r=0.054,
            curve_bend=0.05,
            direction=(-ca, sa, 0.18),
            mat=mats["acc"],
            parent=frill_obj,
            local_pos=(-0.34 * ca, 0.34 * sa, 0.0),
        )
    build_curved_claw_or_horn(
        "NasalHorn",
        length=0.46,
        base_r=0.068,
        curve_bend=0.10,
        direction=(0.35, 0.0, 0.94),
        mat=mats["acc"],
        parent=head,
        local_pos=(0.44, 0.0, 0.08),
    )
    for sy in (1.0, -1.0):
        build_curved_claw_or_horn(
            f"BrowHorn_{'L' if sy > 0 else 'R'}",
            length=0.38,
            base_r=0.052,
            curve_bend=0.10,
            direction=(0.68, sy * 0.25, 0.68),
            mat=mats["acc"],
            parent=head,
            local_pos=(0.18, sy * 0.16, 0.18),
        )
    _add_eyes(head, 0.22, 0.20, 0.08, 0.052, mats)

    legs_spec = [
        ("Leg0", (0.34, 0.30, -0.02), (0.04, 0.06, -0.34), (0.08, 0.04, -0.72)),
        ("Leg1", (0.34, -0.30, -0.02), (0.04, -0.06, -0.34), (0.08, -0.04, -0.72)),
        ("Leg2", (-0.42, 0.28, -0.02), (-0.06, 0.06, -0.34), (0.02, 0.04, -0.72)),
        ("Leg3", (-0.42, -0.28, -0.02), (-0.06, -0.06, -0.34), (0.02, -0.04, -0.72)),
    ]
    for l_name, hip, knee, foot in legs_spec:
        _build_segmented_limb(l_name, hip, knee, foot, 0.15, 0.12, 0.10, mats["sec"], mats["acc"], body, claws=3, claw_len=0.08)

    tail = create_bone_node("TailFan", (-0.56, 0.0, 0.02), parent=body)
    _tube(
        "Cera_Tail",
        [((0.0, 0.0, 0.0), 0.18, 0.18), ((-0.38, 0.0, -0.08), 0.10, 0.10), ((-0.74, 0.0, -0.14), 0.04, 0.04)],
        segs_u=10,
        segs_v=10,
        mat=mats["sec"],
        parent=tail,
        subdiv=1,
    )
    return root


def build_mammal():
    """Era 10: Agile Eocene/Oligocene creodont carnivore (Hyaenodon-style)."""
    mats = _minion_mats(
        "smilodon",
        body_col=(0.52, 0.36, 0.22, 1.0),
        sec_col=(0.28, 0.18, 0.12, 1.0),
        acc_col=(0.82, 0.62, 0.36, 1.0),
        eye_col=(0.98, 0.72, 0.18, 1.0),
        roughness=0.68,
        metallic=0.02,
    )
    root, body = _create_base_rig(body_z=0.76)

    _tube(
        "Creodont_Torso",
        [
            ((-0.54, 0.0, 0.02), 0.17, 0.19),
            ((-0.14, 0.0, 0.05), 0.19, 0.22),
            ((0.26, 0.0, 0.04), 0.23, 0.26),
            ((0.50, 0.0, 0.10), 0.20, 0.22),
        ],
        segs_u=14,
        segs_v=14,
        mat=mats["body"],
        parent=body,
        subdiv=1,
    )

    head = create_bone_node("Head_Pivot", (0.50, 0.0, 0.18), parent=body)
    _tube(
        "Creodont_Head",
        [((-0.02, 0.0, 0.0), 0.19, 0.19), ((0.20, 0.0, 0.02), 0.16, 0.16), ((0.46, 0.0, -0.02), 0.09, 0.09)],
        segs_u=10,
        segs_v=12,
        mat=mats["body"],
        parent=head,
        subdiv=1,
    )
    for sy in (1.0, -1.0):
        build_curved_claw_or_horn(
            f"PointedEar_{'L' if sy > 0 else 'R'}",
            length=0.18,
            base_r=0.048,
            curve_bend=0.02,
            direction=(-0.25, sy * 0.45, 0.85),
            mat=mats["sec"],
            parent=head,
            local_pos=(0.04, sy * 0.12, 0.15),
        )
    _add_tooth_row(head, 0.40, -0.07, 4, 0.065, -0.05, 0.075, 0.015, -1.0, mats["tooth"])
    _add_eyes(head, 0.18, 0.14, 0.09, 0.046, mats)

    legs_spec = [
        ("Leg0", (0.32, 0.18, -0.02), (0.04, 0.02, -0.36), (0.10, 0.01, -0.72)),
        ("Leg1", (0.32, -0.18, -0.02), (0.04, -0.02, -0.36), (0.10, -0.01, -0.72)),
        ("Leg2", (-0.42, 0.18, -0.02), (-0.12, 0.02, -0.34), (-0.02, 0.01, -0.72)),
        ("Leg3", (-0.42, -0.18, -0.02), (-0.12, -0.02, -0.34), (-0.02, -0.01, -0.72)),
    ]
    for l_name, hip, knee, foot in legs_spec:
        _build_segmented_limb(l_name, hip, knee, foot, 0.11, 0.072, 0.055, mats["sec"], mats["tooth"], body, claws=3, claw_len=0.08)

    tail = create_bone_node("TailFan", (-0.52, 0.0, 0.04), parent=body)
    _tube(
        "Creodont_Tail",
        [((0.0, 0.0, 0.0), 0.10, 0.10), ((-0.40, 0.0, 0.06), 0.075, 0.075), ((-0.78, 0.0, 0.16), 0.05, 0.05)],
        segs_u=10,
        segs_v=10,
        mat=mats["acc"],
        parent=tail,
        subdiv=1,
    )
    return root


def build_serpent():
    """Era 10/11: Giant Paleogene constrictor serpent (Titanoboa) with articulated coils."""
    mats = _minion_mats(
        "postosuchus",
        body_col=(0.24, 0.44, 0.22, 1.0),
        sec_col=(0.14, 0.22, 0.12, 1.0),
        acc_col=(0.86, 0.68, 0.18, 1.0),
        eye_col=(0.98, 0.84, 0.12, 1.0),
        roughness=0.34,
        metallic=0.10,
    )
    root, body = _create_base_rig(body_z=0.22)

    head = create_bone_node("Head_Pivot", (0.58, 0.0, 0.34), parent=body)
    _tube(
        "Serpent_Neck",
        [((-0.26, 0.0, -0.30), 0.18, 0.16), ((-0.10, 0.0, -0.14), 0.15, 0.14), ((0.0, 0.0, 0.0), 0.14, 0.13)],
        segs_u=10,
        segs_v=12,
        mat=mats["body"],
        parent=head,
        subdiv=1,
    )
    _tube(
        "Serpent_Head",
        [((-0.02, 0.0, 0.0), 0.22, 0.14), ((0.22, 0.0, 0.0), 0.20, 0.13), ((0.44, 0.0, -0.02), 0.11, 0.08)],
        segs_u=10,
        segs_v=14,
        mat=mats["sec"],
        parent=head,
        belly_flat=0.65,
        subdiv=1,
    )
    for sy in (1.0, -1.0):
        build_curved_claw_or_horn(
            f"SerpentFang_{'L' if sy > 0 else 'R'}",
            length=0.14,
            base_r=0.022,
            curve_bend=0.03,
            direction=(-0.1, 0.0, -1.0),
            mat=mats["tooth"],
            parent=head,
            local_pos=(0.34, sy * 0.09, -0.04),
        )
    build_curved_claw_or_horn(
        "ForkedTongue",
        length=0.24,
        base_r=0.016,
        curve_bend=0.05,
        direction=(0.95, 0.0, -0.25),
        mat=mats["acc"],
        parent=head,
        local_pos=(0.42, 0.0, -0.04),
    )
    _add_eyes(head, 0.22, 0.17, 0.08, 0.052, mats)

    for s_idx in range(6):
        sx = 0.28 - s_idx * 0.36
        lat_y = math.sin(s_idx * 1.15) * 0.18
        rad = 0.20 * (1.0 - s_idx * 0.11)
        seg = create_bone_node(f"Seg{s_idx}", (sx, lat_y, -0.02), parent=body)
        _tube(
            f"Coil_{s_idx}",
            [((-0.22, 0.0, 0.0), rad * 0.94, rad * 0.82), ((0.0, 0.0, 0.0), rad * 1.05, rad * 0.90), ((0.22, 0.0, 0.0), rad * 0.96, rad * 0.84)],
            segs_u=8,
            segs_v=14,
            mat=mats["body"] if s_idx % 2 == 0 else mats["acc"],
            parent=seg,
            belly_flat=0.55,
            subdiv=1,
        )

    tail = create_bone_node("TailFan", (-1.85, 0.0, -0.04), parent=body)
    _tube(
        "Serpent_RattleTip",
        [((0.0, 0.0, 0.0), 0.08, 0.07), ((-0.35, 0.0, 0.06), 0.045, 0.045), ((-0.60, 0.0, 0.14), 0.02, 0.02)],
        segs_u=8,
        segs_v=10,
        mat=mats["acc"],
        parent=tail,
        subdiv=1,
    )
    return root


def build_bird_pterosaur():
    """Era 11/13: Swooping Cretaceous/Cenozoic hunter (Pteranodon / Dimorphodon)."""
    mats = _minion_mats(
        "quetzal",
        body_col=(0.46, 0.32, 0.24, 1.0),
        sec_col=(0.24, 0.18, 0.18, 1.0),
        acc_col=(0.92, 0.44, 0.16, 1.0),
        eye_col=(0.98, 0.78, 0.12, 1.0),
        roughness=0.46,
        metallic=0.05,
        wing_col=(0.64, 0.42, 0.26, 1.0),
        wing_alpha=0.88,
    )
    root, body = _create_base_rig(body_z=1.28)

    _tube(
        "Ptero_Body",
        [
            ((-0.44, 0.0, -0.02), 0.12, 0.12),
            ((-0.10, 0.0, 0.0), 0.20, 0.22),
            ((0.26, 0.0, 0.04), 0.22, 0.25),
        ],
        segs_u=12,
        segs_v=14,
        mat=mats["body"],
        parent=body,
        subdiv=1,
    )

    head = create_bone_node("Head_Pivot", (0.28, 0.0, 0.12), parent=body)
    _tube(
        "Ptero_Neck",
        [((0.0, 0.0, 0.0), 0.12, 0.12), ((0.18, 0.0, 0.12), 0.10, 0.10), ((0.30, 0.0, 0.18), 0.12, 0.13)],
        segs_u=8,
        segs_v=10,
        mat=mats["body"],
        parent=head,
        subdiv=1,
    )
    _build_tapered_fin(
        "CranialCrest",
        [((0.26, 0.0, 0.20), 0.9), ((0.0, 0.0, 0.30), 0.8), ((-0.36, 0.0, 0.40), 0.35)],
        chord=0.30,
        thickness=0.036,
        mat=mats["acc"],
        parent=head,
    )
    build_curved_claw_or_horn(
        "Ptero_Beak",
        length=0.68,
        base_r=0.072,
        curve_bend=0.03,
        direction=(0.98, 0.0, -0.18),
        mat=mats["acc"],
        parent=head,
        local_pos=(0.30, 0.0, 0.16),
        segs_u=10,
        segs_v=10,
    )
    _add_eyes(head, 0.28, 0.10, 0.22, 0.045, mats)

    for w_idx, sy in enumerate((1.0, -1.0)):
        _build_membrane_wing(
            f"WingPivot{w_idx}",
            (0.18, sy * 0.18, 0.12),
            sy,
            span=1.65,
            chord=0.62,
            sweep_x=-0.38,
            dihedral_z=0.22,
            mat_frame=mats["sec"],
            mat_wing=mats["wing"],
            parent=body,
        )

    for l_idx, sy in enumerate((1.0, -1.0)):
        _build_segmented_limb(
            f"Leg{l_idx}",
            hip_pos=(-0.34, sy * 0.12, -0.06),
            knee_offset=(-0.18, 0.0, -0.22),
            foot_offset=(-0.32, 0.0, -0.44),
            r_top=0.07,
            r_mid=0.045,
            r_bot=0.035,
            mat_limb=mats["sec"],
            mat_claw=mats["tooth"],
            parent=body,
            claws=3,
            claw_len=0.10,
        )

    tail = create_bone_node("TailFan", (-0.42, 0.0, 0.0), parent=body)
    _tube(
        "Ptero_Tail",
        [((0.0, 0.0, 0.0), 0.06, 0.06), ((-0.55, 0.0, 0.04), 0.03, 0.03)],
        segs_u=8,
        segs_v=8,
        mat=mats["sec"],
        parent=tail,
    )
    build_osteoderm_plate("TailVane", width=0.28, height=0.30, thickness=0.025, mat=mats["acc"], parent=tail, local_pos=(-0.58, 0.0, 0.05), shape="diamond")
    return root


def build_glacier_panther():
    """Era 12: Pleistocene glacial frost panther / cave lion with ice-crystal ridge."""
    mats = _minion_mats(
        "smilodon",
        body_col=(0.76, 0.86, 0.94, 1.0),
        sec_col=(0.34, 0.46, 0.58, 1.0),
        acc_col=(0.38, 0.90, 1.0, 1.0),
        eye_col=(0.24, 0.96, 1.0, 1.0),
        roughness=0.58,
        metallic=0.08,
        acc_emissive=(0.28, 0.84, 1.0),
        acc_emissive_strength=0.65,
    )
    root, body = _create_base_rig(body_z=0.84)

    _tube(
        "Panther_Torso",
        [
            ((-0.58, 0.0, 0.02), 0.18, 0.21),
            ((-0.14, 0.0, 0.04), 0.20, 0.24),
            ((0.30, 0.0, 0.06), 0.25, 0.28),
            ((0.54, 0.0, 0.10), 0.22, 0.24),
        ],
        segs_u=14,
        segs_v=14,
        mat=mats["body"],
        parent=body,
        subdiv=1,
    )
    frost_z = (0.24, 0.23, 0.22, 0.20)
    for idx in range(4):
        build_curved_claw_or_horn(
            f"FrostCrystal_{idx}",
            length=0.26 - idx * 0.03,
            base_r=0.046,
            curve_bend=0.02,
            direction=(-0.45, 0.0, 0.88),
            mat=mats["acc"],
            parent=body,
            local_pos=(0.32 - idx * 0.22, 0.0, frost_z[idx]),
        )

    head = create_bone_node("Head_Pivot", (0.54, 0.0, 0.18), parent=body)
    _tube(
        "Panther_Head",
        [((-0.02, 0.0, 0.0), 0.22, 0.22), ((0.22, 0.0, 0.02), 0.20, 0.19), ((0.42, 0.0, -0.02), 0.12, 0.12)],
        segs_u=10,
        segs_v=14,
        mat=mats["body"],
        parent=head,
        subdiv=1,
    )
    for sy in (1.0, -1.0):
        build_curved_claw_or_horn(
            f"CatEar_{'L' if sy > 0 else 'R'}",
            length=0.14,
            base_r=0.045,
            curve_bend=0.02,
            direction=(-0.2, sy * 0.35, 0.9),
            mat=mats["sec"],
            parent=head,
            local_pos=(0.04, sy * 0.14, 0.16),
        )
        build_curved_claw_or_horn(
            f"GlacierFang_{'L' if sy > 0 else 'R'}",
            length=0.18,
            base_r=0.028,
            curve_bend=0.03,
            direction=(-0.12, 0.0, -1.0),
            mat=mats["tooth"],
            parent=head,
            local_pos=(0.34, sy * 0.085, -0.05),
        )
    _add_eyes(head, 0.22, 0.16, 0.09, 0.05, mats)

    legs_spec = [
        ("Leg0", (0.34, 0.20, -0.02), (0.04, 0.02, -0.40), (0.12, 0.01, -0.80)),
        ("Leg1", (0.34, -0.20, -0.02), (0.04, -0.02, -0.40), (0.12, -0.01, -0.80)),
        ("Leg2", (-0.44, 0.20, -0.02), (-0.14, 0.02, -0.38), (-0.02, 0.01, -0.80)),
        ("Leg3", (-0.44, -0.20, -0.02), (-0.14, -0.02, -0.38), (-0.02, -0.01, -0.80)),
    ]
    for l_name, hip, knee, foot in legs_spec:
        _build_segmented_limb(l_name, hip, knee, foot, 0.125, 0.082, 0.068, mats["sec"], mats["tooth"], body, claws=3, claw_len=0.09)

    tail = create_bone_node("TailFan", (-0.56, 0.0, 0.04), parent=body)
    _tube(
        "Panther_Tail",
        [((0.0, 0.0, 0.0), 0.095, 0.095), ((-0.46, 0.0, -0.04), 0.065, 0.065), ((-0.92, 0.0, 0.10), 0.05, 0.05)],
        segs_u=12,
        segs_v=10,
        mat=mats["acc"],
        parent=tail,
        subdiv=1,
    )
    return root


MINION_BUILDERS = {
    "cambrian_trilobite": build_cambrian_trilobite,
    "opabinia_radiodont_elite": build_opabinia_radiodont_elite,
    "orthoceras": build_orthoceras,
    "eurypterid": build_eurypterid,
    "jawless_fish": build_jawless_fish,
    "shark_placoderm": build_shark_placoderm,
    "bothriolepis": build_bothriolepis,
    "meganeura": build_meganeura,
    "arthropleura": build_arthropleura,
    "synapsid": build_synapsid,
    "scutosaurus": build_scutosaurus,
    "raptor": build_raptor,
    "triassic_hound": build_triassic_hound,
    "dino_tank": build_dino_tank,
    "magma_ceratopsian": build_magma_ceratopsian,
    "mammal": build_mammal,
    "serpent": build_serpent,
    "bird_pterosaur": build_bird_pterosaur,
    "glacier_panther": build_glacier_panther,
}


def build_minion_glb(enemy_type):
    """Build and export one campaign minion GLB by enemy_type."""
    if enemy_type not in MINION_BUILDERS:
        raise ValueError(f"Unknown minion enemy_type: {enemy_type}")
    os.makedirs(MINION_OUT_DIR, exist_ok=True)
    clear_scene()
    MINION_BUILDERS[enemy_type]()
    out_path = os.path.join(MINION_OUT_DIR, f"{enemy_type}.glb")
    export_fighter_glb(out_path)
    return out_path


def build_all_minions(types=None):
    """Build and export requested minion GLBs (defaults to all 19)."""
    targets = list(types) if types is not None else list(ALL_MINION_TYPES)
    results = []
    for et in targets:
        out_path = build_minion_glb(et)
        results.append(out_path)
    return results


if __name__ == "__main__":
    build_all_minions()
