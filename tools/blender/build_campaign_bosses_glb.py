"""Procedural anatomical 3D builder for 6 unique campaign bosses & 5 campaign props.

Run inside Blender 5.x (or via MCP execute_blender_code) to sculpt, rig, and
export all `assets/models/campaign/*.glb` assets:
  Bosses (matching playable Fighter3D bone rigs for full combat animation):
    - boss_cameroceras   (baseDino: spinosaurus, Bone_Hips Z=1.85)
    - boss_jaekelopterus (baseDino: pulmonoscorpius, Bone_Hips Z=0.95)
    - boss_dunkleosteus  (baseDino: postosuchus, Bone_Hips Z=1.48)
    - boss_dimetrodon    (baseDino: postosuchus, Bone_Hips Z=1.48)
    - boss_pyroclast     (baseDino: trex, Bone_Hips Z=2.10)
    - boss_wendigo       (baseDino: giantsloth, Bone_Hips Z=1.85)
  Campaign Props:
    - pickup_meat
    - pickup_amber
    - hazard_meteor
    - hazard_boulder
    - hazard_icicle
"""

import math
import os
import random
import sys
import bpy
import bmesh
from mathutils import Vector, Euler

THIS_DIR = os.path.dirname(os.path.abspath(__file__))
if THIS_DIR not in sys.path:
    sys.path.insert(0, THIS_DIR)

from blender_rig_utils import (
    ROOT,
    clear_scene,
    make_pbr_material,
    create_bone_node,
    attach_mesh_obj,
    build_curved_claw_or_horn,
    build_osteoderm_plate,
    export_fighter_glb,
)
from build_minions_glb import (
    _tube,
    _bump_tex,
    _minion_mats,
    _build_tapered_fin,
    _build_segmented_limb,
    _build_digitigrade_leg,
    _build_arthropod_leg,
    _build_curved_tergite,
    _add_tooth_row,
    _add_eyes,
)

CAMPAIGN_OUT_DIR = os.path.join(ROOT, "assets", "models", "campaign")

ALL_BOSS_IDS = [
    "boss_cameroceras",
    "boss_jaekelopterus",
    "boss_dunkleosteus",
    "boss_dimetrodon",
    "boss_pyroclast",
    "boss_wendigo",
]

ALL_PROP_IDS = [
    "pickup_meat",
    "pickup_amber",
    "hazard_meteor",
    "hazard_boulder",
    "hazard_icicle",
]


def _create_fighter_skeleton(hips_z):
    """Create canonical Fighter3D bone root + hips + torso."""
    root = create_bone_node("Bone_Root", (0.0, 0.0, 0.0))
    hips = create_bone_node("Bone_Hips", (0.0, 0.0, hips_z), parent=root)
    return root, hips


# ==============================================================================
# 6 DISTINCT CAMPAIGN ERA BOSSES
# ==============================================================================


def build_boss_cameroceras():
    """Era 2 Boss: Abyssal Giant Orthocone Nautiloid (rig: spinosaurus, Z=1.85)."""
    mats = _minion_mats(
        "anomalocaris",
        body_col=(0.14, 0.36, 0.56, 1.0),
        sec_col=(0.68, 0.78, 0.86, 1.0),
        acc_col=(0.12, 0.88, 0.96, 1.0),
        eye_col=(0.24, 0.96, 1.0, 1.0),
        roughness=0.34,
        metallic=0.18,
        acc_emissive=(0.10, 0.78, 0.94),
        acc_emissive_strength=0.65,
    )
    root, hips = _create_fighter_skeleton(1.85)
    torso = create_bone_node("Bone_Torso", (0.35, 0.0, 0.0), parent=hips)

    # Anterior shell aperture housing & muscular collar
    _tube(
        "Came_ApertureChamber",
        [
            ((-0.45, 0.0, 0.0), 0.54, 0.54),
            ((0.05, 0.0, 0.02), 0.62, 0.60),
            ((0.60, 0.0, 0.04), 0.64, 0.62),
        ],
        segs_u=18,
        segs_v=14,
        mat=mats["sec"],
        parent=torso,
        taper_start=False,
        taper_end=False,
        subdiv=1,
    )
    # Bioluminescent suture collar ring
    _tube(
        "Came_CollarRing",
        [((0.48, 0.0, 0.04), 0.66, 0.64), ((0.58, 0.0, 0.04), 0.66, 0.64)],
        segs_u=18,
        segs_v=6,
        mat=mats["acc"],
        parent=torso,
        cap_ends=False,
        taper_start=False,
        taper_end=False,
    )

    # Dorsal stabilizing hydro-fin ridge (Special_Sail required by spinosaurus rig)
    sail = create_bone_node("Special_Sail", (0.0, 0.0, 0.58), parent=torso)
    _build_tapered_fin(
        "Came_DorsalHydroFin",
        [((0.25, 0.0, 0.0), 0.9), ((0.0, 0.0, 0.44), 0.9), ((-0.38, 0.0, 0.12), 0.5)],
        chord=0.78,
        thickness=0.05,
        mat=mats["acc"],
        parent=sail,
    )

    # Soft cephalopod mantle neck + fierce hooded head + parrot-beak jaw
    neck = create_bone_node("Bone_Neck", (0.62, 0.0, 0.04), parent=torso)
    _tube(
        "Came_MantleCollar",
        [((0.0, 0.0, 0.0), 0.60, 0.56), ((0.35, 0.0, 0.02), 0.48, 0.44)],
        segs_u=16,
        segs_v=10,
        mat=mats["body"],
        parent=neck,
        taper_start=False,
        subdiv=1,
    )
    head = create_bone_node("Bone_Head", (0.36, 0.0, 0.04), parent=neck)
    _tube(
        "Came_HeadMantle",
        [((0.0, 0.0, 0.02), 0.46, 0.40), ((0.42, 0.0, 0.04), 0.36, 0.32), ((0.72, 0.0, -0.02), 0.18, 0.18)],
        segs_u=14,
        segs_v=14,
        mat=mats["body"],
        parent=head,
        dorsal_keel=0.08,
        subdiv=1,
    )
    _add_eyes(head, 0.28, 0.36, 0.16, 0.115, mats)

    jaw = create_bone_node("Bone_Jaw", (0.32, 0.0, -0.14), parent=head)
    build_curved_claw_or_horn(
        "Came_UpperBeak",
        length=0.38,
        base_r=0.11,
        curve_bend=0.12,
        direction=(0.90, 0.0, -0.35),
        mat=mats["tooth"],
        parent=head,
        local_pos=(0.56, 0.0, -0.02),
    )
    build_curved_claw_or_horn(
        "Came_LowerBeak",
        length=0.32,
        base_r=0.09,
        curve_bend=0.10,
        direction=(0.88, 0.0, 0.42),
        mat=mats["tooth"],
        parent=jaw,
        local_pos=(0.20, 0.0, -0.04),
    )

    # Massive grasping front tentacle clusters (Bone_Arm0 & Bone_Arm1 + secondary crown tentacles)
    for a_idx, sy in enumerate((1.0, -1.0)):
        arm = create_bone_node(f"Bone_Arm{a_idx}", (0.42, sy * 0.26, -0.04), parent=torso)
        for sub_i, dz in enumerate((-0.08, 0.14)):
            build_curved_claw_or_horn(
                f"MajorTentacle_{a_idx}_{sub_i}",
                length=1.85 - sub_i * 0.25,
                base_r=0.105,
                curve_bend=0.34,
                direction=(0.94, sy * 0.16, dz),
                mat=mats["body"] if sub_i == 0 else mats["acc"],
                parent=arm,
                local_pos=(0.15, sy * sub_i * 0.08, dz),
                segs_u=10,
                segs_v=14,
            )

    # Ventral stabilizing siphons & sweeping lower tentacles (Bone_Leg0..1 swept forward)
    for l_idx, sy in enumerate((1.0, -1.0)):
        leg = create_bone_node(f"Bone_Leg{l_idx}", (0.28, sy * 0.34, -0.36), parent=hips)
        build_curved_claw_or_horn(
            f"VentralTentacle_{l_idx}",
            length=1.65,
            base_r=0.115,
            curve_bend=0.36,
            direction=(0.82, sy * 0.22, -0.52),
            mat=mats["body"],
            parent=leg,
            segs_u=10,
            segs_v=12,
        )

    # Towering tapering ringed orthocone shell (Bone_Tail0 -> Bone_Tail3)
    tail_parent = hips
    tail_specs = [
        ("Bone_Tail0", (-0.10, 0.0, 0.0), 0.78, 0.62, 0.50),
        ("Bone_Tail1", (-0.78, 0.0, 0.04), 0.78, 0.50, 0.38),
        ("Bone_Tail2", (-0.78, 0.0, 0.05), 0.78, 0.38, 0.24),
        ("Bone_Tail3", (-0.78, 0.0, 0.06), 0.78, 0.24, 0.06),
    ]
    for idx, (t_name, t_pos, seg_len, r0, r1) in enumerate(tail_specs):
        tb = create_bone_node(t_name, t_pos, parent=tail_parent)
        _tube(
            f"ShellCone_{idx}",
            [((0.0, 0.0, 0.0), r0, r0), ((-seg_len * 0.5, 0.0, 0.02), (r0 + r1) * 0.5, (r0 + r1) * 0.5), ((-seg_len, 0.0, 0.04), r1, r1)],
            segs_u=18,
            segs_v=12,
            mat=mats["sec"] if idx % 2 == 0 else mats["body"],
            parent=tb,
            taper_start=False,
            taper_end=(idx == 3),
            subdiv=1,
        )
        #Glowing chamber septum ring
        _tube(
            f"SeptumBand_{idx}",
            [((-seg_len * 0.45, 0.0, 0.02), (r0 + r1) * 0.53, (r0 + r1) * 0.53), ((-seg_len * 0.55, 0.0, 0.02), (r0 + r1) * 0.53, (r0 + r1) * 0.53)],
            segs_u=18,
            segs_v=4,
            mat=mats["acc"],
            parent=tb,
            cap_ends=False,
            taper_start=False,
            taper_end=False,
        )
        if idx == 3:
            for sy in (1.0, -1.0):
                _build_tapered_fin(
                    f"ShellApexFin_{'L' if sy > 0 else 'R'}",
                    [((0.0, sy * 0.08, 0.0), 0.8), ((-0.35, sy * 0.58, 0.04), 0.9), ((-0.68, sy * 0.26, 0.06), 0.4)],
                    chord=0.55,
                    thickness=0.04,
                    mat=mats["acc"],
                    parent=tb,
                    local_pos=(-0.25, 0.0, 0.02),
                )
        tail_parent = tb
    return root


