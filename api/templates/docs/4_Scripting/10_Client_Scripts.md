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
| `mouse` | `MouseApi` | Pointer state, OS cursor lock/visibility, and cursor raycasts into the Minecraft world. |
| `body` | `BodyApi` | Physics integration parameters (`CharacterBody3D` nodes only). |
| `timer` | `TimerApi` | Frame-synchronized countdown timers. |
| `anim` | `AnimApi` | Skeletal animation, procedural bone manipulation, and first-person view configuration. |
| `render` | `RenderApi` | Single-frame visual property overrides. |
| `camera` | `CameraApi` | Local camera control: position, yaw/pitch, FOV, look targets. |
| `msg` | `MessagingApi` | Client-side script messaging (send to server, receive on topic). |
| `playerstate` | `PlayerStateApi` | Persistent local-state strings sent back to the server for replication. |
| `playmode` | `PlayModeApi` | Loading screen and play-mode readiness queries. |
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

## mouse (`MouseApi`)

Evaluates pointer state, locks/unlocks the OS cursor, and casts rays from the cursor (or screen center) into the Minecraft world. Returned hit arrays contain the world-space position and the optional entity reference.

| Method | Returns | Description |
|--------|---------|-------------|
| `mouse:isLeftDown()` / `isRightDown()` / `isMiddleDown()` | `boolean` | Currently held state. |
| `mouse:isLeftPressed()` / `isRightPressed()` / `isMiddlePressed()` | `boolean` | Transitioned to held this frame. |
| `mouse:lock()` / `mouse:unlock()` |  | Lock the OS cursor to the window center, or release it. |
| `mouse:setVisible(visible)` |  | Toggle cursor visibility independently of lock state. |
| `mouse:isUnlocked()` / `mouse:isVisible()` | `boolean` | Query lock and visibility state. |
| `mouse:cursorPos()` | `float[]` | Cursor screen coordinates as `[x, y]` in pixels. |
| `mouse:viewportSize()` | `float[]` | Window size as `[width, height]`. |
| `mouse:rayFromCursor(maxDistance)` | `double[]` | Ray origin and direction as `[ox, oy, oz, dx, dy, dz]`, regardless of hit. |
| `mouse:raycastFromCursor(maxDistance)` | `double[]` | Casts a ray and returns `[x, y, z]` of the first hit, or empty if none. |
| `mouse:cursorHit(maxDistance)` / `cursorPoint(maxDistance)` | `double[]` | Synonyms for `raycastFromCursor`. |
| `mouse:cursorEntity(maxDistance)` | `string` | UUID of the entity intersected by the cursor ray, or `null`. |
| `mouse:isFrontView()` | `boolean` | True when the active camera is the first-person view. |

The cursor raycast traverses Minecraft's collision world (blocks and entities), so it correctly resolves picking through transparent blocks, partial blocks, and entity hitboxes.

---

## playerstate (`PlayerStateApi`)

Sends arbitrary local state strings back to the server for replication to other clients. The server stores the latest value per `(player, key)` and broadcasts updates as `PlayerClientState` messages, which other client scripts observe via `_on_client_state(playerUuid, key, value)`. Use this for things the server does not own such as animation triggers, chat indicators, or local UI flags.

| Method | Description |
|--------|-------------|
| `playerstate:set(key, value)` | Set a state value. Empty string clears the key. Keys are 32 chars max, matching `[a-z0-9._-]`. Values are 128 chars max. |
| `playerstate:get(key)` | Read the local cached value for the given key. Returns an empty string if unset. |
| `playerstate:clear(key)` | Equivalent to `set(key, "")`. |

A player has a hard cap of 16 keys at once. Writing a 17th distinct key is silently ignored unless one of the existing keys is cleared first.

---

## body (`BodyApi`)

Evaluates and modifies properties on the character physics integrator. This API is exclusively available to `CharacterBody3D` nodes; calling these methods on other node classes executes a no-op.

The local physics substep consumes values written via `BodyApi` immediately following the render frame.

### State and property access

`BodyApi` is typed: each kinematic field is read or written through a method matched to its scalar type. There is no generic `getBoolean` / `setBoolean`; `body:readBool` / `body:writeBool` apply to boolean keys, and `body:readFloat` / `body:writeFloat` apply to numeric keys. Calling the wrong type method on a key is a no-op that returns the type's zero value.

| Method | Returns | Description |
|-----|---|-------------|
| `body:readBool("on_floor")` | `boolean` | Evaluates if the body is resting on a surface. |
| `body:readBool("on_wall")` | `boolean` | Evaluates if the body is intersecting a wall normal. |
| `body:readBool("on_ceiling")`| `boolean` | Evaluates if the body is intersecting a ceiling normal. |
| `body:readBool("just_left_floor")` | `boolean` | Evaluates if the body departed the floor plane this frame. |
| `body:readBool("just_landed")` | `boolean` | Evaluates if the body intersected the floor plane this frame. |
| `body:readFloat(key)` | `number` | Reads a float-typed kinematic property (see Kinematic properties below). |
| `body:writeFloat(key, value)` |  | Writes a float-typed kinematic property. |
| `body:writeBool(key, value)` |  | Writes a boolean-typed kinematic property (e.g. `jump_requested`). |

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
| `body:writeBool("jump_requested", true)` | Queues a jump evaluation for the current physics substep. |

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
---

## Talking to the server

Client scripts cannot mutate authoritative state directly: there is no `api.set` against the server scene tree from the client side, and the client does not run the server's lifecycle hooks. Two distinct bridges connect the two sides.

