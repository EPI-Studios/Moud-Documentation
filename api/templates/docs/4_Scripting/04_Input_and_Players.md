# Input and Players

These APIs let you read player input and query or control player state.

## Reading Input in `@process`

### `this.getInput()` → `ScriptInputApi | null`

Call `this.getInput()` inside a `@process` method to receive the current player's input state for this tick. Returns `null` if no input is available (e.g. the node has no associated player).

````tabs
--- tab: TypeScript
```typescript
import { Node3D, process } from "moud";

export default class PlayerController extends Node3D {
  @process()
  tick(dt: number) {
    const inp = this.getInput();
    if (!inp) return;

    // Check a single action
    if (inp.isActionJustPressed(InputAction.Jump)) {
      console.log("Jump!");
    }
  }
}
```

--- tab: JavaScript
```js
({
  _physics_process(api, dt) {
    var inp = api.getInput();
    if (!inp) return;

    if (inp.is_action_just_pressed("jump")) {
      api.log("Jump!");
    }
  }
})
```

--- tab: Luau
```lua
function script:_physics_process(api, dt)
    local inp = api.getInput()
    if not inp then return end

    if inp.is_action_just_pressed("jump") then
        api.log("Jump!")
    end
end
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class PlayerController extends NodeScript {
    @Override public void onPhysicsProcess(double dt) {
        var inp = core.getInput();
        if (inp == null) return;

        if (inp.is_action_just_pressed("jump")) {
            log("Jump!");
        }
    }
}
```
````

## `InputAction` Enum

Import `InputAction` from `moud/input` to reference built-in actions with full type safety.

````tabs
--- tab: TypeScript
```typescript
import { InputAction } from "moud/input";

// Available actions:
InputAction.Jump
InputAction.Sprint
InputAction.MoveLeft
InputAction.MoveRight
InputAction.MoveForward
InputAction.MoveBack
```

--- tab: JavaScript
```js
// JavaScript uses string action names directly:
inp.is_action_pressed("jump")
inp.is_action_pressed("sprint")
inp.get_axis("move_left", "move_right")
```

--- tab: Luau
```lua
-- Luau uses string action names directly:
inp.is_action_pressed("jump")
inp.get_axis("move_left", "move_right")
```

--- tab: Java
```java
// Java uses string action names directly:
inp.is_action_pressed("jump");
inp.get_axis("move_left", "move_right");
```
````

## `ScriptInputApi` Methods

| Method | Returns | Description |
|---|---|---|
| `isActionPressed(action)` | `boolean` | Action is currently held |
| `isActionJustPressed(action)` | `boolean` | Action was pressed this tick |
| `isActionJustReleased(action)` | `boolean` | Action was released this tick |
| `getAxis(negative, positive)` | `number` | Combined axis value (−1 to 1) |
| `getVector({ negX, posX, negY, posY })` | `{ x, y }` | Normalized 2D input vector |
| `getYaw()` | `number` | Horizontal look angle in degrees |
| `getPitch()` | `number` | Vertical look angle in degrees |

## `@input()` Decorator - Per-Packet Input

For low-latency handling where you need to react to each individual input packet (rather than once per process tick), use the `@input()` decorator.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, input } from "moud";
import { InputEvent } from "moud/input";

export default class InputLogger extends Node3D {
  @input()
  handleInput(event: InputEvent) {
    console.log(`Player ${event.playerUuid} yaw: ${event.yawDeg}`);
  }
}
```

--- tab: JavaScript
```js
({
  _input(api, event) {
    api.log("Player: " + event.playerUuid() + " yaw: " + event.yawDeg());
  }
})
```

--- tab: Luau
```lua
function script:_input(api, event)
    api.log("Player: " .. event.playerUuid() .. " yaw: " .. event.yawDeg())
end
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;
import com.moud.server.minestom.scripting.player.InputEvent;

