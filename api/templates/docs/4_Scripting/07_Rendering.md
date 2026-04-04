# Rendering API

Control shaders and GPU instancing from scripts.

## Shader Uniforms

### `api.setUniform(nodeId, name, ...values)` → void

Sets a shader uniform value on a node that has a material with exposed uniforms.

```js
// Set a float uniform
api.setUniform(nodeId, "wind_strength", 0.5);

// Set a vec2 uniform
api.setUniform(nodeId, "wind_direction", 1.0, 0.35);

// Set a vec3 uniform
api.setUniform(nodeId, "player_pos_0", px, py, pz);
```

This only works on nodes whose material has a shader with `// @expose` uniforms. See [Assets and Pipeline](/3_Features/6_Assets) for how to write shaders with exposed uniforms.

## GPU Instancing

### `api.setInstances(nodeId, data)` → void

Sets the per-instance transform and color data for a `MultiMeshInstance3D` node.

The `data` is a flat array of numbers. Each instance uses **13 floats**:

```text
[px, py, pz, qx, qy, qz, qw, sx, sy, sz, cr, cg, cb]
 ─ position ─  ── quaternion ──  ── scale ──  ─ color ─
```

| Floats | Description |
|---|---|
| `px, py, pz` | World position |
| `qx, qy, qz, qw` | Rotation as a quaternion |
| `sx, sy, sz` | Scale per axis |
| `cr, cg, cb` | Color tint per instance (0–1) |

### Example: Scatter 1000 Random Cubes

````tabs
--- tab: JavaScript
```js
({
  _ready(api) {
    var count = 1000;
    var data = new Array(count * 13);

    for (var i = 0; i < count; i++) {
      var b = i * 13;
      // Random position in a 50x50 area
      data[b]     = (Math.random() - 0.5) * 50;  // px
      data[b + 1] = 0;                            // py
      data[b + 2] = (Math.random() - 0.5) * 50;  // pz

      // Identity quaternion (no rotation)
      data[b + 3] = 0;   // qx
      data[b + 4] = 0;   // qy
      data[b + 5] = 0;   // qz
      data[b + 6] = 1;   // qw

      // Uniform scale
      var s = 0.5 + Math.random() * 0.5;
      data[b + 7] = s;   // sx
      data[b + 8] = s;   // sy
      data[b + 9] = s;   // sz

      // White color
      data[b + 10] = 1;  // cr
      data[b + 11] = 1;  // cg
      data[b + 12] = 1;  // cb
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
        local b = i * 13 + 1
        data[b]     = (math.random() - 0.5) * 50
        data[b + 1] = 0
        data[b + 2] = (math.random() - 0.5) * 50
        data[b + 3] = 0; data[b + 4] = 0; data[b + 5] = 0; data[b + 6] = 1
        local s = 0.5 + math.random() * 0.5
        data[b + 7] = s; data[b + 8] = s; data[b + 9] = s
        data[b + 10] = 1; data[b + 11] = 1; data[b + 12] = 1
    end

    api.setInstances(api.id(), data)
end

return script
```
````
