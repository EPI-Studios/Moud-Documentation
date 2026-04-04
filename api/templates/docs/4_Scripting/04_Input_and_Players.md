# Input and Players API

These methods let you read player input and query/control player state.

## Raw Input

### `api.input()` → InputEvent | null

Returns the current player's input state for this tick, or `null` if no input is available.

````tabs
--- tab: JavaScript
```js
_physics_process(api, dt) {
  var inp = api.input();
  if (!inp) return;

  var speed = 5;
  var x = api.getNumber("x", 0) + inp.moveX() * speed * dt;
  var z = api.getNumber("z", 0) + inp.moveZ() * speed * dt;
  api.setNumber("x", x);
  api.setNumber("z", z);

  if (inp.jump()) {
    api.log("Jumping!");
  }
}
```

--- tab: Luau
```lua
function script:_physics_process(api, dt)
    local inp = api.input()
    if not inp then return end

    local speed = 5
    api.setNumber("x", api.getNumber("x", 0) + inp.moveX() * speed * dt)
    api.setNumber("z", api.getNumber("z", 0) + inp.moveZ() * speed * dt)
end
```
````

### InputEvent Methods

| Method | Returns | Description |
|---|---|---|
| `playerUuid()` | string | UUID of the player |
| `clientTick()` | long | Client-side tick number |
| `moveX()` | float | Left-right movement axis (-1 to 1) |
| `moveZ()` | float | Forward-back movement axis (-1 to 1) |
| `yawDeg()` | float | Horizontal look direction in degrees |
| `pitchDeg()` | float | Vertical look direction in degrees |
| `jump()` | boolean | Jump key is held |
| `sprint()` | boolean | Sprint key is held |

## Action-Based Input

### `api.getInput()` → ScriptInputApi

Returns a higher-level input API with action mapping, edge detection, and vector helpers.

````tabs
--- tab: JavaScript
```js
_physics_process(api, dt) {
  var input = api.getInput();

  // Is the action currently held?
  if (input.is_action_pressed("jump")) {
    api.log("Holding jump");
  }

  // Was it just pressed this tick?
  if (input.is_action_just_pressed("sprint")) {
    api.log("Started sprinting");
  }

  // Was it just released this tick?
  if (input.is_action_just_released("sprint")) {
    api.log("Stopped sprinting");
  }

  // Analog strength (0 to 1)
  var strength = input.get_action_strength("sprint");

  // Look angles
  var yaw = input.get_yaw();
  var pitch = input.get_pitch();

  // Single axis from two actions (-1 to 1)
  var horizontal = input.get_axis("move_left", "move_right");

  // 2D movement vector from four actions
  var move = input.get_vector("move_left", "move_right", "move_forward", "move_back");
  api.setNumber("x", api.getNumber("x", 0) + move.x * 5 * dt);
  api.setNumber("z", api.getNumber("z", 0) + move.y * 5 * dt);
}
```

--- tab: Luau
```lua
function script:_physics_process(api, dt)
    local input = api.getInput()

    if input.is_action_just_pressed("jump") then
        api.log("Jump!")
    end

    local move = input.get_vector("move_left", "move_right", "move_forward", "move_back")
    api.setNumber("x", api.getNumber("x", 0) + move.x * 5 * dt)
    api.setNumber("z", api.getNumber("z", 0) + move.y * 5 * dt)
end
```
````

### ScriptInputApi Methods

| Method | Returns | Description |
|---|---|---|
| `is_action_pressed(action)` | boolean | Action is currently held |
| `is_action_just_pressed(action)` | boolean | Action was pressed this tick |
| `is_action_just_released(action)` | boolean | Action was released this tick |
| `get_action_strength(action)` | float | Analog strength (0–1) |
| `get_yaw()` | float | Horizontal look angle |
| `get_pitch()` | float | Vertical look angle |
| `get_axis(negative, positive)` | float | Combined axis value (-1 to 1) |
| `get_vector(negX, posX, negY, posY)` | Vec2 | 2D input vector (`.x`, `.y`) |

## Player Queries

### `api.playerX()` / `api.playerY()` / `api.playerZ()` → double

Returns the current player's position.

```js
var px = api.playerX();
var py = api.playerY();
var pz = api.playerZ();
```

### `api.playerYaw()` → double

Returns the current player's yaw rotation in degrees.

### `api.getPlayers()` → PlayerInfo[]

Returns an array of all connected players.

````tabs
--- tab: JavaScript
```js
var players = api.getPlayers();
for (var i = 0; i < players.length; i++) {
  var p = players[i];
  api.log(p.name() + " at " + p.x() + ", " + p.y() + ", " + p.z());
}
```

--- tab: Luau
```lua
local players = api.getPlayers()
for _, p in ipairs(players) do
    api.log(p.name() .. " at " .. p.x() .. ", " .. p.y() .. ", " .. p.z())
end
```
````

### PlayerInfo Methods

| Method | Returns | Description |
|---|---|---|
| `uuid()` | string | Player UUID |
| `name()` | string | Display name |
| `x()`, `y()`, `z()` | double | World position |
| `ry()` | double | Yaw rotation in degrees |

## Player Control

### `api.teleportPlayer(uuid, x, y, z)` → boolean

Teleports a player to a position. Returns `true` on success.

```js
api.teleportPlayer(playerUuid, 0, 10, 0);
```

### `api.teleportPlayer(uuid, x, y, z, yawDeg, pitchDeg)` → boolean

Teleports a player with a specific look direction.

```js
api.teleportPlayer(playerUuid, 0, 10, 0, 90, 0);
```