public final class InputLogger extends NodeScript {
    @Override public void onInput(InputEvent event) {
        log("Player: " + event.playerUuid() + " yaw: " + event.yawDeg());
    }
}
```
````

### `InputEvent` Fields (TypeScript)

| Field | Type | Description |
|---|---|---|
| `playerUuid` | `string` | UUID of the player sending this packet |
| `clientTick` | `number` | Client-side tick number |
| `yawDeg` | `number` | Horizontal look direction in degrees |
| `pitchDeg` | `number` | Vertical look direction in degrees |

## Player Position

Node position is available directly via `this.position` (or `this.x`, `this.y`, `this.z` on `Node3D` subclasses).

````tabs
--- tab: TypeScript
```typescript
import { Node3D, process } from "moud";

export default class PositionTracker extends Node3D {
  @process()
  tick(dt: number) {
    const { x, y, z } = this.position;
    console.log(`Node is at ${x}, ${y}, ${z}`);
  }
}
```

--- tab: JavaScript
```js
({
  _physics_process(api, dt) {
    var px = api.playerX();
    var py = api.playerY();
    var pz = api.playerZ();
    api.log("At: " + px + ", " + py + ", " + pz);
  }
})
```

--- tab: Luau
```lua
function script:_physics_process(api, dt)
    local px = api.playerX()
    local py = api.playerY()
    local pz = api.playerZ()
    api.log("At: " .. px .. ", " .. py .. ", " .. pz)
end
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class PositionTracker extends NodeScript {
    @Override public void onPhysicsProcess(double dt) {
        double px = core.playerX();
        double py = core.playerY();
        double pz = core.playerZ();
        log("At: " + px + ", " + py + ", " + pz);
    }
}
```
````

## Querying All Players

### `getPlayers()` - from `moud/players`

Returns an array of `PlayerInfo` objects describing every connected player.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, ready } from "moud";
import { getPlayers } from "moud/players";

export default class Lobby extends Node3D {
  @ready()
  init() {
    const players = getPlayers();
    for (const p of players) {
      console.log(`${p.name} is at ${p.x}, ${p.y}, ${p.z} (uuid: ${p.uuid})`);
    }
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    var players = api.getPlayers();
    for (var i = 0; i < players.length; i++) {
      var p = players[i];
      api.log(p.name() + " at " + p.x() + ", " + p.y() + ", " + p.z());
    }
  }
})
```

--- tab: Luau
```lua
function script:_ready(api)
    local players = api.getPlayers()
    for _, p in ipairs(players) do
        api.log(p.name() .. " at " .. p.x() .. ", " .. p.y() .. ", " .. p.z())
    end
end
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class Lobby extends NodeScript {
    @Override public void onReady() {
        var list = core.getPlayers();
        for (var p : list) {
            log(p.name() + " at " + p.x() + ", " + p.y() + ", " + p.z());
        }
    }
}
```
````

### `PlayerInfo` Fields (TypeScript)

| Field | Type | Description |
|---|---|---|
| `uuid` | `string` | Player UUID |
| `name` | `string` | Display name |
| `x`, `y`, `z` | `number` | World position |
| `yaw` | `number` | Yaw rotation in degrees |

## Teleporting Players

### `teleportPlayer({ uuid, position, yaw?, pitch? })` - from `moud/players`

Teleports a player to a world position. Optionally sets their look direction.

> **Note on velocity APIs.** `api:player():playerSetVelocity(uuid, vx, vy, vz)` and `playerAddVelocity` are exposed on `PlayerApi`, but the client motion controller **ignores server-replicated velocity when the player is locally controlling a `CharacterBody3D`** (`ClientPlayerMotionController.isClientCharacterBodyActive()` returns true). In that mode, write velocity to the bound `CharacterBody3D` node from the server (or call `api:physics():setCharacterVelocity(nodeId, ...)`) instead , see [Physics API → Character bodies](06_Physics.md#character-bodies). For free-camera or spectator players who are not bound to a `CharacterBody3D`, `playerSetVelocity` works normally.

````tabs
--- tab: TypeScript
```typescript
import { getPlayers, teleportPlayer } from "moud/players";

// Teleport to a position
teleportPlayer({ uuid: playerUuid, position: { x: 0, y: 10, z: 0 } });

// Teleport with explicit look direction
teleportPlayer({
  uuid: playerUuid,
  position: { x: 0, y: 10, z: 0 },
  yaw: 90,
  pitch: 0,
});
```

--- tab: JavaScript
```js
// Position only
api.teleportPlayer(playerUuid, 0, 10, 0);

// With yaw and pitch
api.teleportPlayer(playerUuid, 0, 10, 0, 90, 0);
```

--- tab: Luau
```lua
api.teleportPlayer(playerUuid, 0, 10, 0)
api.teleportPlayer(playerUuid, 0, 10, 0, 90, 0)
```

--- tab: Java
```java
core.teleportPlayer(playerUuid, 0, 10, 0);
core.teleportPlayer(playerUuid, 0, 10, 0, 90, 0);
```
````

## Complete Example: Player Controller

A character controller that reads movement, handles jumping, and teleports players who fall below the world.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, process } from "moud";
import { InputAction } from "moud/input";
import { getPlayers, teleportPlayer } from "moud/players";

