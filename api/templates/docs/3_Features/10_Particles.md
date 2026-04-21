**Particles**

`Particle3D` is a CPU-simulated, camera-billboarded particle emitter. Simulation and rendering run client-side; emitters are scene nodes, so their behavior is driven by properties and server scripts. Each emitter maintains a bounded pool of particles (capped by `max_particles`, hard-limited to 1,000,000 per emitter).

Emitters are **distance-culled** at 96 blocks and **frustum-culled** against their `cull_radius` AABB — out-of-view emitters clear their state and stop simulating. Beyond `lod_distance`, the emitter switches to a lower-detail mode: `rate` is multiplied by `lod_rate_scale` and per-particle `size` by `lod_size_scale`.

For runtime control from scripts (spawn bursts, toggle, move, override rate/lifetime), see [Particles scripting](/4_Scripting/13_Particles).

---

## Emitter

| Property | Type | Default | Description |
|---|---|---|---|
| `emitting` | bool | `true` | Master on/off switch. |
| `rate` | float | `20` | Particles per second when emitting continuously. |
| `max_particles` | int | `200` | Pool cap per emitter (hard cap: 1,000,000). |
| `lifetime` | float | `1.5` | Base particle lifetime (seconds). |
| `lifetime_variance` | float | `0.3` | Random ± range added to lifetime. |
| `local_space` | bool | `false` | If `true`, existing particles translate with the emitter when it moves. |
| `seed` | int | `0` | Deterministic seed (0 = time-based). |
| `one_shot` | bool | `false` | If `true`, fires a single burst at start then stops. |
| `burst_count` | int | `0` | Count used by `one_shot` and scripted bursts (0 = fall back to `rate`). |
| `prewarm` | float | `0` | Seconds of simulation performed on spawn so the effect starts pre-populated. |

---

## Shape

| Property | Type | Default | Description |
|---|---|---|---|
| `shape_type` | string | `point` | One of `point`, `sphere`, `box`, `disc`, `ring`, `cone`. |
| `shape_size` | float | `0` | Uniform half-extent / radius for the shape. |
| `shape_size_x` `shape_size_y` `shape_size_z` | float | — | Per-axis overrides for `box` / `disc` / `cone`. |
| `surface_emit` | bool | `false` | Emit on the shape's surface instead of throughout its volume. |
| `jitter_x` `jitter_y` `jitter_z` | float | `0` | Additional random offset applied at spawn. |

---

## Motion

| Property | Type | Default | Description |
|---|---|---|---|
| `velocity_x` `velocity_y` `velocity_z` | float | `0, 1, 0` | Base velocity vector. Its magnitude sets the initial speed. |
| `velocity_random` | float | `0.5` | Random ± speed added on top of the base magnitude. |
| `spread` | float | `30` | Cone half-angle in degrees (0 = colinear, 180 = omni-directional). |
| `gravity` | float | `-2.0` | Constant acceleration on Y (world units / s²). |
| `damping` | float | `0` | Exponential velocity decay coefficient. |
| `wind_x` `wind_y` `wind_z` | float | `0` | Constant force added each step. |
| `turbulence_strength` | float | `0` | Curl-noise force magnitude. |
| `turbulence_scale` | float | `1.0` | Spatial frequency of the noise. |
| `turbulence_speed` | float | `1.0` | Temporal frequency of the noise. |
| `inherit_velocity` | float | `0` | 0–1 fraction of the emitter's own motion velocity added to new particles. Useful for moving emitters (projectiles). |

---

## Collision

| Property | Type | Default | Description |
|---|---|---|---|
| `collision` | bool | `false` | Enables collision resolution against vanilla blocks **and** the client physics world (CSGBox / CSGBlock / convex-hull geometry uploaded by the server). |
| `bounce` | float | `0.3` | Restitution on impact (0–1). |
| `collision_friction` | float | `0.5` | Tangential velocity damping on impact (0–1). |

Blocks use a fast axis-dominant voxel resolve. Non-block geometry is resolved via a swept sphere cast against the Jolt static world, which reflects velocity along the true surface normal — meaning particles bounce correctly off rotated CSG boxes and arbitrary mesh hulls, not just axis-aligned cubes.

---

## Appearance

