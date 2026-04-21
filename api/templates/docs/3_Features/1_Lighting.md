# Lighting System

Moud provides three types of light nodes and a global environment system for controlling the overall mood of your scene.

## Light Types

### DirectionalLight3D

A sun-like light that illuminates the entire scene from one direction. The light rays are parallel, so position doesn't matter - only rotation.

```json
{
  "type": "DirectionalLight3D",
  "properties": {
    "rx": "120",
    "ry": "45",
    "brightness": "0.5",
    "enabled": "true",
    "color_r": "1",
    "color_g": "0.95",
    "color_b": "0.85"
  }
}
```

Use `rx` and `ry` to control the light angle.

### OmniLight3D

A point light that emits in all directions from its position. 

```json
{
  "type": "OmniLight3D",
  "properties": {
    "x": "5",
    "y": "3",
    "z": "0",
    "radius": "10",
    "brightness": "0.8",
    "color_r": "1",
    "color_g": "0.7",
    "color_b": "0.3"
  }
}
```

| Property | Type | Description |
|---|---|---|
| `radius` | float | How far the light reaches |
| `brightness` | float | Light intensity |
| `color_r/g/b` | float | Light color (0–1 per channel) |
| `enabled` | bool | Turn light on/off |

### SpotLight3D

A cone-shaped light.

```json
{
  "type": "SpotLight3D",
  "properties": {
    "x": "0",
    "y": "10",
    "z": "0",
    "rx": "90",
    "angle": "30",
    "distance": "20",
    "brightness": "1",
    "color_r": "1",
    "color_g": "1",
    "color_b": "1"
  }
}
```

| Property | Type | Description |
|---|---|---|
| `angle` | float | Cone angle in degrees |
| `distance` | float | How far the spotlight reaches |

## WorldEnvironment

The `WorldEnvironment` node controls scene-wide rendering settings. You should have one per scene.

### Sky

| Property | Description |
|---|---|
| `sky_mode` | `"vanilla"` or `"custom"` |
| `sky_shader` | Path to a custom sky shader |
| `sky_material` | Path to a sky material |
| `sky_color_top_r/g/b` | Sky zenith color |
| `sky_color_horizon_r/g/b` | Sky horizon color |
| `sky_color_sunrise_r/g/b` | Sunrise tint color |
| `sky_color_sunrise_strength` | Sunrise tint intensity |

### Time

| Property | Description |
|---|---|
| `time_enabled` | Enable time progression (`"true"` / `"false"`) |
| `time_ticks` | Current time of day in Minecraft ticks (0–24000). 6000 = noon. |

### Fog

| Property | Description |
|---|---|
| `fog_enabled` | Enable distance fog |
| `fog_density` | Fog thickness (0.01 = thin, 0.1 = thick) |
| `fog_color_r/g/b` | Fog color |

### Clouds

| Property | Description |
|---|---|
| `cloud_height` | Cloud layer height |
| `cloud_speed` | Cloud movement speed |
| `cloud_scale` | Cloud texture scale |
| `cloud_offset_x/z` | Cloud position offset |

### Ambient

| Property | Description |
|---|---|
| `ambient_light` | Ambient light intensity (0–1) |
| `weather` | Weather preset: `"clear"`, etc. |

## Scripting Lights

You can control lights from scripts just like any other node:

````tabs
--- tab: JavaScript
```js
({
  _ready(api) {
    var sun = api.find("Sun");
    api.set(sun, "brightness", "0.2");
    api.set(sun, "color_r", "1");
    api.set(sun, "color_g", "0.2");
    api.set(sun, "color_b", "0.1");
  },

  _process(api, dt) {
    var envs = api.findNodesByType("WorldEnvironment");
    if (envs.length > 0) {
      var env = envs[0];
      var ticks = api.getNumber(env, "time_ticks", 6000) + dt * 100;
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

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class LightingController extends NodeScript {
    @Override public void onReady() {
        long sun = core.find("Sun");
        core.set(sun, "brightness", "0.2");
        core.set(sun, "color_r", "1");
        core.set(sun, "color_g", "0.2");
        core.set(sun, "color_b", "0.1");
    }

    @Override public void onProcess(double dt) {
        long[] envs = core.findNodesByType("WorldEnvironment");
        if (envs.length > 0) {
            long env = envs[0];
            double ticks = core.getNumber(env, "time_ticks", 6000) + dt * 100;
            if (ticks > 24000) ticks -= 24000;
            core.setNumber(env, "time_ticks", ticks);
        }
    }
}
```
````
## Shadow Casting