def build_boss_jaekelopterus():
    """Era 3 Boss: 2.5m Giant Armored Devonian Sea Scorpion King (rig: pulmonoscorpius, Z=0.95)."""
    mats = _minion_mats(
        "pulmonoscorpius",
        body_col=(0.12, 0.44, 0.48, 1.0),
        sec_col=(0.06, 0.22, 0.26, 1.0),
        acc_col=(0.98, 0.54, 0.14, 1.0),
        eye_col=(0.98, 0.86, 0.18, 1.0),
        roughness=0.30,
        metallic=0.28,
        acc_emissive=(0.96, 0.44, 0.10),
        acc_emissive_strength=0.35,
    )
    root, hips = _create_fighter_skeleton(0.95)
    torso = create_bone_node("Bone_Torso", (0.28, 0.0, 0.02), parent=hips)

    # Heavy broad segmented carapace
    _tube(
        "Jaekel_Carapace",
        [
            ((-0.45, 0.0, 0.0), 0.56, 0.24),
            ((0.0, 0.0, 0.04), 0.72, 0.28),
            ((0.52, 0.0, 0.04), 0.68, 0.26),
        ],
        segs_u=18,
        segs_v=14,
        mat=mats["body"],
        parent=torso,
        belly_flat=0.65,
        taper_start=False,
        taper_end=False,
        subdiv=1,
    )
    for t_idx in range(5):
        tx = 0.42 - t_idx * 0.22
        _build_curved_tergite(
            f"JaekelTergite_{t_idx}",
            length_x=0.20,
            width_y=1.35 * (1.0 - t_idx * 0.06),
            thickness=0.065,
            arch_z=0.14,
            mat=mats["sec"] if t_idx % 2 else mats["body"],
            parent=torso,
            local_pos=(tx, 0.0, 0.18),
            sweep_x=-0.08,
        )

    # Armored prosoma head shield + jagged gnathobase jaws + giant serrated chelicera claws
    neck = create_bone_node("Bone_Neck", (0.50, 0.0, 0.02), parent=torso)
    head = create_bone_node("Bone_Head", (0.24, 0.0, 0.02), parent=neck)
    _tube(
        "Jaekel_Prosoma",
        [((-0.24, 0.0, 0.0), 0.66, 0.26), ((0.18, 0.0, 0.02), 0.60, 0.24), ((0.48, 0.0, -0.02), 0.34, 0.14)],
        segs_u=16,
        segs_v=12,
        mat=mats["body"],
        parent=head,
        belly_flat=0.70,
        subdiv=1,
    )
    _add_eyes(head, 0.22, 0.34, 0.20, 0.105, mats)

    jaw = create_bone_node("Bone_Jaw", (0.16, 0.0, -0.08), parent=head)
    _tube("Jaekel_Gnathobase", [((0.0, 0.0, 0.0), 0.28, 0.10), ((0.32, 0.0, -0.02), 0.20, 0.08)], segs_u=12, segs_v=8, mat=mats["sec"], parent=jaw)
    _add_tooth_row(jaw, 0.26, -0.09, 3, 0.14, 0.04, 0.11, 0.026, 1.0, mats["acc"])

    # Enormous signature Jaekelopterus raptorial pincer chelicerae (Bone_Arm0 & Bone_Arm1)
    for a_idx, sy in enumerate((1.0, -1.0)):
        arm = create_bone_node(f"Bone_Arm{a_idx}", (0.48, sy * 0.36, -0.02), parent=torso)
        _tube(
            f"CheliceraArm_{a_idx}",
            [((0.0, 0.0, 0.0), 0.11, 0.10), ((0.48, sy * 0.14, 0.08), 0.10, 0.09), ((0.95, sy * 0.04, 0.02), 0.12, 0.11)],
            segs_u=12,
            segs_v=12,
            mat=mats["sec"],
            parent=arm,
            subdiv=1,
        )
        # Twin snapping pincer jaws + inner spikes
        build_curved_claw_or_horn(
            f"PincerOuter_{a_idx}",
            length=0.76,
            base_r=0.095,
            curve_bend=0.22,
            direction=(0.94, -sy * 0.34, 0.06),
            mat=mats["acc"],
            parent=arm,
            local_pos=(0.95, sy * 0.08, 0.04),
            segs_u=10,
            segs_v=10,
        )
        build_curved_claw_or_horn(
            f"PincerInner_{a_idx}",
            length=0.58,
            base_r=0.072,
            curve_bend=0.16,
            direction=(0.92, sy * 0.22, -0.06),
            mat=mats["tooth"],
            parent=arm,
            local_pos=(0.92, -sy * 0.02, 0.0),
            segs_u=8,
            segs_v=8,
        )

    # 8 articulated limbs (Leg0..5 walking legs touching Z=0, Leg6..7 wide swimming paddles)
    leg_idx = 0
    for row_x in (0.36, 0.06, -0.24):
        for sy in (1.0, -1.0):
            _build_arthropod_leg(
                f"Bone_Leg{leg_idx}",
                coxa_pos=(row_x, sy * 0.56, -0.08),
                side=sy,
                out_y=0.68,
                arch_z=0.16,
                ground_z=-0.84,
                forward_x=0.12,
                r_base=0.078,
                mat_leg=mats["sec"],
                mat_tip=mats["acc"],
                parent=hips,
            )
            leg_idx += 1

    # Rear giant rowing paddles (Bone_Leg6 & Bone_Leg7)
    for p_idx, sy in enumerate((1.0, -1.0)):
        paddle = create_bone_node(f"Bone_Leg{6 + p_idx}", (-0.36, sy * 0.54, -0.04), parent=hips)
        _build_tapered_fin(
            f"KingPaddle_{p_idx}",
            [((0.0, 0.0, 0.0), 0.7), ((-0.26, sy * 0.72, -0.10), 1.25), ((-0.52, sy * 1.15, -0.16), 0.68)],
            chord=0.56,
            thickness=0.048,
            mat=mats["acc"],
            parent=paddle,
        )

    # Segmented armored scorpion tail arcing overhead to Special_Stinger (Tail0..Tail4 + Stinger)
    tail_parent = hips
    tail_steps = [
        ((-0.38, 0.0, 0.02), (-0.42, 0.0, 0.14), 0.34),
        ((-0.42, 0.0, 0.14), (-0.36, 0.0, 0.38), 0.25),
        ((-0.36, 0.0, 0.38), (-0.12, 0.0, 0.54), 0.19),
        ((-0.12, 0.0, 0.54), (0.24, 0.0, 0.44), 0.15),
        ((0.24, 0.0, 0.44), (0.42, 0.0, 0.24), 0.12),
    ]
    for t_i, (loc, end_vec, rad) in enumerate(tail_steps):
        pos = loc if t_i == 0 else tail_steps[t_i - 1][1]
        tb = create_bone_node(f"Bone_Tail{t_i}", pos, parent=tail_parent)
        _tube(
            f"TailMetasoma_{t_i}",
            [((0.0, 0.0, 0.0), rad * 1.1, rad), (end_vec, rad * 0.9, rad * 0.85)],
            segs_u=12,
            segs_v=8,
            mat=mats["body"] if t_i % 2 == 0 else mats["sec"],
            parent=tb,
            subdiv=1,
        )
        tail_parent = tb

    stinger = create_bone_node("Special_Stinger", tail_steps[-1][1], parent=tail_parent)
    build_curved_claw_or_horn(
        "KingTelsonBlade",
        length=1.10,
        base_r=0.11,
        curve_bend=0.18,
        direction=(0.92, 0.0, -0.35),
        mat=mats["acc"],
        parent=stinger,
        segs_u=12,
        segs_v=12,
    )
    return root


