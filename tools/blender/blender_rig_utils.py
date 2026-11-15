"""
tools/blender/blender_rig_utils.py
Shared Blender 5.x procedural sculpting, SVG curve importing, PBR texturing,
bone-hierarchy rigging, and GLB export helpers for Extinction Kombat 3D.

Coordinate convention inside Blender before GLB export (export_yup=True):
- GLTF exports Blender +X -> Three.js +X (forward!)
- GLTF exports Blender +Z -> Three.js +Y (up!)
- GLTF exports Blender -Y -> Three.js +Z (lateral right!)
Wait: Let's verify exact glTF Y-up axis mapping in Blender:
In Blender's glTF 2.0 exporter with export_yup=True:
  Three.js X =  Blender X
  Three.js Y =  Blender Z
  Three.js Z = -Blender Y
Therefore, building creatures in Blender with:
  +X = Forward (head facing +X)
  +Z = Up (feet at Z = 0, hips at Z = animBaseHipsY)
  -Y / +Y = Left / Right lateral symmetry
ensures that exported .glb files open in Three.js with +X forward, +Y up,
and Bone_Hips at y = animBaseHipsY with feet resting cleanly on y = 0!
"""

import bpy
import bmesh
import math
import os
from mathutils import Vector, Matrix

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
TEX_DIR = os.path.join(ROOT, "assets", "textures", "fighters")
OUT_DIR = os.path.join(ROOT, "assets", "models", "fighters")


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for mesh in list(bpy.data.meshes):
        if mesh.users == 0:
            bpy.data.meshes.remove(mesh)
    for mat in list(bpy.data.materials):
        if mat.users == 0:
            bpy.data.materials.remove(mat)
    for img in list(bpy.data.images):
        if img.users == 0:
            bpy.data.images.remove(img)


def get_principled_bsdf(mat):
    if not mat or not mat.use_nodes:
        return None
    for node in mat.node_tree.nodes:
        if node.type == 'BSDF_PRINCIPLED':
            return node
    return None


def make_pbr_material(
    name,
    base_color=(0.5, 0.5, 0.5, 1.0),
    roughness=0.52,
    metallic=0.05,
    emissive=None,
    emissive_strength=0.0,
    albedo_path=None,
    bump_path=None,
    bump_strength=0.18,
    alpha=1.0,
):
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out = nt.nodes.new('ShaderNodeOutputMaterial')
    out.location = (450, 0)
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.location = (120, 0)
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

    if len(base_color) == 3:
        base_color = (base_color[0], base_color[1], base_color[2], 1.0)
    bsdf.inputs['Base Color'].default_value = base_color
    if 'Roughness' in bsdf.inputs:
        bsdf.inputs['Roughness'].default_value = roughness
    if 'Metallic' in bsdf.inputs:
        bsdf.inputs['Metallic'].default_value = metallic
    if 'Specular IOR Level' in bsdf.inputs:
        bsdf.inputs['Specular IOR Level'].default_value = 0.20 if roughness > 0.5 else 0.45
    if 'Alpha' in bsdf.inputs and alpha < 1.0:
        bsdf.inputs['Alpha'].default_value = alpha
        if hasattr(mat, 'blend_method'):
            mat.blend_method = 'BLEND'

    if emissive and 'Emission Color' in bsdf.inputs:
        if len(emissive) == 3:
            emissive = (emissive[0], emissive[1], emissive[2], 1.0)
        bsdf.inputs['Emission Color'].default_value = emissive
        if 'Emission Strength' in bsdf.inputs:
            bsdf.inputs['Emission Strength'].default_value = emissive_strength

    tex_coord = nt.nodes.new('ShaderNodeTexCoord')
    tex_coord.location = (-680, 0)

    if albedo_path and os.path.exists(albedo_path):
        img = bpy.data.images.load(albedo_path, check_existing=True)
        img.reload()
        tex_col = nt.nodes.new('ShaderNodeTexImage')
        tex_col.image = img
        tex_col.location = (-340, 140)
        nt.links.new(tex_coord.outputs['UV'], tex_col.inputs['Vector'])
        nt.links.new(tex_col.outputs['Color'], bsdf.inputs['Base Color'])

    if bump_path and os.path.exists(bump_path):
        b_img = bpy.data.images.load(bump_path, check_existing=True)
        b_img.reload()
        try:
            b_img.colorspace_settings.name = 'Non-Color'
        except Exception:
            pass
        tex_bump = nt.nodes.new('ShaderNodeTexImage')
        tex_bump.image = b_img
        tex_bump.location = (-340, -180)
        nt.links.new(tex_coord.outputs['UV'], tex_bump.inputs['Vector'])

        bump_node = nt.nodes.new('ShaderNodeBump')
        bump_node.location = (-80, -180)
        bump_node.inputs['Strength'].default_value = bump_strength
        bump_node.inputs['Distance'].default_value = 0.04
        nt.links.new(tex_bump.outputs['Color'], bump_node.inputs['Height'])
        nt.links.new(bump_node.outputs['Normal'], bsdf.inputs['Normal'])

    return mat


