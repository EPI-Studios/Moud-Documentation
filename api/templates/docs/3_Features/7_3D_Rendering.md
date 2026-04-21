**3D Rendering**

Moud handles 3D rendering through dedicated visual nodes. Client-side rendering is executed via the Veil framework, which interfaces with the native OpenGL render pipeline to draw meshes, materials, and custom shaders.

---

## Technical behavior

When a client receives scene updates, the rendering pipeline executes the following steps each frame:
1. `VeilSceneNodeRenderer` reads the current scene state from the `ClientSceneBus`.
2. Draw calls are generated using the node's transform, mesh, material, and texture data.
3. Materials and textures are resolved from `MoudTextAssets` and `MoudTextures`.
4. 3D models (`.bbmodel`) are retrieved from the `ModelCache`.
5. Draw calls are injected into the deferred render pass.

*Note: The server simulates state and replicates properties, but does not perform rendering calculations or generate draw calls.*

---

## Render node types

### MeshInstance3D

`MeshInstance3D` represents a single 3D mesh in the world. It is the primary node for rendering individual static objects.

| Property | Type | Default | Description |
|---|---|---|---|
| `x`, `y`, `z` | float | `0` | Position in world space. |
| `rx`, `ry`, `rz` | float | `0` | Rotation in degrees (Euler XYZ). |
| `sx`, `sy`, `sz` | float | `1` | Scale. |
| `visible` | bool | `true` | Determines whether the node is drawn. |
| `mesh` | string | `cube` | Mesh type identifier: `cube`, `sphere`, `plane`, `cross`. |
| `texture` | string | - | Texture path (e.g., `res://textures/foo.png` or `moud:dynamic/white`). |
| `material` | string | - | Material path (e.g., `res://materials/foo.moudmat`). |
| `opacity` | float | `1.0` | Transparency multiplier (`0.0` = invisible, `1.0` = opaque). |
| `color_tint_r` | float | `1.0` | Red channel multiplier (0–1). |
| `color_tint_g` | float | `1.0` | Green channel multiplier (0–1). |
| `color_tint_b` | float | `1.0` | Blue channel multiplier (0–1). |
| `billboard` | bool | `false` | If `true`, the mesh continually rotates to face the active camera. |
| `double_sided` | bool | `false` | If `true`, backface culling is disabled. |
| `uv_scale_x` | float | `1.0` | Horizontal texture tiling multiplier. |
| `uv_scale_y` | float | `1.0` | Vertical texture tiling multiplier. |
| `uv_offset_x` | float | `0.0` | Horizontal texture offset. |
| `uv_offset_y` | float | `0.0` | Vertical texture offset. |

**Built-in mesh types**

| Value | Shape |
|---|---|
| `cube` | Axis-aligned box primitive. |
| `sphere` | UV sphere primitive. |
| `plane` | Flat quad mapped to the XZ plane. |
| `cross` | Intersecting quads. Typically utilized for foliage. |

````tabs
--- tab: TypeScript
```typescript
import { Node3D, ready, process } from "moud";

export default class MeshExample extends Node3D {
  @ready()
  onReady() {
    this.set("mesh", "cube");
    this.set("texture", "moud:dynamic/white");
    this.set("color_tint_r", "1.0");
    this.set("color_tint_g", "0.1");
    this.set("color_tint_b", "0.1");
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    api.set("mesh", "cube");
    api.set("texture", "moud:dynamic/white");
    api.set("color_tint_r", "1.0");
    api.set("color_tint_g", "0.1");
    api.set("color_tint_b", "0.1");
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_ready(api)
  api:set("mesh", "cube")
  api:set("texture", "moud:dynamic/white")
  api:set("color_tint_r", "1.0")
  api:set("color_tint_g", "0.1")
  api:set("color_tint_b", "0.1")
end
return script
```
````

#### Viewmodel mode

Setting `viewmodel = true` on a `MeshInstance3D` converts it into a first-person weapon / hand mesh. The node is **excluded from all normal scene passes** and drawn in a dedicated pass after the world, with the depth buffer cleared first — so the viewmodel never clips into walls.

Placement is camera-local: the mesh follows the camera rotation and sits at `(viewmodel_offset_x, viewmodel_offset_y, viewmodel_offset_z)` relative to the eye. Positive X is right, positive Y is up, negative Z is forward (OpenGL / MC convention).