def build_boss_dunkleosteus():
    """Era 4 Boss: 10-meter Armored Devonian Apex Dunkleosteus (rig: postosuchus, Z=1.48)."""
    mats = _minion_mats(
        "ankylo",
        body_col=(0.24, 0.32, 0.38, 1.0),
        sec_col=(0.56, 0.42, 0.26, 1.0),
        acc_col=(0.92, 0.62, 0.22, 1.0),
        eye_col=(0.98, 0.44, 0.12, 1.0),
        roughness=0.40,
        metallic=0.22,
    )
    root, hips = _create_fighter_skeleton(1.48)
    torso = create_bone_node("Bone_Torso", (0.28, 0.0, 0.0), parent=hips)

    # Heavy armored thoracic placoderm barrel shield
    _tube(
        "Dunk_ThoracicArmor",
        [
            ((-0.55, 0.0, 0.0), 0.44, 0.48),
            ((0.0, 0.0, 0.04), 0.56, 0.60),
            ((0.52, 0.0, 0.04), 0.58, 0.58),
        ],
        segs_u=18,
        segs_v=16,
        mat=mats["body"],
        parent=torso,
        dorsal_keel=0.12,
        taper_start=False,
        taper_end=False,
        subdiv=1,
    )
    # Battle-plated bronze thoracic shoulder scutes
    for sy in (1.0, -1.0):
        _build_curved_tergite(
            f"ThoracicShield_{'L' if sy > 0 else 'R'}",
            length_x=0.78,
            width_y=0.58,
            thickness=0.08,
            arch_z=0.12,
            mat=mats["sec"],
            parent=torso,
            local_pos=(0.15, sy * 0.28, 0.36),
            sweep_x=-0.06,
        )
    # Tall razor dorsal fin
    _build_tapered_fin(
        "Dunk_DorsalFin",
        [((-0.05, 0.0, 0.50), 0.9), ((-0.35, 0.0, 1.08), 0.72), ((-0.65, 0.0, 1.32), 0.32)],
        chord=0.68,
        thickness=0.055,
        mat=mats["acc"],
        parent=torso,
    )

    # Massive armored skull + hinged guillotine slicing bone jaws
    neck = create_bone_node("Bone_Neck", (0.50, 0.0, 0.06), parent=torso)
    head = create_bone_node("Bone_Head", (0.28, 0.0, 0.02), parent=neck)
    _tube(
        "Dunk_SkullPlates",
        [
            ((-0.24, 0.0, 0.10), 0.52, 0.46),
            ((0.20, 0.0, 0.08), 0.48, 0.40),
            ((0.64, 0.0, 0.02), 0.32, 0.24),
        ],
        segs_u=16,
        segs_v=14,
        mat=mats["sec"],
        parent=head,
        dorsal_keel=0.08,
        belly_flat=0.72,
        subdiv=1,
    )
    _add_eyes(head, 0.26, 0.42, 0.18, 0.11, mats)

    jaw = create_bone_node("Bone_Jaw", (0.04, 0.0, -0.14), parent=head)
    _tube(
        "Dunk_GuillotineJaw",
        [((-0.14, 0.0, -0.06), 0.44, 0.22), ((0.28, 0.0, -0.10), 0.34, 0.18), ((0.64, 0.0, -0.04), 0.18, 0.12)],
        segs_u=14,
        segs_v=12,
        mat=mats["body"],
        parent=jaw,
        subdiv=1,
    )
    # Iconic anterior bony fang-blades (no true teeth — sharpened self-honing jawbone plates!)
    for sy in (1.0, -1.0):
        build_curved_claw_or_horn(
            f"UpperFangBlade_{'L' if sy > 0 else 'R'}",
            length=0.34,
            base_r=0.078,
            curve_bend=0.04,
            direction=(-0.05, 0.0, -1.0),
            mat=mats["tooth"],
            parent=head,
            local_pos=(0.56, sy * 0.18, -0.08),
        )
        build_curved_claw_or_horn(
            f"LowerFangBlade_{'L' if sy > 0 else 'R'}",
            length=0.30,
            base_r=0.072,
            curve_bend=0.04,
            direction=(0.08, 0.0, 1.0),
            mat=mats["tooth"],
            parent=jaw,
            local_pos=(0.50, sy * 0.16, 0.02),
        )
    _add_tooth_row(head, 0.38, -0.13, 3, 0.22, -0.08, 0.16, 0.045, -1.0, mats["tooth"])
    _add_tooth_row(jaw, 0.34, -0.12, 3, 0.20, 0.02, 0.14, 0.042, 1.0, mats["tooth"])

    # Pectoral & pelvic hydro-dive fins mapped to Bone_Leg0..3 (low sweeping silhouette)
    fin_specs = [
        ("Bone_Leg0", (0.42, 0.46, -0.34), 1.0, 1.05, 0.62),
        ("Bone_Leg1", (0.42, -0.46, -0.34), -1.0, 1.05, 0.62),
        ("Bone_Leg2", (-0.36, 0.32, -0.30), 1.0, 0.62, 0.38),
        ("Bone_Leg3", (-0.36, -0.32, -0.30), -1.0, 0.62, 0.38),
    ]
    for f_name, f_pos, sy, span_w, f_chord in fin_specs:
        fb = create_bone_node(f_name, f_pos, parent=hips)
        _build_tapered_fin(
            f"DunkFin_{f_name}",
            [((0.0, 0.0, 0.0), 0.9), ((-0.28, sy * span_w * 0.6, -0.36), 0.78), ((-0.52, sy * span_w, -0.62), 0.34)],
            chord=f_chord,
            thickness=0.048,
            mat=mats["sec"],
            parent=fb,
        )

    # Muscular shark-like tail + sweeping crescent caudal fin (Bone_Tail0..Tail3)
    tail_parent = hips
    tail_radii = [(0.42, 0.32), (0.32, 0.22), (0.22, 0.13), (0.13, 0.06)]
    for t_i, (r0, r1) in enumerate(tail_radii):
        t_pos = (-0.32, 0.0, 0.0) if t_i == 0 else (-0.54, 0.0, 0.02)
        tb = create_bone_node(f"Bone_Tail{t_i}", t_pos, parent=tail_parent)
        _tube(
            f"DunkTailSeg_{t_i}",
            [((0.0, 0.0, 0.0), r0, r0 * 1.15), ((-0.54, 0.0, 0.02), r1, r1 * 1.15)],
            segs_u=14,
            segs_v=8,
            mat=mats["body"],
            parent=tb,
            dorsal_keel=0.08,
            taper_start=False,
            taper_end=(t_i == 3),
            subdiv=1,
        )
        if t_i == 3:
            _build_tapered_fin(
                "CaudalUpperBlade",
                [((0.0, 0.0, 0.0), 0.9), ((-0.38, 0.0, 0.56), 0.9), ((-0.74, 0.0, 1.06), 0.38)],
                chord=0.52,
                thickness=0.05,
                mat=mats["acc"],
                parent=tb,
                local_pos=(-0.36, 0.0, 0.02),
            )
            _build_tapered_fin(
                "CaudalLowerBlade",
                [((0.0, 0.0, -0.04), 0.75), ((-0.26, 0.0, -0.36), 0.7), ((-0.48, 0.0, -0.62), 0.3)],
                chord=0.40,
                thickness=0.042,
                mat=mats["sec"],
                parent=tb,
                local_pos=(-0.36, 0.0, -0.02),
            )
        tail_parent = tb
    return root