export default class PlayerController extends Node3D {
  private speed = 8;
  private spawnY = 64;

  @process()
  tick(dt: number) {
    const inp = this.getInput();
    if (!inp) return;

    // 2D movement vector from four directional actions
    const move = inp.getVector({
      negX: InputAction.MoveLeft,
      posX: InputAction.MoveRight,
      negY: InputAction.MoveForward,
      posY: InputAction.MoveBack,
    });

    // Single-axis example
    const strafe = inp.getAxis(InputAction.MoveLeft, InputAction.MoveRight);

    // Camera-relative direction
    const yaw = inp.getYaw();

    // Apply movement (simplified - no physics)
    this.x += move.x * this.speed * dt;
    this.z += move.y * this.speed * dt;

    if (inp.isActionJustPressed(InputAction.Jump)) {
      console.log("Player jumped!");
    }

    // Respawn players who fall off the world
    if (this.y < -20) {
      const players = getPlayers();
      for (const p of players) {
        if (p.y < -20) {
          teleportPlayer({
            uuid: p.uuid,
            position: { x: 0, y: this.spawnY, z: 0 },
            yaw: 0,
            pitch: 0,
          });
        }
      }
    }
  }
}
```

--- tab: JavaScript
```js
({
  speed: 8,

  _physics_process(api, dt) {
    var inp = api.getInput();
    if (!inp) return;

    var move = inp.get_vector("move_left", "move_right", "move_forward", "move_back");
    api.setNumber("x", api.getNumber("x", 0) + move.x * this.speed * dt);
    api.setNumber("z", api.getNumber("z", 0) + move.y * this.speed * dt);

    if (inp.is_action_just_pressed("jump")) {
      api.log("Jump!");
    }

    if (api.playerY() < -20) {
      api.teleportPlayer(inp.playerUuid(), 0, 64, 0);
    }
  }
})
```

--- tab: Luau
```lua
local script = { speed = 8 }

function script:_physics_process(api, dt)
    local inp = api.getInput()
    if not inp then return end

    local move = inp.get_vector("move_left", "move_right", "move_forward", "move_back")
    api.setNumber("x", api.getNumber("x", 0) + move.x * self.speed * dt)
    api.setNumber("z", api.getNumber("z", 0) + move.y * self.speed * dt)

    if inp.is_action_just_pressed("jump") then
        api.log("Jump!")
    end

    if api.playerY() < -20 then
        api.teleportPlayer(inp.playerUuid(), 0, 64, 0)
    end
end

return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class PlayerController extends NodeScript {
    double speed = 8;

    @Override public void onPhysicsProcess(double dt) {
        var inp = core.getInput();
        if (inp == null) return;

        var move = inp.get_vector("move_left", "move_right", "move_forward", "move_back");
        core.setNumber("x", core.getNumber("x", 0) + move.x * speed * dt);
        core.setNumber("z", core.getNumber("z", 0) + move.y * speed * dt);

        if (inp.is_action_just_pressed("jump")) {
            log("Jump!");
        }

        if (core.playerY() < -20) {
            core.teleportPlayer(inp.playerUuid(), 0, 64, 0);
        }
    }
}
```
````
