# Client scripts 

Client scripts execute locally on the player's client rather than the authoritative server. They evaluate logic per render frame (tied to the client's framerate), providing local input evaluation, procedural animation, and physics prediction without network round-trip latency.

---

## Technical behavior

Client scripts operate outside the server environment. They cannot modify authoritative game state, instantiate nodes, or dispatch network events. They are strictly for local prediction and presentation. 

A single scene node can concurrently execute both a server script and a client script. The server script evaluates authoritative logic at the server tick rate (20 Hz), while the client script manages local prediction and visual interpolation. If the client prediction diverges from the server, the server resolves the discrepancy by forcing coordinate corrections via synchronization packets.

| Implementation | Execution environment | Notes |
|---|---|---|
| Physics prediction | Client | Evaluates kinematic response instantly, bypassing server tick limits. |
| Procedural bone animation | Client | Evaluates per render frame for continuous visual interpolation. |
| Instant visual feedback | Client | Modifies render state locally prior to server validation. |
| Authoritative movement | Server | Synchronizes position and prevents client-side manipulation. |

---

## Initialization and lifecycle

Assigning a valid file path to a node's `client_script` property initializes the client scripting runtime for that node. The client monitors this property; if the path is modified during an active session, the engine disposes of the current execution context and loads the new script.

Client scripts are currently authored exclusively in Luau and require a standardized structural lifecycle:

```lua
local script = {}

function script.onReady()
    -- Executes once upon script initialization.
end

function script.onFrame(dt)
    -- Executes every render frame.
    -- dt: Elapsed time in seconds since the previous frame.
end

function script.onDispose()
    -- Executes immediately before the script context is destroyed.
end

return script
```

---

## Environment globals

The client execution context injects specific global API objects into the script prior to `onReady` execution.

| Global | Type | Description |
|--------|------|-------------|
| `node` | `NodeApi` | Read-only access to the node's server-synchronized snapshot state. |
| `input` | `InputApi` | Local hardware state evaluation. |
| `body` | `BodyApi` | Physics integration parameters (`CharacterBody3D` nodes only). |
| `timer` | `TimerApi` | Frame-synchronized countdown timers. |
| `anim` | `AnimApi` | Skeletal animation and procedural bone manipulation. |
| `render` | `RenderApi` | Single-frame visual property overrides. |
| `PostProcess` | `PostProcessApi` | Fullscreen fragment-shader registration. |

---

## node (`NodeApi`)

Provides read-only access to the node's server-replicated state.

*Note: Snapshot data evaluates at the server tick rate (20 Hz). Methods such as `node:getX()` return the coordinate from the last received server tick, not the interpolated render frame position.*

| Method | Returns | Description |
|--------|---------|-------------|
| `node:getId()` | `number` | The node's unique numerical identifier. |
| `node:getType()` | `string` | The node's class string (e.g., `"CharacterBody3D"`). |
| `node:getName()` | `string` | The node's string identifier in the scene tree. |
| `node:getProperty(key)` | `string` | Evaluates a specific property from the server snapshot. |
| `node:getX()` | `number` | Absolute world X position from the snapshot. |
| `node:getY()` | `number` | Absolute world Y position from the snapshot. |
| `node:getZ()` | `number` | Absolute world Z position from the snapshot. |

---

## input (`InputApi`)

Evaluates local hardware input states for the current render frame. Valid key indices are: `"jump"`, `"sprint"`, `"sneak"`, `"forward"`, `"back"`, `"left"`, `"right"`.

| Method | Returns | Description |
|--------|---------|-------------|
| `input:isDown(key)` | `boolean` | Evaluates if the key is currently held. |
| `input:isPressed(key)` | `boolean` | Evaluates if the key transitioned to a held state this frame. |
| `input:isReleased(key)` | `boolean` | Evaluates if the key transitioned to a released state this frame. |
| `input:moveAxis()` | `number, number` | Returns the normalized movement vector as `(x, z)`. |
| `input:cursorPos()` | `number, number` | Returns screen cursor coordinates in pixels as `(x, y)`. |

---

## body (`BodyApi`)

Evaluates and modifies properties on the character physics integrator. This API is exclusively available to `CharacterBody3D` nodes; calling these methods on other node classes executes a no-op.

The local physics substep consumes values written via `BodyApi` immediately following the render frame.

### State evaluation

| Method | Returns | Description |
|-----|---|-------------|
| `body:getBoolean("on_floor")` | `boolean` | Evaluates if the body is resting on a surface. |
| `body:getBoolean("on_wall")` | `boolean` | Evaluates if the body is intersecting a wall normal. |
| `body:getBoolean("on_ceiling")`| `boolean` | Evaluates if the body is intersecting a ceiling normal. |
| `body:getBoolean("just_left_floor")` | `boolean` | Evaluates if the body departed the floor plane this frame. |
| `body:getBoolean("just_landed")` | `boolean` | Evaluates if the body intersected the floor plane this frame. |

### Kinematic properties

