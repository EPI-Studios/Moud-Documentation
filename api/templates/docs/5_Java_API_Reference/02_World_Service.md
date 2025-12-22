# World (services + DSL)

Moud exposes “world-ish” things to Java plugins in two layers:

1. **`WorldService`** (`context().world()`): time controls + create displays/text.
2. **`WorldDsl`** (`world()` in `Plugin`): convenience layer that also helps you spawn models and lights.

This page documents the DSL because that’s what you use 90% of the time.

## Method Summary
| Method | Signature | Description |
| --- | --- | --- |
| `time` (getter) | `long time()` | Read current world time. |
| `time` (setter) | `WorldDsl time(long time)` | Set world time. |
| `timeRate` (getter) | `int timeRate()` | Read time rate multiplier. |
| `timeRate` (setter) | `WorldDsl timeRate(int rate)` | Set time rate multiplier. |
| `timeSyncTicks` (getter) | `int timeSyncTicks()` | Read time sync tick interval. |
| `timeSyncTicks` (setter) | `WorldDsl timeSyncTicks(int ticks)` | Set time sync tick interval. |
| `spawn` | `ModelBuilder spawn(ModelData modelData)` | Spawn a model from explicit `ModelData` (recommended). |
| `spawn` | `ModelBuilder spawn(String modelId)` | Spawn by id *only if you registered the `ModelData` first*. |
| `light` | `LightBuilder light()` | Begin constructing a point light. |
| `display` | `DisplayHandle display(DisplayOptions options)` | Create a media display (image/video/frames). |
| `text` | `TextHandle text(TextOptions options)` | Create floating text. |

### ModelBuilder
| Method | Signature | Description |
| --- | --- | --- |
| `at` | `ModelBuilder at(double x, double y, double z)` / `at(Vector3 position)` | Set spawn position. |
| `scale` | `ModelBuilder scale(float uniform)` / `scale(Vector3 scale)` | Set scale. |
| `rotation` | `ModelBuilder rotation(double pitch, double yaw, double roll)` | Apply Euler rotation in degrees. |
| `texture` | `ModelBuilder texture(String texturePath)` | Override model texture. |
| `physics` | `ModelBuilder physics(Vector3 halfExtents, float mass, Vector3 initialVelocity)` | Attach dynamic physics body if supported. |
| `build` | `GameObject build()` | Spawn the model and return a game object handle. |

### LightBuilder
| Method | Signature | Description |
| --- | --- | --- |
| `point` | `LightBuilder point()` | Configure as point light (default). |
| `at` | `LightBuilder at(double x, double y, double z)` / `at(Vector3 position)` | Set light position. |
| `color` | `LightBuilder color(float r, float g, float b)` | Set RGB color. |
| `radius` | `LightBuilder radius(float radius)` | Set influence radius. |
| `brightness` | `LightBuilder brightness(float brightness)` | Set brightness/intensity multiplier. |
| `create` | `Light create()` | Create the light and return a handle. |

---

## 1) The most important gotcha: `spawn(String)` is an id lookup

`WorldDsl.spawn(String)` looks up a previously registered `ModelData` from `ModelService`.
If you never registered that id, you may get the wrong model (it can fall back to defaults).

Recommended patterns:

- Use `spawn(ModelData)` when you have a model path and want predictable behavior.
- Or register your model data first (`registerModelData(...)`) and then spawn by id.

---

## 2) Detailed Member

### time (getter)
- **Signature**: `long time()`
- **Parameters**: None.
- **Returns**: Current world time.
- **Description**: Reads the server world time tick value.

### time (setter)
- **Signature**: `WorldDsl time(long time)`
- **Parameters**: `time` - world time value to set.
- **Returns**: `WorldDsl` (for chaining).
- **Description**: Sets server world time immediately.

### timeRate (getter)
- **Signature**: `int timeRate()`
- **Parameters**: None.
- **Returns**: Current time rate multiplier.
- **Description**: Reads tick rate scaling applied to world time progression.

### timeRate (setter)
- **Signature**: `WorldDsl timeRate(int rate)`
- **Parameters**: `rate` - multiplier for time progression.
- **Returns**: `WorldDsl`.
- **Description**: Adjusts how quickly time advances on the server.

### timeSyncTicks (getter)
- **Signature**: `int timeSyncTicks()`
- **Parameters**: None.
- **Returns**: Tick interval for time synchronization.
- **Description**: Controls how frequently time sync packets are sent.

### timeSyncTicks (setter)
- **Signature**: `WorldDsl timeSyncTicks(int ticks)`
- **Parameters**: `ticks` - tick interval.
- **Returns**: `WorldDsl`.
- **Description**: Sets the sync interval for world time updates.

