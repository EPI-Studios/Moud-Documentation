# Rendering API

Control shader uniforms and GPU instancing from scripts. These APIs let you drive visual effects, animated materials, and large crowds of objects entirely from script.

## Shader Uniforms

### `this.setUniform(name, ...values)` → `void`

Sets a shader uniform on this node's material. Supports floats, vec2, vec3, and vec4 - the number of values you pass determines the uniform type.

The node's material must have a shader with `// @expose` annotations on the uniforms you want to control. See [Assets and Pipeline](/3_Features/6_Assets) for authoring shaders with exposed uniforms.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, process, enterTree } from "moud";

export default class AnimatedMaterial extends Node3D {
  private elapsed = 0;

  @enterTree()
  init() {
    // Set a vec3 color uniform at startup
    this.setUniform("color", 1.0, 0.5, 0.0); // orange
  }

  @process()
  tick(dt: number) {
    this.elapsed += dt;

    // Drive a float uniform with elapsed time
    this.setUniform("time", this.elapsed);

    // Pulse a wave intensity value
    const intensity = 0.5 + 0.5 * Math.sin(this.elapsed * 2);
    this.setUniform("wave_intensity", intensity);
  }
}
```

--- tab: JavaScript
```js
({
  elapsed: 0,

  _enter_tree(api) {
    this.api = api;
    // vec3 color uniform
    api.setUniform(api.id(), "color", 1.0, 0.5, 0.0);
  },

  _process(api, dt) {
    this.elapsed += dt;
    api.setUniform(api.id(), "time", this.elapsed);

    var intensity = 0.5 + 0.5 * Math.sin(this.elapsed * 2);
    api.setUniform(api.id(), "wave_intensity", intensity);
  }
})
```

--- tab: Luau
```lua
local script = { elapsed = 0 }

function script:_enter_tree(api)
    self.api = api
    api.setUniform(api.id(), "color", 1.0, 0.5, 0.0)
end

function script:_process(api, dt)
    self.elapsed = self.elapsed + dt
    api.setUniform(api.id(), "time", self.elapsed)

    local intensity = 0.5 + 0.5 * math.sin(self.elapsed * 2)
    api.setUniform(api.id(), "wave_intensity", intensity)
end

return script
```
````

### Uniform Value Counts

| Count | Uniform Type | Example |
|---|---|---|
| 1 | `float` | `this.setUniform("speed", 2.5)` |
| 2 | `vec2` | `this.setUniform("uv_scale", 1.0, 0.5)` |
| 3 | `vec3` | `this.setUniform("color", 1.0, 0.0, 0.5)` |
| 4 | `vec4` | `this.setUniform("tint", 1.0, 0.5, 0.0, 1.0)` |

## GPU Instancing

### `InstanceData` - from `"moud"`

`InstanceData` is a typed builder for per-instance transform and color data on a `MultiMeshInstance3D`. Construct it with a count, fill it with `set(index, descriptor)`, then upload it.

```typescript
import { InstanceData } from "moud";

const instances = new InstanceData(count);
instances.set(i, {
  position: { x, y, z },
  rotation: { x, y, z, w }, // quaternion
  scale:    { x, y, z },
  color:    { r, g, b, a },
});
```

### `this.setInstances(data)` → `void`

Uploads an `InstanceData` object to the `MultiMeshInstance3D` node this script is attached to. This replaces all instance data on the GPU in a single call.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, enterTree } from "moud";
import { InstanceData } from "moud";

export default class InstancedForest extends Node3D {
  @enterTree()
  init() {
    const count = 500;
    const instances = new InstanceData(count);

    for (let i = 0; i < count; i++) {
      instances.set(i, {
        position: {
          x: (Math.random() - 0.5) * 100,
          y: 0,
          z: (Math.random() - 0.5) * 100,
        },
        rotation: { x: 0, y: 0, z: 0, w: 1 }, // identity
        scale:    { x: 1, y: 1 + Math.random(), z: 1 },
        color:    { r: 0.2 + Math.random() * 0.4, g: 0.6, b: 0.2, a: 1.0 },
      });
    }

    this.setInstances(instances);
  }
}
```

--- tab: JavaScript
```js
({
  _enter_tree(api) {
    this.api = api;
    var count = 500;
    // JS uses a flat array: 13 floats per instance
    // [px, py, pz, qx, qy, qz, qw, sx, sy, sz, cr, cg, cb]
    var data = new Array(count * 13);

    for (var i = 0; i < count; i++) {
      var b = i * 13;
      data[b]     = (Math.random() - 0.5) * 100; // px
      data[b + 1] = 0;                            // py
      data[b + 2] = (Math.random() - 0.5) * 100; // pz
      data[b + 3] = 0; data[b + 4] = 0; data[b + 5] = 0; data[b + 6] = 1; // quat identity
      data[b + 7] = 1; data[b + 8] = 1 + Math.random(); data[b + 9] = 1;  // scale
      data[b + 10] = 0.2 + Math.random() * 0.4;  // cr
      data[b + 11] = 0.6;                         // cg
      data[b + 12] = 0.2;                         // cb
    }

    api.setInstances(api.id(), data);
  }
})
```