The node's own `x/y/z` are ignored; `rx/ry/rz` are applied as an *extra* rotation on top of the camera frame (useful for script-driven procedural kick). `sx/sy/sz`, `texture`, `color_tint_*`, `opacity` behave normally.

| Property | Default | Description |
|---|---|---|
| `viewmodel` | `false` | Enables the viewmodel pass for this mesh. |
| `viewmodel_offset_x` | `0.25` | Right offset from the eye (camera-local). |
| `viewmodel_offset_y` | `-0.22` | Down offset (negative = below the crosshair). |
| `viewmodel_offset_z` | `-0.45` | Forward offset (negative = in front of the camera). |
| `viewmodel_fov` | `0` | Per-mesh effective FOV. `0` disables the adjustment (inherits game FOV); any non-zero value keeps the weapon at that apparent FOV regardless of user FOV / script-driven FOV kicks. Applied as a uniform scale of `tan(gameFov/2) / tan(viewmodelFov/2)` on the mesh matrix. |

**Example — attach a cube "gun" to the camera:**

```json
{
  "name": "Viewmodel",
  "type": "MeshInstance3D",
  "properties": {
    "viewmodel": "true",
    "viewmodel_offset_x": "0.28",
    "viewmodel_offset_y": "-0.24",
    "viewmodel_offset_z": "-0.55",
    "sx": "0.22", "sy": "0.14", "sz": "0.55",
    "mesh": "cube",
    "texture": "moud:dynamic/white",
    "color_tint_r": "0.12", "color_tint_g": "0.12", "color_tint_b": "0.14"
  }
}
```

Notes:

- The viewmodel renders for **every** local player regardless of which `CharacterBody3D` owns it — if you want the weapon to only show for the owning player, gate visibility from the client script via `visible=false` on non-owners.
- The base `MeshInstance3D` transform properties (`x/y/z`) are not used for placement; animating them is a no-op in viewmodel mode. Use `viewmodel_offset_*` (now writable from client scripts via `node:writeNumberOf(viewmodelId, "viewmodel_offset_z", ...)`) or `rx/ry/rz` for extra rotation.
- Collision / raycasting is never performed on viewmodel meshes — they are visual-only.

---

### MultiMeshInstance3D

`MultiMeshInstance3D` renders multiple instances of a single mesh using one draw call. This node is required for performance optimization when displaying large quantities of identical objects (e.g., foliage, crowds, particles).

| Property | Type | Default | Description |
|---|---|---|---|
| `mesh` | string | `cross` | Target mesh primitive identifier. |
| `texture` | string | - | Shared texture applied to all instances. |
| `material` | string | - | Shared material applied to all instances. |
| `instance_count` | int | `0` | Total number of allocated instances. |

Instance data is populated via script using `api.setInstances()`. Each instance requires a 13-float array representing transform and color data:

```text
[px, py, pz,   qx, qy, qz, qw,   sx, sy, sz,   cr, cg, cb]
 ─ position ─  ──── quaternion ────  ─── scale ───  ─ color ─
```

````tabs
--- tab: TypeScript
```typescript
import { Node3D, ready } from "moud";

export default class GrassField extends Node3D {
  @ready()
  onReady() {
    const count = 1000;
    const data = new Float32Array(count * 13);

    for (let i = 0; i < count; i++) {
      const base = i * 13;
      data[base]     = (Math.random() - 0.5) * 50;
      data[base + 1] = 0;
      data[base + 2] = (Math.random() - 0.5) * 50;
      
      data[base + 3] = 0; data[base + 4] = 0;
      data[base + 5] = 0; data[base + 6] = 1;
      
      const h = 0.5 + Math.random() * 0.5;
      data[base + 7] = 0.3; data[base + 8] = h; data[base + 9] = 0.3;
      
      data[base + 10] = 0.2 + Math.random() * 0.1;
      data[base + 11] = 0.6 + Math.random() * 0.2;
      data[base + 12] = 0.1;
    }

    this.setInstances(this.id(), data);
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    const count = 1000;
    const data = new Float32Array(count * 13);

    for (let i = 0; i < count; i++) {
      const base = i * 13;
      data[base]     = (Math.random() - 0.5) * 50;
      data[base + 1] = 0;
      data[base + 2] = (Math.random() - 0.5) * 50;
      data[base + 3] = 0; data[base + 4] = 0;
      data[base + 5] = 0; data[base + 6] = 1;
      const h = 0.5 + Math.random() * 0.5;
      data[base + 7] = 0.3; data[base + 8] = h; data[base + 9] = 0.3;
      data[base + 10] = 0.2 + Math.random() * 0.1;
      data[base + 11] = 0.6 + Math.random() * 0.2;
      data[base + 12] = 0.1;
    }
    api.setInstances(api.id(), data);
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_ready(api)
  local count = 1000
  local data = {}
  for i = 0, count - 1 do
    local base = i * 13 + 1
    data[base]     = (math.random() - 0.5) * 50
    data[base + 1] = 0
    data[base + 2] = (math.random() - 0.5) * 50
    data[base + 3] = 0; data[base + 4] = 0
    data[base + 5] = 0; data[base + 6] = 1
    local h = 0.5 + math.random() * 0.5
    data[base + 7] = 0.3; data[base + 8] = h; data[base + 9] = 0.3
    data[base + 10] = 0.2 + math.random() * 0.1
    data[base + 11] = 0.6 + math.random() * 0.2
    data[base + 12] = 0.1
  end
  api:setInstances(api:id(), data)
end
return script
```
````

