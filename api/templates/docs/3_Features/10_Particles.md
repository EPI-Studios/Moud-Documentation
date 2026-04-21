# Particle3D

The `Particle3D` node evaluates a CPU-simulated, camera-facing (billboarded) particle emitter. Simulation and rendering execute locally on the client, while emitter state and spatial transforms are driven by scene properties and server-side property replication.

---

## Technical behavior

### Memory allocation
Each `Particle3D` node allocates a bounded instance pool dictated by the `max_particles` property. The client engine enforces a hard limit of 1,000,000 simultaneous particles per emitter.

### Culling optimization
To maintain render performance, the pipeline subjects active emitters to automatic spatial culling constraints:

*   **Distance culling:** Emitters located beyond a 96-unit radius from the active camera are culled.
*   **Frustum culling:** Emitters are evaluated against an Axis-Aligned Bounding Box (AABB) derived from their `cull_radius` property. 

When an emitter fails either occlusion query, the client halts its simulation loop and flushes the active particle state from memory.

### Level of Detail (LOD)
When the spatial distance between the client camera and the emitter exceeds the `lod_distance` threshold, the node evaluates under a lower-detail heuristic:
*   The emission `rate` is multiplied by the `lod_rate_scale` factor.
*   The per-particle `size` is multiplied by the `lod_size_scale` factor.

---

## See Also

| Topic | Link |
|---|---|
| Runtime manipulation (bursts, state toggling, procedural overrides) | [Particles scripting](/4_Scripting/13_Particles) |
---

## Emitter properties

| Property | Type | Default | Description |
|---|---|---|---|
| `emitting` | bool | `true` | Determines whether the node actively spawns particles. |
| `rate` | float | `20` | Spawn rate in particles per second. |
| `max_particles` | int | `200` | Maximum simultaneous particles allowed for this node. |
| `lifetime` | float | `1.5` | Base duration a particle exists before despawning (in seconds). |
| `lifetime_variance` | float | `0.3` | Random deviation range applied to the base `lifetime`. |
| `local_space` | bool | `false` | If `true`, existing particles inherit the emitter's spatial translation after spawning. |
| `seed` | int | `0` | Deterministic random seed. A value of `0` uses time-based randomization. |
| `one_shot` | bool | `false` | If `true`, emits a single burst of particles upon activation and then stops. |
| `burst_count` | int | `0` | Quantity of particles spawned during `one_shot` mode or scripted bursts. If `0`, it defaults to the `rate` value. |
| `prewarm` | float | `0` | Duration (in seconds) of simulation calculated instantaneously upon node initialization to pre-populate the system. |

---

## Shape parameters

| Property | Type | Default | Description |
|---|---|---|---|
| `shape_type` | string | `point` | Defines the emission volume boundary. Valid types: `point`, `sphere`, `box`, `disc`, `ring`, `cone`. |
| `shape_size` | float | `0` | Uniform half-extent or radius applied to the shape boundary. |
| `shape_size_x/y/z` | float | N/A | Explicit axis dimension overrides for `box`, `disc`, or `cone` shapes. |
| `surface_emit` | bool | `false` | If `true`, restricts emission strictly to the outer perimeter of the defined shape volume. |
| `jitter_x/y/z` | float | `0` | Additional spatial offset randomized and applied to each particle at spawn. |

---

## Motion parameters

| Property | Type | Default | Description |
|---|---|---|---|
| `velocity_x/y/z` | float | `0, 1, 0` | Base velocity vector defining initial trajectory and speed. |
| `velocity_random` | float | `0.5` | Random deviation applied to the initial velocity magnitude. |
| `spread` | float | `30` | Emission cone half-angle in degrees (`0` = colinear, `180` = omni-directional). |
| `gravity` | float | `-2.0` | Constant Y-axis acceleration applied per step (units / s²). |
| `damping` | float | `0` | Exponential velocity decay coefficient. |
| `wind_x/y/z` | float | `0` | Constant directional force applied per step. |
| `turbulence_strength` | float | `0` | Magnitude of procedural curl-noise force. |
| `turbulence_scale` | float | `1.0` | Spatial frequency modifier for the turbulence noise field. |
| `turbulence_speed` | float | `1.0` | Temporal frequency modifier for the turbulence noise field. |
| `inherit_velocity` | float | `0` | Ratio (`0.0` to `1.0`) of the emitter's translation velocity applied to new particles. |

---

## Collision constraints

| Property | Type | Default | Description |
|---|---|---|---|
| `collision` | bool | `false` | Enables physical collision resolution against voxel geometry and convex hulls. |
| `bounce` | float | `0.3` | Restitution multiplier applied upon impact (`0.0` to `1.0`). |
| `collision_friction` | float | `0.5` | Tangential velocity damping multiplier applied upon impact (`0.0` to `1.0`). |

