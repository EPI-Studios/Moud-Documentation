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
````