def create_bone_node(name, local_pos=(0.0, 0.0, 0.0), parent=None):
    empty = bpy.data.objects.new(name, None)
    empty.empty_display_type = 'PLAIN_AXES'
    empty.empty_display_size = 0.12
    bpy.context.scene.collection.objects.link(empty)
    if parent is not None:
        empty.parent = parent
    empty.location = Vector(local_pos)
    return empty


def attach_mesh_obj(bm, name, mat=None, parent=None, local_pos=(0.0, 0.0, 0.0), subdiv=0):
    mesh = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(mesh)
    bm.free()

    n_polys = len(mesh.polygons)
    if n_polys > 0:
        mesh.polygons.foreach_set("use_smooth", [True] * n_polys)
    mesh.update()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    if mat is not None:
        obj.data.materials.append(mat)
    if parent is not None:
        obj.parent = parent
    obj.location = Vector(local_pos)

    if subdiv > 0:
        mod = obj.modifiers.new(name="Subsurf", type='SUBSURF')
        mod.levels = subdiv
        mod.render_levels = subdiv
    return obj


def _catmull_rom(p0, p1, p2, p3, t):
    t2 = t * t
    t3 = t2 * t
    return 0.5 * (
        (2.0 * p1)
        + (-p0 + p2) * t
        + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t2
        + (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t3
    )


def build_organic_tube(
    name,
    ctrl_points,
    segs_u=20,
    segs_v=22,
    mat=None,
    parent=None,
    local_pos=(0.0, 0.0, 0.0),
    dorsal_keel=0.0,
    belly_flat=0.0,
    cap_ends=True,
    subdiv=1,
    taper_start=True,
    taper_end=True,
):
    """
    Lofts a smooth organic anatomical mesh along control points using
    quaternion parallel transport (no gimbal twist on vertical/curved limbs).
    ctrl_points = list of (x, y, z, rx_lateral, rz_height)
    """
    pts = [Vector((p[0], p[1], p[2])) for p in ctrl_points]
    r_y = [p[3] for p in ctrl_points]
    r_z = [p[4] if len(p) > 4 else p[3] for p in ctrl_points]

    # Pad endpoints for Catmull-Rom
    p_ext = [pts[0] + (pts[0] - pts[1])] + pts + [pts[-1] + (pts[-1] - pts[-2])]
    ry_ext = [r_y[0]] + r_y + [r_y[-1]]
    rz_ext = [r_z[0]] + r_z + [r_z[-1]]

    n_seg = len(pts) - 1
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    rings = []
    ring_vs = []
    prev_tangent = None
    lat_axis = None

    for iv in range(segs_v + 1):
        v = iv / segs_v
        # Smooth spherical taper at ends when enabled (omit on joint sockets to prevent sausage pinches)
        cap_scale = 1.0
        if cap_ends:
            if iv == 0 and taper_start:
                cap_scale = 0.04
            elif iv == segs_v and taper_end:
                cap_scale = 0.04
            elif v < 0.07 and taper_start:
                cap_scale = max(0.08, math.sin((v / 0.07) * math.pi * 0.5))
            elif v > 0.93 and taper_end:
                cap_scale = max(0.08, math.sin(((1.0 - v) / 0.07) * math.pi * 0.5))

        u_span = v * n_seg
        idx = min(n_seg - 1, int(u_span))
        lt = u_span - idx

        c = _catmull_rom(p_ext[idx], p_ext[idx + 1], p_ext[idx + 2], p_ext[idx + 3], lt)
        c_next = _catmull_rom(
            p_ext[idx], p_ext[idx + 1], p_ext[idx + 2], p_ext[idx + 3], min(1.0, lt + 0.02)
        )
        c_prev = _catmull_rom(
            p_ext[idx], p_ext[idx + 1], p_ext[idx + 2], p_ext[idx + 3], max(0.0, lt - 0.02)
        )
        tangent = (c_next - c_prev)
        if tangent.length < 1e-6:
            tangent = Vector((1.0, 0.0, 0.0))
        tangent.normalize()

        # Parallel-transport Bishop frame along tangent so vertical/bent limbs never flip or pinch
        if prev_tangent is None:
            init_lat = Vector((0.0, 1.0, 0.0))
            if abs(tangent.dot(init_lat)) > 0.94:
                init_lat = Vector((1.0, 0.0, 0.0))
            lat_axis = (init_lat - tangent * init_lat.dot(tangent)).normalized()
        else:
            q_rot = prev_tangent.rotation_difference(tangent)
            lat_axis = (q_rot @ lat_axis)
            lat_axis = (lat_axis - tangent * lat_axis.dot(tangent))
            if lat_axis.length < 1e-6:
                lat_axis = Vector((0.0, 1.0, 0.0))
            lat_axis.normalize()
        up_axis = tangent.cross(lat_axis).normalized()
        prev_tangent = tangent.copy()

        cur_ry = max(0.002, _catmull_rom(ry_ext[idx], ry_ext[idx + 1], ry_ext[idx + 2], ry_ext[idx + 3], lt) * cap_scale)
        cur_rz = max(0.002, _catmull_rom(rz_ext[idx], rz_ext[idx + 1], rz_ext[idx + 2], rz_ext[idx + 3], lt) * cap_scale)

        ring = []
        for iu in range(segs_u):
            u = iu / segs_u
            ang = u * math.pi * 2.0
            # ang = 0 -> top dorsal (+up_axis); pi -> ventral belly (-up_axis)
            sin_a = math.sin(ang)
            cos_a = math.cos(ang)

            # Organic cross-section shaping
            keel_boost = 1.0 + dorsal_keel * max(0.0, cos_a) ** 3
            belly_mod = 1.0 - belly_flat * max(0.0, -cos_a) ** 2

            pos = (
                c
                + lat_axis * (sin_a * cur_ry)
                + up_axis * (cos_a * cur_rz * keel_boost * belly_mod)
            )
            ring.append(bm.verts.new(pos))
        rings.append(ring)
        ring_vs.append(v)

    for iv in range(segs_v):
        r0 = rings[iv]
        r1 = rings[iv + 1]
        v0 = ring_vs[iv]
        v1 = ring_vs[iv + 1]
        for iu in range(segs_u):
            iu_next = (iu + 1) % segs_u
            u0 = iu / segs_u
            u1 = (iu + 1) / segs_u
            try:
                f = bm.faces.new((r0[iu], r0[iu_next], r1[iu_next], r1[iu]))
                uvs = [(u0, v0), (u1, v0), (u1, v1), (u0, v1)]
                for loop, uv in zip(f.loops, uvs):
                    loop[uv_layer].uv = uv
            except ValueError:
                pass

    if cap_ends:
        try:
            bm.faces.new(rings[0][::-1])
        except ValueError:
            pass
        try:
            bm.faces.new(rings[-1])
        except ValueError:
            pass

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=local_pos, subdiv=subdiv)


