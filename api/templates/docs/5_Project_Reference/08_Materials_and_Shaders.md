# Materials and Shaders Reference

Complete reference for `.moudmat` material files and `.moudshader` shader files.

## Material Format (.moudmat)

Materials are JSON files that pair a shader with parameter values.

```json
{
  "shader": "res://shaders/grass.moudshader",
  "params": {
    "base_color": [0.10, 0.24, 0.09],
    "wind_strength": 0.22,
    "wind_speed": 1.4,
    "wind_direction": [1.0, 0.35],
    "player_push_radius": 1.6
  }
}
```

| Field | Type | Description |
|---|---|---|
| `shader` | string | `res://` path to the shader file |
| `params` | object | Values for `@expose`-marked shader uniforms |

### Parameter Value Types

| Shader Uniform Type | JSON Value |
|---|---|
| `float` | number: `0.22` |
| `vec2` | array of 2: `[1.0, 0.35]` |
| `vec3` | array of 3: `[0.10, 0.24, 0.09]` |
| `vec4` | array of 4: `[1.0, 0.0, 0.0, 1.0]` |

## Shader Format (.moudshader)

Shaders are GLSL files split into two stages with `#stage vertex` and `#stage fragment` markers.

### Basic Structure

```c
#stage vertex

in vec3 aPos;
in vec2 aTexCoord;
in vec3 aNormal;

uniform mat4 ViewMat;
uniform mat4 ProjMat;
uniform vec3 CameraPos;
uniform float Time;

uniform float my_param;  // @expose group=mygroup

out vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    gl_Position = ProjMat * ViewMat * vec4(aPos - CameraPos, 1.0);
}

#stage fragment

uniform float my_param;  // @expose group=mygroup

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
    fragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
```

### Built-in Vertex Attributes

| Attribute | Type | Description |
|---|---|---|
| `aPos` | vec3 | Vertex position |
| `aTexCoord` | vec2 | Texture coordinates |
| `aNormal` | vec3 | Vertex normal |

### Built-in Uniforms

Available in both stages:

| Uniform | Type | Description |
|---|---|---|
| `ViewMat` | mat4 | View matrix |
| `ProjMat` | mat4 | Projection matrix |
| `CameraPos` | vec3 | Camera world position |
| `Time` | float | Time since scene start (seconds) |

### Instanced Attributes

For `MultiMeshInstance3D` shaders, the vertex stage also receives per-instance data:

| Attribute | Type | Description |
|---|---|---|
| `aWorldMat0` | vec4 | Transform matrix column 0 |
| `aWorldMat1` | vec4 | Transform matrix column 1 |
| `aWorldMat2` | vec4 | Transform matrix column 2 |
| `aWorldMat3` | vec4 | Transform matrix column 3 |
| `aTint` | vec4 | Per-instance color (RGBA) |

To get the world position of an instanced vertex:

```c
mat4 WorldMat = mat4(aWorldMat0, aWorldMat1, aWorldMat2, aWorldMat3);
vec3 worldPos = (WorldMat * vec4(aPos, 1.0)).xyz;
```

### Exposed Uniforms

Mark a uniform with `// @expose` to make it configurable from materials and scripts:

```c
uniform float wind_strength;     // @expose group=wind
uniform vec2 wind_direction;     // @expose group=wind
uniform vec3 base_color;         // @expose group=color
```

- The `group=name` tag is for editor organization
- Default values come from the material's `params`
- Scripts can override at runtime: `api.setUniform(nodeId, "wind_strength", 0.5)`

### Using a Material on a Node

Set the `material` property on any renderable node:

```json
{
  "type": "MultiMeshInstance3D",
  "properties": {
    "material": "res://materials/grass.moudmat",
    "mesh": "cross"
  }
}
```

Or from a script:

```js
api.set(nodeId, "material", "res://materials/grass.moudmat");
```

### Complete Shader Example

A grass shader with wind, player interaction, and color gradients:

```c
#stage vertex

in vec3 aPos;
in vec2 aTexCoord;
in vec4 aWorldMat0;
in vec4 aWorldMat1;
in vec4 aWorldMat2;
in vec4 aWorldMat3;
in vec4 aTint;

uniform mat4 ViewMat;
uniform mat4 ProjMat;
uniform vec3 CameraPos;
uniform float Time;

uniform float wind_strength;        // @expose group=wind
uniform float wind_speed;           // @expose group=wind
uniform vec2 wind_direction;        // @expose group=wind
uniform float player_push_radius;   // @expose group=interaction
uniform float player_push_strength; // @expose group=interaction
uniform float num_players;
uniform vec3 player_pos_0;

out float vHeight;
out vec4 vTint;

void main() {
    mat4 WorldMat = mat4(aWorldMat0, aWorldMat1, aWorldMat2, aWorldMat3);
    vec3 worldPos = (WorldMat * vec4(aPos, 1.0)).xyz;

    float h = clamp(aTexCoord.y, 0.0, 1.0);
    float influence = h * h;

    // Wind
    float phase = Time * wind_speed + dot(worldPos.xz, wind_direction) * 0.35;
    float sway = sin(phase) * wind_strength * influence;
    worldPos.xz += wind_direction * sway;

    // Player push
    if (num_players > 0.5) {
        vec2 delta = worldPos.xz - player_pos_0.xz;
        float dist = length(delta);
        if (dist > 0.001 && dist < player_push_radius) {
            float push = (1.0 - dist / player_push_radius) * player_push_strength * influence;
            worldPos.xz += normalize(delta) * push;
        }
    }

    vHeight = h;
    vTint = aTint;
    gl_Position = ProjMat * ViewMat * vec4(worldPos - CameraPos, 1.0);
}

#stage fragment

uniform vec3 base_color;  // @expose group=color
uniform vec3 tip_color;   // @expose group=color

in float vHeight;
in vec4 vTint;
out vec4 fragColor;

void main() {
    vec3 col = mix(base_color, tip_color, vHeight);
    col *= vTint.rgb;
    fragColor = vec4(col, vTint.a);
}
```
