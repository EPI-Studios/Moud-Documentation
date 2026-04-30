# Light and Environment Nodes

The lighting system relies on three dedicated light nodes and the `WorldEnvironment` node to illuminate the 3D scene. The rendering pipeline evaluates directional, point, and spot lights alongside global atmospheric properties to calculate scene illumination.

---

## Light classes

### DirectionalLight3D

`DirectionalLight3D` emits parallel light rays across the entire scene. Its positional transform is ignored by the renderer; only its rotational transform affects the illumination direction. 

| Property | Type | Default | Description |
|---|---|---|---|
| `rx`, `ry`, `rz` | float | `0` | Euler rotation determining the light's directional vector. |
| `brightness` | float | `1.0` | Global intensity multiplier. |
| `color_r/g/b` | float | `1.0` | Light color multiplier per channel (0–1). |
| `enabled` | bool | `true` | Determines whether the light executes in the render pass. |

### OmniLight3D

`OmniLight3D` represents a point light source that emits light omnidirectionally from its specific spatial coordinate.

| Property | Type | Default | Description |
|---|---|---|---|
| `x`, `y`, `z` | float | `0` | Absolute world-space coordinate of the light origin. |
| `radius` | float | `10.0` | The maximum distance the illumination reaches before attenuating to zero. |
| `brightness` | float | `1.0` | Core intensity multiplier. |
| `color_r/g/b` | float | `1.0` | Light color multiplier per channel (0–1). |
| `enabled` | bool | `true` | Determines whether the light executes in the render pass. |

### SpotLight3D

`SpotLight3D` emits a directional cone of light from its spatial coordinate along its local Z-axis.

| Property | Type | Default | Description |
|---|---|---|---|
| `angle` | float | `45.0` | The total angle of the light cone in degrees. |
| `distance` | float | `20.0` | The maximum forward distance the illumination reaches. |
| `brightness` | float | `1.0` | Core intensity multiplier. |
| `color_r/g/b` | float | `1.0` | Light color multiplier per channel (0–1). |
| `cast_shadows` | bool | `false` | Enables depth-map shadow rendering. |

---

## WorldEnvironment

The `WorldEnvironment` node dictates scene-wide atmospheric and lighting parameters. Each scene graph evaluates a single `WorldEnvironment` node.

### Sky

| Property | Type | Description |
|---|---|---|
| `sky_mode` | string | Defines the sky rendering model (`"vanilla"` or `"custom"`). |
| `sky_shader` | string | Asset path to a custom sky `.moudshader` file. |
| `sky_material` | string | Asset path to a `.moudmat` sky material. |
| `sky_color_top_r/g/b` | float | Zenith gradient color coordinates. |
| `sky_color_horizon_r/g/b` | float | Horizon gradient color coordinates. |
| `sky_color_sunrise_r/g/b` | float | Sunrise/sunset atmospheric tint. |
| `sky_color_sunrise_strength` | float | Multiplier for the sunrise tint intensity. |

### Time and Atmosphere

| Property | Type | Description |
|---|---|---|
| `time_enabled` | bool | If `true`, the engine automatically advances the `time_ticks` property. |
| `time_ticks` | float | Current time of day evaluated in Minecraft ticks (0–24000). Noon evaluates to `6000`. |
| `ambient_light` | float | Global illumination baseline intensity (0–1). |
| `weather` | string | Active weather preset configuration (e.g., `"clear"`). |

### Fog

| Property | Type | Description |
|---|---|---|
| `fog_enabled` | bool | Enables depth-based distance fog rendering. |
| `fog_density` | float | Exponential fog thickness scalar (`0.01` evaluates as thin, `0.1` evaluates as opaque). |
| `fog_color_r/g/b` | float | Fog rendering color. |

### Clouds

| Property | Type | Description |
|---|---|---|
| `cloud_height` | float | World Y-coordinate for the primary cloud plane. |
| `cloud_speed` | float | Translation speed scalar for the cloud texture. |
| `cloud_scale` | float | Texture UV scaling parameter. |
| `cloud_offset_x/z` | float | Absolute planar offset for cloud rendering. |

---

## Script execution

