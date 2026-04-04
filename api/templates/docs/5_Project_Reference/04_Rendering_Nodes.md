# Rendering Nodes

These nodes put things on screen: meshes, sprites, decals, boxes, and cameras.

## Camera3D

A camera you can place in the scene and activate from a script with `api.camera().scene(nodeId)`.

| Property | Type | Default | Description |
|---|---|---|---|
| `fov` | float | 70 | Field of view in degrees (1 to 179) |
| `near` | float | 0.05 | Near clipping plane |
| `far` | float | 1000 | Far clipping plane |
| `current` | bool | false | Whether this camera is active |

## MeshInstance3D

Renders a single mesh. The workhorse for individual objects and props.

| Property | Type | Description |
|---|---|---|
| `mesh` | string | `cube`, `sphere`, `plane`, `cross`, or a model path |
| `texture` | string | Texture path |
| `material` | string | Material path |
| `opacity` | float | 0 = invisible, 1 = fully opaque |
| `color_tint_r/g/b` | float | Color tint per channel (0 to 1) |
| `billboard` | bool | Always face the camera |
| `double_sided` | bool | Render both sides of the faces |
| `uv_scale_x/y` | float | Texture tiling |
| `uv_offset_x/y` | float | Texture scrolling |

## MultiMeshInstance3D

Renders thousands of copies of the same mesh with different positions, rotations, scales, and colors. This is how you make grass fields, forests, scattered debris, and anything that needs a lot of the same object.

| Property | Type | Description |
|---|---|---|
| `mesh` | string | Mesh type or model path |
| `material` | string | Material path |
| `instance_count` | int | Number of instances |

You set the per-instance data from a script with `api.setInstances()`. Each instance is 13 floats:

```text
[px, py, pz, qx, qy, qz, qw, sx, sy, sz, cr, cg, cb]
 position    quaternion       scale        color
```

See the [Rendering page](/4_Scripting/07_Rendering) for code examples.

## Sprite3D

A flat textured rectangle in 3D space. Same properties as `MeshInstance3D`. The default mesh is `plane`.

Set `billboard` to `true` if you want it to always face the camera (useful for floating labels, icons, particles).

## Decal

Projects a texture downward onto whatever surfaces are below it. Good for ground logos, puddles, scorch marks.

| Property | Type | Description |
|---|---|---|
| `texture` | string | The texture to project |
| `sx`, `sz` | float | Width and depth of the projection |
| `sy` | float | How far down the projection goes |
| `opacity` | float | Transparency |

## CSGBox

A solid box you can use as floors, walls, and platforms. Supports collision.

| Property | Type | Description |
|---|---|---|
| `mesh` | string | Always `cube` |
| `solid` | bool | Whether it has collision |
| `collision_layer/mask` | int | Collision filtering |
| `texture` | string | Texture path |
| `color_tint_r/g/b` | float | Color tint |

## CSGBlock

A single Minecraft-style block.

| Property | Type | Description |
|---|---|---|
| `block` | string | Block ID like `minecraft:stone` |
| `solid` | bool | Whether it has collision |