def build_boss_dimetrodon():
    """Era 6 Boss: Apex Permian Sail-Backed Predator Dimetrodon (rig: postosuchus, Z=1.48)."""
    mats = _minion_mats(
        "postosuchus",
        body_col=(0.48, 0.20, 0.14, 1.0),
        sec_col=(0.24, 0.12, 0.10, 1.0),
        acc_col=(0.94, 0.56, 0.14, 1.0),
        eye_col=(0.98, 0.76, 0.14, 1.0),
        roughness=0.46,
        metallic=0.05,
    )
    root, hips = _create_fighter_skeleton(1.48)
    torso = create_bone_node("Bone_Torso", (0.28, 0.0, 0.0), parent=hips)

    _tube(
        "Dime_Torso",
        [
            ((-0.55, 0.0, -0.02), 0.38, 0.42),
            ((0.0, 0.0, 0.04), 0.48, 0.52),
            ((0.55, 0.0, 0.08), 0.46, 0.48),
        ],
        segs_u=16,
        segs_v=14,
        mat=mats["body"],
        parent=torso,
        dorsal_keel=0.10,
        taper_start=False,
        taper_end=False,
        subdiv=1,
    )

    # Iconic towering Permian vascular dorsal sail (Special_Sail)
    sail = create_bone_node("Special_Sail", (0.0, 0.0, 0.42), parent=torso)
    _build_tapered_fin(
        "Dime_SailMembrane",
        [((0.62, 0.0, 0.0), 1.0), ((0.08, 0.0, 1.48), 0.96), ((-0.65, 0.0, 0.25), 0.72)],
        chord=1.48,
        thickness=0.045,
        mat=mats["acc"],
        parent=sail,
    )
    # 11 protruding bone neural spines fanning through the sail membrane
    for sp_idx in range(11):
        t = (sp_idx / 10.0) * 2.0 - 1.0  # -1..+1 front-to-back
        spine_h = 1.62 * math.sqrt(max(0.18, 1.0 - t * t * 0.78))
        sx = 0.08 - t * 0.74
        build_curved_claw_or_horn(
            f"NeuralSpine_{sp_idx}",
            length=spine_h,
            base_r=0.042,
            curve_bend=0.06,
            direction=(-t * 0.36, 0.0, 1.0),
            mat=mats["sec"],
            parent=sail,
            local_pos=(sx, 0.0, -0.08),
            segs_u=8,
            segs_v=10,
        )

    # Deep high-crested synapsid skull + differentiated huge saber canines
    neck = create_bone_node("Bone_Neck", (0.52, 0.0, 0.14), parent=torso)
    _tube("Dime_Neck", [((0.0, 0.0, 0.0), 0.32, 0.34), ((0.32, 0.0, 0.10), 0.28, 0.30)], segs_u=12, segs_v=8, mat=mats["body"], parent=neck, taper_start=False)
    head = create_bone_node("Bone_Head", (0.34, 0.0, 0.14), parent=neck)
    _tube(
        "Dime_Skull",
        [((-0.06, 0.0, 0.04), 0.32, 0.36), ((0.38, 0.0, 0.06), 0.26, 0.32), ((0.76, 0.0, 0.0), 0.19, 0.22)],
        segs_u=14,
        segs_v=14,
        mat=mats["body"],
        parent=head,
        dorsal_keel=0.08,
        subdiv=1,
    )
    _add_eyes(head, 0.24, 0.25, 0.18, 0.078, mats)
    jaw = create_bone_node("Bone_Jaw", (0.04, 0.0, -0.10), parent=head)
    _tube("Dime_Jaw", [((0.0, 0.0, -0.04), 0.24, 0.14), ((0.68, 0.0, -0.06), 0.16, 0.10)], segs_u=12, segs_v=10, mat=mats["sec"], parent=jaw, subdiv=1)

    for sy in (1.0, -1.0):
        build_curved_claw_or_horn(
            f"Dime_Saber_{'L' if sy > 0 else 'R'}",
            length=0.28,
            base_r=0.042,
            curve_bend=0.05,
            direction=(-0.12, 0.0, -1.0),
            mat=mats["tooth"],
            parent=head,
            local_pos=(0.64, sy * 0.14, -0.08),
        )
    _add_tooth_row(head, 0.46, -0.11, 4, 0.16, -0.08, 0.12, 0.026, -1.0, mats["tooth"])
    _add_tooth_row(jaw, 0.54, -0.10, 4, 0.13, 0.02, 0.10, 0.022, 1.0, mats["tooth"])

    # 4 grounded muscular legs (hips at Z=1.48 -> foot_z = -1.44)
    legs_spec = [
        ("Bone_Leg0", (0.58, 0.46, -0.14), (0.14, 0.22, -0.68), (0.26, 0.10, -1.30)),
        ("Bone_Leg1", (0.58, -0.46, -0.14), (0.14, -0.22, -0.68), (0.26, -0.10, -1.30)),
        ("Bone_Leg2", (-0.34, 0.44, -0.14), (-0.16, 0.22, -0.66), (0.04, 0.10, -1.30)),
        ("Bone_Leg3", (-0.34, -0.44, -0.14), (-0.16, -0.22, -0.66), (0.04, -0.10, -1.30)),
    ]
    for l_name, hip, knee, foot in legs_spec:
        _build_segmented_limb(l_name, hip, knee, foot, 0.22, 0.16, 0.13, mats["sec"], mats["tooth"], hips, claws=4, claw_len=0.16)

    tail_parent = hips
    tail_radii = [(0.34, 0.24), (0.24, 0.16), (0.16, 0.09), (0.09, 0.035)]
    for t_i, (r0, r1) in enumerate(tail_radii):
        t_pos = (-0.34, 0.0, -0.02) if t_i == 0 else (-0.62, 0.0, -0.06)
        tb = create_bone_node(f"Bone_Tail{t_i}", t_pos, parent=tail_parent)
        _tube(f"DimeTailSeg_{t_i}", [((0.0, 0.0, 0.0), r0, r0), ((-0.62, 0.0, -0.06), r1, r1)], segs_u=12, segs_v=8, mat=mats["sec"], parent=tb, taper_start=False, taper_end=(t_i == 3), subdiv=1)
        tail_parent = tb
    return root