--- tab: Luau
```lua
local script = {}

function script:_enter_tree(api)
    self.api = api
    local count = 500
    local data = {}

    for i = 0, count - 1 do
        local b = i * 13 + 1
        data[b]     = (math.random() - 0.5) * 100
        data[b + 1] = 0
        data[b + 2] = (math.random() - 0.5) * 100
        data[b + 3] = 0; data[b + 4] = 0; data[b + 5] = 0; data[b + 6] = 1
        data[b + 7] = 1; data[b + 8] = 1 + math.random(); data[b + 9] = 1
        data[b + 10] = 0.2 + math.random() * 0.4
        data[b + 11] = 0.6
        data[b + 12] = 0.2
    end

    api.setInstances(api.id(), data)
end

return script
```
````

### Instance Data Layout (JS / Luau Flat Array)

Each instance occupies **13 consecutive floats** in the flat array:

```text
Index  0– 2   px, py, pz         World position
Index  3– 6   qx, qy, qz, qw    Rotation quaternion
Index  7– 9   sx, sy, sz         Scale per axis
Index 10–12   cr, cg, cb         RGB color tint (0–1)
```

> **Note:** The TypeScript `InstanceData` builder handles layout automatically. The flat array format is only needed when writing JS or Luau scripts.

## Complete Example: Animated Particle Field

A `MultiMeshInstance3D` with 1000 instances that animate each frame using `@process`. Each instance orbits around the Y axis at a different radius and speed.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, process, enterTree } from "moud";
import { InstanceData } from "moud";
import { randf } from "moud/math";

interface ParticleState {
  angle: number;
  radius: number;
  speed: number;
  height: number;
}

export default class ParticleField extends Node3D {
  private count = 1000;
  private particles: ParticleState[] = [];
  private elapsed = 0;

  @enterTree()
  init() {
    // Randomize particle parameters once
    for (let i = 0; i < this.count; i++) {
      this.particles.push({
        angle:  randf(0, Math.PI * 2),
        radius: randf(2, 20),
        speed:  randf(0.3, 1.5),
        height: randf(-3, 3),
      });
    }
  }

  @process()
  tick(dt: number) {
    this.elapsed += dt;
    const instances = new InstanceData(this.count);

    for (let i = 0; i < this.count; i++) {
      const p = this.particles[i];
      p.angle += p.speed * dt;

      const hue = (i / this.count + this.elapsed * 0.1) % 1;

      instances.set(i, {
        position: {
          x: Math.cos(p.angle) * p.radius,
          y: p.height,
          z: Math.sin(p.angle) * p.radius,
        },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale:    { x: 0.2, y: 0.2, z: 0.2 },
        color:    { r: hue, g: 1 - hue, b: 0.5, a: 1.0 },
      });
    }

    this.setInstances(instances);
  }
}
```

--- tab: JavaScript
```js
({
  count: 1000,
  particles: null,
  elapsed: 0,

  _enter_tree(api) {
    this.api = api;
    this.particles = [];
    for (var i = 0; i < this.count; i++) {
      this.particles.push({
        angle:  Math.random() * Math.PI * 2,
        radius: 2 + Math.random() * 18,
        speed:  0.3 + Math.random() * 1.2,
        height: (Math.random() - 0.5) * 6,
      });
    }
  },

  _process(api, dt) {
    this.elapsed += dt;
    var data = new Array(this.count * 13);

    for (var i = 0; i < this.count; i++) {
      var p = this.particles[i];
      p.angle += p.speed * dt;

      var b = i * 13;
      data[b]     = Math.cos(p.angle) * p.radius;
      data[b + 1] = p.height;
      data[b + 2] = Math.sin(p.angle) * p.radius;
      data[b + 3] = 0; data[b + 4] = 0; data[b + 5] = 0; data[b + 6] = 1;
      data[b + 7] = 0.2; data[b + 8] = 0.2; data[b + 9] = 0.2;
      var hue = ((i / this.count) + this.elapsed * 0.1) % 1;
      data[b + 10] = hue;
      data[b + 11] = 1 - hue;
      data[b + 12] = 0.5;
    }

    api.setInstances(api.id(), data);
  }
})
```

--- tab: Luau
```lua
local script = { count = 1000, particles = nil, elapsed = 0 }

function script:_enter_tree(api)
    self.api = api
    self.particles = {}
    for i = 1, self.count do
        self.particles[i] = {
            angle  = math.random() * math.pi * 2,
            radius = 2 + math.random() * 18,
            speed  = 0.3 + math.random() * 1.2,
            height = (math.random() - 0.5) * 6,
        }
    end
end

function script:_process(api, dt)
    self.elapsed = self.elapsed + dt
    local data = {}

    for i = 1, self.count do
        local p = self.particles[i]
        p.angle = p.angle + p.speed * dt

        local b = (i - 1) * 13 + 1
        data[b]     = math.cos(p.angle) * p.radius
        data[b + 1] = p.height
        data[b + 2] = math.sin(p.angle) * p.radius
        data[b + 3] = 0; data[b + 4] = 0; data[b + 5] = 0; data[b + 6] = 1
        data[b + 7] = 0.2; data[b + 8] = 0.2; data[b + 9] = 0.2
        local hue = ((i / self.count) + self.elapsed * 0.1) % 1
        data[b + 10] = hue
        data[b + 11] = 1 - hue
        data[b + 12] = 0.5
    end

    api.setInstances(api.id(), data)
end

return script
```
````
