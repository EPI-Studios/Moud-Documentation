# 3D Rendering

Moud provides several node types for displaying 3D content. This page covers each one and when to use it.

## Render Node Types

### MeshInstance3D

Renders a single mesh. Use it for individual props, objects, and pieces of scenery.

```json
{
  "type": "MeshInstance3D",
  "properties": {
    "mesh": "cube",
    "texture": "res://textures/crate.png",
    "material": "",
    "x": "5", "y": "0", "z": "3",
    "sx": "1", "sy": "1", "sz": "1"
  }
}
```

Built-in mesh types: `cube`, `sphere`, `plane`, `cross`

You can also use a model path for custom meshes: `"mesh": "res://models/tree.bbmodel"`

### MultiMeshInstance3D

Renders thousands of instances of the same mesh with different transforms and colors. This is how you do grass, forests, crowds, debris, floating particles - anything where you need lots of copies efficiently.

```json
{
  "type": "MultiMeshInstance3D",
  "properties": {
    "mesh": "cross",
    "material": "res://materials/grass.moudmat",
    "script": "scripts/grass.js",
    "instance_count": "5000"
  }
}
```

Instance data is set from scripts using `api.setInstances()`. Each instance uses 13 floats:

```text
[px, py, pz, qx, qy, qz, qw, sx, sy, sz, cr, cg, cb]
 ─ position ─  ── quaternion ──  ── scale ──  ─ color ─
```

See the [Assets and Pipeline](/3_Features/6_Assets) page for a complete instancing example.

### Sprite3D

A flat textured quad in 3D space. Good for floating labels, particle-like effects, and billboard images.

```json
{
  "type": "Sprite3D",
  "properties": {
    "texture": "res://textures/icon.png",
    "billboard": "true",
    "double_sided": "true",
    "opacity": "0.8"
  }
}
```

| Property | Type | Description |
|---|---|---|
| `billboard` | bool | Always face the camera |
| `double_sided` | bool | Render both front and back faces |
| `opacity` | float | Transparency (0–1) |
| `mesh` | string | Shape: `"plane"` (default for sprites) |

### Decal

Projects a texture onto the surfaces below it. Good for ground marks, footprints, logos, puddles.

```json
{
  "type": "Decal",
  "properties": {
    "texture": "res://textures/logo.png",
    "x": "0", "y": "1", "z": "0",
    "sx": "4", "sy": "100", "sz": "4",
    "opacity": "0.5"
  }
}
```

The decal projects downward from its position. `sy` controls the projection depth - how far below the decal to project.

### CSGBox

A box primitive with optional physics collision. The fastest way to create a floor, wall, or platform.

```json
{
  "type": "CSGBox",
  "properties": {
    "sx": "50", "sy": "1", "sz": "50",
    "solid": "true",
    "collision_layer": "1",
    "collision_mask": "1",
    "mesh": "cube",
    "texture": "moud:dynamic/white",
    "color_tint_r": "0.3",
    "color_tint_g": "0.6",
    "color_tint_b": "0.3"
  }
}
```

### CSGBlock

Is a Minecraft block.

```json
{
  "type": "CSGBlock",
  "properties": {
    "block": "minecraft:stone",
    "solid": "true"
  }
}
```

### Model3D

For authored 3D models with animations. Use this when you have a custom model exported from Blender, Blockbench, or similar tools.

## Common Rendering Properties

All renderable nodes share these properties:

| Property | Type | Description |
|---|---|---|
| `visible` | bool | Show/hide the node |
| `texture` | string | Texture to apply (`res://...` or `moud:...`) |
| `material` | string | Material definition (`res://materials/...`) |
| `opacity` | float | Transparency (0 = invisible, 1 = fully opaque) |
| `color_tint_r/g/b` | float | Color multiplier per channel (0–1) |
| `mesh` | string | Mesh shape or model path |
| `billboard` | bool | Always face the camera |
| `double_sided` | bool | Render both face sides |
| `uv_scale_x/y` | float | Texture tiling |
| `uv_offset_x/y` | float | Texture scrolling |