**Resolution logic:** Voxel block intersections use an axis-dominant evaluation probe. Intersections against non-block geometry use a swept-sphere cast against the Jolt static physics environment. This computes accurate reflection normals for rotated bounding boxes and arbitrary mesh surfaces. Grounded particles zero out their vertical velocity when moving slowly along the Y-axis.

---

## Appearance parameters

| Property | Type | Default | Description |
|---|---|---|---|
| `texture` | string | `moud:dynamic/white` | Target texture or sprite sheet file path. |
| `size_start` / `size_end` | float | `0.3`, `0` | Linear particle scale interpolation between spawn and despawn. |
| `size_curve` | curve | N/A | Non-linear scale multiplier applied over the lifetime. Formatted as `t:v|t:v` where `t` ranges from `0.0` to `1.0`. |
| `color_start_r/g/b/a` | float | `1,1,1,1` | RGBA color matrix at spawn (channels range `0.0` to `1.0`). |
| `color_end_r/g/b/a` | float | `1,1,1,0` | RGBA color matrix at despawn. |
| `alpha_curve` | curve | N/A | If assigned, overrides the linear alpha interpolation between start and end colors. |
| `billboard_mode` | string | `camera` | Mesh orientation behavior. Valid types: `camera`, `velocity` (aligns to motion vector), `y_axis` (constrained vertical rotation), `world` (no rotation). |
| `stretch_scale` | float | `1.0` | Axis multiplier applied exclusively when `billboard_mode` is set to `velocity`. |
| `unlit` | bool | `false` | If `true`, applies full ambient illumination, bypassing engine lighting. |
| `additive` | bool | `false` | Implements additive blend mode for emissive visual effects. |
| `soft_particles` | bool | `false` | Fades pixel alpha dynamically based on proximity to intersecting depth geometry. |
| `soft_fade_distance` | float | `0.5` | Spatial depth threshold at which `soft_particles` opacity blending begins. |
| `distortion` | bool | `false` | Enables the heat-haze render path. Requires a valid distortion shader; otherwise, it acts as an opacity modulator controlled by `distortion_strength`. |
| `distortion_strength` | float | `0.3` | Distortion magnitude multiplier (`0.0` to `1.0`). |

---

## Rotation parameters

Rotation constraints apply strictly to `camera`, `y_axis`, and `world` billboard modes. Rotation parameters are ignored under `velocity` mode.

| Property | Type | Default | Description |
|---|---|---|---|
| `rotation_start` | float | `0` | Base rotation assigned at spawn, measured in radians. |
| `rotation_variance` | float | `0` | Random deviation range applied to the initial rotation. |
| `angular_velocity` | float | `0` | Constant rotational rate applied per step (radians / second). |
| `angular_variance` | float | `0` | Random deviation applied to the base angular velocity. |

---

## Animation parameters

| Property | Type | Default | Description |
|---|---|---|---|
| `hframes` | int | `1` | Total column divisions on the assigned sprite sheet. |
| `vframes` | int | `1` | Total row divisions on the assigned sprite sheet. |
| `frame_count` | int | `0` | Total frames to play. If `0`, it defaults to `hframes × vframes`. |
| `frame_fps` | float | `0` | If > `0`, executes playback at fixed frames per second. If `0`, playback is normalized across the particle's `lifetime`. |
| `frame_start` | int | `0` | Starting index in the frame sequence. |
| `frame_random_start` | bool | `false` | If `true`, assigns a random starting frame index per particle. |

---

## Sub-emitters

When a particle despawns, it can spawn a localized group of secondary particles. The total number of generated particles (parents and children) cannot exceed the node's `max_particles` limit. Sub-emitters operate as a single generation. Child particles do not spawn additional particles.

| Property | Type | Default | Description |
|---|---|---|---|
| `sub_emit_count` | int | `0` | Quantity of child particles spawned per dying particle. |
| `sub_emit_lifetime` | float | `0.5` | Lifetime duration allocated to spawned children. |
| `sub_emit_speed` | float | `1.0` | Random deviation speed applied to spawned children. |
| `sub_emit_size` | float | `0.1` | Base scale allocated to spawned children. |
| `sub_emit_inherit_velocity`| bool | `true` | If `true`, child particles inherit the absolute velocity vector of the parent at the moment of despawn. |

---

## Performance parameters

| Property | Type | Default | Description |
|---|---|---|---|
| `lod_distance` | float | `32` | Distance threshold initiating LOD multiplier scaling. |
| `lod_rate_scale` | float | `0.5` | Multiplier applied to `rate` when beyond `lod_distance`. |
| `lod_size_scale` | float | `1.5` | Multiplier applied to particle `size_start` and `size_end` when beyond `lod_distance`. |
| `cull_radius` | float | `8` | Axis-aligned bounding box half-extent used for frustum culling. |