Light properties and environmental variables are manipulated at runtime via standard node property assignment.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, ready, process } from "moud";

export default class LightingController extends Node3D {
  @ready()
  onReady() {
    const sun = this.find("Sun");
    this.api.set(sun, "brightness", "0.2");
    this.api.set(sun, "color_r", "1");
    this.api.set(sun, "color_g", "0.2");
    this.api.set(sun, "color_b", "0.1");
  }

  @process()
  onProcess(dt: number) {
    const envs = this.api.findNodesByType("WorldEnvironment");
    if (envs.length > 0) {
      const env = envs[0];
      let ticks = this.api.getNumber(env, "time_ticks", 6000) + dt * 100;
      if (ticks > 24000) ticks -= 24000;
      this.api.setNumber(env, "time_ticks", String(ticks));
    }
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    const sun = api.find("Sun");
    api.set(sun, "brightness", "0.2");
    api.set(sun, "color_r", "1");
    api.set(sun, "color_g", "0.2");
    api.set(sun, "color_b", "0.1");
  },

  _process(api, dt) {
    const envs = api.findNodesByType("WorldEnvironment");
    if (envs.length > 0) {
      const env = envs[0];
      let ticks = api.getNumber(env, "time_ticks", 6000) + dt * 100;
      if (ticks > 24000) ticks -= 24000;
      api.setNumber(env, "time_ticks", ticks);
    }
  }
})
```

--- tab: Luau
```lua
local script = {}

function script:_ready(api)
    local sun = api.find("Sun")
    api.set(sun, "brightness", "0.2")
    api.set(sun, "color_r", "1")
    api.set(sun, "color_g", "0.2")
    api.set(sun, "color_b", "0.1")
end

function script:_process(api, dt)
    local envs = api.findNodesByType("WorldEnvironment")
    if #envs > 0 then
        local env = envs[1]
        local ticks = api.getNumber(env, "time_ticks", 6000) + dt * 100
        if ticks > 24000 then ticks = ticks - 24000 end
        api.setNumber(env, "time_ticks", ticks)
    end
end

return script
```
````

---

## Shadow occlusion

The rendering pipeline provides two distinct systems for computing shadow occlusion from `OmniLight3D` and `SpotLight3D` sources.

### Voxel occlusion

Setting the `occluded` property to `true` on an `OmniLight3D` or `SpotLight3D` enables Veil's native voxel-based occlusion algorithm. This system calculates light blocking strictly based on the underlying grid-based block geometry. 

*Note: `MeshInstance3D`, `CSGBox`, and `Sprite3D` nodes are not registered in the voxel grid and do not cast shadows in this mode.*

### Shadow maps

Setting the `cast_shadows` property to `true` on a `SpotLight3D` enables standard depth-map shadow rendering. The engine allocates a shared 2048×2048 texture atlas capable of rendering up to four simultaneous shadow casters:
*   Two near-priority casters at 1024×1024 resolution.
*   Two far-priority casters at 512×512 resolution.

In this mode, all mesh-based geometry (`MeshInstance3D`, `Sprite3D`, `CSGBox`, `CSGBlock`) correctly cast and receive shadows.

```hint info Planned features
The `cast_shadows` property is available on `OmniLight3D` nodes, but rendering is currently deferred. Omnidirectional cube shadow maps are scheduled for a future engine update.
```

---

## Post-process integration

Scene lighting parameters are globally exposed to all `PostProcess` fragment shaders via built-in GLSL uniform arrays. This allows custom post-processing pipelines to evaluate volumetric scattering and raymarching using the active scene lights.

```glsl
struct PointLight { vec3 position; vec3 color; float brightness; float radius; };
struct DirLight   { vec3 direction; vec3 color; float brightness; };
struct SpotLight  { vec3 position; vec3 direction; vec3 color; float brightness; float angle; float distance; };

uniform int NumPointLights;
uniform PointLight PointLights[16];
uniform int NumDirLights;
uniform DirLight DirLights[4];
uniform int NumSpotLights;
uniform SpotLight SpotLights[8];

uniform mat4 moud_viewProj;
uniform mat4 moud_invViewProj;
uniform vec3 moud_cameraPos;
```