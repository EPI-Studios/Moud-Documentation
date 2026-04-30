# Motion smoothing

The Moud engine operates on a fixed server tick rate (default 20 Hz). To prevent visual stuttering on clients rendering at higher framerates, the engine automatically interpolates structural transform properties (`x`, `y`, `z`, `rx`, `ry`, `rz`, `sx`, `sy`, `sz`).

Motion smoothing is enabled by default for all nodes. The engine provides specific methods to control interpolation behavior, evaluate procedural tweens, or render cosmetic offsets.

---

## Evaluation methods

Select the appropriate motion evaluation method based on the node's required behavior within the simulation:

| Method | Description |
|---|---|
| Per-node interpolation | Default behavior. Smooths server-authoritative transform updates based on a defined buffer and easing mode. |
| Tween | Procedural client-side animation for predefined motion (e.g., transitioning coordinates over a specific duration). |
| Visual offset | Purely cosmetic rendering transformations. Does not alter the node's authoritative position or physics bounds. |
| Replicated RPC | *(Planned)* Input-driven action with instant client prediction and server reconciliation. |

---

## Per-node interpolation

Every node contains properties governing how the client interpolates replicated transform updates. By default, nodes utilize `slerp` interpolation with a 50 ms delay buffer.

### Configuration properties

| Property | Type | Default | Description |
|---|---|---|---|
| `@interp_mode` | string | `"slerp"` | The mathematical interpolation algorithm (`"snap"`, `"linear"`, `"slerp"`, `"hermite"`). |
| `@interp_lag_ms` | int | `50` | The render delay buffer in milliseconds (0–500). The client samples data from `current_time - interp_lag_ms`. |

```json
{
  "type": "CSGBox",
  "properties": {
    "@interp_mode": "slerp",
    "@interp_lag_ms": "100",
    "x": "0", "y": "5", "z": "0"
  }
}
```

### Interpolation modes

*   `snap`: Bypasses smoothing. Transforms immediately update to the latest snapshot. Recommended for precise deterministic rendering or retroactive styles.
*   `linear`: Computes a direct linear interpolation between buffered snapshots.
*   `slerp`: Computes spherical linear interpolation. Recommended default for standard translation and rotation.
*   `hermite`: Computes a cubic hermite spline. Provides smoother acceleration boundaries at the cost of slight CPU overhead.

*Note: Interpolation exclusively applies to transform parameters. Booleans, strings, and integers evaluate strictly as `snap`.*

---

## Tweens

Tweens define procedural, time-based animations for node properties. Executing a tween on the client replaces continuous server updates with a single configuration packet, reducing network bandwidth. 

While a tween executes, it overrides the default per-node interpolator for the targeted properties.

### API reference

```lua
tween:tween(nodeId, targets, durationSeconds, easing, loopMode)
tween:cancel(nodeId)                    -- Terminates all tweens on the specified node
tween:cancel(nodeId, propertyKey)       -- Terminates a specific property tween
tween:isTweening(nodeId)                -- Returns bool
tween:isTweening(nodeId, propertyKey)   -- Returns bool
```

The `targets` parameter requires a table of `{ propertyKey = endValue }` pairs. The tween calculates the delta from the property's current sampled value.

**Implementation example:**
```lua
function script:_enter_tree(api)
    self.baseY = api:getNumber("y", 0)
    tween:tween(self.id, { y = self.baseY + 0.18 }, 1.5, "sineInOut", "ping_pong")
end
```

### Easings

The `easing` parameter accepts standard Penner easing functions (formatted as `sineInOut` or `sine_in_out`):
`linear`, `sineIn`, `sineOut`, `sineInOut`, `quadIn`, `quadOut`, `quadInOut`, `cubicIn`, `cubicOut`, `cubicInOut`, `expoIn`, `expoOut`, `expoInOut`, `backIn`, `backOut`, `backInOut`, `elasticIn`, `elasticOut`, `elasticInOut`, `bounceIn`, `bounceOut`, `bounceInOut`.

### Loop modes

| Mode | Behavior |
|---|---|
| `once` | Executes the animation to the target values and terminates. |
| `loop` | Restarts the animation from the initial values upon reaching the target. |
| `ping_pong` | Alternates playing the animation forward and backward indefinitely. |

---

## Visual offsets

The visual offset registry applies additive or multiplicative transformations to a node's rendering output. 

Visual offsets are strictly cosmetic. They do not alter the node's underlying matrix, meaning physics colliders, raycasts, area triggers, and server snapshots remain unaffected.

### API reference

```lua
visual:setOffset(nodeId, dx, dy, dz)             -- Additive positional offset (world units)
visual:setRotation(nodeId, rxDeg, ryDeg, rzDeg)  -- Additive Euler rotational offset (degrees)
visual:setScale(nodeId, sxMul, syMul, szMul)     -- Multiplicative scale offset
visual:clear(nodeId)                             -- Reverts to identity transform
```

**Implementation example:**
```lua
function script:_enter_tree(api)
    self.t = 0
end

function script:onFrame(api, dt)
    self.t = self.t + dt
    visual:setOffset(self.id,
        math.sin(self.t * 0.45) * 0.05,
        math.sin(self.t * 0.6)  * 0.18,
        math.cos(self.t * 0.32) * 0.05)
end
```

---