```hint tip Optimization
Use `MultiMeshInstance3D` for any geometry that repeats more than 20 times in a single scene to minimize draw call overhead.
```

---

### Sprite3D

`Sprite3D` renders a 2D texture quad within the 3D environment. 

| Property | Type | Default | Description |
|---|---|---|---|
| `texture` | string | - | Texture path. |
| `billboard` | bool | `true` | If `true`, the quad continuously rotates to face the camera. |
| `double_sided` | bool | `true` | If `true`, backface culling is disabled. |
| `opacity` | float | `1.0` | Global transparency multiplier. |
| `color_tint_r/g/b` | float | `1.0` | Color multiplier per channel. |

---

### Text3D

`Text3D` renders text strings in 3D space.

| Property | Type | Default | Description |
|---|---|---|---|
| `text` | string | `""` | The text string to display. |
| `font_size` | float | `12` | Font scale evaluation. |
| `color_r/g/b/a` | float | `1.0` | Text color parameters. |
| `billboard` | bool | `true` | If `true`, text continuously rotates to face the camera. |
| `outline` | bool | `false` | Renders a black outline behind glyphs. |

---

### Decal

`Decal` projects a texture onto underlying geometry along the local Y-axis. 

| Property | Type | Default | Description |
|---|---|---|---|
| `texture` | string | - | Texture path. |
| `opacity` | float | `1.0` | Decal transparency multiplier. |
| `sx`, `sz` | float | `1` | Evaluation bounds for width and length. |
| `sy` | float | `1` | Sets the maximum projection depth below the origin point. |

---

### CSGBox

`CSGBox` generates a box primitive. It supports optional physics collision and geometry batching.

| Property | Type | Default | Description |
|---|---|---|---|
| `sx`, `sy`, `sz` | float | `1` | Box dimensions. |
| `solid` | bool | `false` | Evaluates physics collision. |
| `texture` | string | `moud:dynamic/white` | Surface texture path. |
| `material` | string | - | Material override path. |
| `color_tint_r/g/b` | float | `1.0` | Color tint multiplier. |
| `collision_layer` | int | `1` | Physics collision layer bitmask. |
| `collision_mask` | int | `1` | Physics collision mask bitmask. |

```hint tip Collision behavior
Collision evaluation for `CSGBox` utilizes Oriented Bounding Boxes (OBB). Rotating the node correctly rotates the collision bounds in the physics step.
```

---

### CSGBlock

`CSGBlock` renders a specific native Minecraft block state at a designated 3D coordinate.

| Property | Type | Default | Description |
|---|---|---|---|
| `block` | string | `minecraft:stone` | Minecraft block identifier (e.g. `minecraft:oak_planks`). |
| `solid` | bool | `false` | Evaluates physics collision. |

---

### Model3D

`Model3D` renders imported 3D models and handles skeletal animation playback.

| Property | Type | Default | Description |
|---|---|---|---|
| `model_path` | string | - | Path to an imported model file (e.g. `res://models/hero.bbmodel`). |
| `animation` | string | `""` | Currently executing animation name. |
| `animation_speed` | float | `1.0` | Animation playback speed multiplier. |
| `animation_loop` | bool | `true` | If `true`, animation restarts upon completion. |
| `texture` | string | - | Texture override path. |
| `visible` | bool | `true` | Determines whether the node is drawn. |