### `playerstate` (lightweight, broadcast)

For small, transient values that should also be visible to other players' clients (animation flags, chat-typing indicators, locally-driven visual states), call `playerstate:set(key, value)` from a client script. The server stores the value, broadcasts it as `PlayerClientState` to every connected client, and other client scripts observe it via `_on_client_state(playerUuid, key, value)`. Server scripts can also read the latest value through `api:player()`. This is one-way (client to server to other clients) and string-typed.

### `ScriptMessage` (request/response with the server)

For "the player clicked a button, run server logic" or any custom client-to-server protocol, use the script messaging system documented in [Networking](12_Networking.md). A client script sends a topic-tagged payload via `api:msg():send_to_server(topic, payload)`; the matching server script receives it through `_on_message(api, payload)` (filtered by node ownership). The server can reply by calling `api:msg():send_to_player(playerUuid, topic, payload)`.

A typical "player pressed a button" flow:

1. The button is part of a server scene's UI; it has a server script that connects the `pressed` signal.
2. When the player clicks, the server's `_on_pressed` handler runs authoritatively and calls `api:msg():broadcast(...)` if it needs to tell every client about the result.
3. If you need *predictive* feedback while the server processes, the client script can play a local animation or sound on the same input event before the server confirms.

For the full protocol, payload encoding, and ownership filter behaviour, see [Networking](12_Networking.md).

---

## camera (`CameraApi`)

Drives the local 3D camera. Calls take effect on the next render frame and replace the engine's default camera placement until cleared. This is the right place to author cinematics, custom over-the-shoulder views, look-at targets, and FOV ramps.

| Method | Description |
|---|---|
| `camera:setPos(x, y, z)` | Move the camera to an absolute world position. |
| `camera:setYaw(deg)` / `setPitch(deg)` / `setRoll(deg)` | Override the camera's orientation in degrees. |
| `camera:getYaw()` / `getPitch()` / `getRoll()` | Read the current orientation. |
| `camera:setFov(deg)` / `getFov()` | Override or read the field of view in degrees. |
| `camera:captureMouse(enabled)` | Lock/unlock the OS cursor for camera-driving inputs. |
| `camera:getMouseDelta()` | Returns `[dx, dy]` mouse delta since the last frame, in pixels. Useful for custom orbit controllers. |
| `camera:setPlayerYaw(deg)` | Steer the player body's facing yaw (server-replicated). |
| `camera:setLookTarget(x, y, z, strength, maxAngleDeg)` | Smoothly bias the camera toward a world point. `strength` is a 0-1 blend, `maxAngleDeg` caps how far it can deviate from the player's natural facing. |
| `camera:setLookTargetHard(x, y, z)` | Snap the camera straight at a world point with no smoothing. |
| `camera:clearLookTarget()` | Drop any active look-at override. |

---

## msg (`MessagingApi`)

Sends and receives `ScriptMessage` payloads between client and server scripts on the same node. See [Networking](12_Networking.md) for the protocol-level details and ownership filter rules.

| Method | Description |
|---|---|
| `msg:onMessage(topic, handler)` | Register a callback for a topic. The handler receives the decoded payload. |
| `msg:clearHandler(topic)` | Remove a registered handler. |
| `msg:encode(value)` | Encode a Lua/JS value to the wire format (`byte[]`). |
| `msg:decode(payload)` | Decode a wire payload back to a value. |
| `msg:send(topic, payload, reliable)` | Send to the server (and through it to other clients) on `topic`. `reliable=true` uses the events lane; `false` uses the input lane for low-latency drop-tolerant traffic. |
| `msg:sendToServer(topic, payloadBytes, reliable)` | Send raw bytes (already encoded) to the server. |

---

## playmode (`PlayModeApi`)

Queries the engine's play-mode state, used by client scripts that drive the loading overlay or wait for the server to be ready before starting their own logic.

| Method | Description |
|---|---|
| `playmode:isReady()` | True once the server has finished its initial scene snapshot and the client is fully connected. |
| `playmode:onReady(callback)` | Run `callback` either immediately (if already ready) or as soon as the engine reaches the ready state. |
| `playmode:currentStatus()` | Returns the current loading-overlay status string, e.g. `"Waiting for an open slot"` from the matchmaker, or empty when no status is queued. |

---

## anim first-person controls

`AnimApi` exposes a dedicated set of methods for configuring the local viewmodel when authoring a first-person experience. Use these to hide vanilla arms, swap to a custom viewmodel, or selectively show armor/items.

| Method | Description |
|---|---|
| `anim:setFirstPersonMode(mode)` | Switch the active first-person mode. Valid modes are tied to the controller; `"vanilla"`, `"custom"`, and `"hidden"` are typical. Returns `true` if accepted. |
| `anim:getFirstPersonMode()` | Returns the currently active mode name. |
| `anim:configureFirstPerson(showRightArm, showLeftArm, showRightItem, showLeftItem, showArmor)` | One-shot configuration setting all five booleans at once. |
| `anim:setFirstPersonArms(showRightArm, showLeftArm)` | Toggle just the arms. |
| `anim:setFirstPersonItems(showRightItem, showLeftItem)` | Toggle held-item rendering on each side. |
| `anim:setFirstPersonArmor(showArmor)` | Toggle armor rendering on the player's first-person view. |

A typical hidden-arms setup for a custom viewmodel:

```lua
function script.onReady()
    anim:setFirstPersonMode("custom")
    anim:configureFirstPerson(false, false, false, false, false)
end
```
