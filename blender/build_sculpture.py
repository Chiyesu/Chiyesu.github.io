"""Builds the hero sculpture, exports a Draco-compressed GLB and renders stills.

Run from the project root:
  blender --background --factory-startup --python blender/build_sculpture.py -- public

Outputs:
  public/models/frontier.glb        Runtime model (nodes: Ribbon, Core, RingA, RingB)
  public/images/frontier-poster.webp  Transparent still, used when WebGL is unavailable
  public/images/og.jpg              1200x630 social share image
"""
import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

PANELS = 132
STEPS_PER_PANEL = 4
PANEL_FILL = 0.84
KNOT_SCALE = 0.62

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["public"]
OUT = os.path.abspath(argv[0])
os.makedirs(os.path.join(OUT, "models"), exist_ok=True)
os.makedirs(os.path.join(OUT, "images"), exist_ok=True)


def knot(u):
    """Trefoil centreline, laid out to face the camera along Blender's -Y."""
    x = math.sin(u) + 2 * math.sin(2 * u)
    y = math.cos(u) - 2 * math.cos(2 * u)
    z = -math.sin(3 * u)
    return Vector((x, z, y)) * KNOT_SCALE


def frame(u):
    """Periodic frame. Three half twists close cleanly on a rectangular section."""
    e = 1e-3
    tangent = (knot(u + e) - knot(u - e)).normalized()
    centre = knot(u)
    radial = Vector((centre.x, 0, centre.z)).normalized()
    normal = (radial - tangent * radial.dot(tangent)).normalized()
    binormal = tangent.cross(normal)
    angle = 1.5 * u
    width_axis = normal * math.cos(angle) + binormal * math.sin(angle)
    height_axis = -normal * math.sin(angle) + binormal * math.cos(angle)
    return width_axis, height_axis


def material(name, color, metallic, roughness, transmission=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Transmission Weight"].default_value = transmission
    return mat


def build_ribbon(mat):
    bm = bmesh.new()
    for panel in range(PANELS):
        start = panel / PANELS * math.tau
        span = PANEL_FILL / PANELS * math.tau
        # Width rhythm gives the ribbon a machined, non-uniform silhouette.
        half_w = 0.13 + 0.075 * (0.5 + 0.5 * math.sin(panel / PANELS * math.tau * 6))
        half_h = 0.022
        rings = []
        for step in range(STEPS_PER_PANEL + 1):
            u = start + span * step / STEPS_PER_PANEL
            c = knot(u)
            w, h = frame(u)
            rings.append([
                bm.verts.new(c + w * sx * half_w + h * sy * half_h)
                for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))
            ])
        for a, b in zip(rings, rings[1:]):
            for i in range(4):
                j = (i + 1) % 4
                bm.faces.new((a[i], a[j], b[j], b[i]))
        bm.faces.new(tuple(reversed(rings[0])))
        bm.faces.new(tuple(rings[-1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new("Ribbon")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("Ribbon", mesh)
    bpy.context.collection.objects.link(obj)
    mesh.materials.append(mat)
    bevel = obj.modifiers.new("Bevel", "BEVEL")
    bevel.width = 0.007
    bevel.segments = 1
    bevel.limit_method = "ANGLE"
    bevel.angle_limit = math.radians(35)
    return obj


def build_core(mat):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.56)
    obj = bpy.context.active_object
    obj.name = "Core"
    obj.data.name = "Core"
    obj.data.materials.append(mat)
    bpy.ops.object.shade_flat()
    return obj


def build_ring(name, major, tilt, mat):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major, minor_radius=0.007, major_segments=128, minor_segments=6
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.data.name = name
    obj.rotation_euler = tilt
    obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return obj


def studio_strip(location, rotation, size, strength):
    """Emissive card: visible in reflections, hidden from camera."""
    bpy.ops.mesh.primitive_plane_add(size=1, location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.scale = size
    mat = bpy.data.materials.new("Studio")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Color"].default_value = (0.72, 0.88, 1.0, 1)
    emission.inputs["Strength"].default_value = strength
    output = nodes.new("ShaderNodeOutputMaterial")
    mat.node_tree.links.new(emission.outputs[0], output.inputs[0])
    obj.data.materials.append(mat)
    obj.visible_camera = False
    return obj


def setup_render(scene):
    # Cycles: the metal needs traced reflections of the hidden studio cards.
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 72
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 8
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - High Contrast"
    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.006, 0.008, 0.011, 1)
    scene.world = world
    bpy.ops.object.camera_add(location=(0, -9.2, 0.25))
    camera = bpy.context.active_object
    direction = Vector((0, 0, 0)) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = 62
    scene.camera = camera
    studio_strip((-4.5, -3.5, 3), (1.0, 0, -0.9), (2.2, 7, 1), 14)
    studio_strip((5, -2.5, 0.5), (1.45, 0, 1.1), (0.7, 8, 1), 22)
    studio_strip((0, -1.5, -5), (3.0, 0, 0), (8, 1.4, 1), 5)


def render(scene, path, fmt, width, height, transparent):
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.film_transparent = transparent
    scene.render.image_settings.file_format = fmt
    scene.render.image_settings.color_mode = "RGBA" if transparent else "RGB"
    scene.render.image_settings.quality = 84
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

metal = material("Metal", (0.56, 0.60, 0.65), 1.0, 0.24)
glass = material("Glass", (0.62, 0.86, 0.95), 0.0, 0.05, 1.0)
accent = material("Accent", (0.30, 0.74, 0.90), 1.0, 0.3)

parts = [
    build_ribbon(metal),
    build_core(glass),
    build_ring("RingA", 2.42, (math.radians(74), math.radians(14), 0), accent),
    build_ring("RingB", 2.7, (math.radians(102), math.radians(-24), 0), metal),
]

bpy.ops.object.select_all(action="DESELECT")
for part in parts:
    part.select_set(True)
bpy.context.view_layer.objects.active = parts[0]

bpy.ops.export_scene.gltf(
    filepath=os.path.join(OUT, "models", "frontier.glb"),
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
    export_animations=False,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=7,
    export_draco_position_quantization=14,
    export_draco_normal_quantization=10,
)

setup_render(scene)
render(scene, os.path.join(OUT, "images", "frontier-poster.webp"), "WEBP", 1100, 1100, True)
render(scene, os.path.join(OUT, "images", "og.jpg"), "JPEG", 1200, 630, False)

print("SCULPTURE_OK", {p.name: len(p.evaluated_get(bpy.context.evaluated_depsgraph_get()).data.polygons) for p in parts})