def build_boss_pyroclast():
    """Era 9 Boss: Volcanic Obsidian & Magma Super-Tyrannosaur (rig: trex, Z=2.10)."""
    mats = _minion_mats(
        "trex_scute",
        body_col=(0.18, 0.14, 0.16, 1.0),
        sec_col=(0.10, 0.08, 0.10, 1.0),
        acc_col=(1.0, 0.34, 0.04, 1.0),
        eye_col=(1.0, 0.62, 0.08, 1.0),
        roughness=0.52,
        metallic=0.18,
        acc_emissive=(1.0, 0.28, 0.02),
        acc_emissive_strength=1.6,
    )
    root, hips = _create_fighter_skeleton(2.10)
    torso = create_bone_node("Bone_Torso", (0.24, 0.0, 0.08), parent=hips)

    # Massive craggy volcanic theropod barrel torso
    _tube(
        "Pyro_Torso",
        [
            ((-0.44, 0.0, -0.04), 0.44, 0.52),
            ((0.06, 0.0, 0.06), 0.58, 0.68),
            ((0.56, 0.0, 0.22), 0.52, 0.60),
        ],
        segs_u=18,
        segs_v=14,
        mat=mats["body"],
        parent=torso,
        dorsal_keel=0.16,
        taper_start=False,
        taper_end=False,
        subdiv=1,
    )
    # Jagged glowing magma dorsal spines & shoulder crystal horns
    for i, sp_x in enumerate((0.46, 0.20, -0.06, -0.32)):
        build_curved_claw_or_horn(
            f"PyroSpine_{i}",
            length=0.58 - i * 0.06,
            base_r=0.095,
            curve_bend=0.08,
            direction=(-0.55, 0.0, 0.84),
            mat=mats["acc"],
            parent=torso,
            local_pos=(sp_x, 0.0, 0.56 - i * 0.06),
        )
    for sy in (1.0, -1.0):
        build_curved_claw_or_horn(
            f"ShoulderMagmaSpike_{'L' if sy > 0 else 'R'}",
            length=0.62,
            base_r=0.11,
            curve_bend=0.10,
            direction=(-0.35, sy * 0.58, 0.72),
            mat=mats["acc"],
            parent=torso,
            local_pos=(0.38, sy * 0.46, 0.34),
        )

    # Muscular bull-neck & obsidian-horned Tyrannosaur skull
    neck = create_bone_node("Bone_Neck", (0.52, 0.0, 0.28), parent=torso)
    _tube("Pyro_Neck", [((0.0, 0.0, 0.0), 0.38, 0.42), ((0.38, 0.0, 0.36), 0.34, 0.38)], segs_u=14, segs_v=10, mat=mats["body"], parent=neck, dorsal_keel=0.10, taper_start=False)
    head = create_bone_node("Bone_Head", (0.40, 0.0, 0.38), parent=neck)
    _tube(
        "Pyro_Cranium",
        [((-0.08, 0.0, 0.04), 0.40, 0.44), ((0.42, 0.0, 0.04), 0.34, 0.38), ((0.88, 0.0, -0.02), 0.22, 0.26)],
        segs_u=16,
        segs_v=14,
        mat=mats["body"],
        parent=head,
        dorsal_keel=0.10,
        belly_flat=0.65,
        subdiv=1,
    )
    for sy in (1.0, -1.0):
        build_curved_claw_or_horn(
            f"CrownObsidianHorn_{'L' if sy > 0 else 'R'}",
            length=0.58,
            base_r=0.082,
            curve_bend=0.12,
            direction=(-0.45, sy * 0.35, 0.82),
            mat=mats["acc"],
            parent=head,
            local_pos=(0.06, sy * 0.26, 0.30),
        )
    _add_eyes(head, 0.22, 0.30, 0.16, 0.082, mats)
    jaw = create_bone_node("Bone_Jaw", (0.04, 0.0, -0.14), parent=head)
    _tube("Pyro_Jaw", [((0.0, 0.0, -0.04), 0.30, 0.18), ((0.80, 0.0, -0.08), 0.18, 0.12)], segs_u=12, segs_v=10, mat=mats["sec"], parent=jaw, subdiv=1)
    _add_tooth_row(head, 0.78, -0.12, 5, 0.18, -0.10, 0.16, 0.032, -1.0, mats["tooth"])
    _add_tooth_row(jaw, 0.72, -0.12, 4, 0.15, 0.02, 0.14, 0.028, 1.0, mats["tooth"])

    # Forelimbs (Bone_Arm0 & Bone_Arm1)
    for a_idx, sy in enumerate((1.0, -1.0)):
        _build_segmented_limb(
            f"Bone_Arm{a_idx}",
            hip_pos=(0.48, sy * 0.42, -0.10),
            knee_offset=(0.12, sy * 0.06, -0.26),
            foot_offset=(0.34, 0.0, -0.22),
            r_top=0.10,
            r_mid=0.075,
            r_bot=0.06,
            mat_limb=mats["sec"],
            mat_claw=mats["acc"],
            parent=torso,
            claws=2,
            claw_len=0.16,
        )

    # Towering digitigrade pillar legs planted firmly at Z = 0 (hips at Z = 2.10)
    for l_idx, sy in enumerate((1.0, -1.0)):
        _build_digitigrade_leg(
            f"Bone_Leg{l_idx}",
            hip_pos=(-0.10, sy * 0.42, -0.08),
            side=sy,
            height=2.00,
            r_thigh=0.34,
            r_ankle=0.14,
            mat_limb=mats["sec"],
            mat_claw=mats["acc"],
            parent=hips,
        )

    # Spiked heavy volcanic counterbalance tail (Bone_Tail0..Tail3)
    tail_parent = hips
    tail_radii = [(0.38, 0.28), (0.28, 0.18), (0.18, 0.10), (0.10, 0.04)]
    for t_i, (r0, r1) in enumerate(tail_radii):
        t_pos = (-0.34, 0.0, 0.04) if t_i == 0 else (-0.76, 0.0, 0.04)
        tb = create_bone_node(f"Bone_Tail{t_i}", t_pos, parent=tail_parent)
        _tube(f"PyroTailSeg_{t_i}", [((0.0, 0.0, 0.0), r0, r0), ((-0.76, 0.0, 0.04), r1, r1)], segs_u=12, segs_v=10, mat=mats["body"], parent=tb, dorsal_keel=0.08, taper_start=False, taper_end=(t_i == 3), subdiv=1)
        build_curved_claw_or_horn(
            f"TailSpike_{t_i}",
            length=0.32 - t_i * 0.05,
            base_r=0.055,
            curve_bend=0.04,
            direction=(-0.55, 0.0, 0.84),
            mat=mats["acc"],
            parent=tb,
            local_pos=(-0.38, 0.0, r0 * 0.85),
        )
        tail_parent = tb
    return root