| Property Key | Type | Description |
|-----|---|-------------|
| `"velocity_x/y/z"` | `number` | The active velocity vector in blocks per second. |
| `"speed"` | `number` | The target horizontal velocity maximum. |
| `"acceleration"` | `number` | The ground-state velocity acceleration scalar. |
| `"deceleration"` | `number` | The ground-state velocity deceleration scalar when input = 0. |
| `"ground_friction"` | `number` | The friction scalar applied during idle ground states. |
| `"air_control"` | `number` | The horizontal input responsiveness scalar while airborne (0.0–1.0). |
| `"jump_velocity"` | `number` | The upward velocity scalar applied during a jump request. |
| `"gravity_scale"` | `number` | The gravity multiplier applied to the body (`1.0` = standard). |
| `"wall_normal_x/z"` | `number` | The normal vector of the currently intersected wall (read-only). |

### Kinematic actions

| Method | Description |
|-----|-------------|
| `body:setBoolean("jump_requested", true)` | Queues a jump evaluation for the current physics substep. |

### Client visibility overrides

Modifies the rendering state of the local player's `CharacterBody3D` mesh. These methods evaluate strictly on the local renderer and do not replicate state to the server. Valid part indices are: `head`, `hat`, `body`, `right_arm`, `left_arm`, `right_leg`, `left_leg`, `jacket`, `right_sleeve`, `left_sleeve`, `right_pants`, `left_pants`, `cloak`.

| Method | Description |
|--------|-------------|
| `body:setVisible(visible)` | Toggles rendering for the entire body hierarchy. |
| `body:isVisible()` | Returns the global body visibility state. |
| `body:setPartVisible(part, visible)` | Toggles rendering for a designated sub-mesh. |
| `body:isPartVisible(part)` | Returns the visibility state of a designated sub-mesh. |

---

## timer (`TimerApi`)

Instantiates and evaluates frame-synchronized countdown timers. Timers are utilized for time-window operations such as input buffering or physics tolerances (e.g., coyote time).

| Method | Description |
|--------|-------------|
| `timer:start(id, duration)` | Initializes a timer with the specified identifier and duration (in seconds). |
| `timer:cancel(id)` | Terminates an active timer immediately. |
| `timer:isActive(id)` | Evaluates if the specified timer is currently active. |
| `timer:elapsed(id)` | Returns the seconds elapsed since timer initialization (`0` if inactive). |

---

## anim (`AnimApi`)

Interfaces with the PlayerAnimationLibrary (PAL) to execute skeletal animations and procedural bone transformations. Positional coordinates evaluate in 1/16-unit scale (pixels). Rotational coordinates evaluate in radians.

### Playback

| Method | Description |
|--------|-------------|
| `anim:play(layer, animName)` | Executes an animation sequence immediately. |
| `anim:playWithFade(layer, animName, fadeSecs)` | Interpolates into an animation sequence over the specified duration. |
| `anim:stop(layer)` | Terminates the active animation on the specified layer. |
| `anim:isPlaying(layer)` | Evaluates if the specified layer is actively playing a sequence. |

### Bone transforms

Valid bone indices are: `"head"`, `"right_arm"`, `"left_arm"`, `"right_item"`, `"left_item"`, `"right_leg"`, `"left_leg"`.

| Method | Description |
|--------|-------------|
| `anim:getBonePos(name)` | Returns the current bone positional vector as `(x, y, z)`. |
| `anim:getBoneRot(name)` | Returns the current bone rotational vector as `(x, y, z)`. |
| `anim:setBonePos(name, x, y, z)` | Overrides the bone positional vector for the current frame. |
| `anim:setBoneRot(name, x, y, z)` | Overrides the bone rotational vector for the current frame. |
| `anim:resetBone(name)` | Clears overrides and restores the bone to its animation-driven transform. |

---

## render (`RenderApi`)

Applies visual property overrides for the duration of the current render frame. Overrides must be applied continuously within `onFrame` to persist.

*Note: Uniform definitions utilizing `render:setUniform` must adopt the `param_*` prefix convention, mirroring server-side node properties (e.g., `param_glow_intensity`).*

| Method | Description |
|--------|-------------|
| `render:setUniform(nodeId, key, value)` | Assigns a float value to a shader uniform. |
| `render:setUniformVec(nodeId, key, x, y, z, w)` | Assigns a vec4 value to a shader uniform. |
| `render:setMaterialParam(nodeId, paramName, value)` | Modifies a specific material configuration parameter. |
| `render:setTint(nodeId, r, g, b, a)` | Applies a linear color multiplier to the designated node (0.0–1.0). |
| `render:setVisible(nodeId, visible)` | Modifies the node's local visibility state. |

---

## Implementation examples

### Input-driven visual state

Evaluates hardware input to modify the local tint color of a node, executing prior to server validation.

```lua
local script = {}

function script.onFrame(dt)
    local active = input:isDown("sneak")

    if active then
        render:setTint(node:getId(), 1.0, 0.3, 0.3, 1.0)
    else
        render:setTint(node:getId(), 1.0, 1.0, 1.0, 1.0)
    end
end

return script
```

### Procedural bone transforms

Evaluates directional input to compute an additive rotational offset for the player's head bone.

```lua
local script = {}
local leanSmoothed = 0.0

function script.onFrame(dt)
    local mx, _ = input:moveAxis()
    local targetLean = mx * -0.3
    
    local speed = 8.0
    leanSmoothed = leanSmoothed + (targetLean - leanSmoothed) * math.min(1.0, dt * speed)
    
    anim:setBoneRot("head", 0, 0, leanSmoothed)
end

return script
```