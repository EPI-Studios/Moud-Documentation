# Assets and Pipeline

Assets are the files that make your game look and sound the way you want: textures, materials, shaders, models, and audio. Moud has a straightforward asset system with no build step. You put files in the right folders, reference them with `res://` paths, and the server handles the rest.

## Asset Folders

```text
assets/
├── manifest.tsv           # maps res:// paths to content hashes
├── textures/              # image files (PNG, JPG)
├── materials/             # .moudmat material definitions
├── shaders/               # .moudshader GLSL files
├── models/                # 3D model files
└── blobs/                 # content-addressed storage (hash-named files)
```

## The `res://` Path System

Assets are referenced in node properties and material files using `res://` paths:

```text
res://textures/stone.png        → assets/textures/stone.png
res://materials/grass.moudmat   → assets/materials/grass.moudmat
res://shaders/grass.moudshader  → assets/shaders/grass.moudshader
res://models/tree.glb           → assets/models/tree.glb
```

There are also built-in engine assets with the `moud:` prefix:

```text
moud:dynamic/white    # plain white texture
```

## The Manifest

`assets/manifest.tsv` is a tab-separated file that maps resource paths to content hashes:

```text
res://textures/stone.png	a1b2c3d4...	1024	IMAGE
res://scripts/player.js	e5f6a7b8...	256	TEXT
```

Each line has four columns:

| Column | Description |
|---|---|
| Resource path | The `res://` path used in scenes and materials |
| Content hash | SHA-256 hash of the file content |
| Size | File size in bytes |
| Type | `TEXT`, `BINARY`, `IMAGE`, `MODEL`, or `AUDIO` |

The actual file content is stored in `assets/blobs/` named by its hash. This content-addressing means identical files are stored only once, even if they're referenced by different paths.

## Materials (.moudmat)

A material file is JSON that pairs a shader with parameter values:

```json
{
  "shader": "res://shaders/grass.moudshader",
  "params": {
    "base_color": [0.10, 0.24, 0.09],
    "mid_color": [0.16, 0.42, 0.14],
    "tip_color": [0.32, 0.70, 0.24],
    "color_variation": 0.18,
    "wind_strength": 0.22,
    "wind_speed": 1.4,
    "player_push_radius": 1.6,
    "player_push_strength": 0.65
  }
}
```

- `shader` - `res://` path to the shader file
- `params` - values passed to the shader's exposed uniforms (numbers or arrays of numbers)

To use a material, set a node's `material` property:

```json
{
  "type": "MultiMeshInstance3D",
  "properties": {
    "material": "res://materials/grass.moudmat",
    "mesh": "cross"
  }
}
```

## Shaders (.moudshader)

Shaders are GLSL files with two stages separated by `#stage vertex` and `#stage fragment`:

```c
#stage vertex

in vec3 aPos;
in vec2 aTexCoord;
uniform mat4 ViewMat;
uniform mat4 ProjMat;
uniform vec3 CameraPos;
uniform float Time;

// @expose marks a uniform as a material parameter
uniform float wind_strength;     // @expose group=wind
uniform vec2 wind_direction;     // @expose group=wind

out vec3 vWorldPos;

void main() {
    // vertex shader logic
    gl_Position = ProjMat * ViewMat * vec4(aPos, 1.0);
}

#stage fragment

uniform vec3 base_color;         // @expose group=color
in vec3 vWorldPos;
out vec4 fragColor;

void main() {
    fragColor = vec4(base_color, 1.0);
}
```

### Built-in Uniforms

These uniforms are provided automatically by the engine:

| Uniform | Type | Description |
|---|---|---|
| `ViewMat` | mat4 | View matrix |
| `ProjMat` | mat4 | Projection matrix |
| `CameraPos` | vec3 | Camera world position |
| `Time` | float | Time since scene start in seconds |

### Exposed Uniforms

Mark a uniform with `// @expose` to make it settable from materials and scripts:

```c
uniform float wind_strength;     // @expose group=wind
```

- Material `.moudmat` files set default values in `params`
- Scripts can override at runtime with `api.setUniform(nodeId, "wind_strength", 0.5)`
- The `group=name` tag is for editor organization

### Instanced Attributes

For `MultiMeshInstance3D`, vertex shaders receive per-instance data:

```c
in vec4 aWorldMat0;  // transform column 0
in vec4 aWorldMat1;  // transform column 1
in vec4 aWorldMat2;  // transform column 2
in vec4 aWorldMat3;  // transform column 3
in vec4 aTint;       // per-instance color
```

## Runtime Shader Control

From scripts you can set uniforms and instance data:

````tabs
--- tab: JavaScript
```js
// Set a single uniform value
api.setUniform(nodeId, "wind_strength", 0.5);

// Set a multi-component uniform
api.setUniform(nodeId, "player_pos_0", px, py, pz);

// Set instance data for a MultiMeshInstance3D
// 13 floats per instance: px,py,pz, qx,qy,qz,qw, sx,sy,sz, cr,cg,cb
var data = [];
for (var i = 0; i < count; i++) {
  data.push(x, y, z);          // position
  data.push(0, 0, 0, 1);       // rotation quaternion (identity)
  data.push(1, 1, 1);          // scale
  data.push(1, 1, 1);          // color (white)
}
api.setInstances(nodeId, data);
```

--- tab: Luau
```lua
api.setUniform(nodeId, "wind_strength", 0.5)
api.setUniform(nodeId, "player_pos_0", px, py, pz)

local data = {}
for i = 0, count - 1 do
    local base = i * 13 + 1
    data[base] = x; data[base+1] = y; data[base+2] = z
    data[base+3] = 0; data[base+4] = 0; data[base+5] = 0; data[base+6] = 1
    data[base+7] = 1; data[base+8] = 1; data[base+9] = 1
    data[base+10] = 1; data[base+11] = 1; data[base+12] = 1
end
api.setInstances(nodeId, data)
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class ShaderControl extends NodeScript {
    @Override public void onReady() {
        long nodeId = core.id();

        // Set a single uniform value
        core.setUniform(nodeId, "wind_strength", 0.5);

        // Set a multi-component uniform
        core.setUniform(nodeId, "player_pos_0", px, py, pz);

        // Set instance data for a MultiMeshInstance3D
        // 13 floats per instance: px,py,pz, qx,qy,qz,qw, sx,sy,sz, cr,cg,cb
        int count = 10;
        double[] data = new double[count * 13];
        for (int i = 0; i < count; i++) {
            int base = i * 13;
            data[base] = x; data[base + 1] = y; data[base + 2] = z;
            data[base + 3] = 0; data[base + 4] = 0; data[base + 5] = 0; data[base + 6] = 1;
            data[base + 7] = 1; data[base + 8] = 1; data[base + 9] = 1;
            data[base + 10] = 1; data[base + 11] = 1; data[base + 12] = 1;
        }
        core.setInstances(nodeId, data);
    }
}
```
````