````tabs
--- tab: TypeScript
```typescript
import { Node3D, process } from "moud";

export default class AnimatedModel extends Node3D {
  @process()
  onProcess(dt: number) {
    const inp = this.getInput();
    const moveX = inp.get_axis("move_left", "move_right");
    const moveZ = inp.get_axis("move_back", "move_forward");
    const moving = Math.abs(moveX) > 0.1 || Math.abs(moveZ) > 0.1;
    this.set("animation", moving ? "walk" : "idle");
  }
}
```

--- tab: JavaScript
```js
({
  _process(api, dt) {
    const inp = api.getInput();
    const moveX = inp.get_axis("move_left", "move_right");
    const moveZ = inp.get_axis("move_back", "move_forward");
    const moving = Math.abs(moveX) > 0.1 || Math.abs(moveZ) > 0.1;
    api.set("animation", moving ? "walk" : "idle");
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_process(api, dt)
  local inp = api:getInput()
  local moveX = inp:get_axis("move_left", "move_right")
  local moveZ = inp:get_axis("move_back", "move_forward")
  local moving = math.abs(moveX) > 0.1 or math.abs(moveZ) > 0.1
  api:set("animation", moving and "walk" or "idle")
end
return script
```
````

---

### AnimatedSprite3D

`AnimatedSprite3D` is a `Sprite3D` variant that iterates through regions of a sprite sheet.

| Property | Type | Default | Description |
|---|---|---|---|
| `texture` | string | - | Source sprite sheet texture. |
| `hframes` | int | `1` | Total column divisions. |
| `vframes` | int | `1` | Total row divisions. |
| `frame` | int | `0` | Current frame index. |
| `fps` | float | `8` | Playback evaluation speed (frames per second). |
| `playing` | bool | `true` | Enables or disables frame iteration. |
| `loop` | bool | `true` | Restarts iteration at `0` when sequence concludes. |

### Particle3D

CPU-simulated, camera-billboarded particle emitter. See [Particles](/3_Features/10_Particles) for the full feature reference.

---

## Materials

A material defines the visual properties of a surface, including texture mapping, PBR parameters, and blend modes. Materials are stored as `.moudmat` JSON files within the `res://materials/` directory.

### Configuration format

```json
{
  "shader": "res://shaders/standard.moudshader",
  "albedo_texture": "res://textures/ground.png",
  "roughness": 0.8,
  "metallic": 0.0,
  "emissive_r": 0.0,
  "emissive_g": 0.0,
  "emissive_b": 0.0,
  "opacity": 1.0,
  "double_sided": false,
  "blend_mode": "opaque"
}
```

### Material properties

| Property | Type | Description |
|---|---|---|
| `shader` | string | Target `.moudshader` file. |
| `albedo_texture` | string | Base color texture map. |
| `albedo_r/g/b` | float | Base color multiplier (0–1). |
| `roughness` | float | Surface roughness evaluation (`0.0` = smooth, `1.0` = rough). |
| `metallic` | float | Metallic factor (`0.0` = dielectric, `1.0` = metal). |
| `normal_texture` | string | Normal map texture. |
| `normal_strength` | float | Normal map scalar intensity. |
| `emissive_texture` | string | Emission texture map. |
| `emissive_r/g/b` | float | Emission intensity per channel. Values > 1 trigger post-processing bloom. |
| `ao_texture` | string | Ambient occlusion map. |
| `opacity` | float | Base transparency scalar. |
| `double_sided` | bool | Disables backface culling. |
| `blend_mode` | string | Sets render pass behavior (`opaque`, `alpha_blend`, `alpha_clip`). |
| `alpha_clip_threshold` | float | Alpha cutout value when `blend_mode` is `alpha_clip`. |

```hint tip Blend modes
`alpha_clip` discards pixels evaluating below `alpha_clip_threshold`. `alpha_blend` computes relative transparency against the background buffer. `opaque` ignores alpha sorting and is the most performant.
```

---

## Custom shaders

The Veil framework supports custom GLSL shaders via `.moudshader` files. These files use a JSON envelope to specify the target render pass and paths to the GLSL sources.

### File structure

```json
{
  "vertex": "res://shaders/water.vert.glsl",
  "fragment": "res://shaders/water.frag.glsl",
  "pass": "opaque"
}
```

*Note: Shaders can also be authored as a single inline GLSL file using `// @vertex` and `// @fragment` preprocessor markers.*

### Runtime uniform assignment

Shaders receive per-node uniform updates via script execution.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, process } from "moud";