def build_curved_claw_or_horn(
    name,
    length=0.5,
    base_r=0.08,
    curve_bend=0.18,
    direction=(1.0, 0.0, -0.3),
    mat=None,
    parent=None,
    local_pos=(0.0, 0.0, 0.0),
    segs_u=12,
    segs_v=12,
):
    d = Vector(direction).normalized()
    up = Vector((0.0, 0.0, 1.0)) if abs(d.z) < 0.9 else Vector((1.0, 0.0, 0.0))
    bend_vec = d.cross(up).cross(d).normalized()
    pts = []
    for i in range(6):
        t = i / 5.0
        p = d * (length * t) + bend_vec * (-curve_bend * (t ** 1.7) * length)
        r = base_r * max(0.02, (1.0 - t ** 1.25))
        pts.append((p.x, p.y, p.z, r * 0.78, r * 1.15))
    return build_organic_tube(
        name,
        pts,
        segs_u=segs_u,
        segs_v=segs_v,
        mat=mat,
        parent=parent,
        local_pos=local_pos,
        dorsal_keel=0.15,
        cap_ends=True,
        subdiv=0,
    )


def build_osteoderm_plate(
    name,
    width=0.32,
    height=0.45,
    thickness=0.06,
    mat=None,
    parent=None,
    local_pos=(0.0, 0.0, 0.0),
    rot=(0.0, 0.0, 0.0),
    shape='diamond',
):
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    if shape == 'diamond':
        profile = [
            (0.0, 0.0, 0.0),
            (width * 0.42, 0.0, height * 0.48),
            (width * 0.12, 0.0, height * 0.96),
            (-width * 0.25, 0.0, height * 0.88),
            (-width * 0.45, 0.0, height * 0.36),
        ]
    else:  # hexagonal scute dome
        profile = [
            (width * 0.5, 0.0, 0.0),
            (width * 0.25, width * 0.43, 0.0),
            (-width * 0.25, width * 0.43, 0.0),
            (-width * 0.5, 0.0, 0.0),
            (-width * 0.25, -width * 0.43, 0.0),
            (width * 0.25, -width * 0.43, 0.0),
        ]

    if shape == 'diamond':
        front = [bm.verts.new((px, thickness * 0.5, pz)) for (px, _, pz) in profile]
        back = [bm.verts.new((px, -thickness * 0.5, pz)) for (px, _, pz) in profile]
        c_front = bm.verts.new((0.0, thickness * 0.9, height * 0.45))
        c_back = bm.verts.new((0.0, -thickness * 0.9, height * 0.45))
        n = len(profile)
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((front[i], front[j], c_front))
            bm.faces.new((back[j], back[i], c_back))
            bm.faces.new((front[i], back[i], back[j], front[j]))
    else:
        ring = [bm.verts.new((px, py, 0.0)) for (px, py, _) in profile]
        apex = bm.verts.new((0.0, 0.0, thickness))
        base = bm.verts.new((0.0, 0.0, -thickness * 0.2))
        n = len(profile)
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((ring[i], ring[j], apex))
            bm.faces.new((ring[j], ring[i], base))

    for f in bm.faces:
        for loop in f.loops:
            co = loop.vert.co
            loop[uv_layer].uv = (0.5 + co.x * 0.5, 0.5 + co.z * 0.5)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    obj = attach_mesh_obj(bm, name, mat=mat, parent=parent, local_pos=local_pos, subdiv=1)
    obj.rotation_euler = rot
    return obj