def build_boss_wendigo():
    """Era 12 Boss: Mythic Frozen Tundra Apex Cryptid Wendigo (rig: giantsloth, Z=1.85)."""
    mats = _minion_mats(
        "giantsloth",
        body_col=(0.62, 0.72, 0.80, 1.0),
        sec_col=(0.24, 0.30, 0.38, 1.0),
        acc_col=(0.32, 0.92, 1.0, 1.0),
        eye_col=(0.18, 0.98, 1.0, 1.0),
        roughness=0.64,
        metallic=0.08,
        acc_emissive=(0.20, 0.82, 1.0),
        acc_emissive_strength=0.95,
    )
    root, hips = _create_fighter_skeleton(1.85)
    torso = create_bone_node("Bone_Torso", (0.16, 0.0, 0.24), parent=hips)

    # Gaunt, towering hunchbacked muscular cryptid torso
    _tube(
        "Wendigo_Torso",
        [
            ((-0.22, 0.0, -0.32), 0.28, 0.32),
            ((-0.08, 0.0, 0.0), 0.38, 0.44),
            ((0.12, 0.0, 0.42), 0.48, 0.52),
            ((0.24, 0.0, 0.72), 0.42, 0.46),
        ],
        segs_u=16,
        segs_v=16,
        mat=mats["body"],
        parent=torso,
        dorsal_keel=0.14,
        taper_start=True,
        taper_end=True,
        subdiv=1,
    )
    # Jagged glacial ice spikes jutting along gaunt spine & shoulders
    for i in range(4):
        build_curved_claw_or_horn(
            f"IceBackShard_{i}",
            length=0.52 - i * 0.06,
            base_r=0.065,
            curve_bend=0.04,
            direction=(-0.72, 0.0, 0.68),
            mat=mats["acc"],
            parent=torso,
            local_pos=(0.08 - i * 0.08, 0.0, 0.60 - i * 0.20),
        )

    # Skull-visage head + sweeping branched glacial ice antlers
    neck = create_bone_node("Bone_Neck", (0.24, 0.0, 0.68), parent=torso)
    _tube("Wendigo_Neck", [((0.0, 0.0, 0.0), 0.24, 0.26), ((0.20, 0.0, 0.28), 0.20, 0.22)], segs_u=12, segs_v=8, mat=mats["sec"], parent=neck, taper_start=False)
    head = create_bone_node("Bone_Head", (0.22, 0.0, 0.30), parent=neck)
    # Gaunt horned beast skull cranium
    _tube(
        "Wendigo_Skull",
        [((-0.06, 0.0, 0.04), 0.26, 0.30), ((0.28, 0.0, 0.0), 0.22, 0.24), ((0.62, 0.0, -0.06), 0.14, 0.16)],
        segs_u=14,
        segs_v=12,
        mat=mats["body"],
        parent=head,
        dorsal_keel=0.08,
        subdiv=1,
    )
    # Iconic branched ice antlers sweeping up and out
    for sy in (1.0, -1.0):
        build_curved_claw_or_horn(
            f"AntlerMain_{'L' if sy > 0 else 'R'}",
            length=1.18,
            base_r=0.072,
            curve_bend=0.22,
            direction=(-0.38, sy * 0.56, 0.78),
            mat=mats["acc"],
            parent=head,
            local_pos=(-0.02, sy * 0.18, 0.24),
            segs_u=10,
            segs_v=12,
        )
        build_curved_claw_or_horn(
            f"AntlerTineA_{'L' if sy > 0 else 'R'}",
            length=0.52,
            base_r=0.042,
            curve_bend=0.10,
            direction=(0.45, sy * 0.35, 0.82),
            mat=mats["acc"],
            parent=head,
            local_pos=(-0.12, sy * 0.38, 0.58),
        )
        build_curved_claw_or_horn(
            f"AntlerTineB_{'L' if sy > 0 else 'R'}",
            length=0.46,
            base_r=0.038,
            curve_bend=0.08,
            direction=(0.15, sy * 0.65, 0.74),
            mat=mats["acc"],
            parent=head,
            local_pos=(-0.22, sy * 0.52, 0.82),
        )
    _add_eyes(head, 0.20, 0.21, 0.08, 0.072, mats)
    jaw = create_bone_node("Bone_Jaw", (0.04, 0.0, -0.10), parent=head)
    _tube("Wendigo_Jaw", [((0.0, 0.0, -0.02), 0.18, 0.10), ((0.54, 0.0, -0.06), 0.11, 0.07)], segs_u=10, segs_v=10, mat=mats["sec"], parent=jaw, subdiv=1)
    _add_tooth_row(head, 0.54, -0.09, 4, 0.12, -0.06, 0.13, 0.024, -1.0, mats["tooth"])
    _add_tooth_row(jaw, 0.48, -0.08, 4, 0.10, 0.02, 0.11, 0.020, 1.0, mats["tooth"])

    # Long terrifying slashing forelimbs (Bone_Arm0 & Bone_Arm1) with 3 ice-scythe claws
    for a_idx, sy in enumerate((1.0, -1.0)):
        _build_segmented_limb(
            f"Bone_Arm{a_idx}",
            hip_pos=(0.24, sy * 0.48, 0.56),
            knee_offset=(0.36, sy * 0.14, -0.58),
            foot_offset=(0.76, sy * 0.04, -1.16),
            r_top=0.16,
            r_mid=0.11,
            r_bot=0.095,
            mat_limb=mats["sec"],
            mat_claw=mats["acc"],
            parent=torso,
            claws=3,
            claw_len=0.44,
        )

    # Planted muscular predator hind legs (hips at Z=1.85 -> height=1.80)
    for l_idx, sy in enumerate((1.0, -1.0)):
        _build_digitigrade_leg(
            f"Bone_Leg{l_idx}",
            hip_pos=(-0.06, sy * 0.36, -0.04),
            side=sy,
            height=1.78,
            r_thigh=0.25,
            r_ankle=0.11,
            mat_limb=mats["sec"],
            mat_claw=mats["acc"],
            parent=hips,
        )

    tail_parent = hips
    tail_radii = [(0.24, 0.16), (0.16, 0.09), (0.09, 0.03)]
    for t_i, (r0, r1) in enumerate(tail_radii):
        t_pos = (-0.28, 0.0, -0.08) if t_i == 0 else (-0.52, 0.0, -0.04)
        tb = create_bone_node(f"Bone_Tail{t_i}", t_pos, parent=tail_parent)
        _tube(f"WendigoTailSeg_{t_i}", [((0.0, 0.0, 0.0), r0, r0), ((-0.52, 0.0, -0.04), r1, r1)], segs_u=10, segs_v=8, mat=mats["sec"], parent=tb, taper_start=False, taper_end=(t_i == 2), subdiv=1)
        tail_parent = tb
    return root


