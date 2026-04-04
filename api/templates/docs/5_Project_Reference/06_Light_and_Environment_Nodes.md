# Light and Environment Nodes

Nodes that control how the scene is lit and what the sky looks like.

## DirectionalLight3D

A sun. Shines in one direction across the whole scene. Position does not matter, only rotation.

| Property | Type | Default | Description |
|---|---|---|---|
| `rx`, `ry`, `rz` | float | 0 | Light direction |
| `brightness` | float | 1 | Intensity |
| `color_r/g/b` | float | 1 | Light color (0 to 1) |
| `enabled` | bool | true | On or off |

Tip: `rx` around 105 to 130 gives a natural sun angle.

## OmniLight3D

A point light. Shines in all directions from where it's placed. Good for torches, lamps, and glowing things.

| Property | Type | Default | Description |
|---|---|---|---|
| `x`, `y`, `z` | float | 0 | Position |
| `radius` | float | 10 | How far the light reaches |
| `brightness` | float | 1 | Intensity |
| `color_r/g/b` | float | 1 | Light color |
| `enabled` | bool | true | On or off |

## SpotLight3D

A cone of light. Good for flashlights, spotlights, and stage lighting.

| Property | Type | Default | Description |
|---|---|---|---|
| `x`, `y`, `z` | float | 0 | Position |
| `rx`, `ry`, `rz` | float | 0 | Direction |
| `angle` | float | 45 | Cone width in degrees |
| `distance` | float | 10 | How far it reaches |
| `brightness` | float | 1 | Intensity |
| `color_r/g/b` | float | 1 | Light color |
| `enabled` | bool | true | On or off |

## AudioPlayer2D

Non-positional audio. The volume is the same no matter where the player is. Use it for music, UI sounds, and narration.

| Property | Type | Description |
|---|---|---|
| `sound_id` | string | Audio asset path |
| `playing` | bool | Whether it's playing |
| `loop` | bool | Loop when it ends |
| `volume_db` | float | Volume (0 = normal, negative = quieter) |
| `pitch_scale` | float | Playback speed (1 = normal) |
| `category` | string | Mix category like `music`, `sfx`, `ambient` |

## AudioPlayer3D

Positional 3D audio. Gets louder when the player is close and quieter when far away. Same properties as `AudioPlayer2D` plus the 3D transform (`x`, `y`, `z`).

## WorldEnvironment

Controls the sky, fog, weather, time of day, and ambient light for the scene. You should have one of these per scene.

| Property | Type | Description |
|---|---|---|
| `time_enabled` | bool | Enable time of day progression |
| `time_ticks` | int | Current time (0 to 24000, 6000 = noon) |
| `ambient_light` | float | Global ambient brightness (0 to 1) |
| `weather` | string | Weather preset like `clear` |
| `fog_enabled` | bool | Turn on distance fog |
| `fog_density` | float | How thick the fog is |
| `fog_color_r/g/b` | float | Fog color |
| `sky_mode` | string | `vanilla` or `custom` |
| `sky_shader` | string | Custom sky shader path |
| `sky_material` | string | Custom sky material path |
| `sky_color_top_r/g/b` | float | Sky color at the top |
| `sky_color_horizon_r/g/b` | float | Sky color at the horizon |
| `sky_color_sunrise_r/g/b` | float | Sunrise tint color |
| `sky_color_sunrise_strength` | float | How strong the sunrise tint is |
| `clouds_mode` | string | `vanilla` or custom |
| `cloud_height` | float | How high clouds are |
| `cloud_speed` | float | How fast clouds move |
| `cloud_scale` | float | Cloud texture size |
| `cloud_offset_x/z` | float | Cloud position |