def build_anatomical_eye(name, radius, iris_mat, pupil_mat, parent, local_pos):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=12, radius=radius)
    eye = attach_mesh_obj(bm, name, mat=iris_mat, parent=parent, local_pos=local_pos, subdiv=0)
    eye.scale = (1.02, 0.82, 1.0)

    bm_p = bmesh.new()
    bmesh.ops.create_uvsphere(bm_p, u_segments=12, v_segments=10, radius=radius * 0.56)
    sign_y = 1.0 if local_pos[1] >= 0 else -1.0
    pupil = attach_mesh_obj(
        bm_p,
        name + "_Pupil",
        mat=pupil_mat,
        parent=eye,
        local_pos=(radius * 0.14, sign_y * radius * 0.62, 0.0),
        subdiv=0,
    )
    pupil.scale = (0.48, 0.72, 0.88)
    return eye


def import_svg_silhouette_extrude(
    name,
    svg_path,
    target_length=2.0,
    thickness=0.05,
    mat=None,
    parent=None,
    local_pos=(0.0, 0.0, 0.0),
):
    """
    Imports curves from an SVG file, keeps the main silhouette curve,
    normalizes scale, extrudes/bevels it into a clean 3D fin/sail/crest mesh.
    """
    before = set(bpy.data.objects)
    bpy.ops.import_curve.svg(filepath=svg_path)
    imported = [o for o in bpy.data.objects if o not in before and o.type == 'CURVE']
    if not imported:
        return None

    # Pick largest curve by bounding box diagonal
    main_obj = max(imported, key=lambda o: Vector(o.dimensions).length)
    for o in imported:
        if o != main_obj:
            bpy.data.objects.remove(o, do_unlink=True)

    main_obj.name = name
    main_obj.data.dimensions = '2D'
    main_obj.data.fill_mode = 'BOTH'
    main_obj.data.extrude = thickness * 0.5
    main_obj.data.bevel_depth = thickness * 0.15

    # Convert SVG curve to mesh & normalize scale
    bpy.context.view_layer.objects.active = main_obj
    main_obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')

    dims = main_obj.dimensions
    max_dim = max(dims.x, dims.y, 1e-5)
    s = target_length / max_dim
    main_obj.scale = (s, s, 1.0)
    # Rotate from Blender XY SVG plane into XZ side profile plane
    main_obj.rotation_euler = (math.pi / 2.0, 0.0, 0.0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

    if mat is not None:
        main_obj.data.materials.clear()
        main_obj.data.materials.append(mat)
    if parent is not None:
        main_obj.parent = parent
    main_obj.location = Vector(local_pos)
    return main_obj


def export_fighter_glb(out_path):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format='GLB',
        export_yup=True,
        export_apply=True,
        export_materials='EXPORT',
        export_texcoords=True,
        export_normals=True,
        export_cameras=False,
        export_lights=False,
    )
    size = os.path.getsize(out_path)
    print(f"[GLB OK] {os.path.basename(out_path)} ({size} bytes)")
    return size