Spot and omni lights can cast shadows. The engine supports two shadow systems:

### Veil Voxel Occlusion (block-based, built-in)

Set `occluded` to `true` on an OmniLight3D or SpotLight3D to enable Veil's voxel-based shadow occlusion. This uses Minecraft's block grid and works without configuration — but only block geometry blocks light. Meshes and CSG nodes are invisible to it.

```json
{
  "type": "OmniLight3D",
  "properties": {
    "radius": "12",
    "brightness": "2.0",
    "occluded": "true"
  }
}
```

### Moud Shadow Maps (mesh + CSG, for spot lights)

Set `cast_shadows` to `true` on a SpotLight3D to enable shadow map rendering. The engine renders a depth map from the light's POV into a shared 2048×2048 atlas (up to 4 casters simultaneously: 2 near-priority at 1024×1024 and 2 far-priority at 512×512, auto-assigned by camera distance). Mesh, Sprite3D, CSGBox, and CSGBlock geometry all cast shadows and any of those plus PBR-shaded surfaces receive them.

```json
{
  "type": "SpotLight3D",
  "properties": {
    "angle": "30",
    "distance": "18",
    "brightness": "3.0",
    "cast_shadows": "true"
  }
}
```

`cast_shadows` on OmniLight3D is declared but not yet rendered — cube shadow maps are planned.

**Optimization — static/dynamic caching:** the engine caches the static-scene depth per tile and only redraws dynamic casters each frame. A caster counts as dynamic if it (or any ancestor) has `script`, `client_script`, `@runtime`, `@transient`, `player_controlled`, `script_controlled`, `physics_body`, a non-zero `velocity_x`, is a `CharacterBody3D` / `RigidBody3D` / `KinematicBody3D` / `PlayerAttachment` / `Particle3D` / `AnimatedSprite3D`, or has any entry in `ClientPropertyOverrides`. Everything else is static and contributes to the cache until the scene revision changes.

## Volumetric Scatter (post-process)

Point, spot, and directional light data is exposed to every post-process shader via uniforms:

```glsl
struct MoudPointLight { vec3 position; vec3 color; float brightness; float radius; };
struct MoudDirLight   { vec3 direction; vec3 color; float brightness; };
struct MoudSpotLight  { vec3 position; vec3 direction; vec3 color; float brightness; float angle; float distance; };

uniform int NumPointLights;
uniform MoudPointLight PointLights[16];
uniform int NumDirLights;
uniform MoudDirLight DirLights[4];
uniform int NumSpotLights;
uniform MoudSpotLight SpotLights[8];

uniform mat4 moud_viewProj;
uniform mat4 moud_invViewProj;
uniform vec3 moud_cameraPos;
```

With these, a post-process shader can raymarch the view ray and accumulate in-scattering per light. The bundled example `volumetric.moudshader` does this with Henyey-Greenstein phase scattering and cone gating for spot lights. Register it from script:

```lua
PostProcess:registerShaderPriority("volumetric", "res://shaders/volumetric.moudshader", 40)
PostProcess:setUniform1("volumetric", "density", 0.08)
PostProcess:setUniform1("volumetric", "scatterAnisotropy", 0.55)
PostProcess:setUniform1("volumetric", "stepCount", 48.0)
PostProcess:setUniform1("volumetric", "maxDistance", 64.0)
```
