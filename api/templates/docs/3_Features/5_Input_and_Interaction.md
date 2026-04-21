# Input and Interaction

Players interact with your game through movement, look direction, and action buttons. Because Moud is server-authoritative, all input goes to the server first and your scripts decide what to do with it. This page shows you every way to read and respond to player input.

## Input Overview

Player input arrives on the server as a packet every tick containing:

| Field | Type | Description |
|---|---|---|
| `moveX` | float | Left-right movement (-1 to 1) |
| `moveZ` | float | Forward-back movement (-1 to 1) |
| `yawDeg` | float | Look direction (horizontal) |
| `pitchDeg` | float | Look direction (vertical) |
| `jump` | bool | Jump key held |
| `sprint` | bool | Sprint key held |

## Reading Raw Input

### The `_input` Callback

The simplest way to handle input is the `_input` lifecycle callback:

````tabs
--- tab: JavaScript
```js
({
  _input(api, event) {
    api.log("Move: " + event.moveX() + ", " + event.moveZ());
    api.log("Look: yaw=" + event.yawDeg() + " pitch=" + event.pitchDeg());
    if (event.jump()) {
      api.log("Jumping!");
    }
  }
})
```

--- tab: Luau
```lua
local script = {}

function script:_input(api, event)
    api.log("Move: " .. event.moveX() .. ", " .. event.moveZ())
    if event.jump() then
        api.log("Jumping!")
    end
end

return script
```
````

### The `api.input()` Method

You can also read input from within `_process` or `_physics_process`:

````tabs
--- tab: JavaScript
```js
_physics_process(api, dt) {
  var inp = api.input();
  if (inp) {
    var dx = inp.moveX() * this.speed * dt;
    var dz = inp.moveZ() * this.speed * dt;
    api.setNumber("x", api.getNumber("x", 0) + dx);
    api.setNumber("z", api.getNumber("z", 0) + dz);
  }
}
```

--- tab: Luau
```lua
function script:_physics_process(api, dt)
    local inp = api.input()
    if inp then
        local dx = inp.moveX() * self.speed * dt
        local dz = inp.moveZ() * self.speed * dt
        api.setNumber("x", api.getNumber("x", 0) + dx)
        api.setNumber("z", api.getNumber("z", 0) + dz)
    end
end
```
````

### InputEvent Fields

| Method | Returns | Description |
|---|---|---|
| `playerUuid()` | string | UUID of the player who sent this input |
| `clientTick()` | long | Client-side tick number |
| `moveX()` | float | Left-right axis (-1 to 1) |
| `moveZ()` | float | Forward-back axis (-1 to 1) |
| `yawDeg()` | float | Horizontal look angle in degrees |
| `pitchDeg()` | float | Vertical look angle in degrees |
| `jump()` | bool | Jump key held |
| `sprint()` | bool | Sprint key held |

## Action-Based Input (ScriptInputApi)

For higher-level input handling, use `api.getInput()` which returns a `ScriptInputApi`:

````tabs
--- tab: JavaScript
```js
_physics_process(api, dt) {
  var input = api.getInput();

  // Check if an action is currently held
  if (input.is_action_pressed("jump")) {
    api.log("Jump held");
  }

  // Check if an action was just pressed this frame
  if (input.is_action_just_pressed("sprint")) {
    api.log("Started sprinting");
  }

  // Check if an action was just released
  if (input.is_action_just_released("sprint")) {
    api.log("Stopped sprinting");
  }

  // Get analog strength (0 to 1)
  var sprintStrength = input.get_action_strength("sprint");

  // Get look direction
  var yaw = input.get_yaw();
  var pitch = input.get_pitch();

  // Get a single axis from two actions
  var horizontal = input.get_axis("move_left", "move_right");

  // Get a 2D movement vector from four actions
  var move = input.get_vector("move_left", "move_right", "move_forward", "move_back");
  // move.x = horizontal, move.y = vertical
}
```

--- tab: Luau
```lua
function script:_physics_process(api, dt)
    local input = api.getInput()

    if input.is_action_pressed("jump") then
        api.log("Jump held")
    end

    if input.is_action_just_pressed("sprint") then
        api.log("Started sprinting")
    end

    local horizontal = input.get_axis("move_left", "move_right")
    local move = input.get_vector("move_left", "move_right", "move_forward", "move_back")
end
```
````

### ScriptInputApi Methods

| Method | Returns | Description |
|---|---|---|
| `is_action_pressed(action)` | bool | Is the action currently held? |
| `is_action_just_pressed(action)` | bool | Was the action pressed this tick? |
| `is_action_just_released(action)` | bool | Was the action released this tick? |
| `get_action_strength(action)` | float | Analog value (0–1) |
| `get_yaw()` | float | Player's horizontal look angle |
| `get_pitch()` | float | Player's vertical look angle |
| `get_axis(negative, positive)` | float | Combined axis from two actions (-1 to 1) |
| `get_vector(negX, posX, negY, posY)` | Vec2 | 2D vector from four actions (`.x`, `.y`) |

## Area-Based Interaction

Use `Area3D` nodes to detect when players enter or leave a zone:

````tabs
--- tab: JavaScript
```js
({
  _enter_tree(api) {
    this.api = api;
    api.connect(api.id(), "area_entered", api.id(), "_on_enter");
    api.connect(api.id(), "area_exited", api.id(), "_on_exit");
  },

  _on_enter(playerUuid) {
    this.api.log("Player entered zone: " + playerUuid);
  },

  _on_exit(playerUuid) {
    this.api.log("Player left zone: " + playerUuid);
  }
})
```

--- tab: Luau
```lua
local script = {}

function script:_enter_tree(api)
    self.api = api
    api.connect(api.id(), "area_entered", api.id(), "_on_enter")
    api.connect(api.id(), "area_exited", api.id(), "_on_exit")
end

function script:_on_enter(playerUuid)
    self.api:log("Player entered zone: " .. playerUuid)
end

function script:_on_exit(playerUuid)
    self.api:log("Player left zone: " .. playerUuid)
end

return script
```
````

## Raycast-Based Interaction

Use `api.raycast()` for precise pointing interaction - checking what a player is looking at:

````tabs
--- tab: JavaScript
```js
_physics_process(api, dt) {
  var px = api.playerX();
  var py = api.playerY() + 1.6;  // eye height
  var pz = api.playerZ();

  // cast a ray from the player's eye in their look direction
  var yaw = api.playerYaw() * Math.PI / 180;
  var dx = -Math.sin(yaw);
  var dz = Math.cos(yaw);

  var hit = api.raycast(px, py, pz, dx, 0, dz, 50);
  if (hit) {
    api.log("Looking at body " + hit.bodyId() + " at distance " + hit.distance());
    api.log("Hit position: " + hit.x() + ", " + hit.y() + ", " + hit.z());
    api.log("Surface normal: " + hit.nx() + ", " + hit.ny() + ", " + hit.nz());
  }
}
```

--- tab: Luau
```lua
function script:_physics_process(api, dt)
    local px = api.playerX()
    local py = api.playerY() + 1.6
    local pz = api.playerZ()

    local yaw = api.playerYaw() * math.pi / 180
    local dx = -math.sin(yaw)
    local dz = math.cos(yaw)

    local hit = api.raycast(px, py, pz, dx, 0, dz, 50)
    if hit then
        api.log("Hit body " .. hit.bodyId() .. " at " .. hit.distance())
    end
end
```
````

### PhysicsHit Fields

| Method | Returns | Description |
|---|---|---|
| `x()`, `y()`, `z()` | double | World position of the hit |
| `nx()`, `ny()`, `nz()` | double | Surface normal at the hit |
| `distance()` | double | Distance from ray origin |
| `bodyId()` | long | Node ID of the body that was hit |

## Player Queries

| Method | Returns | Description |
|---|---|---|
| `api.playerX()` | double | Current player's X position |
| `api.playerY()` | double | Current player's Y position |
| `api.playerZ()` | double | Current player's Z position |
| `api.playerYaw()` | double | Current player's yaw in degrees |
| `api.getPlayers()` | PlayerInfo[] | Array of all connected players |
| `api.teleportPlayer(uuid, x, y, z)` | bool | Teleport a player |
| `api.teleportPlayer(uuid, x, y, z, yaw, pitch)` | bool | Teleport with rotation |

### PlayerInfo Fields

| Method | Returns | Description |
|---|---|---|
| `uuid()` | string | Player UUID |
| `name()` | string | Player display name |
| `x()`, `y()`, `z()` | double | Position |
| `ry()` | double | Yaw rotation |

## Input Actions (InputMap)

Moud exposes a Godot-style action abstraction on top of raw keys. Actions have string names and can be bound to one or more keyboard keys, mouse buttons, or gamepad buttons. Bindings are loaded from the defaults shipped with the engine, overlaid with the player's local bindings file (`moud-bindings.json` in the Fabric config dir), and can be rebound at runtime.

Default actions: `forward`, `back`, `left`, `right`, `jump`, `sprint`, `sneak`, `attack`, `use`, `reload`, `interact`, `menu`.

### Querying from a client script

```lua
function script:onFrame(dt)
    if input:isDown("forward") then
        -- move forward
    end
    if input:isPressed("jump") then
        -- fire once on press
    end
    if input:isReleased("attack") then
        -- fire once on release
    end
end
```

### Listing and rebinding

```lua
local actions = input:actions()
for _, name in ipairs(actions) do
    local bindings = input:getBindings(name)
    print(name, table.concat(bindings, ", "))
end

input:setBinding("jump", "key:32")              -- space
input:addBinding("attack", "mouse:0")           -- also left-click
input:addBinding("jump", "gamepad:0")           -- also gamepad A
input:resetBindings("jump")                      -- restore default
input:resetAllBindings()                         -- restore all defaults
```

### Binding token format

`type:code` where `type` is `key`, `mouse`, or `gamepad`:

- `key:<glfw_keycode>` — e.g. `key:32` for Space, `key:69` for E
- `mouse:<button>` — 0 = left, 1 = right, 2 = middle
- `gamepad:<button>` — GLFW gamepad button index (0 = A/Cross, 1 = B/Circle, ...)

Bindings persist to `moud-bindings.json` automatically on every call to `setBinding`, `addBinding`, `resetBindings`, or `resetAllBindings`.