def render_fighter_preview(fid, shot_dir="/home/niwatorichan/Projects/ExtinctionFighter/.tmp_screenshots"):
    """
    Renders three_quarter + side studio PBR previews with BLENDER_EEVEE to .tmp_screenshots/
    without polluting the fighter hierarchy (cleans up temp camera/lights/ground).
    """
    os.makedirs(shot_dir, exist_ok=True)
    bpy.context.view_layer.update()

    min_co = Vector((1e9, 1e9, 1e9))
    max_co = Vector((-1e9, -1e9, -1e9))
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            for corner in obj.bound_box:
                wc = obj.matrix_world @ Vector(corner)
                min_co.x = min(min_co.x, wc.x)
                min_co.y = min(min_co.y, wc.y)
                min_co.z = min(min_co.z, wc.z)
                max_co.x = max(max_co.x, wc.x)
                max_co.y = max(max_co.y, wc.y)
                max_co.z = max(max_co.z, wc.z)

    center = (min_co + max_co) * 0.5
    extent = max((max_co - min_co).length, 1.5)
    dist = extent * 1.15

    temp_objs = []
    # 3-point studio lighting + bright neutral world
    world = bpy.context.scene.world
    if not world:
        world = bpy.data.worlds.new("PreviewWorld")
        bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.14, 0.16, 0.20, 1.0)
        bg.inputs["Strength"].default_value = 1.1

    def add_sun(name, loc, target, energy, color=(1.0, 0.98, 0.95)):
        ldata = bpy.data.lights.new(name=name, type='SUN')
        ldata.energy = energy
        ldata.color = color
        lobj = bpy.data.objects.new(name, ldata)
        bpy.context.collection.objects.link(lobj)
        lobj.location = Vector(loc)
        lobj.rotation_euler = (Vector(target) - lobj.location).to_track_quat('-Z', 'Y').to_euler()
        temp_objs.append(lobj)

    add_sun("_PrevKey", center + Vector((4.0, -5.0, 6.0)), center, 3.2, (1.0, 0.96, 0.90))
    add_sun("_PrevFill", center + Vector((-4.0, 4.0, 3.0)), center, 1.4, (0.72, 0.86, 1.0))
    add_sun("_PrevRim", center + Vector((-5.0, -2.0, 5.0)), center, 2.0, (1.0, 0.88, 0.72))

    # Ground disc at z = 0
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=extent * 1.4, depth=0.04, location=(center.x, center.y, -0.025))
    ground = bpy.context.active_object
    ground.name = "_PrevGround"
    gmat = make_pbr_material("_PrevGroundMat", base_color=(0.18, 0.20, 0.23, 1.0), roughness=0.85, metallic=0.05)
    ground.data.materials.append(gmat)
    temp_objs.append(ground)

    cam_data = bpy.data.cameras.new("_PrevCam")
    cam_data.lens = 42.0
    cam_obj = bpy.data.objects.new("_PrevCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    temp_objs.append(cam_obj)

    scene = bpy.context.scene
    scene.camera = cam_obj
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 640
    scene.render.resolution_y = 480
    scene.render.image_settings.file_format = 'PNG'

    views = {
        "3q": center + Vector((dist * 0.72, -dist * 0.85, dist * 0.34)),
        "side": center + Vector((0.0, -dist * 1.05, extent * 0.08)),
    }
    paths = []
    for vname, loc in views.items():
        cam_obj.location = loc
        cam_obj.rotation_euler = (center - loc).to_track_quat('-Z', 'Y').to_euler()
        out_png = os.path.join(shot_dir, f"blender_{fid}_{vname}.png")
        scene.render.filepath = out_png
        bpy.ops.render.render(write_still=True)
        paths.append(out_png)

    for o in temp_objs:
        bpy.data.objects.remove(o, do_unlink=True)
    return paths