export default class WaterShader extends Node3D {
  time = 0;

  @process()
  onProcess(dt: number) {
    this.time += dt;
    this.setNumber("u_time", this.time);
    this.setNumber("u_wave_height", 0.3);
    this.setNumber("u_wave_speed", 1.5);
  }
}
```

--- tab: JavaScript
```js
({
  time: 0,
  _process(api, dt) {
    this.time += dt;
    api.setUniform("u_time", this.time);
    api.setUniform("u_wave_height", 0.3);
    api.setUniform("u_wave_speed", 1.5);
  }
})
```

--- tab: Luau
```lua
local script = {}
script.time = 0
function script:_process(api, dt)
  self.time = self.time + dt
  api:setUniform("u_time", self.time)
  api:setUniform("u_wave_height", 0.3)
  api:setUniform("u_wave_speed", 1.5)
end
return script
```
````

```hint warning Uniform replication
`api.setUniform()` executes entirely on the local client. It does not replicate uniform state to other connected clients. Use this method strictly for local visual evaluations.
```

---

## Common rendering properties

The following properties inherit to all rendering nodes:

| Property | Type | Default | Description |
|---|---|---|---|
| `visible` | bool | `true` | Determines rendering visibility. |
| `texture` | string | - | Texture path binding (`res://...` or `moud:...`). |
| `material` | string | - | Material file binding (`res://materials/...`). |
| `opacity` | float | `1.0` | Render transparency (`0.0` = invisible, `1.0` = opaque). |
| `color_tint_r/g/b` | float | `1.0` | Linear color multiplier. |
| `mesh` | string | - | Geometry or model reference. |
| `billboard` | bool | `false` | Camera-facing rotation constraint. |
| `double_sided` | bool | `false` | Backface render flag. |
| `uv_scale_x/y` | float | `1.0` | Base texture coordinate scale. |
| `uv_offset_x/y` | float | `0.0` | Base texture coordinate translation. |

---

## Lighting

Moud exposes three primary light classes. Each light type enforces a hardcoded limit for simultaneous instances per scene:

| Class | Type | Max instances |
|---|---|---|
| `OmniLight3D` | Point | 16 |
| `DirectionalLight3D` | Directional/Sun | 4 |
| `SpotLight3D` | Spot/Cone | 8 |

Ambient lighting evaluation, atmospheric fog, and sky color are configured globally via the `WorldEnvironment` node. See [Light and Environment Nodes](/5_Project_Reference/06_Light_and_Environment_Nodes) for property details.

---

## Performance optimization

### Draw calls

Each `MeshInstance3D` generates a unique draw call. To maintain optimal framerates:
- Restrict the total count of individual `MeshInstance3D` nodes in a scene.
- Utilize `MultiMeshInstance3D` for grouped or repeated geometry.
- Use `CSGBox` and `CSGBlock` nodes for static architecture, as the pipeline automatically batches them.

![Performance comparison: 1000 MultiMesh instances vs 1000 MeshInstance3D nodes](placeholder)

### Texture mapping

Texture binding is a significant GPU operation. Consolidate multiple textures into a single texture atlas. Use the `uv_offset_x` and `uv_offset_y` properties to sample specific atlas regions per material.

### Visibility culling

Moud does not evaluate frustum or distance culling automatically. Scripts should evaluate distance and modify the `visible` property to unload geometry from the pipeline.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, process } from "moud";

export default class DistanceCull extends Node3D {
  playerX = 0;
  playerZ = 0;

  @process()
  onProcess(dt: number) {
    const dx = this.getNumber("x", 0) - this.playerX;
    const dz = this.getNumber("z", 0) - this.playerZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    this.set("visible", dist < 50 ? "true" : "false");
  }
}
```

--- tab: JavaScript
```js
({
  playerX: 0,
  playerZ: 0,
  _process(api, dt) {
    const dx = api.getNumber("x", 0) - this.playerX;
    const dz = api.getNumber("z", 0) - this.playerZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    api.set("visible", dist < 50 ? "true" : "false");
  }
})
```

--- tab: Luau
```lua
local script = {}
script.playerX = 0
script.playerZ = 0
function script:_process(api, dt)
  local dx = api:getNumber("x", 0) - self.playerX
  local dz = api:getNumber("z", 0) - self.playerZ
  local dist = math.sqrt(dx * dx + dz * dz)
  api:set("visible", dist < 50 and "true" or "false")
end
return script
```
````