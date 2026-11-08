#!/usr/bin/env python3
"""
build_cambrian_creatures_blender.py
Connects to Blender MCP socket server on localhost:9876.
Procedurally generates high-fidelity 3D models for all 3 Cambrian creatures in Blender 5.2:
- Anomalocaris canadensis
- Opabinia regalis
- Olenoides serratus
Renders a 3D studio visualization and exports a GLB asset file.
"""

import socket
import json
import os
import sys

BLENDER_HOST = "127.0.0.1"
BLENDER_PORT = 9876

def send_blender_command(cmd_type, params=None):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(120.0)
    s.connect((BLENDER_HOST, BLENDER_PORT))
    payload = {"type": cmd_type}
    if params:
        payload["params"] = params
    s.sendall(json.dumps(payload).encode("utf-8"))
    
    # Read full response
    buffer = b""
    while True:
        chunk = s.recv(16384)
        if not chunk:
            break
        buffer += chunk
        try:
            resp = json.loads(buffer.decode("utf-8"))
            s.close()
            return resp
        except (json.JSONDecodeError, UnicodeDecodeError):
            continue
    s.close()
    return json.loads(buffer.decode("utf-8"))

def main():
    print(f"Connecting to Blender MCP on {BLENDER_HOST}:{BLENDER_PORT}...")
    ping = send_blender_command("ping")
    print("Ping response:", ping)
    if not ping or ping.get("status") != "success":
        print("Failed to ping Blender MCP server!")
        sys.exit(1)

    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    screenshots_dir = os.path.join(project_root, "screenshots")
    assets_models_dir = os.path.join(project_root, "assets", "models")
    os.makedirs(screenshots_dir, exist_ok=True)
    os.makedirs(assets_models_dir, exist_ok=True)

    render_path = os.path.join(screenshots_dir, "blender_cambrian_creatures.png")
    glb_export_path = os.path.join(assets_models_dir, "cambrian_creatures_blender.glb")

    blender_script = f"""
import bpy
import math

print("=== STARTING CAMBRIAN CREATURES GENERATION IN BLENDER ===")

# 1. Clean scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Ensure Materials
def get_or_create_mat(name, color, metallic=0.2, roughness=0.4, emissive=None):
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            bsdf.inputs['Base Color'].default_value = color
            bsdf.inputs['Metallic'].default_value = metallic
            bsdf.inputs['Roughness'].default_value = roughness
            if emissive and 'Emission Color' in bsdf.inputs:
                bsdf.inputs['Emission Color'].default_value = emissive
                if 'Emission Strength' in bsdf.inputs:
                    bsdf.inputs['Emission Strength'].default_value = 1.0
    return mat

mat_chitin_cyan = get_or_create_mat("ChitinCyan", (0.05, 0.45, 0.55, 1.0), metallic=0.4, roughness=0.3)
mat_carapace_dark = get_or_create_mat("CarapaceDark", (0.02, 0.12, 0.18, 1.0), metallic=0.6, roughness=0.25)
mat_amber_spine = get_or_create_mat("AmberSpine", (0.95, 0.60, 0.05, 1.0), metallic=0.2, roughness=0.25, emissive=(0.3, 0.15, 0.0, 1.0))
mat_biolum = get_or_create_mat("BiolumCyan", (0.13, 0.82, 0.93, 1.0), metallic=0.1, roughness=0.2, emissive=(0.13, 0.82, 0.93, 1.0))
mat_eye_glow = get_or_create_mat("EyeGlow", (0.65, 0.95, 0.98, 1.0), metallic=0.0, roughness=0.1, emissive=(0.65, 0.95, 0.98, 1.0))
mat_gills = get_or_create_mat("GillsFeather", (0.22, 0.74, 0.97, 0.85), metallic=0.1, roughness=0.5)
mat_trilo_carapace = get_or_create_mat("TriloCarapace", (0.15, 0.20, 0.12, 1.0), metallic=0.3, roughness=0.5)
mat_trilo_axial = get_or_create_mat("TriloAxial", (0.08, 0.09, 0.08, 1.0), metallic=0.4, roughness=0.6)
mat_opabinia_body = get_or_create_mat("OpabiniaBody", (0.18, 0.58, 0.45, 1.0), metallic=0.2, roughness=0.35)

def assign_mat(obj, mat):
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

def move_to_col(obj, target_col):
    if obj.name not in target_col.objects:
        target_col.objects.link(obj)
    for c in list(obj.users_collection):
        if c != target_col:
            c.objects.unlink(obj)

# ==============================================================================
# 2. CREATURE 1: ANOMALOCARIS CANADENSIS (Burgess Shale Apex Predator)
# ==============================================================================
col_anom = bpy.data.collections.new("Anomalocaris_Canadensis")
bpy.context.scene.collection.children.link(col_anom)

# Cephalon (Head shield)
bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=0.85, depth=1.75, location=(0, 0, 1.5))
head_shield = bpy.context.active_object
head_shield.name = "Anom_HeadShield"
head_shield.rotation_euler = (0, math.radians(-90), 0)
head_shield.scale = (1.2, 0.6, 1.0)
assign_mat(head_shield, mat_carapace_dark)
move_to_col(head_shield, col_anom)

# Lateral P-Elements
for z in [-0.55, 0.55]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.1, z, 1.35))
    p_elem = bpy.context.active_object
    p_elem.name = f"Anom_PElem_{{'L' if z>0 else 'R'}}"
    p_elem.scale = (0.75, 0.15, 0.35)
    assign_mat(p_elem, mat_chitin_cyan)
    move_to_col(p_elem, col_anom)

# Stalked Compound Eyes
for z in [-0.65, 0.65]:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.09, depth=0.55, location=(0.2, z, 1.8))
    stalk = bpy.context.active_object
    stalk.rotation_euler = (math.radians(-35 if z>0 else 35), 0, math.radians(-20))
    assign_mat(stalk, mat_chitin_cyan)
    move_to_col(stalk, col_anom)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.26, location=(0.35, z * 1.25, 1.95))
    eye = bpy.context.active_object
    eye.scale = (1.2, 1.0, 1.0)
    assign_mat(eye, mat_eye_glow)
    move_to_col(eye, col_anom)

# Frontal Raptorial Appendages (Claws with 5 articulated segments & auxiliary spinules)
for z in [-0.28, 0.28]:
    for seg_i in range(5):
        seg_x = 0.85 + seg_i * 0.34
        seg_z = 1.15 - seg_i * 0.18
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(seg_x, z, seg_z))
        seg = bpy.context.active_object
        seg.rotation_euler = (0, math.radians(25), 0)
        seg.scale = (0.35, 0.18, 0.16)
        assign_mat(seg, mat_chitin_cyan)
        move_to_col(seg, col_anom)

        # Main Endite Spine
        spine_len = 0.35 + seg_i * 0.08
        bpy.ops.mesh.primitive_cone_add(radius1=0.06, depth=spine_len, location=(seg_x, z, seg_z - 0.25))
        spine = bpy.context.active_object
        spine.rotation_euler = (math.radians(180), 0, 0)
        assign_mat(spine, mat_amber_spine)
        move_to_col(spine, col_anom)

        # Auxiliary Spinules
        for side in [-0.04, 0.04]:
            bpy.ops.mesh.primitive_cone_add(radius1=0.025, depth=0.14, location=(seg_x + 0.03, z, seg_z - 0.22 + side))
            aux = bpy.context.active_object
            aux.rotation_euler = (math.radians(150), 0, math.radians(20))
            assign_mat(aux, mat_amber_spine)
            move_to_col(aux, col_anom)

# Triradial Peytoia Oral Cone (3 Dominant Plates + 24 Teeth)
bpy.ops.mesh.primitive_torus_add(major_radius=0.38, minor_radius=0.12, location=(0.15, 0, 0.85))
peytoia_ring = bpy.context.active_object
assign_mat(peytoia_ring, mat_carapace_dark)
move_to_col(peytoia_ring, col_anom)

for p in range(3):
    rad = (p * math.pi * 2) / 3
    px = 0.15 + math.cos(rad) * 0.32
    py = math.sin(rad) * 0.32
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, py, 0.88))
    plate = bpy.context.active_object
    plate.scale = (0.16, 0.06, 0.18)
    plate.rotation_euler = (0, 0, rad)
    assign_mat(plate, mat_chitin_cyan)
    move_to_col(plate, col_anom)

for t in range(24):
    rad = (t * math.pi * 2) / 24
    tx = 0.15 + math.cos(rad) * 0.26
    ty = math.sin(rad) * 0.26
    bpy.ops.mesh.primitive_cone_add(radius1=0.045, depth=0.15, location=(tx, ty, 0.88))
    tooth = bpy.context.active_object
    tooth.rotation_euler = (math.radians(180), 0, rad)
    assign_mat(tooth, mat_amber_spine)
    move_to_col(tooth, col_anom)

# 8 Metameric Trunk Segments + Dorsal Keel
for i in range(8):
    factor = 1.0 - (i / 8) * 0.55
    sx = -0.6 - i * 0.55
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx, 0, 1.45))
    trunk_seg = bpy.context.active_object
    trunk_seg.scale = (0.58, 1.15 * factor, 0.48 * factor)
    assign_mat(trunk_seg, mat_chitin_cyan if i % 2 == 0 else mat_carapace_dark)
    move_to_col(trunk_seg, col_anom)

    # Dorsal Keel Crest
    bpy.ops.mesh.primitive_cone_add(radius1=0.08 * factor, depth=0.35 * factor, location=(sx, 0, 1.7 + 0.15 * factor))
    crest = bpy.context.active_object
    assign_mat(crest, mat_biolum)
    move_to_col(crest, col_anom)

# 11 Pairs of Lateral Swimming Flaps + Dorsal Setal Gill Blades
for i in range(11):
    factor = (0.62 + i * 0.20) if i < 4 else (1.35 - (i - 4) * 0.14)
    fx = 0.35 - i * 0.48
    for side in [-1, 1]:
        fy = side * (0.65 * factor)
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(fx, fy, 1.35))
        flap = bpy.context.active_object
        flap.scale = (0.48, 0.72 * factor, 0.05)
        flap.rotation_euler = (math.radians(side * 15), 0, 0)
        assign_mat(flap, mat_biolum)
        move_to_col(flap, col_anom)

        # Setal Gill Blade on Dorsal Flap
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(fx, fy, 1.40))
        gill = bpy.context.active_object
        gill.scale = (0.42, 0.58 * factor, 0.03)
        assign_mat(gill, mat_gills)
        move_to_col(gill, col_anom)

# Caudal Furca (Tail Fan tilted at 35 degrees)
for f in range(3):
    angle = (f - 1) * 0.42
    blade_y = (f - 1) * 0.55
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-5.2, blade_y, 1.75 + abs(f - 1) * 0.15))
    blade = bpy.context.active_object
    blade.scale = (1.25, 0.36, 0.06)
    blade.rotation_euler = (0, math.radians(35), angle)
    assign_mat(blade, mat_biolum)
    move_to_col(blade, col_anom)

# ==============================================================================
# 3. CREATURE 2: OPABINIA REGALIS (5 Stalked Eyes, Proboscis, 15 Flap Pairs)
# ==============================================================================
col_opab = bpy.data.collections.new("Opabinia_Regalis")
bpy.context.scene.collection.children.link(col_opab)

opab_offset_y = 4.2

# Fusiform Body
bpy.ops.mesh.primitive_cylinder_add(radius=0.34, depth=2.2, location=(0, opab_offset_y, 1.2))
opab_body = bpy.context.active_object
opab_body.rotation_euler = (0, math.radians(90), 0)
opab_body.scale = (0.8, 1.0, 1.2)
assign_mat(opab_body, mat_opabinia_body)
move_to_col(opab_body, col_opab)

# 5 Stalked Eyes (1 Median, 2 Anterolateral, 2 Posterolateral)
eyes_config = [
    ("Median", 1.15, 0, 1.55, 0.22, 0.09),
    ("Ant_L",  1.08, 0.26, 1.50, 0.28, 0.11),
    ("Ant_R",  1.08, -0.26, 1.50, 0.28, 0.11),
    ("Post_L", 0.90, 0.35, 1.54, 0.35, 0.12),
    ("Post_R", 0.90, -0.35, 1.54, 0.35, 0.12)
]
for ename, ex, ey, ez, stalk_l, bulb_r in eyes_config:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=stalk_l, location=(ex, opab_offset_y + ey, ez))
    ostalk = bpy.context.active_object
    ostalk.rotation_euler = (math.radians(-25 if ey>0 else (25 if ey<0 else 0)), 0, 0)
    assign_mat(ostalk, mat_carapace_dark)
    move_to_col(ostalk, col_opab)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=bulb_r, location=(ex, opab_offset_y + ey * 1.15, ez + stalk_l * 0.45))
    obulb = bpy.context.active_object
    assign_mat(obulb, mat_eye_glow)
    move_to_col(obulb, col_opab)

# Frontal Proboscis (Nozzle with 5 Segments and Terminal Pincer Claws)
for s in range(5):
    px = 1.35 + s * 0.25
    pz = 1.05 - (s * 0.06 if s < 3 else -s * 0.08)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.10 - s * 0.012, depth=0.26, location=(px, opab_offset_y, pz))
    pseg = bpy.context.active_object
    pseg.rotation_euler = (0, math.radians(90 + (15 if s<3 else -25)), 0)
    assign_mat(pseg, mat_opabinia_body if s % 2 == 0 else mat_carapace_dark)
    move_to_col(pseg, col_opab)

# Terminal Claws (Pincers with Denticles)
for cside in [-1, 1]:
    bpy.ops.mesh.primitive_cone_add(radius1=0.05, depth=0.30, location=(2.6, opab_offset_y + cside * 0.08, 1.0))
    pclaw = bpy.context.active_object
    pclaw.rotation_euler = (0, math.radians(90), math.radians(cside * 40))
    assign_mat(pclaw, mat_amber_spine)
    move_to_col(pclaw, col_opab)

# 15 Lateral Swimming Flaps
for i in range(15):
    factor = (0.65 + i * 0.12) if i < 5 else (1.25 - (i - 5) * 0.08)
    ofx = 0.95 - i * 0.19
    for side in [-1, 1]:
        ofy = opab_offset_y + side * (0.35 * factor)
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(ofx, ofy, 1.12))
        oflap = bpy.context.active_object
        oflap.scale = (0.18, 0.42 * factor, 0.035)
        oflap.rotation_euler = (math.radians(side * 12), 0, 0)
        assign_mat(oflap, mat_biolum)
        move_to_col(oflap, col_opab)

# V-Shaped Caudal Fan (3 Pairs of Blades)
for f in range(3):
    angle = (f - 1) * 0.40
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.35, opab_offset_y + (f - 1) * 0.25, 1.35 + abs(f - 1) * 0.1))
    vblade = bpy.context.active_object
    vblade.scale = (0.6, 0.24, 0.04)
    vblade.rotation_euler = (0, math.radians(40), angle)
    assign_mat(vblade, mat_carapace_dark)
    move_to_col(vblade, col_opab)

# ==============================================================================
# 4. CREATURE 3: OLENOIDES SERRATUS (Burgess Shale Trilobite)
# ==============================================================================
col_trilo = bpy.data.collections.new("Olenoides_Serratus")
bpy.context.scene.collection.children.link(col_trilo)

trilo_offset_y = -4.2

# Cephalon (Head shield with glabella and glabellar furrows)
bpy.ops.mesh.primitive_cylinder_add(radius=0.92, depth=0.28, location=(0.4, trilo_offset_y, 0.45))
tceph = bpy.context.active_object
tceph.scale = (0.8, 1.1, 0.7)
assign_mat(tceph, mat_trilo_carapace)
move_to_col(tceph, col_trilo)

# Axial Glabella
bpy.ops.mesh.primitive_cylinder_add(radius=0.26, depth=0.68, location=(0.45, trilo_offset_y, 0.58))
glabella = bpy.context.active_object
glabella.rotation_euler = (0, math.radians(90), 0)
assign_mat(glabella, mat_trilo_axial)
move_to_col(glabella, col_trilo)

# Glabellar Furrows
for furrow_i in range(3):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.35 + furrow_i * 0.15, trilo_offset_y, 0.68))
    furrow = bpy.context.active_object
    furrow.scale = (0.04, 0.46, 0.04)
    assign_mat(furrow, mat_trilo_carapace)
    move_to_col(furrow, col_trilo)

# Sweeping Genal Spines extending past thorax
for gside in [-1, 1]:
    bpy.ops.mesh.primitive_cone_add(radius1=0.08, depth=1.35, location=(-0.35, trilo_offset_y + gside * 0.95, 0.42))
    gspine = bpy.context.active_object
    gspine.rotation_euler = (0, math.radians(-90), math.radians(gside * 12))
    assign_mat(gspine, mat_trilo_axial)
    move_to_col(gspine, col_trilo)

    # Crescentic Compound Eyes
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.14, location=(0.4, trilo_offset_y + gside * 0.42, 0.62))
    teye = bpy.context.active_object
    assign_mat(teye, mat_eye_glow)
    move_to_col(teye, col_trilo)

# Flexible Antennules
for aside in [-1, 1]:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=1.1, location=(1.1, trilo_offset_y + aside * 0.35, 0.45))
    ant = bpy.context.active_object
    ant.rotation_euler = (0, math.radians(65), math.radians(aside * 30))
    assign_mat(ant, mat_amber_spine)
    move_to_col(ant, col_trilo)

# 7 Thoracic Segments with Trilobed Pleurae & Pleural Spines
for i in range(7):
    tx = 0.0 - i * 0.22
    bpy.ops.mesh.primitive_cylinder_add(radius=0.22 - i * 0.015, depth=0.18, location=(tx, trilo_offset_y, 0.48))
    taxial = bpy.context.active_object
    taxial.rotation_euler = (0, math.radians(90), 0)
    assign_mat(taxial, mat_trilo_axial)
    move_to_col(taxial, col_trilo)

    for pside in [-1, 1]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(tx, trilo_offset_y + pside * 0.48, 0.44))
        tpleura = bpy.context.active_object
        tpleura.scale = (0.16, 0.52 - i * 0.04, 0.12)
        assign_mat(tpleura, mat_trilo_carapace if i % 2 == 0 else mat_trilo_axial)
        move_to_col(tpleura, col_trilo)

        bpy.ops.mesh.primitive_cone_add(radius1=0.04, depth=0.35, location=(tx - 0.12, trilo_offset_y + pside * (0.75 - i * 0.04), 0.40))
        pspine = bpy.context.active_object
        pspine.rotation_euler = (0, math.radians(-90), math.radians(pside * 40))
        assign_mat(pspine, mat_trilo_axial)
        move_to_col(pspine, col_trilo)

# Pygidium with 5 Pairs of Marginal Spines
bpy.ops.mesh.primitive_cylinder_add(radius=0.48, depth=0.22, location=(-1.65, trilo_offset_y, 0.42))
tpygid = bpy.context.active_object
tpygid.scale = (0.7, 1.0, 0.6)
assign_mat(tpygid, mat_trilo_axial)
move_to_col(tpygid, col_trilo)

for mp in range(5):
    for mside in [-1, 1]:
        bpy.ops.mesh.primitive_cone_add(radius1=0.035, depth=0.35 - mp * 0.04, location=(-1.85 - mp * 0.06, trilo_offset_y + mside * (0.2 + mp * 0.09), 0.40))
        mspine = bpy.context.active_object
        mspine.rotation_euler = (0, math.radians(-90), math.radians(mside * (20 + mp * 15)))
        assign_mat(mspine, mat_amber_spine)
        move_to_col(mspine, col_trilo)

# 7 Pairs of Biramous Appendages (Walking Endopodites + Gill Exopodites)
for leg_i in range(7):
    lx = 0.2 - leg_i * 0.24
    for lside in [-1, 1]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=0.48, location=(lx, trilo_offset_y + lside * 0.38, 0.22))
        tleg = bpy.context.active_object
        tleg.rotation_euler = (math.radians(lside * -40), 0, 0)
        assign_mat(tleg, mat_trilo_axial)
        move_to_col(tleg, col_trilo)

        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(lx + 0.04, trilo_offset_y + lside * 0.35, 0.30))
        tgill = bpy.context.active_object
        tgill.scale = (0.12, 0.28, 0.03)
        assign_mat(tgill, mat_gills)
        move_to_col(tgill, col_trilo)

# ==============================================================================
# 5. CAMERA & LIGHTING STUDIO SETUP
# ==============================================================================
bpy.ops.object.camera_add(location=(8.5, 0.0, 6.2))
cam = bpy.context.active_object
cam.name = "StudioCamera"
cam.rotation_euler = (math.radians(60), 0, math.radians(90))
bpy.context.scene.camera = cam

# Three-point studio lighting
bpy.ops.object.light_add(type='SUN', location=(5, -5, 12))
sun = bpy.context.active_object
sun.data.energy = 5.0
sun.rotation_euler = (math.radians(45), math.radians(20), math.radians(-30))

bpy.ops.object.light_add(type='POINT', location=(-4, 6, 8))
fill_light = bpy.context.active_object
fill_light.data.energy = 800.0
fill_light.data.color = (0.4, 0.8, 1.0)

bpy.ops.object.light_add(type='POINT', location=(4, -6, 5))
rim_light = bpy.context.active_object
rim_light.data.energy = 1200.0
rim_light.data.color = (1.0, 0.7, 0.3)

# Render settings
bpy.context.scene.render.resolution_x = 1920
bpy.context.scene.render.resolution_y = 1080
bpy.context.scene.render.filepath = "{render_path}"
bpy.context.scene.render.image_settings.file_format = 'PNG'

print("Rendering studio visualization to {render_path}...")
bpy.ops.render.render(write_still=True)

print("Exporting GLB scene to {glb_export_path}...")
try:
    bpy.ops.export_scene.gltf(filepath="{glb_export_path}", export_format='GLB')
    print("GLB export succeeded!")
except Exception as e:
    print(f"GLB export note: {{e}}")

print("=== ALL CAMBRIAN CREATURES SUCCESSFULLY GENERATED IN BLENDER 5.2 ===")
"""

    print("Executing Cambrian creatures generator script via Blender MCP...")
    res = send_blender_command("execute_code", {"code": blender_script})
    print("Execution response:")
    if res.get("status") == "error":
        print("ERROR:", res.get("message"))
    else:
        print("STDOUT:", res.get("result", {}).get("result", ""))

    if os.path.exists(render_path):
        size_kb = os.path.getsize(render_path) // 1024
        print(f"SUCCESS: Rendered screenshot saved to {render_path} ({size_kb} KB)")
    else:
        print(f"WARNING: Render file not found at {render_path}")

    if os.path.exists(glb_export_path):
        size_kb = os.path.getsize(glb_export_path) // 1024
        print(f"SUCCESS: Exported GLB asset to {glb_export_path} ({size_kb} KB)")
    else:
        print(f"NOTE: GLB file not found at {glb_export_path}")

if __name__ == "__main__":
    main()