| Property | Type | Default | Description |
|---|---|---|---|
| `texture` | string | `moud:dynamic/white` | Texture / sprite sheet identifier. |
| `size_start` `size_end` | float | `0.3`, `0` | Per-particle size at spawn / death (linear interp). |
| `size_curve` | curve | — | Multiplier applied on top of the start→end size. Format: `t:v\|t:v\|…` with `t` in 0–1. |
| `color_start_r` `..._g` `..._b` `..._a` | float | `1,1,1,1` | Start color (0–1 per channel). |
| `color_end_r` `..._g` `..._b` `..._a` | float | `1,1,1,0` | End color. |
| `alpha_curve` | curve | — | If set, overrides the start→end alpha lerp. |
| `billboard_mode` | string | `camera` | `camera`, `velocity` (stretched along motion), `y_axis` (vertical billboard), `world`. |
| `stretch_scale` | float | `1.0` | Length multiplier when `billboard_mode = velocity`. |
| `unlit` | bool | `false` | If `true`, uses full-bright lightmap (ignores world light). |
| `additive` | bool | `false` | Additive blending (fire, magic, sparks). |
| `soft_particles` | bool | `false` | Fades alpha near solid geometry based on voxel proximity. |
| `soft_fade_distance` | float | `0.5` | Fade begins within this many blocks of a solid. |
| `distortion` | bool | `false` | Enables the heat-haze render path. Requires a Veil distortion shader to produce real screen-space perturbation; without one, the flag acts as an alpha modulator gated by `distortion_strength`. |
| `distortion_strength` | float | `0.3` | Distortion intensity (0–1). |

---

## Rotation

| Property | Type | Default | Description |
|---|---|---|---|
| `rotation_start` | float | `0` | Base initial rotation (radians). |
| `rotation_variance` | float | `0` | Random ± added to initial rotation. |
| `angular_velocity` | float | `0` | Constant rotation rate (rad/s). |
| `angular_variance` | float | `0` | Random ± added to angular velocity. |

Rotation applies to `camera`, `y_axis`, and `world` billboard modes. Ignored under `velocity` (orientation is derived from the motion vector).

---

## Animation (flipbook)

| Property | Type | Default | Description |
|---|---|---|---|
| `hframes` | int | `1` | Columns in the sprite sheet. |
| `vframes` | int | `1` | Rows. |
| `frame_count` | int | `0` | Number of frames to play (0 = `hframes × vframes`). |
| `frame_fps` | float | `0` | If > 0, plays at a fixed FPS. Otherwise frames are distributed across the particle lifetime. |
| `frame_start` | int | `0` | Offset into the frame sequence. |
| `frame_random_start` | bool | `false` | Randomizes the start frame per particle. |

---

## Sub-emitters

When a particle dies, it can spawn child particles at its death position. Children do **not** themselves sub-emit (no cascades). The total (live + pending) is always capped by `max_particles`.

| Property | Type | Default | Description |
|---|---|---|---|
| `sub_emit_count` | int | `0` | Children spawned per dying particle. |
| `sub_emit_lifetime` | float | `0.5` | Lifetime of children. |
| `sub_emit_speed` | float | `1.0` | Random ± speed added to children. |
| `sub_emit_size` | float | `0.1` | Starting size of children. |
| `sub_emit_inherit_velocity` | bool | `true` | If `true`, children start with the dying particle's velocity. |

---

## Performance

| Property | Type | Default | Description |
|---|---|---|---|
| `lod_distance` | float | `32` | Camera distance beyond which low-detail mode kicks in. |
| `lod_rate_scale` | float | `0.5` | Rate multiplier in low-detail mode. |
| `lod_size_scale` | float | `1.5` | Per-particle size multiplier in low-detail mode (compensates for reduced density). |
| `cull_radius` | float | `8` | Frustum-cull AABB half-extent around the emitter. |

Runtime notes:

- Emitter configuration is parsed at most every 250 ms (and instantly when the scene snapshot changes), so editing a property in the editor propagates quickly while playback avoids per-frame allocations.
- Simulation advances at a fixed 30 Hz timestep, capped at 2 substeps per frame.
- Collision uses a single voxel probe per step with axis-dominant resolution. Grounded particles zero-out vertical velocity at low |vy|.