### spawn
- **Signature**: `ModelBuilder spawn(ModelData modelData)` / `ModelBuilder spawn(String modelId)`
- **Parameters**:
  - `modelData` - explicit model/texture info (recommended).
  - `modelId` - id of a previously registered `ModelData` in `ModelService`.
- **Returns**: `ModelBuilder`.
- **Description**: Starts a fluent builder to configure position, scale, rotation, texture, and physics before spawning a model-backed `GameObject`. Prefer `spawn(ModelData)` unless you have already registered the id.

### ModelBuilder.at
- **Signature**: `ModelBuilder at(double x, double y, double z)` / `ModelBuilder at(Vector3 position)`
- **Parameters**: Coordinates or `Vector3` position.
- **Returns**: `ModelBuilder`.
- **Description**: Sets the spawn location of the model instance.

### ModelBuilder.scale
- **Signature**: `ModelBuilder scale(float uniform)` / `ModelBuilder scale(Vector3 scale)`
- **Parameters**: Uniform scale or axis-aligned scale vector.
- **Returns**: `ModelBuilder`.
- **Description**: Applies scaling prior to spawn.

### ModelBuilder.rotation
- **Signature**: `ModelBuilder rotation(double pitch, double yaw, double roll)`
- **Parameters**: Euler angles in degrees.
- **Returns**: `ModelBuilder`.
- **Description**: Applies rotation using `Quaternion.fromEuler`.

### ModelBuilder.texture
- **Signature**: `ModelBuilder texture(String texturePath)`
- **Parameters**: `texturePath` - override texture asset path.
- **Returns**: `ModelBuilder`.
- **Description**: Overrides the default texture for this instance.

### ModelBuilder.physics
- **Signature**: `ModelBuilder physics(Vector3 halfExtents, float mass, Vector3 initialVelocity)`
- **Parameters**:
  - `halfExtents` - collider half-size for box body.
  - `mass` - mass for dynamic body.
  - `initialVelocity` - starting velocity.
- **Returns**: `ModelBuilder`.
- **Description**: Attaches a dynamic physics body via `PhysicsController` if available on the server.

### ModelBuilder.build
- **Signature**: `GameObject build()`
- **Parameters**: None.
- **Returns**: `GameObject` handle.
- **Description**: Spawns the model and attaches physics if configured and supported. Returns a wrapper to move/scale/remove later.

### light
- **Signature**: `LightBuilder light()`
- **Parameters**: None.
- **Returns**: `LightBuilder`.
- **Description**: Starts a builder for point lights.

### LightBuilder.point
- **Signature**: `LightBuilder point()`
- **Parameters**: None.
- **Returns**: `LightBuilder`.
- **Description**: Explicitly configures the light as a point light (default).

### LightBuilder.at
- **Signature**: `LightBuilder at(double x, double y, double z)` / `LightBuilder at(Vector3 position)`
- **Parameters**: Coordinates or `Vector3` position.
- **Returns**: `LightBuilder`.
- **Description**: Sets the light position.

### LightBuilder.color
- **Signature**: `LightBuilder color(float r, float g, float b)`
- **Parameters**: `r`, `g`, `b` - RGB components.
- **Returns**: `LightBuilder`.
- **Description**: Sets light color.

### LightBuilder.radius
- **Signature**: `LightBuilder radius(float radius)`
- **Parameters**: `radius` - influence radius.
- **Returns**: `LightBuilder`.
- **Description**: Sets how far the light reaches.

### LightBuilder.brightness
- **Signature**: `LightBuilder brightness(float brightness)`
- **Parameters**: `brightness` - intensity multiplier.
- **Returns**: `LightBuilder`.
- **Description**: Sets light intensity.

### LightBuilder.create
- **Signature**: `Light create()`
- **Parameters**: None.
- **Returns**: `Light` handle (wraps `LightHandle`).
- **Description**: Creates the light in the world and returns a controllable handle.

## Example
```java
public final class WorldExample extends Plugin {
    private GameObject model;
    private Light light;

    @Override
    protected void onEnable() {
        // set time and rate
        world().time(6000).timeRate(1);

        // spawn a model with physics (recommended: explicit ModelData)
        model = world().spawn(new ModelData("moud:models/capsule.obj", ""))
                .at(0, 70, 0)
                .scale(1.25f)
                .rotation(0, 45, 0)
                .physics(new Vector3(0.5f, 1.0f, 0.5f), 8f, Vector3.zero())
                .build();

        // create a point light above the model
        light = world().light()
                .point()
                .at(0, 73, 0)
                .color(1.0f, 0.8f, 0.6f)
                .radius(25f)
                .brightness(2.0f)
                .create();
    }

    @Override
    public void onDisable() {
        if (model != null) model.remove();
        if (light != null) light.remove();
    }
}
```