# ==============================================================================
# 5 CAMPAIGN PICKUP & HAZARD PROP MODELS
# ==============================================================================


def build_pickup_meat():
    """Campaign Pickup: Bone-in prehistoric haunch roast with golden glow trim."""
    root = create_bone_node("Prop_Root", (0.0, 0.0, 0.0))
    mat_meat = make_pbr_material("Mat_BodyPrimary", base_color=(0.76, 0.16, 0.14, 1.0), roughness=0.42, metallic=0.05, bump_path=_bump_tex("trex"), bump_strength=0.15)
    mat_fat = make_pbr_material("Mat_Accent", base_color=(0.94, 0.82, 0.68, 1.0), roughness=0.35, metallic=0.04, emissive=(0.92, 0.52, 0.14), emissive_strength=0.18)
    mat_bone = make_pbr_material("Mat_Secondary", base_color=(0.94, 0.90, 0.80, 1.0), roughness=0.32, metallic=0.02)

    # Central marrow bone running along X with bulbous joint knuckles
    _tube(
        "MarrowBone",
        [((-0.55, 0.0, 0.0), 0.12, 0.12), ((-0.38, 0.0, 0.0), 0.075, 0.075), ((0.38, 0.0, 0.0), 0.075, 0.075), ((0.55, 0.0, 0.0), 0.12, 0.12)],
        segs_u=14,
        segs_v=14,
        mat=mat_bone,
        parent=root,
        subdiv=1,
    )
    for sx in (-0.56, 0.56):
        for sy in (-0.06, 0.06):
            bm = bmesh.new()
            bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=8, radius=0.105)
            attach_mesh_obj(bm, f"Knuckle_{int(sx*10)}_{int(sy*100)}", mat=mat_bone, parent=root, local_pos=(sx, sy, 0.0), subdiv=0)

    # Thick marbled primal meat haunch wrapping center of bone
    _tube(
        "PrimeMeatCut",
        [((-0.34, 0.0, 0.0), 0.19, 0.20), ((-0.12, 0.0, 0.02), 0.30, 0.28), ((0.14, 0.0, 0.02), 0.28, 0.26), ((0.34, 0.0, 0.0), 0.18, 0.18)],
        segs_u=16,
        segs_v=14,
        mat=mat_meat,
        parent=root,
        subdiv=1,
    )
    # Marbled fat trim bands seated flush on PrimeMeatCut ends
    for sx in (-0.20, 0.20):
        _tube(
            f"FatTrim_{int(sx*100)}",
            [((sx - 0.02, 0.0, 0.01), 0.27, 0.25), ((sx + 0.02, 0.0, 0.01), 0.27, 0.25)],
            segs_u=16,
            segs_v=4,
            mat=mat_fat,
            parent=root,
            cap_ends=False,
            taper_start=False,
            taper_end=False,
        )
    return root


def build_pickup_amber():
    """Campaign Pickup: Faceted glowing translucent Dominican amber gem with trapped insect."""
    root = create_bone_node("Prop_Root", (0.0, 0.0, 0.0))
    mat_amber = make_pbr_material(
        "Mat_BodyPrimary",
        base_color=(0.98, 0.62, 0.08, 1.0),
        roughness=0.14,
        metallic=0.12,
        emissive=(0.96, 0.48, 0.05),
        emissive_strength=0.45,
        alpha=0.80,
    )
    mat_fossil = make_pbr_material("Mat_Secondary", base_color=(0.12, 0.06, 0.03, 1.0), roughness=0.45, metallic=0.15)
    mat_rim = make_pbr_material("Mat_Accent", base_color=(1.0, 0.85, 0.28, 1.0), roughness=0.18, metallic=0.45, emissive=(1.0, 0.65, 0.12), emissive_strength=0.65)

    # Faceted teardrop amber crystal gem
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.46)
    for v in bm.verts:
        v.co.x *= 0.82
        v.co.y *= 0.72
        v.co.z *= 1.32
        if v.co.z > 0.2:
            v.co.x *= 0.75
            v.co.y *= 0.75
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    attach_mesh_obj(bm, "AmberCrystal", mat=mat_amber, parent=root, subdiv=0)

    # Fossilized prehistoric mosquito encased right at the gem's heart
    _tube("FossilBody", [((-0.14, 0.0, -0.08), 0.035, 0.035), ((0.0, 0.0, 0.02), 0.055, 0.05), ((0.14, 0.0, 0.08), 0.04, 0.04)], segs_u=8, segs_v=6, mat=mat_fossil, parent=root)
    for sy in (1.0, -1.0):
        _build_tapered_fin(
            f"FossilWing_{'L' if sy > 0 else 'R'}",
            [((0.02, sy * 0.02, 0.06), 0.6), ((-0.08, sy * 0.16, 0.14), 0.8), ((-0.16, sy * 0.24, 0.18), 0.3)],
            chord=0.14,
            thickness=0.015,
            mat=mat_rim,
            parent=root,
        )
    return root


def build_hazard_meteor():
    """Campaign Hazard: Craggy volcanic Chicxulub meteor chunk with glowing magma veins."""
    root = create_bone_node("Prop_Root", (0.0, 0.0, 0.0))
    mat_crust = make_pbr_material("Mat_BodyPrimary", base_color=(0.20, 0.15, 0.14, 1.0), roughness=0.78, metallic=0.14, bump_path=_bump_tex("dragon"), bump_strength=0.35)
    mat_magma = make_pbr_material("Mat_Accent", base_color=(1.0, 0.32, 0.04, 1.0), roughness=0.25, metallic=0.05, emissive=(1.0, 0.30, 0.02), emissive_strength=2.2)

    rng = random.Random(42)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.72)
    for v in bm.verts:
        n = math.sin(v.co.x * 5.2) * math.cos(v.co.y * 4.7) * math.sin(v.co.z * 6.1)
        scale = 1.0 + 0.24 * n + (rng.random() - 0.5) * 0.14
        v.co *= scale
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    attach_mesh_obj(bm, "MeteorCrust", mat=mat_crust, parent=root, subdiv=0)

    # Inner glowing molten core fissures breaching through dark basalt cracks
    bm_core = bmesh.new()
    bmesh.ops.create_icosphere(bm_core, subdivisions=2, radius=0.73)
    for v in bm_core.verts:
        n2 = math.cos(v.co.x * 6.5 + 1.1) * math.sin(v.co.y * 5.8)
        v.co *= 0.90 + 0.25 * max(0.0, n2)
    bmesh.ops.recalc_face_normals(bm_core, faces=bm_core.faces)
    attach_mesh_obj(bm_core, "MeteorMagmaCore", mat=mat_magma, parent=root, subdiv=0)
    return root


def build_hazard_boulder():
    """Campaign Hazard: Jagged stratified limestone cliff boulder."""
    root = create_bone_node("Prop_Root", (0.0, 0.0, 0.0))
    mat_rock = make_pbr_material("Mat_BodyPrimary", base_color=(0.44, 0.40, 0.36, 1.0), roughness=0.84, metallic=0.04, bump_path=_bump_tex("ankylo"), bump_strength=0.30)
    mat_strata = make_pbr_material("Mat_Secondary", base_color=(0.30, 0.26, 0.22, 1.0), roughness=0.88, metallic=0.02)

    rng = random.Random(108)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.74)
    for v in bm.verts:
        strata = math.sin(v.co.z * 9.0) * 0.08
        ridge = math.cos(v.co.x * 4.0) * math.sin(v.co.y * 4.5) * 0.20
        v.co.x *= 1.05 + ridge + strata
        v.co.y *= 0.96 - ridge * 0.5 + (rng.random() - 0.5) * 0.12
        v.co.z *= 0.88 + abs(ridge)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    attach_mesh_obj(bm, "CliffBoulder", mat=mat_rock, parent=root, subdiv=0)

    # Exposed jagged rock shard collar
    for idx, ang in enumerate((0.4, 2.5, 4.6)):
        build_curved_claw_or_horn(
            f"RockOutcrop_{idx}",
            length=0.52,
            base_r=0.22,
            curve_bend=0.02,
            direction=(math.cos(ang) * 0.8, math.sin(ang) * 0.8, 0.45),
            mat=mat_strata,
            parent=root,
            local_pos=(math.cos(ang) * 0.32, math.sin(ang) * 0.32, -0.08),
            segs_u=6,
            segs_v=6,
        )
    return root


def build_hazard_icicle():
    """Campaign Hazard: Razor-sharp falling glacial stalactite spear cluster (points -Z)."""
    root = create_bone_node("Prop_Root", (0.0, 0.0, 0.0))
    mat_ice = make_pbr_material(
        "Mat_BodyPrimary",
        base_color=(0.70, 0.90, 1.0, 1.0),
        roughness=0.12,
        metallic=0.14,
        emissive=(0.24, 0.72, 1.0),
        emissive_strength=0.45,
        alpha=0.86,
    )
    mat_core = make_pbr_material("Mat_Accent", base_color=(0.88, 0.97, 1.0, 1.0), roughness=0.08, metallic=0.20, emissive=(0.50, 0.90, 1.0), emissive_strength=0.55)

    # Central massive fluted ice spear pointing downward (-Z)
    build_curved_claw_or_horn(
        "MainIcicleSpire",
        length=1.85,
        base_r=0.28,
        curve_bend=0.02,
        direction=(0.0, 0.0, -1.0),
        mat=mat_ice,
        parent=root,
        local_pos=(0.0, 0.0, 0.85),
        segs_u=8,
        segs_v=10,
    )
    # 3 jagged secondary crystal shards flanking base
    for s_idx, ang in enumerate((0.2, 2.3, 4.4)):
        build_curved_claw_or_horn(
            f"IceShard_{s_idx}",
            length=1.05,
            base_r=0.14,
            curve_bend=0.03,
            direction=(math.cos(ang) * 0.14, math.sin(ang) * 0.14, -1.0),
            mat=mat_core,
            parent=root,
            local_pos=(math.cos(ang) * 0.16, math.sin(ang) * 0.16, 0.82),
            segs_u=6,
            segs_v=8,
        )
    return root


CAMPAIGN_BUILDERS = {
    "boss_cameroceras": build_boss_cameroceras,
    "boss_jaekelopterus": build_boss_jaekelopterus,
    "boss_dunkleosteus": build_boss_dunkleosteus,
    "boss_dimetrodon": build_boss_dimetrodon,
    "boss_pyroclast": build_boss_pyroclast,
    "boss_wendigo": build_boss_wendigo,
    "pickup_meat": build_pickup_meat,
    "pickup_amber": build_pickup_amber,
    "hazard_meteor": build_hazard_meteor,
    "hazard_boulder": build_hazard_boulder,
    "hazard_icicle": build_hazard_icicle,
}


def build_campaign_glb(model_id):
    """Build and export one campaign boss or prop GLB."""
    if model_id not in CAMPAIGN_BUILDERS:
        raise ValueError(f"Unknown campaign model_id: {model_id}")
    os.makedirs(CAMPAIGN_OUT_DIR, exist_ok=True)
    clear_scene()
    CAMPAIGN_BUILDERS[model_id]()
    out_path = os.path.join(CAMPAIGN_OUT_DIR, f"{model_id}.glb")
    export_fighter_glb(out_path)
    return out_path


def build_all_campaign_models(ids=None):
    """Build and export requested campaign GLBs (defaults to all 6 bosses + 5 props)."""
    targets = list(ids) if ids is not None else (ALL_BOSS_IDS + ALL_PROP_IDS)
    return [build_campaign_glb(mid) for mid in targets]


if __name__ == "__main__":
    build_all_campaign_models()
